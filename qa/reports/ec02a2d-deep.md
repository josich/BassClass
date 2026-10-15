# QA deep report · ec02a2d · 2026-10-15
Summary: 0 critical, 2 major, 5 minor, 0 visual. Runs: monkey seeds 41 (330 steps, 844x390, 4-string), 42 (340 steps, 640x300, 6-string, left-handed, Do-Re-Mi, max fret 24, phone speaker + octave layer + boost 15), 43 (340 steps, 780x360, 5-string, max fret 17, Deg labels, bass 200 %, click 150 %), plus targeted seeds 44–48 (80 steps each, started on 170, 171, 173, Settings and 44 with the broken shape). That is 1410 steps in about 12 min. Also: self-test, a note-by-note check of all the new scales and modes, a chord-tone spelling sweep (7,512 builds), a timing harness, an output-chain tap, a corrupt-storage matrix (8 cases on 5 routes), route tests, memory cycles, 2 min of continuous play and layouts at 5 sizes. About 2 h in total.

Scope: the round-2 fixes (86db590) and everything new up to ec02a2d:
- the spelling engine (70c7e4f);
- exercise numbers (9ad4ae6);
- the phone-speaker profile and the Android route bridge (a58f8bc, fd997c8, d775042);
- harmonic major (ddcd1de);
- exotic scales, broken chords and Messiaen modes (ec02a2d).

New scripts: `qa/tools/monkey3.js` and `qa/tools/spelling-check.js`. The older tools were reused.

Note on the build tested: at 16:37 the main session put an uncommitted change in the working tree that removes the sound options from Settings. My server serves the working tree, so these checks ran on ec02a2d code: the monkey runs, the corrupt matrix, the route tests and the audio measurements. These ran after the change: the timing runs, the memory cycles and the layout checks (on exercise screens, Library and Home only). They do not depend on the removed code. As asked, nothing below is about the removed sound controls.

## Round-2 fixes: all hold
| Round 2 | Status | Evidence |
|---|---|---|
| M1 trainer clicks after the last note at the next loop's tempo | fixed | Synthetic loop (1 + 3 beats), 60 BPM, +8: clicks at 0 / 1000 / 2000 / 3000 ms, then 4000 / 4882.4 / 5764.7 / 6647.1 ms (68 BPM), then 7529.4 + 789.5 ms steps (76 BPM). Loop events carry 68/60 and 76/68. |
| M2 `tri-approach` "Up & back" silence | fixed | `beatsPerBar: 3`: count-in is 3 clicks, loop is 45 beats, 0 beats silent, grid error 0 ms at 200 BPM. |
| m1 sound settings ignored outside exercises | fixed | `app.js` applies the saved options at start-up; "Restore defaults" calls `setAudioOptions`. |
| m2 limiter ducking / clipping | fixed | The click joins after the limiter. Measured on ec02a2d (table under "Checked and fine"): no samples over 1 and flat runs of 3 samples at most. |
| m3 favourites drag cancel / detached list | fixed | `pointercancel` puts the DOM and storage back exactly as they were. `move` stops once the list is detached. |
| m4 warm-up Finish / `#/m/nope` | fixed | Start, then Next x5, then Finish: back on the same Home entry (depth 4, then 5 during the routine, then 4). `#/m/nope` replaces itself with `#/path`. |
| m5 grip size and keyboard | fixed | The grip is 36x44 px. ArrowDown and ArrowUp move the row and save the order. |
| m6 C♭7 / B♭♭ in G♭ dominant progressions; whole tones B♯ | fixed | `hm-12-bar-blues` in G♭: G♭7, then B7. `iv-cycles`, whole tones from C: the return to C is spelled C and labelled R. |
| V1 favourites below the fold | fixed | At 640x300 the favourites block starts at y=61, before the warm-up (y=769). |
| V2 portrait Home overflow | fixed | At 360x780: no block wider than the screen and no h-scroll. |

## Critical
None.

## Major

### M1. Jazz spelling: the minor 3rd of a minor chord is respelled (A♭m7 shows B, D♭m7 shows E)
- Where: `web/js/builder.js:37`. `CORE_DEGREES` lacks `'♭3'` and `'♭10'`, so `Builder._push` (`builder.js:59`) treats the ♭3 of every minor, m7♭5 and °7 chord like an altered note. In every `{ jazz: true }` exercise, it replaces the ♭3 with its "readable" enharmonic.
- This breaks the documented rule "chord tones keep their interval … chords inside a key keep the key's spelling (C♭ is the IV of G♭ major)". The commit message of 70c7e4f says the same.
- Steps: open `#/ex/45` (Chord qualities), Key G♭, Major. Or open `#/ex/81` (walking chord tones), ii–V–I, Key G♭.
- Expected / Actual (built note by note):
  - 45 `hm-chord-qualities`, G♭ major: `[A♭m] A♭ B(♭3)`. The same exercise shows the IV as C♭, so in one key the ii's 3rd is B but the IV's root is C♭.
  - 81 `wk-chord-tones`, ii–V–I in G♭: `[A♭m7] A♭ B(♭3) E♭`.
  - 112 `hm-minor-keys` and 47 `hm-12-bar-blues` (minor blues), E♭ minor: `[A♭m7] A♭ B(♭3) E♭ G♭`.
  - 97 `md-chord-scale`, ii–V–I in all keys, G♭ section: `[A♭m7] Dorian: A♭ B♭ B(♭3) D♭ …`. Two letter-B notes in one 7-note scale.
  - `hm-shells`, `hm-double-stops`, `hm-chordal-bass`: the 10th over A♭m7 is B, labelled ♭10.
  - 43 `arp-7th-qualities` ("The five 7th chords from one root"), key D♭:
    - `D♭m7 = D♭ E A♭ C♭`, which mixes E with C♭;
    - `D♭m7♭5 = D♭ E G C♭`;
    - `D♭°7 = D♭ E G B♭`.
    - This is a chord-construction drill, and the decision list says those keep textbook spelling (B♭♭). Commit 70c7e4f nevertheless switched it to `jazz: true`, and now even `C°7 = C E♭ G♭ A`.
- Reach: the sweep (`qa/tools/spelling-check.js`, `__chordToneSweep`, 7,512 builds) flags a respelled ♭3 or ♭10 chord tone in 29 exercises:
  - Modes: `md-chord-scale`, `md-altered-chord-scale`.
  - Arpeggios: `arp-7th-qualities`, `arp-zone-cycle` (min7: A♭m7), `arp-ii-v-i`, `arp-voice-led`, `arp-guide-tones`, `arp-extended`, `arp-upper-structure`, `arp-approach`, `arp-rhythm-changes`, `arp-giant-steps`.
  - Harmony: `hm-chord-qualities`, `hm-12-bar-blues`, `hm-chord-tones`, `hm-double-stops`, `hm-minor-keys`, `hm-shells`, `hm-colour-chords`, `hm-chordal-bass`.
  - Grooves: `gr-blues`.
  - Walking: `wk-chord-tones`, `wk-approach`, `wk-scalar`, `wk-mixed`, `wk-enclosures`, `wk-two-per-bar`, `wk-minor`, `wk-triplet-skips`.
  - Blue ♭3s in licks and slap are excluded, because they are allowed.
  - Eight of the 29 were confirmed by hand (the examples above).
- Related, for the user to decide: the ♭5 of m7♭5 and diminished chords is also respelled, because the builder comment lists ♭5 as "altered". For example, E♭ minor ii–V–i gives `Fm7♭5 = F A♭ B E♭`, and its Locrian ♮2 reads `… B♭(4) B(♭5) …`. On a 7♭5 dominant the ♭5 is an alteration; on m7♭5 or ° it is a chord tone.
- Fix idea: add `'♭3'` and `'♭10'` to `CORE_DEGREES`, and probably `'♭5'` when the chord is m7♭5 or diminished. Decide whether `arp-7th-qualities` is a jazz exercise.

### M2. Broken chords, default "1-3-5-3" shape: the closing root breaks the bar grid
- Where: `web/js/builder.js:267-275`. `brokenSeq` appends a final root, so the shape has 4·n·oct + 1 notes. The exercise plays in 16ths (`sub: 4`) and the player pads every loop to a whole bar.
- Affects 172 `arp-broken` (default shape) and the new "Broken" shape in 44 `arp-7th` and 107 `arp-two-octaves`.
- Steps: open `#/ex/172` and play. Then set Key to "All 12 · cycle of 4ths".
- Expected / Actual:
  - **One key:** the 16 notes of the 4 cells fill bar 1. The final root is a lone 16th on beat 1 of bar 2, then 3¾ beats of silence before the loop restarts. With 7th chords: 25 notes, then 1¾ beats of silence. With 2 octaves: 41 or 57 notes, then 1¾ beats of silence.
  - **All 12 keys:** each key adds one extra 16th, so every following key starts one 16th later. 9 of 12 keys start off the beat. The cells then straddle the beats, and the on-beat accent (velocity 0.88 vs 0.74) and the click fall on the 2nd, 3rd or 4th note of the cell. That contradicts the tip "Say the degree of the first note of each cell" and the aim of even cells.
- Evidence: a logged `Player` at 120 BPM, Key "cycle4", major triad. The C cells start on the beats: 0, 500, 1000, 1500 ms. The closing C falls at 2000 ms (beat 5). F (step 17) starts at 2125 ms, a 16th late, so the click at 2500 ms lands on the cell's 4th note A (step 20). B♭ (step 34) starts at 4250 ms, an 8th late.
  - Layout: single key 4.25 beats in an 8-beat loop. Cycle4: 51 beats in 52 (triads) and 75 beats in 76 (7ths).
  - "Broken 1-5-3-5" and "groups of 4" end on the root naturally: 0 keys off the beat, 0 silence in cycle mode.
- Fix idea: give the closing root a full beat (dur = sub), or drop it whenever another key follows.

## Minor

### m1. Messiaen modes 3 and 7 (and the augmented scale) are named as if they were minor scales: G♯ mode 7 shows F𝄪 in a "plain-spelled" exercise
- Where: `web/js/theory.js:281` and `:294`. The rule "contains ♭3, 5 and 7 → name it after its natural-minor key signature, sharps cost only 0.1" also catches scales that contain both ♭3 and 3: Messiaen modes 3 and 7, and augmented.
- Result in 173 `sc-messiaen`:
  - Key 8 is named **G♯**: `G♯ A A♯ B C♯ D D♯ E E♯ F𝄪`. The C𝄪 is made plain (D), but the F𝄪 stays because its label `7` is a "core" degree.
  - Key 1 is named C♯ for modes 3 and 7: mode 3 = `C♯ D♯ E E♯ G G♯ A B B♯`.
  - The code says these scales are "spelled the plain way" (`scales.js:401`), and the spelling rule asks for flats on black keys except minor-type scales. A♭ mode 7 would read `A♭ A B♭ B D♭ D E♭ E F G`.
- Also for the user: E♯, B♯, C♭ and F♭ survive in other plain-spelled scales wherever they fall on 3, 7 or ♭7:
  - D♭ Messiaen 1: C♭;
  - G♭ Messiaen 6: C♭ and F♭;
  - F♯ augmented: E♯;
  - C♯ Messiaen 4: B♯.
- Evidence: built note by note for every type and key (the list is in the run log). `T.bestRoot(8, SCALES.messiaen7.iv)` returns G♯.

### m2. "C phrygian dominant" in lower case on the chord badge of 171
- Where: `common.js:84-90`. `SHORT` gives "Hungarian minor", "Ukrainian Dorian" and "Messiaen mode N", but Phrygian dominant falls back to `name.toLowerCase()`.
- The badge shows "C phrygian dominant" next to "C Ukrainian Dorian". The option chip says "Phrygian dominant (Spanish)".
- The same lower case appears in other scale exercises that offer Phrygian dominant.

### m3. Library: Back restores the scroll position but not the search, so it lands on unrelated exercises
- Where: `app.js:44-53, 109-111`. The scroll is remembered per history entry. `libraryScreen` (`screens.js:215`) always re-renders with an empty search.
- Steps: Library, search "arpeggio", scroll 1200 px, open #151, then Back.
- Actual: the search box is empty and the full list sits at 1200 px, showing #23–25.
- Without a search it works: scroll 2500, open #47, Back: 2500, same card.

### m4. "Broken: groups of 4 (1-3-5-8, 3-5-8-10…)" on a triad over one octave is a plain up-and-down arpeggio
- `brokenSeq(3, [0,1,2,3])` gives `0,1,2,3, 3,2,1,0` (1-3-5-8, 8-5-3-1).
- The promised second cell (3-5-8-10) only exists with 2 octaves or 7th chords. With a triad over one octave the option adds nothing over "Up & down" except a doubled top note.

### m5. "In 3rds" on the 8 to 10-note scales is mostly 2nds
- In 173 (and 124 symmetric), "In 3rds" means "skip one scale note". On Messiaen mode 7 from C that gives C–D, D♭–E♭, D–F, E♭–F♯, F–G…, mostly major 2nds.
- The label is misleading for modes 2, 3, 4, 6 and 7. A neutral name ("Skip one note") or a note in the Info text would help.

Suspicion, not confirmed (no device here): `MainActivity.audioRoute()` reports "external" when any listed output device is *connected* (`getDevices(GET_DEVICES_OUTPUTS)`), not when it is the active media route. A connected but idle Bluetooth or USB audio device could keep the natural profile while the sound plays from the phone speaker.

## Visual
None found. Details under "Checked and fine".

## Checked and fine
- **Self-test:** `problems: 0` (173 exercises, 16,923 builds, 1,008,393 notes). numbers.js has 173 unique ids, and 170–173 map to `md-harmonic-major-modes`, `sc-exotic`, `arp-broken` and `sc-messiaen`.
- **New scales and modes against their formulas, all 12 keys:**
  - Harmonic major and its 7 modes, the 4 exotic scales, augmented, and Messiaen 1–7: every spelled note has the right pitch class and the letter its interval requires.
  - Harmonic major: Dorian ♭5 = 1 2 ♭3 4 ♭5 6 ♭7; Phrygian ♭4 = 1 ♭2 ♭3 ♭4 5 ♭6 ♭7; Lydian ♭3; Mixolydian ♭2; Lydian augmented ♯2; Locrian ♭♭7.
  - Exotic: double harmonic 1 ♭2 3 4 5 ♭6 7; Hungarian minor 1 2 ♭3 ♯4 5 ♭6 7; Hungarian major 1 ♯2 3 ♯4 5 6 ♭7; Ukrainian Dorian; augmented 0 3 4 7 8 11.
  - Messiaen: 2-1-1, 1-1-3-1, 1-4-1, 2-2-1-1 and 1-1-1-2-1 cells.
- **Built exercises:**
  - `md-study` (the 7 new modes), `sc-exotic` (6 types, plus cycle4) and `sc-messiaen` (7 types) were built on 4/5/6 strings in 4 option sets.
  - Every note is in the scale, every degree label equals the formula label, and the key chip always equals the badge root.
  - `md-harmonic-major-modes`, 12 keys x 2 directions: each of the 7 segments has exactly its mode's degrees and name.
- **Harmonized scales**, 12 keys, for major, natural minor, harmonic minor, melodic minor and harmonic major:
  - Triad and 7th qualities are correct, and every chord tone equals the scale note.
  - Harmonic major gives I ii° iii iv V ♭VI+ vii° and Imaj7 iiø7 iii7 iv(maj7) V7 ♭VI+maj7 vii°7.
- **Texts:** the facts in the Info text and tips of 170–173 check out:
  - Hungarian minor is the 4th mode of double harmonic, and Ukrainian Dorian is the 4th mode of harmonic minor.
  - The augmented scale is C+ and B+, period 4 frets.
  - The transposition counts are 2/3/4/6.
  - Phrygian ♭4 is the altered scale with a natural 5th.
  - Harmonic major + 6 is Barry Harris's 6th-diminished scale.
- **Minor ii–V–i chord-scale** (decision kept): the V7♭9 gets Phrygian dominant with ♭9/♭13 labels in every key; F𝄪 stays as the 3rd of D♯7.
- **7th-chord zone cycle with inversions** (`arp-zone-cycle`, 1620 builds: 4/5/6 strings, max fret 17/20/24, every option):
  - always 12 chords;
  - every note inside the zone (or zone ± the stated number of frets);
  - fingers 1–4.
- **Timing (logged `Player`):**
  - Count-in is one bar (3 clicks in 3/4).
  - 0 ms grid error at 30 BPM x6, 260 x6 (Messiaen 7, 2 octaves), 260 x5 (harmonic-major modes), 120 x4 (broken) and 200 (tri-approach).
  - Speed trainer: 250 → 254 → 258 → 260, then it stays at 260.
- **Samples and tuner:**
  - All 84 manifest files decode. The worst regular sample is 3.6 cents off.
  - `yin` on 96 synthetic tones: right note every time, worst single frame 2.63 cents (noise plus a weak fundamental). Same as round 2; pitch.js is unchanged.
- **Output chain on ec02a2d** (AudioWorklet tap on the final WaveShaper, 16 notes E1–C4 plus clicks):

  | Setting | Peak | RMS | Samples > 0.92 | Samples > 1 | Longest flat run |
  |---|---|---|---|---|---|
  | Full sound, bass 100 %, click 60 % | −0.31 dB | −9.2 dB | 0.01 % | 0 | 1 |
  | Full sound, bass 200 %, click 150 % | −0.25 dB | −8.3 dB | 1.2 % | 0 | 2 |
  | Phone profile +12 dB, bass 100 % | −0.31 dB | −9.7 dB | 0.07 % | 0 | 1 |
  | Phone profile +15 dB, bass 200 %, click 150 % | −0.26 dB | −8.7 dB | 1.8 % | 0 | 3 |
  | Phone profile +15 dB, octave layer | −0.31 dB | −7.9 dB | 1.7 % | 0 | 2 |

  Bass 0 % with click 0 % is true silence. There are no NaN values.
- **Corrupt storage** (8 cases on `#/ex/172`, `#/ex/171`, `#/ex/173`, `#/settings` and `#/`): 0 errors, no NaN or undefined. The cases:
  - garbage JSON in all three keys;
  - `speaker: 'xx'` and `7`;
  - `phoneBoost` −5, 99, "12" and null;
  - `octaveLayer: 'yes'`;
  - the old `octaveUp: true` together with `strings: 7`, `maxFret: 3`, `bassVol: -5`, `notation: 'xx'`, `level: 0`;
  - progress with `lastBpm 'fast'`, `sub 9`, `bestBpm 1e9` and params `quality 'zzz'`, `shape 'broken9'`, `type 'messiaen9'`.
- **Routes:**
  - `#/ex/1`, `#/ex/173` and `#/ex/0042` (gives #42) open the right exercise.
  - `#/ex/174`, `0`, `-1`, `1.5`, `1e2` and a 20-digit number fall back to Home.
  - Bad parameters on 170–173 and 44/107 fall back to the defaults.
  - `#/library?l=6`, `?l=99` and `?l=abc` work.
- **Monkey runs, seeds 41–48 (1410 steps):** 0 errors, 0 NaN/undefined text, 0 BPM out of range, 0 stuck states, 0 ghost audio, 0 h-scroll, no sheet or drawer left without its close button.
- **Memory:**
  - 100 cycles (open 170–173, 44 or broken all-keys; play; Options; Info; Back): heap 11.9–15.6 MB with no steady climb. The DOM was back to 109 nodes on every Settings sample, and storage stayed at 6.6 KB.
  - 120 s of `arp-broken`, all keys, 2 octaves, at 236 BPM: heap 15.0–15.8 MB, DOM flat at 3819 nodes. The UI queue grew only because the hidden pane fires no animation frames; it is capped at 3000 (round 2).
- **Layout** at 640x300, 915x412, 1024x768 and 360x780 (6 strings, left-handed, Do-Re-Mi, 24 frets, then 4 strings with Deg labels):
  - Screens: 170–173 (with Options and Info open), Library and Home.
  - No clipped text, no h-scroll, and no control off-screen except behind the portrait rotate prompt.
  - Controls are covered only by the open sheet or drawer.
  - Tab-strip chord labels never overlap ("C double harmonic major", "G♯ Messiaen mode 7").
- **Fingering of the new scales:** every move with a stretch or a slide by the same finger is a single position shift (at most 2–4 per key, the same as Dorian and melodic minor in 3rds). Over 4/5/6 strings, 0 cross-string jumps of 5 or more frets inside one position.
- **Over-max notices:** only 4-string E♭ cases at max fret 17 go over (fret 19–20), always with the notice. This is intended.
- **Kotlin bridge:**
  - `minSdk 24` covers `AudioDeviceCallback` (API 23).
  - The callback runs on the main looper and is unregistered in `onDestroy`.
  - `audioRoute()` is thread-safe (the lazy `AudioManager` is synchronized).
