import { buffer, context, get, render, wav, type Sound } from "../src/index.ts";
import catalog from "../library/catalog.gen.json";
import { edit, isNeutral, NEUTRAL, type Knobs } from "./edit.ts";
import "./style.css";

type Item = (typeof catalog.sounds)[number];
type Cat = keyof typeof catalog.categories;
const $ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) => el.querySelector(s) as T;
const items = catalog.sounds as Item[];
const byName = new Map(items.map((s) => [s.name, s]));

// ---------- state ----------
let current: Item = byName.get(location.hash.slice(1)) || byName.get("coin")!;
let knobs: Knobs = { ...NEUTRAL };
let seed = 0;
let filter: { cat: Cat | "all"; q: string } = { cat: "all", q: "" };
let hoverPlay = matchMedia("(hover: hover) and (pointer: fine)").matches;
let tab: "name" | "shake" | "json" = "name";

const edited = (): Sound => (isNeutral(knobs) ? get(current.name) : editCache());
let lastEdit: { key: string; s: Sound } | undefined;
const editCache = () => {
  const key = current.name + JSON.stringify(knobs);
  if (lastEdit?.key != key) lastEdit = { key, s: edit(get(current.name), knobs) };
  return lastEdit.s;
};

// ---------- audio + playheads ----------
const playing = new Map<string, { start: number; dur: number }>();
let raf = 0;
function playItem(it: Item, take = it == current ? seed : undefined, sound = it == current ? edited() : get(it.name)) {
  const ctx = context();
  if (ctx.state != "running") ctx.resume();
  const v = take ?? Math.floor(Math.random() * 4),
    b = buffer(sound, v),
    src = ctx.createBufferSource();
  src.buffer = b;
  src.connect(ctx.destination);
  src.start();
  playing.set(it.name, { start: ctx.currentTime, dur: b.duration });
  document.querySelector(`[data-name="${it.name}"]`)?.classList.add("playing");
  if (it == current) $(".panel").classList.add("playing");
  if (!raf) raf = requestAnimationFrame(tick);
}
function tick() {
  const now = context().currentTime;
  for (const [name, p] of playing) {
    const k = Math.min((now - p.start) / p.dur, 1),
      tile = document.querySelector<HTMLElement>(`[data-name="${name}"]`);
    if (tile) drawTile(tile, k);
    if (name == current.name) drawWave($<HTMLCanvasElement>("#wave"), waveOf(edited(), seed, 180), k);
    if (k >= 1) {
      playing.delete(name);
      tile?.classList.remove("playing");
      if (name == current.name) $(".panel").classList.remove("playing");
    }
  }
  raf = playing.size ? requestAnimationFrame(tick) : 0;
}

// ---------- waveforms ----------
const waves = new WeakMap<Sound, Map<string, Float32Array>>();
function waveOf(s: Sound, take: number, bars: number) {
  const m = waves.get(s) || new Map();
  waves.set(s, m);
  const key = take + ":" + bars;
  if (!m.has(key)) {
    const x = render(s, { sampleRate: 11025, seed: take }),
      out = new Float32Array(bars),
      step = Math.max(1, Math.floor(x.length / bars));
    let top = 1e-6;
    for (let i = 0; i < bars; i++) {
      let pk = 0;
      for (let j = i * step; j < Math.min((i + 1) * step, x.length); j++) pk = Math.max(pk, Math.abs(x[j]));
      out[i] = pk;
      top = Math.max(top, pk);
    }
    m.set(key, out.map((v) => Math.sqrt(v / top)));
  }
  return m.get(key)!;
}
const css = (v: string) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
function drawWave(c: HTMLCanvasElement, env: Float32Array, progress = -1) {
  const dpr = Math.min(devicePixelRatio || 1, 2),
    w = c.clientWidth,
    h = c.clientHeight;
  if (!w) return;
  if (c.width != Math.round(w * dpr)) (c.width = Math.round(w * dpr)), (c.height = Math.round(h * dpr));
  const g = c.getContext("2d")!,
    ink = css("--ink"),
    hot = css("--plink"),
    dim = css("--wave-dim"),
    bw = (w / env.length) * dpr;
  g.clearRect(0, 0, c.width, c.height);
  for (let i = 0; i < env.length; i++) {
    const v = Math.max(env[i], 0.03),
      bh = Math.max(dpr, Math.round(v * c.height * 0.9));
    g.fillStyle = progress < 0 ? ink : i / env.length <= progress ? hot : dim;
    g.fillRect(Math.round(i * bw), Math.round((c.height - bh) / 2), Math.max(1, Math.round(bw - dpr)), bh);
  }
}
// Tiles use the envelope baked into the catalogue: no audio is rendered to draw the grid.
const tileEnv = new Map(items.map((s) => [s.name, Float32Array.from(s.env)]));
const drawTile = (tile: HTMLElement, k = -1) => drawWave(tile.querySelector("canvas")!, tileEnv.get(tile.dataset.name!)!, k);

// ---------- grid ----------
const grid = $("#grid");
function buildGrid() {
  const frag = document.createDocumentFragment();
  for (const it of items) {
    const b = document.createElement("button");
    b.className = "tile";
    b.dataset.name = it.name;
    b.dataset.cat = it.cat;
    b.title = it.desc;
    b.innerHTML = `<canvas aria-hidden="true"></canvas><span class="name">${it.name}</span><span class="cat"><i></i>${it.cat}</span>`;
    frag.append(b);
  }
  grid.append(frag);
  const io = new IntersectionObserver((es) => {
    for (const e of es) if (e.isIntersecting) drawTile(e.target as HTMLElement);
  }, { rootMargin: "200px" });
  grid.querySelectorAll(".tile").forEach((t) => io.observe(t));
}
function applyFilter() {
  const q = filter.q.toLowerCase();
  let n = 0;
  grid.querySelectorAll<HTMLElement>(".tile").forEach((t) => {
    const it = byName.get(t.dataset.name!)!,
      show = (filter.cat == "all" || it.cat == filter.cat) && (!q || it.name.includes(q) || it.desc.toLowerCase().includes(q) || it.cat.includes(q));
    t.hidden = !show;
    if (show) n++;
  });
  $("#count").textContent = `${n} sound${n == 1 ? "" : "s"}`;
}

// ---------- panel ----------
const fmt = (x: number, d = 1) => (Number.isFinite(x) ? x.toFixed(d).replace("-", "−") : "−∞");
function select(it: Item, opts: { scroll?: boolean } = {}) {
  if (it != current) {
    current = it;
    knobs = { ...NEUTRAL };
    seed = 0;
  }
  grid.querySelectorAll(".tile[aria-current]").forEach((t) => t.removeAttribute("aria-current"));
  const tile = grid.querySelector<HTMLElement>(`[data-name="${it.name}"]`);
  tile?.setAttribute("aria-current", "true");
  if (opts.scroll) tile?.scrollIntoView({ block: "center" });
  history.replaceState(null, "", "#" + it.name);
  renderPanel();
}
function renderPanel() {
  const it = current,
    p = $(".panel");
  p.dataset.cat = it.cat;
  $("#p-name").textContent = it.name;
  $("#p-cat").innerHTML = `<i></i>${catalog.categories[it.cat as Cat].title}`;
  $("#p-desc").textContent = it.desc;
  $("#p-meter").textContent = `${fmt(it.m.lufsMax)} LUFS · peak ${fmt(it.m.truePeak)} dBTP · ${fmt(it.m.duration, 2)} s · ${(it.m.centroid / 1000).toFixed(1)} kHz`;
  for (const b of p.querySelectorAll<HTMLButtonElement>("[data-take]")) b.setAttribute("aria-pressed", String(+b.dataset.take! == seed));
  $("#p-seed").textContent = seed > 3 ? `take #${seed}` : `take ${seed + 1} of 4`;
  for (const inp of p.querySelectorAll<HTMLInputElement>("input[type=range]")) {
    const k = inp.name as keyof Knobs;
    inp.value = String(knobs[k]);
    $(`#v-${k}`).textContent = label(k, knobs[k]);
  }
  $("#p-reset").toggleAttribute("disabled", isNeutral(knobs));
  for (const b of p.querySelectorAll<HTMLButtonElement>("[data-tab]")) b.setAttribute("aria-selected", String(b.dataset.tab == tab));
  $("#p-code").textContent = code();
  $("#p-edited").hidden = isNeutral(knobs);
  drawWave($<HTMLCanvasElement>("#wave"), waveOf(edited(), seed, 180));
}
const label = (k: keyof Knobs, v: number) =>
  k == "pitch" ? `${v > 0 ? "+" : ""}${v} st` : k == "length" ? `${v.toFixed(2)}×` : k == "tone" ? (v == 0 ? "0" : `${v > 0 ? "+" : ""}${v.toFixed(2)}`) : k == "space" ? (v == 0 ? "off" : `${Math.round(v * 100)}%`) : v >= 16 ? "off" : `${v} bit`;
function code() {
  const id = current.id,
    opt = seed ? `, { variant: ${seed} }` : "";
  // An edited sound, or the params tab: show the full parameter object, ready to paste.
  if (!isNeutral(knobs) || tab == "json") return `import { play } from "plinkfx/core";\n\nconst ${id} = ${pretty(edited())};\n\nplay(${id}${opt});`;
  if (tab == "shake") return `import { play } from "plinkfx/core";\nimport { ${id} } from "plinkfx/sounds";\n\nplay(${id}${opt});`;
  return `import { play } from "plinkfx";\n\nplay("${current.name}"${opt});`;
}
// One layer per line: readable and easy to diff.
const pretty = (s: Sound) => {
  const { layers, ...rest } = s,
    head = Object.entries(rest).map(([k, v]) => `  ${k}: ${JSON.stringify(v)},`);
  return `{\n${head.join("\n")}${head.length ? "\n" : ""}  layers: [\n${layers.map((l) => "    " + JSON.stringify(l).replace(/"(\w+)":/g, "$1: ").replace(/,(?=\w+:)/g, ", ") + ",").join("\n")}\n  ],\n}`;
};

async function copy(text: string, btn: HTMLElement) {
  try {
    await navigator.clipboard.writeText(text);
    flash(btn, "copied");
  } catch {
    flash(btn, "press ctrl+c");
  }
}
function flash(btn: HTMLElement, msg: string) {
  const old = btn.dataset.label || btn.textContent!;
  btn.dataset.label = old;
  btn.textContent = msg;
  setTimeout(() => (btn.textContent = old), 1200);
}
function download() {
  const sr = 48000,
    data = wav(render(edited(), { sampleRate: sr, seed }), sr),
    a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([data as Uint8Array<ArrayBuffer>], { type: "audio/wav" }));
  a.download = `${current.name}${seed ? "-" + seed : ""}${isNeutral(knobs) ? "" : "-edit"}.wav`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// ---------- signature: plink on the first tap that is not a sound ----------
let greeted = false;
function plink() {
  const brand = $(".brand");
  brand.classList.remove("ping");
  void brand.offsetWidth;
  brand.classList.add("ping");
  const ctx = context();
  if (ctx.state != "running") ctx.resume();
  const src = ctx.createBufferSource();
  src.buffer = buffer(get("plink"), 0);
  src.connect(ctx.destination);
  src.start();
}

// ---------- wire up ----------
function init() {
  $("#total").textContent = String(items.length);
  $("#cats-n").textContent = String(Object.keys(catalog.categories).length);
  const chips = $("#chips");
  chips.innerHTML =
    `<button data-cat="all" aria-pressed="true">all <b>${items.length}</b></button>` +
    Object.entries(catalog.categories)
      .map(([k, c]) => `<button data-cat="${k}" aria-pressed="false"><i></i>${c.title.toLowerCase()} <b>${items.filter((s) => s.cat == k).length}</b></button>`)
      .join("");
  chips.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>("button");
    if (!b) return;
    filter.cat = b.dataset.cat as Cat | "all";
    chips.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x == b)));
    applyFilter();
  });
  const search = $<HTMLInputElement>("#search");
  search.addEventListener("input", () => ((filter.q = search.value.trim()), applyFilter()));

  buildGrid();
  applyFilter();

  let hoverTimer = 0;
  grid.addEventListener("pointerover", (e) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>(".tile");
    if (!t || e.pointerType != "mouse" || !hoverPlay) return;
    clearTimeout(hoverTimer);
    hoverTimer = window.setTimeout(() => {
      const it = byName.get(t.dataset.name!)!;
      select(it);
      playItem(it, 0);
    }, 110);
  });
  grid.addEventListener("pointerout", () => clearTimeout(hoverTimer));
  grid.addEventListener("click", (e) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>(".tile");
    if (!t) return;
    greeted = true;
    const it = byName.get(t.dataset.name!)!;
    select(it);
    playItem(it);
  });
  grid.addEventListener("keydown", (e) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>(".tile");
    if (!t || !["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const vis = [...grid.querySelectorAll<HTMLElement>(".tile:not([hidden])")],
      i = vis.indexOf(t),
      cols = Math.max(1, vis.filter((x) => x.offsetTop == vis[0].offsetTop).length),
      j = { ArrowRight: i + 1, ArrowLeft: i - 1, ArrowDown: i + cols, ArrowUp: i - cols, Home: 0, End: vis.length - 1 }[e.key]!;
    const next = vis[Math.max(0, Math.min(vis.length - 1, j))];
    next.focus();
    const it = byName.get(next.dataset.name!)!;
    select(it);
    playItem(it, 0);
  });

  const panel = $(".panel");
  panel.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>("button");
    if (!b) return;
    if (b.dataset.take) {
      seed = +b.dataset.take;
      renderPanel();
      playItem(current, seed);
    } else if (b.dataset.tab) {
      tab = b.dataset.tab as typeof tab;
      renderPanel();
    } else if (b.id == "p-play") playItem(current, seed);
    else if (b.id == "p-roll") roll();
    else if (b.id == "p-reset") {
      knobs = { ...NEUTRAL };
      renderPanel();
      playItem(current, seed);
    } else if (b.id == "p-copy") copy($("#p-code").textContent!, b);
    else if (b.id == "p-wav") download();
    else if (b.id == "p-more") panel.classList.toggle("open");
  });
  let knobTimer = 0;
  panel.addEventListener("input", (e) => {
    const inp = e.target as HTMLInputElement;
    if (inp.type != "range") return;
    knobs = { ...knobs, [inp.name]: Number(inp.value) };
    renderPanel();
    clearTimeout(knobTimer);
    knobTimer = window.setTimeout(() => playItem(current, seed), 140);
  });
  const hp = $<HTMLInputElement>("#hoverplay");
  hp.checked = hoverPlay;
  hp.addEventListener("change", () => (hoverPlay = hp.checked));
  $("#install-copy").addEventListener("click", (e) => copy("npm i plinkfx", e.currentTarget as HTMLElement));
  $(".brand").addEventListener("click", (e) => {
    e.preventDefault();
    greeted = true;
    plink();
  });
  addEventListener(
    "pointerdown",
    (e) => {
      if (greeted || (e.target as HTMLElement).closest(".tile, .panel, input, a")) return;
      greeted = true;
      plink();
    },
    { passive: true },
  );
  addEventListener("keydown", (e) => {
    const typing = (e.target as HTMLElement).matches("input[type=search], textarea");
    if (e.key == "/" && !typing) {
      e.preventDefault();
      search.focus();
    } else if (e.key == "Escape" && typing) {
      search.value = "";
      filter.q = "";
      applyFilter();
      search.blur();
    } else if (!typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
      if (e.key == "r") roll();
      else if ("1234".includes(e.key) && e.key.length == 1) {
        seed = +e.key - 1;
        renderPanel();
        playItem(current, seed);
      } else if (e.key == "c") copy($("#p-code").textContent!, $("#p-copy"));
      else if (e.key == "d") download();
      else if (e.key == "p") playItem(current, seed);
    }
  });
  addEventListener("hashchange", () => {
    const it = byName.get(location.hash.slice(1));
    if (it && it != current) select(it, { scroll: true });
  });
  addEventListener("resize", () => {
    renderPanel();
    grid.querySelectorAll<HTMLElement>(".tile:not([hidden])").forEach((t) => drawTile(t));
  });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    renderPanel();
    grid.querySelectorAll<HTMLElement>(".tile:not([hidden])").forEach((t) => drawTile(t));
  });
  select(current, { scroll: !!location.hash });
}
function roll() {
  seed = 4 + Math.floor(Math.random() * 9996);
  renderPanel();
  playItem(current, seed);
}

init();
