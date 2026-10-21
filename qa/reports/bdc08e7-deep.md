# QA deep report · bdc08e7 · 2026-10-21
Summary: 0 critical, 3 major, 9 minor, 3 visual. Runs: monkey seeds 1101 (330 steps, 844x390, 4-string), 1102 (340 steps, 780x360), 1103 (340 steps, 640x300, 5-string, left-handed, Do-Re-Mi) and a Home/session fuzz, seed 2201 (150 actions at 640x300). That is 1,160 steps, about 13 min of taps. Also:
- self-test;
- fingering sweeps: `qa/tools/place-check11.js` over 39,781 builds (4-string, up to 40 option sets per exercise, every key and cycle), a chord-fit check over 30,690 builds on 4/5/6 strings, and 2,520 two-octave builds;
- session plans: 20 seeds × 4 lengths × 3 course states;
- storage and routes: 15 corrupt session values, plus 13 corrupt storage values and routes;
- ⓘ bubbles on 9 screens at 4 sizes, and layouts at 6 sizes;
- 100 memory cycles;
- timing with a logged `Player` and the speed trainer;
- yin on 150 synthetic tones.

About 3 h. Scope: 341ccfe..bdc08e7. The commits are 8758db5 (the QA round 10 fixes), 20a65b7 (the Home redesign and ⓘ), 1975d84 (lesson step rows) and bdc08e7 (exercise cards).

Test setup:
- `qa` server on `http://localhost:8878`, with the service worker unregistered and caches cleared first.
- Only my own tabs: tab-17, plus a fresh tab each for runs 1102 and 1103.
- The pane was hidden for most of the run, and Chrome then clamps timers to about 600 ms. I used a MessageChannel timer wheel instead (`__fastSrc` in `qa/tools/home11.js`).
- Storage was cleared at the end.

## Critical
None.

## Major

### M1. Today's session shows warm-ups and focus items as already played, and "▶ Carry on" skips them
- Where: Home, `web/js/ui/course.js:213`. `isPlayed` counts an item with an `ls` (not a demo, not a review) as played when its lesson step is ✓ Clean.
  - Warm-ups and focus items are lesson steps of lessons already done (`warmUps` → `pickFor` → `metSteps`, which use `practised`).
  - A player who completed those lessons has every one of these steps clean before the session starts.
- Steps:
  1. Complete Stages 1–2 by playing (every step ✓ Clean, every "I can" ticked; no placement).
  2. Open Home.
- Expected: an item is ticked once it is played through in this session (CLAUDE.md "Home"). A new plan starts with nothing ticked and "▶ Start" on warm-up 1.
- Actual:
  - Both warm-ups and the focus item(s) show ✓ with a muted title.
  - The button reads "▶ Carry on", and `course.js:231` (`next` = first unticked) opens the first course step. The warm-ups are never offered.
  - "+ More warm-up" extras also appear already ticked.
- Evidence:
  - 20 fresh 45′ plans: 40/40 warm-up rows and 40/40 focus rows rendered `.item.played`, all with `cur.played: []`. The button read "▶ Carry on" 20/20 times.
  - Row dump of one plan (`bassclass.session.v1` played `[]`):
    - `item played | ✓ / Muting: stop every note, silence every string`
    - `item played | ✓ / Note-finder quiz`
    - `item | 3 / Open strings / Checkpoint · 3/3`
    - …
    - `item played | ✓ / Blues scales / Scales`
- Players placed by "My level" are not affected: known lessons' steps are not clean.
- Fix idea: count only `cur.played` for warm-up, focus, review and Library items. Keep the `stepClean` shortcut for the course's own next steps (slots Lesson / Checkpoint / Stage test).

### M2. The checkpoint steps added in 8758db5 reopen finished checkpoints: Continue goes back to Stage 1, My level drops to L1, and their reviews stop
- Where: steps appended in `course/stages/s1.js`, `s2.js` and `s5.js`:
  - u-hands-check.2 (fb-open-strings) and u-notes-check.2 (fb-octaves);
  - u-neck-check.2 (fb-unison), u-sevenths-check.2 (hm-chord-qualities) and u-blues-check.3 (sc-blues);
  - u-superimpose-check.2 (md-melodic-superimposition).
- Why: `isComplete` (`progress.js:120`) needs every step clean. `isDue` (`:136`) needs `isComplete`. `continueLesson` (`:179`) returns the first lesson in course order that is started or new.
- Steps:
  1. Store the state of a player who finished Stages 1–2 on v1.0.45: every step that existed then ✓ Clean, every "I can" ticked, `lessons[id].done` set, `rev` 2, `last` ''.
  2. Open Home.
- Expected: the player carries on at Lesson 17.1 (Stage 3, L3), and the finished checkpoints stay done and keep their review dates.
- Actual:
  - u-hands-check, u-notes-check, u-neck-check, u-sevenths-check and u-blues-check have status `started` (◐ on the map).
  - `continueLesson()` = u-hands-check and `playerLevel()` = 1.
  - Home reads "My level L1" and "▶ Continue · Checkpoint: Your two hands".
  - Today's session is planned at "Level 1", with "Open strings · Checkpoint · 3/3" and "The octave shape · Checkpoint · 3/3".
  - Those checkpoints no longer come back as reviews.
  - `courseStats()` still shows 53 lessons done.
  - With `last` = a started Stage 3 lesson (trills), Continue stays there until that lesson is done, then drops to Stage 1.
- Same for anyone who had finished checkpoint 42.✓ (u-superimpose-check).
- Appending is the sanctioned way to add a step ("append new steps, never insert or reorder"). This side effect hits every player who updates past a finished checkpoint.
- Fix idea: a lesson completed before a step was appended stays complete. For example, store the step count at completion and treat later steps as "new, optional" or offer them in the session, instead of reopening the lesson and resetting the level.

### M3. A malformed item in `bassclass.session.v1` blanks Home for good; the only way out is "Reset progress"
- Where:
  - `web/js/course/progress.js:212`: `items()` keeps any object with a string `id`.
  - `web/js/ui/course.js:68`: `lessonOf` calls `it.ls.split`, which throws for a non-string `ls`.
  - `course.js:217`: `lessonOf(it).title` fails for a demo with no `ls`.
  - `course.js:61`: `stepTag` reads `l.steps` for a "Lesson …", "Checkpoint" or "Stage test" slot with no `ls`.
- Steps: set `bassclass.session.v1` to `{"cur":{"seed":1,"lists":{"30":[{"id":"tech-muting","ls":5,"slot":"Warm-up"}]}}}` and open the app.
- Expected: the item is dropped (or the plan rebuilt) and Home renders, as for the other 10 corrupt values.
- Actual: "Uncaught TypeError: it.ls.split is not a function", and `.main` has 0 children. Home stays empty on every start.
- The same blank Home with these values:
  - `ls` as an object `{a:1}`;
  - `extra: [{id:'tech-muting', ls:7}]`;
  - `demo: 1` with no `ls`: "Cannot read properties of null (reading 'title')";
  - slot "Lesson 3" with no `ls`: "… (reading 'steps')".
- Recovery:
  - The course map (whose Reset also clears the session) is only reachable from Home.
  - The way out in the app is Settings → "Reset progress", which wipes all progress and the course.
- The app never writes these values itself. Reachable by corrupt storage or a future format change. Same class as round 2's M6.

## Minor

### m1. Once nothing new is left, the 45′ and 60′ sessions are about the same length
- Where: `course.js:150-151` fills the rest of the plan from one `buildRoutine`, which has 6 slots (one per WARMUP_SLOT), minus duplicates.
- Evidence: all units known, 20 seeds, exercises after the warm-ups:

  | Length | Planned | Actual |
  |---|---|---|
  | 15′ | 2 | 2 |
  | 30′ | 5 | 5 |
  | 45′ | 8 | 6–8, avg 7.5 |
  | 60′ | 11 | 6–8, avg 7.7 |

- A new player and a mid-course player reach 8 and 11.

### m2. With the loop off, playing an item through from the first note earns nothing
- Steps: open a session item (fb-cycle-zone, `ls=u-neck-check.1`, `wu=1`), turn off Loop, play from the first note to the end.
- Actual:
  - `cur.played` is unchanged and the row is not ticked.
  - The lesson step stays at `loops 0, best 0`.
  - In the Library, best BPM is not credited either.
- Cause: `player.js` queues 'end' without a 'loop' event. `exercise.js:215` ticks only in `onLoop`; `onEnd` (`:235`) ticks demos only.
- CLAUDE.md: an item is ticked "once it is played through once (a full loop, or the demo)".

### m3. "✓ Practised" has no guard: a double tap files the new plan unseen
- Where: `course.js:246`. There is no confirmation and no check that anything was played.
- Evidence: 16 taps in a row left 12 history entries of unplayed sessions, and the focus moved on with every tap (Chords → Lines → Ear → Scales …).
- A double tap files the freshly planned session as practised: its exercises are then left out of the next two plans, and its focus topic is skipped.

### m4. A kept plan goes stale against the course
- Steps:
  1. Plan a session at Level 3.
  2. Finish Stage 3 without the placement.
  3. Open Home.
- Actual:
  - Home shows "My level L4" above "Today's session · Level 3".
  - The demos of lessons now complete stay unticked ("Hear it: Hammer-ons and pull-offs · Lesson 17.1"), while their steps show ✓. Demos tick only through `cur.played` (`course.js:213`), so "▶ Carry on" opens the demo of a finished lesson.
- The plan is kept until ✓ Practised by design. Ticking a demo whose lesson is started or complete would avoid the stale entry point.

### m5. CHANGED_STEPS rev 3 also drops tempos recorded on the new content (v1.0.44–45)
- Rev 3 keeps only ✓ Clean ticks made after `at` (`progress.js` `load()`).
- 8aa8df6 shipped in v1.0.44, so a v1.0.44/45 player's tempos and loops on those 62 steps were played on the new notes. They are deleted at the first v1.0.46+ start.
- Evidence: stored `rev 2`:
  - `giant-steps-arps.0 {best 150, loops 4, clean 0}` became `{best 0, loops 0}`;
  - `giant-steps-arps.1` with `clean = at + 1 h` was kept.
- One-time and a window of hours. Listed for completeness.

### m6. An ⓘ bubble survives a keyboard press that redraws its block, and a second ⓘ then opens a second bubble
- Where: `ui/dom.js` `infoBtn` closes only on pointerdown, Escape, scroll or hashchange.
- What happens:
  - Enter or Space on a session length button re-renders the session block (`render()`).
  - That removes the ⓘ button but leaves its bubble and its four document listeners in place.
  - The next ⓘ adds a second `.info-pop`.
- Evidence: Home fuzz seed 2201, steps 139–141 (clicks without pointerdown): "About today's session" opened, then "length 15′", then "About the course" → two `.info-pop`.
- Touch taps always send pointerdown first, so touch users are not affected; keyboard and accessibility activation are.

### m7. Triad inversions, "In one position" with the default root on E (4-string), is not one position
- Where: `triads.js:446`. The 2nd inversion borrows the 5th from below the root; with the root on the E string of a 4-string, that note can only be 5 frets lower on the same string.
- Evidence: C major: `C@E8/2 E@A7/1 G@A10/4 … G@E3/1 C@E8/2 …` (hand 3 ↔ 7). 32 of 48 builds (12 keys × 4 qualities) shift 2+ frets inside the chord.
- The option label ("In one position") and the about text ("keeps all three around the root") promise one position.
- Course steps use the root on A (`inversions.0`, `u-triads3-check.2`), which is fine. Present since the first commit, not reported before.

### m8. Upper-structure triads can sit an octave and more above the root
- Where: `triads.js:863` takes the upper root up to 22 semitones above the bass. Since 8758db5 the triad is one shape there.
- Evidence (4-string, fret 20):
  - V/I over C: `C@E8/1`, then `G@D17/2 B@G16/1 D@G19/4` and back: a 9-fret jump twice a bar.
  - ♭VI/7: `A♭@D18 C@G17 E♭@G20`.
  - G2-B2-D3 (`G@D5 B@D9 D@G7`) is one shape next to the root.
- The commit says "one hand shape near the root". The shape is right; the octave is far.

### m9. Suspicion: the five-fret stretch rule also applies at the nut
- `handFingers` gives the same 1-to-5 spread at frets 1–5 as at fret 12.
- Examples (4-string):
  - two-octave F major: `F@E1/1 C@A3/3 A@E5/4` (index fret 1, little finger fret 5);
  - F7: `F@E1/1 E♭@D1/1 C@A3/3 A@E5/4`.
- Library-wide, 12,394 one-position chord segments span frets lo..lo+4 with lo ≤ 3 (place-check11 `span5nearNut`, 4-string sweep).
- It is a real stretch at the widest frets. Question for the user: accept it there, or prefer the open string or a shift below fret 4.

## Visual

### V1. ⓘ bubbles can run off the bottom of short screens, and scrolling inside them closes them
- Where:
  - `ui/dom.js:112` puts the bubble below the button when it fits neither below nor above.
  - `.info-pop` has `max-height: 60vh` (`app.css:547`).
  - The capture scroll listener (`dom.js:116`) also fires for the bubble's own scroll.
- Measured:
  - 640x300 Home, session ⓘ at y 149: the bubble spans 185–365 px of a 300 px window. Lines 5–7 ("🎯 A focus topic…", "⏱ About 5 min each…", "✓ Practised…" at 291–358) are off-screen. Scrolling the bubble closes it.
  - 780x360: 181–365 (5 px off). Monkey 1102 flagged it 5 times.
  - 640x300 course map, Stage 5 ⓘ: 171–306 (6 px off).
- At 844x390 and 360x780 every bubble fits (2 Home, 32 map, 34 Library, 10 topic, lesson, placement, Settings and tuner ⓘ).
- Fix idea: clamp the top to `innerHeight - height - 8`, cap the height to the window, and ignore scroll events from inside the bubble.

### V2. Home in portrait (360x780): the Course row breaks and session titles are cut short
- Where: `.block-head.course-row { flex-wrap: nowrap }` (`app.css:401`) and `.course-go b { flex: none }` (`:404`).
- Course row: the Continue button is 26 px wide (x 216–241). Its "▶ Continue" label (228–306) runs under the Map button (249–327), and the lesson name gets 0 px.
- Session rows: titles are cut to 8–12 characters ("Stretch bui…", "Hear it: Stretch…", "Endurance 16t…").
- Screenshot: `C:\Users\OscarGaya\.claude\projects\E--CLAUDE-BassClass\c7f026a2-fcf4-440e-b62e-e6df46b13395\tool-results\mcp-Claude_Browser-blob-1792591403930-3pyfz7.jpg`
- Landscape:
  - 915x412 (two columns) cuts 1 title of 9 ("Legato chromatic (one pluck per string)", 251 > 241 px).
  - 640x300 cuts the course-row lesson name ("Lesson 17.1 · Hammer-ons and p…"). That ellipsis is designed.

### V3. ⓘ buttons are 30x30 px
- `app.css:544`. That is under the ~32 px target: 197 in the Library, 62 on the map, 2–3 on most screens.
- On cards the ⓘ sits at the end of the chips row with negative margins.

## Checked and fine
- **Self-test:** `problems: 0`: 191 exercises, 242 lessons, 26,289 builds, 1,483,008 notes.
- **Round-10 fixes confirmed:**
  - C1 (code read): `resetCourse` stores `rev: REV`. A bad stored `rev` (`1e308`) counts as 0.
  - M1: rev 3 lists the 62 steps.
  - M2: in 128,440 chords that fit five frets (30,690 builds, 4/5/6 strings), 0 reversed and 0 crowded finger numbers (e.g. 1-3 on adjacent frets). 4 are labelled with a shift: sl-grooves, 5-string, F minor, `F@E1/1 … F@D3/1`.
  - m3: 0 pitches in two places in sl-grooves, sl-thumb-pop, sl-double-thumb and 7 lick exercises (4/5-string). sl-advanced popFill 0. In sl-advanced ghostFunk B♭ is hammered on D and pulled off on G: the slap-legato case in the decisions.
  - m5 (two-octave arpeggios, 4-string, fret 20): 118 of 120 7ths and 48 of 48 triads shift exactly twice.
    - E♭ maj7♯5 and 7♯5 still shift 6 times.
    - At max fret 12–17 the upper octave falls back to a line with the notice shown: 266 builds over the limit, 0 without a notice.
    - 5-string E major: the octave shift is a 5-fret little-finger jump (`E7/4 → E12/4`).
  - m7: tap, then Back in one turn, returns to the lesson at the same depth.
  - m9: map Back from the top returns to 0, and from 1,500 to 1,500.
  - V1: 0 cut subtitles or titles in 15 checkpoint and test steps at 915x412.
- **R-5-10:** 8,503 of 9,216 root-position chords keep the E-A-G / A-D-C shape (4/5/6 strings, fret 17/20). The rest sit at the top of the neck. 0 are not one position.
- **Upper structures:** badge = the lower chord (Cmaj7 / C7 / Cm7); text = the upper triad (D/C, G/C, Em/C, A/C, A♭/C, E♭/C, G♭/C, B♭/C).
- **Session:**
  - New player: the first lessons after 2 warm-ups; 2/5/8/11 exercises.
  - Placement mid-course and all known.
  - "+ More warm-up" ×34, then the toast "No other warm-up at your level".
  - History capped at 12.
  - My level returns to Home with the chip L3, re-plans at Level 3 and toasts "Start here: Lesson 17.1 …".
  - Course reset clears the plan.
  - A full loop ticks the row (`cur.played`) and records the lesson step.
  - 10 other corrupt session values render Home: garbage, array, empty or non-array lists, string seed, null cur, 50,000-entry history, removed exercises and lessons, level 99 (clamped), string params, object slot.
- **ⓘ:**
  - Every bubble removes its pointerdown, keydown, scroll and hashchange listeners when it closes.
  - It closes on a second tap, an outside tap, Escape, scroll and a route change.
  - A tap on a card's ⓘ never opened the exercise (34 cards × 4 sizes).
- **Monkey:** 0 app errors, NaN or undefined text, stuck players, ghost audio or pads, tip leaks, listener growth or horizontal scroll in 1,010 steps plus 150 Home actions.
  - The depth notes came from Chrome's 50-entry history cap.
  - The 'lesson-write' notes are the known `plays: undefined → 0`.
- **Storage and routes:**
  - Corrupt values: garbage settings; `strings 7`, `maxFret 3`, `bassVol -5`, `notation "xx"`, `a4 9999`; progress with `lastBpm "fast"` and options that no longer exist; junk favourites; course `rev 1e308` with junk steps.
  - Routes: `#/ex/nope`, `#/m/nope`, `?key=99&scale=zzz&lick=999`, `wu=999`, `ls=one-finger.99&demo=1&rv=1`, `#/course/nope-lesson`, `#/course/placement/zz`, `#/ex/9999`.
  - Result: 0 errors and no bad text.
- **Memory:** 100 cycles of Home → ⓘ → length → session item → play → Back → map → lesson (Read more, ⓘ) → Library.
  - Heap 17–40 MB in a sawtooth with no trend.
  - 2,633 nodes on the Library every time; listener counts and the 4,423-byte session store constant.
  - Monkey heaps 8–43 MB with no trend.
- **Timing (logged `Player`):**
  - tech-1234 at 260 BPM in sextuplets, wk-two-feel at 200 and lk-ii-v-i at 240: one bar (4 clicks) of count-in, 0 ms grid error, seamless loops, whole bars.
  - Speed trainer: 200 → 204 → 208 → 212, then stays at 212.
- **Tuner:** yin on 150 tones (weak fundamental, ±0.2 noise, detune −30 to +37 cents, 12 kHz) found the right note every time. The worst error is 3.33 cents; 3 cases are over 2 cents (B0, E1 and G1 with noise). `pitch.js` and `audio.js` are unchanged since f060af0.
- **Course map:** the S1/S3/S6 jumps land below the sticky bar at 640x300, and no row hides under it after a jump.
- **Checkpoints:** every Stage 1–2 checkpoint now has the steps its "I can" lines name. The lines left without a step are posture or knowledge lines.
