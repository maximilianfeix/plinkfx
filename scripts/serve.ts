/** Tiny static server for the built site (used by the e2e tests). node scripts/serve.ts site 4173 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const [root = "site", port = "4173"] = process.argv.slice(2);
const types: Record<string, string> = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".json": "application/json" };
createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url!, "http://x").pathname)).replace(/^([/\\])+/, "");
  if (path.includes("..")) return res.writeHead(400).end();
  const file = join(root, path.endsWith("/") || !path ? path + "index.html" : path);
  try {
    const body = await readFile(file);
    res.writeHead(200, { "content-type": types[extname(file)] || "application/octet-stream" }).end(body);
  } catch {
    res.writeHead(404).end("not found");
  }
}).listen(Number(port), () => console.log(`serving ${root} on http://localhost:${port}`));
