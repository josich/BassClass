# QA User report · 4c593d9 · 2026-10-22

Setup: twelfth round. Focus: what changed since bdc08e7: the new topic Make Music (979b791, 30 studies), sweep picking and two-hand tapping with lessons 38.4 and 54.3 (4c593d9), the staff spacing and accidentals (a9db509, 797e117), the player menu icons and greyed options (148c9e1), "My level" starting at "Not yet" (8621c29), the folding Library levels and course-map stages (ea4ed04, 5cba6f5), and the round-11 fixes (bbb984b).
- Server and tab: my own `qauser` server (port 8890) in its own tab (tab-2). The seed tab and ports 8765/8878 were not touched. At the end: storage cleared, viewport reset, tab closed, server stopped.
- Commit drift: the server serves the working tree, and commit 92ce1df ("Pick strokes marked ⊓ (down) and V (up) instead of arrows") landed during the run. Everything below was checked on 4c593d9 first; the sweep screenshots and the pick marks are from 92ce1df. Nothing else in the app changed in that commit. Note: that commit also picked up my in-progress `qa/tools/user12.js` (the main session's `git add -A`); I only wrote inside `qa/`.
- Profile: empty at the start (service worker unregistered, caches and localStorage cleared), cache-busting `?qa=u12a`. States used: brand-new player; a player placed at Stage 4 with real taps in "My level"; a graduate (all units known, set through `progress.js` and restored afterwards).
- Sizes: 780x360 (main), 640x300, 915x412, 1024x768. 4-string unless noted; the 30 studies and both new exercises were also built on 5- and 6-string basses.
- Method: real taps for Path, topic cards, ⓘ bubbles, Options, the ⋯ menu (Dot labels, Tab/staff, greyed Backing), Play/Pause, the checkpoint step, "My level" (All yes, a single Not yet, See my starting point), Library and map jump buttons. Every part of every study dumped with the app's own builder (note, octave, degree label, string, fret, finger, tag). Fingering, isolated-note, jump and label scans with `qa/tools/user12.js`. Sessions planned with the app's `sessionBlock()`.
- Not testable here: the sound itself, the microphone, the Android app. The pane was hidden, so playback ran with clamped timers; I checked the scheduled notes, not the timing. Screenshots are under `C:\Users\OscarGaya\.claude\projects\E--CLAUDE-BassClass\c7f026a2-fcf4-440e-b62e-e6df46b13395\tool-results\` (shortened to `…\` below).

Counts: Blocking 0 · Wrong 4 · Confusing 5 · Irritating 4 · Texts 5 · Visual 1, plus 7 questions.

## Expert verdict (short)

Make Music is a real step up: 30 short, idiomatic lines, each one with a clear purpose (pedal, ostinato, holes, odd metre, slap, a four-part solo). They sit in the course where a teacher would put them. The chord symbols match the progressions the texts name, the metres and key signatures are right, every year and artist is correct, and most parts lie in one hand position. The sweep and tapping exercises are well built: the stroke and rake logic is right, there is one shape per chord, and the tapping hand spans are sensible.

What weighs most:
- Some studies show fingerings that contradict their own tip or what the course has just taught. The worst is the Level 1 "Zombie" chorus in the Stage 1 test: the octave of open E is placed at the 12th fret. Two studies have leaps that cannot be played at their tempo.
- Five studies show degree labels that are wrong for the chord under them ("3" over F♯m7, "♯1" over C7, ♯ notes labelled "♭5").
- The new greyed Backing explains itself with "No chords in this exercise" on screens that show chord badges.

## Blocking     (a user cannot do what the screen is for)

None found.

## Wrong        (incorrect musical or factual information)

### W1. Make Music fingerings that contradict the study's own tip or the course
- **#20 `mm-zombie` (Level 1, Stage 1 test, step 6), Chorus.** The octave of the open E is placed on the same string at fret 12: `E1@E0 E1@E0 E2@E12f1 E1@E0 …` (tab "0 0 12 0 0 0 12 0"). The C, G and D/F♯ bars use the two-strings-up shape (`C2@A3 C3@G5`, `G1@E3 G2@D5`). The study's tip says "fret the low note with the index finger and the high one with the ring or little finger; mute the string in between". Lesson 3.4 teaches "Two strings up, two frets up". E2 at D2 fits both, and it fits the rest of the song (frets 2–5). Evidence: `…\mcp-Claude_Browser-blob-1792668641628-h7gcqg.jpg`.
- **#63 `mm-calif` (Level 2, Stage 2 test), Verse.** The tip says "Verse: one hand position around the 5th fret covers both chords." On a 4-string bass the F1 of the F bars exists only at E string fret 1, so this cannot work. The app plays the verse at frets 0–3: `A1@A0, C2@A3, E2@D2, A2@G2, G2@G0 | F1@E1f1, A1@A0, C2@A3, F2@D3`. The tip does work on a 5-string (frets 5–8).
- **#105 `mm-jean` (Level 3, checkpoint 23.✓), Ostinato.** The tip says "One hand position for each chord: the shape moves, the fingers stay." In each F♯m bar the labels move the hand twice: `F♯1@E2 f1, A1@E5 f2, C♯2@A4 f1, E2@A7 f4 … G♯1@E4 f1 … F♯1@E2 f1` (index on fret 2, then the middle finger on fret 5). One position exists, 2nd position with E2 on D string fret 2: F♯ E2 (1), A E5 (4), C♯ A4 (3), E D2 (1), G♯ E4 (3).
- **#64 `mm-feelgood` tip** ("index on the root, little finger two strings up, two frets higher"). The board shows that shape only for G and C. The E and A octaves are the open string plus the 7th fret of the next string (`E1@E0 → E2@A7`, `A1@A0 → A2@D7`). In the chorus Am bar the octave is `A2@D7 f1`.
- Why it matters: the tip and the board disagree, so a student cannot follow both. In the Zombie case it happens in the Stage 1 test, one lesson after the octave shape was taught.

### W2. Placements that cannot be played at tempo
- **#149 `mm-criminal` (Level 4, Stage 4 test), "16th engine".** The Am bar sits at frets 9–12 around the open A (`A2@A12, G2@A10, E2@E12, C3@D10, B2@D9`). The F bar sits at fret 1 (`F1@E1`), so the last 16th of the Am bar moves 11 frets in one 16th (`E2@E12 → F1@E1`, 0.15 s at 100 BPM; the goal is 112). The Am bar fits in 2nd position (A2@G2, G2@G0, E2@D2, C3@G5, B2@G4).
- **#60 `mm-dust` (Level 2, checkpoint 9.✓), Breakdown.** One D is played at E string fret 10 between open Es (`E1@E0 … D2@E10 f4 … E1@E0, G1@E3, A1@E5`). The riff plays the same D at A5.
- **#220 `mm-tommy` (Level 6, Stage 6 test).** The chromatic climb at the end of the A7 bar is fingered `C♯2@A4 f3 → D2@A5 f1 → D♯2@A6 f2 (H)`: a 3-fret shift between two 16ths, and a hammer with finger 2 above finger 1. In the G7 bar, `B1@A2 f1 → C2@A3 f1 → C♯2@A4 f2 (H)` slides the index.
- **#221 `mm-teentown`, Run, end of the C7 bar.** `B♭2@D8 f4 → G2@D5 f4 → F1@E1`: the little finger slides 3 frets, then the hand jumps 4 more, on consecutive 16ths.
- Scan of all 30 studies (4-string, every part): notes at fret 7 or higher with an open string or a 6+ fret jump on both sides appear only in the cases above, the octave hops of Feel Good, Good Times and Can't Stop (`E1@E0 / E2@A7`), Stand by Me (`B1@E7`) and the Anesthesia finale (`B1@E7` between open A and E). The only jump of 7+ frets between fretted notes is the Smooth Criminal one.

### W3. Degree labels that are wrong for the chord (and one spelling)
- **#148 `mm-money`, Middle:** `[F♯m7] … A♯1(3)@E6`. A major-3rd label on a minor-7th chord. The note is the chromatic step back into B, which the text describes ("a chromatic step back into B"). It is the last note of the part, and the approach rule only looks inside the part, so it never sees the B.
- **#151 `mm-flyaway`:** Riff `[G] … A1, C♯2(♭5)` (C♯ leading to D, the 3rd of the key A) and Chorus `[C] … B1, C♯2(♯1)` (C♯ leading to D). "♭5" contradicts its own spelling. "♯1" is not a degree a teacher would write; both are approach notes (→).
- **#218 `mm-deantown`, Line:** `[C7] … B♭1, C♯2(♯1)` leading into Dm7. The dominant ♭9 rule treats C♯ over C7 as a named alteration, so it skips "→" and then labels it "♯1", which is neither ♭9 nor →.
- **#220 `mm-tommy`:** `[G7] … C♯2(♭5)` and `[A7] … D♯2(♭5)` (the leading tone into the loop's E). In E blues the "blue ♭5" rule is applied to each chord's tritone whatever its spelling. Licks name these by spelling (C♯ over G7 = ♯11). The ♭5 labels in #61 Sunshine (A♭, D♭, E♭) are right.
- **#221 `mm-teentown`, Chromatic line:** the descending run `G F♯ F E E♭ D` spells F♯ going down (with F♮ next to it). The app's rule is sharps going up and flats going down: G G♭ F E E♭ D.
- Scan: every label of every part, flagged when it reads "3" over a minor chord, "♯1", or "♭5" spelled with a sharp. These seven notes are all of them.

### W4. "Classical Thump" style (#222): an up-stroke on a string the thumb cannot reach
- Part "Motion in 8ths", bar 1: `E1@E0 T↓, E2@D2 P, B1@A2 T↑`. After a down-stroke on the E string the thumb rests on the A string (the study's own tip: "T↓ thumb down (rest on the next string)"). The up-stroke comes back through the E string, so it cannot pluck the A string from below. In Part 2 the same B is placed at E7, which works. Every other T↓→T↑ pair in Part 1 stays on one string (A0→A7, A2→A6, E0→E3).
- Also, the text describes neither part: "the thumb alone plays 8ths and the pops fill the 16ths in between". In Part 1 the thumb plays every other 8th. In Part 2 it plays 10 of 16 sixteenths (positions 1, 2, 4, 5, 6, 9, 10, 12, 13, 16 of bar 1).

## Confusing    (misleading, illogical, makes no sense)

### C1. The greyed Backing says "No chords in this exercise" while the screen shows chords
- Where: ⋯ → Backing on #200 `tech-tapping` (board badges "Am", "F", "C", "G"). The same happens on #154 `tech-sweep` (Am F C G), #153 `tech-pim` (C Am F G), #118 `iv-tenths` (C Dm Em F B°), #116 `fb-key-box` ("C major"), #38 `fb-cycle-zone`, #29 `tech-octaves` and others.
- What I saw: a real tap on the greyed Backing gives the toast "No chords in this exercise: no backing". The reason is the module (technique, fretboard, intervals are off by decision), not missing chords.
- Suggestion: "No backing in technique exercises", or similar per module.

### C2. A Level 1 study built on a Stage 2 rhythm
- #18 `mm-stomp` (Level 1; course checkpoint 5.✓ step 3, goal 116) has a dotted quarter + 8th in every bar of the riff (`E1:dq E1:e G1:q A1:q`). Its tip is "Let each dotted note ring". Dotted rhythms are taught in Lesson 9.3 "Dotted rhythms" (Stage 2, `rh-dotted` Level 2). The other Level 1 studies use only half, quarter and 8th notes.

### C3. Stage 2 test: Blitzkrieg Bop at 168 BPM in down-strokes only
- `s2-test` step 9: #65 `mm-blitz` from 120 to goal 168, 8ths with every note a down-stroke "with a pick (or the same finger every time)". That is 5.6 notes per second, all with one finger, for a 29-second loop. The fastest other Stage 2 test steps reach about 4 (shuffle at 120, 7th arpeggios at 104). The default tempo is 140.

### C4. Dominant chords labelled in two languages in the same study
- #198 `mm-duke` `[F♯7] … D♯3(6) … G2(♭9)`. #199 `mm-whatsgoingon` `[B7] … G♯2(6)` (melodic line) and `[B7] … G1(♭13), F1(♭5)` (ghost part). #221 `mm-teentown` `[C7] … A1(6)` with `D♭2(♭9)`. #150 `mm-goodtimes` `[A7] … B1(2), D2(4), F♯2(6)`.
- A ♭9 or ♭13 label next to a plain 2 or 6 on the same dominant reads inconsistently: licks use 9/11/13 throughout.

### C5. The Whole tune is the default, against the study's own advice
- Every study with a form opens on "Whole tune" (e.g. Anesthesia: four parts, a 60-second loop at the goal tempo). The texts say "Play the parts on their own, then the whole piece" and "Learn each part on its own". A first-time player starts with the hardest version.

## Irritating   (works, but annoys or slows the user)

- **I1. Library search cannot find songs by artist, and topic names fail.** "queen", "metallica", "nirvana", "white stripes", "1991": 0 results. The artist and year appear only in the "Based on" line, which is not searched. "Make Music" (the topic name in the Path) finds 2 unrelated cards (#172 "Sus and quartal stacks…", #199). "ear training" finds 0. The Library ⓘ says "🔎 Search by name, topic or number". The search text holds the module id (`music`, `ear`), not the topic name.
- **I2. Graduates warm up with two-hand tapping.** With every unit known (level 6), the first warm-up was "Two-hand tapping" in 24 of 40 freshly planned 30′ sessions. Over 12 consecutive sessions (with ✓ Practised): tapping 4 times, sweep picking 3. Two-hand tapping is an optional lesson "for players who want it", and as the only Level 6 technique exercise it dominates the "hands" warm-up.
- **I3. Finger numbers change on a repeated note.** #196 Can't Stop, D bar: `D2@A5 f4`, then `D2@A5 f2` on the next 16th. #222 Classical Thump, B7 bar: `B1@E7 f4 → f2`. #223 Anesthesia finale, Am bar: `C2@E8 f2`, later `f4`. #220 Tommy, G7 bar: `G1@E3 f2 → f1 → f2`. The hand moves on a held note with no reason the line needs.
- **I4. Sweep shapes leap between chords.** #154 R-3-5-8 on i–♭VI–♭III–♭VII in A: roots at frets 5 → 13 → 8 → 3, and the G chord uses the open D and G (which ring, while the tip says "Lift each fretting finger as soon as its note has sounded"). Lesson 38.4 step 3 (R-5-8-10, I–V–vi–IV) goes `F♯m@2 → D@10`. The shape always starts on the E string, so some keys must jump. The jumps fall at chord changes (4 beats), so this is about comfort, not playability.

## Texts        (typos, unclear wording, inconsistent names)

- **T1. Variant chips that do not say what they mean.** Home session for a new player: "Open strings · Lesson 1.1 · 2", "Lesson 1.3 · 4", "Lesson 1.3 · 1". Lesson 1.3 rows: "Open strings 4" and "Open strings 1" (the plucks per string). Lesson 28.1: "3" and "5". The 24-character cut gives "R-5-7-10 7th chord · Pi…" (Lesson 38.4 step 2: the right hand "Pick" is cut, and the ii–V–I that also tells it apart is not shown) and "Tapped melody over a pe…" (54.3).
- **T2. Stage 1 description:** "Hold the bass, keep steady time, the notes on the low strings, your first scales, chords and bass lines." After "keep steady time" the list has no verb, so it reads "keep … the notes on the low strings" (shown on the Stage 1 test page and the map ⓘ).
- **T3. Study texts that promise what the notes do not do:**
  - #21 Spirit: "answers with the 5th". The D♭ bar answers with C, the 7th.
  - #62 Stand by Me: "(root, 3rd, 5th, 6th)". Over F♯m it is D, labelled ♭6.
  - #199 What's Going On: "climbs the chord and leads chromatically into the next one". Only bar 3 does (A–A♯–B). Bars 1–2 approach their own chord tones (D→D♯, C→C♯), and bar 4 ends F♯→E.
  - #219 YYZ: summary "fast 16th-note pentatonic runs" and course do-text "fast 16th pentatonic runs". The C and D bars arpeggiate Cmaj7 and D7 (B, F♯, C).
  - #64 Feel Good chorus: "bounces between the root and its octave". The D bar has no octave.
  - #61 Sunshine: "like a real riff transposer" (unclear).
  - #195 Schism tip: "start around 140", but it opens at 160 from the Library.
  - #222 Classical Thump: see W4.
- **T4. "Its key, tempo, feel and technique".** The Based-on line of all 30 studies, and the README, say each study takes its song's tempo. The defaults are practice tempos 10–25% below the records: Seven Nation Army about 124 → 100, Blitzkrieg Bop about 177 → 140, Billie Jean about 117 → 104, Another One Bites the Dust about 110 → 96, Smells Like Teen Spirit about 117 → 100. Suggest "its key, feel and technique, at a practice tempo".
- **T5. Lesson 54.3 does not say it is optional on its page.** The map row shows "optional". The lesson page shows only the idea and steps, and the word appears inside the folded "📖 Read more". Lesson 54.2 is the same.

## Visual

### V1. Song titles cut inside the song name on small phones
- 640x300, exercise header: the title box is 154 px wide. "“Classical Thum…", "“Feel Good Inc.” …"; longer names lose more ("“Smells Like Te…", "“Anesthesia (Pul…"). The curly quote and " style: …" take room, and the song name is the only part that tells the studies apart. At 780 and in lesson mode the full title fits. Evidence: `…\mcp-Claude_Browser-blob-1792668747109-uiypk3.jpg`, `…\mcp-Claude_Browser-blob-1792668319667-ov9821.jpg`.

## Questions for the owner

- **Q1. #21 Smells Like Teen Spirit style: power chords?** The chords F, B♭, A♭, D♭ are major triads, so the Backing plays A♮ and D♮ (`[53,57,60]`, `[46,50,53]`) while the staff has the F-minor key signature (4 flats). The style uses power chords. Write F5 B♭5 A♭5 D♭5 (or Fm/B♭m)?
- **Q2. Double thumbing: two up-strokes in a row.** #222 Part 2 has `T↓ T↑ P T↑` eight times per loop (`E1@E0 T↑ → E2 P → B1@E7 T↑`). The thumb ends above the string after an up-stroke, so the next up-stroke needs an unwritten down-stroke. #217 Double thumbing has the same figure as a ghost (`x T↑`). Intended (a "missed" down-stroke), or should the 4th 16th be T↓?
- **Q3. Sweep source line.** "Sweep picking … adapted to the bass (Billy Sheehan, Jeff Berlin)". Both are known as fingerstyle players (Sheehan also for tapping), and as far as I know neither is associated with sweep picking with a pick. Please verify, or name guitar sources for the sweep and keep Gary Willis for raking.
- **Q4. Tapping: right-hand finger order.** #200 two-hand arpeggios label the right hand i A12, m D10, a G9: the index on the highest fret. In piano-style tapping the index usually takes the fret nearest the nut (i G9, m D10, a A12). Is the hand pictured pointing towards the headstock?
- **Q5. Songs after the course.** Graduates' sessions drew 0 Make Music studies in 525 Library fill-ins (Levels 5–6). The stage tests carry songs, but no "I can" line mentions them. Should the course-end session also bring songs, as the musical payoff?
- **Q6. Technique marks in the tab strip.** T, P, H, PO, ⊓/V, RH and LH show only on the dot of the board, not under the tab numbers as in slap and tapping tab books. Show them in the strip as well?
- **Q7. Thumb arrows.** Commit 92ce1df replaced the pick arrows with ⊓/V because a down-stroke climbs the screen on the app's neck. T↓/T↑ in double thumbing (#217 `sl-double-thumb`, #222) have the same reversal. Keep them?

## Checked and fine

- **Make Music, structure.** Every part fills its chords. Metres and beaming: 5/8 as 3+2, 7/8 as 2+2+3 (`groups`), 7/4. "Whole tune" exists only where the parts share a metre (not Schism or YYZ). The click counts 8ths in Schism.
- **Key signatures.** F minor 4♭, B major 5♯ (with ♮ on G and a courtesy ♯ on G♯ in the same bar), E Phrygian none, E Dorian 2♯, B minor 2♯, D minor 1♭.
- **Chords, keys and texts.** The chord symbols match the stated progressions: I–V–vi–IV in D, I–vi–IV–V in A, Em7–A7 as Dorian i–IV, Gm7–C7–Fmaj7–A7 with ♭9s, Em–Am–D–G–C–F♯m7♭5–B7 (circle of 5ths in E minor), ♭III and ♭VII in A, harmonic-minor G♯ and D♯ as stated. All 30 artists and years are right.
- **Spelling and labels.** Blue ♭5 spelled with flats in Sunshine. The "→" approach labels in What's Going On, Dean Town and the Teen Town chromatic line resolve by half step. "Five sharps" in B major, the Phrygian ♭2 (F) in Schism.
- **Placement.** Most parts sit in one or two positions: Stomp, Pulse, Lift, Spirit, Money, Come Together (hammer F→F♯ on the D string as the text says), Longview, The Chain, YYZ, Hysteria, Sir Duke horn line in 6th position.
- **5- and 6-string.** All 30 build. The Californication verse fits frets 5–8 there.
- **Course.** Make Music steps appear as "🎵 Make music" rows in checkpoints 4.✓, 5.✓, 9.✓, 14.✓, 18.✓, 23.✓, 28.✓, 29.✓, 38.✓, 40.✓, 50.✓ and 53.✓ and in all six stage tests (the Stage 1 test has 7 steps for 4 "I can" lines). A step opens on its from-tempo with Backing: Chords, and the tip reads "CHECKPOINT 5.✓ · STEP 3 OF 3 / Make music: …".
- **Sweep #154.** Strokes ⊓ on every move to a higher string and V on every move to a lower one. The sweep turns at both ends (the root is the last up-stroke of each cycle). The fingers option alternates i/m going up and rakes with one finger coming down (correct direction for rest strokes). One shape per chord, spans of 3–4 frets. The five-string shape is offered only on 5/6-string. On the staff the sextuplet "6" shows on the first group of each bar. The exercise builds with every key, shape and progression on 4/5/6 strings and every "Highest fret used" (17/20/21/24).
- **Tapping #200.** Triplet cells RH (5th) → PO (root, index) → H (3rd, little finger), with spans of 4 frets (minor) or 5 (major). In the two-hand arpeggios the right hand spans 3–4 frets and stays at least 2 frets above the left. The ⓘ sources (Sheehan, Hamm, Wooten, Manring) fit tapping.
- **Player menu.** The icons follow the state (dots, a hand for Fingers, a tab or note icon). Toasts read "Dot labels: fingers", "Staff". The greyed Reveal (quiz) and Tab/staff (reading) explain themselves. With Fingers as dot labels the strip shows note names.
- **My level.** Every line starts at "Not yet". "All yes" on Stage 3 filled Stages 1–2, but kept a "Not yet" I had tapped explicitly in Stage 1. "See my starting point" returned to Home with "My level L4" and "Continue Lesson 27.1". Stage 5's line mentions sweep arpeggios.
- **Folds.** The Library opens only the player's level. The L1–L6 jump opens a folded level and scrolls to it, and the choice is remembered (`libOpen [4,6]`). The map folds by stage, the S-jump opens a stage, and the sticky bar (bottom 52) does not cover the stage header (top 60). The map title reads "Course map", with "0 of 177 lessons done · 88 known".
- **Staff on phones.** At 780x360 and 640x300 these read cleanly: Teen Town chromatic 16ths with accidentals, Sir Duke in B major, Dean Town 16ths with rests, What's Going On ghost triplets (× heads, one "3"), Money 7/4, Schism 5/8.
- **Sessions at Level 4.** No pre-ticked rows. Variant chips "Fret 5 / Fret 1", "Fret by fret / String by string", "I – IV – V – I".
- **Search.** "zombie", "sweep", "tapping", "jaco" and "slap" find what they should.
