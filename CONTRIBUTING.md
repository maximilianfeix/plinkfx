# Contributing

Thanks for helping. The most useful thing you can add is a good sound.

## Add a sound

1. Find the closest sound in the [gallery](https://maximilianfeix.github.io/plinkfx/), tweak it with the
   knobs, and copy the params. Or write one from scratch with [the reference](skills/plinkfx/reference.md).
2. Add it to the right file in `library/` (one file per category). Names are kebab-case and describe
   the sound, not the game (`door-heavy`, not `zelda-door`).
3. Run:

   ```bash
   npm ci
   npm run bake            # renders, measures and sets the level of every sound
   npm run bake -- --reels # optional: one WAV + spectrogram per category in .work/reels
   UPDATE_HASHES=1 npm test
   ```

4. **Listen** to all four takes with headphones (`node dist/cli.js render <name> --variant 0..3` after
   `npm run build`, or `npm run gallery:dev`).
5. Open a PR. Say where you'd use the sound.

Rules:

- Your own parameters only. Don't port presets from other tools unless their licence allows it, and say so.
- Contributions to `library/` are CC0, everything else MIT. By opening a PR you agree to that.
- A sound should be under 4 seconds and do one thing. Loops and music are out of scope for now.

## Code

```bash
npm run typecheck && npm test && npm run build && npm run size
npm run gallery:dev    # gallery on localhost
npm run e2e            # Playwright tests against the built gallery (npm run gallery:build first)
```

The player in `src/core` has a 3 KB gzip budget (`npm run size`). Keep it dependency-free.
