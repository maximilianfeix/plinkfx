import { render } from "./synth.ts";
import type { Sound } from "./types.ts";

export interface PlayOptions {
  /** Which take to play (0..3). Default: a random one, never the same twice in a row. */
  variant?: number;
  /** 0..1, multiplied with the master volume. Default 1. */
  volume?: number;
  /** Playback rate; 2 is an octave up. Default 1. */
  rate?: number;
}

/** Every sound ships with this many takes (seeds 0..3). */
export const VARIANTS = 4;

let ctx: AudioContext | undefined, master: GainNode;
const cache = new WeakMap<Sound, AudioBuffer[]>(),
  last = new WeakMap<Sound, number>();

/** The shared AudioContext, created on first use. Connect your own nodes to it if you like. */
export function context(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.connect(ctx.destination);
  }
  return ctx;
}

/** Master volume, 0..1. */
export function volume(v: number) {
  context();
  master.gain.value = v;
}

/** Render (once) and return the AudioBuffer for one take of a sound. */
export function buffer(sound: Sound, variant = 0): AudioBuffer {
  const c = context(),
    list = cache.get(sound) || [];
  cache.set(sound, list);
  if (!list[variant]) {
    const data = render(sound, { sampleRate: c.sampleRate, seed: variant }),
      b = c.createBuffer(1, data.length, c.sampleRate);
    b.copyToChannel(data as Float32Array<ArrayBuffer>, 0);
    list[variant] = b;
  }
  return list[variant];
}

/** Play a sound. Returns the source node, so you can stop it early. */
export function play(sound: Sound, o: PlayOptions = {}): AudioBufferSourceNode {
  const c = context();
  if (c.state != "running") c.resume();
  let v = o.variant;
  if (v == null) {
    const l = last.get(sound) ?? -1;
    v = Math.floor(Math.random() * (l < 0 ? VARIANTS : VARIANTS - 1));
    if (l >= 0 && v >= l) v++;
  }
  last.set(sound, v);
  const src = c.createBufferSource(),
    g = c.createGain();
  src.buffer = buffer(sound, v);
  src.playbackRate.value = o.rate ?? 1;
  g.gain.value = o.volume ?? 1;
  src.connect(g).connect(master);
  src.start();
  return src;
}
