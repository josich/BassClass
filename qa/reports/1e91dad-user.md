# QA User report · 1e91dad · 2026-10-22

Setup: round 13. Focus: the round-12 fixes (1e91dad): Make Music placement, labels and texts, the technique marks under the tab numbers, upper-structure triads and "In one position" inversions, the course changes (My level, folds, "optional", variant chips, graduates' sessions), Library search, the greyed Backing toast.
- Server and tab: my own `qauser` server (port 8890) in its own tab (tab-6). The `seed` tab and ports 8765/8878 were not touched. At the end: storage cleared, service worker unregistered, viewport reset, tab closed, server stopped.
- Code tested: HEAD 1e91dad. The server serves the working tree, which held another session's uncommitted icon changes (`web/index.html` apple-touch-icon, `web/js/dev/iconprep.js`, Android launcher XML). None of them touches what is tested here.
- Profile: empty at the start (service worker, caches and localStorage cleared), cache-busting `?qa=u13a`. States: a brand-new player; a player placed at Level 1, then at Level 4 through two real visits to "My level"; a graduate (all units known through `progress.js`).
- Sizes: 780x360 (main), 640x300, 915x412, 1024x768. 4-string unless noted. The 30 studies were also built on 5- and 6-string basses, and the upper structures on 4/5/6 strings at highest fret 17/20/21/24.
- Method: real taps for the Library search and cards, ⓘ bubbles, the Options sheet (upper structures, inversions), the ⋯ menu (greyed Backing, Dot labels, Reveal, Tab/staff), Play/Pause, "My level" (All yes, Not yet, See my starting point, Back without saving), the Library and map folds, the Settings string count. Every part of every study dumped with the app's own builder (note, octave, label, string, fret, finger, tag); scans with `qa/tools/user13.js`. Sessions planned with the app's `sessionBlock()`. Song keys checked against Musicnotes listings and published tabs (web search).
- Not testable here: the sound itself, the microphone, the Android app. The pane was hidden, so the screen lagged behind some taps; I checked the scheduled notes, not the timing. Screenshots are under `C:\Users\OscarGaya\.claude\projects\E--CLAUDE-BassClass\c7f026a2-fcf4-440e-b62e-e6df46b13395\tool-results\` (shortened to `…\` below).

Counts: Blocking 0 · Wrong 4 · Confusing 3 · Irritating 2 · Texts 4 · Visual 1, plus 5 questions.

## Expert verdict (short)

The round-12 fixes mostly land. The Make Music labels are now clean: no "3" over a minor chord, no "♯1", no ♯-spelled "♭5", and dominants read 9/11/13 everywhere. Zombie and Feel Good teach the two-strings-up octave, Billie Jean's ostinato and the Californication verse sit in one position, and Smooth Criminal and Dust lost their big jumps. Seven Nation Army has no dotted notes, and Teen Spirit shows F5 B♭5 A♭5 D♭5. Classical Thump alternates T⊓/TV strictly on one string. The Library opens each study on its first part. The course changes (All yes on a second visit, folds that open once, "optional", graduates' songs, no tapping warm-ups) work as described.

What weighs most:
- The new upper-structure spelling rule now produces triads spelled against their own name ("A/G♭7" shown as A D♭ F♭). The A♭/C7 triad is fingered 4-3-4 in every key.
- Some Make Music jumps the commit says it removed are still there, and others appeared with the new hand windows (Hysteria: 7 frets in one 16th).
- On a 5- or 6-string bass the studies move the open E to the B string, fret 5, which contradicts their own tips.

## Blocking     (a user cannot do what the screen is for)

None found.

## Wrong        (incorrect musical or factual information)

### W1. Upper-structure triads spelled against their own name (new with the round-12 spelling rule)
- Where: #173 `tri-upper-structures`, 6 of the 108 key × structure combinations (same on every bass and highest fret).
- What I saw: the rule "a triad note that is a tone of the lower chord keeps the lower chord's spelling" respells notes of a triad whose name was already respelled plainly. The header names one triad and the notes spell another:

  | Key · structure | Header | Notes shown | The named triad is |
  |---|---|---|---|
  | G♭ · E♭/C7 (♭III/7) | G♭7 A/G♭ | A, D♭, F♭ | A C♯ E |
  | G♭ · G♭/C7 (♭V/7) | G♭7 C/G♭ | C, F♭, G | C E G |
  | D♭ · G♭/C7 (♭V/7) | D♭7 G/D♭ | G, C♭, D | G B D |
  | E♭ · G♭/C7 (♭V/7) | E♭7 A/E♭ | E, A, D♭ | A C♯ E |
  | D♭ · A♭/C7 (♭VI/7) | D♭7 A/D♭ | A, D♭, E | A C♯ E |
  | G♭ · A♭/C7 (♭VI/7) | G♭7 D/G♭ | D, G♭, A | D F♯ A |
- Why it matters: A–D♭ is a diminished 4th, not a 3rd, so "A D♭ F♭" is not an A major triad and no teacher would accept it. The exercise is about seeing the triad as its own shape.
- Evidence: G♭ · E♭/C7 with note names in the strip, "G♭ A D♭ F♭ D♭ A G♭": `…\mcp-Claude_Browser-blob-1792673545099-06bgk0.jpg`. Full dump: `usScan()` / the key loop in `qa/tools/user13.js`.
- Suggestion: keep the lower chord's spelling only when the triad's own name is spelled from the bass (not respelled plainly), or spell the whole triad plainly in those keys.

### W2. Upper structures: A♭/C7 is fingered 4-3-4 in every key
- Where: #173, structure "A♭/C7 → C7♯5♯9" (♭VI/7), all 12 keys, 4/5/6 strings, highest fret 17/20/21/24 (the 120 hits of my finger scan, plus ♭V/7 on a 6-string).
- What I saw (key C, Dot labels: fingers): `C2@E8 f1 | A♭2@A11 f4, C3@D10 f3, E♭3@D13 f4`. Finger 4 sits on fret 11 and on fret 13, with finger 3 below finger 4. The triad spans frets 10–13, one hand shape: 1 on D10, 2 on A11, 4 on D13. Every key is the same, e.g. F: `D♭@A4 f4, F@D3 f3, A♭@D6 f4`. At highest fret 17, G♭/C7 in C reads `D♭@D11 f4, G♭@G11 f4, B♭@G15 f4`: finger 4 on frets 11 and 15.
- Why it matters: CLAUDE.md says the upper triad is one hand shape, labelled with no shift inside it. These labels cannot be played as written.
- Evidence: `…\mcp-Claude_Browser-blob-1792673619050-j48qrg.jpg` (dots 1 on E8, 3 on D10, 4 on A11, 4 on D13).

### W3. Make Music: jumps that cannot be played at the goal tempo remain
- Hand moves of 3 or more frets within 0.3 s (default tempo), with the course goal in brackets:
  - **#197 Hysteria, Arpeggios, F bar:** `F1@E1 f1 → A1@E5 f1` (the index slides 4 frets in a 16th) and `C2@E8 f4 → F1@E1 f1` (7 frets in one 16th). That is 0.19 s at 80 BPM and 0.16 s at the course goal of 94. In 1st position with the open A (F E1, A A0, C A3, F D3, E D2, G G0) nothing moves.
  - **#221 Teen Town, Run:** `G2@D5 → F1@E1` at the C7→Fmaj7 bar line, then `F1@E1 → A1@E5`, `A1@E5 → G1@E3 → A1@E5` (index slides). 0.17 s at 88 BPM, goal 96. The commit lists Teen Town as fixed.
  - **#218 Dean Town, Line:** `G1@E3 f1 → C2@E8 f2` at the B♭maj7→C7 bar line (0.18 s at 84, goal 88). The C7 bar fits 2nd position (C A3, E D2, G D5, B♭ G3, B G4, C G5).
  - **#223 Anesthesia, Arpeggios, Em bar:** `B1@E7 f1 ↔ G1@E3 f1` twice per bar, in triplet 8ths (0.26 s at 76, goal 84). The Em bar fits 2nd position (B A2, E D2, G D5, B G4, G E3). The C bar spans two octaves, so some movement is in the music there.
  - **#222 Classical Thump, 16ths, B7 bar:** `B1@A2 → D♯3@G8 (P) → B2@G4 (P)`, 3-fret hand moves each way between 16ths (0.23 s at 66, goal 80).
  - **#220 Tommy the Cat, A7 bar:** `C♯2@A4 f3 → D2@A5 f1 → D♯2@A6 f2 (H)`, unchanged since round 12 (0.18 s at 84, goal 92).
- Why it matters: these are course steps (stage tests and checkpoints) a player must pass at the goal tempo. The cause is the hand-position window (`center` → `region`), which excludes the open strings and frets that the comfortable box needs.

### W4. "Its key": two studies are not in their song's key
- The Source line of every study says it takes the song's "key, feel and technique".
  - **#195 Schism style:** E Phrygian. Tool's "Schism" is played in drop-D tuning. Musicnotes lists its original published key as D minor, and the bass lessons (Yousician, TalkingBass) tune the E string down to D.
  - **#107 Longview style:** A major (A–E–D). "Longview" is built on an E–D vamp, recorded tuned down a half step. The Musicnotes bass tab lists the original key as E major.
- Confidence: medium. These are retail and tab sources, not the record. On a standard 4-string, E for Schism is a sensible adaptation, but then the Source line should not claim the song's key.
- Suggestion: move Longview to E, or say "its feel and technique (in E, for standard tuning)" for the adapted ones.

## Confusing    (misleading, illogical, makes no sense)

### C1. On 5- and 6-string basses the studies move the open E to the B string
- Where: 32 parts on a 5-string (33 on a 6-string), from Level 1 up, put notes the E string has on the low B: mostly the low E (E1) at B string fret 5, usually with finger 3 or 4.
- Worst cases:
  - **#108 The Chain, Pedal:** 24 of 32 notes are `E1@B5`. The study is "a low E pedal" with the tip "palm-mute lightly for a dark, steady tone". Evidence: `…\mcp-Claude_Browser-blob-1792674301865-ogdrie.jpg` (root square on the B string, fret 5).
  - **#20 Zombie, Chorus (Stage 1 test):** `E1@B5 f4, E2@D2 f1`. The tip says "fret the low note with the index finger and the high one with the ring or little finger". This is the opposite, three strings apart.
  - **#64 Feel Good, Riff:** bar 1 is `E1@B5 f4, E2@D2 f1` and bar 3 is `E1@E0, E2@D2`. The same figure is placed two ways in one part, and the tip says "over an open string, at the 2nd fret".
  - Also #18 Seven Nation Army, #65 Blitzkrieg Bop (12 of 64 Bridge notes), #195 Schism 7/8 (11 of 28), #196 Can't Stop, #199 What's Going On (10 of 28).
- On a 4-string all of these use the open E. Many drills use the B string at fret 5 on purpose, but these studies' texts assume the open string.

### C2. Octave shapes that contradict what the app teaches
- **#150 Good Times:** the octave flicks are `E1@E0 → E2@A7` and `A1@A0 → A2@D7` throughout (the Octave break plays the A7 octave 4 times a bar). The app's own rule for disco octaves is "two strings up, two frets up" (Shape lines, round 8), and Feel Good teaches "over an open string, at the 2nd fret".
- **#196 Can't Stop, Chorus, Em7 bar:** `E2@A7 f4` against `B1@A2 f1` and `G1@E3 f2` in alternate 16ths. The hand moves 2 frets back and forth all bar, while the Verse plays the same E2 at D2 f1.
- **#151 Fly Away, Riff, A bar:** `A1@E5 f4 + A2@G2 f1` (three strings up, three frets back). The C, G and D bars use two strings up (`C2@A3/C3@G5` and so on), and the open A + G2 shape is the one Feel Good teaches.
- **#219 YYZ, Intro:** `E1 E1 E2@A7`, while the C and D bars use two strings up.

### C3. Billie Jean: "the same shape" and "the fingers stay" are not true for C♯m7
- Where: #105 `mm-jean` (Level 3, checkpoint 23.✓). The about says "then moves the same shape to Bm and C♯m7", and the tip says "One hand position for each chord: the shape moves, the fingers stay."
- What I saw: F♯m and Bm play the same figure (R ♭3 5 ♭7 5 ♭3 2 ♭3) with the same fingers (1-4-3-1-3-4-3-4). The C♯m7 bar plays another figure, `C♯ E G♯ B A G♯ E C♯` (R ♭3 5 ♭7 ♭6 5 ♭3 R), with other fingers (4-2-1-4-2-1-2-4, A4/D2/G1). The F♯m shape moved to C♯ would be `C♯@A4 f1, E@A7 f4, G♯@D6 f3, B@G4 f1`.

## Irritating   (works, but annoys or slows the user)

- **I1. Five-fret stretches near the nut where a one-position box exists.** The rule allows a 1-3-4 stretch over five frets, but the hand window chooses it at low frets:
  - #63 Californication Chorus, G bar (Level 2): `G1@E3 f1, D2@A5 f3, B1@E7 f4`. The 2nd position, `B1@A2`, has no stretch.
  - #150 Good Times Groove, every Em7 bar (Level 4): `G1@E3 f1, A1@E5 f3, B1@E7 f4, E2@A7 f4`.
  - #149 Smooth Criminal Half-time, F bar: `F1@E1 f1, A1@E5 f4`, frets 1–5 at the nut, with the open A free.
  - #195 Schism 7/8: `F1@E1 f1, G1@E3 f3, A1@E5 f4` at 140, while the 5/8 riff uses the open A.
  - #197 Hysteria G bar (3–7) and #219 YYZ Em bars (3–7).
  - Scan: `stretchScan()` in `qa/tools/user13.js`.
- **I2. Library search: American spelling only for -ize and "meter".** "color" finds 0 cards ("colour": 17), and "practice" finds 0 ("practise": 3). "practice" is also the British noun. CLAUDE.md says the search finds the American spelling. The new searches work: "queen" (2), "metallica", "nirvana", "white stripes", "1991" (Teen Spirit, Tommy the Cat), "1977" (The Chain, Teen Town), "make music" (30 studies plus #172, whose text has both words), "beatles", "red hot".

## Texts        (typos, unclear wording, inconsistent names)

- **T1. Variant chips cut inside the label, hiding the value.** On a new player's Home (30, 45 and 60 min), the two Lesson 1.2 rows read "Lesson 1.2 · Index · Notes per str…" and "Lesson 1.2 · Middle · Notes per str…". In the 45/60-min plans, row 14 reads "Checkpoint · Index · Notes per str…", the same text as row 6. The steps differ only by 8 vs 4 notes per string, which is exactly what is cut. Lesson 38.4 shows "R-5-7-10 7th … · Pick". The round-12 share-of-the-room cut gives 14 characters per option. Suggest short value forms ("8 per string", "7th chord"). Lesson 17.1 still shows bare "1-2" / "3-4" (fingers), which the "Notes per string: 4" fix does not cover because they are not pure numbers.
- **T2. Card summaries repeat themselves** (style + summary): "The riff in 7/4. A B minor riff in 7/4…", "The heavy four-chord groove. Em – C – G – D: a heavy verse groove…", "The busy punk verse. A busy 8th-note verse…", "The relentless 16th arpeggios. Non-stop 16th-note arpeggios…", "The 16th-note engine. A driving 16th-note octave pedal…".
- **T3. Texts that do not match the notes:**
  - #222 Classical Thump: "with a pop after each thumb note". In Motion in 8ths two up-strokes are followed by hammer-ons (`G1 TV → G♯1 H`, `D♯2 TV → E2 H`). The card summary describes only the 16ths part ("Continuous 16ths…"), though the Library now opens on the 8ths part.
  - #106 Come Together: "answers itself an octave lower". Bar 2 is another figure (`A1 r A1 C2 D2(H) F2 D2`).
  - #64 Feel Good: "a short climb at the end of each bar". The C bar ends `B1 A1 B1`.
  - #105 Billie Jean summary: "a dotted chorus line over D and F♯m". The chorus also has C♯m7.
  - #65 Blitzkrieg Bop: "A short scale step leads into each new chord". True in the Verse; in the Bridge 3 of the 7 changes have no lead-in (A→D, D→E…).
- **T4. Upper-structure naming.** The option reads "A♭/C7 → C7♯5♯9" while the dot label of A♭ reads "♭13" (same screen). "C7♭13♯9" (or "C7alt") would agree with the labels.

## Visual

### V1. Song titles cut in the exercise header at 780 px
- At 780x360 the title box is 187 px from the Library and 148 px when a session's "4/7 Next ›" pill is shown. Six of the 30 titles do not fit from the Library and 16 from a session. Examples: "Seven Nation Army st…", "Smells Like Teen Spiri…", "Another One Bites t…", "Anesthesia (Pulling…". Last round this happened only at 640 px; the shorter "Song style" titles still need more room than the header gives.
- Evidence: `…\mcp-Claude_Browser-blob-1792674073611-e99ttg.jpg` (Seven Nation Army), `…\mcp-Claude_Browser-blob-1792673340479-rd6crk.jpg` (Teen Spirit; `b` scrollWidth 209 > 187).

## Questions for the owner

- **Q1. F♭ and C♭ triad names.** The interval rule (round 12) names F♭/A♭7, C♭/E♭7, C♭/A♭7 (♭III), F♭/D♭7 (♭III), C♭/F7 (♭V) and F♭/B♭7 (♭V). The older lead-sheet rule says chords chosen on their own never use C♭ or F♭. A chart would write E/A♭7, B/E♭7… Which rule wins for the upper triad's name?
- **Q2. Same-note shifts at chord changes.** The round-12 rule "a note played again at once keeps its finger" holds inside `Builder.build`. At chord changes the finger still changes on the repeated note: the 12-bar blues (`hm-12-bar-blues`) `D@A5 f4 → f2` (E7→D7), `arp-ii-v-i` 5 times a loop, `arp-rhythm-changes` 3 times, `tri-progressions`, Zombie `G@E3 f1 → f2` at the C→G bar line, Can't Stop `D@A5 f4 → f2` on a ghost note. That is a valid pivot shift. Keep it, or apply the rule there too?
- **Q3. Sweep picking as the graduate's warm-up.** With tapping gone, the "hands" warm-up rotates between `tech-sweep`, `tech-pim`, `tech-permutations-across` and `tech-endurance`. Sweep picking (with a pick by default) is the warm-up in 8 of 24 consecutive sessions. Wanted?
- **Q4. Keys I could not verify** from reliable sources: Teen Town (F), Dean Town (D minor), YYZ (E minor), Anesthesia (E minor). Worth a check against the records, as for W4.
- **Q5. A newly opened Library level is far down.** After placement at Level 4, L4 opens as intended, but with L1 and L2 still open (the player's folds) it starts at y = 3542 px. Scroll to it once, as the map centres the next lesson?

## Checked and fine

- **Make Music labels.** No "3" over a minor chord, no "♯1", no ♯-spelled "♭5", and no 2/4/6 on a dominant: all 9/11/13, ♭9/♯9, ♭13 (scan over every part). The "→" approach labels resolve by half step into the next chord (Pulse G bar → D, Fly Away B→C and C♯→D, Dean Town C♯→Dm7, What's Going On). The blue ♭5 is kept only where spelled ♭5 (Sunshine A♭/D♭/E♭); C♯ over G7 and D♯ over A7 in Tommy are "♯11". Teen Town's chromatic line spells G♭ going down.
- **Make Music placement fixes.** Zombie chorus: `E2@D2`, `C3@G5`, `G2@D5`, `F♯2@D4`, index low and ring high, as the tip says. Feel Good: `@D/@G` octaves two strings up on a 4-string. Billie Jean ostinato: one position (2nd) for F♯m and Bm. Californication verse in 5th position (frets 5–8), so the tip is now true. Smooth Criminal 16th engine with no jump (Am in 2nd position, F in 1st). Dust Breakdown D at A5. Under Pressure octave pedal `D2@A5 / D3@G7`, as the tip says. Sunshine: the same fingers for D7, G7 and A7 (1-1-4-1-1-2-3).
- **Seven Nation Army:** quarter and half notes only, E minor key signature. **Teen Spirit:** badges F5 B♭5 A♭5 D♭5; the verse answers every root with its 5th; the Backing reads "pow" as root-5th-octave (`parseBadge('F5')`). F minor key signature on the staff. **Classical Thump:** T⊓ always followed by TV on the same string (B1@E7 and G1@E3 on the E string in Part 1); "thumb down, thumb up and two pops" on every beat of Part 2. Level 1 studies have no dotted rhythms.
- **Song facts.** Artists and years are right for all 30. Keys match for the 26 I could check (Feel Good Inc. E minor and Fly Away A Mixolydian confirmed). Practice tempos: "at a practice tempo" now in every Source line. Schism's tip says "start around 140" and it opens at 140.
- **Library.** A study opens on its first part (Teen Spirit "Verse (quiet)"). From a session, Schism/YYZ with `part: all` fall back to the first part. Titles read "… style" on cards, headers, lesson rows and session rows.
- **Technique marks** (the user's question: readable on a phone?). Yes, at 780 and 640. T, P, H, PO, T⊓, TV, RH, LH, i, m, a, p and ⊓/V sit in their own row (baseline 12 px under the lowest tab line, labels 11 px below that). They are 8 px bold, #9EA4CC on #1A1D38 (contrast about 6.8:1), with no overlap between adjacent 16ths (Thump "T⊓ TV P P", Tommy "PO PO"). They are small (cap height about 6 px), so an 8.5–9 px size like the labels would read more easily on a phone. The strip grows by 10 px only when an exercise has marks, so the board at 640x300 is 106 px tall in Tommy. Staff mode shows no marks (decision). Evidence: `…\mcp-Claude_Browser-blob-1792673358624-13674l.jpg` (780), `…\mcp-Claude_Browser-blob-1792673387663-oedfql.jpg` (640), `…\mcp-Claude_Browser-blob-1792673416235-z63jsi.jpg` (Thump).
- **Greyed Backing toast:** a real tap on #200 Two-hand tapping gives "No backing in technique drills". All five modules have a name (technique, rhythm, note-finding, interval drills, ear training).
- **Tapping/sweeps:** right-hand i/m/a run from the nut side (i G9, m D10, a A12). The sweep finger mode alternates i/m going up and rakes down with the finger that played the top note. Source line: Gambale and Malmsteen for sweeps, Willis for raking.
- **Upper structures, the rest.** Of 972 combinations (12 keys × 9 structures × 3 basses × 4 highest frets), every triad starts a 5th or more above the bass, and the lower chord's 3rd keeps its spelling (G♯ in E7). Labels are against the lower chord (♭9, ♯9, ♯11, ♭13, 13), as decided.
- **Inversions "In one position":** on a 4-string every root choice lands on the A string, shown as "Fixed for this choice: A string (…)". Keys C, G and B are in one position (frets 2–5, 9–12, 1–4).
- **My level.** Visit 1: All yes on Stage 2 filled Stage 1, and an explicit Not yet in Stage 1 was kept → L1, "Continue Lesson 3.1". Back without saving kept L1. Visit 2: All yes on Stage 3 filled the Stage 1 Not yet → L4, "Continue Lesson 27.1 · Stretching towards the nut".
- **Folds.** With L1+L2 open (libAt 1), reaching L4 opened L4 once (`libOpen [1,2,4]`, `libAt 4`). As a graduate L6 opened once; folded again, it stayed folded after a reload. The map did the same (`mapOpen [1,2,4]`), and a fresh visit centred 27.1 (main scrollTop 2133, row at y 164).
- **"optional"** sits next to the breadcrumb on all six optional lessons (54.3 checked at 780 and 640: `…\mcp-Claude_Browser-blob-1792673787869-suhwxt.jpg`). Chips "Notes per string: 4 / 1" (1.3), "Group of: 3 / 5" (28.1), "Tap, pull-off, hammer / Two-hand arpeggios / Tapped melody over a pedal" (54.3) show in full.
- **Graduates' sessions.** All 40 freshly planned 30-min sessions held one Level 5–6 study ("Library · L5/L6") and no tapping warm-up. Those 40 plans drew 11 different studies, every one opened on "Whole tune" (or the first part where there is none).
- **Sound vs picture.** Seven Nation Army played and paused at 9/13: the C badge, the B dot (A2, "7") and the staff cursor on the same note.
