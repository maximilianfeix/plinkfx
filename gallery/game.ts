/**
 * plink run: a 30-second auto-runner. Every sound is a plinkfx sound, and the
 * caption bar names each one as it plays, so the game also works muted (videos).
 */
import { play, rng, volume, type Name } from "../src/index.ts";

const W = 640,
  H = 360,
  GROUND = 300,
  ROUND = 30;
const C = { bg: "#16130f", far: "#211d18", ground: "#3a342c", top: "#6b6358", ink: "#f2ede3", plink: "#ff5a26", coin: "#f2c14e", slime: "#4f9d69", star: "#ffe08a", heart: "#d63f3f", dim: "#a39a8c" };
const cv = document.getElementById("c") as HTMLCanvasElement,
  g = cv.getContext("2d")!;

type Seg = { x: number; w: number };
type Thing = { x: number; y: number; kind: "coin" | "slime" | "star" | "heart"; dead?: boolean; vx?: number; t?: number };

let state: "title" | "count" | "run" | "over" = "title";
let t = 0,
  last = 0,
  time = ROUND,
  speed = 150,
  camX = 0,
  hearts = 3,
  coins = 0,
  best = Number(localStorageGet("plinkrun-best") || 0),
  invincible = 0,
  hurtT = 0,
  stepT = 0,
  countT = 0,
  lastTick = 0,
  muted = false,
  won = false;
const P = { x: 120, y: GROUND - 16, vy: 0, w: 12, h: 16, ground: true, jumps: 0, air: 0 };
let segs: Seg[] = [],
  things: Thing[] = [],
  plats: Seg[] = [],
  genX = 0,
  rand = rng(7);
const captions: { name: string; t: number }[] = [];
const sparks: { x: number; y: number; vx: number; vy: number; life: number; c: string }[] = [];

function localStorageGet(k: string) {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
}
function sfx(name: Name, volumeScale = 1) {
  if (!muted) play(name, { volume: volumeScale });
  captions.push({ name, t });
  if (captions.length > 4) captions.shift();
}

function reset() {
  rand = rng(Math.floor(Math.random() * 1e6));
  segs = [{ x: -200, w: 900 }];
  plats = [];
  things = [];
  genX = 700;
  camX = 0;
  time = ROUND;
  speed = 150;
  hearts = 3;
  coins = 0;
  invincible = 0;
  hurtT = 0;
  won = false;
  Object.assign(P, { x: 120, y: GROUND - P.h, vy: 0, ground: true, jumps: 0, air: 0 });
  generate();
}
function generate() {
  while (genX < camX + W * 2) {
    const gap = 50 + rand() * 50 * Math.min(1.6, speed / 150),
      w = 180 + rand() * 260,
      x = genX + gap;
    segs.push({ x, w });
    // coins: an arc over the gap, or a line on the ground
    if (rand() < 0.6) for (let i = 0; i < 4; i++) things.push({ kind: "coin", x: genX + gap * ((i + 0.5) / 4), y: GROUND - 40 - Math.sin(((i + 0.5) / 4) * Math.PI) * 38 });
    else for (let i = 0; i < 3; i++) things.push({ kind: "coin", x: x + 40 + i * 22, y: GROUND - 22 });
    if (rand() < 0.55 && w > 220) things.push({ kind: "slime", x: x + w * (0.5 + rand() * 0.3), y: GROUND - 10, vx: -30 - rand() * 30 });
    if (rand() < 0.35) {
      const px = x + 40 + rand() * (w - 140),
        pw = 70 + rand() * 50;
      plats.push({ x: px, w: pw });
      things.push({ kind: rand() < 0.25 ? "star" : "coin", x: px + pw / 2, y: GROUND - 92 });
    }
    if (rand() < 0.08) things.push({ kind: "heart", x: x + w / 2, y: GROUND - 60 });
    genX = x + w;
  }
  segs = segs.filter((s) => s.x + s.w > camX - 100);
  plats = plats.filter((s) => s.x + s.w > camX - 100);
  things = things.filter((th) => th.x > camX - 50 && !th.dead);
}

function jump() {
  if (state == "title" || state == "over") return start();
  if (state != "run") return;
  if (P.ground) {
    P.vy = -470;
    P.ground = false;
    P.jumps = 1;
    sfx("jump");
  } else if (P.jumps < 2) {
    P.vy = -420;
    P.jumps = 2;
    sfx("jump-double");
    burst(P.x + 6, P.y + 16, C.dim, 6);
  }
}
function release() {
  if (state == "run" && P.vy < -200) P.vy = -200; // short tap = short hop
}
function start() {
  reset();
  state = "count";
  countT = 0;
  lastTick = -1;
}

function hurt(reason: Name) {
  if (invincible > 0 || hurtT > 0) return;
  hearts--;
  hurtT = 1.2;
  sfx(reason);
  burst(P.x + 6, P.y + 8, C.heart, 10);
  if (hearts <= 0) end(false);
}
function end(win: boolean) {
  state = "over";
  won = win;
  if (coins > best) {
    best = coins;
    try {
      localStorage.setItem("plinkrun-best", String(best));
    } catch {}
  }
  setTimeout(() => sfx(win ? "level-complete" : "game-over"), 120);
}
function burst(x: number, y: number, c: string, n: number) {
  for (let i = 0; i < n; i++) sparks.push({ x, y, vx: (Math.random() - 0.5) * 160, vy: -Math.random() * 160, life: 0.5, c });
}

const groundAt = (x: number) => segs.some((s) => x + P.w > s.x && x < s.x + s.w);
function update(dt: number) {
  t += dt;
  for (const s of sparks) (s.x += s.vx * dt), (s.y += s.vy * dt), (s.vy += 500 * dt), (s.life -= dt);
  while (sparks.length && sparks[0].life <= 0) sparks.shift();
  if (state == "count") {
    countT += dt;
    const n = Math.floor(countT);
    if (n != lastTick) {
      lastTick = n;
      if (n < 3) sfx("countdown");
      else {
        sfx("countdown-go");
        state = "run";
      }
    }
    return;
  }
  if (state != "run") return;
  time -= dt;
  if (time <= 5 && Math.ceil(time) != Math.ceil(time + dt) && time > 0) sfx("countdown", 0.6);
  if (time <= 0) return end(true);
  speed = 150 + (ROUND - time) * 2.4;
  camX += speed * dt;
  P.x = camX + 120;
  invincible = Math.max(0, invincible - dt);
  hurtT = Math.max(0, hurtT - dt);

  // vertical motion and landing (ground + platforms)
  const prevBottom = P.y + P.h;
  P.vy += 1500 * dt;
  P.y += P.vy * dt;
  const wasGround = P.ground;
  P.ground = false;
  if (P.vy >= 0) {
    for (const p of plats)
      if (P.x + P.w > p.x && P.x < p.x + p.w && prevBottom <= GROUND - 70 + 1 && P.y + P.h >= GROUND - 70) {
        P.y = GROUND - 70 - P.h;
        P.ground = true;
      }
    if (!P.ground && groundAt(P.x) && prevBottom <= GROUND + 1 && P.y + P.h >= GROUND) {
      P.y = GROUND - P.h;
      P.ground = true;
    }
  }
  if (P.ground) {
    P.vy = 0;
    P.jumps = 0;
    if (!wasGround && P.air > 0.18) {
      sfx("land", 0.8);
      burst(P.x + 6, P.y + P.h, C.top, 4);
    }
    P.air = 0;
    stepT -= dt;
    if (stepT <= 0) {
      stepT = 0.2;
      if (!muted) play("step-retro", { volume: 0.35 }); // too frequent for a caption
    }
  } else P.air += dt;

  // fell into a pit: lose a heart, pop back onto the next ground
  if (P.y > H + 20) {
    hurtT = 0;
    invincible = 0;
    hurt("hurt");
    if (state != "run") return;
    const next = segs.find((s) => s.x + s.w > P.x + 40)!;
    camX = Math.max(camX, next.x - 120 + 10);
    P.x = camX + 120;
    P.y = GROUND - P.h - 60;
    P.vy = 0;
    hurtT = 1.2;
  }

  for (const th of things) {
    if (th.dead) continue;
    if (th.kind == "slime") {
      th.x += th.vx! * dt;
      th.t = (th.t || 0) + dt;
      if (!groundAt(th.x)) th.vx = -th.vx!;
    }
    const tw = th.kind == "slime" ? 16 : 10,
      th2 = th.kind == "slime" ? 10 : 10;
    if (P.x < th.x + tw / 2 && P.x + P.w > th.x - tw / 2 && P.y < th.y + th2 && P.y + P.h > th.y - (th.kind == "slime" ? 0 : th2)) {
      if (th.kind == "coin") {
        th.dead = true;
        coins++;
        sfx(coins % 10 == 0 ? "coin-double" : "coin", 0.8);
        burst(th.x, th.y, C.coin, 5);
      } else if (th.kind == "star") {
        th.dead = true;
        invincible = 5;
        sfx("powerup");
        burst(th.x, th.y, C.star, 14);
      } else if (th.kind == "heart") {
        th.dead = true;
        if (hearts < 3) hearts++;
        sfx("heart");
        burst(th.x, th.y, C.heart, 8);
      } else if (th.kind == "slime") {
        if (invincible > 0) {
          th.dead = true;
          sfx("hit-heavy", 0.8);
          burst(th.x, th.y, C.slime, 12);
        } else if (P.vy > 0 && P.y + P.h - th.y < 10) {
          th.dead = true;
          P.vy = -360;
          P.jumps = 1;
          sfx("squish");
          burst(th.x, th.y, C.slime, 10);
        } else hurt("hurt");
      }
    }
  }
  generate();
}

// ---------- drawing ----------
const px = (x: number) => Math.round(x - camX);
function draw() {
  g.fillStyle = C.bg;
  g.fillRect(0, 0, W, H);
  // parallax hills made of blocks
  g.fillStyle = C.far;
  for (let i = -1; i < 12; i++) {
    const x = i * 80 - ((camX * 0.3) % 80),
      h = 40 + ((i * 37 + Math.floor((camX * 0.3) / 80) * 37) % 50);
    g.fillRect(Math.round(x), GROUND - h, 80, h);
  }
  for (const s of segs) {
    g.fillStyle = C.ground;
    g.fillRect(px(s.x), GROUND, Math.round(s.w), H - GROUND);
    g.fillStyle = C.top;
    g.fillRect(px(s.x), GROUND, Math.round(s.w), 4);
  }
  for (const p of plats) {
    g.fillStyle = C.top;
    g.fillRect(px(p.x), GROUND - 70, Math.round(p.w), 6);
  }
  for (const th of things) {
    if (th.dead) continue;
    const x = px(th.x),
      y = Math.round(th.y);
    if (th.kind == "coin") {
      const w = Math.abs(Math.sin(t * 5 + th.x)) * 8 + 2;
      g.fillStyle = C.coin;
      g.fillRect(x - w / 2, y - 5, w, 10);
    } else if (th.kind == "slime") {
      const sq = Math.sin((th.t || 0) * 8) * 2;
      g.fillStyle = C.slime;
      g.fillRect(x - 8 - sq / 2, y - 10 + sq, 16 + sq, 10 - sq);
      g.fillStyle = C.bg;
      g.fillRect(x - 4, y - 7 + sq, 2, 2);
      g.fillRect(x + 2, y - 7 + sq, 2, 2);
    } else if (th.kind == "star") {
      g.fillStyle = C.star;
      g.fillRect(x - 2, y - 7, 4, 14);
      g.fillRect(x - 7, y - 2, 14, 4);
    } else {
      g.fillStyle = C.heart;
      g.fillRect(x - 6, y - 4, 5, 5);
      g.fillRect(x + 1, y - 4, 5, 5);
      g.fillRect(x - 4, y + 1, 8, 4);
    }
  }
  // player
  if (!(hurtT > 0 && Math.floor(t * 16) % 2)) {
    g.fillStyle = invincible > 0 && Math.floor(t * 12) % 2 ? C.star : C.ink;
    const stretch = P.ground ? 0 : Math.max(-2, Math.min(2, -P.vy / 200));
    g.fillRect(px(P.x), Math.round(P.y - stretch), P.w, P.h + stretch);
    g.fillStyle = C.plink;
    g.fillRect(px(P.x) + 8, Math.round(P.y - stretch) + 4, 2, 2);
  }
  for (const s of sparks) {
    g.fillStyle = s.c;
    g.fillRect(px(s.x), Math.round(s.y), 2, 2);
  }
  // HUD
  g.fillStyle = C.ink;
  g.font = "16px ui-monospace, Menlo, monospace";
  g.textBaseline = "top";
  g.fillText(`coins ${coins}`, 14, 12);
  g.textAlign = "right";
  g.fillText(`${Math.max(0, Math.ceil(time))} s`, W - 14, 12);
  g.textAlign = "left";
  for (let i = 0; i < 3; i++) {
    g.fillStyle = i < hearts ? C.heart : C.ground;
    g.fillRect(W / 2 - 30 + i * 22, 14, 14, 12);
  }
  // captions: the sounds that just played
  g.font = "14px ui-monospace, Menlo, monospace";
  let cx = 14;
  for (const c of captions) {
    const age = t - c.t;
    if (age > 1.6) continue;
    const label = "♪ " + c.name;
    const w = g.measureText(label).width + 14;
    g.globalAlpha = Math.max(0, 1 - Math.max(0, age - 1) / 0.6);
    g.fillStyle = C.plink;
    g.fillRect(cx, H - 30, w, 20);
    g.fillStyle = C.bg;
    g.fillText(label, cx + 7, H - 27);
    g.globalAlpha = 1;
    cx += w + 6;
  }
  g.textAlign = "center";
  if (state == "title" || state == "over") {
    g.fillStyle = "rgba(22,19,15,.78)";
    g.fillRect(0, 0, W, H);
    g.fillStyle = C.ink;
    g.font = "28px ui-monospace, Menlo, monospace";
    g.fillText(state == "title" ? "plink run" : won ? `${coins} coins!` : "game over", W / 2, 110);
    g.font = "15px ui-monospace, Menlo, monospace";
    g.fillStyle = C.dim;
    g.fillText(state == "title" ? "30 seconds. jump the gaps, stomp the slimes, grab the coins." : `best: ${best} coins`, W / 2, 156);
    g.fillStyle = C.plink;
    g.fillText(state == "title" ? "press space or tap to start" : "space or tap to play again", W / 2, 200);
    g.fillStyle = C.dim;
    g.fillText("sound on", W / 2, 240);
  } else if (state == "count") {
    g.fillStyle = C.ink;
    g.font = "48px ui-monospace, Menlo, monospace";
    g.fillText(String(3 - Math.floor(countT)), W / 2, 120);
  }
  g.textAlign = "left";
}

function frame(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000 || 0);
  last = now;
  update(dt);
  draw();
  requestAnimationFrame(frame);
}

addEventListener("keydown", (e) => {
  if (e.repeat) return;
  if (e.code == "Space" || e.code == "ArrowUp" || e.code == "KeyW") {
    e.preventDefault();
    jump();
  } else if (e.code == "KeyM") {
    muted = !muted;
    volume(muted ? 0 : 1);
  }
});
addEventListener("keyup", (e) => {
  if (e.code == "Space" || e.code == "ArrowUp" || e.code == "KeyW") release();
});
cv.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  jump();
});
cv.addEventListener("pointerup", release);
addEventListener("blur", () => {
  if (state == "run") last = performance.now();
});
reset();
requestAnimationFrame(frame);
// Hooks for the recorder (scripts/record.ts) and the smoke test.
(window as any).plinkrun = { start, jump, release, state: () => state, coins: () => coins };
