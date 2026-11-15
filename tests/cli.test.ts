import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { audit } from "../src/audit.ts";
import { catalog, seconds, soundOf, unwrap } from "../src/shared.ts";

const dir = mkdtempSync(join(tmpdir(), "plinkfx-cli-"));
const run = (...args: string[]) => {
  try {
    return { code: 0, out: execFileSync(process.execPath, ["src/cli.ts", ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }) };
  } catch (e: any) {
    return { code: e.status as number, out: String(e.stderr) + String(e.stdout) };
  }
};
const file = (name: string, body: string) => {
  const p = join(dir, name);
  writeFileSync(p, body);
  return p;
};

describe("cli", () => {
  test("negative values after a flag (--target -16)", () => {
    const f = file("a.json", JSON.stringify({ layers: [{ freq: 600, d: 0.2 }] }));
    const r = run("level", f, "--target", "-16");
    expect(r.code).toBe(0);
    expect(r.out).toMatch(/target -16\.0/);
    expect(JSON.parse(readFileSync(f, "utf8")).gain).toBeGreaterThan(0);
  });
  test("one-line errors, no stack traces", () => {
    for (const [args, msg] of [
      [["render", file("bad.json", "{ nope")], /not valid JSON/],
      [["measure", join(dir, "missing.wav")], /no such file/],
      [["render", "coin", "-o", join(dir, "no/such/dir/x.wav")], /folder doesn't exist/],
      [["render", "coin", "--rate", "abc"], /--rate must be a number/],
      [["render", "coin", "--rate", "0"], /--rate must be a number/],
      [["render", file("w.json", JSON.stringify({ layers: [{ wave: "sqare" }] }))], /unknown wave "sqare"/],
      [["render", "coin", "--bogus"], /unknown option --bogus/],
      [["render", "explsion"], /Did you mean explosion/],
      [["export", join(dir, "x"), "--sprite", "--only", "pickup,nope"], /unknown category "nope"/],
      [["export", join(dir, "x"), "--gap", "0.2"], /--gap only works with --sprite/],
      [["export", join(dir, "x"), "--sprite", "--gap", "-1"], /--gap must be a number/],
    ] as const) {
      const r = run(...args);
      expect(r.code, args.join(" ")).toBe(1);
      expect(r.out).toMatch(msg);
      expect(r.out).not.toMatch(/at .*\(node:/);
    }
  });
  test("render names takes like export (take 0 = name.wav, take 1 = name-2.wav)", () => {
    const out = run("render", "coin", "--variant", "1", "-o", join(dir, "c.wav"));
    expect(out.code).toBe(0);
    const r = execFileSync(process.execPath, [join(process.cwd(), "src/cli.ts"), "render", "coin", "--variant", "1"], { cwd: dir, encoding: "utf8" });
    expect(r).toMatch(/^coin-2\.wav/);
  });
  test("--version matches package.json", () => {
    expect(run("--version").out.trim()).toBe(JSON.parse(readFileSync("package.json", "utf8")).version);
  });
  test("export --sprite: WAV + Howler and Phaser maps that agree with the audio", () => {
    const out = join(dir, "sprite"),
      catalog = JSON.parse(readFileSync("library/catalog.gen.json", "utf8")).sounds as { name: string; cat: string }[],
      want = catalog.filter((s) => s.cat == "pickup" || s.cat == "ui").map((s) => s.name);
    const r = run("export", out, "--sprite", "--only", "pickup,ui", "--rate", "44100", "--gap", "0.25");
    expect(r.code, r.out).toBe(0);
    for (const f of ["plinkfx-sprite.wav", "plinkfx-sprite.json", "plinkfx-sprite.phaser.json"]) expect(existsSync(join(out, f)), f).toBe(true);
    expect(existsSync(join(out, "plinkfx-sprite.ogg"))).toBe(false);

    const w = readFileSync(join(out, "plinkfx-sprite.wav")),
      sr = w.readUInt32LE(24),
      seconds = w.readUInt32LE(40) / 2 / sr,
      howler = JSON.parse(readFileSync(join(out, "plinkfx-sprite.json"), "utf8")) as Record<string, [number, number]>,
      phaser = JSON.parse(readFileSync(join(out, "plinkfx-sprite.phaser.json"), "utf8"));
    expect(sr).toBe(44100);
    expect(Object.keys(howler)).toEqual(want);
    expect(Object.keys(phaser.spritemap)).toEqual(want);
    expect(phaser.resources).toEqual(["plinkfx-sprite.wav"]);

    const entries = want.map((n) => howler[n]);
    expect(entries[0][0]).toBe(0);
    for (let i = 0; i < entries.length; i++) {
      const [off, dur] = entries[i],
        p = phaser.spritemap[want[i]];
      expect(dur).toBeGreaterThan(0);
      expect(p.start * 1000).toBeCloseTo(off, 2);
      expect((p.end - p.start) * 1000).toBeCloseTo(dur, 2);
      expect(p.loop).toBe(false);
      // back to back, separated by the gap
      if (i) expect(off - (entries[i - 1][0] + entries[i - 1][1])).toBeCloseTo(250, 1);
    }
    const [lastOff, lastDur] = entries[entries.length - 1];
    expect((lastOff + lastDur) / 1000).toBeCloseTo(seconds, 4);
  });
  test("export --sprite defaults to every sound in the catalogue", () => {
    const out = join(dir, "sprite-all");
    expect(run("export", out, "--sprite").code).toBe(0);
    const names = JSON.parse(readFileSync("library/catalog.gen.json", "utf8")).sounds.map((s: { name: string }) => s.name);
    expect(Object.keys(JSON.parse(readFileSync(join(out, "plinkfx-sprite.json"), "utf8")))).toEqual(names);
    expect(Object.keys(JSON.parse(readFileSync(join(out, "plinkfx-sprite.phaser.json"), "utf8")).spritemap)).toEqual(names);
  });
  test("render --png draws a waveform + spectrogram PNG", () => {
    const png = join(dir, "coin.png");
    const r = run("render", "coin", "-o", join(dir, "coin.wav"), "--png", png);
    expect(r.code, r.out).toBe(0);
    const b = readFileSync(png);
    expect(b.subarray(1, 4).toString("ascii")).toBe("PNG");
    expect([b.readUInt32BE(16), b.readUInt32BE(20)]).toEqual([800, 360]);
    expect(run("render", "coin", "--png", join(dir, "x.jpg")).out).toMatch(/--png needs a file name ending in .png/);
  });
  test("inline recipes accept every wave (modal, pluck)", () => {
    const r = run("render", JSON.stringify({ layers: [{ wave: "modal", freq: 300, d: 0.2, gain: 0.2 }, { wave: "pluck", freq: 220, d: 0.3, gain: 0.2 }] }), "-o", join(dir, "m.wav"));
    expect(r.code, r.out).toBe(0);
  });
  test("check --all passes on the catalogue", () => {
    const r = run("check", "--all", "--json");
    expect(r.code, r.out).toBe(0);
    const j = JSON.parse(r.out);
    expect(j.ok).toBe(true);
    expect(j.sounds.length).toBe(JSON.parse(readFileSync("library/catalog.gen.json", "utf8")).sounds.length);
  }, 180_000);
  test("check fails a clipping sound with exit 1 and names the problems", () => {
    const f = file("loud.json", JSON.stringify({ layers: [{ wave: "square", freq: 200, d: 0.3, gain: 3 }] }));
    const r = run("check", f, "--cat", "ui");
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/FAIL\s+loud/);
    expect(r.out).toMatch(/fail: clipping/);
    expect(r.out).toMatch(/fail: loudness: .* off the -20 target/);
    expect(run("check").out).toMatch(/name the sounds to check, or use --all/);
    expect(run("check", "coin", "--cat", "nope").out).toMatch(/unknown category "nope"/);
  });
});

test("every catalogue recipe passes the recipe checks, and seconds() matches the render", async () => {
  const { render } = await import("../src/core/synth.ts");
  for (const { name } of catalog().sounds) {
    const s = JSON.parse(JSON.stringify(soundOf(name)));
    expect(() => unwrap(s), name).not.toThrow();
    for (const seed of [0, 3]) expect(render(s, { sampleRate: 8000, seed }).length / 8000, name).toBeLessThanOrEqual(seconds(s) + 1 / 8000);
  }
});

describe("audit", () => {
  const sr = 48000,
    tone = (sec: number, f = 440, amp = 0.5) => Float32Array.from({ length: Math.round(sec * sr) }, (_, i) => amp * Math.sin((2 * Math.PI * f * i) / sr)),
    fade = (x: Float32Array, a = 0.005, d = 0.1) => x.map((v, i) => v * Math.min(1, i / (a * sr)) * Math.min(1, (x.length - 1 - i) / (d * sr))),
    checks = (x: Float32Array, target?: number) => audit([x], sr, target).issues.map((i) => `${i.level}:${i.check}`);
  test("a clean tone passes", () => {
    expect(checks(fade(tone(0.3)))).toEqual([]);
  });
  test("clicks at the edges and a cut tail", () => {
    const x = tone(0.3);
    x[0] = 0.4;
    expect(checks(x)).toEqual(expect.arrayContaining(["fail:start-click", "fail:end-click", "fail:tail-cut"]));
    // a cut followed by a 5 ms fade still counts as cut, and has no end click
    const y = fade(tone(0.3), 0.005, 0.005);
    expect(checks(y)).toEqual(["fail:tail-cut"]);
  });
  test("DC, clipping, true peak, padding, loudness", () => {
    expect(checks(fade(tone(0.3)).map((v, i, a) => v + (i > 240 && i < a.length - 4800 ? 0.05 : 0)))).toContain("fail:dc");
    expect(checks(fade(tone(0.3, 440, 1.5)).map((v) => Math.max(-1, Math.min(1, v))))).toEqual(expect.arrayContaining(["fail:clipping", "fail:true-peak"]));
    expect(checks(fade(tone(0.3, 440, 0.95)))).toEqual(["warn:true-peak"]);
    const late = new Float32Array(sr * 0.5);
    late.set(fade(tone(0.3)), sr * 0.15);
    expect(checks(late)).toContain("fail:lead-silence");
    const quiet = fade(tone(0.3, 440, 0.01));
    expect(checks(quiet, -16)).toEqual(["fail:loudness"]);
    expect(checks(new Float32Array(100))).toEqual(["fail:empty"]);
  });
  test("loops: full-level edges are fine, a jump at the wrap is not", () => {
    const loopChecks = (x: Float32Array) => audit([x], sr, undefined, true).issues.map((i) => `${i.level}:${i.check}`);
    // 440 Hz for exactly 1 s: whole cycles, the last sample runs into the first.
    expect(loopChecks(tone(1))).toEqual([]);
    // cut mid-cycle: the wrap jumps
    expect(loopChecks(tone(1.0011))).toEqual(["fail:loop-click"]);
    const r = run("check", "rain-loop", "engine-idle");
    expect(r.code, r.out).toBe(0);
  });
});
