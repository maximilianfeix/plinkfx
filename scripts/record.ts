/**
 * Records the demo media from the real gallery and game. Nothing is dubbed:
 * the audio is tapped from the page's own AudioContext output with a
 * MediaRecorder while Playwright records the screen, then both are muxed.
 *
 *   npm run gallery:build && node scripts/serve.ts site 4173 &
 *   node scripts/record.ts            -> docs/media/{hero-16x9.mp4, hero-1x1.mp4, gallery.gif}
 */
import { chromium, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";

const BASE = process.env.BASE || "http://localhost:4173/",
  TMP = ".work/rec",
  OUT = "docs/media";
mkdirSync(TMP, { recursive: true });
mkdirSync(OUT, { recursive: true });
const ff = (...a: string[]) => execFileSync("ffmpeg", ["-loglevel", "error", "-y", ...a], { stdio: "inherit" });

// Taps everything that reaches the speakers into a MediaRecorder (started at the first connection).
const TAP = () => {
  const w = window as any,
    orig = AudioNode.prototype.connect as any;
  (AudioNode.prototype as any).connect = function (this: AudioNode, dest: any, ...rest: any[]) {
    if (dest instanceof AudioDestinationNode) {
      const ctx = this.context as AudioContext;
      if (!w.__tap) {
        const md = ctx.createMediaStreamDestination(),
          rec = new MediaRecorder(md.stream, { mimeType: "audio/webm;codecs=opus", audioBitsPerSecond: 192000 }),
          chunks: Blob[] = [];
        rec.ondataavailable = (e) => chunks.push(e.data);
        rec.start(250);
        w.__tap = { md, rec, chunks, start: Date.now() };
      }
      orig.call(this, w.__tap.md);
    }
    return orig.call(this, dest, ...rest);
  };
};

async function clip(name: string, size: { width: number; height: number }, script: (p: Page) => Promise<void>) {
  const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
  const ctx = await browser.newContext({ viewport: size, deviceScaleFactor: 1, recordVideo: { dir: TMP, size } });
  await ctx.addInitScript(TAP);
  const page = await ctx.newPage(),
    videoStart = Date.now();
  await script(page);
  const audio = await page.evaluate(async () => {
    const t = (window as any).__tap;
    if (!t) return null;
    await new Promise((r) => ((t.rec.onstop = r), t.rec.stop()));
    const buf = new Uint8Array(await new Blob(t.chunks, { type: "audio/webm" }).arrayBuffer());
    let s = "";
    for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
    return { b64: btoa(s), start: t.start };
  });
  const video = await page.video()!.path();
  await ctx.close();
  await browser.close();
  renameSync(video, `${TMP}/${name}.webm`);
  if (audio) {
    writeFileSync(`${TMP}/${name}-audio.webm`, Buffer.from(audio.b64, "base64"));
    const offset = Math.max(0, (audio.start - videoStart) / 1000);
    // Mux: delay the audio by its offset from the start of the video recording.
    ff("-i", `${TMP}/${name}.webm`, "-i", `${TMP}/${name}-audio.webm`, "-filter_complex", `[1:a]adelay=${Math.round(offset * 1000)}:all=1,apad[a]`, "-map", "0:v", "-map", "[a]", "-shortest", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-r", "30", "-c:a", "aac", "-b:a", "192k", `${TMP}/${name}.mp4`);
  } else ff("-i", `${TMP}/${name}.webm`, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-r", "30", "-an", `${TMP}/${name}.mp4`);
  console.log("recorded", name);
}

const SOUNDS = ["coin", "jump", "laser", "explosion", "powerup", "sparkle", "door-heavy", "ka-ching", "level-up", "plink"];

async function gallery(p: Page) {
  await p.goto(BASE + "?demo#coin");
  await p.waitForTimeout(900);
  for (const name of SOUNDS) {
    const tile = p.locator(`.tile[data-name="${name}"]`);
    await tile.evaluate((el) => el.scrollIntoView({ block: "center", behavior: "smooth" }));
    await p.waitForTimeout(260);
    await tile.click();
    await p.waitForTimeout(name == "explosion" || name == "door-heavy" || name == "level-up" ? 950 : 560);
  }
  // live edit: pitch the jump up in steps
  await p.locator(`.tile[data-name="jump"]`).evaluate((el) => el.scrollIntoView({ block: "center" }));
  await p.locator(`.tile[data-name="jump"]`).click();
  for (const v of ["5", "12"]) {
    await p.locator('input[name="pitch"]').fill(v);
    await p.waitForTimeout(480);
  }
}

async function game(p: Page) {
  await p.goto(BASE + "game.html?bot");
  await p.waitForTimeout(600);
  await p.locator("canvas").click();
  await p.waitForTimeout(10000);
}

async function main() {
  for (const [tag, size] of [["16x9", { width: 1280, height: 720 }], ["1x1", { width: 1080, height: 1080 }]] as const) {
    await clip(`gallery-${tag}`, size, gallery);
    await clip(`game-${tag}`, size, game);
    // End card: the social preview, scaled into the frame, 2.5 s of silence.
    ff("-loop", "1", "-i", "brand/banners/social-preview.png", "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo", "-t", "2.5", "-vf", `scale=${size.width}:-2,pad=${size.width}:${size.height}:(ow-iw)/2:(oh-ih)/2:color=0x16130F`, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30", "-c:a", "aac", "-shortest", `${TMP}/end-${tag}.mp4`);
    // Trim the first 0.7 s of each clip (page load), then concatenate.
    const parts = [`gallery-${tag}`, `game-${tag}`, `end-${tag}`];
    const inputs = parts.flatMap((n) => ["-i", `${TMP}/${n}.mp4`]);
    const filt = parts.map((_, i) => (i < 2 ? `[${i}:v]trim=start=0.7,setpts=PTS-STARTPTS,fps=30,format=yuv420p[v${i}];[${i}:a]atrim=start=0.7,asetpts=PTS-STARTPTS,aresample=48000,aformat=channel_layouts=stereo[a${i}];` : `[${i}:v]fps=30,format=yuv420p[v${i}];[${i}:a]aresample=48000,aformat=channel_layouts=stereo[a${i}];`)).join("");
    ff(...inputs, "-filter_complex", `${filt}[v0][a0][v1][a1][v2][a2]concat=n=3:v=1:a=1[v][a]`, "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "21", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", `${OUT}/hero-${tag}.mp4`);
  }
  // README GIF: the gallery part only (it has to work muted), 960 px wide.
  ff("-i", `${TMP}/gallery-16x9.mp4`, "-ss", "0.7", "-t", "9", "-vf", "fps=10,scale=800:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=24:stats_mode=diff[p];[b][p]paletteuse=dither=none:diff_mode=rectangle", `${OUT}/gallery.gif`);
  for (const f of readdirSync(TMP)) if (f.endsWith(".webm") && f.length > 40) rmSync(`${TMP}/${f}`);
  console.log("done:", readdirSync(OUT).join(", "));
}
main();
