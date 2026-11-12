import { def } from "./def.ts";

// One-shots from outdoors. No loops: these are events (a drop, a croak, a far rumble).
export default def("nature", {
  "thunder-far": ["Distant thunder rolling in", {
    vary: 0.5,
    varyF: 3,
    varyG: 1.5,
    verb: [0.7, 0.4],
    layers: [
      { wave: "brown", lp: 320, lpTo: 90, a: 0.25, h: 0.25, d: 1.5, shape: -3, gain: 1.6, drive: 0.8 },
      ...[0.1, 0.22, 0.4].map((at, i) => ({ wave: "brown" as const, lp: 900, lpTo: 300, at, a: 0.01, d: 0.35, shape: -4, gain: 0.7 - i * 0.15 })),
    ],
  }],
  "rain-drop": ["A raindrop on a leaf", {
    vary: 2,
    varyF: 2,
    layers: [
      { wave: "noise", hp: 3000, a: 0.001, d: 0.008, shape: -5, gain: 0.6 },
      { wave: "sine", freq: 1400, to: 2600, curve: 4, sweep: 0.03, at: 0.002, a: 0.001, d: 0.05, shape: -4 },
    ],
  }],
  "bird-chirp": ["Songbird, three quick chirps", {
    vary: 1.5,
    verb: [0.3, 0.15],
    layers: [0, 0.09, 0.17].map((at, i) => ({ wave: "sine" as const, freq: [3200, 3500, 3000][i], to: [4400, 4700, 3900][i], fm: [2, 0.4, 0.02] as [number, number, number], vib: [40, 0.6] as [number, number], at, a: 0.003, d: 0.06, shape: -3, gain: 1 - i * 0.1 })),
  }],
  "frog-croak": ["Frog croak", {
    vary: 1,
    layers: [0, 0.045, 0.09, 0.135].map((at, i) => ({ wave: "saw" as const, freq: 120, formant: [400, 1200], at, a: 0.004, d: 0.04, shape: -3, drive: 1, gain: 1 - i * 0.12 })),
  }],
  "leaf-rustle": ["Leaves rustling in a bush", {
    varyF: 3,
    varyG: 1.5,
    layers: [
      { wave: "pink", bp: 3000, q: 0.8, a: 0.05, h: 0.1, d: 0.25, shape: -3, gain: 0.6 },
      ...[0.02, 0.06, 0.09, 0.15, 0.19, 0.26, 0.31].map((at, i) => ({ wave: "noise" as const, bp: 3500 + (i % 3) * 700, q: 2, at, a: 0.001, d: 0.015, shape: -5, gain: 0.5 })),
    ],
  }],
  "stone-drop": ["Pebble drops and bounces once", {
    vary: 1.5,
    varyF: 2,
    layers: [
      { wave: "noise", bp: 2500, a: 0.001, d: 0.006, shape: -5, gain: 0.7 },
      { wave: "modal", freq: 1100, modes: [1, 2.6, 4.9, 7.3], a: 0.001, d: 0.12, shape: -5 },
      { wave: "noise", bp: 2800, at: 0.16, a: 0.001, d: 0.005, shape: -5, gain: 0.4 },
      { wave: "modal", freq: 1150, modes: [1, 2.6, 4.9, 7.3], at: 0.16, a: 0.001, d: 0.08, shape: -5, gain: 0.5 },
    ],
  }],
});
