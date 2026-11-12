/**
 * Per-sound Open Graph cards (1200x630 PNG) in the brand's pixel style, drawn in pure Node:
 * a palette raster, a 5x9 pixel font and a small PNG encoder on node:zlib. No browser, no image library.
 * Colours and the mark follow brand/make_brand.py.
 */
import { deflateSync } from "node:zlib";

const INK = "#16130F",
  PAPER = "#F2EDE3",
  MUTED = "#A39A8C", // muted text on the dark card
  PLINK = "#FF5A26",
  LINE = "#3A342C";

// Category colours, dark-theme values from gallery/style.css.
export const CAT_COLORS: Record<string, string> = {
  ui: "#5b7a99", pickup: "#d4a017", jump: "#4f9d69", hit: "#c8553d", explosion: "#b4533f", powerup: "#e07a1f", shoot: "#b23a7b",
  footstep: "#a8987a", magic: "#8a7ee0", alert: "#d63f3f", jingle: "#2f8f8a", mechanic: "#8f8f8f", world: "#3b7ea1",
};

// ---- 5x9 pixel font: rows 0-6 sit on the baseline, rows 7-8 are descenders ----
const F: Record<string, string> = {
  a: "..... ..... .XXX. ....X .XXXX X...X .XXXX",
  b: "X.... X.... XXXX. X...X X...X X...X XXXX.",
  c: "..... ..... .XXXX X.... X.... X.... .XXXX",
  d: "....X ....X .XXXX X...X X...X X...X .XXXX",
  e: "..... ..... .XXX. X...X XXXXX X.... .XXXX",
  f: "..XX. .X... XXXX. .X... .X... .X... .X...",
  g: "..... ..... .XXXX X...X X...X X...X .XXXX ....X XXXX.",
  h: "X.... X.... XXXX. X...X X...X X...X X...X",
  i: "..X.. ..... .XX.. ..X.. ..X.. ..X.. .XXX.",
  j: "...X. ..... ..XX. ...X. ...X. ...X. ...X. ...X. XXX..",
  k: "X.... X.... X..X. X.X.. XX... X.X.. X..X.",
  l: ".XX.. ..X.. ..X.. ..X.. ..X.. ..X.. .XXX.",
  m: "..... ..... XX.X. X.X.X X.X.X X.X.X X.X.X",
  n: "..... ..... XXXX. X...X X...X X...X X...X",
  o: "..... ..... .XXX. X...X X...X X...X .XXX.",
  p: "..... ..... XXXX. X...X X...X X...X XXXX. X.... X....",
  q: "..... ..... .XXXX X...X X...X X...X .XXXX ....X ....X",
  r: "..... ..... X.XX. XX..X X.... X.... X....",
  s: "..... ..... .XXXX X.... .XXX. ....X XXXX.",
  t: ".X... .X... XXXX. .X... .X... .X... ..XX.",
  u: "..... ..... X...X X...X X...X X...X .XXXX",
  v: "..... ..... X...X X...X X...X .X.X. ..X..",
  w: "..... ..... X...X X...X X.X.X X.X.X .X.X.",
  x: "..... ..... X...X .X.X. ..X.. .X.X. X...X",
  y: "..... ..... X...X X...X X...X X...X .XXXX ....X XXXX.",
  z: "..... ..... XXXXX ...X. ..X.. .X... XXXXX",
  C: ".XXX. X...X X.... X.... X.... X...X .XXX.",
  "0": ".XXX. X...X X..XX X.X.X XX..X X...X .XXX.",
  "1": "..X.. .XX.. ..X.. ..X.. ..X.. ..X.. .XXX.",
  "2": ".XXX. X...X ....X ...X. ..X.. .X... XXXXX",
  "3": "XXXX. ....X ....X .XXX. ....X ....X XXXX.",
  "4": "...X. ..XX. .X.X. X..X. XXXXX ...X. ...X.",
  "5": "XXXXX X.... XXXX. ....X ....X X...X .XXX.",
  "6": ".XXX. X.... X.... XXXX. X...X X...X .XXX.",
  "7": "XXXXX ....X ...X. ..X.. .X... .X... .X...",
  "8": ".XXX. X...X X...X .XXX. X...X X...X .XXX.",
  "9": ".XXX. X...X X...X .XXXX ....X ....X .XXX.",
  "-": "..... ..... ..... ..... .XXX.",
  "·": "..... ..... ..... ..... ..X..",
  ".": "..... ..... ..... ..... ..... ..... ..X..",
  "/": "....X ....X ...X. ..X.. .X... X.... X....",
  "&": ".XX.. X..X. X.X.. .X... X.X.X X..X. .XX.X",
  " ": "",
};

// The brand wordmark glyphs and mark, ported from brand/make_brand.py.
const WORD: Record<string, string[]> = {
  p: ["....", "....", "XXX.", "X..X", "X..X", "X..X", "XXX.", "X...", "X..."],
  l: ["XX", ".X", ".X", ".X", ".X", ".X", ".X", "..", ".."],
  i: [".X", "..", "XX", ".X", ".X", ".X", ".X", "..", ".."],
  n: ["....", "....", "XXX.", "X..X", "X..X", "X..X", "X..X", "....", "...."],
  k: ["X...", "X...", "X..X", "X.X.", "XX..", "X.X.", "X..X", "....", "...."],
  f: ["..X", ".X.", "XXX", ".X.", ".X.", ".X.", ".X.", "...", "..."],
  x: ["...", "...", "X.X", "X.X", ".X.", "X.X", "X.X", "...", "..."],
};
function waveCells() {
  const cols = 15,
    mid = 5,
    ys = Array.from({ length: cols }, (_, x) => Math.round(mid - 4.4 * Math.exp(-x / 7) * Math.sin((x * 2 * Math.PI) / 6))),
    cells: [number, number][] = [];
  ys.forEach((y, x) => {
    cells.push([x, y]);
    if (!x) return;
    const [a, b] = [ys[x - 1], y].sort((p, q) => p - q);
    for (let yy = a + 1; yy < b; yy++) cells.push([Math.abs(yy - y) < Math.abs(yy - ys[x - 1]) ? x : x - 1, yy]);
  });
  return { cells, drop: [cols + 1, mid] as const };
}

class Canvas {
  px: Uint8Array;
  colors: string[] = [];
  readonly w: number;
  readonly h: number;
  constructor(w: number, h: number, bg: string) {
    this.w = w;
    this.h = h;
    this.px = new Uint8Array(w * h).fill(this.color(bg));
  }
  color(hex: string) {
    let i = this.colors.indexOf(hex.toUpperCase());
    if (i < 0) i = this.colors.push(hex.toUpperCase()) - 1;
    return i;
  }
  rect(x: number, y: number, w: number, h: number, hex: string) {
    const c = this.color(hex);
    const x0 = Math.max(0, Math.round(x)),
      y0 = Math.max(0, Math.round(y)),
      x1 = Math.min(this.w, Math.round(x + w)),
      y1 = Math.min(this.h, Math.round(y + h));
    for (let yy = y0; yy < y1; yy++) this.px.fill(c, yy * this.w + x0, yy * this.w + x1);
  }
  /** Pixel text; returns its width. 1 font pixel = `s` image pixels, 1 column gap between glyphs. */
  text(str: string, x: number, y: number, s: number, hex: string) {
    let cx = x;
    for (const ch of str) {
      const rows = (F[ch] ?? F[ch.toLowerCase()] ?? "").split(" ");
      rows.forEach((row, r) => [...row].forEach((v, c) => v == "X" && this.rect(cx + c * s, y + r * s, s, s, hex)));
      cx += 6 * s;
    }
    return cx - x - s;
  }
  png() {
    const raw = Buffer.alloc((this.w + 1) * this.h);
    for (let y = 0; y < this.h; y++) raw.set(this.px.subarray(y * this.w, (y + 1) * this.w), y * (this.w + 1) + 1);
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(this.w, 0);
    ihdr.writeUInt32BE(this.h, 4);
    ihdr.set([8, 3, 0, 0, 0], 8); // 8-bit, indexed colour
    const plte = Buffer.from(this.colors.flatMap((h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))));
    return Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk("IHDR", ihdr),
      chunk("PLTE", plte),
      chunk("IDAT", deflateSync(raw, { level: 9 })),
      chunk("IEND", Buffer.alloc(0)),
    ]);
  }
}
const CRC = Array.from({ length: 256 }, (_, n) => {
  for (let k = 0; k < 8; k++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
  return n >>> 0;
});
function crc32(b: Buffer) {
  let c = 0xffffffff;
  for (const x of b) c = CRC[(c ^ x) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

export interface CardSound {
  name: string;
  cat: string;
  env: number[];
}

/** The 1200x630 card for one sound: category, name, its real waveform, "plinkfx · CC0". */
export function ogCard(s: CardSound, catTitle: string): Buffer {
  const W = 1200,
    H = 630,
    X = 72,
    c = new Canvas(W, H, INK);
  // top row: category on the left, the plinkfx lockup on the right
  c.rect(X, 64, 24, 24, CAT_COLORS[s.cat] || PLINK);
  c.text(catTitle.toLowerCase(), X + 44, 64, 4, MUTED);
  const { cells, drop } = waveCells(),
    mpx = 5,
    wpx = 6,
    wordW = Object.values(WORD).reduce((n, g) => n + (g[0].length + 1) * wpx, 0) - wpx,
    markW = (drop[0] + 2) * mpx,
    lx = W - X - (markW + mpx * 4 + wordW),
    ly = 56;
  for (const [x, y] of cells) c.rect(lx + x * mpx, ly + y * mpx, mpx, mpx, PAPER);
  c.rect(lx + drop[0] * mpx, ly + (drop[1] - 0.5) * mpx, 2 * mpx, 2 * mpx, PLINK);
  let wx = lx + markW + mpx * 4;
  const wy = ly + Math.round((11 * mpx) / 2 - 4.5 * wpx + mpx);
  [..."plinkfx"].forEach((ch, i) => {
    const g = WORD[ch];
    g.forEach((row, r) => [...row].forEach((v, k) => v == "X" && c.rect(wx + k * wpx, wy + r * wpx, wpx, wpx, i >= 5 ? PLINK : PAPER)));
    wx += (g[0].length + 1) * wpx;
  });
  // the name, as large as fits (17 characters at most in the catalogue today)
  const scale = Math.max(6, Math.min(16, Math.floor((W - 2 * X + 1) / (s.name.length * 6))));
  c.text(s.name, X, 150, scale, PAPER);
  // the waveform: 40 bars on a 6 px grid, centred on a line
  const n = s.env.length,
    step = Math.floor((W - 2 * X) / n),
    bw = Math.round(step * 0.68),
    mid = 150 + 9 * 16 + 120,
    unit = 6,
    maxH = 168;
  c.rect(X, mid - 1, W - 2 * X, 2, LINE);
  s.env.forEach((v, i) => {
    const bh = Math.max(unit, Math.round((Math.max(v, 0.03) * maxH) / unit / 2) * unit * 2);
    c.rect(X + i * step + Math.round((W - 2 * X - step * n) / 2), mid - bh / 2, bw, bh, PLINK);
  });
  // footer
  const fy = H - 64 - 7 * 4;
  c.text("plinkfx · CC0", X, fy, 4, PAPER);
  const right = "free game sound effect";
  c.text(right, W - X - (right.length * 6 - 1) * 4, fy, 4, MUTED);
  return c.png();
}
