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
      { wave: "noise", bp: 2500, q: 1.2, a: 0.001, d: 0.02, shape: 3, drive: 2, gain: 0.7 },
      { wave: "metal", freq: 700, bp: 2800, q: 2, a: 0.001, d: 0.07, shape: 3, drive: 1 },
      { wave: "sine", freq: 260, to: 150, a: 0.001, d: 0.06, shape: 2.5, drive: 1, gain: 0.7 },
      { wave: "noise", bp: 1800, q: 1.2, at: 0.07, a: 0.001, d: 0.02, shape: 3, drive: 2, gain: 0.7 },
      { wave: "metal", freq: 560, bp: 2200, q: 2, at: 0.07, a: 0.001, d: 0.1, shape: 3, drive: 1 },
      { wave: "sine", freq: 200, to: 110, at: 0.07, a: 0.001, d: 0.09, shape: 2.5, drive: 1, gain: 0.9 },
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
  "potion-drink": ["Drink a potion: three glugs and a sigh of sparkle", {
    vary: 0.6,
    layers: [
      ...[0, 0.14, 0.28].map((at, i) => ({ wave: "sine" as const, freq: 260 - i * 20, to: 520, curve: 3, vib: [30, 1] as [number, number], at, a: 0.005, d: 0.09, shape: -3, lp: 1200, gain: 0.8 })),
      { wave: "noise", lp: 1000, a: 0.01, h: 0.35, d: 0.1, gain: 0.08 },
      { wave: "sine", freq: 2093, fm: [3.5, 1.5, 0.1], arp: [0, 4, 7], arpRate: 0.05, at: 0.42, a: 0.002, d: 0.3, shape: -4, gain: 0.25 },
    ],
  }],
  eat: ["Eat food: two crunchy bites", {
    vary: 0.8,
    varyF: 2,
    varyG: 2,
    layers: [0, 0.18].flatMap((at) => [
      { wave: "crunch" as const, freq: 5000, bp: 2500, q: 0.8, at, a: 0.002, d: 0.08, shape: -3, drive: 1 },
      { wave: "pink" as const, lp: 900, at, a: 0.002, d: 0.06, shape: -4, gain: 0.5 },
      ...[0.02, 0.045].map((o) => ({ wave: "noise" as const, bp: 3500, q: 2, at: at + o, a: 0.001, d: 0.01, shape: -5, gain: 0.4 })),
    ]),
  }],
  "loot-rare": ["Rare loot drops: shimmering beam and a chord", {
    vary: 0.05,
    verb: [0.5, 0.25],
    echo: [0.1, 0.3, 0.2],
    layers: [
      { wave: "saw", freq: 220, to: 880, curve: 0.8, bp: 1000, bpTo: 5000, q: 4, a: 0.2, d: 0.2, shape: -3, gain: 0.3 },
      { wave: "sine", freq: 1319, fm: [3.5, 1.6, 0.15], at: 0.25, a: 0.002, h: 0.1, d: 0.8, shape: -3 },
      { wave: "sine", freq: 1661, fm: [3.5, 1.6, 0.15], at: 0.25, a: 0.002, h: 0.1, d: 0.8, shape: -3, gain: 0.7 },
      { wave: "sine", freq: 1976, fm: [3.5, 1.6, 0.15], at: 0.25, a: 0.002, h: 0.1, d: 0.8, shape: -3, gain: 0.6 },
      { wave: "metal", freq: 4000, hp: 7000, at: 0.25, a: 0.01, d: 0.6, shape: -3, gain: 0.1 },
    ],
  }],
  equip: ["Equip gear: leather and buckle", {
    vary: 0.6,
    varyF: 2,
    varyG: 1.5,
    layers: [
      { wave: "pink", bp: 1800, q: 1, a: 0.02, d: 0.12, shape: -3, gain: 0.9 },
      { wave: "metal", freq: 1100, hp: 2500, lp: 7000, at: 0.08, a: 0.001, d: 0.06, shape: -5, gain: 0.5 },
      { wave: "metal", freq: 1350, hp: 2500, lp: 7000, at: 0.13, a: 0.001, d: 0.08, shape: -5, gain: 0.4 },
      { wave: "noise", bp: 900, q: 1.5, at: 0.08, a: 0.001, d: 0.03, shape: -5, gain: 0.4 },
    ],
  }],
});
