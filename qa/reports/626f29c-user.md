# QA User report · 626f29c · 2026-10-21

Setup: ninth round, focused on the complete Course (Stages 3–6 new in 55ad232, fdc717c, 4c44658, 626f29c: 39 units, 127 lessons, 39 checkpoints, 4 stage tests; the new Stage 2 lesson 8.5 "The chromatic scale and the X"; the placement grouped by stage; today's session at the end of the course; the reworked exercise tip), plus the round-8 fixes (12c0632, f060af0, 1d27b2d).
- Server and tab: my own `qauser` server (port 8890), opened as `http://127.0.0.1:8890` in my own tab (tab-2). The "seed" tab and ports 8765/8878 were not touched.
- Profile: empty at the start (service worker unregistered, caches and localStorage cleared), cache-busting `?qa=u9a…u9c`. For the end-of-course states I wrote my own course storage (`bassclass.course.v1`) in my tab: (a) placement "All yes" for all six stages, (b) every lesson complete with three reviews due, (c) Stages 1–4 complete. Cleared again at the end; viewport reset, tab closed, server stopped.
- Sizes: 800x380 (main), 640x360, 915x412, 1024x768. Basses: 4-string in the app; every Stage 3–6 step also built on 5 and 6 strings (0 errors, 0 over-the-fret notices).
- Method:
  - built every course step with the app's own modules and the step's preset (342 steps with a goal in Stages 3–6) and read notes, strings, frets, fingers, degrees, tags, chord badges and durations against the lesson's idea, concept, step text, "Watch out for" and "I can…" lines (`qa/tools/user9.js`: `cd()`, `brief2()`, `lk()`, `span()`, `dupes()`, `formBeats()`);
  - tempo realism per step: notes per second at the goal in the step's own notes per beat, and loop length;
  - real clicks for the flows: placement (All yes / All not yet per stage, See my starting point), Home session items, lesson pages, step buttons, Play (closes the tip and starts), step ◀ ▶ through #153;
  - DOM measurements (`getBoundingClientRect`, `scrollWidth`/`clientWidth`) for layout.
- Personas: intermediate player (Stages 3–4 as a learner), advanced player (placement, sessions, the map, tempos), jazz/bass teacher (every concept, formula, form, fingering and lick label in Stages 3–6).
- Not testable here: hearing the sound and the pad, the microphone, the Android app, real days passing. Screenshots render at odd scales; layout findings are DOM measurements. Screenshot paths are under `C:\Users\OscarGaya\.claude\projects\E--CLAUDE-BassClass\c7f026a2-fcf4-440e-b62e-e6df46b13395\tool-results\` (shortened to `…\` below).

Counts: Blocking 0 · Wrong 4 · Confusing 13 · Irritating 7 · Texts 8 · Visual 3, plus 6 questions.

## Expert verdict (short)

Stages 3–6 read like a real conservatory syllabus: the order (legato and funk before positions, scales across the neck before modes, triads and 7ths before voice leading, minor harmony before chord-scale, bebop before modern modes and superimposition, Coltrane last) is sound, the texts are short, British and in the app's voice, and most theory is exactly right: the brightness order of the modes, harmonic and melodic minor and their chords, Phrygian dominant over the minor V, the four dominants inside a °7, Barry Harris's 6th-diminished scale, melodic-minor superimposition, Messiaen's modes, harmonic major, the Giant Steps tonics, rhythm changes, guide-tone motion, the licks' labels and resolutions. Every Library exercise is used; tempos are realistic (fastest Stage 3 step 7.2 notes a second, Stage 6 7.2).

What weighs most:
- the voice-led arpeggio exercises squeeze every chord into two beats, so the "jazz blues" of the Stage 4 test is 7½ bars and "Giant Steps arpeggios" is a 13-bar form (the walking version has the real 16 bars);
- four wrong statements or labels (the "top note" of the 7th-chord ear drill, ♯1 and ♭3 as upper-structure tensions, incomplete pentatonic boxes);
- several lessons promise "one position" or "the hand stays in one place" while the dots climb from fret 2 to 17;
- many checkpoints test variants the unit never drilled (7:4, groups of 7, a 7/4 groove) and leave "I can…" lines without a step, unlike Stages 1–2 after the round-8 fix.

## Blocking     (a user cannot do what the screen is for)

None.

## Wrong        (incorrect musical or factual information)

### W1. Voice-led arpeggios give every chord two beats: the jazz blues becomes 7½ bars, Giant Steps 13 bars
- Where: #123 `arp-voice-led` and its variant #186 `arp-giant-steps`. Course: Stage 4 test step 4 (`arp-voice-led`, jazz blues), Lesson 53.2 "Giant Steps arpeggios" (both steps), Lesson 33.3 step 2 (cycle of ii–V–I).
- What I saw (chord badge and beats it lasts, `formBeats()`):
  - Jazz blues in C: `C7(2) F7(2) C7(2) Gm7(2) C7(2) F7(2) F♯°7(2) C7(2) A7(2) Dm7(2) G7(2) C7(2) A7(2) Dm7(2) G7(2)` = 30 beats. The real form is 12 bars: F7 lasts a bar, Gm7–C7 share bar 4, and so on. Autumn: 8 chords × 2 beats = 4 bars instead of 8.
  - Giant Steps: `Bmaj7(2) D7(2) Gmaj7(2) B♭7(2) E♭maj7(2) Am7(2) D7(2)…` = 52 beats (13 bars). The tune's one-chord bars (E♭maj7 bar 3, Bmaj7 bar 7, E♭maj7 bar 9, Gmaj7 bar 11, Bmaj7 bar 13, E♭maj7 bar 15) last 2 beats, so from bar 3 every chord sits in the wrong place against the bar lines.
  - #188 Walking over Coltrane changes (Lesson 53.3, same unit) uses the real form: `E♭maj7(4) … Bmaj7(4) … Gmaj7(4)…` = 64 beats. The progression table itself (`common.js` `'giant-steps'`) has the right lengths; the arpeggio builder plays one 4-note arpeggio per chord whatever its length.
- Why it matters: Lesson 53.2 says "Arpeggiating the changes in a continuous, voice-led line is a classic mastery test", and the Stage 4 test line "I can walk a complete line through a jazz blues" sits next to a 7½-bar blues. With the Backing on (both steps set `backing: 'chords'`), the band plays the same distorted form, so a student learns the wrong harmonic rhythm of the two most important jazz forms.
- Suggestion: one arpeggio per two beats, repeated (or continued up and down) for a chord that lasts a bar.

### W2. Lesson 24.4 "Hear the 7th chord": "Listen to the top note" points at the one note maj7 and 7 share
- Where: `#/course/hear-7ths`, "Watch out for": "Mixing up maj7 and 7. Listen to the top note: close to the octave (maj7) or a step below it (7)." Steps: #69 `ear-sevenths` (basic, five), Checkpoint 24.✓ step 2.
- What I saw: #69 voices every chord R-5-7-10 (its own about: "root, 5th, 7th and the 3rd on top"). Round 2: `C2 G2 B2 E3` (Cmaj7), round 1: `E2 B2 D3 G♯3` (E7): the top note is the major 10th in both. No octave is played. The concept's "a major 7th sits a half step under the octave, a minor 7th a whole step under it" also leaves out the °7 (a diminished 7th, three half steps under the octave), which step 2 and the checkpoint include.
- Suggestion: "Listen to the third note (the 7th): a half step under the root's octave (maj7) or a whole step (7); the °7 sits a step and a half under it."

### W3. Upper-structure tensions are labelled "♯1" and "♭3" (Lesson 44.3, Checkpoint 44.✓)
- Where: #153 `tri-upper-structures`; Lesson 44.3 step 2 (`us: VI/7`), Checkpoint 44.✓ step 2 (`us: bVI/7`). The lesson says "name the tensions".
- What I saw (degree labels): `VI/7 (A/C7 → C13♭9)`: `C(R) A(13) C♯(♯1) E(3)`; `bVI/7 (A♭/C7 → C7♯5♯9)`: `C(R) A♭(♭13) C(R) E♭(♭3)`; `bIII/7 (E♭/C7 → C7♯9)`: `C(R) E♭(♭3) G(5) B♭(♭7)`. Over C7 the C♯ is the ♭9 and the E♭ the ♯9, exactly as the option names say; "♯1" is not a tension name and "♭3" over a dominant contradicts the rule the licks follow ("a dominant's ♭9/♯9 always keeps its name"). Evidence: `…\mcp-Claude_Browser-blob-1792570089151-isctes.jpg` (strip "R 13 ♯1 3 ♯1 13 R", next-note ring "♯1" on G6).
- Suggestion: label tensions against the lower chord (♭9, ♯9, ♯11, ♭13, 13).

### W4. Pentatonic positions: two of the five boxes are incomplete (one note on three strings)
- Where: #107 `sc-pent-positions`; Lesson 29.3 (both steps) and Checkpoint 29.✓ step 2.
- What I saw (notes per position, strings E-A-D-G): C major pentatonic: Pos 1 = 5 notes `C@E8 D@E10 | G@A10 | C@D10 | E@G9` (2-1-1-1), Pos 4 = 6 notes (2-2-1-1), Pos 2 = 7; C minor pentatonic: Pos 2 = 5 notes (2-1-1-1), Pos 5 = 6, Pos 3 = 7. Same pattern in G major and A minor. The positions are built as a 4-fret window starting with the index on each scale degree, so notes one fret below the index (E@A7, A@D7, D@G7 in C major Pos 1) are left out and the box skips scale notes in the middle of its range (C D … G C E). The standard five boxes have two notes on every string (C major Pos 1: `C D | E G | A C | D E`, frets 7–10). The major scale positions (#106) are complete (3 notes on every string in all 7).
- Why it matters: the lesson says "five shapes that tile the neck" and the major step says "the same boxes, a different root"; a student who memorises Pos 1 of the major pentatonic learns a box with gaps, and the major and minor sets are not the same shapes.
- Suggestion: build each box as two notes per string around the starting degree (the index may sit one fret below it), keeping the decided numbering from the root.

## Confusing    (misleading, illogical, makes no sense)

### C1. "One position" and "the hand stays in one place" while the dots climb from fret 2 to 17
- Where and what I saw (`span()`):
  - Lesson 24.1 concept "'Up one, down the next' keeps you in one position"; Checkpoint 24.✓ "I can play the 7th chords of any major key in one position". #84 in C: roots climb the A string (C3, D5, E7, F8, G10, A12, B14, C15), frets 2–17; the checkpoint (in 4ths) jumps 7 frets (`A@G14 → D@G7`).
  - Lesson 23.4 step 1 "I to I in one position": frets 2–12 (Am, B°, C at frets 7–12). Step 2 and Lesson 32.2 step 1 (same notes, see I1) "Up one, down the next keeps the hand in one place": frets 2–12, jumps of 7 (`E@G9 → A@G2`); B° sits at frets 7–10 between chords at frets 2–5.
  - Checkpoint 32.✓ step 1 (1st inversion in 4ths): frets 5–17, a 10-fret jump `A@D7 → D@A17`.
- Why it matters: the claim teaches the student to expect a static hand; the drill trains big leaps instead. (The decision "each chord one hand shape near the starting position" is not what these builds do either.)
- Suggestion: either drop "one position" from these texts or choose each chord's octave by the nearest position (as the voice-led drills do).

### C2. Lesson 21.1 step 2 says "along the D string" and plays along the A string
- Where: `#/ex/sc-one-string?type=aeolian&string=D&ls=one-string.1`, default key C.
- What I saw: the tip reads "Natural minor along the D string: where are the half steps now?"; the board title reads "C minor on the A string"; the notes run A3–A15. C on the D string is at fret 10, so the fixed-root rule moves it. Evidence: `…\mcp-Claude_Browser-blob-1792570293558-wec0tv.jpg`.
- Suggestion: give the step a key that fits the D string (G: D5) or drop "D string" from the text.

### C3. Minor triad forms are "Root on finger 3, 1, 4", but the lesson and checkpoint say 1, 2 or 4
- Where: Lesson 23.1 (idea "Root under finger 1, 2 or 4", step 1 'Say "two", "one", "four"', step 2 "The same with minor triads: the forms change, the rule stays"), Checkpoint 23.✓ step 1 (minor) with "I can play major and minor triads with the root under finger 1, 2 or 4."
- What I saw: #78 minor labels the forms `{Root on finger 3} C@A3 f3, E♭@D1 f1, G@D5 f4` (a five-fret span, frets 1–5), `{Root on finger 1}`, `{Root on finger 4}`. There is no finger-2 minor form, so the checkpoint the student plays contradicts the line they tick.
- Suggestion: name the minor forms in the lesson ("in minor the forms are 3, 1 and 4") and in the "I can" line.

### C4. Inversion and string-set texts that the shapes contradict
- Lesson 23.2 concept "In position all three stay around the root", step 1 (`mode: position, root: E`): root position C@E8 E@A7 G@A10, then the 2nd inversion `G@E3 f1, C@E8 f2, E@A7 f1`: a 7-fret leap down the E string and back (`C@D10 → G@E3`). With the root on the E string there is no lower 5th nearby; root on the A string would keep it in place.
- Lesson 33.1 "On each string set you play root position, 1st and 2nd inversion, moving up the neck" and "let the notes ring together at the end": E-A-D set = root at frets 5–8, 1st inversion at 10–12, 2nd inversion back at 2–3; A-D-G set starts at fret 15 (`C@A15`), then drops to 5–7 (12-fret jump). There is no chord at the end (each shape is R-3-5-3, one note at a time).

### C5. Lesson 36.2 "Scale steps in walking lines": "Land chord tones on beats 1 and 3" next to "8-7-6-5 coming down"
- Where: concept and #130 `wk-scalar` (Autumn changes in F/D minor).
- What I saw: 8-7-6-5 puts the 6 on beat 3 by definition, and the line does it in 4 of 8 bars: `[Fmaj7] F E D(6) C`, `[A7] A G F(♭13) E`, `[Dm7] D C B♭(♭6) A` twice. The concept also says "Dorian on m7", but the Dm7 bars use B♭ (Aeolian, the i chord by function, as Lesson 31.2 taught).
- Suggestion: "chord tones on beat 1; scale steps lead to the next chord tone", and "the scale by function (Lesson 31.2)".

### C6. Side-slipping lick (Checkpoint 55.✓ step 2) slips the band too
- Where: #190 `lk-modern` lick 5 "Side-slipping (out and back in)", step with `backing: 'chords'`.
- What I saw: the progression is `Dm7 | E♭m7 | Dm7` as real chord badges (the tip says "The badge shows the chord the line slips to"). The Backing follows badges, so the pad moves to E♭m7 with the line and nothing sounds outside. Lesson 39.3 (pentatonic side-stepping) keeps the outside bar as text so "the backing stays on the home key, so you hear the tension"; the licks also have the `implied` mechanism for exactly this.
- Suggestion: mark the E♭m7 as implied.

### C7. Upper structures "II/I" and "II/7" play the same notes; the lower chord's quality never sounds
- Where: #153 options `II/I (D/C → Cmaj7♯11 (Lydian))` and `II/7 (D/C7 → C13♯11)`; Lesson 44.3 step 1.
- What I saw: both play `C D F♯ A F♯ D C` under the badge "D/C". Without the lower chord's 3rd and 7th, D/C is literally D7 in third inversion; "maj7♯11" vs "13♯11" exist only in the option name. The concept "D major over a C bass gives C Lydian (maj7♯11)" has no B in it.
- Suggestion: let the Backing (or the arpeggio) play the lower chord's 3rd and 7th, or say "D/C over a Cmaj7 chord".

### C8. "5th (dominant) approach" over its own default progression is mostly chromatic
- Where: #87 `gr-approach` style `fifthApproach` (default progression I–vi–ii–V); Checkpoint 25.✓ step 2.
- What I saw: beat 4 into F♯m7 is C♯ (its 5th); into Bm7 it is A♯, into E7 D♯, into Amaj7 G♯: half steps below. In a cycle of 4ths the next chord's 5th is the root just played, so the builder falls back to chromatic. 1 of 4 approaches is a 5th approach.
- Suggestion: default the style to I–IV–V–I or I–V–vi–IV, where the 5th approach can sound.

### C9. Checkpoints and stage tests test untaught variants, and many "I can…" lines have no step
- Untaught or different variant in the checkpoint step:
  - 38.✓ step 2: 7:4 polyrhythm; the lesson drills 3:2, 4:3, 5:4 and never mentions 7:4; the "I can" line says "3:2, 4:3 and 5:4".
  - 28.✓: groups of 7 (lesson steps 3 and 5) and 7/8 as 3+2+2 (lesson step 2+2+3); 37.✓ step 2: a 7/4 groove while the lesson drilled 5/4, 6/8, 7/8 and the "I can" line says "5/4, 6/8 and 7/8".
  - 19.✓: 9th position, while the lesson read in 5th and 7th and the "I can" lines say "5th and 7th positions" and "in 5th position".
  - 31.✓ step 2 (minor progressions; the lesson heard pop and jazz), 44.✓ (altered-scale triads and A♭/C7; lesson Lydian and Phrygian dominant, D/C and A/C7), 45.✓ (11ths and 7♯9; lesson 9ths, 13ths, 7♭9, 7♯5).
- "I can" lines with no step: 18.✓ quarter-note triplets; 19.✓ one note in all its octaves; 20.✓ the three fingerings; 21.✓ a scale along one string; 23.✓ root position and both inversions; 24.✓ start a 7th chord from any note; 25.✓ reggae, bossa nova and tumbao; 26.✓ a tune in two, and "through a jazz blues" (the step is Autumn); 27.✓ stretch; 31.✓ formula and chord of each mode; 32.✓ open triads; 33.✓ string sets and shells; 37.✓ soul ballad; 38.✓ p-i-m; 39.✓ double harmonic and Phrygian dominant; 40.✓ the four dominants of a °7; 41.✓ the modes of harmonic minor; 44.✓ quartal and sus stacks; 45.✓ upper-structure arpeggios and permutations; 47.✓ minor ii–V–i and minor blues; 48.✓ the minor ii–V–i moves; 49.✓ bass-line solo devices; 52.✓ Messiaen's cell; 53.✓ the major-3rd triads. Stage tests: Stage 3 "read in 5th position"; Stage 4 "odd meters and displaced figures", "read in every key".
- Why it matters: f060af0 made Stages 1–2 checkpoints "practise their I can lines" (e.g. 15.✓ got a dynamics step, 12.✓ an ear step); Stages 3–6 do not follow that rule, so ticking "I can" is self-report only for about one line in three.

### C10. Today's session: mislabelled items and a dropped review
- "Ear:" picks any step of the intervals module, including playing drills: "Ear: 38 Interval shapes from any root" (Stages 1–2 placed out), "Ear: 103 Diatonic 10ths" (double stops, 45 min, course complete).
- "Level 6:" items are Level 5 exercises: "Level 6: 174 Slap: ghost-note funk…" (L5, and optional slap content offered to every player) and "Level 6: 136 Interval cycles" (L5).
- Course complete, three reviews due (legato, two-feel, messiaen), 30 minutes: the session shows two reviews, then two Library extras; the third due review is left out (`dueLessons().slice(0, 2)` and early reviews capped at half the room).
- The completion texts still say "adds Level 6 exercises from the Library" (Home) and, after an all-yes placement, the toast "You know Stages 1–6: today's session reviews them and adds Level 6" (ends mid-phrase) for a player who has just said they know Level 6.

### C11. Terms used before they are taught (low)
- "Phrygian dominant (♭9, ♭13)" is used in Lessons 31.2 and 36.2 (Stage 4); the scale is taught in 39.4 and 41.3 (Stage 5).
- m(maj7) appears in Checkpoint 30.✓ step 2 (`Am(maj7)`) and Lesson 42.2 without an introduction (the five 7th chords of Stage 2 do not include it).
- The minor ii–V–i (`Em7♭5 A7 Dm7`) is walked in Lesson 26.1 step 2 and Checkpoint 26.✓, before minor harmony (Unit 30).

### C12. New Lesson 8.5: "One octave in one position" slides the index twice
- Where: Lesson 8.5 step 1, #44 `sc-chromatic` (layout pos), concept "in position it is a pure one-finger-per-fret workout".
- What I saw: `C@E8 f1 … D♯@E11 f4 | E@A7 f1, F@A8 f1, F♯@A9 f2 … | A@D7 f1, A♯@D8 f1, B@D9 f2, C@D10 f3`: the index plays fret 7 and then fret 8 on the A and D strings (frets 7–11 in all).

### C13. Lesson 48.3 "Blues licks and turnarounds" defines the turnaround with Imaj7 (low)
- Concept: "a turnaround … Imaj7 – VI7 – iim7 – V7"; the turnaround step (#169 lick 0) is on Cmaj7, next to a blues lick on C7. In a blues the I is a dominant 7th (I7–VI7–ii7–V7); worth saying "in a standard; in a blues the I is I7".

## Irritating   (works, but annoys or slows the user)

- I1. Identical steps (same notes, strings, frets and durations, `dupes()`):
  - 21.3 step 3 (#71 in 3rds) = 21.4 step 1 (#68 3rds), consecutive lessons;
  - 23.4 step 2 (#81 in 4ths) = 32.2 step 1 (#113), a Stage 4 lesson repeating Stage 3;
  - 33.3 step 1 (#122) = 33.3 step 2 (#123 cycle-251): 144 identical notes in the same lesson;
  - 36.3 step 2 (#131 rhythm changes) = 47.2 step 1 (#164) = 47.✓ step 1: two chords per bar leave room only for root and approach, so "every device" (Stage 4) and "Two chords per bar" (Stage 5, presented as new) are the same line.
- I2. The course map is 21.3 screens tall at 800x380 (8,097 px), 23.8 at 640x360, 15.3 at 915x412; it opens at the top and has no stage jump (the Library has level buttons). A player in Stage 5 finds the next lesson row 5,907 px down at 640x360; the header button opens the lesson page, not its place on the map.
- I3. Placement: "See my starting point" stays disabled with no hint until all 39 statements are answered; a player who answers "All not yet" for Stage 3 must still press "All not yet" for Stages 4, 5 and 6. The page is 2,808 px at 800x380.
- I4. Very long single loops for a pass: Checkpoint 46.✓ step 2 (octave funk, 12-bar blues in 12 keys) is one unbroken loop of 5 min 46 s at the goal; 51.✓ step 2 160 s, 53.✓ step 2 152 s, 51.3 137 s. One slip means starting the whole loop again.
- I5. Fingering glitches in course steps (fingers as shown with Finger labels):
  - 33.✓ step 1, `[Dm] D@G7 f1, F@G10 f4, A@G14 f4, F@G10 f2`: three notes on the G string, the little finger slides 4 frets and F changes finger (the triad decision says "three never");
  - 33.2 step 2, `[Am] C@D10, E@G9, A@G14, E@D14`: the same E at G9 and D14 inside one 4-note cell;
  - 25.1 step 1, `[C] C@A3 f1, E@A7 f3, G@D5 f1`: the index moves after the first note (f1-f4-f3 or E@D2 needs no shift);
  - 29.1 step 1 (key box), `B@D9 f1` then `C@G5 f1`; 32.✓ step 2, `G@G12 f4 → C@G17 f4` (5-fret slide); 36.1, `B♭@G3 → B♭@G15` (an octave on one string, 12 frets at 126 BPM);
  - 32.3 step 1 (R-5-10 from the E string) climbs to `B@E19 F@A20 D@G19` and loops back to fret 8.
- I6. Groove placement: reggae (25.4 step 1) plays bar 4 an octave up, `A@D7 E@G9 A@G14 E@D14`, then drops back for bar 1 ("sits deep in the groove"); the approach, Motown and funk16 lines play the same root first at A@E5 and then on the open A inside one beat or bar (`A1@E5 d1.5 | A1@open A d0.5`).
- I7. Three notes per string (21.2): "Triplets fit the fingering: one group of three on each string" holds going up only; coming down the beats start mid-string (`F E D | C B A | G F E | D C –`) and the 23-note loop is not whole bars.

## Texts        (typos, unclear wording, inconsistent names)

- T1. "meter" is American; the app's British rule gives "metre" (Stage 4 description "odd meters", "odd-meter", Unit 28 goal, Lesson 28.3 "Odd meters", Unit 37 "Soul, odd meters and slap", 37.2, the Stage 4 test line, placement statement).
- T2. Placement: Stage 6 statement "I can arpeggiate and walk Giant Steps…" is the only "I can" among "I play / I know" statements. Toast after an all-yes placement ends "…and adds Level 6".
- T3. Lesson 17.3: "Double bassists use fingers 1, 2 and 4 there (the Simandl fingering), with fingers 3 and 4 working together across three frets": it is 1-2-4 that covers three frets; 3 and 4 work together on the third.
- T4. Lesson 18.1 mistake "Quarter-note triplets that turn into straight quarters: the second note comes before beat 2." reads as a description of the mistake; it is the correct behaviour ("…: the second note should come before beat 2").
- T5. Stage counters on the map count checkpoints and the test ("46/46" for Stage 4, 34 lessons + 11 checkpoints + 1 test), while Home and the map header count lessons only ("176 of 176 lessons done").
- T6. Overstatements: 44.1 "the altered scale is full of diminished and augmented triads" (3 of 7: C°, F♭+, B♭°); 45.1 "These arpeggios span two octaves" (a 9th arpeggio spans a 9th); 39.1 step 1 "The cycle of 4ths for two octaves" (C F B♭ E♭ A♭ = 1⅔ octaves); 28.1 title "Groups of 3, 5 and 7" (7 only in the checkpoint).
- T7. Lesson 33.4: "A shell voicing keeps root, 7th and 3rd: root on the E or A string, the 7th two strings up and the 3rd, as a 10th, on the top string." On a 4- or 5-string a root on the A string puts the 7th on the top string; #126 uses E-string roots only.
- T8. Lesson 8.5 spelling: the X reads `A D♯ A E♭` in one rising diagonal (step 2, Pos 5); the chromatic scale with Degree labels shows C♯ as "♭2", D♯ "♭3", F♯ "♭5", G♯ "♭6", A♯ "♭7" (step 1).

## Visual

### V1. Stage titles wrap onto two or three lines on the course map
- `h2` widths: 800x380 "First steps" 63x45, "Harmony on the neck" 80x67, "The whole neck" 52x67, "Jazz language" 68x45; 640x360 "The whole neck" 45x67; still 70x67 at 1024x768. The description beside it takes 536–564 px. Evidence: `…\mcp-Claude_Browser-blob-1792570030296-5wlsig.jpg` ("The / whole / neck").

### V2. Exercise header: the goal's notes per beat is the part that gets cut
- 800x380, lesson steps: title box 145–192 px; titles cut in 5 of 6 tried ("Melodic-minor superimposition: one shape, seven chords" 412/153 px); subtitles "Lesson 52.2 · step 1/1 · goal 100 BPM in 8ths" 225/145, "…goal 84 BPM in triplets" 233/192. 640x360: "Lesson 44.3 · step 2/2 · goal 84 BPM in …". The goal button shows "–/84" without the subdivision, so on phones "in 8ths" is visible nowhere in the header. (Improved since round 8: the title box was 115 px.)

### V3. The tip callout covers the G string and the first note when it is there
- 640x360, Lesson 33.4 step 1 (#124): callout at y 44–99, x 151–490; the first-note marker (F@G10) at y 78–113, x 305–340: its top two thirds are under the callout, and the status reads "ready · 6 no…". Evidence: `…\mcp-Claude_Browser-blob-1792570138508-8ogcpk.jpg`. Eight lesson steps start on the G string (25.3 step 2, 29.4 step 2, 33.4 step 1, 35.1 step 2, 35.2 steps 1–2, 54.1 steps 1–2). The callout closes on any press (checked: Play closes it and starts playback), so this only matters while reading it. At 800x380 the callout is 424x55 over the G string.

## Questions for the owner

- Q1. Should the voice-led arpeggio exercises keep each chord's real length (W1), so jazz blues, Autumn and Giant Steps keep their forms?
- Q2. Pentatonic boxes (W4): allow the index one fret below the starting degree so every box has two notes per string, keeping the "numbered from the root" decision?
- Q3. Checkpoints in Stages 3–6: one step per "I can" line, as Stages 1–2 now do, and no variants the unit never drilled (C9)?
- Q4. End of the course: what should Home and the session offer once Level 6 is done (all-keys maintenance, no "Level 6" label, slap only for players who did the optional slap lessons)?
- Q5. Course map: stage jump buttons, and open the map at the next lesson (I2)?
- Q6. Should the session's "Ear" slot take only ear, reading and interval-quiz drills, not playing drills of the intervals module (C10)?

## Status of the 91ad82b findings (round-8 commits 12c0632, f060af0, 1d27b2d)

| # | Finding (91ad82b) | Status | Evidence now |
|---|---|---|---|
| W1 | 12.2 "only one note moves" | fixed | "augmented then raises the 5th of the major triad (so from diminished both the 3rd and the 5th move)" |
| W2 | 10.1 "every note on two or three strings" | fixed | "(only the lowest few, open E to G♯, live on the E string alone)" |
| W3 | 13.3 root and 3rd | fixed | "Root and 3rd tell major from minor. The vii chord has a minor 3rd too, but its 5th is a fret lower" |
| W4 | 5.3 "never clash" | fixed | "so they rarely clash" |
| C1 | Disco octaves on one string | fixed | `F♯@E2 F♯@D4 … D@A5 D@G7 … E@E0 E@D2`, string skip every chord |
| C2 | Quiz answers in the strip | fixed | #35: "?" for every unplayed note (`…\mcp-Claude_Browser-blob-1792570245319-sb6ino.jpg`) |
| C3 | Subdivision not in the goal | fixed | steps carry `sub`; "goal 96 BPM in 8ths" (cut in the header on phones, V2) |
| C4 | Fingering texts | fixed | 11.1 "the minor 3rd three frets up on the same string (or one string up and two frets back)"; 11.2 "all around one hand position"; 5.2 frets 1–4 sentence gone |
| C5 | Shapes called "one shape" | fixed | #17 `A@E5 E@A7 A@D7 E@A7`; boogie from fretted roots |
| C6 | Checkpoint 16.✓ keys | fixed | Lesson 16.2 adds D and B♭ major |
| C7 | Beginner session | decided | logged |
| C8 | "Complete" after placement | fixed | "✓ Stages 1–6: 0 done, 176 known" |
| C9 | Order and jargon | fixed | 4th, ledger line and the shuffle 6th explained where used |
| C10 | No holding/tuning lesson | fixed | Lesson 1.1 "Holding and tuning the bass" |
| C11 | "I can" lines in Stages 1–2 | fixed | dynamics, ear-triads and shuffle steps; Stage 1 test 112 BPM. Not followed in Stages 3–6 (C9 above) |
| C12 | Ear steps judged as playing | decided | "Got them all?" |
| C13 | Settings reset keeps the course | fixed | "Reset all progress, the course included?" |
| I1 | Untick in the exercise | decided | |
| I2 | Step text as a 4.5 s toast | fixed | light callout with ×, closes on any press |
| I3 | "Next" after a lesson completes | not re-tested | |
| I4 | Review plays one step | fixed (text) | "A review is due: play step N once more at its goal tempo" |
| I5 | Three start buttons | fixed | Course block + session; the warm-up says "outside the course" |
| T1 | "in today's session" | fixed | "in that day's session on Home" |
| T2 | Lesson counts | partly | Home and header 176 lessons; stage line still counts checkpoints (T5) |
| T3 | 60 days missing | fixed | "(after 1, 3, 7, 21 and 60 days)" |
| T5 | Finger-pair names | fixed (commit) | not re-measured |
| T6, T8, T9 | Statistic, "arpeggio shape", "Swing them" | fixed | texts gone |
| T7 | "#1" rounds | fixed | "Round 1" |
| T10 | Rake vs strict alternation | fixed | 8.1 "In Lesson 1.2 you alternated strictly; the rake is the one exception" |
| V1 | Header cut | partly | V2 above |
| V2 | Map titles truncated | fixed | 0 of 242 rows cut at 640, 800, 915, 1024 (titles wrap) |
| V4 | "1 1" step rows | fixed | "Exercise 175 · from 66 → goal 88 BPM in 16ths" in the tempo line |
| V5 | Steps under the pitfalls | fixed | steps before "Watch out for" in one column |
| V3, V6 | Goal button width, #126 beam | not re-tested | |

## Checked and fine

- Theory in the Stage 3–6 texts against the exercises: hammer-on/pull-off and legato tags (only the first note on a string plucked, pull-offs coming down); the 15 cells of the 16th grid; 3+3+2; harmonics at 12/7/5/4 with the right sounding pitch (`play` 40, 47, 52, 56 on the E string); groups of 3/5/7 needing 3/5/7 bars; 7/8 clicked in 8ths; ledger lines above the staff (C, E, G on lines) and C = G5 = A15; 3rds through the major scale M m m M M m m; the seven modes and the brightness order with the one changed note; I ii iii IV V vi vii° and the 7th chords of a key; the harmonic-minor V and ♭III+, melodic minor i ii ♭III+ IV V vi° vii°; the Andalusian cadence; chord-scale by function with Phrygian dominant on the minor V and 9/11/13 on dominants; guide tones (7th falls a half step, 3rd stays); diatonic 10ths (one fret higher for a major 10th); R-5-10 and R-7-10 voicings; Simandl 1-2-4 at fret 1; half-whole over 7♭9 and whole-half over °7, period 3 and 2 frets; double harmonic, Phrygian dominant, Hungarian minor = double harmonic from its 4th; bebop dominant and major landing chord tones on the beats descending from the root; C6 / B°7 alternation; B°7 → B♭7, D♭7, E7, G7 and C♯°7 = A7♭9; melodic-minor modes and the shortcuts (G altered = A♭ melodic minor, G7♯11 = D melodic minor); harmonic-minor and harmonic-major modes with their names; three major pentatonics per mode and the tritone pentatonic over 7alt; triad pairs (F/G Ionian, C/D Lydian, D♭/C Phrygian dominant); sus4/sus2/quartal stacks with the augmented 4th; secondary dominants, borrowed ♭VI/♭VII, tritone sub sharing B and F; Messiaen's modes 3 (9 notes, every 4 frets) and 5 (6 notes, tritone cell); Giant Steps tonics B G E♭ and the walking form; rhythm changes A section; the 12-bar and minor-blues forms in the walking lines.
- Licks: "Arpeggio up, ♭9 down" (the ♭9 A♭ falls to G and the line lands on C on beat 1); the enclosure into the 3rd; Locrian ♮2 into melodic minor with A♭ (♭9) falling to G over Cm6; Barry Harris diminished arpeggios; the tritone-sub turnaround (Cmaj7 E♭7 Dm7 D♭7); "The Lick"; the bebop scale from the 3rd with chord tones on the beats; implied V7♭9 and ii–V7♭9 over vamps resolving 3rd → root; motif with a bar of silence. Labels follow the logged jazz rules.
- Grooves and walking: one-drop reggae with beat 1 empty, bossa R . . 5 | 5 . . R, tumbao anticipating on beat 4, country two-beat with a pickup, samba 16th anticipation, second line R-3-5-6, neo-soul on the chord's 7th, slap thumb/pop/hammer/pull-off on the right strings, double thumb ↓↑ with pops; walking approaches and enclosures resolve onto the next root by half step.
- Tempos: realistic in every new step (Stage 3 max 7.2 notes a second, Stage 4 6.9, Stage 5 6.7, Stage 6 7.2); slow steps are written half or whole notes.
- Placement: grouped by stage with "All yes" / "All not yet" (they keep the scroll position and the previous answers); all-yes leads to "✓ Stages 1–6: 0 done, 176 known"; mixed answers start at Lesson 17.1 with "53/176 lessons".
- Course complete: Home "✓ Stages 1–6 complete", map "176 of 176 lessons done", no continue button; due reviews come first in the session.
- Tip callout: light mint box (`rgb(234, 250, 244)`, dark text) with a title for lesson steps, closes on × and on Play (Play also starts the exercise); checkpoint steps show no callout.
- Layout: no horizontal scroll on Home, the map, placement and lesson pages at 640x360, 800x380, 915x412 and 1024x768; 0 lesson titles cut on the map.
- British spelling throughout the new texts ("practise" as a verb, "programmes", "colour", "harmonised"), apart from "meter" (T1). Every Library exercise appears in at least one lesson; every step builds on 4, 5 and 6 strings.
