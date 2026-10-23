# QA User report · 70c3e4e · 2026-10-23

Setup: round 16, a full pass with extra weight on what changed since round 15 (77c1e47): the shared picker (drum patterns and progressions), the Harmony block (louder pad above the bass, bar lines in every metre, minor keys, the 12-key cycles), the Neck's Chord | Scale | Off, My progression with its Degree / Chord / Length editor and ✎ Edit, Speed up's switch, the click volume under Click, and Home's My level tile and 7-day strip.

- **Code tested:** HEAD 70c3e4e, app files unchanged during the run (the deep QA's untracked `qa/tools/*16.js` only).
- **Server and tab:** my own `qauser` server (port 8890) and its tab (`tab-6`). I did not touch the `seed` tab or ports 8765 / 8878.
- **Profile:** empty at the start (service worker unregistered, `bassclass-v1` cache and localStorage cleared, loaded with `?qa=u16a`). Later I seeded my tab's practice log (today 12.4′, then 34, 22, 0.7, 0, 47, 75′ and older days) and answered the placement with "All yes" up to Stage 4 (L5).
- **Sizes:** 800x380 (main), 640x360, 915x412, 1024x768; layout confirmed with `getBoundingClientRect` (the pane's screenshots render at odd scales). 4-string bass, C D E and Do Re Mi.
- **Personas:** beginner (Home, Course → Lesson 1.1 and its step, the player and its menu, Settings, tuner), advanced player (placement to L5, the room: drums, harmony, Neck, My progression, Speed up), jazz teacher (every preset progression in all 12 keys with the scale the Neck names for each chord, My progression's 12 degrees × 23 chord types in all keys, spellings, numerals).
- **Method:** real clicks on Start/Stop, Change, cards, stars, the editor and the Neck switch; real Escape key; the room's own modules (`practice/harmony.js` `progression()`, `mineFrom()`, `curriculum/common.js` `modeFor()`, `theory.js`) to read every chord and scale; while the room played (real Start) I sampled the Neck's info line every 50–100 ms.
- **Not testable here:** the sound itself (pad loudness and register on a phone speaker, the drum rebalance, the brushes), touch gestures on a real phone, the Android app.
- **Screenshots** are in `C:\Users\OscarGaya\.claude\projects\E--CLAUDE-BassClass\c7f026a2-fcf4-440e-b62e-e6df46b13395\tool-results\`, shortened to `…\` below.

Counts: Blocking 0 · Wrong 3 · Confusing 5 · Irritating 3 · Texts 4 · Visual 2, plus 4 questions.

## Expert verdict (short)

The shared picker is good: it opens on the current group, the search finds what a player types ("brush", "7/8", "clave", "bembe", "hip hop", "12/8"), ★ and Recent appear when they hold something, and Back, Escape, ✕ and a tap outside all close it without leaving the room or stopping the music. Last round's W1 is fixed: every preset keeps its bar lines in every metre and every odd-metre pattern's groups (I checked them all). Every preset progression is right, in all 12 keys, and the scale the Neck names for each of their chords is the textbook one (with one teacher's question, Q1).

What weighs most:
- **The Neck spells altered dominants, diminished chords and the symmetric and altered scales against the app's own rules**, even in the default key: the jazz blues in A shows "D♯ – E♯ – F♯ – G♯ – A – B – B♯ – C♯♯" for the D♯°7 bar; A♭7♭9 shows B♭♭; E7♯9 shows F♯♯; the altered scale labels the chord's 3rd ♭4.
- **My progression's Scale view is wrong for common chords:** a major triad on II, III, VI or VII (a secondary dominant) gets Ionian (A major before Dm: G♯, C♯, F♯); a copied minor progression's ♭VII gets Lydian (C♯ and F♯ over Am – G – F – E).
- **✎ Edit silently replaces the player's own progression**, with no question and no undo.
- **The Neck's line reads as the wrong chord's notes:** "🎹 A7 → D7: A – C♯ – E – G".

## Blocking     (a user cannot do what the screen is for)

None found.

## Wrong        (incorrect musical or factual information)

### W1. The Neck spells altered dominants, °7 chords and symmetric/altered scales against the house rules (also in the default key)
- **Where:** Practice room → Neck, following the Harmony (Chord or Scale), and the Neck's own scale picker.
- **What I saw** (info line sampled while the room played, plus the dots with "Note names"):
  - **Jazz blues in A** (the room's default key), bar 6, Scale: `🎹 D♯°7 · Diminished whole-half → A7: D♯ – E♯ – F♯ – G♯ – A – B – B♯ – C♯♯`. B and B♯ both, C𝄪 for D. Same in D (`G♯ A♯ B C♯ D E E♯ F♯♯`) and E (`A♯ B♯ C♯ D♯ E F♯ F♯♯ G♯♯`).
  - **Jazz blues in G♭**, Chord: `🎹 C°7 → G♭7: C – E♭ – G♭ – B♭♭`. In B: F°7 = `F A♭ C♭ E♭♭`.
  - **My progression in D♭, V7♭9**, Chord: `🎹 A♭7♭9 → B: A♭ – C – E♭ – G♭ – B♭♭`. The open A string is labelled "B♭♭" (`…\mcp-Claude_Browser-blob-1792768157210-g063ih.jpg`).
  - **E7alt**, Chord: `E – G♯ – D – F♯♯ – C`. **E7♯9** (the Hendrix chord) has the same F♯♯. Also C♯7♯11 has F♯♯, D♭7alt has B♭♭, and G♭7♭9 has A♭♭.
  - **E7alt**, Scale: `🎹 E7alt · Altered (super Locrian) → G: E – F – G – A♭ – B♭ – C – D`, with the degree dots `R ♭2 ♭3 ♭4 ♭5 ♭6 ♭7` (`…\mcp-Claude_Browser-blob-1792768109845-9hjwr8.jpg`). The chord's own 3rd (G♯, shown as G♯ in Chord mode) becomes A♭ "♭4".
  - **The Neck's own picker** has the same spellings:
    - Diminished half-whole on E: `E F F♯♯ G♯ A♯ B C♯ D`; on D♭: `D♭ E♭♭ E F G A♭ B♭ C♭`.
    - Whole tone on B: `B C♯ D♯ E♯ F♯♯ A`.
    - Altered on F: `F G♭ A♭ B♭♭ C♭ D♭ E♭`.
  - **A passing diminished entered in My progression** (I – ♭II°7 – ii7, the only way to enter C♯°7) reads `D♭°7` = `D♭ F♭ A♭♭ C♭♭`. Its scale is `D♭ E♭ F♭ G♭ A♭♭ B♭♭ B♭ C`.
- **Why it matters:** CLAUDE.md's spelling rules say:
  - jazz contexts write °7s and alterations plainly ("A♭7♭9: A; C°7: C E♭ G♭ A");
  - scales without one note per letter are spelled plainly ("no double accidentals, no C♭/F♭/E♯/B♯");
  - the altered scale is written "R ♭9 ♯9 3 ♭5 ♭13 ♭7 everywhere it stands alone".

  A teacher reading "B♭♭" on an open A string, or a ♭4 for the 3rd of E7alt, will call it wrong. A player will not find "C♯♯" on the neck.
- **Suggestion:** in the room, spell the following Neck with the jazz rules of `Builder(…, { jazz: true })`: plain °7s and alterations, plain symmetric scales, and the altered scale as R ♭9 ♯9 3 ♭5 ♭13 ♭7. Use the plain rule for the Neck's own symmetric and altered scales too.

### W2. Scale view: a major triad on II, III, VI or VII (a secondary dominant) gets Ionian
- **Where:** Practice → Harmony → My progression → Neck → Scale.
- **What I saw** (the room's own `showChord` logic, run over every degree × chord type):

  | Progression | Chord | Neck's scale | Notes shown |
  |---|---|---|---|
  | I – VI – ii – V in C | A (VI) → Dm | Major (Ionian) | A B C♯ D E F♯ G♯ |
  | G B C Cm (I – III – IV – iv) | B (III) | Major (Ionian) | B C♯ D♯ E F♯ G♯ A♯ |
  | D E A D (I – II – V – I) | E (II) | Major (Ionian) | E F♯ G♯ A B C♯ D♯ |

  The same chord as a 7th gets the right scale: **A7 (VI7) → Dm7 is "Phrygian dominant"** and II7 → V7 is Mixolydian. Only the triad (and its 6th and sus2) goes through the "non-dominant major → maj7" path.
- **Why it matters:**
  - These triads are everyday pop and rock harmony (I – VI – ii – V, I – III – IV, I – II – IV). The player can build them in seconds with the "maj" button, and ✎ Edit makes pop presets triads.
  - Ionian puts a major 7th (G♯ over A, A♯ over B) against the key and against the chord that follows.
  - CLAUDE.md describes triads as taking "the key's 7th chord on that degree", which does not describe this result either.
- **Suggestion:** treat a major triad (6th, sus2) on II, III, VI or VII as the dominant it is: Mixolydian, or Phrygian dominant when the next chord is minor a 5th below. That is the same as its 7th-chord form.

### W3. ✎ Edit changes the scales (and spellings) of the very chords it copies
- **Where:** Practice → Harmony → a preset → ✎ Edit, then Neck → Scale.
- **What I saw:** My progression has no key quality (always major) and no local keys, so a copied minor or cycle progression is re-read in a major key:

  | Preset | Before ✎ Edit | After ✎ Edit |
  |---|---|---|
  | Andalusian (Am) | Am: Natural minor (Aeolian)<br>G: Mixolydian | Am: Dorian<br>G: Lydian = `G – A – B – C♯ – D – E – F♯` |
  | i – ♭VI – ♭III – ♭VII (Am) | ♭VII (G): Mixolydian | Lydian |
  | i – iv – v – i | Em (v): Phrygian | Dorian |
  | Minor blues | i: Aeolian | i: Dorian |
  | ii – V – I in all 12 keys (Key A) | each local I (Dmaj7, Gmaj7, Cmaj7, Fmaj7): Ionian | Lydian |

  - Evidence for the Andalusian: info line before, `🎹 Am · Natural minor (Aeolian) → G`; after, `🎹 Am · Dorian → G`. While playing, chord 2 read `🎹 G · Lydian → F: G – A – B – C♯ – D – E – F♯`. The Key menu changed from "Am" to "A". Screenshots: `…\mcp-Claude_Browser-blob-1792768068534-4cv7hj.jpg` (before), `…\mcp-Claude_Browser-blob-1792768074033-frygjl.jpg` (after).
  - Spellings change too:
    - The minor blues in G♯m is renamed with flats: G♯m7 → A♭m7, C♯m7 → D♭m7, D♯7 → E♭7. That breaks the "minor-type chords on black keys with sharps" rule.
    - The cycle in A♭ gets "D♭m7 – G♭7 – Bmaj7" for C♯m7 – F♯7 – Bmaj7, so the V7 is misspelt for its I.
- **Why it matters:** the same four chords show different scales depending on whether they are the preset or "your copy". C♯ and F♯ over an A-minor Andalusian is simply wrong.
- **Suggestion:** let My progression keep a key quality (major or minor, set by the copy and switchable), and keep a copied chord's local key (or its scale) with it.

## Confusing    (misleading, illogical, makes no sense)

### C1. The Neck's line reads as the next chord's notes
- **Where:** Practice → Neck info line while following (Chord or Scale).
- **What I saw:**
  - `🎹 A7 → D7: A – C♯ – E – G`
  - `🎹 G♭7 → B7: G♭ – B♭ – D♭ – F♭`
  - `🎹 A♭7♭9 → B: A♭ – C – E♭ – G♭ – B♭♭`

  The colon follows the next chord, so the line reads "D7: A – C♯ – E – G".
- **Why it matters:** the next change was added for reading ahead, and here it makes the line name the wrong chord's notes.
- **Suggestion:** `🎹 A7: A – C♯ – E – G   ·   next D7` (or "A7 (A C♯ E G) → D7").

### C2. ✎ Edit replaces My progression without asking, and cannot be undone
- **Where:** Practice → Harmony → any preset → ✎ Edit.
- **What I did:** I tapped E7's slot in My progression, set it to 2 bars, opened the picker and chose the Andalusian, then tapped ✎ Edit.
- **What I saw:** My progression became `Am G F E`. The 4-chord I – vi – ii – V with my 2-bar E7 is gone: `myProg` in storage holds only the copy. The toast says "Copied into My progression: tap a chord to change it". The only warning, "Copy it into My progression to change it", is a hover `title` that never shows on a phone.
- **Why it matters:** there is one My progression, and it can hold up to 16 chords of the player's work. "Edit" next to a preset reads as "edit this preset", not "overwrite yours".
- **Suggestion:** ask first when My progression differs from the default ("Replace your progression (4 chords)?"), or offer Undo in the toast.

### C3. Speed up does nothing when the tempo is already at or above "Up to", and says nothing
- **Where:** Practice → Metronome → Speed up On, with a fast drum pattern.
- **What I saw:**
  - With 7/8 (2 + 2 + 3) at its own 220 BPM, Speed up On reads "Add +2 BPM · Every 4 bars · Up to 200 BPM".
  - I played it for 12 s, more than 6 bars. The tempo stayed at 220 and nothing told me why (`engine.js`: `this.bpm < upTo`).
  - Seven patterns start at or above the default ceiling: Up-tempo swing 240, Bebop 200, 5/8 220, both 7/8s 220, 9/8 260 and 11/8 240.
  - The x/8 patterns count 8th notes, so their "BPM" is double the quarter: a 200 ceiling there means ♩ = 100.
- **Suggestion:** when Speed up is switched on (or a pattern picked) above the ceiling, raise "Up to" to the tempo plus a margin, or show "Already at the ceiling" under it.

### C4. Over a drone, the key and the Neck name the root two ways
- **Where:** Practice → Harmony → Drone, Key D♭, Neck → Scale with a minor mode.
- **What I saw:** the harmony bar reads "Drone on D♭" and the Key menu "D♭", while the Neck line reads "C♯ Natural minor (Aeolian): C♯ – D♯ – E…" (also C♯ Dorian, Phrygian, Locrian, minor pentatonic and blues).
- **Why it matters:** this is the same split as round 15's C1, now fixed for minor progressions but not for the drone. The drone is exactly what players use for minor modes.
- **Suggestion:** name the drone (tag and Key menu) after the scale the Neck shows (C♯ when the scale is minor-type), as the minor progressions now do.

### C5. In chords, the 9th and 13th are labelled "2" and "6", while ♭9, ♯9, ♯11 and ♭13 keep their names
- **Where:** Practice → Neck → Chord, with a 9th or 13th chord (My progression; also the Neck's own "Chord · Dominant 9th / Major 9th / Minor 9th").
- **What I saw:** A♭13 shows dots `R 3 5 ♭7 2 6` (`…\mcp-Claude_Browser-blob-1792768501638-b9g60r.jpg`). A♭7♭9 shows `♭9`, and E7alt shows `♯9 ♭13`. In `neck.js` the labels of 9, 11 and 13 are mapped to 2, 4 and 6 for every set, chords included.
- **Why it matters:** in a chord, "6" means an added 6th (C6). A 13th chord labelled with a 6 and a 2 teaches the wrong name for its tensions, and the altered tensions use the other convention on the same board.
- **Suggestion:** keep 2, 4 and 6 for scales; label chord tensions 9, 11 and 13.

## Irritating   (works, but annoys or slows the user)

### I1. The picker jumps up and down while you type
- **Where:** the shared picker, search field (800x380).
- **What I saw:**
  - The panel is centred vertically (`align-items: center`), so its height follows the number of results and the search field moves under the finger while typing.
  - Field top by query: 89 px with no query, 59 for "b", 140 for "brush", 156 for "brushz" (no match) and 147 for "bossa".
  - A 97 px swing. Compare `…\mcp-Claude_Browser-blob-1792767657248-9xxrp7.jpg` (opened) with `…\mcp-Claude_Browser-blob-1792767664711-sbbp63.jpg` (after "brush").
- **Suggestion:** anchor the panel to the top (or give it a fixed height) so the search stays put.

### I2. My progression's editor buttons are small and close together
- **Where:** Practice → Harmony → My progression → a slot.
- **What I saw:** at 640x360 the Degree, Chord and Length buttons are 30 px tall, and many are 20–29 px wide: "I" 20, "1" 21, "°" 21, "7" 23, "II" 24, "6" 23, "9" 23. They sit edge to edge in a 13 px font, so I, ♭II and II are hard to hit with a thumb. The app's own ⓘ buttons are 32 px.
- **Suggestion:** at least 36–40 px wide targets (padding), or two rows for the degrees.

### I3. The slot editor's "Done" opens under the floating Start
- **Where:** Practice → Harmony → My progression, at 800x380 with Start in its default place. Open a slot from the Harmony block's first screen.
- **What I saw:** "Done" (686–745 × 346–380) lies entirely under Start (672–788 × 324–370). `elementFromPoint` at Done's centre returns the Start button, so a tap on "Done" starts the room. Screenshot: `…\mcp-Claude_Browser-blob-1792768052319-e4ydn9.jpg`.
- **Why it matters:** this is a new instance of round 15's V1, on a control the player reaches for every time they finish editing a chord.
- **Suggestion:** put Done (and Remove) at the left of the editor, or close the editor with a second tap on the slot (that already works) and drop Done.

## Texts        (typos, unclear wording, inconsistent names)

### T1. Progression lines repeat what the name or group already says
- **What I saw:**
  - The Andalusian's line under its name: "**Minor** · 4 bars · **minor**".
  - In the picker:
    - "One-chord minor vamp **(4 bars)** · **4 bars** · minor";
    - "**Minor** ii – V – i · 4 bars · **minor**";
    - every card in the Minor group says "· minor".
- **Suggestion:** apply the drum cards' rule (round 15): leave out a word the name or the group already says.

### T2. Three notations for the half-diminished chord on one panel
- **What I saw:** the Chord button reads "ø7", the slot and chip read "Bm7♭5", and the numeral reads "viiø". The °7 button gives "B°7" and "vii°7".
- **Suggestion:** pick one ("ø7" on the button and "Bø7" on the chips, or "m7♭5" everywhere), and write the numeral "viiø7" like the other 7th chords ("ii7", "V7").

### T3. The Neck switch's "Off" does not say what it shows
- **What I saw:** Chord | Scale | **Off**. "Off" shows the player's own scale or chord picker, not an empty neck. The Neck's ⓘ explains Chord and Scale but not Off.
- **Suggestion:** "Mine" or "Free", or add "Off: your own scale or chord" to the ⓘ.

### T4. README: the count-in and a missing comma
- **What I saw:** README "Practice room" says "muted bars (… while you keep the time) speed up (…)", which is missing a comma before "speed up". It also says "and, with the drums, a bar of count-in", but since round 15 the count-in also comes with the harmony alone.

## Visual

### V1. A new player's Home shows 3 days next to "Last 7 days" at 640 px, and the ⓘ overlaps today's bar
- **Where:** Home, empty log (a brand-new player).
- **What I saw:**
  - The long line "Play an exercise or the Practice room to start" takes the width, so the strip shows 3 whole days at 640x360 (Wed–Fri) and 5 at 800x380 (Mon–Fri). The card's ⓘ (501–533 px) overlaps today's bar (489–509) and the strip's end (511) at 640. Screenshot: `…\mcp-Claude_Browser-blob-1792768262098-8ca6vp.jpg`.
  - With a logged week, all 7 days are in view at 640 and 800 px (the round-15 fix works).
- **Suggestion:** wrap the new-player line onto two lines, or shorten it ("Play anything to start").

### V2. With the drums Off, the pattern line and its Change look disabled
- **What I saw:** the whole line is at 60% opacity (`.drums.off`). It still opens the picker, and a pick turns the drums On, which is useful. But it looks like a greyed control.
- **Suggestion:** keep "Change" at full strength while the drums are off.

## Questions for the owner

1. **Non-resolving dominants (chord-scale).**
   - The minor blues' ♭VI7, a backdoor ♭VII7 and a tritone-sub ♭II7 all show **Mixolydian**, following the "other chords by quality" decision. Berklee chord-scale theory gives them **Lydian ♭7**.
   - Example: in C minor, A♭ Mixolydian puts D♭ where the key has D; D♭ Mixolydian puts G♭ before the I.
   - Keep Mixolydian, or use Lydian dominant for dominants that do not resolve down a 5th?
2. **Tensions vs the scale ("9ths and 13ths take their 7th's").**
   - A9 or A13 before Dm shows Phrygian dominant (B♭, F) against the chord's own 9th B and 13th F♯.
   - Em9 as iii shows Phrygian (F) against its own F♯.
   - Any 7♯9 shows the altered scale, which has no perfect 5th, while the chord, as Chord mode shows it, has one (E7♯9: B).
   - Should a chord that names its tensions get a scale that contains them (Mixolydian, Dorian, half-whole diminished)?
3. **Rhythm changes' iv** (follow-up to round 15's Q4).
   - In D♭ the iv stays **G♭m7**, which holds B♭♭. In G♭ the iv is renamed **Bm7** after C♭maj7.
   - The rule "a chord that would need a double accidental takes its lead-sheet name" is only applied when the root itself is awkward (C♭, F♭, E♯, B♯).
   - Which do you want in both keys?
4. **My progression's scope (you asked to keep it simple).**
   - Is it worth adding ♯I, ♯II and ♯V, so the passing diminished chords read C♯°7, D♯°7 and G♯°7 (see W1)?
   - A major/minor switch (see W3)?
   - A way to insert or move a chord? "+" only appends a copy of the last one, so changing chord 3 of 12 means re-editing every slot after it.

## Checked and fine

- **The shared picker.**
  - Drums: 99 cards in 10 genres. Progressions: 24 in 6 groups.
  - It opens on the current item's group. The search matches every word, ignores accents ("bembe"), and reads names, lines, groups and tags ("brush", "7/8", "12/8", "odd", "2 bars", "clave", "shuffle", "jazz", "latin").
  - "Nothing matches that search" when empty. ★ Favourites and 🕘 Recent chips appear once they hold something.
  - A pick closes it and keeps the room playing: switching from 7/8 to Straight 8ths while playing changed the metre live (4 lights, 110 BPM) and Stop stayed "Stop".
  - Back, Escape, ✕ and a tap outside close it, leaving `history.state` at `{depth}` with no stray entry. The backdrop covers the floating Start. The search does not pop the keyboard on open.
  - It fits at 640x360 (3 columns), 800x380 and 1024x768 (4 columns), with no cut text.
- **Harmony.**
  - All 23 presets in all 12 keys keep their bar lines in 2/4, 3/4, 5/4, 6/8, 7/4, 12/8, a 1-beat bar and every odd-metre pattern's groups. Totals and bar starts were checked chord by chord: 0 problems.
  - Minor progressions list minor keys (Cm … Bm) with the house spellings (E♭m: B7 for ♭VI7, C♭ in the triad presets; G♯m: D♯7).
  - The Jazz group has "ii – V – I in all 12 keys" (24 bars, local-key spellings: A♭m7 D♭7 G♭maj7, C♯m7 F♯7 Bmaj7) and "Dominant 7ths around the cycle" (12 bars).
  - The drone and chords stay silent in the count-in.
- **The Neck's scale by function, for the presets:**
  - I Ionian, ii Dorian, iii Phrygian, IV Lydian, V Mixolydian, vi Aeolian, viiø Locrian;
  - V/ii and V/vi Phrygian dominant (jazz blues, rhythm changes, Autumn cycle);
  - ♯iv°7 whole-half; borrowed iv7 Dorian; rock ♭VII Lydian;
  - minor: i Aeolian, iv Dorian, v Phrygian, ♭VI Lydian, ♭VII Mixolydian, V Phrygian dominant, m(maj7) melodic minor;
  - minor vamp Dorian, dominant vamp Mixolydian.

  The next change skips repeats (blues bar 1: "A7 → D7"). Over a drone the Neck shows the player's own scale on the drone's key. Do Re Mi works throughout the room ("La♭13", "Drone on Re♭").
- **My progression:**
  - Chord names and numerals are right for all 12 degrees × 23 types in C and A (Imaj7, vi7, ii7, V7, ♭VII7, ♯ivø, i(maj7), V7alt; lead-sheet names for awkward roots: ♭VII of D♭ = B, ♭VI = A). A new degree takes its usual chord.
  - From the code: the 16-chord limit, Remove disabled at one chord, and a copy toast that names the 16-chord cut.
  - Voicings (from the code) have the root at E3–D♯4 and five notes at most (G13 = G B F A E; 7alt = R 3 ♭7 ♯9 ♭13).
- **Metronome:**
  - Speed up is Off by default with its own switch, and its sliders show only when it is On.
  - The click Volume sits under Click (hidden with Click Off) and matches Settings' "Metronome volume" (40%).
  - The x/8 tempo name follows the quarter ("220 BPM ♪ Moderato").
- **Home:**
  - "?" in the My level tile for a new player, then "L5" after the placement.
  - With a log, 7 whole days are in view at 640 and 800 px, and the headline adds up (3 h 11′, 6 days, 🔥 4 in a row).
  - The empty line reads "Play an exercise or the Practice room to start".
- **Quick pass, as before:**
  - the course map (177 required + 6 optional lessons; placement to L5 → Continue on 38.1);
  - Lesson 1.1's page and step (tip callout, goal "66 BPM in quarter notes");
  - the player and its ⋯ menu (Backing greyed "Off" on open strings);
  - the tuner (E1 41.2, A1 55.0, D2 73.4, G2 98.0 Hz);
  - Settings and Backup.
- **Layout:** no horizontal scroll and no cut text in the room at 640, 800, 915 or 1024 px. At 800x380 and 915x412, the Neck block (chips and the whole board) fits one screen (316 px).
