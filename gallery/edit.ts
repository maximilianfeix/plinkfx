import type { Layer, Sound } from "../src/index.ts";

/** The five live knobs in the gallery. All at their neutral value = the original sound. */
export interface Knobs {
  /** semitones, -12..12 */
  pitch: number;
  /** time stretch, 0.5..2 */
  length: number;
  /** brightness, -1..1 (filter cutoffs x 0.25..4) */
  tone: number;
  /** reverb mix, 0..0.6 (0 keeps the sound's own reverb) */
  space: number;
  /** bit depth, 16 = off, down to 3 */
  crush: number;
}
export const NEUTRAL: Knobs = { pitch: 0, length: 1, tone: 0, space: 0, crush: 16 };

const NOISE = new Set(["noise", "pink", "brown"]);
const round = (x: number) => Number(x.toPrecision(4));

/** Apply the knobs to a sound and return a new, plain sound object (what "copy JSON" gives you). */
export function edit(s: Sound, k: Knobs): Sound {
  const p = 2 ** (k.pitch / 12),
    t = k.length,
    f = 4 ** k.tone;
  const layers = s.layers.map((L): Layer => {
    const o: Layer = { ...L };
    if (!NOISE.has(L.wave || "sine")) {
      o.freq = round((L.freq || 440) * p);
      if (L.to) o.to = round(L.to * p);
    }
    for (const key of ["at", "a", "h", "d", "sweep", "arpRate"] as const) if (L[key] != null) o[key] = round(L[key]! * t);
    if (L.d == null) o.d = round(0.2 * t);
    for (const key of ["lp", "lpTo", "bp", "bpTo", "hp", "hpTo"] as const) if (L[key]) o[key] = round(Math.min(L[key]! * f, 20000));
    if (L.vib) o.vib = [round(L.vib[0] / t), L.vib[1]];
    return o;
  });
  const out: Sound = { ...s, layers };
  if (s.echo) out.echo = [round(s.echo[0] * t), s.echo[1], s.echo[2]];
  if (k.space > 0) out.verb = [Math.max(s.verb?.[0] ?? 0.5, 0.5), round(Math.max(s.verb?.[1] ?? 0, k.space))];
  if (k.crush < 16) out.bits = k.crush;
  // Effects add energy; pull the level down a little so the edit does not jump out.
  if (k.space > 0 || k.crush < 16) out.gain = round((s.gain ?? 1) * 0.8);
  return out;
}

export const isNeutral = (k: Knobs) => (Object.keys(NEUTRAL) as (keyof Knobs)[]).every((key) => k[key] == NEUTRAL[key]);
