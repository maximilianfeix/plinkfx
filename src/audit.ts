/**
 * `plinkfx check`: the problems a listener notices first. Clicks at the edges, DC offset,
 * a cut-off tail, clipping, silent padding, and loudness off the category target.
 * Pure: takes samples, returns findings. The CLI and the MCP server both use it.
 */
import { measure, type Measurement } from "./meter.ts";

export interface Issue {
  /** start-click, end-click, tail-cut, clipping, true-peak, dc, lead-silence, tail-silence, loudness, quiet, long, empty */
  check: string;
  /** "fail" makes `plinkfx check` exit 1. "warn" is worth a look. */
  level: "fail" | "warn";
  message: string;
}

export interface Audit {
  ok: boolean;
  issues: Issue[];
  /** Measurement of the first take checked. */
  m: Measurement;
  /** Average max momentary loudness over the takes checked. */
  lufsAvg: number;
  /** Highest true peak over the takes checked. */
  truePeak: number;
  target?: number;
}

/** Thresholds, exported so docs and tests can quote them. */
export const LIMITS = {
  /** A first or last sample above this (dBFS) is a step from or to silence: a click. */
  edge: -40,
  /** |mean| above this is a DC offset. Short, lopsided transients reach ~0.006 without one. */
  dc: 0.01,
  /** The tail counts as cut when the last 10 ms are louder than this against the loudest 10 ms (dB)... */
  tailLevel: -40,
  /** ...and fall less than this from the 10 ms before (dB). A 5 ms fade alone drops ~2 dB. */
  tailDrop: 3,
  /** True peak: warn above this (dBTP, headroom for OGG/MP3)... */
  truePeak: -1,
  /** ...fail above this (dBTP, it clips after resampling or encoding). */
  truePeakFail: 0,
  /** Silence = below this, relative to the peak (dB). */
  silence: -60,
  /** Leading silence (s): warn above the first, fail above the second. It delays every trigger. */
  lead: [0.01, 0.1],
  /** Trailing near-silence longer than this (s) holds a voice for nothing. */
  trail: 0.25,
  /** Loudness may differ from the category target by this much (LU). */
  loudness: 2,
  /** A sound whose true peak is within this of the ceiling (dB) is peak-limited and may stay under target... */
  peakRoom: 1.5,
  /** ...but not by more than this (LU). */
  quiet: 8,
  /** Longer than this (s) is a loop or music, not an effect. */
  long: 4,
};

const db = (x: number) => (x > 0 ? 20 * Math.log10(x) : -Infinity);
const f1 = (x: number) => (Number.isFinite(x) ? x.toFixed(1) : "-inf");

/**
 * Check a sound. `takes` are its rendered takes (a WAV file is one take).
 * `target` is the category loudness in max momentary LUFS; without it loudness is not judged.
 */
export function audit(takes: Float32Array[], sr: number, target?: number): Audit {
  const issues: Issue[] = [],
    add = (check: string, level: Issue["level"], message: string) => {
      const i = issues.findIndex((i) => i.check == check);
      if (i < 0) issues.push({ check, level, message });
      else if (level == "fail" && issues[i].level == "warn") issues[i] = { check, level, message };
    },
    ms = takes.map((x) => measure(x, sr)),
    lufsAvg = ms.reduce((a, t) => a + t.lufsMax, 0) / ms.length,
    truePeak = Math.max(...ms.map((t) => t.truePeak)),
    w = Math.max(1, Math.round(sr * 0.01)),
    rms = (x: Float32Array, a: number) => {
      let e = 0;
      for (let i = a; i < a + w; i++) e += x[i] * x[i];
      return Math.sqrt(e / w);
    };

  takes.forEach((x, t) => {
    const take = takes.length > 1 ? ` (take ${t})` : "",
      n = x.length;
    let peak = 0,
      full = 0;
    for (const v of x) {
      const a = Math.abs(v);
      if (a > peak) peak = a;
      if (a >= 0.999) full++;
    }
    if (!n || peak < 1e-6) return add("empty", "fail", `silent or empty${take}`);
    const first = db(Math.abs(x[0])),
      last = db(Math.abs(x[n - 1]));
    if (first > LIMITS.edge) add("start-click", "fail", `starts at ${f1(first)} dBFS instead of silence${take}: give it an attack (a: 0.002)`);
    if (last > LIMITS.edge) add("end-click", "fail", `ends at ${f1(last)} dBFS instead of silence${take}: fade it out`);
    if (n >= 3 * w) {
      let loud = 0;
      for (let a = 0; a + w <= n; a += Math.max(1, w >> 3)) loud = Math.max(loud, rms(x, a));
      const end = rms(x, n - w),
        level = db(end) - db(loud),
        drop = db(rms(x, n - 2 * w)) - db(end);
      if (level > LIMITS.tailLevel && drop < LIMITS.tailDrop)
        add("tail-cut", "fail", `still at ${f1(level)} dB in the last 10 ms${take}: the tail is cut off (longer d, or less verb/echo)`);
    }
    if (full > 1) add("clipping", "fail", `${full} samples at full scale${take}: lower the gain`);
    const tp = ms[t].truePeak;
    if (tp > LIMITS.truePeakFail) add("true-peak", "fail", `true peak ${f1(tp)} dBTP${take}: it will clip. Lower the gain (plinkfx level)`);
    else if (tp > LIMITS.truePeak) add("true-peak", "warn", `true peak ${tp.toFixed(2)} dBTP${take}, above ${LIMITS.truePeak}: little headroom for OGG/MP3`);
    if (Math.abs(ms[t].dc) > LIMITS.dc) add("dc", "fail", `DC offset ${ms[t].dc.toExponential(1)}${take}: add a high-pass`);
    const floor = peak * 10 ** (LIMITS.silence / 20);
    let a = 0,
      b = n - 1;
    while (a < n && Math.abs(x[a]) < floor) a++;
    while (b > a && Math.abs(x[b]) < floor) b--;
    const lead = a / sr,
      trail = (n - 1 - b) / sr;
    if (lead > LIMITS.lead[0])
      add("lead-silence", lead > LIMITS.lead[1] ? "fail" : "warn", `${Math.round(lead * 1000)} ms of silence before the sound starts${take}`);
    if (trail > LIMITS.trail) add("tail-silence", "warn", `${Math.round(trail * 1000)} ms under ${LIMITS.silence} dB at the end${take}`);
  });

  if (target !== undefined && Number.isFinite(lufsAvg)) {
    const off = lufsAvg - target,
      limited = off < 0 && truePeak > LIMITS.truePeak - LIMITS.peakRoom;
    if (limited) {
      if (-off > LIMITS.quiet) add("quiet", "warn", `${f1(lufsAvg)} LUFS, ${f1(-off)} LU under the ${target} target at the peak ceiling: give it more body`);
    } else if (Math.abs(off) > LIMITS.loudness)
      add("loudness", "fail", `${f1(lufsAvg)} LUFS, ${off > 0 ? "+" : ""}${f1(off)} LU off the ${target} target: run plinkfx level --target ${target}`);
  }
  if (ms[0].duration > LIMITS.long) add("long", "warn", `${ms[0].duration.toFixed(1)} s long: is this a loop, not an effect?`);
  return { ok: !issues.some((i) => i.level == "fail"), issues, m: ms[0], lufsAvg, truePeak, target };
}
