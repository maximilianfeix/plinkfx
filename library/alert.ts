import { def } from "./def.ts";

export default def("alert", {
  alarm: ["Two-tone alarm, loops cleanly if repeated", {
    vary: 0.1,
    layers: [{ wave: "square", duty: 0.5, freq: 880, arp: [0, -5], arpRate: 0.16, loop: true, a: 0.005, h: 0.6, d: 0.02, shape: 1, lp: 3500 }],
  }],
  beep: ["Plain beep", {
    vary: 0.1,
    layers: [{ wave: "sine", freq: 1000, a: 0.004, h: 0.08, d: 0.03, shape: 1 }],
  }],
  warning: ["Warning: three urgent pulses", {
    vary: 0.1,
    layers: [0, 0.14, 0.28].map((at) => ({ wave: "saw" as const, freq: 440, at, a: 0.003, h: 0.07, d: 0.03, shape: 1, lp: 2400 })),
  }],
  "low-health": ["Low health: soft double beep", {
    vary: 0.1,
    layers: [
      { wave: "triangle", freq: 880, a: 0.003, h: 0.06, d: 0.04, shape: 1 },
      { wave: "triangle", freq: 880, at: 0.16, a: 0.003, h: 0.06, d: 0.04, shape: 1 },
    ],
  }],
  heartbeat: ["Heartbeat: lub-dub", {
    vary: 0.3,
    layers: [
      { wave: "sine", freq: 70, to: 45, a: 0.004, d: 0.12, shape: 2, drive: 0.5 },
      { wave: "triangle", freq: 140, to: 90, a: 0.004, d: 0.07, shape: 2.5, gain: 0.35 },
      { wave: "pink", lp: 450, a: 0.003, d: 0.05, shape: 3, drive: 1, gain: 0.5 },
      { wave: "sine", freq: 60, to: 40, at: 0.2, a: 0.004, d: 0.14, shape: 2, gain: 0.7 },
      { wave: "triangle", freq: 120, to: 80, at: 0.2, a: 0.004, d: 0.08, shape: 2.5, gain: 0.25 },
      { wave: "pink", lp: 400, at: 0.2, a: 0.003, d: 0.05, shape: 3, drive: 1, gain: 0.35 },
    ],
  }],
  countdown: ["Countdown tick: 3, 2, 1", {
    vary: 0.05,
    layers: [{ wave: "sine", freq: 880, fm: [2, 0.6, 0.05], a: 0.002, h: 0.05, d: 0.12, shape: 2 }],
  }],
  "countdown-go": ["Countdown end: GO!", {
    vary: 0.05,
    layers: [
      { wave: "sine", freq: 1760, fm: [2, 0.6, 0.1], a: 0.002, h: 0.25, d: 0.25, shape: 2 },
      { wave: "square", duty: 0.25, freq: 880, a: 0.002, h: 0.25, d: 0.2, lp: 3000, gain: 0.25 },
    ],
  }],
  siren: ["Siren sweep", {
    vary: 0.1,
    layers: [{ wave: "saw", freq: 700, vib: [1.6, 5], a: 0.05, h: 1.1, d: 0.15, shape: 1, lp: 3000 }],
  }],
  "radar-ping": ["Sonar ping", {
    vary: 0.1,
    echo: [0.32, 0.4, 0.35],
    verb: [0.4, 0.2],
    layers: [{ wave: "sine", freq: 1500, a: 0.002, d: 0.35, shape: 3 }],
  }],
  "quest-new": ["New quest or objective", {
    verb: [0.45, 0.25],
    layers: [
      { wave: "triangle", freq: 587, arp: [0, 5, 7], arpRate: 0.11, a: 0.003, h: 0.3, d: 0.3, shape: 2 },
      { wave: "sine", freq: 1175, fm: [2, 0.7, 0.2], arp: [0, 5, 7], arpRate: 0.11, a: 0.003, h: 0.3, d: 0.3, gain: 0.35 },
    ],
  }],
});
