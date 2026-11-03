URGENT: the Stage 1 test step shipped today says "G major, a key the lessons did not use: the same shape, from the E string's 3rd fret." (`web/js/course/stages/s1.js:495`, on screen as step 2 of 8). This is false. Lesson 1.15 step 2 plays exactly that step (`type: 'ionian', key: '7', root: 'E', oct: '1'`, its chip reads "G"), and Lesson 1.16 plays G major in open position. The survey's item 5 ("in any key" holds) is therefore not done, and the no-dots step (`s1.js:502`) repeats the same G. A key Stage 1 never uses would work: D from the A string (fret 5) or B♭ from the E string (fret 6). The step is stored by index, so the change needs a new `CHANGED_STEPS` entry (rev 11).

# Content gaps for learners · 15d2cbc · 2026-11-03

**The question** (user, 2026-11-03): "identify in terms of musical theory and content what's missing from a learning (all
levels) point of view… not technical perspective but content." Six learners each make a realistic journey through the
app. For each one, the report says what they would need to learn and cannot find, or find too thin, too late or in the
wrong order. Bugs and layout are left out.

**Setup:**
- Commit 15d2cbc, my own `qauser` server (port 8890), in my own tab, from an empty profile, at 780×360. At the end I
  cleared the profile, reset the viewport, closed the tab and stopped the server.
- I read `CLAUDE.md`, `docs/CATALOGUE.md` and `docs/RESEARCH.md`, all six stage files (their concept texts in full),
  `course/placement.js`, and the about and tip texts of `curriculum/grooves.js`, `rock.js`, `harmony.js`, `ear.js`,
  `intervals.js`, `reading.js` and `songs.js`.
- I loaded the live modules (`course/data.js`, `curriculum/index.js`, `band.js`, `practice/styles.js`) to count the
  course and the Library. I searched the Library for 40 topic words, and opened the Stage 1 test and Lesson 1.15.
- **Not repeated:** the four 2026-10-29 reviews (`qa/reports/2026-10-29-review-*.md`). Where one of their items is still
  open I give it one line and go further.
- **On hold, one line only:** recorded takes, and the rhythm-reading course. Your notes also put the reading and ear
  courses on hold; where a gap is content those courses will need, I say so.
- **Sizes:** S is a day or two, M about a week, L several weeks. **Priority:** Must, Should or Nice.

**Counts:**
- Wrong 3 (W1 URGENT, W2, W3).
- Misleading or text 7 (W4–W10).
- Gaps: Must 8, Should 29, Nice 12 (the teacher's table mostly points back to these).
- Questions 5.

---

## 0. Since the 2026-10-29 reviews

**Done** (a big step for the band player and the funk player):
- **Drums under the style exercises.** The band plays in 74 exercises. Lesson 1.12 "Roots with the drums" now plays the
  rock8 pattern (checked with `bandCandidates`).
- **New Library content:**
  - fills (#241), rock and blues licks (#343);
  - a pick strand (#210, #238, #308);
  - metal, reggae and ska, world, Latin, hip-hop and electronic, gospel and R&B grooves (#350–352, #448–450);
  - grooves in 3/4, 6/8 and 12/8 (#248).
- **In the course:** all of this is woven into Stages 2–4, and slap is now in the core path.
- **Tap games and tap mode:**
  - intervals by ear with a real answer (#227);
  - notes on a string by ear (#113) and chord tones (#316);
  - Read it, tap it (#112);
  - tap mode on the reading and note-finding drills.
- **Tuner:** drop tunings and any key.
- **Honesty and the stage tests:** honest wording after a loop; "No dots", and a no-dots step at the end of every stage
  test.
- **#415:** the classical melodic minor.
- **Lessons** can be searched.
- **#551:** false harmonics.

**Attempted but not achieved:** the Stage 1 test's "any key" (URGENT, above).

**Still open, not argued again** (see the 10-29 reviews):
- making a part from a chord chart, and song form;
- ear recall and dictation, and cadences;
- slides, vibrato, bends and articulation marks;
- an A–B loop;
- playing along with an audio file;
- tunes, setlists and song form in the room;
- tunings on the neck;
- theory knowledge checks;
- reviews that vary;
- a placement that tests;
- tools for teachers;
- how to practise.

### Where the course spends its time now (699 steps, 268 lessons with checkpoints and tests)

| Topic | S1 | S2 | S3 | S4 | S5 | S6 | Total | Share |
|---|---|---|---|---|---|---|---|---|
| Scales | 11 | 4 | 27 | 26 | 22 | 10 | 100 | 14% |
| Grooves | 10 | 26 | 30 | 22 | **3** | **0** | 91 | 13% (was 8%) |
| Triads | 7 | 9 | 10 | 18 | 18 | 13 | 75 | 11% |
| Technique | 6 | 19 | 20 | 9 | 17 | 3 | 74 | 11% |
| Arpeggios | 0 | 8 | 10 | 13 | 17 | 8 | 56 | 8% |
| Rhythm | 11 | 8 | 4 | 16 | 5 | **0** | 44 | 6% |
| Licks | 0 | 0 | 7 | 0 | 21 | 9 | 37 | 5% |
| Fretboard, harmony, modes, studies, walking | | | | | | | 34 / 33 / 33 / 30 / 30 | 23% |
| **Reading** | 4 | 10 | 4 | 4 | **0** | **0** | **22** | **3.1%** |
| Intervals | 0 | 9 | 3 | 6 | 2 | 0 | 20 | 3% |
| Slap | 0 | 0 | 3 | 5 | 2 | 1 | 11 | 2% |
| **Ear** (with the interval quiz) | 1 | 5 | 3 | 3 | **0** | **0** | **12** | **1.7%** |

- **Scale, chord and harmony drills** (scales, triads, arpeggios, modes, harmony) take 42% of the steps.
- **Ear and reading** together take under 5%, and none at all in Stages 5–6.
- **No stage test has an ear step.** The new "no dots, by ear" steps replay a scale or an arpeggio while the app's
  bass sounds.
- **The four tap games are in no lesson.** Your decision ("the tap games stay in the Library for now").
- **In the Library, Levels 5–6 (75 exercises) have:**
  - no reading and no ear training;
  - one groove exercise (#533) and one rhythm exercise (#505);
  - 41 drills of scales, modes, triads and arpeggios.

---

## 1. Wrong or misleading content

### Wrong

- **W1 (URGENT, above). The Stage 1 test's "a key the lessons did not use" is false.**
  - Where: `s1.js:495`, also the no-dots step at `s1.js:502`.
  - Evidence: Lesson 1.15's rows read "C", "G" and "any key".

- **W2. A lesson number that no longer exists.**
  - Where: Lesson 4.34 "Scale steps in walking lines" (`s4.js:707`).
  - Text: "Each chord takes its scale by function, as in Lesson 31.2".
  - The numbering is now stage.number, so "31.2" means nothing and the search finds no such lesson.
  - Fix: Lesson 4.19 ("The right scale on every chord").

- **W3. Lesson 4.15 contradicts #415 since today.**
  - Where: `s4.js:317`.
  - Text: "Jazz players use melodic minor the same going up and coming down, as the app does."
  - Since commit 4496587, #415 also plays the classical form (natural minor coming down), and its tip says which form is
    which. The lesson's two steps use only the jazz form, so a candidate for a classical-style exam never meets the
    classical form in the course.
  - Fix: reword ("…; classical theory comes down in natural minor, and #415 plays both"), and append a classical step.

### Misleading, imprecise or stale (texts)

- **W4. Click tips that the band has made stale.**
  - #119: "Lock with an imaginary kick drum: beats 1 and 3." (`grooves.js:129`). The band now plays a real kick under
    #119 by default.
  - The same applies to "sit slightly behind the click" (`licks.js:326`, `s5.js:726`).
  - And to Schism's summary "The click is every 8th." (`songs.js:412`) whenever a band pattern plays.

- **W5. "The darkest colours are the ♭5, the tritone, and the minor scale's ♭6."**
  - Where: `grooves.js:209`, `s3.js:234`.
  - With the serial comma it reads as three intervals, but the ♭5 *is* the tritone.
  - Suggestion: "the ♭5 (the tritone), the ♭6 and, in Phrygian riffs, the ♭2". That also names the colour that #350's
    breakdown vamp (Phrygian) actually uses.

- **W6. "Reggae leaves beat 1 empty".**
  - Where: `grooves.js:160`, `s3.js:826`.
  - My opinion: this is overstated. The "one drop" is the drummer's empty beat 1, and many reggae lines play through
    it; the app's own #351 rockers line has "beat 1 sounded".
  - Suggestion: "In the one drop the drums leave beat 1 empty; this line does too."

- **W7. Words used before they are taught.**

  | Where | Word or idea | Taught in |
  |---|---|---|
  | Lesson 3.40 (`s3.js:176–184`): "Mixolydian riffs", "A Mixolydian riff…" | Mixolydian | the modes unit, 3.21–3.22, later in Stage 3 |
  | Lesson 3.44 (`s3.js:270`): "over a Phrygian vamp" | Phrygian | the same modes unit |
  | Lesson 4.41 (`s4.js:855`): "the secondary dominants of church harmony" | secondary dominants | Lesson 5.28 |

  A one-line gloss in each would do, for example "Mixolydian: the major scale with a ♭7, the sound of a 7th chord".

- **W8. "no dots, by ear" on the row.**
  - The step's own tip says "from memory, with only the sound to follow", and the app's bass plays every note.
  - "By ear" promises ear work, which the step does not test. "No dots, from memory" says what it is.

- **W9. The naming rule: a living teacher's method named in prose.**

  | Where | Text |
  |---|---|
  | `s4.js:162` (Lesson 4.8) | "Gary Willis' fingerboard approach: …" |
  | `fretboardNotes.js:351` (#408 about) | the same sentence |
  | `triads.js:230` (#232 tip) | "Gary Willis' advice: …" |
  | `modes.js:197` (#513 Related) | "Pitch-axis theory (Joe Satriani)" |
  | `technique.js:624` (#502 Related) | "Dominique Di Piazza / Matthew Garrison right-hand approach" |

  - What the rule allows: a book by author and title (Willis's *Fingerboard Harmony for Bass* is already cited that way
    in the Related lines), and players "in the style of".
  - Suggestion: drop the names from the prose, and write "in the style of Dominique Di Piazza and Matthew Garrison".

- **W10 (low). "RSL's 'riff transposer'"** (`grooves.js:144`, #239) names an exam board's own section title. The rule is
  to name boards generically. Suggestion: "as graded rock exams ask".

### Checked and correct

I read every concept text of Stages 1–6 and the about texts listed in the setup. Among the facts checked:
- **Notes and the neck:** the bass-clef lines, spaces and ledger lines (above and below); landmark notes; unisons; the
  octave, 5th and 3rd shapes; the 10ths rule (G-string fret: same for minor, +1 for major).
- **Scales:** the major-scale fingering 2-4 / 1-2-4 / 1-3-4; the pentatonic boxes; the blues and major blues scales;
  the bebop scales landing chord tones; the 6th-diminished scale.
- **Chords and harmony:**
  - the four triads as stacked 3rds;
  - maj7 → °7 by one lowered note;
  - the 12-bar form;
  - harmonic and melodic minor and their chords;
  - the order of sharps and flats;
  - the four dominants from B°7;
  - C♯°7 = A7♭9;
  - the melodic-minor shortcuts;
  - the pentatonic superimposition sets;
  - upper structures (D/C, A/C7 = 13♭9);
  - Messiaen's transposition periods;
  - harmonic major's Mixolydian ♭2;
  - the harmonic chords (Em7, Esus2, Gmaj7, Cmaj7♯11);
  - the jazz-blues, Autumn-type, rhythm A, minor blues and minor bossa forms.
- **Rhythm:** groupings realigning after 3, 5 and 7 bars; the maqsum's dums on 1 and 3.
- **The song studies:** the facts about each song (keys, metres, chords).

The music the app teaches is right. The gaps are in what it does not teach.

---

## 2. The six learners

Each table gives: the gap, why it matters to this learner, where it belongs, what in the app it can be built on, its
size and its priority.

### 2.1 Absolute beginner adult (week 1 to year 1)

**Journey:**
- At 20–30 minutes a day, Stage 1 (22 lessons, 7 checkpoints, a test) takes about two to three months. Stage 2 (34
  lessons) takes most of the rest of the year.
- What works: the content is correct and in a good order, there is music from the first unit, and the drums now play
  under the grooves.
- Where it thins out: everything around *playing a song* (chord names, the form, what is written above the bars) and
  *hearing and playing back*.

| # | Missing | Why it matters to a beginner | Where | Build on | Size | Prio |
|---|---|---|---|---|---|---|
| B1 | **Playing a song from its chord names.** A four-chord chart (C – G – Am – F, with bar lines, a repeat sign, a verse and a chorus) played as roots with the neck empty. | Every beginner's first real task, at home or in a band, is "here are the chords". The course only gives Roman numerals with the dots lit. | S1 u-lines (after 1.14), again in S2 u-blues | `gr-roots` + `dots: 'hide'` + the chord lists of `songs.js` | M | Must |
| B2 | **Echo it back:** the app plays 1–3 notes (then a 1–2 bar riff) and the player plays them back. | The first ear skill of every method and exam, and how songs are learnt. Today ear means naming a chord quality to yourself (1.20, 2.18). | S1 u-notes, S2 u-intervals (content for the ear course) | `games.js` 'ear' rounds (tap first; later on the bass) | M | Must |
| B3 | **Slides, as a written and played articulation.** | The first articulation in every method, and in their first songs. Come Together style's own text says "notes slide", but the note model cannot write a slide. | S2 u-hands2 | note model, tab "/", staff "sl." (still open) | M | Must |
| B4 | **Time signatures and note values explained** (4/4 and 3/4; whole, half, quarter, 8th; dots and ties), as two paragraphs of theory, separate from the rhythm-reading course. | "Quarter note" is first used in 1.5 and never defined; "time signature" appears in no lesson text. | S1 u-time (1.5–1.7) | text only | S | Should |
| B5 | **Intervals named in full** (minor 3rd, perfect 5th, tritone) and inverted (a 5th up = a 4th down, which is why "the 5th below" in 1.13 is the same note). | 2.15 lists ♭2…7 as symbols only. The tap game #227 already speaks the full names: the lessons should too. | S2 2.14–2.15 | text | S | Should |
| B6 | **Real tunes they know**, played as written: public-domain tunes (folk and traditional songs, spirituals, early blues, classical themes), each with a bass line written for BassClass and the melody to read. | "Songs I know" is the strongest motivator. Every study is "in the style of"; a public-domain tune can be played as it goes. | S1–S2 make-music steps | `songs.js` part format (chords with slash basses already work) | M | Should |
| B7 | **The "why" of harmony:** tonic, subdominant and dominant; cadence names (V–I perfect, IV–I plagal, ending on V imperfect, V–vi interrupted). | 2.23 says "I is home, V is tension, IV going away", which is right but goes no further. Cadences are in the exams' ear tests (2.5). | S2 2.23, again in S4 4.17 | `PROGS` + `ear-progressions` | S–M | Should |
| B8 | **Tuning by ear:** the 5th-fret and harmonic methods, and tuning to the drone's A. | Useful without a tuner, a classic exam question, and it trains unisons by ear. | 1.1 (a line), 4.3 harmonics | drone, tuner | S | Nice |
| — | Tab explained, sore fingertips, "move on when stuck" | held with your week-1 care decision (2026-11-03): one line here only | | | | |

### 2.2 Teenage rock, pop and metal band player (1–3 years in)

**Journey:**
- My level places them around Stage 2–3. They enjoy:
  - #241 fills, #343 licks, #210/#308 pick, #350 metal;
  - Teen Spirit, Blitzkrieg, Longview, Hysteria, Schism and Anesthesia style;
  - the room's metal and pop-punk drums, and the tuner's Drop D.
- They hit three walls:
  - they cannot play *their band's songs* from the chart;
  - the neck and the riffs stay in standard tuning;
  - the room plays grooves the Library never teaches.

| # | Missing | Why it matters | Where | Build on | Size | Prio |
|---|---|---|---|---|---|---|
| T1 | **The band chart: making a part.** Chord symbols with power chords and slash chords (E5, D/F♯), Nashville numbers, a road map (intro, verse, chorus, bridge, repeats, 1st/2nd endings, D.S. al Coda), stops and hits. Then "Your line": a part of their own against a short rubric (root on 1, lock with the kick, lead into the chorus). | This is the whole job in a band. "slash", "song form", "Nashville" find nothing in the Library. Still open (pedagogue M1); it is the biggest gap for this learner. | S2 (chart unit), S3–S4 "Your line" steps | the tab strip as a chart, `songs.js` chord lists, band drums | L | Must |
| T2 | **Arranging the bass under guitars:** double the riff, hold the root under power chords, a counter-line, when to play less (verse soft, chorus loud is already in Teen Spirit style). | Rock players' first musical decision. Today every line is prescribed. | S3 u-rock3 | `lickTemplate` variants over one riff | M | Should |
| T3 | **Writing a riff:** two bars from the pentatonic, call and answer, moved through I–IV–V. | Teens write songs. 3.15 and 4.14 say "make up each fill"; no step ever asks for a riff. | S3 u-rock3 | the minor-pentatonic `riff` groove, the `dots: 'hide'` step | M | Should |
| T4 | **Grooves the room plays but no exercise teaches:** reggaeton (dembow, the tresillo bass), trap (long 808-style notes, half time, glides), Afrobeats/amapiano, dance-pop/house octaves. | The drum library has "Reggaeton (dembow)" and "Trap (half-time)" (`practice/styles.js`); "reggaeton" and "afrobeats" find nothing in the Library. These are the charts teenagers hear today. | S3 u-styles3 / S4 u-styles4 | `GROOVES` + `band.js` patterns that exist | M | Should |
| T5 | **Fills beyond one bar:** a set-up into the chorus, a 2-bar break, landing with the drummer's fill, where fills go in a form (end of 4/8/16). | #241 is "a bar of groove, then a short fill". Band players ask "when?" more than "what?". | S2 2.33 → S3 | `rock.js` + the room's `phraseHits` fills | M | Should |
| T6 | **Learning a song by ear**, as a method: find the key with the drone, roots first (the #113 and #227 games train exactly this), the form, then loop the progression in the room. | Most band players learn from records. Still open (pedagogue S10), now buildable from tools the app has. | S2 or S3, one lesson | drone, tap games, room progressions | S | Should |
| T7 | Drop D, E♭ and D standard **on the neck and in riffs** (the tuner already has them). | Metal and grunge riffs live on the open low D. Still open; one line. | — | `TUNINGS` | L | Should |
| T8 | **Tremolo picking and thrash down-picking endurance** as an exercise (today only inside the Anesthesia study). | Metal's two core picking skills. | S3 3.41 | #210 and #308 patterns | S | Nice |
| T9 | **Melodic bass in post-punk and indie:** high-register hooks with a pick, the bass as the lead. | A style many teens love; nothing plays above the 12th fret as a hook. | S3–S4 | `lickTemplate` | M | Nice |

### 2.3 Intermediate funk, soul and R&B player

**Journey:**
- Stage 3's "16ths and funk"; #340, #437, #450, #533;
- slap (#344, #442, #443, #545);
- the studies (Billie Jean, Good Times, Smooth Criminal, Can't Stop, Sir Duke, What's Going On, Dean Town);
- the band's funk patterns.

The vocabulary is there as one-bar cells. What is missing is the *system*: how funk phrases are built, how they feel,
and the harmony gospel and R&B players actually play.

| # | Missing | Why it matters | Where | Build on | Size | Prio |
|---|---|---|---|---|---|---|
| F1 | **Syncopation families as funk vocabulary:** "the One" with space, the anticipation of 1 (the "a" of 4), 16th pushes into chord changes, Motown dotted-8th pickups, octave stabs. Each family as 2-bar phrases with a question, an answer and a variation. | #310 lists the 15 cells and #214 the anticipations, but no groove is built *from* a family. Every groove is a one-bar cell repeated (`GROOVES` in `grooves.js`). | S3 u-funk → S4 | `grooves.js` (two-bar `bars`), #310, #214 | M | Should |
| F2 | **Swung 16ths** (neo-soul, New Orleans, hip-hop) and **pocket placement** (on, behind and ahead of the beat, heard against the band). | The feel that defines modern R&B. "swung 16" finds nothing; the band already swings 16ths on triplets; #437's text asks for "slightly late" while its demo is on the grid (still open). | S4 u-grooves4 | `swing()` for 16ths, band | M | Should |
| F3 | **The harmony gospel and R&B bassists play:** passing diminished chords (I – ♯I°7 – ii, IV – ♯IV°7 – I/5), 3-6-2-5-1 chains, inversions and slash basses (I/3, IV/5), chromatic walk-downs, line clichés; gospel fills ("chops"). | #450 and 4.41 name "the secondary dominants of church harmony" and stop there. No passing diminished outside the jazz blues's bar 6; no slash bass anywhere in `PROGS`. | S4 4.41 → S5 u-harmony5 | `PROGS` (+ a bass note per chord), #532, #450 | M | Should |
| F4 | **Hits, stops and horn unisons from a chart:** play the ensemble figure with the band, then groove. | Session and function work; Sir Duke style shows the sound but not the reading of it. | with T1 | chart view | M | Should |
| F5 | **Three-finger plucking and Motown thumb muting** as exercises; staccato by left-hand release as a choice. | Fast 16ths at tempo, and the vintage soul sound. "three-finger" finds nothing; mentioned only in tips (4.2). Still open. | S4 u-stamina | #403, #101 | S–M | Should |
| F6 | **Advanced groove content at Levels 5–6:** odd-time funk at speed, ghost-note density, fusion 16ths, soloing over a funk vamp. | One groove exercise in Levels 5–6 (#533). Still open (pedagogue S1/S2): the Pro levels offer this player almost nothing. | L5–L6 | `grooves.js`, `rock.js` | L | Should |
| F7 | **Slap beyond the basics:** left-hand slap, double-stop pops and slap chords, open–hammer–pluck triplet "rolls". | Modern slap vocabulary. | L5 #545 | slap module | M | Nice |

### 2.4 Jazz student heading for a jazz-school audition

**What an audition typically asks** (generically):
- the head of a tune;
- 2–3 choruses walked from a lead sheet on a blues and a standard, at a medium and an up tempo;
- a ballad;
- a chorus of solo;
- reading;
- call and response by ear.

**What the app has:** the walking pipeline (two-feel to Coltrane), licks, chord-scale and every key, all strong.

**What is missing:** what turns that into an audition.

| # | Missing | Why it matters | Where | Build on | Size | Prio |
|---|---|---|---|---|---|---|
| J1 | **Walking from a lead sheet:** the chord chart only, the player's own line, the band on. A ladder from two-feel to 4/4 to two chords a bar. | The audition's core task. Every walking step plays the app's own line (still open, pedagogue M1). | S3 3.37 → S6 | the chart of T1, `dots: 'hide'`, band | L | Must |
| J2 | **The forms of the standards, as "changes":** rhythm changes as one 32-bar AABA (the A and the bridge exist only apart: `rhythm-A`, `rhythm-B`); a generic AABA standard with a bridge to IV; an ABAC standard; the Bird blues; a jazz-waltz form; a ballad form; a Latin A / swing bridge tune; intros and endings (I–VI–ii–V vamp, ♭VI–♭II–I, the 3× tag). | `WALK_PROGS` holds 9 progressions, the longest 16 bars. Auditions name tunes by form ("a rhythm-changes tune, a minor blues, a ballad"), and the room already names forms this way ("Blue Bossa changes", "So What changes"). | S4 u-walking4 → S6 u-coltrane | `PROGS`, `WALK_PROGS`, room Jazz group | M | Must |
| J3 | **The audition's tempo range:** a ballad two-feel at 50–70, and up-tempo walking at 220+ (in two, or half time, when it gets fast). | The course's walking goals top at 152 (rhythm changes, Stage 5 test) and 180 (Giant Steps, Stage 6 test); "ballad" in jazz finds nothing. | S5–S6 steps | append steps | S | Should |
| J4 | **Heads: playing a melody on bass**, read from the staff with the chords behind (original heads in jazz style, or public-domain melodies). | "Play the melody, then walk" opens most auditions (still open, pedagogue S4). | S4–S6 | `songs.js` and `lickTemplate` | M | Should |
| J5 | **Chord-symbol dialects:** C−7, CΔ7, Cø, C°7, C+, C7alt, C7(♭9), C6/9, Csus, C/E. | Real lead sheets use them all; the app writes one dialect only ("Δ" in no file). Reading the symbol is the first step of J1. | S3 3.31 chord formulas | `theory.js` `sym`, a tap quiz | S | Should |
| J6 | **Jazz ear:** call and response (2-bar swing phrases), major vs minor ii–V–I, hearing the bass's own line (dictation), the colour note of a mode over the drone. | Auditions test it; the course has no ear step after 4.20. Content for the ear course. | S4–S6 | tap 'ear' rounds, drone | M | Must |
| J7 | **A transcription lesson** (method only, the player's own records): sing it, slow it, find it on the neck, write it, play along. | The jazz student's main study tool; "transcribe" finds nothing (still open). | S5 | text + the room's drone | S | Should |
| J8 | **Broken two-feel and skips, pedal-point intros, trading fours** (the room's muted bars as the drummer's four). | Band skills between walking and soloing. | S5 u-walking5 | room muted bars | S–M | Nice |
| J9 | **Reading past Level 4:** a written walking line in quarters, high-register lines with 8va, ledger lines below the staff for the low B. | Auditions sight-read; reading stops at #409 (Level 4). Content for the reading course. | L5–L6 | `staff.js`, existing rhythms | M | Should |

### 2.5 Graded-exam candidate (rock/pop and classical-style boards: RSL, LCM, Trinity)

**Exam sections against the app:**

| Exam section | BassClass covers | A candidate would still miss |
|---|---|---|
| Pieces | 30 original style studies, grooves in many styles | pieces at exam length with sections, dynamics and a road map; public-domain pieces and studies for classical-style boards |
| Technical work | scales, arpeggios and modes in every key, one and two octaves: excellent | articulation versions (legato, staccato); a per-level list "from memory, at these tempos" |
| Sight reading | pitch to Level 4 | rhythm reading (on hold); pitch at Levels 5–6 |
| Improvisation or interpretation from a chart | — | a chord chart and an improvised part (T1, J1) |
| Ear tests | intervals (#227), chord quality and progressions (self-check) | melodic recall (B2), rhythm recall (on hold), cadences (B7), recognising a feel or a fill |
| Musicianship questions | — | the symbols on the page, Italian terms, instrument knowledge, theory about the piece |
| Quick study | — | needs rhythm reading and audio: on hold |

| # | Missing | Why it matters | Where | Build on | Size | Prio |
|---|---|---|---|---|---|---|
| E1 | **"Theory, tap it":** short questions answered on the neck. For example: the 3rd of E♭7; the root of the key with 3 flats; the relative minor of F; the V of D; a perfect 4th above A; the bass note of G/B; the ♭9 of G7. | Exams ask theory and musicianship questions at every grade, and today theory is never checked (still open, pedagogue S8). The tap engine's 'find' rounds already ask "find C". | at the end of each theory lesson; a Library game per level | `games.js` 'find' kind | M | Must |
| E2 | **The symbols on the page and the instrument:** repeat signs, 1st/2nd endings, D.C./D.S./Coda, dynamics and hairpins, staccato, tenuto, accent and slur, fermata, tempo terms (Andante, Allegro, rit.); the bass's parts, pickups and controls. | Asked in the spoken or written questions; none of these words appear in the course ("Italian", "Allegro": nothing; the room names "Moderato" only). | S2 u-reading2, S3 | text + E1 quiz | S–M | Should |
| E3 | **Articulation in technical work:** each scale and arpeggio legato or staccato, and slurred pairs. | Classical-style boards ask for it; rock boards ask for clean note lengths. Waits for the articulation model (B3). | #114, #317, #234 | a note-length option (the muting drill has "Note length") | M | Should |
| E4 | **Études and public-domain pieces with expression** (studies by 19th- and early-20th-century double-bass teachers, Bach cello-suite movements, traditional tunes), each checked as public domain. | Classical-style boards and teachers use them; they train reading, phrasing and dynamics together. | L2–L5 make-music | `songs.js` | M | Should |
| E5 | **A "Technical work" view per level:** the scales and arpeggios a candidate plays from memory, with target tempos, and the no-dots setting. | Exam preparation is a checklist. ★ Core essentials is close: same mechanism. | Library topic | `star`-like flag, `dots: 'hide'` | S | Nice |

### 2.6 Teacher planning a year for mixed students

**Mapping the course onto a teaching year:**
- Beginners: Stage 1 in the first term, Stage 2 for the rest of the year.
- Intermediates: Stages 2–3.
- Advanced: Stage 4 and up, with a choice between the jazz track (Stages 5–6) and the styles of Stages 2–4.

**What the teacher would supplement from elsewhere, in the order a year needs it:**

| # | Supplement | Why the app cannot carry it today | In-app remedy (if any) | Size | Prio |
|---|---|---|---|---|---|
| P1 | Posture, physical technique, tone | no drawings (your decision), the app cannot see | — (the teacher's job) | — | — |
| P2 | Rhythm reading, sight reading | on hold | (the reading course) | — | — |
| P3 | Chord charts, song form, making a part, improvising | missing | T1 / J1 | L | Must |
| P4 | Ear: echo, dictation, cadences, transcription | thin; no ear in Stages 5–6 | B2, B7, J6, J7 | M | Must |
| P5 | Slides, vibrato, bends, articulation marks | not in the note model | B3 | M | Must |
| P6 | Theory homework and checks | self-ticked "I can" lines | E1, E2 | M | Must |
| P7 | The students' own songs as written | studies are "in the style of" | public-domain tunes (B6); the student's chart in the room | M | Should |
| P8 | **Ensemble material:** bass duets and parts for a group class | nothing plays a second bass part | a second voice in the `songs.js` format, played by the app or a classmate | M | Nice |
| P9 | **Listening per style:** what to listen to for reggae, Motown, bebop… | the app names records only for its studies | a "Listen to" line per groove style (named records, no links, as the studies already name songs) | S | Nice |
| P10 | The instrument: strings, setup, amp and EQ, gear for each style | nothing | text (E2) | S | Nice |
| P11 | How to practise | still open (pedagogue S9) | one lesson in Unit 1 | S | Should |

The teacher will also notice the balance (§0): 42% of the course is scale, chord and harmony drills; under 5% is ear
and reading; Stages 5–6 have none of either.

---

## 3. Deeper content that cuts across learners

| # | Missing content | Who needs it | Where | Build on | Size | Prio |
|---|---|---|---|---|---|---|
| X1 | **The tresillo (3-3-2) and the clave** (son 3-2 and 2-3, rumba): the rhythm under reggaeton, Afrobeats, much pop, the baião and the tumbao. The tumbao must sit with the clave's direction. | Teen (T4), funk, Latin, exam | Rhythm module at L2–L3; 3.35 and 4.39 | the room's "Mambo (2-3 son clave)" and "Rumba (3-2 rumba clave)" patterns exist; `rhythm.js` | S–M | Should |
| X2 | **Bass lines under slash chords:** the descending pop bass (I – V/7 – vi – I/5 – IV), line clichés (Cm – Cm(maj7) – Cm7 – Cm6; C – C+ – C6 – C7), pedal points under moving chords, inversions as a bass choice. | Beginner, teen, R&B, jazz, exam | S2 u-blues (pop), S4 u-voicelead, S5 | `PROGS` with a bass note per chord; `songs.js` already reads "D/F#" | M | Should |
| X3 | **Half-time and double-time feel:** the same groove switched into half time (a breakdown) or double time (a chorus lift); the jazz two-feel at fast tempos. | Teen, funk, jazz | S3–S4 | grooves; band patterns have half-time versions (Trap, breakdown) | S–M | Should |
| X4 | **Grooves as phrases:** 2- and 4-bar grooves with a variation and a fill bar, per style (still open, musician S8; F1 is its funk case). | All groove players | all groove units | `grooves.js` `bars` holds several bars | M | Should |
| X5 | **Odd metres past 7:** Balkan 9/8 (2+2+2+3), 11/8, 13/8 grooves. | Advanced, prog | L5 | the room already regroups 9 and 11 | S–M | Nice |
| X6 | **Country and bluegrass beyond the two-beat:** walk-ups between I–IV–V, train beat, bluegrass in 2. | Teen (country), exam | L3 | "Bluegrass (brushes)" and "Country shuffle" drums exist | S | Nice |
| X7 | **Style studies in the missing styles:** the 30 Make Music studies are rock, pop, funk and fusion. None is jazz swing, reggae, Latin, country, gospel, a blues shuffle or a ballad. | All | L2–L5 | `songs.js` | M | Nice |

---

## 4. Already strong (for proportion)

- **Correct music everywhere I looked:**
  - academic spelling, chord symbols, Roman numerals and engraving;
  - every theory claim in the stage texts I checked (§1).
- **Harmony and the neck:** triads, 7ths, inversions, voice leading, extensions, chord-scale and every key. It goes
  deeper than any method book.
- **The walking pipeline:** from the two-feel to Coltrane. The jazz licks, motifs and solo devices are original.
- **Time:** pulse, the subdivision pyramid, the 16th grid, displacement, odd metres with the player's own groupings,
  polyrhythms and the gap click.
- **Style breadth since 10-29:** the band under 74 exercises; rock, metal, reggae, Latin, world, hip-hop, gospel and
  3/4–6/8–12/8 grooves; fills and rock licks at Levels 2–3; the pick and slap in the core path.
- **Ear games with real answers** (#227, #113, #316) and the reading game: the engine the missing ear and theory
  content needs.

---

## 5. Questions for the owner

1. **Reading at Levels 5–6.** A written walking line in quarters, or a high-register line in 8ths, needs no new rhythm
   mechanic. May the pitch side of the reading course (J9) start before rhythm reading?
2. **Public-domain repertoire (B6, E4, J4).** Shall we add traditional tunes and public-domain classical pieces, played
   as written? Each would be checked one by one (the composer's death plus 70 years in the EU, the publication date in
   the US) and arranged by us.
3. **The naming rule (W9).** Shall the three "Gary Willis'" sentences go, and the Satriani and Di Piazza/Garrison
   Related lines become "in the style of"?
4. **When the ear course is built,** should Lesson 2.16 "Hear the interval" use the tap game #227? It recognises a
   hidden interval. #225, which the lesson uses today, names the next note before it sounds.
5. **The no-dots test steps.** Should they also turn the app's bass off, so the step tests memory rather than following
   the sound? This is a question only: the no-dots step is your 2026-11-03 decision.

---

## 6. Top 15 across all learners

| # | What | Learners | Size | Prio |
|---|---|---|---|---|
| 1 | **W1, URGENT:** a Stage 1 test key the lessons never used (D from the A string or B♭ from the E string), with a `CHANGED_STEPS` entry | beginner, teacher | S | Must |
| 2 | **The chord chart and "Your line"** (T1, J1, B1): chord symbols, slash chords, form and road map, then the player's own part with the band, in a ladder from Stage 1 to Stage 6 | all | L | Must |
| 3 | **Echo and call-and-response on the tap engine** (B2, J6): content for the ear course, with ear steps in every stage test | all | M | Must |
| 4 | **"Theory, tap it"** (E1): knowledge checks on the neck at the end of theory lessons and as a game per level | exam, teacher, beginner | M | Must |
| 5 | **Slides, vibrato, bends, staccato and legato, P.M.** in the note model, tab, staff and sound (B3, E3) | all | M–L | Must |
| 6 | **Jazz forms as changes** (whole rhythm changes, AABA, ABAC, Bird blues, ballad, waltz, intros and endings) and the audition's tempo range (J2, J3) | jazz, teacher | M | Must |
| 7 | **The three wrong texts W2–W3**, and the stale click tips (W4) | all | S | Must |
| 8 | **Bass lines under slash chords:** clichés, descending lines, pedals, passing diminished (X2, F3) | beginner, teen, R&B, jazz | M | Should |
| 9 | **Tresillo and clave, then reggaeton, trap and Afrobeats grooves** for the patterns the room already has (X1, T4) | teen, Latin, funk | M | Should |
| 10 | **Theory explanations as content:** time signatures and note values, full interval names and inversion, cadences and function, chord-symbol dialects, the symbols on the page and Italian terms (B4, B5, B7, J5, E2) | beginner, exam, jazz | S–M | Should |
| 11 | **Groove phrasing:** funk vocabulary families as 2–4-bar phrases with variations, swung 16ths, half and double time (F1, F2, X3, X4) | funk, teen | M | Should |
| 12 | **Public-domain tunes, heads and studies** to read and play as written (B6, J4, E4) | beginner, jazz, exam, teacher | M | Should |
| 13 | **"Learn a song by ear" and "Transcribe a line"** method lessons, built on the drone, the room and the tap games (T6, J7) | teen, jazz, teacher | S | Should |
| 14 | **Arranging and writing:** the bass under guitars, writing a riff (T2, T3) | teen, teacher | M | Should |
| 15 | **Advanced groove, funk and rock content at Levels 5–6** (F6): the Pro levels for non-jazz players | funk, teen | L | Should |

Text fixes to batch with item 7: W5 (♭5 = tritone), W6 (reggae beat 1), W7 (glosses for Mixolydian, Phrygian and
secondary dominants), W8 ("from memory"), W9 (naming rule), W10 (exam board).
