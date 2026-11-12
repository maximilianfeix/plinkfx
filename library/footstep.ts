import { def } from "./def.ts";

// Footsteps: heel (low body) + scuff (surface texture) + a short tail, all with exponential decay.
// Takes vary in pitch, brightness and level so a walk cycle never sounds like a loop.
const walk = { vary: 1.5, varyF: 4, varyG: 2 };
const heel = (lp = 500, d = 0.09, gain = 1) => ({ wave: "pink" as const, lp, lpTo: lp / 2, a: 0.001, d, shape: -6, drive: 0.5, gain });
const tail = (gain = 0.35) => ({ wave: "brown" as const, lp: 220, a: 0.002, d: 0.24, shape: -4, gain });

export default def("footstep", {
  "step-grass": ["Soft step on grass", {
    ...walk,
    layers: [
      heel(450, 0.08, 0.8),
      { wave: "pink", bp: 1100, q: 0.8, a: 0.008, d: 0.14, shape: -4, gain: 0.55 },
      { wave: "pink", hp: 2000, lp: 5000, at: 0.01, a: 0.01, d: 0.12, shape: -4, gain: 0.25 },
      { wave: "crunch", freq: 7000, hp: 3000, at: 0.012, a: 0.01, d: 0.08, shape: -4, gain: 0.1 },
      tail(0.3),
    ],
  }],
  "step-stone": ["Hard sole on stone", {
    ...walk,
    layers: [
      heel(600, 0.07),
      { wave: "noise", bp: 1800, q: 1.2, at: 0.004, a: 0.001, d: 0.03, shape: -5, drive: 1, gain: 0.35 },
      { wave: "noise", bp: 520, q: 10, a: 0.001, d: 0.06, shape: -5, gain: 0.5 },
      tail(0.25),
    ],
  }],
  "step-wood": ["Step on a wooden floor", {
    ...walk,
    layers: [
      heel(500, 0.08, 0.8),
      { wave: "modal", freq: 180, modes: [1, 2.3, 4.1], a: 0.001, d: 0.12, shape: -5, gain: 0.5 },
      { wave: "noise", bp: 1800, q: 1.2, at: 0.006, a: 0.001, d: 0.025, shape: -5, gain: 0.25 },
      tail(0.2),
    ],
  }],
  "step-metal": ["Step on a metal grate", {
    ...walk,
    verb: [0.2, 0.15],
    layers: [
      heel(550, 0.07, 0.8),
      { wave: "modal", freq: 420, modes: [1, 2.76, 5.4, 8.93], a: 0.001, d: 0.3, shape: -4, gain: 0.35 },
      { wave: "metal", freq: 600, hp: 1800, a: 0.001, d: 0.12, shape: -5, gain: 0.35 },
      { wave: "noise", bp: 1500, a: 0.001, d: 0.03, shape: -5, gain: 0.4 },
    ],
  }],
  "step-snow": ["Crunchy step in snow", {
    ...walk,
    layers: [
      heel(400, 0.08, 0.6),
      { wave: "crunch", freq: 9000, hp: 1200, lp: 7000, a: 0.02, d: 0.15, shape: -3, gain: 0.8 },
      { wave: "pink", lp: 1500, a: 0.02, d: 0.12, shape: -4, gain: 0.5 },
    ],
  }],
  "step-gravel": ["Step on loose gravel", {
    ...walk,
    layers: [
      heel(500, 0.08, 0.8),
      { wave: "crunch", freq: 3000, hp: 900, lp: 4500, a: 0.005, d: 0.12, shape: -4, drive: 1, gain: 0.6 },
      ...[0.02, 0.045, 0.07, 0.1].map((at, i) => ({ wave: "noise" as const, bp: [1400, 2200, 1700, 2600][i], q: 3, at, a: 0.001, d: 0.02, shape: -5, gain: 0.45 - i * 0.07 })),
      tail(0.2),
    ],
  }],
  "step-water": ["Splashy step in a puddle", {
    ...walk,
    layers: [
      heel(450, 0.07, 0.6),
      { wave: "noise", bp: 1300, bpTo: 500, q: 1.5, a: 0.004, d: 0.15, shape: -3 },
      { wave: "sine", freq: 350, to: 900, curve: 3, at: 0.03, a: 0.002, d: 0.06, shape: 3, gain: 0.35 },
    ],
  }],
  "step-sand": ["Muffled step in sand", {
    ...walk,
    layers: [
      heel(400, 0.09, 0.7),
      { wave: "pink", hp: 400, lp: 2600, a: 0.015, d: 0.14, shape: -3 },
      { wave: "noise", hp: 3000, lp: 7000, at: 0.02, a: 0.02, d: 0.08, shape: -4, gain: 0.12 },
    ],
  }],
  "step-retro": ["8-bit footstep tick", {
    vary: 2,
    bits: 4,
    layers: [{ wave: "crunch", freq: 4000, a: 0.001, d: 0.035, shape: 2 }],
  }],
  "step-heavy": ["Heavy creature stomp", {
    vary: 1,
    varyF: 3,
    varyG: 1.5,
    verb: [0.2, 0.12],
    layers: [
      { wave: "sine", freq: 90, to: 45, a: 0.002, d: 0.25, shape: -5, drive: 1 },
      heel(400, 0.15),
      { wave: "noise", bp: 900, a: 0.001, d: 0.04, shape: -5, gain: 0.3 },
      tail(0.35),
    ],
  }],
});
