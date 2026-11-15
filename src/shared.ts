/** What the CLI and the MCP server share: loading and validating sounds, the catalogue, reading WAV files. Errors are thrown as plain messages. */
import { existsSync, readFileSync } from "node:fs";
import { basename } from "node:path";
import { get, names } from "./index.ts";
import type { Sound } from "./core/types.ts";
import * as all from "./sounds.gen.ts";

export const WAVES = ["sine", "triangle", "square", "saw", "noise", "pink", "brown", "crunch", "metal", "modal", "pluck"];
/** Longest sound we agree to render, in seconds (layers plus effect tails). */
const MAX_SECONDS = 30;

export interface Entry {
  name: string;
  cat: string;
  desc: string;
  duration?: number;
  lufs?: number;
}
export interface Catalog {
  categories: Record<string, { title: string; target: number }>;
  sounds: Entry[];
}

let cached: Catalog | undefined;
/** The catalogue: library/catalog.gen.json in the repo, dist/catalog.json in the package. */
export function catalog(): Catalog {
  if (cached) return cached;
  for (const p of ["../library/catalog.gen.json", "./catalog.json"])
    try {
      const j = JSON.parse(readFileSync(new URL(p, import.meta.url), "utf8"));
      return (cached = {
        categories: j.categories,
        sounds: j.sounds.map((s: any) => ({ name: s.name, cat: s.cat, desc: s.desc, duration: s.duration ?? s.m?.duration, lufs: s.lufs ?? s.m?.lufsMax })),
      });
    } catch {}
  return (cached = { categories: {}, sounds: names.map((name) => ({ name, cat: "", desc: "" })) });
}

/** The library sound object for a catalogue name. */
export const soundOf = (name: string) => (all as Record<string, Sound>)[name.replace(/-(\w)/g, (_, c) => c.toUpperCase())];

const parse = (text: string, where: string) => {
  try {
    return JSON.parse(text);
  } catch (e: any) {
    throw new Error(`${where} is not valid JSON: ${e.message}`);
  }
};

const isNum = (v: unknown) => typeof v == "number" && Number.isFinite(v);

/** Check a parsed recipe ({ layers: [...] } or { sound: {...} }) and return the sound. */
export function unwrap(j: any): Sound {
  const s = j?.sound ?? j;
  if (!s || typeof s != "object" || !Array.isArray(s.layers) || !s.layers.length) throw new Error("a sound needs a non-empty 'layers' array");
  if (s.layers.length > 32) throw new Error(`a sound can have at most 32 layers, got ${s.layers.length}`);
  let end = 0;
  s.layers.forEach((l: any, i: number) => {
    const at = `layer ${i + 1}`;
    if (!l || typeof l != "object" || Array.isArray(l)) throw new Error(`${at}: must be an object`);
    if (l.wave !== undefined && !WAVES.includes(l.wave)) throw new Error(`${at}: unknown wave "${l.wave}" (one of: ${WAVES.join(", ")})`);
    for (const [k, v] of Object.entries(l))
      if (k != "wave" && k != "loop" && !isNum(v) && !(Array.isArray(v) && v.every(isNum))) throw new Error(`${at}: "${k}" must be a number${Array.isArray(v) ? "s" : ""}, got ${JSON.stringify(v)}`);
    for (const k of ["at", "a", "h", "d"]) if (l[k] < 0) throw new Error(`${at}: "${k}" can't be negative`);
    if (l.freq !== undefined && l.freq <= 0) throw new Error(`${at}: "freq" must be above 0`);
    end = Math.max(end, (l.at || 0) + (l.a ?? 0.002) + (l.h || 0) + (l.d ?? 0.2));
  });
  for (const k of ["verb", "echo"]) if (s[k] !== undefined && !(Array.isArray(s[k]) && s[k].every(isNum))) throw new Error(`"${k}" must be an array of numbers`);
  for (const k of ["gain", "vary", "varyF", "varyG", "bits", "rate", "limit"]) if (s[k] !== undefined && !isNum(s[k])) throw new Error(`"${k}" must be a number`);
  if (end > MAX_SECONDS) throw new Error(`the layers last ${end.toFixed(1)} s; plinkfx renders effects up to ${MAX_SECONDS} s`);
  return s;
}

/** A sound from a catalogue name, a .json file, inline JSON text or an already parsed object. */
export function load(arg: unknown): { sound: Sound; label: string; name?: string } {
  if (arg && typeof arg == "object") return { sound: unwrap(arg), label: "inline" };
  if (typeof arg != "string" || !arg.trim()) throw new Error("missing sound (a name like 'coin', a .json file or inline JSON)");
  if (arg.trim().startsWith("{")) return { sound: unwrap(parse(arg, "the inline sound")), label: "inline" };
  if (arg.endsWith(".json")) {
    if (!existsSync(arg)) throw new Error(`no such file: ${arg}`);
    return { sound: unwrap(parse(readFileSync(arg, "utf8"), arg)), label: basename(arg, ".json") };
  }
  try {
    return { sound: get(arg), label: arg, name: arg };
  } catch (e: any) {
    throw new Error(`${String(e.message).replace(/^plinkfx: /, "")}${/Did you mean/.test(e.message) ? "" : ". Run 'plinkfx list'."}`);
  }
}

/** Minimal WAV reader: 16/24/32-bit PCM or 32-bit float, mixed to mono. */
export function readWav(file: string): { x: Float32Array; sr: number } {
  if (!existsSync(file)) throw new Error(`no such file: ${file}`);
  const b = readFileSync(file),
    v = new DataView(b.buffer, b.byteOffset, b.byteLength);
  if (b.length < 12 || b.toString("ascii", 0, 4) != "RIFF") throw new Error(`${file} is not a WAV file`);
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
      if (![16, 24, 32].includes(bits) || !ch) throw new Error(`${file}: unsupported WAV format (${bits}-bit)`);
      const bps = bits / 8,
        n = Math.floor(Math.min(size, b.length - o - 8) / bps / ch),
        x = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        let s = 0;
        for (let c = 0; c < ch; c++) {
          const p = o + 8 + (i * ch + c) * bps;
          s +=
            fmt == 3 ? v.getFloat32(p, true) : bits == 16 ? v.getInt16(p, true) / 32768 : bits == 24 ? (v.getUint8(p) | (v.getUint8(p + 1) << 8) | (v.getInt8(p + 2) << 16)) / 8388608 : v.getInt32(p, true) / 2147483648;
        }
        x[i] = s / ch;
      }
      return { x, sr };
    }
    o += 8 + size + (size & 1);
  }
  throw new Error(`${file}: no audio data found`);
}
