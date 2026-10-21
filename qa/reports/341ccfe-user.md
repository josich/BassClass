# QA User report · 341ccfe · 2026-10-21

Setup: tenth round, on release v1.0.45. Focus: the round-9 fixes (8aa8df6, commit message in 692eecb) and the round-9 leftovers (341ccfe): fingering and positions (voice-led triads and 7ths, chord-tone grooves, key box, two-octave triads and arpeggios, open R-5-10 triads, grooves, walking, slap), the course after the fixes (checkpoint and stage-test steps against their "I can" lines, step and concept texts, "metre", the course-end session, placement, course map, the tip at the bottom of the board, lesson header widths) and Back navigation.
- Server and tab: my own `qauser` server (port 8890), opened as `http://127.0.0.1:8890` in my own tab (tab-9). The "seed" tab and ports 8765/8878 were not touched.
- Profile: empty at the start (service worker unregistered, caches and localStorage cleared), cache-busting `?qa=u10a…u10f`. For the course-end state I wrote my own course storage (`bassclass.course.v1`): every lesson complete, reviews due for `legato`, `two-feel`, `messiaen`. Placement was answered with real taps. Storage cleared again at the end; viewport reset, tab closed, server stopped.
- Sizes: 780x360 (main), 640x300, 915x412; basses: 4-string in the app; the voice-led and harmonised exercises also built on 5 and 6 strings.
- Method: built exercises and course steps with the app's own modules (`qa/tools/user10.js`: `shp()`/`shpInst()` per-chord shapes, `needless()` finger labels that imply a shift inside a 4-fret chord, `fingOdd2()` finger numbers that contradict the frets, `hands()`, `checks()`, `span()`, `dupes()`, `brief()`), sweeping every option and key one at a time; real taps for map, placement, session, lesson pages, steps, Done, Back and double-Back, Options, ⋯ menu, Play; DOM measurements (`getBoundingClientRect`, `scrollWidth`/`clientWidth`, `scrollTop`).
- Personas: beginner (Home, Lesson 1.1, Stage 1 steps, finger labels in Levels 1–2), advanced player (placement, map, session, Stage 3–6 steps, fingering everywhere), jazz/bass teacher (theory and fingering of every changed text and step, licks, walking, upper structures).
- Not testable here: hearing the sound and the backing, the microphone, the Android app, real days passing. Screenshots render at odd scales; layout findings are DOM measurements. Screenshot paths are under `C:\Users\OscarGaya\.claude\projects\E--CLAUDE-BassClass\c7f026a2-fcf4-440e-b62e-e6df46b13395\tool-results\` (shortened to `…\` below).

Counts: Blocking 0 · Wrong 2 · Confusing 7 · Irritating 4 · Texts 4 · Visual 3, plus 5 questions.

## Expert verdict (short)

The round-9 fixes landed well. Voice-led arpeggios now keep the real forms (jazz blues 48 beats, Giant Steps 64 beats with its one-chord bars, Autumn 8 bars, rhythm changes A 8 bars); every voice-led triad and 7th chord is one hand shape (0 shape problems in 3,000+ chords on 4, 5 and 6 strings); pentatonic boxes are 2-2-2-2 with a span of 4 frets at most; upper-structure labels are right; grooves close their loops (0 of 168); every walking and groove approach resolves (0 of 600+), across key changes too; slap runs on D/G start with a pop (0 of 404 thumbed); the course end, placement cascade and hint, S1–S6 jumps, Back, double-Back and Done all behave.

What weighs most now:
- the "up one, down the next keeps the hand in one place" claim survives in nine Library exercises and in Lesson 51.4, where the line covers frets 1–20 with 73 hand shifts;
- finger numbers still contradict the frets in some chord-tone patterns and beginner triads (D major labelled 4-3-2-2 at frets 4–7), and the new `chordShape` helper labels some augmented/diminished shapes 1-3-4 on frets lo, lo+1, lo+4;
- the new Checkpoint 32.✓ step 3 brings back the R-5-10 climb to frets 19–20 that Lesson 32.3 was moved to F to avoid, and 40% of the R-5-10 chords put the 5th on the D string instead of the A string.

## Blocking     (a user cannot do what the screen is for)

None.

## Wrong        (incorrect musical or factual information)

### W1. "Up one, down the next keeps the hand in one place": still false in nine Library exercises and in Lesson 51.4
- Where: tips of #81 `tri-diatonic`, #111, #112, #113, #114 `tri-open-spread`, #151, #152, #182 ("The "up one, down the next" pattern keeps the hand in one place. Try it."); #81 about "Play them in one position"; #84 about "Learn them in one position first"; Lesson 51.4 `sevenths-all-keys` concept "Up one, down the next keeps you in position."
- What I saw: the notes these texts describe (defaults; `pattern: alt` gives the same span): #81 frets 2–12 (alt: 2–12, 3 shifts); #111 3–13; #112 5–17; #113 2–12; #114 7–20; #151 2–12; #152 3–16; #182 1–20; #84 2–17. Lesson 51.4 step 1 (`arp-diatonic-all-keys`): frets 1–20, 73 hand shifts, biggest jump 14 frets (`C@A15 → F@E1` between keys).
- Why it matters: round 9 removed these claims from the course texts (C1), but the exercise screen (ⓘ about and tips) and one Stage 6 concept still promise a static hand while the dots climb the whole neck.
- Suggestion: "Up one, down the next turns the chords into a line" (the wording the course now uses).

### W2. Finger numbers that contradict the frets (Dot labels: Fing)
- (a) Chord-tone patterns and grooves: a chord that fits in four frets is labelled as if the hand shifted inside it. #85 `hm-chord-tones`: 998 of 14,028 chords (all progressions × patterns × 12 keys). Examples:
  - key A, R-3-5-8, bar 3: `[D] D@A5 f4, F♯@D4 f3, A@D7 f2, D@G7 f2`: frets 4–7, one position (2-1-4-4), labelled 4-3-2-2. Evidence: `…\mcp-Claude_Browser-blob-1792576027451-gxvw0t.jpg` (dots "4", "3", "2", "2").
  - key C, R-5-8-5: `[C] C@A3 f1, G@D5 f2, C@G5 f2` and `[F] F@E1 f1, C@A3 f2, F@D3 f2` (the 5th two frets above the index on finger 2; the octave shape is 1-3-3/1-3-4); Root–5th `[G] G@E3 f1, D@A5 f2`.
  - key A♭, R-3-5-3: `[D♭] D♭@A4 f4, F@A8 f4, A♭@D6 f2` (pinky slides four frets up the A string; one shape exists: `D♭@A4 f2, F@D3 f1, A♭@D6 f4`).
  - #125 `hm-minor-keys` in E♭ minor: `[B♭7] B♭@E6 f3, D@A5 f2, F@A8 f3, A♭@D6 f1` (frets 5–8 = 2-1-4-2); 15 of 87 chords flagged; #161 `hm-colour-chords` 17 of 73; #127 `gr-soul` 12 of 117.
- (b) Beginner triads and 7ths (Levels 1–2, course lessons 6.3, 6.✓, 12.2, 13.1): the minor chord keeps the major chord's finger on the root. #15 `tri-maj-min` (Lesson 6.3 step 1): `[Cm] C@A3 f2, E♭@A6 f4, G@D5 f3` (2 and 4 three frets apart; the minor form is 1-4-3). #48 `arp-7th-qualities` (Lesson 13.1): `[Cm7] C@A3 f2 … B♭@G3 f1` (fret 3 under finger 2 and finger 1 in one chord). #46 shows the same C first as f2, then as f1. #50 `hm-chord-qualities` in E♭: `[D°] D@G7 f3, F@G10 f2`. #51 canon / #17 in F: `C@A3 f3` then `C@A3 f1` for the same repeated note.
- (c) The new `chordShape` helper (voice-led and harmonised chords): a five-fret shape with frets {lo, lo+1, lo+4} is labelled 1-3-4, so finger 3 sits next to finger 1 and finger 4 is three frets past finger 3. #151 default `[B♭+ ♭VII+] D@G7 f1, B♭@D8 f3, F♯@G11 f4`; #81 2nd inversion `[B° vii°] F@D3 f1, B@G4 f3, D@G7 f4`; #117 dim `[C°] G♭@D4 f1, C@G5 f3, E♭@G8 f4`; #160 key B `[F♯7♯5] A♯@G3 f1, F♯@D4 f3`. Counts of such pairs: #151 42 (455 chords), #182 22, #184 8, #111 4, #112 3, others 1 each. (The finger formula `1 + round(i·3/(n−1))` spaces fingers by index, not by fret.)
- Why it matters: the finger numbers are the app's fingering advice; a beginner who turns on "Fing" in Lesson 6.3 is told to play C minor with a 2-to-4 stretch, and a teacher sees impossible numbers (3 on fret 8, 4 on fret 11).
- Suggestion: derive labels from one hand position per chord (as `chordShape` does for frets) and space fingers by fret distance (lo → 1, lo+1 → 2, lo+4 → 4).

## Confusing    (misleading, illogical, makes no sense)

### C1. Checkpoint 32.✓ step 3 (new) brings back the R-5-10 climb to fret 20, and the R-5-10 shape changes on minor chords
- Where: Checkpoint 32.✓ step 3 (`tri-open-spread`, default key C, from the E string); Lesson 32.3 step 1 was moved to F with the text "frets 1 to 15" for exactly this reason.
- What I saw: C → … → `[B°] B@E19 F@A20 D@G19` → back to `C@E8` (11-fret jump into the loop). Frets 7–20 on a 4-string; with "Highest fret used" 17 the step goes over and shows the notice. Evidence: `…\mcp-Claude_Browser-blob-1792576035735-g1fd16.jpg` (board to fret 21, strip "B° 19 20 19").
- Also: in #114, 76 of 192 chords (12 keys × root E/A) put the 5th on the D string, a string skip three frets back, instead of the A string: `[Dm] D@E10 A@D7 F@G10`, `[Em] E@E12 B@D9 G@G12`, `[Am] A@E5 E@D2 C@G5` (labelled 4-1-4). The lesson calls the shape "R-5-10" and every major chord in the same line uses E-A-G (`[C] C@E8 G@A10 E@G9`).
- Suggestion: give the checkpoint step a key that fits (F, as the lesson), and keep the 5th on the string above the root.

### C2. After "See my starting point" the map can open far from the starting lesson
- What I did: course map scrolled 40 px → "Placement check" → answered → "See my starting point".
- What I saw: toast "Start here: Lesson 17.1 · Hammer-ons and pull-offs", map at `scrollTop 40` (Stage 1, all "known"), row 17.1 at y 2,581 (off screen). With the map scrolled to Stage 4 first: map back at `scrollTop 3930`, row 17.1 at y −1,309. Cause: Back restores the remembered scroll, and the centring runs only when `scrollTop < 8`.
- Why it matters: the screen the placement sends you to does not show the place it just told you about (the header button "▶ Lesson 17.1" does lead there).

### C3. Upper structures: II/I and II/7 are still the same exercise, and the Library text still calls D/C "C Lydian (maj7♯11)"
- Where: #153 options `II/I (D/C → Cmaj7♯11 (Lydian))` and `II/7 (D/C7 → C13♯11)`; the ⓘ about: "D major over a C bass gives C Lydian (maj7♯11)".
- What I saw: both options play `C D F♯ A F♯ D C` under the same badge "D/C" (so the Backing plays the same chord too). Lesson 44.3's new concept explains it correctly ("so the lower chord decides"), but nothing in the exercise plays or shows the lower chord's 3rd and 7th, and the exercise's own about still states the old claim.

### C4. #78 still says "root under finger 1, 2 or 4" while its minor forms are 3, 1 and 4
- Where: #78 title "The 3 triad fingerings (root under finger 1, 2 or 4)", tips 'Name the form out loud: "two", "one", "four"' and "Repeat with minor triads: the forms change but the rule is the same". Checkpoint 23.✓ step 1 opens #78 in minor.
- What I saw: the minor badges read `{Root on finger 3}`, `{Root on finger 1}`, `{Root on finger 4}`. Lesson 23.1 and the checkpoint line were fixed in round 9; the exercise header and tips the student sees during the checkpoint were not.

### C5. Checkpoint 42.✓ no longer tests the 7♯11 its "I can" line names
- "I know which melodic minor to play over 7alt, 7♯11 and m7♭5." Step 2 changed from `set: all` to `minor251`: `Dm7♭5 (F mm) | G7alt (A♭ mm) | Cm(maj7) (C mm)`. 7♯11 is only in `dominants`/`all` (`C7♯11 → G melodic minor`).

### C6. Placement Stage 3 promises "read up to the 9th position"; the stage reads in 5th and 7th
- Placement: "I know every note in any position and read up to the 9th position." Lesson 19.3 reads in 5th and 7th position, Checkpoint 19.✓ in 5th, the Stage 3 test line is "I can read in 5th position." (#67 does offer 9th position, but no lesson uses it.)

### C7. Two step texts still start with "A minor…" / "A major…" where the key is not A
- Lesson 42.2 step 1: "A minor-key ii–V–i: three melodic minors." The line is in C minor (`Dm7♭5 G7alt Cm(maj7)`).
- Lesson 32.3 step 2: "A major triad (any key) over two octaves. Shift on the octave." The step opens in C.
- 341ccfe aimed to remove exactly this reading; "A minor-key" and "A major triad" still read as keys.

## Irritating   (works, but annoys or slows the user)

- I1. Upper-structure triads along one string: 15 of 36 option × key builds play the three upper notes on the G string alone, with the index sliding: Lesson 44.3 step 1 (II/I in C) `C@E8 | D3@G7 f1, F♯3@G11 f1, A3@G14 f4` (one shape exists: `D3@D12, F♯3@G11, A3@G14`); `iii/I`, `bIII/7`, `bV/7` likewise (`G♭3@G11 f4, B♭3@G15 f1, D♭4@G18 f4`).
- I2. #155 `arp-dim-to-minor` (not on the chord-shape helper): the descending minor triad shifts inside four notes where one shape fits: `[Fm] F@G10 f4 → C@G5 f3, A♭@D6 f4, F@D3 f1` (one shape: `G10 D10 A11 A8`), `[E♭m] E♭@G8 f4, B♭@D8 f4, G♭@D4 f2, E♭@A6 f4`; wrong labels `[C♯m] … C♯@A4 f4`, `[Dm] … D@A5 f4` (the lowest fret of the shape on the little finger). 11 of 24 chords flagged in the default cycle.
- I3. Two-octave 7th arpeggios on a 6-string: `[Cmaj7] … G@A10 f4, B@A14 f4, C@A15 f4, E@D14 f4, G@G12 f2, B@C11 f1, C@C12 f2`: the little finger slides A10 → A14 → A15 and stays on for D14: 6 hand shifts, not "one shift at the octave". (4- and 5-string: 2 shifts, fine.)
- I4. The S1–S6 buttons sit only at the top of an 8,000-px map: after a jump, reaching another stage means scrolling back up (they do not stay on screen).

## Texts        (typos, unclear wording, inconsistent names)

- T1. Two names for the placement: the map button reads "Placement check" once a placement exists; Home reads "Already play? Find your level"; the page title is "Find your level".
- T2. Stages known from the placement read "0/22 lessons", "0/31 lessons" on the map while the header says "0 of 176 lessons done · 53 known" and every row shows "known".
- T3. #57 `tech-legato`: "sharps going up" except the turn note: `C3 C♯3 D3 E♭3` on the G string (A♯, D♯, A♯ on the other strings).
- T4. #106 keeps the title "Major scale: the 7 positions across the neck" when the Stage 4 test plays it in natural minor (badges "Pos 4 {C minor}" … ).

## Visual

### V1. The map hides its header and S1–S6 for a new player
- Next lesson 1.1 is centred: 780x360 `scrollTop 168`, title at y −155, S1–S6 at y −11…23 (cut in half); 640x300 `scrollTop 194`, S1–S6 at y −41…−7 (hidden), "Find your level" hidden. Evidence: `…\mcp-Claude_Browser-blob-1792575216577-wrtm7k.jpg`.
- Suggestion: no centring when the next lesson is already on the first screen once the header is shown.

### V2. Header cuts on 640-px phones
- Lesson page h1: 18 of 242 titles cut at 640 px (available 394 px; "Lesson 29.2 · The 7 positions of the major sc…", "Lesson 34.3 · The 7th chords of a key in inv…"); 2 at 780 px.
- Exercise header at 640 px: subtitle "Lesson 17.2 · step 1/1 · goal 84 BPM in 8ths" needs 219 px of 210, so "in 8ths" is the cut part (the goal button shows "–/84"); title 291/210. Fine at 915 px (291/291).

### V3. The tip covers the tab strip and the fret numbers
- 780x360: tip y 236–309 over the fret-number row and the strip; 640x300: tip 176–249, strip 189–255 (91 % covered), board bottom 188; 915x412: tip 288–361, strip 301–367. The notes on the board stay clear (E string at y ≈ 157 at 640x300) and the tip closes on Play (checked: `display: none` after a real tap), so this only matters while reading it.

## Questions for the owner

- Q1. W1: should the harmonised-chord exercises really stay in one area (as their tips promise), or should the tips change to the course's wording?
- Q2. W2: should every chord-tone pattern and groove take its finger numbers from one hand position per chord (as the voice-led chords now do)?
- Q3. Checkpoints whose "I can" line names several variants test one of them: 20.✓ (major and minor two-octave scales → major), 25.✓ (reggae, bossa and tumbao → tumbao), 30.✓ (harmonic and melodic minor → harmonic), 37.✓ (5/4, 6/8 and 7/8 → 7/8), 38.✓ (3:2, 4:3, 5:4 → 5:4), 40.✓ (bebop dominant and major → dominant), 42.✓ (C5). Is one variant per line enough?
- Q4. After the course, the session's warm-up can be a Level 1 drill (30 min: "Warm-up: 15 Major vs minor: hear the 3rd"), and the Daily warm-up still opens at L1. Should a graduate's warm-up come from Levels 4–6?
- Q5. R-5-10 (C1): always the 5th on the string next to the root (E-A-G), even when the D-string 5th is nearer the starting fret?

## Status of the 626f29c findings (round-9 commits 8aa8df6, 341ccfe)

| # | Finding (626f29c) | Status | Evidence now |
|---|---|---|---|
| W1 | Voice-led arpeggio forms | fixed | jazz blues 48 beats with Gm7/C7 and A7…G7 at 2 beats; Giant Steps 64 beats, one-chord bars 4 beats; Autumn 32; rhythm changes A 32 |
| W2 | 24.4 "top note" | fixed | "Listen to the third note, the 7th … The top note is the 3rd in both" |
| W3 | ♯1 / ♭3 labels | fixed | `A/C7: C(R) A(13) C♯(♭9) E(3)`, `A♭/C7: … C(R) E♭(♯9)` |
| W4 | Incomplete pentatonic boxes | fixed | 2-2-2-2 in every box, span ≤ 4 (C, A, E, D, F, G, B, E♭) |
| C1 | "One position" texts | partly | course texts fixed except Lesson 51.4; Library tips and abouts not (W1 above) |
| C2 | 21.1 "D string" | fixed | key G: `G@D5 … G@D17` "G natural minor along the D string" |
| C3 | Minor forms 3, 1, 4 | partly | Lesson 23.1 and 23.✓ fixed; #78 title/tips not (C4) |
| C4 | Inversion / string-set texts | fixed | 23.2 step 1 root A: frets 2–5; 33.1 text matches |
| C5 | 36.2 walking text | fixed | "Land a chord tone on beat 1 …", "Aeolian on a minor i" |
| C6 | Side-slip moves the band | fixed | `{implies E♭m7}`, no badge |
| C7 | II/I = II/7 | partly | lesson concept explains; exercise unchanged (C3) |
| C8 | 5th approach | fixed | `fifthApproach` on I–V–vi–IV: B → E, C♯ → F♯m, A → D, E → A |
| C9 | Checkpoints vs "I can" | fixed (decision) | a step for every line; partial variants: Q3 |
| C10 | Session at course end | fixed | 3 due reviews, then "Library · L5/L6", ear slot `iv-ear-quiz`/`ear-progressions` |
| C11 | Terms before taught | fixed | 31.2 "Stage 5 looks at it closely"; m6/m(maj7) in 30.2; 26.1 "(iiø–V–i) … Unit 30" |
| C12 | 8.5 "one position" | fixed | "stays around one position (the index moves a fret …)" |
| C13 | Blues turnaround | fixed | "in a blues the I is a 7th chord, I7 – VI7 – ii7 – V7" |
| I1 | Identical steps | fixed | none of the four pairs left (`dupes()` shows only checkpoint repeats of lesson steps) |
| I2 | Map length, no jumps | fixed | S1–S6, centred on the next lesson (V1, I4 new) |
| I3 | Placement answering | fixed | "All not yet" on Stage 3 answered 3–6 (27); "All yes" on Stage 2 filled Stage 1; hint "12 statements still to answer …" |
| I4 | Very long loops | fixed | longest step now 137 s (8.✓ step 3, 51.3) |
| I5 | Fingering glitches | fixed / new | all listed cases fixed; others in W2, C1, I1–I3 |
| I6 | Groove placement | fixed | reggae bar 4 back to `A1`; 0 of 168 loops end an octave off; no root in two places in grooves (slap legato D2@A5/D0 is the technique) |
| I7 | 3nps triplets text | fixed | "… on the way up" |
| T1 | meter | fixed | "metre" in every title and text; search maps "meter" |
| T2–T8 | Text items | fixed | Simandl, 18.1, stage counts in lessons, overstatements, shells, 8.5 spelling (`A D♯ A D♯` rising, flats falling; ♯1 ♯2 up, ♭7 ♭6 down) |
| V1 | Stage titles wrap | fixed | one line at 780 |
| V2 | Header cut | partly | V2 above |
| V3 | Tip over the G string | fixed | tip at the bottom (V3 above) |

## Checked and fine

- Voice-led and harmonised chords: 0 shape problems (span > 4, three notes on a string, one pitch in two places, a shift inside a chord) in #117, #118, #122, #123, #185, #186, #180 over every option and 12 keys (3,000+ chords), and on 5- and 6-string; #81 family the same except the finger formula (W2c).
- Key box (#101): zone 5 `A@E5 f1 B f3 C f4 | … B@D9 f4 | … E@G9 f4` (little-finger stretch, no shift); zone 1 one shift to position 2.
- Two-octave triads (4-string): one shift up and one down in most keys, with the same shape an octave higher (F major, E♭ minor and D♯°: two each way; augmented: three); two-octave 7ths on 4-string: one shift each way in most keys (dim7, 6th and ♯5 chords: two).
- Walking: every approach resolves by half step, whole step or a 5th (wk-approach 180, wk-mixed 156, wk-enclosures 96, arp-approach 144), across "All 12"; no leap over an octave; at most 3 notes above G3; the jazz blues lines (#129, #131, #163) read like a teacher's: R 8_ 5 A octave drops, ♭13 on D7 → Gm7, 2-3-5 walk-ups, enclosures G♭–E → F.
- Grooves: reggae one-drop closes on `A1`; bossa R–5 at fret 2; tumbao anticipations on beat 4 into the next chord; Motown dotted root–octave–half-step approach; funk16 roots on the open A with ♭7–8 at frets 5–7.
- Slap: thumb on E/A (single D-string thumbs in E♭ minor, as decided), pops on D/G, hammer-ons up and pull-offs down on the same string, 0 of 404 legato run starts thumbed on D/G.
- Licks on the new checkpoint picks (lk-ii-v-i 0, lk-minor-ii-v-i 0, lk-turnarounds 0, lk-blues 0, lk-motif 0, lk-implied 1, lk-bass-solo 0, lk-bebop 2, lk-modern 1/4/5): chord tones on the beats in the bebop line, Locrian ♮2 → melodic minor with A and B over Cm6, implied V7♭9 resolving 3 → R, labels right (13 over m7, ♭9 on G7, blue ♭3 over C7).
- Melodic-minor superimposition sets: Dm7♭5 → F, G7alt → A♭, Cm(maj7) → C; C7♯11 → G, C7alt → D♭, C7♭13 → F, C7sus♭9 → B♭.
- Course texts changed in round 9: Simandl (1-2-4, 3 and 4 together), Andalusian + m6/m(maj7), Phrygian dominant = harmonic minor from its 5th, shells R-7-10 on E-D-G, D/C tensions 9 ♯11 13, "several" diminished/augmented triads in altered, extended arpeggios "well beyond the octave", ledger-line C = G5 = A15 (and D10).
- Checkpoints and stage tests: every "I can" line has a step (55 checkpoints, 6 tests listed with `checks()`).
- Course end (all done, 3 reviews due): 30 min = warm-up, 3 reviews, "Library · L5: 174", "Ear: 41"; 45 min adds "Library · L5: 136", "Library · L6: 179", "Library · L6: 183", "Ear: 105"; Home "✓ Stages 1–6 complete … adds random Library exercises from Levels 5 and 6".
- Navigation: Home → map → lesson → step (depth 3); Back → lesson (2); double-tap Back on the lesson → map once (depth 1) at the remembered Stage 6 scroll; Done › on the last step → lesson page (depth 2); session Next › replaces the entry (depth 1) and double-tap Back from item 2 lands on Home once.
- Tip: light mint (`rgb(234, 250, 244)`), closes on Play (`display: none`), not shown on checkpoint steps.
- Placement cascade and hint; "See my starting point" disabled until all 39 are answered, then enabled.
- British spelling in all changed texts; no "meter" outside ids.
