import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
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
});
