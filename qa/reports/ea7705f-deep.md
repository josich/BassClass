# QA deep report · ea7705f · 2026-10-20
Summary: 0 critical, 6 major, 14 minor, 1 visual. Runs: monkey seeds 81 (330 steps), 82 (340), 83 (330) and "stay" runs 84–91 (8 x 90 steps on the new and changed exercises): 1,720 steps, about 12 min, 0 findings. Also: self-test (26,289 builds, 1.48 M notes, problems 0); academic sweep v2 (177,519 builds, 6.88 M notes: every exercise x 4/5/6 strings x max fret 17/20/24); an independent staff-engraving checker over 14,037 builds (sub 0.5–6); 13,000+ targeted builds for walking/approach/harmonised/scale-form checks; 20 corrupt-storage and route cases; a 3-minute run at 260 BPM on a 2,304-step exercise; 60 memory cycles; layouts at 6 sizes. About 2 h.

Scope: 53a1753..ea7705f (9d0bf63, 8a2c272, 68ee5fb: round-5 fixes and the new staff engraving; dc5edc5: string choices follow the bass; 05b6276: #78 tri-scale-forms; ea7705f: #143, #145, #172, #173).

Test setup: `qa` server opened as `http://127.0.0.1:8878` (191 exercises), service worker unregistered and caches cleared first, two tabs of my own (tab-3, tab-5). New scripts in `qa/tools/`: `engrave-check.js` (reads every written value back from the staff SVG and checks it against the step lengths, pitches, accidentals, ledger lines, 8va, beams and signatures), `academic2.js` (sweep v2: minStrings-aware, plus slap, approach, walking, harmonised-shape, scale-form, ear, reading, backing and superimposition checks), `monkey6.js` (monkey5 plus a strip action and a strip-cursor check).

## Round-5 findings: status
| Round 5 | Status | Evidence |
|---|---|---|
| M1 pad burst on stop | fixed | `g.gain.value = 0` + `cancelAndHoldAtTime`. Offline replica of the calls: old code, stop 80 ms before a chord: peak 0.562; new code: 0 (stop before or at the chord), 0.088 while playing (normal 0.091). |
| M2 ear answers visible early | fixed | Strip, staff ("?" only, no heads, checker over every ear build) and Shape reveal (`exercise.js` skips silent steps). |
| M3 ear chords two notes on a string | fixed | 0 in the sweep; the self-test now checks it. Shapes still stretch (m9). |
| M4 `ear-progressions` names unplayed chords | fixed | All chords of the progression play. |
| M5 backing reads words as notes | fixed | No word badge parsed in 177k builds. Two badge formats still unread (m11). |
| M6 staff values | mostly fixed | 0 duration errors except swung triplets (M1) and septuplets (M2). |
| M7 slap H/PO | fixed | 0 H not going up, 0 PO not going down, 0 from another string, 0 pops on the thumb's string. Span rule: m7. |
| M8 neo-soul ♭7 on maj7 | fixed | Amaj7: G♯(7); m7 and 7 chords keep ♭7. |
| M9 country two-beat | fixed | Half notes R–5, pickup every other bar, across chords. |
| m1 diatonic tensions in G♭ | fixed | E♭m7 C♭(♭6), B♭m7 C♭(♭9). |
| m2 scalar loop approach | fixed | 0 unresolved approaches in single-key builds (see M6 for all-keys). |
| m3/m4 harmonic octave, ghost accidentals | fixed | Diamonds at sounding pitch; no accidental on × heads. |
| m5 strip freeze | fixed | Staff toggle on 2,304 steps: 41 ms (was 7.1 s); 3 min at 260 BPM: no long task. New side effect: M3. |
| m6, m7, m9, m10 texts, chips, muting, "Skip one note" | fixed | |
| m8 soul ballad approach | fixed | 0 repeats for chromatic approaches. The 5th approach still repeats (M5). |
| m11 pad headroom | changed (padBus 0.38) | Not re-measured live. |
| m12 Pages version | fixed | Pages stamps "web app". |
| V1 640x300 staff under the controls | fixed | Strip content bottom 254 px, control bar 255 px, on every tested exercise. Side effect: V1 below. |

## Critical
None.

## Major

### M1. Staff: swung licks write real triplets with the wrong values
- Where: `web/js/views/staff.js` `engraveStaff`, the swing mapping (`if (inst.swing) … Math.abs(fr - 2 / 3) < 1e-6 → fl + 0.5`).
- Cause: every step that starts on the last triplet of a beat is moved to the "&", including the 3rd note of a real 8th-note triplet. Licks that mix 8ths on the "&" (so swing applies) with triplets are affected.
- Steps: open `#/ex/lk-ii-v-i?lick=2` (default Feel = Swing 8ths), switch the strip to Staff.
- Expected: E F G as an 8th-note triplet (three beamed 8ths under "3").
- Actual: an 8th + a 16th beamed under "3", then a flagged 8th. Checker: step 2 written 80 ticks (expected 160), step 3 written 240 ticks (expected 160). Screenshot at 844x390 confirms.
- Affected (default feel): `lk-ii-v-i` #2 "Guide tones with triplets" (4 notes per pass) and #5 "Triad pairs, then altered triads" (16), `lk-blues` #1 "Blue-note triplet fill" (2), `lk-bass-solo` #0 "Two-feel to walking pickup" (4), `lk-bebop` #1 "Enclosure chain on the V7" (8).
- Fix idea: only move a 2/3 position when no step of that beat starts on 1/3 (or let the lick builder mark swung steps).

### M2. Staff: septuplets are written with impossible values
- Where: `staff.js` tuplet detection: `wpos` rounds 1/7 and 4/7 beats to whole ticks (68/69, 274/275), so `Number.isInteger(dur * n / p)` fails and `splitTies` falls back to `asValue(480)`.
- Steps: `#/ex/rh-polyrhythm?ratio=7:4` or `#/ex/rh-pyramid?max=8` (the 7-per-beat bar), Staff.
- Expected: 7 quarters under "7" (7:4); 7 notes per beat under "7".
- Actual: `rh-polyrhythm` 7:4: every note (274 ticks) is an 8th tied to a quarter (720 ticks). `rh-pyramid`: each 1/7-beat note (69 ticks) is a 32nd + a quarter (540 ticks), the next one a quarter (480); heads drift off their columns (step 85 head at x 4282.5, column at 4261.2).
- Fix idea: work in ticks divisible by 7 (e.g. TPQ 3360) or detect tuplets from the beat fraction before rounding.

### M3. Strip (tab and staff): bars outside the drawn window are blank when the user scrolls
- Where: `web/js/views/tabView.js` `paint()` draws only `[cursor − 1600, cursor + 4200]` px and repaints only from `setCurrent`. The strip is a scrollable element (`overflow-x: auto`) with no scroll listener.
- Steps: open `#/ex/gr-funk-changes?prog=blues&key=chromatic`, paused, swipe the strip to the right (I set `scrollLeft = 20000`).
- Expected: the notes of that part of the exercise, to read ahead.
- Actual: empty staff lines (or empty tab lines). DOM: 117 note heads, all at x ≤ 4,528 of a 50,091 px strip; 0 heads in the 844 px view. Tapping the blank area seeks there and repaints, so it recovers, but blind.
- Scope: 6 exercises at their defaults (e.g. `tri-rudiments-all-keys` 16,760 px, `sc-odd-groupings` 10,510 px) and 88 of 110 "All 12 keys" variants are wider than the drawn window.
- Fix idea: repaint on `scroll` (throttled) around the visible centre, or keep a lighter full-width layer (bar lines, clef) and fill the window on scroll.

### M4. Two-feel on Rhythm changes: the chord's only note is an approach note, not the root
- Where: `web/js/curriculum/common.js` `walkLine`, two-feel branch: with `halves = 1` (2-beat chords) the single note is the root, then `fixLast()` replaces it because the next chord has the same root.
- Steps: `#/ex/wk-two-feel?prog=rhythm-A&key=0`.
- Expected: a half note on each chord's root (C under Cmaj7, then C under C7).
- Actual: `[G7] G43 | [Cmaj7] B35(→) | [C7] C36(R) | [Fmaj7] E40(→) | [Fm7] F41(R)`. Cmaj7 and Fmaj7 get B and E labelled "→" on their downbeat.
- Scope: 114 of 4,626 chords in `wk-two-feel` (4/5/6 strings x all progressions x 8 keys), all on Rhythm changes, every key and the all-keys cycle. New with "Two-feel plays half notes" (round 5).
- Fix idea: skip `fixLast()` when the chord has a single note (or when that note is its root on beat 1); repeating a root across two chords is normal in two-feel.

### M5. "5th (dominant) approach" groove: the approach note is the root just played
- Where: `common.js` `grooveLine`: the round-5 rule "an approach is never the note just played" only covers `A`/`Ab`. The `D` token (the next chord's 5th) is not checked. In `walkLine` the same case is handled (`tok === 'D' && … === roots[ci]`).
- Steps: `#/ex/gr-approach?style=fifthApproach` (its usual progression is I–vi–ii–V).
- Expected: beat 4 leads into the next chord from its 5th, a note different from the bar's root.
- Actual (C): `[Cmaj7] C36 C36 C48 E40(→) [Am7] A33 A33 A45 A33(→) [Dm7] D38 D38 D50 D38(→) [G7] G43 G43 G55 G43(→)`. In every move by a 4th (vi→ii, ii→V, V→I) the next chord's 5th is the current root, so 3 of 4 bars play R R 8 R and label the last root "→". Sweep: 324 builds flagged, all `fifthApproach`.
- Fix idea: apply the walkLine rule in grooveLine (fall back to a chromatic approach when `D` equals the current root).

### M6. "All 12 keys": at every key change the approach note leads to the wrong chord
- Where: `grooves.js` `walkEx` and `grooveEx` build one line per key (`for (const k of keysFor(p.key)) walkLine(…)` / `grooveLine(…)`). Each key's last approach targets that key's own first chord, but the next key's first chord follows. Present since the initial commit; not in earlier reports.
- Steps: `#/ex/wk-scalar?prog=autumn&key=cycle4`, or `#/ex/gr-approach?key=cycle4`.
- Actual: `[Am7] A33 B35 C36 C♯37(→) [Gm7] G31` (C♯ aims at D, the next key starts on G: a tritone). `gr-approach`: `B35(→) → [F] F29`, `E28(→) → [B♭] B♭34`, `A33(→) → [E♭] E♭39`.
- Scope: in single keys 0 unresolved approaches; in the cycle 11–12 per loop: `gr-approach` 156 of 816 approaches, `gr-genres` 156/408, `wk-approach` 96/828, `wk-enclosures` 97/828, `wk-mixed`/`wk-two-per-bar`/`wk-triplet-skips` 84/660, `wk-scalar` 48/516, `wk-minor` 36/156, `wk-two-feel` 24/252 (4-string, all progressions).
- Fix idea: pass the next key's first chord (and its root MIDI) to the last chord of each key.

## Minor

### m1. Staff: an incomplete last bar in 42 exercises
The player rounds the loop up to whole bars (`player.js` `_layout`: `total = ceil(b / bpb) * bpb`) and rests to the bar line, but the staff ends with a short final bar and no rest. Defaults: e.g. `sc-one-octave` 15 beats (loop 16), `tri-qualities` 3.5 (4), `arp-7th` 2.25 (4), `sc-chromatic` 24.5 (28), `md-parallel` 52.5 (56). 42 of 191 exercises at their defaults.

### m2. Staff: a tuplet bracket over a beamed tuplet (fill notes after sextuplets)
`#/ex/arp-broken` at "6 sext.": beat 3 holds 4 sextuplet 16ths, then the fill note (2/3 + 1 beat) is a triplet half note. The 16ths get their own "3" and a bracket "3" also spans them and the fill note (`staff.js` tuplet span: same n, `span.sum` reaches a beat only after the fill). Durations add up; the reading is confusing (a lone triplet half note starting off the beat).

### m3. Staff: × and ◊ heads do not show half notes
Ghost notes are always a × with a stem and harmonics an open diamond with a stem, so a half note and a quarter look the same. Seen at subdivision "Half" in `tech-ghost-16ths` and `tech-harmonics` (checker reads 480 ticks for 960).

### m4. Staff: a second in a down-stem chord puts the upper head on the left
`staff.js`: `hx = clash ? x + (up ? 1.2 : -1.2) * s : x`. The convention keeps the upper note of a second on the right in both directions. Only seen in `ear-sevenths` m6 answer shapes (G B♭ D E, D–E).

### m5. Whole-step approach notes spelled as diminished 3rds
`walkLine` spells the substitute approach with flats unless it is the half step below (`spellMidi(m, m !== nextMidi - 1)`), so a whole step above E is G♭, above B is D♭, above F♯ is A♭. 1,376 of 2,427 whole-step approaches (4/5/6 strings, 12 keys); the plain-spelling decision covers about 350 of them (C above A♯, F above D♯). The rest read as 3rds: G♭→E 212, D♭→B 232, A♭→F♯ 195, B♭→G♯ 195, E♭→C♯ 189. Mostly `wk-enclosures` (1,097) and `arp-approach` (252). Pre-existing.

### m6. Walking registers: leaps the whole-line choice does not see
- `walkRegisters` plans 2-beat chords with the cell's last tone, but they play R + 5 (or only R in two-feel):
  - `wk-chord-tones` Rhythm changes: `[Dm7] D38 A45 [G7] G31`, a 14-semitone leap (426 builds);
  - `wk-two-feel` Rhythm changes: `[Cmaj7] C36 [A7] A45` (9 semitones, planned from a G43 that never plays).
- Enclosures: the walkEx floor that kept targets off the lowest note (`lo = tuning[0] + 2`) is overridden by `walkRegisters`. In A minor blues on a 4-string, E7 lands on open E (E28) and the enclosure becomes G♭30 → E♭39 → E28 (+9, −11).

### m7. Slap: a hammer/pull-off run may span five frets
`emitMixed` accepts a run when `max − min <= 4` (frets 1–5). The rule says one four-fret hand position. Seen in 346 builds of `sl-advanced` "Pop fill": pull-offs 5 → 3 → 1 on one string, fingers 4-3-1.

### m8. Harmonised triads/7ths: frequent five-fret stretches and climbing shapes
- `diatonicBuild` uses `shapes(…, { maxSpan: 4 })`, so 55,641 of 234,036 chords (24%) span 4 frets (five frets, fingers 1 and 4).
- The score prefers that stretch over a compact one-per-string shape nearby. `tri-diatonic` D♭, 1st inversion: `[E♭m] G♭ D4 / B♭ D8 / E♭ G8` with fingers 1-4-4, while A9-D8-G8 fits in two frets.
- First inversions climb the neck: D♭ reaches `[C°]` at frets 13–17, then jumps back to frets 3–6. 3,242 chord-to-chord moves of 7–11 frets. The decision says "near the starting position".
- 4 builds still put three notes on one string: `arp-diatonic-inversions`, A harmonic/melodic minor, max fret 17, G string frets 13/16/17.

### m9. Ear training: 7th-chord answer shapes stretch 5–6 frets
`shapeFor` accepts `maxSpan` 5 and 6. On a 4-string, 316 builds of `ear-sevenths` hold a 5- or 6-fret block chord (°7: R f, ♭3 f−2, ♭5 f−4, ♭♭7 f−6). One note per string, but hard to hold.

### m10. Reading: the random-note drills still leap a tritone
The tritone filter is only in `melody()`. `rd-naturals` and `rd-accidentals` (`randomNotes`) still give F–B leaps: 41 in the sweep (e.g. 29 → 35, 32 → 38).

### m11. Backing: two badge formats still play nothing
- `sc-pent-sidestep` "Am pent" / "B♭m pent": the whole exercise has no backing.
- `hm-build-a-chord` "C major scale" (`SCALE_NAMES` has no "major scale").

### m12. Pentatonic superimposition: "1st: holds the 3rd and 7th" is not true over dominants
- Over G7 the 1st choice is G major pentatonic (G A B D E: no F). Over C7 it is C pentatonic (no B♭).
- The ranking is right; the option label is not.

### m13. Melodic-minor superimposition: parent named in sharps, notes written in flats
- Key D♭, `all` set: "D♭7sus♭9 [B melodic minor]" plays C♭ B♭ A♭ G♭ E D D♭, which reads like no B melodic minor. Also "D♭7alt [D melodic minor]" plays D D♭ C♭ A G F E.
- Each spelling follows a decision. Together the name and the notes disagree on the page.

### m14. Progressions in G♭ call the IV "B"
- `progChords` in G♭: I–IV–V–I = G♭ B D♭ G♭; Autumn = … G♭maj7 Bmaj7 … (its Lydian ♯4 shown as E♯).
- `arp-upper-structure` in G♭ shows C♭maj7, and the spelling decision says "C♭ is the IV of G♭ major".
- One of the two is inconsistent. Pre-existing.

## Visual

### V1. 640x300 with 6 strings and the staff: the neck is too small to read
- After the round-5 fix (`.exv-board { min-height: 78px }` at heights ≤ 330 px), `fb-all-octaves` on 6 strings at 640x300 has a 63 px fretboard SVG.
- The strings are about 7 px apart, the 18 px dots cover two or three strings, and the string names on the side are squeezed.
- With 4 strings the board is 101–129 px and fine. The staff is fully visible in all cases.

## Notes (not findings)
- Shuffle grooves (`gr-blues` shuffle, `rh-shuffle`) are written as triplets (quarter + 8th under "3"), while licks write swing as straight 8ths under "Swing". Both read correctly; the notation decision mentions only the second.
- Sextuplets are written as six 16ths under one "3" (correct as a ratio; "6" is the usual label).
- "Root on: G string" on a 6-string leaves one string above. `tri-shape` C from G5 runs C4 → C7 → C12 on the C string, with finger 4 sliding 5 frets. It is the same situation as the 4-string D string. By the decision this is intended.
- Engraving speed: each window repaint costs 74–95 ms in an off-screen benchmark (13 repaints over 2,304 steps). During 3 minutes of real playback at 260 BPM no long task (> 50 ms) was recorded. On a slow phone this could approach the scheduler's 120 ms lookahead (not measured).
- `lk-implied`: "implies X" is only in the readout above the neck, not in the strip, so the implied chords cannot be seen ahead.

## Checked and fine
- **Self-test:** `problems: 0` (191 exercises, 26,289 builds, 1,481,585 notes), now including "two notes on one string".
- **Academic sweep v2** (177,519 builds, 6.88 M notes, 4/5/6 strings x 17/20/24, minStrings options only on their basses). No:
  - spelling that differs from the pitch;
  - string/fret that differs from the MIDI note;
  - fret outside 0–24;
  - over-max fret without the notice;
  - double stop wider than 4 frets (apart from ear shapes, m9);
  - finger outside 0–4 (harmonics take finger 0 by design);
  - written-rhythm bars that do not sum to whole bars.

  Labels match the badge root everywhere, apart from the slash-chord, tumbao and samba anticipations explained before.
- **Staff engraving** (independent checker, 14,037 builds, sub 0.5–6). Apart from M1, M2, m1–m3:
  - every step's written values sum to its length;
  - no piece crosses a bar line;
  - every head is on the right line or space (written an octave up, diamonds at sounding pitch);
  - ledger lines exactly as needed;
  - 8va over every note above written C5 and over no other note;
  - accidentals held to the bar line, with naturals, and none on × heads;
  - beams never cross a beat or group (7/8 2+2+3 and 3+2+2, 6/8 dotted quarters);
  - key-signature glyphs in the standard places for all keys;
  - time signatures 4/4, 5/4, 6/8, 7/8, 7/4;
  - hidden ear steps show "?" and no head.

  Compact staff (s = 7) below 340 px height.
- **New exercises:**
  - `tri-scale-forms`:
    - the root is under the named finger;
    - one finger per fret, strings never go back, and the descent mirrors the ascent;
    - shifts match the text: major f2 0, f1/f4 1; minor f1 0, f2 1, f4 0 with four strings, 1 from the A string on a 4-string;
    - the relocation note is right ("E string (on the A string the forms would start at fret 15)").
  - `md-pentatonic-superimposition`: 94,176 notes, all inside the named pentatonic. Dm7 F/C/G, G7 G/F/C, G7♯9 D♭ only, Cmaj7 G/C/F.
  - `md-melodic-superimposition`: 44,928 notes, all inside the parent melodic minor. The parents match the summary (A♭ over G7alt, D over G7♯11, F over Dm7♭5), and the labels match the chord root.
  - `lk-implied`:
    - the backing pad keeps the vamp (one pad at step 0 and at the loop);
    - the labels follow the implied chord;
    - the key chips switch to Cm/C♯m for the minor licks.
  - `lk-motif`: pushed notes carry the next chord's badge and label; bars sum to 4.
- **Round-5 content:**
  - grooves:
    - country half notes with a pickup every other bar;
    - samba anticipations;
    - neo-soul 7 by chord quality;
    - gallop octave;
    - two-bar patterns alternate across chords;
  - slap tag counts match the patterns (`ghostFunk` 1,005 PO of 1,008; `popFill` 2,792 of 3,024 PO kept, the rest plucked);
  - ear answers: 360 checked, root and quality match the hidden chord;
  - reading: `label: 'none'`, no prompt, melodies without tritones;
  - B and C string options: 82 options; no default needs more strings; stored or routed values (`root=G`, `string=C`, `pair=B`, `root=D`) fall back on a 4-string, with no errors.
- **Timing (logged Player):** 0 ms grid error on `lk-implied` 260, `lk-motif` 240 (swing), `rh-polyrhythm` 7:4 200, `gr-odd-meters` 7/8 260 (count-in 7 clicks), `tri-scale-forms` 260 x 6; the loop is seamless.
- **Storage and routes:** 20 cases with 0 errors and no NaN or undefined:
  - garbage JSON, `null`, `strings: 7`, `strings: "6"`, `maxFret: 3` and 99, `score`/`backing`/`label`/`reveal` junk, `bassVol: -5`;
  - junk params for the new exercises, `lick=99`, `set=zzz`, `choice=7`;
  - `#/ex/nope`, `#/m/nope`, `#/warmup/999`.
- **Interrupts:** leaving during the count-in or during playback with Options open schedules no note and leaves no pad oscillator running; `in-ex` is cleared.
- **Memory:**
  - 3 minutes at 260 BPM on 2,304 steps (with the loop wrap): heap 13.0–13.9 MB, DOM 1,525–1,856, 0 animations, no long tasks;
  - 60 open/play/options/info/staff/backing/close cycles: heap 18–28 MB with no trend, Home 134 nodes every time, localStorage 1.1 KB.
- **Layout:** 844x390, 780x360, 640x300, 1024x768 on the new exercises plus Home/Library/Settings/Tuner/Path: no clipped text, no h-scroll, no covered or overlapping controls, no target under 32 px, and strip content above the control bar. At 360x780 the rotate prompt shows.
- **Tuner:** `yin` spot check on 6 synthetic tones (weak fundamental, noise, detune): worst 0.09 cents. `pitch.js`, the samples, `player.js`, `store.js` and `fretboard.js` are unchanged since 53a1753.
- **Code review:**
  - `staff.js`, the windowed `tabView.js`, `harmony.js` parseBadge/padSemis;
  - `audio.js` padSet/padStop;
  - `grooveLine` across chords, `emitMixed` H/PO/pop rules, `walkRegisters`/`mirrorCell`/`modeFor`, `diatonicBuild` shapes, `scaleForm`, `ear.js` shapeFor, `reading.js` melody;
  - `paramOptions` minStrings, `keySpelling` minorWhen, `selftest` combos, pages.yml.

  Nothing beyond the findings above. Chord text in the SVG is not escaped (`&` in "Beats 1 & 3" is fine in HTML parsing; no `<` occurs).
