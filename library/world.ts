import { def } from "./def.ts";

export default def("world", {
  whoosh: ["Medium whoosh for dashes and swings", {
    layers: [
      { wave: "pink", bp: 450, bpTo: 1800, q: 1.6, a: 0.13, d: 0.02, shape: 1 },
      { wave: "pink", bp: 1800, bpTo: 500, q: 1.6, at: 0.13, a: 0.01, d: 0.2, shape: 2 },
      { wave: "noise", bp: 3000, bpTo: 6000, a: 0.12, d: 0.12, gain: 0.2 },
      { wave: "brown", lp: 300, a: 0.12, d: 0.15, gain: 0.3 },
    ],
  }],
  swing: ["Sword or stick swing", {
    vary: 1,
    layers: [
      { wave: "noise", bp: 900, bpTo: 3500, q: 2.5, a: 0.06, d: 0.1, shape: 2 },
      { wave: "noise", bp: 3000, bpTo: 1200, q: 2, at: 0.08, a: 0.02, d: 0.06, gain: 0.4 },
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
    verb: [0.35, 0.2],
    layers: [
      { wave: "noise", hp: 3000, a: 0.001, d: 0.15, shape: 3 },
      { wave: "noise", bp: 1500, q: 0.8, a: 0.001, d: 0.05, shape: 3, drive: 1, gain: 0.6 },
      { wave: "metal", freq: 2200, hp: 5000, a: 0.001, d: 0.35, shape: 3, gain: 0.5 },
      ...[0.05, 0.09, 0.14, 0.2, 0.27, 0.33].map((at, i) => ({ wave: "sine" as const, freq: [3800, 4600, 5200, 4100, 6000, 4800][i], at, a: 0.001, d: 0.06, shape: 3, gain: 0.35 })),
    ],
  }],
  thud: ["Generic body or crate falling", {
    layers: [
      { wave: "sine", freq: 110, to: 45, a: 0.001, d: 0.18, shape: 2, drive: 1 },
      { wave: "brown", lp: 600, a: 0.001, d: 0.15, gain: 0.8 },
      { wave: "noise", bp: 1000, a: 0.001, d: 0.03, gain: 0.3 },
    ],
  }],
  toss: ["Throw something", {
    vary: 1,
    layers: [
      { wave: "noise", bp: 500, bpTo: 1400, q: 1.5, a: 0.06, d: 0.03, shape: 1, drive: 1 },
      { wave: "noise", bp: 1400, bpTo: 600, q: 1.5, at: 0.06, a: 0.01, d: 0.1, shape: 2, drive: 1 },
    ],
  }],
  "fire-crackle": ["Campfire crackle", {
    layers: [
      { wave: "brown", lp: 800, a: 0.1, h: 0.6, d: 0.3, gain: 0.5 },
      ...[0.05, 0.13, 0.17, 0.3, 0.42, 0.48, 0.61, 0.74, 0.8].map((at, i) => ({ wave: "noise" as const, bp: 2500 + i * 300, q: 2, at, a: 0.001, d: 0.012, shape: 2, gain: 0.8 })),
    ],
  }],
});
