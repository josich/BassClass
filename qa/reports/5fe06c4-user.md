# QA User report · 5fe06c4 · 2026-10-15

Setup: second round. Own `qauser` server (port 8890) and tab, empty profile (service worker unregistered, cache `bassclass-v1` deleted, localStorage cleared, `?qa=2` cache-buster). Phone landscape 780x360 (main size), plus 740x360, 640x300, 915x412 and a 1024x768 tablet. 4-string, 20 frets (defaults); zone exercises also built on 5/6-string. Personas: beginner (Home → Path → Library L1 → warm-up → Settings → tuner), advanced player (favorites, Options panel, key chips, All 12 cycles, zones, walking, licks), jazz teacher (all 33 licks in C and in all 12 keys, approach drills, walking lines, chord-scale, chord symbols and Roman numerals in every progression and scale).
Method: the app's own modules (`/js/curriculum/index.js`, `/js/theory.js`, `/js/fretboard.js`, `/js/ui/exercise.js`) to build exercises and dump note names, labels, chord badges, beat positions and string/fret. Layout checked with `getBoundingClientRect()`. Real clicks for stars, drag-to-reorder (mouse), Options, More popover.
Not testable here: sound (I cannot hear it); sound vs picture during playback (the browser pane was hidden, so `requestAnimationFrame` is paused and the step display does not advance); microphone; real touch drag (only mouse drag was tested; the handle has `touch-action: none`).
Counts: Blocking 0 · Wrong 8 · Confusing 10 · Irritating 4 · Texts 11 · Visual 2, plus 6 questions.

## Blocking     (a user cannot do what the screen is for)

None found.

## Wrong        (incorrect musical or factual information)

### W1. "7th arpeggios around the cycle in one zone" silently drops keys on a 4-string bass
- Where: Arpeggios & 7ths → `arp-zone-cycle` (L3), default options (Major 7, Zone 1, Cycle of 4ths), 4-string.
- What I saw: the summary promises "All 12 maj7, 7 or m7 arpeggios inside a 5-fret zone", but the default plays 10 chords: `Cmaj7 Fmaj7 B♭maj7 A♭maj7 D♭maj7 G♭maj7 Bmaj7 Amaj7 Dmaj7 Gmaj7`. E♭maj7 and Emaj7 are missing, so the "cycle of 4ths" jumps B♭ → A♭ and B → A. Other combinations on 4 strings: Zone 1 dom7 (no E7), min7 (no Em7), m7♭5 (no Em7♭5); Zone 2 maj7 (no Gmaj7); Zone 3 maj7 (no B♭maj7); Zone 4 maj7 (no Dmaj7). On 5 and 6 strings all 12 are present.
- It also leaves the zone without saying so: Zone 1 uses frets 1–6 (Dmaj7 ends on G string fret 6), Zone 2 uses 4–10, Zone 3 7–13, while the shaded zone stays 1–5 / 5–9 / 8–12.
- Spelling in the same exercise, Zone 1 m7♭5: `Cm7♭5 E♯m7♭5 A♯m7♭5 D♯m7♭5 G♯m7♭5 …`. Nobody writes Fm7♭5 as E♯m7♭5 (see W2).
- Evidence: `arpeggios.js:107-108` widens the zone by one fret, then `if (!z) return;` skips the key with no message.
- Why it matters: this is the owner's zone warm-up extended to 7ths. A player believes they covered all 12 keys.
- Suggestion: use an inversion or the next zone for a key that does not fit, and show a notice (like the "Highest fret" notice).

### W2. Roots named B♯, E♯, C♭ and F♭: the zone warm-up contradicts its own cycle, and several key chips have no C or F
- Where: everywhere a root is chosen by "fewest accidentals" (`T.bestRoot`): key chips, chord badges, scale badges, Neck explorer root list.
- What I saw:
  - `tri-zone-cycle` (the SBL zone warm-up) with Triad = Diminished: `C° E♯° A♯° D♯° G♯° C♯° F♯° B° E° A° D° G°`. Its own about text says "the cycle of 4ths (C F B♭ E♭ A♭ D♭ G♭ B E A D G)". Augmented: `C♭+` for B+.
  - Key chips: Diminished triads or m7♭5: `C C♯ D D♯ E E♯ F♯ G G♯ A A♯ B` (no F, no E♭, no B♭). Dim7 (`arp-7th`, `arp-dim-dominants`) and the Neck explorer "Chord · dim7": `B♯ C♯ D D♯ E E♯ F♯ …` (no C). Locrian and altered: `E♯` instead of F. Lydian, Lydian augmented, Ionian ♯5 and augmented triads: `C♭` instead of B. Lydian ♯2: `F♭`. Ultralocrian: `B♯`, `E♯`.
  - Badges that follow: `B♯°7` (arp-dim-dominants and arp-dim-to-minor in "C"), `E♯ Locrian`, `C♭ Lydian` (md-parallel, md-pitch-axis), `E♯ Altered` (md-melodic-modes), `B♯ Ultralocrian` (md-harmonic-modes), `E♯°`/`C♭+` in every triad-quality exercise.
- Why it matters: the spelling is enharmonically correct, but no player or chart writes B♯°7, E♯ Locrian or C♭ Lydian. The advanced player cannot find "C" or "F" on the chip row. In the zone warm-up the badges no longer match the cycle the text teaches.
- Not a re-report: the decision about double accidentals covers lick notes, not key or chord roots.
- Suggestion: name roots by the key-chip convention (C, D♭, D, E♭, E, F, F♯/G♭, G, A♭, A, B♭, B) and spell the chord or scale from that root, simplifying double accidentals inside.

### W3. "ii–V–I in all 12 keys" spells the G♭ ii–V–I as G♯m7 – D♭7 – G♭maj7
- Where: progression `cycle-251` in `md-chord-scale`, `arp-voice-led`, `arp-rhythm-changes`, `arp-giant-steps` and `wk-two-per-bar`.
- What I saw: `… E♭m7 A♭7 D♭maj7 G♯m7 D♭7 G♭maj7 C♯m7 F♯7 Bmaj7 …`. The ii of G♭ is A♭m7. In the chord-scale exercise this becomes G♯ Dorian (sharps) followed by D♭ Mixolydian (flats).
- Correct elsewhere: `arp-ii-v-i` prints `A♭m7 D♭7 G♭maj7`.

### W4. The altered scale in the chord-scale exercise spells the 3rd of G7♯9 as C♭ and labels it "♭4"
- Where: Modes → `md-altered-chord-scale` (L6), default "ii – V7alt (♯9) – I".
- What I saw: `[G7♯9] G(R) F(♭7) E♭(♭6) D♭(♭5) C♭(♭4) B♭(♭3) A♭(♭2) G(R)`. In F: `[C7♯9] … F♭(♭4) …`.
- Why it is wrong: over a G7 chord, B is the 3rd. A jazz teacher spells G altered as G A♭ B♭ B D♭ E♭ F and names it 1 ♭9 ♯9 3 ♭5 ♭13 ♭7. The app's own `theory.js:103-104` defines exactly those labels (`['1','b9','#9','3','b5','#5','b7']`), but the chord-scale build uses `ivBetween` instead (`modes.js:120`).
- The other altered progressions read better but still use scale-degree names on a dominant: `[G7♭9] G F E(6) D C♯(♯4) B A♯(♯2) A♭(♭2)`.

### W5. Minor walking plays a natural 9 over a 7♭9 chord
- Where: Walking Bass → `wk-minor` (L5), default (Minor ii – V – i, key Dm).
- What I saw: `[Em7♭5] E G B♭ G♯(→) | [A7♭9] A(R) B(2) C♯(3) E(5) | [Dm(maj7)] …`. The chord badge says A7♭9 (B♭), and the line plays B natural on beat 2.
- Why it matters: the exercise is about "the V7♭9 that pulls hard to the minor tonic", and the line contradicts its own chord symbol.

### W6. Walking approach note spelled A♯ under a B♭7 badge (it is the chord's own root)
- Where: `wk-approach` (L4), default Jazz blues in F, bar 5.
- What I saw: `[B♭7] B♭(R) B♭(R) F(5) A♯(→) | [B°7] B(R) …`. Beat 4 is the root B♭, spelled A♯ and labelled as an approach note. The bar plays B♭ three times.
- Same mechanism elsewhere: approach notes are spelled only by direction (`common.js:292`, sharps from below, flats from above), never against the chord under them.

### W7. G♯ minor mixes sharps and flats
- `arp-dim-to-minor` (L5), key G♯m (also step 5 of its default All 12 cycle): `[G°7] G B♭ D♭ F♭ → [G♯m] G♯ D♯ B`. The leading-tone chord of G♯ minor is F𝄪°7. Written as G B♭ D♭ F♭, the resolution reads D♭ → D♯ and F♭ → D♯, so the tip "Each diminished note resolves by half step or common tone" cannot be seen on the labels.
- Licks: all four minor ii–V–i licks in G♯m show `A♯m7♭5 – E♭7♭9 – G♯m6`. The V of G♯ minor is D♯7♭9.
- Suggestion: spell G♯ minor material from A♭ minor (B♭m7♭5 – E♭7♭9 – A♭m6, G°7 → A♭m), or keep sharps throughout.

### W8. Lick "Two-feel to walking pickup" labels its last note ♭9 over Cmaj7
- Where: `lk-bass-solo` lick 1, every key.
- What I saw (C): `… E(3) D(9)@6 D♭(♭9)@7`, and the loop restarts on C. The D♭ is the chromatic approach back to C, but it shows "♭9" on a major 7th chord.
- Cause: approach detection looks at the next note, and the last note of a lick has none (`licks.js:110`). In the "All 12" cycle the next key starts elsewhere, so this note is an approach only when the lick loops in one key.

## Confusing    (misleading, illogical, makes no sense)

### C1. A beginner has no way in: the "Learning path" is a topic grid, the real level path is in the Library, and the warm-up starts at L3
- Home (new profile): Daily warm-up set to "Your level L3", first item "Hands: Simandl 1-2-4 fingering (L3)", fourth "Triads: Harmonized triads … Phrygian · … · Quartal (1-4-7)". The old "▶ Start the learning path" button is gone, so nothing says "start here".
- The level tabs read only "L1 … L6". The level names are in `title` tooltips, which never show on touch.
- Path: 13 topic cards, "Pick a topic", no order and no starting point. The step-by-step list (Level 1 Foundations → Level 6) now lives in the Library. For a user the names are swapped: a "path" suggests an order, and a "library" suggests a shelf of topics.
- Cards show a "core" chip that nothing explains any more (the "Core exercises · the backbone of the method" section was removed from Home).
- Suggestion: show a "Start here: Level 1" card on Home while there is no progress, default the warm-up to L1 for a new profile, and consider swapping the two screens' contents or names.

### C2. "Approach notes" that are just the previous note repeated
- `tri-approach` (half step below), C major: `B(5)@8 B(→)@8.5 [F] C(5)`. In half step above: `[G7] … F(♭7)@7 F(→)@7.5 [Cmaj7] E`. In enclosure mode: `B(5) D♭(→) B(→) C`. In double chromatic: `G(5) G(→) G♯(→) [Dm] A`, `D(R) D(→) D♯(→) E`, `F(R) F(→) F♯(→) G`, which is 3 of the first 9 targets.
- `arp-approach`: `B(7) B(→) C(R)`, `F(♭7) F(→) D♯(→) E(3)`.
- Walking lines: `E(3) E(→) [F7]` (wk-approach bar 9), `F(♭3) F(→)` (wk-minor), `B♭(R) B♭(→) [Am7]` (wk-two-per-bar), `C(5) C(5)` (wk-enclosures).
- Why it matters: when the next target is a half or whole step away, the "approach" is a repeated note labelled "→". A teacher would pick the other side, or a scale step, so that the line moves.

### C3. Lick names keep the C-key chords while the badge shows the transposed chord
- In E♭: the board shows `B♭7  Enclosure chain on G7` (screenshot at 640x300: `mcp-Claude_Browser-blob-1792055698872-538lgh.jpg` in this session's tool results). The same happens with "Tritone-sub line (D♭7 over G7)", "Pentatonic superimposition (Dm7)" and "Triad pairs C & D (Lydian)" in every key but C. They appear in the Options chips, the summary and the text badge on the neck.
- Suggestion: use function names ("on the V7", "♭II7 over V7", "over the ii", "I & II triads") or transpose the names.

### C4. "Low B (5/6-string)" and "High C (6-string)" are selectable on a 4-string and silently play the E string
- Where: `fb-naturals`, `fb-chromatic-string`, `fb-unison` (String option).
- What I saw: choosing "Low B" on a 4-string: the summary says "Low B (5/6-string) · Frets 12–24", and the board plays the E string (badge "E string"). There is no notice and the chip is not disabled. The daily warm-up picks options at random, so a 4-string beginner can be served "High C (6-string)".
- Cause: `fretboardNotes.js:7` falls back to the E string.

### C5. "Frets 12–24 (upper octave)" stops at the highest fret without saying so
- `fb-naturals` (L1) with the default 20 frets: D string plays `D E F G A G F E D` (frets 12–19), a 5th rather than an octave. The E string stops at C (fret 20). No "above your highest fret" notice, because the range is clamped (`fretboardNotes.js:43`). The tip "The 12th fret repeats the open string one octave higher" does not apply either.
- The L1 warm-up served exactly this combination ("D string · Frets 12–24 (upper octave)").

### C6. ii – V7♭5 – I: Lydian dominant with C♯ and a natural 5 under a G7♭5 badge
- `md-altered-chord-scale`, "ii – V7♭5 – I": `[G7♭5] G F E(6) D(5) C♯(♯4) B(3) A(2) G`. The chord symbol's ♭5 is D♭. The scale spells it C♯ and also plays D natural, the note the symbol removes.
- Either call the chord G7♯11 (then Lydian dominant fits), or use whole tone or altered for 7♭5. As it stands the badge and the dots disagree.

### C7. The walking label "5→" is never explained
- `wk-mixed`: `[B♭7] B♭ D F F♯(5→) [B°7]`. `wk-giant-steps`: `[Bmaj7] B D♯ F♯(5) C(5→) [Fm7]`, `[Gmaj7] … G♯(5→) [C♯m7]`.
- It means "the 5th of the next chord (dominant approach)". But next to the current chord's badge it reads as "5th", and F♯ is not the 5th of B♭7. The decision covers "→" only, and the legend and drawer do not mention "5→".

### C8. The pedal-point fill tip does not match the notes
- Tip: "keep the hand in one position, the pedal on the A string and the upper notes on the D and G strings."
- Built (C): pedal C on A string fret 3; upper notes E (D2), G (D5), B (G4), D on A string fret 5, then `B1 (A2) A1 (E5) B1 (A2)`. The last three notes go below the pedal on the A and E strings. One position (frets 2–5), which is good, but the text describes another line.

### C9. "Blue-note triplet fill" has no blue note (teacher opinion)
- C: `G B♭ B(→) C | B♭ G E` over C7, `F A C E♭ D C A F` over F7. Every note is a chord tone or the 13, except the B approach. There is no ♭3 or ♭5 against C7. B♭ and E♭ are blue notes only relative to the key, and here they are the 7ths of their own chords.

### C10. "Use Mixolydian on 7" in a minor ii–V–i (teacher opinion)
- `wk-scalar` tip: "Use the scale of each chord (Dorian on m7, Mixolydian on 7)". The default (Autumn-type changes in F) then plays `[A7] A G F♯(6) E | [Dm7]`. Over a V7 resolving to minor, most teachers ask for ♭13 and ♭9 (F, B♭: Phrygian dominant or altered). F♯ into Dm is the classic clash they correct.

## Irritating   (works, but annoys or slows the user)

### I1. The warm-up overwrites your own options for that exercise
- Warm-up items open with random options, and any loop (`exercise.js:156`, `params: p`) or option change saves them as that exercise's options. Opening the exercise later from the Library or Favorites shows the warm-up's random choice.
- Evidence: after the L1 warm-up opened "Natural notes on one string" with random `range: 12`, the stored record became `{"fb-naturals":{"params":{"range":"12","string":"B"}}}`, and I had chosen only the string.
- Related: "▶ Continue: …" on Home points to the last exercise whose progress changed, not the last one opened. After opening Alternate plucking and a lick, it still said "Continue: Natural notes on one string".

### I2. Favorites are below the fold on most phones
- The two Home blocks sit side by side only from about 760 px. At 740x360 (a common Android landscape width) the Favorites block starts at y = 580. At 640x300 it starts at y = 597. That is 1.6 to 2 screens down, under the whole warm-up list. The beginner's "No favorites yet" hint is not seen either.

### I3. The Library is one 31-screen page
- At 780x360 the Library is 11,342 px tall (169 cards). Level 5 starts at 7,875 px (22 screens down) and Level 6 at 10,257 px. There are no level tabs or jump links, unlike the topic pages. Search helps, but browsing a level means a very long scroll.

### I4. The Options panel slides in again on every chip tap
- `renderOptions()` replaces the whole panel, so the `slidein` animation (`app.css:136-137`, opacity 0.4 → 1, 24 px slide) replays on every tap. Screenshots right after a tap show the panel half-transparent over the neck. Trying several keys in a row flickers.

## Texts        (typos, unclear wording, inconsistent names)

- T1. Groove summaries show a bare option, "Style default": "Rock 8ths · Style default · Key: A" (gr-roots, gr-octaves, gr-blues, gr-approach, gr-world, gr-funk). It means "Progression: the style's default", which the summary does not say.
- T2. Mixed UK/US spelling: the new UI says "Favorites", "No favorites yet", "Add to favorites", while the rest of the app writes "Colours", "practise", "neighbour", "Memorise", "centres", and the README has "Organised … your favorites".
- T3. Path subtitle: "Inside each one the exercises climb from level 1 (first steps) to level 6 (mastery)". Only Scales, Triads and Chords & Harmony span L1–L6. Fretboard is L1–L4, Licks L5–L6, Walking L3–L6, Technique L1–L5.
- T4. Drawer, "How to practise it": "switch to "Quiz" to test yourself". On phones Quiz is reached via ⋯ More → Reveal, tapped twice (Step → Shape → Quiz). Nothing on screen says "Quiz".
- T5. `sc-alternating-all-keys` ("Alternating 3rds through all keys") has the tips of `sc-odd-groupings`: "Groups of 3 → triplets, groups of 4 → 16ths, then swap them for rhythmic tension." Nothing is about alternating 3rds.
- T6. `fb-open-strings` about: "Every journey starts here." It is now the 6th Level 1 exercise (after the hands-and-time-first order).
- T7. Settings footer: "Install it from your browser menu → "Add to Home screen" for full-screen landscape mode." This also shows inside the installed Android app, where it does not apply.
- T8. Favorites empty state: "Tap the ☆ on any exercise (in the Library, the Path or an exercise's header)". The Path's topic cards have no star. Stars appear one level down, inside a topic.
- T9. `hm-chord-tones` (triad version), Minor ii – V – i: badges "D° – G7♭9 – Cm", but the V plays G B D only, so only the V has a 7th-chord name.
- T10. Chord-order option "In 4ths (I-IV-vii°-iii-vi-ii-V-I)" keeps major-key numerals when Scale = Natural minor or a mode. The badges then show i, iv, ♭VII…
- T11. Small: summary "Inversion: 1st inversion" (the label is repeated); `tri-cycle-all-inversions` tip "Start at 60 bpm" (lowercase, "BPM" everywhere else).

## Visual

- V1. Tablet 1024x768: the fret numbers float 157 px below the neck. The neck (string area) spans y 239–471 and the fret-number row sits at y 628. This is a side effect of the string-spacing cap (round 1 V4), which otherwise looks right.
- V2. Library search placeholder is cut at 780x360. The field is 200 px wide (176 px for text), and the placeholder `Search exercises… (e.g. "triad", "ii-V", "slap")` needs 269 px, so it reads `Search exercises… (e.g. "tri`.

## Questions for the owner

- Q1. Favorites store only the exercise, not its options. Should a star remember the key, inversion and pattern you had when you starred it, so you can keep "Triads, E♭, 2nd inversion" and "Triads, all 12" as two favorites?
- Q2. Root naming (W2): should roots always follow the chip convention (C, D♭, E♭, F, F♯/G♭, A♭, B♭, B…) with the inside spelled from that root, the way lead sheets do?
- Q3. In the minor ii–V–i chord-scale, G7♭9 gets half-whole diminished (E natural, the 13) before Cm(maj7). Many teachers would use Phrygian dominant or altered (E♭) in minor. Which do you want?
- Q4. Lick "Guide tones with triplets": bar 1 (Dm7) never plays C, so the "♭7 falls a half step to the next 3rd" move the about text describes only happens once (F → E). Rewrite bar 1 so C → B is heard too? (Raised as an opinion in round 1, unchanged.)
- Q5. Lick "Diminished arpeggios (Barry Harris)" ends with B (the leading tone) on the downbeat of the last bar and C on the "&". Is that delayed resolution intended? The module otherwise puts chord tones on the beat.
- Q6. A total beginner's second exercise, "Chromatic 1-2-3-4", defaults to fret 1, the widest stretch on the neck. Many methods start at fret 5 or 7. Intended?

## Checked and fine

- Round 1 fixes confirmed:
  - B1: Blues scales offers Blues and Major blues (`C E♭ F G♭ G B♭ C`).
  - B2: the altered chord-scale offers V7alt, V7♭9, V7♯5 and V7♭5 (spelling: W4).
  - W1: no lick label changes between keys. All 33 licks in all 12 keys have the same labels as in C (0 mismatches), and chromatic roots read E7, Amaj7, D7.
  - W2: ♯9 labels; no "·" or "♭4".
  - W3: approach drills put chord tones on the beats; licks put targets on the beat.
  - W4: the all-scales triads offer 20 scales, default Lydian dominant.
  - W5: triad-pair names.
  - W6: Settings footer.
  - W7: chord-scale text.
  - W8: harmonic-minor modes tips and source.
  - W9: 3rds text.
  - W10: four triad types text.
  - C1: template subdivisions are used (19 at quarters, 47 at 8ths, 19 at triplets, 30 at 16ths, 52 written).
  - C2: 5 pentatonic positions.
  - C3: "→" everywhere (see C7 for "5→").
  - C4: key chips follow the scale ("C♯" for minor, "Cm" chips for minor licks and walking).
  - C5: minor walking offers minor progressions only.
  - C6: blues summary.
  - C7: bebop descent bar 1 (D F A F on the beats).
  - C8: pedal fill now in one position (see C8 above for the tip).
  - C9: landmark tip.
  - C10: "♪ Written rhythm" button with an explanation.
  - C11: Feel shown as fixed.
  - C12: labelled summaries.
  - I1: at 780x360 and 640x300 the footer fits exactly (`scrollWidth = clientWidth`), and the More popover is clear.
  - I2: "ii-V" and "ii–V" both find 14.
  - I3: side panel; the board stays visible.
  - I4: the Coltrane lick now starts at E8 in position 5–8.
  - I5: warm-up shows "2/6 Next ›" and "Finish ✓".
  - Texts T1–T10.
  - V2: the rail fits (6 links, `scrollHeight` 360 at 780x360, 300 at 640x300).
  - V3: stat boxes gone.
- Licks in C, as a teacher:
  - ii–V–I: Dm9 arpeggio and ♭9 resolution, F–D♯–E enclosure on beat 1, 1-2-3-5 cells with D♭ triad cells over G7 (♯11 ♭13 ♭7 ♭9), F/G triad pair over Dm7 then D♭/E♭ altered pair (G altered subset).
  - Minor: Locrian ♮2 E, A♭ → G into Cm, C harmonic-minor descent, B°7 = rootless G7♭9, G altered descent, C melodic minor ascent.
  - Blues: major-blues riff C E♭ E G A, G–G♯–A double approach into F7 on beat 1, ♭3 → 3 hammer.
  - Turnarounds: C♯°7 = A7♭9 rootless, E♭7 and D♭7 tritone subs.
  - Bebop: "The Lick", enclosure chain with B D F E on beats 1–4, bebop dominant with B G F D on the beats (tip now correct), Fmaj7 over G7 into an altered descent.
  - Modern: D/E/A minor pentatonics over Dm7, C & D triads = Lydian (F♯ = ♯11), altered run with B♭ = ♯9, Coltrane C – E♭7 – A♭maj7, E♭m7 side-slip.
  - Swing applies only to 8ths on the "&"; straight and triplet licks show Feel as fixed.
- Theory spot checks:
  - Harmonized triads with correct numerals in all 7 major modes, harmonic and melodic minor, and 8 melodic/harmonic-minor modes.
  - Jazz blues, rhythm changes A, Autumn-type cycle, Giant Steps (correct in C and B), Andalusian, minor plagal.
  - Barry Harris dim → B♭7, D♭7, E7, G7.
  - Bebop dominant and 6th-diminished scales with chord tones on the beats.
  - Pentatonic side-step.
- Zones: `tri-zone-cycle` and `fb-cycle-zone` stay inside every zone with all 12 keys on 4, 5 and 6 strings. `arp-zone-cycle` is complete on 5 and 6 strings.
- Home, Favorites, Library:
  - Stars on every card (34 px target, no overlap with any of the 169 titles) and in the exercise header.
  - Toast "Added to your favorites on Home".
  - Drag by the grip reorders and saves (`["rh-pulse","tech-alt-pluck","tech-1234"]` after moving the 3rd row to the top).
  - "Drag ⠿ to reorder" shows only with 2 or more favorites.
  - The empty state is clear.
  - No stale text about a Warm-up tab, `#/warmup` or Library topics anywhere in `web/`, the README or the docs.
- Layout: everything fits at 915x412. Left-handed mode now draws the strings across the whole board. Lick dot labels "♭13" and "♯11" fit inside the markers (16 px text in a 30 px marker). The tab strip has no overlapping text.
- New icon: a green glossy dot with a correctly oriented F clef; the maskable and adaptive versions are padded.
