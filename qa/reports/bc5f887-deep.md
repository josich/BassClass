# QA deep report · bc5f887 · 2026-10-15
Summary: 0 critical, 5 major, 8 minor, 0 visual. Runs: monkey seeds 51 (330 steps, 844x390, 4-string), 52 (340, 640x300, 6-string, left-handed, Do-Re-Mi, 24 frets, degree labels), 58 (340, 780x360, 5-string, max fret 17, finger labels), plus targeted "stay" runs 53 (150, `sc-3nps` 2 octaves), 54 (120, `arp-broken`), 55 (120, `md-relative` 2 octaves), 56 (80, Library), 57 (80, Settings). That is 1,560 steps in about 15 min. Also: self-test x10, an extended build sweep (70,896 builds), a Range-option sweep (14,040 builds), spelling sweeps, a walking-line sweep, timing runs with a logged `Player`, a corrupt-storage matrix (11 cases), 19 bad routes, memory cycles, 2 min of continuous play, sample and tuner checks, and layouts at 6 sizes. About 1.5 h.

Scope: everything from ec02a2d to bc5f887:
- 87f424c fixed sound (no sound options, bass volume 0–100%);
- 274a8d9 round-3 fixes (builder spelling, bestRoot, licks, walking, `step.fill`, Library, routes, badges, audio route, Android);
- bc5f887 numbering from the Library order and the new Range option.

Test setup: port 8878 was also held by an unrelated `python -m http.server 8878 --directory pwa` on IPv6 (`[::]:8878`), so `localhost:8878` reached the wrong site. Every check ran on `http://127.0.0.1:8878`, which reached my `tools/serve.py` (checked: `EXERCISES.length` = 173, title "BassClass"). The pane cannot register service workers ("An unknown error occurred when fetching the script", even though `/sw.js` returns 200). The app catches this; it is a pane limit, not an app bug.

New script: `qa/tools/monkey4.js` (monkey3 plus checks for fret numbers below 0 or above 24 in the tab strip and for odd Settings readouts, Library searches with #/b, and a `stay` mode for targeted runs).

## Round-3 findings: status
| Round 3 | Status | Evidence |
|---|---|---|
| M1 jazz builder respells the ♭3 of minor chords (A♭m7 = B) | fixed | `hm-chord-qualities` G♭: `[A♭m] A♭ C♭(♭3)`. `hm-minor-keys` E♭ minor: `[Fm7♭5] F A♭ C♭(♭5) E♭`. The chord-tone sweep (7,539 builds) finds no respelled ♭3/♭10 chord tone. The ones left are by decision (°7 ♭♭7 plain, altered ♭5/♯5 plain, plain-spelled scales, blue notes in licks). `arp-7th-qualities` is academic again (C°7 = B♭♭). |
| M2 broken chords: the closing root breaks the bar grid | fixed | Every key starts on a bar line at subdivisions ½, 2, 3, 4, 5 and 6. Cycle of 4ths, triads at 16ths: keys start at beats 0, 8, 16 … 88, loop 96. 7ths over 2 octaves: 0, 16 … 176. Logged `Player` at 240 BPM: grid error 0 ms, count-in 4 clicks, closing root at 2.000 s held to 3.000 s. |
| m1 Messiaen 3/7 named as minor scales (G♯ mode 7 with F𝄪) | fixed | Key 8 is "A♭ Messiaen mode 7" (`A♭ A B♭ B D♭ D E♭ E F G`). Key 1 is "D♭ Messiaen mode 3". See m2 below for the remaining sharp roots. |
| m2 "C phrygian dominant" lower case | fixed | Badge "C Phrygian dominant". |
| m3 Library Back loses the search | fixed | Search "arpeggio" (33 found), scroll 900, open #117, Back: the search box says "arpeggio", 33 cards, scroll 900, same card on top. `#/library?l=3` + 1500 px, open, Back: back at 4912.8 px, same card. |
| m4 broken "groups of 4" on a one-octave triad | fixed | `C E G C E G C E E C G E C G E C` (cells 1-3-5-8 and 3-5-8-10). |
| m5 "In 3rds" on Messiaen | fixed in 173 | `sc-messiaen` offers "Skip one note". `sc-symmetric` does not: see m1. |
| Suspicion: Android route = any connected device | addressed | API 33+ now asks `getAudioDevicesForAttributes(USAGE_MEDIA)`. See m4 for what is left. CI for bc5f887 is green (APK and Pages), so it compiles. |

## Critical
None.

## Major

### M1. "Three notes per string", 2 octaves: the first notes sit at fret −1 (E♭ on 4 strings, B♭ on 5/6 strings), and the self-test now fails at random
- Where: `sc-3nps` (#66), `web/js/curriculum/scales.js:209-215`.
- Cause: `f0` comes out as 11 for E♭ on the E string (or B♭ on the B string). The new line `if (p.oct === '2' && f0 > 10) f0 -= 12;` is meant only for E (f0 = 12, "from the open string"), but it also catches 11, which gives −1.
- Steps: open `#/ex/sc-3nps?key=3&oct=2` on a 4-string (or `key=10` on a 5- or 6-string).
- Expected: a playable two-octave E♭ major.
- Actual: `E♭ s0 f-1 / F s0 f1 / G s0 f3 / A♭ s1 f-1 …`. E♭1 (MIDI 27) is below a 4-string's range, and B♭0 (MIDI 22) is below even a 5- or 6-string's low B. The tab strip prints "-1" four times, and the dot is drawn off the board.
- Reach: all 9 scale types in that key, at every max-fret setting. My Range sweep found 588 notes at fret −1.
- Self-test: `selftest.run()` reports `problems: 0, 0, 12, 12, 0, 10, 18, 26` in 8 runs (and 14, then 6 earlier), all of them `sc-3nps … "oct":"2"` with key 3 (4-string) or key 10 (5/6-string).
  - The test only catches the bug when one of its 12 random option mixes happens to combine that key with `oct: 2`.
  - The main session's "problems: 0" was luck.
  - The self-test varies one option at a time, so it never pairs the key with the new Range option. A key x Range pass would make it deterministic.
- Also on 4-string, max fret 17: D♭ and D two octaves reach fret 18–19, with the notice. That is fine.

### M2. Two-octave modes and open-position scales jump 7–12 frets in the middle of the scale, often onto a lower string
- Where:
  - `relativeBuild`, `web/js/curriculum/modes.js:11-31`: two octaves call `b.line(items, { place: { open: 'avoid' } })` with no `center` and no link from mode to mode. Used by `md-relative` #67, `md-melodic-modes` #130, `md-harmonic-modes` #131 and `md-harmonic-major-modes` #160.
  - `sc-open-position` #12 with Range 2 octaves (`scales.js:72-74`).
- Steps: open `#/ex/md-relative`, set Range to 2 octaves (4-string, Highest fret 20, key C, the defaults otherwise). Look at the very first mode, C major.
- Actual (string, fret / finger):
  - `C:E8/2 D:E10/4 E:A7/1 F:A8/2 G:A10/4 A:D7/1 B:D9/3 C:D10/4 D:G7/1 E:G9/3 F:G10/4 → G:D17/4 A:G14/1 B:G16/3 C:G17/4`.
  - After F on the G string at fret 10, the next step G goes back to the D string at fret 17: a 7-fret leap on a scale step.
  - Worse cases:
    - 5-string, F Lydian in C: `… F:G10/4 → G:A22/4 A:D19/1 …`, a 12-fret leap down two strings.
    - `sc-open-position` 4-string A major: `… B:G4/4 → C♯:D11/1 D:D12/2 …`.
    - `sc-open-position` 5-string C major: `… C:G5/4 → D:A17/4 E:D14/1 …`.
- Measured, as the largest change of hand position (fret − finger) between consecutive notes of one mode or scale, over every key on 4/5/6 strings x max fret 17/20/24:
  - `md-relative` 2 octaves: 243 of 756 mode runs leap 7–12 frets (194 x 7, 45 x 9, 1 x 10, 3 x 12). With 1 octave the largest shift is 4.
  - `sc-open-position` 2 octaves: 40 of 108 scales leap 7–12 frets.
  - `sc-one-octave` 2 octaves: 8 cases of 7 (aeolian, root on A).
  - `sc-pent-sidestep` 2 octaves: 8 cases of 7.
  - For comparison, `sc-two-octaves`, `md-study` (2 octaves), `md-parallel` and `md-pitch-axis` never shift more than 5 frets.
  - A catalogue-wide check (every exercise, defaults and each option once, 4 and 5 strings, steps of 1–2 semitones only) finds such leaps **only** in the three new 2-octave mode families (plus one random `fb-quiz` note).
- Why it matters: no bassist plays a scale step as a 7–12-fret jump onto a lower string. It also teaches the wrong shape.
  - The warm-up picks a random value for each option half the time, so a Level-1 warm-up can open `sc-open-position` or `sc-one-octave` on 2 octaves.
- Fix idea: in two octaves, place each mode with `center` at the root's area (as one octave does), or reuse the `sc-two-octaves` placement. For open position, allow `region: [0, 12]` with small shifts along the top strings.

### M3. Existing installs keep the old bass volume: Settings shows 50% and the bass plays at half the new default
- Where: `web/js/store.js:17` (default `bassVol` 1 → 2) and `cleanSettings`. There is no migration.
- At ec02a2d the default was `bassVol: 1`, and `saveSettings` writes the **whole** settings object. Any user who ever changed anything has `"bassVol":1` stored:
  - a warm-up level tab (`saveSettings({ level })`);
  - the metronome toggle in an exercise;
  - strings, labels and so on.
  - That very likely includes the owner's phone.
- Steps: store the ec02a2d-era settings object (`{… speaker:'phone', octaveLayer:true, phoneBoost:12, voice:'synth', bassVol:1 …}`), reload and open Settings.
- Actual: "Bass volume **50%**". `setAudioOptions` gets `bassVol: 1`, half the gain of the new default (2 = "100%"). The phone-speaker profile was tuned at the new level, so upgraded phones sound quieter than intended.
- Evidence: corrupt-matrix case "old settings on Settings": `.pct` readouts `50%,60%`. No errors; the old sound keys are ignored and dropped on the next save.
- Fix idea: a one-time migration (e.g. a settings version field; if it is missing and `bassVol === 1`, set 2).

### M4. Scalar walking: the "approach" note lands 11–14 semitones away from the note it approaches (pre-existing)
- Where: `wk-scalar` #117 (`walkLine`, `common.js:413-505`).
- Cause: the third cell `['8','7','6','5']` starts the bar on the upper octave, but the cell before it ends with `'A'`, computed against `nextMidi`, the low root.
- Steps: `#/ex/wk-scalar`, ii–V–I in C, 4-string.
- Actual: `|[G7] G43 A45 B47 A♯34(→) |[Cmaj7] C48 B47 A45 G43`. The "approach" A♯1 is 14 semitones below its target C3, after a 13-semitone drop from B2.
- Reach (every progression x 12 keys x 4/5/6 strings):
  - 900 of 2,052 approach notes in `wk-scalar` (44%) are 11–14 semitones from the next note. Examples: `D38 → D♭49`, `E♭39 → D50`.
  - `gr-approach` "Motown" has the same issue: `D♯39(→) → E28`, 56 cases. The approach targets the octave the groove does not play.
  - The other walking exercises are clean.
- Not a regression: the round-3 change only changes which wrong note is chosen (B35 before, A♯34 now). It was not reported before.

### M5. Jazz spelling regression: blue ♭3 over major and dominant chords is now written F♭ / B♭♭ in grooves and slap
- Where: `web/js/builder.js:37`. Adding `'♭3'` to `CORE_DEGREES` (the M1 fix) also freezes the **blue** ♭3. Groove riffs use the `b3` token over any chord.
- This breaks the decision "Only in jazz exercises (… grooves …): … blue and passing notes with a double accidental or C♭/F♭/E♯/B♯ are written the plain way". Only the ♭3 of *minor* chords should stay academic.
- Steps: `#/ex/gr-octaves`, Groove "Minor pentatonic riff", Progression "12-bar blues (quick change)", Key D♭.
- Actual: `[D♭7] F♭(♭3)`, `[G♭7] B♭♭(♭3)`. Before 274a8d9 these were E and A.
- Sweep (4-string, every style x progression x the flat keys; counts are notes):

  | Exercise | Cases | Example |
  |---|---|---|
  | `gr-octaves` | 128 | `[D♭maj7] F♭`, riff over I–V–vi–IV |
  | `sl-grooves` | 114 | `[D♭7] F♭` |
  | `sl-double-thumb` | 114 | `[G♭7] B♭♭` |
  | `gr-funk` | 6 | `[D♭7] F♭`, "fill" over a dominant vamp |

- Reach: only when the chosen progression does not match the riff's own (minor) progression. With "The style's usual progression" there are 0 cases.
- Related, pre-existing: the ♭7 is always "core", so a blue ♭7 over a maj7 stays academic. `sl-grooves` "hammer" over I–IV–V–I in D♭: `[D♭maj7] C♭(♭7)`, `[G♭maj7] F♭(♭7)`.
- Fix idea: keep ♭3/♭10 core only when the current chord (`curChord`, already tracked for ♭5) is minor, half-diminished or diminished.

## Minor

### m1. `sc-symmetric` (#125) still says "In 3rds" on the diminished, whole-tone and augmented scales
- The decision log says these scales call that sequence "Skip one note". `sc-symmetric` offers `Straight | In 3rds | Groups of 3 | Groups of 4 | In 4ths`, and `sc-exotic` offers "In 3rds" for its augmented scale.
- Musically it is harmless: on these scales skip-one does give 3rds (minor 3rds on diminished, major 3rds on whole tone and augmented). Only the decision is not applied.

### m2. Plain-spelled symmetric scales still take sharp roots on some black keys
`bestRoot` scores the academic spelling, which plain mode then throws away. On black keys 1/3/6/8/10:

| Scale | Roots |
|---|---|
| Whole-half diminished | C♯ E♭ F♯ A♭ B♭ |
| Messiaen 3 | D♭ E♭ **F♯** A♭ B♭ |
| Messiaen 4 | C♯ E♭ F♯ A♭ B♭ |
| Messiaen 5 | D♭ E♭ F♯ A♭ B♭ |
| Messiaen 7 | C♯ E♭ F♯ A♭ B♭ |
| Whole tone, half-whole, augmented, Messiaen 1/2/6 | D♭ E♭ G♭ A♭ B♭ |

So key 1 reads "D♭ Messiaen mode 3" but "C♯ Messiaen mode 7". The key chip and the badge agree. Low priority; for plain scales a flat on a black key would be consistent.

### m3. Walking fallbacks can "approach" with the current chord's root
- **New branch (274a8d9).** `wk-approach`, minor blues in A, 4-string: `|[F7] F29(R) F41(R) C36(5) F29(→) |[E7] E28`.
  - The below-approach D♯27 is below the lowest string, so the code falls back to `resolveToken('Ab')`, which gives F29. That is the chord's own root, repeated from beat 1.
  - The fallback result is not checked against the rules the code just applied (`common.js:457-463`).
- **Pre-existing.** The dominant approach `'D'` can equal the current root over V7 → i. `wk-mixed`, `wk-two-per-bar` and `wk-triplet-skips`, Autumn progression: `|[E7] E40 G♯44 B47 E40(→) |[Am7]`, an approach that is the same pitch as beat 1. This happens in all 12 keys (36 builds each).

### m4. Android route: every device that is not on the external list counts as the phone speaker
- `MainActivity.audioRoute()` returns "speaker" unless a playing device is in `EXTERNAL_OUTPUTS`. So these get the phone profile (two 200 Hz high-passes and +15 dB at 850 Hz):
  - analog or USB docks (`TYPE_DOCK`, `TYPE_DOCK_ANALOG`);
  - LE Audio broadcast (`TYPE_BLE_BROADCAST`);
  - casting (`TYPE_REMOTE_SUBMIX`);
  - car audio (`TYPE_BUS`);
  - and any future type.
- Testing for `TYPE_BUILTIN_SPEAKER` / `TYPE_BUILTIN_SPEAKER_SAFE` instead would be safer.
- Suspicion from code reading; no device here.

### m5. Unknown exercise numbers: odd toast texts
- `#/ex/0` says "Exercise 0 is not in this version of BassClass". There never is an exercise 0.
- `#/ex/99999999999999999999` says "Exercise 100000000000000000000 …", because `Number()` loses precision.
- Both cosmetic. The other routes behave:
  - `#/ex/nope`, `-1`, `1e2` and an empty id give "This exercise does not exist";
  - `#/ex/174` gives "Exercise 174 is not in this version…";
  - `#/ex/0042` opens #42.

### m6. Warm-ups can open Level-1 scales on 2 octaves
- `buildRoutine` changes each option with probability 0.5, so the new Range option gives a beginner `sc-one-octave` or `sc-open-position` on "2 octaves" in about 1 warm-up in 4.
- Combined with M2, Level 1 can get the 10–12-fret leap. The decision may be fine; noting it.

### m7. Metronome volume runs to 150% while bass volume now stops at 100%
Settings shows "Bass volume 100%" and "Metronome volume 60%" (0–150%). The two sliders on the same screen use different scales.

### m8. Relative-mode badges capitalise common nouns
- `md-relative` and the family exercises use `SCALES[mode].name.split(' (')[0]`, which gives "C Major" and "A Natural minor".
- The convention in `common.js` (`SHORT`) is "C major" and "C minor", with only mode names capitalised. The same applies to `md-parallel`, "C♯ Natural minor (= D♭)".

## Visual
None found. See "Checked and fine".

## Checked and fine
- **Numbering (bc5f887):**
  - 173 unique numbers, 1–173 with no gaps.
  - They follow level → path topic → export order. Level starts: 1, 17, 50, 84, 120, 157.
  - The Library DOM lists the cards strictly ascending, 1…173.
  - All 173 ids match `docs/CATALOGUE.md`.
  - `#/ex/<n>` opens by number. Favourites, progress and warm-up hrefs use ids only (code review of `store.js`, `screens.js`, `app.js`).
  - No exercise number is hard-coded in any text.
- **Range option:** present on all 13 exercises listed for bc5f887. The exceptions match the decision log (`sc-two-octaves`, one-string, one-position, the 7/5 positions, scale in octaves, chord-scale).
  - Every 2-octave mode and scale run spans exactly 24 semitones.
  - The over-max notice appears whenever a note goes above Highest fret (0 silent cases in 70,896 + 14,040 builds).
  - Fingers are always 0–4, and string/fret always match MIDI.
  - The only fret outside 0–24 is M1.
  - Chromatic "Along one string" shows Range as fixed ("1 octave (a string has 12 frets for it)"). 2-octave broken chords and arpeggios show "Root on: E string (2 octaves start low)".
- **Self-test:** apart from M1, `problems` is 0 (16,923–17,004 builds, about 1.01 M notes).
- **Extended sweep** (4/5/6 strings x max fret 17/20/21/24, every key x Range): no errors.
  - No spelling vs MIDI mismatch, no two notes on one string, no double-stop span over 4 frets.
  - Double accidentals appear only where the decisions allow them (G♯ harmonic/melodic minor F𝄪, chord-construction drills, the ♭3 of minor chords such as G♭m = B♭♭).
- **Theory:**
  - All 12 keys of major, natural/harmonic/melodic minor, Dorian, Mixolydian, Lydian, Phrygian, Locrian and harmonic major: 7 distinct letters each.
  - Harmonised triads and 7ths: correct qualities and Roman numerals in all 12 keys (G♭: I ii iii IV(C♭) V vi vii°).
- **"(= D♭)" badges:** they appear exactly when the mode's root name differs from the key (e.g. "C♯ Dorian (= D♭)", "A♯ Altered (= B♭)"). Never on white keys. No label overlaps in the tab strip.
- **Library search:** handles `#`/`b` for ♯/♭, "-ize" spellings, option names ("spanish", "augmented 7", "2 octaves") and numbers.
- **Timing (logged `Player`):**
  - Count-in is 4 clicks.
  - Grid error 0 ms for: `arp-broken` at 240 BPM x 4, `md-relative` 2 octaves at 260 x 6, `sc-3nps` 2 octaves at 260 x 6.
  - Speed trainer 250 → 254 (target 258).
  - Closing broken-chord root: duration equals the beats to the next bar line (a whole bar when it starts on one).
- **Sound = sight:** the player sounds `n.play ?? n.midi`. The sweeps confirm `tuning[s] + f === midi` and that the spelling's pitch class equals the played note for every note.
- **Samples and tuner:**
  - All 84 manifest files decode. The worst regular sample is −3.6 cents (MIDI 49).
  - `yin` on 96 synthetic tones: the right note every time, worst frame 2.63 cents (weak fundamental plus noise; same as round 3, `pitch.js` unchanged).
  - The tuner cannot open the microphone here, as expected.
- **Corrupt storage** (11 cases on `#/ex/lk-ii-v-i`, `sc-3nps`, `md-relative`, `arp-broken`, `#/` and `#/settings`): 0 errors, and no NaN or undefined anywhere. The cases:
  - garbage JSON;
  - wrong types (`strings: 7`, `maxFret: 3`, `bassVol: -5`, `notation: 'xx'`, `level: 0`);
  - the old sound keys;
  - `bassVol: 2.5`;
  - arrays where objects belong;
  - bad params (`oct: '3'`/`'all'`, `shape: 'broken9'`);
  - favourite junk;
  - negative plays.
- **Routes:** see m5. `#/m/nope` goes to Path. Bad query values fall back to the defaults. `?wu=999` opens the exercise without the routine. `#/library?l=99` and `?l=abc` work.
- **Monkey runs, seeds 51–58 (1,560 steps):**
  - 0 console errors, 0 NaN/undefined text, 0 bad BPM readouts or Settings percentages, 0 stuck states.
  - 0 ghost audio: Settings no longer sounds, and no notes are scheduled after leaving an exercise.
  - 0 h-scroll, no sheet or drawer without its close button.
  - The seed-53 "stay" run did not happen to pick the M1 keys.
- **Memory:**
  - 100 open/play/Options/chip/Info/close cycles over the new exercises: heap 10.4–15.1 MB, back to 10.0 MB after GC, DOM 108 nodes on every Settings sample, storage 1.1 KB.
  - 40 tuner/explorer cycles: flat.
  - 2 min of `arp-broken`, 7ths, 2 octaves, all keys at 240 BPM: heap 10.3–12.2 MB, DOM 3,817–3,826 nodes, step counter wrapping 684 → 0 normally.
- **Interrupts:** leaving during the count-in with Options open schedules no notes afterwards, the sheet does not survive, `in-ex` is cleared, and settings and progress (`lastBpm: 100`, params) are kept.
- **Layout:**
  - 780x360 (6 strings, left-handed, Do-Re-Mi, 24 frets), 640x300, 915x412 (4 strings, degree labels), 1024x768 (5 strings, left-handed), 844x390.
  - Screens: Home, Library, Settings, Tuner, Explorer at 24 frets, and `md-relative` / `sc-3nps` / `md-pitch-axis` / `arp-broken` on 2 octaves with Options and Info open.
  - No clipped text, no h-scroll, no control off-screen or under 32 px.
  - The only overlaps are the open sheet or drawer covering the page beneath, as before.
  - The longest badge, "Do♯ Melodic minor (= Re♭)", fits.
  - 360x780: Home, Library, Settings and Tuner have no h-scroll, and exercises show the rotate prompt.
- **Code review:**
  - `Player._layout` (fill), `walkLine`, `bestRoot`, the `Builder` plain/jazz/`curChord` code, `libraryScreen` history state, `route()` (scroll save, unknown-number toast), `store.js` and `audio.js` (fixed profile).
  - Nothing else found. Settings no longer returns a dispose, which is safe because `active?.dispose?.()` handles a missing one.
  - `MainActivity`: the delayed re-pushes are cleared in `onDestroy`.
