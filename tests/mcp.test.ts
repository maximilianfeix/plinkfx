import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

// Spawns `plinkfx mcp` and talks newline-delimited JSON-RPC to it, like an MCP client does.
let proc: ChildProcessWithoutNullStreams;
const waiting = new Map<number | string | null, (m: any) => void>(),
  stray: any[] = [];
let buf = "",
  next = 1;
const send = (msg: object) => proc.stdin.write(JSON.stringify(msg) + "\n");
const request = (method: string, params?: object): Promise<any> => {
  const id = next++;
  return new Promise((ok) => {
    waiting.set(id, ok);
    send({ jsonrpc: "2.0", id, method, ...(params ? { params } : {}) });
  });
};
const raw = (line: string): Promise<any> =>
  new Promise((ok) => {
    waiting.set(null, ok);
    proc.stdin.write(line + "\n");
  });
const call = (name: string, args: object) => request("tools/call", { name, arguments: args });
const dir = mkdtempSync(join(tmpdir(), "plinkfx-mcp-"));

beforeAll(() => {
  proc = spawn(process.execPath, ["src/cli.ts", "mcp"], { stdio: ["pipe", "pipe", "pipe"] });
  proc.stdout.setEncoding("utf8");
  proc.stdout.on("data", (d: string) => {
    buf += d;
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i);
      buf = buf.slice(i + 1);
      const m = JSON.parse(line); // every stdout line must be one JSON message
      const cb = waiting.get(m.id);
      if (cb) waiting.delete(m.id), cb(m);
      else stray.push(m);
    }
  });
});
afterAll(() => proc.kill());

describe("mcp server", () => {
  test("handshake: initialize, initialized, ping, tools/list", async () => {
    const init = await request("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "test", version: "0" } });
    expect(init.result.protocolVersion).toBe("2025-06-18");
    expect(init.result.serverInfo.name).toBe("plinkfx");
    expect(init.result.serverInfo.version).toBe(JSON.parse(readFileSync("package.json", "utf8")).version);
    expect(init.result.capabilities.tools).toBeDefined();
    send({ jsonrpc: "2.0", method: "notifications/initialized" });
    expect((await request("ping")).result).toEqual({});
    const { tools } = (await request("tools/list")).result;
    expect(tools.map((t: any) => t.name)).toEqual(["list_sounds", "show_sound", "render_sound", "measure_sound", "check_sound"]);
    for (const t of tools) {
      expect(t.description.length).toBeGreaterThan(20);
      expect(t.inputSchema.type).toBe("object");
    }
    // the notification got no answer
    expect(stray).toEqual([]);
  });

  test("an older client gets its own protocol version back", async () => {
    expect((await request("initialize", { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "old", version: "0" } })).result.protocolVersion).toBe("2024-11-05");
  });

  test("list_sounds searches category and words", async () => {
    const r = (await call("list_sounds", { category: "mechanic", query: "door" })).result;
    expect(r.isError).toBeFalsy();
    expect(r.structuredContent.sounds.length).toBeGreaterThan(0);
    for (const s of r.structuredContent.sounds) {
      expect(s.cat).toBe("mechanic");
      expect(`${s.name} ${s.desc}`.toLowerCase()).toContain("door");
    }
    expect(r.content[0].text).toMatch(/door-heavy \(mechanic\)/);
  });

  test("show_sound returns the recipe", async () => {
    const r = (await call("show_sound", { name: "coin" })).result;
    expect(r.structuredContent.sound.layers.length).toBeGreaterThan(0);
    expect(JSON.parse(r.content[0].text)).toEqual(r.structuredContent.sound);
  });

  test("render_sound writes a WAV and a PNG for an inline recipe", async () => {
    const path = join(dir, "blip.wav");
    const r = (await call("render_sound", { sound: { layers: [{ wave: "square", freq: 880, d: 0.15 }], gain: 0.3 }, path, png: true })).result;
    expect(r.isError, r.content[0].text).toBeFalsy();
    expect(r.structuredContent.path).toBe(path);
    expect(readFileSync(path).toString("ascii", 0, 4)).toBe("RIFF");
    expect(r.structuredContent.duration).toBeGreaterThan(0.1);
    expect(r.structuredContent.truePeak).toBeLessThan(0);
    expect(existsSync(join(dir, "blip.png"))).toBe(true);
    const img = r.content.find((c: any) => c.type == "image");
    expect(img.mimeType).toBe("image/png");
    expect(Buffer.from(img.data, "base64").subarray(1, 4).toString("ascii")).toBe("PNG");
  });

  test("measure_sound and check_sound", async () => {
    const m = (await call("measure_sound", { sound: "coin" })).result.structuredContent;
    expect(m.lufsMax).toBeCloseTo(-16, 0);
    const wavFile = join(dir, "coin.wav");
    await call("render_sound", { sound: "coin", path: wavFile });
    expect((await call("measure_sound", { wav: wavFile })).result.structuredContent.lufsMax).toBeCloseTo(m.lufsMax, 1);
    const ok = (await call("check_sound", { sound: "coin" })).result;
    expect(ok.structuredContent.ok).toBe(true);
    expect(ok.structuredContent.target).toBe(-16);
    // a hard square at full level clips, and is far off the ui target
    const bad = (await call("check_sound", { sound: { layers: [{ wave: "square", freq: 200, d: 0.3, gain: 3 }] }, category: "ui" })).result;
    expect(bad.isError).toBeFalsy();
    expect(bad.structuredContent.ok).toBe(false);
    expect(bad.structuredContent.issues.map((i: any) => i.check)).toEqual(expect.arrayContaining(["clipping", "true-peak", "loudness"]));
    expect(bad.content[0].text).toMatch(/^FAIL/);
  });

  test("errors: protocol errors vs tool errors", async () => {
    // unknown tool, bad arguments: JSON-RPC errors
    expect((await call("nope", {})).error.code).toBe(-32602);
    expect((await call("show_sound", {})).error.message).toMatch(/missing required argument "name"/);
    expect((await call("render_sound", { sound: "coin", variant: 9 })).error.code).toBe(-32602);
    expect((await call("render_sound", { sound: "coin", path: join(dir, "x.txt") })).error.message).toMatch(/\.wav/);
    expect((await call("list_sounds", { category: "nope" })).error.message).toMatch(/unknown category/);
    expect((await call("list_sounds", { bogus: 1 })).error.message).toMatch(/unknown argument "bogus"/);
    expect((await request("resources/list")).error.code).toBe(-32601);
    // problems the model can fix: tool results with isError
    const typo = (await call("show_sound", { name: "explsion" })).result;
    expect(typo.isError).toBe(true);
    expect(typo.content[0].text).toMatch(/Did you mean explosion/);
    const wave = (await call("render_sound", { sound: { layers: [{ wave: "sqare" }] } })).result;
    expect(wave.isError).toBe(true);
    expect(wave.content[0].text).toMatch(/unknown wave "sqare"/);
    expect((await call("check_sound", { wav: join(dir, "missing.wav") })).result.content[0].text).toMatch(/no such file/);
    // hostile recipes are rejected before anything is allocated
    for (const [sound, msg] of [
      [{ layers: [{ at: [1e9], d: 0.1 }] }, /"at" must be a number/],
      [{ layers: [{ d: [1, 2] }] }, /"d" must be a number/],
      [{ layers: [{ d: 0.1 }], echo: [2, 0.99999, 1] }, /"echo"\[1\] must be from 0 to 0.95/],
      [{ layers: [{ d: 0.1 }], echo: [1e6, 0.5, 1] }, /"echo"\[0\]/],
      [{ layers: [{ d: 0.1 }], verb: [1e9, 1] }, /"verb"\[0\]/],
      [{ layers: [{ d: 0.1 }], rate: 1e12 }, /"rate" must be/],
      [{ layers: [{ d: 25 }], verb: [1, 1], echo: [2, 0.95, 1] }, /would last .* s with its tails/],
      [{ layers: [{ wave: "pluck", freq: 1e-9 }] }, /"freq" must be/],
      [{ layers: [{ arp: [0, 12], arpRate: 0, loop: true }] }, /"arpRate"/],
    ] as const) {
      const r = (await call("render_sound", { sound, path: join(dir, "hostile.wav") })).result;
      expect(r.isError, JSON.stringify(sound)).toBe(true);
      expect(r.content[0].text).toMatch(msg);
    }
    expect((await call("render_sound", { sound: "coin", rate: 1e9 })).error.code).toBe(-32602);
    expect(existsSync(join(dir, "hostile.wav"))).toBe(false);
    // garbage and batches
    expect((await raw("{ not json")).error.code).toBe(-32700);
    expect((await raw("[]")).error.code).toBe(-32600);
  });
});
