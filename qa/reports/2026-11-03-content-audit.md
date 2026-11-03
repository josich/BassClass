# Content coverage audit · 15d2cbc · 2026-11-03

**The question (user, 2026-11-03):** "identify in terms of musical theory and content what's missing from a learning
(all levels) point of view… not technical perspective but content."

**No URGENT finding.** Every theory statement I checked against a known answer is right (list in §8). The text errors
I found are small: one wrong claim, one stale cross-reference and two loose generalisations.

**Updates while this audit ran:**
- Commit 8db5acb (13:23) fixed the wrong claim (C1): the Stage 1 test now plays B♭, `CHANGED_STEPS` rev 11.
- The parallel learners' report (`qa/reports/2026-11-03-content-learners.md`) found C1–C4 independently, as its W1,
  W2, W5 and W6.
- This report is the data and syllabus view. Its gaps are numbered G1–G23; where both reports name the same gap, merge
  them.

**Scope and method**
- Read: `CLAUDE.md`, the four 2026-10-29 reviews (pedagogue, teachers, musician, students), `docs/CATALOGUE.md`, all
  six stage files, `course/placement.js`, `curriculum/ear.js`, and the `about` and tips text of every Library
  exercise (248), pulled from the running app.
- Measured in my own `qa` server (port 8878), in my own tab, by loading `course/data.js` and `curriculum/index.js`:
  - steps and lessons per topic and stage;
  - the keys the course steps play in;
  - which exercises the course never uses;
  - every `PROGS` progression.
- Self-test at 15d2cbc: `problems: 0`.
- Tab closed and server stopped afterwards. Nothing in the app was changed.
- **Not repeated:** what the 2026-10-29 reviews already argue (chart reading and "your line", recording, cue fading,
  the groove path, posture drawings, the practice-room jam tasks). Where they are still open I say so in one line. §9
  lists what has been done since.
- **Sources:** the syllabus in §2 is assembled from generic descriptions only:
  - the rock/pop graded boards (RSL, LCM, Trinity), described without grade numbers;
  - classical graded and theory exams;
  - conservatory and jazz-school bass curricula in general terms;
  - books named by author and title, as the app's own Related lines do.
- **Sizes:** S = a day or two, M = about a week, L = several weeks.
- **Priorities:** Must / Should / Nice.

---

## 1. Inventory (from the data)

### 1.1 Library: exercises per topic and level (248)

| Topic | L1 | L2 | L3 | L4 | L5 | L6 | Total |
|---|---|---|---|---|---|---|---|
| Make Music (song-style studies) | 4 | 6 | 5 | 4 | 5 | 6 | 30 |
| Technique | 2 | 10 | 8 | 3 | 5 | 1 | 29 |
| Triads | 2 | 3 | 4 | 8 | 7 | 4 | 28 |
| Scales | 2 | 2 | 8 | 6 | 6 | 3 | 27 |
| Arpeggios & 7ths | 0 | 2 | 3 | 6 | 7 | 3 | 21 |
| Grooves | 1 | 5 | 7 | 5 | 1 | 0 | 19 |
| Rhythm | 3 | 4 | 2 | 4 | 1 | 0 | 14 |
| Fretboard | 5 | 5 | 2 | 1 | 0 | 0 | 13 |
| Modes | 0 | 0 | 2 | 2 | 5 | 2 | 11 |
| Chords & Harmony | 1 | 3 | 3 | 2 | 1 | 1 | 11 |
| Walking | 0 | 0 | 2 | 3 | 4 | 1 | 10 |
| Licks (1 rock/blues, 9 jazz) | 0 | 0 | 1 | 0 | 7 | 2 | 10 |
| Intervals | 0 | 4 | 1 | 2 | 1 | 0 | 8 |
| Reading | 2 | 2 | 1 | 1 | 0 | 0 | 6 |
| Ear training | 1 | 2 | 2 | 1 | 0 | 0 | 6 |
| Slap | 0 | 0 | 1 | 2 | 1 | 1 | 5 |
| **Total** | 23 | 48 | 52 | 50 | 51 | 24 | 248 |

### 1.2 Course: steps per topic and stage

The course has 268 pages (202 lessons, 60 checkpoints, 6 tests) holding 699 steps. Steps are counted by their
exercise's topic.

| Topic | S1 | S2 | S3 | S4 | S5 | S6 | Total | Share |
|---|---|---|---|---|---|---|---|---|
| Scales | 11 | 4 | 27 | 26 | 22 | 10 | 100 | 14% |
| Grooves | 10 | 26 | 30 | 22 | **3** | **0** | 91 | 13% |
| Triads | 7 | 9 | 10 | 18 | 18 | 13 | 75 | 11% |
| Technique | 6 | 19 | 20 | 9 | 17 | 3 | 74 | 11% |
| Arpeggios | 0 | 8 | 10 | 13 | 17 | 8 | 56 | 8% |
| Rhythm | 11 | 8 | 4 | 16 | 5 | 0 | 44 | 6% |
| Licks | 0 | 0 | 7 | 0 | 21 | 9 | 37 | 5% |
| Fretboard | 15 | 11 | 5 | 3 | 0 | 0 | 34 | 5% |
| Harmony | 2 | 8 | 10 | 5 | 4 | 4 | 33 | 5% |
| Modes | 0 | 0 | 4 | 8 | 15 | 6 | 33 | 5% |
| Make Music | 4 | 6 | 5 | 4 | 5 | 6 | 30 | 4% |
| Walking | 0 | 0 | 7 | 7 | 13 | 3 | 30 | 4% |
| **Reading** | 4 | 10 | 4 | 4 | **0** | **0** | 22 | 3.1% |
| Intervals (incl. the interval quiz) | 0 | 9 | 3 | 6 | 2 | 0 | 20 | 2.9% |
| Slap | 0 | 0 | 3 | 5 | 2 | 1 | 11 | 1.6% |
| **Ear** | 1 | 2 | 3 | 3 | **0** | **0** | 9 | 1.3% |
| **Total** | 71 | 120 | 152 | 149 | 144 | 63 | 699 | |

**Grouped:**
- Theory on the neck (scales, modes, triads, arpeggios, harmony, intervals): 317 steps (45%).
- Lines and music (grooves, walking, licks, slap, studies): 199 (28%).
- Hands and time (technique, rhythm): 118 (17%).
- Notes, reading and ears (fretboard, reading, ear): 65 (9%). None of these is in Stages 5–6.

**What the data shows:**
- **The course never uses four Library exercises:** the tap games #112 (Read it, tap it), #113 (Hear it, tap it:
  notes), #227 (Hear it, tap it: intervals) and #316 (Hear it, tap it: chord tones). These are the only ear and reading
  exercises that check the answer.
- **No stage test has an ear step or a theory step.** From Stage 4 on, no test has a reading step either.
- **Keys** (new measurement):
  - 517 steps sit on exercises with a Key option. Only 37 of them name a key: A 4, C 9, G 8, E 1, F 3, D 2, B♭ 3, and
    7 all-keys cycles.
  - The other 480 take the player's last key for that exercise, which is the exercise default until the player
    changes it: C 271, A 100, E 48, F 22, all-keys cycles 21, B 11, D 5, B♭ 2.
  - So no step asks for E♭, A♭, D♭ or G♭/F♯ except inside a 12-key cycle. Those are the home keys of jazz, gospel
    and horn-section music.

### 1.3 What each level teaches (concepts, from the stage files and the Library)

- **L1 / Stage 1** (22 lessons):
  - **Hands:** holding the bass, tuning with the tuner, i-m plucking, one finger per fret.
  - **Time:** the pulse with the click on 2 & 4 and on 1, subdivisions up to 16ths, rests.
  - **The neck:** the natural notes, sharps and flats, the landmark frets, the octave shape.
  - **Lines:** roots in 8ths, root and 5th, R-5-8-5, one approach note.
  - **Scales:** major, natural minor and the two pentatonics in one position, and open position.
  - **Chords and ears:** chords built from the scale, major and minor triads, hearing major against minor.
  - **Reading:** the bass clef in first position.
  - **Songs:** 4 studies.
- **L2 / Stage 2** (34 lessons):
  - **Hands:** raking, muting, climbing, permutations, spider, the chromatic scale and the X.
  - **Feel:** off-beats, swing and shuffle, dotted rhythms, syncopation.
  - **The neck:** unisons, every place of a note, all 12 roots in one zone, the note quiz.
  - **Intervals:** their shapes, all of them from one root, the interval quiz.
  - **Chords:** every triad type, the five 7th chords, the chords of a key (heard by their 3rds).
  - **Progressions and the blues:** progressions by their roots, the 12-bar blues, the blues scales, boogie and shuffle.
  - **Groove toolbox:** disco octaves, riffs, dynamics, the pick, fills, waltzes and 6/8 and 12/8.
  - **Reading:** accidentals, and five major key signatures.
  - **Songs:** 6 studies.
- **L3 / Stage 3** (44 lessons):
  - **Technique:** legato, shifts, Simandl, string skipping.
  - **Time:** triplet feels, the 16th grid, moving accents, ghost-note funk.
  - **Styles:** rock and blues licks, pick gallops, metal, reggae and ska, highlife, cumbia, soca and maqsum.
  - **The neck and reading:** every note in a position, one note in all its octaves, reading up the neck.
  - **Scales:** two octaves, the three fingerings, all keys in one position, pentatonic colours, one string, three
    notes per string, sequences, diatonic intervals.
  - **Modes:** relative and parallel.
  - **Triads and 7ths:** the triad fingerings, inversions, the triads of a key, the 7ths of a key, broken chords, 7th
    chords by ear, chord formulas to the 13th.
  - **Lines:** chord tones through progressions, approach notes and Motown, double stops, reggae, bossa and tumbao.
  - **First jazz:** the two-feel, walking with chord tones, country, samba and second line.
  - **Slap:** thumb and pop.
- **L4 / Stage 4** (41 lessons):
  - **Hands:** the stretch, endurance 16ths, natural harmonics.
  - **Time:** groupings, displacement, odd metres, the gap click.
  - **Keys:** key boxes, the 7 major and 5 pentatonic positions, reading in all keys.
  - **Pentatonics:** one phrase over many chords, minor pentatonics on a major chord, groove bar and fill bar.
  - **Minor:** harmonic and melodic minor and their chords, minor progressions.
  - **Modes at work:** each mode on its own, chord-scale, progressions by ear.
  - **Triads and 7ths in the key:** inversions, 4ths, open voicings, two octaves.
  - **Voice leading:** string sets, voice-led triads, ii–V–I arpeggios, guide tones and shells.
  - **7ths over two octaves:** inversions, two-octave arpeggios, the 7ths of a key in inversions.
  - **10ths and octaves.**
  - **Walking:** approach notes, scale steps, complete lines.
  - **Grooves:** soul and neo-soul, odd metres, slap, Latin, hip-hop and electronic, gospel and R&B.
- **L5 / Stage 5** (43 lessons):
  - **Hands and time:** permutations across the strings, p-i-m, polyrhythms, sweeps.
  - **Outside sounds:** interval cycles, symmetric scales, side-stepping, world scales.
  - **Bebop:** bebop scales, the 6th-diminished scale, a diminished chord's four dominants, approaches and enclosures.
  - **Modes:** pitch axis, the modes of melodic and harmonic minor.
  - **Superimposition:** pentatonics and melodic minor.
  - **Triads:** permutations, rudiments, triad pairs, modal triads, quartal stacks, upper structures.
  - **Arpeggios:** extended, upper-structure, permutations, altered dominants.
  - **Harmony:** secondary dominants, borrowed chords and tritone subs; funk through the changes.
  - **Walking:** enclosures, two chords a bar, minor walking, triplet skips.
  - **Licks:** jazz licks; solo devices, motifs, implied changes.
  - **Other:** advanced slap, pentatonic double stops, harmonic chords, false harmonics.
- **L6 / Stage 6** (18 lessons):
  - **All keys:** groupings, alternating 3rds, inversions, the triads and 7ths of every key.
  - **Modern colours:** Messiaen's modes, harmonic major, altered chord-scales.
  - **Coltrane and rhythm changes:** the major-3rd axis, Giant Steps, rhythm changes.
  - **Chordal bass;** double thumbing and tapping (both optional).
  - **Vocabulary:** bebop and modern licks.

---

## 2. Reference syllabus (assembled) and how BassClass maps onto it

**What the references expect, in general terms:**
- **Rock/pop graded boards (RSL, LCM, Trinity).** Each grade has:
  - pieces;
  - technical work: scales, arpeggios and grade-specific groove or technique studies;
  - either sight reading or improvising a part from a chord chart, and at higher grades a "quick study" learnt from
    a recording and a chart;
  - ear tests: melodic and rhythmic recall early on, harmony recognition later;
  - questions on the pieces, the notation and the instrument.
- **Classical graded and theory exams:**
  - **Practical:** major and minor scales (harmonic and melodic, the classical form), arpeggios, dominant and
    diminished 7ths, sight reading.
  - **Aural:** pulse, echo singing, cadence types (perfect, plagal, imperfect, interrupted), modulation to related
    keys, features of a piece (dynamics, articulation, tonality).
  - **Theory papers:** time signatures, key signatures and the circle of fifths, intervals with their quality and
    inversion, triads and their inversions, chords on each degree, cadences, transposition, terms and signs.
- **Conservatory and jazz-school bass:**
  - chord-scale and ii–V–I harmony, guide tones;
  - walking and two-feel from a lead sheet;
  - standard forms (12-bar and minor blues, rhythm changes, 32-bar AABA and ABAC);
  - learning tunes (melody and changes);
  - transcription; reharmonisation basics;
  - Latin feels with the clave; odd metres;
  - auditions: play the head, walk choruses, solo, call and response.
- **Books (author, title):**
  - Ed Friedland, "Hal Leonard Bass Method" (reading through 16ths, slides, styles) and "Building Walking Bass Lines";
  - Rufus Reid, "The Evolving Bassist";
  - Chuck Sher, "The Improviser's Bass Method";
  - Gary Willis, "Fingerboard Harmony for Bass";
  - Rich Appleman, "Chord Studies for Electric Bass" and "Reading Contemporary Electric Bass";
  - Carol Kaye, "How to Play the Electric Bass";
  - Allan Slutsky, "Standing in the Shadows of Motown" (Jamerson's inversions, chromatic passing and counter-lines);
  - Louis Bellson and Gil Breines, "Modern Reading Text in 4/4";
  - Mark Levine, "The Jazz Theory Book";
  - Paul Hindemith, "Elementary Training for Musicians";
  - Edward Aldwell and Carl Schachter, "Harmony and Voice Leading".

| Strand | Reference expects | BassClass today | Verdict |
|---|---|---|---|
| Technique: left hand, plucking hand, pick, slap, tapping | All of it, plus articulation (slides, vibrato, bends, staccato and legato) by the middle grades | Very deep ladder; pick and slap now in the core path | **Strong**. Articulation is missing (pedagogue M6, still open) |
| Tone and the instrument | Plucking position, pickups and EQ, strings, the bass in a mix; spoken questions in exams | Two tips only ("neck pickup", "pluck over the neck") | **Missing** (G16) |
| Pulse, subdivision, metre | Simple and compound time, odd metres, syncopation, swing | Pulse, pyramid, 16th grid, displacement, odd metres, polyrhythm, gap click; now 3/4, 6/8 and 12/8 | **Strong**. The clave system is missing (G9); feel placement and swung 16ths are thin (G18) |
| Rhythm reading, sight reading | Through 16ths, ties, rests, syncopation | Quarters to 8ths | **On hold** (known) |
| Pitch reading | Every position; ledger lines above and below | First position to all keys, Levels 1–4 only | Partial; the low B below the staff is never read (pedagogue S7, open) |
| Key literacy | Key signatures, the circle of fifths, relative minor, enharmonic keys | Five major signatures at L2; all keys read at L4 without the relative minor or the circle ever taught | **Thin** (G5) |
| Fretboard knowledge | Every note, every position | Excellent | Strong |
| Intervals | Shapes, sound, quality, inversion, compound intervals | Shapes and sound up to the 10th | Good; interval inversion, quality naming and functional names are absent (G21, Nice) |
| Scales and modes | Majors, minors (classical and jazz melodic minor), modes, pentatonics, blues, symmetric | Conservatory depth and more | **Very strong**. The classical melodic minor is an option on #415 (since 4496587) but not on #317's two-octave scales (G19) |
| Chords and arpeggios | Triads, inversions, 7ths, extensions, chord symbols | Very deep | **Strong**. Inversions **as bass notes** (slash chords) and chord-symbol literacy are missing (G1, G10) |
| Function and cadences | Tonic, subdominant and dominant; the four cadence types; cadences by ear | Roman numerals and "I home, V tension"; no cadence named except "Andalusian" | **Missing** (G4) |
| Chromatic harmony | Secondary dominants and borrowed chords at intermediate level; Neapolitan and augmented 6th later (classical) | Taught at L5 (5.28), though used from L2 (rock ♭VII), L3 (jazz blues, the relative-minor cycle) and L4 (Fly Away's ♭III and ♭VII) | **Late** (G7) |
| Modulation and transposition | Related-key modulation by ear; transposing on the spot | Only "move the riff to the next chord"; Coltrane's axis at L6 | **Missing** (G8) |
| Voice leading and bass-line construction | Guide tones; bass against a melody (contrary motion, resolving tendency tones); rules for strong beats | Guide tones, voice-led arpeggios and approach notes are excellent; no melody to play against; rules only in tips | Partial (G2, G20) |
| Reharmonisation | Tritone sub, backdoor, related ii, passing diminished, pedal; bass-note choice | The tritone sub as a given progression; ♯IV°7 inside the jazz blues only | **Missing as a skill** (G11) |
| Grooves by style | Rock, pop, funk, soul, R&B, gospel, Latin with the clave, Brazilian, reggae, country, metal, 3/4 and 6/8 | Now one exercise per room genre (since 2026-10-29) | Good to Level 4; **none after it** (G13) |
| Walking | Two-feel to fast changes, from a lead sheet, whole forms | Excellent engine, forms up to 16 bars, no whole AABA | Strong; whole forms missing (G12) |
| Improvising and creating | A part from a chart (rock/pop), solos (jazz), call and response | Jazz licks, motif, implied changes, rock licks (L3), pentatonic "make your own" prompts | Jazz good; **creating a part** still missing (pedagogue M1; G2) |
| Song form, charts, arranging | Sections, roadmaps, endings, hits and stops | Studies split into parts; nothing taught | **Missing** (pedagogue M1, open; G12) |
| Ear | Recall, cadences, quality, progressions, transcription | 9 course steps; the four tap games unused | **Thin** (G3) |
| Repertoire | Pieces, heads, standards' forms | 30 original song-style studies | Good for rock/pop; no heads (pedagogue S4, open; G12) |

---

## 3. Missing topics and concepts, level by level

### Level 1–2 (Stages 1–2)

**G1. The bass note of a chord: slash chords, inversions in bass lines, pedal points (L2–L3 · Must · M)**
- **Evidence:**
  - Slash chords exist in only two song studies: Zombie's D/F♯ (`songs.js:191`) and Under Pressure's G/D (`:296`).
  - No progression in `PROGS` (47) or the room's `HARMONY_PROGS` has a bass note other than the root.
  - My progression has no bass field.
  - The only "X/Y" content is upper-structure triads (#524), which is a different idea.
  - The word "slash" does not appear in any stage file.
- **Why it matters:**
  - Choosing the bass note under a chord is the bass player's harmonic job. Pop, rock, gospel and ballad parts lean
    on it constantly:
    - C – G/B – Am – C/G – F (a walk-down);
    - I – IV/I – V/I over a pedal;
    - the line cliché i – i(maj7)/♯7 – i7/♭7 – i6/6;
    - C – A7/C♯ – Dm (a secondary dominant in first inversion, making a chromatic bass);
    - F/G as a 9sus4.
  - Charts write these symbols, and graded chord charts use them from the intermediate grades.
  - The Jamerson lines that "Standing in the Shadows of Motown" analyses depend on them.
- **Where:**
  - Stage 2, unit Progressions and the blues: a lesson "The bass note of a chord" (C/E means play E).
  - Stage 3, unit Lines that move: a lesson "Walk-downs, pedals and line clichés".
  - Stage 5: chromatic inversion lines through secondary dominants.
- **Build:**
  - Give progression entries an optional bass degree, as `cycle-251` already carries a local key (`[deg, quality,
    beats, k]`): for example `{ b: '3' }`.
  - `songs.js` already parses "D/F#", and the Backing already plays a chord with its slash bass (CLAUDE.md, Backing
    round 4), so engraving and sound exist.
  - New `PROGS` entries:
    - Walk-down (I – V/7 – vi – I/5 – IV);
    - Pedal (I – IV/I – V/I – I);
    - Line cliché (i – i/♯7 – i/♭7 – i/6);
    - Chromatic climb (I – VI7/♯1 – ii – II7/♯4 – V).
  - A new pattern for `hm-chord-tones` and `gr-roots`, "Bass as written".
  - A Bass row in My progression's slot editor.
  - A tap-game round, "Which note is in the bass: root, 3rd or 5th?".

**G4. Function and cadences (L2, with a minor-key follow-up at L4 · Should · S–M)**
- **Evidence:**
  - "Cadence" appears only as "Andalusian cadence" (`s2.js:454`) and "imply a cadence" (`s5.js:789`).
  - Plagal appears only as the progression name "minor plagal".
  - Function is a single sentence in #236 ("I is home, V is tension, IV is the going-away chord").
  - #412's own source line says "aural tests in graded exams (cadences)", but no cadence set exists (`ear.js:85–89`).
- **Why it matters:**
  - Perfect, plagal, imperfect (half) and interrupted (deceptive) cadences are in every theory syllabus and in the
    aural tests of the classical boards and of most rock/pop boards.
  - For a bassist, the cadence is where the line must land: V – I lands the root, V – vi steps up.
  - The three function families (tonic I iii vi, subdominant ii IV, dominant V vii°) explain why substitutions and
    reharmonisations work, which G11 needs.
- **Build:**
  - A short concept paragraph in 2.23 Common progressions.
  - Four cadence progressions in `PROGS` (… V – I, … IV – I, … – V, … V – vi), stepped with `hm-progression-roots`.
  - A `cadences` set in #412.
  - Better still, a tap round: "the phrase ends… tap the root of the last chord". Tapping I after V means perfect, I
    after IV plagal, V imperfect, vi interrupted. No new UI is needed.

**G5. Key literacy: relative minor, minor key signatures, the circle of fifths (L2 · Should · S)**
- **Evidence:**
  - 2.32 teaches the signatures of C, G, F, D and B♭ major only (`s2.js:669`).
  - "Relative" appears only in passing (`s4.js:194`, `:262`, `:400`).
  - 4.11 reads every minor key "with key signatures" (`s4.js:208`) without ever saying a minor key borrows its
    relative major's signature.
  - The order of sharps and flats appears first at L4 (`s4.js:209`).
  - The circle of fifths is used as a drill order but never taught as the map of keys.
- **Why it matters:**
  - Theory papers and every reading programme ask for it.
  - It is how a player finds a song's key from its chart, and the same map orders the cycle drills the app uses
    everywhere.
- **Build:**
  - One concept paragraph and a figure in 2.32: the signature grows by one sharp or flat per fifth, and the relative
    minor is 3 frets down with the same signature.
  - A minor key or two in #221 (A, E and D minor), which have `rd-melodies`' key signature already engraved.
  - A tap round in the reading game: a key signature on the staff, "tap the major key's root" and then the minor's.
    The staff already draws signatures.

**G10. Chord-symbol literacy (L2–L3 · Should · S)**
- **Evidence:**
  - The app writes one dialect: maj7, m7, m7♭5, °7, 7alt.
  - Charts in the wild also write CΔ7, CM7, C−7, Cmi7, Cø7, C+7, C7(♭9), C9sus4 (= B♭/C), C6/9, C(add9), C5 and C/E.
  - No lesson shows the variants.
- **Why it matters:** the first thing a bassist does with a chart is decode the symbols. Misreading Δ against −
  turns a major chord into a minor one.
- **Build:**
  - Six lines in 3.31 Chord formulas.
  - A tap round that writes a symbol in another dialect ("C−7: tap its 3rd").
  - A Library search synonym for "Δ" and "−".

**G16. Tone and the instrument (L1–L2 · Should · S, text only)**
- **Evidence:**
  - Nothing in the course on:
    - where to pluck (neck against bridge);
    - the pickups and the tone knob;
    - EQ and a compressor;
    - flatwound against roundwound strings;
    - what setup is (action and intonation are a technician's job);
    - the bass's place in a mix (sub against kick).
  - Two tips mention the neck pickup (#338, #351).
- **Why it matters:**
  - Tone is half of a bass part.
  - The rock/pop exams ask questions on the instrument.
  - A student who changes nothing but the plucking position hears a real difference the same day.
- **Build:** a lesson "Your sound" in Stage 1's "Your two hands" (concept and mistakes, a step on #101 played at three
  plucking positions), and a follow-up in Stage 2's Groove toolbox: "short and round" (reggae, Motown) against "long
  and bright" (rock).

### Level 3–4 (Stages 3–4)

**G7. Secondary dominants and borrowed chords come at L5, though they are used from L2 (L3 · Should · M)**
- **Evidence:**
  - The concept is first taught in 5.28 (`s5.js:570`).
  - The course plays it much earlier:
    - the relative-minor cycle, whose III7 is V/vi, at 3.36 (`s3.js:865`);
    - the jazz blues, with VI7, the ii–V into IV and the ♯IV°7, at 3.37 (`s3.js:880`);
    - Fly Away's ♭III and ♭VII at L4, explained in its own text (`songs.js:398`);
    - ♭VII rock progressions in the L1–L3 groove options.
- **Why it matters:**
  - Secondary dominants and modal interchange are intermediate theory in every syllabus.
  - The bassist must know that the A7 in C wants a C♯, the very note the line plays.
  - Played for two stages without a word, these chords become shapes and not functions.
- **Build:**
  - A Level 3 exercise (the next free 3xx) on the `hm-chord-tones` engine, with: I – II7 – V – I (V of V), I – III7 –
    vi (V of vi), I – I7 – IV (V of IV), I – VI7 – ii – V, I – ♭VII – IV – I, I – ♭III – IV – I, I – IV – iv – I.
  - A Stage 3 lesson in "Lines that move" ("Chords from outside the key"), with `added` so finished players are not
    sent back.
  - 5.28 keeps the tritone subs and goes deeper.
  - The new exercise must be at L3 so it stays free with the free stage (a Pro L5 exercise inside a free lesson would
    be a preview).

**G9. The clave and the Latin rhythm system (L3–L4 · Should · M)**
- **Evidence:**
  - Lesson 4.39 opens with "Latin bass plays with the clave" (`s4.js:819`; #448's text), but the clave is never taught.
  - There is no exercise on tresillo against clave, 2-3 against 3-2, or the anticipated bass.
  - The room already has a correct 2-3 son clave (Mambo) and 3-2 rumba clave (`practice/styles.js:215, 220`; I
    checked the hits).
- **Why it matters:**
  - Afro-Cuban and Latin-jazz bass is organised by the clave. A tumbao played against the wrong clave direction is
    wrong even when every note is right.
  - Conservatory Latin units and the Latin bass books (Oscar Stagnaro, "The Latin Bass Book") start there.
- **Build:**
  - A rhythm exercise "Clave and tresillo" on the rhythm engine: one note, the clave as the click, son and rumba
    clave, 2-3 and 3-2.
  - A Clave option (2-3 / 3-2) on the tumbao and songo grooves (#338, #448), with the band's Mambo pattern behind them
    (`band.js` already maps styles to patterns).
  - Three concept lines in 3.35 and 4.39.

**G8. Modulation and transposition (L4 · Should · M)**
- **Evidence:**
  - No content on key changes: "modulat", "key change" and "pivot" have no hit in the course text. The only hit is
    Coltrane's axis at L6.
  - Transposition appears only as "move the riff to each chord" (2.28) and a tip in #335.
- **Why it matters:**
  - Pop songs step up a key for the last chorus. Verses move to the relative major. Standards move by ii–V into the
    IV's key or down a whole step.
  - A bassist who does not hear or see the new key plays the old root.
  - Transposing a tune on the spot is daily band work (the musician review asked for it in S8; this is the theory
    behind it).
- **Build:**
  - `PROGS` entries carry a local key already (`k` in `cycle-251` and `giant-steps`). Add:
    - "Last chorus up a whole step";
    - "Verse in A minor, chorus in C";
    - "ii–V into the IV's key";
    - "Down a whole step (ii–V to the new I)".
  - Play them through `hm-chord-tones` and `wk-mixed`.
  - A lesson in Stage 4's "Keys across the neck": "Changing key: hear it, find the new I".

**G2. Building a bass line: the rules behind "your line" (L1–L5 · Must · L)**
- **Status:** pedagogue M1 ("Your line" steps and the charts) is still open. This is the content those steps would
  teach.
- **Evidence:** the rules exist only as scattered tips:
  - roots on beat 1 (#342);
  - "the approach is short and leads" (#337);
  - "lines that go up should come back down" (#441).
  
  No lesson states the craft as a set.
- **A ladder of rules by level:**
  - L1: roots on the downbeat of every chord; lock with the kick (1 and 3).
  - L2: chord tones on strong beats, anything on weak beats; land the change.
  - L3: a step or a half step into the target; keep the register under the melody (roughly below the G string's
    5th fret).
  - L4: contrary motion against the top voice; resolve tendency tones (the 3rd of a V7 up, the 7th down); vary the
    rhythm before the notes.
  - L5: tension and release across the bar (anticipation, delay); leave space for the melody.
- **Build:**
  - Each rule fits a lesson's concept paragraph. The generated lines already obey most of them, so the dot labels
    can point them out.
  - The creative step is pedagogue M1's.
  - "Bass against a melody" (G20) is the advanced part.

**G18. Feel placement, swung 16ths, half-time and double-time (L3–L4 · Should · M)**
- **Evidence:**
  - "Behind the beat" is asked for in neo-soul (`s4.js:753`) and on blues licks, but nothing teaches placement.
  - Swung 16ths (hip-hop, neo-soul, the "drunk" feel) are never named.
  - Half-time appears as a metal breakdown and in drum & bass, but never as one tune played in half-time and then
    double-time.
- **Why it matters:** placement and feel transformations are what drummers and band leaders ask for ("lay back",
  "half-time the bridge").
- **Build:**
  - The room already swings straight 16ths on the triplet grid ("Triplets" on a 16th pattern).
  - An exercise option "Feel: straight / swung 16ths" on #340 and #449.
  - A "same progression, half-time / double-time" pair in `gr-roots`.
  - The placement demo the pedagogue asked for (S1) is still open.

### Level 5–6 (Stages 5–6)

**G11. Reharmonisation for bassists (L5 · Should · M)**
- **Evidence:**
  - The tritone sub exists as fixed progressions (ii – ♭II7 – I) and in licks.
  - Absent:
    - the backdoor (iv7 – ♭VII7 – I);
    - the related ii (a V7 expanded to ii–V);
    - passing diminished chords (I – ♯I°7 – ii – ♯II°7 – iii); they appear only inside the jazz blues;
    - the Dameron turnaround (I – ♭III7 – ♭VI7 – ♭II7);
    - pedal-point reharmonisation;
    - choosing a 3rd or 5th in the bass.
  - Nothing frames reharmonisation as the bassist's choice.
- **Why it matters:**
  - In jazz the bass reharmonises in real time: a ♭II root under a V7, a pedal under a ii–V.
  - In gospel and R&B, passing diminished chords and walk-ups are the vocabulary.
  - It is the Level 5–6 skill that turns knowing harmony into using it.
- **Build:**
  - `PROGS` additions: backdoor, passing diminished, Dameron, ii–V chains.
  - A "Substitutions" option on `wk-two-per-bar` and `wk-mixed`: tritone sub on every V, related ii, pedal on the V.
  - A lesson in "Advanced walking" and one in "Colour in progressions".

**G12. Whole forms and tunes: forms, original heads, the blues family (L4–L6 · Should · M for forms, L for heads)**
- **Evidence:**
  - Rhythm changes exist as the A section (`rhythm-A`) and the bridge (`rhythm-B`), never as the 32-bar AABA.
  - No 32-bar AABA or ABAC template.
  - No "Bird blues" (the bebop blues with descending ii–Vs).
  - The minor bossa (16 bars) and the modal AABA live only in the room and two drills.
  - There are no melodies (pedagogue S4, still open).
- **Why it matters:**
  - Jazz programmes and auditions are tunes: the head, then walking the whole form, keeping track of the bridge.
  - Knowing a form is a skill of its own: where the bridge is, the turnaround into the last A.
- **Build:**
  - Long `PROGS` entries (the walking engine already handles 16 bars): "Rhythm changes (whole AABA)", "Bird blues",
    "AABA standard form", "ABAC standard form".
  - **Original heads written as contrafacts** on these forms, like the bebop tradition. This fits the "original lines"
    policy and copies no melody. Use the `songs.js` parts format and play "Head, then walk".
  - Optional, for the owner to decide: public-domain material (traditional tunes, Bach cello-suite excerpts on the
    bass) as reading and phrasing repertoire.

**G13. Stages 5–6 beyond jazz (Should · L)**
- **Status:** pedagogue S2 ("Groove · Jazz · Both"), still open.
- **Evidence:**
  - Grooves have 3 steps in Stage 5 and none in Stage 6.
  - Licks: 30 jazz steps; rock and blues stop at L3.
  - Library L6 has no groove exercise.
- **Content a Groove path would need:**
  - advanced funk: displaced 16ths at 100+, octave and ghost density, thumb-style funk;
  - fusion: odd-time grooves at speed (7/8, 11/8), unison lines;
  - metal: tremolo picking, odd-time djent, fast gallops;
  - gospel: chops and runs (♭7 – 6 – ♭6 – 5 walk-downs, chromatic fills into IV);
  - Latin: songo and montuno variations in both clave directions (G9), Afro-Peruvian landó in 12/8, partido alto at
    tempo;
  - rock and blues soloing over changes;
  - mixed metres (G23).
- **Build:** the `GROOVES` cells and `lickTemplate` (with `pick`) carry all of it.

### Every level

**G3. Ear: what the course should ask, using what exists (Must · S to start, M in full)**
- **Status:** the pedagogue's M2 argued the case (recall, transcription). It is not repeated here. What is new: the
  engines to fix it now exist and the course does not use them.
- **Evidence:**
  - 9 ear steps (1.3%), none after Stage 4, none in any stage test.
  - The four tap games, the only ear exercises that check the answer, are in no lesson.
  - Lesson 2.16 "Hear the interval" still uses #225, whose name is shown before the note sounds
    (`intervals.js:241`). The real recognition game #227 sits unused.
- **Content by level, each a tap round on the existing game engine (`round(p, ctx, rand)`, kinds 'ear' and 'find'):**
  - L1: notes on a string (#113).
  - L2: intervals (#227); hear the bass note of a triad (root, 3rd or 5th; supports G1); hear the cadence (G4).
  - L3: chord tones (#316); the scale degree over a drone (tap the degree: a functional ear).
  - L4: name the mode over a drone (pitch axis as a quiz); the bass line of a progression (tap each root).
  - L5: extensions (9, 11, 13) and alterations over a held chord.
  - Every stage test: one ear step.
  - Transcription (recall of a 1–2 bar riff) belongs to the planned ear course.
- **Size:** S for the course steps on existing games; M for the new rounds.
- **Note:** a step that changes its exercise changes its notes: add new steps, or list the old one in `CHANGED_STEPS`.

**G6. Key coverage in the course (Should · S, data)**
- **Evidence:** §1.2. No step names E♭, A♭, D♭ or G♭/F♯, and 54% of keyed steps play C unless the player changes it.
- **Why it matters:**
  - Jazz standards live in F, B♭, E♭ and A♭. Gospel lives in A♭ and D♭. Horn-section funk lives in E♭ and B♭.
  - A course that only says "in any key" lets the player stay in C and A.
  - Many can-lines promise "any key".
- **Build:** data only.
  - Set `key` on jazz-unit steps (F, B♭, E♭, A♭), gospel and R&B steps (A♭, D♭), and rock steps (E, A, D, G).
  - Make reviews pick a new key (pedagogue M4(d), open).
  - A step whose key changes changes its notes: append, or list it in `CHANGED_STEPS` (CLAUDE.md).

**G17. Theory checks, now cheap through tap mode (Should · S–M)**
- **Status:** pedagogue S8 asked for checked theory; the "I can" lines are still self-ticked.
- **What changed:** since 2026-11-02 the 'find' kind answers a note name in any octave (`pc`), so the checks can be
  built on it.
- **Examples:**
  - "Tap the 3rd of E♭7";
  - "Tap the ♭VI of C minor";
  - "Tap the bass note of G/B";
  - "Tap the key of three flats";
  - "Tap the 9th of Dm9".
- **Build:** one generated round per theory lesson, from `theory.js`. A score of 8/10 could tick the lesson's "I know…"
  line.

**G14. Articulation and note length (L2–L3 · Must · M)**
- **Status:** pedagogue M6, still open.
- **Evidence:**
  - Slides, vibrato and bends appear only as words in tips (`s3.js:179`, `s5.js:733`).
  - Staccato and tenuto are never written.
  - Palm muting is now explained in text (2.30) but never marked.
- No new evidence beyond M6; it stays in the top 15 because the style units added since 2026-10-29 (reggae's "short,
  round notes", Motown, doom's ringing notes) all ask for note length the app cannot show.

### Nice to have

- **G19.** The classical melodic minor on #317 Two-octave scales (S).
  - #415 offers it since commit 4496587 (`melodicClassical`, `scales.js:373`).
  - #317 offers only the jazz form, and the classical exams ask for the two-octave classical form.
  - `docs/CATALOGUE.md` still lists #415 without it: see C8.
- **G20.** Bass against a melody (L4–L5, L).
  - A simple top line in the Backing, and a generated bass that moves in contrary motion and resolves tendency tones.
  - The classical counterpoint behind Aldwell and Schachter, and behind every Jamerson counter-line.
  - It needs a melody voice in the player.
- **G21.** Theory vocabulary (S).
  - The scale-degree names (tonic … leading note) and interval inversion. "The 5th below is the 4th above" is used
    everywhere but never named as a rule.
  - Harmonic rhythm.
  - Six lines in existing concepts.
- **G22.** The Neapolitan ♭II and the augmented 6th (L5–6, S, text): they show where the tritone sub and the Phrygian
  ♭II come from.
- **G23.** Mixed metres and metric modulation (L5–6, M): 7/8 + 4/4 bars, a 3:2 tempo shift. Prog and theatre need
  them; the musician review raised them in N3.

---

## 4. Thin areas (present, too little practice for the level)

- **T1. Ear:** 9 steps (§1.2, G3).
- **T2. Reading:** 22 steps, none in Stages 5–6. Rhythm reading is on hold; pitch reading, the low B and charts are not.
- **T3. Harmony in Stage 1:** 2 steps.
  - Roman numerals are taught in 1.12 by a single sentence, before the scale they count (`s1.js:250`; pedagogue S8,
    still open).
- **T4. Dynamics:** one lesson (2.29) and one check step. Dynamics are never asked for again, except as the "quiet
  verse, loud chorus" of song studies.
- **T5. Modes in Stage 3:** 4 steps (2 lessons) before Stage 4 uses chord-scale on every chord.
- **T6. Rock and blues licks:** one exercise (#343) against nine jazz lick exercises. Funk, R&B and gospel fills exist
  only inside grooves (#340's fill bar, #545).
- **T7. Slap:** 11 steps. Now in the core path; the left-hand slap and the "Motown thumb" (palm-muted thumb) style
  are absent.
- **T8. Ear and theory checks in the tests:** none (G3, G17).

## 5. Sequencing problems (a concept used before it is taught)

- **SP1.** Roman numerals at 1.12, before the scale at 1.15 (`s1.js:250`). Still open (pedagogue S8).
- **SP2.** Secondary dominants, passing diminished and the ii–V into IV are used at 3.36–3.37 and taught at 5.11 and
  5.28 (G7).
- **SP3.** The Andalusian cadence's major V and the "minor" progressions at 2.23 (`s2.js:454`). The raised 7th that
  makes V major is explained at 4.17 (`s4.js:346`). One sentence at 2.23 would bridge it.
- **SP4.** 4.11 reads every minor key "using the harmonic minor" (`s4.js:208`) before harmonic minor is taught at
  4.15. The relative minor and minor key signatures are never taught (G5). Swap the order or add the concept.
- **SP5.** Progressions are heard by ear only at 4.20, two stages after they are played at 2.23. The pop set of #412
  could open in Stage 2 (see LM1).
- **SP6.** Lesson 4.39's idea leans on the clave, which nothing has taught (G9).

## 6. Level misplacements

- **LM1.** #412 "Hear the progression" is Level 4. Its pop set (I IV V vi ♭VII) belongs with 2.23 at Level 2; the
  jazz and minor sets can stay at Level 4. Split it, or add a Level 2 cadence and pop set (G4).
- **LM2.** #532 "Secondary dominants, borrowed chords, tritone subs" is Level 5. The diatonic secondary dominants and
  ♭VII and ♭VI are Level 3 material (G7); the tritone subs fit Level 5.
- **LM3** (minor). Harmonic minor at Level 4 (#415). Its V chord is used at Level 2. Acceptable if SP3 gets its
  bridging sentence.

## 7. Duplicates

- **D1.** #314 "Diatonic intervals" and #318 "Scale sequences" both offer "In 3rds", "3rds alternating" and "In 4ths"
  on the same scales; #603 adds alternating 3rds in all keys. Keep them (fluency drills), but the course could point to
  one.
- **D2.** #225 "Interval quiz" and #227 "Hear it, tap it: intervals". The first shows the answer first (§8, C5); the
  second checks it. The course uses the first and not the second (G3).
- **D3.** By design, not a problem: the presets of #330 and #333 (#422, #423, #431, #609, #611), as CLAUDE.md
  decides. Mentioned only so the count of 28 triad exercises is read as "6 concepts".

## 8. Content correctness

**Wrong or misleading:**

- **C1. The Stage 1 test's "new key" is not new** (Major, S). **Fixed in 8db5acb while this audit ran** (B♭, rev 11).
  - `s1.js:495`: "G major, a key the lessons did not use: the same shape, from the E string's 3rd fret."
  - Lesson 1.15's second step is that same exercise with the same options: G major from the E string (`s1.js:320`,
    `p: { type: 'ionian', key: '7', root: 'E', oct: '1' }`).
  - Lesson 1.16 plays G major in open position (`s1.js:336`).
  - So the claim is false and the step tests no transfer.
  - **Keys Stage 1 never uses:** B♭, E♭, A♭, D♭, F♯, D, B. 8db5acb chose B♭ major from the E string's 6th fret.
- **C2. A stale lesson number** (Minor, S).
  - `s4.js:707`: "Each chord takes its scale by function, as in Lesson 31.2".
  - Lesson numbers became "stage.number" on 2026-10-28, and no "31.2" exists. The lesson meant is 4.19, "The right
    scale on every chord".
- **C3. The metal text lists one interval twice and leaves out the signature one** (Minor, S).
  - `s3.js:234` and `grooves.js:209`: "The darkest colours are the ♭5, the tritone, and the minor scale's ♭6."
  - The ♭5 is the tritone.
  - The ♭2 (Phrygian), the colour the app's own Phrygian vamp and the Schism study use ("the dark ♭2", `songs.js:413`),
    is missing.
  - Suggested: "the ♭2 of the Phrygian mode, the ♭5 (the tritone) and the minor scale's ♭6."
- **C4. "Reggae leaves beat 1 empty"** (Minor, S).
  - `s3.js:826` and `grooves.js:160`.
  - That describes the one-drop **drum** pattern. Lesson 3.43 then teaches rockers "with beat 1 sounded"
    (`s3.js:252`).
  - Suggested: "In the one drop the drums leave beat 1 empty, and the bass often rests there too."
- **C5. #225's title promises recognition** (still open from pedagogue C1).
  - `intervals.js:239–241`: "Interval quiz: hear it, name it, find it", yet "the next note's name shows in the corner"
    before the note sounds.
  - Rename it ("Sing the interval") or move lesson 2.16 to #227.
- **C6. Two mnemonics for the open strings** (Trivial).
  - `fretboardNotes.js:16`: "Eat All Day, Good!".
  - `s1.js:49`: "Eat All Day, Grandma".
- **C7. "Fingers 3 and 4 share a tendon"** (`s2.js:60`; Trivial).
  - Loosely true: the ring and little fingers are linked by tendon bridges and a shared flexor muscle.
  - "Are linked by their tendons" would be exact.
- **C8. `docs/CATALOGUE.md` is out of date** (Minor, S).
  - Its #415 line lists "Natural minor / Harmonic minor / Melodic minor (jazz)".
  - At 15d2cbc the exercise also offers the classical form (`scales.js:373`).
  - `saveCatalogue()` was not run after 4496587. CLAUDE.md asks for it whenever exercises change.

**Checked and correct** (so the next round can go elsewhere):
- **The neck:** the landmark frets on all four strings; the octave and unison shapes; the bass-clef lines, spaces and
  ledger lines, and the octave transposition; the 12-bar and jazz-blues forms.
- **Scales:** the major-scale and pentatonic fingerings by finger; the three scale forms in major and minor
  (#324's 2-4-4 and 4, 1-2-4 forms); the brightness order of the parallel modes; the 3rd qualities through the scale
  (M m m M M m m).
- **Chords:** the five 7th chords by lowering one note; the R-5-7-10 ear voicing; the chord formulas (C°7's B♭♭, the
  13th without its 11th); the triad qualities of natural, harmonic and melodic minor.
- **Voice leading:** guide-tone motion in a ii–V–I; the shell and 10th shapes; the diminished chord's four dominants
  (B°7 to B♭7, D♭7, E7, G7); the rootless 7♭9.
- **Scale families:** the melodic-minor shortcuts (altered = half step up, Lydian dominant from the 5th, the 7sus♭9,
  maj7♯5 and 7♭13 placements); the pentatonic superimposition labels (D♭ over G7alt = ♭5 ♭13 ♭7 ♭9 ♯9); the minor
  pentatonics on a major chord's 3rd, 6th and 7th; the three boxes on a minor chord.
- **Other sounds:** the triad pairs and their modes; the upper-structure tensions (all nine); the harmonic-major modes
  (Phrygian ♭4 read as R ♭9 ♯9 3 5 ♭13 ♭7); the Messiaen modes' notes and repeat cells; the world scales' formulas
  (the Hungarian minor as double harmonic's 4th mode).
- **Bebop and rhythm:** the bebop scales and Baker's bebop Dorian (F E♭ C A on the beats); the polyrhythm and
  grouping arithmetic (3, 5 and 7 bars); the room's 2-3 son and 3-2 rumba claves.
- **Harmonics:** the node positions (12, 7, 5, 3.86, 3.16, 2.67, 2.31, 8.84); the harmonic chords (Em7, Esus2, Gmaj7,
  Cmaj7♯11, A7sus4, D5).

## 9. Since the 2026-10-29 reviews

**Done:**
- One groove exercise per room genre: #350, #351, #352, #448, #449, #450, plus #248 for 3/4, 6/8 and 12/8 (pedagogue
  S1).
- Fills (#241, lesson 2.33).
- Rock and blues licks before Level 5 (#343) (students G14).
- The pick in the core path, with #210 and #308.
- Slap in the core path, with #443.
- Drums under the style exercises: the band (pedagogue M7, musician M3). Lesson 1.12 "Roots with the drums" now has
  drums, which fixes the pedagogue's C3 in part; the neo-soul demo's "behind" is still on the grid.
- The melodic minor's classical form, as an option of #415 and in the text of #415 and 4.15 (pedagogue C2).
- A no-dots step in every stage test (pedagogue M4(a), in part).
- Pain lines in 2.4 and 4.1.
- Lesson search by number (teachers S4).
- The Stage 1 test given its own key: G this morning, B♭ since 8db5acb (C1).

**Still open:** these are not re-argued here; G-items add the content behind some of them.
- Chart reading and "your line" (pedagogue M1; G2, G12).
- Articulation (M6; G14).
- Ear in the course and in the tests (M2; G3).
- Consistency (several loops) and test mode (M4 b–e).
- Grooves in Stages 5–6 (S2; G13).
- Jam steps in the room (S3).
- Heads (S4; G12).
- The low B and tunings (S7).
- Theory checks (S8; G17).
- Reviews in a new key (S11; G6).
- The interval quiz (C1; C5).

## 10. Known and on hold

- Recorded takes are on hold (CLAUDE.md, QA round 22).
- The rhythm-reading and sight-reading course is on hold (user, 2026-11-02).
- The reading and ear courses are planned on the tap games.

## 11. Already strong

- **Harmony on the neck:** every scale, mode, triad and 7th, their inversions and voice leading, in every key and
  fingering, academically spelled. The depth is conservatory and jazz-school level; Stages 4–6 go past most method
  books.
- **Jazz:** chord-scale, superimposition, upper structures, the Barry Harris material and symmetric scales are covered
  more completely than in any single book, and every text I checked is correct.
- **Walking:** a full pipeline from the two-feel to Coltrane changes.
- **Time:** the gap click, displacement, odd metres with the player's own groupings, polyrhythm, and now 3/4, 6/8 and
  12/8.
- **Technique:** a complete ladder, now with false harmonics and harmonic chords whose node theory is exact.
- **Styles to Level 4:** they now match the room's 13 genres, with drums under them.
- **Song studies:** 30 original studies, each with its song's key, feel and technique.

---

## 12. Prioritised top 15

First, the text fixes (S, under an hour). C1 is already done in 8db5acb; left are C2 ("Lesson 31.2"), C3 (metal
colours), C4 (reggae beat 1) and C8 (regenerate the catalogue).

| # | Item | Level / stage | Size | Priority |
|---|---|---|---|---|
| 1 | **G1** Slash chords, inversions, pedal points and walk-downs: a bass field on progressions, new progressions, two lessons, a bass-note ear round | L2–L3, S2–S3 | M | Must |
| 2 | **G3** Ear in the course: the four tap games as steps, an ear step in every stage test, then bass-note, cadence, degree and mode rounds | all | S → M | Must |
| 3 | **G2** The rules of a bass line, level by level: the content behind pedagogue M1's "Your line" steps | L1–L5 | L | Must |
| 4 | **G14** Articulation and note length (pedagogue M6) | L2–L3 | M | Must |
| 5 | **G7** Secondary dominants and borrowed chords at Level 3, before the jazz blues and the relative-minor cycle use them | L3, S3 | M | Should |
| 6 | **G4** Function and the four cadences, played and heard (the tap-the-last-root round) | L2, S2 | S–M | Should |
| 7 | **G6** Key coverage: name keys on steps (E♭, A♭, D♭, B♭, F for jazz and gospel), reviews in new keys | all | S | Should |
| 8 | **G5** Relative minor, minor key signatures, the circle of fifths; fixes SP4 | L2, S2 (and 4.11) | S | Should |
| 9 | **G10** Chord-symbol literacy (Δ, −, ø, alt, add, sus, slash) | L2–L3 | S | Should |
| 10 | **G17** Theory checks as tap rounds ("tap the 3rd of E♭7") | all | S–M | Should |
| 11 | **G16** Your sound: plucking position, pickups, EQ, strings, the bass in a mix | L1–L2 | S | Should |
| 12 | **G9** The clave: son and rumba, 2-3 and 3-2, tumbao and songo with a clave option | L3–L4 | M | Should |
| 13 | **G8** Modulation and transposition: key-change progressions and a "find the new I" lesson | L4, S4 | M | Should |
| 14 | **G12** Whole forms (rhythm changes AABA, Bird blues, AABA and ABAC) and original contrafact heads | L4–L6 | M–L | Should |
| 15 | **G13** Stages 5–6 beyond jazz: a groove path (funk, fusion, metal, gospel, Latin) on the existing engines | L5–L6 | L | Should |

Next after these:
- G11, reharmonisation for bassists (Should, M);
- G18, feel placement, swung 16ths, half-time and double-time (Should, M);
- then the Nice items, G19–G23.
