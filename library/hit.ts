import { def } from "./def.ts";

export default def("hit", {
  hit: ["Solid all-round hit: click, body, thump", {
    layers: [
      { wave: "noise", hp: 2500, a: 0.001, d: 0.012, shape: 3, gain: 0.5 },
      { wave: "pink", lp: 3000, lpTo: 500, a: 0.001, h: 0.015, d: 0.11, shape: 2.5, drive: 3 },
      { wave: "sine", freq: 170, to: 52, curve: 2, at: 0.004, a: 0.001, d: 0.16, shape: 2, drive: 2, gain: 0.8 },
    ],
  }],
  "hit-light": ["Light jab or tap", {
    layers: [
      { wave: "noise", bp: 2200, q: 1, a: 0.001, h: 0.02, d: 0.07, shape: 2.5, drive: 3 },
      { wave: "triangle", freq: 340, to: 150, curve: 2, at: 0.003, a: 0.001, d: 0.08, shape: 2.5, drive: 1, gain: 0.5 },
    ],
  }],
  "hit-heavy": ["Heavy blow with crunch and low end", {
    verb: [0.15, 0.1],
    layers: [
      { wave: "noise", hp: 2000, a: 0.001, d: 0.025, gain: 0.6 },
      { wave: "crunch", freq: 2600, to: 400, a: 0.001, d: 0.16, shape: 2.5, lp: 4000, gain: 0.6 },
      { wave: "sine", freq: 110, to: 38, curve: 2, a: 0.001, d: 0.3, shape: 2, drive: 2 },
      { wave: "brown", lp: 500, a: 0.001, d: 0.2, gain: 0.6 },
    ],
  }],
  punch: ["Cartoon punch, meaty", {
    layers: [
      { wave: "noise", bp: 1800, q: 1, a: 0.001, d: 0.01, shape: 3, drive: 2, gain: 0.5 },
      { wave: "pink", bp: 900, bpTo: 250, q: 0.9, a: 0.001, d: 0.14, shape: 2.2, drive: 2 },
      { wave: "sine", freq: 120, to: 45, curve: 2, a: 0.001, d: 0.18, shape: 2, drive: 2.5 },
      { wave: "brown", lp: 400, a: 0.001, d: 0.12, gain: 0.6 },
    ],
  }],
  slap: ["Flat slap", {
    verb: [0.15, 0.12],
    layers: [
      { wave: "noise", bp: 3000, q: 0.8, a: 0.001, h: 0.01, d: 0.05, shape: 3, drive: 4 },
      { wave: "pink", bp: 1100, q: 0.9, a: 0.001, d: 0.08, shape: 2.5, drive: 1.5, gain: 0.5 },
      { wave: "sine", freq: 240, to: 140, at: 0.003, a: 0.001, d: 0.05, shape: 3, drive: 1, gain: 0.3 },
    ],
  }],
  hurt: ["Player takes damage: buzzy drop", {
    layers: [
      { wave: "square", duty: 0.5, freq: 520, to: 180, curve: 1.5, a: 0.001, h: 0.03, d: 0.17, shape: 2, lp: 3000, drive: 0.8 },
      { wave: "crunch", freq: 1600, to: 500, a: 0.001, d: 0.12, gain: 0.35, lp: 3000 },
    ],
  }],
  "enemy-hit": ["Enemy flinches: short high blip and smack", {
    layers: [
      { wave: "square", duty: 0.25, freq: 900, to: 450, a: 0.001, h: 0.02, d: 0.09, shape: 2, lp: 5000, gain: 0.8 },
      { wave: "noise", bp: 3000, a: 0.001, d: 0.05, shape: 3, drive: 2 },
      { wave: "sine", freq: 220, to: 110, a: 0.001, d: 0.07, shape: 2.5, drive: 1, gain: 0.6 },
    ],
  }],
  "enemy-die": ["Enemy defeated: falling crushed tone", {
    rate: 11025,
    layers: [
      { wave: "square", duty: 0.5, freq: 680, to: 70, curve: 1.2, a: 0.001, h: 0.03, d: 0.34, shape: 1.5, lp: 3000 },
      { wave: "crunch", freq: 3000, to: 200, a: 0.001, d: 0.3, gain: 0.4 },
    ],
  }],
  "sword-hit": ["Blade hits armour", {
    verb: [0.3, 0.18],
    layers: [
      { wave: "metal", freq: 820, hp: 2500, a: 0.001, d: 0.45, shape: 3.5 },
      { wave: "noise", hp: 3000, a: 0.001, d: 0.04, shape: 3, gain: 0.7 },
      { wave: "sine", freq: 2780, fm: [1.41, 2, 0.15], a: 0.001, d: 0.35, shape: 3, gain: 0.3 },
    ],
  }],
  block: ["Shield block: dull metal clank", {
    verb: [0.2, 0.12],
    layers: [
      { wave: "metal", freq: 420, bp: 1600, q: 1.5, a: 0.001, d: 0.25, shape: 3, drive: 1 },
      { wave: "noise", lp: 2000, a: 0.001, d: 0.05, shape: 3, drive: 1.5, gain: 0.6 },
      { wave: "sine", freq: 180, to: 100, a: 0.001, d: 0.14, drive: 1, gain: 0.7 },
    ],
  }],
  crit: ["Critical hit: impact plus a bright ring", {
    verb: [0.25, 0.15],
    layers: [
      { wave: "noise", hp: 2000, a: 0.001, d: 0.03, gain: 0.7 },
      { wave: "sine", freq: 130, to: 45, curve: 2, a: 0.001, d: 0.22, shape: 2, drive: 1.5 },
      { wave: "square", duty: 0.25, freq: 1760, arp: [0, 12], arpRate: 0.05, at: 0.02, a: 0.001, d: 0.25, shape: 3, lp: 6000, gain: 0.35 },
    ],
  }],
  squish: ["Wet squish for slimes", {
    layers: [
      { wave: "noise", lp: 1400, lpTo: 300, q: 3, a: 0.004, d: 0.18, shape: 2, drive: 1.5 },
      { wave: "sine", freq: 300, to: 110, vib: [30, 2], a: 0.003, d: 0.14, gain: 0.5 },
    ],
  }],
  bonk: ["Cartoon bonk on the head", {
    layers: [
      { wave: "sine", freq: 920, to: 330, curve: 2, a: 0.001, d: 0.12, shape: 2 },
      { wave: "triangle", freq: 460, to: 165, curve: 2, a: 0.001, d: 0.1, gain: 0.5 },
      { wave: "noise", bp: 1500, a: 0.001, d: 0.02, gain: 0.4 },
    ],
  }],
  stomp: ["Stomp on an enemy: squashy thump that springs up", {
    layers: [
      { wave: "sine", freq: 520, to: 140, curve: 2, a: 0.001, d: 0.08, shape: 2.5, drive: 1 },
      { wave: "pink", lp: 1600, lpTo: 400, a: 0.001, d: 0.06, shape: 3, drive: 1.5, gain: 0.7 },
      { wave: "square", duty: 0.25, freq: 440, to: 1100, curve: 2, at: 0.05, a: 0.002, d: 0.09, shape: 2, lp: 4000, gain: 0.35 },
    ],
  }],
  "arrow-hit": ["Arrow thunks into wood", {
    layers: [
      { wave: "noise", bp: 2000, q: 1.5, a: 0.001, d: 0.012, shape: 3, drive: 2, gain: 0.8 },
      { wave: "pink", bp: 700, q: 1.5, a: 0.001, d: 0.06, shape: 2.5, drive: 2 },
      { wave: "sine", freq: 200, to: 90, curve: 2, a: 0.001, d: 0.1, shape: 2.5, drive: 1.5 },
      { wave: "triangle", freq: 420, vib: [45, 0.8], a: 0.001, d: 0.25, shape: 3, gain: 0.3 },
    ],
  }],
});
