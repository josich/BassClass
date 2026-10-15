# QA User report · bc5f887 · 2026-10-15

Setup: fourth round, focused on the view of an expert musician (conservatory-trained bassist and jazz/session teacher who knows the RSL, LCM and ABRSM syllabi, Berklee methods, Simandl, Ray Brown, Friedland and Levine).
- Server and tab: my own `qauser` server (`tools/serve.py 8890`) and my own tab (`tab-1`).
  - Environment note: the preview tool reported 8890 "unavailable" and said 8891. In fact my server bound 0.0.0.0:8890, but `[::]:8890` and `[::]:8878` are held by unrelated `python -m http.server … --directory pwa` processes (another project). So `http://localhost:8890` can reach the wrong site over IPv6. I used `http://127.0.0.1:8890`.
- Profile: started empty (no service worker, no caches, localStorage cleared), with cache-busting `?qa=41…48`.
- Sizes: 780x360 (main), 640x300, 915x412 and 1024x768. Settings: 4-string, 20 frets (defaults).
- Personas:
  - Expert teacher: most of the time. I read every curriculum file (about, tips, sources) and built exercises with the app's own modules (`/js/curriculum/index.js`, `/js/theory.js`, `/js/ui/exercise.js`) in all keys. I dumped note names, degree labels, chord badges, strings, frets and finger numbers.
  - Beginner and advanced player: short sanity passes.
- Real clicks: Play (#152; the badges changed with the music at the bar lines, swung 8ths), About, Options, More controls, Dot labels → "Fing", Reveal → "Shape".
- Not testable here: hearing the sound, the microphone, the Android app. Fingering on 5- and 6-string basses was only spot-checked.

Counts: Blocking 0 · Wrong 13 · Confusing 10 · Irritating 4 · Texts 10 · Visual 0, plus 5 questions.

## Expert verdict

**Overall.** An expert would be impressed, and would recommend it with caveats.
- The breadth and theoretical rigour are far beyond typical bass apps:
  - every scale and mode formula I checked is correct;
  - spelling is academically consistent;
  - Roman numerals are right;
  - the licks are idiomatic;
  - the rhythm module is conservatory-grade.
- They would recommend it to intermediate and advanced students as a **fretboard-and-harmony gym alongside lessons**, not as a complete method.
- What stops a full recommendation today is a handful of visible slips that a jazz teacher spots in the first ten minutes:
  - `C♯m7 – G♭7 – Bmaj7` in Giant Steps;
  - pop songs written as `Amaj7 – E7 – F♯m7 – Dmaj7`;
  - a "right mode on every chord" exercise that plays F Ionian over the IV chord;
  - finger numbers that jump inside a "box".

**What they would praise**
- Correct theory everywhere it matters. I checked note by note in all 12 keys:
  - harmonic and melodic minor modes, harmonic major modes, Messiaen 1–7, the Hungarian, double harmonic and augmented scales;
  - upper-structure triads (A/C7 = 13♭9, A♭/C7 = 7♯5♯9, G♭/C7 = 7♭9♯11, B♭/Cm = Cm11);
  - Barry Harris's dim7 → four dominants;
  - guide-tone motion; the 7th-chord ladder (maj7 → 7 → m7 → ø → °7).
- Academic spelling with sensible jazz exceptions: F𝄪 in G♯ harmonic minor, C♭ as IV of G♭, `E(♭9)` over E♭7 in licks.
- The licks: they outline the changes, put targets on the beat, resolve to chord tones, and name tensions the jazz way.
  - Examples: "The Lick"; the enclosure chain with B–D–F on the beats; the bebop dominant from the 3rd; the altered scale run; the minor ii–V–i with Phrygian dominant and melodic minor.
- Rhythm and time: subdivision pyramid, the 15-cell 16th grid, displacement, polyrhythms, gap click and odd meters, all correctly explained.
- Technique facts: raking direction, Simandl position names (half/first/second), harmonics map (12/7/5/4 = 8ve, 8ve+5th, two 8ves, two 8ves+M3), Jaco's "Portrait of Tracy".
- Fixes since last round: the spelling regressions, enclosures, broken chords, Library search and texts are fixed (see "Checked and fine").

**What they would roll their eyes at** (the top changes, in priority order)
1. Chord-scale by chord quality instead of function. IVmaj7 is played as Ionian and vi7 as Dorian, while the source line cites Berklee (W1).
2. Giant Steps with G♭7 instead of F♯7, in the default key B (W2).
3. Pop, rock, disco and reggae progressions labelled with jazz 7th chords, from Level 1 on (W3).
4. Finger numbers that move the hand inside box positions and three-notes-per-string shapes, and a triad-pair line that zig-zags along the E string (W5).
5. Several factual slips in tips:
   - "all 12 notes" in a 4-fret position (W6);
   - bebop Dorian (W7);
   - the altered scale labelled "3" on C♭ (W8);
   - "Bm" as the vii of C (W9);
   - "every diminished note resolves a half step" (W10);
   - the major blues scale over the IV7 (W11);
   - a V7♭9 arpeggio without its 3rd or 7th (W12).
6. 13 of the 173 "exercises" are presets of another exercise, with titles their own options can contradict (C6). Some exam-board claims cannot be verified (T9). A teacher who knows the syllabi will check them.
7. Missing essentials for an exam or conservatory programme (not defects of what exists):
   - reading standard notation;
   - classical melodic minor (raised 6/7 up, natural minor down; ABRSM/LCM/Trinity ask for it);
   - a drone or chord backing (several tips say "play over a drone");
   - ear training beyond intervals (chord qualities, progressions);
   - muting technique, pick playing and tapping (docs/RESEARCH.md lists tapping at Level 5, but no exercise teaches it);
   - more groove styles. There are 8 groove and 3 slap exercises against 28 triad exercises, and slap jumps from L4 to double thumbing at L6.

## Blocking     (a user cannot do what the screen is for)

None found.

## Wrong        (incorrect musical or factual information)

### W1. Chord-scale (#98 ★): the IV chord gets Ionian and the vi chord gets Dorian, contrary to the cited Berklee chord-scale theory
- Where: Modes → #98 "Chord-scale: the right mode on every chord" (`md-chord-scale`), source line "Berklee chord-scale theory; … Mark Levine".
- What I saw (key C):
  - "I – vi – ii – V": `[Am7] {Dorian} A G F♯(6) E D C B A`. In C major the vi chord is Aeolian (F natural). F♯ is not in the key.
  - "ii–V–I–IV–iiø–V–i": `[Fmaj7] {Ionian} F E D C B♭(4) A G F`. In C the IVmaj7 is Lydian (B natural). B♭ is outside the key and is the "avoid" 4th of Fmaj7.
- Cause: `MODE_FOR` in `modes.js:92` maps by quality only (maj7 → Ionian, m7 → Dorian). The about text says the same.
- Why it matters: the title promises "the right mode", and a Berklee-trained teacher assigns modes by function (I Ionian, ii Dorian, iii Phrygian, IV Lydian, V Mixolydian, vi Aeolian, viiø Locrian). This is the exercise such a teacher would open first.
- Suggestion: choose the mode from the chord's degree in the key (as `toMinor` already does for V7 → minor). Or rename it "One scale per chord quality" and say so in the about. See Q1.

### W2. Giant Steps: the dominant of B is spelled G♭7 (`C♯m7 – G♭7 – Bmaj7`) in the default key
- Where: #168 Giant Steps arpeggios and #170 Walking over Coltrane changes (both default to key B). Also the "Coltrane changes (Giant Steps)" option of #111 and #167.
- What I saw, `progChords('giant-steps', B)`: `Bmaj7 D7 Gmaj7 B♭7 E♭maj7 Am7 D7 Gmaj7 B♭7 E♭maj7 G♭7 Bmaj7 Fm7 B♭7 E♭maj7 Am7 D7 Gmaj7 C♯m7 G♭7 Bmaj7 Fm7 B♭7 E♭maj7 C♯m7 G♭7`.
  - The walking line reads `[C♯m7] C♯ F(→) [G♭7] G♭ C(→) [Bmaj7] B`. The key G option has the same `C♯m7 G♭7 Bmaj7`. Key C and key F are correct.
- Why it matters: every chart of the most famous jazz test writes F♯7 (V of B), and "C♯m7 – G♭7" is not a ii–V on paper. The 5fe06c4 report found Giant Steps correct in B, so this is a regression from the "flats on black keys" root rule.
- Suggestion: spell each V7 (and ii) from its target key, as `cycle-251` already does with its local key offset.

### W3. Pop, rock, disco and reggae progressions are written as jazz 7th chords, from Level 1
- What I saw (chord badges):
  - #16 Root-note grooves (L1), Rock 8ths, default key A: `Amaj7 E7 F♯m7 Dmaj7`.
  - #46 Common progressions (L2), "I – ♭VII – IV – I (rock)" in C: `Cmaj7 B♭maj7 Fmaj7 Cmaj7`. The I chord's B natural clashes with the ♭VII chord, the whole point of the progression. Canon: `Cmaj7 G7 Am7 Em7 Fmaj7 Cmaj7 Fmaj7 G7`.
  - #48 Disco octaves: `F♯m7 Dmaj7 Amaj7 E7`.
  - #79 Reggae: `Amaj7 Dmaj7 E7 Amaj7`.
  - #78, #77, #169: the same.
  - Meanwhile #86, #106 and #121 show the same progressions as triads (`E A B E`, `C G Am F`).
- Why it matters: a beginner learns that the I chord of a pop song is "Amaj7". Any working player would say these songs are A, E, F♯m and D (or A5 in rock). The chord symbol is the only harmony the root-note drills show.
- Suggestion: use triads (or power chords) for the pop, rock, folk and reggae progressions. Keep 7ths for the jazz, soul and Motown ones. See Q2.

### W4. "Fm6" badge, but the notes play Fm7
- Where: "I – IV – iv – I (minor plagal)" in #146 (Secondary dominants, borrowed chords) and #76 (Chord tones over progressions), pattern R-3-5-7.
- What I saw: `[Fm6] F(R) A♭(♭3) C(5) E♭(♭7)`. Fm6 is F A♭ C D. The "7" token falls back to ♭7 for 6th chords (`common.js:323`).
- Suggestion: on 6th chords, play the 6 for the "7" slot (and label it 6), or call the chord Fm7.

### W5. Finger numbers and placements a teacher would correct (the "Fing" label shows them)
- **#94 Major scale: the 7 positions.** 6 of the 7 positions in C are fingered with the hand moving inside the box.
  - Position 1 (frets 8–12), going up: `C@E8 f1, D@E10 f3, E@E12 f1, F@A8 f1`. Finger 1 slides 8 → 12 and back to 8.
  - Coming down: `E@E12 f3, D@E10 f1, C@E8 f1`.
  - With Reveal = Shape and Dot labels = Fing, the E string shows 1 · 1 · 3 on frets 8 · 10 · 12, while the A string shows 1 · 2 · 4 on the same frets. Screenshot: `mcp-Claude_Browser-blob-1792093963199-7g20wa.png` (this session's tool results).
  - Measured per position: the same fret gets two different fingers in positions 1–6 (e.g. Pos 2: A12 3/1, A14 1/3, D12 3/1, D14 1/3). Position 7 and all five pentatonic boxes (#95) are clean.
  - The about says each box "covers every note of the key within one hand span".
- **#66 Three notes per string.** Strings with two whole steps are fingered 1-3-1.
  - C major: `C@E8 f1, D@E10 f3, E@E12 f1, F@A8 f1`.
  - C Dorian: `F@A8 f1, G@A10 f3, A@A12 f1, B♭@D8 f1`.
  - The last string ends `f1 f3 f3`.
  - 12 such out-and-back jumps over the 12 keys. The tip itself says "a 5-fret stretch: pivot on the thumb", which means 1-2-4 or 1-3-4.
- **#169 Chordal bass**, default I–vi–IV–V in C, [G7]: strummed as `G@E3 f1 + D@A5 f3 + B@G4 f2`, then arpeggiated as `G@E3 f3, D@A5 f2, B@G4 f1`. That puts finger 3 on fret 3 behind finger 2 on fret 5.
- **#135 Triad pairs (★)**, default F & G over C: `F@E1 → A@E5 → C@E8 → G@E3 → B@E7 → D@A5 …`. The hand jumps 4, 3, 5 and 4 frets in the first six triplets at 66 BPM. Over 12 keys there are 70 jumps of 3 frets or more out and back in 540 notes. The pair starts on the lowest F, and open strings are avoided, so everything lands on the E string.
- Why it matters: README promises "Correct fingering", and a teacher checks fingers first. The box and 3nps exercises exist precisely to teach a fixed hand.

### W6. "Every note in one position" (#59): "All 12 notes inside one 4-fret position" is not true on a 4-string
- Measured: every option has 11 pitch classes. Frets 1–4: no D. Frets 5–8: no F♯. Frets 7–10: no A♭. Frets 9–12: no B♭. Frets 12–15: no C♯.
- Strings tuned in 4ths leave one fret uncovered between each pair (fret 5 = the next open string). On a 5-string the B string fills the gap.
- Suggestion: "All the notes inside one 4-fret position (11 of the 12; the 12th is one fret away)", or use 5-fret positions.

### W7. Bebop scales (#124): the tip "chord tones fall on 1, 2, 3, 4" is false for the "Bebop dorian" option
- Built: `[C bebop Dorian] C B♭ A G F E E♭ D C`. In 8ths the beats get C, A, F, E♭ (R 6 4 ♭3), so only two Cm7 tones are on the beat.
  - It works for bebop dominant (`C B B♭ A G F E D`: C B♭ G E) and bebop major.
- The about never mentions bebop Dorian. With the app's formula (Dorian + ♮3, Baker's "bebop minor") the chord tones on the beats belong to the IV7 (F7), not to Cm7.
- Suggestion: explain the Baker logic, or use the Dorian + ♮7 version, which does put C B♭ G E♭ on the beats.

### W8. The altered scale is labelled "3" on C♭ (or F♭) and "♯5" on a ♭6 in Mode study and Pitch axis
- #97 Mode study, Altered, key G: `G A♭(♭9) B♭(♯9) C♭(3) D♭(♭5) E♭(♯5) F(♭7)`. C♭ is a diminished 4th, and E♭ a minor 6th.
- #129 Pitch axis, key E, melodic minor modes: `A♭` labelled 3 and `C` labelled ♯5 over E.
- The same scale is treated three ways:
  - #130 (modes of melodic minor) labels these notes ♭4 and ♭6;
  - #161 (chord-scale with altered dominants) spells them B and E♭;
  - #97 mixes academic spelling with jazz labels.
- This is the same kind of slip as last round's W5 (A♭ called the 3rd of E).
- Suggestion: in #97 and #129 use the #161 spelling (G A♭ B♭ B D♭ E♭ F = R ♭9 ♯9 3 ♭5 ♭13 ♭7), or keep the academic spelling with ♭4/♭6 labels.

### W9. Diatonic 10ths (#92): the diminished degree is badged as a minor chord
- C major: `[Bm] B(R) D(♭10)`. C natural minor: `[Dm] D(R) F(♭10)`. In those keys these are B° and D°.
- Suggestion: badge B° (or "B–D, minor 10th"), or show Roman numerals.

### W10. Barry Harris 6th-diminished (#127): "every diminished note resolves to a chord tone a half step away"
- In C the diminished notes are B, D, F and A♭. D is a whole step from both C and E. Suggest "a step away".
- See C4 for the "In 3rds" and "Diatonic triads" options on this 8-note scale.

### W11. Blues scales (#38) tip: "Over a 12-bar blues, the same scale works on all three chords"
- True for the minor blues scale. Wrong for the "Major blues" option, which shares the tip: the E of C major blues is the major 7th of F7.
- Suggestion: "The (minor) blues scale works over all three chords. The major blues scale follows each chord."

### W12. ii–V–I arpeggios (#110 ★), Minor: 11 of the 12 V7♭9 arpeggios lack their 3rd or their 7th
- Default (Up one, down the next; Nearest chord tone):
  - `[G7♭9] D(5) B(3) G(R) A♭(♭9)` has no F.
  - `[C7♭9] G(5) B♭(♭7) D♭(♭9) C(R)` has no E.
- Measured: 11/12 (default), 5/12 (Up), 9/12 (Down). "Root position" is fine (0/12).
- Why it matters: the exercise's own tip is "Listen for the guide tones (3rds and 7ths)". A 7♭9 arpeggio without its 3rd or 7th is not the chord. The 4 notes are chosen from a 5-note chord.
- Suggestion: keep 3 and ♭7 and drop the 5th (or the root) when only 4 notes fit.

### W13. Still open from last round's W2: licks keep C♭ or F♭ on the ♭9 of a 7♭9 chord and on approach notes
- #153, "Locrian ♮2 to melodic minor", key E♭m: `[B♭7♭9] C♭(♭9) B♭ A♭ F D F A♭ C♭(♭9)`.
  - In the same key, #150 Minor walking writes `[B♭7♭9] B♭ B(♭9) D F`.
  - CLAUDE.md's own example is "A♭7♭9: A". The ♭9 counts as a chord tone of the 7♭9 symbol, so it is not simplified.
- #156, "Two-feel to walking pickup": key E♭ ends `F(9) F♭(→)` → E♭; key B♭ ends `C(9) C♭(→)` → B♭. The closing approach note is labelled → only after spelling (the loop-around check), so it keeps F♭ and C♭.
- Measured: 6 notes in #153 and 2 in #156 over the 12 keys.

## Confusing    (misleading, illogical, makes no sense)

### C1. New 2-octave option: "Root on" is silently ignored in scale exercises, while the header still names the string
- Measured (first note vs the header):
  - #11 F major pentatonic, "A string · Range: 2 octaves": starts on E string fret 1.
  - #11 G major, "A string": E string fret 3.
  - #11 C major, "D string": A string fret 3 (D is swapped for A in `scaleBuild`).
  - #38 A blues, "A string": E string fret 5.
  - #63, "D string": A string.
  - The Options sheet keeps "A string" selected and enabled.
- The arpeggio exercises already solve this: "Root on: E string (2 octaves start low)", shown as fixed (logged decision). The scale exercises need the same.

### C2. The Level 1 daily warm-up gives a brand-new player advanced variants
- Today's L1 routine (empty profile):
  - "Natural notes on one string · A string · Frets 12–24 (upper octave)", which on 20 frets stops at fret 20;
  - "Your first scales · Major pentatonic · Key: F · A string · Up & down · Range: 2 octaves".
- `buildRoutine` picks a random value for every option half the time. The new 2-octave option and the upper-octave range now reach Level 1.
- Suggestion: in the warm-up, keep range and position options at their defaults for L1–L2 (or randomise only key and pattern).

### C3. "All 12 keys in one position" (#65 ★) leaves the zone for 3–4 keys in every zone
- Default (major, Zone 1, frets 1–5): E♭ major runs `C@G5 D@G7 E♭@G8`. E major reaches G9, D♭ major G6, D major G7.
  - Every scale type and every zone does the same on a 4-string (e.g. Zone 2: F major to G10, A♭ major to G13).
  - The keys whose only root in the zone is on the D string cannot climb an octave inside it.
- The about says "the hand stays still", and the zone is drawn on the board.
- The zone triads (#42), 7th arpeggios (#74) and roots (#32) stay inside.
- Suggestion: as in #91 Key centres, play the key's notes inside the zone (from the lowest note), or allow the root on the G string and descend.

### C4. Interval-named sequences on scales that do not have seven notes, against the owner's own rule
- CLAUDE.md: on scales without one note per letter, "the 'skip one note' sequence is called 'Skip one note', not 'In 3rds'". Only #159 Messiaen does this.
- #125 Symmetric scales still offers "In 3rds" and "In 4ths". On the whole-tone scale "In 4ths" is all tritones (`C F♯ D G♯ E B♭ …`). On half-whole it alternates 3rds and 4ths (`C E D♭ F♯ D♯ G …`).
- #126 World scales offers "In 3rds" for the augmented scale.
- #127 Barry Harris (8 notes):
  - "In 3rds" gives a 2nd and an augmented 2nd (`G–A`, `A♭–B`);
  - "Diatonic triads (1-3-5)" gives `E G A` and `G A C`, which are not triads. In Barry Harris's system the scale harmonises into C6 and B°7 four-note chords.

### C5. Roman numerals: the about text and the badges use different conventions
- #99 about: "Natural minor gives i ii° III iv v VI VII … melodic minor … i ii III+ IV V vi° vii°".
- The badges show `E♭ {♭III}`, `A♭ {♭VI}`, `B♭ {♭VII}`, `E♭+ {♭III+}` (the jazz convention, relative to major). Both are standard, but one screen should not use both.

### C6. 13 of the 173 exercises are presets of another exercise, and their titles can be contradicted by their own options
- Same build and the same option lists, only the defaults differ:
  - #72 = #100 = #101 = #102 = #137 = #164;
  - #63 = #157 = #158;
  - #75 = #109 = #166;
  - #44 = #108;
  - #111 = #167 = #168;
  - #134 = #165.
- Examples:
  - "Open (spread) triads R-5-10" (#102) can be set to "Quartal (1-4-7)";
  - "Sus and quartal stacks" (#137) can be set to plain triads;
  - "Alternating 3rds through all keys" (#158) can be set to "Groups of 4";
  - #111 (L4) already offers the Rhythm changes and Giant Steps of the "mastery" L6 exercises #167 and #168.
- A teacher reads "173 exercises" as inflated. Suggestion: lock or hide the option that defines a preset's title (e.g. no Stack option in #102), or merge presets into "suggested settings".

### C7. Two neighbouring Level 2 exercises give opposite right-hand rules for string crossing
- #17 String crossing & raking: "When you move to a lower-pitched string, 'rake': let the same finger fall onto it".
- #18 1-2-3-4 climbing: tip "Alternate i-m strictly, including on string changes."
- Suggestion: "Alternate strictly, or rake when you move to a lower string (see #17)."

### C8. "Walking with chord tones" (#82, L3) plays chromatic approach notes on two-beat chords
- Jazz blues in F: `[Cm7] C G♭(→) [F7] F A(→)`, `[F7] F E♭(→) [D7] D F♯(→) [Gm7] G D♭(→) [C7] C E(→)`.
- The summary says "Four quarter notes per chord: R-3-5-3, R-3-5-8, R-5-8-5", and approach notes are introduced at L4 (#116).
- Suggestion: use R-5 (or R-3) for two-beat chords in #82.

### C9. Chord-scale names tensions two ways on the same kind of chord
- #98, jazz blues in F:
  - `[C7] {Mixolydian} C D(2) E F(4) G A(6) B♭`;
  - `[D7] {Phrygian dominant} D E♭(♭9) F♯ G(11) A B♭(♭13) C`.
- On a dominant chord a teacher expects 9, 11, 13 throughout (as #161 does), or 2, 4, 6 throughout.

### C10. "R + 3rd" double stops sound in the lowest register (teacher opinion)
- #77, "R + 3rd (adjacent strings)", I–V–vi–IV in C: `F1 + A1` (E1 + open A), `G1 + B1`, `A1 + C2`. The about calls them "sweet".
- Major and minor 3rds below about B♭2 are well under the arranger's low-interval limit and sound muddy. That is why bassists use 10ths (which the exercise also offers).
- Suggestion: place the 3rds an octave higher, or add a tip to prefer 10ths in the low register.

## Irritating   (works, but annoys or slows the user)

### I1. Walking lines sometimes repeat the pitch into beat 1 of the next chord
- #118 ★ Complete walking lines, default (jazz blues in F), bar 3 → 4: `[F7] F F E♭ C(5)@A3 | [Cm7] C@A3`. The same in #151.
- Measured over every progression and key: about 1.5% of chord changes in #82, #117, #118, #149, #151 (e.g. `B(5) → [Bm7] B`), and 14% in #81 Two-feel (`[F7] F C | [Cm7] C G`).
- A walking teacher would say beat 4 should lead into the new root, not repeat it.

### I2. In Level 1 drills, key A with "Root on: A string" starts at the 12th fret
- #13 Your first triads, A minor: `A@A12 C@A15 E@D14 A@G14`. #11 A minor: `A@A12 … A@G14`. Open strings are excluded, so the A string's A is at fret 12.
- A is one of the first keys a beginner picks.
- Suggestion: for L1, allow the open root or move to the E string (fret 5) when the root would be above fret 9.

### I3. Diatonic 10ths (#92) in C start on F, not on the tonic
- `[F] F A [G] G B [Am] A C [Bm] B D [C] C E …`. The run starts on the lowest scale note on the E string (fret 1), so the drill begins on the IV degree.
- Starting on the tonic (fret 8) is the usual way.

### I4. Scales in open position (#12): D major leaves open position
- `A@G2 f1, B@G4 f1, C♯@G6 f3, D@G7 f4`. A one-octave D major from the open D needs frets 6–7 on a 4-string. The exercise promises "the first-position keys".
- Suggestion: say so in the tip, or drop D from the key list.

## Texts        (typos, unclear wording, inconsistent names)

- T1. Parallel modes (#68) and Pitch axis (#129) badges say `D♭ Major` and `C♯ Natural minor (= D♭)`, while the summary and about use Ionian and Aeolian (as the chord-scale badges now do).
- T2. Interval option "R · Octave" (#34, #36). A teacher writes "8 · Octave" (or P8). "R" reads as "Root".
- T3. #167 summary "I-vi-ii-V turnarounds two chords per bar" plays G7 in B♭, which is VI7. The progression list itself writes "I – VI7 – ii – V".
- T4. Option label "Bebop dorian" (lower-case d) against the badge "bebop Dorian". The about does not describe the scale (see W7).
- T5. #104 "Triads on every string set": "These 'spread' shapes". Close-position triads with one note per string are not spread (open) voicings. Suggest "one-note-per-string shapes".
- T6. Approach-note spellings that contradict the app's own "sharps going up, flats coming down":
  - #171 "Chromatic approach to every chord tone" writes `C♯(→) → C` (in D: `D♯ → D`); the usual spelling is D♭ → C.
  - #148 Walking with enclosures, jazz blues in F: `[B♭7] B♭ C D♭(→) A(→) [B°7] B`. The whole step above B is C♯, part of the B°7 scale.
- T7. Settings: Bass volume runs 0–100% (default 100%, the maximum), while Metronome volume runs 0–150% (default 60%). Two scales for the same kind of control.
- T8. docs/RESEARCH.md lists "tapping" in Level 5, but no exercise teaches tapping (search "tapping" finds nothing).
- T9. Sources that an exam-board teacher cannot verify, or that overclaim (credibility, teacher opinion):
  - "LCM marker-dot system" (#9);
  - "Anthony Wellington 'Noteworthy'-style drill" (#31);
  - "an RSL Grade 6 requirement" (#95 about);
  - "part of every conservatory scale exam" (#61);
  - "That is how every academy drills it" (#40 tip).
  - Suggest citing grade, book and page where possible, and softening "every".
- T10. #37 Interval quiz tip: "Turn the bass sound off for the second note". The app can only turn the bass off for the whole exercise (More → Bass sound).

## Visual

None found this round. Checks:
- No horizontal overflow at 640x300, 780x360, 915x412 and 1024x768 (`scrollWidth = clientWidth`).
- The longest mode badge (`C♯ Melodic minor (= D♭)`) is 238 px wide at 640 px.
- The number chips in warm-up rows are inline (18 px wide).
- Settings is now 1,085 px tall at 640x300 (was 1,830).

## Questions for the owner

- Q1. Chord-scale (#98): should the mode follow the chord's function in the key (Berklee: iii Phrygian, IV Lydian, vi Aeolian, as W1), or stay "one scale per chord quality" with the about text saying so?
- Q2. Pop, rock, folk and reggae progressions: triads (A E F♯m D), power chords, or 7ths? Today the same progression is shown as triads in #86, #106 and #121, and as 7ths in #16, #46, #48 and #79.
- Q3. Scope: do you want any of these (an expert's top requests)?
  - reading in bass clef;
  - classical melodic minor;
  - a drone or chord-pad backing for modes and chord-scales;
  - chord-quality ear training;
  - muting and pick technique;
  - more grooves and slap between L4 and L6.
- Q4. Autumn-type minor ii–V–i (#98, "relative minor cycle"): Bm7♭5 gets Locrian ♮2 (C♯) and Am7 gets Dorian (F♯), both outside A natural minor. Many teachers use Locrian and Aeolian there and keep Locrian ♮2 and Dorian for "jazz colour". Which do you want?
- Q5. Scales at 2 octaves (C1): show "Root on" as fixed like the arpeggios, or honour the chosen string where it fits?

Where an expert would disagree with a logged decision (not defects; your choices stand):
- Exercise numbers that move when exercises are inserted. A teacher who writes "practise #73 this week" in a handout finds a different exercise after the next update (last round's #73 is now #74).
- Parallel modes and pitch axis renaming the root (C♯ Dorian "(= D♭)" next to D♭ Lydian). The drill is about one fixed root, and an expert would keep one name for the whole drill.

## Checked and fine

- Last round's findings:
  - W1, jazz plain spelling no longer reaches chord tones:
    - #15 `[E♭ minor scale] E♭ F G♭ A♭ B♭ C♭ D♭`;
    - #43 `[D♭m7] D♭ F♭ A♭ C♭`, `[D♭°7] D♭ F♭ A♭♭ C♭♭`;
    - #74 `[A♭m7] A♭ C♭ E♭ G♭`, `[D♭m7] D♭ F♭ A♭ C♭`.
    - A sweep of every exercise found no chord tone respelled, except where CLAUDE.md allows it (dim7 and altered notes in jazz drills, symmetric and Messiaen scales).
  - W2 partly fixed:
    - #152 in A♭: `[E♭7] E(♭9) D♭ A(♯11) E♭ B(♭13) G♭(♯9)`;
    - #154 in F: `B(♭5)`;
    - still open on 7♭9 chords and on closing approach notes (W13).
  - W3: the enclosure into the ♯iv°7 is now a real enclosure, with no repeated pitch (spelling nit in T6).
  - W4 and W5: Messiaen and Phrygian ♭4 tips are correct.
  - C1: arpeggios show "Root on: E string (2 octaves start low)" as fixed.
  - C2: broken-chord pattern names.
  - C3: badge "C augmented scale".
  - C5: Liszt source.
  - C6: "Skip one note" on Messiaen (not yet on #125, #126 and #127, see C4).
  - I1: #73 closes on a held root (`step.fill = true`).
  - I2: search finds "7#5" (8), "dorian b5" (5), "spanish" (#126, #131), "harmonized" (13), "160".
  - I3: Settings is shorter.
  - I4: `#/ex/999` shows "Exercise 999 is not in this version of BassClass".
  - T1–T3, T6, T7, T9 and T10: no "harmoniz-" left, "Ukrainian Dorian (Dorian ♯4)", topic descriptions updated, number shown once in About, "a classic arpeggio study".
  - V1: number chips are inline.
- Theory checked in all 12 keys and found correct:
  - formulas of the 7 major modes, the 7 melodic-minor, 7 harmonic-minor and 7 harmonic-major modes, double harmonic, Hungarian minor and major, augmented, bebop dominant and bebop major, 6th diminished, diminished HW and WH, whole tone, Messiaen 1–7;
  - harmonised triads and 7ths of major, natural, harmonic and melodic minor, Phrygian, Lydian, altered, Phrygian dominant, Lydian dominant, harmonic major, Ukrainian Dorian, Ionian ♯5 (e.g. `Cm(maj7) Dm7♭5 E♭maj7♯5 Fm7 G7 A♭maj7 B°7`).
- Progressions: jazz blues, rhythm changes A, minor blues (♭VI7–V7), "relative minor cycle", I–III7–vi–II7–V7–I and tritone sub, all correct in B, D♭ and G♭.
- Licks: 33 licks read in C. They outline the changes and resolve; the labels are right (♭9 ♯9 ♯11 ♭13, ♭5 on D♭ over G7).
- Walking: root on 1, chromatic and dominant approaches on 4, enclosures above and below, Phrygian dominant tensions on a V resolving to minor, Locrian ♭2 on m7♭5 in the scalar line.
- Explanations checked: shell-voicing fret rules, guide-tone rule, tritone sub sharing B and F, Barry Harris dim7 → B♭7/D♭7/E7/G7, C♯°7 = A7♭9, upper structures, harmonics map, Simandl positions, raking direction, tuner reference frequencies (E1 41.2, A1 55.0, D2 73.4, G2 98.0 Hz).
- Fingering that is good:
  - #11 major (2-4 / 1-2-4 / 1-3-4) and minor (1-3-4 / 1-3-4 / 1-3), matching the tips;
  - #13/#40 triad shapes, #69 three triad fingerings, #44 maj7 shape (matching its tip);
  - the five pentatonic boxes (#95);
  - zone triads, 7ths and roots (#42, #74, #32) stay in the zone.
- Sound vs picture (real Play click, #152 default): the counter advanced 1 → 24 with swung 8ths, and the badge changed Dm7 → G7 at note 9 and → Cmaj7 at note 17, on the bar lines.
- British spelling consistent (practise/practice, colour, favourites).
