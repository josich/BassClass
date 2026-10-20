# QA User report · d25bf3c · 2026-10-20

Setup: seventh round, focused on what changed since ea7705f (QA round 6, parts 1–4: staff notation and key signatures, walking and groove lines, new exercises/G7alt/Dorian vamps/#75, fingering and small items).
- Server and tab: my own `qauser` server (python `tools/serve.py 8890`), opened as `http://127.0.0.1:8890`, in my own tab. 191 exercises.
- Profile: empty at the start (no service worker, no cache, localStorage cleared), cache-busting `?qa=u0…u2`. Cleared again at the end; viewport reset, tab closed, server stopped.
- Sizes: 780x360 (main), 640x300, 915x412, 1024x768. Basses: 4-string (builds), 5-string (app, set in Settings), 6-string (builds).
- Method:
  - built exercises with the app's own modules (defaults, every option value, 12 keys, the three "All 12" cycles) and read notes, labels, badges, fingers, strings and tags;
  - checked the staff with an independent reader of the engraved SVG (`qa/tools/engrave-check7.js`, the round-6 checker adapted to the new tick grid, padded last bars, 12/8, filled diamonds and circled ghosts): values, tuplets, ties, rests, beams, bar lines, key signatures, accidentals, ledger lines, 8va;
  - measured overlaps with `getBBox`/`getBoundingClientRect`, in the app and on engraved copies;
  - real clicks: Play/pause, step ▶ to the ear-training answer, ⋯ → Tab/staff, Options sheet (#75), Library search, Settings → 5-string, Path → Scales, hand-scrolling the strip.
  - Helpers: `qa/tools/user7.js`.
- Personas: beginner (Home, Level 1 entry, warm-up, Settings, tuner), advanced player (Options, keys, cycles, string choices, slap, walking), jazz teacher (theory, spellings, engraving, key signatures, licks, sources).
- Not testable here: hearing the sound and the pad, the microphone, the Android app. Screenshots render at odd scales; layout findings are DOM measurements. Screenshot paths are under `C:\Users\OscarGaya\.claude\projects\E--CLAUDE-BassClass\c7f026a2-fcf4-440e-b62e-e6df46b13395\tool-results\` (shortened to `…\` below).

Counts: Blocking 0 · Wrong 2 · Confusing 3 · Irritating 4 · Texts 6 · Visual 4, plus 4 questions.

## Expert verdict (short)

Round 6 fixed almost everything it set out to fix, and the staff is now very solid: 7,618 engravings at 1, 2 or 4 notes per beat (every exercise, every option, licks, grooves, walking, 12/8, polyrhythms) read back with 0 errors in values, ties, tuplets, rests, beams, key signatures, accidentals, ledger lines and 8va. Swung licks keep their triplets, septuplets are "7", sextuplets "6", the slow blues is in 12/8, implied chords sit in parentheses. Key signatures follow the logged rule in all 3,468 single-key builds I checked. #143, #145, #172, #75, the ear-training 7ths and the harmonised-chord fingering are now right.

What remains, in order of weight:
- the padded last bar is written wrong whenever a uniform exercise runs in 3, 5 or 6 notes per beat (three defaults: #74, #112, #115);
- slap lines pop the A string (4-string, key E, the default of #132 and #191) and even the E string (5/6-string #132);
- #141 side-stepping: the backing follows the "outside" bar, so the tension the exercise is about disappears;
- staff text collisions: tuplet "3"s on the label row (all triad drills), dynamics on the beams (#26).

## Status of the ea7705f findings

| # | Finding (ea7705f) | Status | Evidence now |
|---|---|---|---|
| W1 | Swing moved a real triplet's 3rd note to the "&" | fixed | #169 lick 2: R ♭3 3 as three 8ths under "3", the swing pair G♭ F as 8ths, E♭ re-flatted after E♮ (`…\mcp-Claude_Browser-blob-1792491511008-70vqu6.jpg`). Checker: 0 problems in all swung licks. |
| W2 | Septuplets drawn as tied fragments | fixed | #135 7:4 = seven quarters under a "7" bracket per bar (`…blob-1792491619500-ty0h6j.jpg`); #4 "32nds (8)": 8 "7"s, 0 ties, 256 heads for 256 notes. |
| W3 | Sextuplets marked "3" | fixed | #4 "Sextuplets (6)": four "6"s, 0 ties. |
| W4 | #143 option "1st: holds the 3rd and 7th" | fixed | "1st: the most chord tones" (true for every chord I checked; G and F tie over G7). |
| W5 | #143 about: three wrong statements | fixed | "rarely clashes", "Every mode of the major scale holds three major pentatonics", "D♭ over G7alt: ♭5 ♭13 ♭7 ♭9 ♯9, four alterations and the ♭7, no 3rd". All true. |
| W6 | #143 flat keys spelled from the pentatonic | fixed | G♭ ii–V–I: A♭m7 over "B major pentatonic (= C♭)" is C♭ D♭ E♭ G♭ A♭ = ♭3 11 5 ♭7 R. See Q2 for two odd-looking cases. |
| W7 | #69 answer shapes unplayable, muddy | fixed | 2,160 answer shapes (4/5/6-string, all sets): span 1–3 frets, one finger per fret, no finger on two frets, voiced R-5-7-10 (Dmaj7 = D@E10 A@A12 C♯@D11 F♯@G11, `…blob-1792493066020-aauw18.jpg`). |
| C1 | #173 implied chord never named in the strip | fixed | "(Dm7♭5)" "(G7♭9)" in italics, staff and tab, no overlap (`…blob-1792491714260-l51d6z.jpg`). |
| C2 | V7alt called G7♯9, pad with natural 5th | fixed | Badge "G7alt" in #143/#179; pad G B F (no 5th). |
| C3 | Minor vamp Aeolian in #143, Dorian in #173 | fixed | Both Dorian: E♭, B♭, F pentatonics over Cm7 (logged decision). |
| C4 | #78 two forms on the same frets, filed under Triads | fixed | Now #75 under Scales; forms distinct (C on E8: f1 = E8 E10 E12 A8 A10 A12 D9 D10; f2 = E8 E10 A7 A8 A10 D7 D9 D10; f4 = E8 A5 A7 A8 D5 D7 D9 G5). About matches every form. |
| C5 | #12 roots at fret 1 not "one position" | fixed | F from E → A8, B♭ from A → E6, E♭ from D → A6, C from low B → E8; shown as fixed in Options. Same in #14. |
| C6 | 12/8 slow blues written in 4/4 | fixed | 12/8, quarter + 8th per dotted-quarter beat (`…blob-1792491667310-z74pjd.jpg`). Tempo: see I3. |
| C7 | Dynamics in the chord row | partly | Now below the staff in bold italic, but on top of the beams (see V2). |
| C8 | #141 Backing had nothing to play | partly | "Am pent" is read, but the pad follows the outside bar (see C2). |
| C9 | #172 motif mismatches | fixed | Q&A lick = G A G E / A B A F / D E D F (5 13 5 3, ♭3 on Dm7, last note changed); about matches. |
| C10 | #129 whole-step "approach" into ♯IV°7 | partly | ♯IV°7 cases gone; 12 of 12,216 approaches left, all F–F♯–E at the lowest note (see I2). |
| I1 | Subdivision moved chord changes off the bar | fixed | #110 #143 #145 #179 are written 8ths ("♪ Written rhythm"). |
| I2 | #92 rhythm changes 9th leaps | fixed | Rhythm-A in B♭: R-5 per 2-beat chord, steps between chords; 0 leaps over an octave in single keys. |
| I3 | L1 warm-up in G♭ | fixed | 300 routines per level: Levels 1–2 only C D E F G A. |
| I4 | #174 pop fill 5-fret stretch | fixed | 7,392 slap H/PO runs, 0 wider than 4 frets, 0 wrong direction or string. |
| T1 | #143 source "Gary Willis" | fixed | Now "Gary Willis on Scott's Bass Lessons": the SBL Gary Willis Masterclass has a pentatonics module; Bergonzi added. |
| T2 | Topic blurbs out of date | fixed | Scales, Modes, Triads, Jazz Licks blurbs updated. |
| T3 | String option order | fixed | Low B → E → A → D → G → High C everywhere I looked. |
| T4 | Ear rounds "#1" | fixed | "Round 1". |
| T5 | Quartal "1-4-7" | fixed | "1-4-♭7". |
| T6 | #25 descending chromatic with sharps | fixed in #25 | F F♯ … C B B♭ A A♭ G G♭. Other drills still use sharps going down (T1 below). |
| T7 | "6-string" label | fixed | "6-string (low B, high C)". |
| V1 | Staff takes the neck's height | partly | #66 5-string, 780x360: staff 100 px, neck 143 px (was 140/103). 640x300: staff 95 px, neck 88 px, fret numbers 5.6 px (was 63 px / 4.8 px). See V4. |
| Q1 | Key signatures outside Reading | done | Single-key scales, modes and harmonised chords (logged). |
| Q4 | #145 one-root spelling | decided | D♯m7♭5 on its own readable root (logged). |
| Q2, Q3, Q5, Q6 | #173 backing, 8va for 1–2 notes, ear answer in the strip, shuffle notation | open | Unchanged; repeated in Q4 below. |

## Blocking     (a user cannot do what the screen is for)

None.

## Wrong        (incorrect musical or factual information)

### W1. Staff: with 3, 5 or 6 notes per beat the completed last bar has wrong rest values (the bar adds up to more than 4 beats)
- Where: Tab/staff = Staff, any uniform exercise whose notes do not fill the last bar at "3 triplets", "5 quint." or "6 sext.". Three defaults are affected: #74 Three notes per string, #112 Harmonised triads in inversions, #115 Triads over two octaves (all default to triplets).
- What I saw:
  - #74 default (4-string, 23 notes = 7⅔ beats): beat 4 of bar 2 has two triplet 8ths under a "3", then a 16th rest and a quarter rest. The bar reads 4 13/12 beats; it should end with one triplet-8th rest inside the "3".
  - #74 in the app (5-string, 29 notes): two triplet 8ths, a half rest, a 16th rest and a quarter rest: 4 11/12 beats in a 4/4 bar.
  - #14 at "3 triplets" (7 notes): a lone triplet 8th under a bracketed "3", then a dotted quarter rest, a 32nd rest and a quarter rest.
  - #82 broken 7th at "5 quint.": the closing root (3.2 beats) is drawn as a half note inside a "5" bracket with the four quintuplet 16ths before it.
- Measured: at 1, 2 or 4 notes per beat, 0 problems in 7,618 engravings (every exercise and option). At 3 per beat: 88 exercises affected; at 6: 88; at 5: 114. Every problem found is this one (the last step plus the padding rests).
- Why it matters: the round-6 change "a short last bar is completed with rests" works for straight values only. A student who reads the last bar gets a wrong count, and triad drills are the ones played in triplets.
- Evidence: `…blob-1792493246614-tlm56y.jpg` (#74 in the app), `…blob-1792492857279-29x6kp.jpg` (#74, 4-string), `…blob-1792492728964-0wjb2o.jpg` (#14), `…blob-1792492844024-acpf09.jpg` (#82 at 5).
- Suggestion: fill the rest of the tuplet group with tuplet rests first (inside the "3"/"5"/"6"), then whole beats with plain rests; the closing note of #82 as one quintuplet 16th tied to a dotted half.

### W2. #147 Triads with approach notes: in G♭ the approach into C♭ is written A♯ (a diminished 3rd)
- Where: #147, key G♭, every approach option, every scale: the chords A♭m (♭3 = C♭), C♭ (root) and F° (♭5 = C♭).
- What I saw: `D → E♭ (5) | A♯ → C♭ (♭3)` in A♭m; `A♯ → C♭ (R)` in C♭; `A♯ → C♭ (♭5)` in F°. 28 times across the options.
- Why it matters: a half step below C♭ is B♭ (one letter down). Round 6 spelled approach notes "as a step from their target" in walking lines, grooves and arpeggio drills (#159 now has 0 wrong of 1,104), but not in this triad drill. Everything else in #147 is spelled as steps (F/D♯ around E, A♭/F♯ around G).
- Suggestion: use the same step spelling as #159 (`stepSpell`).

## Confusing    (misleading, illogical, makes no sense)

### C1. Slap: pops on the A string (and on the E string on 5/6-string basses) in the default views
- Where: default options (vamp-min, key E):
  - 4-string #132 Slap grooves and #191 Double thumb: every pop is on the A string: E2 @ A7 (16 times), D2 @ A5 (4 times), with B1 thumbed at E7.
  - 5/6-string #132: D2 popped on the E string at fret 10; E1 thumbed on the low B string at fret 5; B1 thumbed at B12. #174 and #191 pop E2 at A7.
  - 5/6-string #93 Thumb & pop, "Thumb" style: all 32 E's thumbed on the B string, fret 5, never the open E.
- Measured over all styles, progressions and keys: 1–17% of pops land on the B, E or A strings (4-string #132 thumb–mute–pop 9%, 5-string #174 pop fill 17%). #93 octave pops and #174 ghost funk stay on D and G.
- Why it matters: slap is taught as thumb on the low strings, index/middle pops on D and G (TalkingBass, SBL Slap Accelerator). The E octave in E is the D string, fret 2, next to the open E. Popping the A string right after thumbing the E string, or popping the E string, is not the technique the exercise names.
- Evidence: data dump `Q.slapStrings()` (`qa/tools/user7.js`); 5-string #132 in the app with the root at B5 marked T: `…blob-1792492433951-siqe8b.jpg`.
- Suggestion: keep pops on the two highest strings of a 4-string and on D/G/C of a 5/6-string; prefer the open E for a vamp in E.

### C2. #141 Pentatonic side-stepping: the backing goes "outside" with the line, and the outside part is not a bar
- Where: #141, defaults (A, half step up, 1 octave), Backing = Chords (or Drone).
- What I saw:
  - The pad follows the badges: A C E for "Am pent", then B♭ D♭ F for "B♭m pent", then A C E again. The line and the pad move together, so the "outside" bar sounds like a key change, not tension.
  - Each part is 11 notes (up and down the pentatonic). At the default 8ths the outside part starts on the "&" of beat 2 of bar 2 and the line returns inside on beat 4 of bar 3.
- Why it matters: the about says "creating tension, and then resolve back into the key"; the summary says "for one bar"; the tip says "Resolve to a chord tone on beat 1". The pad and the timing contradict all three.
- Suggestion: keep the pad on Am through the outside part (a text badge such as "outside: B♭m pent" that the pad does not read), and make each part fill whole bars (e.g. 8 or 16 notes) so the side-step starts and resolves on beat 1.

### C3. Walking: the first bar of a two-bar chord ends on a repeated note instead of an approach
- Where: ii–V–I and minor ii–V–i (the I chord lasts 8 beats), every key:
  - #129 Walking with chromatic approach notes: Cmaj7 `C2 C3 G2 G2 | C2 E2 G2 C♯2(→)`; A minor `Am(maj7) A1 A2 E2 E2 | …` (24 builds);
  - #163 Enclosures: Cmaj7 `C2 D2 G2 G2 | …` (24 builds);
  - #92 Walking with chord tones: jazz blues in C `C7 C2 G1 E1 E1 | Gm7`, minor blues `Fm7 F A♭ C C | Fm7`, cycle-251, iii–vi–ii–V (91 repeated notes).
- Why it matters: #129's summary is "Beat 4 is a half step from the next root" and #163's is "Beats 3–4 surround the next root"; the next root here is the same chord's root in the next bar, and the line just repeats the 5th. In #92 the cell R-5-3-3 is not one of the cells the summary lists (R-3-5-3, R-3-5-8, R-5-8-5).
- Suggestion: approach (or enclose) the root of the second bar too; in #92 use a listed cell.

## Irritating   (works, but annoys or slows the user)

- I1. All 12 keys: leaps over an octave at key changes, and an approach that resolves an octave away.
  - Walking, single keys: 0 leaps over an octave. Cycles: #129 cycle of 4ths 22 (max 13 semitones) and chromatic 14 (max 17: `Dmaj7 … A2 → E1(→) | Fm7 F1`); #130 chromatic 13 (max 16); #92 2; #131, #164, #166 chromatic 3 each. The line ends a key high and the next key starts low, so the drop lands on the approach note.
  - Grooves in chromatic order into E (26 cases in #17, #87, #89, #127): `B♭ bar: … F2 D♯2(→) | [E] E1`. The approach is a half step below E2, the next key starts on E1.
  - Round 6 says each key starts where the previous key aimed; that holds for the pitch class, not the octave.
- I2. 12 of 12,216 walking approaches (single keys) are still a whole step, all the same figure at the lowest note: `F1 F♯1(→) E1` (4-string, rhythm-A in C; minor ii–V–i in A) and `C C♯ B0` (5-string, keys G and E). In A minor the F♯ is played under Bm7♭5 right after its ♭5 (F). Approaching from above with F (the ♭5 itself, a half step above E) or changing beat 3 would avoid it.
- I3. #55 "12/8 slow blues (triplets)" opens at 96 BPM, now counted in dotted quarters: 288 8ths a minute is a medium shuffle. A slow blues is usually ♩. = 50–70. (Opinion; the other blues styles share the 96 default.)
- I4. Harmonised 7ths high on the neck show finger 3 on two different frets, e.g. #84 key E, 4-string: Emaj7 = E @ A19 f3, G♯ @ D18 f3, B @ G16 f1, D♯ @ G20 f4. 62 of ~16,000 chords, all at frets 16–20 (#84 16, #121 12, #149 6, #158 6, #183 6, #184 16). Otherwise: 0 three-note strings, 0 spans over 4 frets, 0 fingers out of order.

## Texts        (typos, unclear wording, inconsistent names)

- T1. Descending chromatic runs still use sharps in #2 Chromatic 1-2-3-4 (core, Level 1), #20, #24, #26 and #59: #2 plays `D♯ D C♯ C | A♯ A G♯ G` on the way down; #26 `F E D♯ D`. #8 teaches "Sharps going up, flats coming down" and #25 now follows it. Visible in the tab strip's note row and on the staff.
- T2. Home warm-up card: "The octave shape · A → G" (and "E → D"). Without "Strings:" a beginner reads it as the notes A to G. The option label is "Strings".
- T3. #75 (now under Scales, before the Triads topic) says "Like the three triad fingerings…" and "Pair it with The 3 triad fingerings", which is #78 and comes after it in Level 3. Add "(#78)" or turn the sentence around.
- T4. #75 about: "With fewer strings above the root a form takes one small shift instead." Root on the D string of a 4-string, finger-1 form: `F G10 f1 … A G14 f1`, a 4-fret shift.
- T5. #179 about names the same note two ways: "the altered scale over 7alt (♭9 ♯9 ♭5 ♭13)" and two sentences later "named as tensions (♭9, ♯9, ♯11, ♭13)". The labels say ♭5 over 7alt and ♯11 over 7♭9 and 7♯5, which is consistent; only the sentence mixes them.
- T6. #141 summary "slip a half step up" while the option also offers "Half step down" and "Tritone away".

## Visual

### V1. Staff: tuplet numbers under stem-down groups sit on the label row
- Where: Tab/staff = Staff with dot labels shown; 29 exercises, including the defaults of every harmonised-triad drill (#81, #111–#117, #148, #150–#152, #180–#182), #46, #79, #80, #74, and licks (#167 "Guide tones with triplets", #170 lick 2, #171, #189 lick 1, #190 lick 1).
- Measured in the app (#81 default, 780x360, 5-string): 5 of the 8 visible "3"s overlap a label, e.g. "3" at (131,302)–(139,313) over "♭3" at (135,301)–(145,314). The label row reads "R 33 5".
- Evidence: `…blob-1792493084439-5awdx7.png` (app), `…blob-1792491577667-3pafwu.png` (engraved copy).
- Also: in #4 and #63 the first "3" above the staff touches the chord-row word "Triplets" / "8th triplets".
- Suggestion: push the label row below the lowest tuplet number, or put the number of a stem-down group above the noteheads when labels are on.

### V2. #26 Dynamics ladder: the dynamics are drawn on the beams
- Where: #26, Tab/staff = Staff, 780x360.
- Measured: "pp" (65,291)–(82,305) overlaps the first group's beam (65,295)–(89,299) and the label "D" (66,301)–(74,314). The first group is D–D♯ on the middle line, stems down, so the beam is exactly where the dynamics are placed.
- Evidence: `…blob-1792492352976-wsv2n1.jpg`, `…blob-1792491699764-5yy3dl.jpg` (engraved copy).

### V3. #126 Shell voicings, jazz blues: chord labels overlap on 2-beat chords
- Where: #126, progression "Jazz blues", staff mode. On 2-beat chords the pattern runs in 8ths, so "R·♭7·♭10" (about 40 px) collides with the next "R" (Gm7 → C7 in bar 8: "R·♭7·♭10R").
- Evidence: `…blob-1792491601607-hnmz0v.png`.

### V4. 5-string at 640x300: the neck is still small in staff mode
- #66 One note in all its octaves, 5-string, 640x300: staff 95 px, fretboard 88 px, fret numbers 5.6 px high. Better than last round (63 px, 4.8 px) and readable at 780x360 (staff 100 px, fretboard 143 px). Mentioned for completeness; tab mode is fine.

## Questions for the owner

- Q1. Seven-flat key signatures: Mode study and the harmonised drills name a G♭ mode with lead-sheet roots, so G♭ Mixolydian, B♭ Locrian, harmonised G♭ Mixolydian (G♭7 … F♭maj7) get seven flats (parent C♭). F♯ Mixolydian and A♯ Locrian would have five sharps. Pick the root name with the smaller parent signature when the key chip is chosen on its own, as Parallel modes already does?
- Q2. #143 spells every note against the chord (logged rule), so two named pentatonics do not look like themselves: over D♭7alt "G major pentatonic" is written G A C♭ D E (C♭ = the chord's ♭7); over B♭7alt "E major pentatonic (= F♭)" is written E G♭ A♭ B D♭. Keep it, or name these two by what the notes show?
- Q3. Blues scale on E♭: the app writes "D♯ blues" (six sharps, A♮ as ♭5) while the minor pentatonic on the same chip is "E♭ minor pentatonic" (six flats), e.g. in #70 Two-octave scales. Lead sheets and method books write E♭ G♭ A♭ A B♭ D♭. Same question for "F♯ major blues" next to "G♭ major pentatonic".
- Q4. Still open from last round: #173 Backing could follow the implied chords; whole phrase under 8va instead of 1–2 notes; show the ear-training answer in the strip at the answer step (it still shows "?"); one shuffle notation (grooves triplets, licks "Swing").

## Checked and fine

- Staff (independent reader, `engrave-check7.js`):
  - 7,618 engravings at 1, 2 and 4 notes per beat plus every non-uniform exercise: 0 problems (values, dots, ties, tuplets, rests, beams per group, bar lines, key signatures, accidentals held to the bar line and cancelled, ledger lines, 8va, x and diamond heads).
  - Polyrhythms: 3:2 quarter triplets, 3:4 half-note triplets, 4:3 dotted 8ths with ties at the beats (`…blob-1792491652871-vjkyac.jpg`), 5:4 "5", 7:4 "7".
  - 12/8 time signature, dotted-quarter beats, quarter + 8th groups; the 4/4 shuffle keeps its triplet brackets.
  - Implied chords in parentheses, no overlap with the chord row (staff and tab).
  - Hand-scrolling the strip draws the bars in view (tab and staff, #20).
- Key signatures (3,468 single-key builds): modes take the parent's, harmonic/melodic minor, minor pentatonic and blues the tonic's minor key, major pentatonic/blues and harmonic major the major key; the only accidentals left are the expected ones (B♮ in C harmonic minor, A♮ B♮ in melodic minor, F𝄪 in G♯ harmonic minor drawn as ×, ♭5 of the blues). Cycles, jazz lines and plain-spelled scales keep accidentals (`…blob-1792492150966-sr934k.jpg`).
- Walking (2,274 builds, 4/5-string, every progression, 12 keys and 3 cycles): every key's last approach leads by a half step into the next key's first chord (0 wrong of about 1,560 approaches at key changes); approach notes spelled as steps from their target except where a chord tone or a double accidental decides (B♭ under B7 in G♭ blues = the 3rd of G♭7); two-feel Rhythm changes plays roots in half notes; chord-tone 2-beat chords R-5 or the 5th below.
- Grooves and harmony patterns in cycles: approach into the next key is a half step in all but the E case of I1; #87 "5th (dominant) approach": 600 fifth approaches and 211 chromatic ones, 0 that repeat the root just played.
- #143: chord-scale by function, choices and labels right in every key; #145 parents right (B♭/E♭7♯11, F♭/E♭7alt, A♭/E♭7♭13, D♭/E♭7sus♭9, C/E♭maj7♯5, F♯/D♯m7♭5); #179 altered, half-whole and whole-tone labels right; G7alt pad without the 5th.
- #172, #173 musically clean; Dorian on one-chord minor vamps; i of a minor progression still Aeolian.
- Labels against the chord (120,346 notes in walking, grooves, slap, harmony, licks, modes, arpeggios, triads, 6 keys): 0 wrong labels. The only pitch mismatches were my checker's (slash chords such as D/C labelled against C, and anticipated notes labelled against the next chord, both by design); every letter difference is a logged plain jazz spelling.
- #69: R-5-7-10 in one hand position, "Round 1", answer named right.
- #75: three distinct forms matching the about; fixed-root notices in the Options sheet; found by "scale fingering" in the Library under Scales.
- One-octave scales and triads: fret-1 roots move to the neighbouring string (4/5-string).
- Reading drills: 0 tritone leaps in 2,678 intervals; no labels.
- Slap: 0 hammer-ons not going up, 0 pull-offs not going down, 0 from another string, 0 runs wider than 4 frets, 0 pops right after a thumb on the same string.
- Warm-ups: Levels 1–2 only C G F D A E; Level 3 all 12.
- Texts: topic blurbs, Settings "6-string (low B, high C)", quartal 1-4-♭7, #143 about and tips, #145 "(= C♭)" names, #172 about, #69 about.
- Layout: no horizontal scroll on Home, Path, Library, Settings, #26, #55, #69, #75, #132, #143, #173 at 780x360, 915x412 and 1024x768; tuner fine at 780x360 on a 5-string (B0 E1 A1 D2 G2).
