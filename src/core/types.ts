/**
 * A sound is a list of layers mixed together, plus a few global effects.
 * Every field is plain data, so a sound can be stored as JSON, diffed and
 * tweaked by hand. Times are in seconds, frequencies in Hz.
 */
export type Wave =
  | "sine"
  | "triangle"
  | "square"
  | "saw"
  /** white noise */
  | "noise"
  /** pink noise (softer, -3 dB/oct) */
  | "pink"
  /** brown noise (rumble, -6 dB/oct) */
  | "brown"
  /** sample-and-hold noise at `freq` Hz, the classic crunchy 8-bit noise */
  | "crunch"
  /** six square waves at inharmonic ratios, for bells, cymbals, metal */
  | "metal"
  /** decaying sine modes (see `modes`), for wood, metal bars, glass: a material instead of a tone */
  | "modal"
  /** plucked string (Karplus-Strong): harp, pizzicato, bow twang. See `damp`, `blend` */
  | "pluck";

export interface Layer {
  /** Oscillator shape. Default "sine". */
  wave?: Wave;
  /** Start frequency in Hz. Default 440. */
  freq?: number;
  /** End frequency of a pitch sweep in Hz. The sweep is exponential. */
  to?: number;
  /** Sweep duration in seconds. Default: the whole layer. */
  sweep?: number;
  /** Sweep curve. 1 = even in pitch, >1 = most of the change happens early. */
  curve?: number;
  /** Arpeggio: semitone offsets stepped through every `arpRate` seconds. */
  arp?: number[];
  /** Seconds per arpeggio step. Default 0.06. */
  arpRate?: number;
  /** Repeat the arpeggio instead of holding the last step. */
  loop?: boolean;
  /** Vibrato as [rate Hz, depth in semitones]. */
  vib?: [number, number];
  /** FM as [modulator ratio, index, index decay time in s]. */
  fm?: [number, number, number?];
  /** Mode ratios for "modal". Default [1, 2.756, 5.404, 8.933] (a free bar). Higher modes decay faster. */
  modes?: number[];
  /** "pluck": string damping per period, 0.99 (dead) to 0.999 (rings). Default 0.998. */
  damp?: number;
  /** "pluck": 0.5 = string, lower = muffled. Default 0.5. */
  blend?: number;
  /** Formant centres in Hz (vowel filter), e.g. [730, 1090, 2440] for "ah", [270, 2290, 3010] for "ee". */
  formant?: number[];
  /** Key tracking: filter cutoffs follow pitch changes (1 = fully). Default 0. */
  kt?: number;
  /** Pulse width for "square", 0..1. Default 0.5. */
  duty?: number;

  /** Start offset in seconds. Default 0. */
  at?: number;
  /** Attack time. Default 0.002 (never below 1 ms, so no click). */
  a?: number;
  /** Hold time at full level. Default 0. */
  h?: number;
  /** Decay time to silence. Default 0.2. */
  d?: number;
  /** Decay curve. Positive: (1-t)^shape, 1 = linear, 2 = natural, 4+ = snappy. Negative: exponential, -3 soft to -7 percussive. Default 2. */
  shape?: number;

  /** Low-pass cutoff in Hz. */
  lp?: number;
  /** Low-pass cutoff at the end of the layer (exponential sweep). */
  lpTo?: number;
  /** High-pass cutoff in Hz. */
  hp?: number;
  /** High-pass cutoff at the end of the layer. */
  hpTo?: number;
  /** Band-pass centre in Hz. */
  bp?: number;
  /** Band-pass centre at the end of the layer. */
  bpTo?: number;
  /** Filter resonance (Q). Default 0.707. */
  q?: number;

  /** Saturation amount (tanh). 0 = clean. */
  drive?: number;
  /** Layer level. Default 1. */
  gain?: number;
}

export interface Sound {
  layers: Layer[];
  /** Output level. Set by the bake step so every sound sits in its loudness band. */
  gain?: number;
  /** Pitch spread between variants in semitones. Default 0.4. */
  vary?: number;
  /** Extra filter (brightness) spread between variants in semitones. Default 0. */
  varyF?: number;
  /** Level spread between variants per layer in dB. Default 0. */
  varyG?: number;
  /** Feedback echo as [delay s, feedback 0..1, wet mix]. */
  echo?: [number, number, number];
  /** Small room reverb as [size 0..1, wet mix]. */
  verb?: [number, number];
  /** Bit depth reduction, e.g. 6 for a gritty 6-bit sound. */
  bits?: number;
  /** Look-ahead limiter on the output (set by the bake step for short, spiky sounds). */
  limit?: number;
  /** Sample-rate reduction in Hz (sample and hold), e.g. 8000. */
  rate?: number;
}

export interface RenderOptions {
  /** Default 44100. */
  sampleRate?: number;
  /** Variant seed. 0 is the reference take; any other integer is a variation. */
  seed?: number;
}
