# QA deep report · d25bf3c · 2026-10-20
Summary: 0 critical, 2 major, 7 minor, 3 visual. Runs: monkey seeds 101 (330 steps), 102 (330), 103 (340) and "stay" runs 201–210 (10 x 90 steps on the new and changed exercises): 1,900 steps, about 13 min, 0 findings. Also: self-test (26,289 builds, 1,472,279 notes, problems 0); staff checker v2 over 35,615 builds (every exercise, subdivisions 0.25–6, 4/5/6 strings, staff sizes 8/6/5); line checker for walking/grooves/slap/harmony patterns over 36,585 builds (166,320 approach notes); key-signature table (168 scale x tonic pairs) and fit check (20,370 builds); harmonised shapes (64,128 builds sampled); a 3-minute run at 260 BPM on a 2,304-step exercise with staff on; 96 memory cycles; 14 corrupt-storage cases and 19 bad routes; layouts at 6 sizes. About 2.5 h.

Scope: ea7705f..d25bf3c (27e14eb staff notation and key signatures, e848c26 walking and groove lines, 11bb332 new-exercise fixes, d25bf3c fingering and small items).

Test setup: `qa` server opened as `http://127.0.0.1:8878` (191 exercises), service worker unregistered and caches cleared first, two tabs of my own (tab-7, tab-8). New scripts in `qa/tools/`: `engrave-check2.js` (the staff checker moved to TPQ 3360, with compound time, fill rests, circled ghost and open/filled diamond heads, seconds on both stem sides and accidental collisions), `walk-check.js` (line rules), `monkey7.js` (monkey6 plus a dispatched scroll event and a visible-strip check).

## Round-6 findings (ea7705f): status
| Round 6 | Status | Evidence |
|---|---|---|
| M1 swung licks with real triplets | fixed | Staff checker: 0 problems on `lk-ii-v-i` #2/#5, `lk-blues` #1, `lk-bass-solo` #0, `lk-bebop` #1 and every lick build at default feel. |
| M2 septuplets | fixed | `rh-polyrhythm` 7:4 and 5:4, `rh-pyramid` max 8: 0 problems; numbers "3", "5", "6", "7" (8 each in the pyramid). |
| M3 strip blank when scrolled | fixed | `gr-funk-changes` blues, all keys (43,838 px strip): after jumps to 8,000 / 20,000 / 35,000 / 49,000 px and a scroll event, 42–45 heads in view each time. Monkey strip-scroll checks: 0 findings. |
| M4 two-feel approach on the downbeat | fixed | `wk-two-feel` Rhythm changes: every one-note chord plays its root (0 of all builds). |
| M5 "5th approach" = root just played | fixed | 0 cases; e.g. `[F♯m7] F♯ F♯ F♯ A♯(→) [Bm7]`. |
| M6 approach at key changes | mostly fixed | 31 of 166,320 approaches still miss (minor m3). |
| m1 incomplete last bar | fixed at 1, 2, 4 notes per beat | Fill rests at 3, 5, 6 per beat have wrong values: new major M2. |
| m2 tuplet bracket over a beamed tuplet | fixed at 6 per beat | Still at 5 per beat: minor m1. |
| m3 × and ◊ half notes | fixed | Circled × (24 heads in `tech-ghost-16ths` at Half) and open diamonds (16 in `tech-harmonics`); values read back right. |
| m4 second in a down-stem chord | rule fixed | Problems left in cases no exercise produces yet: minor m2. |
| m5 whole-step approaches spelled as 3rds | fixed | 143 whole-step approaches (4-string, 12 keys + cycle), 0 misspelled. |
| m6 walking register leaps | fixed in single keys | Largest leap 7 in `wk-chord-tones` / `wk-two-feel` Rhythm changes. Enclosure floor fixed (E7 at E40). All-keys orders: minor m4. |
| m7 slap run span | fixed | 17,552 H/PO runs on 4/5/6 strings: all one string, all ≤ 3 frets. |
| m8 harmonised stretches / climbing | partly fixed | 0 three-notes-on-a-string at the default root string. Stretches are 10.9%, not the 2% the commit message gives. A fallback still puts three notes on one string: minor m6. |
| m9 ear 7th shapes | fixed | 2,880 answer chords: all R-5-7-10, strings ascending, span ≤ 3 frets ("Round N" badges). |
| m10 reading tritones | fixed | 0 tritone leaps in 900 builds (`rd-naturals`, `rd-accidentals`, `rd-melodies`, `rd-upper`, `rd-keys`). |
| m11 backing badge formats | fixed | "Am pent" → A C E; "B♭m pent" → B♭ D♭ F; "C major scale" → C E G. |
| m12 pentatonic option label | fixed | "1st: the most chord tones". |
| m13 parent name vs notes | partly fixed | "(= C♭)" is added. Respelled tensions still differ from the parent's name, by the logged decisions (not re-reported). |
| m14 G♭ progressions call the IV "B" | open | `progChords('I-IV-V-I', G♭)` = G♭ B D♭ G♭; `arp-upper-structure` in G♭ = C♭maj7. |
| V1 640x300 6-string neck | improved | `fb-all-octaves` 6-string: neck 88 px (was 63), staff 95 px. |

## Critical
None.

## Major

### M1. Staff repaints during playback block the main thread for 110–150 ms, and notes start late
- Where: `web/js/views/tabView.js:66-73` (new size search); the cost of `engraveStaff` per repaint.
- Steps:
  1. Strip on Staff, viewport 780x360.
  2. Open `#/ex/gr-funk-changes?prog=blues&key=chromatic` (2,304 steps) at 260 BPM and play.
- Actual:
  - Every repaint (every 221 steps, about 12.7 s) took 112–132 ms. A PerformanceObserver recorded long tasks of 127–146 ms at the same moments.
  - Over about 70 s, 4 notes were started late by 9, 18, 22 and 27 ms. I measured `when - currentTime < 0` at `AudioBufferSourceNode.start`. Each late note came right as a repaint ended (paint at 874,982 ms, late note at 875,095 ms).
  - Same run at 1024x768 (staff at full size, no shrinking): repaints 76–84 ms, long tasks 106–125 ms, 1 note late by 6 ms in 40 s.
- Cause:
  - The new search starts at size 8 on every repaint and re-engraves the whole exercise until it fits. `engraveStaff` lays out all steps even when it only draws the window.
  - One engrave of this exercise costs 31–35 ms. At 360 px height that is 3 engraves per repaint (8 → 7 → 6), at 390 px 2.
  - The scheduler looks ahead only 120 ms (`player.js` LOOKAHEAD). A task longer than that makes notes late.
- These are desktop numbers. A phone CPU is several times slower, so the delay will be audible.
- Fix ideas:
  - Remember the size per render: compute it once in `render()`, not in every `paint()`.
  - Cache the layout, which does not change between repaints, and only re-emit the window.
- Note: the previous report measured 74–95 ms per repaint offscreen but saw no long task live. This round shows real late notes, and the size search makes them worse on short screens.

### M2. Staff: the rests that complete the last bar have wrong values at 3, 5 and 6 notes per beat
- Where: `web/js/views/staff.js:207-209` (fill rests). `splitTies` cannot write a triplet remainder, and `asValue(t) || asValue(TPQ)` turns the leftover into a quarter rest.
- Steps: open `#/ex/sc-3nps` (default "3 triplets") with the strip on Staff and scroll to the end.
- Expected: the missing third note of the last triplet as a triplet 8th rest (1/3 beat).
- Actual:
  - Two triplet 8ths, then a 16th rest and a quarter rest. The last bar reads 4 7/12 beats.
  - Checker: "fill: 4200 ticks of rests, the loop needs 1120". Screenshot at 844x390 confirms.
- Scope:
  - At their defaults: `sc-3nps`, `tri-diatonic-inversions`, `tri-two-octaves` (3 triplets).
  - With other subdivisions: 3,039 of 12,640 builds at 3, 5 or 6 per beat.
  - Every other value the checker reads is right in all 35,615 builds.
- Fix idea: write the fill with the same tuplet logic as notes (rests inside the open tuplet up to the beat, then plain rests), or start the fill from the end of the last beat.

## Minor

### m1. Quintuplets: the fill note of a broken chord is a "quintuplet whole note" under a second "5"
`#/ex/arp-broken` (maj7, Broken) at "5 quint.":
- Beat 5 holds four quintuplet 16ths, then the fill note (3.2 beats) is written as a whole note.
- A "5" bracket spans the four beamed 16ths (which have their own "5") and the whole note.
- The values add up, but it reads as nonsense.
- 10 builds (`arp-broken`, `arp-7th` Broken shape) at 5 per beat. The same case at 6 per beat (old m2) is fixed.

### m2. Seconds in chords: the new rule leaves two collisions (seen only with test chords)
`staff.js:291` and `:295`. No exercise currently draws a visible second (the checker counted 0 in all sweeps; ear answers show "?"). Synthetic chords through `engraveStaff`:
- Stem down: an accidental is drawn on top of the displaced lower head. C♯–D♯, E♭–F and G♯–A each give an accidental at x 60.4 over a head at x 60.8. The accidental is placed at `x - 1.25 s` and the head is moved to `x - 1.2 s`.
- Three-note clusters (C D E): with stems down, C and D both move left, so two heads a step apart share one column. The convention alternates sides.
- Worth fixing before a double-stop or cluster exercise appears.

### m3. All 12 keys (chromatic order), 4-string: the approach into open E is an octave away
- Where: `common.js:434-439` (grooveLine).
- What happens: the target is E28 (open E). The half step below (D♯27) is under the lowest string, and the half step above (F29) repeats the F just played. The line then plays D♯39 and labels it "→" before E28, 11 semitones down.
- Example: `#/ex/gr-roots?style=pop8&key=chromatic`, steps 126–128: `[B♭] … F41 D♯39(→) [E] E28`.
- Scope: 31 of 166,320 approaches in 36,585 builds (4/5/6 strings). All of them are on a 4-string, in the chromatic order, at the key change into E: `gr-roots`, `gr-approach`, `gr-genres`, `gr-soul`.
- Fix idea: fall back to the whole step above (F♯29).

### m4. Walking, All 12 keys: leaps of 13–17 semitones at key changes
- The commit says "No leap over an octave remains in any walking exercise (0 of 30,288 notes)". That holds for single keys (0 in all builds).
- In the cycle and chromatic orders, 231 leaps over an octave remain in 10,233 builds (4/5/6 strings x max fret 17/20/24). They sit where each key's first root is fixed (`common.js:634`, `firstFixed`). Examples:
  - `wk-approach` ii–V–I, cycle of 4ths, 4-string: `G43(5) → F♯30(→)` (13);
  - `wk-scalar` ii–V–I, chromatic: `A♭44(5) → E28(R) [Em7]` (16);
  - 5-string `wk-mixed` chromatic: `F41(3) → D♯27(→)` (14).
- Per exercise on a 4-string: `wk-approach` 69, `wk-scalar` 36, `wk-chord-tones` / `wk-mixed` / `wk-two-per-bar` / `wk-triplet-skips` 6 each.

### m5. The fret-1 move (and the 10–12 notice) is missing in three triad drills
- The logged decision says one-octave scale and triad drills move a fret-1 root to the next string. `scaleBuild` and `arpBuild` do this (`sc-one-octave`, `tri-shape`; 141 moves seen, all shown as fixed).
- `tri-maj-min` (Level 1), `tri-four-types` and `tri-inversions` use their own `pickRoot` (`triads.js:163`, `:194`, `:425`) and do not:
  - `#/ex/tri-maj-min?key=5&root=E`: `[F] F s0f1/1 · A s0f5/4 · C s1f3/2`, frets 1→5 with fingers 1→4 on the E string, for a Level 1 player.
  - `tri-four-types` B♭ from the A string: `B♭ s1f1/1 · D s1f5/4`.
  - `tri-inversions` `?key=5&root=A`: starts on the E string at fret 1 with no "fixed" notice.
- More generally, these drills fall back to other strings with no notice: 325 builds start off the chosen root string without a "fixed" line.
- The same fret-1 root makes the harmonised B♭ major start `B♭ A1 / D A5 / F D3` (fingers 1-4-3) while frets 3–6 would fit (`tri-diatonic` B♭).

### m6. Harmonised inversions: three notes on one string when the bass note is the open low E
- Where: `triads.js:102`. `shapes()` excludes open strings (`lo: 1`), so a chord whose lowest note is E28 has no candidate. It falls back to `b.line()`, which puts the whole chord on the E string.
- Steps: Highest fret 17, 4-string, `#/ex/tri-diatonic?key=5&inversion=2&root=E&pattern=r535`.
- Actual: `[Am] E28 open · C36 fret 8 (finger 4) · A33 fret 5 (finger 1)`, all on the E string.
- Scope:
  - 30 of 360 builds in that family (F and G major, 2nd inversion, root on E).
  - About 2% of random option builds in `tri-diatonic*`, `arp-diatonic-7ths` and `arp-diatonic-inversions` (2nd and 3rd inversions).
  - 0 at the default root string.
- The commit says "never three notes on a string".
- Stretches: 10.9% of chords span five frets (58,368 chords; every key, scale and inversion at the default options, 4/5 strings). The commit gives 2%. 41 of the 49 stretches I sampled in `tri-diatonic` / `arp-diatonic-7ths` sit above fret 10, where they are fine.

### m7. Key signatures: several single-key scale exercises still write accidentals only
- The logged rule says "Single-key scales, modes and harmonised chords write their key signature", and 30 exercises now do (`sc-one-octave`, `sc-two-octaves`, `sc-sequences`, `md-relative`, `md-study`, `tri-diatonic*`, …).
- At their defaults these still have none:
  - `sc-positions`, `sc-pent-positions`, `sc-3nps`, `sc-one-string`, `tri-scale-forms`;
  - `iv-diatonic`, `iv-tenths`, `iv-scale-octaves`, `arp-extended`.
- So the same major scale shows a signature in "Your first scales" but six sharps written out in "The 7 positions" in F♯.
- The signatures that are written are right:
  - all 168 scale x tonic pairs match the textbook table;
  - in 6,350 single-key builds with a signature, only the expected notes differ from it (raised 6/7 in harmonic and melodic minor, ♭5 in blues, ♭6 in harmonic major).

### (open from round 6) m14 still stands: progressions in G♭ name the IV "B" (`G♭ B D♭ G♭`, Autumn `… G♭maj7 Bmaj7 …`), while `arp-upper-structure` writes C♭maj7.

## Visual

### V1. Tuplet numbers under down-stem beams sit on the label row
- Where: `staff.js:362` puts the number 1.9 spaces below a down-stem beam; the labels sit at `labelY = yOf(loStep) + 12` (`:228`).
- Measured (SVG bounding boxes, size 8 and 6, default options): 166 tuplet numbers overlap a label, in 20 exercises:
  - `tri-four-types` 16 of 16;
  - `tri-diatonic-all-keys` 46 of 96;
  - `tri-cycle-all-inversions` 19 of 36;
  - `tri-voice-led-cycle` 11 of 12;
  - `sc-3nps` 3 of 8;
  - `lk-bass-solo` 2 of 2.
- Live at 844x390 (`sc-3nps`, staff): "3" at 514,328 over the label "4" at 518,331; the screenshot shows the "3" printed over the "4".

### V2. Dynamics below the staff overlap the label row
- `#/ex/tech-dynamics`, strip on Staff, 844x390: the "pp" box spans y 321.6–335.2 and the label "D" under it spans y 331.2–344.
- All 11 marks overlap their label (size 8 and 6).
- `staff.js:403` places the mark at `max(bottom line + 1.9 s, labelY − 12)`, 12 px above the label baseline, but Georgia bold italic 12 px descends about 3 px.

### V3. 640x300: the staff shrinks to a 5 px staff space; some staves still exceed the cap
- With the new cap (30% of the height, 90 px), 90 of 382 default builds (4 and 6 strings) end at staff space 5 and 87 at 6.
- At staff space 5 the note heads are 7.8 x 6.7 px, while the labels stay 12.8 px tall.
- 7 builds still exceed 90 px at the smallest size (6-string `fb-landmarks`, `fb-find-note`, `fb-note-sweep`, `fb-all-octaves`, `tech-stretch`, `sc-positions`, `sc-pent-positions`: 92–94.5 px).
- The neck gained room (6-string `fb-all-octaves`: 88 px, was 63). This is a trade-off for the user to judge; reading a 5 px staff on a phone will be hard.

## Checked and fine
- **Self-test:** `problems: 0` (191 exercises, 26,289 builds, 1,472,279 notes).
- **Staff checker v2** (35,615 builds; subdivisions 0.25, 0.5, 1, 2, 3, 4, 5, 6; 4/5/6 strings; sizes 8/6/5). Apart from M2 and m1:
  - every written value adds up;
  - heads on the right line or space; ledger lines, 8va, accidentals by the bar rule against the key signature;
  - beams inside beat groups; tuplet numbers "3", "5", "6", "7" (sextuplets now "6");
  - 12/8 slow blues in dotted-quarter beats (12/8, beam groups of three 8ths, staff bar = 4 player beats).
- **Swing:** written triplets stay triplets; a long–short pair goes to the "&".
- **Implied chords:** all 300 "implies X" steps in `lk-implied` (7 licks x 4 keys x 2 feels) carry the implied chord, never together with a chord symbol; drawn in italics in parentheses.
- **Key signatures:** `keySigFor` matches the textbook for all 7 major modes, the minor family and the major-type scales on the 12 tonics the app picks.
- **Lines:**
  - approaches spelled as a step (whole steps 143/143);
  - the half-step approaches that keep their target's letter (121 of 27,610) are the chord-tone spelling rule (B♭ under B♭7);
  - two-feel single notes are roots;
  - 2-beat chord-tone bars are R–5 (809 take the 5th below);
  - 5th-approach fallback correct.
- **#143 pentatonic superimposition:**
  - vamp-min is Dorian (C♯m7: E, B, F♯ pentatonics);
  - labels match the spelled notes, apart from the altered-dominant names covered by the jazz decisions;
  - "B major pentatonic (= C♭)".
- **G7alt:** badge "G7alt"; pad G B F (no 5th) in the chord-scale, altered chord-scale and pentatonic drills.
- **#145:** every note lies in its named parent (all sets x 12 keys); "B melodic minor (= C♭)"; D♯m7♭5 in C♯ minor.
- **#110/#143/#145/#179:** written 8ths, every badge on a beat, every build whole bars.
- **#75 `tri-scale-forms`** (1,296 builds on 4/5/6 strings x max fret 17/24; now in Scales):
  - root under the named finger;
  - descent mirrors ascent;
  - the stretch form 1-3-4 | 1-3-4 | 2-3 as decided;
  - no fret over the maximum.
- **Small items:**
  - octave drill: sharps up, flats down, both notes spelled alike on all string pairs;
  - Level 1–2 warm-ups use only C G F D A E (300 seeds each); ranges, positions and strings stay at their defaults;
  - Settings "6-string (low B, high C)" wraps cleanly at 360 px.
- **Timing (logged Player):** 0 ms grid error and a 4-click count-in on `md-chord-scale` and `md-pentatonic-superimposition` at 260 BPM and the 12/8 blues at 200. In the 3-minute run, the loop wrap at 2,304 steps was seamless.
- **Memory:**
  - 96 cycles over 8 changed exercises (open, play, Options, Info, stop, leave): heap 18.6 MB at the start and 18.8 MB after idle (peaks up to 66 MB before collection); Home 330 nodes every time; 0 pad oscillators left; localStorage 9.8 KB flat.
  - 3 minutes of playback: heap 13.6–42 MB with no trend; DOM 1,356–2,235 nodes.
- **Storage and routes:**
  - 14 corrupt cases: garbage JSON, null, arrays, junk score/backing/label, `strings: 7` / `"6"`, `maxFret 3` / 99, `bassVol -5`, junk progress for the changed exercises, `lastBpm -40` / 9999;
  - 19 bad routes: `#/ex/nope`, `#/m/nope`, junk `lick`, `choice`, `form`, `set`, `style`, `key=99`, `pair=C`, `#/warmup/999`;
  - 0 errors, no NaN/undefined; invalid values fall back.
- **Interrupts:**
  - leaving during the 12/8 count-in schedules nothing and leaves no pad;
  - reloading during playback keeps settings and the last tempo.
- **Layout:** 780x360, 640x300, 915x412, 844x390 and 1024x768, with 4 and 6 strings, left-handed, Do-Re-Mi, staff and tab, on the changed exercises plus Library, Scales topic, Settings and Tuner. No clipped text, no horizontal scroll, no covered or overlapping controls, no target under 32 px, strip bottom = control bar top everywhere. 360x780 shows the rotate prompt.
- **Tuner and samples** (both unchanged):
  - `yin` through the tuner's own pipeline (decimate by 4, 8192 samples, median of 7 frames) on 8 synthetic tones (weak fundamental, noise up to 0.5, detune ±20 cents): worst median error 1.33 cents;
  - 84 sample files decode; 42 regular samples within ±5 cents (worst −3.59 at MIDI 49).
- **Code review:**
  - `staff.js` (TPQ, tuplets, swing, fill, heads, seconds, dynamics, implied);
  - `tabView.js` scroll repaint and size search;
  - `keyLines`, `stepSpell`, `grooveLine` / `walkLine` / `walkRegisters` changes, `keySigFor`, `modeFor` vamp;
  - ear `chordRound`, `scaleForm` stretch, the fret-1 rules, `emitMixed` span, `randomNotes`, `parseBadge`, `buildRoutine`.

  Beyond the findings above, two notes, both harmless:
  - the scroll listener and its 60 ms timer are never removed (the strip element is dropped with the screen);
  - `randomNotes` loops forever on a one-note pool (no pool that small exists).
