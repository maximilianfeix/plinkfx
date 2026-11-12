# plinkfx + Phaser

Three ways:

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

**3. Load one audio sprite**: every sound in one file, one request instead of 180:

```bash
npx plinkfx export public/sfx --sprite --format both   # add --only ui,pickup to keep it small
```

```js
preload() {
  this.load.audioSprite("sfx", "sfx/plinkfx-sprite.phaser.json", ["sfx/plinkfx-sprite.ogg", "sfx/plinkfx-sprite.wav"]);
}
create() {
  this.sound.playAudioSprite("sfx", "coin");
}
```

The sprite names are the sound names. If you leave out the audio URLs, Phaser loads the files listed under
`resources` in the JSON. Those paths are resolved against the loader's path, so call `this.load.setPath("sfx")` first.

Ship OGG plus WAV (or MP3): Safari only plays OGG from version 18.4.
