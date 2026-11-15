import { def } from "./def.ts";

// Wood plank modes (also in card.ts and farm.ts).
const WOOD = [1, 2.32, 4.25, 6.63];

export default def("world", {
  // Loops: every layer spans the whole render (d: 0 keeps every take the same length); see Sound.loop.
  "engine-idle": ["Engine idling, seamless loop (play with rate for revs)", {
    loop: true,
    // No pitch spread: whole cycles in the 3 s loop keep the crossfade in phase.
    vary: 0,
    varyF: 1.5,
    varyG: 0.8,
    layers: [
      { wave: "square", freq: 31, duty: 0.3, lp: 240, drive: 1.5, vib: [2, 0.25], a: 0.02, h: 3.48, d: 0 },
      { wave: "saw", freq: 62, lp: 420, vib: [2, 0.25], a: 0.02, h: 3.48, d: 0, gain: 0.45 },
      { wave: "crunch", freq: 124, lp: 1400, hp: 300, a: 0.02, h: 3.48, d: 0, gain: 0.12 },
      { wave: "brown", lp: 160, a: 0.02, h: 3.48, d: 0, gain: 0.5 },
    ],
  }],
  "force-field": ["Force field or reactor hum, seamless loop", {
    loop: true,
    vary: 0,
    varyF: 1.5,
    varyG: 0.8,
    layers: [
      { wave: "sine", freq: 60, drive: 0.6, a: 0.02, h: 3.48, d: 0 },
      { wave: "saw", freq: 120, lp: 900, vib: [1, 0.04], a: 0.02, h: 3.48, d: 0, gain: 0.3 },
      { wave: "triangle", freq: 180, vib: [3, 0.03], a: 0.02, h: 3.48, d: 0, gain: 0.25 },
      { wave: "noise", bp: 3200, q: 3, a: 0.02, h: 3.48, d: 0, gain: 0.05 },
    ],
  }],
  whoosh: ["Medium whoosh for dashes and swings", {
    varyF: 3,
    varyG: 1.5,
    layers: [
      { wave: "pink", bp: 450, bpTo: 1800, q: 1.6, a: 0.13, d: 0.02, shape: 1 },
      { wave: "pink", bp: 1800, bpTo: 500, q: 1.6, at: 0.13, a: 0.01, d: 0.3, shape: -4 },
      { wave: "noise", bp: 3000, bpTo: 6000, a: 0.12, d: 0.12, gain: 0.2 },
      { wave: "brown", lp: 300, a: 0.12, d: 0.15, gain: 0.3 },
    ],
  }],
  swing: ["Sword or stick swing", {
    vary: 1,
    varyF: 3,
    varyG: 1.5,
    layers: [
      { wave: "noise", bp: 900, bpTo: 3500, q: 2.5, a: 0.06, d: 0.1, shape: 2 },
      { wave: "noise", bp: 3000, bpTo: 900, q: 2, at: 0.08, a: 0.02, d: 0.22, shape: -4, gain: 0.45 },
    ],
  }],
  dash: ["Quick dash with a burst", {
    layers: [
      { wave: "noise", bp: 1200, bpTo: 5000, q: 1.2, a: 0.01, d: 0.18, shape: 2 },
      { wave: "sine", freq: 200, to: 600, a: 0.005, d: 0.1, gain: 0.3 },
    ],
  }],
  splash: ["Something falls in water", {
    verb: [0.25, 0.12],
    layers: [
      { wave: "noise", lp: 4000, lpTo: 800, a: 0.003, d: 0.4, shape: 2.5 },
      { wave: "sine", freq: 220, to: 70, a: 0.002, d: 0.1, gain: 0.6 },
      { wave: "sine", freq: 600, to: 1400, curve: 3, at: 0.12, a: 0.002, d: 0.05, gain: 0.3 },
      { wave: "sine", freq: 800, to: 1800, curve: 3, at: 0.2, a: 0.002, d: 0.04, gain: 0.2 },
    ],
  }],
  "water-drop": ["Single water drop", {
    verb: [0.4, 0.2],
    vary: 1,
    layers: [{ wave: "sine", freq: 900, to: 2100, curve: 4, sweep: 0.06, a: 0.001, d: 0.1, shape: 3 }],
  }],
  bubble: ["Bubbles rising", {
    vary: 1,
    layers: [0, 0.07, 0.11, 0.19, 0.24].map((at, i) => ({ wave: "sine" as const, freq: [400, 520, 460, 600, 700][i], to: [900, 1200, 1000, 1400, 1600][i], curve: 3, at, a: 0.002, d: 0.05, shape: 3, gain: 1 - i * 0.12 })),
  }],
  wind: ["Gust of wind", {
    layers: [
      { wave: "pink", bp: 350, bpTo: 1100, q: 2.5, a: 0.5, d: 0.25, shape: 1.5 },
      { wave: "pink", bp: 1100, bpTo: 450, q: 2.5, at: 0.55, a: 0.05, d: 0.9, shape: 2 },
      { wave: "noise", bp: 2500, bpTo: 4000, q: 4, a: 0.45, d: 0.6, shape: 2, gain: 0.12 },
      { wave: "brown", lp: 250, a: 0.4, h: 0.3, d: 0.7, gain: 0.3 },
    ],
  }],
  "glass-break": ["Glass shatters", {
    vary: 0.8, varyF: 2, varyG: 3,
    verb: [0.35, 0.2],
    layers: [
      { wave: "noise", hp: 2500, lp: 11000, a: 0.001, d: 0.03, shape: -6 },
      { wave: "noise", bp: 1800, q: 0.8, a: 0.001, d: 0.03, shape: -6, drive: 1, gain: 0.6 },
      { wave: "noise", bp: 600, q: 1.5, a: 0.001, d: 0.04, shape: -5, gain: 0.3 },
      ...[0.01, 0.04, 0.07, 0.11, 0.16, 0.22, 0.3].map((at, i) => ({ wave: "modal" as const, freq: [2900, 3700, 4400, 3300, 5200, 4100, 6100][i], modes: [1, 1.59, 2.14, 2.65], at, a: 0.001, d: [0.15, 0.12, 0.1, 0.13, 0.09, 0.11, 0.08][i], shape: -5, gain: 0.5 - i * 0.04 })),
      { wave: "noise", hp: 4000, lp: 11000, a: 0.002, d: 0.35, shape: -4, gain: 0.25 },
    ],
  }],
  thud: ["Generic body or crate falling", {
    vary: 0.8, varyF: 2, varyG: 1,
    layers: [
      { wave: "noise", bp: 1200, q: 1, a: 0.001, d: 0.008, shape: -6, gain: 0.3 },
      { wave: "pink", lp: 900, lpTo: 250, a: 0.001, d: 0.18, shape: -3, drive: 3 },
      { wave: "modal", freq: 140, modes: [1, 2.32, 4.25, 6.63], a: 0.001, d: 0.25, shape: -4, drive: 1, gain: 0.9 },
      { wave: "noise", bp: 380, q: 3, a: 0.001, d: 0.1, shape: -4, drive: 1, gain: 0.9 },
      { wave: "sine", freq: 90, to: 50, a: 0.001, d: 0.18, shape: -4, drive: 1, gain: 0.5 },
      // the crate bounces once
      { wave: "pink", lp: 1100, lpTo: 300, at: 0.09, a: 0.001, d: 0.06, shape: -5, drive: 2, gain: 0.45 },
      { wave: "modal", freq: 150, modes: [1, 2.32, 4.25, 6.63], at: 0.09, a: 0.001, d: 0.12, shape: -5, gain: 0.4 },
    ],
  }],
  toss: ["Throw something", {
    vary: 1,
    varyF: 3,
    varyG: 1.5,
    layers: [
      { wave: "noise", bp: 500, bpTo: 1400, q: 1.5, a: 0.06, d: 0.03, shape: 1, drive: 1 },
      { wave: "noise", bp: 1400, bpTo: 500, q: 1.5, at: 0.06, a: 0.01, d: 0.25, shape: -4, drive: 1 },
    ],
  }],
  "fire-crackle": ["Campfire crackle", {
    layers: [
      { wave: "brown", lp: 800, a: 0.1, h: 0.6, d: 0.3, gain: 0.5 },
      ...[0.05, 0.13, 0.17, 0.3, 0.42, 0.48, 0.61, 0.74, 0.8].map((at, i) => ({ wave: "noise" as const, bp: 2500 + i * 300, q: 2, at, a: 0.001, d: 0.012, shape: 2, gain: 0.8 })),
    ],
  }],
  "crate-break": ["Wooden crate smashes into planks", {
    varyF: 2,
    varyG: 1.5,
    verb: [0.25, 0.12],
    layers: [
      { wave: "noise", bp: 1800, q: 1, a: 0.001, d: 0.02, shape: -5, drive: 2 },
      ...[0, 0.03, 0.07, 0.12, 0.18].map((at, i) => ({ wave: "modal" as const, freq: 240 + i * 55, modes: WOOD, at, a: 0.001, d: 0.12, shape: -5, gain: 1 - i * 0.15 })),
      { wave: "sine", freq: 110, to: 50, a: 0.001, d: 0.15, shape: -5, gain: 0.6 },
      { wave: "pink", lp: 1500, a: 0.001, d: 0.25, shape: -4, gain: 0.4 },
    ],
  }],
  "pot-break": ["Clay pot shatters (Zelda pots)", {
    varyF: 2,
    varyG: 1.5,
    verb: [0.25, 0.12],
    layers: [
      { wave: "noise", bp: 2500, q: 0.8, a: 0.001, d: 0.06, shape: -4, drive: 1.5 },
      { wave: "modal", freq: 650, modes: [1, 2.1, 3.4, 5.2], a: 0.001, d: 0.1, shape: -5 },
      ...[0.04, 0.08, 0.13, 0.19].map((at, i) => ({ wave: "modal" as const, freq: 1200 + i * 230, modes: [1, 2.1, 3.4], at, a: 0.001, d: 0.06, shape: -5, gain: 0.5 })),
    ],
  }],
  "metal-clang": ["Metal object or pipe hits the floor", {
    vary: 0.8,
    varyF: 1.5,
    varyG: 1,
    verb: [0.35, 0.18],
    layers: [
      { wave: "noise", bp: 3000, q: 1, a: 0.001, d: 0.015, shape: -5, gain: 0.6 },
      { wave: "modal", freq: 620, modes: [1, 2.756, 5.404, 8.933], a: 0.001, d: 0.7, shape: -3 },
      { wave: "metal", freq: 500, bp: 2000, q: 1.5, a: 0.001, d: 0.3, shape: -4, gain: 0.4 },
      { wave: "modal", freq: 640, modes: [1, 2.756, 5.404], at: 0.15, a: 0.001, d: 0.4, shape: -4, gain: 0.35 },
    ],
  }],
  "rock-crumble": ["Rocks and rubble crumble down", {
    varyF: 2,
    varyG: 1.5,
    verb: [0.4, 0.18],
    layers: [
      { wave: "brown", lp: 700, lpTo: 200, a: 0.01, h: 0.2, d: 0.6, shape: -3, drive: 1 },
      ...Array.from({ length: 10 }, (_, i) => ({ wave: "modal" as const, freq: 300 + (i * 173) % 500, modes: [1, 2.6, 4.9], at: i * 0.06 + (i % 3) * 0.012, a: 0.002, d: 0.06, shape: -6, gain: 0.8 - i * 0.05 })),
    ],
  }],
  ignite: ["Torch or fire ignites: whoomph", {
    vary: 0.5,
    varyF: 2,
    layers: [
      { wave: "pink", bp: 400, bpTo: 1500, q: 1, a: 0.04, d: 0.4, shape: -3, drive: 1 },
      { wave: "brown", lp: 400, a: 0.03, h: 0.15, d: 0.5, shape: -3, gain: 0.8 },
      { wave: "sine", freq: 90, to: 50, a: 0.02, d: 0.2, shape: -4, gain: 0.5 },
      ...[0.08, 0.15, 0.21, 0.3, 0.36, 0.45, 0.52, 0.6].map((at, i) => ({ wave: "noise" as const, bp: 2500 + (i % 3) * 900, q: 3, at, a: 0.001, d: 0.008, shape: -5, gain: 0.45 - i * 0.03 })),
    ],
  }],
});
