import { def } from "./def.ts";

export default def("explosion", {
  explosion: ["Mid-size explosion: crack, rumble, tail", {
    verb: [0.45, 0.22],
    layers: [
      { wave: "noise", hp: 1500, a: 0.001, d: 0.06, shape: 3, gain: 0.6 },
      { wave: "brown", lp: 1100, lpTo: 140, a: 0.002, d: 1.1, shape: 2.5, drive: 1.2, gain: 1.4 },
      { wave: "sine", freq: 110, to: 36, curve: 3, a: 0.001, d: 0.5, shape: 2, drive: 1 },
      { wave: "crunch", freq: 3000, to: 300, a: 0.001, d: 0.35, shape: 3, lp: 5000, gain: 0.4 },
    ],
  }],
  "explosion-small": ["Small pop of an explosion, grenades, barrels", {
    verb: [0.3, 0.15],
    layers: [
      { wave: "noise", lp: 4000, lpTo: 500, a: 0.001, d: 0.35, shape: 3, drive: 1 },
      { wave: "sine", freq: 150, to: 50, curve: 3, a: 0.001, d: 0.25, shape: 2, drive: 1 },
    ],
  }],
  "explosion-big": ["Huge blast with a long rolling tail", {
    verb: [0.75, 0.3],
    layers: [
      { wave: "noise", hp: 1000, a: 0.001, d: 0.1, shape: 3, gain: 0.5 },
      { wave: "brown", lp: 900, lpTo: 80, a: 0.003, h: 0.1, d: 2, shape: 2.2, drive: 2, gain: 1.6 },
      { wave: "sine", freq: 80, to: 28, curve: 3, a: 0.001, d: 0.9, shape: 1.8, drive: 1.5 },
      { wave: "crunch", freq: 2000, to: 120, a: 0.001, d: 0.8, shape: 2.5, lp: 3000, gain: 0.5 },
      { wave: "pink", bp: 400, bpTo: 120, a: 0.2, d: 1.4, shape: 2, gain: 0.5 },
    ],
  }],
  "explosion-retro": ["8-bit explosion, crunchy noise falling", {
    rate: 22050,
    layers: [{ wave: "crunch", freq: 1800, to: 60, curve: 1.5, a: 0.001, h: 0.05, d: 0.7, shape: 1.8 }],
  }],
  "explosion-distant": ["Far-off boom, muffled", {
    verb: [0.8, 0.4],
    layers: [
      { wave: "brown", lp: 380, lpTo: 90, a: 0.015, d: 1.4, shape: 2.2, gain: 1.6 },
      { wave: "sine", freq: 60, to: 30, a: 0.01, d: 0.8, shape: 2 },
    ],
  }],
  firework: ["Firework pop with crackle", {
    verb: [0.5, 0.25],
    layers: [
      { wave: "noise", lp: 3000, lpTo: 600, a: 0.001, d: 0.25, shape: 3 },
      { wave: "sine", freq: 120, to: 45, a: 0.001, d: 0.2, drive: 1 },
      ...[0.18, 0.23, 0.26, 0.31, 0.37, 0.4, 0.46, 0.55].map((at) => ({ wave: "noise" as const, hp: 3000, at, a: 0.001, d: 0.012, shape: 2, gain: 0.5 })),
    ],
  }],
  implosion: ["Reverse-feel suck-in then thump", {
    verb: [0.3, 0.15],
    layers: [
      { wave: "noise", lp: 300, lpTo: 6000, a: 0.45, d: 0.03, shape: 1, gain: 0.6 },
      { wave: "sine", freq: 40, to: 200, a: 0.45, d: 0.02, gain: 0.5 },
      { wave: "sine", freq: 120, to: 40, at: 0.47, a: 0.001, d: 0.25, drive: 1.5 },
    ],
  }],
  debris: ["Rubble and debris settling", {
    layers: [
      { wave: "brown", lp: 1200, a: 0.002, d: 0.5, shape: 2, gain: 0.8 },
      ...[0, 0.07, 0.12, 0.2, 0.26, 0.35, 0.47].map((at, i) => ({ wave: "noise" as const, bp: [900, 1400, 700, 1800, 1100, 600, 1300][i], q: 2, at, a: 0.001, d: 0.04, shape: 3, gain: 0.7 - i * 0.07 })),
    ],
  }],
  shockwave: ["Energy shockwave, sci-fi", {
    verb: [0.5, 0.2],
    layers: [
      { wave: "sine", freq: 70, to: 30, a: 0.002, d: 0.8, shape: 2, drive: 1 },
      { wave: "noise", bp: 3000, bpTo: 200, q: 2, a: 0.002, d: 0.6, shape: 2 },
      { wave: "saw", freq: 220, to: 55, lp: 1500, lpTo: 200, a: 0.002, d: 0.5, shape: 2, gain: 0.4 },
    ],
  }],
  "bomb-fuse": ["Lit fuse fizzing", {
    layers: [
      { wave: "noise", bp: 5200, q: 1.5, a: 0.03, h: 0.9, d: 0.1, shape: 1, gain: 0.7 },
      { wave: "crunch", freq: 70, hp: 3000, a: 0.03, h: 0.9, d: 0.1, gain: 0.35 },
    ],
  }],
});
