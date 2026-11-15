import { def } from "./def.ts";

export default def("mechanic", {
  "door-open": ["Creaky wooden door opening", {
    vary: 1.5, varyF: 2, varyG: 1.5,
    verb: [0.4, 0.2],
    layers: [
      { wave: "noise", bp: 2500, q: 2, a: 0.001, d: 0.008, shape: -6, gain: 0.3 },
      { wave: "modal", freq: 1700, modes: [1, 2.76, 5.4], a: 0.001, d: 0.06, shape: -5, gain: 0.15 },
      { wave: "saw", freq: 26, to: 40, vib: [2.3, 4], formant: [620, 1150, 2300], at: 0.05, a: 0.12, h: 0.35, d: 0.3, shape: -3 },
      { wave: "saw", freq: 33, to: 24, vib: [3.7, 5], formant: [450, 900, 1750], at: 0.12, a: 0.1, h: 0.25, d: 0.3, shape: -3, gain: 0.6 },
    ],
  }],
  "door-close": ["Door shuts with a thud", {
    varyF: 2, varyG: 1,
    verb: [0.35, 0.18],
    layers: [
      { wave: "noise", bp: 1500, q: 1.5, a: 0.001, d: 0.012, shape: -5, gain: 0.35 },
      { wave: "pink", lp: 700, lpTo: 200, a: 0.001, d: 0.14, shape: -4, drive: 2, gain: 1.2 },
      { wave: "noise", bp: 220, q: 4, a: 0.001, d: 0.15, shape: -4, drive: 1, gain: 1.2 },
      { wave: "noise", bp: 480, q: 3, a: 0.001, d: 0.08, shape: -4, drive: 1, gain: 0.9 },
      { wave: "modal", freq: 160, modes: [1, 2.32, 4.25], a: 0.001, d: 0.2, shape: -5, gain: 0.5 },
      { wave: "modal", freq: 1500, modes: [1, 2.76, 5.4], at: 0.04, a: 0.001, d: 0.05, shape: -5, gain: 0.25 },
    ],
  }],
  "door-heavy": ["Heavy dungeon door slams", {
    varyF: 2, varyG: 1,
    verb: [0.7, 0.3],
    layers: [
      { wave: "saw", freq: 22, to: 34, vib: [2.1, 4], formant: [300, 700, 1400], a: 0.1, h: 0.3, d: 0.15, shape: -3, gain: 0.8 },
      { wave: "noise", bp: 1200, at: 0.55, a: 0.001, d: 0.015, shape: -5, gain: 0.5 },
      { wave: "noise", bp: 160, q: 5, at: 0.55, a: 0.001, d: 0.4, shape: -5, gain: 1.3 },
      { wave: "noise", bp: 340, q: 4, at: 0.55, a: 0.001, d: 0.25, shape: -5, gain: 0.8 },
      { wave: "modal", freq: 95, modes: [1, 2.32, 4.25, 6.63], at: 0.55, a: 0.001, d: 0.5, shape: -4, gain: 0.6 },
      { wave: "sine", freq: 60, to: 35, at: 0.55, a: 0.001, d: 0.5, shape: -5, gain: 0.4 },
      { wave: "brown", lp: 300, at: 0.56, a: 0.002, d: 0.6, shape: -4, gain: 0.4 },
      { wave: "modal", freq: 1300, modes: [1, 2.76, 5.4], at: 0.6, a: 0.001, d: 0.08, shape: -5, gain: 0.15 },
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
    vary: 1, varyF: 2, varyG: 1.5,
    verb: [0.35, 0.18],
    layers: [
      { wave: "saw", freq: 30, to: 48, vib: [3.1, 4], formant: [520, 1300, 2600], a: 0.05, h: 0.25, d: 0.15, shape: -3 },
      { wave: "saw", freq: 41, to: 33, vib: [4.6, 3], formant: [380, 980], at: 0.08, a: 0.05, h: 0.15, d: 0.15, shape: -3, gain: 0.5 },
      { wave: "noise", bp: 900, q: 2, at: 0.42, a: 0.001, d: 0.05, shape: -5, gain: 0.6 },
      { wave: "modal", freq: 200, modes: [1, 2.32, 4.25], at: 0.42, a: 0.001, d: 0.12, shape: -5, gain: 0.5 },
      { wave: "sine", freq: 2093, fm: [3.01, 1.5, 0.2], at: 0.45, a: 0.002, d: 0.6, shape: -4, gain: 0.35 },
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
    varyF: 1.5, varyG: 1,
    layers: [
      { wave: "noise", bp: 2000, q: 2, a: 0.001, d: 0.008, shape: -5, gain: 0.4 },
      { wave: "modal", freq: 240, modes: [1, 2.32, 4.25], a: 0.001, d: 0.12, shape: -4, drive: 1, gain: 1.2 },
      { wave: "pink", lp: 1200, lpTo: 300, a: 0.001, d: 0.07, shape: -5, drive: 1.5 },
      { wave: "noise", bp: 2600, q: 3, at: 0.06, a: 0.001, d: 0.006, shape: -6, gain: 0.4 },
      { wave: "modal", freq: 900, modes: [1, 2.32], at: 0.06, a: 0.001, d: 0.03, shape: -5, gain: 0.3 },
    ],
  }],
  ratchet: ["Gear or crank turning", {
    varyF: 1.5, varyG: 2,
    layers: [0, 0.045, 0.09, 0.135, 0.18, 0.225, 0.27].flatMap((at, i) => [
      { wave: "noise" as const, bp: i % 2 ? 2400 : 3200, q: 3, at, a: 0.001, d: 0.02, shape: -5, drive: 1 },
      { wave: "noise" as const, bp: 900, q: 2, at, a: 0.001, d: 0.015, shape: -5, gain: 0.5 },
      { wave: "modal" as const, freq: 2600, modes: [1, 2.76, 5.4], at, a: 0.001, d: 0.03, shape: -5, gain: 0.3 },
    ]),
  }],
  machine: ["Machine starts up and hums", {
    vary: 0.6, varyF: 2, varyG: 1,
    layers: [
      { wave: "saw", freq: 30, to: 110, curve: 0.6, lp: 600, a: 0.2, h: 0.6, d: 0.3, shape: 2 },
      { wave: "square", duty: 0.2, freq: 60, to: 220, curve: 0.6, bp: 900, q: 3, kt: 0.5, a: 0.25, h: 0.55, d: 0.3, shape: 2, gain: 1 },
      { wave: "sine", freq: 240, to: 880, curve: 0.6, a: 0.3, h: 0.5, d: 0.3, gain: 0.2 },
      { wave: "crunch", freq: 400, to: 1500, curve: 0.6, hp: 1500, lp: 5000, a: 0.3, h: 0.5, d: 0.3, gain: 0.08 },
    ],
  }],
});
