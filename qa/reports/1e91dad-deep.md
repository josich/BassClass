# QA deep report · 1e91dad · 2026-10-22
Summary: 0 critical, 2 major, 8 minor, 2 visual.

Runs:
- Monkey: seeds 1301–1304, 1,330 steps, about 12 min of taps.
  - 1301: 330 steps, 640x300, 4-string. Settings changed mid-run.
  - 1302: 340 steps, 780x360, 5-string.
  - 1303: 340 steps, 844x390, 6-string, left-handed, Do-Re-Mi, finger labels, highest fret 24.
  - 1304: 320 steps, 915x412, 4-string, highest fret 17, Backing on Chords. Targeted: 97 teleports to this round's features.
- Self-test.
- Old-against-new comparison of every course step on the changed modules. The 92ce1df modules were loaded as blob modules in the same page.
- Make Music checker: 810 builds, 54,711 notes.
- Checks against known answers:
  - upper structures: 1,296 builds;
  - triad inversions: 2,160 builds;
  - double thumbing: 540 builds.
- A finger scan of every exercise, compared against a copy of `builder.js` without the new pass.
- Course progress simulations: pre-bbb984b records, a Stage 5 graduate, the course complete, a checkpoint passed first.
- Timing with a logged `Player`.
- Samples and yin.
- Corrupt storage and bad routes.
- Memory: 60 cycles, plus 3.3 min of continuous play.
- Layouts at 6 sizes.

About 2.5 h. Scope: 4c593d9..1e91dad (92ce1df pick strokes ⊓/V, 1e91dad round-12 fixes).

Test setup:
- `qa` server on `http://localhost:8878`. I unregistered the service worker and cleared the caches first.
- My own tab only: tab-5.
- The MessageChannel timer wheel (`__fastSrc`) was installed before the first real Play.
- Tools for this round: `qa/tools/monkey13.js`, `qa/tools/checks13.js`, `qa/tools/fill13.py`.

## Critical
None.

## Major

### M1. CHANGED_STEPS rev 5 reopens five checkpoints and tests for anyone who passed them with the Make Music steps. My level drops to L1 and Continue goes back to Stage 1
- Where: `web/js/course/progress.js:43` (rev 5, no `at`), `isComplete` (:157) and `firstGap`/`open` (:237). `addedLater` applies only to `kind: 'lesson'`, so a reopened checkpoint or test is a gap.
- Steps:
  1. Store a player who finished the whole course on 979b791–92ce1df. Every step is ✓ Clean, every "I can" is ticked, and every record has `n`/`c` equal to the current counts. Use `rev: 4`.
  2. Reload.
- Expected:
  - The changed song steps ask to be played again.
  - The player stays at Level 6, and the reviews keep coming.
- Actual:
  - `u-scales-check`, `s1-test`, `s2-test`, `u-time4-check` and `s6-test` are `started`.
  - `firstGap()` = `continueLesson()` = `u-scales-check`, and `playerLevel()` = 1.
  - Home reads "My level L1 · ▶ Continue · Checkpoint: Your first scales".
  - The session plans "Seven Nation Army style · Checkpoint · 3/3" and "Smells Like Teen Spirit style · Stage test · 7/7".
  - The five lessons leave the review cycle (`isDue` needs `isComplete`).
- Who is hit: only players who completed one of these five after Make Music shipped (979b791, about two hours before 1e91dad).
  - Players with older records keep their level. Their `n` (or the COUNTS_V143 fill) stops before the appended music step.
  - The mechanism is general: any future rev that names a checkpoint or test step will send graduates back to that stage. This is the same symptom as round-12 M1, this time by design.
- Decision for the user. Options:
  - let a step dropped by CHANGED_STEPS reopen only that step, not the lesson's completion;
  - or let `firstGap` skip checkpoints and tests whose only open steps are changed `music` steps;
  - or ship rev 5 with an `at`.
- Evidence: the store described above, read through `P.status`, `P.firstGap()` and `C.playerLevel()`, and the Home DOM text.

### M2. The new "a note played again keeps its finger" rule contradicts the rest of the chord: wrong finger numbers in course lessons
- Where: `web/js/builder.js:224-231`.
  - The pass runs after `chordFingers`. It copies the finger of the previous note onto a repeated note even when that note starts a new chord (a new mode, interval or progression chord).
  - The rest of that chord is fingered in another hand position.
- Evidence: the same exercises built with a copy of `builder.js` without the pass (blob modules). Old → new:

  | Exercise (course step) | Old | New |
  |---|---|---|
  | md-parallel, `dir: bright` (parallel-modes.0; also u-modes-check.0) | `[A Dorian] A@E5 f4, B@A2 f1, C@A3 f2, D@A5 f4` | `A@E5 f2`: finger 2 on fret 5, then finger 1 on fret 2 one string up |
  | same, A Aeolian | `[A Aeolian] A@E5 f1, B@E7 f3, C@E8 f4` | `A@E5 f4`, giving 4-3-4 on frets 5-7-8 of one string |
  | iv-moving, minor 2nds on the E string | `[G♭] G♭@E2 f1, A♭♭@E3 f2` | `G♭ f2, A♭♭ f2`: the same finger on two adjacent frets, in every pair |
  | tech-pim, canon | `[Em] E@A7 f1, B@D9 f3, E@G9 f3 … E@A7 f1` | `E@A7 f3` at the start of Em, `f1` later in the same chord |
  | arp-dim-dominants, key F | `[B♭7] F@A8 f3`, then A♭@D6 f1 | `F@A8 f2` |

- How often (`__repeatFinger`, 4-string, every option):
  - md-parallel: 15 of 17 builds;
  - arp-dim-dominants: 6 of 13;
  - iv-moving: 1 of 21;
  - tech-pim: 1 of 17.
- Course steps hit:
  - parallel-modes.0 and u-modes-check.0: 2 chords each, 4-string;
  - hear-progressions.0: 6-string, `B♭@E6 f1` before an F/G/E♭ chord fingered from position 3.
- CLAUDE.md:
  - "one finger per fret from the index";
  - "A chord whose notes fit one hand position is never labelled with a shift inside it".

  The round-12 rule now overrides these at every chord change that starts on a repeated note.
- Fix idea: keep the finger only inside one chord segment. Or, at a chord boundary, let the repeated note take the finger the new chord's fingering gives it, so the shift happens on the repeat.

## Minor

### m1. Lesson 38.4 step 3 (`sweeps.2`) changed notes in 1e91dad but is not in CHANGED_STEPS
- tech-sweep `{shape: spread, hand: fingers, prog: I-V-vi-IV}`: the E and F♯m chords moved up an octave on 4, 5 and 6 strings.
  - Old: `[E] E1@E0 B1@A2 E2@D2 G♯2@G1`, `[F♯m] F♯1@E2 …`.
  - New: `[E] E2@E12 B2@A14 E3@D14 G♯3@G13`, `[F♯m] F♯2@E14 C♯3@A16 …`.
- Cause: the open-string cost (`technique.js:695`).
- Every other course step's notes either match 92ce1df or are listed in rev 5. Position-only changes, which need no entry: dust, sunshine, jean, flyaway, criminal, schism, duke, cantstop, hysteria, whatsgoingon, deantown, teentown, yyz, solo-piece.
- CLAUDE.md: "a released step whose notes change goes into CHANGED_STEPS". A ✓ Clean ticked on the old octave still counts.

### m2. Double thumbing (`sl-double-thumb`): the up-stroke sits on another string than the down-stroke before it in 6 of 60 builds on 4- and 5-string basses
- Keys C, D♭, F and G♭ with I-IV-V-I or blues. 6-string is clean.
- Example, key C, I-IV-V-I, 4-string: `… E♭@E11<T⊓> E♭@A6<TV> F@A8<H>`.
  - The down-stroke is on the E string at fret 11.
  - The up-stroke and the hammer-on are on the A string at fret 6.
- CLAUDE.md (round 12): "an up-stroke is always on the string of the down-stroke before it".
- The Make Music studies (Classical Thump) are clean. The course step (key E, vamp) is clean.

### m3. Upper structures: six headers name the triad C♭ or F♭
- Where: `triads.js` `upRoot = T.up(bass, u.iv)`. It falls back to the plain name only for double accidentals.
- The six headers (4-string, highest fret 20):

  | Structure, lower chord | Header | Note labels |
  |---|---|---|
  | ♭VI/7, E♭7 | C♭/E♭ | |
  | ♭VI/7, A♭7 | F♭/A♭ | |
  | ♭III/7, D♭7 | F♭/D♭ | F♭ "♯9" |
  | ♭III/7, A♭7 | C♭/A♭ | C♭ "♯9" |
  | ♭V/7, F7 | C♭/F | C♭ "♯11", G♭ "♭9" |
  | ♭V/7, B♭7 | F♭/B♭ | F♭ "♯11", C♭ "♭9" |

- CLAUDE.md: "Keys and chords chosen on their own get lead-sheet names: never B♯, E♯, C♭ or F♭". On a dominant, the ♯9/♯11 are written the plain way. E/D♭7 or B/F7 would read as expected.
- Everything else from round-12 M2 is fixed (`__upper13`, 1,296 builds):
  - every header root is the interval above the bass;
  - 0 chord tones of the lower chord spelled from the triad.

### m4. `addedLater` hides every unfinished lesson of a passed unit, not only lessons added later
- Where: `progress.js:232`.
- Steps:
  1. Start as a new player.
  2. Pass the first checkpoint (`u-hands-check`) directly.
- Actual:
  - Continue goes to Lesson 2.1. Lessons 1.1–1.4 stay "new" on the map, and neither Continue nor the session brings them.
  - The same would happen to a lesson in a passed unit that a future CHANGED_STEPS entry reopens.
- This may be acceptable as "testing out", but CLAUDE.md describes it only for lessons added to a unit.

### m5. After the course, sessions give Schism and YYZ `part: 'all'`, which they do not have
- Where: `course.js:208`.
- 32 of 200 planned study items (160 plans) were Schism or YYZ.
- The exercise screen falls back to the first part. "YYZ style · Library · L6" opens "Intro in 5/4", not a whole tune. No error.
- Every 15-minute plan after the course is 1 review and 1 study. `Math.max(1, …)` gives "one in four fill-ins" a minimum of one. This may be intended.

### m6. "Mark as mastered" in a lesson step writes the exercise's best tempo
- Where: `exercise.js:578`. Pre-existing, not from this round.
- Monkey seed 1302:
  - step 125: rh-16th-grid, `ls=u-funk-check.0`, `bestBpm: undefined → 100`;
  - step 172: arp-extended, `ls=extended.1`, `→ 56`.
- CLAUDE.md: "Lesson steps do not change the exercise's saved options, tempo, subdivision or best tempo". It is an explicit tap, so a decision for the user.
- (The harness's other "lesson-write" notes are `plays: undefined → 0`: the record created on open. Harmless.)

### m7. Tommy the Cat: the chromatic D♯ that resolves to the open E an octave lower is labelled ♯11
- `[A7] C♯2(3) D2(11) D♯2(♯11)`, then E1 (the next bar, or the loop).
- The approach rule needs the next note exactly a half step away (`songs.js:127`). An octave-displaced resolution reads as a tension.
- The round-12 m2 cases are fixed: Fly Away's C♯ and B are now "→", What's Going On's F is "→", and the blue ♭5 is kept only when spelled.

### m8. The ⊓ character is still written as text outside the board and the strip (suspicion, not confirmed on a phone)
- Where it appears:
  - the tech-sweep option label "Pick (⊓ up the strings, V down)";
  - the tech-sweep, gr-pick and sl-double-thumb summaries and about texts;
  - the double-thumb style name "Double thumb (down T⊓ / up TV)";
  - the Blitz and Classical Thump tips;
  - the sweeps lesson concept and step text (s5.js:60, 64).
- CLAUDE.md draws ⊓ on the board and the strip "since phone fonts may lack the character". If the font lacks it, these texts show a missing-glyph box.

## Visual

### V1. Portrait Home (360x780): the session tags squeeze the titles to 28–61 px
- 8 of 15 titles are cut after the new 3-line clamp.
- The tag is `nowrap` and now carries option words. In a 232 px row it takes up to 139 px: "Lesson 38.3 · 3 over 2 beats", "Lesson 38.2 · I – vi – IV – V".
- Title widths left: Polyrhythms 28 px, p-i-m 35 px, Permutations 61 px.
- Landscape is fine (640x300: titles 310–459 px, none cut).
- Low priority (the app is landscape).

### V2. A cut variant chip keeps a space before the ellipsis
- "R-5-7-10 7th … · Pick" (Lesson 38.4). `cut()` slices before trimming. Cosmetic.

## Checked and fine
- **Self-test:** `problems: 0`. 223 exercises, 244 lessons, 27,941 builds, 1,602,654 notes. The note count is lower because the studies now default to their first part.
- **Round-12 Majors:**
  - M1 fixed. A Stage 1–2 player with pre-bbb984b records (no `n`) stays done:
    - Level 3, Continue on 17.1;
    - counts filled and stored at once;
    - `fill13.py`: 0 reopenings for records written at 91ad82b, f060af0, 626f29c, 8aa8df6, 341ccfe or 8758db5. Many table counts are lower than what the record covered, which is the safe direction.
  - M2 fixed except m3 above.
  - M3 fixed:
    - 0 same-string jumps of 10+ frets in 810 song builds (92ce1df: 24 on 4-string at fret 20 alone);
    - 0 hand moves of 5+ frets within a beat (92ce1df: 9);
    - Zombie chorus `E2@D2`.
- **Round-12 Minors:**
  - m1: a Stage 5 graduate missing 38.4 is Level 6 and continues at 50.1.
  - m3: a second visit with "All yes" on Stage 3 fills Stages 1–3.
  - m4: corrupt or old folds add the player's level or stage and store `libAt`/`mapAt`.
  - m5: the toasts read "No backing in technique drills" (tech-sweep) and "No chords in this exercise" (reading).
  - m6: 0 duplicate chips on any lesson page; 18 chips cut.
  - m7: inversions in one position span 3–4 frets in all 2,160 builds.
  - m8: 0 upper structures below a 5th above the bass; 16 builds use an inversion at frets 17/20.
  - m9: "make music" finds 31, "nirvana", "1991", "ramones 1976" and "metallica" (Anesthesia) all find their studies.
- **Make Music engine** (`__songs13`):
  - 0 H/PO on another string or in the wrong direction.
  - 0 TV on another string, and the thumb strokes alternate (Classical Thump).
  - 0 labels that disagree with their spelled interval (9/11/13, ♭9/♯9, ♯11, ♭5).
  - Every "→" is a half step from the next sounding note.
  - Frets ≤ highest; fingers 0–4.
  - Old against new labels reviewed by hand: Pulse C♯→D "→", Fly Away "→", dominants 9/11/13, Teen Town G♭ going down.
  - Power chords: `F5` parses as `pow`. The Backing plays root, 5th and octave (F3 C4 F4); "Pos 5" and "E5 string" stay null.
- **Course steps against 92ce1df:** every note change is in rev 5 except m1. Tommy, Zombie, Pulse, Standby, Blitz, Pressure, Together, Longview, Chain and Goodtimes are identical.
- **Timing** (logged `Player`): 0.000 ms grid error, a one-bar count-in (7 clicks in 7/4) and seamless loops for:
  - Stomp riff, Thump 16ths, Spirit chorus and Money middle at 260 BPM;
  - sweep fingers in sextuplets at 260 BPM.

  The speed trainer goes 250 → 254 → 258 → 260 and stays.
- **Tapping:** RH fingers i, m, a in fret order (9 i, 10 m, 12 a).
- **Samples:** 84 files decode. The 42 regular samples are within ±3.6 cents.
- **yin:** 96 synthetic tones, 94 within ±2 cents (worst 2.6, in the noise cases). `pitch.js` is unchanged.
- **Theory:** 15 keys × major, natural, harmonic and melodic minor, each with 7 letters and the right intervals.
- **Monkey** (1,330 steps):
  - 0 app errors, NaN/undefined text, stuck players, horizontal scroll, extra tips or bubbles, listener growth, ghost audio or pads.
  - 0 findings from the round-13 watcher: folds, `libAt`/`mapAt`, tab marks, the optional chip, chips and toasts.
  - The depth notes come from Chrome's 50-entry history cap (index 49).
- **Corrupt storage and routes:** 0 errors, and every screen renders with:
  - `libAt`/`mapAt` set to "x", 7, 3.5, [2], {}, −1, true or "2";
  - `libOpen` set to "abc", [9] or [3,1,1];
  - garbage settings JSON, or wrong types everywhere;
  - `#/ex/mm-schism?part=all`, `mm-spirit?part=9`, `mm-thump?part=-1`, `mm-yyz?part=1.5`;
  - `tri-upper-structures?us=zzz&key=99`, `tri-inversions?root=C`, `tech-sweep?shape=five&hand=x&prog=nope`;
  - `mm-spirit?ls=s1-test.99`, `#/course/zzz`, `#/ex/nope`, `#/m/nope`, `?wu=999`.
- **Memory:**
  - 60 cycles: five new exercises, play/stop, tab↔staff, Options, Library search, map fold, the optional lesson and Home. Heap 15–29 MB, 315 nodes on Home at every sample, 0 animations, 0 live oscillators, flat listener counts.
  - 3.3 min of Classical Thump (whole tune): heap 15–43 MB sawtooth, nodes 1,340–1,398, strip 177 SVG children.
- **Layouts** (640x300, 780x360, 844x390, 915x412, 1024x768, 360x780; 4- and 6-string, left-handed, Do-Re-Mi):
  - No horizontal scroll or clipped text in landscape.
  - The mark row adds 10 px to the strip: 640x300 with 6 strings keeps an 85 px neck, and the labels fit.
  - Covered controls appear only under the modal sheet or drawer, or under the sticky S1–S6 bar after the map centres the next lesson.
  - The optional chip fits on the lesson pages.
  - Portrait shows "Turn your phone sideways" in exercises.
