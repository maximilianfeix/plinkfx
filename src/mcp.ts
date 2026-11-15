/**
 * `plinkfx mcp`: a Model Context Protocol server on stdio (JSON-RPC 2.0, one message per line,
 * spec 2025-06-18). No dependencies. Tools: list_sounds, show_sound, render_sound, measure_sound, check_sound.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { createInterface } from "node:readline";
import { wav } from "./core/wav.ts";
import { measure, type Measurement } from "./meter.ts";
import { audit } from "./audit.ts";
import { picture } from "./png.ts";
import { catalog, load, readWav, renderChecked } from "./shared.ts";

const PROTOCOLS = ["2025-06-18", "2025-03-26", "2024-11-05"];

/** Bad arguments: answered as a JSON-RPC error (-32602). */
class ArgError extends Error {}

type Args = Record<string, unknown>;
interface Tool {
  name: string;
  title: string;
  description: string;
  inputSchema: object;
  run: (a: Args) => { text: string; data?: object; png?: Buffer };
}

const r2 = (x: number) => (Number.isFinite(x) ? Math.round(x * 100) / 100 : null);
const tidy = (m: Measurement) => ({
  duration: r2(m.duration),
  lufsMax: r2(m.lufsMax),
  lufs: r2(m.lufs),
  peak: r2(m.peak),
  truePeak: r2(m.truePeak),
  centroid: Math.round(m.centroid),
  dc: Number(m.dc.toExponential(2)),
});
const line = (m: Measurement) => `${m.duration.toFixed(3)} s, ${m.lufsMax.toFixed(1)} LUFS (max momentary), true peak ${m.truePeak.toFixed(1)} dBTP, centroid ${Math.round(m.centroid)} Hz`;

// ---- argument checks ----
const str = (a: Args, k: string, required = false) => {
  const v = a[k];
  if (v === undefined) {
    if (required) throw new ArgError(`missing required argument "${k}"`);
    return undefined;
  }
  if (typeof v != "string" || !v.trim()) throw new ArgError(`"${k}" must be a non-empty string`);
  return v;
};
const int = (a: Args, k: string, d: number, min: number, max: number) => {
  const v = a[k];
  if (v === undefined) return d;
  if (typeof v != "number" || !Number.isInteger(v) || v < min || v > max) throw new ArgError(`"${k}" must be an integer from ${min} to ${max}`);
  return v;
};
const soundArg = (a: Args, required = true) => {
  const v = a.sound;
  if (v === undefined) {
    if (required) throw new ArgError('missing required argument "sound" (a catalogue name or a recipe object)');
    return undefined;
  }
  if (typeof v == "string" && v.trim()) {
    // A name or JSON text; files are read through "wav" or by the CLI, not here.
    if (v.trim().endsWith(".json")) throw new ArgError('"sound" is a catalogue name or a recipe object; pass the file\'s JSON content instead of its path');
    return v;
  }
  if (v && typeof v == "object" && !Array.isArray(v)) return v;
  throw new ArgError('"sound" must be a catalogue name (string) or a recipe object ({ "layers": [...] })');
};
const outPath = (p: string | undefined, label: string, ext: string) => {
  const file = resolve(p ?? join(tmpdir(), "plinkfx", `${label}${ext}`));
  mkdirSync(dirname(file), { recursive: true });
  return file;
};
const categories = () => Object.keys(catalog().categories);
const targetOf = (a: Args, name?: string) => {
  const cats = catalog().categories,
    cat = str(a, "category") ?? catalog().sounds.find((s) => s.name == name)?.cat;
  if (a.target !== undefined) {
    if (typeof a.target != "number" || !Number.isFinite(a.target) || a.target > 0 || a.target < -60) throw new ArgError('"target" must be a loudness in LUFS from -60 to 0');
    return a.target;
  }
  if (cat === undefined) return undefined;
  if (!cats[cat]) throw new ArgError(`unknown category "${cat}" (one of: ${Object.keys(cats).join(", ")})`);
  return cats[cat].target;
};

const SOUND = {
  description: 'A catalogue name ("coin") or a recipe object ({ "layers": [{ "wave": "square", "freq": 988, "d": 0.3 }] }). See show_sound for examples.',
  oneOf: [{ type: "string" }, { type: "object", properties: { layers: { type: "array", items: { type: "object" } } }, required: ["layers"] }],
};
const VARIANT = { type: "integer", minimum: 0, maximum: 3, description: "Take 0-3 (default 0). Takes vary slightly in pitch and level." };
const RATE = { type: "integer", minimum: 8000, maximum: 192000, description: "Sample rate in Hz (default 48000)." };

const TOOLS: Tool[] = [
  {
    name: "list_sounds",
    title: "List sounds",
    description: "Search the plinkfx catalogue of CC0 game sound effects by category and/or a word in the name or description. Returns name, category, description, duration and loudness.",
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", description: "One category: ui, pickup, jump, hit, explosion, powerup, shoot, footstep, magic, alert, jingle, mechanic, world, creature, nature." },
        query: { type: "string", description: 'Words to match in the name or description, e.g. "door" or "soft click".' },
        limit: { type: "integer", minimum: 1, maximum: 500, description: "Most results to return (default 50)." },
      },
      additionalProperties: false,
    },
    run(a) {
      const cat = str(a, "category"),
        q = str(a, "query")?.toLowerCase().split(/\s+/).filter(Boolean) ?? [],
        limit = int(a, "limit", 50, 1, 500);
      if (cat && !categories().includes(cat)) throw new ArgError(`unknown category "${cat}" (one of: ${categories().join(", ")})`);
      const all = catalog().sounds.filter((s) => (!cat || s.cat == cat) && q.every((w) => `${s.name} ${s.desc}`.toLowerCase().includes(w))),
        rows = all.slice(0, limit);
      return {
        text: rows.length ? rows.map((s) => `${s.name} (${s.cat}): ${s.desc}`).join("\n") + (all.length > rows.length ? `\n... ${all.length - rows.length} more` : "") : "No sounds match. Try a broader query or another category.",
        data: { total: all.length, sounds: rows },
      };
    },
  },
  {
    name: "show_sound",
    title: "Show a sound's recipe",
    description: "The JSON recipe of a catalogue sound (layers, envelopes, filters, effects). Copy it, change it, and pass the object to render_sound or check_sound.",
    inputSchema: { type: "object", properties: { name: { type: "string", description: 'Catalogue name, e.g. "door-heavy".' } }, required: ["name"], additionalProperties: false },
    run(a) {
      const name = str(a, "name", true)!,
        { sound } = load(name),
        entry = catalog().sounds.find((s) => s.name == name);
      return { text: JSON.stringify(sound, null, 2), data: { name, category: entry?.cat, description: entry?.desc, sound } };
    },
  },
  {
    name: "render_sound",
    title: "Render a sound to WAV",
    description: "Render a catalogue sound or a recipe to a mono 16-bit WAV file and measure it. Returns the file path and loudness, peak, duration and brightness. With png: true it also writes a waveform + spectrogram PNG next to the WAV and returns the image.",
    inputSchema: {
      type: "object",
      properties: {
        sound: SOUND,
        path: { type: "string", description: "Where to write the .wav (absolute, or relative to the server's working directory). Default: a file in the system temp folder." },
        variant: VARIANT,
        rate: RATE,
        png: { type: "boolean", description: "Also write <path>.png (waveform + log spectrogram) and return it as an image." },
      },
      required: ["sound"],
      additionalProperties: false,
    },
    run(a) {
      const input = soundArg(a)!,
        seed = int(a, "variant", 0, 0, 3),
        sr = int(a, "rate", 48000, 8000, 192000),
        path = str(a, "path");
      if (path && !path.toLowerCase().endsWith(".wav")) throw new ArgError('"path" must end in .wav');
      if (a.png !== undefined && typeof a.png != "boolean") throw new ArgError('"png" must be true or false');
      const { sound, label } = load(input),
        out = outPath(path, `${label}${seed ? "-" + (seed + 1) : ""}`, ".wav"),
        x = renderChecked(sound, sr, seed),
        m = measure(x, sr);
      writeFileSync(out, wav(x, sr));
      let png: Buffer | undefined, pngPath: string | undefined;
      if (a.png) {
        png = picture(x, sr, `${label}  ${m.duration.toFixed(2)} s  ${m.lufsMax.toFixed(1)} lufs  ${m.truePeak.toFixed(1)} dbtp`);
        writeFileSync((pngPath = out.replace(/\.wav$/i, ".png")), png);
      }
      return { text: `Wrote ${out}${pngPath ? ` and ${pngPath}` : ""}: ${line(m)}.`, data: { path: out, png: pngPath, sampleRate: sr, variant: seed, ...tidy(m) }, png };
    },
  },
  {
    name: "measure_sound",
    title: "Measure a sound",
    description: "Loudness (max momentary and integrated LUFS, BS.1770), sample and true peak, duration, spectral centroid and DC of a catalogue sound, a recipe, or a WAV file.",
    inputSchema: {
      type: "object",
      properties: { sound: SOUND, wav: { type: "string", description: "Path to a WAV file to measure instead of a sound." }, variant: VARIANT, rate: RATE },
      additionalProperties: false,
    },
    run(a) {
      const m = measure(...samples(a));
      return { text: line(m), data: tidy(m) };
    },
  },
  {
    name: "check_sound",
    title: "Check a sound for problems",
    description:
      "Audit a catalogue sound, a recipe or a WAV file for clicks at the start or end, DC offset, a cut-off tail, clipping and true peak above -1 dBTP, silent padding, and loudness off the category target. Renders all 4 takes of a recipe. ok is false when any check fails.",
    inputSchema: {
      type: "object",
      properties: {
        sound: SOUND,
        wav: { type: "string", description: "Path to a WAV file to check instead of a sound." },
        category: { type: "string", description: "Judge loudness against this category's target. Catalogue sounds default to their own category." },
        target: { type: "number", description: "Judge loudness against this max momentary LUFS instead." },
        rate: RATE,
      },
      additionalProperties: false,
    },
    run(a) {
      const [takes, sr, name, loop] = takesOf(a),
        r = audit(takes, sr, targetOf(a, name), loop),
        head = r.ok ? "ok" : "FAIL";
      return {
        text: `${head}: ${line(r.m)}${r.target !== undefined ? `, target ${r.target} LUFS` : ""}${r.issues.map((i) => `\n${i.level}: ${i.check}: ${i.message}`).join("")}`,
        data: { ok: r.ok, issues: r.issues, target: r.target ?? null, lufsAvg: r2(r.lufsAvg), truePeakMax: r2(r.truePeak), ...tidy(r.m) },
      };
    },
  },
];

/** One take, from a WAV file or a rendered sound. */
function samples(a: Args): [Float32Array, number] {
  const file = str(a, "wav");
  if (file && a.sound !== undefined) throw new ArgError('pass either "sound" or "wav", not both');
  if (file) {
    const { x, sr } = readWav(resolve(file));
    return [x, sr];
  }
  const sr = int(a, "rate", 48000, 8000, 192000);
  return [renderChecked(load(soundArg(a)).sound, sr, int(a, "variant", 0, 0, 3)), sr];
}
/** Every take of a sound (or the one take of a WAV file), plus the catalogue name if any. */
function takesOf(a: Args): [Float32Array[], number, string | undefined, boolean] {
  const file = str(a, "wav");
  if (file && a.sound !== undefined) throw new ArgError('pass either "sound" or "wav", not both');
  if (file) {
    const { x, sr } = readWav(resolve(file));
    return [[x], sr, undefined, false];
  }
  const sr = int(a, "rate", 48000, 8000, 192000),
    { sound, name } = load(soundArg(a));
  return [[0, 1, 2, 3].map((seed) => renderChecked(sound, sr, seed)), sr, name, !!sound.loop];
}

/** Handle one parsed message; returns the response, or undefined for notifications. */
export function handle(msg: any, version: string): object | undefined {
  const reply = (result: object) => ({ jsonrpc: "2.0", id: msg.id, result });
  const error = (code: number, message: string, id = msg?.id ?? null) => ({ jsonrpc: "2.0", id, error: { code, message } });
  if (!msg || typeof msg != "object" || Array.isArray(msg)) return error(-32600, "Invalid Request: expected one JSON-RPC object (batches are not supported)", null);
  const isNote = !("id" in msg);
  if (msg.jsonrpc !== "2.0" || typeof msg.method != "string" || (!isNote && typeof msg.id != "string" && typeof msg.id != "number"))
    return isNote ? undefined : error(-32600, "Invalid Request");
  if (isNote) return undefined; // notifications/initialized, notifications/cancelled, ...
  const params = msg.params ?? {};
  switch (msg.method) {
    case "initialize": {
      const asked = params.protocolVersion;
      return reply({
        protocolVersion: PROTOCOLS.includes(asked) ? asked : PROTOCOLS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "plinkfx", title: "plinkfx", version },
        instructions:
          "plinkfx renders CC0 game sound effects locally. Search with list_sounds, read a recipe with show_sound, change it, then render_sound (png: true shows it) and check_sound. You can't hear: report the numbers and ask the user to listen.",
      });
    }
    case "ping":
      return reply({});
    case "tools/list":
      return reply({ tools: TOOLS.map(({ run, ...t }) => t) });
    case "tools/call": {
      const tool = TOOLS.find((t) => t.name == params.name);
      if (!tool) return error(-32602, `Unknown tool: ${params.name}`);
      const args = params.arguments ?? {};
      if (typeof args != "object" || Array.isArray(args)) return error(-32602, "arguments must be an object");
      const known = Object.keys((tool.inputSchema as any).properties);
      const extra = Object.keys(args).find((k) => !known.includes(k));
      if (extra) return error(-32602, `${tool.name}: unknown argument "${extra}" (known: ${known.join(", ") || "none"})`);
      try {
        const { text, data, png } = tool.run(args);
        const content: object[] = [{ type: "text", text }];
        if (png) content.push({ type: "image", data: png.toString("base64"), mimeType: "image/png" });
        return reply(data ? { content, structuredContent: data } : { content });
      } catch (e: any) {
        if (e instanceof ArgError) return error(-32602, `${tool.name}: ${e.message}`);
        // Errors the model can act on (unknown sound, bad recipe, missing file) are tool results.
        return reply({ content: [{ type: "text", text: String(e?.message ?? e) }], isError: true });
      }
    }
    default:
      return error(-32601, `Method not found: ${msg.method}`);
  }
}

/** Serve on stdin/stdout until stdin closes. Logs go to stderr; stdout carries only messages. */
export function serve(version: string) {
  const send = (o: object) => process.stdout.write(JSON.stringify(o) + "\n");
  const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
  rl.on("line", (l) => {
    if (!l.trim()) return;
    let msg: unknown;
    try {
      msg = JSON.parse(l);
    } catch {
      return send({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } });
    }
    try {
      const out = handle(msg, version);
      if (out) send(out);
    } catch (e: any) {
      send({ jsonrpc: "2.0", id: (msg as any)?.id ?? null, error: { code: -32603, message: `Internal error: ${e?.message ?? e}` } });
    }
  });
  console.error(`plinkfx ${version} MCP server on stdio`);
}
