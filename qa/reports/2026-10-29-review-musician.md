# A working bassist's review · 2026-10-29 (commit 39bca42)

**The question:** what is missing for a working player to make BassClass their daily practice tool and use it to prepare
real gigs. This report lists the gaps. The "already strong" list at the end is short and only there to keep them in
proportion.

**Who is judging:** a bassist with 20 years of gigs and sessions: cover bands, function gigs, a jazz trio, some funk and
fusion, a theatre pit. Plays 4- and 5-string, with fingers, a pick and some slap, and has a fretless at home.

**Setup:**
- My own server (`design`, port 8899) and my own tab, at 800×380.
- A clean profile: localStorage was empty at the start and was left empty at the end. The Pro gates were off.
- Most of my time went into the Practice room (#/practice) and the Library. I also used the exercise player, the tuner
  screen, Settings, My level (All yes up to Stage 4) and Home.

**What I could not check:**
- **Sound by ear.** The pane was hidden and I cannot hear audio here, so every sound remark comes from the code and the
  project's own measurements in CLAUDE.md.
- **The tuner with a real bass.** I had no microphone input.
- **Android behaviour** (background play, Bluetooth). I read it from the code only.

**Not repeated:** what `2026-10-28-launch-product.md` already covers: the onboarding bass card, the practice
reminder, the rating ask, free cards first, hearing before buying, posture drawings, translations and tablets.

**Sizes:**
- **S:** a day or two.
- **M:** about a week.
- **L:** several weeks.

**"Fits"** means the suggestion works within the stance: no internet permission, and everything stays on the phone.

---

## Verdict

BassClass is a deep trainer for theory and technique, with a metronome and a drummer better than most standalone apps.
As a working player's daily tool it has one central gap: **it has no idea of a tune.**

- Nothing I prepare for Saturday can be saved. There is one room state and one progression of 16 chords. It has no
  sections, slash chords or ending.
- The app's good line generators (walking, grooves, chord tones) cannot be pointed at my tune.
- The exercises play without drums.
- I cannot bring in the recording I have to learn.

Three other areas fall short:
- **Reading** stops before session level: no 16ths, rests or ties, and no charts or road maps.
- **Ear training** has 3 exercises.
- **The course:** its top two stages are a jazz conservatory, with nothing on band craft.

The Practice room is about 80% of a jam partner. The missing 20% is mostly small work:
- comping in the style of each groove;
- a click on 2 and 4;
- keeping my tempo when I change the pattern;
- endings;
- Bluetooth delay;
- playing on with the screen off.

**The good news:**
- Nearly every gap reuses an engine the app already has: My progression, `progChords`, the room's scheduler, Backup's
  file chooser and the tuner's microphone.
- Every suggestion but one (a song database, N10) fits the stance.

---

## Must have

### M1. Tunes and a setlist: save what I prepare
- **What is missing:** a room setup cannot be saved as a tune and recalled in one tap. A tune means tempo, metre and
  accents, drum pattern and fills, key, progression, sound, volumes and a note. There are no setlists either.
- **Evidence:**
  - `practice/state.js` keeps one room. `myProg` is one progression.
  - Picking a drum pattern resets the tempo to the pattern's own (`ui/practice.js:500–501`). Auditioning grooves for a
    tune at 132 therefore means typing 132 again after every pick.
  - Favourites store the exercise only, not its options (a QA round 2 decision).
- **Why it matters:**
  - A function gig is 30–60 songs, a theatre book about 20 numbers, a trio set 10 standards.
  - For each one I prepare the same things: its tempo, its feel, its key (often moved for the singer) and its form.
    Today that is all gone when I come back.
  - Before a gig I want to run the set in order, at the set's tempos.
- **Suggestion (M, fits):**
  - Add a **Tunes** group to the shared picker, beside the "Mine" group it already has.
  - "Save as tune" (a name) stores the whole room. One tap loads it.
  - The room shows one line, "Tune: Opener · 112 · F · Motown", with Change, like Drums.
  - A setlist is an ordered list of tunes with ▶ Next.
  - Storage: `bassclass.tunes.v1`, so backups carry it. It scales through the picker, as the Built to scale rule asks.
  - While a tune is loaded, or once the player has set a tempo by hand, picking a pattern keeps the tempo.
  - Keep it simple: no new screen.

### M2. Song form in My progression
- **What is missing:**
  - more than 16 chords;
  - sections with repeats (intro, A, B, ending);
  - **slash chords**, which are the bass player's own part of the chart;
  - a key change partway through;
  - 1- and 3-beat chords;
  - looping one section;
  - a chart view.
- **Evidence:**
  - `practice/harmony.js` QUALITIES has no bass note. LENGTHS is ½, 1, 2 or 4 bars.
  - `state.js` allows at most 16 chords. "+" only copies the last chord (no insert).
  - The chords show as one row of chips that scrolls sideways.
  - Rhythm changes exist only as two separate presets (`rhythm-A`, `rhythm-B`), so the 32-bar AABA cannot be played as
    one form.
  - Test: a typical pop song (intro, verse ×2, pre-chorus, chorus) came to 22 chords. A 32-bar standard needs 24–32.
    Both overflow. Neither can hold a C/E or D/F♯ walk-down, or a last chorus up a half step.
- **Why it matters:**
  - The form is what goes wrong on a gig, not the scale.
  - The bass note under a slash chord is exactly what the bassist plays.
  - A pit book is full of 2- and 3-beat chords.
- **Suggestion (M–L, fits):** this reopens the 2026-10-23 "keep it simple" choice, so here is a minimal version.
  - **Bass:** a row in the slot editor (root, 3rd, 5th, ♭7 or any degree). It shows as "C/E", the pad plays it lowest
    and the Neck marks it.
  - **Sections:** a slot can start a section (Intro, A, B, C, Ending), and a section repeats ×N. The form reads
    "Intro · A A B A · Ending".
  - **Size:** up to 64 chords, and lengths of 1 and 3 beats.
  - **Key change:** a "key up ½ / 1 from here" mark.
  - **Loop this section** while practising.
  - **Chart view:** 4 bars per line, with section letters, under the Harmony block. The chip row becomes the current
    line. A roman / Nashville toggle (N5).

### M3. Drums under the exercises
- **What is missing:** drums in the exercise player. Grooves, walking lines, licks and the 30 song-style studies play
  over a click and a pad only.
- **Evidence:**
  - The exercise controls (`ui/exercise.js`) are Loop, Metronome, Bass sound, Speed trainer and Backing (Off, Drone or
    Chords). There is no drums option.
  - I opened #338 Funk 16ths with ghost notes. It plays against a quarter-note click.
  - Meanwhile the room has 124 recorded patterns, already in the APK.
- **Why it matters:**
  - Groove is locking with a kick and a hi-hat: where the ghost notes sit, pushing or laying back against the backbeat.
  - A funk line or a "Billie Jean style" study over a metronome teaches the notes, not the groove.
  - Walking over a ride cymbal is the whole point of walking.
- **Suggestion (M, fits):**
  - Add **Drums** to the exercise menu, beside Backing.
  - The pattern comes from data on each exercise or groove cell: `drums: 'funk16'`, swing on walking, the study's style
    on each song.
  - Switching drums on mutes the click by default.
  - The room's `phraseHits` and `playDrum` already schedule per beat from a time origin, so the player's scheduler can
    call them.
  - The free plan's 3 patterns per genre are enough to cover the free exercises.

### M4. Point the line generators at my tune
- **What is missing:** walking, two-feel, chord tones, guide tones, groove cells and chordal bass all play over their
  own fixed progressions, never over mine.
- **Evidence:**
  - `WALK_PROGS` in `curriculum/grooves.js:186` lists 9 progressions. Groove exercises use `STYLE_PROGS`.
  - `progChords` already takes a progression object, not only a preset name (`curriculum/common.js:315–317`: "a key
    of PROGS, or a progression of the same shape: the Practice room's own").
- **Why it matters:**
  - For a trio gig the real question is "how do I walk *this* tune, with its bridge, at its tempo, in its key".
  - The walking engine is good, and it can never see the tune.
- **Suggestion (S–M, fits):**
  - Add "My progression" (later, any saved tune from M1) to the Progression option of these exercises.
  - In the room, "▶ Walk it" or "▶ Groove it" opens that exercise on the room's progression, key and tempo.
  - The self-test builds each generator on a random My progression.

### M5. Learn from a recording
- **What is missing:**
  - opening an audio file;
  - slowing it down without changing the pitch;
  - an A–B loop;
  - shifting the pitch by semitones, plus a few cents for records that are not at A440.
- **Evidence:** the only file the app opens is a backup (`backup.js`, through the WebView's file chooser). The only
  audio coming in is the tuner's microphone.
- **Why it matters:**
  - Learning 20 songs means listening, looping two bars, slowing the fast fill, and moving the track a tone down
    because the band plays it there.
  - Every working bassist I know keeps a slow-down app open next to the chart. It is the most used gig-prep tool,
    ahead of the metronome.
  - BassClass would then cover the whole job: hear it, see it on the neck (Scale mode), loop it, play it.
- **Suggestion (L; fits, with a small change of scope):**
  - Add a **Track** block in the room: off, or a file.
  - It shows a waveform with A–B markers.
  - Speed 50–100% with the pitch kept: a time-stretch (WSOLA in an AudioWorklet, or an offline render per speed).
  - Pitch ±12 semitones and ±50 cents.
  - A loop with a bar of count-in.
  - The Neck shows a chosen key's scale.
  - **Memory:** decode to mono at 22 kHz (5 minutes ≈ 26 MB).
  - **Stance:** the player's own files, opened through the same chooser as Backup. Nothing leaves the phone or goes
    into backups. Nothing is bundled or linked, which respects the no-transcription and no-link rules. The privacy text
    gains one line: "files you open stay on your phone".
  - **Step 1 (M):** import, A–B loop and speed. Pitch shift and markers come next.

### M6. Reading at session and pit level
- **What is missing:**
  - rhythm reading with 16ths, rests, ties and syncopation;
  - chart reading: chord symbols over slashes, repeats, 1st and 2nd endings, D.S. al Coda;
  - reading a page instead of a strip.
- **Evidence:**
  - Reading has **5 exercises**.
  - Their melodies use only quarters, halves, 8ths and a dotted quarter (`curriculum/reading.js` `CELLS` and `ENDS`).
    No rests, ties, 16ths or syncopation.
  - Rhythm exercises exist (#309, the 16th grid), but they are rhythm drills, not reading.
  - No exercise reads a chart or a road map.
  - The staff is a strip that scrolls.
- **Why it matters:**
  - A pit or a session hands you a part: syncopated 16ths, rests, ties across the bar line, and a road map with "walk"
    or "funk" over the slashes.
  - The road map is what loses players in a show. Reading quarter notes in C is not a gap any working player has.
- **Suggestion (M, fits):**
  - **Rhythm reading:** generated 2–8-bar lines built from the app's own 16th grid and groove cells, with rests and
    ties, at chosen densities. Pitch first, then rhythm, then both.
  - **Chart reading:** a page of a generated form (from M2) with chord symbols over slashes, repeats, endings and
    D.S. al Coda. The player walks or grooves through it with drums (M3), and the cursor follows the road map.
  - **A page view** of 2–4 systems for reading drills, with "read ahead" (the bar being played is hidden).

---

## Should have

### S1. Record yourself and listen back
- **What is missing:** a take recorded over the room or an exercise and played back, with or without the backing.
- **Evidence:** the microphone is used only by the tuner (`ui/tuner.js`).
- **Why it matters:**
  - Hearing my own time, note lengths and tone is the best teacher a player without a teacher has.
  - It is also the honest answer to "the app does not listen": you listen.
- **Suggestion (M, fits):**
  - Record (getUserMedia and MediaRecorder; the permission already exists) and keep the last 5 takes on the phone,
    outside backups.
  - A one-time calibration (the phone plays a click and the microphone hears it) lines the take up with the backing.
  - The privacy text gains one line.

### S2. Timing feedback, without full listening
- **What is missing:** any measure of my time.
- **Background:** LAUNCH-TODO Part 9 lists listening to the player as a later choice. This is a much smaller step.
- **Suggestion (M–L, fits; after S1, reusing its calibration):**
  - Detect only when notes start, not which notes they are.
  - After N bars against the click: "average 12 ms late, spread ±18 ms, rushing in bars 4 and 8".
  - It reuses the tuner's microphone path.
  - A tap-on-screen version is S but trains the hand on glass, not on the bass.

### S3. Alternate tunings and the fretless
- **What is missing:** any tuning but standard.
- **Evidence:**
  - `fretboard.js` `TUNINGS` holds only standard 4-, 5- and 6-string. `store.js` accepts `strings` of 4, 5 or 6.
  - The tuner's string targets come from `TUNINGS`.
  - The Schism study was moved to E because the song is in drop D (CLAUDE.md).
- **Why it matters:** half a step down covers many rock covers, drop D covers rock and metal, and BEAD, D standard and
  tenor are common. In those tunings the neck and tab name the wrong notes.
- **Suggestion (M, fits):**
  - Settings → Tuning: Standard, Half step down, Drop D, D standard, BEAD, Tenor (ADGC).
  - It drives `TUNINGS`, the fingering engine (already tuning-array based), the Neck and the tuner's targets.
  - Studies that need the open E show "standard tuning".
  - **Fretless (S):** a neck view with fret lines instead of frets, and side dots.
  - **Intonation drill (M):** a drone plus the tuner's pitch detector, showing the cents of each sustained note. It
    listens to pitch only, as the tuner does.

### S4. Bluetooth delay, and playing on with the screen off
- **What is missing:** any compensation for headphone delay, and playback once the app is no longer in front.
- **Evidence:**
  - The room's lights, chips and dots are drawn against `ac.currentTime` (`ui/practice.js` frame loop; `audio.js:261`
    `now`). There is no `outputLatency` and no offset; `latencyHint` is `'interactive'` (`audio.js:92`).
  - `MainActivity.onPause` pauses the WebView. The launch review called this fine for launch.
- **Why it matters:**
  - Most players practise with Bluetooth earbuds (150–250 ms of delay). The dot lights before the note sounds, which
    breaks the app's core idea: see it as you hear it.
  - At a rehearsal the click must keep going when the screen sleeps or I switch to the chart's PDF.
- **Suggestion:**
  - **Delay (S):** Settings → "Headphone delay", Auto from `outputLatency` plus a manual 0–300 ms slider with a tap test.
  - **Background play (M):** an Android foreground service with a media notification (Start/Stop) while the room plays.
    It needs a foreground-service permission and a Play declaration, but no internet. I know the launch review
    deferred it; for a stage metronome it comes first.

### S5. Make the room sound like a band
- **Evidence:**
  - The harmony is a held pad, piano or organ (struck again on each bar), a guitar chugging every subdivision, or an
    arpeggio (`practice/engine.js` `_harmony`).
  - 118 of the 124 drum patterns are one bar long, repeated, with fills only at phrase ends.
  - There is no swing amount, no push or lay-back, and no humanising (`drums.js`, `styles.js`).
  - Stop simply cuts the sound.
- **Why it matters:** reggae with a pad and no skank, swing with a held chord, or funk with no guitar scratch feels like
  a drill, not a jam. A real drummer varies the bar and ends the tune.
- **Suggestion (M, fits; all data plus engine work like `chugNote`):**
  - **Comping per pattern from data** (`comp: 'skank'`):
    - reggae and ska skank on the off-beats;
    - swing comping (Charleston and anticipations);
    - funk 16th scratches;
    - bossa and samba guitar;
    - gospel piano;
    - country boom-chick;
    - Motown 8th piano.
  - **Feel:**
    - a swing amount from 50 to 75% (the triplet is too heavy at 240 BPM and above);
    - laid back or on top (±10–30 ms);
    - a light humanise (the round robins already exist).
  - **Variation:**
    - a B bar per pattern (open hat, a different kick) every 2 or 4 bars;
    - verse (hats) and chorus (ride and crash) driven by M2's sections.
  - **Count-off and ending:**
    - a 2-bar count-off on the hats ("1 . 2 . 1 2 3 4");
    - **End**: play to the end of the form, then stop on a hit or a held chord.

### S6. Metronome details a working player expects
Each is S and fits.
- **Click on 2 and 4 only** (jazz), on 1 only, or on the "and" only.
  - Evidence: a beat light toggles between accented and plain, but never silences a beat (`practice/accents.js`).
  - Suggestion: a third tap state, silent.
- **Keep my tempo when picking a pattern.** Evidence: `ui/practice.js:500–501` sets the pattern's own tempo.
- **A practice timer in the room:** a "10′" countdown with a soft bell.
- **A stage view:** big full-screen beat flashes and an optional vibration pulse, for silent count-ins and in-ear gigs.

### S7. Ear training for gigs
- **Evidence:** 3 ear-training exercises, plus the interval quiz (#224) (Library → Topics).
- **Suggestion (M, fits):**
  - **Call and response on any line** (groove, lick, study): the app plays a bar with the dots hidden, the next bar is
    silent for my answer, then the answer shows. The Quiz reveal and the ear rounds' silent answer step already exist.
  - **Bass-line dictation:** 2–4 hidden bars from the groove cells, replayed at will, then revealed.
  - **Hear the changes in a groove:** drums plus a progression, slash basses included; name the numbers. Today's
    "Hear the progression" exercise, played with drums over longer forms.
  - **Find the tonic of a vamp.**

### S8. Band craft in the course, and more groove vocabulary
- **Evidence:**
  - **The course:** Stages 5–6 (17 units) are bebop, superimposition, Coltrane, Messiaen and chordal jazz. Playing with
    a pick is an optional Stage 2 lesson.
  - **Library topics:** Grooves has 11 exercises, built on about 30 one-bar cells repeated unchanged through the
    progression (`GROOVES` in `curriculum/grooves.js`). The drums have 124 patterns. Slap has 4 exercises.
- **Why it matters:**
  - Most working bassists are paid for covers, functions, theatre, sessions and church.
  - Those gigs ask for:
    - locking with the kick;
    - following a form from a chart;
    - fills into a section;
    - dynamics;
    - count-ins and endings;
    - a pick tone;
    - Motown, disco, reggae, country, gospel and Latin vocabulary;
    - learning songs fast.
- **Suggestion (M–L content, fits):**
  - **A "Working player" unit in Stages 2–4, or an optional track:**
    - form and road maps;
    - count-ins and endings;
    - the fill into the chorus;
    - playing with drums alone;
    - transposing a tune on the spot;
    - Nashville numbers.
  - **Groove cells as 2- and 4-bar phrases** with a variation and a fill bar, one set per drum genre. Pair them in
    data: each drum pattern names its bass grooves.
  - **More slap:** 16th-note octaves, triplet thumb-pop-hammer figures, left-hand slaps.
  - **More pick:** palm muting, string crossing, tremolo picking.
  - **Three-finger plucking and Motown thumb muting** as exercises. Today they are only tips.

### S9. My own routine
- **What is missing:** a routine I build myself, for example "15′ chromatic at 112 → 15′ reading → 30′ the Saturday
  set".
- **Evidence:**
  - Today's session is planned by the app, and its rows cannot be swapped (`ui/course.js`).
  - The room never appears in the session.
  - Favourites keep the exercise only, not its options.
  - The best tempo is stored, but only its latest value is shown.
- **Suggestion (M, fits):**
  - "My routine": items with their options, tempo and minutes, played in order with a timer. A tune (M1) or the room
    can be an item.
  - A tempo history per exercise (best tempo by week), to see chops move.

### S10. Loop a few bars inside an exercise
- **Evidence:** an exercise loops whole (`player.loop`). Studies only split into Parts.
- **Suggestion (S–M, fits):** pick a start and an end bar on the tab strip, and let the speed trainer work on that
  hard bar.

---

## Nice to have

- **N1. Slap and pick sounds for the slap and pick exercises.**
  - Today the samples are fingerstyle only (`web/audio/bass/`: regular notes and ghosts), so slap demos sound plucked.
  - Make the sound automatic per exercise, so the "no sound options in Settings" decision stands.
  - It needs a free library and the owner's OK to download.
- **N2. Slides, glissandi, vibrato, and staccato or legato marks, with their sounds.**
  - Today a slide exists only as words in tips (`technique.js:298`, `licks.js:297`).
  - Fretless players and Motown lines live on them.
- **N3. Metre and tempo changes inside a form,** building on M2: 7/8 + 4/4 bars, a ritardando, a fermata, a vamp until
  the cue. Theatre and prog need them.
- **N4. Share a tune or a chart** as text or PDF through Android's save or share, as Backup already does. Fits. A shared
  band setlist in the cloud would need the internet.
- **N5. Nashville numbers** (1 4 5 6–) as a display toggle on the chips and the chart. S.
- **N6. A note per day in the practice log** ("bridge of the opener at 104"), and minutes per topic.
- **N7. Foot pedals.** Bluetooth page-turner pedals send arrow, Page and Space keys. The room already takes Space and the
  arrows. Map Page Up and Page Down to the previous and next tune of a setlist, and say so in the ⓘ.
- **N8. A few gig staples missing from the drums:**
  - rock'n'roll (in the style of Chuck Berry);
  - big-band swing;
  - New Orleans funk;
  - go-go;
  - bolero;
  - Mozambique;
  - nyabinghi;
  - a cut-time show march;
  - gospel 6/8.
- **N9. Monitoring the bass through a USB interface,** mixed with the backing. L, and Android WebView's input latency
  is doubtful: probably not worth it.
- **N10. Looking up a song's tempo, key or chords.** It needs the internet, so it does not fit the stance. Skip it.

---

## Free or Pro (for the owner to decide; one line each)

- **Tunes (M1):** free; they bring players back every day. **Setlists:** Pro.
- **Track import (M5) and recording (S1):** Pro. They have high perceived value and cost nothing to run.
- **Drums under exercises (M3):** follow the room's split, so the free patterns stay free.
- **When any of these ships:** update `proDetails` and the Pro sheet's list (the Pro rule in CLAUDE.md).

---

## Already strong (short)

- **Metronome:**
  - 1–660 BPM;
  - accents and odd groupings;
  - muted bars;
  - speed up with a ceiling;
  - tap tempo;
  - a Start button you can move.
  It beats most standalone metronomes.
- **Drums:**
  - a recorded stereo kit;
  - 124 original patterns in 13 genres;
  - fills;
  - odd-metre patterns that regroup to the player's own accents, which is rare in any app.
- **Harmony:**
  - a drone on any chord;
  - 44 progressions, including the 12-key cycles;
  - My progression by degree, so the Key transposes a tune in one tap;
  - the Neck follows the chord or its scale, with correct spelling.
- **The exercise engine:**
  - any key or all 12;
  - 4-, 5- and 6-string, left-handed;
  - real fingering;
  - tab or properly engraved staff;
  - the guide bass mutes for playing along;
  - a speed trainer and step mode.
- **Jazz depth:** walking lines, original licks, chord-scale and superimposition. A trio player finds real material.
- **Offline and private:** no account, a backup to a file, and a practice log with a daily goal.
- **The tuner:** reaches a 5-string's low B, with an adjustable A4.
