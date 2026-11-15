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
  /**
   * Skip this play when the same sound already starts within this many seconds of it, so 30 coin
   * pickups in one frame make one coin, not one loud stack. Default 0.03. 0 turns it off. Loops are exempt.
   */
  cooldown?: number;
  /** Most copies of this sound playing at once; one more stops the oldest (with a short fade). Default 4. */
  voices?: number;
  /** Repeat until `stop()`. Default: true for loop sounds (`rain-loop`, `engine-idle`, ...), false otherwise. */
  loop?: boolean;
}

/** A sound that is playing, returned by play(). */
export interface Voice {
  /** Stop it, fading out over `fade` seconds. Default 0.01 (just enough to avoid a click). */
  stop(fade?: number): void;
  /** Glide to a new playback rate (an engine revving, a charge-up rising). */
  rate(r: number): void;
  /** The underlying AudioBufferSourceNode. */
  node: AudioBufferSourceNode;
}

/** Every sound ships with this many takes (seeds 0..3). */
export const VARIANTS = 4;

let ctx: AudioContext | undefined,
  master: GainNode | undefined,
  level = 1,
  off = false;
// Per sound: rendered takes, last take, last start time, voices playing.
const seen = new WeakMap<Sound, { b: AudioBuffer[]; v: number; t: number; on: Voice[] }>(),
  state = (s: Sound) => seen.get(s) || seen.set(s, { b: [], v: (Math.random() * VARIANTS) | 0, t: -9, on: [] }).get(s)!,
  live = new Set<Voice>(),
  ok = () => typeof AudioContext != "undefined";

/** The shared AudioContext, created on first use. Connect your own nodes to it if you like. */
export function context(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    volume(level);
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
  if (master) master.gain.value = off ? 0 : level;
}

/**
 * Mute or unmute everything (the volume is kept for unmute). Returns the current state; muted() just reads it.
 * Not stored: to remember it, `muted(localStorage.muted == "1")` at startup and save it when it changes.
 */
export function muted(on?: boolean): boolean {
  if (on != null) (off = on), volume(level);
  return off;
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
    list = state(sound).b;
  if (!list[variant]) {
    const data = render(sound, { sampleRate: c.sampleRate, seed: variant });
    (list[variant] = c.createBuffer(1, data.length, c.sampleRate)).getChannelData(0).set(data);
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
 * Play a sound. Returns a Voice (to stop it or change its rate), or undefined when it was skipped:
 * on the server, inside the cooldown, or while audio is still locked and no user gesture is happening
 * (so sounds triggered before the first click don't all fire at once when audio unlocks).
 */
export function play(sound: Sound, o: PlayOptions = {}): Voice | undefined {
  if (!ok()) return;
  const c = context();
  if (c.state != "running" && (c.resume(), (navigator as any).userActivation?.isActive == false)) return;
  const at = c.currentTime + Math.max(0, o.delay || 0),
    loop = o.loop ?? !!sound.loop,
    s = state(sound);
  if (!loop && Math.abs(at - s.t) < (o.cooldown ?? 0.03)) return;
  s.t = at;
  // A random take, never the same one twice in a row.
  const v = (s.v = o.variant ?? (s.v + 1 + ((Math.random() * (VARIANTS - 1)) | 0)) % VARIANTS);
  while (s.on.length >= (o.voices || 4)) s.on[0].stop();
  const src = c.createBufferSource(),
    g = c.createGain(),
    drop = () => (live.delete(h), s.on.splice(s.on.indexOf(h) >>> 0, 1)),
    h: Voice = {
      node: src,
      stop(f = 0.01) {
        const t = c.currentTime;
        g.gain.setTargetAtTime(0, t, f / 5 + 1e-3);
        src.stop(t + f + 0.01);
        drop();
      },
      rate: (r) => src.playbackRate.setTargetAtTime(r, c.currentTime, 0.02),
    };
  let node: AudioNode = src.connect(g);
  src.buffer = buffer(sound, v);
  src.loop = loop;
  src.playbackRate.value = o.rate ?? 1;
  g.gain.value = o.volume ?? 1;
  if (o.pan) {
    const p = c.createStereoPanner();
    p.pan.value = o.pan; // the param clamps to -1..1 itself
    node = node.connect(p);
  }
  node.connect(master!);
  live.add(h);
  s.on.push(h);
  src.onended = drop;
  src.start(at);
  return h;
}

/** Stop every sound that is playing. */
export function stopAll() {
  for (const h of live) h.stop(0);
}
