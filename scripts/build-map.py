#!/usr/bin/env python3
"""Convert the official DMRC network map PDF into an animated web SVG.

The map artwork is NOT redrawn or restyled. pdftocairo extracts the exact
vector artwork from the PDF; this script only:
  1. rounds coordinates/colours to 1 decimal (invisible at display size),
  2. tags every path with a CSS class based on its fill colour (line colour,
     station white, label ink) so the lines can fade in one after another,
  3. injects a small <style> block with the fade-in animation.

Usage: python3 scripts/build-map.py <official-map.pdf>
Output: public/map/dmrc-network.svg
"""
import re
import subprocess
import sys
import tempfile
from pathlib import Path

PDF = sys.argv[1] if len(sys.argv) > 1 else ""
OUT = Path(__file__).resolve().parent.parent / "public" / "map" / "dmrc-network.svg"

# Reveal order: background first, then lines roughly west-to-east in the order
# a commuter learns the network, then station markers, then labels.
DELAYS = {
    "bg": 0.0, "red": 0.15, "yellow": 0.35, "blue": 0.55, "green": 0.75,
    "violet": 0.95, "airport": 1.15, "pink": 1.35, "magenta": 1.55,
    "aux": 1.75, "sta": 1.95, "lbl": 2.25,
}

# Exact fills (after rounding to 0.1%) for label ink and station white.
LABEL_FILLS = {
    (14.3, 29.5, 63.9),   # navy station names (most common fill on the map)
    (12.9, 10.8, 11.1),   # near-black text
    (6.3, 5.8, 5.2),
    (13.7, 12.2, 12.5),
}
WHITE = (100.0, 100.0, 100.0)


def classify(rgb: tuple[float, float, float]) -> str:
    r, g, b = (v * 2.55 for v in rgb)
    if rgb == WHITE:
        return "sta"
    if rgb in LABEL_FILLS:
        return "lbl"
    mx, mn = max(r, g, b), min(r, g, b)
    if mx - mn < 18:  # greys and near-neutrals
        return "lbl" if mx < 110 else "aux"
    # Hue in degrees
    if mx == r:
        h = (60 * ((g - b) / (mx - mn)) + 360) % 360
    elif mx == g:
        h = 60 * ((b - r) / (mx - mn)) + 120
    else:
        h = 60 * ((r - g) / (mx - mn)) + 240
    light = (mx + mn) / 2 / 255
    if h < 14 or h >= 345:
        return "red"
    if h < 42:
        return "airport"
    if h < 72:
        return "yellow"
    if h < 165:
        return "green"
    if h < 252:
        return "blue"
    if h < 292:
        return "violet"
    return "pink" if light > 0.62 else "magenta"


def fmt(v: float) -> str:
    s = f"{v:.1f}"
    if s.endswith(".0"):
        s = s[:-2]
    return "0" if s in ("-0", "") else s


def fmt4(v: float) -> str:
    """Round to 4 decimals for transform matrices, where values below 1
    (scale factors like 0.9514) carry real information."""
    s = f"{v:.4f}".rstrip("0").rstrip(".")
    return "0" if s in ("-0", "") else s


def round_numbers(text: str) -> str:
    text = re.sub(r'd="[^"]*"', lambda m: re.sub(r"-?\d+\.\d+", lambda x: fmt(float(x.group())), m.group()), text)
    text = re.sub(r'transform="[^"]*"', lambda m: re.sub(r"-?\d+\.\d+", lambda x: fmt4(float(x.group())), m.group()), text)
    return text


def round_fills(text: str) -> str:
    def sub(m: re.Match) -> str:
        vals = [float(v.strip().rstrip("%")) for v in m.group(1).split(",")]
        return "rgb(" + ",".join(fmt(v) + "%" for v in vals) + ")"
    return re.sub(r"rgb\(([^)]*)\)", sub, text)


STYLE = """<title>Delhi Metro network map (official DMRC map, August 2026)</title>
<style>
.dm{animation:dmIn .8s ease-out backwards}
.dm-sta{transform-box:fill-box;transform-origin:center;animation:dmPop .5s ease-out backwards}
@keyframes dmIn{from{opacity:0}to{opacity:1}}
@keyframes dmPop{from{opacity:0;transform:scale(.4)}to{opacity:1;transform:scale(1)}}
""" + "\n".join(
    f".d{int(round(d * 100))}{{animation-delay:{d}s}}" for d in sorted(set(DELAYS.values()))
) + """
@media (prefers-reduced-motion: reduce){.dm,.dm-sta{animation:none}}
</style>"""


def main() -> None:
    with tempfile.TemporaryDirectory() as td:
        raw = Path(td) / "map.svg"
        subprocess.run(["pdftocairo", "-svg", PDF, str(raw)], check=True)
        svg = raw.read_text()

    svg = round_fills(round_numbers(svg))

    head, sep, tail = svg.partition("</defs>")
    assert sep, "expected a </defs> in pdftocairo output"

    def tag_path(m: re.Match) -> str:
        tag = m.group(0)
        fm = re.search(r'fill="rgb\(([^)]*)\)"', tag)
        if fm:
            rgb = tuple(float(v.rstrip("%")) for v in fm.group(1).split(","))
            cls = classify(rgb)
        elif 'fill="none"' in tag:
            cls = "aux"
        else:
            cls = "aux"
        anim = "dm-sta" if cls == "sta" else "dm"
        delay = f"d{int(round(DELAYS[cls] * 100))}"
        return tag.replace("<path", f'<path class="{anim} {delay}"', 1)

    tail = re.sub(r"<path[^>]*?/?>", tag_path, tail)
    tail = tail.replace("<use", '<use class="dm d0"', 3)

    svg = head + sep + STYLE + tail
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(svg)
    print(f"wrote {OUT} ({len(svg) / 1e6:.2f} MB)")


if __name__ == "__main__":
    main()
