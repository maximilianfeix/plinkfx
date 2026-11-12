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
import { play as playSound, buffer as bufferOf, render as renderSound } from "./core/index.ts";
import type { PlayOptions, RenderOptions, Sound } from "./core/index.ts";
import type { Name } from "./sounds.gen.ts";

export * from "./sounds.gen.ts";
export { context, volume, wav, rng, VARIANTS } from "./core/index.ts";
export type { Sound, Layer, Wave, RenderOptions, PlayOptions } from "./core/index.ts";

const library = sounds as unknown as Record<string, Sound>;

/** Look up a sound by its name ("coin-double") or export name ("coinDouble"). */
export function get(name: Name | (string & {})): Sound {
  const s = library[name.replace(/-(\w)/g, (_, c) => c.toUpperCase())];
  if (!s) throw new Error(`plinkfx: no sound called "${name}"`);
  return s;
}

const resolve = (s: Sound | Name | (string & {})) => (typeof s == "string" ? get(s) : s);

/** Play a sound by name or object: play("coin"), play(coin, { volume: 0.5 }). */
export const play = (s: Sound | Name | (string & {}), o?: PlayOptions) => playSound(resolve(s), o);

/** Render a sound by name or object to mono samples. */
export const render = (s: Sound | Name | (string & {}), o?: RenderOptions) => renderSound(resolve(s), o);

/** The AudioBuffer for one take of a sound (rendered once, then cached). */
export const buffer = (s: Sound | Name | (string & {}), variant?: number) => bufferOf(resolve(s), variant);

/** All sound names. */
export const names = Object.keys(library).map((k) => k.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase())) as Name[];
