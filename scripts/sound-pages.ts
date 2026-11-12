/**
 * Build-time sharing pages for the gallery (wired in vite.config.ts):
 *   s/<name>/index.html  title, description, canonical and Open Graph tags for one sound, then a redirect into the gallery
 *   s/<name>/og.png      its 1200x630 card (scripts/og.ts)
 *   sitemap.xml, robots.txt
 * A shared link /s/coin/?p=3&v=42 shows the coin card in chats and opens the gallery at #coin?p=3&v=42.
 */
import { ogCard } from "./og.ts";

export const SITE = "https://maximilianfeix.github.io/plinkfx/";

interface Catalog {
  categories: Record<string, { title: string }>;
  sounds: { name: string; cat: string; desc: string; env: number[] }[];
}
export interface OutFile {
  fileName: string;
  source: string | Uint8Array;
}

const attr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function soundPage(s: Catalog["sounds"][number], catTitle: string) {
  const what = s.desc.replace(/\.$/, ""),
    url = `${SITE}s/${s.name}/`,
    title = `${s.name} · free CC0 game sound effect · plinkfx`,
    desc = `${what}. A free CC0 game sound effect (${catTitle.toLowerCase()}), made from code: play it, tweak it, copy one line or download the WAV.`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${attr(title)}</title>
<meta name="description" content="${attr(desc)}">
<link rel="canonical" href="${url}">
<link rel="icon" href="../../favicon.svg" type="image/svg+xml">
<meta property="og:type" content="website">
<meta property="og:site_name" content="plinkfx">
<meta property="og:title" content="${attr(title)}">
<meta property="og:description" content="${attr(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${url}og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${attr(`${s.name}: waveform of the sound, plinkfx, CC0`)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${attr(title)}">
<meta name="twitter:description" content="${attr(desc)}">
<meta name="twitter:image" content="${url}og.png">
<script>(function(){var h=location.hash.slice(1),i=h.indexOf("?");location.replace("../../#${s.name}"+(i>=0?h.slice(i):location.search))})()</script>
<noscript><meta http-equiv="refresh" content="0; url=../../#${s.name}"></noscript>
<style>body{margin:0;padding:3rem 1.5rem;font:16px/1.5 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;background:#16130f;color:#f2ede3}a{color:#ff7a4f}</style>
</head>
<body>
<h1>${attr(s.name)}</h1>
<p>${attr(what)}. ${attr(catTitle)}, CC0.</p>
<p><a href="../../#${s.name}">Open ${attr(s.name)} in the plinkfx gallery</a></p>
</body>
</html>
`;
}

export function sharingFiles(catalog: Catalog, lastmod = new Date().toISOString().slice(0, 10)): OutFile[] {
  const out: OutFile[] = [];
  for (const s of catalog.sounds) {
    const cat = catalog.categories[s.cat]?.title ?? s.cat;
    out.push({ fileName: `s/${s.name}/index.html`, source: soundPage(s, cat) });
    out.push({ fileName: `s/${s.name}/og.png`, source: ogCard(s, cat) });
  }
  const urls = [SITE, `${SITE}game.html`, ...catalog.sounds.map((s) => `${SITE}s/${s.name}/`)];
  out.push({
    fileName: "sitemap.xml",
    source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc><lastmod>${lastmod}</lastmod></url>`).join("\n")}\n</urlset>\n`,
  });
  out.push({ fileName: "robots.txt", source: `User-agent: *\nAllow: /\n\nSitemap: ${SITE}sitemap.xml\n` });
  return out;
}
