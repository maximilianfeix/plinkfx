import { def } from "./def.ts";

export default def("pickup", {
  coin: ["The classic two-note coin, with a little shimmer", {
    verb: [0.2, 0.12],
    layers: [
      { wave: "square", duty: 0.25, freq: 988, arp: [0, 5], arpRate: 0.07, a: 0.001, h: 0.05, d: 0.3, shape: 2.5, lp: 7000 },
      { wave: "sine", freq: 1976, arp: [0, 5], arpRate: 0.07, a: 0.001, d: 0.22, shape: 3, gain: 0.5 },
    ],
  }],
  "coin-soft": ["Rounder coin for cosy games", {
    verb: [0.25, 0.15],
    layers: [
      { wave: "triangle", freq: 1175, arp: [0, 5], arpRate: 0.065, a: 0.002, h: 0.04, d: 0.3, shape: 2.5 },
      { wave: "sine", freq: 2350, fm: [2, 0.7, 0.05], arp: [0, 5], arpRate: 0.065, a: 0.002, d: 0.25, shape: 3, gain: 0.35 },
    ],
  }],
  "coin-double": ["Two coins in quick succession", {
    verb: [0.2, 0.12],
    layers: [
      { wave: "square", duty: 0.25, freq: 988, arp: [0, 5], arpRate: 0.05, a: 0.001, d: 0.1, shape: 2, lp: 7000 },
      { wave: "square", duty: 0.25, freq: 1175, arp: [0, 5], arpRate: 0.05, at: 0.1, a: 0.001, h: 0.04, d: 0.28, shape: 2.5, lp: 7000 },
      { wave: "sine", freq: 2350, arp: [0, 5], arpRate: 0.05, at: 0.1, a: 0.001, d: 0.2, shape: 3, gain: 0.4 },
    ],
  }],
  "coin-bag": ["A handful of coins, a small payout", {
    verb: [0.25, 0.15],
    layers: [
      { wave: "sine", freq: 2637, fm: [2.76, 2.5, 0.03], a: 0.001, d: 0.14, shape: 3, gain: 0.7 },
      { wave: "sine", freq: 3136, fm: [2.76, 2.5, 0.03], at: 0.055, a: 0.001, d: 0.16, shape: 3, gain: 0.65 },
      { wave: "sine", freq: 2794, fm: [2.76, 2.5, 0.03], at: 0.1, a: 0.001, d: 0.18, shape: 3, gain: 0.6 },
      { wave: "sine", freq: 3520, fm: [2.76, 2.5, 0.03], at: 0.16, a: 0.001, d: 0.2, shape: 3, gain: 0.55 },
      { wave: "sine", freq: 2960, fm: [2.76, 2.5, 0.03], at: 0.2, a: 0.001, d: 0.22, shape: 3, gain: 0.5 },
      { wave: "sine", freq: 3322, fm: [2.76, 2.5, 0.03], at: 0.27, a: 0.001, d: 0.24, shape: 3, gain: 0.45 },
      { wave: "noise", hp: 5000, a: 0.001, d: 0.3, shape: 3, gain: 0.08 },
    ],
  }],
  gem: ["Glassy bell for gems and crystals", {
    verb: [0.45, 0.25],
    layers: [
      { wave: "sine", freq: 2093, fm: [3.01, 2.2, 0.08], a: 0.001, d: 0.5, shape: 3 },
      { wave: "sine", freq: 3136, fm: [2.01, 1.5, 0.06], at: 0.07, a: 0.001, d: 0.55, shape: 3, gain: 0.7 },
      { wave: "sine", freq: 4186, at: 0.12, a: 0.001, d: 0.3, shape: 3, gain: 0.25 },
    ],
  }],
  pickup: ["Generic item pickup, quick rising notes", {
    layers: [
      { wave: "square", duty: 0.5, freq: 523, arp: [0, 4, 7, 12], arpRate: 0.032, a: 0.001, h: 0.06, d: 0.1, shape: 2, lp: 4500 },
      { wave: "triangle", freq: 1046, arp: [0, 4, 7, 12], arpRate: 0.032, a: 0.001, h: 0.06, d: 0.1, gain: 0.5 },
    ],
  }],
  "pickup-soft": ["Soft pop-and-chime pickup", {
    verb: [0.2, 0.12],
    layers: [
      { wave: "sine", freq: 420, to: 1100, curve: 3, sweep: 0.04, a: 0.001, d: 0.06, shape: 3 },
      { wave: "sine", freq: 1568, fm: [2, 0.6, 0.05], at: 0.035, a: 0.001, d: 0.22, shape: 3, gain: 0.6 },
    ],
  }],
  "pickup-item": ["Grab an item: a short slide up", {
    layers: [
      { wave: "square", duty: 0.25, freq: 330, to: 990, curve: 2, a: 0.001, h: 0.02, d: 0.12, shape: 2, lp: 5000 },
      { wave: "sine", freq: 165, to: 495, curve: 2, a: 0.001, d: 0.1, gain: 0.4 },
    ],
  }],
  key: ["Key pickup: metal jingle and a chime", {
    verb: [0.3, 0.15],
    layers: [
      { wave: "metal", freq: 1400, hp: 4000, a: 0.001, d: 0.09, shape: 3, gain: 0.45 },
      { wave: "metal", freq: 1650, hp: 4000, at: 0.06, a: 0.001, d: 0.12, shape: 3, gain: 0.35 },
      { wave: "triangle", freq: 1319, arp: [0, 7, 12], arpRate: 0.06, at: 0.04, a: 0.002, d: 0.3, shape: 2.5, gain: 0.7 },
    ],
  }],
  heart: ["Health pickup, warm and friendly", {
    verb: [0.3, 0.15],
    layers: [
      { wave: "triangle", freq: 523, arp: [0, 4, 7, 12], arpRate: 0.06, a: 0.003, h: 0.1, d: 0.25, shape: 2, vib: [6, 0.15] },
      { wave: "sine", freq: 1046, arp: [0, 4, 7, 12], arpRate: 0.06, a: 0.003, h: 0.1, d: 0.2, gain: 0.35 },
    ],
  }],
  ammo: ["Ammo or clip pickup: metallic clack", {
    layers: [
      { wave: "metal", freq: 900, bp: 3200, q: 1.5, a: 0.001, d: 0.06, shape: 3 },
      { wave: "noise", bp: 2000, q: 2, a: 0.001, d: 0.025, gain: 0.5 },
      { wave: "metal", freq: 760, bp: 2600, q: 1.5, at: 0.08, a: 0.001, d: 0.08, shape: 3, gain: 0.8 },
      { wave: "sine", freq: 180, to: 120, at: 0.08, a: 0.001, d: 0.05, gain: 0.5 },
    ],
  }],
  "ka-ching": ["Cash register for shops and purchases", {
    verb: [0.25, 0.12],
    layers: [
      { wave: "noise", bp: 3000, q: 1, a: 0.001, d: 0.05, gain: 0.5 },
      { wave: "metal", freq: 520, bp: 2400, q: 2, a: 0.001, d: 0.08, gain: 0.5 },
      { wave: "sine", freq: 2637, fm: [2.76, 3, 0.15], at: 0.07, a: 0.001, d: 0.7, shape: 2.5 },
      { wave: "sine", freq: 3951, fm: [2.76, 2, 0.1], at: 0.07, a: 0.001, d: 0.5, shape: 3, gain: 0.5 },
    ],
  }],
  "xp-orb": ["Experience orb, small and bright", {
    vary: 2,
    echo: [0.07, 0.3, 0.25],
    layers: [{ wave: "sine", freq: 1250, to: 2500, curve: 2, sweep: 0.04, a: 0.001, d: 0.09, shape: 3 }],
  }],
  star: ["Collect a star: sparkling run upward", {
    echo: [0.09, 0.35, 0.3],
    layers: [
      { wave: "triangle", freq: 1047, arp: [0, 4, 7, 12, 16, 19, 24], arpRate: 0.03, a: 0.001, h: 0.18, d: 0.2, shape: 2 },
      { wave: "sine", freq: 2093, arp: [0, 4, 7, 12, 16, 19, 24], arpRate: 0.03, a: 0.001, h: 0.18, d: 0.15, gain: 0.3 },
    ],
  }],
  ring: ["Fast ring pickup, two-note bright chime", {
    verb: [0.3, 0.2],
    layers: [
      { wave: "square", duty: 0.5, freq: 1568, arp: [0, 4], arpRate: 0.045, a: 0.001, h: 0.04, d: 0.4, shape: 3, lp: 6000, gain: 0.6 },
      { wave: "sine", freq: 3136, arp: [0, 4], arpRate: 0.045, fm: [1.5, 0.7, 0.1], a: 0.001, d: 0.45, shape: 3, gain: 0.7 },
    ],
  }],
});
