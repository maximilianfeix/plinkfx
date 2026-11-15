import { def } from "./def.ts";

// Engines are detuned saws through a low-pass with drive; tyres are a narrow resonant noise band.

export default def("vehicle", {
  "engine-start": ["Engine cranks, catches and idles", {
    vary: 0.3,
    layers: [
      ...[0, 0.12, 0.24].map((at) => ({ wave: "saw" as const, freq: 40, to: 30, lp: 500, at, a: 0.01, d: 0.09, shape: -3, drive: 1.5, gain: 0.6 })),
      { wave: "saw", freq: 30, to: 70, curve: 3, vib: [14, 1], lp: 900, at: 0.36, a: 0.01, h: 0.5, d: 0.4, shape: -3, drive: 2 },
      { wave: "square", freq: 35, to: 72, curve: 3, lp: 400, at: 0.36, a: 0.01, h: 0.5, d: 0.4, shape: -3, gain: 0.5 },
      { wave: "brown", lp: 400, at: 0.36, a: 0.02, h: 0.5, d: 0.4, gain: 0.3 },
    ],
  }],
  "engine-rev": ["Throttle blip: engine revs up and falls back", {
    vary: 0.5,
    layers: [
      { wave: "saw", freq: 60, to: 210, curve: 0.7, sweep: 0.35, lp: 1500, kt: 0.5, a: 0.02, h: 0.3, d: 0.5, shape: -3, drive: 2 },
      { wave: "saw", freq: 121, to: 425, curve: 0.7, sweep: 0.35, bp: 1800, q: 2, kt: 1, a: 0.02, h: 0.3, d: 0.4, shape: -3, gain: 0.3 },
      { wave: "brown", lp: 500, a: 0.02, h: 0.3, d: 0.5, gain: 0.3 },
    ],
  }],
  "tire-screech": ["Tyres squeal on a hard turn or brake", {
    vary: 0.6,
    varyF: 2,
    layers: [
      { wave: "noise", bp: 2400, bpTo: 2100, q: 12, a: 0.04, h: 0.45, d: 0.25, shape: -3, gain: 1.2 },
      { wave: "saw", freq: 1150, to: 1000, vib: [18, 0.4], bp: 2300, q: 6, a: 0.04, h: 0.45, d: 0.25, shape: -3, gain: 0.25 },
      { wave: "pink", lp: 800, a: 0.04, h: 0.4, d: 0.2, gain: 0.2 },
    ],
  }],
  "car-crash": ["Car crash: metal crunch, glass and debris", {
    varyF: 2,
    varyG: 1.5,
    verb: [0.35, 0.15],
    layers: [
      { wave: "noise", hp: 1500, a: 0.001, d: 0.05, shape: -4, drive: 2 },
      { wave: "metal", freq: 380, bp: 1500, q: 1.2, a: 0.001, d: 0.5, shape: -4, drive: 2 },
      { wave: "sine", freq: 95, to: 35, curve: 2, a: 0.001, d: 0.35, shape: -4, drive: 2 },
      { wave: "brown", lp: 900, lpTo: 200, a: 0.001, d: 0.6, shape: -4, drive: 1, gain: 0.8 },
      ...[0.12, 0.2, 0.31, 0.42].map((at, i) => ({ wave: "metal" as const, freq: 1400 + i * 300, hp: 3500, at, a: 0.001, d: 0.08, shape: -5, gain: 0.3 })),
    ],
  }],
  "car-horn": ["Two-tone car horn honk", {
    vary: 0.15,
    layers: [
      { wave: "square", freq: 415, a: 0.01, h: 0.3, d: 0.08, shape: -3, bp: 1200, q: 1.2, drive: 1.5 },
      { wave: "square", freq: 523, a: 0.01, h: 0.3, d: 0.08, shape: -3, bp: 1500, q: 1.2, drive: 1.5, gain: 0.8 },
    ],
  }],
  boost: ["Nitro / turbo boost: whoosh with a rising jet whine", {
    vary: 0.4,
    varyF: 2,
    layers: [
      { wave: "noise", bp: 800, bpTo: 3500, q: 1, a: 0.03, h: 0.3, d: 0.4, shape: -3 },
      { wave: "saw", freq: 300, to: 1200, curve: 0.8, bp: 2000, q: 3, kt: 1, a: 0.05, h: 0.3, d: 0.3, shape: -3, gain: 0.25 },
      { wave: "brown", lp: 300, a: 0.01, d: 0.4, shape: -3, drive: 1, gain: 0.6 },
      { wave: "sine", freq: 90, to: 45, a: 0.001, d: 0.2, shape: -5, gain: 0.6 },
    ],
  }],
  "race-light": ["Start-light beep (ready, set): play three times then countdown-go", {
    vary: 0.02,
    layers: [
      { wave: "square", duty: 0.5, freq: 880, a: 0.002, h: 0.18, d: 0.05, shape: 1, lp: 3500 },
      { wave: "sine", freq: 1760, a: 0.002, h: 0.18, d: 0.05, shape: 1, gain: 0.3 },
    ],
  }],
});
