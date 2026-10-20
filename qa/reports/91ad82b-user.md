# QA User report · 91ad82b · 2026-10-20

Setup: eighth round, focused on the new guided Course (91ad82b: Home course block, course map, 52 lessons + 16 checkpoints + 2 stage tests, placement check, today's session, lesson mode in the exercise screen), plus a short re-check of the round-7 fixes (ef98260, c2ee937, 88ba8b4).
- Server and tab: my own `qauser` server (port 8890), opened as `http://127.0.0.1:8890`, in my own tab. The "seed" tab and ports 8765/8878 were not touched.
- Profile: empty at the start (service worker unregistered, caches and localStorage cleared), cache-busting `?qa=u8a…u8e`. Cleared again at the end; viewport reset, tab closed, server stopped.
- Sizes: 800x380 (main), 640x360, 915x412, 1024x768. Basses: 4-string in the app; 5 and 6-string builds of every course step.
- Method:
  - built every course step (150 steps) with the app's own modules and the step's preset, read notes, strings, frets, fingers, degrees and tags, and compared them with the lesson's idea, concept, step text, mistakes and "I can…" lines (`qa/tools/user8.js`: `courseDump()`, `courseTempos()`);
  - real clicks for the flows: Start lesson → ▶ Hear it (demo plays once, "Your turn: tap Practise ›") → Practise › → a loop at the goal → ✓ Clean? → Next › → Done › → lesson page; a lesson completed; Options changed → "↺ Lesson options" → restored; placement (mixed answers and all "Yes"); today's session 15/30/45 min with Next through items; a due review (I moved the review date in my own storage) → "✓ Still clean?" → "Reviewed ✓ Next review in 3 days";
  - DOM measurements (`getBoundingClientRect`, `scrollWidth`/`clientWidth`) for layout.
- Personas: beginner (Home, Lesson 1.1 onward, session, Settings), advanced player (placement, sessions, tempos, options), jazz/bass teacher (every concept, fingering, interval and form claim against the exercise it opens).
- Not testable here: hearing the sound and the pad, the microphone, the Android app, real days passing (reviews tested by editing my own stored date). Screenshots render at odd scales; layout findings are DOM measurements. Screenshot paths are under `C:\Users\OscarGaya\.claude\projects\E--CLAUDE-BassClass\c7f026a2-fcf4-440e-b62e-e6df46b13395\tool-results\` (shortened to `…\` below).

Counts: Blocking 0 · Wrong 4 · Confusing 13 · Irritating 5 · Texts 10 · Visual 6, plus 5 questions.

## Expert verdict (short)

The Course is a real step forward for a beginner: one clear "Start: Lesson 1.1" button, short concepts in plain English, a demo that plays once and hands over ("Your turn: tap Practise ›"), a goal button that reads its own state ("🎯 – / 80" → "✓ Clean?" → "✓ Clean"), "↺ Lesson options" when an option is changed, a working review cycle and a placement that starts at the first gap. Most texts are musically right (open strings, alphabet, landmarks, bass clef and the octave-up writing, major-scale fingering 2-4 / 1-2-4 / 1-3-4, triad shapes, 12-bar form, swing as triplets, key signatures, blues scale).

What weighs most:
- several steps show something other than what the lesson says, the worst being the "Disco octaves" make-music step and checkpoint (open string + 12th fret on the same string, no string skipping);
- the quiz steps (note finder, interval ear quiz) print the answers in the tab strip, so 10.4, 11.3 and their checkpoints cannot test what they claim;
- a step's tempo goal ignores the subdivision (Lesson 1.1 passes at 80 BPM in quarter notes), and the 7th-arpeggio steps open in 16ths (6.4–6.9 notes a second at Level 2);
- four wrong statements in the lesson texts (12.2, 10.1, 13.3, 5.3).

## Blocking     (a user cannot do what the screen is for)

None.

## Wrong        (incorrect musical or factual information)

### W1. Lesson 12.2 "Four types from one root": "from one to the next only one note moves by a fret" is false for diminished → augmented
- Where: `#/course/four-types`, concept paragraph; step 1 = #46 `tri-four-types` (Major → minor → diminished → augmented).
- What I saw: C → Cm moves the 3rd one fret, Cm → C° moves the 5th one fret, but C° (C E♭ G♭) → C+ (C E G♯) moves the 3rd one fret and the 5th two frets. The exercise's own tip says it: "diminished → augmented moves both the 3rd and the 5th".
- Why it matters: the lesson's key sentence teaches a rule that the last change breaks, and the student hears two notes move where the text promised one.
- Suggestion: "major → minor → diminished: one note moves each time; augmented raises the 5th of the major triad" (or order the drill aug → major → minor → dim).

### W2. Lesson 10.1 "One note, several places": "Every note below fret 12 exists on two or three strings"
- Where: `#/course/unisons`, concept paragraph 1.
- What I saw: on a 4-string bass the lowest five notes (open E, F, F♯, G, G♯ at frets 0–4 of the E string) exist on the E string only.
- Suggestion: "Above fret 4 of the E string, every note below fret 12 also exists on a neighbouring string."

### W3. Lesson 13.3 "The chords of a key": "Root and 3rd are enough to hear each chord's quality"
- Where: `#/course/key-chords`, concept paragraph 2; step 1 = #50 `hm-chord-qualities`, "Root and 3rd on every degree. Say "major" or "minor" each time."
- What I saw: the vii chord (B° in C) has the same minor 3rd (B–D) as ii, iii and vi; the strip labels it "vii° · minor 3rd". Following the step, the student says "minor" for a diminished chord. Root and 3rd separate major from minor, not minor from diminished (that needs the 5th). #50's own about writes the pattern "M m m M M m m (diminished)".
- Suggestion: "Root and 3rd tell major from minor; vii also has a flat 5th, which makes it diminished."

### W4. Lesson 5.3 "Pentatonic scales": "five notes that never clash"
- Where: `#/course/pentatonics`, concept paragraph 1 (major pentatonic).
- What I saw: the key's major pentatonic does clash in places (C major pentatonic over G7: C is the avoid 11th against B). Round 6 corrected the same claim in #143 to "rarely clashes" (QA round 6, W5).
- Suggestion: "five notes with no half steps, so they rarely clash".

## Confusing    (misleading, illogical, makes no sense)

### C1. "Disco octaves" (Lesson 15.1 make-music step and Checkpoint 15.✓): the octaves are played open string + 12th fret on the same string
- Where: `#/ex/gr-octaves?style=octaves&ls=octave-grooves.1` (and `u-grooves-check.0`, goal 120); #54 default (vi–IV–I–V in A), 4, 5 and 6-string.
- What I saw: F♯m = F♯ @ E2 + F♯ @ D4, then the last octave jumps to A9; D = open D + D @ D12; A = open A + A @ A12; E = open E + E @ E12. 12 of the 16 root/octave pairs are on one string, on 4, 5 and 6-string basses (other keys, 4-string: D and E 8 of 16, C and G 4 of 16, plus "open A + A on D7" shapes). The strip reads "0 12 0 12 0 12…".
- Why it matters: the lesson says "The plucking hand skips a string on every note, so muting the string in between matters", "Index on the root, ring or little finger on the octave; let the fretting hand release between notes for a bouncy, short sound", and the mistake "The middle string ringing. Rest the fretting index across it". None of this applies to an open string against the 12th fret (an open note cannot be shortened by the fretting hand, there is no string in between), and the loop jumps between fret 2 and fret 12 twice. Lesson 15.1 step 1 (#25) and Lesson 3.4 teach the two-strings-up shape the make-music step then abandons.
- Evidence: `…\mcp-Claude_Browser-blob-1792505969741-be5yq8.jpg` (D bar: open D and D12, arc across the neck).
- Suggestion: no open strings for the octaves style (or at least in the course step), so every pair is the string-skip shape.

### C2. Quiz steps show the answers in the tab strip (note finder 10.4 / 10.✓, interval quiz 11.3 / 11.✓, the session's "Ear" item)
- Where: #35 `fb-quiz` (`note-quiz.0`, `note-quiz.1`, `u-neck-check.0`) and #41 `iv-ear-quiz` (`interval-ear.0/1`, `u-intervals-check.1`, session tail for Stage 2).
- What I saw: both open in Quiz mode (dots hidden until they sound, "next F" in the corner), but the tab strip below prints every coming note's string and fret, plus its name (#35: "F B D B F G G") or its interval label (#41: "R 4 R 3 R 3 R 4 R ♭3").
- Why it matters: Lesson 10.4 says "Commit to a fret before it appears"; Lesson 11.3 is called "Hear the interval" ("Sing the second note before it sounds", mistake "Guessing from the fret. Close your eyes"), and its checkpoint asks "I can hear 3rds, 4ths, 5ths and octaves". With the answer printed under the neck, neither step tests what it claims. The Ear module (#42, used in 6.3 and 12.2) hides its answers ("?"), but there is no hidden-answer interval drill.
- Evidence: `…\mcp-Claude_Browser-blob-1792506520245-1j01lc.jpg` (#35), `…\mcp-Claude_Browser-blob-1792505945718-r9fv61.jpg` (#41).
- Suggestion: in Quiz mode show "?" in the strip for notes not yet played (as the Ear module does), or give 11.3 an Ear-module interval drill.

### C3. Tempo goals do not fix the subdivision, and some defaults are far too fast for Level 2
- Where: every step whose exercise has the subdivision selector (uniform exercises).
- What I saw:
  - Lesson 1.1 step 1 (#1, demo in "♪ 2/beat"): I switched to "♩ 1/beat", set 80 BPM and played one loop: "Goal reached! If it felt clean, tick ✓ Clean?". Half the notes of the demo pass the step; "Whole" would pass it with a quarter. The subdivision is not part of the preset, so "↺ Lesson options" does not react. `…\mcp-Claude_Browser-blob-1792505780444-ndlimj.jpg`.
  - The subdivision chosen in a lesson is saved for the exercise (`updateProgress(tpl.id, { sub })`): it changes what the next step's goal means, and the Library's own setting.
  - Defaults: 13.1 (#48) and 13.2 (#49) open in 16ths: goals 90–96 = 6.0–6.4 notes a second; Checkpoint 13.✓ and the Stage 2 test (min7 at 104) 6.7–6.9 notes a second. Most triad steps around them run at 1.5–2.9 notes a second (12.2 in triplets: 4.6). A one-octave 7th arpeggio in 16ths at 96 is a 1.4-second loop.
  - Smaller: 2.2 "Dividing the beat" asks for 16ths at 80 (5.3 notes a second) in the second unit, twice the speed of Lesson 1.1; 8.4 step 3 (#24 finger pairs) opens in 16ths (5.6 notes a second).
- Why it matters: "goal 96 BPM" means different things to different players, and the course says nothing about the subdivision. A beginner who leaves #49 on its default meets an advanced speed.
- Suggestion: put the subdivision in the step's preset (`p: { sub: '2' }`), show it in the step row ("goal 96 BPM in 8ths"), and count it in `presetOk`.

### C4. Fingerings and shapes in the texts that the dots contradict
- Lesson 5.2 "Scales with open strings", mistake: "Keep one finger per fret in frets 1–4". Both steps (#13 G major, E natural minor) finger in 2nd position: G @ E3 f2, B @ A2 f1, C @ A3 f2, E @ D2 f1, F♯ @ D4 f3 (and F♯ @ E2 f1, G @ E3 f2). Lesson 5.1 tells the student to switch the labels to "Fing" and follow them.
- Lesson 6.3 "Hear major and minor" (#15, default key C from the A string): "listen to the one note that changes"; #15's own about "move only the 3rd down one fret" and tip "Watch the blue dot: it is the only one that moves". The 3rd is E @ D2 (f1), the ♭3 is E♭ @ A6 (f4): another string, four frets away; the 5th changes finger (f4 → f3). Same in keys G and B from the A string and F♯, G from the E string. In #46 (Lesson 12.2) the 3rd sits in three places: D2 (major), A6 (minor, dim), A7 (aug). Evidence: `…\mcp-Claude_Browser-blob-1792506637309-8j3z2t.jpg` (strip: "3" at D2, "♭3" at A6).
- Lesson 11.1 "Interval shapes": "the minor 3rd one string up and two frets back". Step 3 (#38, ♭3) plays C @ E8 → E♭ @ E11, on the same string (as do #39 and #41).
- Lesson 11.2 idea "From ♭2 to the octave, all in one hand position" (and #39's about "the 12 shapes sitting inside one hand position"): from C @ E8 the shapes span frets 7–11 and the index moves between frets 7 and 8.
- Lesson 11.2 step 2 (#40): "One shape, moved up a fret at a time": the first pair is F @ E1 → A @ E5 (same string, f1 → f4 over frets 1–5, the widest stretch on the neck); the shape (one string up, one fret back) only starts with G♭.
- Suggestion: either change the texts to what the dots show, or make the exercises use the shapes the lessons teach (♭3 one fret below the 3rd, minor 3rd one string up).

### C5. Bass-line shapes that the lesson calls "one shape"
- Lesson 4.2 step 2 (#17 R-5-8-5, I–vi–IV–V in A): "R-5-8-5 in quarters: one hand shape for each chord". The D bar is open D, A @ G2, D @ G7, A @ D7: the same 5th in two places and a jump from fret 2 to 7. Checkpoint 4.✓ step 2 (I–IV–V–I) ends on A @ D7, E @ G9, A @ G14, E @ D14: fret 14 in Stage 1, the 5th again in two places.
- Lesson 14.4 "Blues bass lines" (#55 boogie, and #52 R-3-5-♭7 in 14.2, #54 R-5-♭7-8 in 15.2): "one shape, moved to each chord", mistake "Changing the shape on the IV chord. It is the same shape, one string higher". The line plays bar 1 from A @ E5 and bars 2–4 from the open A; D7 is D @ A5 in bar 5 and the open D in bar 6.
- Suggestion: keep the root on the fretted note for these course steps (the shape is the lesson).

### C6. Checkpoint 16.✓ "Reading in keys" tests keys no lesson taught
- Where: `#/course/u-reading2-check`; Stage 2 test step 5.
- What I saw: the lesson teaches C, G and F major ("one ♯ (F♯) is G major, one ♭ (B♭) is F major"); the "I can" line says "I can read a simple melody in C, G or F major"; the checkpoint plays D major (two sharps) and B♭ major (two flats), and the Stage 2 test B♭ major.
- Suggestion: checkpoint in G and F (or add D and B♭ to the lesson).

### C7. Today's session for a beginner mixes in things the course has not taught, and skips the lessons' explanations
- Where: Home, a profile that has only started Lesson 1.1 (Stage 1, 30 min).
- What I saw: today's draw was "Warm-up: The octave shape · Strings: A → G" (Lesson 3.4 material, fretted notes up to fret 12, before Lesson 1.3 "One finger per fret"; the warm-up comes from the Level 1 daily routine, so any Level 1 exercise can appear) and "Ear: Hear the chord · Major and minor" (#42, Lesson 6.3 material; the Stage 1 tail is either this or first-position reading) on day one. Lesson items open the exercise directly: the concept, the demo and the mistakes are on the lesson page only (the step text shows as a toast; the ⓘ drawer has the step box). At 45 minutes the session lists all four lessons of Unit 9 and then its checkpoint, the same day.
- Suggestion: warm-up and ear/reading tail from lessons already done (or Unit 1 material), and open a lesson's page (or its demo) the first time a session reaches it.

### C8. An advanced player who places out gets "complete" and an almost empty session
- Where: placement, all twelve answers "Yes" → Home.
- What I saw: toast "You know everything in Stages 1 and 2"; Home "✓ Stages 1 and 2 complete … today's session keeps your lessons fresh"; the session has 1 item at 15 min (Level 2 warm-up "Octave jumps"), 2 at 30 min (+ "Interval quiz") and 2 at 45 min (+ "Reading sharps and flats"). Known lessons never come up for review, so nothing keeps them fresh; the Course block fills the top of Home with nothing to do.
- Suggestion: until Stage 3 exists, fill the session from the chosen warm-up level (or the Library's Level 3) and do not say "complete" for units only marked as known.

### C9. Order jumps and unexplained words for the beginner
- Lesson 1.2: "Each string is a 4th above the one below it" (intervals come in Unit 11).
- Lesson 4.1 uses Roman numerals, "the key" and lowercase "vi" (F♯m) before the major scale (Unit 5) and before major and minor chords (Units 6 and 13 explain I ii iii IV V vi vii°).
- Lesson 4.2: "the power-chord shape".
- Lesson 9.2 step 2 plays the shuffle "through a 12-bar blues" with the 6th (R-R-5-5-6-6-5-5); the 12-bar form is taught in 14.2 and the 6th as a degree nowhere before it.
- Lesson 7.1: "the first ledger line below the staff" (ledger lines are not explained).

### C10. Stage 1 promises "Hold the bass", but no lesson covers holding the bass, posture or tuning
- Where: Stage 1 description (course map, stage test idea): "Hold the bass, keep steady time…".
- What I saw: Lesson 1.1 starts with plucking; tuning is one sentence in Lesson 1.2 ("Tune up before you practise: the tuner button sits at the top of every exercise"). Nothing on sitting/standing, strap, where the thumb and wrists go beyond the plucking/fretting hints, or how to use the tuner.

### C11. "I can…" lines that the checkpoint steps do not practise
- Stage 1 test: "I can play a root line through a song at 110 BPM with even 8ths": the step is R-5-8-5 in quarters at 112.
- 9.✓: "My swing 8ths feel like triplets": no swing step (off-beats and syncopation only).
- 12.✓: "I can hear the four triad types": no ear step.
- 14.✓: "I recognise I–IV–V and I–V–vi–IV by ear": no ear step (the only progression ear drill, #105, is Level 4).
- 15.✓: "I control my volume from very soft to very loud": no dynamics step.

### C12. Ear steps are judged by the playing criteria
- Where: 6.3 step 2, 11.3, 11.✓, 12.2 step 2 (no goal: "one full loop").
- What I saw: the goal button still asks "✓ Clean?"; the drawer says "Then tick ✓ Clean if it really was clean: every note in time, even and clear"; the lesson page says "Reach the goal tempo for a full loop"; "▶ Hear it" on 11.3 "plays it once at the goal tempo" (there is none) and plays the quiz with its answers.
- Suggestion: for steps without a goal, "✓ Named them all?" and "one full round".

### C13. Settings "Reset progress" asks "Reset all progress?" but keeps the course
- Where: Settings → Progress → Reset progress (`resetProgress()` clears exercise progress only); the course has its own reset at the bottom of the course map.

## Irritating   (works, but annoys or slows the user)

- I1. A second tap on "✓ Clean" removes the tick and un-completes the lesson, without a question: after "Reviewed ✓", tapping the button again gave "Clean tick removed", the lesson's status went back to "started" and Home's count to 0. Easy to do by accident (the button stays under the thumb).
- I2. The step's instruction ("Say its name out loud as you play", "Count all four beats, the silent ones too") is a 4.5-second toast when the step opens (and inside the ⓘ drawer). After that the exercise screen does not show what the step asks.
- I3. After "Lesson 1.2 complete ✓" in the exercise screen, the button still reads "1/2 Next ›" and leads to step 2, already clean; the way to Lesson 1.3 is Next → Done → lesson page → "Next: Lesson 1.3 ›".
- I4. A review in today's session plays only the lesson's last goal step, while the lesson page says "A review is due: play the steps once more at the goal tempo and tick ✓ Clean"; from the lesson page, any one step completes the review.
- I5. Home offers three start buttons with overlapping content: "▶ Start lesson" (course), "▶ Start" (today's session, which has its own warm-up) and "▶ Start" (Daily warm-up, another routine below). A beginner cannot tell which one is "today's practice".

## Texts        (typos, unclear wording, inconsistent names)

- T1. Lesson page after completing: "Next review in 1 day, in today's session." ("in tomorrow's session" or "on Home").
- T2. Home "0/69 lessons" and course map "0 of 69 lessons done" count checkpoints and tests as lessons; the README and the commit say "52 lessons".
- T3. Course map intro "short reviews (after 1, 3, 7 and 21 days)"; the schedule (and CLAUDE.md) also has 60 days.
- T4. The lesson page's "Reach the goal tempo for a full loop…" and "The app plays it once at the goal tempo" appear on lessons without a goal (11.3). See C12.
- T5. #24 Finger pairs (Lesson 8.4 step 3), pair 3-4 at fret 5: the same fret is spelled two ways in one figure: "A B♭ A A♯" (D string fret 8), "D E♭ D D♯", "C D♭ C C♯", "F G♭ F G♭". The round-7 rule (sharps up, flats down by each note's direction) gives a trill two names.
- T6. Lesson 3.3 mistake: "half of all bass lines start there" (an invented statistic).
- T7. #41 rounds are still "#1", "#2" in the strip and status ("Round 1" in the Ear module).
- T8. Lesson 8.1 step 2: "An arpeggio shape at fret 5": the notes are A D G C, all at fret 5 with finger 1 (a stack of 4ths, a string-crossing pattern).
- T9. Lesson 14.4 concept "Swing them, keep them steady" while step 1 is the straight boogie (step 2 is the swung one).
- T10. Lesson 1.1 mistake "Using the same finger twice when you change string. Keep alternating, even across strings." Lesson 8.1 then teaches the rake (the same finger on the way down). One sentence in 8.1 ("in Lesson 1.1 you alternated strictly; now…") would avoid the contradiction.

## Visual

### V1. Exercise header in lesson mode is cut at phone sizes
- 640x360 (session, Lesson 9.1): the title box is 115 px wide: "Off-beats: …"; the subtitle "Lesson 9.1 · step 1 of…" loses the goal; the Options label wraps to two lines (header items: back 8–42, title 50–165, Options 173–322, goal 330–411, Next 419–506, star, tuner, ⓘ). `…\mcp-Claude_Browser-blob-1792505902438-wrwqiu.jpg`.
- 800x380: "Alternate plucking (ind…", "Lesson 1.1 · step 2 of 2 · goal 80 BP…", "Middle (m) · Notes per strin…".

### V2. Course map: lesson titles truncated at every landscape size once chips show
- 915x412 (3 unit cards of 261 px): titles 103 px: "Plucking with t…", "One finger per f…", "Leading into the next chord" 103/158 px. `…\mcp-Claude_Browser-blob-1792506350801-phtdtm.jpg`.
- 1024x768: "Playing with a pick" 70/106 px (with "optional" and "known"), "Diminished, augmented and sus" 135/184 px. 640x360: three titles cut.

### V3. The goal button changes width with its state (66 px "✓ Clean", 80 px "🎯 – / 80", 121 px "↺ Lesson options"), so the title and Options box reflow while playing.

### V4. Step rows read "1 1": the step number circle sits next to the exercise-number badge ("1" + "1 Alternate plucking"; step 2 shows "2" + "1"). A beginner reads two step numbers.

### V5. Lesson page at 640x360: single column; the first practice step starts at y = 460 of a 360 px screen, under the concept and the mistakes. (Opinion: on phones the steps could come before "Watch out for".)

### V6. (Round-7 re-check) #126 Shell voicings, jazz blues, staff: the stacked labels now work, but in the Gm7 bar the beam of a stem-down 8th pair crosses the label "♭10". `…\mcp-Claude_Browser-blob-1792506487667-r97kac.jpg`.

## Questions for the owner

- Q1. Should a course step fix the subdivision (part of the preset, shown as "goal 96 BPM in 8ths")? See C3.
- Q2. Placement is self-report only and lumps units (5: scales + chords; 9: neck + intervals; 10: triads + 7ths; 11: blues + grooves). Offer "test out" through the unit checkpoint instead, and should "known" units feed reviews?
- Q3. Disco octaves in the course: the string-skip shape only (no open strings)? See C1.
- Q4. A hidden-answer interval drill for Lesson 11.3 (like #42 for triads), and "?" in the strip for unplayed notes in Quiz mode? See C2.
- Q5. Still open from earlier rounds: #173 Backing following the implied chords; one 8va for the whole phrase; the ear-training answer in the strip at the answer step; one shuffle notation.

## Status of the d25bf3c findings (round-7 commits)

| # | Finding (d25bf3c) | Status | Evidence now |
|---|---|---|---|
| W1 | Padded last bar wrong at 3/5/6 per beat | fixed | #74 at triplets: bar 2 ends "2 R" + 8th rest inside the "3"; #14 at triplets: 8th + quarter rest under the "3", then a quarter rest (`…blob-1792506449151-27dp3c.jpg`) |
| W2 | #147 A♯ into C♭ in G♭ | fixed | `B♭ → C♭ (♭3)` in A♭m, `B♭ → C♭ (R)` in C♭ |
| C1 | Slap pops on A/E strings | fixed | default #132/#191/#174: pops only on the D string (4, 5, 6-string), thumbs on the E string; #93 thumbs the E string (not the low B) |
| C2 | #141 backing follows the outside bar | fixed | 3 whole bars of 8ths; pad A C E on all 24 steps; "outside: B♭m pent" is text |
| C3 | Walking: repeated note in the first bar of a long chord | fixed | #129 ii–V–I in C: `Cmaj7 C2 C3 G2 B1(→) | C2…` |
| I1 | Leaps over an octave in cycles | not re-measured | |
| I3 | 12/8 slow blues at 96 | fixed | style tempo 60 |
| I4 | Harmonised 7ths: one finger on two frets | fixed | #84 #121 #149 #158 #183 #184, 12 keys: 0 of 84 chords each |
| T1 | Chromatic drills with sharps going down | fixed in #2 | `E♭ D D♭ C B♭ A A♭ …` going down; see T5 for #24 |
| T2 | "The octave shape · A → G" | fixed | "Strings: A → G" |
| T3/T4 | #75 cross-reference and shift text | fixed | "Like The 3 triad fingerings (in the Triads topic)…" |
| T6 | #141 summary | fixed | "slip a half step up or down (or a tritone away)" |
| V1 | Tuplet numbers on the label row | fixed | #81 at triplets: 0 text overlaps |
| V2 | #26 dynamics on the beams | fixed | 0 overlaps with beams or labels |
| V3 | #126 labels overlap | partly | labels stack; a beam crosses "♭10" (V6) |
| Q1 | Seven-flat signatures | decided, done | G♭ chip → "F♯ Mixolydian" (5 ♯), B♭ → "A♯ Locrian" |
| Q3 | E♭ blues named D♯ | decided, done | "E♭ blues: E♭ G♭ A♭ A B♭ D♭" |

## Checked and fine

- Course content that matches its exercise: open strings and the mnemonics (E-A-D-G, G B D F A / A C E G); the alphabet and frets on the E string (F1 G3 A5 B7 C8 D10 E12); sharps going up and flats coming down in #8; landmark notes at 3/5/7/9/12 on all four strings (E: G A B C♯ E; A: C D E F♯ A; D: F G A B D; G: B♭ C D E G); the octave shape with f1/f3; bass clef written an octave up (open E on the first ledger line, A in the bottom space, D on the middle line, G in the top space); first position = one place per natural note; major-scale fingering 2-4, 1-2-4, 1-3-4 from both strings; A minor pentatonic 1-4, 1-3, 1-3; C major pentatonic = A minor pentatonic notes; triad shapes of Lesson 6.2 (major root f2: 3rd one string up one fret back f1, 5th one string up two frets forward f4; minor root f1, ♭3 three frets up, 5th one string up two frets forward); build-a-chord (1-3-5, 1-3-5-7, A natural minor 1-♭3-5-♭7); the five 7th chords by lowering one note (C°7 with B♭♭); the 12-bar form (4 I, 2 IV, 2 I, V IV I V) and dominant 7ths; swing as the first and third notes of a triplet; dotted rhythms and the Charleston; off-beats; raking (alternate going up, rake going down, tags right in #18); the fret-5 rule including low B and high C; all 12 notes in a five-fret zone; the cycle of 4ths names; blues scale 1 ♭3 4 ♭5 5 ♭7 and major blues 1 2 ♭3 3 5 6; key signatures of C, G, F; approach notes in Lesson 4.3 (F into E, F into F♯, E♭ into D, G♯ into A).
- Every step's preset exists and builds on 4, 5 and 6 strings; 5/6-string steps use the extra strings sensibly (Stage 1 root grooves sit in one position across B-E-A).
- Flows: Start lesson → Hear it (plays once at the goal tempo, then "Your turn: tap Practise ›") → Practise › → step 1; Next › / Done › / Back return to the lesson page; "↺ Lesson options" appears when a lesson option changes and restores it; the lesson completes when every step is clean ("Lesson 1.2 complete ✓", "✓ Complete · Next review in 1 day"); a due review shows "🎯 review / 80" → "✓ Still clean?" → "Reviewed ✓ Next review in 3 days"; placement starts at the first gap ("Start here: Lesson 9.1"), shows "known" chips, and the course map can be redone; session Next steps through mixed warm-up, lesson, review and ear items with "n/9 Next ›".
- Layout: no horizontal scroll on Home, course map, lesson pages, checkpoints, stage tests, placement and lesson-mode exercise screens at 640x360, 800x380, 915x412 and 1024x768 (only truncation, see V1–V2).
- British spelling throughout the course texts ("practise" as a verb, "practice steps", "recognise", "Memorising", "colour").
