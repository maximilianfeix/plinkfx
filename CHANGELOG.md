# Changelog

## Unreleased

**A protective player, and loops.**

- `play()` returns a voice: `stop(fade?)` fades out (10 ms by default, so no click), `rate(r)` glides the
  playback rate, `node` is the `AudioBufferSourceNode`. Code that called `.stop()` on the old return value
  keeps working. Still `undefined` when a sound is skipped.
- `cooldown` (default 0.03 s): the same sound started again within it is skipped, so 30 coin pickups in
  one frame are one coin. `0` turns it off; plays spread out with `delay` are compared by start time.
- `voices` (default 4): at most this many copies of a sound at once; one more stops the oldest with a fade.
- `loop` option, and `loop: true` on a Sound renders it as a seamless loop (the tail crossfaded into the
  head, every take tested for a click-free wrap and an even level). Four loop sounds: `rain-loop`,
  `wind-loop`, `engine-idle`, `force-field`. Loop sounds loop by default and are exempt from the cooldown.
- `muted(on?)`: mute everything and keep the volume. Not stored; the README has the `localStorage` one-liner.
- `stopAll()` fades in 10 ms instead of cutting.
- Gallery: loop sounds start on click and stop on the next click; hover and arrow keys don't start them.
- Player: 3.1 kB gzip (was 2.9), everything 15.7 kB. 184 sounds.

- CLI: `plinkfx mcp`, an MCP server on stdio with five tools: `list_sounds`, `show_sound`, `render_sound`,
  `measure_sound` and `check_sound`. No dependencies, no network.
- CLI: `plinkfx check <sounds|file.wav> | --all [--json]` looks for clicks at the edges, cut tails, DC offset,
  clipping and true peak, silent padding, and loudness off the category target. Exits 1 when a check fails.
- CLI: `render --png out.png` draws a waveform and spectrogram, so an agent can look at a sound.
- CLI: inline and `.json` sounds accept the `modal` and `pluck` waves (they were rejected as unknown).
- CLI: `measure` warns about DC above 0.01 instead of 0.001. Short, lopsided transients went over the old
  limit without a real offset.
- Skill: uses `check` and `--png`, and lists the checks and how to read the picture.

## 0.2.0 (2026-11-12)

**180 sounds in 15 categories** (was 163 in 13).

- New categories: **creatures** (bat-flap, slime-blob, chirp, growl-small, ghost-moan, bee-buzz, creature-hurt,
  creature-die, voice-babble) and **nature** (thunder-far, rain-drop, bird-chirp, frog-croak, leaf-rustle, stone-drop).
  Also `harp` and `bow-twang`.
- Engine: exponential decay (`shape < 0`), per-take brightness and level variation (`varyF`, `varyG`), key-tracked
  filters (`kt`), `modal` (wood, metal, glass), `pluck` (plucked string), `formant` (vowel filter), a render-time
  limiter for spiky sounds and a soft master limiter. Player: 2.9 kB gzip.
- Rebuilt against measured CC0 references: footsteps, hits, UI clicks, wood knocks, swishes, laser and shot tails.
- Player: `unlockAudio()`, `preload()`, `stopAll()`, `pan` and `delay`; sounds triggered while audio is locked are
  skipped instead of all firing on the first click; safe to import and call on the server.
- CLI: `export --sprite` (one file + Howler and Phaser JSON), `--only` categories, negative values after flags,
  one-line errors, did-you-mean for typos.
- Gallery: shareable tweaks (`/s/<name>/?p=3&v=42`), one page and preview card per sound, a tour, "suggest a sound".
- Every release has `plinkfx-wav-ogg.zip`: all sounds, four takes, WAV + OGG.

## 0.1.0 (2026-11-12)

First release: 163 sounds, the gallery, the demo game, the CLI and the agent skill.
