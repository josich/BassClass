# QA deep report · ee6a706 · 2026-11-02
Summary: 0 critical, 5 major, 7 minor, 2 visual. Runs: seeds 2301 (340 steps, 800x380, 4-string), 2302 (420 steps, 640x300, 6-string, left-handed, gates on, free), 2303 (400 steps, 915x412, 5-string, Do-Re-Mi, gates off), 2304 (320 steps, 780x360, 4-string, gates on, free; teleports every 0.6 s to this round's exercises): 1,480 steps, about 2 h 30 min in all.

Scope: d278266..ee6a706 (22 commits: the band, mastery by main options, tap mode for games and drills, Pro previews of one bar, the renumbering, seven groove exercises, #551 false harmonics, #508 groups of 5, the room's louder drone, course-map focus, the goal button's tempo, ⏮ while playing). The `qa` server (port 8878) served the working tree, clean at ee6a706 for the whole run. Recorded takes and rhythm reading are on hold and were not tested. Ear-game content (spelling, tips, options) is on hold too; only the new tap-mode mechanics were tested.

Tools added: `qa/tools/monkey23.js` (loads after monkey19/20/21; teleports to band, tap-mode, preview, new-groove and lesson-step screens; watches the exercise's own `Player` through `Player.prototype.play`: a band on a non-band exercise, a free player on a Pro pattern or sound, a preview past its first bar or looping, the tap count, players left playing off the exercise).

## Critical

None. No uncaught error in 1,480 monkey steps, the self-test, 60 memory cycles or the corrupt-storage cases.

## Major

### M1. The band: a tempo change while playing, with the click setting off, delays one drum beat or plays two at once
- Where: `web/js/player.js:89`, `setBpm()`: `const clicking = this.metro || this.nextClickAbs < this.countInEnd;`. The band schedules its beats on the click grid even when `metro` is false (`timing()` in `_tick` counts `this.band`), but `setBpm` does not. It re-anchors on the next step instead of the next beat, so a beat that falls between two notes is moved by the tempo ratio.
- Steps:
  1. Turn the click off: in any non-band exercise, tap the beat lights ("Click off"), or use ⋯ → Metronome. This is a saved, global setting.
  2. Open a band exercise with notes longer than one beat (#341 Two-feel, half notes).
  3. Play, then change the tempo with the slider or ± between two notes (the goal button in a lesson step does the same).
- Expected / Actual: the drum beats keep a steady grid at the old tempo, then at the new one. Instead, one beat lands 300 ms late (100 → 200 BPM), or two beats land at the same instant (100 → 50 BPM).
- Evidence: a logged `Player` (`_q` wrapped), band `twofeel`, 100 BPM; tempo changed when `nextClickAbs` 3 < `nextStepAbs` 4:

| Click setting | New tempo | Gaps between band beats (s) |
|---|---|---|
| off | 200 | 0.6 ×6, **0.9**, 0.3 … |
| on | 200 | 0.6 ×7, 0.3 … (correct) |
| off | 50 | 0.6 ×6, **0**, 1.2 … (a double hit) |

- Fix idea: `const clicking = this.metro || !!this.band || this.nextClickAbs < this.countInEnd;`, as `_tick` already does.

### M2. The band plays a shuffle or swing pattern under straight 8ths and 16ths in 11 exercises, 43 choices, all at their default options
- Where: `web/js/band.js:90` `bandCandidates()` picks the swing or straight list from `p.feel`. The default is 'swing', but these licks cannot swing: the exercise writes them straight and shows the Feel option as "Fixed for this choice: Straight 8ths" (`inst.fixed.feel`, `licks.js` `canSwing`). The band still takes the swing list. `checkBand` in the self-test does not compare the pattern's grid with the line's feel.
- Steps: open #241 Fills into the next bar (default options), press Play.
- Expected / Actual: a straight rock pattern under the straight 8th fill. Instead you hear `texasshuffle` (triplet grid) under straight 8ths.
- Evidence: every lick of each exercise built at its defaults. Each row has the Feel fixed to Straight 8ths and a pattern on the triplet grid (`grid: 3`):

| # | Exercise | Choices | Pattern played |
|---|---|---|---|
| 322 | sc-pent-three-boxes | 4 of 4 | neosoul |
| 323 | sc-pent-minor-grooves | 3 of 3 | neosoul |
| 416 | sc-pent-one-phrase | 4 of 4 | neosoul |
| 417 | sc-pent-major-chord | 4 of 4 | neosoul |
| 418 | sc-pent-groove-fill | 5 of 5 | neosoul |
| 241 | gr-fills | 4 of 6 | texasshuffle |
| 343 | lk-rock-blues | 4 of 8 | texasshuffle |
| 210 | tech-pick-alt | 5 of 5 | rockshuffle |
| 308 | tech-pick-gallop | 4 of 4 | rockshuffle |
| 443 | sl-octaves-16 | 4 of 4 | funkhalfshuffle |
| 617 | lk-modern | 2 of 6 | swing |

- The reverse also happens: a triplet lick with Feel "straight" gets a straight-grid pattern (#343 lick 6 "A triplet blues lick", #541 lick 2, #542 lick 1: `rock8` / `bossa` under triplets).
- Fix idea: choose the list by the line as built (`inst.swing`, or the fixed feel), not by the raw option value. Add a self-test check: a pattern on the triplet grid only under a swung or triplet line, and the reverse.

### M3. #551 False harmonics: every fretted note is labelled finger 1, and the thumb's touch point is labelled 4
- Where: `web/js/builder.js:222-228`. `build()` re-fingers every multi-note step (`n.finger = f - lo + 1`) and ignores `fixedFingers`. A false-harmonic step is two notes on one string: the fretted note (`held`) and the harmonic 12 frets up. So the fingers that `technique.js:558` sets (its computed finger, and 'T' for the thumb) are overwritten: fretted note → 1, touch point → min(4, 13) = 4. The comment added to `stack()` ("fingers the exercise sets itself stay") does not hold for these steps.
- Steps: open #551, ⋯ → Dot labels → finger.
- Expected / Actual: C major on the A string should read 2 · 4 · … with T at each touch point. It reads `1` on every fretted note and `4` at every touch point, 12 frets up (where the plucking hand's thumb goes).
- Evidence:
  - Built key C, 4-string, max fret 20: `HC s1f3 fg1 + hC s1f15 fg4 ◊`, `HD s1f5 fg1 + hD s1f17 fg4 ◊`, `HE s1f7 fg1 …` (all 15 steps fg1 / fg4).
  - On screen (#/ex/551, Dot labels: Fingers, Reveal: whole shape), the neck's labels read `1 4 1 4 1 4 …`.
- Also in this exercise:
  - Keys whose root is found on the D string (E♭: `f ≤ 5` rule, `technique.js` root search) put the whole octave on two strings: E♭ D1 F D3 G D5 | A♭ G1 … E♭ G8, a 1–8 fret span with no shift shown.
  - Over 468 builds (3 lines × 13 keys × 4/5/6 strings × max fret 17/20/21/24), 10 had a span of 7 frets and 2 a span of 11.
  - At max fret 17 the touch points go to frets 18–20 (D♭, D, E♭…). The over-fret notice covers that, as decided; the fingering spans above do not.
- Fix idea:
  - In `build()`, skip notes in `fixedFingers` (and `held` steps) when re-fingering multi-note steps.
  - Let the root search use `hi` (`maxFret − 12`) instead of 5 when the D-string root forces a two-string octave.

### M4. Mastery: a choice with no course steps takes the exercise's hardest goal, even from another metre or beat unit
- Where: `web/js/mastery.js:44` `goalOf(id, choice)`: the choice's own goal, else the exercise's (the hardest of all its steps, compared as bpm × notes per beat).
- Two exercises where this asks for twice the tempo. Every choice is needed for 🏅 in both.

| # | Choice | Its own tempo | Goal it gets | Where the goal comes from |
|---|---|---|---|---|
| 240 | 12/8 slow blues (`slowBlues`) | 60, dotted-quarter beats | 120 BPM | boogie's checkpoint step |
| 438 | 7/4 (`meter=74`) | 110, quarter notes | 170 BPM | the 7/8 checkpoint, counted in 8ths |

- So:
  - #240: a 12/8 slow blues must be played at 120 dotted-quarter beats a minute, a fast shuffle, to be cleared.
  - #438: 7/4 at 170 quarter notes is the 7/8 goal at twice its speed.
- Evidence: `goalText('gr-blues','slowBlues')` → "120 BPM"; `goalText('gr-odd-meters','74')` → "170 BPM"; course steps on #438: 4.37 {54} 132, {68} 132, {78} 160, ◆ {78} 170, none on 74.
- Also checked: rh-odd-meters 78b → 170 (same metre as 78, fine); mm-schism part 0 (5/8) → part 1's 190 (both x/8, fine).
- Fix idea: a choice without steps falls back to the hardest goal among choices in the same metre and beat unit, else to its own suggested tempo (`inst.bpm`) plus a margin. A self-test check could flag a goal more than 1.6× a choice's own tempo.

### M5. Two of the new grooves do not do what their names say (#248 Country waltz, #450 Gospel walk-ups)
- Where: `web/js/curriculum/grooves.js:71` and `:66`, with `grooveLine` (`common.js:541`: "a two-bar pattern alternates bar by bar across chords").
- Country waltz (#248, the exercise's default groove):
  - The pattern is root on bar 1, the 5th below on bar 2.
  - Its progression I – IV – V – I changes chord every 3/4 bar, so the "5th below" bar lands on a new chord.
  - The IV chord and the closing I never get their root: `[C] C(R) | [F] C(5) | [G] G(R) | [C] G(5)`. The F bar is F/C, and the loop ends on the 5th.
  - A country waltz alternates root and 5th within one chord, so it needs two bars a chord, or the root on every chord change.
- Gospel walk-ups (#450, the default groove), in C, 4-string. The built line:
  `| Cmaj7: C2 C2 G2 A2 B2 G♯1 | A7: A1 A1 E2 F♯2 G2 C♯2 | Dm7: D2 D2 A2 B2 C3 F♯2 | G7: G2 G2 D3 E3 F3 B1 |`
  - The walk climbs 5 – 6 – 7, then the approach drops away from it to reach the next root:
    - B2 → G♯1 → A1: 15 semitones down (G-string fret 4 to E-string fret 4);
    - F3 → B1 → C2: 18 semitones down (G fret 10 to E fret 7);
    - G2 → C♯2 and C3 → F♯2: tritone leaps.
  - The line never walks up into the next chord, which is what the name, summary and about text promise.
- Evidence: built lines (`gr-waltz` style=countryWaltz key C; `gr-gospel` style=gospelWalk key C/G). A leap scan over all 7 new exercises × styles × 4 keys × 4/5/6 strings found leaps over an octave in gospelWalk 24 times. Other leaps were the usual octave-shape jumps, back to the next root (metalChug, songo, ballad68, soca, chacha).
- Fix ideas:
  - Country waltz: give each chord two bars (scale the progression's 4/4 bars × 2), or play the root on the first bar of every chord.
  - Gospel walk: walk up to the next root from below (for a move up a 4th: R, 3, 4, ♯4 → next root), or place the walk in the octave under the target.

## Minor

### m1. A free player in a 6/8 exercise turns the band off everywhere with one tap that changes nothing here
- Where: `ui/exercise.js:756` `toggleBand()`. The guard `!bandOn && !bandNow()` only stops turning the band on. With the band on but no free 6/8 pattern, the first tap saves `band: false` for every exercise.
- Steps (gates on, free): open #248 with Groove = 6/8 ballad, then tap the beat lights twice.
- Actual:
  - 1st tap: setting `band` true → false, toast "Band off: the click keeps the time"; nothing audible changes.
  - 2nd tap: "No free drum pattern in 6/8: the click keeps the time".
  - Every other style exercise has now lost its band.
  - The lights' title said "The click (tap: the band, drums and chords)" throughout.
- Related: no 6/8 drum pattern is free (the self-test allows it), so this free Level 2 groove (#248 6/8 ballad, and #438 6/8 for Pro previews) never gets a band for free players. Meanwhile the panel's ⓘ says "⭐ Free: three patterns of each genre". A product question more than a bug.

### m2. Space starts the exercise behind the band's drum picker (and behind the Band panel)
- Where: `ui/exercise.js:1533` `onKey()` has no check for an open picker or sheet. The room's keys sleep while its picker is open; the exercise's do not.
- Evidence: ⋯ → Band → Change, picker open (`history.state.picker` true), focus in the picker. Space dispatched on it started the exercise's Player (`playing` true behind the picker).

### m3. Tap mode: the right note in the wrong octave reads "✗ C, not C"
- Where: `ui/exercise.js:1389` `tapVerdict()` names both notes without octave.
- Evidence:
  - #111 Reading: natural notes in 👆 tap mode (5-string) and #112 Read it, tap it: a C an octave off gives "✗ C, not C · here on 2 strings".
  - The neck does show the right places.
  - Suggest "✗ C3, not C2", or "the right note, an octave too high".

### m4. Tap mode on a drill keeps ✓ Cleared under ⋯, but nothing in tap mode can clear it
- Where: `applyTapUi()` keeps ✓ Cleared and 🏅 in tap mode; `toggleCleared()` then asks for "a full loop at 60 BPM… then ✓ Cleared". But tap mode hides the tempo and the loop.
- A 10/10 tap set on #111, #215, #216 or #219 records `plays + 1` and nothing toward its choice. Only the games clear modes by score.
- Either hide ✓ Cleared in a drill's tap mode, or say "Play mode clears it".

### m5. Unticking one choice that an "All" choice cleared unclears all of them, and the toast does not say so
- Where: `mastery.js:145` `setCleared(..., false)` deletes the choice and the "all" tick.
- Evidence: #324 tri-scale-forms. Clearing "all" makes forms 1, 2 and 4 cleared (3 of 3, 🏅). Unticking Form 1 alone gives 0 of 3: forms 2 and 4 go too. The toast reads "Form…: not cleared · 🏅 taken back".

### m6. The band's drum volume is the Practice room's Drums volume, with no control in the exercise
- Where: `ui/exercise.js:743` `A.setAudioOptions({ drumVol: room.drumVol / 100 })`.
- A player who turned the room's drums down to 0 hears no drums in any exercise. The Band panel has no volume, and its ⓘ does not mention the room's slider. Code reading, not heard.

### m7. Tap mode keeps the practice log running after a preview's one question
- Where: `tapStart()` calls `logPlaying(true, { idleMin: 5 })`; `tapNext()` in a preview goes straight to `previewEnd()` without `logPlaying(false)`.
- Effect: up to five idle minutes counted after one answer in a Pro game preview, or after a set left half-way. Code reading.

## Visual

### V1. In band exercises the 🥁 icon sits under the quiz prompt's note name
- Where: `.beat-row` (91 px wide with the icon) against `.exv-prompt` (`right: 70px`, sized for the dots alone).
- Evidence:
  - 780x360, #340 Funk 16ths with Reveal = quiz: prompt "next La" at x 649–710, beat row at 683–774. 27 px overlap.
  - The screenshot shows "La" drawn over the drum icon.
  - The same on #442 sl-grooves ("next Mi").

### V2. The beat lights, now a button that switches the band or the click, are 28 px tall
- `.beat-row { min-height: 28px }`: measured 91×28 at 780x360 (63×28 without the icon). Under the 32 px used elsewhere.
- Its lower 4 px also lie over the fretboard's top (row 48–76, board from 72).

## Checked and fine
- Self-test: 248 exercises, 268 lessons, 124 drum patterns, 31,067 builds, 1,703,725 notes, problems 0 (29 s).
- Course data (`step-diff10.py d278266 ee6a706`): 0 steps changed in place, 0 removed; pick-gallop.0/1 tempo-only, in `CHANGED_STEPS` rev 8. The new units and lessons carry `added`.
- The band's timing (logged Player, trainer on +10 to 220, 2.2 loops each): 3/4 waltz, 6/8 in dotted quarters (`folk68`, 2 beats), 6/8 in 8ths (`six8rock`, 6 beats), 12/8 (`soulballad`), 5/4, 7/4, 7/8, 5/8 (mm-schism), 7/4 (mm-money).
  - Count-in exactly one bar of clicks.
  - The first band beat on the first note.
  - Beat numbers 0…bpb−1 in order, every gap 60/bpm.
  - The trainer adding 10 per loop and stopping at 220.
  - No loop seam gap.
- Band static check over 462 builds (every band exercise × style option × 4/5/6 strings):
  - Every loop a whole number of bars.
  - No two-bar pattern on an odd-bar loop.
  - Every exercise matched for Pro.
  - Free players have no pattern only in 6/8 (gr-waltz ballad68, gr-odd-meters 68, mm-schism 5/8: see m1).
- Band and Pro (gates on, free): a stored Pro pattern choice falls back to the free match (`gr-latin` songo → chacha); a stored Pro sound (organ, piano) plays as E-piano; the Band panel's Pro chips; a locked picker card opens the Pro sheet, and closing it reopens the picker on its group; Back closes the picker first.
- Pro previews (#448, #449, #616, #444, #442): the player holds only the first bar (4 or 7 beats), no loop, the strip faded (`preview-strip`), the count shows the whole exercise ("2/12", "4/28").
- Tap mode, scored against known answers with the app's own `onTap`:

| Exercise | Answers | Expected | Card |
|---|---|---|---|
| #112 every place | right, right, wrong… | 7 | 7 of 10 |
| #227 ear | right, wrong… | 5 | 5 of 10 |
| #215 not on its own place | 3 right, 1 wrong… | 8 | 8 of 10 |
| #216 every place, by note name | right, right, wrong… | 7 | 7 of 10 |
| #219 E and A strings | all right | 10 | 10 of 10 |
| #111 drill line | right, wrong… | 8 | 8 of 16 |

  - A game mode is cleared at 8/10, not at 7; 🏅 once every mode is cleared.
- Mastery functions: four choices need all four; "all" clears all; 80% of 26 = 21; strings 4/5/6 give E A D G / B E A D G / B E A D G C; `setMastered(false)` clears ticks.
- Course map focus (`#/course?f=`) for 2.34, 3.42, 5.43, 1.1 and a checkpoint at 640x300: stage opened, row centred under the sticky S1–S6 bar, glowing.
- #508 groups of 5 on the symmetric scales: plain spelling, no double accidentals; the silent rest to the bar line is the same as the other patterns.
- Memory, 60 cycles. Each cycle:
  - a band exercise: Play, ⋯ → Band, Change, Escape, Done;
  - a tap game: ▶, one answer;
  - back to Home.
  - Samples every 10 cycles (0 → 50): heap 21.8 / 21.5 / 23.4 / 22.5 / 23.2 / 23.2 MB; nodes 589 flat; animations 0; localStorage 25,574 bytes flat; no Player left playing.
  - The cycle-60 sample (44.5 MB) overlapped the corrupt-storage iframes and is not counted.
- Corrupt storage, read back by a fresh app (`__ifr19`) on #/ex/gr-roots, #/ex/sc-one-octave, #/ex/game-read-notes, #/ex/fb-quiz, #/library and #/. Every screen was drawn, with no error. Cases and results:
  - `band: "yes"`, `bandSound: "xx"`, `bandStyles: [1,2]`: back to the defaults.
  - A bandStyles entry naming no pattern ("zzz"), and one of 600 keys: ignored or dropped.
  - A Pro bandSound for a free player: plays E-piano.
  - Progress with `cleared: "x"`, `metOn: [1]`, `bests: {a: 99}`, `best: -1`, `tapOn: "yes"`, `bests.f: "x"`: each dropped.
  - An unknown cleared choice: kept, but not counted.
- Bad routes: #/ex/nope and #/ex/999 lead Home. Options set to "zzz", "__proto__", "cycle99" or "99" fall back. #/course?f=nope, #/library?f=nope and #/course/9.99 are drawn. #/ex/551 opens by number. A lesson step index that does not exist (`ls=latin-grooves.99`) opens the exercise.
- The room's drone, ×2 (rendered offline through the app's graph; A drone, pad at 100%):
  - RMS −13.9 → −10.1 dB: +3.8 dB, not +6, because the limiter takes the rest at full volume.
  - Peak −2.3 dBFS (organ and E-piano alike), under the soft clip.
  - Kick and snare peaks with the drone: −2.1 to −2.5 dB (alone −2.4 to −2.7).
- Monkeys: 0 errors, 0 NaN/undefined text, no Player left playing off an exercise (one note at seed 2301 step 119 is most likely the harness setting the hash 60 ms before the router ran; the check was made to wait 400 ms afterwards and never fired again in 1,140 steps), no band on a non-band exercise, no Pro pattern or sound for a free player, no preview past its bar. Live ResizeObservers still rise once per Home visit (the practice card's, the old note).
