# QA deep report · 5fe06c4 · 2026-10-15
Summary: 0 critical, 2 major, 6 minor, 2 visual. Runs: monkey seeds 21 (330 steps, 844x390, 4-string), 22 (340 steps, 640x300, 6-string, left-handed, Do-Re-Mi), 23 (340 steps, 780x360, 5-string, max fret 17, Deg labels, bass 200%, click 150%), plus a favorites drag fuzz, seed 31 (250 drags at 915x412). That is 1260 steps in about 12 min. Also: an extended build sweep (68,292 builds, 5.4 M notes), the lick sweep (9504 builds), a timing harness, an audio-chain tap, a corrupt-storage matrix (17 cases x 3 routes), real-mouse drag and Back tests, memory cycles, 3 min of continuous play and layouts at 6 sizes. About 2.5 h in total.

Scope: the round-1 fixes (7f29bd1) and everything new in 5fe06c4: the output chain, favorites (storage, stars, drag to reorder), Home/Path/Library navigation, the left-handed strings and the icons. Scripts: `qa/tools/sweep.js` (new), `qa/tools/monkey2.js` (new: favorites, drag, search). The older tools were reused.

## Round-1 fixes: all hold
| Round 1 | Status | Evidence |
|---|---|---|
| C1 player keeps looping after leaving during the first Play | fixed | Logged Player: `play()` followed at once by `stop(true)` ends with `playing:false`, no timer. Play+Back by real clicks on a fresh load: 0 buffer sources on Home over 6 s. Two quick toggles stay stopped. |
| M1 tempo change with the metronome off | fixed | `sc-one-octave`, 120 to 180 BPM after 4 s with the metronome off: the gaps go 250, 250, then 166.67 ms (no burst, no gap). Turning the metronome on after it was off: clicks are 0 ms off the step grid. |
| M2 tuner mic left open | fixed | Fake `getUserMedia` resolving after 1.5 s, screen left after 0.3 s: the track is `ended` and the loop runs 0 frames per second. Same result when the screen is left after the mic opened. |
| M3/M4 lick labels and double accidentals | fixed | Lick sweep, 9504 builds: 0 double accidentals, 0 bad labels, contour kept everywhere. |
| M5 max fret 17 | fixed / intended | 68,292 builds: 0 notes above the max fret without the `overFret` notice. Over-max cases show the notice, as decided. |
| M6 corrupt storage | fixed | 17 cases x 3 routes: 0 errors, no blank screen. Details under "Checked and fine". |
| m1 BPM clamp | fixed | 200 taps on + give 260 (slider 260); 200 taps on − give 30; the trainer at 260 says "Already at the top tempo". |
| m3 swing on straight licks, m8 bebop tip | fixed | `inst.fixed.feel` is set on the 5 non-swing licks; the tip now reads "B, G, F, D". |
| m6 in-app Back | fixed | Real clicks: Home, Path, module, exercise, then Back twice ends on the Path at d=1. Browser back then gives Home at d=0. |
| m7 best BPM | fixed | The trainer loop event carries `{bpm:68, done:60}`; `exercise.js:156` credits `done`. |
| m9 UI queue | fixed | 7000 `_q` calls: the queue tops out at 3001. |
| V1 footer controls off-screen | fixed | At 640x300 the "More" popover shows all 6 items, and each one gets its own clicks (`elementFromPoint`). |

## Critical
None.

## Major

### M1. Speed trainer: metronome clicks after the last note of a loop are played at the next loop's tempo
- Where: `web/js/player.js:200-206`. When the last step of a loop is scheduled, the trainer re-anchors the timeline at `loopBase` with the new BPM right away. Clicks that fall between that last step's start and the end of the loop are scheduled later (they are past the 0.12 s lookahead), so `_time()` places them with the new tempo, measured backwards from the loop end.
- Steps: open `sc-blues` (defaults: 13 notes, 8 beats, the last note starts on beat 7), set 120 BPM, switch on the speed trainer and play.
- Expected / Actual: the click on beat 8 should sound 3500 ms after the loop start. It sounds at 3516.1 ms, and the same goes for every loop. The error is (beats left) x (60/old − 60/new):
  - 60 BPM with +4: 62.5 ms per beat left.
  - Synthetic 4-beat loop (one note of 1 beat, then one of 3 beats), 60 BPM, +8: clicks at 0 / 1000 / **2235.3** / **3117.6** ms instead of 0 / 1000 / 2000 / 3000.
- The beat-flash UI events move by the same amount.
- Reach: 43 of 169 exercises leave more than 1 beat after the last note's start at default options (e.g. `sc-blues`, `sc-chromatic`, `arp-two-octaves`, `wk-two-feel`, `lk-ii-v-i`, `lk-modern`). Any exercise is affected at the Whole/Half subdivisions.
- Evidence: logged `Player` (`_q` wrapped), scheduled times above. Fix idea: re-anchor at the loop end only after the clicks before `loopBase` have been scheduled, or keep the old tempo for absolute beats `< loopBase`.

### M2. "Triads with chromatic approach notes", Chords "Up & back": 3 beats of silence at every loop end
- Where: `tri-approach` (`web/js/curriculum/triads.js:512-547`). The player pads the loop to a whole bar (`player.js:48`).
- Steps: open `#/ex/tri-approach`, set Chords to "Up & back" in any single key, loop.
- Expected / Actual: the build comment says "the last target leads back to the first". "Up & back" has 15 chords x 3 beats = 45 beats in 4/4, so the loop is padded to 48. The final approach note (B, leading back to C) is followed by 3 beats with only the metronome. "I → I" (24 beats) and the all-keys cycles (540 beats) are seamless.
- Evidence: `_layout()` gives `total 48`, last step at beat 44.5 (dur 0.5), `silenceBeats 3`. All 4 approach types and all 12 keys are affected (69 flagged builds in the sweep). Related observation: chords change every 3 beats, so they fall on beats 1, 4, 3, 2… of the 4/4 bar. That may be intended, but it is why the total does not come out even.

## Minor

### m1. Saved sound settings are ignored outside exercises until an exercise has been opened; "Restore defaults" does not reach the audio
- Where: `setAudioOptions` is only called in `exercise.js:164` and by the Settings controls (`screens.js:305/317/318`). The Neck explorer (`screens.js:248`) and the tuner reference note (`tuner.js:36`) use whatever the audio engine holds. `screens.js:325` (Restore defaults) saves the defaults but does not apply them.
- Steps: set bass volume 20%, metronome 120%, Synth and boost On. Reload the app, go straight to Neck and tap a fret.
- Evidence: the live nodes after the reload read `bassVolume.gain 1`, `clickBus 0.6`, `boostSend 0` (saved values: 0.2 / 1.2 / boost on). The tapped note used a 3.0 s recorded sample (voice saved as Synth; a synth buffer is 3.2 s). A user who set 0% or 200% hears 100% on the Neck and the tuner.

### m2. Output chain: above about 120% the slider adds clipping rather than loudness, and the metronome ducks the bass
- Where: `web/js/audio.js:28-39`. `mix` ×2 drives a limiter (threshold −1.5 dB, with Chrome's automatic makeup gain) and then a soft clip that is flat at 0.928 for any input of 1 or more. `clickBus` goes into the same limiter.
- Measured with an AudioWorklet tap on the final node. Recorded samples, player velocities 0.88/0.74, 16 notes E1–C4:

  | Volume | Peak | RMS | Samples at the ceiling (>0.92) | Longest flat run |
  |---|---|---|---|---|
  | 50% | −3.65 dB | −13.7 dB | 0% | – |
  | 100% | −0.64 dB | −8.3 dB | 0.14% | 23 samples |
  | 150% | −0.64 dB | −7.5 dB | 2.4% | 62 samples |
  | 200% | −0.63 dB | −7.3 dB | 4.0% | 88 samples (1.8 ms) |

  - Going from 100% to 200% buys about +1 dB RMS and 28 times more flat-topped samples, which is audible distortion on low notes.
  - No digital overs, no NaN, and 0% is true silence.
- Clicks share the limiter. With a soft sustained E2, every click pulls the limiter down: by up to 2.4 dB at metronome 60%, and by up to **8.9 dB** at 150%. The bass pumps on every beat.

### m3. Favorites drag: a cancelled drag still saves the new order; leaving Home during a drag reorders the list afterwards
- Where: `web/js/ui/favorites.js:47-63`.
  - `end` treats `pointercancel` like `pointerup` and saves the moved DOM order.
  - After the screen is gone, `move` keeps running on the detached list: every rect is 0, so `next` is null and the dragged row is appended at the end. Then `end` saves that order.
- Evidence (drag fuzz, seed 31, 250 drags):
  - 11 of 13 cancelled drags changed the stored order, e.g. `sc-pent-sidestep 5→0`.
  - 12 of 16 drags interrupted by navigation moved the item after Home was left, e.g. `arp-two-octaves 3→20`, which is the end of the list.
- No favorite was ever lost or duplicated. Storage always stayed a unique string array, the DOM matched storage, no `.dragging` class or transform was left behind, and window listeners stayed balanced (0/0/0).
- On Android, a system back gesture or an incoming call during a drag sends `pointercancel`. Suggest restoring the original order on cancel and ignoring moves once the list is detached.

### m4. History: Finish of the warm-up leaves a duplicate Home entry; `#/m/<unknown>` returns to itself on Back
- Warm-up: Start, Next ×5, then Finish calls `location.replace('#/')` (`app.js:69`). The Home entry sits at depth 1 on top of the original Home at depth 0, so the first Android/browser Back shows Home again with no visible change. Same URL, so no `hashchange` fires and the depth variable stays stale. Measured by real clicks: `#/ d=1`, then back gives `#/ d=0`.
- `moduleScreen` redirects an unknown module with `go('#/path')` (`screens.js:171`), which pushes a new entry. Back from that Path lands on `#/m/nope`, which pushes `#/path` again. Only reachable through a stale link.

### m5. Drag handle: 30 px wide, and no keyboard alternative
- `.grip` is 30x40 px (`app.css:363`). It is the only control on the phone sizes below 32 px; all other targets measured 32 px or more at 640x300 and 780x360.
- The grip is a `<button>` labelled "Move <title>", but Enter or Space on it does nothing (the click is only `stopPropagation`). Favorites cannot be reordered without a pointer.

### m6. Spelling outside the licks (not covered by the round-1 lick fix)
- Dominant progressions in G♭ show **C♭7 with B♭♭** and D♭7 with C♭. Example, `hm-12-bar-blues` key 6: `[C♭7] C♭ E♭ G♭ B♭♭`.
  - The sweep found B♭♭/E♭♭/F♯♯/C♯♯ in 38 families, largely harmony, grooves, walking and slap in G♭/D♭/A♭, and minor ii–V–i in G♯m/D♯m.
  - Pure interval or chord-quality drills (`tri-four-types`, `arp-7th-qualities`, `iv-all-from-root`) are correct textbook spellings and are not counted.
- `iv-cycles`, Whole tones from C: C D E F♯ G♯ A♯ **B♯** D…, the octave of the root spelled B♯, labelled `·` rather than R, and spelled B♯→D (a diminished 3rd).
- Theory is unchanged since 96bd002; this was simply not looked at in round 1.

## Visual

### V1. Favorites are below the fold on phones narrower than about 750 CSS px
- `.home-cols` uses `minmax(320px, 1fr)` (`app.css:351`). Below about 750 px of viewport width Home is a single column, with the warm-up first.
- Favorites block top: **y=597** at 640x300 and **y=580** at 740x360 (e.g. Galaxy S8/S9 in landscape). You must scroll past the whole warm-up to reach them.
- At 780x360 and wider there are two columns and Favorites start at the top.
- Side effect: monkey seed 22 at 640x300 never saw a favorites grip.

### V2. Portrait browser only: Home blocks are 38 px wider than the screen
- At 360x780 the 320 px grid column starts at x=78 and ends at x=398 (`.main` has `overflow-x: hidden`).
  - "▶ Start" spans 311–383.
  - The favorites stars span 342–376.
  - The L-chips are cut.
- The APK is locked to `sensorLandscape` and the PWA manifest asks for landscape, so only the plain web page in a portrait browser is affected.

## Checked and fine
- **Self-test:** `problems: 0` (169 exercises, 16,455 builds, 973,201 notes).
- **Extended sweep** (`qa/tools/sweep.js`):
  - Scope: 4/5/6 strings x max fret 17/20/21/24, with defaults, every option and 12 random mixes. 68,292 builds, 5.4 M notes.
  - 0 spelling/MIDI mismatches, 0 string/fret/MIDI mismatches.
  - Fingers are always 0–4, with 0 only on open strings (harmonics use 0 by design).
  - 0 two-notes-on-one-string, 0 double-stop spans over 4 frets, 0 bad durations, 0 frets above 24.
  - 0 silent over-max cases.
  - Every written-rhythm loop is whole bars except M2. `deg` is undefined only in technique/fretboard drills, which have no degrees.
- **Theory:** 12 keys x major/natural/harmonic/melodic minor all have 7 letters and no double accidentals. Major and natural-minor 7th qualities and Roman numerals are exact, and `detectChord` agrees everywhere.
- **Timing:**
  - Count-in is exactly 4 clicks.
  - 30 BPM ×6, 260 ×6, 260 Whole and 97 ×5 all have 0 ms grid error.
  - Trainer steps 60→68→76 with `done` 60/68.
  - Re-enabling the metronome lands on the grid.
- **Samples and tuner:**
  - All 84 manifest files decode.
  - `yin` on 96 synthetic tones: single-frame worst 2.6 cents (noise plus a weak fundamental). Over 41 frames the median error is ≤ 0.26 cents; the tuner shows a 7-frame median.
- **Favorites storage:** garbage JSON, `{}`, `"str"`, `null`, mixed types, duplicates, `__proto__`/`constructor`, a 100-char id, all 169 ids and 5000 unknown ids. Every case gives no error, and Home, Library and the exercise header all render with the right stars. 169 favorites render as 169 rows.
- **Other corrupt values:**
  - `bassVol` −5, "loud", 3 or null, and `clickVol` 99, all fall back to the defaults.
  - Progress null, 42, a bad entry (`lastBpm "fast"`, `sub 0`, `label "bogus"`, bad params) or `lastBpm 1000` gives 60 BPM, no NaN.
- **Drag with a real mouse:**
  - A tap on the grip fires `click` on the grip and does not navigate.
  - A real drag with a reorder saves the right order and fires no click. Chrome drops the click because the row moved in the DOM; capture is lost and `lostpointercapture` comes before `pointerup`.
  - Multi-touch (two drags at once) is fine.
- **Stars:** a card's star does not open the card; a double-tap toggles twice; the header star and Home stay in sync.
- **Routes:**
  - Bad exercise URLs fall back to Home: `#/ex/nope`, `__proto__` and `constructor`.
  - `#/m/nope` and `__proto__` go to the Path.
  - Bad params fall back to the defaults: `key=99&scale=zzz&lick=999` and `lick=999&key=-1&feel=zzz`.
  - The `wu=` parameter is ignored when invalid: `999`, `-1` and `abc`.
  - `#/warmup` opens Home.
- **Back between Home, Path, Library, modules and exercises** works with real clicks (see m4 for the two edge cases).
- **Memory and long use:**
  - 100 exercise open/play/close cycles with More and Options opened: heap 10.5–13.4 MB with no trend, the DOM back to 1636 nodes on the Library every sample, storage at 18 KB.
  - 3 min of `gr-funk-changes` in all 12 keys (2304 steps): heap 11.3–12.0 MB, about 12,120 nodes, UI queue 0–1.
- **Layout** at 640x300, 740x360, 780x360 (6 strings, left-handed, Do-Re-Mi, 24 frets), 844x390, 915x412, 1024x768 and 360x780 (portrait):
  - No page h-scroll, no clipped text other than intended ellipsis.
  - Nothing covered except by an open sheet or drawer; Done and Close stay reachable.
  - The rotate prompt covers exercises in portrait.
- **Left-handed:** strings now run the whole board, mirroring the right-handed view. 6-string: x 6–734 left-handed vs 34–762 right-handed with the open column, 6–738 vs 30–762 without it.
- **Icons:** the adaptive foreground dot spans 68 of 108 dp, centred: 1 dp over the 66 dp safe circle, inside the 72 dp visible mask. The maskable PWA icon is fully opaque.
- **Interrupt:** a reload during the count-in, with Options changed and the Info drawer open, keeps settings, favorites, the key (Mi♭) and the tempo.
- **Monkey seeds 21/22/23 (1010 steps):** 0 errors, 0 NaN/undefined text, 0 BPM outside 30–260, 0 stuck states, 0 audio with no exercise open, 0 favorites storage violations, 0 h-scroll.
