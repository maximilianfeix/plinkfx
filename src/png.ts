/**
 * Pure-Node PNG output: a tiny encoder on node:zlib, a 5x9 pixel font, and `picture()`,
 * a waveform + spectrogram of a sound so an agent that reads images can see it.
 * Also used by scripts/og.ts for the gallery's preview cards.
 */
import { deflateSync } from "node:zlib";
import { fft } from "./meter.ts";

// ---- 5x9 pixel font: rows 0-6 sit on the baseline, rows 7-8 are descenders ----
export const FONT: Record<string, string> = {
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

const CRC = Array.from({ length: 256 }, (_, n) => {
  for (let k = 0; k < 8; k++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
  return n >>> 0;
});
function crc32(b: Uint8Array) {
  let c = 0xffffffff;
  for (const x of b) c = CRC[(c ^ x) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
/** One PNG chunk: length, type, data, CRC. */
export function chunk(type: string, data: Buffer) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}
export const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** Encode 8-bit RGB pixels (w * h * 3 bytes) as a PNG. */
export function encodeRGB(w: number, h: number, rgb: Uint8Array): Buffer {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) raw.set(rgb.subarray(y * w * 3, (y + 1) * w * 3), y * (w * 3 + 1) + 1);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr.set([8, 2, 0, 0, 0], 8); // 8-bit, truecolour
  return Buffer.concat([SIGNATURE, chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}

type RGB = [number, number, number];
const BG: RGB = [22, 19, 15],
  GRID: RGB = [58, 52, 44],
  TEXT: RGB = [163, 154, 140],
  WAVE: RGB = [255, 90, 38],
  // spectrogram colour ramp, quiet to loud
  RAMP: RGB[] = [BG, [60, 34, 92], [170, 50, 70], [255, 90, 38], [255, 200, 90], [250, 245, 225]];

/**
 * Waveform (top) and spectrogram (bottom) of mono samples, as a PNG.
 * The waveform is drawn at true scale (full height = 0 dBFS). The spectrogram is log-frequency
 * from 40 Hz to Nyquist with lines at 100 Hz, 1 kHz and 10 kHz, 80 dB range under the loudest bin.
 * Ticks under it mark time; `label` is printed at the top.
 */
export function picture(x: Float32Array, sr: number, label = ""): Buffer {
  const W = 800,
    TOP = 24,
    WH = 120,
    SY = TOP + WH + 6,
    SH = 200,
    H = SY + SH + 10,
    px = new Uint8Array(W * H * 3);
  const set = (x0: number, y0: number, c: RGB) => {
    if (x0 < 0 || y0 < 0 || x0 >= W || y0 >= H) return;
    px.set(c, (y0 * W + x0) * 3);
  };
  const rect = (x0: number, y0: number, w: number, h: number, c: RGB) => {
    for (let y = y0; y < y0 + h; y++) for (let i = x0; i < x0 + w; i++) set(i, y, c);
  };
  const text = (s: string, x0: number, y0: number, sc: number, c: RGB) => {
    let cx = x0;
    for (const ch of s) {
      (FONT[ch] ?? FONT[ch.toLowerCase()] ?? "").split(" ").forEach((row, r) => [...row].forEach((v, k) => v == "X" && rect(cx + k * sc, y0 + r * sc, sc, sc, c)));
      cx += 6 * sc;
    }
  };
  rect(0, 0, W, H, BG);
  const n = x.length;
  if (label) text(label, 8, 4, 2, TEXT);

  // waveform: min/max per column
  const mid = TOP + WH / 2;
  rect(0, mid, W, 1, GRID);
  for (let c = 0; c < W && n; c++) {
    const a = Math.floor((c * n) / W),
      b = Math.max(a + 1, Math.floor(((c + 1) * n) / W));
    let lo = 0,
      hi = 0;
    for (let i = a; i < Math.min(b, n); i++) (lo = Math.min(lo, x[i])), (hi = Math.max(hi, x[i]));
    const y0 = Math.round(mid - Math.min(hi, 1) * (WH / 2)),
      y1 = Math.round(mid - Math.max(lo, -1) * (WH / 2));
    rect(c, y0, 1, Math.max(1, y1 - y0 + 1), WAVE);
  }

  // spectrogram: one Hann FFT (~43 ms) centred on each column, frame mean removed so DC doesn't smear into the lowest rows
  const N = 2 ** Math.round(Math.log2(sr / 24)),
    re = new Float64Array(N),
    im = new Float64Array(N),
    f0 = 40,
    nyq = sr / 2,
    edge = (k: number) => f0 * (nyq / f0) ** (1 - k / SH),
    cols: Float32Array[] = [];
  let top = 1e-12;
  for (let c = 0; c < W && n; c++) {
    const at = Math.round(((c + 0.5) * n) / W) - N / 2;
    let mean = 0;
    for (let i = 0; i < N; i++) mean += (x[at + i] || 0) / N;
    for (let i = 0; i < N; i++) {
      re[i] = ((x[at + i] || 0) - mean) * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (N - 1)));
      im[i] = 0;
    }
    fft(re, im);
    const col = new Float32Array(SH);
    for (let r = 0; r < SH; r++) {
      // bins between this row's edges; at least the nearest one
      const lo = Math.max(2, Math.round((edge(r + 1) * N) / sr)),
        hi = Math.min(N / 2 - 1, Math.max(lo, Math.round((edge(r) * N) / sr)));
      let m = 0;
      for (let b = lo; b <= hi; b++) m = Math.max(m, re[b] * re[b] + im[b] * im[b]);
      col[r] = m;
      if (m > top) top = m;
    }
    cols.push(col);
  }
  cols.forEach((col, c) => {
    for (let r = 0; r < SH; r++) {
      const t = Math.max(0, Math.min(1, (10 * Math.log10(col[r] / top + 1e-20) + 80) / 80)) * (RAMP.length - 1),
        k = Math.min(RAMP.length - 2, Math.floor(t)),
        u = t - k,
        [p, q] = [RAMP[k], RAMP[k + 1]];
      set(c, SY + r, [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u, p[2] + (q[2] - p[2]) * u].map(Math.round) as RGB);
    }
  });
  for (const [f, s] of [[100, "100"], [1000, "1k"], [10000, "10k"]] as const) {
    if (f >= nyq) continue;
    const r = Math.round(SH * (1 - Math.log(f / f0) / Math.log(nyq / f0)));
    for (let c = 0; c < W; c += 3) set(c, SY + r, GRID);
    text(s, 4, SY + r - 10, 1, TEXT);
  }
  // time ticks: pick a step that gives 4 to 40 of them
  const dur = n / sr,
    step = [0.01, 0.05, 0.1, 0.25, 0.5, 1].find((s) => dur / s <= 40) ?? 1;
  for (let t = 0; t <= dur + 1e-9; t += step) rect(Math.min(W - 1, Math.round((t / dur) * W)), SY + SH + 2, 1, Math.round(t / step) % 5 ? 3 : 7, TEXT);
  return encodeRGB(W, H, px);
}
