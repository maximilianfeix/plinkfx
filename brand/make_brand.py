#!/usr/bin/env python3
"""
Builds every plinkfx brand asset from code. Change this script, never the outputs.

    python3 brand/make_brand.py

Writes SVGs directly; PNGs are rasterised with Playwright's Chromium
(`npx playwright screenshot`), so no Python image libraries are needed.
"""
import json
import math
import os
import struct
import subprocess
import tempfile
import wave

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = HERE

# ---- tokens (keep in sync with brand/BRAND.md and gallery/style.css) ----
PAPER = "#F2EDE3"
INK = "#16130F"
MUTED = "#6B6358"
PLINK = "#FF5A26"  # the one accent: the drop, the "fx", the playhead
INK_SOFT = "#2A251F"

# ---- the mark: a decaying wave drawn in pixels that lands in one pixel ----
def wave_cells():
    """Sample a decaying sine on a pixel grid and join neighbours with vertical runs."""
    cols, mid = 15, 5
    ys = [round(mid - 4.4 * math.exp(-x / 7) * math.sin(x * 2 * math.pi / 6)) for x in range(cols)]
    cells = set()
    for x, y in enumerate(ys):
        cells.add((x, y))
        if x:
            a, b = sorted((ys[x - 1], y))
            for yy in range(a + 1, b):
                # put the joining run on whichever column is closer to the midpoint of the step
                cells.add((x if abs(yy - y) < abs(yy - ys[x - 1]) else x - 1, yy))
    return cells, (cols + 1, mid)  # the drop pixel sits one gap after the wave, on the centre line


def mark_svg(fg, accent, px=10, pad=1, bg=None):
    cells, (dx, dy) = wave_cells()
    w = (dx + 2 + pad * 2) * px
    h = (11 + pad * 2) * px
    rects = "".join(f'<rect x="{(x + pad) * px}" y="{(y + pad) * px}" width="{px}" height="{px}"/>' for x, y in sorted(cells))
    drop = f'<rect x="{(dx + pad) * px}" y="{(dy + pad - 0.5) * px}" width="{2 * px}" height="{2 * px}" fill="{accent}"/>'
    back = f'<rect width="{w}" height="{h}" fill="{bg}"/>' if bg else ""
    return w, h, f'{back}<g fill="{fg}" shape-rendering="crispEdges">{rects}</g>{drop}'


# ---- the wordmark: our own pixel lettering, 1 px = 1 grid unit ----
GLYPHS = {
    "p": ["....", "....", "XXX.", "X..X", "X..X", "X..X", "XXX.", "X...", "X..."],
    "l": ["XX", ".X", ".X", ".X", ".X", ".X", ".X", "..", ".."],
    "i": [".X", "..", "XX", ".X", ".X", ".X", ".X", "..", ".."],
    "n": ["....", "....", "XXX.", "X..X", "X..X", "X..X", "X..X", "....", "...."],
    "k": ["X...", "X...", "X..X", "X.X.", "XX..", "X.X.", "X..X", "....", "...."],
    "f": ["..X", ".X.", "XXX", ".X.", ".X.", ".X.", ".X.", "...", "..."],
    "x": ["...", "...", "X.X", "X.X", ".X.", "X.X", "X.X", "...", "..."],
}


def wordmark(x0, y0, px, ink, accent):
    out, x = [], x0
    for i, ch in enumerate("plinkfx"):
        g = GLYPHS[ch]
        col = accent if ch in "fx" and i >= 5 else ink
        for r, row in enumerate(g):
            for c, v in enumerate(row):
                if v == "X":
                    out.append(f'<rect x="{x + c * px}" y="{y0 + r * px}" width="{px}" height="{px}" fill="{col}"/>')
        x += (len(g[0]) + 1) * px
    return x - px - x0, "".join(out)


_ENV = {}


def envelope(name, cols):
    """Peak envelope of the real sound, rendered by the plinkfx CLI (dist/ must be built)."""
    if name not in _ENV:
        path = os.path.join(tempfile.gettempdir(), f"plinkfx-brand-{name}.wav")
        subprocess.run(["node", os.path.join(HERE, "..", "dist", "cli.js"), "render", name, "-o", path], check=True, capture_output=True)
        with wave.open(path) as w:
            n = w.getnframes()
            x = struct.unpack(f"<{n}h", w.readframes(n))
        os.unlink(path)
        step = max(1, n // cols)
        peaks = [max(abs(v) for v in x[i * step:(i + 1) * step] or [0]) for i in range(cols)]
        top = max(peaks) or 1
        _ENV[name] = [p / top for p in peaks]
    return _ENV[name]


def svg(w, h, body):
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" shape-rendering="crispEdges">{body}</svg>\n'


def write(path, text):
    full = os.path.join(OUT, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w") as f:
        f.write(text)
    return full


def png(svg_path, png_path, w, h):
    """Rasterise via Chromium so the PNG matches the SVG pixel for pixel."""
    with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False) as t:
        t.write(f'<html><body style="margin:0;background:transparent"><img src="file://{os.path.join(OUT, svg_path)}" width="{w}" height="{h}" style="display:block;image-rendering:pixelated"></body></html>')
        html = t.name
    subprocess.run(["npx", "playwright", "screenshot", f"--viewport-size={w},{h}", "file://" + html, os.path.join(OUT, png_path)], check=True, capture_output=True)
    os.unlink(html)


def lockup(fg, accent, bg=None, px=6):
    mw, mh, mark = mark_svg(fg, accent, px=px, pad=0)
    gap = px * 4
    ww, word = wordmark(mw + gap, round(mh / 2 - 4.5 * px * 1.2 + px), round(px * 1.2), fg, accent)
    w, h = mw + gap + ww, mh
    back = f'<rect width="{w}" height="{h}" fill="{bg}"/>' if bg else ""
    return w, h, back + mark + word


def card(w, h, title, sub, dark=True, scale=1.0):
    """Social preview / header / banner: lockup left, tagline, a strip of 'tiles' with waveforms."""
    bg, fg, mut = (INK, PAPER, "#A39A8C") if dark else (PAPER, INK, MUTED)
    lw, lh, lock = lockup(fg, PLINK, px=round(9 * scale))
    x0, y0 = round(72 * scale), round(h * 0.18)
    body = f'<rect width="{w}" height="{h}" fill="{bg}"/><g transform="translate({x0},{y0})">{lock}</g>'
    ty = y0 + lh + round(54 * scale)
    body += f'<text x="{x0}" y="{ty}" font-family="ui-monospace, SF Mono, JetBrains Mono, Menlo, Consolas, monospace" font-size="{round(34 * scale)}" font-weight="600" fill="{fg}">{title}</text>'
    if sub:
        body += f'<text x="{x0}" y="{ty + round(44 * scale)}" font-family="ui-monospace, SF Mono, JetBrains Mono, Menlo, Consolas, monospace" font-size="{round(22 * scale)}" fill="{mut}">{sub}</text>'
    # a row of tiles, each with a tiny pixel waveform of a real recipe shape
    names = ["coin", "jump", "hit", "laser", "explosion", "powerup", "sparkle", "step-wood"]
    tile, gap = round(118 * scale), round(14 * scale)
    ty2 = h - tile - round(56 * scale)
    for i, n in enumerate(names):
        env = envelope(n, 24)
        tx = x0 + i * (tile + gap)
        if tx + tile > w - x0 * 0.5:
            break
        hot = i == 0
        border = PLINK if hot else ("#3A342C" if dark else "#D9D1C3")
        body += f'<rect x="{tx}" y="{ty2}" width="{tile}" height="{tile}" fill="none" stroke="{border}" stroke-width="{max(2, round(2 * scale))}"/>'
        cols, p = 24, tile / 28
        for c in range(cols):
            hh = max(1, round(env[c] * 10))
            body += f'<rect x="{tx + p * 2 + c * p}" y="{ty2 + tile * 0.42 - hh * p / 2}" width="{p * 0.8:.2f}" height="{hh * p:.2f}" fill="{PLINK if hot else fg}"/>'
        body += f'<text x="{tx + p * 2}" y="{ty2 + tile - p * 3}" font-family="ui-monospace, SF Mono, JetBrains Mono, Menlo, Consolas, monospace" font-size="{round(15 * scale)}" fill="{mut}">{n}</text>'
    return svg(w, h, body)


def main():
    # marks
    for name, fg in (("light", INK), ("dark", PAPER)):
        w, h, b = mark_svg(fg, PLINK)
        write(f"logo/mark-{name}.svg", svg(w, h, b))
        w, h, b = lockup(fg, PLINK)
        write(f"logo/lockup-{name}.svg", svg(w, h, b))
    # favicon: the mark on a paper tile, readable at 16 px
    w, h, b = mark_svg(INK, PLINK, px=4, pad=1)
    side = max(w, h)
    fav = svg(side, side, f'<rect width="{side}" height="{side}" fill="{PAPER}"/><g transform="translate({(side - w) / 2},{(side - h) / 2})">{b}</g>')
    write("favicon/favicon.svg", fav)
    png("favicon/favicon.svg", "favicon/favicon-32.png", 32, 32)
    png("favicon/favicon.svg", "favicon/apple-touch-icon.png", 180, 180)
    # social preview, X header, README banners
    count = len(json.load(open(os.path.join(HERE, "..", "library", "catalog.gen.json")))["sounds"])
    write("banners/social-preview.svg", card(1280, 640, "game sound effects as code", f"{count} sounds · CC0 · 2.5 kB player · no audio files"))
    png("banners/social-preview.svg", "banners/social-preview.png", 1280, 640)
    write("banners/x-header.svg", card(1500, 500, "game sound effects as code", "", scale=0.85))
    png("banners/x-header.svg", "banners/x-header.png", 1500, 500)
    for mode, dark in (("dark", True), ("light", False)):
        write(f"banners/readme-{mode}.svg", card(1280, 400, "game sound effects as code", "", dark=dark, scale=0.72))
    print("brand assets written to", OUT)


if __name__ == "__main__":
    main()
