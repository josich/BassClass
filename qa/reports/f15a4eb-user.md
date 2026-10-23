# QA User report · f15a4eb · 2026-10-23

Setup: round 18. Most of the time went on what changed since round 17 (f600870):
- the Metronome block's new layout;
- the tappable beat lights, the grouping label and ↺, and the default groupings;
- the drums regrouped to the player's grouping (`regroup` in `practice/styles.js`);
- the Arpeggio sound;
- tap sounds and the Tap tempo animation;
- the round-17 fixes.

How I tested:
- **Code tested:** f15a4eb (v1.0.102). The app files did not change while I worked. The deep QA added files under `qa/tools/` only.
- **Server and tab:** my own `qauser` server (port 8890), in a background tab of my own (`tab-2`). I did not touch `seed` (8765) or the deep QA's tab. No unexplained state changes this round.
- **Profile:** empty at the start (service worker unregistered, both caches and localStorage cleared, loaded with `?qa=u18a`).
- **Sizes:** 780x360 (main), 640x300, 915x412 and 1024x768. Layout confirmed with `getBoundingClientRect`. 4-string bass, C D E.
- **Personas:**
  - Beginner: Home, Lesson 1.1 and its step, Settings, Tuner, the Metronome block.
  - Advanced player: beat lights and groupings in 4 to 12 beats, odd-metre drums, Arpeggio, the picker's search, My progression's Major | Minor.
  - Jazz teacher:
    - every room preset in all 12 keys;
    - the course's progression lists (`progChords`) in all keys;
    - the Neck's Scale and Chord views over the presets and over hand-made progressions;
    - the Neck's own Altered, melodic minor, harmonic minor, Lydian dominant and Phrygian dominant on 12 roots;
    - every regrouping of the 9 odd-metre patterns.
- **Method:**
  - Real clicks on Start and Stop, the beat lights, ↺, the beats stepper, Change, the picker cards, Arpeggio, Tap, the ⓘ buttons and the course.
  - Oscillator and buffer starts were logged (`AudioScheduledSourceNode.start` and `AudioBufferSourceNode.start`) to compare what plays with what is shown.
  - The preset and Neck sweeps redrew the room through its own chips and selects, after setting `room` through `saveRoom`.
- **Not testable here:**
  - The sound itself: the arpeggio's tone, how loud the tap tick and the brushes' swish are, the new click scale.
  - Real touch, and the Android app.
- **Screenshots:** some came back stale (the background tab draws late), so each issue was confirmed in the DOM. They are in `C:\Users\OscarGaya\.claude\projects\E--CLAUDE-BassClass\c7f026a2-fcf4-440e-b62e-e6df46b13395\tool-results\`, shortened to `…\` below.

Counts: Blocking 0 · Wrong 2 · Confusing 3 · Irritating 3 · Texts 3 · Visual 3, plus 5 questions.

## Expert verdict (short)

Round 17's fixes are all in, and correct:
- The course's progressions and the room's presets in G♯m, B, D♭ and G♭ are right: `E♭m7 – A♭7♭5 – D♭maj7`, `G♯m – F♯ – E – D♯`, `A♯m7♭5 – D♯7♭9 – G♯m(maj7)`, `D♯7 – G♯7 – C♯7 – F♯7`.
- The Neck spells a chord's own tones the same way in Scale and Chord views.
- The Altered scale sits on flats.
- The Phrygian and Lydian vamps and the rock I – ♭VII – IV now have the right scales.
- Major | Minor converts the usual chords.

The beat lights work well. 7/8 2 + 2 + 3 "played 3 + 2 + 2" is exactly the written 3 + 2 + 2 groove.

What weighs most:
1. **The Arpeggio plays straight 8ths over the shuffle patterns.** On the 9 shuffle grooves (Rock shuffle, Texas, Chicago, Jump blues, Bebop, One drop…), the drums put the off-beat on the last triplet and the arpeggio puts it on the half beat.
2. **Some regroupings lose the groove's backbone:**
   - 7/4 played 2 + 2 + 3: three kicks before the first snare.
   - 11/8 in four groups: one kick per bar, the middle kick dropped.
   - 7/8 played 4 + 3: no snare in the first group.
3. **The new "I before II → Lydian" rule also fires inside longer progressions.** In I – II – IV – I the tonic gets F♯ (in C) one bar before the F chord.

## Blocking     (a user cannot do what the screen is for)

None found.

## Wrong        (incorrect musical or factual information)

### W1. The Arpeggio ignores the shuffle: straight 8ths against a shuffled groove
- **Where:** Practice → Harmony → Sound "Arpeggio", with the drums on a triplet-grid pattern at the Shuffle subdivision.
  - These 9 patterns default to it: `rockshuffle`, `texasshuffle`, `chicagoshuffle`, `doubleshuffle`, `jumpblues`, `upswing`, `bebop`, `onedrop`, `countryshuffle`.
  - The Shuffle button does the same on any triplet pattern.
- **What I did:** Rock shuffle at 120 BPM, 12-bar blues, Arpeggio, real Start. I logged the start times, in beats from the first:

  | Part | Times played |
  |---|---|
  | Drums | 0, **0.333**, 0.5, **0.833**, 1.0, **1.333** |
  | Arpeggio | 0 (A3), **0.25** (C♯4), 0.5 (E4), **0.75** (G4) |

  - The beat is 0.5 s, so the drums' off-beat lands at ⅔ of the beat and the arpeggio's at ½.
  - The two are 83 ms apart on every off-beat.
- **Why it matters:**
  - A straight arpeggio over a shuffle is a rhythmic clash any player hears at once.
  - CLAUDE.md promises "one per subdivision of the beat (the room's, or the drum pattern's feel)".
  - The cause: `_harmony` in `engine.js` spaces the notes evenly (`t0 + k * len / L`). The clicks and drums use `clickTimes`/`stepTime`, which put L = 2 on a triplet grid at 0 and ⅔.
- **Suggestion:** time the arpeggio notes with `clickTimes(s, L)`, as the clicks are.

### W2. "I before a major II → Lydian" also fires in I – II – IV – I and I – II – V – I
- **Where:** Practice → My progression → Neck → Scale. No preset has I → II, so only the player's own progressions are affected.
- **What I saw:**
  - **I – II – IV – I, triads, key C:**
    - `C · Lydian: C – D – E – F♯ – G – A – B`
    - `D · Mixolydian: D – E – F♯ – G – A – B – C`
    - `F · Lydian: F – G – A – B – C – D – E`

    The tonic's F♯ comes one bar before an F major chord. In A it is the same: A Lydian (D♯), then D.
  - **I – II – V – I, key C:** `C · Lydian` (F♯), `D · Mixolydian`, `G · Mixolydian` (F♮). The II here is a V of V, and the tonic is Ionian.
  - **Weaker, the same family:** I – ♭VII – I – IV – V in C.
    - The two C bars get two scales in one loop: `C · Mixolydian` (B♭), then `C · Major (Ionian)` (B♮).
    - The IV is `F · Major (Ionian)` (B♭), straight before `G · Mixolydian` (B♮).
- **Why it matters:**
  - Round 17's rule was asked for the two-chord Lydian vamp (I – II). Here it overrides the function of a I whose progression clearly has a IV, or a V that the II leads to.
  - I – II – IV – I is a common pop and Beatles progression ("Eight Days a Week" shape). A teacher marks A Lydian over its tonic as wrong.
- **Suggestion:** apply "I → II: Lydian" (and "I → ♭VII: Mixolydian, IV Ionian") only when the progression has no other chord on IV or V. The simplest version: only for a two-chord loop.

## Confusing    (misleading, illogical, makes no sense)

### C1. Some regrouped odd-metre grooves lose their kick or backbeat
- **Where:** Practice → Drums, an odd-metre pattern, with the beat lights tapped into another grouping. I read the tracks `regroup()` builds, below; `.` is a rest and `|` a beat.
- **What I saw:**
  - **7/4 (4 + 3) played 2 + 2 + 3:**
    - kick `X...|X.x.|X...|....|X...|....|..x.`
    - snare `....|....|....|X...|....|X...|....`
    - Beats 1, 2 (and its "and") and 3 are all kicks, and the first snare is on beat 4. The first 2-group has no backbeat.
    - Cause: shrinking the written 4-beat group drops its "plainest" beat, and a snare beat weighs less than a beat with two kicks.
    - Played 2 + 3 + 2 gives the same opening: `X...|X.x.|X...|...`.
  - **11/8 (2 + 2 + 3 + 2 + 2) played in any four groups** (all 16 groupings, e.g. 3 + 3 + 3 + 2, 2 + 2 + 3 + 4, 4 + 2 + 2 + 3):
    - The kick plays on beat 1 only, and the snare takes every other group head.
    - 3 + 3 + 3 + 2 is `K . . S . . S . . S .`.
    - Cause: with 4 groups over 5 cells, `middle()` picks cells 1 and 3 and skips cell 2, the 3-group with the bar's second kick.
    - With 3 groups (3 + 4 + 4) or 5 groups the kick is kept.
  - **7/8 (2 + 2 + 3) played 4 + 3:** kick on 1 and 5, snare on 6 only. The first 4 eighths are hats only, because the cell with the snare (beats 3–4) is skipped.
- **Why it matters:**
  - A drummer regrouping keeps a kick or snare on each group head, and kick and snare alternate (11/8 3 + 3 + 3 + 2: K . . S . . K . . S .).
  - The Drums line says "played 3 + 3 + 3 + 2", but the groove reads as one downbeat and a string of backbeats.
  - Most groupings read well: 7/8 3 + 2 + 2 and 2 + 3 + 2, all of 5/4, 5/8 and 9/8 (3 + 3 + 3 keeps the middle kick), and 11/8 in five groups.
- **Suggestion:**
  - When shrinking a group, never drop a beat with a kick or snare while a hat-only beat is left.
  - Map the middle groups so every cell with a kick is used once (or alternate kick and snare on the group heads).

### C2. With the drums off, the chords' half bars ignore the player's grouping
- **Where:** Practice, drums off, 7 beats tapped 3 + 2 + 2, Harmony → Chords on a progression with half-bar chords (Rhythm changes A).
- **What I saw:**
  - `progression('rhythm-A', …, 7, …, groups)` gives:

    | Groups passed | Chords |
    |---|---|
    | null (what the engine passes with the drums off) | `B♭maj7:4 G7:3` |
    | [3, 2, 2] (with the drums on) | `B♭maj7:3 G7:4` |

  - The engine takes the groups from `_pattern()`, which is null with the drums off.
  - So the click accents beat 4 (3 + 2 + 2) while G7 comes in on beat 5, in the middle of the second group.
- **Why it matters:** the same grouping moves the chord change only when the drums happen to be on. A player playing over the metronome and chords alone gets a change against their own accents.
- **Suggestion:** pass `groupsOf(beats, accents)` to `progression` whatever the drums.

### C3. The grouping label and the Drums line can say different things
- **What I saw:**
  - **Beat 1 not accented.** 7/8 drums, lights tapped down to beat 4 only (`accents {7: [3]}`):
    - The label under the lights is empty (only ↺ shows).
    - The Drums line reads "Odd metres · 220 BPM · **played 3 + 4**".
    - `groupingOf` needs beat 1, but `groupsOf` adds it.
  - **Accents that are not a grouping.** In 4/4, accents on 1, 2 and 4 show "1 + 2 + 1". In 3/4, all three show "1 + 1 + 1".
  - **↺ after the usual grouping is back.** ↺ stays when the taps return to the usual grouping (12 beats tapped back to 1-4-7-10 still shows "3 + 3 + 3 + 3 ↺").
- **Suggestion:**
  - Show the label from the same `groupsOf` the drums use, or let the drums play as written when beat 1 is not accented.
  - Show ↺ only when the accents differ from the default.

## Irritating   (works, but annoys or slows the user)

### I1. Tap sounds tick on controls that sound themselves
- **What I saw:**
  - The rule (CLAUDE.md, `app.js`) leaves out "a control that sounds itself", but only Play, Start/Stop and the beat lights carry `data-silent`.
  - **The exercise's ‹ › step buttons:** `player.stepTo` plays the step's notes at now + 10 ms, and the tap tick starts at now + 5 ms. Every manual step is a bass note with a click on its attack.
  - **The tuner's string buttons:** a second tap plays the reference note (`A.playNote(m, now + 0.02)`) with the tick in front. The tuner may also be listening on the microphone at that moment.
- **Suggestion:** mark ‹ ›, the tuner's string buttons, and any other control that plays a note `data-silent`.

### I2. A beat-light tap clicks at once, even while the room plays or the Click is off
- **What I saw:**
  - The tap calls `A.click(A.now() + 0.01, …)` whether the room is playing or not, and whether Click is on or off.
  - While playing at 220 BPM, a tap gave an extra 1480 Hz click at 251.010 s, on top of the scheduled beats (251.022, 251.295…). It fell 12 ms from a beat by chance; it always lands at the moment of the tap, anywhere in the beat.
- **Why it matters:** stopped, the preview is useful. While playing, an off-grid click in the middle of the groove sounds like a mistake, and with Click off the player turned the click off on purpose.
- **Suggestion:** sound the tap only while stopped (and with the Click on). While playing, the next bar already plays the new accents.

### I3. The progression search matches digits in the bar counts
- **What I saw:**
  - "1-4-5" lists 7 cards, including "ii – V – I", "Minor ii – V – i" and "I – vi – ii – V (turnaround)". The "4" matches "4 bars" on their line, and "1" and "5" match the tag "2-5-1".
  - "2-5-1", "251", "autumn", "modal" and "ii v" all work as round 17 asked.
- **Suggestion:** search a hyphenated number as one tag ("1-4-5" as a whole), or leave the bar counts out of the searched text.

## Texts        (typos, unclear wording, inconsistent names)

### T1. The Metronome ⓘ is now 9 lines and buries the new feature
- **What I saw:**
  - At 780x360 the bubble is 344 px tall in a 360 px window and scrolls. The two new lines come 7th and 8th, under the fold: "👆 Tap a beat light…" and "🥁 In an odd metre the drums play your grouping too".
  - Two lines start with 👆 (Tap tempo and the beat lights).
  - The Subdivision line runs to 4 lines.
  - Screenshot: `…\mcp-Claude_Browser-blob-1792782628939-xs3t99.jpg`.
- **Suggestion:**
  - Put the beat-light line second.
  - Give it another icon (🟡 or ✨).
  - Shorten the Subdivision line ("🎵 Subdivision: clicks per beat; with drums, how much of the pattern plays").

### T2. Nothing says the Arpeggio follows the Subdivision
- **What I saw:**
  - The Harmony ⓘ says "🎛 Sound: a pad, an electric piano, an organ or an arpeggio; another one plays from the next beat".
  - At the room's default subdivision (quarter notes) the arpeggio plays one note per beat. Neither the Harmony block nor the Metronome ⓘ says that the Subdivision buttons set its speed (which also sets how many clicks play).
  - The Harmony ⓘ has two lines starting with 🎼 (the key and progression, and Major | Minor).
- **Suggestion:** "🎛 Sound: …; the arpeggio plays one note per subdivision (Metronome → Subdivision)".

### T3. The Drums ⓘ does not explain "played 3 + 2 + 2"
- **What I saw:** the Drums line can now end "· played 3 + 2 + 2" under a pattern named "7/8 (2 + 2 + 3)". The Drums ⓘ (5 lines) says nothing about it. Only the Metronome ⓘ's 8th line does.
- **Suggestion:** add "🔢 Odd metres follow the beat lights' grouping; the pattern's own comes back when you pick it".

## Visual

### V1. 11 and 12 beats wrap their lights mid-group at 780 px
- **What I saw:**
  - At 780x360 the lights' box is 326 px. 11 beats wrap 10 + 1 and 12 beats wrap 10 + 2.
  - So the last group is split across rows: 11/8's final "2" and 12's last "3".
  - Screenshot: `…\mcp-Claude_Browser-blob-1792782890380-ezwfqm.jpg`.
  - At 640 px (columns stacked) and 915 px all 12 fit on one row.
- **Suggestion:** shrink the gap and lights a little above 10 beats (12 × 26 px fits), or break the row at a group start.

### V2. ↺ makes the settings below jump, and it is small
- **What I saw:**
  - The grouping row is 20 px tall, or 26 px once ↺ shows (`.grouping-reset` min-height 26).
  - Beats per bar and Subdivision move down 6 px on the first tap, and back up on ↺ (the Beats per bar row: y 105 → 111 in the screenshots at 780x360).
  - ↺ is 30 × 26 px with no enlarged hit area, smaller than the 32 px ⓘ. The lights themselves get a 38 px hit area from `::after`.
  - Screenshot: `…\mcp-Claude_Browser-blob-1792782070146-1as9do.jpg`.
- **Suggestion:** give `.beat-grouping` a min-height of 26 px, and ↺ 32 px (or an `::after` hit area).

### V3. Odd-metre cards in the drum search wrap "BPM" onto a line of its own
- **What I saw:** searching "odd" or "7/8" at 780 px, the cards are 175 px wide. The line "🔢 Odd metres · 220 BPM" takes 2 lines with "BPM" alone, on all 8 Odd-metre cards. "🎺 Jazz · 170 BPM" fits on one.
- **Suggestion:** shorten the group to "🔢 Odd" in search results, or allow the line to ellipsize.

## Questions for the owner

1. **The default for 9 beats is 2 + 2 + 2 + 3** (Blue Rondo's aksak). 6 is 3 + 3 and 12 is 3 + 3 + 3 + 3 (compound). The usual 9/8 (and 9/4) is 3 + 3 + 3, the compound triple. Keep 2 + 2 + 2 + 3, or follow 6 and 12?
2. **Picking a pattern drops the player's grouping in that metre without a word**, even when it is the pattern already playing (opening the picker and tapping the current card). Say so in the toast ("… · back to 2 + 2 + 3"), or keep the player's grouping when the pattern does not change?
3. **The count-in bar accents only beat 1**, not the player's grouping (logged: 1760 Hz then six 1175 Hz in 7/8). Should the count-in click the grouping, so the player hears 3 + 2 + 2 before the band comes in?
4. **Discoverability:** the beat lights look like status lights. Only the ⓘ's 7th line and a desktop tooltip say a tap accents them, and "Accent on 1" is gone. A one-time hint ("Tap a light to accent it"), or a slight button look?
5. **The arpeggio's shape:**
   - It cycles 6 notes (R 3 5 7 5 3) over 4-beat bars, so bar 2 of a long chord starts on the 5th.
   - A chord written as separate one-bar entries (the 12-bar blues' four A7 bars) restarts it each bar, so 7/8 gives "… C♯ A | A C♯ E …" with the root twice at the bar line.

   Intended, or restart on each bar line and only at real chord changes?

## Checked and fine

- **Beat lights:**
  - A tap toggles the accent, and the label follows: 7 beats 2 + 2 + 3 → 4 + 3 → 3 + 1 + 3 → 3 + 4 → 3 + 2 + 2.
  - ↺ restores the usual grouping, and the accents are stored per beat count.
  - Defaults: 5 → 3 + 2, 7 → 2 + 2 + 3, 8 → 3 + 3 + 2, 11 → 2 + 2 + 3 + 2 + 2, 12 → 3 + 3 + 3 + 3.
  - Lights are 22 px with a 38 px hit area, 32 px apart. Aria labels read "Beat 5, accented".
  - Playing at 220 BPM in 7/8 3 + 2 + 2, the scheduled clicks are 1760 Hz on 1, 1480 Hz on 4 and 6, and 1175 Hz on the rest, 0.273 s apart. Tap sounds stay silent on the lights.
- **Regrouping:**
  - 7/8 2 + 2 + 3 played 3 + 2 + 2 equals the written 7/8 3 + 2 + 2 pattern (kick velocity aside).
  - 5/4 3 + 2 ↔ 2 + 3, 5/8 3 + 2 → 2 + 3, 9/8 into 3 + 3 + 3 and 3 + 2 + 2 + 2, and 11/8 in five groups all read as real grooves.
  - The Drums line "Odd metres · 220 BPM · played 3 + 2 + 2" updates on each tap.
  - Picking a pattern brings back its grouping.
  - The chords' half bars follow the groups with the drums on (7/8 3 + 2 + 2: 3 + 4; 5/4 2 + 3: 2 + 3).
- **Arpeggio (straight feels):**
  - It goes up and down from the lowest note at each chord, one note per 8th at 220 BPM in 7/8 (A3 C♯4 E4 G4 E4 C♯4 A3).
  - The voicing is above the bass.
- **Round-17 fixes:**
  - Every room preset in 12 keys is spelled right, including `G♯m – F♯ – E – D♯`, `A♯m7♭5 – D♯7♭9 – G♯m(maj7)`, `Bmaj7 D♯7 G♯m7 C♯7 F♯7`, `D♯7 – G♯7 – C♯7 – F♯7`, and minor blues `… E7 D♯7 G♯m7`.
  - The course lists (`progChords`) are right: #205 `E♭m7 – A♭7♭5 – D♭maj7` (also seen in the exercise's tab strip, the V labelled R 9 3 ♭5 ♭13 ♭7) and `C♯m7 – F♯7♯5 – Bmaj7`.
  - The Neck over G♯m's ii – V – i:
    - `D♯7♭9 · Phrygian dominant: D♯ – E – F♯♯ – G♯ – A♯ – B – C♯`
    - `G♯m(maj7) · Melodic minor (jazz): … E♯ – F♯♯`
    - The Chord view matches.
  - Over E♭m: `B♭7♭9 · Phrygian dominant: B♭ – B – D – E♭ – F – G♭ – A♭` (the Chord view's ♭9 is B too).
  - The Neck's own Altered on all 12 roots is on flats with the chord tones kept (D♭ Altered … C♭; G♭ Altered … B♭ … F♭; A♭ Altered A♭ A B C D E G♭).
  - Phrygian vamp: Am Phrygian, B♭ Lydian (triads and 7ths). Lydian vamp: A Lydian, B Mixolydian. Rock I – ♭VII – IV: Mixolydian, Lydian, Ionian (preset and My progression).
  - Every preset's scale by function in C is as before.
  - Major | Minor:
    - `Cmaj7 Am7 Dm7 G7` ↔ `Cm7 A♭maj7 Dm7♭5 G7`
    - `C G Am F` ↔ `Cm G A♭ Fm`
    - `Bm7♭5`/`B°` ↔ `B♭7`/`B♭`
    - Each switch round-trips exactly.
  - The drone takes the Neck's root name (A♭ under A♭ Altered, G♯ under G♯ Phrygian, Aeolian and m7).
  - Chips are 36 px tall. My progression's Degree row scrolls at 640 px (484 px of row in a 433 px box, fading edge).
  - Progression lines: "12-bar blues" (no second line), "Minor blues · 12 bars", "One-chord minor vamp (4 bars) · 1 chord", "Dorian vamp (i7 – IV7) · 2 bars · minor".
  - The Neck ⓘ is in three short lines, and the Harmony ⓘ names Sound and Major | Minor.
- **Layout:**
  - No horizontal overflow at 640, 780, 915 or 1024 px.
  - At 640 px the Metronome stacks: tempo, lights and label, Beats per bar and Subdivision, then Click | Volume and Muted bars | Speed up, two by two.
  - At 780 px, with Speed up off, the right column ends 68 px above the left. Speed up On fills it.
- **Settings:** "Metronome volume 80%" for a new player, and "Tap sounds On | Off".
- **Tap tempo:** the jelly wobble and teal edge show on each tap, and `prefers-reduced-motion` keeps only the flash.
- **Beginner pass:** Home (practice card, Course, session), Lesson 1.1's page and its step "Open strings" (#6, 🎯 66 BPM), and the Tuner. All unchanged and fine.
