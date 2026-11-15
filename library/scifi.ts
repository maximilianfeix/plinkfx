import { def } from "./def.ts";

// Sci-fi HUD, terminals and robots: clean square/sine beeps, band-passed hiss for doors.

export default def("scifi", {
  "computer-beep": ["Terminal data chirps: a burst of random blips", {
    vary: 2,
    layers: [{ wave: "square", duty: 0.25, freq: 1400, arp: [0, 7, 3, 12, 5, 10, 0, 15], arpRate: 0.035, a: 0.002, h: 0.26, d: 0.03, shape: 2, lp: 5000, gain: 0.6 }],
  }],
  scan: ["Scanner sweep: rising filtered tone with a ping", {
    vary: 0.3,
    echo: [0.12, 0.3, 0.25],
    layers: [
      { wave: "saw", freq: 300, to: 1200, curve: 0.8, bp: 800, bpTo: 4000, q: 6, a: 0.05, h: 0.4, d: 0.1, shape: 1.5, gain: 0.4 },
      { wave: "sine", freq: 2400, at: 0.55, a: 0.002, d: 0.3, shape: -4, gain: 0.5 },
    ],
  }],
  "access-granted": ["Keycard accepted: two bright beeps", {
    vary: 0.05,
    layers: [
      { wave: "sine", freq: 1320, arp: [0, 5], arpRate: 0.09, a: 0.002, h: 0.14, d: 0.06, shape: 1.5 },
      { wave: "square", duty: 0.25, freq: 2640, arp: [0, 5], arpRate: 0.09, a: 0.002, h: 0.14, d: 0.06, shape: 1.5, lp: 5000, gain: 0.15 },
    ],
  }],
  "access-denied": ["Keycard rejected: low double buzz with a crackle", {
    vary: 0.1,
    layers: [
      { wave: "square", freq: 220, a: 0.003, h: 0.08, d: 0.03, shape: 1, lp: 1500, drive: 1 },
      { wave: "square", freq: 220, at: 0.14, a: 0.003, h: 0.12, d: 0.08, shape: -3, lp: 1500, drive: 1 },
      { wave: "crunch", freq: 4000, at: 0.14, a: 0.003, d: 0.1, shape: -4, gain: 0.15 },
    ],
  }],
  "door-slide": ["Sci-fi door slides open with a hiss", {
    vary: 0.3,
    varyF: 2,
    verb: [0.3, 0.12],
    layers: [
      { wave: "noise", bp: 4000, bpTo: 2000, q: 1.2, a: 0.01, d: 0.35, shape: -3, gain: 0.6 },
      { wave: "saw", freq: 80, to: 140, lp: 600, a: 0.02, h: 0.2, d: 0.15, shape: -3, gain: 0.5 },
      { wave: "noise", bp: 900, q: 2, at: 0.33, a: 0.001, d: 0.04, shape: -5, gain: 0.6 },
      { wave: "sine", freq: 110, to: 60, at: 0.33, a: 0.001, d: 0.1, shape: -5, gain: 0.5 },
    ],
  }],
  "robot-chatter": ["Cute robot beeps and boops", {
    vary: 2,
    layers: [
      { wave: "sine", freq: 900, arp: [0, 9, 4, 14, -3, 7], arpRate: 0.06, vib: [24, 1.5], a: 0.003, h: 0.33, d: 0.05, shape: 2 },
      { wave: "square", duty: 0.3, freq: 450, arp: [0, 9, 4, 14, -3, 7], arpRate: 0.06, lp: 2500, a: 0.003, h: 0.33, d: 0.05, shape: 2, gain: 0.25 },
    ],
  }],
  shutdown: ["System shutdown: whine falls and cuts", {
    vary: 0.2,
    layers: [
      { wave: "saw", freq: 900, to: 40, curve: 0.7, lp: 3000, kt: 1, a: 0.005, h: 0.1, d: 0.7, shape: 1.5, gain: 0.7 },
      { wave: "sine", freq: 450, to: 20, curve: 0.7, a: 0.005, h: 0.1, d: 0.7, shape: 1.5, gain: 0.5 },
      { wave: "noise", bp: 1200, at: 0.8, a: 0.001, d: 0.02, shape: -5, gain: 0.4 },
    ],
  }],
  glitch: ["Digital glitch: stuttering crushed burst", {
    vary: 2,
    varyF: 3,
    rate: 8000,
    bits: 5,
    layers: [
      { wave: "square", freq: 300, arp: [0, 17, -5, 24, 3, 12], arpRate: 0.025, a: 0.001, h: 0.13, d: 0.03, shape: 1, gain: 0.5 },
      { wave: "crunch", freq: 2000, to: 9000, a: 0.001, h: 0.1, d: 0.04, shape: 1, gain: 0.5 },
    ],
  }],
});
