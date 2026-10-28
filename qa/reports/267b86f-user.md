# QA User report · 267b86f · 2026-10-28

Setup: round 20, commit 267b86f. The app files did not change while I worked (`git status` shows only the deep QA's `qa/tools/*20.js`).
- **Server and tab:** my own `qauser` server (port 8890) in my own tab. I never touched 8765 or 8878.
- **Profile:** empty at the start: service worker unregistered, cache `bassclass-v1` deleted, localStorage cleared, loaded with `?qa=u20b`.
- **Gates and chips:** later, Settings → seven taps on the version line → Pro debug: Gates "On (as on Play)", Pro owned No/Yes as needed, and "New chips → Show them again". At the end I set the gates back to Off in my own storage.
- **Sizes:** 780x360 (main), 640x300, 915x412 and 1024x768. Layout confirmed with `getBoundingClientRect`, scrollWidth and scrollHeight. 4-string bass, C D E; 5- and 6-string checked through the exercises' builders.
- **Personas:**
  - Beginner: Home, Lesson 1.1, the first session, Settings, the tuner.
  - Advanced player: the Library and its new numbers, the pentatonic studies, chord formulas, harmonics, the room's 14 new progressions, Pro and New chips, the rate card.
  - Jazz teacher: every new progression in all 12 keys (chords, spelling, the Neck's scales), every pentatonic study's notes and labels, the harmonic nodes and pitches, the chord formulas, the four fills.
- **Not testable here:**
  - The sound itself.
  - The Android in-app review card and the real e-mail app. I did not press Send feedback.
  - Real touch.
- **Screenshots:** in `C:\Users\OscarGaya\.claude\projects\E--CLAUDE-BassClass\c7f026a2-fcf4-440e-b62e-e6df46b13395\tool-results\`, shortened to `…\` below.

Counts: Blocking 0 · Wrong 3 · Confusing 6 · Irritating 2 · Texts 7 · Visual 1, plus 4 questions.

## Short verdict

The new content is musically sound in the main:
- The new progressions are the right changes (Blue Bossa's form, So What's form, "Just the Two of Us", the minor plagal, the backdoor).
- The Neck picks sensible scales for them.
- The harmonic nodes and pitches match the harmonic series exactly.
- The pentatonic studies fill their bars and label every note correctly against its chord.
- The new numbers (101–624, "3.15") follow the Library and the map with no gaps.

What weighs most:
1. **Spelling in some keys.** In E♭ minor the minor bossa writes "F♯m7 – C♭7 – Emaj7", with the Neck reading "C♭ – E♭ – G♭ – B♭♭". This is the exact case the spelling rule names (C♭7 → B7).
2. **"Three minor pentatonics on one minor chord" does not show what it teaches.** "Same fingering in all three places: only the hand moves", but the app plays the third box as a run up the G string (frets 7–9–11–14–16).
3. **The tab gives no sign of a harmonic.** In "Harmonic chords" the tab reads "0 / 12 / 12", exactly like fretted notes. The chord chip names the nodes differently from the tab ("Fret 3" against "3.2", "Fret 4" against "3.9").

## Blocking     (a user cannot do what the screen is for)

None found.

## Wrong        (incorrect musical or factual information)

### W1. Some keys of the new progressions break the spelling rule: C♭7 with a B♭♭, D♭m7 with F♭ and C♭
- **Where:** Practice room → Harmony → Chords. The evidence comes from `progression()` in all 12 keys, the function the room uses, and was confirmed on screen.
- **Minor bossa (16 bars), key E♭m:**
  - The chips read `E♭m7 A♭m7 Fm7♭5 B♭7♭9 E♭m7 F♯m7 C♭7 Emaj7 …`.
  - Tapping C♭7 while stopped, the Neck reads "🎹 C♭7: C♭ – E♭ – G♭ – B♭♭ · next Emaj7".
  - The ii–V–I into E is spelled with sharps, then a flat, then sharps.
  - CLAUDE.md names this very case: "a chord that would need a double accidental takes its lead-sheet name (C♭7 → B7)".
  - Evidence: `…\mcp-Claude_Browser-blob-1793185883956-fa3y9r.jpg`.
- **Minor bossa, key B♭m:** `… D♭m7 G♭7 Bmaj7 …`. A G♭7 resolving to Bmaj7 reads as a wrong chord. It should be C♯m7 – F♯7 – Bmaj7, or D♭m7 – G♭7 – C♭maj7.
- **Modal form, key Cm:**
  - The chips read `Cm7 D♭m7 Cm7`; tapping D♭m7 shows "D♭m7 · Dorian: D♭ – E♭ – F♭ – G♭ – A♭ – B♭ – C♭".
  - Key Gm gives A♭m7 (A♭ C♭ E♭ G♭), while key Fm gives F♯m7. The same form uses sharps in one key and flats in the next.
  - By the rule ("flats on black keys except minor-type chords: C♯m, G♯m, F♯m"; "any chromatic chord" takes its lead-sheet name), these should be C♯m7 and G♯m7.
- **Why it matters:** a teacher reads C♭7 → E as a mistake, and a B♭♭ on the Neck's line is the kind of spelling the app promises never to show in a chord picked on its own.
- **Suggestion:** apply the lead-sheet rule to a chord whose own local ii–V respells (the "leads" exception should not keep C♭7 when its target became E), and to chromatic minor chords on black keys.

### W2. Chord formulas: two statements do not match the notes
- **Where:** Lesson 3.31 "Chord formulas" (⚠ Watch out) and #332's ⓘ.
- **The B♭♭ is called a 3rd:**
  - The lesson's mistake reads "Respelling to make it easier. A 3rd stays a 3rd: the B♭♭ of C°7 is not an A."
  - The B♭♭ is the chord's 7th (the app labels it ♭♭7), not a 3rd. What the sentence means is that each chord tone keeps its letter: a 7th stays a 7th, and an A would be a 6th.
  - #332's ⓘ has the same mix: "the 3rd of a chord is always a 3rd (C°7 is C E♭ G♭ B♭♭, its B♭♭ sounding as A)".
- **"Everything the name allows" is not shown for C13:**
  - The ⓘ says "In practice an 11th chord often leaves out its 3rd, and a 13th its 11th: the formula shows everything the name allows."
  - The exercise's C13 is `C E G B♭ D A`, already without the 11, while Cm13 keeps its F.
  - Leaving the 11 out of a dominant 13 is the right musical choice. The sentence just says the opposite.
- **Suggestion:**
  - "Each chord tone keeps its letter: the 7th of C°7 is B♭♭, not A (A would be a 6th)."
  - "A dominant 13th leaves out the 11th, which clashes with the 3rd; a minor 13th keeps it."

### W3. Two pentatonic texts leave out the 13th that the notes play
- **Where:**
  - #417 "Minor pentatonics on a major chord" ⓘ: "Over C, the one on the 3rd (E minor) gives the 3rd, 5th, 7th and 9th".
  - #321 ⓘ and Lesson 3.16: "over Cmaj7 [or 'the ♭VI'] the 3rd, 5th, 7th and 9th".
- **What is missing:** E minor pentatonic is E G A B D; over C the A is the 6th/13th. The app's own fill plays it and labels it 13: `E3(3) D3(9) B2(7) A2(13) G2(5) E2(3)`.
- **The same module lists all five notes elsewhere:** A♭maj7 gets "the 3rd, 5th, 13th, 7th and 9th", and the A minor box over C lists all five.
- **Why it matters:** a student would conclude the box over a major chord is chord tones plus a 9th.
- **Suggestion:** "the 3rd, 5th, 13th, 7th and 9th: a Cmaj9(13) sound".

## Confusing    (misleading, illogical, makes no sense)

### C1. "Same fingering in all three places", but the app moves the box only for the first place
- **Where:** #320 "Three minor pentatonics on one minor chord" (Lesson 3.15), lick "Cycle the box: root, a whole step up, the 5th"; default key Em, 4-string.
- **What the texts promise:** "Same fingering in all three places: only the hand moves" (tip), "Same fingering: only the hand moves" (step 1), and "Changing the fingering in each place… move the hand, not the fingers" (⚠ Watch out).
- **What the neck and the tab show:**
  - **The home box (fret 7):** the standard box, A7 A10 D7 D9 G7 G9.
  - **The box a whole step up (F♯m):** `F♯ A9, A D7, B D9, C♯ D11, E G9, F♯ G11`. Three notes on the D string spread over frets 7–11, so this is not the box shape.
  - **The box on the 5th (Bm):** `B D9, D G7, E G9, F♯ G11, A G14, B G16`. A linear run up the G string from fret 7 to 16.
  - **Other keys:** the same happens. In key G the second box has C on A3 under an A on E5; in key C the third box runs up the G string to fret 12.
- **Why:** on a 4-string bass the B-minor box from B2 needs the hand at fret 14, and the placement keeps the hand near the home box instead.
- **Evidence:** at step 31/48 the tab reads `9 | 7 9 11 14 16 | 14 11 9`: `…\mcp-Claude_Browser-blob-1793185382215-xpz3sd.jpg`.
- **Suggestion:** pin each place's box to its own position (an `@` string pin per note, or a region per bar). This also fixes lick 1, which takes A from A12 (the upper box) inside a home-box bar.

### C2. Chord formulas: the chords change off the beat and the loop is not whole bars
- **Where:** #332 "Chord formulas", in 8ths (`sub: 2`, the course steps' setting).
- **Why it happens:** each chord is played up its formula and back down, so a triad takes 5 notes (2½ beats), a 6th chord 7, a 13th 11–13.
- **Chord start positions, in beats:**
  - Triads: `C@0 Cm@2.5 C°@5 C+@7.5 Csus2@10 Csus4@12.5`, total 15 beats (3¾ bars).
  - Added: total 19.5 beats.
  - Extended: `Cmaj9@0 C9@4.5 Cm9@9 C11@13.5 …`, total 36.5 beats.
- **Why it matters:**
  - Its own tip says "Turn the Backing to Chords to hear each colour under the arpeggio", but then the chord changes land on "&"s.
  - The loop restarts mid-bar.
  - The rest of the app holds the last root to the bar line for the same reason ("Broken chords end on the root held to the bar line").
- **Suggestion:** hold the closing root to the next bar line, or play each formula in 8ths up and down to fill a whole bar.

### C3. Harmonics in the tab look exactly like fretted notes
- **Where:** #504 "Harmonic chords", #402 "Natural harmonics map".
- **What I saw:**
  - The tab writes `0 / 12 / 12` for Em7 and A7sus4 and `5 / 7 / 7` for D5, with no `<12>`, "N.H." or ◊.
  - The ◊ tag is deliberately left out of the technique row (`tabView.js:122`).
  - Only the in-between nodes stand out, through their decimals (3.9, 3.2).
- **Why it matters:**
  - A player reading the tab frets D5's "7 7", which sounds A2 and D3, an octave under the harmonics' A3 and D4.
  - The neck (triangles) and the staff (diamonds) mark harmonics, but the tab does not.
- **Evidence:** `…\mcp-Claude_Browser-blob-1793185505106-14qqbd.jpg` and `…\mcp-Claude_Browser-blob-1793186192346-5wwl8t.jpg`.
- **Suggestion:** write harmonics as `<12>` and `<3.9>`, the usual bass-tab convention, or put ◊ in the technique row.

### C4. A checkpoint row reads "○ ✓ Checkpoint", so the not-done state shows a tick
- **Where:** Course map; every unit's last row.
- **Why it happens:** the number column of a checkpoint is now "✓", and the status column uses the same ✓ for a done lesson (`STATUS_ICON.done = '✓'`).
- **What a player sees:**
  - A checkpoint not started reads "○ ✓ Checkpoint".
  - A done one reads "✓ ✓ Checkpoint".
  - A beginner reads the tick as "already passed".
- **Evidence:** `…\mcp-Claude_Browser-blob-1793185249576-ahl57d.jpg`.
- **Suggestion:** use a different mark for "checkpoint" (◆, 🏁 or "CP"), or tint the number column so it never looks like a status.

### C5. "I – ♭VI – ♭VII – I (borrowed)" sits in Pop & rock but plays jazz 7th chords
- **Where:** Practice room → Harmony → Change → Pop & rock.
- **What I saw:** the chips read `Cmaj7 A♭maj7 B♭7 Cmaj7`. The other Pop & rock presets play triads; the new "I – IV – V – IV" plays `C F G F`.
- **Why:** the preset has no `pop: true` (`common.js`), against the agreed rule "Pop, rock, folk, disco and reggae progressions are triads".
- **Why it matters:** this is the rock "Mario cadence" (C – A♭ – B♭ – C). With maj7s and a backdoor B♭7 it sounds like a jazz progression in the rock group.
- **Suggestion:** mark it `pop: true`, or move it to Jazz as "♭VImaj7 – ♭VII7 – Imaj7 (backdoor)".

### C6. My level does not cover the new units, so a placed player sees an open unit in a "known" stage
- **Where:** My level (placement), then the map. No placement statement lists `u-pent3` or `u-pent4` (`PLACEMENT` in `ui/course.js`).
- **Steps:** Stage 3 → All yes → See my starting point.
- **What I saw:**
  - Stage 3 reads "0/38 lessons (36 known)".
  - "Pentatonic colours" (3.15, 3.16, its checkpoint) stays ○ in the middle of the stage.
  - Continue jumps over it to the Stage test.
  - "Chord formulas" (3.31) is marked known through the statement "I play the triads and 7th chords of any key, in three fingerings and in inversions", which says nothing of 6/9, 11th or 13th chords.
- **Why it matters:** a player who answered "yes" to everything sees two Stage 3 lessons left over and no way to say they know them.
- **Suggestion:**
  - Add a Stage 3 line ("I move the minor pentatonic box over a chord and groove from the key's box over i – ♭VII – ♭VI") and a Stage 4 one ("I use minor pentatonics for colour over minor, major and sus chords").
  - Optionally add "and build any chord from its formula" to the 7th-chords line.

## Irritating   (works, but annoys or slows the user)

### I1. The Level 2 root-notes drill now offers 34 progressions; five of them play the same notes
- **Where:** #234 "Common progressions: root notes" (L2, free), Options → Progression; also #333.
- **The new entries:** the 7 new progressions are appended at the end ("I – IV – V – IV" sits 31 places after "I – IV – V – I").
- **Identical notes:** ii – V – I, ii – V7alt – I, ii – V7♭9 – I, ii – V7♯5 – I and ii – V7♭5 – I all give `D D D D | G G G G | C×8`; only the badge changes.
- **Why it matters:** a beginner scrolls a long list, and five choices change nothing they can hear in a roots drill.
- **Suggestion:** for drills that play roots only, offer one ii – V – I and group the list by style, as the room's picker does.

### I2. A "New" chip on a Pro item never goes away for a free player
- **Where:** for example the room's Sound row "Piano New Pro · Organ New Pro · Guitar New Pro", Library L4 "Pro · 3 new", the map's Stage 4 "Pro · New", and the Jazz picker cards.
- **Why:** `markUsed` runs only when the item opens or plays. A locked item opens the Pro sheet instead, and is marked only after a purchase (`practice.js:744`).
- **Why it matters:**
  - The free player sees "New" on things they cannot use, for good.
  - Every later Pro addition adds more.
- **Suggestion:** count the tap that opens the Pro sheet as "seen", or show New only on items the player can open.

## Texts        (typos, unclear wording, inconsistent names)

### T1. The Library still gives "42" as its example number
- **Where:**
  - The search field's placeholder: "Search: triad, ii-V, 42…".
  - The Library ⓘ: "🔎 Search by name, topic, song, artist or number (#42)".
- **What happens:** numbers are now 101–624. Typing 42 gives "Nothing found."; `#/ex/42` toasts "Exercise 42 is not in this version of BassClass".
- **Suggestion:**
  - Use "305" as the example.
  - Add one ⓘ line explaining the numbers: "305 = Level 3, exercise 5".

### T2. Unit numbers survive outside the map
- **What I saw:** the map names units only. Elsewhere the old global numbers remain:
  - The lesson breadcrumb: "Stage 3 · Harmony on the neck · Unit 21 · Pentatonic colours", and "Unit 25", "Unit 51", "Unit 28".
  - The Pro ⓘ list: "28. Stamina, stretch and harmonics … 57. The vocabulary of the masters".
- **Why it matters:** "Unit 21" and "28." cannot be found anywhere on the map, and "28." clashes with lesson numbers such as "4.3".
- **Suggestion:** drop the numbers in both places ("Stage 3 · Harmony on the neck · Pentatonic colours").

### T3. Harmonics: one node, three names
- **Where:** #402 with "All up to the 12th".
- **The option name:** it lists "12, 9, 7, 5, 4, 3.2, 2.7, 2.3".
- **The chord chips:** they read "Fret 9", "Fret 4", "Fret 3", "Fret 2.7", "Fret 2.3".
- **The tab:** it writes 8.8, 3.9, 3.2, 2.7, 2.3.
- **The conflicts:**
  - The 3.86 node is "4" in the option and the chip but "3.9" in the tab.
  - The 3.16 node is "3.2" in the option and the tab but "Fret 3" on the chip.
  - Evidence: `…\mcp-Claude_Browser-blob-1793185473464-e5jsgn.jpg` (chip "Fret 3", tab "3.2").
- **Smaller points:**
  - The ⓘ says "the tab writes the in-between ones as 3.9, 3.2 and 2.7", but it also writes 8.8 and 2.3.
  - The summary "12, 7 and 5 over the wire, the lower ones just before or after it" misses the 9th node, which is higher and still not over the wire.
- **Lesson 4.3:** steps 1–2 now carry the variant chip "any harmonics · Fret by fret", while their text says "12, 7, 5, 4". They do play the main four (checked: 16 notes); the chip just reads as "your choice". Evidence: `…\mcp-Claude_Browser-blob-1793185999717-wvyq12.jpg`.
- **Suggestion:**
  - Use one name per node everywhere: the tab's (8.8, 3.9, 3.2, 2.7, 2.3), with the fret it is near in brackets if wanted.
  - Have steps 1–2 set `set: 'main'`, so the chip reads "12, 7, 5, 4".

### T4. Two room ⓘs are out of date
- **Harmony ⓘ:** "🎼 Pick a key and a progression: pop and rock, blues, jazz, minor, vamps". The new "Soul & R&B" group is missing.
- **Drums ⓘ:** "💥 Fills: a crash at each phrase and a fill at its end, every 4 or 8 bars". The soft grooves (bossa, ballad, habanera, partido alto, maqsum) take no crash since round 19, and the four fills taking turns, the main change, is not mentioned.
- **Suggestion:** "💥 Fills: every 4 or 8 bars, four kinds in turn; a crash on the next downbeat (not on soft grooves)".

### T5. Privacy policy: its date and what Feedback sends
- **The date:**
  - It reads "Last updated: 27 October 2026".
  - Commit 787c926 (28 October) added "and its rating card" to the Network paragraph without changing the date.
- **What Feedback sends:**
  - The policy says Feedback names "the app's version and your phone's model".
  - The message also carries the screen size, web or Android app, the number of strings and the date (`feedback.js`).
  - Settings' Feedback ⓘ has the same short list.
- **Suggestion:** update the date, and say "the app's version, your phone and screen, and your bass's strings".

### T6. #417 and Lesson 4.13 call the groove "root, 5th and octave", but its second bar plays the 3rd
- **Where:**
  - #417 ⓘ: "The groove stays plain (root, 5th and octave) for three bars".
  - Lesson 4.13: "Keep the groove plain (root, 5th and octave)".
- **What the notes play:** bar 2 (`ROOTS2`) is `C2:q r:e C2 E2:q G2 C3`, which includes E, the 3rd.
- **Suggestion:** "(root, 3rd, 5th and octave)", or "chord tones only".

### T7. Smaller wording
- **The modal form's name:** "Modal form (Dorian 16 bars, up a half step 8, back 8)" is hard to parse, and it is the name that overflows its card (V1). Suggest "Modal form, AABA (i7 16 bars, ♭ii7 8, i7 8)".
- **The "Lick" heading:** the pentatonic studies inherit the option heading "LICK" from the licks template, for items such as "Cycle the box…", "Falling roots, a fill to close" and "Fill over Cm7". Suggest "Study" or "Version".
- **The Support ⓘ's label:** its aria-label reads "About support bassclass" (lower-case).

## Visual

### V1. Long progression names overflow their picker cards
- **Where:** Practice room → Harmony → Change → Jazz.
- **780x360:**
  - "ii – V – I – IV – iiø – V – i (relative minor cycle)" measures scrollHeight 63 > clientHeight 52.
  - "Modal form (Dorian 16 bars, up a half step 8, back 8)" measures 73 > 52.
  - Its text rises over the card above ("8 bars" sits on "Modal form"), and "New · 32 bars · minor" falls below the border.
- **640x300:** eight Jazz cards overflow (51–61 > 48), and the "4 bars" / "8 bars" lines sit on the cards' bottom edges.
- **Evidence:** `…\mcp-Claude_Browser-blob-1793185852222-vxi14o.jpg` (780) and `…\mcp-Claude_Browser-blob-1793186082778-fcqanm.jpg` (640).
- **Suggestion:** let picker cards grow with their text (`min-height` instead of a fixed height), and shorten the modal form's name.

## Questions for the owner

1. **Today's session: identical rows (a consequence of the 2026-10-27/28 choice).**
   - A brand-new player's 30′ session reads: "Hear it: Open strings · 3 Open strings · Hear it: Alternate plucking · 4 Alternate plucking · 5 Alternate plucking · Hear it: Open strings · 6 Open strings · 7 Open strings".
   - That is three "Open strings" rows and two "Hear it: Open strings" rows (Lessons 1.1 and 1.3 use the same exercise with 2 and 4 repeats), with nothing to tell them apart.
   - Evidence: `…\mcp-Claude_Browser-blob-1793185206724-ce5g50.jpg`.
   - Options: skip a demo of an exercise already heard in the same session, or bring back a short tag only where two rows would otherwise read the same.
2. **The rate card's five stars are all gold and all do the same thing.**
   - Every star opens the Play Store, which matches Google's "no filtering", and the card fits at 640x300.
   - But pre-filled gold stars read as a rating already given.
   - A player who taps the 2nd star to say "2 stars" lands on Play with nothing selected.
   - Show the stars empty, as a picture rather than buttons, and keep the one "⭐ Rate on Google Play" button?
3. **Chord formulas (#332) is Level 3 but includes 9ths, 11ths, 13ths, 6/9, m6/9 and maj7sus4.**
   - The Library's "Extended arpeggios: 9ths, 11ths, 13ths" is #527 (Level 5).
   - It is theory rather than technique, so it may be fine. Intended at Stage 3?
4. **Name the source tunes of the two new forms?**
   - "Minor bossa (16 bars)" is Blue Bossa's form and "Modal form" is So What's.
   - The room already names "Coltrane changes (Giant Steps)", and chord progressions are not copyrighted.
   - "Minor bossa (Blue Bossa changes)" and "Modal form (So What changes)" would tell a jazz player at once what they are.

## Checked and fine

- **Numbers:**
  - Exercise numbers run 101–121, 201–244, 301–346, 401–446, 501–550 and 601–624 with no gaps, in the Library's order.
  - `#/ex/332` opens #332; `#/ex/42` toasts that it is not in this version.
  - Lesson numbers run 1.1–1.22, 2.x, 3.1–3.39, 4.1–4.38 and 5.1–5.42 in map order. Stage tests show ★, checkpoints are named, and step rows read "#320 · 🎯 84 BPM".
- **New chips:**
  - Library cards ("New", next to "Pro" without overflow at 640) and level headers ("3 new").
  - Map stages and lesson rows, picker cards and group dots, and the room's sound buttons.
  - They clear on open or pick. The debug panel's "Show them again" works (toast "The latest additions show "New" again").
- **Pentatonic studies (#320, #321, #416, #417, #418):**
  - Every part fills its chords exactly.
  - Labels against the chord are right:
    - G is the 5th of Cm7, the 7th of A♭maj7, the 9th of F7sus4 and the ♯11 of D♭maj7.
    - The B♭ over F7sus4 is "4", the sus chord's tone.
    - F♯ over C is "♯11" (the new `lydian` key set).
  - The summaries' chord lists match the progressions.
  - The texts' ♯11 and Lydian claims are right, and the tempos sit sensibly between Stage 3 and Stage 4.
- **#512 Pentatonic double stops:** the pairs are R+4, 4+♭7, 5+R and ♭7+♭3 (perfect 4ths) plus ♭3+5 (a major 3rd, a fret apart), as described, in A, C, D, E and G and on 5 strings.
- **Harmonics:**
  - Node positions match the harmonic series: 12, 8.84, 7.02, 4.98, 3.86, 3.16, 2.67 and 2.31 sound +12, +28, +19, +24, +28, +31, +34 and +36 semitones.
  - Spelling from the open string is right: G♯ on E, ♭7 D.
  - The triangles sit where the ⓘ says: the 12th on the wire (x 717.5 against the wire at 717.7), the 3.16 node at x 269 (computed 269), the 3.86 node just before wire 4, the 2.31 node at x ≈ 217 (computed ≈ 218).
  - The staff shows diamonds at sounding pitch with 8va.
- **#504 Harmonic chords:**
  - Em7 = E + D3 + G3; Esus2 = E F♯ B; Gmaj7 = G F♯ B; Cmaj7♯11 = C F♯ B; A7sus4 = A D G; D5 = D A D. All are correctly labelled.
  - On a 6-string bass the harmonics stay on the D and G strings.
- **#332 Chord formulas:** textbook spellings throughout: C° C E♭ G♭; C+ G♯; C°7 B♭♭ labelled ♭♭7; C6/9 C E G A D; Cm6/9; C7sus4; Cmaj7sus4; Cm13 with its 11.
- **The 14 new progressions:**
  - The chords are right.
  - The Neck's scales are right:
    - I – IV – V – IV: Ionian, Lydian, Mixolydian.
    - VI7: Phrygian dominant.
    - Neo-soul: Lydian, Phrygian dominant, Aeolian, Dorian, Mixolydian.
    - Fm6 in the minor plagal: melodic minor.
    - Backdoor B♭7: Lydian dominant.
    - Tritone sub D♭7: Lydian dominant.
    - G7alt: altered.
    - The minor bossa: E♭m7 Dorian, A♭7 Mixolydian, D♭maj7 Lydian, the iiø – V♭9 Locrian and Phrygian dominant.
    - The modal form: Dorian throughout.
    - The Phrygian vamp: Phrygian, then Lydian on the ♭II.
    - The Lydian vamp: Lydian, then Mixolydian.
    - The minor vamps: Aeolian with Dorian or Mixolydian.
  - The Key menu lists minor keys for minor forms.
- **Fills:** four kinds in turn over 4 phrases, per pattern: down the toms, a snare roll, linear S-H-H-K / S-L-L-K, and a flam with a roll down the toms.
- **Free and Pro:**
  - My progression and ✎ Edit show no Pro chip.
  - The Pro ⓘ counts match the data: 94 lessons and 4 optional in 30 units (the map says 37 + 41 + 16), 120 exercises (46 + 50 + 24), 30 progressions.
  - The free line names My progression in the sheet, the ⓘ and About's terms.
  - A free player placed at Stage 3 gets an L2–L3 session.
- **Settings:** the order is Backup, Progress, Feedback, Pro, Support, About. The tip hearts are the app's coral (rgb 227,135,110). The Feedback ⓘ is clear and names the address.
- **About:** "Made by Josich", the contact, the piano range "D3 to C6" (it matches the new files 50–84), the Apache notice, and the privacy text on Feedback, the rating card and GitHub Pages.
- **Rate card:** the wording is short and kind, and it fits at 780x360 and 640x300 (`…\mcp-Claude_Browser-blob-1793185606677-zghevt.jpg`). "Not now", ✕ and Escape close it.
- **Layout:** no horizontal scroll at 640, 780 or 915 on Home, Library, Course, the lessons, Practice, Settings, About and the new exercises. At 640 the Sound row wraps cleanly.
- **Today's session:** 🎧 rows without a circle and the ⓘ line "🎧 Hear it: a new lesson's exercise, played once for you…". At 1024 and 780 the session and favourites share the width.
