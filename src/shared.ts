/** What the CLI and the MCP server share: loading and validating sounds, the catalogue, reading WAV files. Errors are thrown as plain messages. */
import { existsSync, readFileSync } from "node:fs";
import { basename } from "node:path";
import { get, names } from "./index.ts";
import { render } from "./core/synth.ts";
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

const isNum = (v: unknown): v is number => typeof v == "number" && Number.isFinite(v);
/** Layer fields that hold a list of numbers; every other field except wave and loop is one number. */
const LISTS = ["arp", "vib", "fm", "modes", "formant"];
export const RATES = [8000, 192000] as const;
/** Most samples one take may have: MAX_SECONDS at the highest rate. */
export const MAX_SAMPLES = MAX_SECONDS * RATES[1];

const range = (where: string, k: string, v: unknown, min: number, max: number) => {
  if (v === undefined) return;
  if (!isNum(v) || v < min || v > max) throw new Error(`${where}"${k}" must be a number from ${min} to ${max}, got ${JSON.stringify(v)}`);
};
const list = (where: string, k: string, v: unknown, len: number, bounds?: [number, number][]) => {
  if (v === undefined) return;
  if (!Array.isArray(v) || v.length > len || !v.every(isNum)) throw new Error(`${where}"${k}" must be a list of at most ${len} numbers`);
  bounds?.forEach(([lo, hi], i) => {
    if (v[i] !== undefined && (v[i] < lo || v[i] > hi)) throw new Error(`${where}"${k}"[${i}] must be from ${lo} to ${hi}, got ${v[i]}`);
  });
};

/**
 * Length in seconds that render() allocates for a sound, with the same formula as core/synth.ts
 * (layer envelopes, up to 7 % longer decay on other takes, echo and reverb tails).
 */
export function seconds(s: Sound): number {
  let end = 0;
  for (const L of s.layers) end = Math.max(end, (L.at || 0) + Math.max(L.a ?? 0.002, 0.001) + (L.h || 0) + (L.d ?? 0.2) * 1.07);
  const echo = s.echo,
    verb = s.verb;
  return end + (echo ? Math.min(echo[0] * Math.ceil(Math.log(0.001) / Math.log(echo[1] || 0.01)), 1.5) : 0) + (verb ? 0.2 + verb[0] * 1.8 : 0);
}

/** Check a parsed recipe ({ layers: [...] } or { sound: {...} }) and return the sound. */
export function unwrap(j: any): Sound {
  const s = j?.sound ?? j;
  if (!s || typeof s != "object" || Array.isArray(s) || !Array.isArray(s.layers) || !s.layers.length) throw new Error("a sound needs a non-empty 'layers' array");
  if (s.layers.length > 32) throw new Error(`a sound can have at most 32 layers, got ${s.layers.length}`);
  s.layers.forEach((l: any, i: number) => {
    const at = `layer ${i + 1}: `;
    if (!l || typeof l != "object" || Array.isArray(l)) throw new Error(`${at}must be an object`);
    if (l.wave !== undefined && !WAVES.includes(l.wave)) throw new Error(`${at}unknown wave "${l.wave}" (one of: ${WAVES.join(", ")})`);
    if (l.loop !== undefined && typeof l.loop != "boolean") throw new Error(`${at}"loop" must be true or false`);
    for (const [k, v] of Object.entries(l))
      if (k != "wave" && k != "loop" && !LISTS.includes(k) && !isNum(v)) throw new Error(`${at}"${k}" must be a number, got ${JSON.stringify(v)}`);
    for (const k of ["at", "a", "h", "d"]) range(at, k, l[k], 0, MAX_SECONDS);
    for (const k of ["freq", "to"]) range(at, k, l[k], 1, 100000);
    range(at, "arpRate", l.arpRate, 0.001, 10);
    list(at, "arp", l.arp, 64, Array(64).fill([-96, 96]));
    list(at, "vib", l.vib, 2, [[0, 1000], [-48, 48]]);
    list(at, "fm", l.fm, 3, [[0, 100], [-100, 100], [0, MAX_SECONDS]]);
    list(at, "modes", l.modes, 8, Array(8).fill([0.01, 100]));
    list(at, "formant", l.formant, 8, Array(8).fill([20, 24000]));
  });
  list("", "verb", s.verb, 2, [[0, 1], [0, 4]]);
  list("", "echo", s.echo, 3, [[0.001, 2], [0, 0.95], [0, 4]]);
  for (const k of ["gain", "limit"]) range("", k, s[k], 0, 100);
  range("", "vary", s.vary, 0, 24);
  range("", "varyF", s.varyF, 0, 48);
  range("", "varyG", s.varyG, 0, 24);
  range("", "bits", s.bits, 1, 32);
  range("", "rate", s.rate, 100, RATES[1]);
  const len = seconds(s);
  if (!(len <= MAX_SECONDS)) throw new Error(`the sound would last ${len.toFixed(1)} s with its tails; plinkfx renders effects up to ${MAX_SECONDS} s`);
  return s;
}

/** render() with the sample rate and length checked first, so no request can allocate without bound. */
export function renderChecked(sound: Sound, sampleRate: number, seed = 0): Float32Array {
  if (!Number.isInteger(sampleRate) || sampleRate < RATES[0] || sampleRate > RATES[1]) throw new Error(`the sample rate must be a whole number from ${RATES[0]} to ${RATES[1]} Hz`);
  const n = Math.ceil(seconds(sound) * sampleRate) + 1;
  if (!(n <= MAX_SAMPLES)) throw new Error(`the sound would take ${n} samples; the limit is ${MAX_SAMPLES}`);
  return render(sound, { sampleRate, seed });
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
