# Skill example: a heavy door for a dungeon

A real run of the plinkfx skill workflow, in a fresh npm project with `plinkfx` installed from the
packed tarball (2026-11-12). Commands and output are copied from the terminal.

**Ask:** "Make me a heavy door sound for a dungeon game."

**Target written down before rendering:** about 1-3.5 s, a slow low creak, then a heavy slam with a
long dark tail; darker than most of the catalogue (centroid under 600 Hz); as loud as `door-heavy`.

## 1. Nearest catalogue sound

```
$ npx plinkfx list mechanic | head -3
door-open   mechanic   Creaky wooden door opening
door-close  mechanic   Door shuts with a thud
door-heavy  mechanic   Heavy dungeon door slams
```

`door-heavy` is the reference.

## 2. Parameters (`sounds/dungeon-door.json`)

Three parts: a creak (detuned saw at 28-40 Hz through a resonant band-pass, with slow vibrato), a
pink-noise rumble under it, and at 0.95 s the slam: brown noise, a sine drop from 62 to 30 Hz with
drive, and a little metal for the iron bands. A large reverb for the stone room.

```json
{
  "verb": [0.85, 0.35],
  "layers": [
    { "wave": "saw", "freq": 28, "to": 40, "vib": [2.2, 3], "bp": 600, "q": 6, "a": 0.15, "h": 0.6, "d": 0.25, "shape": 1.5, "gain": 0.8 },
    { "wave": "pink", "bp": 300, "q": 2, "a": 0.2, "h": 0.6, "d": 0.2, "gain": 0.4 },
    { "wave": "brown", "lp": 260, "at": 0.95, "a": 0.001, "d": 0.7, "shape": 2.5, "gain": 1.8, "drive": 1 },
    { "wave": "sine", "freq": 62, "to": 30, "at": 0.95, "a": 0.001, "d": 0.6, "drive": 1.5 },
    { "wave": "metal", "freq": 300, "bp": 1200, "q": 3, "at": 0.97, "a": 0.001, "d": 0.25, "shape": 3, "gain": 0.25 }
  ]
}
```

## 3. Measure against the reference

First pass, no gain set yet:

```
$ npx plinkfx measure sounds/dungeon-door.json --like door-heavy
  duration      3.381 s   (ref 3.040 s)
  loudness    -7.2 LUFS   (ref -16.0 LUFS)
  integr.    -12.6 LUFS   (ref -19.7 LUFS)
  peak         7.3 dBFS   (ref -4.0 dBFS)
  true peak    7.3 dBTP   (ref -4.0 dBTP)
  centroid       432 Hz   (ref 471 Hz)
  dc            -3.5e-6   (ref 6.6e-7)

  ! true peak above -1 dBTP: lower the gain
```

Duration and darkness are on target (432 Hz centroid, darker than the reference), but it clips.
Set the level from the reference:

```
$ npx plinkfx level sounds/dungeon-door.json --like door-heavy
sounds/dungeon-door.json: gain 0.347 -> -16.4 LUFS (target -16.0), true peak -1.9 dBTP (peak-limited)

$ npx plinkfx measure sounds/dungeon-door.json --like door-heavy
  duration      3.381 s   (ref 3.040 s)
  loudness   -16.4 LUFS   (ref -16.0 LUFS)
  integr.    -21.8 LUFS   (ref -19.7 LUFS)
  peak        -1.9 dBFS   (ref -4.0 dBFS)
  true peak   -1.9 dBTP   (ref -4.0 dBTP)
  centroid       432 Hz   (ref 471 Hz)
```

## 4. Hand-off

```
$ npx plinkfx render sounds/dungeon-door.json -o dungeon-door.wav
```

> Here is `sounds/dungeon-door.json` and `dungeon-door.wav` (3.4 s, -16.4 LUFS, true peak -1.9 dBTP,
> darker than `door-heavy`). I can't hear it, so please listen: if the creak is too long, I'll shorten
> the first layer's hold; if the slam needs more weight, I'll lower the sine drop.

```js
import { play } from "plinkfx/core";
import door from "./sounds/dungeon-door.json" with { type: "json" };
play(door);
```
