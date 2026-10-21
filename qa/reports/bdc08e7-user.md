# QA User report · bdc08e7 · 2026-10-21

Setup: eleventh round, on release v1.0.49. Focus: the changes since 341ccfe: 8758db5 (QA round 10 fixes: fingering, R-5-10, upper structures, texts, map), 20a65b7 (new Home: My level, Course row, Today's session, Favourites; ⓘ bubbles everywhere), 1975d84 (lesson step rows) and bdc08e7 (Library and topic cards: title + chips + ⓘ). Judged against the owner's goal: simpler, phone-friendly, less text, explanations only on request, nothing duplicated, one way to each thing.
- Server and tab: my own `qauser` server (port 8890), opened as `http://127.0.0.1:8890` in my own tab (tab-16). The "seed" tab and ports 8765/8878 were not touched.
- Profile: empty at the start (service worker unregistered, caches and localStorage cleared), cache-busting `?qa=u11a…u11f`. States used: brand-new player; a Stage 2 student (lessons up to 12.1 done, 15 reviews due); a Stage 3 student (up to 20.1 done); a player placed at Stage 4 with real taps in "My level"; a course graduate (all lessons done). Course and session storage written by me for these states; cleared again at the end. Viewport reset, tab closed, server stopped.
- Sizes: 780x360 (main), 640x300, 915x412, 1024x768; 4-string (fingering sweeps also on 5/6-string where noted).
- Method: real taps for Home, Start/Carry on, Next, Back, ✓ Practised, + More warm-up, My level (All yes / All not yet / See my starting point), lesson rows, Read more, ⓘ bubbles, Library card ⓘ, Play (one full loop of a warm-up, to check the tick); DOM measurements (`getBoundingClientRect`, `scrollWidth/clientWidth`); the app's own modules for 90-session plan simulations (`sessionBlock()` after `clearSession()`), and fingering sweeps over every select option × 12 keys (`qa/tools/user11.js`; a `rcheck()` variant flags chords whose fretted notes span 4 frets or fewer and whose finger numbers put one finger on two frets, contradict the fret order, or (span of exactly 4 frets) differ from one finger per fret).
- Personas: beginner (first launch, first session, Lesson 1.1, Library, Settings, tuner), advanced player (My level, session at Levels 3–6, Library cards, topics, options), jazz/bass teacher (finger numbers and shapes after the round-10 fixes, upper structures, R-5-10, two-octave arpeggios, every exercise summary now behind ⓘ, the new ⓘ texts).
- Not testable here: hearing the sound, the microphone, the Android app, real days passing (spaced reviews and "today" were simulated through storage). Screenshots render at odd scales; layout findings are DOM measurements. Screenshot paths are under `C:\Users\OscarGaya\.claude\projects\E--CLAUDE-BassClass\c7f026a2-fcf4-440e-b62e-e6df46b13395\tool-results\` (shortened to `…\` below).

Counts: Blocking 1 · Wrong 1 · Confusing 3 · Irritating 3 · Texts 8 · Visual 5, plus 6 questions.

## Expert verdict (short)

The new Home is much calmer: three blocks, one corner button, no grey paragraphs, and the ⓘ bubbles work (tap, tap again, tap outside, Escape; a card's ⓘ never opens the card). The round-10 fixes landed: no more "one position" claims, upper structures are one shape with the lower chord as the badge, #155 has no shape problems, the R-5-10 checkpoint plays in F (frets 1–15), the voice-led and harmonised chords (chordShape) have 0 label problems, and the beginner triads and 7ths (#15, #46, #48, #50) are clean.

What weighs most now:
- Today's session marks its warm-ups and its focus exercise as done (✓) before anything is played, for every player who has finished lessons, and "▶ Carry on" then skips the warm-ups.
- 94 lessons and checkpoints now show two or three step rows that are word-for-word identical (title, number, goal), because the step text left the row; the session rows have the same problem (Q1).
- Finger numbers in the chord-tone patterns (#85, #125, #161, #52, #119, #103) still contradict one hand position: Dm7 2-4-4-2, E7 3-2-4-3, Cmaj7 1-1-3-2, a 10th 4-4. Six course steps show them, Lesson 46.1 in all three of its steps.

## Blocking     (a user cannot do what the screen is for)

### B1. Today's session shows the warm-ups and the focus as already done, and "▶ Carry on" skips the warm-ups
- Where: Home → Today's session, any player with completed lessons (Stage 2 student, Stage 3 student, graduate).
- What I did: removed the planned session, reloaded Home (nothing played: `played: []` in `bassclass.session.v1`), then tapped the main button.
- What I saw: both warm-up rows and the focus row start with "✓" instead of their number; the main button reads "▶ Carry on" instead of "▶ Start"; a real tap opened item 3, the Review (`#/ex/fb-open-strings?reps=2&ls=hold.0&rv=1&wu=2`). "+ More warm-up" adds rows that are ticked the moment they appear (4 of 4). Simulated plans: warm-ups ticked 180 of 180 and focus items 150 of 150 (Stage 3 student, 90 sessions of 30/45/60 min); the same for the graduate. A brand-new player is not affected (their warm-ups come from the Library).
- Why it matters: the session is the teacher's plan for the day, and its ticks and its main button are how the player follows it. As it is, the warm-up is never started by the button, and a player trusting the ticks never plays the focus exercise. The ⓘ promises "✓ once played through".
- Evidence: `…\mcp-Claude_Browser-blob-1792589171539-01n97q.jpg` (Stage 2 student, 780x360: "✓ Finger permutations (all 24)", "✓ Note-finder quiz", "Level 2 · Focus: Scales"). Cause in `ui/course.js` `sessionBlock`: `isPlayed` also counts `stepClean(lesson, i)` for every item with `ls`, and the warm-ups and the focus are steps of lessons already done (`metSteps`), so their steps are clean from the lesson.
- Suggestion: count `stepClean` only for the course items (slot Lesson/Checkpoint/Stage test), never for warm-up, focus or fill-in items.

## Wrong        (incorrect musical or factual information)

### W1. Finger numbers that contradict one hand position in chord-tone patterns, 10ths and 7th inversions
- Where: course steps 30.3 step 1, 30.✓ step 2, 35.1 step 1, 46.1 steps 1, 2 and 3; Library #85 `hm-chord-tones`, #125 `hm-minor-keys`, #161 `hm-colour-chords`, #52 `hm-12-bar-blues`, #55 `gr-blues`, #80 `tri-inversions`, #103 `iv-tenths`, #119 `arp-inversions`, #191 `sl-double-thumb`. Dot labels: Fing.
- What I saw (chords whose notes fit four frets; the textbook fingering after the arrow):
  - 46.1 step 1 (#161, C): `[Dm7] D@A5 f2, F@A8 f4, A@D7 f4, C@G5 f2` → 1-4-3-1 (the little finger on frets 8 and 7); `[Cmaj7] C@A3 f1, E@A7 f4, G@D5 f2, B@G4 f1` (the index on frets 3 and 4).
  - 46.1 step 2: `[Cmaj7] C@A3 f1, E@D2 f1, G@D5 f3, B@G4 f2` → 2-1-4-3 (the standard maj7 shape).
  - 46.1 step 3: `[D♭7] D♭@A4 f3, F@D3 f2, A♭@D6 f4, C♭@G4 f3` → 2-1-4-2.
  - 30.3 step 1 (#125): `[E7] E@A7 f3, G♯@D6 f2, B@D9 f4, D@G7 f3` → 2-1-4-2; 30.✓ step 2: `[Bm7♭5] B@E7 f2, D@E10 f4, F@A8 f3, A@D7 f2` → 1-4-2-1.
  - #85 with I–iv–I in C: `[Fm] F@A8 f2, A♭@A11 f4, C@D10 f4` → 1-4-3 (the round-10 W2b problem, still here in this exercise); #52 in F: `[C7] C@A3 f3, E@D2 f2, G@D5 f4, B♭@G3 f3` → 2-1-4-2; #55 in B: `[E7] G♯@E4 f4, B@A2 f2, C♯@A4 f4, D@A5 f4` (three notes on the little finger).
  - #119 in D♭: `[D♭maj7] D♭@E9 f2, F@A8 f1, A♭@A11 f2, C@D10 f1` → 2-1-4-3 (2-1-2-1 reverses the fret order); in E♭: `E♭@E11 f4, G@A10 f3, B♭@D8 f1, D@D12 f1` (the index on frets 8 and 12).
  - 35.1 step 1 (#103 broken 10ths in C): the same 10th C–E (E8/G9) is labelled 1-2, then 2-3, then 4-4 in one loop; `[Dm]` 3-3 and later 4-4.
- Counts (every select option × 12 keys, 10,397 builds): #85 108 chords, #125 56, #52 45, #161 42, #191 12, #103 12, #80 7, #89 7, #124 6, #55 5, #87 4, #119 2. In the course: the 6 chords above.
- Also: three-note shapes over five frets are labelled against the app's own rule (`handFingers`: 1-3-4 on lo, lo+2, lo+4): Lesson 25.1 step 1 and 25.✓ step 1 (#85, C): `[F] F@E1 f1, A@E5 f4, C@A3 f2` (1-4-2); #150 `[C] C@D10 f1, E@D14 f4, G@G12 f2`.
- Why it matters: finger numbers are the app's fingering advice; a teacher sees the little finger on two frets in a four-fret m7 chord, and a Level 2 student playing the blues in F is shown the C7 shape with the wrong fingers.
- Cause (as far as I can see): `onePosition()` in `fretboard.js` accepts a stretch (finger 4 at hand+4, finger 1 at hand−1) as one hand position even when the chord fits four frets without it, so `chordFingers` keeps labels that put the hand one fret off.
- Suggestion: when the frets span four or fewer, re-finger from the lowest fret (`handFingers`) regardless of the stretch tolerance.

## Confusing    (misleading, illogical, makes no sense)

### C1. "My level" and the session's level disagree, and one loop of a far lesson changes "My level"
- Where: Home, "My level" chip and the session's level chip.
- What I did: placed at Stage 4 with real taps (Stages 1–3 All yes, Stage 4 All not yet). Home: "My level L4", session "Level 4", Course "▶ Continue Lesson 27.1". Then opened Lesson 50.1 from the map and played step 1 once (one full loop recorded).
- What I saw: Home now reads "My level L6" and "▶ Continue Lesson 50.1 · Odd groupings in 16ths" while the session still says "Level 4" and lists Lesson 27.1 steps. Opening another lesson page (Checkpoint 28.✓) brought it back to "L4" and "Lesson 27.1".
- Why it matters: the corner button is the player's level; it should not jump two levels because of one curious loop, and two level chips on one screen should not disagree. Cause: the level is the stage of `continueLesson()`, which returns the last lesson opened when it was started; the session keeps the level it was planned with.
- Evidence: `…\mcp-Claude_Browser-blob-1792589256528-e8ulxq.jpg` ("My level L6", "Continue Lesson 50.1", session "Level 4").

### C2. Two "▶ Start" buttons on a new player's Home, two routes into the same lesson
- Where: Home for a new player: Course row "▶ Start Lesson 1.1 · Holding and tuning the bass" and the session's "▶ Start" (both primary buttons).
- What I saw: the Course button opens the lesson page (idea, Read more, Open the tuner, Hear it, steps, Watch out). The session button opens "Chromatic 1-2-3-4" at fret 5 (`#/ex/tech-1234?pos=5&wu=0`), then "Notes and rests", then the Lesson 1.1 demo and step without the lesson page; the posture and tuning text is reachable there only through the exercise's ⓘ drawer.
- Why it matters: the owner asked for one way to each thing; a beginner has two equal green buttons and the one at the bottom skips the lesson page. Evidence: `…\mcp-Claude_Browser-blob-1792588695585-bfrfk8.jpg`.

### C3. After "✓ Practised" a Level 1 player gets one warm-up, not two, and it is not a hands warm-up
- What I did: new player, played warm-up 1 through once, tapped ✓ Practised.
- What I saw: the next session has a single warm-up, "Natural notes on one string" (fretboard). The ⓘ says "🔥 2 warm-ups" and the plan rule is "hands first".
- Cause: `warmUps()` asks the second slot for `out.length ? n - out.length : 1`; when the hands pool is empty (both Level 1 technique exercises, #1 and #2, were in the last session) the second slot asks for one, not two.

## Irritating   (works, but annoys or slows the user)

- I1. "✓ Practised" is active with nothing played, with no question and no undo. One tap with 1 of 10 played replaced the plan (toast "Practised ✓ The next session is ready."), and the history recorded all 10 ids, so the skipped exercises are left out of the next two sessions' warm-ups and focus.
- I2. A brand-new player gets the same exercise as a warm-up and as a course step: 82 of 90 simulated plans (30/45/60 min). Examples: "Alternate plucking" warm-up plus Lesson 1.2 (60 plans), "Chromatic 1-2-3-4" warm-up plus Lesson 1.4 (28); the 45′ plan lists "Chromatic 1-2-3-4" four times (warm-up, 1.4 step 1, 1.4 step 2, checkpoint), and the 60′ plan lists "Open strings" four times.
- I3. At 640x300 the session pushes Favourites to y 1,111 of a 1,266-px page (60′ plan): an advanced player who uses favourites scrolls about four screens.

## Texts        (typos, unclear wording, inconsistent names)

- T1. The survey is "My level" on Home and on its page, but two texts still say "placement": the lesson chip "known (placement)" and the map's reset question "Reset all course progress (tempos, ticks, reviews and your placement)?".
- T2. 🎯 means the tempo goal in the course (ⓘ "steps with a 🎯 tempo goal", rows "#56 · 🎯 88 BPM", the goal button "🎯 –/132") but "🎯 A focus topic, a new one each session" in the session ⓘ.
- T3. Two ⓘ styles: the new schematic lines (Home, session, map, lesson, placement, tuner) and the old prose moved into bubbles: Stage 5 252 characters, Stage 4 221, Stage 3 193; unit goals up to 103; the Path ⓘ "Pick a topic. Each one lists its exercises in order…" (two sentences); "About BassClass" (three sentences).
- T4. Information shown twice: every Library card has the level chip of the section it sits in (191 "L1…L6" chips under "Level N" headers); every topic card repeats the topic ("🎼 Scales" on each Scales card); the session shows "Level 4" next to "My level L4" (and "Level 1" for a new player whose "My level" shows no chip); the "Focus: Scales" chip plus the "Scales" tag on its row; the Path cards show each topic's description and the topic page's ⓘ shows it again. Evidence: `…\mcp-Claude_Browser-blob-1792589333973-mno98r.jpg`, `…\mcp-Claude_Browser-blob-1792589377189-9jiip0.jpg`.
- T5. The "core" chip on cards (#12, #71…) is explained nowhere, now that the card description is hidden.
- T6. The session ⓘ says "⏱ About 5 min each", but the 15′ plan holds 4 exercises plus a demo (2 warm-ups, 1 review, 1 step) and the 60′ plan 12–13 exercises plus demos: the warm-ups are planned at about 3 minutes.
- T7. The Home button "Map" opens a page titled "Course".
- T8. #2 Chromatic 1-2-3-4 and #57 Legato chromatic: the descent from the top reads "D♯ D D♭ C" (the turn note keeps its sharp, the next ones go flat): three different D's in one group, which on the staff needs ♯, ♮ and ♭ on one line. Evidence: `…\mcp-Claude_Browser-blob-1792588784737-s6q7q0.png`.

## Visual

### V1. The session ⓘ bubble runs off the bottom on small phones and cannot be scrolled
- 640x300: bubble 185–365 in a 300-px window, the last lines ("⏱ About 5 min each…", "✓ Practised…") hidden; scrolling closes the bubble. 780x360: bottom at 364 of 360. Evidence: `…\mcp-Claude_Browser-blob-1792589426701-edekbx.jpg`.

### V2. Tablet 1024x768: Home keeps a three-column grid with the third column empty
- `.home-cols` is `291px 291px 291px`; Session at 88–379, Favourites at 393–684, nothing at 684–989; 10 of 13 session titles are cut ("Walking with chromati…", "Secondary dominants,…"). Evidence: `…\mcp-Claude_Browser-blob-1792589903625-tenn0c.jpg`.

### V3. Lesson page: the left column stacks with no gaps
- Lesson 1.1 at 780x360: Read more 132–171, "Open the tuner" 171–208, "▶ Hear it" 208–246, "⚠ Watch out" 246–285 (0 px between each). Lesson 29.2 at 640x300: Read more 106–145, Hear it 145–183, "Practise" 183. Lesson 2.1 at 780: 51 px of empty space between the left column (bottom 189) and "Watch out" (top 240). Evidence: `…\mcp-Claude_Browser-blob-1792589949959-a7v1g6.jpg`.

### V4. Titles cut where the title is now the only information
- Course row at 640x300: "Lesson 27.1 · Stretching tow…" (251 of 192 px). Session rows at 780x360: 3 of 10 cut ("Hear it: Holding and tunin…", "Alternate plucking (in…" twice, where the tag is what tells them apart). Evidence: `…\mcp-Claude_Browser-blob-1792588718141-da2818.jpg`.

### V5. The Course ⓘ bubble covers the session's ⓘ
- 780x360: the course bubble (y 113–257) lies over the session ⓘ (y 145–175); a tap there lands in the bubble, so it takes two taps to open the second one. Evidence: `…\mcp-Claude_Browser-blob-1792588735658-h80oyh.jpg`.

## Questions for the owner

- Q1. Step rows with the title, number and goal only (decision of 2026-10-21): 94 lessons and checkpoints now have rows that are word-for-word identical, 200 of 556 rows. Examples: 2.1 "Steady pulse & the inner clock · #3 · 🎯 96 BPM" twice (click on every beat / only on 2 and 4) and a third at 84; 1.2 "Alternate plucking · #1 · 🎯 80 BPM in 8ths" twice (start with i / start with m); Checkpoint 28.✓ rows 4 and 5 "Odd metres: 5/4, 7/8, 7/4 · #99 · 🎯 132 BPM" (5/4 and 7/4; checkpoint and stage-test steps have no step text at all, 0 of 198, so not even the exercise tip says which one it is); 16.2 five rows of "Reading melodies in C, G, F, D and B♭ · #37 · 🎯 76 BPM". In the session the same (three "Open strings" rows, a Review row does not say which lesson). Add a one-to-three-word variant chip per row ("2 & 4", "5/4", "G major", "start on m")? Evidence: `…\mcp-Claude_Browser-blob-1792588942201-e7cqz4.jpg`, `…\mcp-Claude_Browser-blob-1792589320267-8bmwl7.jpg`.
- Q2. A brand-new player's first sessions open with two Library Level 1 warm-ups the course teaches later: in 120 simulated warm-ups, Chromatic 1-2-3-4 (taught in 1.4) 38 times, Alternate plucking (1.2) 26, Notes and rests (2.3) 10, Landmark frets (3.3) 9, Subdivision pyramid (2.2) 9, the octave shape (3.4) 8, All 12 notes on one string (3.2) 8; open strings (1.1) only 3. Should a player with no lessons done skip the warm-ups, or warm up on open strings until Lesson 1.4?
- Q3. "My level" is the only way into the survey, and its purpose is in a tooltip (not shown on touch). An experienced player on first launch sees "▶ Start Lesson 1.1 · Holding and tuning the bass" and a session full of Lesson 1.x. Show a one-time hint for new players ("Already play? My level")?
- Q4. Five-fret shapes at the nut follow from "open strings only where no fret has the note": the 12-bar blues in F (#52, Level 2) plays `[F7] F@E1 A@E5 C@A3 E♭@D1` and `[B♭7] B♭@A1 D@A5 F@D3 A♭@G1` (frets 1–5, the widest stretch on the neck), and Lesson 25.1 plays the IV of C as `F@E1 A@E5 C@A3`. Allow the open A and D for Level 2–3 chord tones low on the neck?
- Q5. Lesson 1.1's whole content (how to sit, where the thumb goes, how to tune) is behind "📖 Read more"; the visible idea is one line. Keep "Read more" open by default on the first lessons?
- Q6. "Today's session" stays until ✓ Practised, across days. A player who forgets the button sees yesterday's ticked plan under "Today's", and reviews that fell due since are not added. Is that intended, or should a new day re-plan an untouched plan?

## Status of the 341ccfe findings

| # | Finding (341ccfe) | Status | Evidence now |
|---|---|---|---|
| W1 | "Up one, down the next keeps the hand in one place" | fixed | no such claim left in curriculum or course; 51.4 "turns the chords into one line, but they still climb the neck" |
| W2a | Chord-tone finger labels | partly | `[D] D@A5 f2 F♯@D4 f1 A@D7 f4 D@G7 f4` now right; W1 above for the rest |
| W2b | Beginner triads/7ths | fixed | #15, #46, #48, #50: 0 label problems |
| W2c | chordShape 1-3-4 on lo, lo+1, lo+4 | fixed | #151, #81 2nd inv., #117 dim, #160, #182, #184: 0 of 222 chords |
| C1 | R-5-10 checkpoint, 5th on the D string | fixed | 32.✓ step 3 in F, frets 1–15; 5th on the string above the root in 263 of 288 chords, the other 25 at frets 16–20 |
| C2 | Map after the placement | fixed (decision) | the survey returns to Home with "Start here: Lesson 27.1 · Stretching towards the nut" |
| C3 | Upper structures II/I = II/7 | fixed (decision) | badge Cmaj7 vs C7, about text right, one shape `D@D12 F♯@G11 A@G14` |
| C4 | #78 title and tips | fixed | "(three hand positions per triad)"; tips "in major", minor "3, 1 and 4" |
| C5 | 42.✓ and 7♯11 | fixed | step 3 `set: dominants` |
| C6 | Placement "9th position" | fixed | "read in 5th and 7th position" |
| C7 | "A minor…", "A major…" | fixed | "Minor-key ii–V–i…", "Two octaves of a major triad" |
| I1 | Upper structures on one string | fixed | one hand shape in all nine options |
| I2 | #155 shifts inside four notes | fixed | 0 shape problems, one shift per chord change |
| I3 | Two-octave 7ths on 6-string | partly | 4/5-string: 2 shifts for maj7, 7, m7, m7♭5, m(maj7), 6; 6-string maj7 labels still change hand inside the upper octave (`C@A15 f3 E@D14 f2 G@G12 f1 B@G16 f4 C@C12 f1`); m6 (12), dim7 and ♯5 chords (8) also on 4-string |
| I4 | S1–S6 only at the top | fixed | sticky jump bar |
| T1–T4 | Texts | fixed | "My level" everywhere except T1 above; "0/22 lessons (22 known)"; legato top keeps its sharp (T8 above); #106 retitled |
| V1 | Map hides the header for a new player | fixed | new player: `scrollTop 0`, title at y 12, S1–S6 at 42–100 |
| V2 | Headers cut at 640 | fixed | exercise subtitle "Lesson 18.4 · step 1/2 · goal 84 BPM in 16ths" 213/213 px |
| V3 | Tip over the strip | decision | bottom right |

## Checked and fine

- Home: three blocks and the corner button, no grey paragraphs; Course row Start → Continue → "✓ Course complete" with Map; 15′/30′/45′/60′ keep their own list (warm-ups the same in each); the plan stays the same after reloads until ✓ Practised; ✓ Practised moves the focus Scales → Chords → Lines and grooves → Ear and reading → Scales (5 sessions checked) and changes the warm-ups (the last two sessions left out); a full loop of a warm-up ticks it and the button becomes "▶ Carry on"; the placement re-plans the session (Level 4, Stretching, Endurance, Harmonics, Checkpoint 27.✓); the graduate gets reviews then "Library · L5"; empty Favourites text "Tap ☆ on any exercise to pin it here."
- ⓘ bubbles: open/close on tap, second tap, outside tap, Escape; a Library card's ⓘ opens its bubble without opening the exercise; bubbles stay inside the window horizontally (12 px margin) at every size.
- New ⓘ texts are correct: course, session, map ("▶ next lesson · ◐ started · ✓ done or known", reviews after 1, 3, 7, 21, 60 days), steps ("One full loop from the first note at the goal tempo, then ✓ Clean"), checkpoint and test lists, Hear it, survey, tuner, Library ("All 191 exercises…"), levels, Settings (strings, handedness, About).
- Exercise summaries behind ⓘ (all 191 read as a teacher): no wrong facts (pentatonic superimposition sets, melodic-minor, harmonic-minor and harmonic-major mode names, Messiaen modes 6–10 notes, Barry Harris 6th-diminished and dim7 → four dominants, 11 of 12 notes in a 4-fret position, Giant Steps key centres B–G–E♭, upper structures 9 ♯11 13, 13♭9, ♯5♯9, ♯9, ♭9♯11, Cm11).
- Lesson pages: idea in view, "📖 Read more" and "⚠ Watch out (n)" fold and unfold; the step instruction is still in the exercise tip and at the top of the exercise's ⓘ drawer; step rows "#99 · 🎯 132 BPM", "#97 · 🎯 76 BPM in 16ths", "one full round" for ear steps.
- My level: real taps, Stage 3 All yes filled Stages 1–2, Stage 4 All not yet answered 4–6, hint "20 statements still to answer…", then "See my starting point" → Home with the toast and "My level L4".
- Fingering engine (round-10 targets): chordShape exercises 0 problems (#81, #117, #151, #160, #182, #184); #155 clean; upper structures one shape; #78 forms right (major 2/1/4, minor 3/1/4); R-5-10 5th on the string above; two-octave 7ths in the course (34.2, 34.✓) one shift each way; #85 key A R-3-5-8 now 2-1-4-4.
- Layout: map for a new player shows its top; exercise header fits at 640; Library cards wrap their titles (73 of 191 on two lines, none cut), card heights 84–94 px; 915x412 two columns fine; tuner unchanged and clear.
- British spelling in every new text ("Practise", "practice" as a noun, "favourites").
