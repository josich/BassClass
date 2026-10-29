# QA User report · 6d8ee74 · 2026-10-29

Setup: round 21, commit 6d8ee74. The app files did not change while I worked (`git status` shows only the deep QA's `qa/tools/*21.js`).
- **Server and tab:** my own `qauser` server (port 8890) in my own tab. I never touched 8765 or 8878.
- **Profile:** empty at the start: one service worker unregistered, cache `bassclass-v1` deleted, localStorage and sessionStorage cleared, loaded with `?qa=u21b`.
- **Gates:** Settings → seven taps on the version line → Pro debug. Gates "On (as on Play)" with Pro not owned for the free-player checks. At the end I set the gates back to Off in my own storage.
- **Sizes:** 780x360 and 800x380 (main), 640x360, 640x300, 915x412 and 1024x768. Layout confirmed with `getBoundingClientRect`, scrollWidth and clientWidth. 4-string bass, C D E notation.
- **Personas:**
  - Beginner: Home, the first session, My level, the map.
  - Advanced player: the drone picker in every group and key, the Pro sheet, the Settings Pro card and its ⓘ, Free to try (placement at Stage 4, "▶ Try free", lessons 4.9 and 4.29, the Library and favourites afterwards), the rate card.
  - Jazz teacher: every drone card in all 12 keys (name, formula, the notes `droneMidis` schedules, the Neck's spelling), the six free lessons' texts, the "Related" lines, the two rewritten riff studies, About and the legal texts.
- **Not testable here:**
  - The sound itself. Notes were checked through `droneMidis`, which both the engine and the stopped-pick preview call.
  - The real e-mail app (I read what `sendFeedback` builds and did not press it).
  - Google Play's review card.
  - Real touch.
- **Screenshots:** in `C:\Users\OscarGaya\.claude\projects\E--CLAUDE-BassClass\c7f026a2-fcf4-440e-b62e-e6df46b13395\tool-results\`, shortened to `…\` below.

Counts: Blocking 0 · Wrong 2 · Confusing 4 · Irritating 1 · Texts 6 · Visual 1, plus 2 questions.

## Short verdict

What works well:
- The drone picker works and reads well: 44 cards in 7 groups, Pro cards edged gold, the lock line, and the picker reopening after the Pro sheet.
- Switching chords while playing takes effect on the next beat without restarting.
- At 640x300 to 1024x768 nothing overflows the page.
- Free to try is clear on the map (teal "Free" chip) and on Home ("▶ Try free · Lesson 4.9").
- "All yes" in My level leaves nothing to do: 0 lessons left, all 41 statements answered.

What a jazz teacher would object to:
1. **Spelling of the altered dominant drones.** Key A♭ gives "G♯7♭9" with a B♯ third, next to "A♭7♯9" and "A♭7alt". The Neck writes the alterations with double accidentals: E7♯9 shows "F♯♯", B7♯9 "C♯♯", E♭7♭5 "B♭♭". Both break the room's own rule ("A♭7♭9: A", "A♭7♭9 and A♭7♭5 keep their names").
2. **The Cm13 drone has no 13th.** It sounds exactly like the Cm11 drone.

The main confusion is Free to try: the exercise a free lesson plays is locked in the Library and in Favourites with "Level 4 is part of BassClass Pro". After Stage 4's two lessons, Home stops offering the free lessons of Stages 5 and 6.

## Blocking     (a user cannot do what the screen is for)

None found.

## Wrong        (incorrect musical or factual information)

### W1. Altered dominant drones: sharp root names in a flat key, and double accidentals on the Neck
- **Where:** Practice room → Harmony → Drone → Change → "Altered dominants" (also "7th chords" and "6ths and added notes"); the Neck in Chord view.
- **Root names (`droneName`, `droneRoot` → `T.bestRoot` with the chord's intervals):**
  - With Key A♭ the cards read "G♯7♭9", "A♭7♯9", "A♭7♯11", "A♭7♭13", "G♯7♭5", "A♭7♯5", "G♯7sus♭9", "A♭7alt".
  - Picking 7♭9 switches the Key menu itself to "C C♯ D E♭ E F F♯ G G♯ A B♭ B".
  - The Neck then reads "🎹 G♯7♭9: G♯ – B♯ – D♯ – F♯ – A": a B♯ third, against the rule "never B♯, E♯, C♭ or F♭" for chords picked on their own.
  - The same split appears on every black key: C♯7♭9, C♯7♭13, C♯7♭5, C♯7sus♭9 beside D♭7, D♭7♯9, D♭7alt; and F♯7♭9, F♯7♭13 beside G♭7, G♭7♯9.
  - Evidence: `…\mcp-Claude_Browser-blob-1793269196958-zpmbpd.jpg` (the card names) and `…\mcp-Claude_Browser-blob-1793269210931-8koe1f.jpg` (the Neck, "G♯ – B♯ – D♯ – F♯ – A").
- **Alterations written academically on the Neck.** The Neck follows a drone chord as `shown() = 'c:*'`, so `key.startsWith('dom')` in `spell` is false and only a °7's 7th is made plain (`ui/neck.js`, the line `if (kind === 'c' && lead) …`). What the Neck shows:

  | Drone | Neck shows | Plain spelling |
  |---|---|---|
  | E7♯9 | E – G♯ – B – D – F♯♯ | G |
  | B7♯9 | … – C♯♯ | D |
  | E♭7♭5 | E♭ – G – B♭♭ – D♭ | A |
  | D♭7alt | D♭ – F – C♭ – E – B♭♭ | A |
  | B♭7♭9 | … – C♭ | B |
  | E7♯5 | … – B♯ | C |

  Others (computed): G♭7alt with E♭♭; A7♯5 with E♯; A♭7♭13 with F♭.
- **The same chord in Chords mode is written plainly.** There `key` is `dom7s9` and so on, which gives two spellings of one chord in one room.
- **Rules this breaks (CLAUDE.md):**
  - "On a dominant the ♭9/♯9/♯11/♭13 are alterations even when the symbol names them (A♭7♭9: A)".
  - "A♭7♭9 and A♭7♭5 keep their names".
  - "The Neck spells as jazz players do: a dominant's alterations … plainly".
- **Smaller inconsistencies from the same cause:**
  - Key B♭: "B♭°" beside "A♯°7".
  - Key A♭: "A♭m6", "A♭m6/9", "A♭m13" beside "G♯m", "G♯m7", "G♯m9", "G♯m11".
  - The Key menu flips between the two spellings as the player browses chords.
- **Suggestion:** name a drone's root from its chord's own tones only (R 3 5 ♭7 for every dominant, R ♭3 5 for every minor), so the alterations never pick the root's name. Have the Neck treat a drone chord as its `type` (pass `type` as well as `ivs`), so dominant alterations are made plain as in Chords mode.

### W2. The Cm13 drone sounds no 13th: it is the Cm11 drone again
- **Where:** Drone → "9ths, 11ths, 13ths" → Minor 13th. The card reads "Cm13 · R ♭3 5 ♭7 9 11 13".
- **What it sounds:** `droneMidis(0, 'min13')` = C4 E♭4 B♭4 D5 F5. This is exactly `droneMidis(0, 'min11')`.
- **Why:** `chordMidis` drops the 5th and then keeps the first five intervals (`ivs.slice(0, 5)`), so the 13th (A) is the one cut.
- **What the Neck shows:** its Chord view displays seven notes, the A included ("A♭m13: A♭ – C♭ – E♭ – G♭ – B♭ – D♭ – F" in key A♭), so the player looks for a 13th they never hear.
- **Why it matters:** this is the only card in the room whose name tone is missing. (C13 keeps its 13 because its formula has no 11.)
- **Suggestion:** for a 13th chord drop the 11 before cutting to five notes (C E♭ B♭ D A), or the 9.

## Confusing    (misleading, illogical, makes no sense)

### C1. The C11 drone holds the 3rd and the 11th together, a minor 9th apart
- **Where:** Drone → Dominant 11th, "C11 · R 3 5 ♭7 9 11".
- **What it sounds:** C4 E4 B♭4 D5 F5. The E4 and F5 form a minor 9th.
- **Why it matters:**
  - This is the classic avoid-note clash. Held as a drone under a scale it sounds like a wrong note, not like an 11th chord.
  - Pianists and lead sheets voice C11 without the 3rd (C B♭ D F, "B♭/C", the 9sus4 sound).
  - The app's own Chord formulas ⓘ says "an 11th chord often leaves out its 3rd".
  - The minor 11th (C E♭ B♭ D F) is fine; only the dominant one clashes.
- **Suggestion:** voice the C11 drone without its 3rd (C B♭ D F, or C F B♭ D G), keeping the card's textbook formula. Alternatively, show the formula as played ("R 5 ♭7 9 11").

### C2. Free to try: the exercise a free lesson plays is locked everywhere else, with no word why
- **Where:** gates on, Pro not owned.
- **Steps:**
  1. My level → Stage 3 "All yes" → See my starting point. The toast reads "…try it free with Lesson 4.9".
  2. Lesson 4.9 → step 1 opens #413 "The 7 scale positions…", which plays.
  3. Its ☆ adds it to favourites, with the toast "Added to your favourites on Home".
- **What I saw:**
  - Home's Favourites shows #413 at once with a "Pro" chip and the gold edge.
  - Library → search 413: a "Pro" card. Tapping it gives "🔒 Level 4 is part of BassClass Pro".
- **What is missing:**
  - Nothing tells the player that #413 is free inside Lesson 4.9 only.
  - The lesson page itself never says "free to try".
  - The map's "Free" chip explains itself only through a `title` tooltip ("Free to try: the rest of this stage is part of BassClass Pro"), which a phone never shows.
  - The Stage 4 header reads "Pro · 0/37 lessons", with no "2 free".
- **Why it matters:** the player has just played the exercise, so a lock on it looks like a bug, or like the free lesson being taken back.
- **Suggestions:**
  - Give the reason line for a Pro exercise that a free lesson uses: "🔒 #413 is part of Pro: play it free in Lesson 4.9".
  - Hide ☆ (or say why) in an exercise opened from a free lesson.
  - Add a line on the lesson page, or the stage header "Pro · 2 free".

### C3. After Stage 4's two free lessons, Home says the free part is over, but four free lessons remain
- **Where:** Home's Course row and today's session, free player placed at Stage 4.
- **Steps:** finish 4.9, then 4.29.
- **What I saw:**
  - The row goes "▶ Try free · Lesson 4.9" → "▶ Try free · Lesson 4.29" → "✓ Stages 1–3 · Stages 4–6 Pro".
  - The free lessons 5.9 Bebop scales, 5.14 The modes of melodic minor, 6.6 and 6.8 are no longer offered.
  - The session takes no course steps either.
- **Why:** `tryLesson(cont)` only looks inside the next lesson's own stage (`ui/course.js`); its comment says "(a later stage's are on the map)".
- **Why it matters:**
  - The Course ⓘ promises "2 lessons of each free to try".
  - A player who sees "✓ Stages 1–3" plus a locked button has no reason to look for free lessons in Stages 5 and 6 on the map.
- **Suggestion:** look for the next free lesson in later stages too ("▶ Try free · Lesson 5.9").

### C4. Over a drone chord, "Scale" shows the player's own scale (Major by default), which clashes with the chord
- **Where:** Drone on a chord → the Neck's Chord | Scale | Off → Scale.
- **What I saw:**
  - Over "Drone: G♯7♭9" the Neck shows "A♭ Major (Ionian): A♭ – B♭ – C – D♭ – E♭ – F – G". That is a natural 7th against the drone's ♭7, no ♭9, and the root named A♭ against the drone's G♯.
  - Over Cm7 it shows C major with E natural.
  - Evidence: `…\mcp-Claude_Browser-blob-1793269218960-okg9g6.jpg`.
- **What it contradicts:**
  - In Chords mode the same "Scale" button shows the scale that fits the chord (`scaleFor`).
  - The Neck ⓘ still says "🎼 Chord or Scale: the chord sounding or its scale".
  - The Harmony ⓘ does say "(over a drone: Chord its chord, Scale your own scale on its key)", but a player who picked Cm7 to "hear a scale's colour" gets a major scale over it.
- **Suggestion:** over a drone chord, open Scale on a scale that holds the chord's tones (the room's own `scaleFor` or `modeFor`: Cm7 Dorian, C7♭9 half-whole, C7alt altered, Cmaj7♯5 Lydian augmented), and keep the player's own choice under Off. Or call the button "My scale" there.

## Irritating   (works, but annoys or slows the user)

### I1. Closing the Pro sheet reopens the picker on the current choice's group, not the group being browsed
- **Where:** Drone → Change → "6ths and added notes" → tap "Major 6th" (Pro) → the Pro sheet → Escape.
- **What I saw:** the picker reopens on "7th chords", the group of the current drone (C7), not on "6ths and added notes". The player browsing Pro cards is sent back each time.
- **Scope:** the same `openPicker` reopen is used for drum patterns and progressions.
- **Suggestion:** reopen on the group of the card that was tapped.

## Texts        (typos, unclear wording, inconsistent names)

### T1. The Harmony ⓘ's first line is a four-line nested sentence
- **The line:** "🎹 Something to play over: a drone (the key's root and 5th, held, or a chord you pick beside the key: triads, 7ths, 9ths to 13ths, altered, voicings) for scales and modes, or a chord progression". At 800x380 it is four lines with a colon inside brackets.
- **What it leaves out:** the "6ths and added notes" group, and that a pick while stopped is heard once.
- **Another line:** "(over a drone: Chord its chord, Scale your own scale on its key)" reads oddly.
- **Suggestion:**
  - "🎹 Something to play over: a drone or a chord progression"
  - "🎵 Drone: the key's root and 5th, or any chord or voicing from Change; stopped, a pick plays once"
  - "🎸 Over a drone the Neck shows its chord (Chord) or your own scale (Scale)"

### T2. Drone card texts
- **Voicing cards say their formula twice:**
  - "Major, spread · C (R 5 10) · R 5 10".
  - "Minor, spread · C♯m (R 5 ♭10) · R 5 ♭10".
  - "4ths and a 3rd · C♯m11 (4ths + 3rd) · R 4 ♭7 ♭10 5".
- **Mixed simple and compound intervals:**
  - "4ths and a 3rd" writes its top note (19 semitones, an octave and a 5th) as "5", next to "♭10". It should be "12".
  - The Neck labels the same voicing's 4th "11" (from `iv: '11'`), while the card says "4".
- **"Root alone"** plays the root and its octave ("R 8"): "Root and octave" says what it is.
- **Card titles:**
  - "maj7 shell", "7 shell", "m7 shell" start in lower case, among "Major, spread", "Major 7th".
  - "Dominant 13" sits beside "Dominant 11th" and "Minor 13th" (`theory.js` CHORDS name).

### T3. Free to try wording
- **The placement toast:** "Your starting point is Stage 4, part of BassClass Pro: try it free with Lesson 4.9…". "It" reads as Stage 4. Suggest "…part of BassClass Pro. Two of its lessons are free: start with Lesson 4.9".
- **The lock line:** "The Major 6th drone is part of BassClass Pro: the open drone, the triads and the five basic 7th chords are free". The free "Root alone" is not named, and the same holds in `FREE_LINE` ("the drone (open, on the triads…)"). Minor.

### T4. Some "Related" lines name living players another way than "in the style of"
- **The agreed form (CLAUDE.md, launch legal review):** "players named as a style ('in the style of Rocco Prestia')". These lines use other forms:
  - "Double thumbing, as played by Victor Wooten"
  - "Chordal bass as played by Jaco Pastorius and Victor Wooten; advanced graded exams"
  - "Advanced graded exams (LCM); 10ths as played by Jaco Pastorius"
  - "…interval cycles in the language of John Coltrane and Michael Brecker"
  - "Pentatonic side-stepping in the language of Michael Brecker and Scott Henderson"
  - "Sweep picking from rock and fusion guitar (Frank Gambale, Yngwie Malmsteen)"
- **An over-broad claim:** #333 "Chord tones over progressions" (`hm-chord-tones`) has "every academy builds lines as chord tones first". "Every academy" is a claim no one can check. Suggest "bass methods usually build lines…".
- **The song studies:** their disclaimer ("Original line in the style of… Not a transcription…") sits under the heading "RELATED", where a reader expects related listening. Minor.

### T5. About and the terms
- **The drone's sound:** "Made in the app: … the drone … synthesised by BassClass itself." With Sound = Piano the drone (and the chords) play the recorded Kawai samples.
- **An unclear sentence:** "BassClass has no tracking, no ads and no third-party web code or fonts: the app itself was written for it." The second half is unclear. Suggest "…: all of its code was written for BassClass."
- **The terms' licence line:** "The drum samples remain under their CC BY 4.0 licence". Only MuldjordKit is CC BY; the snare, percussion and brushes are CC0. Suggest "The MuldjordKit drum samples remain under…".

### T6. Feedback and small consistency
- **The Feedback ⓘ:** "🐞 It names the app's version and your phone". The e-mail now also carries the app's last error messages, and the privacy policy says so. The ⓘ should say it too, since the player is the one who decides to send them. Round 20's T5 covered the rest of this list.
- **"email" and "e-mail":** "email" is used in the Feedback ⓘ, the toast and the privacy policy, but the Backup ⓘ has "Drive, e-mail, a computer".
- **The Pro sheet's repeat:** it says "one payment, yours for good" twice, in the text ("…One payment, yours for good: no subscription, no ads.") and on the Buy button just below.

## Visual

### V1. A free lesson's "Next" button cuts off its Pro chip (and the ›)
- **Where:** Lesson pages 4.9, 4.29, 5.9, 5.14, 6.8, at 780x360, 800x380 and 915x412 (two-column layout).
- **What happens:** the "Next: Lesson … ›" button has `overflow: hidden` and its text is longer than the column. Measured at 780x360:

  | Lesson | Button (left–right) | Pro chip (left–right) | scrollWidth / clientWidth |
  |---|---|---|---|
  | 4.29 | 441–751 | 822–853 | 425 / 308 |
  | 4.9 | 441–751 | 757–788 | 361 / 308 |
  | 5.14 | 449–766 | 788–819 | |

- **Result:**
  - The free player sees "Next: Lesson 4.30 · The 7th chords of a ke…" with only a gold edge and no "Pro".
  - At 915x412, 4.29's chip still sits at 900–932 against the button's right edge at 901.
  - At 640 the page stacks and it fits.
- **Evidence:** `…\mcp-Claude_Browser-blob-1793269871340-2cqmop.jpg` (780x360) and `…\mcp-Claude_Browser-blob-1793269503012-ct9xvf.jpg` (800x380, the chip half cut).
- **Suggestion:** let the title ellipsis shrink while the chip and › keep their place (`min-width: 0` on the text, `flex: none` on the chip).

## Questions for the owner

1. **Shells and spread triads are Pro, while the chords they come from are free.**
   - "Major, spread" (R 5 10) is the free major triad voiced open, and "7 shell" (R ♭7 10) is three notes of the free C7.
   - A free player may read a lock on a thinner version of a free chord as stingy.
   - Make the five voicings of free chords (two spreads, three shells) free, and keep 4ths, extensions and alterations Pro?
2. **The Guitar sound over a drone chord plays only a power chord.**
   - With Sound = Guitar, `powerChord` reduces C7♯9, Cmaj7 or C6/9 to C5 (C7♭5 and C7♯5 keep their altered 5th).
   - Meanwhile the Neck shows the full chord, so the colour the player picked is not heard.
   - Leave it (the guitar is power chords by design), or say "Guitar: power chords only" in the drone row when it plays?

## Checked and fine

- **Drone picker contents:**
  - 44 cards: Root and 5th 2, Triads 6, 7th chords 9, 6ths and added notes 5, 9ths/11ths/13ths 7, Altered dominants 8, Voicings 7.
  - The header count "44" matches.
  - Free and Pro split as described (13 free: open, root, 6 triads, maj7, 7, m7, m7♭5, °7), matching "31 more drone chords and voicings" in Settings' Pro ⓘ.
- **Drone notes (key C):** the root sits at C4, inside E3–D♯4.
  - Triads and 7ths are complete.
  - Ninths drop the 5th (Cmaj9 C E B D).
  - C13 = C E B♭ D A.
  - C7alt = C E B♭ E♭ A♭.
  - C7sus♭9 = C F B♭ D♭.
  - The spread voicings are R 5 10.
  - The shells are R 7 10.
  - The 4ths stack is C F B♭ E♭; with the 3rd on top it is C F B♭ E♭ G (the "So What" voicing, rightly named m11).
  - Only W2 and C1 are wrong.
- **Drone behaviour:**
  - Stopped, a pick plays once.
  - While playing, a new chord takes over on the next beat with no restart; the drone row, the Neck bar ("Drone: C7") and the Neck line update.
  - No console errors.
- **Pro behaviour:**
  - A locked card opens the Pro sheet with a clear line, and Escape returns to the picker.
  - A stored Pro drone falls back to the open one for a free player.
- **The Neck:**
  - Over a drone chord it offers Chord | Scale | Off; over the open drone only Scale | Off.
  - Labels give the chord's own degrees (♭9, ♯11, 13); a °7 writes its 7th plainly (C°7: C E♭ G♭ A).
- **Layout:** at 640x300, 640x360, 780x360, 800x380, 915x412 and 1024x768 there is no horizontal scroll in the room and the drone row never overflows. Picker cards grow to fit ("4ths and a 3rd" wraps to 3 lines, 64 px, no overlap), and the picker fits 640x300 (top 10, bottom 290).
- **Free to try:**
  - The map shows the six "Free" chips (4.9, 4.29, 5.9, 5.14, 6.6, 6.8), the rest gold.
  - Home reads "▶ Try free · Lesson 4.9", then 4.29.
  - The placement toast names the lesson, and the session plays the lesson's demo and steps, its warm-ups and focus from Level 3.
  - The six free lessons' theory is right:
    - bebop dominant and major
    - "G altered = A♭ melodic minor", "G7♯11 = D melodic minor"
    - harmonic major's iv minor and vii°7
    - Mixolydian ♭2 over V7♭9 → I
- **Pro sheet:**
  - Its list and counts match the data: 88 lessons, 120 exercises, 15 studies, 124 patterns.
  - Its foot keeps Buy and Restore in view at 800x380.
- **Settings:**
  - The Pro ⓘ lists the drone chords by group.
  - The test prices show "(test)".
  - Support's tips have the coral heart.
- **Rate card:** the stars are now a picture, with one "⭐ Rate on Google Play" and "Not now". It closes cleanly.
- **About:**
  - Credits match the files.
  - The privacy policy's Feedback paragraph now lists the version, the phone model and Android version, the screen, the strings, the date and the errors, matching `feedback.js`.
  - The date reads 29 October 2026.
  - British spelling throughout ("licence", "practise", "equalised").
  - No online school, course or teacher's method is named in the app, `docs/RESEARCH.md`, README or the store listing (searched).
- **Song studies:**
  - The Source line carries "Not a transcription… Not affiliated with or endorsed by…".
  - The Seven Nation Army and Another One Bites the Dust studies no longer open on their records' riffs. Their notes fit the chords (B7's D♯, the C and D bars) and the texts describe them.
- **My level:**
  - Every unit has a statement, including the pentatonic units and the formulas line.
  - Stage 6 "All yes" answers all 41 statements "Yes" and leaves 0 lessons to do (every non-optional lesson done or known).
