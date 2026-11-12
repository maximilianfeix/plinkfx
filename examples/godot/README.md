# plinkfx + Godot 4

1. In your project folder: `npx plinkfx export sfx --variants` (writes `sfx/<category>/<name>-1..4.wav`).
2. In the Import dock, select the WAVs and make sure **Normalize** is off (plinkfx levels are matched already).
3. Add `plinkfx_sfx.gd` as an autoload named `Sfx` (Project Settings → Globals → Autoload).
4. Anywhere: `Sfx.play("coin")`, `Sfx.play("explosion", -3.0)`, `Sfx.play("jump", 0.0, 1.1)`.

The script picks a random take each time, never the same one twice in a row, and uses a small pool
of players so sounds can overlap.

Note: written against the Godot 4 API docs; it has not been run in the editor by the author yet.
Please open an issue if something is off.
