# QA deep report · 91ad82b · 2026-10-20
Summary: 0 critical, 7 major, 10 minor, 3 visual. Runs: monkey seeds 801, 802, 803 and 804 (4 x 330 steps, about 11 min; 802–804 biased to the course: 339 lesson-step actions, 65 goal-button taps, 138 Next/Done, 26 demos). Also: self-test (problems 0); course storage (12 corrupt cases), 24 bad routes; history-depth tests; logged-Player tempo recordings; sessions at 15/30/45 min in 5 course states; staff checker over 9,550 builds (every exercise at its defaults and each single option change, uniform ones at 6 subdivisions); line checker over 36,585 builds; slap checker over 5,040 builds; memory (195 cycles + 2 min playback); layouts at 5 sizes. About 3 h.

Scope: d25bf3c..91ad82b.
- ef98260: staff timing and notation.
- c2ee937: lines and fingering.
- 88ba8b4: exercises, texts and naming.
- 91ad82b: the guided Course (the main focus).

Test setup:
- `qa` server opened as `http://127.0.0.1:8878`; service worker unregistered and caches cleared first.
- My own tabs only (tab-1, then tab-3 to tab-6 for the monkey runs; each run in a fresh tab because Chrome keeps only 50 history entries per tab).
- `requestAnimationFrame` shimmed with a 16 ms timer, because the pane is hidden.
- New script: `qa/tools/monkey8.js`. It is monkey7 plus the course controls. Its history check compares `history.state.depth` with the real index (Navigation API), and a `history.back()` at the app's first entry counts as leaving the app. It also flags any write of the exercise's `params`/`lastBpm` or of the Backing setting while a lesson step is open.

## Critical
None.

## Major

### M1. The course records a "full loop" that was not played, at a tempo that was not played
- Where: `web/js/ui/exercise.js:181-198` (`onLoop`), `web/js/player.js` (`done` = `this.bpm` at the moment the loop wraps); `web/js/course/progress.js:53` (`recordLoop`).
- Steps (partial loop):
  1. Open Lesson 5.1, step 1 (`#/ex/sc-one-octave?type=ionian&key=0&root=A&oct=1&ls=major-scale.0`).
  2. Set the tempo to 84 and press ◀ once: the cursor jumps to note 15/15.
  3. Press Play.
- Expected: no loop recorded. The README says a step passes on "a full loop at the goal tempo".
- Actual: a count-in, one note, then the loop event (`loop@4.37 done 84`). Storage `major-scale.0: {best: 84, loops: 1}`, toast "Goal reached! If it felt clean, tick ✓ Clean?", and the goal button turns "✓ Clean?". The same happens after tapping a column of the strip (`onSeek` → `stepTo`) and pressing Play.
- Steps (tempo bumped at the end):
  1. Play the same step from the start at 60.
  2. While note 14 sounds, move the slider to 84.
- Actual: 14 of 15 notes at 60. Scheduled times: step0@4.08 … step13@17.08, 1.00 s apart. The loop is recorded as `done 84`, so best = 84 and the step passes.
- Correct case: the speed trainer. Loops measured at 200.00, 203.94–204.01, 207.97–208.04 and 211.94–212.01 BPM were recorded as 200, 204, 208 and 212.
- Fix ideas:
  - count a loop only when it started at step 0 (Play from the start, or a wrap);
  - credit the lowest tempo used during the loop, not the tempo at the wrap.

### M2. The goal tempo ignores the subdivision, and a lesson step reads and writes the exercise's own subdivision
- Where: `exercise.js:83` (`userSub = prog.sub`) and `:145` (`updateProgress(tpl.id, { sub })` also in lesson mode); `presetOk()` (`:390`) checks only `LS.p`.
- Scope: 86 of the 150 course steps are on exercises with a subdivision selector (35 exercises; `sc-one-octave` alone has 8 steps).
- Steps:
  1. In `major-scale.0`, choose "Whole" in the subdivision select. Progress becomes `sc-one-octave: {…, sub: 0.25}`.
  2. Open step 2 (`major-scale.1`). It opens at "Whole" too, and so does every other lesson, warm-up or Library visit to that exercise.
- Expected: the goal "84 BPM" means the lesson's rhythm (the exercise's own subdivision, e.g. ♩ for one-octave scales).
- Actual: a full loop at 84 BPM counts at any subdivision, from one note every four beats ("Whole") to six notes per beat ("6 sext."). A player who once chose 16ths in the Library finds Level-1 lessons at 16ths.
- Fix idea:
  - the step carries its subdivision (default `inst.sub ?? tpl.sub`), and `presetOk` includes it;
  - lesson mode does not save `sub`.

### M3. The ✓ Clean button is a toggle: a second tap un-completes the lesson
- Where: `exercise.js:405-431` (`onGoal`); `progress.js:70` (`setClean`).
- Steps (due review, double tap):
  1. Lesson 1.1 is complete and due for review.
  2. Open its review step (`#/ex/tech-alt-pluck?start=m&reps=4&ls=pluck.1`) and play one loop at or above 80 BPM. The button reads "✓ Still clean?".
  3. Tap it twice.
- Actual:
  - Tap 1: "Reviewed ✓ Next review in 3 days" (reviews 0 → 1, next +3 days). The button now reads "✓ Clean".
  - Tap 2: "Clean tick removed". `isComplete(pluck)` is false, the status is "started", and Home's Continue jumps back to Lesson 1.1.
- Steps (a "Review" that is not due):
  1. Finish every lesson (none due). Today's session fills with "Review" items (30 min: 4 of them).
  2. Open one.
- Actual: the button already shows "✓ Clean", and one tap removes the tick. Course stats go from 69/69 to 68/69 done, and `continueLesson()` = `pluck`.
- A careless double tap, or a player doing what the "Review" label suggests, loses a completed lesson. It can be ticked back, but nothing says so.
- Fix idea: a ticked step does not untick from this button (untick from the lesson page, or ask first); in a review that is not due, show the review state instead of the clean tick.

### M4. Placement and unknown lesson ids break the history depth: Back shows the course map twice, and can leave the app
- Where: `web/js/ui/course.js:283` (placement "See my starting point") and `:194` (unknown lesson id) call `location.replace` without app.js's `replacing` flag, so `trackDepth()` counts the replaced entry as a push. Same pattern pre-existing in `screens.js:183` (`#/m/<unknown>`).
- Steps (normal flow):
  1. Home (depth 0) → Course map (1) → Placement check (2).
  2. Answer the 12 questions and tap "See my starting point".
  3. Tap Back.
- Actual:
  - After step 2: `#/course` with `history.state.depth` 3 at real index 2 (`history.length` stays 8).
  - Back shows the course map again (depth 1). A second Back reaches Home.
  - Every further placement round adds another copy. Android's hardware Back walks the same duplicates.
- Steps (first page of the app):
  1. Open `…/#/course/placement` directly (for example from a link or bookmark), answer and submit.
  2. Tap the course map's Back.
- Actual: the first app entry now has `{depth: 1}`, so Back calls `history.back()` and the tab left the app (it loaded the previous page, `manifest.json`).
- The same happens with `#/course/<unknown id>` as the first page.
- Fix idea: a `replaceHash()` helper in app.js that sets `replacing = true` before `location.replace`, used by course.js and screens.js.

### M5. Staff regression: polyrhythms and quarter-note triplets are written with wrong values
- Where: `web/js/views/staff.js:208-215`, the new "long note that starts inside a tuplet beat" rule (ef98260). It writes a tuplet piece up to the beat, then `pushTied` writes the rest. When the rest is not a plain value (⅓ beat), `asValue(t) || asValue(TPQ)` writes it wrong.
- Steps: open `#/ex/rh-polyrhythm` (default "3 over 2 beats"), with the strip on Staff, at 800x380.
- Expected: three quarter-note triplets under one "3" per two beats.
- Actual:
  - The 2nd quarter-note triplet of each pair is drawn as a triplet 8th tied to a 16th and a quarter. The screenshot shows "♩ | ♪‿♬‿♩ ♩" under the bracket.
  - Checker: `step 1 (0.6667 beats at 0.667): written 5320 ticks, expected 2240 [note1120/3 note840 note3360]`, repeated every two beats.
- Scope (4-string, defaults plus each single option change):
  - `rh-polyrhythm` 3:2 (default), 3:4, 5:4 and 7:4. For example 7:4: "tuplet 7 with no notes", "step 2: no head"; 5:4: values 2–2.5 times too long. Only 4:3 is clean.
  - `rh-triplets` (default, quarter-note triplets) and `iv-tenths` "stop" at 3 per beat.
- The previous round had 0 problems in `rh-polyrhythm` 7:4 and 5:4.
- Fix idea: split only when the remainder after the beat can be written plainly; otherwise keep the whole-tuplet event (quarter-note triplets under one "3").

### M6. Slap: 16% of thumbed notes sit on the D or G string (the round-7 rule says the thumb plays the low strings)
- Where: `web/js/curriculum/common.js:546-570` (`emitMixed`). Thumbed notes are moved only from the low B to the E string and to an open low string; one placed on D/G stays there. The comment above the block says "the thumb plays the low strings".
- Measured (4/5/6 strings, every style x prog x key, max fret 20):
  - 7,267 of 45,445 thumbed notes are on the D (6,910) or G (357) string, in 882 of 1,440 builds;
  - 6,402 of them could be played on E or A within 12 frets.
- Example: `#/ex/sl-thumb-pop?style=thumb&prog=i-iv-v-min&key=10` (4-string). E♭2 (midi 39) is thumbed 8 times on the D string fret 1, where A string fret 6 would do.
- By style: sl-advanced ghostFunk 1,659, sl-double-thumb 1,504, sl-grooves hammer 1,284 / triad 925 / tmp 704, sl-advanced popFill 715, sl-thumb-pop octPop 436 / thumb 40.
- The other slap rules hold in all 5,040 builds (4/5/6 strings x max fret 17/20/24):
  - pops only on D/G (C);
  - a pop never on the string the thumb just played;
  - hammer-ons up and pull-offs down on the same string, fretted span ≤ 3;
  - no low B for a note the E string can take.

### M7. Walking: "iii–vi–ii–V–I" in wk-chord-tones ends with an octave jump and a 15-semitone leap in every key (regression)
- Where: `common.js:899`, the chord-tone fix for the last note of a bar. It now excludes the note just played by exact midi (`x.midi !== before`), so it picks the same note an octave up.
- Steps: `#/ex/wk-chord-tones?prog=iii-vi-ii-V&key=0`, 4-string.
- Actual:
  - C: `[Cmaj7] C48 B47 G43 G55 | (loop) [Em7] E40`: G up an octave, then down 15 semitones;
  - F: `C36 C48 | A33`.
- Scope: all 12 keys on 4/5/6 strings x max fret 17/20/24 (108 builds).
- The previous round measured 0 leaps over an octave in single keys.
- Cycle and chromatic orders: 141 leaps over an octave remain in 10,233 builds. The commit says 231 → 15. By exercise:
  - wk-approach ii–V–I 54, minor ii–V–i 54, iii–vi–ii–V 6;
  - wk-mixed, wk-triplet-skips, wk-two-per-bar ii–V–I 9 each.
- Fix idea: exclude the note just played by pitch class.

## Minor

### m1. Staff: the closing rests are still wrong at 6 notes per beat when the last beat needs more than one tuplet rest
`staff.js:223-231`: one tuplet rest is tried, and when `tupletOf(beatT - off)` finds none, the remainder goes to `splitTies` again.
- Example: `tri-shape` at its defaults, at "6 sext.". After the 7th note (⅙ beat), the rests read half + dotted 8th + quarter: 12,600 ticks where the bar needs 9,520.
- Scope: 82 of 9,550 builds, all at 6 per beat:
  - sc-blues, tri-qualities, tri-two-octaves, tri-upper-structures, tri-shape, sc-messiaen, sc-chromatic, iv-cycles, sc-pent-positions;
  - and others.
- 3 and 5 per beat are now right (`sc-3nps`, `tri-diatonic-inversions`, `tri-two-octaves`, `arp-broken` at 5 and 6: clean).

### m2. Stage tests: the "I can" lines give tempos that differ from the step goals
- `s1-test`: "I can play a root line through a song at 110 BPM with even 8ths". The step is root–5th–octave (`r585`), goal 112.
- `s2-test`: "I can play the 12-bar blues with a boogie line at 112 BPM". The step goal is 116.
- Both in `course/data.js` (`:473`, `:1108`).

### m3. Today's session falls far short of its length when the course has nothing to schedule
- After "Yes" to every placement question (69/69 known, none done), the session has 1 item at 15 min, 2 at 30 min and 2 at 45 min (warm-up plus reading).
- Home says "today's session keeps your lessons fresh". Only completed lessons fill the "early reviews"; known lessons never do.

### m4. A session item reopened with Back/Forward runs as the daily warm-up
- Steps: Home → session ▶ Start → Next (item 2, `…&ls=pluck.1&wu=1`) → Back → Forward.
- Actual: the header reads "Warm-up: exercise 2 of 6", and Next jumps into the warm-up (`#/ex/sc-one-octave?…&wu=2`).
- Cause: `app.js:83` takes `currentRoutine[wu]` without checking that it is this exercise, and rendering Home resets `currentRoutine` to the warm-up.

### m5. A stored course tempo is not clamped
- `progress.js:16` (`num`) accepts any finite value ≥ 0, and `exercise.js:205` assigns `player.bpm` directly.
- With `steps['pluck.0'].last = 1e308`, the step opens with "1e+308 BPM" (slider at 260). 9999 behaves the same.
- Clamp it to 30–260 on load or before use.

### m6. Lesson progress is keyed by step index
- `progress.js:41` stores `<lesson>.<index>`. CLAUDE.md protects lesson ids, but inserting or reordering a step in a later phase moves existing tempos and ticks to other steps.
- Worth a line in CLAUDE.md ("append steps, never reorder"), or a step id.

### m7. Lesson mode still writes the exercise's own best tempo and loop count
- `exercise.js:186` adds `plays` and `bestBpm` in lesson mode too, at the lesson's preset options. A looped demo does the same, at the goal tempo.
- Example: my 260 BPM review of Lesson 1.1 set `tech-alt-pluck.bestBpm` to 260.
- The decision says lesson steps leave "the exercise's saved options or tempo" alone; the Info drawer then reports that best tempo.

### m8. One approach an octave away remains (round 7 m3)
- `gr-approach` "5th approach" in E, 4-string, at the loop: `[B7] B47 D♯39(→) [E] E28` (11 semitones).
- 5 builds (I–vi–IV–V, I–vi–ii–V, auto, blues, quick blues); it was 31.
- The new guard (`common.js:473`) tests `p.midi < lowest string`, but `resolveToken` has already moved the approach an octave up (39).
- All other 167,179 approaches resolve by a step or are the 5th approach.

### m9. The 12/8 slow blues starts at 60 only when chosen in Options
- Opening `#/ex/gr-blues?style=slowBlues` with no saved tempo (a link, saved options, a warm-up item) starts at 96 BPM.
- Switching from 12/8 back to Shuffle keeps 60 BPM.
- `exercise.js:288` skips the hint on the first build (`bpmHint === undefined`).

### m10. Progressions: five chromatic chords keep F♭/C♭/E♯ roots, against the round-7 rule
The rule: "… takes its lead-sheet name …, and so does any chromatic chord".
- I–♭VII–IV–I in D♭ (C♭) and in G♭ (F♭).
- I–♭VI–♭VII–I in E♭ (C♭maj7) and in A♭ (F♭maj7).
- Jazz blues in B (E♯°7).
- `common.js:309` respells only chords given in semitones (`typeof where === 'number'`). These are given as interval strings ('b7', 'b6', '#4').
- Diatonic chords keep the key's spelling as decided (G♭ C♭ D♭ G♭).

## Visual

### V1. Exercise header in lesson mode: the title shrinks to a few letters on phones
Measured widths:

| Size | Back | Title | Options | Goal "↺ Lesson options" | Next | ☆ / Tuner / Info |
|---|---|---|---|---|---|---|
| 640x360 | 34 | 54 | 170 | 121 | 87 | 34 each |
| 800x380 | | 114–156 | | | | |

- At 640x360 the title shows "12 Y…" over "Lesson 5…": the step number and the goal tempo in the subtitle are never visible. At 640 the title is 54–90 px for every lesson step tested.
- The goal and Next buttons are each wider than the title.
- 915x412 is fine (197–252 px).

### V2. Session length buttons are 30 px tall
`app.css:411` (`.session-head .seg button { min-height: 30px }`): the 15/30/45 min buttons measure 55–57 x 30 px at every size, under the 32 px target.

### V3. Course map: lesson names cut when a chip is in the row
At 640 and 915 px wide, rows with a "review", "optional" or "known" chip truncate the title. Examples: "Plucking with two fingers" 144 → 104 px, "One finger per fret" 107 → 104 px.

## Checked and fine
- **Self-test:** `problems: 0` (191 exercises, 70 lessons, 26,289 builds, 1,476,116 notes).
- **Course storage:** 12 cases, then Home, map, 4 lesson pages, placement, a step and a demo:
  - garbage JSON, array, string, number, null;
  - wrong types everywhere; junk step keys (`pluck.x`, `nope.0`, `pluck.99`);
  - `__proto__` keys; negative and 1e308 values;
  - a "done" lesson without ticks; everything known.
  - 0 errors and no NaN/undefined (apart from m5).
- **Routes:** 24 bad ones, 0 errors.
  - Mismatched or unknown `ls` opens the plain exercise. `ls=pluck.` and `ls=pluck.0x1` parse as steps 0 and 1 (harmless).
  - `demo` without `ls` does not autoplay.
  - `#/course/<unit id>` and `#/course/__proto__` redirect to the map (see M4 for the history).
- **Demo:**
  - plays once at the goal tempo, sound on, nothing recorded;
  - "Practise ›" replaces it with step 1;
  - leaving within 200–300 ms (Home, another exercise, Tuner, Back) or during the count-in starts or keeps nothing (logged `play()` calls and queue).
- **Backing override:** the step shows "Chords"; `bassclass.settings.v1` is untouched; the same exercise outside the lesson shows the player's own "Off".
- **Lesson options:**
  - changing a preset option shows "↺ Lesson options" and stops recording;
  - a tap restores the options (the Options sheet updates too);
  - free options (Direction) stay free;
  - exercise `params` and `lastBpm` are never written (also checked on every monkey step).
- **Speed trainer in a lesson:** recorded loop tempos equal the played ones (M1).
- **Sessions** (new player: start block; mid-course; all done; all done with 35 due; all known):
  - 3/6/9 items at 15/30/45 min (except m3);
  - one review per due lesson, up to n/3, on its last goal step;
  - a review advances 1 → 3 days;
  - Next replaces, Finish returns to Home, depth stays right.
- **Lesson flow:** lesson page → step → Next → Done returns to the lesson page; a double tap on Done does not go back twice. Ticking "I can" keeps the scroll position.
- **Monkey** (4 x 330 steps; 4/5/6 strings, left-handed, Do-Re-Mi, 640x360 to 844x390):
  - 0 errors, NaN/undefined texts, ghost audio or pads;
  - no `history.back()` at the app's first entry;
  - no lesson writes to exercise params, `lastBpm` or Backing.
  - Run 803 reported 5 depth mismatches after step 246. That is Chrome's 50-entry history cap (the index stuck at 49), not the app.
- **Round-7 fixes confirmed:**
  - fill rests at 3 and 5 per beat and the quintuplet broken-chord fill (M2/m1 of d25bf3c);
  - tuplet numbers above down-stem heads; dynamics row; staff never below size 6;
  - key signatures in sc-positions, sc-pent-positions, sc-3nps, sc-one-string, tri-scale-forms, iv-diatonic, iv-tenths, iv-scale-octaves (checker: signature glyphs and accidentals right);
  - `tonicFor` follows the rule for every mode family x 12 keys (F♯ Mixolydian, A♯ Locrian, C♯ Dorian; ties keep the plain name; no B♯/E♯/C♭/F♭ tonic);
  - fret-1 roots move with a notice in tri-maj-min / tri-four-types / tri-inversions;
  - approaches spelled as steps (half-step misspellings only where the chord-tone rule applies).
- **Samples and tuner** (`audio.js`, `pitch.js`, `player.js`, `theory.js`, `fretboard.js` unchanged):
  - 84 files decode; 42 regular samples within ±5 cents (worst −3.61 at MIDI 49);
  - single-frame `yin` on 96 synthetic tones: worst 2.63 cents (the tuner's 7-frame median measured 1.33 last round).
- **Memory** (heap MB / DOM nodes):
  - 60 cycles lesson page → step → Next → Next → Done: 11.9–12.9 MB / 119;
  - 80 Home ↔ map renders: 12.6–13.0 MB / 455–521;
  - 40 demos opened, playing, left: 12.4–13.2 MB / 119, 0 players left playing, empty queue;
  - 15 sessions run through: 12.3–13.2 MB;
  - course key 5.2 KB, stable.
  - 2 min 15 s of `swing.1` (12-bar shuffle, staff on, backing Chords) with the trainer: 12.3–13.1 MB, 792–798 nodes, queue 0–2; the step recorded best 84, 88, 92, 96 as the loops went 84 → 100.
- **Layouts:**
  - Home, course map, lesson, checkpoint, stage test, placement and 7 lesson-step headers at 800x380, 640x360, 640x300, 915x412 and 360x780: no horizontal scroll, no covered or overlapping controls, no clipped (non-ellipsis) text, apart from V1–V3;
  - portrait shows the rotate prompt (the app is landscape-locked).
- **Code review:** progress.js, ui/course.js, the lesson parts of exercise.js, the app.js routing, screens.js Home/routine, the staff.js/tabView.js changes, `placeRoot`, `chromaticSpell`, the slap/walking/groove changes, `tonicFor`, `progChords`, the sidestep rewrite, the `bpmHint`.
  - `staffSize` is chosen once per render and kept after a rotation or resize. Harmless at today's sizes.
