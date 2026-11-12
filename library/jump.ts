import { def } from "./def.ts";

export default def("jump", {
  jump: ["Platformer jump: square sweep up", {
    layers: [
      { wave: "square", duty: 0.5, freq: 250, to: 640, curve: 1.5, a: 0.002, h: 0.03, d: 0.15, shape: 2, lp: 3500 },
      { wave: "sine", freq: 125, to: 320, curve: 1.5, a: 0.002, d: 0.14, gain: 0.5 },
    ],
  }],
  "jump-soft": ["Gentle hop for cute characters", {
    layers: [
      { wave: "sine", freq: 290, to: 720, curve: 2, a: 0.003, d: 0.15, shape: 2 },
      { wave: "triangle", freq: 580, to: 1440, curve: 2, a: 0.003, d: 0.1, shape: 3, gain: 0.3 },
    ],
  }],
  "jump-high": ["Big jump with a longer rise", {
    layers: [
      { wave: "square", duty: 0.25, freq: 220, to: 880, curve: 1.2, a: 0.002, h: 0.05, d: 0.25, shape: 2, lp: 4000 },
      { wave: "triangle", freq: 110, to: 440, curve: 1.2, a: 0.002, h: 0.05, d: 0.22, gain: 0.6 },
      { wave: "noise", bp: 800, bpTo: 3000, a: 0.02, d: 0.12, gain: 0.15 },
    ],
  }],
  "jump-double": ["Second jump in mid-air, higher and airier", {
    layers: [
      { wave: "square", duty: 0.25, freq: 440, to: 1100, curve: 2, a: 0.002, d: 0.14, shape: 2, lp: 4500 },
      { wave: "noise", bp: 1800, bpTo: 5000, q: 1.2, a: 0.015, d: 0.12, gain: 0.35 },
    ],
  }],
  "jump-cartoon": ["Boingy cartoon jump with wobble", {
    layers: [{ wave: "sine", freq: 180, to: 760, curve: 1.3, vib: [14, 1.2], a: 0.003, h: 0.05, d: 0.25, shape: 1.8 }],
  }],
  hop: ["Tiny hop for small creatures", {
    vary: 1,
    layers: [{ wave: "triangle", freq: 520, to: 900, a: 0.002, h: 0.02, d: 0.08, shape: 2 }],
  }],
  land: ["Landing on solid ground", {
    layers: [
      { wave: "sine", freq: 130, to: 55, curve: 2, a: 0.001, d: 0.11, shape: 2.5 },
      { wave: "pink", lp: 900, a: 0.001, d: 0.07, shape: 3, gain: 0.6 },
    ],
  }],
  "land-heavy": ["Heavy landing with a thud", {
    layers: [
      { wave: "sine", freq: 90, to: 34, curve: 2, a: 0.001, d: 0.3, shape: 2, drive: 1.5 },
      { wave: "brown", lp: 700, lpTo: 200, a: 0.001, d: 0.25, shape: 2.5, gain: 0.8 },
      { wave: "noise", bp: 1600, q: 0.8, a: 0.001, d: 0.04, shape: 3, gain: 0.35 },
    ],
  }],
  spring: ["Spring or trampoline boing", {
    layers: [
      { wave: "triangle", freq: 160, to: 460, vib: [22, 2.5], a: 0.002, h: 0.05, d: 0.4, shape: 1.8 },
      { wave: "sine", freq: 80, to: 230, vib: [22, 2.5], a: 0.002, d: 0.3, gain: 0.4 },
    ],
  }],
  "wall-jump": ["Push off a wall: scuff then rise", {
    layers: [
      { wave: "noise", bp: 1200, q: 1.5, a: 0.001, d: 0.04, shape: 2, gain: 0.7 },
      { wave: "square", duty: 0.3, freq: 330, to: 780, curve: 2, at: 0.02, a: 0.002, d: 0.12, shape: 2, lp: 3500 },
    ],
  }],
});
