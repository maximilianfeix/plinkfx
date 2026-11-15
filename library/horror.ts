import { def } from "./def.ts";

// Horror: dissonance, formant whispers and long reverbs. Keep the stings dry at the start so they hit.
const AH = [730, 1090, 2440],
  OO = [300, 870, 2240],
  EE = [270, 2290, 3010];

export default def("horror", {
  jumpscare: ["Jump scare: screeching sting with a sub hit", {
    vary: 0.3,
    verb: [0.6, 0.3],
    layers: [
      { wave: "saw", freq: 1200, to: 900, vib: [11, 1.5], formant: EE, a: 0.002, h: 0.25, d: 0.5, shape: -3, drive: 2 },
      { wave: "saw", freq: 1265, to: 950, vib: [13, 1.5], bp: 3000, q: 3, a: 0.002, h: 0.25, d: 0.5, shape: -3, gain: 0.5 },
      { wave: "noise", hp: 2000, a: 0.001, d: 0.15, shape: -4, gain: 0.6 },
      { wave: "sine", freq: 70, to: 30, curve: 2, a: 0.001, d: 0.6, shape: -3, drive: 2 },
    ],
  }],
  "dread-drone": ["Rising dread: detuned low drone that swells", {
    vary: 0.2,
    verb: [0.65, 0.3],
    layers: [
      { wave: "saw", freq: 55, to: 58, lp: 400, lpTo: 1200, a: 0.9, h: 0.25, d: 0.5, shape: -3 },
      { wave: "saw", freq: 55.8, to: 61, lp: 400, lpTo: 1200, a: 0.9, h: 0.25, d: 0.5, shape: -3 },
      { wave: "sine", freq: 880, to: 932, vib: [5, 0.3], a: 1, h: 0.2, d: 0.45, shape: -3, gain: 0.08 },
      { wave: "brown", lp: 200, a: 0.8, h: 0.3, d: 0.5, shape: -3, gain: 0.4 },
    ],
  }],
  whisper: ["Breathy unintelligible whisper", {
    vary: 1,
    varyF: 2,
    verb: [0.5, 0.25],
    layers: [
      { wave: "noise", formant: AH, a: 0.06, h: 0.12, d: 0.15, shape: -3, gain: 0.8 },
      { wave: "noise", formant: EE, at: 0.28, a: 0.04, h: 0.1, d: 0.12, shape: -3, gain: 0.7 },
      { wave: "noise", formant: OO, at: 0.5, a: 0.05, h: 0.08, d: 0.2, shape: -3, gain: 0.6 },
      { wave: "noise", bp: 6000, q: 2, at: 0.2, a: 0.01, d: 0.05, shape: -4, gain: 0.3 },
    ],
  }],
  "horror-sting": ["Dissonant orchestral-style stab for a reveal", {
    vary: 0.1,
    verb: [0.75, 0.35],
    layers: [
      { wave: "saw", freq: 220, lp: 2500, lpTo: 600, a: 0.005, h: 0.05, d: 1.2, shape: -3, drive: 1 },
      { wave: "saw", freq: 233, lp: 2500, lpTo: 600, a: 0.005, h: 0.05, d: 1.2, shape: -3, drive: 1 },
      { wave: "saw", freq: 311, lp: 2500, lpTo: 600, a: 0.005, h: 0.05, d: 1.2, shape: -3, gain: 0.7 },
      { wave: "brown", lp: 300, a: 0.001, d: 0.8, shape: -4, gain: 0.7 },
      { wave: "metal", freq: 600, hp: 3000, a: 0.001, d: 1, shape: -3, gain: 0.15 },
    ],
  }],
  "chains-rattle": ["Chains clink and drag", {
    vary: 0.6,
    varyF: 2,
    varyG: 2,
    verb: [0.5, 0.2],
    layers: [0, 0.05, 0.09, 0.16, 0.21, 0.27, 0.34, 0.38].flatMap((at, i) => [
      { wave: "metal" as const, freq: 900 + (i % 3) * 230, hp: 2200, at, a: 0.001, d: 0.06, shape: -5, gain: 0.7 },
      { wave: "noise" as const, bp: 4000, q: 2, at, a: 0.001, d: 0.01, shape: -6, gain: 0.3 },
    ]),
  }],
  "static-burst": ["TV / radio static burst, for haunted screens", {
    vary: 0.5,
    varyF: 3,
    bits: 6,
    layers: [
      { wave: "noise", hp: 400, lp: 8000, a: 0.005, h: 0.25, d: 0.08, shape: 1 },
      { wave: "crunch", freq: 6000, bp: 2500, q: 1, a: 0.005, h: 0.25, d: 0.08, shape: 1, gain: 0.6 },
      { wave: "square", freq: 60, lp: 300, a: 0.005, h: 0.25, d: 0.08, shape: 1, gain: 0.3 },
    ],
  }],
  "music-box": ["Creepy music-box phrase, slightly detuned", {
    vary: 0.05,
    verb: [0.6, 0.3],
    // One strike per note (a modal layer rings out, it does not re-strike on an arp step); odd notes a little flat.
    layers: [0, -2, -5, -9, -7, -12].flatMap((n, i) => [
      { wave: "modal" as const, freq: 1568 * 2 ** (n / 12) * (i % 2 ? 0.992 : 1), modes: [1, 3.9, 8.1], at: i * 0.28, a: 0.001, d: i == 5 ? 0.7 : 0.5, shape: -3, gain: 1 - i * 0.06 },
      { wave: "sine" as const, freq: 3136 * 2 ** (n / 12), at: i * 0.28, a: 0.001, d: 0.15, shape: -5, gain: 0.12 },
    ]),
  }],
});
