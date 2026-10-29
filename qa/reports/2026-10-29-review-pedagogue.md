# Pedagogue review · 2026-10-29 (commit 39bca42)

**The question:** what is missing, or weak, for BassClass to be a complete and credible method for learning the electric
bass, from the first open string to an advanced player. Gaps first; praise only to keep them in proportion.

**Who is speaking:** a bass teacher with conservatory and music-education training, who writes curricula and prepares
students for rock/pop and jazz graded exams and jazz programmes.

**What I read:**
- `CLAUDE.md`, including the decisions QA must not re-report.
- `README.md`, `docs/CATALOGUE.md`, `docs/RESEARCH.md`, `LAUNCH-TODO.md`.
- `qa/reports/2026-10-28-launch-product.md`. I do not repeat it: onboarding, retention, the Pro tasters, the listing and
  accessibility are covered there.
- All six stage files and `course/placement.js`. I also read the module files where a claim needed checking
  (`curriculum/reading.js`, `rhythm.js`, `intervals.js`, `scales.js`, `technique.js`, `player.js`, `ui/exercise.js`).

**What I used:**
- My own `qa` server (port 8878), in my own tab, at 800×380.
- The owner's saved profile (a 5-string bass, A4 = 441). I copied its localStorage to sessionStorage first and put it
  back at the end (11 keys, identical). Then I reset the viewport and stopped the server.
- Screens: Home, My level, lesson pages in Stages 2, 4 and 6 ("Read more", steps, "Watch out"), the exercise screen
  (wk-approach from a lesson, the interval quiz and the progression quiz stepped note by note), the Practice room and the
  tuner.

**How I measured the course:** I loaded `course/data.js` and the exercise list in the page and counted every step of
every lesson, checkpoint and stage test by its exercise's topic: 254 lessons, 629 steps. The table is in §1.

---

## Verdict

BassClass is the most thorough **fretboard-harmony and technique trainer** I have seen in an app:
- every scale, chord, inversion and voice-led line, in every key;
- fingered properly for 4, 5 and 6 strings, spelled correctly and engraved properly;
- wrapped in a well-designed course with spaced reviews.

It is not yet a complete **bass method**. The gaps are in the strands that turn a player who knows the neck into a
bassist:
- **Making your own part** from a chord chart.
- **The ear**: playing back what you hear, transcribing.
- **Reading rhythm** and sight-reading past the early grades.
- **Groove with a drummer**, and in the styles beyond jazz.
- **Articulation**: slides, vibrato, note length.
- **Honest assessment.** The player follows lit dots while the app's bass plays the same notes, then ticks ✓ Clean
  after one loop. A pass shows the app can play the line. It does not show the player can.

Almost half the course (46% of its steps) is scales, modes, triads, arpeggios and harmony. Reading is 3.5% and ears 2%.
Grooves vanish after Stage 4.

Most fixes reuse what the app already has:
- the staff engine;
- the generators;
- Quiz mode;
- the bass-sound toggle;
- the Practice room's drum engine;
- the microphone.

---

## 1. Where the course spends its time

Steps per topic, in course order (lessons, checkpoints and stage tests; 629 steps):

| Topic | S1 | S2 | S3 | S4 | S5 | S6 | Total | Share |
|---|---|---|---|---|---|---|---|---|
| Scales | 10 | 4 | 27 | 25 | 21 | 10 | 97 | 15% |
| Triads | 7 | 9 | 10 | 18 | 18 | 12 | 74 | 12% |
| Technique | 6 | 17 | 15 | 9 | 14 | 3 | 64 | 10% |
| Arpeggios | 0 | 7 | 9 | 13 | 17 | 8 | 54 | 9% |
| Grooves | 10 | 13 | 14 | 8 | **3** | **0** | 48 | 8% |
| Rhythm | 11 | 8 | 4 | 16 | 5 | 0 | 44 | 7% |
| Fretboard | 15 | 11 | 5 | 3 | 0 | 0 | 34 | 5% |
| Harmony | 2 | 8 | 10 | 5 | 4 | 4 | 33 | 5% |
| Modes | 0 | 0 | 4 | 8 | 15 | 6 | 33 | 5% |
| Song studies | 4 | 6 | 5 | 4 | 5 | 6 | 30 | 5% |
| Walking | 0 | 0 | 7 | 7 | 13 | 3 | 30 | 5% |
| Licks | 0 | 0 | 0 | 0 | 21 | 9 | 30 | 5% |
| **Reading** | 4 | 10 | 4 | 4 | **0** | **0** | **22** | **3.5%** |
| Intervals | 0 | 9 | 3 | 6 | 2 | 0 | 20 | 3% |
| **Ear** (incl. the interval quiz) | 1 | 5 | 3 | 3 | **0** | **0** | **12** | **2%** |
| Slap (all optional) | 0 | 0 | 2 | 2 | 2 | 1 | 7 | 1% |

The material is right. The balance is not.

**How the graded exams compare:**
- Rock/pop graded exams spend a fixed share of every grade on unseen work: sight reading, or improvising a part from a
  chord chart. At the higher grades they add a "quick study" piece, learnt from a recording and a chart.
- They give a separate share to ear tests (melodic and rhythmic recall) at every grade.
- Jazz exams and auditions ask for the melody of a tune, choruses of walking from a lead sheet, a solo, and call and
  response by ear.

**How BassClass compares:** the course has almost nothing of these strands after Stage 4, and no stage test contains
an ear step.

### Coverage against a full method

| Area | State | Note |
|---|---|---|
| Posture, holding, tuning | Partial | Text only (lesson 1.1); no drawing; posture drawings are planned after the launch |
| Plucking hand (i-m, raking, string crossing, p-i-m) | Strong | |
| Fretting hand (one finger per fret, Simandl, shifts, stretch, permutations, legato) | Strong | |
| Muting | **Weak** | One lesson (2.2), two short paragraphs, never revisited |
| Articulation: slides, vibrato, bends, staccato and legato marks, palm mute | **Missing** | Only H, PO, ghost notes and harmonics exist |
| Dynamics | Partial | One lesson (2.29 "Loud and soft"), plus the song studies' sections |
| Pick | Weak | One optional lesson in Stage 2 |
| Slap, tapping, double thumbing, sweeps | Good | Slap, tapping and double thumbing are optional and outside every checkpoint |
| Fretless, intonation | Missing | |
| 5- and 6-string, other tunings | Weak | The fingering supports them; nothing teaches them; no drop D |
| Pulse, subdivision, odd metres, polyrhythm, gap click | Strong | |
| Groove and feel, playing with drums | **Weak** | No drums in exercises; few styles; nothing after Stage 4; no 3/4 |
| Reading pitch | Partial | Ends at Level 4 |
| Reading rhythm, sight-reading | **Missing** | Quarters, halves, dotted quarters and 8ths only; no rests, ties, 16ths or syncopation |
| Chord charts, slash chords, song form | **Missing** | |
| Theory (scales, chords, harmony) | Very strong | |
| Theory knowledge checks | Missing | Only self-ticked "I can" lines |
| Ear: chord quality, progressions | Partial | |
| Ear: melodic and rhythmic recall, transcription | **Missing** | |
| Improvising, creating lines | **Weak** | Licks and motifs are prescribed; 5 "now your own" prompts |
| Repertoire | Good | 30 original song-style studies; no melodies or heads; no full jazz forms |
| Performance, playing with others | Missing | The Practice room has the tools; the course never uses it |
| Practice skills | Partial | The session plan is strong; no A–B loop; how to practise is never taught |
| Assessment | **Weak** | Self-ticked, one loop, cues always on, tests on rehearsed material |

---

## 2. Must have

### M1. Creating your own part from a chord chart, and reading the chart (L)

**What is missing:**
- Every step plays a line the app wrote. The player is never asked to make a part from chord symbols with clear
  criteria.
- There is no chord-chart view: slashes, bar numbers, repeats, 1st and 2nd endings, D.S. al Coda, hits, stops and
  pushes.
- Slash chords, the bassist's own symbol (C/E, G/B, the descending pop line C – G/B – Am – C/G – F), are never taught.
- Song form (verse, chorus, bridge, AABA, choruses) is never taught as something to keep track of.

**Evidence:**
- `chart`, `slash`, `D.S.` and `coda` have no hit in `course/stages/*.js`.
- "Make your own line" appears in 5 steps, all added to the pentatonic units on 2026-10-28. For example, `s3.js:330`:
  "Then play your own line over the same chords". It is tacked onto a step whose written line is still on screen and
  sounding.

**Why it matters:**
- This is the core working skill: most bass parts are made up from a chart, not read note for note.
- Rock/pop graded exams test it: a chord chart and an improvised part, alongside sight reading at the lower grades.
- Jazz exams and auditions test it: walk choruses from a lead sheet.
- A student who has only ever played prescribed lines freezes in front of a chart, however many arpeggios they know.

**Suggestion:**
- **A "Your line" step type:**
  - The backing loops the progression, with drums when M7 is done.
  - The strip shows only chord symbols, slashes and form marks.
  - The app's bass is off.
  - The neck shows the chord tones faintly at first; they fade as the stage rises.
  - "Hear an example" plays the app's generated line once.
  - The pass is the player's own tick, against a short rubric on screen: root on beat 1; chord tones on strong beats; a
    lead into every change; the time never stops.
- **A ladder through the stages:**
  - S1: roots in 8ths.
  - S2: R-5-8 and lead-ins, slash-chord bass lines.
  - S3: chord tones and the world feels.
  - S4: walking from a lead sheet.
  - S5: two chords a bar, minor forms.
  - S6: a whole 32-bar form.
- **A short chart-reading unit in Stage 2 or 3:** repeats, endings, D.S./Coda, hits and stops, slash chords, counting
  bars in a form.
- The chart view can reuse the tab strip.

### M2. The ear: thin, mostly recognition, partly invalid, never tested (M)

**What is missing:**
- Melodic recall: hear a riff, play it back.
- Rhythmic recall or dictation.
- Transcribing a bass line.
- Finding the key or tonic of a piece.
- Naming cadences.
- Hearing the bass note of an inversion.

**Evidence:**
- 12 of 629 steps are ear steps (2%).
- The last ear lesson is 4.20 "Hear the progression". Stages 5 and 6 have none.
- **No stage test contains an ear step.** Only 4 unit checkpoints do: u-intervals, u-triads2, u-sevenths3, u-modes4.
- **The interval quiz (#224) shows the answer before it sounds.** I stepped through it: after the root C, the corner
  reads "next G" before the G plays. Its own text says so ("the next note's name shows in the corner").
  - It is the course's only interval-hearing lesson (2.16 "Hear the interval: sing the second note before it sounds").
  - It trains singing a *named* interval, which is useful, but no step anywhere asks the player to recognise an interval
    whose name is hidden.
  - The rule in CLAUDE.md, "the next-note preview never shows an answer", covers the ear module, not this quiz.
- The ear quizzes take no answer: the player says it in their head, sees the reveal, and nothing is scored.

**Why it matters:**
- The exams test aural skills at every grade: melodic and rhythmic recall at the lower grades, harmonic recognition and
  call and response higher up.
- A bassist's ear is how lines are learnt from records and how they play with other people.

**Suggestion:**
- **(a) "Play it back":**
  - The app generates a 1–2 bar riff from the key's pentatonic or scale, with rhythm cells from the player's level.
  - It plays it two or three times with the notes hidden and leaves the next bar empty for the player.
  - Then it shows the riff.
  - The levels climb: three notes on one string; two bars across strings; syncopated 16ths; with a chromatic approach.
- **(b) "Hear the rhythm":** a one-bar rhythm plays; tap the one of three written bars that matches.
- **(c) The interval quiz:**
  - Add a "Recognise" mode: the name is hidden until after the second note.
  - Rename the current mode "Sing it".
- **(d) Answers and scores:** answer buttons on the ear quizzes, and a "% right" per type (major/minor, 7ths, I–IV–V…),
  kept in the progress.
- **(e) In the course:**
  - One ear step in every stage test and every second checkpoint.
  - Ear units continued in Stages 5–6: hearing ii–V–I in minor, altered dominants, modes over a drone, root motion in a
    whole form.

### M3. Reading stops at 8th notes and at Level 4 (M–L)

**Evidence:**
- **The rhythms are early-grade only.** `curriculum/reading.js` `CELLS` holds quarters, halves, dotted quarter + 8th and
  8th pairs; `ENDS` holds halves or a whole note.
- **None of this appears:** rests, ties, 16ths, syncopation, triplets, 3/4 or 6/8, dynamics or articulation marks.
- **Every line is four bars of 4/4.**
- **The low B is never read.** Pitches come only from E–G (`STRINGS4`), so a 5-string player never reads below the E.
- **Reading ends at Level 4.** The last reading exercise is #409. That is 22 steps of 629, none in Stages 5–6.
- **Rhythm reading is memorised, not read.** The rhythm drills are fixed patterns (`rhythm.js` uses no randomness), so
  they are learnt by heart after a few loops. Nowhere does the player read an unseen rhythm.
- **The engraving can already do it all.** The staff engine already engraves ties, rests, tuplets, dynamics and
  compound time (CLAUDE.md, Notation), so the gap is content, not the engine.

**Why it matters:**
- Sight reading runs through the rock/pop grades and every jazz and conservatory programme. At the higher grades it
  includes 16ths, syncopation across the bar line, ties, rests and dynamics.
- Session and theatre work depend on it.
- A course that claims to reach mastery, with reading frozen at the level of a second-year student, will not convince a
  teacher.

**Suggestion:**
- The roadmap's phase 3 ("reading course, tap the note on the neck") is about pitch. Make **rhythm** its core.
- **(a) Random rhythm reading by level:**
  - L1: quarters and rests.
  - L2: 8ths, dotted notes, ties.
  - L3: the 16th cells and syncopation.
  - L4: 16th syncopation with ties and rests, triplets, 6/8.
  - L5: mixed tuplets and odd metres.
  - First on one note, then inside the melodies.
- **(b) A sight-reading "one take" mode:**
  - a line generated fresh each time, with a count-in;
  - no loop, no step mode;
  - nothing on the neck until each note sounds.
- **(c) Reading in Stages 5–6:**
  - a written walking line;
  - a written funk part with ghost notes and rests;
  - high-position parts with 8va;
  - on 5- and 6-string basses, ledger lines below the staff.
- **(d) Dynamics and articulation marks** (staccato, accent, tenuto) on the reading staff.
- Bellson and Breines's *Modern Reading Text in 4/4* is the standard model for graded rhythm cells.

### M4. The cues never fade, and a pass does not show the player can play it (S–M)

**Evidence:**
- **No step ever sets the Reveal mode:** there is no `reveal` in any stage file. Every step runs with the lit dots and
  the next-note arc. Lesson 1.12 even teaches the habit: "Look ahead: the next dot shows where to go" (`s1.js:254`).
- **The app's bass doubles the player.** The exercise has a bass on/off button, but no step turns it off.
- **One loop and a self-tick make a pass.** A step passes on one full loop at the goal tempo plus the player's own
  ✓ Clean. "Clean" is defined only inside a tip: "every note in time, even and clear".
- **The tests and reviews check the rehearsed version:**
  - **Stage tests use material already practised, often in the lesson's key.** The Stage 1 test's can-line says "the
    major scale … in any key", yet its step plays E major from E.
  - **Reviews replay the lesson's last plain step**, same options, same key (`reviewStep` in `ui/course.js`).

**Why it matters:**
- Cues that are always present become the skill: the player learns to follow dots. This is the "guidance effect" of
  motor learning.
- A single loop measures one lucky pass, not retention. Teachers ask for "three in a row".
- Since the app cannot hear the player, its criteria and the way it fades the cues are the only quality control it has.

**Suggestion** (mostly data and a few flags):
- **(a) Fade the cues:** each lesson's last step, and every checkpoint and test step, opens in Quiz or Shape reveal with
  the bass sound off: "now from memory: the dots only confirm what you played".
- **(b) Ask for consistency:** a pass is 2–3 full loops in a row at the goal. The player already counts its loops
  (`loopN`).
- **(c) Define "Clean":** four lines beside ✓ Clean:
  - in time with the click;
  - even volume;
  - no buzz and no ringing string;
  - eyes off the screen.
- **(d) Test what transfers:** stage tests and reviews pick a key or variant the lesson did not use. The generators can.
- **(e) A test mode for stage tests:** count-in, one take, no step mode, no loop, tempo locked.

### M5. No way to record yourself (M; timing analysis L)

**Evidence:**
- The muting exercise (#202) tips "Record yourself: ringing strings are easier to hear afterwards".
- The gap-click lesson (4.7) asks "Record yourself: are you rushing in the gaps?" (`s4.js:127`).
- The app has the microphone (the tuner) but no recorder.
- LAUNCH-TODO lists "listening to the player" for later.

**Why it matters:**
- The app's only feedback is the player's own judgement. Listening back is the cheapest feedback that is valid.
- On a recording a student hears the rushed fills, the ringing open strings, the uneven fingers and the ghost notes that
  sound a pitch. During playing they do not.
- Every teacher asks for it.

**Suggestion, in three steps:**
1. **(M) "● Record" in the exercise:**
   - It records one loop from the microphone while the click and backing play (headphones advised).
   - It plays it back over the click, optionally beside the app's line.
   - It stays on the phone. One line in the privacy policy: recordings never leave it.
2. **(L) Timing only:**
   - Detect the note onsets in the recording and measure them against the known grid: "on average 18 ms late, spread
     ±25 ms; bars 3 and 7 rushed".
   - This is far simpler than hearing pitches, and time is what a bassist is judged on first.
   - It also gives the gap-click and odd-metre lessons a real measure.
3. **(later) Pitches:** the strategic feature against the game-style apps that listen.

### M6. Missing articulations: slides, vibrato, bends, note length, palm mute (M)

**Evidence:**
- The technique marks are T, P, H, PO, Π V, TΠ TV, RH LH, i m, ghost × and harmonic triangles. The song modifiers are
  `x T T↓ T↑ P H PO Π V >`.
- No exercise or lesson teaches a slide, glissando, vibrato or bend. Slides appear only as advice in tips: the blues
  scale (#226), blues licks ("Slide or hammer from the ♭3 to the 3"), and lesson 5.36 "Blues licks and turnarounds".
- The project's own `docs/RESEARCH.md` lists **slides at Level 2**.
- Palm muting is advised in tips (#236 pick, #336 reggae) but never written or practised.
- Staccato and tenuto are never written. Note length appears only as "notes and rests" and in the muting drill.

**Why it matters:**
- Slides are among the first articulations in every bass method and in the early graded technical work.
- Vibrato and bends come in the middle grades.
- Note length (short and fat or long and singing) is half of what makes a groove.
- The style studies cannot sound idiomatic without slides: blues, soul, Motown, rock.

**Suggestion:**
- **Slide in the note model:**
  - a shift slide, and a slide into a note from below or above (a grace slide);
  - tab `/` `\`, a line and "sl." on the staff;
  - playback by ramping the sample's pitch;
  - the fingering keeps the sliding finger.
- **Vibrato** (`~`) and a quarter-tone **bend** on the blues licks.
- **"P.M."** on the pick lines.
- **Lessons:**
  - "Slides" in Stage 2's "Stronger hands".
  - "Short and long: note length" in Stage 2's "Groove toolbox": the same groove played staccato and legato, with the
    marks on the staff.
  - "Vibrato and bends" with the blues in Stage 3.
- Then use slides in the song studies where the style wants them.

### M7. Grooves are practised against a click, never a drummer (M)

**Evidence:**
- The exercise's Backing is Off, Drone or Chords. `ui/exercise.js` and `player.js` hold no drum code.
- The 124 drum patterns live only in the Practice room, and no course step opens it.
- Lesson 1.12 is called **"Roots with the drums"**, yet its steps play over a click and a pad.
- Lesson 4.36 "Soul and neo-soul" says "play slightly late, but always land the root on 1". Its demo plays the bass on
  the grid, against a click.

**Why it matters:**
- Locking with the kick and snare is the bass player's first job.
- Feel (laid back or pushed, the swing ratio, the shuffle, the clave) is learnt against a groove, not a beep.
- A student who has only played to a click meets a drummer for the first time on the bandstand.

**Suggestion:**
- **"Drums" as a Backing choice** in the exercise, using the room's engine. A style comes with the exercise or step data
  (`drums: 'rock8'`).
- **Drums by default** on groove, walking, song-study and make-music steps.
- **A kick row in the strip** ("K") for the lessons that lock with the kick.
- **A feel demo:** for the soul lesson, the bass a few milliseconds behind the drums, so "behind the beat" can be heard.

---

## 3. Should have

### S1. Groove vocabulary does not match the room, and it stops after Stage 4 (L)

**Evidence:**
- **Few styles have bass lines.** The room offers 13 genres, among them metal, drum & bass, afrobeat, highlife, songo,
  partido alto, maqsum, trip-hop, UK garage and second line. Bass lines exist for about fifteen feels (#117, 236–238,
  335–338, 437–438, 533).
- **Grooves fade out:** 3 groove steps in Stage 5, none in Stage 6.
- **No bass line is in 3/4:** no waltz, jazz waltz or country waltz.
- **Compound time is thin:** 6/8 is a one-bar pattern, and 12/8 only the slow blues.
- **These topics are missing:**
  - fills and set-ups;
  - half-time and double-time feel;
  - gospel and church runs;
  - modern R&B and hip-hop lines;
  - metal picking;
  - reggae variations (steppers, rockers).

**Why it matters:** the room invites a player to jam in styles the method never teaches.

**Suggestion:**
- **One groove exercise per room genre:** three or four original lines, played over that genre's patterns.
- **A "Fills and set-ups" unit** in Stage 3: where to fill, how long, landing on 1.
- **"3/4 and 6/8"** in Stage 2.
- **"On top, in the middle, behind"** in Stage 4, with real offsets in the demos.
- **An advanced groove unit** in Stages 5–6: 16th syncopation at tempo, odd-time grooves at speed, ghost-note density.

### S2. Stages 5–6 are a jazz track only (L)

**Evidence:**
- Stage 5 is called "Jazz language". Stage 6 holds all keys, Messiaen, Coltrane, chordal bass and bebop vocabulary.
- Licks make 30 steps; grooves 3.
- Slap, tapping and double thumbing are optional and outside every checkpoint. The pick is one optional lesson, in
  Stage 2.

**Why it matters:**
- An advanced rock, funk, metal or pop player is placed at Stage 4 or higher and finds nothing in their style.
- The rock/pop graded syllabi at their top grades expect advanced slap, tapping, fills, odd-time grooves, fast picking
  and soloing over rock changes.
- The upper levels are also the paid part.

**Suggestion:**
- **One choice after Stage 4:** "Your path: Groove · Jazz · Both", each with its own units, checkpoints and test. This
  keeps one path and adds no clutter on Home.
- **The groove path:**
  - advanced slap (part of it, not optional);
  - pick technique;
  - odd-time and metal grooves;
  - fusion 16ths;
  - fills and solo devices over rock and funk changes;
  - chordal and tapping.

### S3. The course never sends the player to the Practice room, and there is no performance at the top (M)

**What is missing:**
- No jam tasks. The room's drums, progressions, muted bars and My progression are never part of a lesson.
- No capstone performance:
  - a whole 32-bar form walked through its bridge (rhythm changes exists as the A section and the bridge, never
    together in a step);
  - "head, walk, solo" choruses;
  - a funk or rock showcase with drums and dynamics.

**Suggestion:**
- **A step that opens the room preset** (style, progression, key, tempo) with a task. For example: "8 bars of roots,
  8 bars of your own line, then keep the time through 2 muted bars".
- **Each stage test ends with a performance step:**
  - a whole form with drums;
  - played with the cues off (M4);
  - recorded and listened back (M5).

### S4. Bass melodies and heads (M)

**What is missing:** playing a melody: phrasing, legato and the higher register. Jazz auditions open with "play the
melody, then walk".

**Suggestion:**
- Original heads written for BassClass, and public-domain traditional tunes.
- One per stage from Stage 2, read from the staff (M3), with the chords behind.

### S5. Muting, the plucking hand and posture need depth and drawings (M)

**Evidence:**
- Muting is one lesson with two short paragraphs (`s2.js:26–40`).
- The floating thumb is explained only in exercise #202's text, never set beside the movable anchor as a choice.
- The low B is never muted, and muting is never revisited for string skips, octaves and open strings in fast lines.
- Posture and hand position are text only. Drawings are planned after the launch.

**Suggestion:**
- **"Muting II" in Stage 3:**
  - left-hand muting behind open strings;
  - muting through skips and octaves;
  - the floating thumb against the movable anchor;
  - the low B.
- **A "Your sound" lesson:** where to pluck, attack, rest stroke against free stroke.
- **Drawings in this app's style:** sitting and standing; the thumb behind the neck; the floating thumb.
- **Pain warnings in the lessons.** The only one is in About (`SAFETY` in `legal.js`). Add "stop if it hurts" mistake
  lines to 1.1, 2.4 Finger independence, 4.1 Stretch and 4.2 Endurance.

### S6. Pick playing (M)

**Evidence:** one optional lesson, in Stage 2.

**Suggestion:**
- **An optional pick strand:**
  - palm mute;
  - alternate picking at 16ths;
  - string crossing and skipping with a pick;
  - gallops;
  - tremolo picking.
- **In the groove path (S2):** the strand becomes part of its checkpoints.

### S7. 5- and 6-string, and other tunings (M)

**Evidence:**
- The fingering engine handles the extra strings, but no lesson teaches them:
  - the low B as a position tool;
  - muting it;
  - keys whose root sits below E;
  - reading below the staff.
- No drop D, D standard or B standard. #546 moved Schism to E for that reason.

**Suggestion:**
- **An optional unit shown only on 5/6-string basses** (`minStrings`).
- **A tuning setting** (drop D, D and B standard) that the tuner and the fingering follow.

### S8. Theory is taught but never checked; some bassist's theory is missing (M)

**Evidence:**
- The "I can" lines are self-ticked.
- These have no hit in the course:
  - "time signature";
  - slash chords;
  - cadence names (perfect, plagal, imperfect, interrupted);
  - how key signatures are built.
- The circle of fifths appears only as a drill order.
- Roman numerals are taught in lesson 1.12 before the scale they count (`s1.js:250`: "the scale itself comes in
  Unit 5").

**Suggestion:**
- **Short generated questions** at the end of a theory lesson, answered with a tap, using `theory.js`. For example:
  - "3rd of E♭7?"
  - "the key with 3 flats?"
  - "bass note of G/B?"
  - "which beat is this rest on?"
- **A small "Time signatures" and "Cadences" content pair.**
- **Swap the order** of the numerals and the scale in Stage 1, or teach numerals by count only.

### S9. Practice skills (S–M)

**Evidence:**
- The player loops the whole exercise only (`player.js`): no A–B loop of the hard bars. That matters most in "Whole
  tune" studies and 12-bar lines.
- How to practise is never taught: slow practice, chunking, the speed trainer, short daily sessions, rest. The speed
  trainer is mentioned in passing in 3 lessons.

**Suggestion:**
- **A–B looping:** tap two bars in the strip.
- **A "How to practise" lesson in Unit 1:**
  - the session plan;
  - slow, then the speed trainer;
  - loop the hard bar;
  - record (M5).

### S10. Learning songs from records (L)

**Why it matters:**
- Most bassists learn by playing along with records, and transcription is the bridge between the ear and repertoire.
- The app rightly hosts no copyrighted songs and no links (the owner's rule).

**Suggestion:**
- **A "Play along" tool in the Practice room:**
  - open an audio file from the phone;
  - slow it down without changing the pitch;
  - loop a section;
  - set its key so the Neck and the drone follow.
  - It uses the player's own file, locally.
- **A "Learning a song by ear" lesson, method only:**
  - find the key with the drone;
  - map the form;
  - roots first;
  - slow it, loop it.
  - It names no records.

### S11. Reviews (S)

**Evidence:**
- A review replays one step, the lesson's last plain step, in the same key.
- There is no "hard or easy" rating.
- A missed review has no relearning path; it simply stays due.
- Song-study steps are never reviewed (`reviewStep` skips `music` steps).

**Suggestion:**
- A new key or variant at each review.
- Three buttons after a review (Hard, Fine, Easy) that shorten or lengthen the next interval.
- A review that fails twice reopens the lesson.

### S12. My level is self-report with compound statements (S)

**Evidence:**
- 41 statements, many packing three or four skills. For example: "I play hammer-ons, pull-offs, clean shifts and string
  skips."
- A player who has three of the four must answer all or nothing.

**Suggestion:**
- Split the longest lines.
- Add "Not sure? Prove it" per stage: play the stage test (in test mode, M4); a pass marks the stage known.

---

## 4. Nice to have

- **N1. Fretless and intonation (M):**
  - a fretless neck view (lines, no frets);
  - an intonation trainer from the tuner: hold a note and see its cents over time;
  - lessons on slides and vibrato for fretless.
- **N2. Three-finger plucking (i-m-a) (S):** for fast 16ths and gallops, beside i-m and raking.
- **N3. The instrument (S, text):**
  - its parts, the pickups and controls;
  - EQ for a sound;
  - changing strings;
  - basic setup: action, intonation, the truss rod is for a technician;
  - effects.
  - Exams ask spoken questions on the instrument.
- **N4. Writing and arranging at Stage 6 (M):**
  - write a part for a song form;
  - a short solo-bass arrangement (melody plus chordal bass).
- **N5. Visual theory aids (S):** a key-signature staff and a circle-of-fifths figure inside the concept texts, which
  are text only today.

---

## 5. Musical correctness

- **C1. The interval quiz shows the answer first** (M2). Its title, "hear it, name it", promises recognition. As built it
  trains producing an interval whose note is named on screen.
- **C2. Melodic minor (#415, lesson 4.15 "Harmonic and melodic minor"):**
  - The summary says "the two minor scales of jazz and classical music", and the text says both appear in conservatory
    programmes.
  - Only the jazz form is offered, the same going up and coming down.
  - Classical theory and several graded syllabi expect the classical form: raised 6th and 7th going up, the natural
    minor coming down.
  - Offer it as an option, or reword. S.
- **C3. "Roots with the drums" (1.12) has no drums,** and the neo-soul demo plays exactly on the beat while the text asks
  for "slightly late" (M7).
- **C4. The Stage 1 test overstates its can-line** ("the major scale … in any key"; the step plays E major) (M4).

The musical texts I spot-checked were correct:
- the bass-clef lines and spaces and the octave transposition;
- the 12-bar form;
- swing as the first and last notes of a triplet;
- the diatonic 3rds;
- the root/5th shapes;
- the five 7th chords;
- 11 of 12 notes in a 4-fret position;
- the harmonic-major modes;
- the °7 → dominant rule.

---

## 6. Already strong (short)

- **Harmony and the neck:** triads, 7ths, inversions, voice leading, extensions, chord-scales, all keys. The spelling is
  academic and correct, and the fingering is real for 4, 5 and 6 strings. Deeper than any method book.
- **Time:** gap click, muted bars, displacement, odd metres with the player's own groupings, polyrhythms, the 16th grid.
- **Lesson design:** one idea; a short concept; a demo; steps with start and goal tempos; common mistakes; checkpoints,
  stage tests, spaced reviews; a daily plan and a practice log.
- **The walking pipeline:** from the two-feel to Coltrane changes. The jazz licks are original vocabulary.
- **The left-hand technique ladder:** one finger per fret, Simandl, shifts, permutations, legato, skips, harmonics. Then
  slap, double thumbing, tapping and sweeps.
- **30 original song-style studies** spread over all six levels, with the song's key, feel and technique.
- **Engraving** of professional quality. A Quiz mode that hides the dots: it only needs using (M4).
- **The Practice room as a tool:** metronome, drums, harmony, the Neck following the chords.

---

## 7. Decided by the owner, but worth revisiting

- **✓ Clean as the only check** (QA round 8; "listening to the player" later in LAUNCH-TODO):
  - I know it is decided, and I am not asking for pitch recognition now.
  - I would revisit what surrounds the tick: fading cues, consistency, a rubric, test mode (M4), and recording with
    timing (M5).
  - Without those, a pass is only an honour system.
- **Slap, pick, tapping and double thumbing optional and outside the checkpoints** (sweeps and tapping decisions,
  2026-10-22):
  - This is right for a jazz-led course.
  - Slap basics and the pick are mainstream skills in the rock/pop grades.
  - Make them core in a groove path (S2) rather than optional for everyone.
- **No transcriptions, no links** (Make Music): keep it. Teaching transcription as a method, with the player's own audio
  (S10), needs neither.
- **No video; posture drawings after the launch:**
  - Agree on no video.
  - Drawings of the hands and posture (S5) are where an app without a camera is weakest. I would bring them forward,
    ahead of more scale content.
- **The chord-formula lesson's 9ths, 11ths and 13ths at Level 3** (QA round 20, question Q3):
  - Keep the knowledge.
  - Let the Stage 3 checkpoint test only triads, sus, 6ths and 7ths.
  - The extended chords are used at Levels 4–5.
- **"Keep three jobs, no clutter":** every suggestion here respects it.
  - "Your line", jam steps and test mode are step types inside Learn.
  - Play-along and recording sit inside Practise and the exercise screen.

---

## 8. What a student cannot learn from this app alone

Even with all of the above:
- physical correction (tension, a collapsing wrist, a thumb over the neck);
- tone;
- playing with people who react;
- the stage.

The app can point at them honestly:
- a "Beyond the app" line in each stage test: play with a drummer or a band this month; film your hands for one take;
  have a teacher check your posture once per stage;
- the record-and-listen habit (M5).

---

## 9. Suggested order

1. **Before the closed test (S, data and small code):**
   - M4: a–c.
   - C2.
   - M2: c (a Recognise mode).
   - S5: the pain warnings.
   - The Stage 1 test's can-line.
2. **First updates after the launch (M):**
   - M7: drums in exercises.
   - M6: slides and note length.
   - M5: step 1, record.
   - M2: a, b and e.
   - M3: the rhythm reader, as roadmap phase 3.
   - S9: A–B loop.
3. **Next (M–L):**
   - M1: "Your line" and the charts.
   - S1 and S2: the groove path.
   - S3: jam steps and capstones.
   - M5: step 2, timing.
   - S10: play along.

Sources consulted (generic): published rock/pop graded bass syllabi and exam booklets (sections: pieces, technical
work, sight reading or improvisation from a chord chart, quick study, ear tests, musicianship questions), and jazz exam
and university jazz-bass audition requirements (melody, walking choruses from a lead sheet, solo, call and response).
