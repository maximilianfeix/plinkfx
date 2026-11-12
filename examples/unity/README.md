# plinkfx + Unity

1. `npx plinkfx export Assets/Resources/Sfx --variants`
2. Select the clips: **Load Type** Decompress On Load, **Force To Mono** on (they are mono already).
3. Copy `PlinkSfx.cs` into `Assets/`. It sets itself up when the first scene loads.
4. `PlinkSfx.Play("coin");` or `PlinkSfx.Play("explosion", 0.8f);`

Note: written against the Unity scripting API docs; it has not been run in the editor by the author
yet. Please open an issue if something is off.
