# QA deep report · 626f29c · 2026-10-21
Summary: 0 critical, 3 major, 7 minor, 2 visual. Runs: monkey seeds 901, 902, 903 and 904 (1,310 steps, about 10 min, 128 jumps into Stages 3–6 lessons, steps, checkpoints and stage tests). Also:
- every course step (507) opened in the real exercise screen on 4 and 5 strings, and built on 4/5/6 strings;
- step texts checked against the notes they build;
- staff checker over 16,543 builds;
- line checkers (walking, approaches, slap, groove shapes) over about 45,000 builds;
- logged-Player timing;
- memory over 150 lesson-step visits and 4 min of the longest step;
- layouts at 6 sizes plus all 242 lesson pages.

About 2.5 h.

Scope: 91ad82b..626f29c.
- 12c0632 and f060af0: the round-8 fixes.
- 1d27b2d: the exercise tip.
- 55ad232, fdc717c, 4c44658, 626f29c: course Stages 3–6, the main focus.

Test setup:
- `qa` server on `http://127.0.0.1:8878`; service worker unregistered and caches cleared first.
- My own tabs only: tab-1 and tab-3 for checks, tab-4 to tab-7 for the monkey runs (a fresh tab per run, because Chrome keeps 50 history entries per tab).
- `requestAnimationFrame` shimmed with a 16 ms timer, because the pane is hidden.
- New scripts:
  - `qa/tools/monkey9.js`: monkey8 plus the tip, listener accounting and jumps into Stages 3–6;
  - `qa/tools/course-check9.js`: every course step on 4/5/6 strings.

## Critical
None.

## Major

### M1. The course map prints "null" above "Reset course progress"
- Where: `#/course`, every course state, every size. `web/js/ui/course.js:202`.
- Cause: `COMPLETE ? null : h('p', …)` is passed to the native `main.replaceChildren(…)`. The DOM turns `null` into the text "null".
  - `h()` filters null children; `replaceChildren` does not.
  - `COMPLETE` became true in 626f29c, so it shows since this release.
- Steps: open the course map and scroll to the bottom.
- Expected: the stage cards, then the "Reset course progress" button.
- Actual: a text node "null" (14 px, light text) directly in `main.main`, between the Stage 6 test card and the reset button.
- Evidence:
  - `[...main.childNodes][14]` is a text node `"null"` (16 child nodes).
  - At 640x360, scrolled to the bottom, it sits at x 82, y 280 (23x18 px). The screenshot shows "null" over the button.
  - Found by the corrupt-storage sweep too: every `#/course` load reports the bare word "null".
- No other native `append`/`replaceChildren` call gets a conditional `null` (grep over `web/js/ui`, `app.js`).

### M2. "Root–low 5th (two-feel)" lines jump 5–7 frets along one string in 22% of bars (shape placement)
- Where: `hm-chord-tones`, pattern `r5low`, 4-string. `web/js/curriculum/common.js` `shapeRoots`; `harmony.js:112` now passes `shape: true` for every pattern.
- Cause: `shapeRoots` picks each root near the previous fret without looking at the low 5th that follows. A root put on the E string leaves the low 5th nowhere but 5–7 frets lower on the same string, although the usual shape is free: root on the A string, 5th on the E string at the same fret.
- Example: `#/ex/hm-chord-tones?prog=I-IV-V-I&pattern=r5low&key=3` (E♭).
  - `[E♭] E♭39 s1f6 | B♭34 s0f6`: good.
  - `[B♭] B♭34 s0f6 | F29 s0f1`: 5 frets down the E string.
  - A string fret 1 (B♭) to E string fret 1 (F) is the same pitches in one shape.
- Measured (4-string, every progression × 12 keys): 437 of 1,956 root→low-5th pairs jump 5–7 frets on one string (max 7).
- Before round 8: replaying the pre-round-8 call (`open: 'allow'`, no shape) over 7 progressions × 12 keys gives 89 of 576 such jumps. The new placement gives 136 of 576.
- 5 and 6 strings are fine (the low B takes the 5th).
- The shape decision (QA round 8) says these patterns "keep each chord's notes around a fretted root". `r5low` is the one pattern whose second note lies below the root.
- Same engine, smaller (all `hm-chord-tones`/`hm-12-bar-blues`, Library only):
  - the root may still sit above fret 9 when the same pitch exists lower. Jazz blues in F, bar 12: `D7: D38 s0f10`, where bar 9 has `D7: D38 s1f5`. The fret-9 test in `shapeRoots` only chooses the octave; the sort then prefers the fret nearest the previous root. 52 chords on 4 and 5 strings.
  - `ii-V7alt-I` with R-3-5-7 spans 6 frets: `B♭7alt R s1f1, 3 s1f5, ♭7 s3f1, ♯9 s3f6`. 9 chords per bass.
- No course step uses `r5low` (only `r353`, `r357`, `r358`).

### M3. A step that leaves the key free inherits a saved "All 12 keys": a one-key step becomes 12 keys long
- Where: `web/js/ui/exercise.js` `p = { ...defaultParams, ...prog.params, ...params }` and `presetOk()`, which only compares the step's preset.
- Scope: 284 course steps on 107 exercises leave a key that has cycle options free.
- Steps:
  1. In the Library, choose "All 12 · cycle of 4ths" for `gr-funk-changes` (stored as `params.key = 'cycle4'`).
  2. Open Lesson 46.2, step 1 ("Octave funk through a 12-bar blues", goal 96).
- Expected: one 12-bar blues (192 notes), or the lesson's options marked as changed.
- Actual:
  - The step opens on "Octave funk 16ths · Progression: 12-bar blues · All 12 · cycle of 4ths", `ready · 2304 notes` (144 bars).
  - The goal button reads "🎯 –/96" (the options count as the lesson's), so the pass mark becomes a 5 min 46 s loop of 16ths.
- Evidence: DOM readout above. The step's `p` is `{style: 'funkOct', prog: 'blues'}`.
- CLAUDE.md allows "another key … where the lesson leaves it free". A cycle is not another key: it multiplies the length by 12. The same applies to every free key with `cycles`.
- Fix idea: in lesson mode, a free key that holds a cycle value falls back to the exercise's default key (or counts as a changed preset).

## Minor

### m1. In a lesson step or demo, the over-fret notice is replaced at once by the step's tip
- Where: `exercise.js`. `rebuild()` shows `tip('This variation reaches fret …')`; the last lines then call `tip(LS.do, …)` (or the demo tip), which replaces it.
- Steps:
  1. Highest fret 17, 4-string.
  2. `sc-two-octaves` saved with key E♭.
  3. Open Lesson 20.1, step 1.
- Library: "This variation reaches fret 20, above your highest fret (17)."
- Lesson step: only "Lesson 20.1 · step 1 of 2 · Major over two octaves…"
- Demo: only the demo tip.
- The player is never told the step goes above the highest fret.
- No step goes over 17 at its own preset; it happens when the free key is the player's (see M3).

### m2. Lesson 38.2 (p-i-m) asks for chord backing that never plays
- Steps `pim.0` and `pim.1` (`tech-pim`) set `backing: 'chords'`. The exercise is in `technique`, where `BACKS` is false (`exercise.js`), so `player.harmony` is null.
- Measured on `pim.0`:
  - the Backing button reads "Chords" and is highlighted;
  - 0 pad oscillators start in 4 s of playback;
  - control: `funk-changes.0` starts 8.
- Tapping the button cycles the player's global Backing setting. Then "This exercise has no chords or scales to back" appears, although the strip shows chords (C, Am, F, G…).
- Related: `scale-octaves.1` (Lesson 35.2) is a "🎵 Make music" step with no backing (`iv-scale-octaves` is an intervals exercise, so none is possible).
  - Every other music step names one (26 lessons have music steps).

### m3. A demo inside today's session says "tap Practise ›", but the button there reads "Next ›"
- Steps:
  1. Lesson 1.1 done.
  2. Home: today's session (30 min) → item 1 "Lesson 1.2: ▶ Hear it".
- Actual:
  - the header button is "1/7 Next ›" and there is no Practise button (the routine's button replaces it);
  - the end tip reads "Demo finished · Your turn: tap Practise › to play it yourself.";
  - the Info drawer says "…then tap Practise."
- Where: `exercise.js` `onEnd` and `lessonBox()`. Both assume the lesson's own Practise button.

### m4. "The cycle of 4ths for two octaves and back" plays 5 of the 12 notes
- Lesson 39.1, step 1 (`iv-cycles`, iv 4).
- The line is C F B♭ E♭ A♭ and back: 9 notes, 20 semitones (`midi 36–56`). The build stops at root + 24 (`intervals.js:220`), so a 4ths chain never reaches two octaves.
- The exercise's own text also says "The line climbs for two octaves and comes back".
- Minor 3rds, major 3rds and whole tones do fill two octaves.

### m5. Some checkpoint and stage-test steps are several-minute loops that must be played without a stop
A full loop from the first note is the pass mark. Times per loop:

| Step | Exercise and length | At the start tempo | At the goal |
|---|---|---|---|
| `u-harmony5-check.1` | `gr-funk-changes`, cycle4: 144 bars, 2,304 16ths | 6 min 51 s | 5 min 46 s |
| `u-chords-all-keys-check.1` | 60 bars | 3 min 45 s | |
| `u-coltrane-check.1` | rhythm changes in 12 keys, 96 bars | 3 min 26 s | |
| `rudiments-all-keys.0` | | 3 min 12 s | |
| `u-hands2-check.2` | permutations "all", 48 bars | 2 min 55 s | |

- The lesson that teaches `funk-changes` uses one key (12 bars); its checkpoint uses 12.
- Not a bug: a design question, given that a slip in minute 5 restarts the loop.

### m6. Two Stage 1–2 steps changed content in place after they shipped
Course steps are stored by index (`<lesson>.<i>`). Between 91ad82b (released) and f060af0, two steps kept their index but got different content:
- `s1-test.0`: `gr-roots` r585 → rock8;
- `swing.1`: `gr-blues` prog blues → vamp-dom.

Tempos and ticks saved on the old content now count for the new. No reorder or insert since (91ad82b → HEAD: only appended steps, and the new lessons `hold` and `chromatic`).

### m7. Rapid navigation right after "Done ›" can leave the history depth one too high (suspicion)
- Monkey 903:
  - step 102: "Done ›" on the last step of `s6-test`, which calls `history.back()`;
  - step 103: within about 150–270 ms, the run set `#/course/placement`.
- Afterwards `history.state.depth` was 11 at a real depth of 10, on every following screen.
- One too high means Back at the app's first entry calls `history.back()` once with nothing behind it.
- Only seen in the throttled background tab, where `history.back()` resolves slowly. Not reproduced with real taps.

## Visual

### V1. Lesson header: the step number and goal are cut at 780x360 and 844x390; at 760 px or less the Options button is 22 px tall
Measured title and subtitle widths, in px of their full width:

| Size | Step | Title | Subtitle | Options button |
|---|---|---|---|---|
| 780x360 | `u-coltrane-check.1` | 94 / 289 | 94 / 251 ("Checkpoint 53.✓ · step 2/2 · goal 152 BPM in 8ths") | 250 wide |
| 780x360 | `melodic-super.0` | 143 / 412 | 143 / 188 | |
| 844x390 | `u-coltrane-check.1` | 117 / 289 | 117 / 251 | 336 wide |

- At these sizes the goal and step number are not visible, while the Options summary takes 250–336 px.
- At 640x300 and 640x360 the lesson rule (`@media (max-width: 760px) .exv-top.lesson .opts-txt {display:none}`) frees the title (210 px). The Options button then shrinks to 40x22 px (Library: 294x41).
- The goal button is 92x31 at every size (just under 32).

### V2. The course map is 29 screens tall on a phone and always opens at the top
- At 640x300 `main` is 8,786 px for 242 rows (61 cards).
- For a player in Stage 3, the "▶" row (17.4) is at y 2,934, about 10 screens down; in Stage 6 it is near the end.
- There is no jump to a stage or to the current lesson. The header's "▶ Lesson …" button and the scroll restore on Back (5,000 → 5,000 px, checked) soften it.

## Checked and fine
- **Self-test:** `problems: 0` (191 exercises, 242 lessons, 26,289 builds, 1,476,185 notes).
- **Course steps** (`course-check9.js`), 507 steps × 4/5/6 strings at highest fret 20:
  - every preset is kept by the exercise screen's own validation;
  - every `sub` is a selector value;
  - no step goes over fret 17 at its preset;
  - the fastest goal is 8 notes/s (`pick.2`, 120 BPM 16ths), and most are under 7 notes/s;
  - every goal is at most 40 BPM above its start, so the speed trainer reaches it in one run;
  - backing has harmony to play everywhere except m2;
  - no fret/MIDI mismatch, no two notes on one string, fingers 0–4 (93,168 notes).
- **UI sweep:** all 507 steps opened in the exercise screen with:
  - 4-string defaults;
  - 5-string, Do-Re-Mi and left-handed.

  Every step showed the preset, subdivision, start tempo, "goal N BPM in …" subtitle, backing button and tip; there were 0 errors and no "↺ Options" at open.
- **Step texts against the builds:**
  - fingers and frets of trills, Simandl, upper positions, zones and key boxes;
  - harmonics order 12-7-5-4; diagonal X; chromatic sharps up / flats down;
  - 4ths order 1-4-7-3-6-2-5-1; R-5-10 and R-♭7-♭10 voicings; 10ths on E+G;
  - broken min7; Autumn changes; p-i-m pattern; 6th-diminished C6/B°7;
  - IV-V and I-II triad pairs; 3-5-7-9 upper structure; A7's C♯; altered and bebop chord-scales;
  - bebop lick 2 chord tones on the beats; enclosure order; half-step-below approaches;
  - Messiaen 3 (9 notes) and 5 (6 notes); 5/4 as 3+2; 7/8 clicking every 8th.
- **Placement:**
  - 39 questions cover all 55 units exactly once, each question within one stage, in stage order;
  - "All yes" / "All not yet" work; "See my starting point" stays disabled until all are answered;
  - submitting goes back to where the check was opened;
  - depth checks: map → placement → submit → Back = Home; as the first page, `replaceHash` gives depth 0;
  - a second round adds no duplicate.
- **Sessions** in 5 course states (new, Stages 1–3 known, 1–5 known, all done, all known) at 15/30/45 min: no duplicate items, no unknown exercise; the Level 6 fill applies once nothing is left.
- **Round-8 fixes confirmed:**
  - M1: logged Player.
    - Starting on the last note gives `done` null.
    - Tempo raised mid-loop (120 → 200) credits 120; lowered (200 → 120) credits 120.
    - Pause/resume and a subdivision change mid-loop give null.
    - Trainer loops credit 200, 204, 208, 212.
  - M2: the subdivision is part of the preset; lesson mode writes no `sub`.
  - M3: a second ✓ tap shows "Already ticked ✓…" and the step stays clean.
  - M4: depths match the real history index.
  - M5 and m1: staff checker clean on 16,543 builds (all exercises, subs 1–6) and on the polyrhythm and quarter-note-triplet cases.
  - M6: thumbed slap notes on D/G went from 16% to 1.8% (784 of 44,422). The rest are hammer-run starts or notes with no E/A place within 12 frets.
  - M7: no walking leap over an octave with single keys. Over 33,660 builds with all cycles there is 1 left: `wk-approach` ii–V–I, chromatic, `E52 → C♯37`.
  - m2: stage-test tempos match.
  - m4: Back/Forward into a session item keeps "Session: exercise n of 6".
  - m5: a stored `last: 1e308` opens at 260.
  - m7: no lesson write to `params`, `lastBpm`, `sub`, `bestBpm` or `plays` in 4 monkey runs.
  - m8: 55,728 approaches resolve by a step or are 5th approaches; none an octave away.
  - m9: the 12/8 slow blues opens at 60 and Shuffle returns to 96.
  - m10: D♭: B; G♭: E; E♭: Bmaj7; A♭: Emaj7; jazz blues in B: F°7.
  - V2: session buttons 34 px. V3: map titles wrap.
- **Groove shapes:** no shape root open where a fret has it; disco octaves always two strings up, two frets up.
- **Labels below the lowest beam:** 3,105 staff builds; the label row is at least 2.9 px below every stem, beam and tuplet number.
- **Quiz mode:** "?" for every unplayed tab column (15/15 at ready, 12/15 after 3 notes); no names on the staff.
- **Exercise tip:**
  - it shows each step's `do` with its title, and closes on a press anywhere, on × and on any key;
  - it never survives Back, hardware Back, Tuner, the rail or session Next (Next shows the next step's tip);
  - with the Options sheet open, the sheet covers it;
  - the longest tip (133 chars) is 560x73 at 640x300 (half the neck's height) and stays inside the board;
  - listeners: document capture `pointerdown` and window `keydown` go 0 → 1 → 0 per visit, and stayed at 0–1 through 1,310 monkey steps.
- **Memory:**
  - 150 lesson-step visits with Options, Info and goal taps: heap 13.1 → 18.6 MB, back to 13.1 MB after a forced GC; nodes 96–144; 0 tips or listeners left.
  - 4 min of `u-harmony5-check.1` (2,304 notes, staff on, backing Chords): heap 14.0–16.3 MB, queue at most 2, nodes 1,666–2,266.
  - Monkey heaps 10–16.5 MB with no trend.
- **Timing** (logged Player):
  - one bar of count-in clicks (4, 7 in 7/8), evenly spaced;
  - step times on the grid with 0 ms error at 260 BPM × 6, 30 BPM × 1, 7/8, a swing lick and 5:4;
  - seamless loops;
  - all 888 written-rhythm builds fill whole bars.
- **Storage and routes:**
  - 23 corrupt-storage loads (garbage, array, wrong types with Stage 3–6 ids, `__proto__` keys, all known) gave 0 errors; the only bad text was M1's "null";
  - 27 bad routes gave 0 errors (unknown lesson, `__proto__`, `ls=pim.99`, `pim.-1`, `pim.1e1`, demo with `rv`, a mismatched exercise).
- **Samples and tuner:** unchanged since 91ad82b and re-measured. 84 files decode; worst sample −3.61 cents (MIDI 49); single-frame yin worst 2.63 cents over 96 synthetic tones.
- **Layouts:**
  - Home, map, placement, lesson, stage test, step with tip, Options, Info and demo at 640x300, 640x360, 780x360, 844x390, 1024x768 and 360x780: no horizontal scroll, clipping or covered controls apart from V1 and V2;
  - all 242 lesson pages at 640x300: clean;
  - portrait shows "Turn your phone sideways".
- **Monkey:** 4 runs, 0 errors, NaN/undefined texts, ghost audio, ghost pads, stuck players, leaks or lesson writes.
  - Run 901: 844x390, 4-string.
  - Run 902: 640x360, 5-string, Do-Re-Mi, left-handed.
  - Run 903: 915x412, 6-string, highest fret 24.
  - Run 904: 780x360, checkpoints and stage tests.
  - Depth notes in 901 come from Chrome's 50-entry cap; see m7 for 903.
  - The "drawer without close" note in 903 was a synthetic click on Options under the open drawer; a real tap cannot reach it (`elementFromPoint` hits the drawer).
