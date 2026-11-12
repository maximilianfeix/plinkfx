<picture>
  <source media="(prefers-color-scheme: dark)" srcset="brand/banners/readme-dark.svg">
  <img alt="plinkfx: game sound effects as code" src="brand/banners/readme-light.svg" width="100%">
</picture>

# plinkfx

**163 game sound effects, written as code.** Coins, jumps, hits, lasers, explosions, UI clicks and
153 more, each one a few numbers that a 2 KB player turns into sound. CC0, no audio files, no account.

<a href="https://maximilianfeix.github.io/plinkfx/"><img src="docs/media/gallery.gif" alt="The plinkfx gallery: clicking tiles plays coin, jump, laser, explosion and more; each tile shows its waveform" width="100%"></a>

**[▶ Play them all in the gallery](https://maximilianfeix.github.io/plinkfx/)** · [play the 30-second demo game](https://maximilianfeix.github.io/plinkfx/game.html) · [watch the 30 s video with sound](docs/media/hero-16x9.mp4)

```bash
npm i plinkfx
```

```js
import { play } from "plinkfx";

play("coin");
```

Every call picks one of four takes, so the hundredth coin doesn't sound like a loop.

## What's inside

| Category | Sounds | Examples |
|---|---:|---|
| UI | 23 | `click` `click-soft` `toggle-on` `confirm` `error` `notify` `swipe` `plink` |
| Pickups | 15 | `coin` `coin-double` `coin-bag` `gem` `key` `heart` `ka-ching` |
| Jump & land | 10 | `jump` `jump-double` `jump-cartoon` `land` `land-heavy` `spring` |
| Hits | 15 | `hit` `hit-heavy` `punch` `hurt` `enemy-die` `sword-hit` `block` `crit` |
| Explosions | 10 | `explosion` `explosion-big` `explosion-retro` `firework` `implosion` |
| Power-ups | 12 | `powerup` `level-up` `extra-life` `shield-on` `heal` `charge-up` |
| Shots & lasers | 16 | `laser` `blaster` `zap` `pew` `gunshot` `shotgun` `ricochet` `reload` |
| Footsteps | 10 | `step-grass` `step-stone` `step-wood` `step-metal` `step-snow` `step-water` |
| Magic | 12 | `sparkle` `spell-cast` `fireball` `ice` `teleport` `portal` `lightning` |
| Alerts | 10 | `alarm` `warning` `low-health` `heartbeat` `countdown` `radar-ping` |
| Jingles | 9 | `victory` `level-complete` `game-over` `checkpoint` `achievement` |
| Doors & mechanics | 10 | `door-open` `door-heavy` `lock-open` `chest-open` `lever` `ratchet` |
| World | 11 | `whoosh` `swing` `splash` `water-drop` `bubble` `wind` `glass-break` |

The full list with a one-line description each: `npx plinkfx list`, or the [gallery](https://maximilianfeix.github.io/plinkfx/).

## Use it

**In the browser**, by name (includes every sound, 12 KB gzipped):

```js
import { play, volume } from "plinkfx";

play("laser");
play("coin", { volume: 0.5, rate: 1.2 });   // quieter, a bit higher
play("step-wood", { variant: 2 });          // a specific take (0-3)
volume(0.8);                                // master volume
```

**Only what you use** (player plus one sound: 2.2 KB gzipped):

```js
import { play } from "plinkfx/core";
import { coin, jump } from "plinkfx/sounds";

play(coin);
```

**Your own sound** is a plain object. Tweak any sound in the gallery, press "params" and paste:

```js
import { play } from "plinkfx/core";

const blip = {
  layers: [
    { wave: "square", duty: 0.25, freq: 988, arp: [0, 5], arpRate: 0.07, h: 0.05, d: 0.3, lp: 7000 },
    { wave: "sine", freq: 1976, arp: [0, 5], arpRate: 0.07, d: 0.22, gain: 0.5 },
  ],
  verb: [0.2, 0.12],
};
play(blip);
```

All fields are documented in [skills/plinkfx/reference.md](skills/plinkfx/reference.md).

## Files for your engine

Godot, Unity, Phaser, Defold, LÖVE or anything else that loads audio files:

```bash
npx plinkfx export sfx/                       # every sound as 48 kHz mono WAV, in category folders
npx plinkfx export sfx/ --format both         # WAV + OGG (OGG needs ffmpeg)
npx plinkfx export sfx/ --variants            # all four takes of each sound
npx plinkfx render explosion-big -o boom.wav  # one sound
```

- **Godot:** drop the folder into `res://`. Turn the importer's *Normalize* off, the levels are already matched.
- **Unity:** WAV with *Decompress On Load* for short effects; keep *Force To Mono* on.
- **Phaser:** `this.load.audio("coin", ["sfx/pickup/coin.ogg", "sfx/pickup/coin.wav"])`, or skip files
  entirely and call `play("coin")` from plinkfx.

Every WAV in the gallery also has a download button. Ready-made players for the exported files:
[Godot](examples/godot), [Unity](examples/unity), and a [Phaser](examples/phaser) example that needs no files at all.

## The agent skill

plinkfx ships a skill for Claude Code, Codex and Cursor. Ask for *"a heavy door for a dungeon level"*
and the agent picks the nearest catalogue sound, writes a parameter file, renders it, measures it
(loudness, true peak, duration, brightness) against the reference and adjusts. It runs on the CLI, offline.
Agents can't hear, so the skill tells yours to say so and hand you the WAV.

<img src="docs/media/skill.gif" alt="Terminal: plinkfx list, level, measure and render for a dungeon door sound" width="100%">

```bash
npx skills add maximilianfeix/plinkfx                 # Claude Code, Codex, Cursor and others
```

In Claude Code you can also add the repo as a plugin marketplace:

```
/plugin marketplace add maximilianfeix/plinkfx
/plugin install plinkfx@plinkfx
```

A full example run is in [docs/skill-example.md](docs/skill-example.md).

## How the sounds are checked

Every sound goes through `npm run bake` and the test suite on Linux, macOS and Windows:

- **Loudness:** each category has a target (UI and footsteps −20 LUFS, hits −15, explosions −14, the
  rest in between, measured as max momentary loudness per ITU-R BS.1770). The four takes of a sound
  average onto the target and stay within ±1.5 LU of it. Very short clicks stop at the peak limit first.
- **Peaks:** true peak (4× oversampled) ≤ −1 dBTP for every take.
- **Clean edges:** at least 1 ms attack, a 5 ms fade at the end, a DC blocker, the silent tail trimmed.
- **Determinism:** the same parameters and take always give the same samples. A hash of every take
  is part of the tests.
- **Variation:** the four takes differ (pitch spread per sound, decay ±7 %, new noise).
- **Ears:** spectrograms of every category are reviewed, and every sound is listened to before a
  release. Rejected ideas and the reasons are kept in the log.

The meter is exported too: `import { measure } from "plinkfx/meter"`, or `npx plinkfx measure file.wav`
for any WAV.

## How it compares

| | **plinkfx** | [ZzFX](https://github.com/KilledByAPixel/ZzFX) | [jsfxr](https://github.com/chr15m/jsfxr) | [Kenney audio packs](https://kenney.nl/assets/category:Audio) |
|---|---|---|---|---|
| What it is | named sound library as code | tiny synth + designer | sfxr port: generator + library | WAV/OGG asset packs |
| Size | 2.3 KB player, 12 KB with all sounds (gzip) | ~1.3 KB | ~6.3 KB | no code, files |
| Sound licence | CC0 | MIT | Unlicense | CC0 |
| Named, curated sounds | 163 | 4 examples, random generators | 11 random presets | many, generic file names |
| Matched loudness | yes, measured | no | no | per pack |
| Variations | 4 takes per sound, seeded | edit / randomness | mutate | none |
| No audio files | yes | yes | yes | no |
| Export | WAV, OGG, CLI | WAV (designer) | WAV | already files |

ZzFX is smaller and wonderful for a 13 KB game jam; jsfxr is great for exploring random sounds; Kenney
packs have real recordings. plinkfx is for when you want a finished, consistent set you can read,
tweak and ship. Also have a look at [8bit-sfx](https://github.com/cportka/8bit-sfx),
[make-sfx](https://github.com/Tuntii/make-sfx) and [uisfx](https://github.com/romainsimon/uisfx).

## Licence

<table><tr><td>

### Sounds: CC0 1.0, public domain

Use them in any game, app, video or stream, commercial or not. **No credit needed.**
[LICENSE-SOUNDS](LICENSE-SOUNDS)

</td><td>

### Code: MIT

The engine, CLI, gallery and skill.
[LICENSE](LICENSE)

</td></tr></table>

## Contributing

New sounds are the best contribution: open the gallery, tweak something until it fits a moment in
your game, and open an issue or PR with the params. Look for issues labelled
[`good first issue`](https://github.com/maximilianfeix/plinkfx/labels/good%20first%20issue) and
[`new sound`](https://github.com/maximilianfeix/plinkfx/labels/new%20sound).
See [CONTRIBUTING.md](CONTRIBUTING.md).

## Star history

<a href="https://star-history.com/#maximilianfeix/plinkfx&Date"><img src="https://api.star-history.com/svg?repos=maximilianfeix/plinkfx&type=Date" alt="Star history" width="600"></a>

[中文说明](README.zh-CN.md)
