"""Color matching — HSV distance, RGB distance, and gradient interpolation."""

import math


def hsv_distance(hsv1: list[float], hsv2: list[float]) -> float:
    """Weighted Euclidean distance with circular hue handling.

    Hue is weighted 2x because it carries the most diagnostic information.
    OpenCV hue range is 0-180, so circular distance wraps at 180.
    """
    h1, s1, v1 = hsv1
    h2, s2, v2 = hsv2
    dh = abs(h1 - h2)
    dh = min(dh, 180.0 - dh)
    ds = s1 - s2
    dv = v1 - v2
    return math.sqrt((2.0 * dh) ** 2 + ds**2 + dv**2)


def rgb_distance(rgb1: list[float], rgb2: list[float]) -> float:
    """Plain Euclidean distance in RGB space."""
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(rgb1, rgb2)))


def hsv_to_rgb(hsv: list[float]) -> list[float]:
    """Convert OpenCV HSV (H 0-180, S 0-255, V 0-255) to RGB (0-255 each)."""
    h, s, v = hsv
    h_deg = h * 2.0          # 0-360
    s_norm = s / 255.0
    v_norm = v / 255.0

    c = v_norm * s_norm
    x = c * (1.0 - abs((h_deg / 60.0) % 2.0 - 1.0))
    m = v_norm - c

    if h_deg < 60:
        r1, g1, b1 = c, x, 0.0
    elif h_deg < 120:
        r1, g1, b1 = x, c, 0.0
    elif h_deg < 180:
        r1, g1, b1 = 0.0, c, x
    elif h_deg < 240:
        r1, g1, b1 = 0.0, x, c
    elif h_deg < 300:
        r1, g1, b1 = x, 0.0, c
    else:
        r1, g1, b1 = c, 0.0, x

    return [(r1 + m) * 255.0, (g1 + m) * 255.0, (b1 + m) * 255.0]


def match_to_gradient(
    median_hsv: list[float],
    gradient: list[dict],
    interpolate: bool = True,
    is_rgb: bool = False,
) -> tuple[str, float, float]:
    """Match an observed color value to the closest reference in a gradient.

    If ``is_rgb`` is True the first argument is already an RGB triplet and no
    HSV→RGB conversion is performed.  Otherwise, when gradient entries contain
    an ``rgb`` key the observed HSV is converted to RGB (legacy path).

    Returns (label, numeric_value, confidence).
    """
    use_rgb = "rgb" in gradient[0]
    if is_rgb:
        observed: list[float] = median_hsv  # already RGB despite the param name
    elif use_rgb:
        observed = hsv_to_rgb(median_hsv)
    else:
        observed = median_hsv

    def dist(ref: dict) -> float:
        return rgb_distance(observed, ref["rgb"]) if use_rgb else hsv_distance(observed, ref["hsv"])

    best_dist = float("inf")
    best_idx = 0

    for i, ref in enumerate(gradient):
        d = dist(ref)
        if d < best_dist:
            best_dist = d
            best_idx = i

    best_ref = gradient[best_idx]
    numeric_value = best_ref["value"]

    if interpolate and best_idx > 0 and best_idx < len(gradient) - 1:
        prev_ref = gradient[best_idx - 1]
        next_ref = gradient[best_idx + 1]
        dist_prev = dist(prev_ref)
        dist_next = dist(next_ref)
        if dist_prev < dist_next and dist_prev < best_dist * 3:
            weight = best_dist / (best_dist + dist_prev)
            numeric_value = best_ref["value"] * (1 - weight) + prev_ref["value"] * weight
        elif dist_next < best_dist * 3:
            weight = best_dist / (best_dist + dist_next)
            numeric_value = best_ref["value"] * (1 - weight) + next_ref["value"] * weight

    confidence = max(0.3, 1.0 / (1.0 + best_dist / 50.0))
    return best_ref["label"], round(numeric_value, 2), round(confidence, 3)


def match_to_multi_gradient(
    hsv_samples: list[list[float]],
    gradient: list[dict],
    interpolate: bool = True,
    is_rgb: bool = False,
) -> tuple[str, float, float]:
    """Match N observed color samples against a multi-color gradient.

    If ``is_rgb`` is True the samples are already RGB triplets and no HSV→RGB
    conversion is performed.  Otherwise, when gradient entries contain
    ``rgb_colors`` each sample is converted from HSV to RGB (legacy path).

    Returns (label, numeric_value, confidence).
    """
    n = len(hsv_samples)
    use_rgb = "rgb_colors" in gradient[0]
    if is_rgb:
        observed = hsv_samples  # already RGB despite the param name
    elif use_rgb:
        observed = [hsv_to_rgb(s) for s in hsv_samples]
    else:
        observed = hsv_samples

    def mean_dist(ref: dict) -> float:
        refs = ref["rgb_colors"] if use_rgb else ref["colors"]
        fn = rgb_distance if use_rgb else hsv_distance
        return sum(fn(observed[j], refs[j]) for j in range(n)) / n

    best_dist = float("inf")
    best_idx = 0

    for i, ref in enumerate(gradient):
        d = mean_dist(ref)
        if d < best_dist:
            best_dist = d
            best_idx = i

    best_ref = gradient[best_idx]
    numeric_value = float(best_ref["value"])

    if interpolate and 0 < best_idx < len(gradient) - 1:
        dist_prev = mean_dist(gradient[best_idx - 1])
        dist_next = mean_dist(gradient[best_idx + 1])
        if dist_prev < dist_next and dist_prev < best_dist * 3:
            weight = best_dist / (best_dist + dist_prev)
            numeric_value = best_ref["value"] * (1 - weight) + gradient[best_idx - 1]["value"] * weight
        elif dist_next < best_dist * 3:
            weight = best_dist / (best_dist + dist_next)
            numeric_value = best_ref["value"] * (1 - weight) + gradient[best_idx + 1]["value"] * weight

    confidence = max(0.3, 1.0 / (1.0 + best_dist / 50.0))
    return best_ref["label"], round(numeric_value, 2), round(confidence, 3)
