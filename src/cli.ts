#!/usr/bin/env node
/**
 * plinkfx CLI. No network, no accounts: everything renders locally.
 *
 *   plinkfx list [category]
 *   plinkfx show <name>
 *   plinkfx render <name|file.json|'{json}'> [-o out.wav] [--png out.png] [--variant n] [--rate 48000]
 *   plinkfx check <names...|file.json|file.wav> | --all [--json] [--cat c | --target lufs]
 *   plinkfx mcp                 MCP server on stdio (src/mcp.ts)
 *   plinkfx measure <name|file.json|file.wav> [--like <name>] [--json]
 *   plinkfx level <file.json> [--target -16 | --like <name>]
 *   plinkfx export [dir] [--format wav|ogg|both] [--rate 48000] [--variants] [--only cat1,cat2]
 *   plinkfx export [dir] --sprite [--format wav|ogg|both] [--rate 48000] [--gap 0.1] [--only cat1,cat2]
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { render } from "./core/synth.ts";
import { wav } from "./core/wav.ts";
import { measure, type Measurement } from "./meter.ts";
import { audit, LIMITS } from "./audit.ts";
import { picture } from "./png.ts";
import { serve } from "./mcp.ts";
import * as shared from "./shared.ts";
import { catalog, soundOf } from "./shared.ts";

// Set by esbuild in scripts/build.ts; read package.json when run from source.
declare const __VERSION__: string;
const VERSION = typeof __VERSION__ == "string" ? __VERSION__ : JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version;
const BOOL = ["json", "variants", "sprite", "help", "version", "all"],
  VALUE = ["out", "variant", "rate", "like", "target", "format", "gap", "only", "png", "cat"];
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
const parse = (text: string, where: string) => {
  try {
    return JSON.parse(text);
  } catch (e: any) {
    return die(`${where} is not valid JSON: ${e.message}`);
  }
};
const f1 = (x: number) => (Number.isFinite(x) ? x.toFixed(1) : "-inf");
/** Run a shared helper; its error becomes a one-line exit. */
const attempt = <T>(f: () => T): T => {
  try {
    return f();
  } catch (e: any) {
    return die(e.message);
  }
};
const load = (arg: string | undefined) => attempt(() => shared.load(arg));
const unwrap = (j: unknown) => attempt(() => shared.unwrap(j));
const readWav = (file: string) => attempt(() => shared.readWav(file));
const writeOut = (file: string, bytes: Uint8Array) => {
  try {
    writeFileSync(file, bytes);
  } catch (e: any) {
    die(`can't write ${file}: ${e.code == "ENOENT" ? "the folder doesn't exist" : e.message}`);
  }
};

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

const cmd = pos.shift();
if (flags.version) console.log(VERSION);
else if (!cmd || flags.help || cmd == "help")
  console.log(`plinkfx ${VERSION}: game sound effects as code (sounds CC0, code MIT)

  plinkfx list [category]                     list sounds
  plinkfx show <name>                         print a sound's parameters as JSON
  plinkfx render <sound> [-o out.wav]         render to WAV
      --variant n   take 0-3 (default 0; files are named name-1..4 like export)
      --rate hz     sample rate (default 48000)
      --png f.png   also draw its waveform and spectrogram
  plinkfx check <sound...|file.wav> | --all [--json]
                                              find clicks, cut tails, DC, clipping, padding, loudness off target
      --cat c       judge loudness against this category (catalogue sounds default to their own)
      --target lufs judge loudness against this max momentary LUFS
  plinkfx mcp                                 MCP server on stdio, for agents (Claude Code, Cursor, Codex)
  plinkfx measure <sound|file.wav> [--like <name>] [--json]
                                              loudness, peaks, duration, brightness
  plinkfx level <file.json> [--target -16 | --like <name>]
                                              set the sound's gain: loudness on target, true peak <= -1 dBTP
  plinkfx export [dir] [--format wav|ogg|both] [--rate 48000] [--variants]
                                              write the whole library to disk
      --only a,b    only these categories (ui,pickup,...)
      --sprite      one audio sprite instead: plinkfx-sprite.wav/.ogg (take 0 of each sound)
                    plus plinkfx-sprite.json (Howler) and plinkfx-sprite.phaser.json (Phaser)
      --gap s       silence between sprite entries in seconds (default 0.1)

  <sound> is a name (coin), a .json file, or inline JSON ('{"layers":[...]}').
  Gallery: https://maximilianfeix.github.io/plinkfx/`);
else if (cmd == "list") {
  const cat = pos[0],
    rows = catalog().sounds.filter((s) => !cat || s.cat == cat);
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
  if (flags.png !== undefined && (typeof flags.png != "string" || !flags.png.toLowerCase().endsWith(".png"))) die("--png needs a file name ending in .png");
  writeOut(out, wav(x, sr));
  const m = measure(x, sr);
  if (typeof flags.png == "string") writeOut(flags.png, picture(x, sr, `${label}  ${m.duration.toFixed(2)} s  ${f1(m.lufsMax)} lufs  ${f1(m.truePeak)} dbtp`));
  console.log(`${out}  ${m.duration.toFixed(2)} s, ${f1(m.lufsMax)} LUFS, peak ${f1(m.truePeak)} dBTP${typeof flags.png == "string" ? `\n${flags.png}  waveform + spectrogram` : ""}`);
} else if (cmd == "measure") {
  const arg = pos[0];
  let m: Measurement;
  if (arg?.toLowerCase().endsWith(".wav")) {
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
    if (m.truePeak > LIMITS.truePeak) warn.push("true peak above -1 dBTP: lower the gain");
    if (Math.abs(m.dc) > LIMITS.dc) warn.push("DC offset: add a high-pass");
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
    takes = flags.variants ? 4 : 1;
  if (!["wav", "ogg", "both"].includes(fmt)) die(`unknown format "${fmt}" (wav, ogg or both)`);
  if (flags.sprite && flags.variants) die("--sprite uses take 0 of each sound; drop --variants");
  if (!flags.sprite && flags.gap !== undefined) die("--gap only works with --sprite");
  const ogg = fmt != "wav" ? vorbis() : null;
  if (fmt != "wav" && !ogg) die("OGG export needs ffmpeg with a Vorbis encoder on your PATH (WAV works without it)");
  let list = catalog().sounds;
  if (flags.only !== undefined) {
    const want = String(flags.only).split(",").map((c) => c.trim()).filter(Boolean),
      cats = [...new Set(list.map((s) => s.cat))],
      bad = want.filter((c) => !cats.includes(c));
    if (!want.length || bad.length) die(`unknown category "${bad[0] ?? flags.only}" for --only (one of: ${cats.join(", ")})`);
    list = list.filter((s) => want.includes(s.cat));
  }
  const toOgg = (base: string) => {
    try {
      execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", base + ".wav", ...ogg!, base + ".ogg"], { stdio: ["ignore", "ignore", "pipe"] });
    } catch (e: any) {
      die(`ffmpeg failed on ${base}.ogg: ${String(e.stderr || e.message).trim().split("\n")[0]}`);
    }
    if (fmt == "ogg") unlinkSync(base + ".wav");
  };
  const oggNote = fmt != "wav" && ogg?.includes("-ac") ? "; OGG is dual-mono stereo because this ffmpeg has no libvorbis" : ", mono";
  if (flags.sprite) {
    // Every sound starts on a whole sample; offsets in the JSON are exact to the microsecond.
    const gap = Math.round(num("gap", 0.1, 0, 10) * sr),
      parts = list.map((s) => ({ name: s.name, x: render(soundOf(s.name), { sampleRate: sr }) })),
      total = parts.reduce((n, p, i) => n + p.x.length + (i ? gap : 0), 0),
      out = new Float32Array(total),
      howler: Record<string, [number, number]> = {},
      spritemap: Record<string, { start: number; end: number; loop: boolean }> = {},
      ms = (n: number) => Math.round((n / sr) * 1e6) / 1e3,
      sec = (n: number) => Math.round((n / sr) * 1e6) / 1e6;
    let at = 0;
    for (const p of parts) {
      out.set(p.x, at);
      howler[p.name] = [ms(at), ms(p.x.length)];
      spritemap[p.name] = { start: sec(at), end: sec(at + p.x.length), loop: false };
      at += p.x.length + gap;
    }
    mkdirSync(dir, { recursive: true });
    const base = join(dir, "plinkfx-sprite"),
      resources = fmt == "wav" ? ["plinkfx-sprite.wav"] : fmt == "ogg" ? ["plinkfx-sprite.ogg"] : ["plinkfx-sprite.ogg", "plinkfx-sprite.wav"],
      json = (o: unknown) => new TextEncoder().encode(JSON.stringify(o, null, 2) + "\n");
    writeOut(base + ".wav", wav(out, sr));
    if (ogg) toOgg(base);
    // Howler: one "name": [offsetMs, durationMs] per line.
    writeOut(base + ".json", new TextEncoder().encode("{\n" + Object.entries(howler).map(([k, v]) => `  ${JSON.stringify(k)}: [${v.join(", ")}]`).join(",\n") + "\n}\n"));
    writeOut(base + ".phaser.json", json({ resources, spritemap }));
    console.log(`wrote a sprite of ${parts.length} sounds (${(total / sr).toFixed(1)} s) to ${dir}/: ${resources.join(", ")}, plinkfx-sprite.json (Howler), plinkfx-sprite.phaser.json (Phaser) (${sr} Hz${oggNote})`);
  } else {
    let n = 0;
    for (const s of list) {
      const sound = soundOf(s.name),
        sub = join(dir, s.cat || ".");
      mkdirSync(sub, { recursive: true });
      for (let seed = 0; seed < takes; seed++) {
        const base = join(sub, s.name + (takes > 1 ? `-${seed + 1}` : ""));
        writeFileSync(base + ".wav", wav(render(sound, { sampleRate: sr, seed }), sr));
        if (ogg) toOgg(base);
        n++;
      }
    }
    console.log(`wrote ${n} sounds to ${dir}/ (${fmt}, ${sr} Hz${oggNote})`);
  }
} else if (cmd == "check") {
  const { categories, sounds } = catalog(),
    sr = num("rate", 48000, 8000, 192000),
    cat = flags.cat === undefined ? undefined : String(flags.cat);
  if (cat !== undefined && !categories[cat]) die(`unknown category "${cat}" for --cat (one of: ${Object.keys(categories).join(", ")})`);
  if (flags.all && pos.length) die("--all checks the whole catalogue; drop the sound names");
  if (!flags.all && !pos.length) die("name the sounds to check, or use --all");
  const fixed = flags.target !== undefined ? num("target", -16, -60, 0) : cat ? categories[cat].target : undefined,
    targets = flags.all ? sounds.map((s) => s.name) : pos,
    results = targets.map((arg) => {
      if (arg.toLowerCase().endsWith(".wav")) {
        const { x, sr: r } = readWav(arg);
        return { name: arg, ...audit([x], r, fixed) };
      }
      const { sound, label, name } = load(arg),
        own = name ? sounds.find((s) => s.name == name)?.cat : undefined;
      return { name: label, ...audit([0, 1, 2, 3].map((seed) => render(sound, { sampleRate: sr, seed })), sr, fixed ?? (own ? categories[own]?.target : undefined), !!sound.loop) };
    }),
    failed = results.filter((r) => !r.ok).length,
    warned = results.filter((r) => r.ok && r.issues.length).length;
  if (flags.json)
    console.log(
      JSON.stringify(
        { ok: !failed, failed, warned, sounds: results.map((r) => ({ name: r.name, ok: r.ok, issues: r.issues, target: r.target ?? null, lufs: Number(r.lufsAvg.toFixed(2)), truePeak: Number(r.truePeak.toFixed(2)), duration: Number(r.m.duration.toFixed(3)) })) },
        null,
        2,
      ),
    );
  else {
    const w = Math.max(...results.map((r) => r.name.length));
    for (const r of results) {
      // --all lists only the sounds with something to say
      if (flags.all && !r.issues.length) continue;
      console.log(`${r.ok ? (r.issues.length ? "warn" : "ok  ") : "FAIL"}  ${r.name.padEnd(w)}  ${f1(r.lufsAvg)} LUFS${r.target !== undefined ? ` (target ${r.target})` : ""}, true peak ${f1(r.truePeak)} dBTP`);
      for (const i of r.issues) console.log(`        ${i.level}: ${i.check}: ${i.message}`);
    }
    console.log(`${results.length} sound${results.length == 1 ? "" : "s"} checked: ${results.length - failed - warned} clean, ${warned} with warnings, ${failed} failed`);
  }
  if (failed) process.exitCode = 1;
} else if (cmd == "mcp") {
  serve(VERSION);
} else die(`unknown command "${cmd}". Run 'plinkfx --help'.`);
