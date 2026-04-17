"""Strip analyzer — orchestrates the full CV pipeline."""

import logging
from dataclasses import dataclass, field

import cv2
import numpy as np
import yaml

logger = logging.getLogger(__name__)

from app.core.exceptions import ValidationError
from app.cv.color_matching import match_to_gradient, match_to_multi_gradient
from app.cv.preprocessing import (
    decode_image,
    resize_image,
    validate_image_bytes,
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



# Radius (fraction of image dimension) around each sample point for median.
SAMPLE_RADIUS = 0.025


def _sample_point_rgb(bgr_image: np.ndarray, x_frac: float, y_frac: float) -> list[float]:
    """Sample a small area around a point and return median RGB.

    (x_frac, y_frac) are fractions of image width/height.
    Samples a square of side 2*SAMPLE_RADIUS centered on the point.
    """
    h, w = bgr_image.shape[:2]
    cx, cy = int(x_frac * w), int(y_frac * h)
    r = max(int(SAMPLE_RADIUS * min(w, h)), 2)

    y1 = max(0, cy - r)
    y2 = min(h, cy + r)
    x1 = max(0, cx - r)
    x2 = min(w, cx + r)

    roi = bgr_image[y1:y2, x1:x2]
    if roi.size == 0:
        raise ValidationError("Could not sample point — out of bounds")

    # BGR → RGB
    return [
        float(np.median(roi[:, :, 2])),
        float(np.median(roi[:, :, 1])),
        float(np.median(roi[:, :, 0])),
    ]


def _sample_points_rgb(bgr_image: np.ndarray, points: list[list[float]]) -> list[list[float]]:
    """Sample multiple points, returning a list of RGB values."""
    return [_sample_point_rgb(bgr_image, p[0], p[1]) for p in points]


def _compute_white_balance(
    bgr_image: np.ndarray,
    white_points: list[list[float]],
) -> tuple[float, float, float]:
    """Sample the strip's white backing and return per-channel scale factors.

    Takes the median RGB across the provided white-reference points and
    returns scale factors ``(sr, sg, sb)`` that would remap that median to
    (255, 255, 255). Applying these factors to all subsequent samples cancels
    out the ambient lighting's color cast, so camera-captured colors can be
    fairly compared to the printed-chart reference values in the calibration.
    """
    whites = [_sample_point_rgb(bgr_image, p[0], p[1]) for p in white_points]
    # Per-channel median across samples — robust to one bad point.
    med_r = float(np.median([w[0] for w in whites]))
    med_g = float(np.median([w[1] for w in whites]))
    med_b = float(np.median([w[2] for w in whites]))
    # Guard against a sensor that recorded near-black for any channel.
    sr = 255.0 / med_r if med_r > 1 else 1.0
    sg = 255.0 / med_g if med_g > 1 else 1.0
    sb = 255.0 / med_b if med_b > 1 else 1.0
    return sr, sg, sb


def _apply_white_balance(
    rgb: list[float],
    scales: tuple[float, float, float],
) -> list[float]:
    """Scale each channel by the matching factor and clamp to [0, 255]."""
    sr, sg, sb = scales
    return [
        min(255.0, max(0.0, rgb[0] * sr)),
        min(255.0, max(0.0, rgb[1] * sg)),
        min(255.0, max(0.0, rgb[2] * sb)),
    ]


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
    2. Sample each pad from fixed normalized regions in the full image frame
    3. Match against calibration gradient
    4. Return results with confidence scores

    Pad regions are defined in the calibration YAML relative to the full image,
    so contour detection and perspective correction are not used.
    """
    # Step 1: Preprocessing
    validate_image_bytes(image_data)
    image = decode_image(image_data)
    image = resize_image(image)
    logger.info("CV image after resize: %dx%d", image.shape[1], image.shape[0])

    # Save debug image so we can inspect what the pipeline receives
    debug_path = "/tmp/babybio_debug_input.jpg"
    cv2.imwrite(debug_path, image)
    logger.info("CV debug image saved to %s", debug_path)

    # Step 2-3: Load calibration, sample pads, match colors
    calibration = _load_calibration(calibration_path)
    pad_geometry = calibration["pad_geometry"]
    biomarkers_config = calibration["biomarkers"]
    white_points = calibration.get("white_reference_points", [])

    # Compute white-balance scales once per image (optional — absent in older
    # calibrations). Samples are later multiplied by these to cancel lighting.
    wb_scales: tuple[float, float, float] | None = None
    if white_points:
        wb_scales = _compute_white_balance(image, white_points)
        logger.info(
            "CV white balance scales (R,G,B): (%.3f, %.3f, %.3f)",
            wb_scales[0], wb_scales[1], wb_scales[2],
        )

    # Draw sample points on a debug copy
    debug_img = image.copy()
    ih, iw = image.shape[:2]
    r_px = max(int(SAMPLE_RADIUS * min(iw, ih)), 2)
    for pad in pad_geometry:
        for pt in pad["sample_points"]:
            cx, cy = int(pt[0] * iw), int(pt[1] * ih)
            cv2.circle(debug_img, (cx, cy), r_px, (0, 255, 0), 2)
            cv2.putText(debug_img, pad["name"], (cx + r_px + 2, cy + 4),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.35, (0, 255, 0), 1)
    for pt in white_points:
        cx, cy = int(pt[0] * iw), int(pt[1] * ih)
        cv2.circle(debug_img, (cx, cy), r_px, (255, 255, 255), 2)
    cv2.imwrite("/tmp/babybio_debug_regions.jpg", debug_img)
    logger.info("CV debug sample-points image saved to /tmp/babybio_debug_regions.jpg")

    results: list[BiomarkerResult] = []
    total_confidence = 0.0

    for pad in pad_geometry:
        marker_name = pad["name"]
        config = biomarkers_config[marker_name]
        points = pad["sample_points"]

        is_ordinal = config.get("scale_type") == "ordinal"
        gradient = config["gradient"]

        # All current gradients use RGB references.
        raw_samples = _sample_points_rgb(image, points)
        if wb_scales is not None:
            samples = [_apply_white_balance(s, wb_scales) for s in raw_samples]
        else:
            samples = raw_samples

        logger.info(
            "CV [%s] raw RGB: %s → WB: %s",
            marker_name,
            [[round(v) for v in s] for s in raw_samples],
            [[round(v) for v in s] for s in samples],
        )

        if len(samples) > 1:
            label, numeric_value, confidence = match_to_multi_gradient(
                samples, gradient, interpolate=not is_ordinal, is_rgb=True
            )
        else:
            label, numeric_value, confidence = match_to_gradient(
                samples[0], gradient, interpolate=not is_ordinal, is_rgb=True
            )
        logger.info("CV [%s] → label=%s, value=%s, conf=%s", marker_name, label, numeric_value, confidence)

        if is_ordinal:
            normal_cat = config.get("normal_category")
            if normal_cat is not None:
                is_flagged = label != normal_cat
                category = label
                ref_range = normal_cat
            else:
                is_flagged = False
                category = label
                ref_range = "—"
            display_value = label
        else:
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
