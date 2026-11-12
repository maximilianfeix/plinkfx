/**
 * plinkfx: game sound effects as code.
 *
 *   import { play } from "plinkfx";
 *   play("coin");
 *
 * Importing from "plinkfx" pulls in every sound so names work as strings.
 * For the smallest bundle import the player from "plinkfx/core" and only the
 * sounds you use from "plinkfx/sounds".
 */
import * as sounds from "./sounds.gen.ts";
import { play as playSound, buffer as bufferOf, render as renderSound, preload as preloadSounds } from "./core/index.ts";
import type { PlayOptions, RenderOptions, Sound } from "./core/index.ts";
import type { Name } from "./sounds.gen.ts";

export * from "./sounds.gen.ts";
export { context, volume, wav, rng, stopAll, unlockAudio, VARIANTS } from "./core/index.ts";
export type { Sound, Layer, Wave, RenderOptions, PlayOptions } from "./core/index.ts";

const library = sounds as unknown as Record<string, Sound>;

const camel = (n: string) => n.replace(/-(\w)/g, (_, c) => c.toUpperCase());
// Edit distance, for "did you mean" on typos.
const dist = (a: string, b: string) => {
  const d = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = d[0];
    d[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const t = d[j];
      d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] == b[j - 1] ? 0 : 1));
      prev = t;
    }
  }
  return d[b.length];
};

/** Look up a sound by its name ("coin-double") or export name ("coinDouble"). */
export function get(name: Name | (string & {})): Sound {
  const s = library[camel(name)];
  if (!s) {
    const close = names.filter((n) => dist(n, name) <= 2 || n.includes(name)).slice(0, 4);
    throw new Error(`plinkfx: no sound called "${name}"${close.length ? `. Did you mean ${close.join(", ")}?` : ""}`);
  }
  return s;
}

const resolve = (s: Sound | Name) => (typeof s == "string" ? get(s) : s);

/** Play a sound by name or object: play("coin"), play(coin, { volume: 0.5, pan: -0.5 }). */
export const play = (s: Sound | Name, o?: PlayOptions) => playSound(resolve(s), o);

/** Render a sound by name or object to mono samples. */
export const render = (s: Sound | Name, o?: RenderOptions) => renderSound(resolve(s), o);

/** The AudioBuffer for one take of a sound (rendered once, then cached). */
export const buffer = (s: Sound | Name, variant?: number) => bufferOf(resolve(s), variant);

/** Render sounds ahead of time in idle slices: preload(["coin", "jump"]). */
export const preload = (list: (Sound | Name)[], takes?: number) => preloadSounds(list.map(resolve), takes);

/** All sound names. */
export const names = Object.keys(library).map((k) => k.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase())) as Name[];
