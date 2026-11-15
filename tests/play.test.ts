/**
 * The player against a fake AudioContext: the voice handle, cooldown, the voice cap, loops,
 * stop/stopAll and mute. The fake records what play() asks of Web Audio; time moves by hand.
 */
import { beforeAll, describe, expect, test } from "vitest";
import type { Sound } from "../src/core/types.ts";

class Param {
  value = 1;
  targets: [number, number, number][] = [];
  setTargetAtTime(v: number, t: number, tc: number) {
    this.targets.push([v, t, tc]);
  }
}
const node = () => ({ connect: (n: any) => n });
class Source {
  buffer: any;
  loop = false;
  playbackRate = new Param();
  onended?: () => void;
  started?: number;
  stopped?: number;
  ended = false;
  connect = (n: any) => n;
  start(t: number) {
    this.started = t;
  }
  stop(t: number) {
    this.stopped = t;
  }
  // What the browser does when the buffer runs out.
  end() {
    this.ended = true;
    this.onended?.();
  }
}
class FakeContext {
  static last: FakeContext;
  state = "running";
  currentTime = 0;
  sampleRate = 8000;
  destination = node();
  sources: Source[] = [];
  gains: { gain: Param; connect: (n: any) => any }[] = [];
  constructor() {
    FakeContext.last = this;
  }
  createGain() {
    const g = { gain: new Param(), ...node() };
    this.gains.push(g);
    return g;
  }
  createDynamicsCompressor() {
    return { threshold: new Param(), knee: new Param(), ratio: new Param(), release: new Param(), ...node() };
  }
  createStereoPanner() {
    return { pan: new Param(), ...node() };
  }
  createBufferSource() {
    const s = new Source();
    this.sources.push(s);
    return s;
  }
  createBuffer(_: number, length: number, sr: number) {
    const d = new Float32Array(length);
    return { duration: length / sr, length, getChannelData: () => d };
  }
  resume() {}
}

let P: typeof import("../src/core/play.ts"), ctx: FakeContext;
// play() typed with the fake nodes, so tests can read what was scheduled.
const play = (s: Sound, o?: import("../src/core/play.ts").PlayOptions) => P.play(s, o) as unknown as { stop(f?: number): void; rate(r: number): void; node: Source } | undefined;
const blip = (): Sound => ({ layers: [{ freq: 600, d: 0.05 }] }),
  hum = (): Sound => ({ loop: true, layers: [{ wave: "noise", a: 0.01, h: 1, d: 0 }] }),
  // Source nodes that are playing (started, not stopped).
  running = () => ctx.sources.filter((s) => s.stopped == null && !s.ended).length;

beforeAll(async () => {
  (globalThis as any).AudioContext = FakeContext;
  P = await import("../src/core/play.ts");
  P.context();
  ctx = FakeContext.last;
});

describe("play() handle", () => {
  test("returns a voice that stops with a short fade", () => {
    const v = play(blip())!;
    expect(v).toBeDefined();
    expect(v.node).toBe(ctx.sources.at(-1));
    ctx.currentTime = 1;
    v.stop(0.5);
    const gain = ctx.gains.at(-1)!.gain;
    expect(gain.targets.at(-1)![0]).toBe(0);
    expect(gain.targets.at(-1)![1]).toBe(1);
    expect(v.node.stopped).toBeCloseTo(1.51, 5);
  });
  test("stop() without a fade still declicks (10 ms)", () => {
    const v = play(blip())!;
    v.stop();
    expect(v.node.stopped! - ctx.currentTime).toBeCloseTo(0.02, 5);
  });
  test("rate() glides the playback rate", () => {
    const v = play(blip(), { rate: 1.5 })!;
    expect(v.node.playbackRate.value).toBe(1.5);
    v.rate(2);
    expect(v.node.playbackRate.targets.at(-1)![0]).toBe(2);
  });
  test("delay schedules the start", () => {
    const v = play(blip(), { delay: 0.25 })!;
    expect(v.node.started).toBeCloseTo(ctx.currentTime + 0.25, 5);
  });
});

describe("cooldown", () => {
  test("the same sound within 30 ms is skipped, later it plays", () => {
    const s = blip();
    ctx.currentTime = 10;
    expect(play(s)).toBeDefined();
    expect(play(s)).toBeUndefined();
    ctx.currentTime = 10.02;
    expect(play(s)).toBeUndefined();
    ctx.currentTime = 10.04;
    expect(play(s)).toBeDefined();
  });
  test("other sounds are not affected", () => {
    ctx.currentTime = 11;
    expect(play(blip())).toBeDefined();
    expect(play(blip())).toBeDefined();
  });
  test("cooldown: 0 turns it off; a longer cooldown skips more", () => {
    const s = blip();
    ctx.currentTime = 12;
    expect(play(s, { cooldown: 0 })).toBeDefined();
    expect(play(s, { cooldown: 0 })).toBeDefined();
    ctx.currentTime = 12.2;
    expect(play(s, { cooldown: 0.5 })).toBeUndefined();
  });
  test("plays spread out with delay all happen", () => {
    const s = blip();
    ctx.currentTime = 13;
    for (let i = 0; i < 3; i++) expect(play(s, { delay: i * 0.1 })).toBeDefined();
  });
});

describe("voices", () => {
  test("at most 4 copies of a sound; the oldest is stopped first", () => {
    const s = blip(),
      vs = [];
    for (let i = 0; i < 6; i++) {
      ctx.currentTime = 20 + i * 0.1;
      vs.push(play(s)!);
    }
    expect(vs.map((v) => v.node.stopped != null)).toEqual([true, true, false, false, false, false]);
    // The stolen voices fade out instead of cutting off.
    expect(vs[0].node.stopped).toBeGreaterThan(20.4);
  });
  test("voices: 1 keeps one copy", () => {
    const s = blip(),
      a = play(s, { voices: 1 })!;
    ctx.currentTime += 0.1;
    const b = play(s, { voices: 1 })!;
    expect(a.node.stopped).toBeDefined();
    expect(b.node.stopped).toBeUndefined();
  });
  test("a voice that ended frees its slot", () => {
    const s = blip(),
      a = play(s, { voices: 1 })!;
    (a.node as unknown as Source).end();
    ctx.currentTime += 0.1;
    play(s, { voices: 1 });
    expect(a.node.stopped).toBeUndefined();
  });
});

describe("loops", () => {
  test("loop sounds loop by default, until stop()", () => {
    const v = play(hum())!;
    expect(v.node.loop).toBe(true);
    expect(v.node.stopped).toBeUndefined();
    v.stop(1);
    expect(v.node.stopped).toBeGreaterThan(ctx.currentTime + 1);
  });
  test("loop: true loops any sound, loop: false plays a loop sound once", () => {
    expect(play(blip(), { loop: true })!.node.loop).toBe(true);
    expect(play(hum(), { loop: false })!.node.loop).toBe(false);
  });
  test("restarting a loop right after stopping it is not swallowed by the cooldown", () => {
    const s = hum();
    play(s)!.stop();
    expect(play(s)).toBeDefined();
  });
  test("a loop buffer is the rendered loop (3.5 s of layers -> 1.01 s - 0.5 s here)", () => {
    const v = play(hum())!;
    expect(v.node.buffer.duration).toBeCloseTo(0.51, 2);
  });
});

describe("stopAll and mute", () => {
  test("stopAll() stops every voice", () => {
    for (let i = 0; i < 3; i++) play(blip());
    play(hum());
    expect(running()).toBeGreaterThan(0);
    P.stopAll();
    expect(running()).toBe(0);
  });
  test("muted() silences the master and keeps the volume for unmute", () => {
    const master = ctx.gains[0].gain;
    expect(P.muted()).toBe(false);
    P.volume(0.5);
    expect(master.value).toBe(0.5);
    expect(P.muted(true)).toBe(true);
    expect(master.value).toBe(0);
    P.volume(0.8);
    expect(master.value).toBe(0);
    expect(P.muted()).toBe(true);
    P.muted(false);
    expect(master.value).toBe(0.8);
  });
});
