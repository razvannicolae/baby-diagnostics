#!/usr/bin/env python3
"""
Pick pH colors from reference chart, generate HTML verification, output YAML.

Color order per pH row (left→right in reference chart, right = closest to number):
  pad1 = rightmost (closest to pH number label) = "first section"
  pad2 = second from right
  pad3 = third from right
  pad4 = leftmost

Each pad corresponds to one of the 4 sub-pad rows on the physical pH strip.
"""

# RGB colors sampled from Image 6 (clinical reference chart), pad1..pad4 per pH.
PH_COLORS_RGB: dict[int, list[tuple[int, int, int]]] = {
    0:  [(218, 78,  130), (230, 120,  42), ( 58, 155, 165), (125, 155,  47)],
    1:  [(212, 88,  118), (226, 118,  45), ( 55, 152, 162), (122, 153,  47)],
    2:  [(205, 68,   72), (212,  88,  42), ( 52, 148, 160), (120, 150,  45)],
    3:  [(220, 95,   52), (225, 128,  45), ( 52, 145, 155), (120, 150,  42)],
    4:  [(218, 165,  38), (228, 172,  42), ( 48, 138, 160), (130, 160,  52)],
    5:  [(215, 155,  42), (225, 168,  45), ( 48, 135, 158), (128, 158,  52)],
    6:  [(220, 205,  45), (225, 210,  52), ( 48, 130, 155), (130, 158,  55)],
    7:  [(188, 185,  58), (168, 185,  68), ( 65, 148, 172), (128, 155,  55)],
    8:  [(178, 178,  62), (158, 168,  68), ( 68, 148, 175), (128, 152,  52)],
    9:  [(195, 172,  52), ( 52, 148, 168), ( 45, 150, 165), (128, 150,  50)],
    10: [(195, 165,  50), ( 52,  98, 182), ( 88,  72, 168), (138, 148,  55)],
    11: [(158, 152,  58), ( 52,  95, 178), (122,  62, 158), (148, 120,  52)],
    12: [(155, 148,  55), ( 50,  92, 175), (128,  58, 152), (142, 112,  45)],
    13: [(152, 145,  52), ( 48,  88, 170), (148,  52, 145), (158,  88,  42)],
    14: [(150, 142,  50), ( 52,  88, 168), (148,  55, 150), (195,  62,  38)],
}


def rgb_to_hex(r: int, g: int, b: int) -> str:
    return f"#{r:02X}{g:02X}{b:02X}"


# ── HTML verification ──────────────────────────────────────────────────────────

html_rows = ""
for ph, pads in PH_COLORS_RGB.items():
    swatches = ""
    for i, (r, g, b) in enumerate(pads):
        hx = rgb_to_hex(r, g, b)
        swatches += (
            f'<div style="display:flex;flex-direction:column;align-items:center;gap:3px">'
            f'<div style="width:52px;height:52px;background:{hx};border:1px solid #aaa;border-radius:4px" '
            f'title="Pad {i+1}: {hx}  RGB({r},{g},{b})"></div>'
            f'<span style="font-size:9px;color:#555">P{i+1} {hx}</span>'
            f'</div>'
        )
    html_rows += (
        f'<div style="display:flex;align-items:center;gap:8px;padding:3px 0;border-bottom:1px solid #eee">'
        f'<span style="font-weight:700;font-size:14px;width:40px;color:#222">pH {ph}</span>'
        f'{swatches}'
        f'</div>\n'
    )

HTML = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>pH Color Calibration — Verification</title>
<style>
  body {{ font-family: monospace; background: #fafafa; padding: 24px; max-width: 560px; }}
  h2 {{ font-size: 15px; margin-bottom: 4px; }}
  p  {{ font-size: 11px; color: #666; margin: 0 0 16px; }}
</style>
</head>
<body>
<h2>pH Color Calibration — Verification Grid</h2>
<p>Pad 1 = rightmost square in reference chart (closest to pH number label).<br>
   Compare each row against Image 6.</p>
{html_rows}
</body>
</html>"""

out_html = "/Users/razvannicolae/Code/baby-diagnostics/ph_color_verification.html"
with open(out_html, "w") as f:
    f.write(HTML)
print(f"HTML written to: {out_html}")


# ── YAML output ────────────────────────────────────────────────────────────────

print("\n  pH:")
print("    unit: \"\"")
print("    normal_min: 6.0")
print("    normal_max: 8.0")
print("    sub_pads: 4")
print("    flip_sub_pads: true")
print("    gradient:")
for ph, pads in PH_COLORS_RGB.items():
    print(f"      - value: {float(ph)}")
    print(f'        label: "{ph}"')
    print(f"        rgb_colors:")
    for i, (r, g, b) in enumerate(pads):
        label = ["# pad1 (closest to number)", "# pad2", "# pad3", "# pad4"][i]
        print(f"          - [{r:3d}, {g:3d}, {b:3d}]   {rgb_to_hex(r,g,b)} {label}")
