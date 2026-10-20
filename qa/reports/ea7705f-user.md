# QA User report · ea7705f · 2026-10-20

Setup: sixth round, focused on what changed since 53a1753 (staff engraving, round-5 fixes, string choices, #78, the four soloing exercises #143 #145 #172 #173).
- Server and tab: my own `qauser` server, opened as `http://127.0.0.1:8890`, in my own tab. 191 exercises.
- Profile: empty at the start (1 service worker, 1 cache, localStorage cleared), cache-busting `?qa=u0…u5`. Cleared again at the end; viewport reset, tab closed, server stopped.
- Sizes: 780x360 (main), 640x300, 915x412, 1024x768. Basses: 4-string, 5-string and 6-string (Settings and builds).
- Method:
  - built every exercise with the app's own modules (defaults, every option value, 6–12 keys, cycles) and read notes, labels, badges, fingers, strings;
  - engraved the staff with `views/staff.js` (`engraveStaff`) for every exercise × option and checked written values, tuplets, ties, rests, beams, time signatures and 8va, then looked at the worst cases rendered;
  - real clicks: Play on #42 (answer shown at the right step), ⋯ → Tab/staff, Options sheets (#12, #173), Library search, Settings → 5-string.
- Personas: beginner (Home, Level 1 texts, warm-up, Settings), advanced player (Options, keys, cycles, string choices), jazz teacher (theory, spellings, engraving, licks).
- Not testable here: hearing the sound and the pad, the microphone, the Android app. Screenshots in this pane come out at odd scales, so layout findings are DOM measurements.

Counts: Blocking 0 · Wrong 7 · Confusing 10 · Irritating 4 · Texts 7 · Visual 1, plus 6 questions.

## Expert verdict (short)

The new staff is a big step: real values, dots, ties across beats and bar lines, rest glyphs, beams per beat, 7/8 and 6/8 grouping, time signatures, key signatures in Reading, F clef, 8va, x and diamond heads. A teacher would accept most of it. Three things still print a wrong rhythm:
- real triplets inside swung licks;
- septuplets (7:4);
- sextuplets marked "3".

The round-5 fixes hold: slap hammer-ons and pull-offs, harmonised triads, Barry Harris, Reading, the Backing gate, the ear-training reveal. #145 (melodic-minor superimposition) and #172/#173 are musically sound. #143 (pentatonic superimposition) has the most problems: one option label is impossible on dominant chords, flat keys are spelled from the pentatonic instead of the chord, and two claims in the about are wrong.

## Blocking     (a user cannot do what the screen is for)

None.

## Wrong        (incorrect musical or factual information)

### W1. Staff: "Swing" moves the 3rd note of a real triplet onto the "&", so swung licks with triplets print a broken rhythm
- Where: Tab/staff = Staff, Feel = Swing 8ths (the default). Five licks:
  - #167 "Guide tones with triplets" and "Triad pairs, then altered triads" (8 beats of triplets);
  - #169 "Blue-note triplet fill";
  - #171 "Two-feel to walking pickup", the exercise's default lick;
  - #189 "Enclosure chain on the V7".
- What I saw:
  - #169 lick 2 plays C–E♭–E as 8th triplets (0, ⅓, ⅔ of beat 1).
  - The staff draws an 8th and a 16th under one "3", then a separate flagged 8th. That reads as a broken tuplet.
  - With Feel = Straight 8ths the same beat is correct (three beamed 8ths under "3").
- Why it matters: in swing notation the "&" means the 3rd triplet note only for a pair of 8ths. Notes already written as triplets must stay triplets.
- Evidence: `staff.js` sets `wpos` to the "&" for any step at ⅔ of a beat when `inst.swing`. Screenshots (this session): `…\tool-results\mcp-Claude_Browser-blob-1792486428692-6ev07k.jpg` (#169: swing above, straight below) and `…blob-1792486448904-vh2gvb.jpg` (#167, #171, #189).
- Suggestion: move a ⅔ note to the "&" only when it is the short half of a long–short pair (⅔ + ⅓), never inside a triplet group.

### W2. Staff: septuplets are drawn as pairs of tied fragments with no "7"
- Where: #135 Polyrhythms, ratio 7:4; #4 Subdivision pyramid with "32nds (8)", which has a Septuplets bar.
- What I saw:
  - Bar 1 of 7:4: 14 note heads for 7 notes, 7 of them flagged 8ths, every note tied to a fragment, no tuplet number.
  - #4 Septuplets bar: 56 heads and 28 ties for 28 notes.
- Cause: 1/7 and 4/7 of a beat are not whole ticks at 480 per quarter, so the tuplet test fails and `splitTies` falls back to 240 + 34 ticks.
- Evidence: DOM of the engraved SVG, and screenshot `…blob-1792486330467-dkthuz.jpg`. The 3:4, 4:3 and 5:4 rows in the same screenshot are correct.
- Suggestion: detect the tuplet from the beat fraction instead of integer ticks, e.g. 7 quarter notes under a "7" bracket for 7:4.

### W3. Staff: sextuplets get a single "3" over six beamed 16ths
- Where:
  - #4 "Sextuplets (6)": four beats, each with six beamed 16ths and one "3";
  - any exercise played with the subdivision "6 sext.".
- Why it matters: a "3" over a 6-note beam means a 16th triplet (half a beat). A sextuplet is marked "6", or beamed 3+3 with a "3" on each half.
- Evidence: the "3" glyphs in the Sextuplets bar sit at x = 2695/2820/2945/3069, one per beat. Screenshot `…blob-1792486306835-k1ggdj.jpg`. Cause: the `TUPLETS` list tries [3,2] before [6,4].

### W4. #143 Pentatonic superimposition: the option "1st: holds the 3rd and 7th" is impossible on a dominant chord
- A major pentatonic has no tritone, so it can never hold both the 3rd and ♭7 of a dominant.
  - Over G7 the 1st choice is G major pentatonic (G A B D E): it has the 3rd, not F.
  - Over the C7 vamp the 1st choice is C major pentatonic: E, but no B♭.
- The label is true only for maj7 (G over Cmaj7: B and E) and m7 (F over Dm7: F and C).
- Suggestion: "1st: the most chord tones", or say "holds the 3rd" on dominants.

### W5. #143 about: three statements that are not right
- "when it fits a chord's scale it never clashes": the exercise's own 3rd choices contain avoid notes, and the tip says so.
  - F major pentatonic over Cmaj7 holds F, the 11 ("pass through it, do not land on it").
  - C major pentatonic over G7 holds C, the 11 over the 3rd.
- "A 7-note scale holds three major pentatonics": true for the modes of the major scale only. Melodic minor holds one (F in C melodic minor), harmonic minor none.
- "D♭ over G7alt, all tensions": D♭ E♭ F A♭ B♭ over G7alt = ♭5 ♭13 **♭7** ♭9 ♯9. F is a chord tone. It should say "four alterations and the ♭7, no 3rd".

### W6. #143: in D♭, E♭ and G♭ the notes are spelled from the pentatonic's name, not against the chord (the root of A♭m7 is written G♯)
- Key G♭, ii–V–I: "[A♭m7] B major pentatonic" is spelled B C♯ D♯ F♯ G♯.
  - Labels: B = ♭3, C♯ = 11, D♯ = 5, F♯ = ♭7, G♯ = **R**.
  - Also: G♭maj7 has its root written F♯; D♭7 has its root written C♯.
- Same over the 7♯9 chord in flat keys: A♭7♯9 → D major pentatonic, so the ♭7 of A♭7 is written F♯ instead of G♭.
- Measured (all progressions × 12 keys × 3 choices):
  - 43 roots written as another letter;
  - 334 labels whose letter does not match the degree (keys D♭ 35, E♭ 28, G♭ 153, plus a few in A♭ and B♭);
  - examples: E♭m7 root written D♯ (minor vamp); G♭7 root written F♯; D♭7 root written C♯ (dominant vamp).
- Why it matters: it breaks the logged rule (chord tones keep their academic spelling). #145 does it right: it names the parent plainly ("B melodic minor") but spells the notes against the chord (C♭).
- Suggestion: spell the notes against the chord as #145 does; name the pentatonic plainly ("B (= C♭) major pentatonic").

### W7. #69 Hear the 7th chord: the answer shapes cannot be fingered as shown, and the chords sit in a muddy register
- Answer shapes (40 builds of "maj7, 7, m7, m7♭5, °7"):
  - 259 of 320 (81%) span 5 or 6 frets, e.g. E7 = E12 A11 D9 G7, E°7 = E12 A10 D8 G6;
  - 320 of 320 give finger 4 to two different frets, e.g. Cm7 = C@E8 f4 + E♭@A6 f4 + G@D5 f3 + B♭@G3 f1. With Dot labels = Finger this is shown as is.
- Register: the lowest chord note is E♭2 on median, down to A1. Close-position 7ths under C3 sound muddy, which makes the quality hard to hear.
  - Round 5 moved the triads (#42) up to C3–G3, which fixed this there: max span 4 frets, no duplicate fingers.
- Suggestion: an octave higher, or a spread voicing (R on E/A, 7 and 3 above); fingers from a real hand position.

## Confusing    (misleading, illogical, makes no sense)

### C1. #173 Implied changes: the strip shows labels against a chord it never names
- The implied chord appears only as header text ("implies Dm7♭5"). The strip (tab and staff) shows only "Cm7", so bar 3 reads `R ♭3 ♭5 ♭7 3 5 ♭7 ♭9` under Cm7: D labelled "R" in a Cm7 bar.
- Lead sheets write implied or optional changes in parentheses above the staff: (Dm7♭5) (G7♭9).
- Suggestion: draw the implied symbols in the chord row in parentheses or italics. The badge and the backing can stay on the vamp.

### C2. #143 and #179: the "V7alt" chord is called G7♯9, and the Chords pad plays its natural 5th under an altered line
- The progression option is "ii – V7alt (♯9) – I" and the about and summary say "G7alt", but the badge reads "G7♯9". #145 writes "G7alt".
- Backing = Chords plays G B D F under G7♯9:
  - #143: under the D♭ pentatonic (D♭ E♭ F A♭ B♭);
  - #179 default: under the altered scale G A♭ B♭ B D♭ E♭ F.
  - The pad's D natural clashes a half step against the line's D♭ and E♭.
- #145's "G7alt" pad is G B F (no 5th), which is right.
- Suggestion: call it G7alt there too (the pad then drops the 5th), or keep 7♯9 and give it half-whole diminished.

### C3. The same "one-chord minor vamp" is Aeolian in #143 but Dorian in #173
- #143 minor vamp (Cm7) offers E♭, A♭, B♭ major pentatonics. A♭ is the ♭13: Aeolian, following the logged "i is Aeolian in a minor key".
- #173's minor vamp line plays A natural on Cm7, labelled 13: Dorian.
- Most teachers treat a one-chord m7 vamp as Dorian (So What, Oye Como Va, funk vamps), which would give E♭, B♭, F.
- The two new soloing exercises disagree on the same vamp. (Question below.)

### C4. #78 The 3 scale fingerings: two of the three "fingerings" play the same frets, and the exercise is filed under Triads
- Major, C on E8:
  - "finger 1" = E8 E10 A7 A8 A10 D7 D9 D10, fingered 1-3 | 1-2-4 | 1-3-4;
  - "finger 2" = the same eight frets, fingered 2-4 | 1-2-4 | 1-3-4.
  - Only the first two fingers differ; then the hand moves back a fret into the finger-2 position.
- Natural minor, C on E8: "finger 1" and "finger 2" are both E8 E10 E11 A8 A10 A11 D8 D10. The finger-2 form is "2-4-4", a finger-4 slide into the finger-1 position.
- In practice you see two shapes, not three. The about says "The root stays on the same fret and the hand moves around it".
- Placement: the header says "Triads · Level 3", the Library card is tagged "🔺 Triads", and it sits in the Triads topic of the Path, although it is a scale exercise. Searching "scale fingering" finds it among the Triads.
- Suggestion: file it under Scales (it can still sit next to #77 by number). Consider making form 1 a real position-1 shape: shift up after the 2nd note, or the 3-notes-per-string start.

### C5. #12 Your first scales: "one octave in one position" is not what roots at fret 1 get
- With the root at fret 1, the scale is played with finger 1 and a 5-note run along the string to fret 8:
  - F on the E string: F E1 f1, G E3 f3, A E5 f1, B♭ E6 f2, C E8 f4, then D A5…;
  - B♭ on the default A string;
  - E♭ on D;
  - C on the low B of a 5-string, the most common key on that string.
- The summary and about promise "One octave in one position… Each fits in one hand position", and the tip says "Major with root on finger 2".
- Measured (4-string, 3 strings × 12 keys, major): 11 of 36 builds shift.
  - 8 of them are "Root on D", which physically needs a shift on a 4-string.
  - The others are F/E, B♭/A and E♭/D.
- The logged rule moves roots at frets 10–12 to another string, but not roots at fret 1.
- Suggestion: a root at fret 1 takes the string below (F → A8, B♭ → E6) and is shown as fixed, like frets 10–12.

### C6. #55 "12/8 slow blues (triplets)" is written in 4/4
- The staff shows 4/4 with a "3" bracket over every quarter + 8th, the same as the shuffle option. A 12/8 time signature with quarter–8th groups is what the option name promises.

### C7. #26 Dynamics ladder: pp … ff are printed in the chord-symbol row above the staff
- In the chord font, "f" and "mf" look like chord symbols (F). Dynamics go below the staff in bold italic.

### C8. #141 Pentatonic side-stepping: the Backing has nothing to play
- The badges "Am pent" / "B♭m pent" are not read as scales, so Backing gives the toast "This exercise has no chords or scales to back".
- This is the one scale exercise where a pad (Am held through the "outside" bar) is the point.

### C9. #172 Motif development: two small mismatches
- The about defines the motif as "5 13 5 3". The "Question and answer" lick uses another one: E G A G = 3 5 13 5 over Cmaj7, answered by F A B A.
- On Dm7 the motif's last note is the ♭3, labelled ♭3, while the about says 3.
- "Pushed: the motif an 8th early" pushes bars 2–4, but the loop's first motif starts on beat 1: the 8th before it is a rest (`… E2:h r:e`).

### C10. #129 Walking with chromatic approach notes: a whole-step "approach"
- Jazz blues in C: `[F7] F2 F3 C3 E2(→) [F♯°7] F♯2`. E to F♯ is a whole step, against the summary "Beat 4 is a half step from the next root".
- Measured: 14 of 1,224 approaches, all into the ♯IV°7 of the jazz blues. Down from 46 last round.

## Irritating   (works, but annoys or slows the user)

- I1. Progression drills scale with the subdivision selector, so triplets move the chord changes off the bar.
  - #110, #143, #145, #179 have 8 notes per chord. With "3 triplets" G7 starts at beat 2⅔ and Cmaj7 at 5⅓.
  - Licks and walking hide the selector; these could fix it, or keep chords on bar lines.
- I2. #92 Walking with chord tones, rhythm changes: 48 leaps of a 9th into the next root, e.g. `[Dm7] D2 A2 [G7] G1`. All other progressions: none. Max leap in the other walking exercises is 12 semitones.
- I3. The Level 1 warm-up gave "Your first scales · Key: G♭" and "How a chord is built · Key: G♭" on day one. Six flats is a lot for a first scale. Debut and Grade 1 syllabi stay in C, G, F, D and A minor. (Opinion.)
- I4. #174 "Pop fill down the minor pentatonic (pull-offs)", Em: `B@E7 f4 <T> → A@E5 f3 <PO> → G@E3 f1 <PO>`. That is a 5-fret span (3–7) with fingers 1-3-4 at the low end of the neck: a stretch, not one finger per fret. All hammer-ons and pull-offs are now on the right string and direction (0 bad of 3,000+).

## Texts        (typos, unclear wording, inconsistent names)

- T1. #143 source "Gary Willis": I cannot connect Willis to pentatonic superimposition. The standard references are Ramon Ricker (already cited) and Jerry Bergonzi, "Inside Improvisation Vol. 2: Pentatonics".
- T2. Path topic blurbs are out of date:
  - Triads, "From the first shape to triad pairs and rudiments", now holds a scale exercise (#78);
  - Jazz Licks, "ii–V–I, minor, blues, bebop, modern, bass solos", omits motifs and implied changes;
  - Modes omits chord-scale and superimposition.
- T3. String options are in a different order in different exercises:
  - #7, #8, #31: "E / A / D / G / Low B / High C";
  - #59, #72: "Low B / E / A / D / G / High C" (low to high, clearer).
- T4. Ear-training rounds are named "#1", "#2"… in the chord-symbol row. Above a staff "#1" reads like "♯1". "Round 1" is clearer.
- T5. #152 about: "Stack two 4ths… quartal chords (1-4-7)". Two perfect 4ths give 1-4-♭7.
- T6. #25 Octave jumps names the descending chromatic run with sharps (C B A♯ A G♯). The app's own #8 teaches "Sharps going up, flats coming down".
- T7. Settings: "5-string (low B)" but just "6-string". "6-string (low B, high C)" matches.

## Visual

### V1. Staff mode takes the height from the neck on wide-range exercises
- #66 One note in all its octaves, 5-string:
  - 780x360: staff 140 px vs neck 103 px. In tab mode: strip 77, neck 166.
  - 640x300: neck 63 px, dot and fret-number text 4.8 px high (unreadable). Tab mode: neck 106 px, text 8.8 px.
- #115, #120 and #95 at 640x300: staff 106 px, neck 77 px.
- No overflow and no overlap otherwise:
  - staff above the controls at every size;
  - label and chord rows never overlap (17 exercises measured);
  - no horizontal scroll on Home, Path, Library, Settings, #78, #143, #145, #172, #173 at 915x412.
- Suggestion: cap the staff height (compact spacing or fewer ledger lines before 8va on short screens) so the neck keeps at least ~100 px.

## Questions for the owner

- Q1. Key signatures appear only in Reading. Elsewhere, single-key exercises (e.g. #12 in E♭) print accidentals on every note. Draw the key signature when the whole exercise is in one key, and keep accidentals only for cycles and jazz lines?
- Q2. #173: the Backing keeps the vamp by design, so the student hears the implied chord only as a clash. Many teachers first let the implied chord sound, then take it away. An option "Backing follows the implied chords"?
- Q3. 8va for one or two notes: #114, #182, #183, #184 and #157 switch 8va on for 1–2 notes at a time (6 times in #183). Logged decision; would you rather put the whole phrase under 8va, or allow D5/E5 on ledger lines?
- Q4. #145 "All seven chords on one root" in E♭ prints E♭m7♭5 with B♭♭ (the cycles' rule would say D♯m7♭5). In D♭ the "one root" is named C♯ and D♭ alternately (C♯m(maj7), D♭7sus♭9, C♯m7♭5…). Keep it?
- Q5. Ear training: once the answer step is reached, should the strip (tab or staff) show the answer instead of "?"? Now only the neck and header show it.
- Q6. Shuffle and 12/8: grooves write the shuffle as explicit triplets, licks as straight 8ths under "Swing". One convention, or both on purpose?
- Opinion only (not counted), on C3: the decision "minor key i = Aeolian" is fine for minor progressions, but for a one-chord m7 vamp in a soloing exercise Dorian is the usual default.

## Checked and fine

- Staff engraving, measured on the SVG:
  - values: dotted 8th + 16th with a stub beam; dotted quarter; Charleston; ties on the beat (8th–8th tied); dotted-quarter rest in the tumbao.
  - grouping: no half rests on beat 2 and no dotted-half rests in 4/4 in any exercise.
  - rests: quarter rests; whole-bar rest centred.
  - beams: per beat; 7/8 as 2+2+3 and 3+2+2; 6/8 in 3s.
  - tuplets: triplets (8th and quarter), quintuplets "5", 3:4 half-note triplets, 4:3 as dotted 8ths in 3/4.
  - time signatures: 5/4, 7/8, 7/4, 6/8, 3/4.
  - stems: down on and above the middle line, left side; ties opposite the stem.
  - accidentals: held to the bar line, ♮ in the same bar.
  - key signatures in Reading: B major 5♯ at the right places.
  - other: ledger lines; x heads; harmonics as diamonds with ♯; "Swing" marking; 8va bracket.
- Round-5 fixes:
  - Ear training: all steps "?" before Play; the answer "B · Major" with R·3·5 appears at the answer step only. Triads one note per string, within 4 frets, voiced C3–G3. Progressions play every chord they name.
  - Reading: no labels, no "next" prompt. No tritone leaps in 5,100 intervals of #37, #67 and #102.
  - Backing: off for technique, rhythm, fretboard, intervals and ear (gated in the UI). Word badges ("First position", "Charleston") play nothing. #145 pads correct (7alt without 5th, 7sus♭9 = C F G B♭).
  - Slap: 0 bad hammer-ons, 0 bad pull-offs, no pop right after the thumb on the same string. Octave pop E0 → D2.
  - Grooves:
    - country in half notes with a pickup;
    - samba anticipates the next note (B . . F♯ | F♯ . . B);
    - neo-soul plays G♯ (7) on Amaj7;
    - tumbao on "2&" and 4.
  - Walking: #91 two-feel in half notes. No leaps over an octave in #129–#131 and #163–#188. No repeated pitch into a chord change.
  - Harmonised triads (#81, #111–#113, #148, #149, #151, #182, #183): every chord within 4 frets, never 3 notes on a string.
  - Barry Harris: #154 B°7 → B♭7, D♭7 (C♭ kept), E7, G7 with no repeated badge. #155 G°7 → G♯m, C°7 → C♯m. #140 6th-dim "every other note" C6 / dim chords.
- String choices: "Root on" adds Low B (5-string) and G (6-string). One-string drills with low B and high C play on that string. Octaves B → A on 5-string. A 6-string option saved and then opened on a 4-string falls back cleanly (#25 "D → C" shows "E → D").
- #145 melodic-minor superimposition:
  - parents right (A♭/G7alt, D/G7♯11, F/Dm7♭5, B♭/C7sus♭9, A/Cmaj7♯5, F/C7♭13, E♭/Cm7♭5);
  - labels right (♭9 ♯9 3 ♭5 ♭13 ♭7; 9 11 13);
  - jazz spelling per the logged rule; minor key chips (Cm…).
- #172 rhythms add up in every bar (swing and straight). Hal Crook "How to Improvise" is a correct source.
- #173 musically clean in all keys:
  - iiø–V7♭9, V7♭9, ii–V and ♭II7 spelled correctly (C♭ in D♭7, F𝄪 in D♯7, tritone sub E7 in E♭m);
  - the ♭9 → 5 and 3 → R resolutions are there;
  - the pad holds the vamp and re-attacks it at bar 4;
  - key chips follow the lick (minor/major).
- Level 1 texts (#1–#17): facts right (landmark notes, staff positions, mnemonics, finger tips). No jargon left unexplained.
