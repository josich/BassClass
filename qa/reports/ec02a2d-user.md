# QA User report · ec02a2d · 2026-10-15

Setup: third round. I used my own `qauser` server (port 8890) and my own background tab. I started from an empty profile: service worker unregistered, cache `bassclass-v1` deleted, localStorage cleared, cache-busting `?qa=31…36`. Sizes: phone landscape 780x360 (main), 640x300 (this one emulates an Android phone, so the mobile User-Agent applies), 1024x768 tablet. Settings: 4-string, 20 frets (defaults); the new exercises were also built on 5 and 6 strings with 17/20/24 frets (7,803 builds, no fret above the limit without the notice).
Personas:
- Beginner: Home → Start here → Level 1 → warm-up → Settings (new sound section).
- Advanced player: Library numbers and search, favourites, Options, the zone warm-ups, the new arpeggio options.
- Jazz teacher: every new scale, mode and chord in all 12 keys, about/tips/sources, then a spelling sweep of every exercise against the CLAUDE.md spelling rule.

Method: the app's own modules (`/js/curriculum/index.js`, `/js/theory.js`, `/js/ui/exercise.js`) to build exercises and dump note names, degree labels, badges and string/fret. `paramOptions`/`paramSummary` for what the chips and header show. `getBoundingClientRect()` for layout. Real clicks for Play, Back, the favourite stars and the speaker test.

Not testable here: what the phone-speaker profile sounds like (I cannot hear), the Android headphone detection (`BassClassNative`), the microphone. The browser pane was hidden, so screenshots render small and `requestAnimationFrame` is throttled. Every layout finding is confirmed with DOM measurements.

Counts: Blocking 0 · Wrong 5 · Confusing 6 · Irritating 4 · Texts 10 · Visual 2, plus 6 questions.

## Blocking     (a user cannot do what the screen is for)

None found.

## Wrong        (incorrect musical or factual information)

### W1. Jazz "plain" spelling leaks into chord tones and key notes, including Level 1–3 drills (regression from 70c7e4f)
- Where: any exercise built with `Builder(…, { jazz: true })`. Two causes:
  1. `CORE_DEGREES` in `builder.js:37` has no `♭3` or `♭5`, so the minor 3rd of every minor chord and the ♭5 of m7♭5 are treated as "altered" notes and respelled.
  2. Several drills that are not jazz exercises are built with `jazz: true`: `hm-build-a-chord` (#15, harmony.js:20), `hm-chord-qualities` (#45, harmony.js:45), `arp-7th-qualities` (#43, arpeggios.js:26), `arp-zone-cycle` (#73, arpeggios.js:101), `arp-inversions` (#106, arpeggios.js:138) and `arp-extended` (#139).
- What I saw (exact dumps):
  - **#15 How a chord is built (L1)**, Natural minor, chip E♭: `[E♭ minor scale] E♭ F G♭ A♭ B♭ B(♭6) D♭ E♭`. The scale has two B's and no C.
  - **#43 The five 7th chords from one root (L2)**, chip D♭: `[D♭m7] D♭ E(♭3) A♭ C♭(♭7)`, `[D♭m7♭5] D♭ E(♭3) G(♭5) C♭`. Chip C: `[C°7] C E♭ G♭ A(♭♭7)`.
    - The drill teaches "each chord lowers a single note", but F becomes E and A♭ becomes G.
    - CLAUDE.md says chord-construction drills keep textbook spelling, and B♭♭ is its own example.
    - #41 (four triad types) and #44 (7th arpeggio study) do keep `D♭ F♭ A♭♭` and `C°7 … B♭♭`.
  - **#45 Chord qualities of the key: hear the 3rd (L2)**, chip G♭: `[A♭m] {ii · minor 3rd} A♭ B(♭3)`, while the same screen names the IV chord `[C♭]`. The exercise is about the 3rd, and here the 3rd is misspelled.
  - **#73 7th arpeggios around the cycle in one zone (owner's warm-up)**, Minor 7: `[A♭m7] A♭ B(♭3) E♭ G♭` and `[D♭m7] D♭ E(♭3) A♭ C♭(♭7)` (E and C♭ in one chord). The triad version, #42, spells `[A♭m] A♭ C♭ E♭` and `[D♭m] D♭ F♭ A♭`.
  - **#97 Chord-scale**, ii–V–I, chip G♭: `[A♭m7] {Dorian} A♭ B♭ B(♭3) D♭ E♭ F G♭`. In the same line the Ionian on G♭maj7 uses `C♭(4)`. Minor ii–V–i in E♭m: `[Fm7♭5] {Locrian ♮2} F G A♭ B♭ B D♭ E♭`.
  - **#109 ii–V–I arpeggios**, G♭: `[A♭m7] G♭ A♭ B(♭3) E♭ | [D♭7] D♭ C♭(♭7) A♭ F`. C♭ is kept as a ♭7 but becomes B as a ♭3 one bar earlier.
  - **#139 Extended arpeggios**, G♭: `[B♭m7] … B(♭9) … G♭(♭13)` and `[E♭m7] B(♭13) …`. Inside G♭ major that note is the key's own C♭.
- Also affected (same `[A♭m7] B(♭3)` or `[Fm7♭5] B(♭5)`):
  - Theory and arpeggios: #47, #48, #49, #75, #106, #110, #111, #112, #140, #142, #144, #163, #164.
  - Walking: every walking exercise (#81, #115–117, #146–149, #166).
- Why it matters: CLAUDE.md's spelling rule says chord tones keep their interval and chords inside a key keep the key's spelling. Plain spelling is only for altered, blue and passing notes in jazz exercises. Here a Level 1 scale and a Level 2 chord-construction drill teach wrong spellings, and the two zone warm-ups disagree with each other.
- Suggestion: add `♭3` (and `♭5` for m7♭5) to the core degrees, and drop `jazz: true` from the non-jazz drills listed above.

### W2. Licks keep C♭/F♭ on tensions and blue notes; the rule (and the walking lines) write them plain
- Where: Jazz Licks, in the flat keys.
- What I saw:
  - #150 "Triad pairs, then altered triads", chip A♭: `[E♭7] F♭(♭9) D♭(♭7) A(♯11) E♭(R) C♭(♭13) G♭(♯9)`.
    - CLAUDE.md's own example is "♭13 of E♭7: B".
    - In the same bar the ♯11 is written plain (A) while the ♭9 and ♭13 stay F♭ and C♭.
  - Same lick, chip E♭: `[B♭7] C♭(♭9) A♭ F♭(♯11) B♭ G♭(♭13) D♭(♯9)`.
  - #151 "Altered scale into the 5th", chip E♭m: `[B♭7♭9] B♭ A♭ G♭(♭13) F♭(♯11) D F♭(♯11) A♭ C♭(♭9)`. In the same key, #148 Minor walking writes `[B♭7♭9] B♭ B(♭9) D F`, so one tension has two spellings in two modules.
  - #152 "Blue-note triplet fill", chip F: `[F7] F A♭ A C C♭(♭5) B♭ A♭`. The blue note is written C♭.
  - #167 "Upper structure to altered", chip A♭: `[E♭7] … C♭(♭13) A(♯11) G F♭(♭9)`.
  - Sweep: C♭/F♭ on ♭9, ♯11, ♭13 or ♭5 shows up in licks 150, 151, 152, 153, 154, 167 and 168, in keys E♭, A♭, D♭ and B♭.
- Cause: `licks.js:142` only simplifies double accidentals (and approach notes). The rule also lists C♭/F♭/E♯/B♯ for altered, blue and passing notes.
- Not affected: the E♯ in "Triad pairs I & II (Lydian)" in B (`C♯ E♯ G♯`) is part of a C♯ triad and reads better as E♯. Keep it.

### W3. "Walking with enclosures": the enclosure into the ♯iv°7 of the jazz blues is not an enclosure
- Where: #146 `wk-enclosures`, Progression = Jazz blues, all 12 keys.
- What I saw:
  - Chip F, bar 6→7: `[B♭7] B♭ C(2) D♭(→) C(→) [B°7] B`. Both notes come from above, and C is played twice.
  - Chip D: `[G7] G(D5) A(D7) A(→, open A) A(→, E string fret 5) [G♯°7]`. Both "enclosure" notes are the same pitch (A1), so A sounds three times in a row.
  - In 25 other bars the lower note is placed an octave too high, for example chip E `[A7] A E F(→, E1) D♯(→, D1) [E7] E (open)`: F1 up to D♯2, then a major-7th drop to E1.
  - Of 588 enclosures in the exercise, 37 are not "one above, one below".
- Why it matters: the about text says "the last two beats of a bar (above, below) lead into the next root". The lower neighbour here is the current chord's root (B♭ in F). The round-2 rule "never repeat the chord's root" seems to have replaced it with a second note from above.
- Suggestion: allow the root as the lower neighbour on beat 4, or use the scale step below. When the target is the lowest note (E1), aim at the octave above.

### W4. Messiaen: "Mode 5 is the smallest" is not true
- Where: #173, tip 2 and summary.
- Mode 1 (whole tone) also has 6 notes, and it has the smaller cell (one whole step against 1 ♭2 4). The summary "whole tone, diminished, and five richer ones with 6 to 10 notes" also counts mode 5 (6 notes, like the whole-tone scale) as "richer".
- Everything else in #173 checks out:
  - The formulas of modes 1–7.
  - The numbers of transpositions (2 / 3 / 4 / 6).
  - The 4-fret cell of mode 3 and the tritone cell of modes 4–7.
  - The 1944 source title.

### W5. Phrygian ♭4 tip calls A♭ the 3rd of E
- Where: #170 Modes of harmonic major, tip 2: "E F G A♭ B C D = R ♭9 ♯9 3 5 ♭13 ♭7".
- The 3rd of E is G♯. Written A♭, the note is a diminished 4th, and the exercise itself labels it `A♭(♭4)`. Round 2 W4 (the "♭4" on G7♯9) was the same issue.
- Suggestion: "E F G G♯ B C D = R ♭9 ♯9 3 5 ♭13 ♭7 (the altered scale with a natural 5th)", or keep A♭ and drop the dominant reading.

## Confusing    (misleading, illogical, makes no sense)

### C1. "Root on" does nothing at 2 octaves, and #107's header names the wrong string
- Where: #172 Broken chords, #44 7th arpeggio study, #107 Two-octave 7th arpeggios.
- With Range = 2 octaves the build forces the E string (`rootStr: Number(p.oct) > 1 ? 'E' : p.root`). Root on A, D and E give identical notes and frets.
- The summary still says "… · Range: 2 octaves · D string".
- #107 by default: the header reads "Major 7 · Key: C · Up & down · Range: 2 octaves · A string", but the first note is C on the E string, fret 8.
- Suggestion: hide or grey out "Root on" at 2 octaves, or honour it.

### C2. The broken-chord pattern names describe triads, not 7th chords
- The chips read "Broken: 1-3-5-3, 3-5-8-5…" and "Broken: 1-5-3-5, 3-8-5-8…" (#172 and #44). On a 7th chord the cells are `1-3-5-3, 3-5-7-5, 5-7-8-7…`. The summary "1-3-5-3, 3-5-8-5, 5-8-10-8…" has the same problem, and 8 of the 12 chords in #172 are 7ths.
- "Broken: groups of 4" on the default 1-octave triad is `C E G C C G E C`. That is the plain up-and-down arpeggio, with no broken cell.
- The about says "…from the 5th, and so on to the top". At 1 octave a triad only plays the cells from 1 and 3.

### C3. Exotic scales: the badge "C augmented" reads as the C+ triad
- #171, Scale = Augmented: the board and tab badge say `C augmented` over the 6-note scale C E♭ E G G♯ B. Every other exercise uses `C+` / "augmented" for the triad.
- Suggestion: "C augmented scale".

### C4. Settings sound section: a status line that is wrong for a moment, and controls that do nothing
- On a desktop browser with Speaker = Auto, pressing "▶ Phone-speaker sound" changes the live status (for about 4 s) to "Now: phone-speaker sound. A browser cannot tell when headphones are plugged in: choose "Headphones / amp" while you use them." That message is meant for mobile browsers. Auto never uses the phone sound on a desktop. Read during the test with a real click.
- "Phone-speaker boost" and "Octave-up layer" stay fully active when Speaker = "Headphones / amp" (or Auto on a desktop), where they change nothing. Nothing on screen says "not in use now".
- One sound has three names: "Headphones / amp" (selector), "natural sound" (status line and test button) and "full" in the code. Readers can work it out, but the test button could say "▶ Headphones / amp sound".

### C5. Exotic scales source: Bartók is a debatable source for the "Hungarian" scales (teacher opinion)
- The source line reads "Béla Bartók (Hungarian folk scales)". Bartók's research described Hungarian peasant music as mainly pentatonic and modal. He attributed the augmented-2nd "gypsy" scale to urban popular music (verbunkos), not folk song.
- The scale is usually tied to Liszt (the "gypsy scale") and to scale catalogues such as Slonimsky. Citing Bartók suggests he documented or used it as a folk scale.
- Suggestion: "Liszt (the 'gypsy' scale); Slonimsky".

### C6. Sequence "In 3rds" on 9- and 10-note scales plays 2nds and 3rds
- #173 mode 3, In 3rds: `C–E♭, D–E, E♭–F♯, E–G, F♯–A♭, G–B♭, A♭–B, B♭–C`. Three of the pairs are whole steps.
- On the 6-note augmented scale (#171) "In 3rds" happens to give all major 3rds.
- Suggestion: "Skip one note" for scales that do not have 7 notes.

## Irritating   (works, but annoys or slows the user)

### I1. The new defaults loop with almost a bar of silence
- The player pads every loop to whole bars (`player.js:48`).
- #172 default (major triad, 1 octave, 16ths): 17 notes = 4.25 beats, then 3.75 beats of silence. At 66 BPM the display stayed on 17/17 for about 3 s before 1/17.
- #173 default (mode 3, 16ths): 19 notes + 3.25 beats of silence.
- Others: #173 mode 7: 2.75 beats; #44 broken: 1.75 beats; #172 7th chords: 1.75 beats.
- Round 2 fixed the same kind of gap for approach triads.
- Suggestion: end the broken chord on the root as the 16th note of the cell grid (drop the extra final root, or hold it to the bar line).

### I2. The search does not understand ASCII # and b, nor option names
- "7#5" and "dorian b5" find nothing, while "7♯5" finds 3 exercises and "dorian ♭5" finds 4. Phone keyboards have no ♯ or ♭, and the new exercises are named mostly with them (Dorian ♭5, Locrian ♭♭7, 7♯5).
- Option labels are not searched: "spanish" finds only #129, not #171 (whose chip says "Phrygian dominant (Spanish)"), and "augmented 7" does not find #44.
- The number search works: "42", "#42" and "42 " find #42, and "174" says "Nothing found."

### I3. Settings is very long on a phone
- At 640x300 the Settings page is 1,830 px tall (6 screens). The four sound fields (Speaker, boost, octave-up, test) take about 550 px, mostly hint text.
- "Bass volume" is cut off from the sound block by "Count-in" and "Metronome clicks".

### I4. `#/ex/999` (an unknown number) silently shows Home
- The address bar keeps `#/ex/999` and nothing says that the exercise does not exist. Someone given "exercise 180" from a newer version gets no explanation.

## Texts        (typos, unclear wording, inconsistent names)

- T1. Mode names lose their capital in scale badges.
  - #96 Mode study: `C dorian`, `C lydian dominant`, `C locrian ♮2`, and the new `C dorian ♭5`, `C phrygian ♭4`, `C lydian augmented ♯2`, `C locrian ♭♭7`.
  - #171: `C phrygian dominant`, `C double harmonic major` next to `C Hungarian minor` and `C Ukrainian Dorian`.
  - #170 and #129 write `D Dorian ♭5` and `G Phrygian dominant`.
  - Cause: `scaleShort()` lowercases every name that is not in `SHORT` (common.js:90).
- T2. One scale, three names:
  - Badge in #129: `F Dorian ♯4`.
  - Option in #96: "Dorian ♯4 (Ukrainian Dorian)".
  - Option in #171: "Ukrainian Dorian (Dorian ♯4)".
  - Badge in #96 and #171: `C Ukrainian Dorian`.
- T3. 7♯5 naming and order:
  - "Maj7♯5" sits next to "Augmented 7 (7♯5)".
  - In #44 and #107 the 7♯5 comes after "Major 6" and "Minor 6" instead of next to "Maj7♯5".
  - #172's about says "m(maj7)" while its chip says "Minor-major 7".
- T4. Settings hints:
  - "Octave-up layer … The octave you hear changes, so it is off by default" does not tell a player what happens. Suggest: "Notes then sound an octave higher than you play them."
  - "lifts the bass's own overtones (around 850 Hz) … less round" is engineer talk for most players.
- T5. README "Real bass sound" still says the phone profile "adds harmonics from which the ear rebuilds the low pitch (virtual bass)". d775042 removed the synthetic harmonics: the profile now only lifts the recording's own overtones (that is what Settings says).
- T6. Topic descriptions on the Path were not updated.
  - Modes: "Relative and parallel modes, melodic & harmonic minor modes." It does not mention harmonic major (#170).
  - Scales: "Major, minor, pentatonic, sequences, positions, symmetric." It does not mention the exotic scales or Messiaen.
- T7. -ise/-ize mix in the British UI: "Memorise" (#9) and "recognise" (#36, #46), but "harmonized/harmonize" 18 times (#72, #74, #98, #125, #139, #160…).
- T8. The About drawer shows the number twice: the title "173 · Messiaen's modes of limited transposition", then "Exercise 173" on the next line.
- T9. #172 about: "It is the classical form of the arpeggio." ABRSM-style syllabi list broken chords and arpeggios as separate requirements. Suggest: "a classical arpeggio study".
- T10. #170 about, teacher's nuance: "together with the major scale these are the four parent scales of tonal harmony" overstates it. Tymoczko's point is about the four scale families; common-practice harmony rarely treats harmonic major as a parent scale. Suggest "… four parent scales of jazz and modern tonal harmony (Tymoczko)".

## Visual

- V1. **The exercise number is a full-width bar on its own line in every warm-up and favourites row.**
  - The rule `.routine .item .t span { display: block; white-space: nowrap; }` (app.css:366) also hits the `.ex-num` span inside the title, so it overrides `.ex-num { display: inline-block }`. The number also takes the muted colour.
  - Measured: warm-up row at 640x300, `.ex-num` 412.8 px wide, `display: block`, on its own line between "Hands:" and "Chromatic 1-2-3-4". Favourites at 780x360: 156 px wide bars above "Broken chords…", "Messiaen's…" and "7th arpeggio study".
  - Screenshots in this session's tool results: `mcp-Claude_Browser-blob-1792073850402-gvpdpa.jpg` (640x300) and `mcp-Claude_Browser-blob-1792073878478-4bs1jr.jpg` (780x360).
  - It also makes the warm-up block about 120 px taller (744 px at 640x300).
- V2. **Settings: "+12 dB" wraps onto two lines.** The value box is 46 px wide (the same as "100%"). Measured height 39 px against 20 px for "100%" and "60%". Screenshot `mcp-Claude_Browser-blob-1792073832021-ecsydp.jpg`.

## Questions for the owner

- Q1. Parallel modes (#68) and pitch axis (#127) rename the root halfway because of the spelling rule.
  - Chip D♭: `D♭ Lydian, D♭ Major, D♭ Mixolydian, C♯ Dorian, C♯ Natural minor, C♯ Phrygian, C♯ Locrian`.
  - Pitch axis, melodic set: `C♯ Melodic minor … D♭ Lydian augmented, D♭ Lydian dominant, C♯ Mixolydian ♭6 …`.
  - These drills are about one root where one note changes at a time, and the respelling hides that. Should a parallel-mode drill keep one root name (accepting F♭/C♭/B♭♭ in the darkest modes), or switch the whole drill to C♯?
- Q2. New exercises go at the end of their level (#172 after Slap #82 in L3, #171 after the licks in L5, #170 and #173 after Double thumbing #169 in L6). So the Library no longer follows the agreed topic order inside a level (technique … slap). Keep the number order, or sort by topic inside each level? The numbers would stay fixed either way.
- Q3. On mobile browsers (GitHub Pages / PWA), Auto picks the phone-speaker sound, which cuts everything below 200 Hz, even when headphones or an amp are plugged in. Most practice happens on headphones. Should Auto in a browser default to the natural sound, or show a one-time prompt?
- Q4. "Exotic" is an old-fashioned label for scales that are mainstream in Arabic, Turkish, Balkan, klezmer and flamenco music. Would "World scales" or "Scales beyond major and minor" be better? Also, the augmented scale (a jazz symmetric scale: Coltrane, Oliver Nelson) might sit better in Symmetric scales (#124) than next to the folk scales.
- Q5. Mode study (#96, L4) now offers the seven harmonic-major modes, which the dedicated exercise (#170) introduces only at L6. The same was already true for the melodic/harmonic minor modes (L5). Intended?
- Q6. Lick "1-2-3-5 cells + tritone sub" in C labels the D♭ of the D♭ triad cell over G7 as "♯11" (`G A B D D♭(♯11) E♭(♭13) F A♭(♭9)`). The spelling fits the cell, but the label is "♯11" on a note spelled as a ♭5. Keep, label it "♭5", or spell it C♯?

## Checked and fine

- Round-2 fixes confirmed (86db590):
  - W1: #73 now plays all 12 keys on 4 strings, with a "from the 3rd" label where it inverts.
  - W2: no B♯/E♯/C♭/F♭ roots. Cycle names stay unless they would force a double flat (D♯°, F♯m, D♯m7♭5, G♯ Phrygian dominant), as decided.
  - W3: `A♭m7 D♭7 G♭maj7` in the ii–V–I cycle.
  - W4: `[G7♯9] G F E♭(♭13) D♭(♭5) B(3) B♭(♯9) A♭(♭9)`.
  - W5: `[A7♭9] A B♭(♭9) C♯ E`.
  - W6: `[B♭7] B♭ B♭ F C(→) [B°7]`.
  - W7: G♯ minor stays in sharps (F𝄪°7 → G♯m, as decided).
  - W8: `D♭(→)` closes the bass-solo lick.
  - C2: no approach note repeats the pitch just played, in 13 approach/walking exercises × all progressions × 12 keys. The one exception is the #146 case in W3.
  - C4: string chips only for the strings you have.
  - C5: "frets 12–20: stops at your highest fret".
  - C6: whole tone over V7♭5.
  - C8: the pedal-fill tip now matches the notes.
  - C9: the blue-note fill now has ♭3 and ♭5.
  - C10: the scalar walking line plays ♭13 over the V of minor, and the tip explains why.
  - C1: the "New here? Start with Level 1" card, a Level 1 warm-up for a new profile, level names next to L1–L6.
  - I2: favourites come first below 670 px (y 229 against the warm-up at y 509 at 640x300).
  - I3: Library L1–L6 jump buttons.
  - T1: "The style's usual progression".
  - T5: the alternating-3rds tips; "M m m M M m m" is correct.
  - T6, T8, T9 (`[D°] [G] [Cm]`), T10 (degrees 1-4-7-3-6-2-5-1 with i, iv, ♭VII…), T11 ("60 BPM").
  - V1: tablet fret numbers sit just under the neck (strings 253–459, numbers at 462).
  - V2: the search placeholder fits (137 px in 176 px).
- New theory, checked note by note in all 12 keys:
  - Harmonic major and its modes: Dorian ♭5, Phrygian ♭4, Lydian ♭3, Mixolydian ♭2, Lydian augmented ♯2, Locrian ♭♭7.
  - Double harmonic major; Hungarian minor = mode 4 of double harmonic; Hungarian major (1 ♯2 3 ♯4 5 6 ♭7); Ukrainian Dorian = mode 4 of harmonic minor; the augmented scale (= C+ and E♭+/B+, 4-fret cell).
  - Messiaen modes 1–7.
  - 7♯5 (`C E G♯ B♭`, D♭7♯5 `D♭ F A C♭`, academic).
  - Harmonized triads of harmonic major (`I ii° iii iv V ♭VI+ vii°`) and of Ukrainian Dorian (`i II ♭III ♯iv° v vi° ♭VII+`).
  - The about texts are correct: "harmonic minor lowers 3 and 6…", "borrows the minor iv and the °7", "Mixolydian ♭2 over a V7♭9 resolving to major", "add a natural 6 → Barry Harris major 6th diminished", "Hungarian major = dominant with ♯9 and ♯11", the number of Messiaen transpositions. Rimsky-Korsakov is a correct source for harmonic major.
  - Chip names match the badges in every new exercise.
  - No silent over-fret on 4, 5 or 6 strings.
  - Fingering of #172 is one finger per fret (e.g. C triad frets 2–5, fingers 1-2-4).
- Numbers: on every card, in the exercise header, the warm-up, favourites and the drawer. `#/ex/171` and `#/ex/sc-exotic` both open the exercise.
- Library scroll: after opening #171 from Level 5 (scrollTop 10,484) and pressing the exercise's Back, the Library came back at 10,484. The restore runs in `requestAnimationFrame`, so it took a moment in the hidden pane.
- Sound vs picture (#172, real Play click): the steps shown matched the build (4th = E(3), 8th = G(5), 12th = G(5)), and the loop restarted after the padded bar.
- Settings: the speaker status texts for Auto, Phone speaker and Headphones / amp are clear and accurate (apart from C4). The mobile UA case says why a browser cannot detect headphones. "Restore defaults" resets the sound options. The samples line reads "Recorded: Karoryfer "darkblack" 5-string bass (fingerstyle)."
- Layout: Options sheet for #172 at 640x300 (no chip overflow); exercise screen at 1024x768; no horizontal scroll at any size tested.
