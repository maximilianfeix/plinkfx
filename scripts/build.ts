/** Build dist/: ESM bundles with shared chunks (one AudioContext, one cache), .d.ts files, the catalogue. */
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { chmodSync, copyFileSync, readFileSync, rmSync, writeFileSync } from "node:fs";

rmSync("dist", { recursive: true, force: true });
// Each entry is its own file. index.js imports ./core.js and ./sounds.js instead of
// bundling them, so there is one AudioContext and sounds.js stays tree-shakeable.
const shared = {
  name: "shared",
  setup(b: any) {
    b.onResolve({ filter: /^\.\/(core\/index|sounds\.gen)\.ts$/ }, (a: any) =>
      a.importer.endsWith("src/index.ts") ? { path: a.path.includes("core") ? "./core.js" : "./sounds.js", external: true } : undefined,
    );
  },
};
for (const [name, entry] of Object.entries({ index: "src/index.ts", core: "src/core/index.ts", sounds: "src/sounds.gen.ts", meter: "src/meter.ts" }))
  await build({ entryPoints: [entry], outfile: `dist/${name}.js`, bundle: true, format: "esm", target: "es2020", legalComments: "none", plugins: [shared] });
await build({
  entryPoints: ["src/cli.ts"],
  outfile: "dist/cli.js",
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node18",
  banner: { js: "#!/usr/bin/env node" },
});
// The CLI source starts with its own shebang; keep exactly one.
const cli = readFileSync("dist/cli.js", "utf8").replace(/^(#!.*\n)+/, "#!/usr/bin/env node\n");
writeFileSync("dist/cli.js", cli);
chmodSync("dist/cli.js", 0o755);
copyFileSync("library/catalog.gen.json", "dist/catalog.json");
execFileSync(process.platform == "win32" ? "npx.cmd" : "npx", ["tsc", "-p", "tsconfig.build.json"], { stdio: "inherit", shell: process.platform == "win32" });
console.log("built dist/");
// Entry-point declaration shims matching package.json "exports".
writeFileSync("dist/core.d.ts", 'export * from "./core/index.js";\n');
writeFileSync("dist/sounds.d.ts", 'export * from "./sounds.gen.js";\n');
// tsc keeps the .ts specifiers in declarations; consumers need .js.
import { readdirSync } from "node:fs";
for (const f of readdirSync("dist", { recursive: true }) as string[])
  if (f.endsWith(".d.ts")) writeFileSync(`dist/${f}`, readFileSync(`dist/${f}`, "utf8").replace(/(from\s+"\.[^"]*)\.ts"/g, '$1.js"'));
