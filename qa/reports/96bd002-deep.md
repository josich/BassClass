# QA deep report · 96bd002 · 2026-10-14
Summary: 1 critical, 6 major, 9 minor, 2 visual. Runs: monkey seeds 1 (320 steps, 844x390, 4-string), 2 (330, 640x300, 6-string lefty Do-Re-Mi), 4 (320, 780x360, 4-string Do-Re-Mi), targeted seeds 300-306 (7 x 50 steps, one per Jazz Licks exercise, 915x412, 5-string): 1320 steps, about 10 min. Plus exhaustive lick sweep, timing harness, corrupt-storage matrix, sample/tuner pitch checks, memory cycles and layout checks. About 95 min in total.

First QA run, so everything was in scope, with extra depth on Jazz Licks, the Options sheet, audio/samples, tuner and fretboard.

Harness notes (hidden Browser pane): `requestAnimationFrame` never fires and CSS transitions never advance, so I shimmed rAF with `setTimeout(16)` and disabled transitions while running UI checks. Without that, "drawer open but close button covered" is a false positive. Scripts are in `qa/tools/`. In monkey run 1, a random tap on the tuner's Start button made the pane ask for the microphone, and the user saw a "blocked" notice. Later runs block clicks on `.tn-start`, and the tuner was tested with a fake `getUserMedia` stream.

## Critical   (crash, data loss, stuck with no way out, core feature broken)

### C1. Leaving an exercise during the first Play leaves an invisible player looping forever
- Where: any exercise, first Play after the app starts (recorded samples still decoding). `web/js/player.js:73-79`, `:102-103`; `web/js/ui/exercise.js:352-357`.
- Steps:
  1. Start the app fresh (samples not decoded yet). Open `#/ex/lk-ii-v-i`.
  2. Tap Play, then tap Back (or the Android back button) within about 1-2 s.
- Expected / Actual: leaving should stop all sound. Instead the exercise keeps playing, with metronome and loop, on Home and every other screen. Nothing in the UI can stop it. Opening another exercise creates a second, separate player, so only an app restart stops the first.
- Evidence: I counted `AudioBufferSourceNode`s while on Home (`#/`) with no exercise open: 18 at +4 s, then 23 at +7 s, 46 and then 69 over the next 8 s. The `AudioContext` was "running". Mechanism:
  1. `Player.play()` sets `_starting` and awaits `A.whenReady()`, which can wait up to 2.5 s, with `playing` still false.
  2. `dispose()` calls `player.stop(true)`, and `pause()` returns at once because `!this.playing`.
  3. When the await resolves, `play()` only checks `this.playing || !this.inst`, so it starts the 25 ms scheduler for a disposed screen.
- Related: tapping Play a second time during that window (meant as pause) is ignored by the `_starting` guard (`player.js:74`), and playback starts anyway. Fix idea: add a cancel token or `disposed` flag that `stop()` sets and `play()` checks after the await.

## Major      (wrong notes/timing/info, leaks, behaviour a user will hit)

### M1. Changing tempo with the metronome off makes notes jump in time (a burst of notes, or a gap)
- Where: every exercise. `web/js/player.js:60-69`, together with `:140`.
- Steps: turn the metronome off and press Play. After a few seconds, move the tempo slider (or press + / − / keys).
- Expected / Actual: the tempo should change smoothly from the next note. Instead the next notes are scheduled in the past and fire together; lowering the tempo leaves a gap instead. The error grows the longer it has been playing.
- Evidence: logged Player on `sc-one-octave` at 120 BPM. After 6 s I called `setBpm(180)`.
  - Metronome on: step gaps go 250 ms to 166.7 ms, seamless.
  - Metronome off: the next steps are scheduled up to 1166.7 ms before the previous step (min Δt = −1166.7 ms), so about 7 notes sound at once.
  - Cause: `setBpm` re-anchors at `Math.min(nextStepAbs, nextClickAbs)`. With the metronome off, `clickOk` is false (`:140`), so `nextClickAbs` never advances past the count-in. The anchor therefore snaps back to beat 0 and the new tempo is applied to the whole elapsed time.
  - Same root cause (suspicion, not measured): turning the metronome on again after a long time off makes `_tick` skip thousands of stale clicks, 512 per tick, before it schedules the next note.

### M2. Tuner: leaving while the microphone request is pending leaves the mic open and the analysis loop running
- Where: `#/tuner`. `web/js/ui/tuner.js:70-91` (`start`) and `:93-100` (`stop` / dispose).
- Steps: tap "Start tuner". While the permission prompt is pending (Chrome's prompt does not block the page; it is non-modal on https/PWA), tap another rail item. Then grant the permission.
- Expected / Actual: the mic should never open, or should close on leave. Instead it opens after the screen is gone and stays open: the mic indicator stays on and the battery drains, with no UI to stop it.
- Evidence: I replaced `getUserMedia` with a fake stream that resolves after 1.5 s and tapped Start, then went to `#/`. 3.5 s later the stream had opened once and been stopped 0 times, and the tuner's rAF loop was still running (165 → 202 callbacks in 1 s). `start()` never checks after `await A.openMic()` whether `stop()` (dispose) already ran.

### M3. Jazz licks: wrong degree labels and chord/note spelling mismatch on chromatic chords and outside notes
- Where: `web/js/curriculum/licks.js`:
  - `:62`: chords given as a semitone offset are spelled by `bestRoot()`, independently of the notes.
  - `:82-84`: notes are spelled from the tonic.
  - `:39-44`: `degOf()` prints `·` when the interval has no name.
- Steps: open the lick, set the key in Options, set labels to "Deg".
- Expected / Actual: every note should be spelled to match the chord shown and labelled with its real degree. Actual readout (4-string, swing):
  - `lk-modern` #4 "Coltrane major-3rd cycle" in D♭: chord **E7** over notes F♭ G♭ A♭ C♭, labelled `·`, `♭♭3`, `♭4`, `·`. Then **Amaj7** over B♭♭ C♭ D♭ F♭ A♭ F♭, all labelled `·`, `♭♭3`, `♭4`. Same in E♭, G♭ and A♭.
  - `lk-turnarounds` #3 "Tritone-sub turnaround" in F: last chord **F♯7** (should be G♭7) over B♭ G♭ D♭ B♭, labelled `♭4 · · ♭4`. Same pattern in D♭, E♭, G♭, A♭ and B♭ (e.g. B♭: B7 over C♭/G♭/E♭).
  - `lk-modern` #5 "Side-slipping", in every key including the default C: over Dm7, D♭ is labelled `·` and G♭ `♭4` (it is the major 3rd of the slipped chord, F♯).
  - `lk-bebop` #1 "Enclosure chain on G7", every key: G♭ (upper neighbour of F) is labelled `·`.
- Evidence: full sweep in `qa/tools/licks-sweep.js` (33 licks x 12 keys x 2 feels x 3 basses x 4 max frets = 9504 builds). These are the only lick-label errors. Fix idea: spell the numeric-offset chords from the tonic (as the string degrees are), and spell notes relative to the chord sounding under them.

### M4. Jazz licks: double flats and double sharps in common jazz keys
- Where: `web/js/curriculum/licks.js:82-83`. Every note is spelled as `T.up(tonic, ivBetween(C, note))`, so a chromatic note keeps its C-major interval in every key.
- Expected / Actual: no double flats in common keys. Actual:
  - D♭ major: 18 of the 29 major-key licks contain B♭♭ or E♭♭ (e.g. "Arpeggio up, ♭9 down" spells the ♭9 of A♭7 as B♭♭).
  - G♭ major: 21 licks (A♭♭, B♭♭, D♭♭, E♭♭; the blues licks spell the ♭3 and ♭7 of G♭7 as B♭♭).
  - A♭ major: 11 licks (the tritone sub of E♭7 reads B♭♭ C♭ D♭ F♭ instead of A B C♯ E).
  - E♭: 2 licks. E: F♯♯/C♯♯ in 3 licks. B: C♯♯/F♯♯/G♯♯ in 4. A: F♯♯ in 2.
  - The F♯♯ in G♯ minor (3rd of D♯7) is correct and not counted.
- Evidence: same sweep. A jazz player reads A7, not B♭♭7. Spell chromatic approach notes by direction or by chord, or fall back to the enharmonic without a double accidental.

### M5. "Highest fret used = 17" is not honoured; one exercise even goes past the 24th fret
- Where: Settings → Highest fret used → 17. Selftest only checks max fret 20, so it misses this. `web/js/curriculum/intervals.js:164-168` for the worst case.
- Expected / Actual: no fret above 17. 17 exercise families go above it on 4- or 6-string, up to fret 20: arp-two-octaves, arp-upper-structure, iv-cycles, md-relative, md-melodic-modes, md-harmonic-modes, sc-alternating-all-keys, sc-chromatic, sc-odd-groupings, sc-two-octaves, tech-permutations-across (pos 12), tech-spider (pos 12), tri-two-octaves.
- Worst case: `iv-scale-octaves` key A♭, root on E string, max fret 17. The lower setting moves the exercise *up*, to the A/G strings at frets 11-25. Fret 25 does not exist and is not drawn: `FretboardView` caps at 24, so the top note's dot disappears. With max fret 20 the same exercise sits at frets 4-18.
  - Cause: `if (f0 + 14 > maxFret)` switches to the other string without checking that it fits.
- Evidence: build readout `4str max17: ... 1:23 3:25 ...`, range [11, 25]. With max fret 20/21/24 there were no violations in 60,387 sampled builds.

### M6. Stored values are trusted without validation: corrupt storage blanks the app or crashes exercises
- Where: `web/js/store.js:21-28` (`read` accepts any JSON), `:44-49`; `web/js/ui/exercise.js:45-46, 118, 307-308`.
- Steps / Actual (each value written alone to localStorage, then the app reloaded):
  - `bassclass.progress.v1 = null`: Home renders blank, and `#/m/<id>` and every exercise throw `Cannot read properties of null (reading 'lk-ii-v-i')` at `getProgress`. Settings → "Reset progress" cannot recover because `Object.keys(null)` throws. There is no in-app way out.
  - `progress = 42` (a number): `updateProgress` would throw in strict mode on every option change or loop (code reading).
  - `settings.reveal = "qq"` or progress `label: "bogus"`: `TypeError ... reading '1'` at `syncToggles` (`exercise.js:307` / `:308`). The exercise half-renders with an empty BPM readout. Because `renderExercise` throws, `app.js` never stores `active`, so on leaving, the keydown listener and the player are never disposed: Space on other screens still toggles the orphan player.
  - Progress `lastBpm: "fast"`, `-5` or `1000`: shown as "fastBPM", "-5BPM", "1000BPM" and used unchecked by the scheduler (`60 / bpm`). "fast" gives NaN times; −5 gives times running backwards. `sub: 0` or `"abc"` gives an empty subdivision select and `dur / 0` for uniform exercises.
  - Settings `a4: "xx"`: the tuner shows "NaN Hz" on every string chip.
  - Handled fine: garbage JSON, settings null/array, strings 7 or "5", maxFret 3/99/"x", notation "xx", label "zz", lefty "yes", voice "zzz", progress params pointing at missing options, progress entry null or string.
- Severity note: only reachable by corrupt storage, but then the app is stuck. Validate the type and range of each key on read.

## Minor      (edge cases, rough behaviour)

### m1. Tempo buttons and keys go from 20 to 320 BPM; the slider and README say 30–260
- `player.js:61` clamps to 20..320, while `exercise.js:81` makes the slider 30..260 and README says "tempo 30–260". Pressing + past 260 leaves the slider pinned while the readout climbs to 320. The speed trainer then sets `target = min(260, bpm + 40)`, which is below the current tempo, and its toast says "up to 260".

### m2. Settings footer says there are no samples
- `screens.js:283`: "Sound is synthesized in the app (no samples)". Recorded samples are now the default voice.

### m3. Licks: "Swing 8ths" is shown but ignored on the two straight licks
- `licks.js:105`: "Pentatonic superimposition" and "16th-note arpeggio run" force straight 8ths, but the Options summary and chip still say "Swing 8ths" and the user can pick it with no effect.

### m4. Licks with max fret 17 on 4-string: single notes jump an octave mid-phrase
- `common.js:333-340` (`emitMixed` folds each off-neck note separately). "Enclosure into the 3rd" in E: the A3→C♯4 arpeggio top drops to C♯3 (−8 instead of +4 semitones). "Pedal-point fill" in D and E♭: the high maj7 drops an octave. "16th-note arpeggio run" in E♭.

### m5. Notes from C5 (MIDI 72) up play with the synth, not the samples
- `audio.js:140-147`: `nearest()` allows at most 7 semitones above the top sample (E4 = 64). On 6-string with max fret 24, MIDI 72 occurs in fb-all-octaves, fb-find-note, tri-open-spread, tri-two-octaves, tri-diatonic-inversions and arp-diatonic-inversions, so that one note changes timbre.

### m6. In-app Back on a deep-linked exercise can leave the app
- `app.js:56` uses `history.back()` whenever `history.length > 1`, which counts other documents. Opening `#/ex/lk-bebop` directly and pressing the in-app Back went to the previous page (seen in my tab: it unloaded to the earlier URL).

### m7. Best BPM is credited one trainer step early
- `exercise.js:111-114` with `player.js:187-193`: the loop event carries the new trainer tempo at the start of the loop, so `bestBpm` becomes e.g. 104 after only a loop at 100 was completed.

### m8. Bebop tip lists the beats in the wrong order
- `licks.js:190` says "chord tones (G, F, D, B) land on beats 1-2-3-4". The lick "Bebop dominant scale from the 3rd" puts B, G, F, D on beats 1-4.

### m9. Unbounded UI queue while animation frames are paused (suspicion)
- `Player.queue` is drained only by `_frame` (rAF). In the hidden pane, rAF never fired while the 25 ms scheduler kept queueing events. The same may happen in a backgrounded WebView that keeps timers alive. I could not confirm this on a device.

## Visual     (cut text, overflow, overlap, hidden controls - with size and settings)

### V1. Exercise footer hides controls off the right edge on phones, with no scroll cue
- `app.css:167`: `.exv-ctrl { overflow-x: auto; scrollbar-width: none }`. The footer's minimum width is 879 px.
  - 640x300: Metronome, Sound, Speed trainer, Reveal ("Step"), Labels ("Deg") and Mark as mastered are off-screen.
  - 780x360: Reveal, Labels and Mastered are off-screen.
  - 844x390: Mastered is off-screen.
  - 915x412 and wider: everything fits.
- This is the same class of problem the previous commit fixed for the header options.

### V2. Touch targets under 32 px
- Level tabs on module and warm-up screens (`.tabs button`, `app.css:105`): 37-41 x 29 px.
- Subdivision select and explorer selects: 31 px tall.
- Settings segment buttons: exactly 32 px.
- Long titles and the options summary are cut with an ellipsis at 640-844 px wide ("Your first scales: major, mino…", "Major (Ionian) · C · A string…"). This is intended ellipsis, noted only.

## Checked and fine
- Self-test: `problems: 0` (169 exercises, 16,488 builds, 1,006,577 notes). `checkLicks()` is clean.
- Lick sweep, 9504 builds: every lick fills its progression in whole bars in all 12 keys, both feels, 4/5/6 strings and max fret 17-24. Frets stay within the maximum, fingers are 0-4, and the spelling pitch class matches the MIDI note. Swing places the "&" at 2/3 of the beat; triplets and 16ths are untouched.
- Extended parameter sweep at max fret 20 (60,387 builds, up to 250 parameter combinations per exercise, 4/5/6 strings): no fret above 20, spelling and string/MIDI always consistent. Double stops: no two notes on one string and no span over 4 frets in 2460 stacks.
- Theory: in 12 keys for major, natural, harmonic and melodic minor: 7 distinct letters, no double accidentals, correct harmonized 7th qualities and Roman numerals (major, minor), and chord detection matches every symbol.
- Timing (logged Player):
  - Count-in is exactly 1 bar (4 clicks).
  - Swing lick at 240 BPM: steps at 0 / 0.1667 / 0.25 s…, 0 ms grid error.
  - 260 BPM at 6 notes per beat is exact.
  - Loops are seamless.
  - Speed trainer goes 240→244→248→252 and stops at its target; loop lengths are 1000 / 983.61 / 967.74 / 952.38 ms exactly.
  - No ghost notes after stop (40 play/stop cycles).
- Samples: all 82 files in `manifest.json` decode. The 41 regular samples are within ±3.6 cents of their MIDI note (worst: 49 at −3.6, 31 at +3.3).
- Tuner:
  - `yin` on 120 synthetic tones (B0–C3; detune 0/−7/+23/−45 cents; weak or missing fundamental; noise) is within 2.2 cents (worst: E1 with noise, 2.17).
  - Octave folding onto a selected string is exact.
  - End to end with a fake mic stream, the right note and cents are shown relative to the A4 setting.
- Routes: `#/ex/nope` goes to Home, `#/m/nope` goes to Library, and bad params (`key=99&scale=zzz&lick=999`) fall back to defaults; `?wu=999` is ignored.
- Memory:
  - 3 minutes of continuous play: heap 9.8–10.6 MB, DOM about 410 nodes, flat.
  - 450+ open/close cycles: keydown listeners and ResizeObservers balanced, DOM back to 335 nodes. Heap after idle GC was +1 MB over 60 cycles (inconclusive, no clear leak).
  - 50 tuner enter/leave cycles and 100 Options/Info open/close cycles: flat.
- Layout at 640x300, 780x360, 844x390, 915x412, 1024x768 and portrait 360x780 (4/6 strings, lefty, Do-Re-Mi, Options sheet, Info drawer, tuner, explorer at 24 frets): no horizontal page scroll, no clipped text other than ellipsis, no covered controls. The portrait rotate prompt covers exercises. The Options panel scrolls with a sticky Done at 640x300. No overlapping dots in Shape mode with 6 strings at 640x300.
- Interrupt flows: reload during playback with Options changed and the Info drawer open kept settings and options. Leaving during playback (after samples are ready) stops the sound.
- Longest builds: gr-funk-changes in all 12 keys (2304 steps) renders in about 100 ms. Whole-note subdivision on tri-rudiments-all-keys gives a 345,634 px tab strip and is still responsive.
