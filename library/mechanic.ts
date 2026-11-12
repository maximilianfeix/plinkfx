import { def } from "./def.ts";

export default def("mechanic", {
  "door-open": ["Creaky wooden door opening", {
    verb: [0.4, 0.2],
    layers: [
      { wave: "metal", freq: 1100, bp: 3000, q: 2, a: 0.001, d: 0.03, shape: 3, gain: 0.25 },
      { wave: "noise", bp: 1500, q: 1.5, a: 0.001, d: 0.012, drive: 1, gain: 0.2 },
      { wave: "saw", freq: 38, to: 62, vib: [3.5, 2.5], bp: 1100, q: 5, a: 0.08, h: 0.4, d: 0.3, shape: 1.5 },
      { wave: "saw", freq: 52, to: 44, vib: [5, 2], bp: 1900, q: 6, a: 0.1, h: 0.35, d: 0.3, shape: 1.5, gain: 0.5 },
    ],
  }],
  "door-close": ["Door shuts with a thud", {
    verb: [0.35, 0.18],
    layers: [
      { wave: "brown", lp: 400, a: 0.001, d: 0.25, shape: 2.5, gain: 1.2 },
      { wave: "sine", freq: 95, to: 50, a: 0.001, d: 0.22, drive: 1 },
      { wave: "noise", bp: 1500, q: 1.5, a: 0.001, d: 0.04, gain: 0.5 },
      { wave: "metal", freq: 900, bp: 3000, q: 2, at: 0.04, a: 0.001, d: 0.05, gain: 0.3 },
    ],
  }],
  "door-heavy": ["Heavy dungeon door slams", {
    verb: [0.8, 0.35],
    layers: [
      { wave: "saw", freq: 30, to: 45, vib: [2.5, 3], bp: 700, q: 6, a: 0.1, h: 0.5, d: 0.2, shape: 1.5, gain: 0.7 },
      { wave: "brown", lp: 300, at: 0.8, a: 0.001, d: 0.6, shape: 2.5, gain: 1.6, drive: 1 },
      { wave: "sine", freq: 70, to: 32, at: 0.8, a: 0.001, d: 0.5, drive: 1.5 },
      { wave: "noise", bp: 1200, at: 0.8, a: 0.001, d: 0.06, gain: 0.4 },
    ],
  }],
  "lock-open": ["Lock clicks open", {
    layers: [
      { wave: "metal", freq: 1300, bp: 3500, q: 2, a: 0.001, d: 0.03, shape: 3 },
      { wave: "metal", freq: 900, bp: 2500, q: 2, at: 0.09, a: 0.001, d: 0.06, shape: 3 },
      { wave: "noise", bp: 1500, q: 1.5, at: 0.09, a: 0.001, d: 0.03, gain: 0.5 },
      { wave: "sine", freq: 220, to: 140, at: 0.09, a: 0.001, d: 0.05, shape: 2.5, drive: 1, gain: 0.5 },
    ],
  }],
  locked: ["Door is locked: rattle", {
    layers: [0, 0.06, 0.12, 0.2].flatMap((at, i) => [
      { wave: "metal" as const, freq: 700 + i * 60, bp: 2200, q: 2, at, a: 0.001, d: 0.05, shape: 3, gain: 1 - i * 0.15 },
      { wave: "pink" as const, lp: 600, at, a: 0.001, d: 0.04, shape: 3, drive: 1, gain: 0.4 - i * 0.07 },
    ]),
  }],
  "chest-open": ["Treasure chest creaks open", {
    verb: [0.35, 0.18],
    layers: [
      { wave: "saw", freq: 45, to: 70, vib: [4, 2], bp: 1400, q: 5, a: 0.04, h: 0.25, d: 0.15, shape: 1.5 },
      { wave: "noise", bp: 900, q: 2, at: 0.42, a: 0.001, d: 0.05, gain: 0.6 },
      { wave: "sine", freq: 2093, fm: [3.01, 1.5, 0.2], at: 0.45, a: 0.002, d: 0.6, shape: 3, gain: 0.35 },
    ],
  }],
  lever: ["Pull a lever: clunk", {
    verb: [0.3, 0.15],
    layers: [
      { wave: "noise", bp: 700, q: 1.5, a: 0.02, d: 0.08, gain: 0.5 },
      { wave: "metal", freq: 380, bp: 1400, q: 2, at: 0.09, a: 0.001, d: 0.15, shape: 3 },
      { wave: "sine", freq: 120, to: 70, at: 0.09, a: 0.001, d: 0.12, gain: 0.8 },
    ],
  }],
  button: ["Press a mechanical floor button", {
    layers: [
      { wave: "sine", freq: 300, to: 120, a: 0.001, d: 0.07, shape: 2.5 },
      { wave: "noise", bp: 2000, q: 2, a: 0.001, d: 0.02, gain: 0.6 },
      { wave: "triangle", freq: 1200, at: 0.06, a: 0.001, d: 0.05, gain: 0.25 },
    ],
  }],
  ratchet: ["Gear or crank turning", {
    layers: [0, 0.045, 0.09, 0.135, 0.18, 0.225, 0.27].flatMap((at, i) => [
      { wave: "noise" as const, bp: i % 2 ? 2400 : 3200, q: 3, at, a: 0.001, d: 0.02, shape: 3, drive: 1 },
      { wave: "metal" as const, freq: 1500, hp: 4000, at, a: 0.001, d: 0.012, gain: 0.3 },
    ]),
  }],
  machine: ["Machine starts up and hums", {
    vary: 0.2,
    layers: [
      { wave: "saw", freq: 30, to: 110, curve: 0.6, lp: 600, a: 0.2, h: 0.6, d: 0.3, shape: 2 },
      { wave: "pink", bp: 900, bpTo: 1600, q: 1.5, a: 0.3, h: 0.5, d: 0.3, gain: 0.2 },
      { wave: "noise", bp: 2000, a: 0.3, h: 0.5, d: 0.3, gain: 0.08 },
    ],
  }],
});
