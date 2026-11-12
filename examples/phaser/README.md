# plinkfx + Phaser

Two ways:

**1. Synthesize in the browser (no files).** `npm i plinkfx`, then call `play("coin")` from anywhere in
your scene. `index.html` here is a working example (run `npm run build` in the repo root, serve the repo
folder with any static server and open `examples/phaser/`). To share one AudioContext with Phaser, pass
`audio: { context: context() }` in the game config.

**2. Load exported files**, if you prefer Phaser's sound manager:

```bash
npx plinkfx export public/sfx --format both
```

```js
preload() {
  this.load.audio("coin", ["sfx/pickup/coin.ogg", "sfx/pickup/coin.wav"]);
}
create() {
  this.sound.play("coin");
}
```

Ship OGG plus WAV (or MP3): Safari only plays OGG from version 18.4.
