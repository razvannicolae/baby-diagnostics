"""Color matching — HSV distance and gradient interpolation."""

import math


def hsv_distance(hsv1: list[float], hsv2: list[float]) -> float:
    """Weighted Euclidean distance with circular hue handling.

    Hue is weighted 2x because it carries the most diagnostic information.
    OpenCV hue range is 0-180, so circular distance wraps at 180.
    """
    h1, s1, v1 = hsv1
    h2, s2, v2 = hsv2
    # Circular hue distance (0-180 range)
    dh = abs(h1 - h2)
    dh = min(dh, 180.0 - dh)
    ds = s1 - s2
    dv = v1 - v2
    return math.sqrt((2.0 * dh) ** 2 + ds**2 + dv**2)


def match_to_gradient(
    median_hsv: list[float],
    gradient: list[dict],
) -> tuple[str, float, float]:
    """Match an observed HSV value to the closest reference in a gradient.

    Returns (label, numeric_value, confidence) where confidence is 0-1
    based on distance to the nearest reference point.
    """
    best_dist = float("inf")
    best_idx = 0

    for i, ref in enumerate(gradient):
        dist = hsv_distance(median_hsv, ref["hsv"])
        if dist < best_dist:
            best_dist = dist
            best_idx = i

    best_ref = gradient[best_idx]

    # Interpolate with neighbor if not at boundary
    numeric_value = best_ref["value"]
    if best_idx > 0 and best_idx < len(gradient) - 1:
        prev_ref = gradient[best_idx - 1]
        next_ref = gradient[best_idx + 1]
        dist_prev = hsv_distance(median_hsv, prev_ref["hsv"])
        dist_next = hsv_distance(median_hsv, next_ref["hsv"])
        # Interpolate toward the closer neighbor
        if dist_prev < dist_next and dist_prev < best_dist * 3:
            weight = best_dist / (best_dist + dist_prev)
            numeric_value = best_ref["value"] * (1 - weight) + prev_ref["value"] * weight
        elif dist_next < best_dist * 3:
            weight = best_dist / (best_dist + dist_next)
            numeric_value = best_ref["value"] * (1 - weight) + next_ref["value"] * weight

    # Confidence: inverse relationship to distance, normalized
    # Distance of 0 -> confidence 1.0, distance of 100+ -> confidence ~0.3
    confidence = max(0.3, 1.0 / (1.0 + best_dist / 50.0))

    return best_ref["label"], round(numeric_value, 2), round(confidence, 3)
