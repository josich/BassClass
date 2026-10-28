# QA deep report · 267b86f · 2026-10-28
Summary: 0 critical, 4 major, 9 minor, 0 visual.

Runs:
- Seeded monkeys (`qa/tools/monkey20.js`: monkey19 plus a watcher for the rate card, "New" chips, NaN in SVG, `bassclass.new.v1`/`rate.v1` shape and the session's 🎧 rows), 1,040 steps:
  - seed 2001: 340 steps, 800x380, 4-string, log at 10 h 1 min (the rate reminder armed);
  - seed 2002: 340 steps, 640x300, 6-string, left-handed, Do-Re-Mi;
  - seed 2003: 360 steps, 640x300, 5-string, 20% teleports.
  - Gates and ownership switched mid-run by the monkey.
- Content checks over every option (`qa/tools/checks20.js`):
  - the six Pentatonic colours exercises: 2,592 builds, 62,748 notes (every lick x 12 keys x 4/5/6 strings x highest fret 17/20/24);
  - `hm-chord-formulas`: every family x 12 keys x root string x 4/5/6;
  - `tech-harmonics` and `tech-harmonic-chords` on 4/5/6 strings at 17/20/24 frets.
- Stored records read back by a fresh app (`qa/tools/state20.js`, 14 cases): `bassclass.new.v1`, `rate.v1`, `course.v1` `placed`, `log.v1`.
- Placement and level logic by hand (fresh stores, old and new `placed`), the rate reminder, Feedback with a stubbed bridge, the room's 14 new progressions in 12 keys (spelling and the Neck's scales).
- Player timing (logged `_q`), samples and yin, the piano's pitch after its octave fix, `__fills19` again.
- Layouts at 800x380, 640x300 and 360x780 (16 screens, scrolled top / middle / end; `qa/tools/layout20.js`).
- Memory: 60 cycles of Home, Library, two new exercises, a lesson, the room with its picker, Settings and the rate card.
- About 95 minutes.

Scope: 3219994..267b86f (b18d55b QA round 19 fixes and 13 commits after). Test setup: the `qa` preview server (port 8878) on the working tree at 267b86f (clean), my own tab, service workers and caches cleared first. Pro gates off unless stated (switched on with the debug panel's record where a check needed them).

## Critical
None: no crash, no data loss, no state without a way out. No console error in any run.

## Major

### M1. Any placement made after this update stops at the Stage 3 test: "All yes" up to Stage 6 gives My level L3
- Where:
  - `web/js/ui/course.js:528-568` (`PLACEMENT`): no line names the new units `u-pent3` (Stage 3) and `u-pent4` (Stage 4), so a placement never marks them known.
  - `web/js/course/progress.js:220-221` (`isKnown`): a stage test is known when every unit of its stage is known, or was `added` AFTER the placement (`state.placed < u.added`). A placement made after the update (any new player, or anyone who opens My level again) fails that test for Stages 3 and 4.
  - `progress.js:261-266` (`addedLater`): it skips the new units' lessons and checkpoints (later lessons are known), but a stage test has no unit, so `open(test)` is true.
- Steps (fresh store, gates off):
  1. Home → My level → "All yes" on Stage 6 (it says yes to every stage) → See my starting point.
  2. Or "All yes" on Stage 3 only.
- Expected: "You know Stages 1–6" (course complete, level 6), or a start at Stage 4's first lesson.
- Actual, both cases:
  - Toast: "Start here: Stage test: Harmony on the neck".
  - Home: "My level L3"; the Course row reads "▶ Continue · Stage test: Harmony on the neck".
  - `status(s3-test)` and `status(s4-test)` are 'new'; `status(s5-test)` is 'known'.
  - 55 of 57 units are known: all but `u-pent3` and `u-pent4`.
  - Today's session is planned for Level 3.
- Control: the same store with `placed` moved before `added` (1793100000000) gives "✓ Course complete" and My level L6. So the bug hits only placements made from now on.
- A free player (gates on) is sent to the free Stage 3 test the same way, instead of the "✓ Stages 1–3 / Stages 4–6 Pro" row of round 19.
- Fix ideas:
  - add `u-pent3` to a Stage 3 placement line (e.g. the scales line with `u-scales3`) and `u-pent4` to a Stage 4 line (`u-keys`);
  - or let a stage test be known when every unit the placement can ask about is known;
  - add a self-test check that every unit is named by a placement line.

### M2. The update takes "known" levels away from players who mastered 80–84% of Library Levels 3–5
- Where: `web/js/mastery.js:83-86` `levelPassed`: done / total >= 0.8, worked out on the fly over today's list.
- This update adds exercises to the denominators:
  - Level 3: 43 → 46 (+320, 321, 332). 80% needs 37, not 35.
  - Level 4: 43 → 46 (+416–418). 80% needs 37, not 35.
  - Level 5: 48 → 50 (+504, 512). 80% needs 40, not 39.
- A player with 35–36 of Level 3's or Level 4's old exercises mastered (81–84%), or 39 of Level 5's (81%), had that stage known before the update and not after.
- Evidence: a store with Stages 1–2 placed and 35 old Level 3 exercises mastered gives:
  - `levelMastery(3)` {done 35, total 46}, so `levelPassed(3)` is false (it was 35/43 = 0.814 before);
  - `firstGap()` "u-legato-check" (Stage 3).
  - The player's level, Continue and Today's session all move back into Stage 3.
- The unit and lesson `added` logic was written so that "players already past them are not sent back". This path is not covered, and it will recur with every future addition ("built to grow").
- Fix idea: remember a level once it is passed (store the level, as `done` is stored), or leave exercises added after the pass out of that level's count.

### M3. Minor bossa: the ii–V–I into ♭II mixes spellings in E♭ minor and B♭ minor
- Where: `web/js/curriculum/common.js:343`. The ♭II maj7 is awkward and chromatic, so it takes its lead-sheet name (F♭maj7 → Emaj7, C♭maj7 → Bmaj7). The V7 before it keeps the key's spelling because it "leads" (round-17 rule), so the pair no longer reads as a 5th.
- Practice room, `progression('minor-bossa', pc)`, minor keys:
  - E♭m: E♭m7 A♭m7 Fm7♭5 B♭7♭9 **F♯m7 C♭7 Emaj7**. The ii and I are respelled sharp, the V stays C♭7 with a B♭♭ 7th.
  - B♭m: B♭m7 E♭m7 Cm7♭5 F7♭9 **D♭m7 G♭7 Bmaj7**. G♭7 → Bmaj7: a V7 and its I a diminished 4th apart.
  - The other 10 keys are consistent (Cm: E♭m7 A♭7 D♭maj7; G♯m: Bm7 E7 Amaj7).
- The same chords show in the Library, where the new progressions are options too:
  - `hm-progression-roots` @E♭m: "F♯m7 C♭7 Emaj7";
  - `hm-chord-tones` @E♭m: "F♯m C♭ E", and @B♭m: "D♭m G♭ B".
- Scan of every `PROGS` entry in 12 keys for a V–I (root a 5th down, major 3rd) not spelled a 5th apart: only these two are new. The others (`blues` G♭7 → B7, `cycle-dom7` G♭7 → B7) are the cycle and double-flat rules already decided.
- Fix idea: when the chord a dominant leads to is respelled, respell the dominant (and its ii) the same way (F♯m7 B7 Emaj7; C♯m7 F♯7 Bmaj7).

### M4. Three new drills change chord or key off the bar line (two off the beat)
Known answer: the project keeps chord and key changes on bar lines in drills (broken chords hold the root to the bar line; chord-scale drills are written 8ths "so the subdivision never moves a chord off its bar line"). Evidence from the Player's own layout (`pl.starts`, `pl.total`) and a logged `_q`:
- `hm-chord-formulas` (#332; lesson 3.31 and the `u-sevenths3` checkpoint):
  - each chord is up its formula and back down, 2n−1 notes;
  - at its 8ths, 7th chords change at beats 0, 3.5, 7, 10.5…: C7 starts on the "and" of beat 4;
  - triads change every 2.5 beats (Cm @2.5, C+ @7.5); extended chords every 4.5–5.5 beats;
  - the about text tells the player to turn the Backing to Chords, which then changes chord on off-beats too.
- `sc-pent-double-stops` (#512; lesson 5.41, `u-solo-check`):
  - one key is 7 pairs (4ths) or 9 (every other note): 7 or 9 beats in quarters, 3.5 or 4.5 in 8ths;
  - a single key loops on whole bars with 1 to 3.5 silent beats added (logged: steps at beats 0–6, loop at 8);
  - in "All 12 keys" (cycle4, cycle5, chromatic) nothing is padded: Cm7@0, Fm7@7, B♭m7@14, E♭m7@21…, so the key and the Backing's chord change on beat 4, then beat 3, and so on;
  - the checkpoint step (`pattern: skip`, 8ths) plays 4.5 beats then 3.5 beats of silence.
- `tech-harmonic-chords` (#504), default "One by one, then together": 1+1+1 beats then the chord for 3, so 6 beats a chord. Every other chord (Esus2, Cmaj7♯11, D5) starts on beat 3 (logged steps 0, 1, 2, 3, then 6).
- Fix ideas:
  - hold each chord's last note (formulas) or a key's last pair (double stops) to the bar line, as `fill` does for broken chords;
  - make the roll 1+1+1+1 or the held chord 5 beats (two bars a chord).

## Minor

### m1. The rate card can open over a screen the player has just entered
- Where: `web/js/app.js:105`, `setTimeout(maybeAskRating, 900)` after leaving an exercise or the room, and `web/js/ui/course.js:346`, 2.6 s after ✓ Practised. `web/js/ui/rate.js:35` `busy()` checks only sheets, pickers, bubbles and a hidden page, not the screen or a running Player.
- Reproduced with the gates on and a log of 601 min:
  - `#/ex/sc-one-octave` → Home → within 0.3 s `#/ex/tech-1234`: at 1.2 s the rate card is open over the new exercise (`body.in-ex` true). Play pressed in that second would play under it.
  - The room → Tuner: the card opens over the tuner (also seed 2001, step 99).
- Fix idea: in `maybeAskRating`, also skip when the current screen is an exercise, the room or the tuner, or when a Player is playing.

### m2. Today's session: rows that read exactly alike
- A brand-new player's 30′ plan:
  - 1 Notes and rests · 2 Natural notes on one string;
  - 🎧 Hear it: Open strings · 3 Open strings;
  - 🎧 Hear it: Alternate plucking (index–middle) · 4 Alternate plucking (index–middle) · 5 Alternate plucking (index–middle);
  - 🎧 Hear it: Open strings · 6 Open strings · 7 Open strings.
- They are lesson 1.1 `hold.0`, 1.2 `pluck.0/1` and 1.3 `open-strings.0/1` (different reps and starting fingers), but nothing tells them apart: "Open strings" three times and "Hear it: Open strings" twice.
- This follows from the user's choices of 2026-10-27/28 (no lesson numbers or variants; demos named after their exercise). The user may want a tag only when two rows would otherwise read the same.

### m3. Settings' "What BassClass Pro opens" still numbers the units
- `web/js/ui/proDebug.js:68` writes "28. Stamina, stretch and harmonics" … "57. The vocabulary of the masters".
- Units are unnumbered everywhere else since 562fc19. These numbers also moved: Stamina was 27 before `u-pent3` was inserted.

### m4. ✎ Edit on "Modal form" gives a 12-bar form, Aeolian on the Neck
- `web/js/practice/harmony.js:119` `mineFrom`: lengths snap to at most 4 bars. The preset's 16 + 8 + 8 bars become 4 + 4 + 4 (`mineBars` 12, against the preset's 32).
- The copy also drops `modal`. The Neck then shows Dm7 as Aeolian; the preset (named "Dorian 16 bars…") shows Dorian:
  - preset: "Dm7(16 bars):dorian E♭m7(8 bars):dorian Dm7(8 bars):dorian";
  - after Edit: "Dm7(4 bars):aeolian E♭m7(4 bars):dorian Dm7(4 bars):aeolian".

### m5. "New" chips: what counts as used, and a fragile record
- Lessons are marked used only when their lesson page opens (`course.js:449`). A lesson played from Today's session, or whose steps are opened straight from a row (`#/ex/…?ls=`), keeps its chip on the map. A progression bought from its locked picker card (`then`) is not marked either (the pick path is).
- `web/js/news.js:52-56`: if the record cannot be read at that moment, `markUsed` saves `known: []`. A stored `{known: [], fresh: []}` (a valid shape) then lights every item at the next start: fresh 595, Library 237 chips, map 197 (state20). Not reached in normal use. Safer: keep the ids this start knew in memory and save those.
- A backup made before the chips, when restored, brings the 33 seed chips back, even for items already used.

### m6. About's "Open-source libraries" does not list Google Play's review library (to verify)
- 787c926 added `com.google.android.play:review:2.0.2` (and with it Play services' task library) to the APK.
- About lists only AndroidX WebKit and the Kotlin standard library, "each under the Apache License 2.0" (`web/js/ui/about.js:70`).
- As far as I know, the Play Core libraries come under the Play Core Software Development Kit Terms of Service, not Apache 2.0. I could not check this here (no network fetch, no Gradle). Worth checking before launch, with the claim that the APK has no INTERNET permission after the manifest merge.

### m7. Room: "I – ♭VI – ♭VII – I (borrowed)" sits in Pop & rock but plays 7th chords
- `common.js:225` has no `pop: true`, so the room plays Cmaj7 – A♭maj7 – B♭7 – Cmaj7. The Neck shows B♭7 as Lydian ♭7.
- The other Pop & rock presets play triads (the rule: pop and rock progressions as triads).
- It is also used as a 7th-chord drill in `hm-colour-chords`, so the fix may belong to the room (triads for the Pop & rock group) rather than to `PROGS`.

### m8. Text precision in the new studies and chord formulas
- `sc-pent-minor-grooves` about: "over Cmaj7 the 3rd, 5th, 7th and 9th". `sc-pent-major-chord` about says E minor pentatonic over C "gives the 3rd, 5th, 7th and 9th". Both leave out its A, the 13th (6th).
- `hm-chord-formulas` about: "the formula shows everything the name allows… a 13th [often leaves out] its 11th". But C13 is built without its 11 (`CHORDS.dom13`, 1 3 5 ♭7 9 13), while Cm13 has it (1 ♭3 5 ♭7 9 11 13). Either the text or the dominant 13 should change.

### m9. Lesson `added` stamps later than their release
- `chord-formulas` and `harmonic-chords` carry `added: 1793190000000` (28 Oct, 12:20 UTC). Their commit a996488 is from 09:58 UTC.
- A player who passes the `u-sevenths3` or `u-solo` checkpoint in between (with the new step in it) gets the lesson treated as "added later": Continue skips it.
- Tiny window. `u-pent3`/`u-pent4` (09:33 UTC) are fine.

## Visual
No new visual problem found:
- 16 screens at 800x380 and 640x300, scrolled top, middle and end: no sideways scroll, nothing outside the window, no control covered or overlapping, no clipped text apart from the designed ellipses.
- The rate card at 640x300: 24–276 px, every button in view.
- Portrait 360x780: Home, map, Settings and About clean; exercises show the rotate prompt.
- The room's Sound row wraps to two lines at 640 px while "New" and "Pro" chips sit on Piano, Organ and Guitar. Nothing is cut, and it returns to one line once the chips are used.

## Checked and fine
- **Self-test:** 231 exercises, 254 lessons, 124 drum patterns, 28,850 builds, 1,658,792 notes, `problems: 0`. `checkNumbers` is clean.
- **Harmonics** (`tech-harmonics` main/all, both orders, 4/5/6 strings, 17/20/24 frets):
  - every node sounds the string's harmonic series (+12 +19 +24 +28 +31 +34 +36);
  - each note is spelled from its open string (G♯ on E; ♭7 D on E, B♭ on the high C); `at` within 0.5 of its fret; finger 0.
  - The nodes' positions match the physics: 7.02 = 12·log2(3/2), 3.86 = 12·log2(5/4), 2.67 = 12·log2(7/6), 2.31 = 12·log2(8/7), 8.84, 3.16.
  - Measured on the board (6-string, left-handed): each triangle sits at the interpolated node (12 on the 12th wire; 3.86 at 86% of the 3rd–4th cell; 8.84 before the 9th wire).
  - The tab writes 8.8, 3.9, 3.2, 2.7, 2.3, with 7 and 5 as whole frets.
  - The staff draws diamonds under 8va up to the high C string's C.
- **Harmonic chords:** all six voicings are right (Em7 E·D·G; Esus2 E·F♯·B; Gmaj7 G·F♯·B; Cmaj7♯11 C·F♯·B; A7sus4 A·D·G; D5 D·A·D). Labels match. The Player sounds `play` for stacked harmonics too (`builder.stack` passes it).
- **Pentatonic colours** (2,592 builds):
  - every label matches its chord in semitones and letter;
  - no bad chord name; no fret over the setting (highest 19); fingers 0–4; double stops one per string within 4 frets; whole bars per lick;
  - E♯ as the 13 of G♯m7 (A♯ minor pentatonic) is the correct academic spelling.
  - Musically checked by hand in C: the three boxes, the i–♭VII–♭VI grooves, the one phrase over seven chords (Cm7 5, A♭maj7 7, F7sus4 4, D♭maj7 ♯11…), the minor pentatonics on the 3rd/6th/7th of C (F♯ ♯11), the groove/fill bars, and the double-stop 4ths with one major 3rd.
- **Chord formulas:** every chord's notes against its formula (pitch and letter) in 12 keys. New types are right: add9 C E G D, 6/9 C E G A D, m6/9 C E♭ G A D, maj7sus4 C F G B, 11 C E G B♭ D F, m11, m13. Textbook double flats (G♭m G♭ B♭♭ D♭, D♭°7) fit the chord-construction decision.
- **New room progressions** (14 x 12 keys, scale against chord tones): every Neck scale holds its chord's tones.
  - Phrygian vamp Cm Phrygian + D♭ Lydian; Lydian vamp C Lydian + D Mixolydian; modal form Dorian throughout; i–iv–V–i with Phrygian dominant; neo-soul E7 Phrygian dominant.
  - C♭ in G♭ (IV) is the key's spelling, as decided.
- **Placement with an old `placed`:** works (course complete, L6). The unit-added lessons are skipped by Continue for players past them.
- **Rate reminder:**
  - asks at 601 min, after leaving an exercise; Escape answers "Not now" and moves `asked` to 1; the card's history entry goes back;
  - none with the gates off;
  - `asked` 99 → 2 and −3 → 0; garbage reads as not rated;
  - 60 open/close cycles leave no listener or node.
- **Feedback** (bridge stubbed, nothing sent): to polyorbit.app@gmail.com, subject "BassClass feedback · development", foot with version, "web · Windows · screen …", "4-string bass · 28/10/2026". The Android user-agent parsing checks out by reading.
- **Tips:** the heart toast in the app's coral red (rgb 227 135 110); two quick taps buy once.
- **New chips:**
  - a first start has none;
  - an install from before the chips gets the 33 seed items: Library 11 chips with "3 new"/"2 new" level headers, map 11;
  - opening an exercise clears its chip and its level's count;
  - garbage, an array or a wrong shape in the record falls back to the seed; ids that no longer exist are dropped.
- **Numbers:** `#/ex/305` opens Simandl; the search finds numbers; lesson rows show "3.15"; checkpoints "✓", tests "★".
- **Fills:** `__fills19` over 2,700 cases: no hit outside its beat. Swung patterns fill on the triplet grid. The kick drops only under the linear fill, by design. Soft grooves have no crash, by design.
- **Player timing:** 0 beats off the layout (sc-one-octave, sc-pent-one-phrase, sc-pent-minor-grooves, hm-chord-formulas), with one bar of count-in clicks.
- **Samples:** 84 files decode; regular samples within ±3.6 cents.
- **Piano:** an octave lower now. The 18 files measure −4.6 to +13.4 cents from their labels (B♭4 +13.4, the sharpest). Round 19's M1 is fixed.
- **yin:** 94 of 96 within ±2 cents; the same two noise cases as before (−2.26, −2.63). Octave folding passes.
- **Monkeys:** 1,040 steps, 0 errors, 0 NaN/undefined/null text, 0 Pro violations, 0 rate-card or chip or session findings, no ghost audio.
  - Live ResizeObservers still climb by one per Home visit. That is the practice card's observer, never disconnected but collected (heap flat at 15.5–17 MB, nodes flat): the old note, not a leak.
- **Memory:** 60 cycles (Home, Library, two new exercises, a lesson, the room and its picker, Settings, the rate card):
  - heap 16.2 → 17.1 MB (noise), nodes 229 flat, 1 animation, `localStorage` 23,984 bytes flat, no keydown or popstate listener left.
  - The window `hashchange` count rises by 2 a cycle: the router's `{ once: true }` listeners on the Pro redirect, removed by the browser, not by the accounting.
- **Stored records:**
  - `course.v1` `placed` "x" → not placed; 9e15 or −5 → no error;
  - `log.v1` 1e12 → capped at a day (1,440 min);
  - no error and no blank screen in any case.
