# Student review · 2026-10-29: what a beginner and a teenage band player are missing (commit 39bca42)

**The question:** what is missing for two typical buyers to start, keep going, enjoy it, see their progress and pay for Pro.

**The students:**
- **Ana**, 35. She has just bought her first bass, has no teacher, and practises at home after work for 20–30 minutes.
- **Leo**, 16. He has played for a year from tabs and videos in a garage band. He wants better grooves, theory and soloing, on a small budget.

**Setup:**
- Commit 39bca42, on the owner's `bassclass` server (port 8765), reused, in my own tab.
- The origin's localStorage was saved first. Then:
  - Ana started from an empty profile.
  - Leo started from a second empty profile, with the Pro gates **On (as on Play)** and Pro not owned.
  - The gates were switched back off afterwards.
  - The saved storage was then restored exactly (verified key by key), the viewport reset and the tab closed.
- Sizes: 800×380, and 640×360 once.
- I read `CLAUDE.md`, README, STORE-LISTING, LAUNCH-TODO and `2026-10-28-launch-product.md`.
  - Items still open from that review are listed once, in section 4, with how these two students change their priority.
  - Decisions already taken are marked where a suggestion touches them.

---

## 1. Verdicts

**Ana (beginner): a good start, but no sense that she is doing it right. Likely to drift away in weeks 2–4.**
- **What works:** she hears a bass two taps after opening the app, and Lesson 1.1 is clear and kind. The free tier gives her months of course without a single wall.
- **What does not:** almost everything around the course assumes she already knows how to practise.
  - The first screen speaks of "66 BPM in quarter notes" and shows a tab nobody has explained.
  - Nothing tells her how to hear her bass and the app together, or that sore fingertips are normal.
  - The app says "Goal reached!" when *the phone* has played the loop. I passed Lesson 1.1 at 200 BPM without touching a bass.
  - Her first named song comes after about 17 lessons and checkpoints. It is "With or Without You style", a line that is deliberately not the bass part she knows.
  - When a goal tempo is too fast for her, there is no way past it.
- **Would she pay?** Not for 4–6 months: Pro starts at Stage 4. If she sticks, a tip is likelier than Pro.

**Leo (teen band player): enjoys the Practice room, finds little of his own music in the course. Would pay €4.99 only if he could hear what he is buying.**
- **What he likes:** the free drums (including three metal grooves), the pick lesson, slap basics and 16th-note funk at Level 3, and the Neck following the chords.
- **What he misses:**
  - **His band's songs.** The room has one My progression of 16 chords, and no drop-D or E♭ tuning.
  - **Rock, blues and funk soloing and fills.** Every lick is jazz, at Levels 5–6.
  - **A placement that tests him.** My level only asks him. It put him at Lesson 1.15 (the major scale), and his first session included a review of "Open strings".
- **The Pro question.** The Pro sheet sells counts ("88 more lessons and 120 more exercises") and stage names that read like a jazz school ("Jazz language", "Mastery"). He cannot open a Pro lesson or hear a Pro song study before paying.
  - Show him "Can't Stop style", "Money style" and the slap grooves, let him hear one, and €4.99 on a Play gift card is an easy yes.
  - Without that, he keeps the free tier.

---

## 2. The gaps

Sizes: **S** is a day or less, **M** a few days, **L** a week or more.

### Must have

#### G1. Feedback she can trust: today the app praises its own playback (S + M)
- **Missing:** any sign that the student, not the phone, played it cleanly.
- **Evidence:**
  - `ui/exercise.js` `onLoop` records the loop *the player engine played* (`recordLoop(L, LI, played)`). It then shows "Goal reached! If it felt clean, tick ✓ Clean?" (line 240).
  - I set Lesson 1.1's step to 200 BPM (the goal is 66), pressed Play and touched nothing. I got "Goal reached!", then ✓ Clean, then "Lesson 1.1 complete ✓".
  - Ear steps ask "✓ Got them all?", and checkpoints are "I can…" ticks.
- **Why it matters:** Ana has no teacher. The one judge is herself, and the app congratulates her for something the phone did. She cannot know whether her rests were silent or her notes were with the click. Players coming from apps that listen will feel the gap at once. The listing already says the app does not listen, so this is about honesty inside the app.
- **Suggestions:**
  1. **(S) Honest wording and a checklist built from the lesson.**
     - Replace "Goal reached!" with "The app played a full loop at 66. Did you play along with it?"
     - When ✓ Clean is tapped, show 2–3 checks drawn from the lesson's own "Watch out" lines. For Lesson 1.3 that gives "Each string stopped before the next? Every note with the click?" She ticks them, and the step passes.
     - This uses data the lessons already have.
  2. **(M) Record and listen back.**
     - The microphone the tuner already opens records one loop over the click and Backing, then plays it back.
     - Keep the first and the latest take of each lesson.
     - It is the classic teacher's advice; the app's own tip in `rh-sparse-click` already says "Record yourself". It is also the best progress evidence a non-listening app can give (G8).
     - Nothing leaves the phone, so the privacy text does not change. The microphone permission is already asked by the tuner.
  3. **(M–L) Answers the app can check without listening:** see G11.

#### G2. Nobody explains the screen or the words on it (S)
- **Missing:** a first-use guide to the exercise screen, and plain words in Stage 1.
- **Evidence:**
  - Lesson 1.1's only step row reads "#106 · 🎯 66 BPM in quarter notes".
  - The exercise opens with a neck, a tab strip with numbers on lines, `−`/`+`, a tempo slider, "♩ 1/beat", Loop, ⋯ and "🎯 –/66".
  - The course never explains tab: there is no "tab" or "tablature" in `course/stages/*`. The click and BPM arrive in Lesson 1.5. There is no tour (`grep tour|onboard` finds nothing).
  - At 640×360 the lesson page opens on the text, with the step below the fold. Stage 1 opening "Read more" is a decision; it just makes this worse.
- **Why it matters:** she does not know what a dot, a fret number or "quarter notes" means. A confused first five minutes is the most common reason a beginner gives up on an app.
- **Suggestion (S):**
  - A one-time overlay of four callouts on the first exercise she opens:
    - "This is your bass seen from above: the thickest string at the bottom."
    - "A dot is where your finger goes; the number in the tab is the fret (0 = open string)."
    - "− + = slower and faster."
    - "🎯 the goal; ✓ your honest tick."
  - A short "Your screen" paragraph in Lesson 1.1.
  - In Stage 1, "66 BPM, one note per click" instead of "in quarter notes".

#### G3. Setting up: the amp, headphones, the phone, and hearing both (S)
- **Missing:** any guidance on the practice corner.
- **Evidence:**
  - Lesson 1.1 covers posture and the tuner only.
  - Settings has volumes only.
  - The only audio advice is About's safety line ("a comfortable volume, also with headphones").
- **Why it matters:** Ana's first evening goes like this. Is the bass plugged in? The amp is louder than the phone, or the unplugged bass is drowned by the phone. Where does the phone go so she can see the neck? Teens with a small amp have the same problem.
- **Suggestion (S):** a "Your practice corner" card in Lesson 1.1, and in a Help page (G18):
  - The phone on a stand, at eye level, in landscape.
  - Unplugged: the phone speaker at about 60%.
  - A practice amp with an Aux input: phone into Aux, bass into the input, headphones into the amp. You hear both.
  - The amp's tone controls flat.
  - Wired headphones rather than Bluetooth (see G19).

#### G4. Hands, soreness and pain in week 1 (S + M)
- **Missing:** a word on sore fingertips and when to stop, at the moment they happen; and pictures of the hands.
- **Evidence:**
  - "Pain" appears only in a Stage 2 mistake (`s2.js:70`) and a Stage 4 step (`s4.js`).
  - The safety note is in About.
  - Posture is text only. There are no images in `web/` apart from the icons.
  - The 28 October review put posture drawings (A5) "after launch".
- **Why it matters:** fingertips hurt on days 2–5 for every beginner, and an adult who thinks she is doing it wrong stops. Wrist or forearm pain is the one thing she must not push through.
- **Suggestions:**
  - **(S)** One line in Lessons 1.1 and 1.4: "Sore fingertips in the first two weeks are normal and pass; pain in the wrist or forearm is not: stop and rest."
  - **(S)** In today's session, after 20 minutes of playing without a pause, a gentle "Shake your hands out" between items.
  - **(M)** Bring A5's three drawings (sitting and standing, the plucking hand and its anchor, the fretting thumb and hand shape) before launch, for this persona.

#### G5. Stuck: no way past a goal she cannot reach (S–M)
- **Missing:** a path for "I can't get to 92 BPM yet".
- **Evidence:**
  - Continue is the first lesson not done (`continueLesson`/`firstGap` in `course/progress.js`), and today's session keeps scheduling that lesson's steps.
  - There is no skip, "later" or "easier" anywhere (`grep` in `ui/course.js` and `course/progress.js`).
  - Goals are fixed per step, for example the Unit 1 checkpoint asks for alternate plucking at 92 BPM in 8ths.
  - "Nothing is locked", but the course gives no hint that she may move on.
- **Why it matters:** at 25 minutes a day a beginner can sit at 80 BPM for two weeks. Seeing the same "Continue" every day is the quietest way to lose her.
- **Suggestions:**
  - **(S)** After three sessions on a step without reaching the goal, offer "Move on: we'll bring this back in 3 days". The step is parked, Continue goes ahead, and it returns like a review.
  - **(S)** A "for now" goal at 85% that counts the step as started, never as done.
  - **(M)** Loop one bar (G10).

#### G6. A song in week 1, and song cards that do not over-promise (S, then M in G12)
- **Missing:** an early "I'm making music" moment, and honesty about the song studies on their cards.
- **Evidence:**
  - Stage 1's first music step is Lesson 1.14; its first named song study is the Unit 4 checkpoint ("With or Without You style"), about 17 lessons and checkpoints in (week 2–3 at Ana's pace).
  - The card and header read "Seven Nation Army style".
  - The "Not a transcription: the notes are our own" line sits at the foot of the ⓘ drawer, under "Related".
  - Not copying the records is a firm rule (2026-10-28), and rightly so. It is not questioned here.
- **Why it matters:** "songs I know" is the strongest motivator for both students. A card named after a famous riff that plays a different line feels like a bait-and-switch, and invites a "it's not the real song" review.
- **Suggestions:**
  - **(S)** Put "Original line in this style, not the record's part" on the study's card and header subtitle, not only in the drawer.
  - **(S, data)** Point a Level 1 study from Lesson 1.3 or 1.4 ("Now play a tune: …"), so week 1 ends with music.
  - Real songs she knows: see G12.

### Should have

#### G7. Drums in lessons, grooves and studies, and a "Jam it" link to the room (M + S)
- **Missing:** the drummer anywhere outside the Practice room.
- **Evidence:**
  - `player.js` has no drums; only `practice/engine.js` plays them. Exercises play a click and a pad.
  - Lesson 1.12 is called **"Roots with the drums"** (`s1.js:246`), but it plays a click and pad chords.
  - No lesson or exercise links to `#/practice` (`grep` finds none).
  - Only a handful of steps (in Stages 3–4) ask the player to make up a line, and none sends them to the room.
- **Why it matters:** both students' fun is a groove with a drummer. The app owns 124 recorded patterns, yet its course grooves and song studies play to a click.
- **Suggestions:**
  - **(M)** A `drums` field on groove, walking, slap and song templates or steps (for example `rock8`, `funk16`, `swing`), played by the room's engine. Add a Drums toggle beside Backing, and use free patterns only for a free player.
  - **(S)** A "▶ Jam it" button on lessons with a progression. It opens the room set to the lesson's key, progression, pattern and tempo. This keeps the "three jobs" split and joins them.

#### G8. Progress she can see, beyond minutes (M)
- **Missing:** skill progress over time.
- **Evidence:**
  - `bassclass.progress.v1` keeps `plays`, `bestBpm` and `lastBpm`, but no history.
  - Home shows minutes and days.
  - The map says "1 of 185 lessons done".
  - "My level L1" does not show the distance to L2.
  - Lesson and unit completions are toasts (R5 asks for a card at stage completion only).
- **Why it matters:** a student who cannot be heard needs proof that she is getting better. "66 → 92 BPM in three weeks" and her week-1 recording against her week-6 one are that proof.
- **Suggestions (M):**
  - Store the best tempo per week for each exercise, and show it as a small line on the exercise's ⓘ and the Library card.
  - A monthly card on Home: "October: 9 h, 14 lessons, 6 mastered, +26 BPM on 16ths".
  - Before/after takes (G1.2).
  - A one-time card at each unit checkpoint, as well as at stage completion (extends R5).

#### G9. Practice away from the app does not count (S)
- **Missing:** a way to add minutes.
- **Evidence:** `practiceLog.js` counts only an exercise or the room playing. Its exports offer no manual add.
- **Why it matters:** the log and the 🔥 streak are Home's headline. When Ana plays along with a record, or Leo rehearses with his band, the streak breaks on a day they practised hard.
- **Suggestion (S):** "+ Add minutes" behind the ring: today only, up to 60′, shown in the day's bar as hatched.

#### G10. Loop one bar and slow down the hard spot (S–M)
- **Missing:** looping a section of a line.
- **Evidence:** the player loops the whole line. There is no range loop in `player.js` or `ui/exercise.js`; song studies only have "parts".
- **Why it matters:** this is the standard way past a hard bar, for Ana (G5) and for Leo learning a study.
- **Suggestion (S–M):** a long press on a bar of the tab strip loops it at −20%, and a tap elsewhere ends the loop. The loop counts for nothing; it is practice only.

#### G11. Answers the app can check: tap quizzes (M–L)
- **Missing:** any exercise with a right or wrong answer the app scores.
- **Evidence:**
  - Tapping the neck only plays the note (`tapNote`, `ui/exercise.js:520`).
  - Ear training (3 exercises) and the note quiz end on a self-tick.
  - Roadmap phase 3 already plans "tap the note on the neck" for reading.
- **Why it matters:** this is real feedback without a microphone, for the very skills both students lack: Ana's note names, Leo's ear and theory. It also works without a bass, on the bus.
- **Suggestion (M–L):**
  - Build phase 3's tap mechanism once, then use it for the fretboard quiz (tap the note), ear training (tap major or minor, tap the degree), intervals and reading.
  - Show a score and a best streak.
  - The same mechanism makes a graded placement possible (G15).

#### G12. Real songs: out-of-copyright tunes, and the band's own songs (M)
- **Missing:** any song a student can play as it really goes.
- **Evidence:**
  - All 30 Make Music lines are original "style" lines, by rule.
  - My progression is one progression of up to 16 chords (`practice/harmony.js:8`; user, 2026-10-23: "keep it simple").
  - There are no saved room setups.
- **Why it matters:**
  - Ana wants a tune she recognises.
  - Leo wants to practise *his band's* set: the chords, tempo and groove of five songs.
  - Chord changes are not protected, so the second need can be met legally.
- **Suggestions:**
  - **(M, content)** 6–10 traditional, folk, blues and early-jazz tunes and classical themes whose composition *and* any arrangement used are out of copyright in the EU and the US (checked one by one). Each with a bass line written for BassClass and drums (G7).
  - **(M) "My songs"** for Leo: several named progressions, each with its key, tempo, drum pattern and sections (verse and chorus), under "Mine" in the picker the room already has. This reopens the 2026-10-23 "one My progression" decision: the owner's call.

#### G13. Alternate tunings (S for the tuner, L for the neck)
- **Missing:** drop D and half a step down.
- **Evidence:** `TUNINGS` depends only on the string count (`fretboard.js:3`). The tuner's string buttons are E A D G (B, C) only.
- **Why it matters:** many rock, grunge and metal bands tune down. Leo will retune for rehearsal, and the tuner then gives him the wrong string targets.
- **Suggestions:**
  - **(S)** Tuner presets: Standard, E♭ standard, Drop D, D standard (and Drop A, B standard on a 5-string).
  - **(L)** The neck and exercises in E♭ standard and drop D, after launch. E♭ standard is the cheaper of the two: same shapes, names shifted.

#### G14. Rock, blues and funk soloing and fills before Level 5 (M, content)
- **Missing:** licks and fills in Leo's styles at his level.
- **Evidence:**
  - Jazz Licks: 9 exercises, all jazz, all Levels 5–6 (Pro).
  - Fills appear only inside "Funk 16ths, ghost notes & fills" (Level 3), "Groove bar, fill bar" (Lesson 4.14, Pro) and the Level 5 slap pentatonic fills.
  - Stages 5–6 are named "Jazz language" and "Mastery".
- **Why it matters:** a garage-band bassist wants a fill into the chorus and a 4-bar blues solo, not a ii–V–I lick. This is the content that would keep him past month 1 and sell him Levels 4–5.
- **Suggestions (M):**
  - A "Rock & blues licks and fills" exercise at Levels 2–3: original phrases on the licks engine (`lickTemplate` already takes `module` and `defKey`), minor pentatonic and blues, 1-bar fills into the next section, over the room's free progressions.
  - In Topics, consider a "Rock & funk" path card that lists the existing grooves, slap and studies in order. The owner's call, under "no clutter".

#### G15. My level asks, it does not check (S data, M with G11)
- **Missing:** partial answers and any graded check.
- **Evidence:**
  - 39 statements, each bundling several skills, for example "I play major, minor and pentatonic scales and major and minor triads in any key".
  - A tab player who knows the pentatonic box answers "Not yet". Leo's honest answers placed him at Lesson 1.15, and his first session held "Open strings · Review".
- **Why it matters:** self-report misplaces both groups. Modest players go too low and get bored; confident ones go too high and get lost.
- **Suggestions:**
  - **(S, data)** Split the bundled lines (scales / triads / "in any key").
  - **(M)** A 2-minute check per stage using G11's taps: name four notes, major or minor by ear, read four notes.

#### G16. Let a free player read and hear a Pro lesson before buying (S–M)
- **Missing:** any preview of Pro course content.
- **Evidence:**
  - `lessonScreen()` replaces the hash and opens the Pro sheet for a locked lesson (`ui/course.js:467–468`). The same applies to Pro exercises and studies.
  - The 28 October review's "hear before you buy" covers drum patterns and sounds only, and after launch.
- **Why it matters:** Leo decides on a demo. A locked row tells him nothing about what "Slap grooves" or "Can't Stop style" sounds like.
- **Suggestion (S–M):**
  - Open a Pro lesson page to a free player (the idea, Read more, ▶ Hear it), and lock only its practice steps.
  - For a Pro study, let "Hear it" play its first part once.
  - The Pro chip and the sheet stay where they are.

#### G17. The Pro sheet speaks jazz-school to a rock player (S)
- **Missing:** naming what each kind of player gets.
- **Evidence:** the sheet opens with "🎓 Levels 4–6: 88 more lessons and 120 more exercises (15 of them song-style studies)". The map's Pro stages are "The whole neck", "Jazz language" and "Mastery". This builds on M1 of 28 October, which is not done.
- **Why it matters:** the 15 Pro studies (Money, Good Times, Can't Stop, Hysteria, YYZ, Tommy the Cat…) and the slap, soul and funk grooves are what Leo would buy, and the sheet never names them.
- **Suggestion (S):** one more line, built from the data, naming 5–6 Pro study titles and "slap grooves, soul and funk through changes, odd-metre grooves". The study titles already appear in the app; keep them out of the store listing, by its rules.

#### G18. A Help page (S)
- **Missing:** answers to the questions both students will have.
- **Evidence:** Settings offers Feedback, but no help or FAQ.
- **Why it matters:** it answers the week-1 questions in one place, and spares the owner the e-mails. The questions:
  - Why doesn't it hear me?
  - How do I hear my bass and the app?
  - My fingers hurt.
  - What does ✓ Clean mean?
  - Can I practise my band's songs?
  - Why is this lesson Pro?
  - What if I'm stuck on a tempo?
- **Suggestion (S):** 8–10 short Q&As above "✉ Send feedback".

#### G19. Bluetooth headphones: the dots probably run ahead of the sound (S, verify on a phone)
- **Missing:** latency compensation.
- **Evidence:** no use of `outputLatency` or `baseLatency` anywhere (`grep`); `audio.js` only sets `latencyHint: 'interactive'`.
- **Why it matters:** Bluetooth adds roughly 150–300 ms. The dot would light before its note sounds, so a beginner following the dots plays early. Teens practise with Bluetooth earbuds.
- **Suggestion (S):** delay the visual cues by `AudioContext.outputLatency` where the browser reports it, and say "use wired headphones or the speaker" in Help (G3, G18). Measure on a phone first.

### Nice to have

| # | Missing | Why | Size |
|---|---|---|---|
| G20 | **A time estimate per stage** ("Stage 1: about 6 weeks at 20 minutes a day") and the progress to the next level on the My level tile | Sets expectations for an adult with limited time; a reason to come back | S |
| G21 | **Band and by-ear lessons**: find a song's key and root by ear, read a chord chart, song form and endings, lock with the kick | Leo's real-world skills; there is no such lesson (`grep "by ear"` finds only the progression drills) | M |
| G22 | **Share a jam setup** (key, progression, tempo, pattern) as a short text code through Android's share sheet, no internet needed | Leo's bandmates install the app to practise the same song; the natural recommendation loop | M |
| G23 | **A practice note per day** ("sore fingers; 1.4 felt good") on the log | Ana's journal; makes the month card (G8) personal | S |
| G24 | **"No bass needed"** marks on quizzes, reading and ear (after G11) | Practice on the commute; more days logged | S |
| G25 | **Play promo codes** for teachers and bands (Play Console, no code) | Teachers recommend it to students; reviewers and testers get Pro | S |
| G26 | **Play along with a song file from the phone** (slow down, A–B loop) | Leo learns from records; the biggest missing tool against practice apps, but large, after launch | L |

---

## 3. Already strong (kept short, for proportion)

- **First sound in two taps.** Home ▶ Start → ▶ Hear it, and the demo plays by itself. Lesson 1.1 links straight to the tuner.
- **A tuner a beginner understands:** "Flat: tighten slightly ↑", "Much too low: tighten the string".
- **A real course** with "Watch out" mistakes, spaced reviews and a daily plan of 15–60 minutes. The practice log is Home's headline (ring, days, 🔥).
- **A generous free tier:**
  - Ana can learn for 4–6 months without a wall.
  - Leo gets 39 drum patterns (three metal ones among them), pop and blues progressions, My progression, the drone, the Neck and the whole metronome.
- **Recorded bass and drums, offline,** with no account, ads or tracking. A one-time, cheap Pro.
- **Leo's styles are present at Level 3:** a pick lesson, slap basics, 16th-note funk and reggae/bossa/tumbao grooves.

---

## 4. Still open from the 28 October product review, re-ranked for these students

Not argued again; see `2026-10-28-launch-product.md`.

| Item there | Status at 39bca42 | For Ana / Leo |
|---|---|---|
| A2 "Your bass" first-start card | not built (no card on a new Home) | Leo: Must if he plays a 5-string or left-handed; also routes him to My level |
| A3 Day 1 warm-ups before Lesson 1.1 | still "Natural notes on one string", "Landmark frets" | Ana: Must, part of G2's confusion |
| A4 Lesson 1.1's step passes on its first loop | still 50 → 66 BPM | Ana: Should; less needed once G1 and G2 exist |
| A5 Posture drawings | not built | Ana: **Must** (G4) |
| R1 Daily reminder | not built | Ana: **Must**: nothing else brings her back after a tired day |
| R2 Earlier first rating ask | `RATE_AT` still 10 h and 20 h | Neither reaches 10 h before week 3 |
| M1 Pro sheet names skills | not done | Leo: **Must** for conversion (G17) |
| M2 Free cards first in pickers | not done (Rock: free at places 1, 3, 10 of 16) | Leo: Should |
| Hear before you buy (drums, sounds) | after launch | Leo: Should, and extend it to lessons and studies (G16) |

---

## 5. When each would quit, and what would keep them

### Ana

| When | Why she would quit | What keeps her |
|---|---|---|
| **Week 1** | She cannot tell whether she plays right ("Goal reached!" whatever she does); the screen's words; sore fingertips; the amp drowning the phone; nothing reminds her the next evening | G1 checklist and recording, G2 screen guide, G3 setup card, G4 pain line, R1 reminder |
| **Week 4** | Stage 1's theory units (alphabet, sharps and flats, landmarks, scales) with a click and a pad; her first "song" is a style line, not the one she knows; one tempo goal she cannot reach blocks Continue | G6 and G12 real tunes, G7 drums in grooves, G5 "move on", G10 loop a bar |
| **Month 3** | Stage 2 (intervals, 7th chords, reading in keys); progress feels like minutes, not skill | G8 tempo lines, month card and before/after takes; G11 quizzes with scores; unit-checkpoint moments |

- **She recommends it** the day she plays a whole tune with a drummer, and hears her week-1 take next to her week-6 take.
- **She pays** at Stage 4 (4–6 months), if she is still there. Before then, a tip.

### Leo

| When | Why he would quit | What keeps him |
|---|---|---|
| **Week 1** | Placed at the major scale with "Open strings" reviews; no drop D; can't load his band's songs | G15 graded placement, G13 tuner tunings, G12 My songs, A2 |
| **Week 4** | Pro walls on punk and pop-punk drums, fills, soul and jazz progressions and the Level 4 studies; the sheet lists counts and jazz stages; he cannot hear a Pro study | G16 preview, G17 sheet, M2, the launch price |
| **Month 3** | Stages 4–6 read as jazz school; no rock or blues soloing; nothing to share with the band | G14 rock and blues licks and fills, G21 band lessons, G22 share a setup |

- **He recommends it** to his bandmates when they can share a song setup (G22) and all practise it with the same drums.
- **He pays €4.99** (with a Play gift card or a parent's approval) once he has heard one Pro study he likes and seen the slap and funk content named. At €7.99 with today's counts-only sheet, probably not.

---

## Side note (not a gap)

`curriculum/rhythm.js:333`, a tip of "Gap click", credits a practice game to a named living player. Check it against the project's naming rule; I do not repeat the name here, per the same rule.
