# QA deep report · 77c1e47 · 2026-10-23
Summary: 0 critical, 3 major, 6 minor, 2 visual.

Runs:
- Practice-room fuzzer (`qa/tools/roomfuzz15.js`): seeds 1501 and 1502, 320 steps each, at 800x380.
  - Covers the floating Start/Stop (taps, double taps, touch drags anywhere, a 5 px "tap"), Space, the ± and T keys, the hold buttons, tap tempo, every slider (tempo 0-2000 positions, Up to), the slider keys, the option segments, drums, the Harmony block (mode, key, progression, Follow, volume), the Neck selects and taps, ⓘ, leaving by the rail and Back.
  - Together: 38 Room starts, 70 s of play.
- Harmony fuzzer (`__harmFuzz` in `roomfuzz15.js`): seed 1503, 60 steps, the room kept playing while harmony, drums, beats, tempo and muted bars change; 54 checks while playing.
- General monkey (`qa/tools/monkey15.js` on a monkey11 core):
  - seed 1504: 330 steps, 800x380, 4-string;
  - seed 1505: 330 steps, 640x300, 6-string, left-handed, Do-Re-Mi (solfège).
- Checks against known answers (`qa/tools/checks15.js`):
  - harmony on a fake audio clock (bar lines, key, progression and metre changes, muted bars, count-in, 23 progressions x 1-12 beats);
  - tempo slider (every position and every tempo), speed-up ceiling;
  - all 99 drum patterns hit by hit (layers, accents, hi-hat chokes, odd-metre group accents);
  - offline renders of the new drum chain: 99 patterns x 2 subdivisions at 100 % and 80 %, plus drums + pad + click.
- Practice log on a fake clock; backup guard; service-worker cache.
- Memory: 3 min of rhythm changes at 280 BPM with drums, chords and the Neck following; 120 Practice <-> Home/Library cycles.
- Layouts at 800x380, 640x360, 640x300, 915x412, 1024x768 and 360x780; the Start button dragged, resized, rotated.
- Self-test, Player timing, samples, yin.

About 2.5 h.

Scope: b8eb8ea..77c1e47 (dfc38a8 round-14 fixes, cb74765 floating Start and PolyOrbit tempo, 77c1e47 Harmony block, draggable Start, louder drums, My level tile).

Test setup:
- `qa` server on `http://localhost:8878`, my own tab only (tab-5). Before testing I unregistered the service worker, cleared the caches and storage, and loaded with a cache-busting query.
- The main session kept editing and committing during the run (4a3c754 … a7ded7a).
  - My only page load was at 15:18:39. Its `ui/practice.js`, `ui/neck.js`, `practice/state.js` and `app.css` are the 77c1e47 versions (checked from the loaded sources and style rules).
  - Its `practice/engine.js` already had the change later committed as 4a3c754: `_harmony` returns the beat's place in the chord (`chord: { at, of }` on each tick). The scheduling logic is the same as in 77c1e47.
  - I did not reload after that. The corrupt-storage test ran the committed `state.js` text as a blob module.
- M1, M2, M3, m1 and m2 are still in the code at HEAD a7ded7a (code reading).
- The drum balance changed after 77c1e47 (ab29ba3, b7cdf0e, cc60a67, a7ded7a), so the level numbers in m4 and m5 are for 77c1e47 only.

## Critical
None.

## Major

### M1. Harmony: Jazz blues and Rhythm changes drift off the bar lines in any odd number of beats per bar (3/4 waltzes, 5/4, 7/8, 9/8, 11/8, 1)
- Where: `practice/harmony.js:40`, `beats: Math.max(1, Math.round((c.beats * beatsPerBar) / 4))`.
  - A half-bar chord (2 beats in `PROGS`) becomes round(beatsPerBar / 2) beats, so the two halves of a bar add up to more than the bar:

    | Beats per bar | Two half-bar chords |
    |---|---|
    | 3 | 2 + 2 = 4 |
    | 5 | 3 + 3 = 6 |
    | 7 | 4 + 4 = 8 |
    | 9 | 5 + 5 = 10 |
    | 11 | 6 + 6 = 12 |
    | 1 | 1 + 1 = 2 |

- Steps: Practice room → Drums → Jazz → Jazz waltz → Harmony: Chords, Jazz blues → Start.
- Expected (CLAUDE.md): "each chord keeps its length, a 4/4 bar of it becoming one bar of the room's metre". Every chord of bars 1, 2, 3, 5, 6… should start on beat 1.
- Actual:
  - Fake clock, Jazz blues in B♭ in 3/4 at 120 BPM (bar.beat of each change): B♭7 1.1, E♭7 2.1, B♭7 3.1, Fm7 4.1, B♭7 4.3, E♭7 5.2, E°7 6.2, B♭7 7.2, G7 8.2, Cm7 9.2, F7 10.2, B♭7 11.2, G7 12.1, Cm7 12.3…
    - The 12-bar form lasts 39 beats (13 bars), so every chorus starts in a different place.
  - Live in the room (Jazz waltz pattern + Jazz blues in F, 200 BPM, the engine's own `onChord`): B♭7 at 5.2, B°7 at 6.2, F7 at 7.2.
  - Rhythm changes (A section) in 5/4: G7 1.4, Cm7 2.2, F7 2.5, Dm7 3.3…; 48 beats = 9.6 bars, so the loop restarts mid-bar.
- Extent: all 23 progressions were checked for 1-12 beats per bar. Only `jazz-blues` and `rhythm-A` are wrong, and only for odd beat counts; every other combination is exact.
  - The three 3/4 drum patterns (`jazzwaltz`, `waltz`, `threefour`) and all the odd-metre patterns hit it. So does the plain metronome at 3 beats.
  - A jazz waltz over a jazz blues is a very natural combination.
- Fix idea: share out each 4/4 bar's beats so its chords add up to `beatsPerBar` (3/4 → 2 + 1, 5/4 → 3 + 2, 7/8 → 4 + 3, or along the pattern's `groups`).

### M2. Neck: "Just the notes" throws a TypeError and leaves the previous info line, including "🎹 B♭7" after the harmony stops
- Where: `ui/neck.js:81`.
  - `what` is now computed before the `notes ?` test. With `set = 'n:none'`, `T.CHORDS['none'].name` throws.
  - In b8eb8ea the same expression sat inside the ternary, so this is a regression of 77c1e47.
- Steps:
  1. Practice room → Neck → "Just the notes (all names)".
  2. Or, with that choice: Harmony → Chords (Follow), then Harmony → Off, or → Drone.
- Expected: every note on the board, and the line "Natural notes are bright, sharps/flats are dim. Tap any fret to hear it."
- Actual:
  - The board shows every note, but the info line keeps its previous text:
    - step 1: "C Major (Ionian): C – D – E – F – G – A – B · tap any fret to hear it";
    - after Chords → Off: "🎹 B♭7: B♭ – D – F – A♭" with the harmony off;
    - the same line with Drone.
  - Each render logs `Uncaught TypeError: Cannot read properties of undefined (reading 'name') @neck.js:81`: 3 errors in the second repro.
  - The monkey watcher caught the stale line too (seed 1504, step 1).
- The beat lights are not affected. In drone mode with the same key, the frame loop never re-renders the Neck, so the error stays in click and change handlers.
- Fix: compute `what` only when `notes` is set.

### M3. A tempo of 1-10 BPM, even for a moment, silences the room for up to a minute after the tempo goes back up
- Where: `practice/engine.js:117` (`len = 60 / this.bpm` fixed when a beat is scheduled) and `:147` (`this.next += len`).
  - `set({ bpm })` does not reschedule the next beat.
  - With cb74765 the slider's left end, and the Home key on it, is 1 BPM.
- Steps (fake clock, the engine's own code):
  1. Play at 100 BPM.
  2. At 1.0 s set 1 BPM (the slider dragged to its left end).
  3. At 1.5 s set 100 BPM again.
- Expected: the next beat about 0.6 s later.
- Actual:
  - ticks at 0.08, 0.68, 1.28 s, then at 61.28 s: 60 s of silence;
  - the beat lights freeze while the screen reads "100 BPM", and the drums and the pad stop with them;
  - Stop/Start is the only way out. At 5 BPM the gap is 12 s.
- Fix: on a tempo change, bring `next` forward to the last beat + 60 / new BPM when that is earlier (but still a little after now).

## Minor

### m1. The harmony restarts from bar 1 on changes that are not a new key, progression or metre
- Where:
  - `practice/engine.js:37`: `set()` restarts on any patch that contains `beats` or `harmony`.
  - `ui/practice.js:338` (`pickStyle`) and `:347` (`drumsOn`) always send `beats`, even when the metre does not change.
  - `ui/practice.js:422`: the Off/Drone/Chords buttons call `setHarmony` even for the mode already on.
- Evidence: fake clock, 12-bar blues at 120 BPM. Each of these, done at bar 3 beat 2, silences the pad from 3.4 and starts the form again at bar 4 with chord 1:
  - switching Rock → Funk (both 4/4);
  - Drums On (same metre);
  - a tap on the "Chords" button that is already lit.

  Chord changes: `0@1.1 1@2.1 2@3.1 null@3.4 0@4.1 1@5.1 …`
- Expected (CLAUDE.md): a restart only for "a new key, progression or metre". A player halfway through a blues chorus who changes the groove loses their place.
- Fix: in `set()`, restart only when a value actually changes.

### m2. The key picker names the major key over minor progressions
- Where: `practice/harmony.js:31` (`keyName` always uses the Ionian spelling) and `ui/practice.js:403`.
- Evidence: all 6 minor progressions in the 3 keys concerned.
  - Key "D♭" with the minor blues plays C♯m7 F♯m7 C♯m7 … A7 G♯7.
  - "G♭" gives F♯m7, "A♭" gives G♯m7.
  - Minor ii–V–i in "D♭": D♯m7♭5 G♯7♭9 C♯m(maj7).
- CLAUDE.md: "flats on black keys except minor-type chords/scales (C♯m, G♯m, F♯m)". With a minor progression the picker could read C♯m / F♯m / G♯m.

### m3. While the Neck follows a chord, its greyed "Scale or chord" picker still shows the player's own choice
- Example: "Scale · Major (Ionian)" greyed above a neck showing A7's tones. The key picker does switch to the chord's root, and the info line reads "🎹 A7".
- Showing the chord, or blanking the picker, would match the board.

### m4. Drum peaks: the claimed "max −1.7 dBFS over all 99 patterns" is not reproduced
- How measured: offline render of the 77c1e47 chain (glue compressor → ×1.4 → limiter → ×0.84). Each pattern at its own tempo, at its default and its finest subdivision, 4 bars. Peak at the soft clip's input.
- Results:

  | Mix | Peaks at the clip input |
  |---|---|
  | Drums alone, 100 % | swing −1.03 dB (0.0002 % of samples above the knee 0.85 = −1.41 dB); pophalf −1.49; eleven8 −1.74; seven322 −1.79 |
  | Drums alone, 80 % (default) | swing −1.61; pophalf −1.96 |
  | Drums 100 % + pad 100 % | swing −0.29 dB; funkbreak −0.87; never above 1.0 |
  | Defaults (drums 80 %, pad 70 %, click 60 %) | −1.4 to −3.0 dB |

- No pattern reaches 1.0 and the knee's tanh is gentle, so I expect no audible distortion. This is a claim/measurement mismatch.
- As before, only the metronome at its own 150 % maximum saturates: +3 to +4.7 dB at the clip input.

### m5. The new drum chain undoes part of the per-pattern levelling
- Before the chain, `styleGain` (dfc38a8) evens the patterns well: raw RMS −23.0 to −23.25 dB for 10 patterns from rocksteady to jig.
- After the 77c1e47 chain (drums 80 %, RMS over 8 played bars):
  - median −18.1 dB, and 95 of the 99 patterns lie within ±3 dB of it;
  - the outliers: rocksteady −23.5 dB (5.5 dB under the median), onedrop −22.4 dB (already at the +6 dB cap), jumpblues −21.3 dB, jig −14.9 dB.
- Cause: sparse, peaky patterns lose most to the limiter (rocksteady's raw peak +5.6 dB), while dense ones gain from the compressors' make-up.
- Options: compute `styleGain` from a render through the chain, or apply the style's gain after the limiter.

### m6. A quick mouse drag of Start does nothing
- Where: `ui/practice.js:220-226`. Pointer capture is taken only once a move of 8 px has been seen on the button itself.
  - A mouse has no implicit capture, so a first `pointermove` that already lands outside the button goes to another element.
- Evidence: a CDP mouse drag 730,347 → 565,234 → 400,120.
  - The moves went to a `.seg` button and to `.tempo-row`.
  - The button stayed where it was, no position was saved and nothing toggled (the click went to `main`).
- What works:
  - a drag whose first move stays on the button (30 px: saved `[0.875, 0.895]`, and the click that follows is ignored);
  - every touch drag, since touch has implicit capture (all the fuzz drags, 14 in seed 1502 alone, plus a manual one).
- Fix: `setPointerCapture` on `pointerdown`.

## Visual

### V1. Portrait 360x780 (web only): the new "My level" tile squeezes the practice card's day strip to 2-3 days
- What happens:
  - `.home-head .level-btn` (`app.css:454`, `min-width: 104px`, stretched) stays beside the card: tile 104x199 px, card 146x199 px.
  - The ≤520 px rule wraps `.home-head`, but the tile still fits on the first row.
  - The day strip is then 86 px wide (scrollWidth 406).
- Landscape is fine:

  | Size | Tile | Card |
  |---|---|---|
  | 800x380 | 104x77 | 573x77 |
  | 640x360 | 104x77 | 428x77 |
  | 915x412 | no clipping, no overlap | |

### V2. For the record: the floating Start/Stop covers right-hand controls as the room scrolls
- 800x380, default place:
  - at the top it covers the ends of the Play and Mute sliders and their values (14x16 px);
  - further down, the Latin and Reggae genre tabs, style chips and "On the neck" Follow/Off pass under it ("Off" fully under it at one scroll position).
- 640x300 and 915x412: the same kind of overlap (6-7 controls over a full scroll).
- Nothing stays hidden: the 64-76 px spacer lets the last block clear it, and the button can be dragged away. This comes with a floating button; listed so the next run does not re-measure it.

## Checked and fine
- **Self-test:** 223 exercises, 244 lessons, 99 drum patterns, 27,941 builds, 1,623,261 notes, `problems: 0`.
- **Harmony (fake clock):**
  - 4/4 blues at 120 BPM: changes exactly on the bar lines (0.08 + 2n s); repeated chords are held, not struck again.
  - A key change mid-bar: silent from the next beat, the new key at the next bar line.
  - Muted bars are silent and the form goes on through them.
  - Count-in with the drums: 4 clicks, the accent first; the harmony starts on bar 0.
  - 12/8 and 6/8: one chord per bar. Drone on E: 52/59/64.
  - Stop and leaving the room: every pad oscillator stopped within 1.2 s. None left after 3 min of play, after the cycles, or in any of the 5 runs.
- **Harmony fuzz (seed 1503):** the pad's notes always equal the sounding chord's (or the drone's), the lit chip is the engine's chord, and the Neck's line names that chord.
- **Neck:**
  - pickers greyed while following;
  - Harmony Off or Follow Off brings back the player's own key and scale (D Dorian kept);
  - over a drone, the player's scale on the drone's key;
  - solfège names on chips, keys and the Neck.
- **Tempo slider (cb74765):**
  - the 2,001 positions are monotonic and reach all 660 tempos;
  - the thumb position the app sets for each tempo maps back to it (0 failures);
  - both halves meet at the same slope (8.4 positions per BPM);
  - ←/→ ±1, Page ±10, Home 1, End 660.
- **Speed up:** 100 → 110 → 120 → 125 at an "Up to" of 125; 650 → 660; a tempo above the ceiling stays; the count-in bar does not count.
- **Drums (dfc38a8):**
  - all 99 patterns x 2 bars: 3,240 hits exactly on the pattern, the right layer for every velocity, all 816 accents on the top layer;
  - all 58 open hi-hats are closed by the next closed or pedal hat (round-14 M2 fixed);
  - group accents (1480 Hz) on every group start in the 9 grouped patterns.
- **Practice log (fake clock):**
  - hidden for 2 h → 61 s logged; frozen for 2 h with a tick or a tap first → 90 s (round-14 M1 fixed);
  - room left 75 min untouched → 3,600 s; exercise 45 min → 1,200 s;
  - 30 s counts as a practised day and for the streak; each day keeps its own goal.
  - Fuzz credit: 36.3 s for 36.1 s of play, 34.6 s for 34.5 s.
- **Hold:** leaving while − or + is held keeps the tempo (round-14 M3 fixed).
- **Start button (77c1e47):**
  - touch drags move it and save fractions; the click after a drag is ignored; a 5 px move is a tap;
  - Space on the focused button toggles once;
  - a resize or rotation keeps it in the window (640x300, 360x780); never outside it in the fuzz runs.
- **Corrupt `bassclass.practice.v1`** (the committed `state.js` as a blob module): defaults and no throw for:
  - non-objects: `{bad`, `null`, `"str"`, arrays, numbers;
  - out-of-range or wrong-type `fab`, `hKey`, `hVol`, `upTo`, `bpm` (including NaN and strings);
  - `'__proto__'` and `'toString'` as a progression, and progressions not offered (`giant-steps`, `cycle-dom7`).
- **Routes:** `#/explorer` and `#/explorer?x=1` → `#/practice?to=neck` with the Neck at the top; `?to=zzz`, `?to=` and `#/practice/neck` open the room at the top.
- **Home (77c1e47):** the day strip stays on today across a resize, and stays where the player scrolled back to (40 px kept from 800 to 915 wide).
- **Backup:** a 6 MB file is refused without being read; the confirm reads "Load the backup from 23 October 2026?".
- **Service worker:** its cache holds 0 drum files; the drum cache holds 119 entries (118 files and `kit.json`).
- **Room layouts** (800x380, 640x360, 640x300, 915x412, 1024x768, with Chords showing 15 chips and the Neck): no clipped text, no horizontal scroll, no overlaps apart from the Start button's (V2).
- **Memory** (the heap includes the decoded kit):
  - 3 min of rhythm changes at 280 BPM with drums, chords and the Neck following: heap 55.2-56.1 MB, nodes 579-583;
  - 120 Practice <-> Home/Library cycles: 55.8-57.1 MB;
  - monkey heaps flat (56.6-59.9 MB).
- **Scheduling headroom:** chords and the Neck following at 24 frets on a 6-string, 240 BPM, 16ths: clicks at least 92.6 ms ahead, 0 late, no long tasks.
- **Regression:**
  - Player timing for `sc-one-octave`, `lk-ii-v-i` and `rh-odd-meters` (5/4): count-in 4, 4 and 5 beats, 0 ms error, empty queue after Stop;
  - samples: 84 decode, regular ones within ±3.6 cents;
  - yin: 94 of 96 synthetic tones within ±2 cents; the same 2 noise cases as round 14, at 2.3 and 2.6 cents.
- **Harness artefacts, not bugs:**
  - "ghost-click" notes right after leaving an exercise: the Player's last lookahead;
  - `plays: 0` written when a lesson step first opens an exercise record (the store's default since the first commit);
  - one "chips 0" note at the moment of leaving the room (the watcher reading the next screen).
