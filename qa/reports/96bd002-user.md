# QA User report · 96bd002 · 2026-10-14

Setup: first QA run, so the whole app was reviewed, newest work first. Own `qauser` server (port 8890), own tab, empty profile (service worker unregistered, cache `bassclass-v1` deleted, localStorage cleared, `?qa=1` cache-buster). Phone landscape 780x360 (main size), plus 640x300, 915x412 and a 1024x768 tablet. 4-string by default; licks also built on 5-string. Personas: beginner (Home → Path L1 → first exercises → warm-up → Settings → tuner), advanced player (Options sheet, keys, All 12, levels), jazz teacher (all 33 licks note by note in C and in all 12 keys, plus every module's title, summary, about, tips and "Based on" text).
Method: the app's own modules (`/js/curriculum/index.js`, `/js/fretboard.js`, `/js/theory.js`) to build exercises and dump note names, degree labels, chord badges, string/fret and timing. Layout checked with `getBoundingClientRect()`.
Not testable here: actual sound (I cannot hear audio). Sound vs picture sync: the browser pane was hidden, so `requestAnimationFrame` was paused and the step display never moved during playback (the AudioContext was running). Microphone input to the tuner. Real touch scrolling.
Counts: Blocking 2 · Wrong 10 · Confusing 12 · Irritating 5 · Texts 11 · Visual 4, plus 4 questions.

## Blocking     (a user cannot do what the screen is for)

### B1. "Blues scales" has no blues scale. By default it plays C major.
- Where: Library → Scales → Blues scales (`sc-blues`, L2), Options sheet.
- What I saw: the Scale options are "Major (Ionian) / Natural minor (Aeolian) / Major pentatonic / Minor pentatonic", and the default is Major. The default build is `[C major] C D E F G A B C B A G F E D C`. Neither the blues scale nor the major blues scale can be selected. Meanwhile the title, summary ("Minor pentatonic + ♭5 (the 'blue note'), and the major blues scale") and the about text all describe the blues scale.
- Why it matters: it is an L2 path exercise, and a beginner who opens it practises a major scale while reading about the blue note.
- Evidence: `EXERCISES.find(e=>e.id==='sc-blues').params.type.options` gives the four basic scales. `docs/CATALOGUE.md` line 295 lists the same wrong options.
- Likely cause: `variant()` (`web/js/curriculum/common.js:45-54`) builds `params` from the base and spreads it after `...rest`, so a `params:` override in a variant is silently dropped. `scales.js:51` passes `typeP(['blues','majorBlues'])` and it is ignored. The same bug causes B2, W4 and C2 (all five affected variants are listed there).
- Suggestion: honour `over.params` in `variant()`.

### B2. "Chord-scale with altered dominants" plays the plain chord-scale. No altered dominant ever sounds.
- Where: Modes → Chord-scale with altered dominants (`md-altered-chord-scale`, L6).
- What I saw: the default is `{"prog":"ii-V-I"}`, which gives `[Dm7/Dorian] … [G7/Mixolydian] G F E D C B A G [Cmaj7/Major] …`. The Progression list is the plain chord-scale list (ii–V–I, turnaround, jazz blues…). None of the intended `ii-V7alt-I`, `ii-V7b9-I`, `ii-V7s5-I` or `ii-V7b5-I` is offered.
- Why it matters: the summary promises "ii – V7alt – I: altered, half-whole diminished, whole-tone and Lydian dominant over the V", but the screen is an exact duplicate of `md-chord-scale` (L4).
- Evidence: `modes.js:175` passes `params: { ...chordScale.params, prog: progP([...alt...]) }` and `variant()` discards it.

## Wrong        (incorrect musical or factual information)

### W1. Jazz licks with chromatic chord roots break in flat keys: wrong note spellings and nonsense labels
- Where: `lk-modern` "Coltrane major-3rd cycle" in D♭, E♭, G♭ and A♭. `lk-turnarounds` "Tritone-sub turnaround" in D♭, E♭, F, G♭, A♭ and B♭. With "All 12 · cycle of 4ths", about half of each loop is affected.
- What I saw (key D♭, Coltrane lick): `[D♭maj7] D♭ E♭ F A♭ | [E7] F♭(·) G♭(♭♭3) A♭(♭4) C♭(·) | [Amaj7] B♭♭(·) C♭(♭♭3) D♭(♭4) F♭(·) A♭(·) F♭(·)`. The chord badge says E7 and Amaj7, but the notes are spelled F♭/G♭/C♭/B𝄫 and labelled "·", "♭♭3" and "♭4" instead of R/9/3/5/7.
- Key D♭, tritone-sub turnaround: `[E7] E♭♭(·) C♭(·) A♭(♭4) F♭(·) | [E♭m7] … | [D7] G♭(♭4) E♭♭(·) B♭♭(·) G♭(♭4)`.
- C, A, B and the sharp keys are correct (for example key A: `[C7] B♭(♭7) G(5) E(3) C(R)`).
- Why it matters: in half the keys the teacher-facing labels, which are the whole point of the module ("every note is labelled against the chord"), are garbage.
- Likely cause: `licks.js:82-83` spells every note from the tonic (`T.up(tonic, iv)`), but chords given as semitone offsets (`[3,'dom7']`, `[1,'dom7']`, `[8,'maj7']`) are spelled with `bestRoot()`. The two spellings disagree, so `degOf()` gets an impossible interval.

### W2. Lick degree labels: the ♯9 of a dominant shows as "♭3", and outside notes show "·" or "♭4"
- B♭ over G7 is labelled "♭3", and coloured with the 3rd colour (`degKey('♭3')` = third). It occurs in `lk-ii-v-i` "Triad pairs, then altered triads", bar 2 (`B♭(♭3)` twice), and in `lk-modern` "Altered scale run" (`A♭(♭9) B♭(♭3) B(3) …`). Over an altered dominant this note is the ♯9. The app's own altered scale uses `labels: ['1','b9','#9','3',…]` (theory.js:104), so the two screens contradict each other. Same in `lk-modern` "16th-note arpeggio run" (E♭ over C7 shows "♭3").
- `lk-modern` "Side-slipping" (all 12 keys): in C, `D♭(·)` gets no label (a dot is drawn on the marker; screenshot confirmed on the fretboard and in the tab row "R ♭3 5 ♭7 · ♭13 ♭4 ♭9 …"), and G♭ is labelled "♭4". A diminished 4th label over Dm7 is meaningless to a player.
- `lk-bebop` "Enclosure chain on G7" (all 12 keys): `G♭(·)` gets no label.
- Cause: `degOf()` uses letter-based `ivBetween`, and `IV` has no diminished unison (`b1`), so it returns '?'. `TENSION` only maps `#2` to ♯9, never `b3`.

### W3. Text says chord tones land on the beat, but the approach notes are on the beat
- `tri-approach` (L5) about: "Chord tones land on the beat and approach notes fall between the beats." The build is uniform 8ths (`sub 2`) and starts `B(·) C(R) D♯(·) E(3) F♯(·) G(5)…`, so every approach note is on a beat and every target falls on the "&".
- `arp-approach` (L5) about: "Chord tones land on the beats and approach notes fill the off-beats." The build starts `E(·) F(♭3) G♯(·) A(5) B(·) C(♭7)…` in 8ths, so it has the same inversion. In "Enclosure" mode the 3-note cells drift across the beat.
- `lk-bebop` tip: "Enclosures: above, below, target. The target always falls on the beat." In "Enclosure chain on G7" every target (G, B, D, F) is the last 8th-note triplet of its beat (t = 0.67, 1.67, 2.67, 3.67), and the enclosing notes are on the beats. In "Chromatic approach to every chord tone" the targets C, E, G and B land on the "&" (t = 0.5, 1.5, 2.5, 3.5) with B, D♯, F♯ and A♯ on the beats.
- `lk-blues` "Chromatic double approach" also lands its target G on the "&" of 2 and the "&" of 4, with A♭ and F♯ on the beats.
- This is the core bebop rule the module teaches, so either the notes or the text must change.

### W4. "Harmonized triads in all scales & modes" does not offer the scales it promises
- Where: `tri-diatonic-modes` (L5).
- What I saw: the summary says "Melodic and harmonic minor modes, Phrygian dominant, Lydian dominant, altered…", and the about text discusses Lydian dominant, the altered scale and Phrygian dominant. The Scale options are only the 7 major modes plus harmonic and melodic minor (identical to `tri-diatonic`), and the default is Major (Ionian).
- Cause: same as B1 (`triads.js:402` passes `params: {…, scale: sel('Scale', SCALES_ALL7), 'lydianDom'}`, which is dropped). The exercise is a duplicate of `tri-diatonic` under a different name.

### W5. Triad-pair mode names are wrong or ambiguous
- Where: `tri-pairs` options and about.
- "♭II & I major (D♭ & C): Phrygian". The C triad brings E♮, so the six notes are C D♭ E F G A♭ (Phrygian dominant, as the harmonic-minor module itself calls it), not Phrygian (E♭).
- "IV & V major (F & G in C): Ionian/Lydian". F and G triads over C contain no F♯, so over C this is Ionian. It is "Lydian" only over F, which the label does not say.
- About: "F/G over C is Ionian/Lydian, D/C is Lydian, A♭/B♭ over Cm…". Slash notation ("F/G", "D/C") normally means a chord over a bass note, and the Upper-structures exercise uses exactly that meaning (D/C = D triad over C). Here it means "pair of F and G", so the two exercises contradict each other.

### W6. Settings says there are no samples, right under the recorded-bass setting
- Where: Settings, footer text.
- What I saw: "BassClass works offline once loaded. Sound is synthesized in the app (no samples)." The same screen shows "Bass sound: Recorded bass · Recorded: Karoryfer 'darkblack' 5-string bass (fingerstyle)." The README also describes the CC0 samples.

### W7. The chord-scale about text describes a line the exercise does not play
- `md-chord-scale` about: "Each chord gets its scale in 8th notes, starting from the chord tone nearest the last note so the line flows."
- Built: `[Dm7/Dorian] D E F G A B C D [G7/Mixolydian] G F E … [Cmaj7/Major] C D E …`. Every scale starts on the root (only its octave is chosen to be nearest).

### W8. "Modes of harmonic minor" shows melodic-minor tips and source
- `md-harmonic-modes` Focus points: "Altered scale = melodic minor a half step above the root (G altered = A♭ melodic minor)" and "Lydian dominant = melodic minor from the 5th…". Based on: "…Tony Grey (melodic minor modes)…". None of this is about harmonic minor, because the variant copied the base's tips and source.

### W9. "3rds alternate major and minor" is not true
- `iv-diatonic` tip: "Name the interval quality as you go: 3rds alternate major and minor." In a major scale the diatonic 3rds run M m m M M m m. The app says exactly that pattern elsewhere (`hm-chord-qualities`: "M m m M M m m").

### W10. "Only one note moves at a time" is not true for diminished → augmented
- `tri-four-types` tip: "Notice which finger moves when the quality changes: only one note moves at a time." The order is Major → minor → diminished → augmented. Going from C° (C E♭ G♭) to C+ (C E G♯) moves both the 3rd and the 5th.

## Confusing    (misleading, illogical, makes no sense)

### C1. Default subdivision is ignored in 72 exercises: everything starts in 8ths, contradicting the tips and pattern names
- Cause: `Builder.build()` always returns `sub: 2` (builder.js:155-160), and `exercise.js:178` uses `userSub ?? inst.sub ?? tpl.sub`, so the template's `sub` never wins. 72 uniform exercises play 8ths although their template asks for 1, 0.25, 0.5, 3 or 4.
- Examples where the text becomes false:
  - `fb-cycle-zone` (L2): the template says whole notes, and the tip says "One root per bar at 60 BPM". It plays 8ths, so all 12 roots go by in 1.5 bars.
  - `fb-quiz` (L2): the tip says "Start at 50 BPM, half notes". It plays 8ths, four times faster than intended, which is hard for a beginner.
  - `tech-ghost-16ths` (L3): the pattern "Note on every beat" is `D x x x D x x x…` in 8ths, so a real note sounds every 2 beats.
  - `tech-endurance` (L4): "Endurance 16ths on the roots" plays 8ths. `sc-odd-groupings` "Odd groupings in 16ths" also plays 8ths.
  - All triad exercises written for triplets (sub 3: `tri-diatonic`, `tri-inversions`, `tri-voice-led-cycle`, `tri-pairs`…) play 3-note groups in 8ths, so the chords cross the beat.
  - Beginner L1 drills (`fb-open-strings`, `fb-naturals`, `sc-one-octave`, `tri-shape`…), written as quarter notes, start in 8ths.
- Evidence: the full list comes from comparing `tpl.sub` with `inst.sub` for every exercise with default params.

### C2. "Pentatonic: the 5 positions" offers Position 6 and Position 7
- `sc-pent-positions` options: "All positions (up the neck) / Position 1 … Position 7". Position 6 builds exactly `[Pos 1/C min. pent] F G B♭ C E♭ F …`, the same as Position 1 (index mod 5). The intended 5-position list (`scales.js:281`) is dropped by `variant()` (see B1).

### C3. Approach notes are labelled three different ways in three modules
- Walking bass labels them "↗"/"↘". Triad and arpeggio approach exercises label them "·" (`tri-approach`: `B(·) C(R) D♯(·)…`). Licks label them as tensions: "Chromatic approach to every chord tone" shows `D♯(♯9) F♯(♯11) A♯(♯6)` over Cmaj7, and "Enclosure into the 3rd" shows `D♯(♯5)` over G7.
- "♯6" is not a label a player recognises, and calling a passing note "♯9" or "♯11" suggests a chord tension that is not there.

### C4. Key chip and played key disagree for minor scales
- `tri-diatonic` with Scale = Natural minor: the "D♭" chip plays C♯ minor (`C♯m/i D♯°/ii° E/♭III F♯m/iv …`), "G♭" plays F♯ minor and "A♭" plays G♯ minor. The Options summary still says "D♭ · Natural minor (Aeolian)", because the key chips are spelled for a major triad (`keyP()` default ivs). Other modes (Dorian…) behave the same way.

### C5. "Minor walking" promises altered dominants and offers major progressions
- `wk-minor` summary: "…with half-diminished and altered dominant chords". The default minor ii–V–i uses a plain `C7` (badge "C7"), with no altered chord. The Progression list also offers ii–V–I, the turnaround, the jazz blues and rhythm changes (all major), so a user can turn "Minor walking" into a major-key walk.

### C6. The blues licks summary promises a lick that does not exist
- `lk-blues` card, header and catalogue: "Blues-scale riffs, the ♭3→3 'blue' slide, chromatic approaches and a walking-solo fill." There are 4 licks (Blues-scale riff to the IV, Blue-note triplet fill, Chromatic double approach, Blue third) and no walking-solo fill. There is also only one "blues-scale riff", and it uses the major blues notes C E♭ E G A.

### C7. Teacher note: "Bebop scale descent" bar 1 does not outline Dm7
- `lk-ii-v-i` lick 5, bar 1 over Dm7: `F E D C B A G♯ A`. The notes on the beats are F, D, B (13) and G♯ (labelled ♯11). F D B G♯ is a B°7 (E7♭9), an A harmonic-minor sound, not a Dm7 bebop line.
- Bar 2 (G bebop dominant G F♯ F E D C B A, with G F D B on the beats) is correct. The template's about text ("descend the bebop scale so chord tones land on the beats") is only half true for this lick.
- In the same module, "Guide tones with triplets" shows the "♭7 falls a half step to the next 3rd" move only for G7 → Cmaj7 (F → E). Dm7 → G7 goes A → B. (Opinion.)

### C8. "Pedal-point fill" is not playable in one position at tempo
- `lk-bass-solo` lick 3 in C: the pedal C is on the E string at fret 8, alternating every 8th note (116 BPM, swing) with E (G string fret 9), G (fret 12) and B (fret 16), an 8-fret reach. In F the pedal is on E string fret 1 against G-string frets 2–9.
- The tip only says "needs string skipping: mute the strings in between", which suggests one hand position. Either the upper voice needs to come down an octave, or the tip needs to mention the shifts.

### C9. Landmark tip uses "above" in the opposite sense to the tip before it
- `fb-landmarks` tips: "Fret 5 is always the next string's open note" (the next string means the higher-pitched one) and "Fret 7 gives the open note of the string above it, one octave up". This is only true for the thicker, lower-pitched string (A string fret 7 = E). Read the same way as the first tip, it is false (E string fret 7 = B, not A), and on the E string there is no "string above".

### C10. The subdivision selector is disabled in licks and grooves with no explanation, while the drawer says to change it
- In any lick the selector shows "♪ 2/beat", greyed out (`subSel.disabled = !inst.uniform`), and nothing tells the user why. The info drawer's generic "How to practise it" still says "Change the subdivision (♩ → 8ths → triplets → 16ths)".

### C11. "Feel: Swing 8ths" stays selected on licks it cannot affect
- "Pentatonic superimposition" and "16th-note arpeggio run" are forced straight (`feel: 'straight'`), and the all-triplet licks (Triad pairs C & D, Enclosure chain, Triplet turnaround) cannot swing. The chip still shows "Swing 8ths" as active. Only the drawer's tip mentions the 16th-note case.

### C12. The Options summary and warm-up list show bare values without labels
- Open strings: the header button reads "OPTIONS · TAP TO CHANGE / 4". A beginner cannot tell that "4" means "Notes per string: 4".
- Alternate plucking: "Index (i) · 8". The warm-up list shows "Fretboard: Open strings / 4" in the same way.

## Irritating   (works, but annoys or slows the user)

### I1. Footer controls are off-screen on phones narrower than about 880 px
- At 780x360 the control bar is 879 px wide in a 780 px viewport. "Step/Shape/Quiz" is half cut, and the label toggle (Note/Deg/Fing) and "Mark as mastered" are fully off-screen (right edges at 829 and 871).
- At 640x300, Metronome, Sound, Speed trainer, Reveal, Labels and Mastered are all hidden.
- The bar does scroll horizontally (`overflow-x: auto`), but there is no hint, and on a phone the scrollbar is invisible. At 915x412 everything fits.

### I2. Library search suggests "ii-V", but titles use an en dash
- The placeholder reads `Search exercises… (e.g. "triad", "ii-V", "slap")`. Typing "ii-V" finds only 2 exercises (`tri-diatonic-4ths`, `arp-rhythm-changes`), because titles and summaries use "ii–V". "ii–V" finds 12, including "ii–V–I arpeggios in all keys" and "Jazz licks: major ii–V–I".

### I3. The Options sheet covers the whole board, so "Changes apply instantly" cannot be seen
- The sheet fills the screen at 780x360. You only see the result of a chip after pressing Done, so trying several keys or licks takes a lot of open/close. (Opinion.)

### I4. Awkward fingering in the "Coltrane major-3rd cycle" lick
- In C: `C(R) A15 · D D12 · E D14 · G G12 | E♭ D13 · F D15 · G G12 · B♭ G15 | A♭ D6 · B♭ D8 · C G5 · E♭ G8 · G G12 · E♭ D13`. It starts on the A string at fret 15 (C3 is available at D10 or G5), drops to frets 5–8, then jumps back to 12–13: three big shifts in two bars at 96 BPM.

### I5. Warm-up: no "1 of 6" indicator, and L1 items in an L3 routine
- Inside a warm-up exercise the header only has "Next ›", with no position in the routine.
- The default L3 routine served "Alternate plucking" (L1) and "Open strings" (L1). The pool includes `level - 2`, which is very easy for the target level. (Opinion.)

## Texts        (typos, unclear wording, inconsistent names)

- T1. Minor ii–V–i licks: the summary says "Dm7♭5 – G7♭9 – Cm6", but the chord badge shows "G7". The key chips and header say "C", not "Cm"/"C minor".
- T2. `lk-bebop` tip: "check that the chord tones (G, F, D, B) land on beats 1-2-3-4". In "Bebop dominant scale from the 3rd" they land as B, G, F, D.
- T3. Copy-pasted "Based on" lines and tips:
  - `tri-sus-quartal`'s summary cites McCoy Tyner, but its source is the generic "Berklee PULSE, Berklee Online Bass 101, StudyBass Fundamentals 3, Ariane Cap" shared by all 7 harmonized-triad variants.
  - `sc-minor-family`, `sc-odd-groupings` and `sc-alternating-all-keys` all cite "TalkingBass Cyborg Bassist (1-2-3-1 etudes)".
  - `sc-pent-positions` repeats "Then play the same positions in a minor key" although its default is already minor pentatonic.
  - `tri-shape` (L1 "major & minor") explains diminished, augmented and sus, which it does not offer.
- T4. `tri-diatonic-all-keys`: "3 inversions × 4 scales × 12 keys", but the Scale option lists 9 scales.
- T5. `tri-cycle-all-inversions` source: "LCM/ES all-inversions requirements". "ES" is not explained.
- T6. `tech-endurance` tip: "try three fingers (r-m-i)". Elsewhere the app uses classical p-i-m naming, where the ring finger is "a".
- T7. "Odd-meter grooves: 5/4, 7/8, 7/4, 6/8": 6/8 is a compound meter, not an odd one.
- T8. Naming: the rail says "Neck", the page title says "Fretboard explorer". The README still says "Elegant fretboard. Ebony board…" (and fretboardView.js's header comment says "ebony board"), which contradicts the navy design.
- T9. The chord-order option "In 4ths (I-IV-vii-iii-vi-ii-V-I)" lacks the ° that the exercise title "(I-IV-vii°-iii-vi-ii-V-I)" has. "Paradiddle (R L R R  L R L L)" has a double space.
- T10. The chord-scale badge text says "Major" for Cmaj7, while the about text says "maj7 → Ionian".
- T11. Double accidentals are drawn as two glyphs, "♭♭"/"♯♯", inside the small markers, for example `B♭♭` (♭9 of A♭7, ii–V–I in D♭), `F♯♯` (leading tone, minor licks in G♯ minor) and `C♯♯` (enclosure in B). The spelling is correct, but the single-glyph 𝄫/𝄪 would read better.

## Visual

- V1. The next-note arc is clipped at the top of the board when the line moves along the top (G) string. At 640x300 the arc's bounding box starts at y=62 while the fretboard SVG starts at y=72 with `overflow: hidden` (path `M186.9,19.1 Q269.3,-38.9 351.8,19.1`, viewBox `0 0 628 117`). The top of the dotted arc is cut off (seen in the Triads-zone exercise, F chord 3 → 5 on the G string). The arc always bends upward, so it leaves the board on the top string.
- V2. Rail at 780x360 on first load: the nav is 345 px tall with `scrollHeight` 374, and "Settings" spans y 320–366, so its label is cut. A vertical and a tiny horizontal scrollbar appear in the rail. On a later load the rail fitted without the logo row, so the behaviour is inconsistent.
- V3. Home: the three stat cards are 90 x 272 px each (169 / 0 / 0), tall boxes with the number at the top and a lot of empty space. (Opinion.)
- V4. Tablet 1024x768: the fretboard becomes 1012 x 567 px for 4 strings (about 130 px between strings), while the tab strip is a 67 px band with 11 px text. The neck looks stretched, and the tab is hard to read. (Opinion.)

## Questions for the owner

- Q1. Licks label notes strictly against the chord. Should chromatic and out notes be spelled and labelled the jazz way: ♯9 over V7 instead of ♭3, an arrow or "app." for approach notes like the walking module, and no "♭4"/"♯6"?
- Q2. Is it intended that every exercise starts in 8ths (C1)? If so, about ten tips and pattern names need rewriting. If not, `inst.sub` should not mask `tpl.sub`.
- Q3. Pentatonic and major "Position 1" is the first box from the nut (C minor pentatonic Position 1 starts on F, the 4th), not the root-position "Box 1" most methods use. Is that intended?
- Q4. Level order: the L1 path puts five note-naming drills before "Alternate plucking" and "Steady pulse". Also, "Jazz licks: bass solo devices" (L5) uses triplet skips, while "Walking with triplet skips" is L6. Is that intended?

## Checked and fine

- All 33 licks fill their progressions exactly. Transposition keeps them on the neck, and they respect "Highest fret used": with 17 frets, no note in any lick or key goes above fret 17 (4- and 5-string).
- In C (and in sharp keys) the licks outline and resolve correctly:
  - Major ii–V–I: Dm7 arpeggio + 9, B°7 = G7♭9, B → C, F → E, A♭ → G; D♯/F enclosure of E; 1-2-3-5 cells on D, F, G and D♭; F/G triad pair over Dm7; D♭/E♭ altered triad pair over G7.
  - Minor ii–V–i: E♮ = Locrian ♮2, A♭ → G "signature move", C harmonic minor descent from B, B°7 over G7, G altered subset, C melodic minor on Cm6.
  - Blues: the ♭3 → 3 hammer, C7 → F7 voice leading E → E♭.
  - Turnarounds: C♯°7 = rootless A7♭9 resolving B♭ → A, and the tritone subs E♭7 and D♭7.
  - Bebop: "The Lick" cliché; enclosure spellings A–F♯–G / C–A♯–B / E♭–C♯–D / G♭–E–F; G bebop dominant with G F D B on the beats; D♭ triad over G7.
  - Modern: D/E/A minor pentatonic over Dm7, the C & D triad pair = C Lydian (F♯ = ♯11), G altered A♭ B♭ B D♭ E♭ F, C – E♭7 – A♭maj7 Coltrane move, E♭m7 side-slip and back.
- Lick texts verified: the C♯ "that pulls" in A7, A♭ → G, Barry Harris "dominant from a diminished", tritone subs, "The Lick" credited as a traditional cliché.
- Options sheet: discoverable button ("OPTIONS · TAP TO CHANGE" plus a summary), labelled chip groups, the Done button, and it scrolls with 7 groups at 780x360.
- Theory facts that check out:
  - Fretboard and intervals: landmark notes on all strings; octave and unison shapes; P5/M3 interval shapes; natural harmonics 12/7/5/4; 10ths (same fret = minor, +1 = major).
  - Scales and modes: parallel-mode order Lydian → Locrian with the one changed note; melodic-minor tips (G altered = A♭ melodic minor, G7♯11 = D melodic minor); Barry Harris 6th-diminished scale.
  - Triads: harmonized triads in natural, harmonic and melodic minor; triad-fingering tips.
  - 7th chords: the five 7th chords lowering one note at a time; Barry Harris dim7 → B♭7, D♭7, E7, G7; C♯°7 = A7♭9; Em7 over Cmaj7 = Cmaj9; maj7 fingering tips.
  - Upper structures: A/C7 = 13♭9, A♭/C7 = 7♯5♯9, G♭/C7 = 7♭9♯11, B♭/Cm = Cm11.
  - Progressions and forms: jazz blues, rhythm changes A, Giant Steps (default key B, tonics B G E♭), 12-bar form; shell-voicing fret rules.
  - Rhythm: groups of 3/5/7 return after 3/5/7 bars, 15 cells in the 16th grid, Take Five 5/4 and Money 7/4.
- Tuner (780x360): fits; ♭ on the left and ♯ on the right; reference frequencies E1 41.2, A1 55.0, D2 73.4, G2 98.0 Hz correct; status messages clear ("Flat: tighten slightly ↑").
- Settings: Strings, Note names, Handedness, Highest fret, Bass sound (shows the Karoryfer sample name) and Small speaker boost explanation are clear (except the footer, W6). Solfege chord names read correctly (Rem7♭5, Sol7, Dom6).
- Fretboard look: navy board, gauge-scaled strings, glossy markers, root as a rounded square, dashed "next" ring, zone rectangle, matching colour legend in the drawer, and a tab strip whose chord row matches the badges (C F B♭ E♭ A♭ D♭ G♭ in the zone exercise).
- Explorer fits at 780x360 (selects and board measured inside the viewport).
