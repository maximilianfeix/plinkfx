import type { Sound } from "../src/core/types.ts";

/** One sound in the catalogue, as authored. `scripts/bake.ts` turns these into src/sounds.gen.ts. */
export interface Entry {
  /** kebab-case, unique, becomes the camelCase export (coin-double -> coinDouble) */
  name: string;
  cat: Category;
  /** One short line, shown in the gallery. */
  desc: string;
  sound: Sound;
}

/** `target` is the loudness every sound in the category is normalised to (max momentary LUFS). */
export const CATEGORIES = {
  ui: { title: "UI", target: -20 },
  pickup: { title: "Pickups", target: -16 },
  jump: { title: "Jump & land", target: -16 },
  hit: { title: "Hits", target: -15 },
  explosion: { title: "Explosions", target: -14 },
  powerup: { title: "Power-ups", target: -16 },
  shoot: { title: "Shots & lasers", target: -16 },
  footstep: { title: "Footsteps", target: -20 },
  magic: { title: "Magic", target: -16 },
  alert: { title: "Alerts", target: -18 },
  jingle: { title: "Jingles", target: -17 },
  mechanic: { title: "Doors & mechanics", target: -17 },
  world: { title: "World", target: -17 },
  creature: { title: "Creatures", target: -17 },
  nature: { title: "Nature", target: -18 },
  card: { title: "Cards & casino", target: -18 },
  vehicle: { title: "Vehicles", target: -16 },
  horror: { title: "Horror", target: -17 },
  farm: { title: "Farm & crafting", target: -17 },
  scifi: { title: "Sci-fi & tech", target: -18 },
  puzzle: { title: "Puzzle", target: -17 },
} as const;
export type Category = keyof typeof CATEGORIES;

/** Keeps category files terse: def("ui", { click: ["desc", sound] }) */
export const def = (cat: Category, sounds: Record<string, [string, Sound]>): Entry[] =>
  Object.entries(sounds).map(([name, [desc, sound]]) => ({ name, cat, desc, sound }));
