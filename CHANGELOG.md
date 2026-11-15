# Changelog

## Unreleased

**270 sounds in 21 categories** (was 180 in 15).

- New categories: **cards & casino** (card-flip, card-deal, card-place, card-shuffle, chip-stack, dice-roll, slot-spin,
  slot-stop, jackpot), **vehicles** (engine-start, engine-rev, tire-screech, car-crash, car-horn, boost, race-light),
  **horror** (jumpscare, dread-drone, whisper, horror-sting, chains-rattle, static-burst, music-box), **farm & crafting**
  (axe-chop, tree-fall, pickaxe-mine, dig, plant-seed, watering-can, harvest, fishing-cast, fish-bite), **sci-fi & tech**
  (computer-beep, scan, access-granted, access-denied, door-slide, robot-chatter, shutdown, glitch) and **puzzle** (swap,
  match, combo-chain, line-clear, piece-lock, merge).
- 44 more in existing categories: melee (kick, stab, sword-clash, sword-draw, body-fall), destructibles (crate-break,
  pot-break, metal-clang, rock-crumble, ignite), guns (machine-gun, shell-casing, flamethrower, grenade-launch), app UI
  (drag-start, drop, success, maximize, minimize, question, message-send, trash, page-turn), RPG items (potion-drink, eat,
  loot-rare, equip), weather and water (thunder-crack, ocean-wave, rain-burst, dive-splash), animals (zombie-groan, roar,
  dog-bark, cat-meow), quiz (buzzer-wrong, ding-correct, timer-done), highscore, boss-intro, slide, fall-whistle,
  step-carpet, step-mud.
- Everything bundle: 22.4 kB gzip (player alone still 2.9 kB).

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
