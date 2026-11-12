# Changelog

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
