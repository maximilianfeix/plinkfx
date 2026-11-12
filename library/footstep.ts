import { def } from "./def.ts";

// Footsteps get a wider pitch spread so a walk cycle never sounds like a loop.
export default def("footstep", {
  "step-grass": ["Soft step on grass", {
    vary: 1.5,
    layers: [
      { wave: "pink", lp: 900, a: 0.004, d: 0.05, shape: 2.5, gain: 0.5 },
      { wave: "pink", hp: 1500, lp: 6000, a: 0.008, d: 0.09, shape: 2.5, gain: 0.7 },
      { wave: "crunch", freq: 7000, hp: 3000, at: 0.01, a: 0.01, d: 0.06, gain: 0.25 },
    ],
  }],
  "step-stone": ["Hard sole on stone", {
    vary: 1.5,
    layers: [
      { wave: "pink", lp: 700, a: 0.001, d: 0.04, shape: 3, drive: 1, gain: 0.7 },
      { wave: "noise", bp: 1800, q: 1.3, a: 0.001, h: 0.008, d: 0.04, shape: 3, drive: 3, gain: 0.8 },
      { wave: "noise", bp: 520, q: 10, a: 0.001, d: 0.045, shape: 2.5, gain: 0.7 },
      { wave: "sine", freq: 190, to: 110, at: 0.003, a: 0.001, d: 0.05, shape: 3, gain: 0.5 },
    ],
  }],
  "step-wood": ["Step on a wooden floor", {
    vary: 1.5,
    layers: [
      { wave: "sine", freq: 230, to: 160, a: 0.001, d: 0.07, shape: 2.5 },
      { wave: "noise", bp: 900, q: 2.5, a: 0.001, d: 0.05, shape: 3, gain: 0.6 },
      { wave: "triangle", freq: 460, a: 0.001, d: 0.04, shape: 3, gain: 0.15 },
    ],
  }],
  "step-metal": ["Step on a metal grate", {
    vary: 1.5,
    verb: [0.2, 0.15],
    layers: [
      { wave: "metal", freq: 600, hp: 1800, a: 0.001, d: 0.12, shape: 3.5, drive: 1, gain: 0.7 },
      { wave: "noise", bp: 1500, a: 0.001, d: 0.03, shape: 3, drive: 1 },
      { wave: "pink", lp: 600, a: 0.001, d: 0.04, shape: 3, drive: 1, gain: 0.8 },
      { wave: "sine", freq: 150, a: 0.001, d: 0.05, gain: 0.5 },
    ],
  }],
  "step-snow": ["Crunchy step in snow", {
    vary: 1.5,
    layers: [
      { wave: "crunch", freq: 9000, hp: 1200, lp: 7000, a: 0.02, d: 0.13, shape: 2 },
      { wave: "pink", lp: 1500, a: 0.02, d: 0.1, gain: 0.5 },
    ],
  }],
  "step-gravel": ["Step on loose gravel", {
    vary: 1.5,
    layers: [
      { wave: "pink", lp: 800, a: 0.002, d: 0.045, shape: 3, drive: 1, gain: 0.8 },
      { wave: "crunch", freq: 3500, hp: 1500, a: 0.005, d: 0.1, shape: 2, drive: 1 },
      ...[0.02, 0.04, 0.06, 0.085].map((at, i) => ({ wave: "noise" as const, bp: [2500, 3800, 3000, 4200][i], q: 2, at, a: 0.001, d: 0.015, shape: 3, gain: 0.5 - i * 0.07 })),
    ],
  }],
  "step-water": ["Splashy step in a puddle", {
    vary: 1.5,
    layers: [
      { wave: "noise", bp: 1300, bpTo: 500, q: 1.5, a: 0.004, d: 0.12, shape: 2 },
      { wave: "sine", freq: 350, to: 900, curve: 3, at: 0.03, a: 0.002, d: 0.05, shape: 3, gain: 0.35 },
    ],
  }],
  "step-sand": ["Muffled step in sand", {
    vary: 1.5,
    layers: [
      { wave: "pink", lp: 700, a: 0.006, d: 0.07, shape: 2.5, gain: 0.5 },
      { wave: "pink", hp: 400, lp: 2600, a: 0.015, d: 0.11, shape: 2 },
      { wave: "noise", hp: 3000, lp: 7000, at: 0.02, a: 0.02, d: 0.08, gain: 0.12 },
    ],
  }],
  "step-retro": ["8-bit footstep tick", {
    vary: 2,
    bits: 4,
    layers: [{ wave: "crunch", freq: 4000, a: 0.001, d: 0.035, shape: 2 }],
  }],
  "step-heavy": ["Heavy creature stomp", {
    vary: 1,
    verb: [0.2, 0.12],
    layers: [
      { wave: "sine", freq: 75, to: 38, a: 0.002, d: 0.18, shape: 2, drive: 1 },
      { wave: "brown", lp: 500, a: 0.002, d: 0.15, gain: 0.8 },
      { wave: "noise", bp: 900, a: 0.001, d: 0.03, gain: 0.3 },
    ],
  }],
});
