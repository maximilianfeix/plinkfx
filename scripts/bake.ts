/**
 * Bake the catalogue: render every sound in library/, measure it, set its
 * output gain so it lands on its category's loudness target without going
 * over -1 dBTP, then write src/sounds.gen.ts and library/catalog.gen.json.
 *
 *   node scripts/bake.ts            bake everything
 *   node scripts/bake.ts --reels    also write one WAV + spectrogram per category to .work/reels
 *   node scripts/bake.ts --only=ui  limit the reels to one category or sound
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { CATEGORIES, library } from "../library/index.ts";
import { render } from "../src/core/synth.ts";
import { wav } from "../src/core/wav.ts";
import type { Sound } from "../src/core/types.ts";
import { measure } from "../src/meter.ts";

const SR = 44100,
  CEILING = -1.2,
  VARIANTS = 4;
const args = process.argv.slice(2),
  only = args.find((a) => a.startsWith("--only="))?.slice(7),
  reels = args.includes("--reels");

export const camel = (s: string) => s.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
const r2 = (x: number) => Math.round(x * 100) / 100;
const envelope = (x: Float32Array, bars: number) => {
  const step = Math.max(1, Math.floor(x.length / bars)),
    pk = Array.from({ length: bars }, (_, i) => {
      let m = 0;
      for (let j = i * step; j < Math.min((i + 1) * step, x.length); j++) m = Math.max(m, Math.abs(x[j]));
      return m;
    }),
    top = Math.max(...pk, 1e-6);
  return pk.map((v) => r2(Math.sqrt(v / top)));
};

const seen = new Set<string>(),
  catalog: any[] = [],
  out: string[] = [],
  problems: string[] = [];

for (const e of library) {
  if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(e.name)) throw new Error(`bad name: ${e.name}`);
  if (seen.has(e.name)) throw new Error(`duplicate name: ${e.name}`);
  seen.add(e.name);
  const target = CATEGORIES[e.cat].target,
    base: Sound = { ...e.sound, gain: 1 },
    raw = Array.from({ length: VARIANTS }, (_, seed) => measure(render(base, { sampleRate: SR, seed }), SR)),
    tpMax = Math.max(...raw.map((m) => m.truePeak));
  // Normalise the average take to the target; the true-peak ceiling wins if it is lower.
  const avg = raw.reduce((a, m) => a + m.lufsMax, 0) / VARIANTS,
    limited = CEILING - tpMax < target - avg,
    gainDb = Math.min(target - avg, CEILING - tpMax);
  let gain = Number((10 ** (gainDb / 20)).toPrecision(3)),
    sound: Sound = { ...e.sound, gain };
  // Peak-limited sounds: try the render-time limiter. Raise the gain (at most +4 dB) until the
  // average take reaches the target or the true peak hits the ceiling; keep it only if it gains >= 0.5 LU.
  if (limited && !e.sound.limit) {
    const avgOf = (ms: { lufsMax: number }[]) => ms.reduce((a, m) => a + m.lufsMax, 0) / ms.length,
      at = (g: number) => Array.from({ length: VARIANTS }, (_, seed) => measure(render({ ...e.sound, limit: 1, gain: g }, { sampleRate: SR, seed }), SR)),
      before = avgOf(raw) + gainDb,
      max = gain * 10 ** (4 / 20);
    let g = Math.min(max, gain * 10 ** ((target - before) / 20)),
      ms = at(g);
    for (let k = 0; k < 6; k++) {
      const tp = Math.max(...ms.map((m) => m.truePeak)),
        avg = avgOf(ms);
      if (tp > CEILING + 0.15) g *= 10 ** ((CEILING - tp) / 20);
      else if (avg < target - 0.3 && g < max) g = Math.min(max, g * 10 ** ((target - avg) / 20));
      else break;
      ms = at(g);
    }
    if (Math.max(...ms.map((m) => m.truePeak)) <= -1 && avgOf(ms) > before + 0.5) {
      gain = Number(g.toPrecision(3));
      sound = { ...e.sound, limit: 1, gain };
    }
  }
  const takes = Array.from({ length: VARIANTS }, (_, seed) => measure(render(sound, { sampleRate: SR, seed }), SR)),
    m = takes[0],
    tAvg = takes.reduce((a, t) => a + t.lufsMax, 0) / VARIANTS,
    // "limited": the true-peak ceiling kept it from its target band.
    capped = limited && !(Math.abs(tAvg - target) <= 0.5 && takes.every((t) => Math.abs(t.lufsMax - target) <= 1.5));
  // Short transients hit the -1 dBTP ceiling before the loudness target; that is fine
  // (they are peak-normalised), unless they end up far too quiet.
  if (m.lufsMax < target - 6) problems.push(`${e.name}: too quiet, ${r2(m.lufsMax)} LUFS vs target ${target}`);
  if (Math.max(...takes.map((t) => t.truePeak)) > -1) problems.push(`${e.name}: true peak over -1 dBTP`);
  if (m.duration > 4) problems.push(`${e.name}: long (${r2(m.duration)} s)`);
  catalog.push({
    name: e.name,
    id: camel(e.name),
    cat: e.cat,
    desc: e.desc,
    gain,
    limited: capped,
    m: { peak: r2(m.peak), truePeak: r2(m.truePeak), lufsMax: r2(m.lufsMax), duration: r2(m.duration), centroid: Math.round(m.centroid) },
    // 40-bar peak envelope of take 0 for the gallery tiles (so the page renders no audio at load).
    env: envelope(render(sound, { sampleRate: SR }), 40),
    takes: takes.map((t) => ({ lufsMax: r2(t.lufsMax), truePeak: r2(t.truePeak), duration: r2(t.duration) })),
  });
  out.push(`/** ${e.desc} */\nexport const ${camel(e.name)}: Sound = ${JSON.stringify(sound)};`);
}

writeFileSync(
  "src/sounds.gen.ts",
  `// Generated by scripts/bake.ts from library/*.ts. Do not edit by hand.\n// Sounds are CC0 1.0 (public domain). See LICENSE-SOUNDS.\nimport type { Sound } from "./core/types.ts";\n\n${out.join("\n")}\n\n/** Every sound name. */\nexport type Name =\n${catalog.map((c) => `  | "${c.name}"`).join("\n")};\n`,
);
writeFileSync("library/catalog.gen.json", JSON.stringify({ categories: CATEGORIES, sounds: catalog }, null, 1) + "\n");

const counts = Object.keys(CATEGORIES).map((c) => `${c} ${catalog.filter((s) => s.cat == c).length}`);
console.log(`baked ${catalog.length} sounds: ${counts.join(", ")}`);
if (problems.length) console.log("check:\n  " + problems.join("\n  "));

if (reels) {
  // One reel per category: every sound (take 0) with a short gap, plus a spectrogram to eyeball.
  mkdirSync(".work/reels", { recursive: true });
  for (const cat of Object.keys(CATEGORIES)) {
    const items = catalog.filter((c) => c.cat == cat && (!only || only == cat || only == c.name));
    if (!items.length) continue;
    const gap = new Float32Array(Math.round(SR * 0.35)),
      parts: Float32Array[] = [];
    for (const c of items) {
      const e = library.find((x) => x.name == c.name)!;
      parts.push(render({ ...e.sound, gain: c.gain }, { sampleRate: SR }), gap);
    }
    const all = new Float32Array(parts.reduce((n, p) => n + p.length, 0));
    let o = 0;
    for (const p of parts) all.set(p, o), (o += p.length);
    const file = `.work/reels/${only && only != cat ? only : cat}`;
    writeFileSync(`${file}.wav`, wav(all, SR));
    writeFileSync(`${file}.txt`, items.map((c) => c.name).join("  ") + "\n");
    execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", `${file}.wav`, "-lavfi", `showspectrumpic=s=${Math.min(3600, Math.max(800, Math.round(all.length / SR * 260)))}x320:legend=0:scale=log`, `${file}.png`]);
  }
  console.log("reels in .work/reels");
}
