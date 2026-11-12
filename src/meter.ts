/**
 * Measurements used to keep every sound in shape: peak, true peak, loudness
 * (ITU-R BS.1770 K-weighting), DC offset, duration and spectral centroid.
 * Not part of the 3 KB player; import from "plinkfx/meter".
 */
export interface Measurement {
  /** Sample peak in dBFS. */
  peak: number;
  /** 4x oversampled peak in dBTP. */
  truePeak: number;
  /** Integrated loudness in LUFS (gated, BS.1770-4). */
  lufs: number;
  /** Maximum momentary loudness (400 ms window) in LUFS. */
  lufsMax: number;
  /** Mean sample value; should be ~0. */
  dc: number;
  /** Seconds. */
  duration: number;
  /** Spectral centroid in Hz, a rough "brightness". */
  centroid: number;
}

const db = (x: number) => (x > 0 ? 20 * Math.log10(x) : -Infinity);

type Biquad = [number, number, number, number, number];
const biquad = (x: Float32Array | Float64Array, [b0, b1, b2, a1, a2]: Biquad) => {
  const y = new Float64Array(x.length);
  let x1 = 0,
    x2 = 0,
    y1 = 0,
    y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const v = b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1;
    x1 = x[i];
    y2 = y1;
    y1 = v;
    y[i] = v;
  }
  return y;
};

/** K-weighting filter coefficients for any sample rate (derived from the BS.1770 analog prototype). */
export function kWeighting(sr: number): [Biquad, Biquad] {
  let K = Math.tan((Math.PI * 1681.974450955533) / sr);
  const Q = 0.7071752369554196,
    Vh = 10 ** (3.999843853973347 / 20),
    Vb = Vh ** 0.4996667741545416;
  let a0 = 1 + K / Q + K * K;
  const shelf: Biquad = [(Vh + (Vb * K) / Q + K * K) / a0, (2 * (K * K - Vh)) / a0, (Vh - (Vb * K) / Q + K * K) / a0, (2 * (K * K - 1)) / a0, (1 - K / Q + K * K) / a0];
  K = Math.tan((Math.PI * 38.13547087602444) / sr);
  const Q2 = 0.5003270373238773;
  a0 = 1 + K / Q2 + K * K;
  const hp: Biquad = [1, -2, 1, (2 * (K * K - 1)) / a0, (1 - K / Q2 + K * K) / a0];
  return [shelf, hp];
}

const loudness = (ms: number) => -0.691 + 10 * Math.log10(ms || 1e-20);

export function measure(x: Float32Array, sr = 44100): Measurement {
  let peak = 0,
    sum = 0;
  for (const v of x) {
    peak = Math.max(peak, Math.abs(v));
    sum += v;
  }
  // True peak: 4x oversampling with a windowed-sinc interpolator.
  let tp = peak;
  const taps = 12;
  for (let i = 0; i < x.length - 1; i++) {
    // Inter-sample peaks only matter near the sample peak; skip quiet stretches.
    if (Math.max(Math.abs(x[i]), Math.abs(x[i + 1])) < peak * 0.6) continue;
    for (let p = 1; p < 4; p++) {
      const fr = p / 4;
      let acc = 0;
      for (let k = -taps + 1; k <= taps; k++) {
        const j = i + k;
        if (j < 0 || j >= x.length) continue;
        const t = fr - k,
          w = 0.5 + 0.5 * Math.cos((Math.PI * t) / taps);
        acc += x[j] * (t ? Math.sin(Math.PI * t) / (Math.PI * t) : 1) * w;
      }
      tp = Math.max(tp, Math.abs(acc));
    }
  }

  // Loudness: K-weight, then mean square over 400 ms blocks with 100 ms hop.
  // Sounds shorter than a block are measured inside one zero-padded block.
  const [s1, s2] = kWeighting(sr),
    block = Math.round(sr * 0.4),
    hop = Math.round(sr * 0.1),
    padded = new Float32Array(Math.max(x.length, block));
  padded.set(x);
  const k = biquad(biquad(padded, s1), s2),
    blocks: number[] = [];
  for (let start = 0; start + block <= k.length; start += hop) {
    let e = 0;
    for (let i = start; i < start + block; i++) e += k[i] * k[i];
    blocks.push(e / block);
  }
  const lufsMax = loudness(Math.max(...blocks));
  const abs = blocks.filter((b) => loudness(b) > -70),
    rel = abs.length ? loudness(abs.reduce((a, b) => a + b, 0) / abs.length) - 10 : -70,
    gated = abs.filter((b) => loudness(b) > rel),
    lufs = gated.length ? loudness(gated.reduce((a, b) => a + b, 0) / gated.length) : -Infinity;

  return { peak: db(peak), truePeak: db(tp), lufs, lufsMax, dc: x.length ? sum / x.length : 0, duration: x.length / sr, centroid: centroid(x, sr) };
}

/** Energy-weighted spectral centroid over Hann-windowed 1024-sample frames. */
export function centroid(x: Float32Array, sr = 44100): number {
  const N = 1024,
    re = new Float64Array(N),
    im = new Float64Array(N);
  let num = 0,
    den = 0;
  for (let start = 0; start < Math.max(x.length - N / 2, 1); start += N / 2) {
    for (let i = 0; i < N; i++) {
      re[i] = (x[start + i] || 0) * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (N - 1)));
      im[i] = 0;
    }
    fft(re, im);
    for (let b = 1; b < N / 2; b++) {
      const m = Math.hypot(re[b], im[b]);
      num += m * ((b * sr) / N);
      den += m;
    }
  }
  return den ? num / den : 0;
}

/** In-place radix-2 FFT. */
export function fft(re: Float64Array, im: Float64Array) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len,
      wr = Math.cos(ang),
      wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1,
        ci = 0;
      for (let j = 0; j < len / 2; j++) {
        const a = i + j,
          b = a + len / 2,
          tr = re[b] * cr - im[b] * ci,
          ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr;
        im[b] = im[a] - ti;
        re[a] += tr;
        im[a] += ti;
        [cr, ci] = [cr * wr - ci * wi, cr * wi + ci * wr];
      }
    }
  }
}
