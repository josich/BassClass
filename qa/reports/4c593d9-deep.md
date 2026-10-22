# QA deep report · 4c593d9 · 2026-10-22
Summary: 0 critical, 3 major, 9 minor, 1 visual. Runs: monkey seeds 1201 (330 steps, 844x390, 4-string), 1202 (340 steps, 780x360, 5-string, strings/left-handed/Do-Re-Mi changed mid-run), 1203 (340 steps, 640x300, 6-string, left-handed, Do-Re-Mi, highest fret changed mid-run) and 1204 (300 steps, 844x390, targeted at Make Music, sweep, tapping, the new lessons, folds and My level). That is 1,310 steps, about 10 min of taps. Also:
- self-test;
- a checker for the new exercises: every option combination, every key, 4/5/6 strings, highest fret 17/20/21/24 (9,140 builds);
- a geometry checker for the new staff engraving: 5,221 builds at staff sizes 8 and 6, 47,982 accidentals;
- labels and spelling of the 30 song studies, slap and hammer rules, hand jumps;
- timing with a logged `Player` (5/8, 7/8, 7/4, 5/4, sextuplet sweeps, tapping, speed trainer);
- course progress across the steps appended in this round (`qa/tools/grown12.py`);
- My level, the folds, the ⋯ menu states, the session tick with Loop off;
- 20 corrupt storage values and bad routes;
- 100 memory cycles and 3 min of continuous play;
- layouts at 6 sizes;
- theory and yin re-checks.

About 2.5 h. Scope: bdc08e7..4c593d9, 11 commits:
- bbb984b: round-11 fixes;
- 18f99b6: strip scroll;
- a9db509 and 797e117: staff spacing and accidentals;
- 148c9e1: player menu icons;
- 8621c29: My level;
- ea4ed04 and 5cba6f5: folds;
- 979b791: Make Music;
- 4c593d9: sweep and tapping.

Test setup:
- `qa` server on `http://localhost:8878`, with the service worker unregistered and caches cleared first.
- My own tabs only: tab-1, tab-3 and tab-4.
- The pane was hidden for most of the run. I used the MessageChannel timer wheel (`__fastSrc`, `qa/tools/home11.js`), installed before the first Play.
- Note: commit 92ce1df (pick strokes ⊓/V) landed mid-run, at about 13:20.
  - Browser checks after that time ran on its tree. It changes only the pick-stroke marks in tech-sweep, the pick grooves and mm-blitz.
  - The new-exercise checker, the engraving checker and the timing runs ran before it.
  - 92ce1df also committed my unfinished `qa/tools/*12*` files (harmless).

## Critical
None.

## Major

### M1. The Make Music steps appended to six checkpoints and tests reopen them for players who finished them before bbb984b: My level drops to L1 and Continue goes back to Stage 1
- Where:
  - `web/js/course/progress.js:138` (`isComplete`): a done record without `n`/`c` falls back to `COUNTS_V143`, else to the current counts.
  - Six lessons grew in 979b791/4c593d9 and are not in `COUNTS_V143`:

    | Lesson | Steps |
    |---|---|
    | u-lines-check | 2 → 3 |
    | u-scales-check | 2 → 3 |
    | s1-test | 5 → 7 |
    | u-feel-check | 3 → 4 |
    | s2-test | 5 → 9 |
    | u-all-keys-check | 2 → 3 |

  - The listed lessons that grew (u-blues-check, u-funk-check, s3-test … s6-test) are safe.
  - Evidence: `python -I qa/tools/grown12.py bdc08e7 4c593d9`.
- Steps:
  1. Store a Stage 1–2 player whose records predate bbb984b: every step that existed at bdc08e7 ✓ Clean, every "I can" ticked, `lessons[id] = {done, reviews, next}` with no `n`, `rev` 4.
  2. Open Home.
- Expected: Stages 1–2 stay done, the player is at Lesson 17.1 (L3), and the reviews keep coming.
- Actual:
  - `u-lines-check`, `u-scales-check`, `s1-test`, `u-feel-check` and `s2-test` have status `started`.
  - `continueLesson()` = u-lines-check and `playerLevel()` = 1.
  - Home reads "My level L1 · ▶ Continue · Checkpoint: Your first bass lines".
  - The session is planned at Level 1, with "“With or Without You” style … Checkpoint · 3/3" and "“Seven Nation Army” style … Checkpoint · 3/3".
  - Those five lessons are no longer reviewed (`isDue` needs `isComplete`).
- Who is hit: everyone who completed these before the round-11 fixes shipped (2026-10-21). That is the first course players, the same people round 11's M2 protected.
- Fix idea: either list the six with their bdc08e7 counts in the fallback table:
  - u-lines-check [2,3], u-scales-check [2,3], s1-test [5,4];
  - u-feel-check [3,3], s2-test [5,4], u-all-keys-check [2,2].

  Or have `load()` backfill `n`/`c` on every done record once, so a future append never depends on a hand-kept table.

### M2. Upper-structure triads are spelled by pitch class, not by key: chord tones of the lower chord get the wrong letter (the 5th of B as G♭, the 3rd of E7 as A♭)
- Where: `web/js/curriculum/triads.js:868`, `upRoot = T.bestRoot(T.mod(k + u.off, 12), …)`. It picks the lead-sheet name of the pitch class (flats on black keys) whatever the key below.
- This round only changed the register of this exercise (8758db5 → bbb984b). The spelling is older. Round 11 checked only C.
- Evidence (4-string, 108 builds = 9 structures × 12 keys): 55 builds have a note whose spelling disagrees with its own label. In 19 of them it is a chord tone of the lower chord:

  | Structure, key | Header | Notes (labels) | Should be |
  |---|---|---|---|
  | V/I in B | "G♭/B" | G♭ (5), B♭ (7), D♭ (9) | F♯/B: F♯ A♯ C♯ |
  | iii/I in B | "E♭m/B" | E♭ (3), G♭ (5), B♭ (7) | D♯m/B |
  | VI/7 in E | "D♭/E" | D♭ (13), F (♭9), A♭ (3) | the 3rd of E7 is G♯ |
  | VI/7 in A | "G♭/A" | – | the 3rd of A7 is C♯ |
  | VI/7 in B | "A♭/B" | – | the 3rd of B7 is D♯ |
  | bIII/7 in D♭ | "E/D♭" | G♯ (5), B (♭7) | A♭, C♭ |
  | bVII/m in G♯ | "G♭/G♯" | G♭ as the ♭7 of G♯m | F♯ |

  - II/I and II/7 in E and B: "G♭/E" with G♭ B♭ D♭ labelled 9, ♯11, 13. The II of E is F♯ (F♯ A♯ C♯).
  - Every build with a mismatch, by structure (* = a chord tone of the lower chord misspelled):
    - II/I and II/7: E "G♭/E", B "D♭/B".
    - V/I: B "G♭/B"\*. iii/I: B "E♭m/B"\*.
    - VI/7, ♭VI/7, ♭III/7, ♭V/7: in all 12 keys a tension is spelled from the triad (A/C7: C♯ labelled ♭9). Chord-tone errors (\*):
      - VI/7: E "D♭/E", A "G♭/A", B "A♭/B";
      - ♭VI/7: D♭ "A/D♭", E♭ "B/E♭", G♭ "D/G♭", A♭ "E/A♭";
      - ♭III/7: D♭ "E/D♭", G♭ "A/G♭", A♭ "B/A♭";
      - ♭V/7: D♭ "G/D♭", E♭ "A/E♭", F "B/F", G♭ "C/G♭", A♭ "D/A♭", B♭ "E/B♭".
    - ♭VII/m: G♯ "G♭/G♯"\*.
- CLAUDE.md:
  - "chord tones keep their interval";
  - "Chord tones stay academic there too" (jazz exercises);
  - "Upper-structure triads label each upper note against the lower chord".

  Here the labels are right and the letters are wrong. In C, F and other natural keys the triads read correctly. Tensions spelled from the triad (A/C7: C♯ labelled ♭9) may be a convention question for the user. The chord-tone cases are plain errors.
- Fix idea: spell the upper root as the interval above the lower chord's root (`T.up(bass, iv)` for II = 2, V = 5, iii = 3, VI = 6, ♭VI = ♭6, ♭III = ♭3, ♭V = ♭5, ♭VII = ♭7). Fall back to the plain name only when that needs a double accidental.

### M3. Make Music: the octave of an open-string root is placed at fret 12 of the same string, so the Stage 1 test shows E0 → E12 octaves and jumps the hand 9–11 frets at chord changes
- Where: `songs.js` `song().build` → `emitMixed(b, items, { center, open, fold: false })`. The groove module plays the same octave as a shape. With gr-octaves, E1 → E2 = `E@E0 → E@D2` ("two strings up, two frets up", CLAUDE.md "Shape lines").
- Evidence (4-string, highest fret 20; the same at 17 and 24):
  - mm-zombie "Chorus":
    - The Stage 1 test step: `s1-test.5`, "pumping octaves in the chorus", Level 1.
    - Em bar: `E1@E0 E1@E0 E2@E12/1 E1@E0 E1@E0 E1@E0 E2@E12/1 E1@E0`.
    - Then C: `C2@A3 C3@G5`, two strings up as expected. The hand goes fret 12 → fret 3 between consecutive 8ths (0.39 s at 76 BPM).
  - mm-criminal "16th engine":
    - `A1@A0 A1@A0 A2@A12/4 A1@A0 G2@A10/2 A1@A0 E2@E12/4 … [F] F1@E1/1`. An 11-fret shift between consecutive 16ths (0.15 s at 100 BPM).
    - The usual shape would be A2 on the G string fret 2 and E2 on the D string fret 2.
  - mm-dust "Breakdown": `E1@E0 r E1@E0 r D2@E10/4 E1@E0 … G1@E3`. D2 is the open D string (or A5, where the Riff part puts it).
- Same-string jumps of 10+ frets across all parts, 4/5/6 strings: 378 (mm-zombie, mm-dust, mm-criminal, mm-solo-piece). Consecutive fretted notes whose hand position moves 5+ frets within a beat: zombie 9, criminal 8, thump 5, solo-piece 5 (a one-off script over every part: hand position = fret − finger + 1, consecutive fretted notes).
- A beginner copying the Level 1 study learns a 12th-fret octave that no teacher would give. The lesson text says "pumping octaves".

## Minor

### m1. The new lesson 38.4 "Sweep picking" (inserted in Stage 5) lowers the level of everyone past Stage 5
- `firstGap()` returns `sweeps` for a player who finished Stage 5 by playing, so `playerLevel()` = 5.
- Evidence (Stages 1–5 done with `n`/`c`, Stage 6 started):
  - Home reads "My level L5".
  - The session's warm-ups come from Level 5 (permutations across strings, polyrhythms).
  - Continue stays on the started Stage 6 lesson (50.1) until it is done, then jumps back to 38.4.
- Placed players are not affected: `sweeps` is in a known unit.
- Question for the user: should a lesson added inside a finished unit count as a gap for the level? It could stay "new, optional" for players whose unit checkpoint is done.

### m2. Blues studies label any tritone above the chord "♭5", even a ♯4 used as a chromatic approach
- Where: `songs.js` `partItems`: `named = … || (song.mode === 'blues' && above === 6)` and `deg = '♭5'`. This runs before the approach rule and ignores the spelling.
- Evidence (letters, 4-string):
  - mm-flyaway "Riff": `G(R) A(2) C♯(♭5) [D] D(R)`. C♯ leads into the D chord; over G it is ♯4/♯11.
  - mm-tommy: `B(3,T) C(4,T) C♯(♭5,H) [A7] A(R)` over G7, and `C♯(3,T) D(4,T) D♯(♭5,H) → E` over A7.
    - D♯ is outside E blues and a half step below the next chord's root, so by the module's own rule it would be "→".
- CLAUDE.md: "Licks name the tritone … as they are spelled (D♭ over G7 = ♭5, C♯ = ♯11)" and "Approach and enclosure notes are labelled → in every module".
- 3 notes in all 30 studies (checked: every note's label number against its spelled interval).

### m3. My level: on a second visit, "All yes" no longer fills the earlier stages, though the ⓘ still promises it
- Where: `ui/course.js` `placementScreen`. `set` starts with every line when `placed()`, and "All yes" fills an earlier line only when `!set.has(i)`.
- Steps:
  1. Take the placement once with everything "Not yet" (or just "See my starting point").
  2. Open My level again.
  3. Tap "All yes" on Stage 3.
- Actual: Stages 1–2 stay "Not yet" (`S1N … S2N S3Y …`). "See my starting point" then marks Stage 3 known and starts the course at Lesson 1.1, Level 1.
- The ⓘ reads "⇈ All yes on a stage: the stages before it too". On a first visit it works (S1–S3 all Y).

### m4. Library and map folds stop following the player once any fold is toggled; the next lesson's stage stays folded and the map no longer scrolls to it
- Where:
  - `screens.js` `libOpen()`: `settings.libOpen ?? [playerLevel()]`;
  - `course.js` `mapOpen()`: `settings.mapOpen ?? [next lesson's stage]`;
  - the centring uses `details[open] .les-row.next`.
- Steps:
  1. As a Stage 1 player, open or fold any stage on the map (`mapOpen` = [1]).
  2. Finish Stages 1–2.
  3. Open the map.
- Actual:
  - Stage 1 (all done) is open and Stage 3 is folded. The next-lesson row (17.1, inside `#stage-3`) has `checkVisibility() = false` and the map stays at the top.
  - The same for the Library: with `libOpen` [1], a Level 3 player sees only Level 1 open.
- The stored list is the player's choice. Still, the next lesson's stage could always open (or the stored list could be cleared when the level changes).

### m5. The greyed Backing in tech-sweep and tech-tapping says "No chords in this exercise", but both show chord badges and a progression option
- Where: `exercise.js` `cycleBacking`, the toast `'No chords in this exercise: no backing'`. `canBack` is false because the module is technique (`NO_BACKING`), not because there are no chords.
- Evidence: tech-sweep shows `Am F C G` badges, the Options summary lists "i – ♭VI – ♭III – ♭VII", and a tap on Backing toasts "No chords in this exercise: no backing".
- These are the first technique drills built on chord progressions. Rhythm and fretboard drills read correctly.
- The decision greys Backing for technique. Only the reason text is wrong here (for example, "Technique drill: no backing").

### m6. Variant chips: bare numbers read like step numbers, and the 24-character cut makes two rows identical
- Where: `ui/course.js` `variants()`. `optWords` drops the parenthesis and the option name. Chips longer than 24 characters are cut with "…".
- Evidence:
  - Lesson 1.3 (open-strings): rows "Open strings **4**" and "Open strings **1** review". The option is "Notes per string: 4 / 1 (string crossing)".
  - On Home the session tags read "Lesson 1.3 · 4" and "Lesson 1.3 · 1", like step numbers. Before round 11 they read "2/3".
  - groupings: chips "3" and "5".
  - 27 chips are cut. In symmetric (Lesson "Symmetric scales"), rows 1 and 3 both read "Symmetric scales: diminished & whole tone · Diminished half-whole ·…" (Straight vs Skip one note). That is the one case where the chip fails its job.

### m7. Triad inversions "In one position" with the root on the second-highest string still spread over 9 frets, three notes on one string
- Where: `triads.js:446`. The round-11 fix moves only a root on the lowest string (`r.s === 0`).
- Evidence (`tri-inversions`, `mode: 'position'`): 32 of 48 builds (12 keys × 4 qualities) span 6–9 frets in each case:
  - root D on 4-string and 5-string;
  - root G on 6-string.
- E major, root on D (4-string): `[Root] E@D2/1 G♯@D6/1 B@D9/4 [1st inv] G♯@D6/1 B@D9/4 E@G9/4 [2nd inv] B@A2/1 E@D2/1 G♯@D6/1`.
- Roots on B, E and A: max span 4, all fine (round-11 m7 is fixed for E).

### m8. Upper structures at "Highest fret used" 17 put the upper triad 2–6 semitones above the bass
- Where: `triads.js:871`: `if (um + 7 > highest) um -= 12`.
- Evidence:
  - 4-string and 5-string, fret 17: 12 of 108 builds below "a 5th above the bass" (CLAUDE.md). For example, II/I in E: bass `E@A7`, triad `G♭@A9 B♭@D8 D♭@D11` (2 semitones above); bV/7 in C: `C@E8` with `G♭@E14`.
  - Fret 20: 2 of 108; fret 24 and 6-string: 0.
- A lower bass (E string) would keep the triad in range.

### m9. Library search: the topic's own name "make music" finds 2 of its 30 studies, and artists are not searchable
- Where: `screens.js` `libraryScreen`. The haystack holds `t.module` (`music`) but not the module's name, nor `t.song`/`t.source`.
- Evidence: "make music" → 2 found; "music" → 45; "metallica" → Nothing found (the Source line names it).
- Other topic names work because their ids are words of the name ("walking bass").

## Visual

### V1. Portrait Home (360x780): 4 of 15 session titles are still cut after two lines
- Evidence: `.session-list .item .t b` with `scrollHeight > clientHeight`:
  - "Hear it: Stretching towards th…";
  - "Stretch builder: one finger pe…" (×2);
  - "Natural harmonics map (12, 7, …".
- Round-11 V2 is otherwise fixed:
  - the Continue button has its own full-width line (93–325 px);
  - the lesson name keeps an ellipsis;
  - titles get two lines.
- Low priority: the app is landscape. Listed so the next round does not re-measure.

## Checked and fine
- **Self-test:** `problems: 0`: 223 exercises, 244 lessons, 27,941 builds, 1,633,229 notes.
- **New exercises:** 9,140 builds, 1,232,772 notes, 0 problems (`qa/tools/new12.js`).
  - Scope: every combination × 12 keys × 4/5/6 strings × highest fret 17/20/21/24.
  - Each note: string, fret ≤ max (no overFret needed), midi = tuning + fret, spelling = pitch class, a label on every note.
  - Fingers are 0–4, with i/m/a only on RH taps.
  - Written rhythms are whole bars of their metre, with a chord on the first step.
  - Sweeps: adjacent strings, one place per string, a span ≤ 4, picks in the right direction; every chord exactly its progression length.
  - Tapping: PO goes down and H up on the same string, RH taps sit above the LH notes, LH span ≤ 4.
- **Song studies, slap and legato:** 810 builds (4/5/6 strings, fret 17/20/24): 0 H/PO on another string or in the wrong direction, 0 pops below D or on the thumb's string, 0 thumb notes on the low B.
  - Chords all start on bar or half-bar lines; none starts on a rest.
  - Labels against spelling: only the 3 of m2.
- **Staff engraving** (a9db509, 797e117; `qa/tools/engrave12.js`):
  - Scope: 5,221 builds (every exercise, defaults + every option + 12 keys, sizes 8 and 6), 47,982 accidentals.
  - 0 collisions of these kinds:
    - accidental over a head;
    - two accidentals overlapping;
    - a bar line through an accidental, head or dot;
    - an accidental under a beam;
    - a stem through an accidental.
  - 0 chord symbols or labels overlapping; cursor columns always increasing.
  - Accidental to head: 4.0–4.6 px at size 8 (½ space), ≥ 2.9 px at size 6.
- **Strip scroll** (18f99b6): a TabView fed 60 notes at 6 per beat with `scrollLeft` frozen (a smooth scroll in progress): 3–4 `scrollTo` calls, goals monotonic, 0 backwards (tab and staff).
- **Timing (logged `Player`):** 0.000 ms grid error and seamless loops in every case:

  | Exercise | Tempo | Count-in |
  |---|---|---|
  | mm-schism 5/8 | 160 | 5 clicks (21111) |
  | mm-schism 7/8 | 190 | 7 clicks |
  | mm-money 7/4 | 260 | 7 clicks |
  | mm-yyz 5/4 | 260 | 5 clicks; loop 4.615 s = 20 beats |
  | tech-sweep sextuplets | 260 | 4 clicks; loop 3.692 s = 16 beats |
  | tech-tapping pedal | 260 | 4 clicks |
  | mm-whatsgoingon | 260 | 4 clicks |

  - Speed trainer: 250 → 254 → 258 → 260, then stays.
  - A Loop-off pass from the first note ticks the session item (`fb-landmarks|||`); one started at note 5 does not (round-11 m2 fixed).
- **⋯ menu** (148c9e1):
  - Reveal, Dot labels and Tab/staff cycle with matching aria-labels and toasts ("Reveal: whole shape" …).
  - Greyed states are right in fb-quiz, rd-naturals, ear, tech, song and lick exercises, and a greyed tap leaves the settings unchanged.
  - Tapping ⓘ inside a `<summary>` opens the bubble without folding. The jump buttons open their level and store it.
- **Round-11 fixes confirmed:**
  - M1: a fresh plan for a player with 116 lessons done: 0/2 warm-ups and 0 rows ticked, "▶ Start".
  - M3: malformed session items (bad `ls`, out-of-range step, array params, a demo with a step) render Home.
  - m1: all known → 2/5/8/11 items for 15/30/45/60 min.
  - m7: root on E, max span 4.
  - V1: 41 ⓘ taps at 640x300 with no bubble outside the window.
  - V2, V3: ⓘ is 32 px.
- **Monkey** (1,310 steps):
  - 0 app errors, NaN/undefined text, stuck players, horizontal scroll, extra tips, extra bubbles or listener growth.
  - 0 watcher findings: folds against storage, ⋯ labels, greyed Backing reads Off, My level button never disabled.
  - Seed 1201's ghost-audio notes were my harness: the timer wheel was installed after a real Play. Re-tested without it, leaving an exercise schedules 0 notes.
  - The depth notes came from Chrome's 50-entry history cap.
- **Corrupt storage and routes:** 0 errors, and Home / map / lesson / exercise render with:
  - `libOpen`/`mapOpen` = "abc", [7], [0], {}, 7 entries, ["1"], [1.5] (reset to null), [1,1,1], [3,1];
  - lesson records with `n`/`c` = "x", −1, 1e9, 2.5, null;
  - session `at` = "x";
  - progress with `lastBpm` "fast", `sub` 9 and gone params for mm-schism, tech-sweep and tech-tapping;
  - "five" on a 4-string;
  - `#/ex/mm-schism?part=9`, `tech-sweep?shape=five&key=zz&prog=nope&hand=x`, `tech-tapping?pattern=zzz&ls=tapping.99`, `mm-yyz?part=all`, `tech-sweep?ls=sweeps.1&demo=1&rv=1`;
  - reload while playing: all four stores intact.
- **Interrupted flows:**
  - leaving in a 40 BPM count-in: 0 notes after;
  - Back with the Options sheet open: the sheet closes, 0 notes after;
  - the Info drawer closes on Escape;
  - leaving with Backing Chords: 0 pad oscillators left.
- **Memory:**
  - 100 cycles over 5 new exercises (⋯ items, play/stop, options, info, Library fold, map fold, lesson, Home ⓘ): heap 12–45 MB sawtooth, 172 nodes on Home at every sample, 0 animations, bubbles, tips or errors.
  - 3 min of mm-solo-piece on the staff: heap 23–52 MB sawtooth, 816–845 nodes, strip 502–529 SVG children.
- **Layouts** (640x300, 780x360, 844x390, 915x412, 1024x768, 360x780; Home, Library, map, sweeps, two checkpoints, placement, path, Make Music topic, settings, tuner, explorer, three new exercises, ⋯, Options, Info):
  - No horizontal scroll, clipped text or off-screen controls in landscape.
  - Covered controls only under the modal sheet or drawer, or scrolled under the sticky S1–S6 bar.
  - Small targets: only the 20×20 "I can" checkboxes (pre-existing).
  - RH/LH tag pills fit their text (13–16 px in 22 px).
- **Theory:**
  - 15 major and 15 minor keys (natural, harmonic, melodic) have 7 letters and the right intervals.
  - Harmonised triads and 7ths are correct in all 15 major keys (I ii iii IV V vi vii°).
  - Chord detection matches every chord type.
- **Tuner:** `pitch.js`, `audio.js` and the samples are unchanged since f060af0. yin on 216 synthetic tones:
  - clean and weak-fundamental: ≤ 0.08 cents;
  - 16 dB SNR: worst 3.3 cents, right note every time (as in round 11);
  - 11 dB: 12 cents;
  - 5.5 dB: octave errors.
