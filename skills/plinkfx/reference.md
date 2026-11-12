# plinkfx parameter reference

A sound is `{ layers: Layer[], ...effects }`. Layers start together (shift with `at`) and are summed.
Times in seconds, frequencies in Hz. Everything is optional except `layers`.

## Layer

| Field | Default | What it does |
|---|---|---|
| `wave` | `"sine"` | `sine`, `triangle`, `square`, `saw` (band-limited), `noise` (white), `pink` (softer noise), `brown` (rumble), `crunch` (sample-and-hold noise at `freq`, the 8-bit noise), `metal` (six inharmonic squares, for bells, cymbals, clanks) |
| `freq` | 440 | Start pitch. For `crunch` it is the noise rate (higher = finer). |
| `to` | - | End pitch, exponential sweep over `sweep` seconds (default: the whole layer). |
| `curve` | 1 | Sweep shape. 2-4 = most of the change happens at the start (lasers, drops). Below 1 = slow start (charge-ups). |
| `arp`, `arpRate`, `loop` | -, 0.06, false | Semitone steps, e.g. `[0, 4, 7, 12]` (major arpeggio), stepped every `arpRate` s. `loop: true` repeats them. |
| `vib` | - | `[rate Hz, depth semitones]`. `[6, 0.15]` = gentle; `[20, 2]` = boing/warble. |
| `fm` | - | `[ratio, index, decay s]`. Bells: ratio 3.5 or 2.76, index 1.5-3, decay 0.1. Metallic: ratio 1.41. |
| `duty` | 0.5 | Pulse width for `square`; 0.125 and 0.25 sound thinner, more "NES". |
| `at` | 0 | Start delay of the layer. |
| `a`, `h`, `d` | 0.002, 0, 0.2 | Attack, hold, decay. Attack never goes below 1 ms (no clicks). |
| `shape` | 2 | Decay curve: 1 linear, 2 natural, 3-4 snappy (hits, clicks). |
| `lp`, `lpTo` | - | Low-pass cutoff, sweeping to `lpTo` over the layer. |
| `hp`, `hpTo` | - | High-pass. |
| `bp`, `bpTo` | - | Band-pass centre. Good for whooshes (sweep it) and filtered noise. |
| `q` | 0.707 | Resonance for all filters of the layer. 3-6 = whistly, vocal. |
| `drive` | 0 | tanh saturation. 0.5-1 warm, 2+ crunchy. Also makes transients denser (louder at the same peak). |
| `gain` | 1 | Layer level. |

## Sound-level effects

| Field | Example | What it does |
|---|---|---|
| `verb` | `[0.4, 0.2]` | Room: `[size 0..1, wet mix]`. 0.2-0.4 small room, 0.7+ hall/dungeon. |
| `echo` | `[0.09, 0.35, 0.3]` | `[delay s, feedback, wet]`. Sparkles, sci-fi, radar. |
| `bits` | `6` | Bit crush. 4-6 = gritty retro. |
| `rate` | `11025` | Sample-rate crush, aliasing on purpose. |
| `vary` | `0.4` | Pitch spread between the 4 takes, semitones. Footsteps 1-1.5; jingles 0.05. |
| `gain` | set by bake | Output level. In your own sounds, use it to keep the true peak under -1 dBTP. |

## Recipes

Start from these, then shape by ear (the user's) and by numbers (yours).

- **UI click** (20-40 ms): sine 1900→900 Hz, `d` 0.03, `shape` 3 + noise `bp` 4000, `d` 0.012.
- **Coin**: square `duty` 0.25 at ~988 Hz, `arp: [0, 5]`, `arpRate` 0.07, `h` 0.05, `d` 0.3 + sine an octave up; small `verb`.
- **Jump**: square 250→640 Hz, `d` 0.15, `lp` 3500 + sine an octave down.
- **Land / thud**: sine 130→55 `curve` 2 + pink noise `lp` 900, both 0.07-0.11 s.
- **Hit**: noise `hp` 2500 (20 ms) + noise `lp` 2600→600 (90 ms) + sine 160→55 with `drive` 1.
- **Explosion**: noise `hp` (60 ms crack) + brown `lp` 1100→140 (1 s, `drive`) + sine 110→36 `curve` 3 + crunch 3000→300; `verb` 0.45.
- **Laser**: square 1500→220 `curve` 3, `d` 0.18 + saw an octave down.
- **Power-up**: square arpeggio `[0, 4, 7, 12, 16, 19, 24]` at 0.045 s + triangle an octave down.
- **Footstep**: filtered noise 50-110 ms + a short sine knock for hard floors; `vary` 1.5.
- **Magic**: sine with `fm` [3.5, 1.5, 0.15] arpeggio + `metal` with `hp` 7000 + `echo`/`verb`.
- **Door creak**: saw 38→62 Hz with `vib` [3.5, 2.5], `bp` 1100, `q` 5, 0.6-0.8 s.
- **Alert**: square or saw pulses with `h` and `shape` 1; keep `vary` ~0.1 so it stays recognisable.

## Loudness targets used by the catalogue (max momentary LUFS)

ui -20, footstep -20, alert -18, jingle / mechanic / world -17, pickup / jump / powerup / shoot / magic -16,
hit -15, explosion -14. True peak never above -1 dBTP. Very short sounds stop at the peak limit
before they reach the target; that is expected.
