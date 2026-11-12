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
// The URL carries the whole state, so a tweak can be shared: #coin?p=3&l=1.2&t=-0.3&s=0.2&c=8&v=1234
const KEYS: [keyof Knobs, string][] = [["pitch", "p"], ["length", "l"], ["tone", "t"], ["space", "s"], ["crush", "c"]];
function readHash() {
  const [name, query = ""] = decodeURIComponent(location.hash.slice(1)).split("?"),
    q = new URLSearchParams(query),
    k: Knobs = { ...NEUTRAL };
  for (const [key, short] of KEYS) {
    const v = Number(q.get(short));
    if (q.has(short) && Number.isFinite(v)) k[key] = v;
  }
  k.pitch = Math.max(-12, Math.min(12, Math.round(k.pitch)));
  k.length = Math.max(0.5, Math.min(2, k.length));
  k.tone = Math.max(-1, Math.min(1, k.tone));
  k.space = Math.max(0, Math.min(0.6, k.space));
  k.crush = Math.max(3, Math.min(16, Math.round(k.crush)));
  const v = Math.max(0, Math.floor(Number(q.get("v")) || 0));
  return { it: byName.get(name), knobs: k, seed: v };
}
const stateHash = () => {
  const q = KEYS.filter(([key]) => knobs[key] != NEUTRAL[key]).map(([key, short]) => `${short}=${+knobs[key].toFixed(2)}`);
  if (seed) q.push(`v=${seed}`);
  return "#" + current.name + (q.length ? "?" + q.join("&") : "");
};
const initial = readHash();
let current: Item = initial.it || byName.get("coin")!;
let knobs: Knobs = initial.it ? initial.knobs : { ...NEUTRAL };
let seed = initial.it ? initial.seed : 0;
const shared = !!initial.it && (seed > 0 || !isNeutral(knobs));
let filter: { cat: Cat | "all"; q: string } = { cat: "all", q: "" };
let hoverPlay = matchMedia("(hover: hover) and (pointer: fine)").matches;
let tab: "name" | "shake" | "json" = "name";
const sheetMQ = matchMedia("(max-width: 900px)");

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
// Everything on the page that shows this sound: its grid tile and, for the favourites, its pad.
const viewsOf = (name: string) => document.querySelectorAll<HTMLElement>(`.tile[data-name="${name}"], .pad[data-pad="${name}"]`);
function playItem(it: Item, take = it == current ? seed : undefined, sound = it == current ? edited() : get(it.name)) {
  const ctx = context();
  if (ctx.state != "running") {
    ctx.resume();
    // Hover sounds before the first click would otherwise all fire at once when audio unlocks.
    const ua = (navigator as any).userActivation;
    if (ua && !ua.isActive) return;
  }
  const v = take ?? Math.floor(Math.random() * 4),
    b = buffer(sound, v),
    src = ctx.createBufferSource();
  src.buffer = b;
  src.connect(ctx.destination);
  src.start();
  playing.set(it.name, { start: ctx.currentTime, dur: b.duration });
  for (const el of viewsOf(it.name)) {
    // restart the press flash even when the same sound is retriggered
    el.classList.remove("playing");
    void el.offsetWidth;
    el.classList.add("playing");
  }
  if (it == current) $(".panel").classList.add("playing");
  if (demo) caption(it.name);
  if (!raf) raf = requestAnimationFrame(tick);
}

// ?demo: big caption with the sound's name, for screen recordings that autoplay muted (X, README GIF).
const demo = new URLSearchParams(location.search).has("demo");
let capTimer = 0;
function caption(name: string) {
  const el = $("#demo-cap");
  el.textContent = "♪ " + name;
  el.classList.add("on");
  clearTimeout(capTimer);
  capTimer = window.setTimeout(() => el.classList.remove("on"), 900);
}
function tick() {
  const now = context().currentTime;
  for (const [name, p] of playing) {
    const k = Math.min((now - p.start) / p.dur, 1),
      views = viewsOf(name);
    for (const el of views) drawView(el, k < 1 ? k : -1);
    if (name == current.name) drawWave($<HTMLCanvasElement>("#wave"), waveOf(edited(), seed, 180), k < 1 ? k : -1);
    if (k >= 1) {
      playing.delete(name);
      for (const el of views) el.classList.remove("playing");
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
let palette: { wave: string; hot: string; dim: string } | undefined;
const css = (v: string) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const colors = () => (palette ||= { wave: css("--wave"), hot: css("--plink"), dim: css("--wave-dim") });
/** Bars of the envelope; while playing, the played part is orange and a 1 px playhead leads it. */
function drawWave(c: HTMLCanvasElement, env: Float32Array, progress = -1) {
  const dpr = Math.min(devicePixelRatio || 1, 2),
    w = c.clientWidth,
    h = c.clientHeight;
  if (!w) return;
  if (c.width != Math.round(w * dpr)) (c.width = Math.round(w * dpr)), (c.height = Math.round(h * dpr));
  const g = c.getContext("2d")!,
    { wave, hot, dim } = colors(),
    bw = (w / env.length) * dpr;
  g.clearRect(0, 0, c.width, c.height);
  for (let i = 0; i < env.length; i++) {
    const v = Math.max(env[i], 0.03),
      bh = Math.max(dpr, Math.round(v * c.height * 0.9));
    g.fillStyle = progress < 0 ? wave : i / env.length <= progress ? hot : dim;
    g.fillRect(Math.round(i * bw), Math.round((c.height - bh) / 2), Math.max(1, Math.round(bw - dpr)), bh);
  }
  if (progress >= 0) {
    g.fillStyle = hot;
    g.fillRect(Math.min(c.width - dpr * 2, Math.round(progress * c.width)), 0, Math.round(dpr * 2), c.height);
  }
}
// Tiles use the envelope baked into the catalogue: no audio is rendered to draw the grid.
const tileEnv = new Map(items.map((s) => [s.name, Float32Array.from(s.env)]));
const drawView = (el: HTMLElement, k = -1) => drawWave(el.querySelector("canvas")!, tileEnv.get(el.dataset.name || el.dataset.pad!)!, k);
const redrawAll = () => {
  palette = undefined;
  renderPanel();
  document.querySelectorAll<HTMLElement>(".tile:not([hidden]), .pad").forEach((t) => drawView(t));
};

// ---------- grid ----------
const grid = $("#grid");
function buildGrid() {
  const frag = document.createDocumentFragment();
  for (const it of items) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "tile";
    b.dataset.name = it.name;
    b.dataset.cat = it.cat;
    b.title = it.desc;
    b.innerHTML = `<canvas aria-hidden="true"></canvas><span class="name">${it.name}</span><span class="cat"><i></i>${it.cat}</span>`;
    frag.append(b);
  }
  grid.append(frag);
  const io = new IntersectionObserver((es) => {
    for (const e of es) if (e.isIntersecting) drawView(e.target as HTMLElement);
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
  $("#empty").hidden = n > 0;
  $("#empty-q").textContent = filter.q || catalog.categories[filter.cat as Cat]?.title.toLowerCase() || "";
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
  renderPanel();
}
function renderPanel() {
  const it = current,
    p = $(".panel");
  if (location.hash != stateHash()) history.replaceState(null, "", stateHash());
  p.dataset.cat = it.cat;
  $("#p-name").textContent = it.name;
  $("#p-cat").innerHTML = `<i></i>${catalog.categories[it.cat as Cat].title}`;
  $("#p-desc").textContent = it.desc;
  $("#p-meter").innerHTML = [`${fmt(it.m.lufsMax)} LUFS`, `peak ${fmt(it.m.truePeak)} dBTP`, `${fmt(it.m.duration, 2)} s`, `${(it.m.centroid / 1000).toFixed(1)} kHz`].map((x) => `<span>${x}</span>`).join("");
  for (const b of p.querySelectorAll<HTMLButtonElement>("[data-take]")) b.setAttribute("aria-pressed", String(+b.dataset.take! == seed));
  $("#p-seed").textContent = seed > 3 ? `take #${seed}` : `take ${seed + 1} of 4`;
  for (const inp of p.querySelectorAll<HTMLInputElement>("input[type=range]")) {
    const k = inp.name as keyof Knobs;
    inp.value = String(knobs[k]);
    inp.style.setProperty("--fill", `${((knobs[k] - +inp.min) / (+inp.max - +inp.min)) * 100}%`);
    inp.classList.toggle("moved", knobs[k] != NEUTRAL[k]);
    $(`#v-${k}`).textContent = label(k, knobs[k]);
  }
  $("#p-reset").toggleAttribute("disabled", isNeutral(knobs));
  for (const b of p.querySelectorAll<HTMLButtonElement>("[data-tab]")) b.setAttribute("aria-selected", String(b.dataset.tab == tab));
  $("#p-code").innerHTML = highlight(code());
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
// Just enough colour to read the snippet: keywords, strings, numbers. The text content stays the exact code.
const escHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const highlight = (src: string) =>
  src.replace(/("[^"\n]*")|\b(import|from|const)\b|(\b-?\d+(?:\.\d+)?(?:e-?\d+)?\b)|([&<])/g, (m, str, kw, num) =>
    str ? `<span class="s">${escHtml(str)}</span>` : kw ? `<span class="k">${kw}</span>` : num ? `<span class="n">${num}</span>` : escHtml(m),
  );

// ---------- copy / share / download ----------
const status = (msg: string) => {
  const s = $("#sr-status");
  s.textContent = "";
  requestAnimationFrame(() => (s.textContent = msg));
};
async function copy(text: string, btn: HTMLElement, done = "copied") {
  try {
    await navigator.clipboard.writeText(text);
    flash(btn, done, true);
    status(done[0].toUpperCase() + done.slice(1));
  } catch {
    flash(btn, "press ctrl+c", false);
  }
}
const flashTimers = new WeakMap<HTMLElement, number>();
function flash(btn: HTMLElement, msg: string, ok: boolean) {
  const span = btn.querySelector("span") || btn,
    old = btn.dataset.label || span.textContent!;
  btn.dataset.label = old;
  span.textContent = msg;
  btn.classList.toggle("done", ok);
  clearTimeout(flashTimers.get(btn));
  flashTimers.set(
    btn,
    window.setTimeout(() => {
      span.textContent = old;
      btn.classList.remove("done");
    }, 1400),
  );
}
function download() {
  const sr = 48000,
    data = wav(render(edited(), { sampleRate: sr, seed }), sr),
    a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([data as Uint8Array<ArrayBuffer>], { type: "audio/wav" }));
  a.download = `${current.name}${seed ? "-" + seed : ""}${isNeutral(knobs) ? "" : "-edit"}.wav`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  status(`Downloading ${a.download}`);
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

// ---------- phone: the panel is a bottom sheet ----------
const panel = $(".panel"),
  body = $("#p-body"),
  scrim = $(".scrim"),
  more = $("#p-more");
function setSheet(open: boolean) {
  const sheet = sheetMQ.matches;
  panel.classList.toggle("open", sheet && open);
  more.setAttribute("aria-expanded", String(sheet && open));
  body.inert = sheet && !open;
  scrim.hidden = !(sheet && open);
  document.documentElement.classList.toggle("sheet-open", sheet && open);
  panel.style.transform = "";
}
function sheetGestures() {
  // Drag the header up or down; a quick flick is enough, no distance threshold needed.
  const head = $(".p-head");
  let y0 = 0,
    t0 = 0,
    dy = 0,
    drag = false;
  head.addEventListener("pointerdown", (e) => {
    if (!sheetMQ.matches || (e.target as HTMLElement).closest("button:not(.more)") || drag) return;
    drag = true;
    y0 = e.clientY;
    t0 = performance.now();
    dy = 0;
    head.setPointerCapture(e.pointerId);
    panel.classList.add("dragging");
  });
  head.addEventListener("pointermove", (e) => {
    if (!drag) return;
    dy = e.clientY - y0;
    const open = panel.classList.contains("open"),
      // past the natural end of travel the sheet follows with friction
      d = open ? (dy < 0 ? dy * 0.2 : dy) : dy > 0 ? dy * 0.2 : dy;
    panel.style.transform = open ? `translateY(${d}px)` : `translateY(calc(100% - var(--peek) + ${d}px))`;
  });
  const end = () => {
    if (!drag) return;
    drag = false;
    panel.classList.remove("dragging");
    const v = dy / Math.max(1, performance.now() - t0),
      open = panel.classList.contains("open");
    if (Math.abs(dy) < 6) return void (panel.style.transform = ""); // a tap: the click handler decides
    head.dataset.dragged = "1";
    if (open && (dy > 80 || v > 0.4)) setSheet(false);
    else if (!open && (dy < -60 || v < -0.4)) setSheet(true);
    else panel.style.transform = "";
  };
  head.addEventListener("pointerup", end);
  head.addEventListener("pointercancel", end);
  head.addEventListener("click", (e) => {
    if (head.dataset.dragged) {
      // the drag already opened or closed the sheet; this click is its tail end
      delete head.dataset.dragged;
      return e.stopPropagation();
    }
    if (!sheetMQ.matches || (e.target as HTMLElement).closest("button")) return;
    setSheet(!panel.classList.contains("open"));
  });
  scrim.addEventListener("click", () => setSheet(false));
  sheetMQ.addEventListener("change", () => setSheet(false));
}

// ---------- wire up ----------
function init() {
  if (demo) {
    hoverPlay = false; // recordings click; hover would fire on tiles scrolling under the pointer
    document.documentElement.classList.add("demo");
    const cap = document.createElement("div");
    cap.id = "demo-cap";
    cap.setAttribute("aria-hidden", "true");
    document.body.append(cap);
  }
  $("#total").textContent = String(items.length);
  $("#cats-n").textContent = String(Object.keys(catalog.categories).length);
  // The chips are written into the HTML at build time (vite.config.ts) so the layout does not shift.
  const chips = $("#chips");
  const setCat = (cat: Cat | "all") => {
    filter.cat = cat;
    chips.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.cat == cat)));
    applyFilter();
  };
  chips.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>("button");
    if (b) setCat(b.dataset.cat as Cat | "all");
  });
  const search = $<HTMLInputElement>("#search");
  const setQuery = (q: string) => {
    search.value = q;
    filter.q = q.trim();
    applyFilter();
  };
  search.addEventListener("input", () => ((filter.q = search.value.trim()), applyFilter()));
  $("#empty").addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>("button");
    if (!b) return;
    if (b.dataset.try) setCat("all"), setQuery(b.dataset.try);
    else setCat("all"), setQuery("");
    const first = grid.querySelector<HTMLElement>(".tile:not([hidden])");
    first?.focus();
  });

  buildGrid();
  applyFilter();

  // favourites row
  const pads = $("#pads");
  pads.querySelectorAll<HTMLElement>(".pad").forEach((p) => drawView(p));
  pads.addEventListener("click", (e) => {
    const p = (e.target as HTMLElement).closest<HTMLElement>(".pad");
    if (!p) return;
    greeted = true;
    const it = byName.get(p.dataset.pad!)!;
    select(it);
    playItem(it);
  });

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
    else if (b.id == "p-link") copy(location.href.split("#")[0] + stateHash(), b, isNeutral(knobs) && !seed ? "link copied" : "link copied, it plays your tweak");
    else if (b.id == "p-more") setSheet(!panel.classList.contains("open"));
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
  sheetGestures();
  setSheet(false);
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
      if (greeted || (e.target as HTMLElement).closest(".tile, .pad, .panel, input, a, #tour, .shared")) return;
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
      setQuery("");
      search.blur();
    } else if (e.key == "Escape" && panel.classList.contains("open")) {
      setSheet(false);
      more.focus();
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
    if (location.hash == stateHash()) return;
    const h = readHash();
    if (!h.it) return;
    if (h.it != current) select(h.it, { scroll: true });
    knobs = h.knobs;
    seed = h.seed;
    renderPanel();
  });
  let resizeRaf = 0;
  addEventListener("resize", () => {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(redrawAll);
  });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", redrawAll);
  $("#tour").addEventListener("click", (e) => tour(e.currentTarget as HTMLElement));
  select(current, { scroll: !!location.hash });
  if (shared) {
    // Opened from a shared tweak: say so, and let one click play it.
    const bar = $("#shared");
    bar.querySelector("b")!.textContent = current.name;
    bar.hidden = false;
    bar.querySelector("button")!.addEventListener("click", () => {
      playItem(current, seed);
      bar.hidden = true;
    });
  }
}
// The tour: a ten-second run through the library, one sound after another.
const TOUR = ["coin", "jump", "land", "laser", "hit", "explosion", "powerup", "sparkle", "door-heavy", "level-up"];
let touring = 0;
function tour(btn: HTMLElement) {
  clearTimeout(touring);
  if (btn.getAttribute("aria-pressed") == "true") return btn.setAttribute("aria-pressed", "false");
  btn.setAttribute("aria-pressed", "true");
  const step = (i: number) => {
    if (i >= TOUR.length || btn.getAttribute("aria-pressed") != "true") return btn.setAttribute("aria-pressed", "false");
    const it = byName.get(TOUR[i]);
    if (it) {
      select(it, { scroll: false });
      playItem(it, 0);
    }
    touring = window.setTimeout(() => step(i + 1), TOUR[i] == "explosion" || TOUR[i] == "door-heavy" ? 1300 : 750);
  };
  step(0);
}
function roll() {
  seed = 4 + Math.floor(Math.random() * 9996);
  renderPanel();
  playItem(current, seed);
}

init();
// Hooks for scripts/record.ts.
(window as any).plinkfx = { play: (name: string) => (select(byName.get(name)!), playItem(byName.get(name)!, 0)) };
