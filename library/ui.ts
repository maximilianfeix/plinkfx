import { def } from "./def.ts";

export default def("ui", {
  click: ["Neutral button click", {
    layers: [
      { wave: "sine", freq: 1900, to: 900, a: 0.001, d: 0.03, shape: 3 },
      { wave: "noise", bp: 4200, q: 1.2, a: 0.001, d: 0.012, shape: 3, gain: 0.5 },
    ],
  }],
  "click-soft": ["Rounded, quiet click for lists and tabs", {
    layers: [
      { wave: "triangle", freq: 880, to: 560, a: 0.002, d: 0.045, shape: 3, lp: 3200 },
      { wave: "pink", lp: 2500, a: 0.001, d: 0.015, shape: 3, gain: 0.25 },
    ],
  }],
  "click-hard": ["Firm mechanical click", {
    layers: [
      { wave: "square", duty: 0.3, freq: 1400, to: 650, a: 0.001, d: 0.022, shape: 3, lp: 6000 },
      { wave: "noise", hp: 3000, a: 0.001, d: 0.01, shape: 2, gain: 0.6 },
    ],
  }],
  tap: ["Bubbly tap, good for mobile", {
    layers: [{ wave: "sine", freq: 520, to: 260, a: 0.001, d: 0.06, shape: 4, curve: 2 }],
  }],
  hover: ["Faint tick when the cursor enters a button", {
    vary: 0.8,
    layers: [{ wave: "sine", freq: 2600, a: 0.001, d: 0.025, shape: 3, hp: 1200 }],
  }],
  "toggle-on": ["Switch on: two rising notes", {
    layers: [
      { wave: "triangle", freq: 660, arp: [0, 7], arpRate: 0.045, a: 0.002, d: 0.11, shape: 2.5 },
      { wave: "sine", freq: 1320, arp: [0, 7], arpRate: 0.045, a: 0.002, d: 0.08, shape: 3, gain: 0.3 },
    ],
  }],
  "toggle-off": ["Switch off: two falling notes", {
    layers: [
      { wave: "triangle", freq: 990, arp: [0, -7], arpRate: 0.045, a: 0.002, d: 0.11, shape: 2.5 },
      { wave: "sine", freq: 1980, arp: [0, -7], arpRate: 0.045, a: 0.002, d: 0.08, shape: 3, gain: 0.3 },
    ],
  }],
  confirm: ["Bright major arpeggio, 'OK'", {
    verb: [0.2, 0.15],
    layers: [
      { wave: "triangle", freq: 784, arp: [0, 4, 7], arpRate: 0.05, a: 0.002, h: 0.02, d: 0.22, shape: 2 },
      { wave: "sine", freq: 1568, arp: [0, 4, 7], arpRate: 0.05, a: 0.002, d: 0.2, shape: 2.5, gain: 0.35 },
    ],
  }],
  cancel: ["Soft descending 'back'", {
    layers: [
      { wave: "square", duty: 0.4, freq: 520, to: 330, a: 0.002, d: 0.13, shape: 2, lp: 1800 },
      { wave: "sine", freq: 260, to: 165, a: 0.002, d: 0.12, gain: 0.5 },
    ],
  }],
  error: ["Two low buzzes, 'not allowed'", {
    vary: 0.2,
    layers: [
      { wave: "saw", freq: 155, a: 0.003, h: 0.05, d: 0.04, shape: 1.5, lp: 1300, drive: 0.6 },
      { wave: "saw", freq: 155, at: 0.13, a: 0.003, h: 0.06, d: 0.06, shape: 1.5, lp: 1300, drive: 0.6 },
      { wave: "square", freq: 77.5, a: 0.003, h: 0.17, d: 0.08, lp: 500, gain: 0.5 },
    ],
  }],
  deny: ["Short dull thunk for disabled buttons", {
    layers: [
      { wave: "square", freq: 120, to: 90, a: 0.002, d: 0.12, lp: 700, drive: 1 },
      { wave: "noise", lp: 1500, a: 0.001, d: 0.03, gain: 0.3 },
    ],
  }],
  notify: ["Two-tone bell notification", {
    verb: [0.3, 0.2],
    layers: [
      { wave: "sine", freq: 1319, fm: [3.5, 1.6, 0.12], a: 0.002, d: 0.45, shape: 2.5 },
      { wave: "sine", freq: 1760, fm: [3.5, 1.6, 0.12], at: 0.1, a: 0.002, d: 0.6, shape: 2.5 },
    ],
  }],
  pop: ["Upward pop, for things appearing", {
    layers: [{ wave: "sine", freq: 380, to: 1250, curve: 3, a: 0.002, d: 0.07, shape: 3 }],
  }],
  "pop-down": ["Downward pop, for things disappearing", {
    layers: [{ wave: "sine", freq: 1100, to: 330, curve: 3, a: 0.002, d: 0.08, shape: 3 }],
  }],
  swipe: ["Quick airy swipe between pages", {
    layers: [{ wave: "noise", bp: 1400, bpTo: 5200, q: 1.4, a: 0.04, d: 0.1, shape: 2 }],
  }],
  type: ["Keyboard tick for text that types itself", {
    vary: 1.5,
    layers: [
      { wave: "noise", bp: 2600, q: 2, a: 0.001, d: 0.016, shape: 3 },
      { wave: "square", duty: 0.25, freq: 1050, a: 0.001, d: 0.012, shape: 3, lp: 4000, gain: 0.25 },
    ],
  }],
  tick: ["Tiny tick for sliders and scroll steps", {
    vary: 1,
    layers: [{ wave: "sine", freq: 3200, a: 0.001, d: 0.009, shape: 2 }],
  }],
  "menu-open": ["Menu or panel slides open", {
    layers: [
      { wave: "triangle", freq: 330, to: 880, a: 0.004, d: 0.12, shape: 2, lp: 3000 },
      { wave: "noise", bp: 2500, bpTo: 5000, a: 0.03, d: 0.06, gain: 0.25 },
    ],
  }],
  "menu-close": ["Menu or panel closes", {
    layers: [
      { wave: "triangle", freq: 880, to: 330, a: 0.004, d: 0.12, shape: 2, lp: 3000 },
      { wave: "noise", bp: 5000, bpTo: 2500, a: 0.03, d: 0.06, gain: 0.25 },
    ],
  }],
  select: ["Retro menu cursor move", {
    layers: [{ wave: "square", duty: 0.125, freq: 1047, arp: [0, 12], arpRate: 0.035, a: 0.001, d: 0.1, shape: 2, lp: 5500 }],
  }],
  "select-soft": ["Gentle cursor move for modern menus", {
    layers: [{ wave: "sine", freq: 1175, fm: [2, 0.8, 0.03], a: 0.002, d: 0.08, shape: 3 }],
  }],
  message: ["Chat message arrives", {
    verb: [0.2, 0.1],
    layers: [{ wave: "sine", freq: 880, arp: [0, 5, 12], arpRate: 0.055, a: 0.003, d: 0.2, shape: 2, vib: [7, 0.1] }],
  }],
  plink: ["The plinkfx signature: one drop of sound", {
    verb: [0.35, 0.22],
    vary: 0.3,
    layers: [
      { wave: "sine", freq: 1050, to: 2150, curve: 4, sweep: 0.05, a: 0.001, d: 0.32, shape: 3 },
      { wave: "sine", freq: 3150, fm: [1.41, 1.2, 0.04], a: 0.001, d: 0.12, shape: 4, gain: 0.25 },
      { wave: "triangle", freq: 525, to: 1075, curve: 4, sweep: 0.05, a: 0.001, d: 0.15, shape: 3, gain: 0.25 },
    ],
  }],
});
