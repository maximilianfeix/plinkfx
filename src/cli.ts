#!/usr/bin/env node
/**
 * plinkfx CLI. No network, no accounts: everything renders locally.
 *
 *   plinkfx list [category]
 *   plinkfx show <name>
 *   plinkfx render <name|file.json|'{json}'> [-o out.wav] [--variant n] [--rate 48000]
 *   plinkfx measure <name|file.json|file.wav> [--like <name>] [--json]
 *   plinkfx level <file.json> [--target -16 | --like <name>]
 *   plinkfx export [dir] [--format wav|ogg|both] [--rate 48000] [--variants]
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { get, names } from "./index.ts";
import { render } from "./core/synth.ts";
import { wav } from "./core/wav.ts";
import type { Sound } from "./core/types.ts";
import { measure, type Measurement } from "./meter.ts";
import * as all from "./sounds.gen.ts";

import pkg from "../package.json" with { type: "json" };

const VERSION = pkg.version;
const BOOL = ["json", "variants", "help", "version"],
  VALUE = ["out", "variant", "rate", "like", "target", "format"];
const die = (msg: string): never => {
  console.error(`plinkfx: ${msg}`);
  process.exit(1);
};
const argv = process.argv.slice(2),
  flags: Record<string, string | true> = {},
  pos: string[] = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a == "-o" || a == "-h" || a == "-v") {
    if (a == "-o") flags.out = argv[++i] ?? die("-o needs a file name");
    else flags[a == "-h" ? "help" : "version"] = true;
  } else if (a.startsWith("--")) {
    const eq = a.indexOf("="),
      k = eq < 0 ? a.slice(2) : a.slice(2, eq);
    if (!BOOL.includes(k) && !VALUE.includes(k)) die(`unknown option --${k}. Run 'plinkfx --help'.`);
    // Values may be negative numbers (--target -16), so only another --flag ends the value.
    flags[k] = eq >= 0 ? a.slice(eq + 1) : BOOL.includes(k) ? true : (argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : die(`--${k} needs a value`));
  } else pos.push(a);
}
const num = (k: string, d: number, min = -Infinity, max = Infinity) => {
  if (flags[k] === undefined) return d;
  const v = Number(flags[k]);
  if (!Number.isFinite(v) || v < min || v > max) die(`--${k} must be a number${min > -Infinity ? ` from ${min}` : ""}${max < Infinity ? ` to ${max}` : ""}, got "${flags[k]}"`);
  return v;
};
const WAVES = ["sine", "triangle", "square", "saw", "noise", "pink", "brown", "crunch", "metal"];
const parse = (text: string, where: string) => {
  try {
    return JSON.parse(text);
  } catch (e: any) {
    return die(`${where} is not valid JSON: ${e.message}`);
  }
};
const f1 = (x: number) => (Number.isFinite(x) ? x.toFixed(1) : "-inf");

/** A sound from a catalogue name, a JSON file or inline JSON. */
function load(arg: string | undefined): { sound: Sound; label: string } {
  if (!arg) die("missing sound (a name like 'coin', a .json file or inline JSON)");
  if (arg!.trim().startsWith("{")) return { sound: unwrap(parse(arg!, "the inline sound")), label: "inline" };
  if (arg!.endsWith(".json")) {
    if (!existsSync(arg!)) die(`no such file: ${arg}`);
    return { sound: unwrap(parse(readFileSync(arg!, "utf8"), arg!)), label: basename(arg!, ".json") };
  }
  try {
    return { sound: get(arg!), label: arg! };
  } catch (e: any) {
    return die(`${String(e.message).replace(/^plinkfx: /, "")}${/Did you mean/.test(e.message) ? "" : ". Run 'plinkfx list'."}`);
  }
}
const unwrap = (j: any): Sound => {
  const s = j?.sound ?? j;
  if (!s || !Array.isArray(s.layers) || !s.layers.length) die("a sound needs a non-empty 'layers' array");
  s.layers.forEach((l: any, i: number) => {
    if (l.wave && !WAVES.includes(l.wave)) die(`layer ${i + 1}: unknown wave "${l.wave}" (one of: ${WAVES.join(", ")})`);
  });
  return s;
};
const writeOut = (file: string, bytes: Uint8Array) => {
  try {
    writeFileSync(file, bytes);
  } catch (e: any) {
    die(`can't write ${file}: ${e.code == "ENOENT" ? "the folder doesn't exist" : e.message}`);
  }
};

/** Minimal WAV reader: 16/24/32-bit PCM or 32-bit float, mixed to mono. */
function readWav(file: string): { x: Float32Array; sr: number } {
  const b = readFileSync(file),
    v = new DataView(b.buffer, b.byteOffset, b.byteLength);
  if (b.toString("ascii", 0, 4) != "RIFF") die(`${file} is not a WAV file`);
  let o = 12,
    fmt = 1,
    ch = 1,
    sr = 44100,
    bits = 16;
  while (o < b.length - 8) {
    const id = b.toString("ascii", o, o + 4),
      size = v.getUint32(o + 4, true);
    if (id == "fmt ") {
      fmt = v.getUint16(o + 8, true);
      ch = v.getUint16(o + 10, true);
      sr = v.getUint32(o + 12, true);
      bits = v.getUint16(o + 22, true);
      if (fmt == 0xfffe) fmt = v.getUint16(o + 32, true);
    } else if (id == "data") {
      const bps = bits / 8,
        n = Math.floor(size / bps / ch),
        x = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        let s = 0;
        for (let c = 0; c < ch; c++) {
          const p = o + 8 + (i * ch + c) * bps;
          s +=
            fmt == 3 ? v.getFloat32(p, true) : bits == 16 ? v.getInt16(p, true) / 32768 : bits == 24 ? ((v.getUint8(p) | (v.getUint8(p + 1) << 8) | (v.getInt8(p + 2) << 16)) / 8388608) : v.getInt32(p, true) / 2147483648;
        }
        x[i] = s / ch;
      }
      return { x, sr };
    }
    o += 8 + size + (size & 1);
  }
  return die(`${file}: no audio data found`);
}

const report = (m: Measurement, ref?: Measurement) => {
  const row = (k: string, v: string, r?: string) => `  ${k.padEnd(10)} ${v.padStart(10)}${r ? `   (ref ${r})` : ""}`;
  return [
    row("duration", m.duration.toFixed(3) + " s", ref && ref.duration.toFixed(3) + " s"),
    row("loudness", f1(m.lufsMax) + " LUFS", ref && f1(ref.lufsMax) + " LUFS"),
    row("integr.", f1(m.lufs) + " LUFS", ref && f1(ref.lufs) + " LUFS"),
    row("peak", f1(m.peak) + " dBFS", ref && f1(ref.peak) + " dBFS"),
    row("true peak", f1(m.truePeak) + " dBTP", ref && f1(ref.truePeak) + " dBTP"),
    row("centroid", Math.round(m.centroid) + " Hz", ref && Math.round(ref.centroid) + " Hz"),
    row("dc", m.dc.toExponential(1), ref && ref.dc.toExponential(1)),
  ].join("\n");
};

/** ffmpeg arguments for Ogg Vorbis, or null without ffmpeg. libvorbis (mono) if built in, else the native encoder (stereo only). */
const vorbis = (): string[] | null => {
  try {
    const enc = execFileSync("ffmpeg", ["-hide_banner", "-encoders"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    if (/\blibvorbis\b/.test(enc)) return ["-c:a", "libvorbis", "-q:a", "6"];
    if (/\bvorbis\b/.test(enc)) return ["-c:a", "vorbis", "-strict", "-2", "-ac", "2", "-q:a", "6"];
  } catch {}
  return null;
};

const catalog = () => {
  try {
    return JSON.parse(readFileSync(new URL("../library/catalog.gen.json", import.meta.url), "utf8")).sounds as { name: string; cat: string; desc: string }[];
  } catch {
    try {
      return JSON.parse(readFileSync(new URL("./catalog.json", import.meta.url), "utf8")).sounds as { name: string; cat: string; desc: string }[];
    } catch {
      return names.map((name) => ({ name, cat: "", desc: "" }));
    }
  }
};

const cmd = pos.shift();
if (flags.version) console.log(VERSION);
else if (!cmd || flags.help || cmd == "help")
  console.log(`plinkfx ${VERSION}: game sound effects as code (sounds CC0, code MIT)

  plinkfx list [category]                     list sounds
  plinkfx show <name>                         print a sound's parameters as JSON
  plinkfx render <sound> [-o out.wav]         render to WAV
      --variant n   take 0-3 (default 0; files are named name-1..4 like export)
      --rate hz     sample rate (default 48000)
  plinkfx measure <sound|file.wav> [--like <name>] [--json]
                                              loudness, peaks, duration, brightness
  plinkfx level <file.json> [--target -16 | --like <name>]
                                              set the sound's gain: loudness on target, true peak <= -1 dBTP
  plinkfx export [dir] [--format wav|ogg|both] [--rate 48000] [--variants]
                                              write the whole library to disk

  <sound> is a name (coin), a .json file, or inline JSON ('{"layers":[...]}').
  Gallery: https://maximilianfeix.github.io/plinkfx/`);
else if (cmd == "list") {
  const cat = pos[0],
    rows = catalog().filter((s) => !cat || s.cat == cat);
  if (!rows.length) die(`no category "${cat}"`);
  const w = Math.max(...rows.map((r) => r.name.length));
  for (const r of rows) console.log(`${r.name.padEnd(w)}  ${r.cat.padEnd(9)}  ${r.desc}`);
} else if (cmd == "show") {
  console.log(JSON.stringify(load(pos[0]).sound, null, 2));
} else if (cmd == "render") {
  const { sound, label } = load(pos[0]),
    sr = num("rate", 48000, 8000, 192000),
    seed = num("variant", 0, 0),
    x = render(sound, { sampleRate: sr, seed }),
    // Same numbering as `export --variants`: take 0 is name-1.wav ... take 3 is name-4.wav.
    out = typeof flags.out == "string" ? flags.out : `${label}${seed ? "-" + (seed + 1) : ""}.wav`;
  writeOut(out, wav(x, sr));
  const m = measure(x, sr);
  console.log(`${out}  ${m.duration.toFixed(2)} s, ${f1(m.lufsMax)} LUFS, peak ${f1(m.truePeak)} dBTP`);
} else if (cmd == "measure") {
  const arg = pos[0];
  let m: Measurement;
  if (arg?.toLowerCase().endsWith(".wav")) {
    if (!existsSync(arg)) die(`no such file: ${arg}`);
    const { x, sr } = readWav(arg);
    m = measure(x, sr);
  } else {
    const sr = num("rate", 48000, 8000, 192000);
    m = measure(render(load(arg).sound, { sampleRate: sr, seed: num("variant", 0, 0) }), sr);
  }
  const ref = typeof flags.like == "string" ? measure(render(load(flags.like).sound, { sampleRate: 48000 }), 48000) : undefined;
  if (flags.json) console.log(JSON.stringify(ref ? { ...m, ref } : m, null, 2));
  else {
    console.log(report(m, ref));
    const warn: string[] = [];
    if (m.truePeak > -1) warn.push("true peak above -1 dBTP: lower the gain");
    if (Math.abs(m.dc) > 0.001) warn.push("DC offset: add a high-pass");
    if (m.duration > 4) warn.push("longer than 4 s: is this a loop, not an effect?");
    if (warn.length) console.log("\n  ! " + warn.join("\n  ! "));
  }
} else if (cmd == "level") {
  const file = pos[0];
  if (!file?.endsWith(".json") || !existsSync(file)) die("level needs a .json sound file");
  const raw = parse(readFileSync(file!, "utf8"), file!),
    sound = { ...unwrap(raw), gain: 1 },
    sr = 48000,
    target = typeof flags.like == "string" ? measure(render(load(flags.like).sound, { sampleRate: sr }), sr).lufsMax : num("target", -16),
    takes = [0, 1, 2, 3].map((seed) => measure(render(sound, { sampleRate: sr, seed }), sr)),
    avg = takes.reduce((a, m) => a + m.lufsMax, 0) / 4,
    tp = Math.max(...takes.map((m) => m.truePeak)),
    db = Math.min(target - avg, -1.2 - tp),
    gain = Number((10 ** (db / 20)).toPrecision(3));
  (raw.sound ?? raw).gain = gain;
  writeOut(file!, new TextEncoder().encode(JSON.stringify(raw, null, 2) + "\n"));
  const m = measure(render({ ...sound, gain }, { sampleRate: sr }), sr);
  console.log(`${file}: gain ${gain} -> ${f1(m.lufsMax)} LUFS (target ${f1(target)}), true peak ${f1(m.truePeak)} dBTP${target - avg > -1.2 - tp ? " (peak-limited)" : ""}`);
} else if (cmd == "export") {
  const dir = pos[0] || "plinkfx-sounds",
    sr = num("rate", 48000, 8000, 192000),
    fmt = String(flags.format || "wav"),
    takes = flags.variants ? 4 : 1,
    ogg = fmt != "wav" ? vorbis() : null;
  if (!["wav", "ogg", "both"].includes(fmt)) die(`unknown format "${fmt}" (wav, ogg or both)`);
  if (fmt != "wav" && !ogg) die("OGG export needs ffmpeg with a Vorbis encoder on your PATH (WAV works without it)");
  let n = 0;
  for (const s of catalog()) {
    const sound = (all as Record<string, Sound>)[s.name.replace(/-(\w)/g, (_, c) => c.toUpperCase())],
      sub = join(dir, s.cat || ".");
    mkdirSync(sub, { recursive: true });
    for (let seed = 0; seed < takes; seed++) {
      const base = join(sub, s.name + (takes > 1 ? `-${seed + 1}` : "")),
        bytes = wav(render(sound, { sampleRate: sr, seed }), sr);
      writeFileSync(base + ".wav", bytes);
      if (ogg) {
        try {
          execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", base + ".wav", ...ogg, base + ".ogg"], { stdio: ["ignore", "ignore", "pipe"] });
        } catch (e: any) {
          die(`ffmpeg failed on ${base}.ogg: ${String(e.stderr || e.message).trim().split("\n")[0]}`);
        }
        if (fmt == "ogg") unlinkSync(base + ".wav");
      }
      n++;
    }
  }
  console.log(`wrote ${n} sounds to ${dir}/ (${fmt}, ${sr} Hz${fmt != "wav" && ogg?.includes("-ac") ? "; OGG is dual-mono stereo because this ffmpeg has no libvorbis" : ", mono"})`);
} else die(`unknown command "${cmd}". Run 'plinkfx --help'.`);
