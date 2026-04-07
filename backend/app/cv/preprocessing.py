"""Image preprocessing for CV pipeline — validation, decoding, transforms."""

import numpy as np
import cv2

from app.core.exceptions import ValidationError

# Magic bytes for supported formats
_JPEG_MAGIC = b"\xff\xd8\xff"
_PNG_MAGIC = b"\x89PNG"

MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB


def validate_image_bytes(data: bytes) -> None:
    """Validate image magic bytes and size."""
    if len(data) > MAX_IMAGE_SIZE:
        raise ValidationError(f"Image exceeds maximum size of {MAX_IMAGE_SIZE // (1024 * 1024)}MB")
    if not (data[:3] == _JPEG_MAGIC or data[:4] == _PNG_MAGIC):
        raise ValidationError("Unsupported image format. Only JPEG and PNG are accepted")


def decode_image(data: bytes) -> np.ndarray:
    """Decode raw bytes into a BGR numpy array."""
    buf = np.frombuffer(data, dtype=np.uint8)
    image = cv2.imdecode(buf, cv2.IMREAD_COLOR)
    if image is None:
        raise ValidationError("Failed to decode image")
    return image


def resize_image(image: np.ndarray, max_dim: int = 1920) -> np.ndarray:
    """Resize image so longest side is at most max_dim, preserving aspect ratio."""
    h, w = image.shape[:2]
    if max(h, w) <= max_dim:
        return image
    scale = max_dim / max(h, w)
    new_w, new_h = int(w * scale), int(h * scale)
    return cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_AREA)


def white_balance(image: np.ndarray) -> np.ndarray:
    """Apply gray-world white balance."""
    result = image.astype(np.float32)
    avg_b, avg_g, avg_r = result[:, :, 0].mean(), result[:, :, 1].mean(), result[:, :, 2].mean()
    avg_gray = (avg_b + avg_g + avg_r) / 3.0
    if avg_b > 0:
        result[:, :, 0] *= avg_gray / avg_b
    if avg_g > 0:
        result[:, :, 1] *= avg_gray / avg_g
    if avg_r > 0:
        result[:, :, 2] *= avg_gray / avg_r
    return np.clip(result, 0, 255).astype(np.uint8)


def to_hsv(image: np.ndarray) -> np.ndarray:
    """Convert BGR image to HSV."""
    return cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
