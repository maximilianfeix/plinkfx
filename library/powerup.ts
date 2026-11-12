import { def } from "./def.ts";

export default def("powerup", {
  powerup: ["Classic power-up: fast arpeggio climbing two octaves", {
    layers: [
      { wave: "square", duty: 0.5, freq: 392, arp: [0, 4, 7, 12, 16, 19, 24], arpRate: 0.045, a: 0.002, h: 0.25, d: 0.15, shape: 2, lp: 5000 },
      { wave: "triangle", freq: 196, arp: [0, 4, 7, 12, 16, 19, 24], arpRate: 0.045, a: 0.002, h: 0.25, d: 0.15, gain: 0.5 },
    ],
  }],
  "powerup-retro": ["Rising warble, 8-bit style", {
    bits: 6,
    layers: [{ wave: "square", duty: 0.25, freq: 200, to: 1300, vib: [18, 1], a: 0.002, h: 0.3, d: 0.15, shape: 2 }],
  }],
  "level-up": ["Level up: chord, sparkle and hold", {
    verb: [0.45, 0.25],
    layers: [
      { wave: "triangle", freq: 523, arp: [0, 4, 7, 12], arpRate: 0.08, a: 0.003, h: 0.35, d: 0.45, shape: 2, vib: [5.5, 0.12] },
      { wave: "square", duty: 0.25, freq: 1046, arp: [0, 4, 7, 12], arpRate: 0.08, a: 0.003, h: 0.3, d: 0.4, lp: 4000, gain: 0.3 },
      { wave: "sine", freq: 2093, fm: [2, 1, 0.2], at: 0.32, a: 0.002, d: 0.6, shape: 3, gain: 0.35 },
    ],
  }],
  "extra-life": ["1-up style six-note phrase", {
    layers: [
      { wave: "square", duty: 0.5, freq: 659, arp: [0, 3, 12, 8, 10, 15], arpRate: 0.085, a: 0.002, h: 0.45, d: 0.1, shape: 2, lp: 5000 },
      { wave: "triangle", freq: 330, arp: [0, 3, 12, 8, 10, 15], arpRate: 0.085, a: 0.002, h: 0.45, d: 0.1, gain: 0.4 },
    ],
  }],
  "shield-on": ["Energy shield raises", {
    verb: [0.3, 0.15],
    layers: [
      { wave: "saw", freq: 110, to: 220, lp: 300, lpTo: 4500, q: 3, a: 0.01, h: 0.15, d: 0.25, shape: 2 },
      { wave: "sine", freq: 440, to: 880, vib: [9, 0.3], a: 0.01, h: 0.15, d: 0.25, gain: 0.5 },
    ],
  }],
  "shield-off": ["Shield drops or breaks down", {
    layers: [
      { wave: "saw", freq: 220, to: 90, lp: 4000, lpTo: 300, q: 3, a: 0.005, d: 0.4, shape: 2 },
      { wave: "noise", bp: 3000, bpTo: 600, a: 0.005, d: 0.3, gain: 0.3 },
    ],
  }],
  "speed-up": ["Speed boost: fast whirring rise", {
    layers: [
      { wave: "square", duty: 0.3, freq: 300, to: 1500, vib: [28, 0.8], a: 0.003, h: 0.1, d: 0.2, shape: 2, lp: 5000 },
      { wave: "noise", bp: 1000, bpTo: 6000, a: 0.05, d: 0.25, gain: 0.3 },
    ],
  }],
  heal: ["Healing: soft rising chime with shimmer", {
    verb: [0.6, 0.3],
    layers: [
      { wave: "sine", freq: 523, arp: [0, 4, 7, 11, 14], arpRate: 0.09, a: 0.01, h: 0.35, d: 0.5, shape: 2, vib: [5, 0.1] },
      { wave: "sine", freq: 1568, fm: [2, 1.2, 0.3], arp: [0, 4, 7, 11, 14], arpRate: 0.09, a: 0.01, h: 0.3, d: 0.4, gain: 0.3 },
    ],
  }],
  "charge-up": ["Charging a shot, rising tension", {
    layers: [
      { wave: "saw", freq: 90, to: 720, curve: 0.7, lp: 400, lpTo: 6000, q: 4, a: 0.6, h: 0.3, d: 0.08, shape: 1 },
      { wave: "sine", freq: 180, to: 1440, curve: 0.7, vib: [12, 0.3], a: 0.6, h: 0.3, d: 0.08, gain: 0.4 },
    ],
  }],
  "power-down": ["Lose a power: arpeggio falling", {
    layers: [
      { wave: "square", duty: 0.5, freq: 784, arp: [0, -3, -7, -12, -15, -19], arpRate: 0.055, a: 0.002, h: 0.28, d: 0.1, shape: 2, lp: 4000 },
      { wave: "triangle", freq: 392, arp: [0, -3, -7, -12, -15, -19], arpRate: 0.055, a: 0.002, h: 0.28, d: 0.1, gain: 0.4 },
    ],
  }],
  unlock: ["New ability unlocked", {
    verb: [0.4, 0.22],
    layers: [
      { wave: "metal", freq: 900, bp: 3000, a: 0.001, d: 0.06, gain: 0.5 },
      { wave: "triangle", freq: 659, arp: [0, 7, 12, 19], arpRate: 0.07, at: 0.05, a: 0.002, h: 0.2, d: 0.4, shape: 2 },
      { wave: "sine", freq: 2637, fm: [2, 1, 0.2], at: 0.26, a: 0.002, d: 0.5, shape: 3, gain: 0.3 },
    ],
  }],
  invincible: ["Invincibility: looping bright arpeggio", {
    layers: [
      { wave: "square", duty: 0.25, freq: 784, arp: [0, 4, 7, 12], arpRate: 0.035, loop: true, a: 0.002, h: 0.6, d: 0.3, shape: 1.5, lp: 6000 },
      { wave: "triangle", freq: 392, arp: [0, 7], arpRate: 0.07, loop: true, a: 0.002, h: 0.6, d: 0.3, gain: 0.5 },
    ],
  }],
});
