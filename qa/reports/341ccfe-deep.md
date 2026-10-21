# QA deep report · 341ccfe · 2026-10-21
Summary: 1 critical, 2 major, 9 minor, 1 visual. Runs: monkey seeds 1001, 1002, 1003 (980 steps, about 7 min of taps) plus a navigation fuzz (seeds 1001–1003, 300 steps) and targeted Back tests. Also:
- placement checker (`qa/tools/place-check10.js`) over the whole catalogue on 4/5/6 strings: 153,722 builds (every select combination up to 60 per exercise, every key and cycle);
- the voice-led shape exercises at highest fret 12/15/17/20/24 on 4/5/6 strings: 137,850 builds;
- course-step diff 626f29c → 8aa8df6 → HEAD (`qa/tools/step-diff10.py`) and every checkpoint against its "I can" lines (`qa/tools/checks10.py`);
- every course step (550) on 4/5/6 strings at highest fret 17 and 20;
- course storage: migration, reset and 10 corrupt values; 16 bad routes;
- logged-Player timing; memory over 100 course cycles and 2.5 min of Giant Steps at 260 BPM; layouts at 7 sizes.

About 3 h. Scope: 626f29c..341ccfe (8aa8df6 = the QA round 9 fixes, 341ccfe = the leftovers).

Test setup: `qa` server on `http://127.0.0.1:8878`, service worker unregistered and caches cleared first; my own tabs only (a fresh tab per monkey run); `requestAnimationFrame` shimmed with a 16 ms timer where a screen needs it (a background tab gets no frames). Storage cleared again at the end.

## Critical

### C1. After "Reset course progress", tempos recorded on six course steps are deleted at the next app start (data loss, narrow)
- Where: `web/js/course/progress.js` `resetCourse()` (line 168) saves `{ steps, lessons, can, known, placed, minutes, last }` without `rev`. `load()` then sees `rev` 0 and runs every `CHANGED_STEPS` entry again.
- Steps:
  1. Course map → "Reset course progress" → OK.
  2. Practise one of the registered steps without ticking ✓ Clean: `s1-test.0`, `swing.1`, `open-triads.0`, `u-triads4-check.1`, `upper-structures.1`, `colour-chords.0` (e.g. play two full loops of Lesson "open-triads" step 1 at 100 BPM).
  3. Close and reopen the app.
- Expected: the step keeps best 100, 2 loops (goal reached).
- Actual: the record is gone (best 0, loops 0); the goal has to be played again.
- Evidence (reproduced in the page):
  - after `resetCourse()` the stored keys are `steps, lessons, can, known, placed, minutes, last` (no `rev`);
  - `recordLoop(open-triads, 0, 96)`, `recordLoop(…, 100)`, `recordLoop(s1-test, 0, 112)` → `stepState('open-triads', 0)` = `{best:100,last:100,loops:2,clean:0}`;
  - after a reload: `{best:0,last:0,loops:0,clean:0}` for both steps.
- A ✓ Clean tick made after the reset survives (its timestamp is later than `at`); tempos, loops and "goal reached" do not. The loss happens once per reset (the next save stores `rev` 2 again).
- Fix idea: `resetCourse()` keeps `rev: REV`.

## Major

### M1. 62 released course steps changed their content in place (8aa8df6) and are not in `CHANGED_STEPS`
- Where: `web/js/course/stages/s3.js`–`s6.js` (8aa8df6) and `CHANGED_STEPS` in `progress.js` (341ccfe registers only its own 4 steps).
- Steps are stored by index. Old tempos, loops and ✓ Clean ticks recorded on the releases that shipped Stages 3–6 (55ad232 … 626f29c) now count for different exercises or options.
- Evidence: `python -I qa/tools/step-diff10.py 626f29c 8aa8df6` → 62 steps "changed in place", 0 removed, 43 appended. Examples:
  - `u-sevenths4-check.0` arp-inversions dom7 → min7; `u-sevenths4-check.1` arp-two-octaves min7 → dom7;
  - `u-licks-check.0` lk-ii-v-i lick 4 → lick 0; `u-masters-check.0` lk-bebop lick 5 → 2; `s6-test.4` lk-modern lick 2 → 4;
  - `s5-test.0` polyrhythm 3:4 → 4:3; `u-hands5-check.1` 7:4 → 5:4;
  - `ii-v-i-lines.1` arp-voice-led cycle-251 → autumn; `inversions.0` root E → A; `sequences.2` thirds → turn;
  - `ii-v-i-lines.0`, `giant-steps-arps.0/1`, `rhythm-changes-arps.0`, `s4-test.3`: same options, but the exercise now plays written 8ths that fill each chord (the step's `sub` 2 is gone), so the notes per loop changed.
- Full list: u-positions-check.0/1, u-scales3-check.1, one-string.1, sequences.2, inversions.0, harmonised-triads.1, u-triads3-check.1, u-sevenths3-check.0, u-moving-check.0/1, u-jazz-first-check.0, u-time4-check.0/1, u-modes4-check.0/1, ii-v-i-lines.0/1, u-voicelead-check.1, u-sevenths4-check.0/1, u-tenths-check.0/1, walk-mixed.1, u-walking4-check.1, u-grooves4-check.1, s4-test.3, u-hands5-check.1, u-outside-check.0/1, u-bebop-check.0/1, u-modes5-check.0/1, u-superimpose-check.0/1, u-triads5-check.0/1, u-colours-check.0/1, u-arps5-check.0/1, u-harmony5-check.0/1, u-walking5-check.1, u-licks-check.0/1, u-solo-check.0/1, s5-test.0/1/4, u-chords-all-keys-check.1, u-modern-check.0/1, giant-steps-arps.0/1, rhythm-changes-arps.0, u-coltrane-check.1, u-masters-check.0/1, s6-test.4.
- CLAUDE.md: "a released step whose notes change goes into CHANGED_STEPS (next rev)". The exposure is short (the stages were out for hours), but a player who worked through Stage 3+ on release day has passed checkpoints they never played.

### M2. Shape fingering puts the ring finger next to the index and the little finger three frets above the ring (`chordShape`, 1-3-4 on frets lo, lo+1, lo+4)
- Where: `web/js/curriculum/common.js` `chordShape()`, `finger = … 1 + Math.round((frs.indexOf(f) * 3) / (frs.length - 1))`. Shared by the harmonised triads (`diatonicBuild`) and, since 341ccfe, by every voice-led triad and 7th exercise.
- With a four-fret span and three distinct frets the middle fret always gets finger 3, wherever it is. When it sits one fret above the lowest:
  - the ring finger plays the fret next to the index;
  - the little finger plays three frets above the ring, often on the same string.
  - That is not a playable hand. The standard fingering is 1-2-4 (the usual 1-to-4 stretch).
- Course steps (4-string, defaults):
  - `triads-all-keys.1` and `u-chords-all-keys-check.0`: [B°] F@D3 finger 1, B@G4 finger 3, D@G7 finger 4 (9 and 8 chords of 96);
  - `key-inversions.1`: same B° shape;
  - `modal-triads.0` and `u-colours-check.0`: [B♭+] B♭@D8 finger 3, D@G7 finger 1, F♯@G11 finger 4;
  - `modal-triads.1`: [A♭+] A♭@D6 finger 3, C@G5 finger 1, E@G9 finger 4.
- Library, share of chords with this pattern (or a finger number larger than its fret gap), 4-string, sampled options × 6 keys:
  - tri-voice-led-cycle 718/6,240 (C° in the cycle: G♭@D4 finger 1, C@G5 finger 3, E♭@G8 finger 4);
  - tri-diatonic-modes 685/10,881; tri-diatonic-all-keys and tri-diatonic-inversions 731/21,775 each; tri-diatonic-minor 443/10,888;
  - tri-open-spread 202/4,669; tri-diatonic-4ths 134/5,560; tri-diatonic 119/4,669;
  - arp-ii-v-i 15/648; arp-voice-led 5/10,368.
- Shown whenever labels are set to "finger".

## Minor

### m1. In-chord shifts remain where the chord fits one hand position (shape lines)
- Where: `fretboard.js` `handSearch`. The in-group penalty (+1) equals the cost of an ordinary shift, so one shift inside a chord costs the same as two shifts at the chord changes.
- Example: `hm-chord-tones`, I–vi–IV–V in A, R-3-5-7, 4-string.
  - [Dmaj7] is played D@A5 finger 4, F♯@D4 finger 3, A@D7 finger 2, C♯@G6 finger 1: hand from fret 2 to fret 6 inside the bar.
  - Frets 4–7 hold the whole chord in one position: A5/2 D4/1 D7/4 G6/3.
  - `place()` on the 16-note line reproduces it. With only F♯m7 + Dmaj7 it picks the one-position shape.
- Course: `colour-chords.1` [A♭maj7] A♭@E4 finger 3, C@A3 finger 2, E♭@A6 finger 2, G@D5 finger 1 (fret 2 → 5); one position: E4/2 A3/1 A6/4 D5/3.
- Another: R-3-5-3 over D♭ in A♭ major: D♭@A4 with the little finger, then F@A8 with the little finger (a 4-fret slide), although F@D3 is next to the root.
- Rate (hm-chord-tones, every progression × 12 keys, 4-string): r357 29/2,004 chords; r3575 27; r358 22; r353 10. Also hm-12-bar-blues 52 and hm-colour-chords 30 in the sampled run.

### m2. `assignFingers` stretches even when the line does not come back, then shifts the other way
- Where: `fretboard.js` `assignFingers`. `fit <= 2` counts the next note even when it is outside the old hand too.
- Direct test: frets 5, 8, 4, 9, 10 on one string give fingers 5/1 8/4 4/1 9/4 10/1. The little finger stretches to 9, then the index lands on 10.
- In the app: `iv-tenths` (D♭, broken) plays E♭@G8 finger 4, D♭@E9 finger 4 (stretch), F@G10 finger 1.
- Count: 54 stretches made by the new rule in 3,680 builds (4-string, defaults and single-option variations). 19 are followed by a shift elsewhere: fb-landmarks, fb-quiz, fb-key-box, iv-tenths. The old rule would have shifted once.
- The comment ("when the line stays there or comes back") is not what the code checks.

### m3. "A pitch repeated inside one chord keeps one place" does not hold after the slap and hammer-on passes
- Slap: the thumb's low-string pass runs after the hold.
  - `sl-grooves` style tmp, D minor vamp: D38 thumbed at A5 most of the bar and at E10 after the A at A12.
  - Rate: 35/462 chords in sl-grooves, 13/308 in sl-advanced (popFill: D at A5, then E10 three times, then A5); 4- and 5-string alike.
- Licks: the hammer-on pass moves the H note after the hold.
  - `lk-blues` lick 3 in the cycle of 4ths, [E♭7]: G at D5 (hammered from G♭@D4), and later G@A10 finger 4.
  - The line goes B♭@G3/1 → G@A10/4 → G♭@D4/1: out 7 frets and back within three 8ths.
  - 8 chords on 4-string, 10 on 5-string.

### m4. Voice-led 7th arpeggios in the High and Low registers break the one-shape rule
- Where: `arp-ii-v-i` register high or low. `chordShape` finds no shape near the top or bottom of the neck and the fallback `place()` places each chord as a line.
- 4-string, 20 frets, every type, pattern, voicing and key:
  - high: 25 chords with three notes on one string, 14 with one pitch in two places, 14 spanning 6 frets;
  - low: 24 with three notes on the E string (one position, so playable).
- Examples (high):
  - minor, cycle 4ths, [B7♭9]: A57@G14, C60@G17, B59@G16, D♯63@G20, then A57@D19 (A in two places, hand 14 → 19);
  - C minor, [Cm(maj7)]: B, C, E♭ all on the G string at frets 16, 17, 20.
- `fillOrder` adds the octave above the voicing's top note, which pushes 5-note chords past the register.
- 5-string: 25 / 6 / 6; 6-string at fret 20: 3 chords. At highest fret 12, arp-altered-dominants has 3 more (notes folded down an octave inside a chord).
- Library only: the default register (mid) and every course step are clean.

### m5. Two-octave arpeggios often shift 4–6 times instead of once each way
- Where: `triads.js` `arpBuild`. The upper octave's strings come from `chordShape` (pins), but `handSearch` picks the fingers, so the upper octave can still shift.
- 54 of 120 single keys in `arp-two-octaves` (4-string, updown) shift 4 or 6 times; 15 of 48 in `tri-two-octaves`.
- Example, C°7 from E8: C E8/1, E♭ E11/4, G♭ A9/2, A A12/1 (shift), C A15/4, E♭ D13/2, G♭ D16/3, A G14/1 (shift inside the upper octave), C G17/4.
- No pitch is in two places, and the "little-finger slide G12 → G17" case is gone.

### m6. Some Stage 1–2 checkpoints still have no step for a playable "I can" line their lessons teach
`qa/tools/checks10.py`: 23 of 61 checkpoints and tests have different numbers of lines and steps. Most are fine (several steps for one line, or a line that cannot be a step, such as tuning or posture). Missing:
- `u-hands-check`: "I can name the open strings without looking" (lesson steps use fb-open-strings);
- `u-notes-check`: "I can find the octave of any note on the E or A string" (fb-octaves);
- `u-neck-check`: "I know the fret-5 unison and the octave shape by heart" (fb-unison);
- `u-blues-check`: "I know the blues scale and where its blue note is". The steps are hm-12-bar-blues, a gr-blues boogie and progression roots; the lesson uses sc-blues.
- `u-sevenths-check`: "I know which chords are major, minor and diminished in a major key". Its lesson "The chords of a key" uses hm-chord-qualities; the checkpoint plays arp-7th-qualities and arp-7th dom7.

CLAUDE.md (round 9): "Checkpoints and tests have a step for every 'I can' line". Stages 3–6 comply.

### m7. Tap, then Back before the new screen shows, leaves the history depth one off
- Where: `app.js` `trackDepth` and the `back(fallback)` helpers in `screens.js` and `course.js`. `goBack` covers "Back, then tap", not "tap, then Back".
- Mechanism:
  - a link or row sets `location.hash`; the new entry exists at once, but its state stays null until the hashchange task runs;
  - a Back press in that gap reads `history.state?.depth` as undefined and calls `go(fallback)`, which pushes a third entry.
- Repro (one JS turn, real handlers):
  1. On `#/course/trills` (depth 2).
  2. `location.hash = '#/course/placement'`, then click the page's Back button.
  3. Result: `#/course` at state.depth 3, real index 4.
- Back from there then re-tags entries one too high.
- Needs two presses inside one task turn: likely only on a busy phone, where queued inputs run before the hashchange task. Not seen in 980 monkey steps.

### m8. `CHANGED_STEPS` rev 2 keeps ticks made on the old content before the user updates
- `at: 1792573774000` is 2026-10-21 09:09:34 UTC, six minutes before 341ccfe. A ✓ Clean on the old `open-triads.0`, `u-triads4-check.1`, `upper-structures.1` or `colour-chords.0` survives if made between then and the user's install of v1.0.45. The APK is sideloaded, so that can be days.
- For rev 2 (shipped together with the migration), every record found at the first v1.0.45 start predates the change, so no `at` exception is needed. Example: a stored `clean: at2 + 5000` on `u-triads4-check.1` survived the load.
- Corrupt values:
  - `rev: "2"` or `-5` re-runs the drop;
  - `rev: 1e308` disables all future revisions (`s1-test.0` with `clean: 1` survived).
  - No errors and no bad text in any case.

### m9. The course map re-centres on the next lesson when the player had scrolled back to the top
- Where: `course.js:218` scrolls when `main.scrollTop < 8`. `app.js:151` restores only a non-zero position.
- Steps:
  1. Scroll the map to the top.
  2. Tap "Placement check".
  3. Back.
- Result: scrollTop 3,858 (next lesson centred) instead of 0. From 1,500 it comes back to 1,500 correctly.

## Visual

### V1. The lesson header still cuts the goal at 915x412 and 932x430 (Galaxy S2x and iPhone Pro Max in landscape)
- Where: `app.css:518`, `@media (max-width: 900px)` hides the Options text only below 901 px.
- Measured (subtitle scrollWidth / clientWidth, Options button width):
  - 915x412: `u-coltrane-check.1` "Checkpoint 53.✓ · step 2/4 · goal 15…" 214/195, Options 334 px; `u-harmony5-check.0` 214/200, Options 327 px.
  - 932x430: 214/195 and 214/202.
  - 780x360, 844x390 and 640x300: the subtitle fits (214/213 at worst). 1024x768 fits too.
- Screenshot at 915x412 shows "goal 15…".

## Checked and fine
- **Self-test:** `problems: 0` (191 exercises, 242 lessons, 26,289 builds, 1,483,775 notes).
- **Round-9 fixes confirmed:**
  - M1: no "null" on the course map;
  - M2: `r5low` has 0 fretted root → low-5th jumps of 5+ frets (was 437/1,956); 146 go to the open E, which is not a jump; 0 roots above fret 9 that have a lower place;
  - M3: a saved cycle key no longer reaches a lesson step (gr-funk-changes cycle4 → `u-harmony5-check.1` opens in A, 192 notes);
  - m1 (code read): the fret notice is appended to the step tip;
  - m2: no backing on technique steps (and the self-test checks it);
  - m3 (code read): a demo in a session says "tap Next";
  - m6: s1-test.0 and swing.1 are registered;
  - V1: fits at 640–844 px wide, except 915 and 932 (see V1 above);
  - V2: S1–S6 jump buttons put each stage head at the top; the map opens with the next lesson centred.
- **chordShape rules on the voice-led exercises** (default register, 4/5/6 strings, frets 12–24): 0 chords with three notes on a string or one pitch in two places, except arp-ii-v-i high/low (m4).
  - Every course step on a shape exercise is clean on both counts.
  - Voice-led arpeggios fill each chord's real length in 1,152 builds: whole bars, chords on half-beat boundaries, all 8ths (jazz blues 12 bars, Giant Steps 16, ii–V–I 4).
- **Shape lines:** R-3-5 in C is C@A3 E@D2 G@D5 (the commit's example).
- **Groove roots:**
  - no root-to-root leap over an octave in any progression × 12 keys × 4 range options (max 11 semitones, as before);
  - the reggae I–IV–V–I returns to its first root;
  - 67 of 1,632 root lines changed: 34 move less, 21 more (jazz blues F7 always at F29), none over 11.
- **Walking** (every walking exercise, every option × 15 keys, 4 and 5 strings, 98,538 notes each): 0 leaps over an octave, loop included; 93 / 62 notes above G3; 13 / 9 one-string jumps of 10+ frets.
- **Slap:**
  - 0 thumbed hammer-run starts left on D/G;
  - 0 pops below D, 0 pops on the thumb's string, 0 wrong-direction H/PO, 0 thumbs on low B when E has the note;
  - thumbs on D/G 1.3–1.7%, all notes with no E/A place within 12 frets (intended).
- **Navigation:**
  - goBack blocks the rail tap after "Done ›" and ends on the lesson page at the right depth;
  - a double Back goes back once; a real double-click on the exercise Back goes back once;
  - nav fuzz of 300 steps and 3 monkey runs gave 0 depth mismatches. The only depth notes came from Chrome's 50-entry cap in run 1003 and from my own browser Back at depth 0.
  - 19 presses were blocked while Back was in flight.
- **Placement:** "All not yet" answers the later stages, "All yes" fills only the earlier open ones, the hint counts what is still open, and the button enables when all are answered.
- **Sessions at course end:**
  - all known: Warm-up, "Library · L5/L6" items only (L5/L6 exercises), Ear drill;
  - all done with 13 due: reviews first (`rv`), oldest first;
  - Home text matches.
- **Course steps** (550 × 4/5/6 strings × highest fret 17 and 20):
  - presets kept, subs valid, backing plays wherever named, no over-fret;
  - the longest loop is 192 s (`rudiments-all-keys.0`).
- **Storage and routes:**
  - 10 corrupt course values: garbage, array, null, number, rev string, huge, negative or object, `__proto__` steps, string clean;
  - 16 bad routes: unknown ids, `ls=…99`, `ls=…-1`, demo+rv, a mismatched exercise, `sub=7`;
  - 0 errors and no NaN/undefined/null text.
- **Timing** (logged Player):
  - Giant Steps written 8ths at 260 BPM and ii–V–I at 240: 4 count-in clicks, 0 ms grid error, seamless loops;
  - speed trainer 200 → 204 → 208, each loop credited at its own tempo.
- **Tuner maths:** yin on 96 synthetic tones (12 kHz, 2048 samples), worst 2.63 cents (two cases over 2 cents, same as last round), right note every time. pitch.js and audio.js are unchanged since the last sample check.
- **Memory:**
  - 100 cycles of map → lesson step (Options and Info open/close) → Back → placement → Back: heap 12.8–14.8 MB with no trend, nodes 1,389 on the map every time;
  - 2.5 min of Giant Steps at 260 BPM: heap 10.7–11.1 MB, nodes 974–987, animations 13–15;
  - monkey heaps 10–14 MB with no trend.
- **Monkey:** 0 app errors, NaN or undefined text, ghost audio, ghost pads, stuck players, extra tips, listener growth or horizontal scroll in 980 steps.
  - The 22 "lesson-write" notes are `plays: undefined → 0`: the record `updateProgress(id, {})` creates on open for "Continue" (since round 2), which is harmless.
- **Layouts:**
  - course map, placement, lesson page, checkpoint steps, demo and tip at 640x300, 780x360, 844x390, 915x412, 932x430, 1024x768 and 360x780: no horizontal scroll, covered controls or small targets except V1 (the "I can" checkbox sits in a 544x32 label);
  - the tip sits at the bottom of the stage (349x55 in a 211–271 px stage);
  - portrait shows "Turn your phone sideways".
