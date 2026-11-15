import { def } from "./def.ts";

// Cards, chips, dice and slots. Paper is band-passed noise; chips and dice are short `modal` knocks.
const WOOD = [1, 2.32, 4.25, 6.63];

export default def("card", {
  "card-flip": ["Flip a card face up: quick papery snap", {
    vary: 1,
    varyF: 3,
    varyG: 1.5,
    layers: [
      { wave: "noise", bp: 2600, bpTo: 4200, q: 1.2, a: 0.012, d: 0.035, shape: -4, gain: 0.7 },
      { wave: "noise", bp: 3800, q: 2.5, at: 0.045, a: 0.001, d: 0.012, shape: -6 },
      { wave: "pink", bp: 900, q: 1.5, at: 0.046, a: 0.001, d: 0.03, shape: -5, gain: 0.4 },
    ],
  }],
  "card-deal": ["Deal a card across the table: swish and slap", {
    vary: 1,
    varyF: 3,
    varyG: 1.5,
    layers: [
      { wave: "noise", bp: 1800, bpTo: 4500, q: 1.4, a: 0.05, d: 0.03, shape: 1 },
      { wave: "noise", bp: 3000, q: 1.5, at: 0.08, a: 0.001, d: 0.02, shape: -6, drive: 1 },
      { wave: "pink", lp: 1200, at: 0.08, a: 0.001, d: 0.04, shape: -5, gain: 0.5 },
    ],
  }],
  "card-place": ["Lay a card down on felt", {
    vary: 0.8,
    varyF: 2,
    varyG: 1,
    layers: [
      { wave: "pink", bp: 1400, q: 1, a: 0.002, d: 0.09, shape: -5 },
      { wave: "noise", bp: 3500, q: 2, a: 0.001, d: 0.008, shape: -6, gain: 0.25 },
      { wave: "pink", lp: 600, a: 0.002, d: 0.12, shape: -4, gain: 0.5 },
    ],
  }],
  "card-shuffle": ["Riffle shuffle: a fast burst of card ticks", {
    vary: 0.5,
    varyF: 2,
    layers: [
      ...Array.from({ length: 16 }, (_, i) => ({ wave: "noise" as const, bp: 2800 + (i % 3) * 500, q: 2, at: i * 0.022 + (i % 2) * 0.004, a: 0.001, d: 0.012, shape: -5, gain: 0.5 + Math.sin(i / 5) * 0.4 })),
      { wave: "pink" as const, bp: 2000, q: 0.8, a: 0.05, h: 0.2, d: 0.12, gain: 0.25 },
    ],
  }],
  "chip-stack": ["Poker chips clack onto a stack", {
    vary: 0.6,
    varyF: 2,
    varyG: 1.5,
    layers: [0, 0.035, 0.06].flatMap((at, i) => [
      { wave: "modal" as const, freq: 1900 + i * 120, modes: [1, 1.59, 2.14, 2.65], at, a: 0.001, d: 0.06, shape: -6, gain: 1 - i * 0.2 },
      { wave: "noise" as const, bp: 4500, q: 2, at, a: 0.001, d: 0.006, shape: -6, gain: 0.5 },
    ]),
  }],
  "dice-roll": ["Dice tumble across a table and settle", {
    vary: 0.8,
    varyF: 2,
    varyG: 2,
    layers: [0, 0.07, 0.13, 0.2, 0.25, 0.31, 0.36, 0.4].flatMap((at, i) => [
      { wave: "modal" as const, freq: 900 + (i % 3) * 180, modes: WOOD, at, a: 0.001, d: 0.05, shape: -6, gain: 1 - i * 0.1 },
      { wave: "noise" as const, bp: 3000, q: 2, at, a: 0.001, d: 0.006, shape: -6, gain: 0.4 - i * 0.04 },
    ]),
  }],
  "slot-spin": ["Slot reels spinning: fast ratchet ticks", {
    vary: 0.4,
    varyF: 1.5,
    layers: [
      ...Array.from({ length: 18 }, (_, i) => ({ wave: "square" as const, duty: 0.25, freq: 1400, at: i * 0.04, a: 0.001, d: 0.02, shape: 3, lp: 4000, gain: 0.5 })),
      { wave: "noise" as const, bp: 2500, q: 1, a: 0.05, h: 0.6, d: 0.1, gain: 0.08 },
    ],
  }],
  "slot-stop": ["A reel locks into place: clunk and ding", {
    vary: 0.2,
    verb: [0.25, 0.12],
    layers: [
      { wave: "noise", bp: 1200, q: 1.5, a: 0.001, d: 0.02, shape: -5, drive: 1 },
      { wave: "sine", freq: 150, to: 90, a: 0.001, d: 0.08, shape: -5, gain: 0.7 },
      { wave: "sine", freq: 1568, fm: [3.5, 1.4, 0.1], at: 0.04, a: 0.002, d: 0.4, shape: -4, gain: 0.4 },
    ],
  }],
  jackpot: ["Jackpot: bell flurry over a rising arpeggio", {
    vary: 0.05,
    verb: [0.4, 0.2],
    echo: [0.08, 0.3, 0.2],
    layers: [
      { wave: "square", duty: 0.25, freq: 784, arp: [0, 4, 7, 12, 16, 19, 24, 19, 24], arpRate: 0.07, a: 0.002, h: 0.55, d: 0.4, shape: 2, lp: 5000, gain: 0.5 },
      ...[0.1, 0.25, 0.4, 0.55, 0.7, 0.85].map((at, i) => ({ wave: "sine" as const, freq: 2093 + (i % 2) * 544, fm: [3.5, 1.6, 0.1] as [number, number, number], at, a: 0.002, d: 0.35, shape: -4, gain: 0.3 })),
      { wave: "metal", freq: 5000, hp: 7000, a: 0.01, h: 0.8, d: 0.4, gain: 0.06 },
    ],
  }],
});
