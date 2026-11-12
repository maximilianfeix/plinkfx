import { describe, expect, test } from "vitest";
import { render, rng } from "../src/core/synth.ts";
import { wav } from "../src/core/wav.ts";
import { measure, centroid } from "../src/meter.ts";
import { get, names, play } from "../src/index.ts";

const sine = (f: number, amp: number, secs: number, sr = 48000) => {
  const x = new Float32Array(Math.round(secs * sr));
  for (let i = 0; i < x.length; i++) x[i] = amp * Math.sin((2 * Math.PI * f * i) / sr);
  return x;
};

describe("meter", () => {
  test("BS.1770: a 997 Hz full-scale sine reads -3.01 LUFS", () => {
    const m = measure(sine(997, 1, 3), 48000);
    expect(m.lufs).toBeCloseTo(-3.01, 1);
    expect(m.lufsMax).toBeCloseTo(-3.01, 1);
    expect(m.peak).toBeCloseTo(0, 1);
  });
  test("loudness scales with level", () => {
    expect(measure(sine(997, 0.1, 2), 48000).lufs).toBeCloseTo(-23.01, 1);
    expect(measure(sine(997, 0.1, 2, 44100), 44100).lufs).toBeCloseTo(-23.01, 1);
  });
  test("true peak finds inter-sample overs", () => {
    // fs/4 sine at 45 deg phase: samples sit at 0.707 of the real peak.
    const x = new Float32Array(4000).map((_, i) => Math.sin((Math.PI / 2) * i + Math.PI / 4));
    const m = measure(x, 48000);
    expect(m.peak).toBeCloseTo(-3.01, 1);
    expect(m.truePeak).toBeGreaterThan(-0.5);
  });
  test("centroid of a pure tone is near the tone", () => {
    expect(Math.abs(centroid(sine(2000, 0.5, 1), 48000) - 2000)).toBeLessThan(150);
  });
});

describe("synth", () => {
  test("rng is deterministic and uniform-ish", () => {
    const a = rng(42),
      b = rng(42),
      xs = Array.from({ length: 10000 }, () => a());
    expect(xs.slice(0, 5)).toEqual(Array.from({ length: 5 }, () => b()));
    const mean = xs.reduce((s, v) => s + v, 0) / xs.length;
    expect(mean).toBeGreaterThan(0.48);
    expect(mean).toBeLessThan(0.52);
  });
  test("sample rate changes length, not pitch", () => {
    const s = { layers: [{ freq: 1000, a: 0.01, h: 0.3, d: 0.1 }] };
    const a = render(s, { sampleRate: 22050 }),
      b = render(s, { sampleRate: 48000 });
    expect(a.length / 22050).toBeCloseTo(b.length / 48000, 2);
    expect(Math.abs(centroid(b, 48000) - 1000)).toBeLessThan(80);
  });
  test("every wave shape renders finite audio", () => {
    for (const wave of ["sine", "triangle", "square", "saw", "noise", "pink", "brown", "crunch", "metal"] as const) {
      const x = render({ layers: [{ wave, freq: 300, to: 900, lp: 3000, hp: 100, bp: 800, fm: [2, 1], drive: 1, d: 0.2 }], echo: [0.05, 0.4, 0.3], verb: [0.5, 0.3], bits: 8, rate: 11025 });
      expect(x.length).toBeGreaterThan(100);
      expect(x.every(Number.isFinite)).toBe(true);
    }
  });
});

describe("wav", () => {
  test("writes a valid 16-bit mono header", () => {
    const b = wav(new Float32Array([0, 0.5, -0.5, 1, -1]), 48000),
      v = new DataView(b.buffer);
    expect(new TextDecoder().decode(b.slice(0, 4))).toBe("RIFF");
    expect(v.getUint32(24, true)).toBe(48000);
    expect(v.getUint16(34, true)).toBe(16);
    expect(v.getUint32(40, true)).toBe(10);
    expect(v.getInt16(50, true)).toBe(32767);
    expect(b.length).toBe(54);
  });
});

describe("api", () => {
  test("get() accepts kebab and camel names", () => {
    expect(get("coin-double")).toBe(get("coinDouble"));
    expect(() => get("nope")).toThrow(/no sound called/);
  });
  test("names round-trip", () => {
    expect(names).toContain("coin-double");
    for (const n of names) expect(get(n)).toBeDefined();
  });
  test("play() needs a browser AudioContext", () => {
    expect(() => play("coin")).toThrow();
  });
});
