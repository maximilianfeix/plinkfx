/**
 * Every sound in the catalogue, every take: deterministic, inside its loudness
 * band, never over -1 dBTP, no DC, clean start and end, takes that differ.
 * Run with UPDATE_HASHES=1 to accept new renders after changing a sound on purpose.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { afterAll, describe, expect, test } from "vitest";
import { CATEGORIES, library } from "../library/index.ts";
import * as gen from "../src/sounds.gen.ts";
import { render } from "../src/core/synth.ts";
import type { Sound } from "../src/core/types.ts";
import { measure } from "../src/meter.ts";
import catalog from "../library/catalog.gen.json" with { type: "json" };

const SR = 44100,
  TAKES = 4,
  HASHES = "tests/hashes.json",
  update = !!process.env.UPDATE_HASHES,
  stored: Record<string, string[]> = existsSync(HASHES) ? JSON.parse(readFileSync(HASHES, "utf8")) : {},
  fresh: Record<string, string[]> = {};
const camel = (s: string) => s.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
const hash = (x: Float32Array) => {
  const pcm = new Int16Array(x.length);
  for (let i = 0; i < x.length; i++) pcm[i] = Math.round(Math.max(-1, Math.min(1, x[i])) * 32767);
  return createHash("sha256").update(new Uint8Array(pcm.buffer)).digest("hex").slice(0, 16);
};

test("catalogue has at least 120 sounds in at least 10 categories", () => {
  expect(library.length).toBeGreaterThanOrEqual(120);
  expect(new Set(library.map((e) => e.cat)).size).toBeGreaterThanOrEqual(10);
});

test("generated code is in sync with library/ (run npm run bake)", () => {
  expect(catalog.sounds.map((s) => s.name)).toEqual(library.map((e) => e.name));
  for (const e of library) {
    const s = (gen as unknown as Record<string, Sound>)[camel(e.name)];
    expect(s, e.name).toBeDefined();
    expect({ ...s, gain: undefined, limit: undefined }, e.name).toEqual({ ...e.sound, gain: undefined, limit: undefined });
  }
});

describe.each(library.map((e) => [e.name, e] as const))("%s", (name, e) => {
  const sound = (gen as unknown as Record<string, Sound>)[camel(name)],
    target = CATEGORIES[e.cat].target,
    takes = Array.from({ length: TAKES }, (_, seed) => render(sound, { sampleRate: SR, seed }));

  test("deterministic: same params + seed give the same samples", () => {
    expect(hash(render(sound, { sampleRate: SR, seed: 2 }))).toBe(hash(takes[2]));
    fresh[name] = takes.map(hash);
    if (!update && stored[name]) expect(fresh[name]).toEqual(stored[name]);
  });

  test("levels: true peak <= -1 dBTP, loudness in band, no DC, sane length", () => {
    for (const x of takes) {
      const m = measure(x, SR);
      expect(m.truePeak).toBeLessThanOrEqual(-1);
      expect(m.lufsMax).toBeLessThanOrEqual(target + 1.5);
      // Short transients are peak-normalised and may sit below the target, but not far.
      expect(m.lufsMax).toBeGreaterThanOrEqual(target - 10);
      // In a 0.2 s thump the mean is the thump itself, not an offset; check DC on longer sounds.
      if (m.duration > 0.3) expect(Math.abs(m.dc)).toBeLessThan(0.002);
      expect(m.duration).toBeGreaterThan(0.005);
      expect(m.duration).toBeLessThan(4);
    }
    // Sounds that are not peak-limited: every take within 1.5 LU of the category target, the average within 0.5.
    if (!catalog.sounds.find((s) => s.name == name)!.limited) {
      const l = takes.map((x) => measure(x, SR).lufsMax);
      for (const v of l) expect(Math.abs(v - target)).toBeLessThanOrEqual(1.5);
      expect(Math.abs(l.reduce((a, b) => a + b, 0) / TAKES - target)).toBeLessThanOrEqual(0.5);
    }
  });

  test.runIf(!sound.loop)("click-free edges", () => {
    for (const x of takes) {
      expect(Math.abs(x[0])).toBeLessThan(0.05);
      expect(Math.abs(x[x.length - 1])).toBeLessThan(0.001);
      expect(Number.isFinite(x.reduce((a, b) => a + b, 0))).toBe(true);
    }
  });

  // A loop wraps from its last sample to its first: that step must look like any other step in the
  // sound (below its 99.9th percentile), and the level must not dip or swell across the crossfade.
  test.runIf(!!sound.loop)("seamless loop: no click or level jump at the wrap", () => {
    for (const sr of [SR, 48000])
      for (let seed = 0; seed < TAKES; seed++) {
        const x = sr == SR ? takes[seed] : render(sound, { sampleRate: sr, seed }),
          n = x.length,
          steps = Float32Array.from({ length: n - 1 }, (_, i) => Math.abs(x[i + 1] - x[i])).sort();
        expect(n / sr).toBeCloseTo(3, 2);
        expect(Math.abs(x[0] - x[n - 1]), `take ${seed} at ${sr} Hz`).toBeLessThan(steps[Math.floor(n * 0.999)]);
        // RMS in 50 ms windows over two loops back to back: around the wrap within 3 dB of the median.
        const W = Math.round(sr * 0.05),
          two = new Float32Array(2 * n),
          db: number[] = [];
        two.set(x), two.set(x, n);
        for (let i = 0; i + W <= two.length; i += W) db.push(10 * Math.log10(two.subarray(i, i + W).reduce((a, v) => a + v * v, 0) / W));
        const med = [...db].sort((a, b) => a - b)[db.length >> 1],
          w = Math.floor(n / W);
        for (const v of db.slice(w - 2, w + 8)) expect(Math.abs(v - med), `take ${seed} at ${sr} Hz`).toBeLessThan(3);
      }
  });

  test("takes are variations, not copies", () => {
    expect(new Set(takes.map(hash)).size).toBe(TAKES);
  });
});

afterAll(() => {
  if (update) writeFileSync(HASHES, JSON.stringify(fresh, null, 1) + "\n");
});
