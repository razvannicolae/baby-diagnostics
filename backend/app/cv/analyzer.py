"""Strip analyzer — orchestrates the full CV pipeline."""

from dataclasses import dataclass, field

import cv2
import numpy as np
import yaml

from app.core.exceptions import ValidationError
from app.cv.color_matching import match_to_gradient
from app.cv.preprocessing import (
    decode_image,
    resize_image,
    to_hsv,
    validate_image_bytes,
    white_balance,
)


@dataclass
class BiomarkerResult:
    marker_name: str
    value: str
    numeric_value: float
    category: str  # "normal", "low", "high"
    is_flagged: bool
    reference_range: str
    confidence: float


@dataclass
class AnalysisResult:
    status: str  # "normal", "attention_needed"
    confidence: float
    biomarkers: list[BiomarkerResult] = field(default_factory=list)


def _load_calibration(calibration_path: str) -> dict:
    """Load calibration YAML file."""
    with open(calibration_path) as f:
        return yaml.safe_load(f)


def _find_strip_contour(image: np.ndarray) -> np.ndarray | None:
    """Find the test strip contour by aspect ratio (3:1 to 5:1)."""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blurred, 50, 150)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
    edges = cv2.dilate(edges, kernel, iterations=2)

    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    best_contour = None
    best_area = 0
    img_area = image.shape[0] * image.shape[1]

    for contour in contours:
        area = cv2.contourArea(contour)
        # Strip should be a significant portion of the image
        if area < img_area * 0.05:
            continue
        rect = cv2.minAreaRect(contour)
        w, h = rect[1]
        if w == 0 or h == 0:
            continue
        aspect = max(w, h) / min(w, h)
        if 3.0 <= aspect <= 5.0 and area > best_area:
            best_contour = contour
            best_area = area

    return best_contour


def _perspective_correct(image: np.ndarray, contour: np.ndarray) -> np.ndarray:
    """Perspective-correct the strip to a rectangular image."""
    rect = cv2.minAreaRect(contour)
    box = cv2.boxPoints(rect)
    box = np.intp(box)

    # Order points: top-left, top-right, bottom-right, bottom-left
    box = _order_points(box.astype(np.float32))

    w = int(max(
        np.linalg.norm(box[0] - box[1]),
        np.linalg.norm(box[2] - box[3]),
    ))
    h = int(max(
        np.linalg.norm(box[1] - box[2]),
        np.linalg.norm(box[3] - box[0]),
    ))

    # Ensure width > height (landscape orientation)
    if h > w:
        w, h = h, w

    dst = np.array([[0, 0], [w, 0], [w, h], [0, h]], dtype=np.float32)
    matrix = cv2.getPerspectiveTransform(box, dst)
    return cv2.warpPerspective(image, matrix, (w, h))


def _order_points(pts: np.ndarray) -> np.ndarray:
    """Order 4 points as: top-left, top-right, bottom-right, bottom-left."""
    rect = np.zeros((4, 2), dtype=np.float32)
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]
    d = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(d)]
    rect[3] = pts[np.argmax(d)]
    return rect


def _sample_pad(hsv_image: np.ndarray, region: list[float]) -> list[float]:
    """Sample the center 60% of a pad region and return median HSV."""
    h, w = hsv_image.shape[:2]
    x_start = int(region[0] * w)
    y_start = int(region[1] * h)
    pad_w = int(region[2] * w)
    pad_h = int(region[3] * h)

    # Center 60%
    margin_x = int(pad_w * 0.2)
    margin_y = int(pad_h * 0.2)
    roi = hsv_image[
        y_start + margin_y : y_start + pad_h - margin_y,
        x_start + margin_x : x_start + pad_w - margin_x,
    ]

    if roi.size == 0:
        raise ValidationError("Could not sample pad region — strip too small or misaligned")

    median_h = float(np.median(roi[:, :, 0]))
    median_s = float(np.median(roi[:, :, 1]))
    median_v = float(np.median(roi[:, :, 2]))
    return [median_h, median_s, median_v]


def _categorize(value: float, normal_min: float, normal_max: float) -> tuple[str, bool]:
    """Categorize a biomarker value and determine if it should be flagged."""
    if value < normal_min:
        return "low", True
    elif value > normal_max:
        return "high", True
    return "normal", False


def analyze_strip(image_data: bytes, calibration_path: str) -> AnalysisResult:
    """Run the full CV analysis pipeline on a test strip image.

    1. Validate → decode → resize → white balance → HSV
    2. Find strip contour (3:1–5:1 aspect ratio)
    3. Perspective correct
    4. Segment 4 pads → sample center 60% → median HSV
    5. Match against calibration gradient
    6. Return results with confidence scores
    """
    # Step 1: Preprocessing
    validate_image_bytes(image_data)
    image = decode_image(image_data)
    image = resize_image(image)
    image = white_balance(image)

    # Step 2: Find strip
    contour = _find_strip_contour(image)
    if contour is None:
        raise ValidationError(
            "Could not detect a test strip in the image. "
            "Please ensure the strip is clearly visible against a contrasting background."
        )

    # Step 3: Perspective correct
    corrected = _perspective_correct(image, contour)
    hsv_image = to_hsv(corrected)

    # Step 4-5: Load calibration, sample pads, match colors
    calibration = _load_calibration(calibration_path)
    pad_geometry = calibration["pad_geometry"]
    biomarkers_config = calibration["biomarkers"]

    results: list[BiomarkerResult] = []
    total_confidence = 0.0

    for pad in pad_geometry:
        marker_name = pad["name"]
        config = biomarkers_config[marker_name]

        median_hsv = _sample_pad(hsv_image, pad["region"])
        label, numeric_value, confidence = match_to_gradient(median_hsv, config["gradient"])

        category, is_flagged = _categorize(
            numeric_value,
            config["normal_min"],
            config["normal_max"],
        )

        unit = config.get("unit", "")
        display_value = f"{numeric_value} {unit}".strip() if unit else label
        ref_range = f"{config['normal_min']}-{config['normal_max']}"
        if unit:
            ref_range += f" {unit}"

        results.append(BiomarkerResult(
            marker_name=marker_name,
            value=display_value,
            numeric_value=numeric_value,
            category=category,
            is_flagged=is_flagged,
            reference_range=ref_range,
            confidence=confidence,
        ))
        total_confidence += confidence

    # Step 6: Overall status
    any_flagged = any(r.is_flagged for r in results)
    avg_confidence = total_confidence / len(results) if results else 0.0

    return AnalysisResult(
        status="attention_needed" if any_flagged else "normal",
        confidence=round(avg_confidence, 3),
        biomarkers=results,
    )
