import type { Layer, RenderOptions, Sound } from "./types.ts";

const TAU = Math.PI * 2;
// Inharmonic ratios of the six square oscillators in a TR-808 cymbal.
const METAL = [1, 1.483, 1.8, 2.546, 2.63, 3.897];

/** Small, fast, deterministic PRNG (mulberry32). Returns floats in [0, 1). */
export const rng = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// PolyBLEP residual: removes most of the aliasing from hard edges.
const blep = (t: number, dt: number) =>
  t < dt ? ((t /= dt), t + t - t * t - 1) : t > 1 - dt ? ((t = (t - 1) / dt), t * t + t + t + 1) : 0;

// Zero-delay-feedback state variable filter (Simper). mode 0 = low, 1 = band, 2 = high.
const svf = (sr: number, q: number, mode: number) => {
  let s1 = 0,
    s2 = 0;
  const k = 1 / q;
  return (x: number, fc: number) => {
    const g = Math.tan((Math.PI * Math.min(Math.max(fc, 10), sr * 0.45)) / sr);
    const a1 = 1 / (1 + g * (g + k)),
      a2 = g * a1,
      v3 = x - s2,
      v1 = a1 * s1 + a2 * v3,
      v2 = s2 + a2 * s1 + g * a2 * v3;
    s1 = 2 * v1 - s1;
    s2 = 2 * v2 - s2;
    return mode ? (mode < 2 ? k * v1 : x - k * v1 - v2) : v2;
  };
};

const layer = (L: Layer, out: Float32Array, sr: number, pitch: number, stretch: number, noise: () => number, fv = 1, gv = 1) => {
  const wave = L.wave || "sine",
    f0 = (L.freq || 440) * pitch,
    a = Math.max(L.a ?? 0.002, 0.001),
    h = L.h || 0,
    d = (L.d ?? 0.2) * stretch,
    len = a + h + d,
    sweep = L.sweep || len,
    curve = L.curve || 1,
    shape = L.shape || 2,
    duty = L.duty || 0.5,
    arpRate = L.arpRate || 0.06,
    gain = (L.gain ?? 1) * gv,
    drive = L.drive || 0,
    fm = L.fm,
    start = Math.round((L.at || 0) * sr),
    n = Math.min(Math.round(len * sr), out.length - start),
    q = L.q || 0.707,
    filters: [(x: number, f: number) => number, number, number][] = [];
  if (L.lp) filters.push([svf(sr, q, 0), L.lp * fv, (L.lpTo || L.lp) * fv]);
  if (L.bp) filters.push([svf(sr, q, 1), L.bp * fv, (L.bpTo || L.bp) * fv]);
  if (L.hp) filters.push([svf(sr, q, 2), L.hp * fv, (L.hpTo || L.hp) * fv]);
  let phase = 0,
    mod = 0,
    held = 0,
    b0 = 0,
    b1 = 0,
    b2 = 0,
    br = 0;
  // Modal wave: free-bar ratios by default (wood, metal bars); up to 8 modes.
  const ph = [...METAL, 0, 0].map(() => noise()),
    MR = (L.modes || [1, 2.756, 5.404, 8.933]).slice(0, 8),
    // Karplus-Strong delay line for "pluck"; formant band-passes for vowel-like "voice" layers.
    ks = wave == "pluck" ? new Float32Array(n + 1) : ph,
    fmt = (L.formant || []).map((F) => [svf(sr, 8, 1), F * fv] as const);
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    let f = f0;
    if (L.to) {
      let p = Math.min(t / sweep, 1);
      if (curve != 1) p = 1 - (1 - p) ** curve;
      f *= (L.to / (L.freq || 440)) ** p;
    }
    if (L.arp) {
      const k = Math.floor(t / arpRate);
      f *= 2 ** (L.arp[L.loop ? k % L.arp.length : Math.min(k, L.arp.length - 1)] / 12);
    }
    if (L.vib) f *= 2 ** ((L.vib[1] * Math.sin(TAU * L.vib[0] * t)) / 12);
    const dt = f / sr;
    let p = phase;
    if (fm) {
      p += (fm[1] * Math.exp(-t / (fm[2] || 9)) * Math.sin(TAU * mod)) / TAU;
      mod = (mod + dt * fm[0]) % 1;
      p -= Math.floor(p);
    }
    let s: number;
    const w = noise() * 2 - 1;
    switch (wave) {
      case "triangle":
        s = 1 - 4 * Math.abs(((p + 0.25) % 1) - 0.5);
        break;
      case "saw":
        s = 2 * p - 1 - blep(p, dt);
        break;
      case "square":
        s = (p < duty ? 1 : -1) + blep(p, dt) - blep((p + 1 - duty) % 1, dt);
        break;
      case "pluck": {
        // A noise burst fed through a damped delay one period long: a plucked string.
        const k = i - sr / f,
          j = k | 0,
          fr = k - j;
        s = j < 1 ? w : (L.blend ?? 0.5) * ((1 - fr) * (ks[j] + ks[j - 1]) + fr * (ks[j + 1] + ks[j])) * (L.damp ?? 0.998);
        ks[i] = s;
        break;
      }
      case "noise":
        s = w;
        break;
      case "pink":
        b0 = 0.99765 * b0 + w * 0.099046;
        b1 = 0.963 * b1 + w * 0.2965164;
        b2 = 0.57 * b2 + w * 1.0526913;
        s = (b0 + b1 + b2 + w * 0.1848) * 0.25;
        break;
      case "brown":
        br = (br + 0.02 * w) / 1.02;
        s = br * 3.5;
        break;
      case "crunch":
        if (phase + dt >= 1 || !i) held = w;
        s = held;
        break;
      case "modal":
        s = 0;
        for (let j = 0; j < MR.length; j++) {
          ph[j] = (ph[j] + dt * MR[j]) % 1;
          s += Math.sin(TAU * ph[j]) * Math.exp((-t * MR[j] * 4) / d) / (j + 1);
        }
        break;
      case "metal":
        s = 0;
        for (let j = 0; j < 6; j++) {
          ph[j] = (ph[j] + dt * METAL[j]) % 1;
          s += ph[j] < 0.5 ? 1 : -1;
        }
        s /= 6;
        break;
      default:
        s = Math.sin(TAU * p);
    }
    phase = (phase + dt) % 1;
    const u = i / n;
    // Key tracking: filters follow the pitch (lasers darken as they fall; noise can sweep).
    const kt = L.kt ? (f / f0) ** L.kt : 1;
    for (const [fn, from, to] of filters) s = fn(s, from * (to / from) ** u * kt);
    if (fmt.length) {
      let v = 0;
      for (const [fn, F] of fmt) v += fn(s, F * kt);
      s = v;
    }
    // shape > 0: (1-u)^shape. shape < 0: exponential decay (fast drop, long natural tail).
    const e = t < a ? t / a : t < a + h ? 1 : shape < 0 ? (Math.exp((shape * (t - a - h)) / d) - Math.exp(shape)) / (1 - Math.exp(shape)) : (1 - (t - a - h) / d) ** shape;
    s *= e;
    if (drive) s = Math.tanh(s * (1 + drive)) / Math.tanh(1 + drive);
    out[start + i] += s * gain;
  }
};

/**
 * Render a sound to mono samples. Pure and deterministic: the same sound,
 * seed and sample rate always give the same samples, in Node and in the browser.
 */
export function render(sound: Sound, opts: RenderOptions = {}): Float32Array {
  const sr = opts.sampleRate || 44100,
    seed = opts.seed || 0,
    r = rng(seed * 7919 + 17),
    pitch = seed ? 2 ** (((r() * 2 - 1) * (sound.vary ?? 0.4)) / 12) : 1,
    stretch = (L: Layer) => (seed && L.d ? 1 + (r() * 2 - 1) * 0.07 : 1),
    vf = sound.varyF ?? 0;
  const layers = sound.layers.map((L) => [L, stretch(L), seed ? pitch * 2 ** (((r() * 2 - 1) * vf) / 12) : 1, seed ? 10 ** (((r() * 2 - 1) * (sound.varyG ?? 0)) / 20) : 1] as const);
  let end = 0;
  for (const [L, s] of layers) end = Math.max(end, (L.at || 0) + Math.max(L.a ?? 0.002, 0.001) + (L.h || 0) + (L.d ?? 0.2) * s);
  const echo = sound.echo,
    verb = sound.verb;
  const tail = (echo ? Math.min(echo[0] * Math.ceil(Math.log(0.001) / Math.log(echo[1] || 0.01)), 1.5) : 0) + (verb ? 0.2 + verb[0] * 1.8 : 0);
  let x = new Float32Array(Math.ceil((end + tail) * sr) + 1);
  layers.forEach(([L, s, fv, gv], i) => layer(L, x, sr, pitch, s, rng(seed * 1009 + i * 31 + 7), fv, gv));

  if (sound.rate || sound.bits) {
    const hold = sound.rate ? sr / sound.rate : 1,
      q = sound.bits ? 2 ** (sound.bits - 1) : 0;
    let c = 0,
      v = 0;
    for (let i = 0; i < x.length; i++) {
      if (++c >= hold || !i) (c -= hold > 1 ? hold : c), (v = x[i]);
      x[i] = q ? Math.round(v * q) / q : v;
    }
  }
  if (echo) {
    const D = Math.round(echo[0] * sr),
      w = new Float32Array(x.length);
    let lp = 0;
    for (let i = D; i < x.length; i++) {
      lp += 0.5 * (x[i - D] + echo[1] * w[i - D] - lp);
      w[i] = lp;
    }
    for (let i = 0; i < x.length; i++) x[i] += w[i] * echo[2];
  }
  if (verb) {
    // Freeverb-style: four damped combs in parallel, two allpasses in series.
    const k = sr / 44100,
      fb = 0.7 + verb[0] * 0.28,
      wet = new Float32Array(x.length);
    for (const len of [1116, 1188, 1277, 1356]) {
      const L = Math.round(len * k),
        buf = new Float32Array(L);
      let j = 0,
        damp = 0;
      for (let i = 0; i < x.length; i++) {
        const y = buf[j];
        damp += 0.6 * (y - damp);
        buf[j] = x[i] + damp * fb;
        wet[i] += y / 4;
        j = (j + 1) % L;
      }
    }
    for (const len of [556, 441]) {
      const L = Math.round(len * k),
        buf = new Float32Array(L);
      let j = 0;
      for (let i = 0; i < x.length; i++) {
        const y = buf[j],
          v = wet[i];
        buf[j] = v + y * 0.5;
        wet[i] = y - v;
        j = (j + 1) % L;
      }
    }
    for (let i = 0; i < x.length; i++) x[i] += wet[i] * verb[1];
  }

  // DC blocker (20 Hz), output gain, trim the silent tail, fade the edges.
  const R = 1 - (TAU * 20) / sr,
    g = sound.gain ?? 1;
  let px = 0,
    py = 0,
    last = 0;
  for (let i = 0; i < x.length; i++) {
    py = x[i] - px + R * py;
    px = x[i];
    x[i] = py * g;
    if (Math.abs(x[i]) > 3e-4) last = i;
  }
  if (sound.limit) {
    // Look-ahead peak limiter (1.5 ms attack, 50 ms release, ceiling -1.5 dBFS): lets short,
    // spiky sounds reach their loudness without clipping.
    const gl = new Float32Array(x.length),
      A = sr * 0.0015,
      Rl = sr * 0.05;
    for (let i = x.length; i--; ) gl[i] = Math.min(0.84 / Math.max(Math.abs(x[i]), 1e-9), 1, i + 1 < x.length ? gl[i + 1] + 1 / A : 1);
    for (let i = 0; i < x.length; i++) x[i] *= gl[i] = Math.min(gl[i], i ? gl[i - 1] + 1 / Rl : 1);
  }
  x = x.slice(0, last + 1);
  const fade = Math.min(Math.round(sr * 0.005), x.length);
  for (let i = 0; i < fade; i++) x[x.length - 1 - i] *= i / fade;
  return x;
}
