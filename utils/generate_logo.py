"""Generate the Retentio "R + brain" logo from the reference image.

Isolates the neon strokes in reference.png, trims everything around the R
(navy background, stray sparkle, specks), crops tightly to the mark, and
vector-traces it with vtracer, producing two SVGs (and matching PNGs when
rsvg-convert is available):

  * retentio_logo.svg       blue line-art on a transparent background
  * retentio_logo_glow.svg  same strokes wrapped in a neon glow over navy

Deps:  pip install numpy scipy pillow vtracer
PNG export from the SVGs uses `rsvg-convert` (brew install librsvg); if it's not
installed, only the SVGs are written.

Run:   python3 generate_logo.py
"""
import os
import re
import shutil
import subprocess
import tempfile

import numpy as np
import scipy.ndimage as ndi
import vtracer
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
REF = os.path.join(HERE, "reference.png")
LINEART_SVG = os.path.join(HERE, "retentio_logo.svg")
GLOW_SVG = os.path.join(HERE, "retentio_logo_glow.svg")

BG = (10, 15, 26)          # #0A0F1A
BLUE = (37, 99, 235)       # #2563EB  (Rete brand accent)
THRESH = 135               # luminance cutoff isolating core strokes from glow
MIN_COMPONENT = 100        # drop stroke blobs smaller than this (sparkle, specks)
CROP_PAD = 12              # transparent margin kept around the mark
BG_HEX = "#%02X%02X%02X" % BG
BLUE_HEX = "#%02X%02X%02X" % BLUE


def stroke_mask():
    """Return a boolean mask that is True on the neon strokes."""
    im = np.asarray(Image.open(REF).convert("RGB")).astype(np.float32)
    lum = 0.299 * im[..., 0] + 0.587 * im[..., 1] + 0.114 * im[..., 2]
    return lum >= THRESH


def trim_to_mark(mask):
    """Drop stray blobs and crop tightly to the R + brain mark."""
    labels, n = ndi.label(mask)
    if n:
        counts = np.bincount(labels.ravel())
        counts[0] = 0  # background
        keep = np.isin(labels, np.flatnonzero(counts >= MIN_COMPONENT))
        mask = mask & keep

    ys, xs = np.where(mask)
    y0 = max(0, ys.min() - CROP_PAD)
    y1 = min(mask.shape[0], ys.max() + 1 + CROP_PAD)
    x0 = max(0, xs.min() - CROP_PAD)
    x1 = min(mask.shape[1], xs.max() + 1 + CROP_PAD)
    return mask[y0:y1, x0:x1]


def trace(mask):
    """Vector-trace the blue-on-navy strokes; return the raw vtracer SVG text."""
    h, w = mask.shape
    clean = np.empty((h, w, 3), np.uint8)
    clean[:] = BG
    clean[mask] = BLUE

    src = tempfile.NamedTemporaryFile(suffix=".png", delete=False).name
    out = tempfile.NamedTemporaryFile(suffix=".svg", delete=False).name
    Image.fromarray(clean).save(src)
    vtracer.convert_image_to_svg_py(
        src, out,
        colormode="color", hierarchical="cutout", mode="spline",
        filter_speckle=4, color_precision=8, corner_threshold=60,
        length_threshold=4.0, splice_threshold=45,
    )
    svg_text = open(out).read()
    os.unlink(src)
    os.unlink(out)
    return svg_text


def blue_elements(svg_text):
    """Return the stroke <path> elements, recoloured to a single blue."""
    blue = []
    for el in re.findall(r"<path\b[^>]*/>", svg_text):
        m = re.search(r'fill="([^"]+)"', el)
        if not m:
            continue
        r, g, b = (int(m.group(1)[i:i + 2], 16) for i in (1, 3, 5))
        d_blue = (r - BLUE[0]) ** 2 + (g - BLUE[1]) ** 2 + (b - BLUE[2]) ** 2
        d_bg = (r - BG[0]) ** 2 + (g - BG[1]) ** 2 + (b - BG[2]) ** 2
        if d_blue < d_bg:  # a stroke path, not background
            blue.append(re.sub(r'fill="[^"]+"', f'fill="{BLUE_HEX}"', el))
    return blue


def lineart_svg(svg_text, w, h):
    """Blue strokes only, on a transparent background."""
    body = "\n".join("  " + el for el in blue_elements(svg_text))
    return f'''<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">
{body}
</svg>'''


def wrap_glow(svg_text, w, h):
    """Blue strokes wrapped in a neon Gaussian-blur glow over navy."""
    body = "\n".join("      " + el for el in blue_elements(svg_text))
    return f'''<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">
  <defs>
    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="4" result="b1"/>
      <feGaussianBlur stdDeviation="11" result="b2"/>
      <feMerge>
        <feMergeNode in="b2"/><feMergeNode in="b2"/>
        <feMergeNode in="b1"/><feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="{BG_HEX}"/>
  <g filter="url(#glow)">
{body}
  </g>
</svg>'''


def export_png(svg_path, w, h):
    """Render an SVG to PNG with rsvg-convert if it is installed."""
    rsvg = shutil.which("rsvg-convert")
    if not rsvg:
        return None
    png_path = svg_path[:-4] + ".png"
    subprocess.run([rsvg, "-w", str(w), "-h", str(h), svg_path, "-o", png_path],
                   check=True)
    return png_path


def main():
    mask = trim_to_mark(stroke_mask())
    h, w = mask.shape
    svg_text = trace(mask)

    with open(LINEART_SVG, "w") as f:
        f.write(lineart_svg(svg_text, w, h))
    with open(GLOW_SVG, "w") as f:
        f.write(wrap_glow(svg_text, w, h))

    written = [LINEART_SVG, GLOW_SVG]
    for svg in (LINEART_SVG, GLOW_SVG):
        png = export_png(svg, w, h)
        if png:
            written.append(png)

    print("wrote:\n  " + "\n  ".join(os.path.basename(p) for p in written))
    if not shutil.which("rsvg-convert"):
        print("(install librsvg for PNG export: brew install librsvg)")


if __name__ == "__main__":
    main()
