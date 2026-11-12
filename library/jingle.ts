import { def } from "./def.ts";

// Short stingers. vary is kept low so the melody stays in tune with music.
export default def("jingle", {
  victory: ["Victory fanfare", {
    vary: 0.05,
    verb: [0.45, 0.2],
    layers: [
      { wave: "square", duty: 0.5, freq: 523, arp: [0, 0, 0, 4, 7, 7, 12, 12], arpRate: 0.1, a: 0.003, h: 0.75, d: 0.35, shape: 2, lp: 4000 },
      { wave: "triangle", freq: 262, arp: [0, 0, 0, 4, 7, 7, 12, 12], arpRate: 0.1, a: 0.003, h: 0.75, d: 0.35, gain: 0.6 },
    ],
  }],
  "level-complete": ["Level complete: rising run and a held chord", {
    vary: 0.05,
    verb: [0.5, 0.25],
    layers: [
      { wave: "square", duty: 0.25, freq: 392, arp: [0, 4, 7, 12, 16, 19], arpRate: 0.07, a: 0.003, h: 0.6, d: 0.5, shape: 2, lp: 4500 },
      { wave: "triangle", freq: 196, arp: [0, 0, 7, 7, 12, 12], arpRate: 0.07, a: 0.003, h: 0.6, d: 0.5, gain: 0.6 },
      { wave: "sine", freq: 1568, fm: [2, 1, 0.3], at: 0.42, a: 0.003, d: 0.8, gain: 0.3 },
    ],
  }],
  "game-over": ["Game over: slow sad descent", {
    vary: 0.05,
    verb: [0.5, 0.25],
    layers: [
      { wave: "triangle", freq: 392, arp: [0, -1, -2, -3], arpRate: 0.28, a: 0.01, h: 1, d: 0.5, shape: 2, vib: [5, 0.25] },
      { wave: "square", duty: 0.5, freq: 196, arp: [0, -1, -2, -3], arpRate: 0.28, a: 0.01, h: 1, d: 0.5, lp: 1200, gain: 0.35 },
    ],
  }],
  lose: ["Lost a round: wah-wah", {
    vary: 0.05,
    layers: [
      { wave: "saw", freq: 330, arp: [0, -1, -2], arpRate: 0.22, lp: 600, lpTo: 2500, q: 3, a: 0.01, h: 0.5, d: 0.3, shape: 2, vib: [6, 0.3] },
    ],
  }],
  "secret-found": ["Secret found: rising mystery arpeggio", {
    vary: 0.05,
    verb: [0.4, 0.2],
    layers: [
      { wave: "square", duty: 0.25, freq: 784, arp: [0, -1, -9, -14, -13, -5, -1, 4], arpRate: 0.075, a: 0.002, h: 0.55, d: 0.25, shape: 2, lp: 5000 },
      { wave: "sine", freq: 1568, arp: [0, -1, -9, -14, -13, -5, -1, 4], arpRate: 0.075, a: 0.002, h: 0.55, d: 0.2, gain: 0.25 },
    ],
  }],
  achievement: ["Achievement unlocked", {
    vary: 0.05,
    verb: [0.5, 0.25],
    layers: [
      { wave: "sine", freq: 1047, fm: [2, 1.2, 0.2], arp: [0, 7, 12], arpRate: 0.09, a: 0.002, h: 0.2, d: 0.7, shape: 2.5 },
      { wave: "triangle", freq: 523, arp: [0, 7, 12], arpRate: 0.09, a: 0.002, h: 0.2, d: 0.5, gain: 0.5 },
      { wave: "metal", freq: 3000, hp: 7000, at: 0.18, a: 0.002, d: 0.4, gain: 0.1 },
    ],
  }],
  "puzzle-solved": ["Puzzle solved: clear 'ta-da'", {
    vary: 0.05,
    verb: [0.45, 0.22],
    layers: [
      { wave: "triangle", freq: 659, arp: [0, 5, 9, 12], arpRate: 0.06, a: 0.002, h: 0.3, d: 0.45, shape: 2 },
      { wave: "sine", freq: 1319, arp: [0, 5, 9, 12], arpRate: 0.06, fm: [2, 0.8, 0.2], a: 0.002, h: 0.3, d: 0.4, gain: 0.4 },
    ],
  }],
  checkpoint: ["Checkpoint reached: three quick mallet notes and a bell", {
    vary: 0.05,
    verb: [0.4, 0.2],
    layers: [
      ...[0, 0.07, 0.14].map((at, i) => ({ wave: "sine" as const, freq: [784, 1047, 1319][i], fm: [4, 1.5, 0.03] as [number, number, number], at, a: 0.001, d: 0.25, shape: 3, gain: 0.8 })),
      { wave: "sine", freq: 1568, fm: [3.5, 1.2, 0.15], at: 0.21, a: 0.002, d: 0.9, shape: 2.5 },
      { wave: "triangle", freq: 523, at: 0.21, a: 0.003, h: 0.1, d: 0.5, gain: 0.35 },
    ],
  }],
  "round-start": ["Round start stinger", {
    vary: 0.05,
    layers: [
      { wave: "square", duty: 0.5, freq: 440, arp: [0, 0, 12], arpRate: 0.12, a: 0.003, h: 0.3, d: 0.2, shape: 2, lp: 3500 },
      { wave: "sine", freq: 110, arp: [0, 0, 12], arpRate: 0.12, a: 0.003, h: 0.3, d: 0.2, gain: 0.6 },
    ],
  }],
});
