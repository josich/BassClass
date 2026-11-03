# QA deep report · 7c4c571 · 2026-11-03
Summary: 1 critical, 5 major, 7 minor, 0 visual. Runs: seeds 2401 (330 steps, 800x380, 4-string), 2402 (340 steps, 640x360, 6-string, left-handed, Do-Re-Mi), 2403 (330 steps, 915x412, 5-string, Pro gates on, free at the start); 1,000 steps, about 25 minutes of monkey time, plus targeted runs on the round's features.

Scope: ee6a706..7c4c571 (14 commits): the classic tunes (#124 #125 #249 #250 #353–355 #451–453 #552 #553), the theory games #251 and #454, tap mode for the note-guessing drills (#225 #226 #315 #412, reading drills opening in tap mode), the course's keyed steps (`CHANGED_STEPS` rev 12), Lesson 2.16 on #227 (rev 13), games and ear checks as lesson steps, no-dots test steps and the "No dots" label mode, Audio delay per device (`output.js`), the classical melodic minor, the Pro sheet highlights, QA round 23's fixes. The `qa` server (port 8878) served the working tree, clean at 7c4c571 for the whole run (only `qa/` files untracked). Recorded takes stay on hold and were not tested.

Tool added: `qa/tools/monkey24.js`, a self-contained monkey pasted into the qa tab (no second server). It stubs confirm, alert, window.open and getUserMedia, blocks external, mailto and download controls, teleports to this round's screens (tunes, theory games, tap drills, lesson tap steps, no-dots steps, bad routes), taps the neck through the fretboard's own `onTap`, and watches errors, NaN/undefined/null text, sideways scroll, ⓘ bubbles, NaN in SVG and Players playing off an exercise.

## Critical

### C1. Unticking one lesson step can wipe every ✓ Cleared choice of its exercise, behind a question that says only one goes
- Where: `web/js/course/progress.js:197-202` `untickStep()`, called from the lesson page's ↺ (`ui/course.js:513`) and from the step's goal button (`ui/exercise.js:663`).
  - It unclears the step's own choice (`setCleared(…, false)`).
  - Then, if the step is still covered, it calls `setMastered(step.ex, false)`, which sets `cleared: {}` (`mastery.js` `setMastered`).
  - The comment says this is meant for "an exercise mastered before the choices, with none cleared". But the step stays covered whenever the exercise is still mastered after losing that one choice. That happens on every 80% exercise (`P80`, `ALL(…, { pct })`) with more choices cleared than it needs, or when the step's own choice was not among the cleared ones.
- Steps:
  1. Clear enough choices of #236 Common progressions: root notes (hm-progression-roots, 26 choices, 21 needed) for 🏅. Here: all 26.
  2. Open Lesson 2.23 Progressions. Its step 1 shows "· 🏅 mastered in the Library".
  3. Tap ↺ and confirm. The question reads: "This step is ticked because you mastered its exercise in the Library. Untick it? ✓ Cleared on I – V – vi – IV is taken back there too, and 🏅 Mastered with it."
- Expected / Actual:
  - Expected: I – V – vi – IV uncleared. 25 of 26 still cleared, so the exercise stays mastered, or loses only 🏅.
  - Actual: all 26 choices uncleared.
- Evidence (the same function the UI calls after the question):
  - Before: `{ done: 26, of: 26, need: 21, mastered: true, coveredBy: 'mastered' }`.
  - After `untickStep(L, 0)`: `{ done: 0, of: 26, need: 21, mastered: false }`.
  - Each of those 26 had needed a full loop at its goal tempo plus a tick. There is no undo.
  - Round 22's question still said "with its ✓ Cleared ticks". The new text dropped that warning, but the code still wipes them in this case.
- Fix idea: call `setMastered(false)` only when the exercise has no cleared choice left after the first call (the old-rule mastery the comment means). Otherwise let `settle()` decide.

## Major

### M1. Classic tunes: finger numbers jump to 1 on almost every note where the chord changes every beat (Canon, Bourrée, Air, Amazing Grace)
- Where: `web/js/curriculum/common.js:870-875`. `emitMixed()` re-fingers each chord part with `chordFingers(ps)` (`fretboard.js:223`), and `handFingers` labels the lowest fret of each part as finger 1.
  - The tunes change chord on every beat (Canon, Air) or more often (Bourrée, Grace, Invention). So a part is one or two notes, and each gets "1" (then "2").
  - This overrides the hand position `assignFingers` worked out for the line.
  - The song studies, with longer chords, are not affected.
- Steps: open #353 Canon in D, Part "Violin, bars 3–6", ⋯ → Dot labels: Fingers, step through with →.
- Expected / Actual:
  - Expected: one hand position with its fingers, e.g. F♯ G-11 (4), E G-9 (2), D G-7 (1)…
  - Actual: on screen `s3f11:1 s3f9:1 s3f7:1 s3f6:1 s2f9:1 s2f7:1 s2f9:1 s3f6:1`: the index finger on every note, sliding 11 → 9 → 7 → 6.
- Evidence: the share of consecutive notes played by the same finger on a different fret, per part (built at default options, 4-string, highest fret 20). The 30 song studies give 1.5% (32 of 2,112 notes).

| Tune, part | Notes on finger 1 | Same finger, new fret |
|---|---|---|
| Canon, violin bars 3–6 | 16/16 | 15 |
| Canon, ground bass | 8/8 | 3 |
| Bourrée, bass second half | 53/69 | 36 |
| Bourrée, bass first half | 24/33 | 15 |
| Bourrée, melody second half | 55/84 | 24 |
| Air, second half | 52/93 | 20 |
| Amazing Grace | 23/35 | 9 |

- Two examples from the Bourrée melody's second half:
  - `C3 f10·4 | B2 f9·1`: the 4th finger on fret 10, then the 1st on fret 9 in the same position.
  - `G#2 f6·1 | A2 f7·1`: the index on two neighbouring frets in a row.
- Fix idea: in `emitMixed`, keep `chordFingers` for chord parts long enough to be a hand shape (two beats or more, or three notes or more). Otherwise keep the line's own fingering from `assignFingers`.

### M2. #415 Harmonic & melodic minor never offers the classical melodic minor, although its text, its tip and Lesson 4.15 say it does
- Where: `web/js/curriculum/scales.js:373`. `minorFamily` filters the base `sequences` Scale options with `only: { type: [..., 'melodicClassical', ...] }`. `variant()` (`common.js:64`) can only filter, and the base list (`scales.js:151`, `ALL7` + pentatonics) has no `melodicClassical`. So the choice is dropped.
- Evidence:
  - `params.type.options` of sc-minor-family: `aeolian, harmonicMinor, melodicMinor`. `choicesOf('sc-minor-family')` gives 3 choices; the commit says "Four choices now count for 🏅".
  - `#/ex/sc-minor-family?type=melodicClassical` opens on Harmonic minor.
  - The engine works when called directly: `A B C D E F♯ G♯ A G F E D C B A` (straight); every sequence uses melodic going up and natural minor coming down, with key signature 0 for A minor.
  - The text promising it:
    - the about text and tip ("Classical: the 6th and 7th raised going up, ♭7 and ♭6 coming down");
    - Lesson 4.15's concept: "(the classical form, also under Options)";
    - CLAUDE.md, review item 5, "done".
- Fix idea: add the option to the variant's own `params.type` (or let `variant` add options), and check it in the self-test.

### M3. #315 Hear the 7th chord, set "…plus m(maj7), 6 and m6", in tap mode: on a 6th chord it says "tap its 3rd, 5th and 7th", but the answer is the 6th
- Where: `web/js/curriculum/ear.js:75` `chordAsk()`: `ask: ... tones.length === 2 ? '3rd and 5th' : '3rd, 5th and 7th'`. `SEVENTHS.all` (`ear.js:135`) includes `maj6` and `min6`.
- Evidence (300 rounds):
  - "G♭6 | The chord over its root: tap its 3rd, 5th and 7th | needs 3 5 6 | Major 6th: R 3 5 6", and the same for A6, Gm6 and Bm6.
  - A player who hears a 6th chord and taps the 7th they were asked for is marked wrong.
  - It plays in tap mode in the Library (default) and in Stage 5's test: `s5-test.13` is ear-sevenths `{ set: 'all' }`.
- Fix idea: name the tones from the chord's intervals ("3rd, 5th and 6th"), or "tap its other notes".

### M4. Today's session: an ear-training or reading row taken from the Library opens in tap mode (the new default) and never ticks
- Where: `ui/exercise.js:1569`. In tap mode `routine?.played?.()` is called only inside `if (lesson && !demo && !preview && presetOk())`. A session row from the Library (`libItem` in `ui/course.js:78`: no `ls`) has no lesson.
  - Since 2d1a97d the reading drills (`tap.def` in `reading.js`) and #225, #226, #315 and #412 open in tap mode.
  - So a set played through does not mark the row played. The play-mode paths (`exercise.js:328`, `:365`) are never reached.
- Steps (through the app's own routine):
  1. `setRoutine([{ id: 'iv-ear-quiz', params: { key: '0', set: 'basic' }, slot: 'Ear and reading', key: 'qa-tap-test' }], 'Session')`.
  2. Open its `routineHref`. The button reads "1/1 Finish ✓".
  3. ▶, then answer all 10 questions.
- Expected / Actual: the end card shows "0 of 10", progress `plays: 1`, and the session's `cur.played` stays `[]`.
- Where it bites:
  - The "Ear and reading" focus falls back to the Library when the player has met no ear step (`pickFor`, `ui/course.js:146`; only `t.game` is excluded).
  - The Library fill-ins too.
  - The row stays unticked unless the player finds 👆 and plays a full loop in play mode.
- Fix idea: call `routine?.played?.()` when any tap set ends, outside the lesson branch (as play mode does for a full pass).

### M5. Lesson pages describe the new tap steps as play-along rounds
- Where: `ui/course.js:505` and `:544`.
- What the lesson page says:
  - Every step without a goal reads "#227 · one full round".
  - The ⓘ "About the steps" says "👂 One full round, then ✓ if you named every answer first".
- What the step itself does: once opened, it says "🎯 8 of 10" and "Goal: a set of 10 with 8 or more right", and it ticks itself at 8 of 10. Nothing is ticked by hand.
- Affected: the 29 game and ear-drill steps (listed by `ex.game || tap.kind === 'ear'`), from 1.9 `sharps-flats.2` to `s6-test.11`, including the tests' new ear steps.
- Evidence: page text of `#/course/interval-ear`: "Hear it, tap it: intervals… #227 · one full round". Opening step 1 shows the goal button "🎯 8 of 10".

## Minor

### m1. "No dots" is never remembered: choosing it erases the exercise's saved Dot labels
- Where: `store.js:77`: `LABEL_VALUES = ['note', 'degree', 'finger', 'none']`. `cleanEntry` runs on every `updateProgress`, so `label: 'hide'` is dropped at once, together with the label saved before.
- Evidence:
  - `updateProgress('sc-one-octave', { label: 'degree' })` then `{ label: 'hide' }`: the stored record has no `label` at all.
  - The next visit opens with the exercise's default labels, not No dots and not Degrees.

### m2. A wrong tap on a note-in-any-octave question says "here on 5 strings" on a 4-string bass
- Where: `ui/exercise.js:1524`: `· here on ${places.length} strings`. For a `pc` answer (theory games, #412, note-finding) the places include fret 0 and fret 12 of the same string.
- Evidence: #251, "tap the 3rd of C♯m", tapped F: "✗ E, not F · the 3rd of C♯m · here on 5 strings", on a 4-string. The places shown: E0, E12, A7, D2, G9.

### m3. A tap set in a lesson step offers "Harder", which changes the step's own option
- Where: `ui/exercise.js:1598`: the end card's Harder button sets `p[k0]` in a lesson too.
- Evidence:
  - Lesson 2.16 step 1 (`set: triad`) at 8 of 10: the card offers "Harder: Every interval to the octave".
  - Pressing it plays a set on another option, which `presetOk()` refuses, so that set does not count for the step.
- Fix idea: leave Harder out in a lesson.

### m4. Audio delay's test is silent when the metronome volume is 0%
- Where: `ui/screens.js:456`: the 12 test clicks are `A.click()`, which goes through `clickBus` at `clickVol * CLICK_TOP` (`audio.js:172`, `:211`).
- Effect: a player who turned the click off with Settings' metronome slider hears nothing and gets "Not enough taps to measure". Code reading; the test itself measured right (taps 200 and 211 ms after their clicks gave 210 ms).

### m5. Theory and ear games name some minor-type chords on black keys with flats: A♭m13, A♭m6
- Where: `T.bestRoot(pc, ivs)` in `games.js` (`game-harmony` extensions) and `ear.js` `chordAsk`. The lead-sheet rule in CLAUDE.md is sharps for minor-type chords there (G♯m).
- Evidence:
  - "the 13th of A♭m13 → F" (A♭m13 holds C♭), while the same root is "G♯m9" and "G♯m11" in the same game.
  - #315: "A♭m6 = C♭ E♭ F".
- Also: #454 Altered writes the ♯9 as a sharp: G7 → A♯, C7 → D♯, F7 → G♯. The licks' rule in CLAUDE.md writes the ♯9 the easier way, B♭ over G7. Any octave and either name is accepted by the tap, so only the name shown differs.

### m6. Library search: "Bach" lists Petzold's Minuet first and the anonymous Musette, and "classic" does not bring up the Classic tunes
- Evidence: "Bach" gives 6 results, in this order: 354 Minuet in G (Christian Petzold), 451, 452, 552, 553, 355 Musette (Anonymous). Their texts mention Anna Magdalena Bach's notebook.
- "classic" lists 10 lessons, then 31 exercises led by "classic warm-up" and Classical Thump. The 12 tunes are not among the first 14 cards. "classic tunes" finds all 12.

### m7. A one-part tune opened with a `part` in its address goes Home without a word
- Where: `tune()` in `tunes.js`: `order = [Number(p.part) || 0]`. A single-part tune has no `part` option, so the screen does not validate it, and `parts[1]` is undefined. The build throws, and the router falls back to Home.
- Evidence: `#/ex/tn-saints?part=1` lands on `#/`, while `#/ex/tn-entertainer?part=0` and `#/ex/tn-ode?foo=1` open. No error is logged.
- Reached only by a hand-made link.

## Visual

None found. Measured at 640x360, 800x380 and 915x412 (`getBoundingClientRect`, `elementFromPoint`):
- the tune screens;
- the theory-game prompt ("tap the minor key with three flats", x 335–570);
- Lesson 2.16;
- the Band panel with its Volume row;
- Settings' Audio delay (82–626 px at 640);
- the Options sheet's "✓ 0 cleared · all 4 needed for 🏅".

Nothing outside the window, no sideways scroll, no overlap. The only targets under 32 px are the rail logo, 30x36 (known). Header subtitles end in an ellipsis, as before.

## Checked and fine
- Self-test: 262 exercises, 268 lessons, 124 drum patterns, 31,703 builds, 1,742,029 notes, problems 0 (17 s).
- Classic tunes against public-domain scores:
  - Checked bar by bar against the score:
    - Ode to Joy bars 92–107: Wikipedia's cello and bass example, including "fis2 g4 a" and the tied F♯ into bar 104.
    - Amazing Grace: Wikipedia's New Britain, 15 bars with "me" a half note.
    - Musette BWV Anh. 126, left hand bars 1–20: Mutopia.
    - Invention No. 4, lower voice bars 3–16: Mutopia.
    - Bourrée BWV 996, both voices, both halves: Mutopia.
    - The Entertainer, first strain with its first ending: Mutopia.
  - Pitches, octaves (as stated), durations and ties all match.
  - Checked from memory only:
    - the Prélude bars 1–10;
    - the Minuet;
    - the Canon's ground and violin;
    - the Saints;
    - Greensleeves' shape;
    - the Air's first half.
  - Not checked against a score: the Air's second half.
- Tunes as built:
  - Bars:
    - whole bars on every part;
    - key signatures right: G Dorian 1♭, E and D Aeolian 1♯ and 1♭;
    - 2/4, 3/4, 3/8 (unit 2) and 6/8 (`bpb` 2, compound).
  - Notes and strings:
    - MIDI equals tuning plus fret;
    - no low B on 5- and 6-string;
    - frets over the highest fret only where the pitch has no lower place, as decided.
  - The Backing parses all 65 chord symbols, slash chords included, with no empty track.
  - Engraving: no NaN; 11 ties in The Entertainer, 1 each in the Ode and the Saints; no tuplet brackets in 6/8.
  - Labels: no odd values beyond jazz names over dominants, as the rules say.
- Timing (logged Player, MessageChannel timer):
  - Invention 3/8 at 104: count-in 3 clicks, beat 0.5769 s, step error 0 ms.
  - Musette at 160 and Greensleeves at 120, trainer +10 to 200: count-in one bar (2 clicks), loops at 170 and 180, step error 0 ms, no loop seam.
- Theory games, 600 rounds a mode, each answer's spelling and pitch class checked by hand:
  - keys by signature (all 26 right);
  - numerals in major and minor;
  - degrees;
  - triad and 7th-chord tones;
  - extensions;
  - altered tones written plainly (A♭7's ♭9 A, E♭7's ♭13 B, D♭7's ♭13 A).
  - No double accidentals or C♭ F♭ E♯ B♯ in answers.
  - #412's numerals by semitones are right (IV 5, V 7, vi 9, ♭VII 10, ♭III 3, ♭VI 8, VI 9, ii 2).
- Tap flow:
  - #251: "✓ F♯ · the 3rd of D+".
  - Lesson 2.16 step 1 at 8 of 10: "✓ Step passed", the step clean, `triad` cleared in the Library, goal button "✓ Cleared".
  - #225 tap rounds from every key: roots 32–47, answers under G3.
- Course:
  - `step-diff10.py ee6a706 7c4c571`: 61 steps changed in place, all in `CHANGED_STEPS` rev 10–13; 23 appended; none removed.
  - A rev-11 player with Stages 1–2 done, old step counts:
    - every lesson stays complete;
    - Continue goes to 3.1, level 3;
    - 2.16's two steps unticked to replay.
- No-dots test step `s1-test.7`: no dots, Dot labels "No dots", 15 "?" in the tab, the prompt empty.
- Audio delay:
  - Measure with taps 200/211 ms late gives 210 ms. `visualDelay` follows: 0.21 s, then 0.18 for "bluetooth:Galaxy Buds2", 0 for the speaker, 0.18 back on the buds.
  - The offer toast shows once.
  - A garbage `bassclass-output` event is ignored.
  - A 200-character name is cut to a 70-character key.
- Pro (gates on, free):
  - The tunes of Levels 4–6 open as previews (first bar, then the Pro tip).
  - The Pro sheet: "131 more exercises (15 of them song-style studies, 5 classic tunes)", the six highlights, and "See everything Pro opens" with Classic tunes per level.
- Corrupt storage, read back by a fresh app in an iframe; no errors, no NaN on Settings, #/ex/tn-air or #/ex/game-theory:
  - `bandSounds: {'gr-roots': 'kazoo'}`, `bandVol: 250`, `bandHint: 'yes'`, `audioDelays: {default: -5, 'bluetooth:x': 99.5}` and `delayAsked: 'all'` all go back to their defaults.
  - Progress `bests: {triads: 'x', sevenths: 11}` and `best: 1e9` are dropped.
- Bad routes, all drawn or falling back with no error:
  - `?part=2` (the Air's hidden part), `?part=99`, `?part=-1`;
  - `?ask=zzz`, `?ask=__proto__`, `?set=nope`, `?set=constructor`;
  - `#/ex/251`, `#/ex/454`, `#/ex/553`;
  - `#/m/tunes`, `#/m/core`.
- Library search by composer:
  - "Joplin", "Beethoven", "Pachelbel", "Petzold", "Anonymous", "hymn", "ragtime" and "cello" find their tunes.
  - The cards name composer and year.
- Memory, 60 cycles. Each cycle:
  - opened a tune, game or ear drill;
  - played and stopped;
  - opened Options and closed it with Escape;
  - went back Home.
  - Results: heap 17.9 → 18.7 → 19.9 → 18.7 → 19.6 → 19.5 → 20.3 MB (no steady growth); nodes 458 flat; animations 0; localStorage flat; no Player left playing.
- Monkeys: 0 uncaught errors, 0 NaN/undefined text in the app, no sideways scroll, no second ⓘ bubble, no Player off an exercise, no preview looping. The only "null" seen was the Pro debug panel's state JSON (dev only).
- ★ core list: 29 exercises, the same numbers as CLAUDE.md.
