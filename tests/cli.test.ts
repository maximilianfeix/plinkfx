import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

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
});
