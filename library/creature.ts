import { def } from "./def.ts";

// Formant filters (vowel shapes) make saw and pulse waves sound like throats instead of synths.
const AH = [730, 1090, 2440],
  OH = [570, 840, 2410],
  OO = [300, 870, 2240],
  EE = [270, 2290, 3010];

export default def("creature", {
  "bat-flap": ["Wings flapping past", {
    vary: 1,
    varyF: 3,
    varyG: 1.5,
    layers: [0, 0.05, 0.1, 0.15, 0.2].map((at, i) => ({ wave: "pink" as const, bp: 900 + i * 60, q: 1.5, at, a: 0.006, d: 0.04, shape: -4, gain: 1 - i * 0.15 })),
  }],
  "slime-blob": ["Slime squelches and wobbles", {
    varyF: 2,
    layers: [
      { wave: "sine", freq: 180, to: 90, vib: [11, 3], a: 0.004, d: 0.28, shape: -3 },
      { wave: "noise", lp: 1100, lpTo: 250, q: 4, a: 0.003, d: 0.2, shape: -4, drive: 1, gain: 0.5 },
    ],
  }],
  chirp: ["Small critter chirp", {
    vary: 1.5,
    layers: [
      { wave: "sine", freq: 2600, to: 3800, fm: [2, 0.5, 0.03], a: 0.002, d: 0.05, shape: -3 },
      { wave: "sine", freq: 2900, to: 4200, fm: [2, 0.5, 0.03], at: 0.08, a: 0.002, d: 0.06, shape: -3, gain: 0.8 },
    ],
  }],
  "growl-small": ["Low growl of a small monster", {
    vary: 1,
    varyF: 2,
    layers: [
      { wave: "saw", freq: 95, to: 80, vib: [7, 0.8], formant: OH, a: 0.06, h: 0.25, d: 0.3, shape: -3, drive: 1.5 },
      { wave: "brown", lp: 400, a: 0.08, h: 0.2, d: 0.3, gain: 0.4 },
    ],
  }],
  "ghost-moan": ["Ghostly 'oooh'", {
    vary: 0.25,
    verb: [0.75, 0.35],
    layers: [
      { wave: "sine", freq: 290, to: 250, vib: [5, 0.7], formant: OO, a: 0.4, h: 0.4, d: 0.8, shape: -3 },
      { wave: "triangle", freq: 290, to: 250, vib: [5, 0.7], formant: OO, a: 0.4, h: 0.4, d: 0.8, shape: -3, gain: 0.6 },
    ],
  }],
  "bee-buzz": ["Buzzing insect flying by", {
    vary: 0.8,
    layers: [
      { wave: "saw", freq: 210, to: 240, vib: [6, 0.5], bp: 900, bpTo: 1300, q: 2, a: 0.15, h: 0.4, d: 0.3, shape: -3 },
      { wave: "saw", freq: 212, to: 243, vib: [6.6, 0.5], bp: 2400, q: 3, a: 0.15, h: 0.4, d: 0.3, shape: -3, gain: 0.4 },
    ],
  }],
  "creature-hurt": ["Creature yelps when hit", {
    vary: 1.5,
    layers: [
      { wave: "saw", freq: 420, to: 250, curve: 2, formant: AH, kt: 1, a: 0.005, h: 0.04, d: 0.2, shape: -3, drive: 1 },
      { wave: "noise", bp: 2000, a: 0.001, d: 0.02, shape: -5, gain: 0.4 },
    ],
  }],
  "creature-die": ["Creature's last cry, falling away", {
    vary: 1,
    verb: [0.4, 0.2],
    layers: [{ wave: "saw", freq: 330, to: 80, curve: 0.8, vib: [9, 0.6], formant: AH, kt: 1, a: 0.01, h: 0.1, d: 0.6, shape: -2.5, drive: 0.8 }],
  }],
  "voice-babble": ["Gibberish dialogue blips, like a character talking", {
    vary: 2,
    layers: [{ wave: "square", duty: 0.3, freq: 280, arp: [0, 4, -2, 7, 2, 5], arpRate: 0.07, formant: EE, a: 0.005, h: 0.36, d: 0.06, shape: -3 }],
  }],
});
