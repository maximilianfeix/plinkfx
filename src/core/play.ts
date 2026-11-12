import { render } from "./synth.ts";
import type { Sound } from "./types.ts";

export interface PlayOptions {
  /** Which take to play (0..3, or any integer seed). Default: a random take, never the same twice in a row. */
  variant?: number;
  /** 0..1, multiplied with the master volume. Default 1. */
  volume?: number;
  /** Playback rate; 2 is an octave up. Default 1. */
  rate?: number;
  /** Stereo position, -1 (left) to 1 (right). Default 0. */
  pan?: number;
  /** Start after this many seconds. Default 0. */
  delay?: number;
}

/** Every sound ships with this many takes (seeds 0..3). */
export const VARIANTS = 4;

let ctx: AudioContext | undefined,
  master: GainNode | undefined,
  level = 1;
const cache = new WeakMap<Sound, AudioBuffer[]>(),
  last = new WeakMap<Sound, number>(),
  live = new Set<AudioBufferSourceNode>(),
  ok = () => typeof AudioContext != "undefined";

/** The shared AudioContext, created on first use. Connect your own nodes to it if you like. */
export function context(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = level;
    // Soft safety limiter, so ten coins at once don't clip.
    const k = ctx.createDynamicsCompressor();
    k.threshold.value = -3;
    k.knee.value = 3;
    k.ratio.value = 20;
    k.release.value = 0.1;
    master.connect(k).connect(ctx.destination);
  }
  return ctx;
}

/** Master volume, 0..1 (0 mutes). Safe to call before any sound played, and on the server. */
export function volume(v: number) {
  level = Math.max(0, Number.isFinite(v) ? v : 1);
  if (master) master.gain.value = level;
}

/**
 * Resume audio on the user's first tap, click or key press (browsers start audio suspended).
 * Call once at startup; play() also works without it, it just can't play before that first gesture.
 */
export function unlockAudio() {
  if (!ok() || typeof addEventListener == "undefined") return;
  const go = () => {
    const c = context();
    if (c.state != "running") c.resume();
    // iOS: let sounds play even with the ring/silent switch on (Safari 16.4+).
    const s = (navigator as any).audioSession;
    if (s) s.type = "playback";
    for (const e of EVENTS) removeEventListener(e, go, true);
  };
  for (const e of EVENTS) addEventListener(e, go, true);
}
const EVENTS = ["pointerdown", "keydown", "touchend"];

/** Render (once) and return the AudioBuffer for one take of a sound. */
export function buffer(sound: Sound, variant = 0): AudioBuffer {
  const c = context(),
    list = cache.get(sound) || [];
  cache.set(sound, list);
  if (!list[variant]) {
    const data = render(sound, { sampleRate: c.sampleRate, seed: variant }),
      b = c.createBuffer(1, data.length, c.sampleRate);
    b.getChannelData(0).set(data);
    list[variant] = b;
  }
  return list[variant];
}

/**
 * Render sounds ahead of time, a little at a time when the browser is idle, so the first
 * play() has no rendering delay. Resolves when done.
 */
export function preload(sounds: Sound[], takes = VARIANTS): Promise<void> {
  if (!ok()) return Promise.resolve();
  const jobs = sounds.flatMap((s) => Array.from({ length: takes }, (_, v) => () => buffer(s, v))),
    idle = (globalThis as any).requestIdleCallback || ((f: () => void) => setTimeout(f, 1));
  return new Promise((done) => {
    const step = () => {
      const t = performance.now();
      while (jobs.length && performance.now() - t < 8) jobs.shift()!();
      jobs.length ? idle(step) : done();
    };
    idle(step);
  });
}

/**
 * Play a sound. Returns the source node (to stop it early), or undefined when nothing can play:
 * on the server, or while audio is still locked and no user gesture is happening (so sounds
 * triggered before the first click don't all fire at once when audio unlocks).
 */
export function play(sound: Sound, o: PlayOptions = {}): AudioBufferSourceNode | undefined {
  if (!ok()) return;
  const c = context();
  if (c.state != "running") {
    c.resume();
    const ua = (navigator as any).userActivation;
    if (ua && !ua.isActive) return;
  }
  let v = o.variant;
  if (v == null) {
    const l = last.get(sound) ?? -1;
    v = Math.floor(Math.random() * (l < 0 ? VARIANTS : VARIANTS - 1));
    if (l >= 0 && v >= l) v++;
  }
  last.set(sound, v);
  const src = c.createBufferSource(),
    g = c.createGain();
  let node: AudioNode = src.connect(g);
  src.buffer = buffer(sound, v);
  src.playbackRate.value = o.rate ?? 1;
  g.gain.value = o.volume ?? 1;
  if (o.pan) {
    const p = c.createStereoPanner();
    p.pan.value = Math.max(-1, Math.min(1, o.pan));
    node = node.connect(p);
  }
  node.connect(master!);
  live.add(src);
  src.onended = () => live.delete(src);
  src.start(c.currentTime + Math.max(0, o.delay || 0));
  return src;
}

/** Stop every sound that is playing. */
export function stopAll() {
  for (const s of live) s.stop();
  live.clear();
}
