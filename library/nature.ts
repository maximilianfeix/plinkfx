import { def } from "./def.ts";

// Sounds from outdoors: events (a drop, a croak, a far rumble) and two seamless ambience loops.
// Loops: every layer spans the whole render (d: 0 keeps every take the same length); see Sound.loop.
export default def("nature", {
  "rain-loop": ["Steady rain, seamless loop", {
    loop: true,
    vary: 0.6,
    varyF: 2,
    layers: [
      { wave: "pink", hp: 500, lp: 7000, a: 0.02, h: 3.48, d: 0, gain: 0.7 },
      { wave: "noise", bp: 4200, q: 0.7, a: 0.02, h: 3.48, d: 0, gain: 0.22 },
      { wave: "brown", lp: 350, a: 0.02, h: 3.48, d: 0, gain: 0.35 },
      // Close drops: short ticks scattered over the loop.
      ...[0.07, 0.31, 0.46, 0.62, 0.9, 1.13, 1.27, 1.55, 1.71, 1.98, 2.2, 2.36, 2.61, 2.83, 3.05].map((at, i) => ({ wave: "noise" as const, bp: 2600 + (i % 4) * 600, q: 1.5, at, a: 0.001, d: 0.012, shape: -5, gain: 0.55 + (i % 3) * 0.15 })),
    ],
  }],
  "wind-loop": ["Wind blowing with slow gusts, seamless loop", {
    loop: true,
    vary: 0.5,
    varyF: 2,
    layers: [
      { wave: "pink", bp: 520, q: 1.2, a: 0.02, h: 3.48, d: 0, gain: 0.8 },
      { wave: "brown", lp: 220, a: 0.02, h: 3.48, d: 0, gain: 0.45 },
      // Gusts: band sweeps that swell and fall inside the loop.
      { wave: "pink", bp: 600, bpTo: 1400, q: 2.5, at: 0.15, a: 0.9, d: 1, shape: 1.5, gain: 0.7 },
      { wave: "pink", bp: 1300, bpTo: 650, q: 2.5, at: 1.6, a: 0.7, d: 1.1, shape: 1.5, gain: 0.6 },
      { wave: "noise", bp: 2300, bpTo: 2900, q: 7, at: 0.5, a: 1, d: 1.2, shape: 2, gain: 0.1 },
    ],
  }],
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
  "thunder-crack": ["Close lightning: sharp crack into a rolling boom", {
    vary: 0.5,
    varyF: 2,
    verb: [0.7, 0.3],
    layers: [
      { wave: "noise", hp: 1500, a: 0.001, d: 0.12, shape: -4, drive: 2 },
      { wave: "brown", lp: 1200, lpTo: 150, a: 0.005, h: 0.2, d: 1.6, shape: -3, drive: 1.5, gain: 1.2 },
      { wave: "sine", freq: 60, to: 30, a: 0.01, d: 1, shape: -3, drive: 1 },
      ...[0.3, 0.55, 0.8].map((at, i) => ({ wave: "brown" as const, lp: 400, at, a: 0.02, d: 0.4, shape: -3, gain: 0.5 - i * 0.12 })),
    ],
  }],
  "ocean-wave": ["A wave rolls in and washes back", {
    vary: 0.3,
    varyF: 2,
    layers: [
      { wave: "pink", lp: 600, lpTo: 3000, a: 0.7, d: 0.2, shape: 1.5 },
      { wave: "noise", bp: 3000, q: 0.7, at: 0.65, a: 0.05, d: 1.2, shape: -3, gain: 0.5 },
      { wave: "brown", lp: 300, a: 0.6, h: 0.3, d: 0.9, gain: 0.5 },
    ],
  }],
  "rain-burst": ["Short rain shower patter (layer or loop it)", {
    vary: 0.2,
    varyF: 2,
    layers: [
      { wave: "pink", bp: 2500, q: 0.6, a: 0.2, h: 0.8, d: 0.4, gain: 0.6 },
      ...Array.from({ length: 24 }, (_, i) => ({ wave: "noise" as const, bp: 2000 + (i * 397) % 3000, q: 3, at: 0.05 + i * 0.05 + (i % 3) * 0.013, a: 0.001, d: 0.012, shape: -5, gain: 0.3 + (i % 4) * 0.1 })),
    ],
  }],
  "dive-splash": ["Dive into deep water: plunge and bubbles", {
    varyF: 2,
    verb: [0.3, 0.12],
    layers: [
      { wave: "noise", lp: 5000, lpTo: 600, a: 0.002, d: 0.5, shape: -3, drive: 1 },
      { wave: "sine", freq: 150, to: 50, a: 0.002, d: 0.25, shape: -4, drive: 1 },
      ...[0.25, 0.32, 0.4, 0.46, 0.55].map((at, i) => ({ wave: "sine" as const, freq: 350 + i * 60, to: 900 + i * 100, curve: 3, at, a: 0.002, d: 0.05, shape: 3, lp: 1800, gain: 0.4 })),
    ],
  }],
});
