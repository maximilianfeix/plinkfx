import { def } from "./def.ts";

export default def("shoot", {
  laser: ["Classic laser: fast square sweep down", {
    layers: [
      { wave: "square", duty: 0.5, freq: 1500, to: 220, curve: 3, a: 0.001, d: 0.2, shape: 1.8, lp: 7500, kt: 1 },
      { wave: "saw", freq: 750, to: 110, curve: 3, a: 0.001, d: 0.17, lp: 3500, kt: 1, gain: 0.4 },
    ],
  }],
  "laser-soft": ["Rounder laser for cute shooters", {
    layers: [{ wave: "sine", freq: 1400, to: 300, curve: 3, a: 0.001, d: 0.16, shape: 2, fm: [0.5, 1.5, 0.08] }],
  }],
  "laser-heavy": ["Thick laser cannon", {
    verb: [0.25, 0.12],
    echo: [0.07, 0.3, 0.18],
    layers: [
      { wave: "saw", freq: 900, to: 70, curve: 2.5, a: 0.001, d: 0.4, shape: 1.8, lp: 4000, lpTo: 500, drive: 1.5 },
      { wave: "square", duty: 0.3, freq: 450, to: 35, curve: 2.5, a: 0.001, d: 0.35, lp: 1500, gain: 0.6 },
      { wave: "noise", hp: 2500, a: 0.001, d: 0.05, gain: 0.3 },
    ],
  }],
  blaster: ["Sci-fi blaster bolt", {
    echo: [0.07, 0.3, 0.18],
    layers: [
      { wave: "square", duty: 0.25, freq: 950, to: 160, curve: 2.5, a: 0.001, d: 0.14, shape: 2, lp: 5000, kt: 1 },
      { wave: "noise", bp: 3000, q: 0.8, a: 0.001, d: 0.05, shape: 3, gain: 0.6 },
      { wave: "sine", freq: 180, to: 60, a: 0.001, d: 0.08, gain: 0.6 },
    ],
  }],
  zap: ["Electric zap", {
    layers: [
      { wave: "saw", freq: 2600, to: 400, vib: [60, 3], a: 0.001, d: 0.1, shape: 2, hp: 300 },
      { wave: "noise", hp: 4000, a: 0.001, d: 0.06, gain: 0.4 },
    ],
  }],
  pew: ["Tiny pew for bullet-hell spam", {
    vary: 1,
    layers: [{ wave: "square", duty: 0.25, freq: 2100, to: 600, curve: 4, a: 0.001, d: 0.08, shape: 2, lp: 7000 }],
  }],
  gunshot: ["Pistol shot with room tail", {
    verb: [0.35, 0.2],
    layers: [
      { wave: "noise", bp: 2500, q: 0.7, a: 0.001, d: 0.02, shape: 4, drive: 3, gain: 0.8 },
      { wave: "noise", hp: 150, lp: 7000, lpTo: 1200, a: 0.001, d: 0.18, shape: 4, drive: 2 },
      { wave: "sine", freq: 150, to: 50, curve: 3, a: 0.001, d: 0.14, drive: 2 },
      { wave: "brown", lp: 900, a: 0.001, d: 0.25, shape: 2.5, gain: 0.7 },
      { wave: "pink", bp: 1000, q: 1, a: 0.001, d: 0.35, shape: 3, gain: 0.35 },
    ],
  }],
  shotgun: ["Shotgun blast, wide and heavy", {
    verb: [0.45, 0.22],
    layers: [
      { wave: "noise", hp: 300, lp: 8000, lpTo: 1500, a: 0.001, d: 0.4, shape: 3.5, drive: 2.5, gain: 1.2 },
      { wave: "sine", freq: 120, to: 40, curve: 3, a: 0.001, d: 0.22, drive: 2 },
      { wave: "brown", lp: 600, a: 0.001, d: 0.35, gain: 0.7 },
    ],
  }],
  "shoot-retro": ["8-bit shot", {
    rate: 16000,
    layers: [
      { wave: "crunch", freq: 3000, to: 600, a: 0.001, d: 0.14, shape: 2, drive: 1 },
      { wave: "square", freq: 600, to: 150, a: 0.001, d: 0.1, drive: 1, gain: 0.6 },
    ],
  }],
  railgun: ["Charge whine, then a piercing shot", {
    echo: [0.09, 0.3, 0.15],
    verb: [0.4, 0.2],
    layers: [
      { wave: "sine", freq: 600, to: 3200, a: 0.25, d: 0.02, shape: 1, gain: 0.35 },
      { wave: "saw", freq: 3200, to: 140, curve: 3, at: 0.26, a: 0.001, d: 0.35, shape: 2, lp: 7000, lpTo: 800 },
      { wave: "noise", hp: 2000, at: 0.26, a: 0.001, d: 0.2, gain: 0.5 },
      { wave: "sine", freq: 100, to: 40, at: 0.26, a: 0.001, d: 0.2, drive: 1 },
    ],
  }],
  ray: ["Warbling ray gun", {
    layers: [{ wave: "sine", freq: 900, to: 300, fm: [0.5, 6, 0.3], vib: [11, 1], a: 0.004, h: 0.15, d: 0.25, shape: 2 }],
  }],
  plasma: ["Plasma ball launch", {
    layers: [
      { wave: "saw", freq: 300, to: 120, lp: 3000, lpTo: 600, q: 4, vib: [25, 1], a: 0.003, d: 0.3, shape: 2 },
      { wave: "noise", bp: 2400, bpTo: 800, q: 2, a: 0.003, d: 0.2, gain: 0.4 },
    ],
  }],
  missile: ["Rocket launch whoosh", {
    layers: [
      { wave: "noise", bp: 600, bpTo: 3500, q: 1.2, a: 0.02, h: 0.3, d: 0.4, shape: 2, drive: 0.5 },
      { wave: "brown", lp: 400, a: 0.002, d: 0.5, gain: 0.7 },
      { wave: "sine", freq: 300, to: 900, a: 0.05, h: 0.25, d: 0.3, gain: 0.15 },
    ],
  }],
  ricochet: ["Bullet ricochet: sharp tick and a falling whine", {
    verb: [0.3, 0.15],
    layers: [
      { wave: "noise", bp: 3000, q: 1, a: 0.001, d: 0.012, shape: 3, drive: 2, gain: 0.6 },
      { wave: "metal", freq: 1800, hp: 3000, a: 0.001, d: 0.05, shape: 3, gain: 0.35 },
      { wave: "sine", freq: 3400, to: 1500, curve: 0.8, vib: [28, 0.25], at: 0.008, a: 0.004, d: 0.4, shape: 2 },
      { wave: "triangle", freq: 1700, to: 750, curve: 0.8, vib: [28, 0.25], at: 0.008, a: 0.004, d: 0.3, shape: 2.5, gain: 0.25 },
    ],
  }],
  "dry-fire": ["Empty gun: the hammer clicks, nothing fires", {
    verb: [0.15, 0.1],
    layers: [
      { wave: "metal", freq: 1200, bp: 3500, q: 2, a: 0.001, h: 0.006, d: 0.03, shape: 3, drive: 4 },
      { wave: "sine", freq: 320, to: 200, at: 0.002, a: 0.001, d: 0.04, shape: 3, drive: 1, gain: 0.4 },
      { wave: "metal", freq: 1500, bp: 4000, q: 2, at: 0.06, a: 0.001, d: 0.02, shape: 3, drive: 2, gain: 0.5 },
    ],
  }],
  reload: ["Reload: two metal clicks", {
    layers: [
      { wave: "metal", freq: 1100, bp: 3500, q: 2, a: 0.001, d: 0.06, shape: 3, drive: 2 },
      { wave: "noise", bp: 1500, q: 2, at: 0.005, a: 0.001, d: 0.03, gain: 0.4 },
      { wave: "metal", freq: 800, bp: 2400, q: 2, at: 0.22, a: 0.001, d: 0.09, shape: 3, drive: 2 },
      { wave: "noise", bp: 1100, q: 2, at: 0.225, a: 0.001, d: 0.04, gain: 0.5 },
      { wave: "sine", freq: 200, to: 140, at: 0.22, a: 0.001, d: 0.05, gain: 0.4 },
    ],
  }],
});
