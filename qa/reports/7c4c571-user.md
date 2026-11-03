# QA User report · 7c4c571 · 2026-11-03

Setup:
- **Commit:** 7c4c571 (main). Scope: `git diff ee6a706..HEAD`, which covers:
  - the Classic tunes topic (12 pieces, `curriculum/tunes.js`);
  - the theory games #251 and #454;
  - the course changes: keys on steps, games as steps, an ear step and a no-dots step closing each stage test;
  - tap mode on the ear drills (#225, #226, #315, #412) and the reading drills;
  - "No dots", Settings → Audio delay, and the new words after a loop.
- **Server and tab:** my own `qauser` server (port 8890) in my own tab. I never touched ports 8765 or 8878. At the end I reset the viewport, closed the tab and stopped the server.
- **Profile:** empty at the start: one service worker unregistered, cache `bassclass-v1` deleted, localStorage and sessionStorage cleared, loaded with `?qa=u24`.
- **Sizes:** 800x380 (main), 640x360, and 390x800 portrait (Settings). 4-string bass, C D E notation; some checks also on a 5-string. Layout measured with `getBoundingClientRect`.
- **Personas:**
  - Beginner: the Level 1–2 tunes; Lessons 1.9, 1.20–1.22 and 2.16 with the new game steps; the Stage 1 test with its no-dots and ear steps; Settings → Audio delay.
  - Advanced player: the Level 3–5 tunes and their fingering; the ear drills in tap mode; the Library search.
  - Teacher:
    - every tune dumped through its own `build()` (notes, frets, fingers, labels and chords) and checked bar by bar against the piece;
    - Ode to Joy, Saints, Amazing Grace and Greensleeves compared with the Wikipedia scores the source comment names, and the Musette's form checked against a published analysis;
    - 21,000 theory-game rounds (3,000 per mode, 590 distinct questions) and 6,000 progression-drill rounds.
- **Not testable here:**
  - the sound itself, and whether Audio delay is right on Bluetooth;
  - real touch and Android.
  - I checked what is scheduled and shown instead of what sounds.
- **Screenshots:** in `C:\Users\OscarGaya\.claude\projects\E--CLAUDE-BassClass\c7f026a2-fcf4-440e-b62e-e6df46b13395\tool-results\`, shortened to `…\` below.

Counts: Blocking 0 · Wrong 6 · Confusing 8 · Irritating 3 · Texts 6 · Visual 3, plus 6 questions.

## Short verdict

What works well:
- **The tunes are carefully sourced.** I checked four of them against the scores the source comment names, and all four match bar for bar:
  - Ode to Joy, with Beethoven's own half note on the first F♯ and the early F♯ tied over bars 12–13;
  - the Saints;
  - Amazing Grace;
  - Greensleeves.
  - From memory, the Minuet, the Canon, the Entertainer and the Prélude are also right.
- **The theory games are correct.** All 590 distinct questions give the right answer, spelled as a teacher would. Altered tones are written plainly as the about says (the ♭9 of A♭7 is A, the ♭13 of E♭7 is B).
- **The new loop words are honest and clear.** For example: "The app played a full loop at 220 BPM (the goal: 96 BPM). If you played along cleanly: ✓ Cleared".
- **"No dots" works.** The neck stays empty, the strip shows "?", and the stage-test steps read "no dots, from memory".

What must be fixed first:
1. **The finger labels in the tunes follow the chords, not the melody.** A melody with one chord per beat gets finger 1 on almost every note (W2). In the Canon every note is finger 1, a shift on every note.
2. **The Musette ends in the wrong key.** Its "Whole tune" ends in A major and never comes back to the opening in D (W1). The E octaves of its second half are fingered across three strings, the opposite of the shape its own text teaches (W3).
3. **Lesson steps played in tap mode still say "one full round".** The subtitle, the lesson row and the ⓘ drawer say so, while the step is scored 8 of 10 (C1).
4. **In the Library, the ear drills now open in tap mode, where nothing counts.** A perfect set there clears nothing, and their ⓘ still describes the old play-along (C2).

## Blocking     (a user cannot do what the screen is for)

None found.

## Wrong        (incorrect musical or factual information)

### W1. Musette in D: the "Whole tune" ends in A major, without the return to the first section
- **Where:** #355 Musette in D, Part "Whole tune" (form `[0, 0, 1, 1]`) and "Second half".
- **What the app plays:**
  - The first half twice (D major).
  - Then the second half twice: A octaves, E octaves.
  - It ends `C#3:s D3:s E3 A2:q` on A, the dominant.
- **What the piece does:** the Musette (BWV Anh. 126) is in three parts, A–B–A:
  - bars 1–8 in D;
  - bars 9–20 in A major;
  - then the first eight bars again, back in D, with an ending "similar to the beginning".
  - Source: the ABRSM Grade 2 notes on pianoandtheory.co.nz.
- **Why it matters:** a teacher hears a piece that stops on the dominant. The player never learns that the drone section comes back.
- **Suggestion:** add the return (bars 21–28, the first half with its final bar) after the second half, in the whole tune and in the Second half part.

### W2. Classic tunes: finger labels give a new hand position for almost every note (fingered by chord, not by line)
- **Where:** every tune with a chord per beat, Dot labels → Fingers. The exercise's own build, 4-string:
  - **#353 Canon, Ground bass:** `D3 G7 f1 · A2 D7 f1 · B2 G4 f1 · F♯2 D4 f1 | G2 D5 f1 · D2 A5 f1 · G2 D5 f1 · A2 D7 f1`. Finger 1 on all eight notes: a shift on every note of the ground.
  - **#353 Canon, Violin bars 3–6:** all 16 notes are finger 1. They slide G11 → G9 → G7 → G6 → D9 → D7 → D9 → G6 → G7 → G6 → D9 → D7 → A10 → A9 → A10 → A7. That is 15 hand moves in 16 notes.
  - **#125 Ode to Joy (Level 1), bar 10:** E `D2 f1`, F♯ `D4 f3`, G `D5 f4`, F♯ `D4 f1`, D open.
    - The same F♯ is fingered 3, then 1, in one bar.
    - Bar 9 fingers E and F♯ both with finger 1 (frets 2 and 4).
  - **#124 When the Saints (Level 1):**
    - Bars 1–9 finger C (A3) with 2 and E (D2) with 1.
    - Bars 10–11 (C7, F) finger the same C with 1 and then E with 1, so the hand moves back a fret.
  - **#249 Amazing Grace, bar 8:** D3 `G7 f1` → B2 `G4 f1`, a three-fret slide on one finger. Bar 9 fingers the same two notes 4 and 1.
  - **Totals of position changes:** Bourrée bass voice 17 in 33 notes; Air whole tune 118 in 283.
- **Why it matters:** Fingers is the label a beginner follows. Here it tells them to shift on almost every note of a step-wise melody that sits in one position.
- **Cause:** the chord-label rule (QA round 11, `handFingers` per chord). With one chord per beat, each single note is its own "hand shape", and so gets finger 1. The rule is right for chord shapes; a melody needs one fingering for the whole line.
- **Evidence:** Canon violin with Fingers, D on G7 "1" then C♯ on G6 "1": `…\mcp-Claude_Browser-blob-1793715642072-5f2fgb.jpg`.
- **Suggestion:** finger the tunes (and any single-note line) as a line, one finger per fret inside the part's region, and skip the per-chord hand shape.

### W3. Musette, second half: the E octaves are E string 12th fret (finger 4) + G string 9th fret (finger 1), eleven times
- **Where:** #355, Second half, bars 4–10 (E and E7).
- **What I saw:** every E octave is `E2 E12 f4 · E3 G9 f1`: the low note with the little finger, the high note three strings up and three frets back.
- **What the texts teach:**
  - The about: "The octaves are a bassist's shape: the root, then two strings up and two frets up".
  - The tip: "Octaves: the low note with the 1st finger, the high one two strings up with the 3rd or 4th".
- **The usual shape:** E2 on the A string, 7th fret, and E3 on the G string, 9th fret. The A octaves of the same half do use the shape (A12 f1 / G14 f3).
- **Cause:** the part's region (centre 10, frets 8–13) leaves out A7.
- **Suggestion:** widen the second half's region down to fret 7, or centre it at 9.

### W4. Greensleeves: the tip about F natural is wrong
- **Where:** #250, Focus points: "The F♯ leads up to G; the F natural comes down to E♭ or D."
- **What the notes do:**
  - Bars 2, 6, 10 and 14 (`C3 A2 F2 G2 A2`): the F natural goes **up** to G.
  - Bars 9 and 13 (`F3 F3 E3 D3`): it comes down to **E natural**, then D.
  - It never moves to E♭. E♭ appears only as the upper neighbour in `D3 E♭3 D3` (bars 1 and 5).
- **Suggestion:** "The F♯ leads up to G; the F natural moves on up to G, or down through E natural to D."

### W5. Bourrée in E minor: "Bass voice: one note a beat, every one the same length" is not what the bass voice plays
- **Where:** #452, third Focus point; Parts "Bass, first half" and "Bass, second half".
- **What the notes do:**
  - The bass voice has 8th notes in 7 of its 24 bars, for example `A2 B2 A2 G2`, `B2 A♯2 B2 C♯3`, `A2 E3 F♯3`, and in the first half `E2 F♯2 G2 F♯2`.
  - It also has a dotted quarter (`B2:dq C3 B2 A2`), a half note and two dotted halves.
- **Suggestion:** "Bass voice: mostly one note a beat, with runs of 8ths into the cadences."

### W6. Invention No. 4: "Bars 11–16: each bar starts one step lower" does not match the notes
- **Where:** #553, third Focus point; Part "Bars 11–16".
- **What the notes do:** the bars start on B♭2, E2, A2, D2, E2, A1.
  - Taken in pairs, the first two pairs (B♭–E, A–D) move a step down.
  - The third pair (E–A) does not.
  - No bar is one step under the bar before it.
- **Why it matters:** either the tip or the notes are wrong, and the player is told to "feel the pattern" the notes do not have.
- **Suggestion:** check bars 15–16 against the score. If they are right, describe the sequence as two-bar units.

## Confusing    (misleading, illogical, makes no sense)

### C1. Lesson steps in tap mode say "one full round" and "tick ✓ if you named them", but they pass on 8 of 10 and tick themselves
- **Where:**
  - Lesson 2.16 steps 1–2 (#227);
  - the new game steps in Lessons 1.9, 1.21, 1.22 (`game-ear-notes`, `game-read-notes`) and 2.17, 2.20, 2.22 (`game-theory`);
  - every stage test's last step (#113, #227, #316, #412, #315);
  - the `game-harmony` steps in Lessons 4.11, 4.17, 5.24 and 5.27.
- **What I saw, on Lesson 2.16 step 1:**
  - The header goal button reads "🎯 8 of 10", and the tip says "▶ starts a set of 10: 8 or more right passes this step".
  - But the subtitle reads "Lesson 2.16 · step 1/2 · one full round".
  - The lesson page row reads "#227 · one full round", and the Stage 1 test row 9 reads "#113 · one full round".
  - The ⓘ drawer says: "Goal: one full round from the first note. Then tick ✓ if you named (or sang) every answer before it appeared."
- **Evidence:**
  - `…\mcp-Claude_Browser-blob-1793715171736-cis86a.jpg` (subtitle next to "🎯 8 of 10");
  - `…\mcp-Claude_Browser-blob-1793715162666-fmxi0q.jpg` (lesson rows).
  - Code: `goalText` (exercise.js:185), the step row (course.js:505), `lessonBox` (exercise.js:1004).
- **Suggestion:** where the step plays in tap mode, write "8 of 10" in all three places.

### C2. The ear drills open in tap mode in the Library, where a perfect set clears nothing and their ⓘ still describes the old rounds
- **Where:**
  - #225 Interval quiz;
  - #226 Hear the chord;
  - #315 Hear the 7th chord;
  - #412 Hear the progression;
  - all of them in the Library (they open in tap mode since 2d1a97d).
- **What I saw on #226:**
  - The ⓘ says "Each round plays a triad … with the notes hidden. Name it before the answer appears", and "🎯 to master it: one full loop, then ✓ Cleared".
  - But the screen is the tap game ("The chord over its root: tap its 3rd and 5th").
  - In tap mode ✓ Cleared is hidden under ⋯. The end card gives no "clears" line for a drill, so a 10 of 10 counts for nothing.
  - Nothing says that 👆 (play mode) is where the exercise is cleared.
- **The summaries describe the play-along too:**
  - #226: "A triad plays (broken, then together): name its quality before the answer appears."
  - #412 is titled "Hear the progression: name the chords by number", but in tap mode only the I and one chord sound, and you tap one root.
- **Suggestion:**
  - Let 8 of 10 in tap mode clear the choice, as the games do.
  - Or, failing that, have the end card say "✓ Cleared is in play mode (👆)".
  - Add one ⓘ line describing the tap rounds.

### C3. Lesson 2.16 "Hear the interval": its idea and its mistake no longer fit the game
- **Where:** Lesson 2.16, header idea and "Watch out".
- **What I saw:**
  - The idea "Sing the second note before it sounds" cannot be done: the game plays a random interval, so the second note is unknown until it sounds. The concept now says "Sing it back, then tap where it is".
  - The mistake "Guessing from the fret. Close your eyes and listen first." does not apply either: the answer is never shown before the tap.
- **Suggestion:**
  - Idea: "Sing the second note back before you tap it."
  - Mistake: "Tapping before you have sung it back."

### C4. Hear the progression (tap mode) never asks a progression's first chord: ii–V–I and minor ii–V–i always answer V
- **Where:** #412 in tap mode (Library and Lesson 4.20), and the Stage 4 and Stage 6 test steps.
- **What I measured:** 2,000 rounds per set.
  - **Jazz:** "ii – V – I → V" 529 times and the ii never; "iii – vi – ii – V – I" asks V, ii and vi, never iii.
  - **Minor:** "Minor ii – V – i → V (X7♭9)" 532 times, the iiø never.
  - **Pop:** "vi – IV – I – V" asks IV and V, never vi.
  - A quarter of the jazz rounds and a quarter of the minor rounds therefore have a fixed answer (tap the 5th), and the prompt names the progression ("…then a chord of ii – V – I"). The Stage 6 line "I can hear the roots of jazz changes" never tests the ii of a ii–V–I.
- **Cause:** `progAsk` keeps only chords at index > 0 (`j > 0`).
- **Suggestion:** leave out only the chords on the tonic, not the first chord.

### C5. Bourrée melody: the tip says it starts on beat 4, but the part starts on beat 1
- **Where:** #452, Part "Melody, first half". Tip: "It starts on beat 4: the two 8ths before the first bar line lead into it". About: "a quick French dance that starts on the last beat of the bar".
- **What the app plays:**
  - The part opens with `G3:q F♯3 E3` on the downbeat.
  - The pickup E3 F♯3 is played only at the end of bar 8, into the repeat.
  - So the first time through, the dance starts on beat 1, and there is no Whole tune that opens with the pickup.
- **Suggestion:**
  - Open the first half on a bar of rest ending in E3 F♯3, as Greensleeves and Amazing Grace do.
  - Or reword the tip ("the E – F♯ at the end of the line is the upbeat into the repeat").

### C6. Air: the octave pattern turns into repeated notes on 7 beats
- **Where:** #451.
  - First half: bar 3 beat 3 (D♯2 D♯2), bar 4 beats 2–3 (D2 D2, C♯2 C♯2).
  - Second half: bar 2 beat 1 (D♯2 D♯2), bar 5 beat 4 (D2 D2), bar 6 beat 1 (C♯2 C♯2), bar 11 beat 2 (D2 D2).
  - 14 beats in the whole tune.
- **What I saw:** each note under the low E string (D♯1, D1, C♯1) goes up an octave on its own, onto its partner's pitch. The pair becomes a unison where Bach writes an octave.
- **What the texts say:**
  - The about: "8th notes in octaves, low – high, high – low".
  - The tip: "The octaves: the 1st finger on the low note, the 3rd or 4th two strings up".
  - The source line does disclose the raise.
- **Also:** the same happens on a 5-string bass, whose low B could play those notes (the code leaves the low B out for every tune).
- **Suggestion:** raise both notes of the beat, which keeps the octave. On 5- and 6-string basses, play the written notes on the B string.

### C7. Level 1 tunes label melody notes with 11 and 13, and mix them with 2 and 7
- **Where:** #124 and #125 with the default dot labels (Degrees), in the strip and on the dots.
- **What I saw:**
  - **Saints:** C over G7 is "11" (bar 15); over F, G is "2" and E is "7" (bar 11).
  - **Ode to Joy:** F♯ over A7 is "13" twice (bars 10–11); E over D is "2".
- **Why it matters:**
  - A Level 1 player has not met 11 or 13, and nothing explains them.
  - The same kind of note is called 2 on one chord and 11 or 13 on the next. That follows the licks' dominant rule, which suits jazz lines more than folk melodies.
- **Suggestion:** see Q6 (note names by default), or label tunes against the key.

### C8. Theory game #251: "Harder" after 7th chords leads to "Major keys", which is not harder
- **Where:** #251, the end card after an 8+ set on "7th chords: the 3rd, 5th or 7th".
- **What the code does:** Harder is the first option's next choice (exercise.js:1598). After triads → 7th chords (which works, as I saw on the end card: `…\mcp-Claude_Browser-blob-1793715117132-xpfcop.jpg`), it offers "Major keys: the 2nd to the 7th note": a different and easier topic.
- **Suggestion:** no Harder button after 7th chords, or order the modes Major keys → Triads → 7th chords.

## Irritating   (works, but annoys or slows the user)

### I1. Chord ear rounds put the root on the D or G string for 11 of the 12 roots
- **Where:** #226 and #315 in tap mode, Lesson 1.20 "Hear major and minor" (#226 Major and minor), and the Stage 5 test.
- **What I saw:** the root sounds and shows on its first place between frets 1 and 7, from E2 to D♯3:
  - E on the A string;
  - F to A on the D string;
  - B♭ to D♯ on the **G string** (frets 3–8), 6 of the 12 roots.
  - For example, B♭ at G3 with "tap its 3rd and 5th" (`…\mcp-Claude_Browser-blob-1793715506490-03y23n.jpg`).
- **Why it matters:** with the root on the top string, a Stage 1 player cannot use the triad shape they have just learned (R-3-5 up from the E or A string). They must look below the root or in another octave.
- **Suggestion:** show the root on the E or A string (any octave counts for the answer anyway). The sounding chord can stay where it is.

### I2. Searching "classic" lists 10 lessons and 5 other exercises before the Classic tunes
- **Where:** the Library search.
- **What I saw:** "classic" returns 10 lessons first (5.2 Thumb, index and middle; 5.15 …). Then 31 exercises, opening with #203 "(classic warm-up)", #623 Classical Thump, #314, #415 and #502. Only then come the tunes.
- **Also:** "tunes", "Bach", "Beethoven", "Joplin", "ragtime" and "minuet" all find the tunes well.
- **Suggestion:** rank a topic-name match ("Classic tunes") with title matches.

### I3. Audio delay: the dots count the listen-only taps, and the slider is tiny in portrait
- **Where:** Settings → Audio delay → 🎧 Measure; and Settings at 390x800.
- **What I saw:**
  - The hint says "Listen to 4 clicks, then tap with each click you hear: 8 taps". But a dot lights for every tap, including taps during the first four clicks, which the measurement ignores (the code lights `taps.length`). A player who taps from the first click sees all 8 dots lit after 8 taps, with only 4 of them counted.
  - In portrait the slider is 97 px wide for 0–400 ms in 10 ms steps (about 2.4 px a step).
- **Also:** the flow itself works: "Measuring…", the result in place of the pad, and "↻ Again".

## Texts        (typos, unclear wording, inconsistent names)

### T1. "here on 5 strings" on a 4-string bass
- **Where:** a wrong tap in #251 or #454 (any answer in any octave); also the note-finding drills.
- **What I saw:** "✗ G, not F♯ · the 5th of Cm · here on 5 strings", with five G's shown (open G, D5, E3, A10, G12) on a 4-string bass.
- **Evidence:** `…\mcp-Claude_Browser-blob-1793715036597-7kt8ng.jpg`.
- **Cause:** exercise.js:1524 counts places, not strings.
- **Suggestion:** "here in 5 places".

### T2. Games and tap drills carry the play-along "How to practise it", the colour legend and the "→" note
- **Where:** the ⓘ of #227, #251, #454, #226 and every game or tap drill.
- **What I saw:** under HOW TO PRACTISE IT:
  - "Step through it first with ◀ ▶ … Loop it at a tempo … Raise 4 BPM after 3 clean loops, or switch on the speed trainer";
  - "Change the subdivision … switch the Reveal button to 'Quiz'".
  - None of these exists in a tap set. The Colours legend and "A dot labelled → is an approach note" do not apply either.
- **Suggestion:** a short tap-mode block: "▶ starts a set of 10 · ‹ › look back · 8 right clears the mode".

### T3. Saints and Ode: "first position", and "every phrase"
- **Where:** #124 about and tips; #125 about.
- **Saints:**
  - The about says "it sits in the first position: C on the A string, E, F and G on the D string". The app fingers it with the index at fret 2 and the G at the D string's 5th fret with finger 4.
  - The course's own definition is "first position (frets 0–3)" (Lesson 1.22 "Reading in first position").
  - The tip "Every phrase starts after an 8th-note rest" does not hold for the last phrase, which comes in after a quarter rest (`r:q E2 F2`, bar 13).
- **Ode:** "almost all in the first position", while it uses frets 2–5 (G on the D string's 5th fret, A on the G string's 2nd fret).
- **Suggestion:** "in one position, frets 2–5", or finger the G as the open G string.

### T4. "Melodies everyone knows … played as written"
- **Where:** the Classic tunes topic card (`desc`) and About ("played as their composers wrote them").
- **What I saw:**
  - Six of the twelve are bass or inner parts, not melodies everyone knows: the Canon's ground, the Air's continuo, the Musette's left hand, the Bourrée's bass voice, the Invention's lower voice and the Prélude.
  - Most are moved down one or two octaves, and the Air's lowest notes are raised.
  - The source lines say all this honestly; the headline does not.
- **Suggestion:** "Tunes and bass parts everyone knows, … from the composers' own notes, an octave or two lower where needed."

### T5. "ready · 36 notes" counts the rests
- **Where:** the exercise header in the tunes (and the song studies).
- **What I saw:**
  - Saints: "36 notes" for 31 notes and 5 rests.
  - Greensleeves: "74 notes" for 72 notes and 2 rests.

### T6. Prélude: "Each bar is one chord broken into 16th notes, the same shape twice"
- **Where:** #552 about.
- **What I saw:** true of bars 1–4, 6 and 8. In bars 5, 7, 9 and 10 the second half of the bar is a different figure.
- **Suggestion:** "Most bars are one chord … the same shape twice."

## Visual

### V1. Theory prompts: the big word is the least important one; the chord or key is small and grey
- **Where:** #251 and #454, the prompt at the top right.
- **What I measured:** the bold word is 26 px green; the rest is 13 px grey (`rgb(158,164,204)`). For example:
  - "tap the **5th** of D+": the chord "D+" is the small part;
  - "tap the **major** key with five flats": "five flats", the whole question, is small (`…\mcp-Claude_Browser-blob-1793715132252-ludntq.jpg`);
  - "tap the root of **ii°** in E minor".
- **Also:** "tap the major key with five flats" reads as if a key could be tapped.
- **Suggestion:**
  - Make the chord, key or signature as large as the bold word.
  - Write "tap the tonic of the major key with five flats".

### V2. Exercise titles cut in the header (the new tap drills)
- **Where:** 800x380, the header title next to the Options button. Visible width / full width of the title:
  - #226 "Hear the chord: majo…": 192 / 389 px;
  - #315: 192 / 308 px;
  - #412: 192 / 367 px;
  - #225: 192 / 274 px.
- **Evidence:** `…\mcp-Claude_Browser-blob-1793715490597-itabmd.jpg`.
- **Suggestion:** short titles like the games' ("Chords, by ear", "7th chords, by ear", "Progressions, by ear").

### V3. An empty 4/4 staff with a bar rest sits under the neck before the first answer in the ear games and ear drills
- **Where:** #226, #227 and #315 in tap mode, before ▶ and during the first question.
- **What I saw:** a full-width empty 4/4 staff with a bar rest. The note-finding drills and the theory games hide it (`tap-empty`) since QA round 23, but the 'ear' kind does not.
- **Evidence:** `…\mcp-Claude_Browser-blob-1793715490597-itabmd.jpg`.

## Questions for the owner

1. **Amazing Grace's "me".** The tune follows the English Wikipedia score exactly, which gives "me" two beats and makes the second phrase three bars long. Most hymnals hold "me" for five beats (16 bars in four-bar phrases). Keep the source's shorter form?
2. **Greensleeves' key signature.** It is written with one flat (G Dorian, as the French source's `K:F`), so every E♭ carries an accidental. A modern G minor edition has two flats. Keep the old-style signature (the about explains the E♭/E mix)?
3. **"Basso andante".** The Air's about says "Baroque musicians called a bass that moves in steady notes like this a walking bass (basso andante)". I could not confirm that Baroque musicians used the term. A safer wording: "a walking bass (andante means walking in Italian)".
4. **The ♯9 in #454.** The game writes it A♯ over G7, D♯ over C7, but C over A7, D over B7 and G over E7 (plain, to avoid B♯, C𝄪 and F𝄪). The licks write B♭ over G7. One rule for both?
5. **The share of diminished and augmented.** #251's "Triads" mode picks major, minor, diminished and augmented equally. One of my sets had 5 augmented questions in 10. Weight major and minor more at Level 2?
6. **Default dot labels for melodies.** Should the tunes open with note names, or degrees against the key, rather than chord degrees (see C7)?

## Checked and fine

- **The tunes, against their sources:**
  - **Ode to Joy:** bars 92–107 of the Wikipedia score note for note, including `fis2( g4 a)` and the early F♯ tied over bars 12–13. The staff draws the tie (`…\mcp-Claude_Browser-blob-1793715656801-gnpv4c.jpg`). The A7 and E7 → A chords are sensible.
  - **Saints:** the German Wikipedia ABC bar for bar; the usual 16-bar changes (C … G7 C C7 F F C C G7 C).
  - **Amazing Grace:** the English Wikipedia score bar for bar. The tips' bar numbers (9, 11) and "the high D on the G string at the 7th fret" are right.
  - **Greensleeves:** the French Wikipedia ABC, including bar 8 `G2 G G3` and the sharp held through bar 15. The 6/8 staff, pickup bar and dotted figures read well (`…\mcp-Claude_Browser-blob-1793714905995-n6s57z.jpg`).
  - **Minuet in G:** both halves correct, with the C♯ visit to D major; the chords are sensible.
  - **Canon:** the ground D A B F♯ G D G A; the first violin's quarter-note and 8th-note variations; "28 times".
  - **The Entertainer:** the first strain with its ties and first ending, "Not fast", and the C – B♭ – A – A♭ – G bass at the end (`…\mcp-Claude_Browser-blob-1793714919111-4vo936.jpg`).
  - **Prélude:** bars 1–10 an octave under the cello.
  - **Invention:** 3/8 with the D minor signature, the subject's B♭ → C♯ leap, and A7 labels R ♭9 ♭7 ♭13 (`…\mcp-Claude_Browser-blob-1793714932035-1hq20w.jpg`).
  - **Composers, dates and catalogue numbers:** BWV 1007, 775, 996, 1068, Anh. 114 and 126; Petzold 1677–1733; Pachelbel 1653–1706; Joplin 1902; the 1829 Columbian Harmony; Newton 1779.
- **The theory games:** 590 distinct questions over 7 modes, every answer right:
  - triads and 7th chords spelled by interval;
  - the degrees of all 12 major keys;
  - keys with up to six sharps or flats;
  - numerals in major and minor (ii°, ♭III, iv, V, ♭VI, ♭VII);
  - 9ths, 11ths and 13ths;
  - altered tones written plainly.
  - The tips are right (the last flat is the 4th, the last sharp the 7th; the relative minor a minor 3rd under).
  - A wrong tap shows every place and plays the answer. The end card counts the modes ("✓ Triads: the 3rd or the 5th cleared · 1 of 3 modes").
- **Tap mode with several answers:** "✓ 1 of 2: tap the other", then "✓ B♭ · Major: R 3 5".
- **The words after a loop:** "🎯 The app played a full loop at 220 BPM (the goal: 96 BPM). If you played along cleanly: ✓ Cleared" (`…\mcp-Claude_Browser-blob-1793715351774-kskv9r.jpg`).
- **No dots:**
  - Dot labels → "No dots: only the sound and the strip"; the neck stays empty while playing and the count runs (14/36).
  - The Stage 1 test's step 8 opens in G with an empty neck and "?" in the tab (`…\mcp-Claude_Browser-blob-1793715403231-8ox1pf.jpg`).
- **The stage tests:** each ends with a no-dots step and an ear step, each with its own "I can" line. The Stage 1 test's scale step is in B♭, "from the E string's 6th fret".
- **Keys on lesson steps:** sensible choices (jazz blues in B♭, gospel in A♭ and D♭, metal in E and D, minor blues in C, F and G).
- **Audio delay:** the device line ("This browser: one delay for every device"), the ⓘ, "Measuring…", the result in place of the pad, and "↻ Again".
- **Search:** "Bach" (6), "Beethoven", "Joplin", "ragtime", "minuet" and "tunes" (12) all find the tunes.
- **Library cards:** each card names its composer ("Ludwig van Beethoven, 1824", "Traditional, 1829").
