import { def } from "./def.ts";

// Farming and crafting: tool hits are a noise click + `modal` body (wood or stone) + a short low thump.
const WOOD = [1, 2.32, 4.25, 6.63];

export default def("farm", {
  "axe-chop": ["Axe bites into a log", {
    vary: 0.8,
    varyF: 2,
    varyG: 1.5,
    verb: [0.2, 0.1],
    layers: [
      { wave: "noise", bp: 2200, q: 1.5, a: 0.001, d: 0.012, shape: -5, drive: 2 },
      { wave: "modal", freq: 190, modes: WOOD, a: 0.001, d: 0.2, shape: -5, drive: 1 },
      { wave: "pink", lp: 1200, a: 0.001, d: 0.08, shape: -6, drive: 1.5, gain: 0.7 },
      { wave: "sine", freq: 120, to: 60, a: 0.001, d: 0.12, shape: -5, gain: 0.5 },
    ],
  }],
  "tree-fall": ["Tree creaks, topples and crashes down", {
    vary: 0.4,
    verb: [0.5, 0.25],
    layers: [
      { wave: "saw", freq: 40, to: 70, vib: [3, 3], bp: 900, q: 5, a: 0.1, h: 0.6, d: 0.2, shape: 1.5, gain: 0.6 },
      { wave: "pink", bp: 2000, q: 0.8, at: 0.9, a: 0.01, d: 0.6, shape: -3, gain: 0.6 },
      { wave: "brown", lp: 400, at: 0.95, a: 0.001, d: 0.8, shape: -4, drive: 1.5, gain: 1.4 },
      { wave: "sine", freq: 70, to: 30, at: 0.95, a: 0.001, d: 0.5, shape: -4, drive: 1.5 },
    ],
  }],
  "pickaxe-mine": ["Pickaxe strikes rock", {
    vary: 0.8,
    varyF: 2,
    varyG: 1.5,
    verb: [0.25, 0.12],
    layers: [
      { wave: "metal", freq: 1200, hp: 2500, a: 0.001, d: 0.3, shape: -5, gain: 0.5 },
      { wave: "noise", bp: 2600, q: 1, a: 0.001, d: 0.03, shape: -5, drive: 1, gain: 0.7 },
      { wave: "modal", freq: 700, modes: [1, 2.6, 4.9, 7.3], a: 0.001, d: 0.25, shape: -5 },
      { wave: "pink", lp: 900, a: 0.001, d: 0.1, shape: -5, gain: 0.5 },
      ...[0.05, 0.09, 0.14].map((at) => ({ wave: "noise" as const, bp: 3500, q: 3, at, a: 0.001, d: 0.008, shape: -6, gain: 0.3 })),
    ],
  }],
  dig: ["Shovel into soil", {
    vary: 0.8,
    varyF: 3,
    varyG: 2,
    layers: [
      { wave: "noise", bp: 1500, bpTo: 600, q: 0.8, a: 0.01, d: 0.18, shape: -4, drive: 1 },
      { wave: "brown", lp: 400, a: 0.005, d: 0.2, shape: -4, gain: 0.7 },
      ...[0.12, 0.17, 0.22].map((at) => ({ wave: "pink" as const, bp: 2000, q: 2, at, a: 0.001, d: 0.02, shape: -5, gain: 0.3 })),
    ],
  }],
  "plant-seed": ["Pop a seed into the ground: soft pat and sprout chime", {
    vary: 0.8,
    layers: [
      { wave: "pink", lp: 900, a: 0.001, d: 0.06, shape: -5 },
      { wave: "sine", freq: 600, to: 1200, curve: 2, at: 0.06, a: 0.002, d: 0.08, shape: -4, gain: 0.4 },
      { wave: "sine", freq: 1760, fm: [3.5, 1, 0.08], at: 0.1, a: 0.002, d: 0.25, shape: -4, gain: 0.2 },
    ],
  }],
  "watering-can": ["Watering can pours over the soil", {
    vary: 0.4,
    varyF: 2,
    layers: [
      { wave: "noise", bp: 2500, q: 0.9, a: 0.1, h: 0.5, d: 0.25, shape: -3, gain: 0.6 },
      ...Array.from({ length: 10 }, (_, i) => ({ wave: "sine" as const, freq: 700 + (i * 137) % 600, to: 1600 + (i * 211) % 800, curve: 3, at: 0.08 + i * 0.07, a: 0.001, d: 0.03, shape: 3, gain: 0.25 })),
    ],
  }],
  harvest: ["Pull up a crop: rustle, pluck and a happy pop", {
    vary: 0.6,
    varyF: 2,
    layers: [
      { wave: "noise", bp: 3000, q: 1, a: 0.02, d: 0.1, shape: -4, gain: 0.4 },
      { wave: "sine", freq: 220, to: 660, curve: 2, at: 0.08, a: 0.002, d: 0.08, shape: -4, gain: 0.7 },
      { wave: "triangle", freq: 1047, arp: [0, 7], arpRate: 0.05, at: 0.14, a: 0.002, d: 0.15, shape: -3, gain: 0.4 },
    ],
  }],
  "fishing-cast": ["Cast a line: rod whip, reel whirr and a plop", {
    vary: 0.5,
    layers: [
      { wave: "noise", bp: 1500, bpTo: 5000, q: 2, a: 0.08, d: 0.05, shape: 1, gain: 0.7 },
      ...Array.from({ length: 10 }, (_, i) => ({ wave: "noise" as const, bp: 4200, q: 4, at: 0.1 + i * 0.03, a: 0.001, d: 0.01, shape: -5, gain: 0.25 })),
      { wave: "sine", freq: 500, to: 1300, curve: 3, at: 0.5, a: 0.002, d: 0.06, shape: 3, gain: 0.6 },
      { wave: "noise", lp: 2000, at: 0.5, a: 0.002, d: 0.12, shape: -4, gain: 0.3 },
    ],
  }],
  "fish-bite": ["Bobber dips: something is biting!", {
    vary: 0.3,
    layers: [
      { wave: "sine", freq: 700, to: 300, curve: 2, a: 0.002, d: 0.08, shape: -4 },
      { wave: "noise", lp: 1500, a: 0.002, d: 0.08, shape: -4, gain: 0.4 },
      { wave: "square", duty: 0.25, freq: 1319, arp: [0, 5], arpRate: 0.09, at: 0.08, a: 0.002, h: 0.12, d: 0.06, shape: 2, lp: 4000, gain: 0.35 },
    ],
  }],
});
