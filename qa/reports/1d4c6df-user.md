# QA User report · 1d4c6df · 2026-11-04

Setup:
- **Commit:** 1d4c6df (main, build v1.0.190). Scope: `git diff 7c4c571..1d4c6df`:
  - the QA round 24 fixes (tunes, #415, the ear drills and theory games in tap mode, tap steps in lessons, unticking, Audio delay);
  - the quiz staff that hides the notes ahead (`hideAhead`);
  - the neck's area: the grey outside what an exercise or a question uses, and the black-and-white dot with its hint.
- **Server and tab:** my own `qauser` server (port 8890) in its own tab. I never touched ports 8765 or 8878 or the user's tab. At the end I cleared my origin's storage, reset the viewport, closed the tab and stopped the server.
- **Profile:** empty at the start: one service worker unregistered, cache `bassclass-v1` deleted, localStorage and sessionStorage cleared, loaded with `?qa=u25`.
- **Sizes and bass:**
  - 800×380 (main) and 640×300;
  - 390×800 portrait: Settings only, since exercises ask to turn the phone;
  - 915×412 and 1024×768 not tried this round;
  - a 4-string bass, plus a 5-string for the area check. Layout measured with `getBoundingClientRect`.
- **Personas:**
  - Beginner: Lesson 1.1, Lesson 1.9 and its #113 tap step to the end card, #107, #219, Settings → Audio delay in portrait.
  - Advanced player: every exercise with a String, Position or Zone option, by its area; #313 in tap mode; #219 in play and tap mode at several subdivisions; #315 played to the end card in the Library.
  - Teacher:
    - 140 chord ear rounds (#226/#315, every type and root): names and spellings;
    - #454's ♯9 on all 12 roots;
    - #412 in its three sets;
    - #415's classical melodic minor in five patterns;
    - the tunes' texts and fingerings.
- **The area table:** for every exercise with a `string`, `pos` or `zone` option, and every choice of it, I rebuilt the line with the app's own `areaFor` rule and compared the grey with the notes played (about 150 cases).
- **Not testable here:** the sound, real touch, Android, and Audio delay against a real Bluetooth delay. I checked what is shown and scheduled instead.
- **Screenshots:** in `C:\Users\OscarGaya\.claude\projects\E--CLAUDE-BassClass\c7f026a2-fcf4-440e-b62e-e6df46b13395\tool-results\`, shortened to `…\` below.

Counts: Blocking 0 · Wrong 1 · Confusing 6 · Irritating 1 · Texts 4 · Visual 2, plus 5 questions.

## Short verdict

What works well:
- **The grey works well along the neck.** "Fret 5" in #102 lights exactly frets 5–8. #313 in 5th position, #218's zone and #219's "frets 0–5" end cleanly on the fret wire.
- **The area always holds every note.** In about 150 option combinations the area never hides a note the exercise plays.
- **The hint is a good idea and reads well:**
  - "That F is at fret 8: tap one in frets 0–5";
  - "That C is on the D string: tap it on the E or A string";
  - the score does not move;
  - the light grey dot with a dark letter is easy to read at 640×300.
- **The content is right:**
  - the chord ear rounds name and spell all 140 chords right (G♯m6, D♯m7♭5, B♭°7 = D♭ F♭ A♭♭);
  - #454's ♯9 is right on all 12 roots (B♭ over G7, B over A♭7);
  - #412 now asks the ii of ii – V – I.
- **The lesson tap steps are clear and consistent:**
  - "#113 · 👆 8 of 10" on the row;
  - "8 of 10 passes" in the subtitle;
  - "Goal: a set of 10 with 8 or more right. The step ticks itself." in the drawer;
  - an end card with no Harder.

What I would fix first:
1. **Across the strings, the grey's edge makes unused strings look lit (C1).**
   - The grey's edge sits *on* the next string, and notes are played on the strings. So that string looks lit.
   - A one-string exercise (the A string) lights D, A and E.
   - "E & A only" lights D, A and E on a 4-string, and B, E, A and D on a 5-string.
   - Players then tap a string the screen seems to offer and get the hint.
2. **The "hidden" notes on the quiz staff leave their stems and beams visible (C2).**
   - The stem ends show where each hidden head is.
   - In #219 at 2 notes a beat: 24 stems and 12 beams visible, 24 heads hidden.
   - The reading drills in tap mode (#313) show floating beams even before ▶.
3. **After a miss, the chord ear drills show the chord's tones below its root (C3).**
   - G7 shows its ♭7 on the E string, fret 1, under the root; D♯m7♭5 shows its ♭5 and ♭7 under the root.
   - The chord sounded above the root (R-5-7-10), and the question says "the chord over its root".

## Blocking     (a user cannot do what the screen is for)

None found.

## Wrong        (incorrect musical or factual information)

### W1. README states things about the app that are no longer true (outside the app, but public)
- **Where:** `README.md`.
- **What it says, and what is true:**

  | README | The app now |
  |---|---|
  | Line 62: "Its one use of the internet: the Practice room's drum samples load once, on first use" | The manifest removes INTERNET (`android/app/src/main/AndroidManifest.xml` line 9: `tools:node="remove"`; line 5: "everything is inside the app") |
  | Line 21: the kit "loads once on first use, from the repository in the Android app" | The kit is inside the APK |
  | Line 21: the piano is "about 1 MB, downloaded the first time" | The piano is inside the app |
  | Line 21: the guitar "chugging power chords" | Whole chords since 2026-10-29 |
  | Line 19: "until you mark it ✓ Practised" | The button is "Finish session" |
  | Line 6: "248 exercise families in 16 topics" | 262 exercises, 17 topics |
  | Line 5: "55 units, 183 lessons, six of them optional" | 60 units in the course data |
  | Line 25: "33 original phrases" (licks) | Not recounted |

- **Why it matters:** the internet line is a privacy claim, and it is false. Anyone reading the repository, or copying from it for a store listing, gets the wrong picture.
- **Suggestion:** refresh the README's feature list from CLAUDE.md, or drop the numbers.

## Confusing    (misleading, illogical, makes no sense)

### C1. Across the strings, the grey's edge makes unused strings look lit: one string asked, three look in use
- **Where:**
  - every area that leaves out some strings;
  - #219 "E & A only";
  - #113, one string per question;
  - the one-string exercises #107, #108, #304 and #319;
  - the string-pair exercises #215 and #224.
- **What I saw:**
  - The bright area spans from string to string: for E and A, from the D string down.
  - The edge string's line is drawn bright inside the frets, the same as the strings in use.
  - Measured in #219: the grey rows are `41,101,746,42` (G to D) and `496,143,…` (beyond fret 5). The bright box is y 143 (the D string) to 248.

  | Asked | Strings that look lit |
  |---|---|
  | #319 on the A string | D, A and E, along the whole neck. Only the G string and the edge under E are dimmed |
  | #113, the G string | G and D. The box runs from the board's edge to the D string, so the G string is not even centred in it |
  | #107, the E string | E and A |
  | #219 E & A only, 5-string | B, E, A and D (frets 0–5). Only G is greyed |

  - A D-string note at fret 3 in #219 sits half in the bright area. Tapped, it gets "That F is on the D string: tap it on the E or A string".
- **Why it matters:**
  - Along the neck, the wire is a natural edge, because notes sit between the wires.
  - Across the neck, notes sit *on* the strings, so a string on the edge reads as "in".
  - For a one-string exercise the grey says "these three strings". That is the opposite of its message.
- **Evidence:**
  - #219: `…\mcp-Claude_Browser-blob-1793787798743-rhhj9l.jpg`, zoom `…\mcp-Claude_Browser-blob-1793787818010-uiu5u9.png`, the D-string tap `…\mcp-Claude_Browser-blob-1793787901903-pk0sok.jpg`;
  - #113: the G string `…\mcp-Claude_Browser-blob-1793788023492-dp4j3d.png`, the A string `…\mcp-Claude_Browser-blob-1793787993331-0s88bj.png`;
  - #319, the A string: `…\mcp-Claude_Browser-blob-1793788116683-r4ffoh.png`;
  - #107: `…\mcp-Claude_Browser-blob-1793788768384-lb2x22.jpg`;
  - 5-string #219: `…\mcp-Claude_Browser-blob-1793788816142-l03q0b.png`.
- **Suggestion:** keep the fret edge on the wire, but draw the strings outside the area dimmed along their whole length. The boundary string then reads as "out" while the band stays aligned. Another way is to end the band halfway to the next string. (This was the owner's choice in 1d4c6df, so see question 1.)

### C2. Quiz staff and reading tap drills: the hidden notes' stems and beams stay visible and show where the heads are
- **Where:**
  - #219 Note-finder quiz in play mode, staff view, at 2 notes a beat or more;
  - the same for #225 in play mode;
  - the reading drills in tap mode whose melodies have 8ths, such as #313 Reading up the neck.
- **What I saw:**
  - **#219 at ♪ 2/beat:**
    - All 24 note heads (`ellipse.shf`) are hidden.
    - All 24 stems (`line.sst`) and 12 beams (`path.sbm`) are visible, because they are drawn outside the hidden `.sn` groups.
    - Each stem's free end is where the head would be, so the whole line can be read before it plays.
    - At ♩ or half notes, the stems are inside the groups and hidden.
  - **#313 in tap mode:** before ▶, the empty staff shows two floating beams with stems (bars 1 and 3). After the first answer, a beam with its two stems stands in bar 2.
- **Why it matters:**
  - In #219 the fix of 86f2c5e is undone at any subdivision with beams: the pitch heights give the places away.
  - In a reading drill, the next notes' rhythm and height show before they are asked, and a bare beam is an odd sight on a staff.
- **Evidence:**
  - #219: `…\mcp-Claude_Browser-blob-1793788231028-uymbq2.jpg`, zoom `…\mcp-Claude_Browser-blob-1793788235049-2v1xf8.png`;
  - #313: `…\mcp-Claude_Browser-blob-1793788145941-373r85.png` and, before ▶, `…\mcp-Claude_Browser-blob-1793788934431-9sz33t.jpg`;
  - the DOM count above.
- **Suggestion:** hide a beam group's stems and beam with its first hidden note, or draw them inside the notes' groups.

### C3. Chord ear drills: after a miss, the answer shows the chord's tones under the root, not the chord as it sounded
- **Where:** #315 (and #226) in tap mode, after a wrong tap.
- **What I saw:**

  | Chord | Root shown | Tones shown | Below the root |
  |---|---|---|---|
  | G7 | E string, fret 3 | 3 on the A string, fret 2; 5 on the A string, fret 5; ♭7 on the E string, fret 1 | the ♭7 (F) |
  | D♯m7♭5 | A string, fret 6 | ♭3 on the A string, fret 9; ♭5 on the E string, fret 5; ♭7 on the A string, fret 4 | the ♭5 and the ♭7 |

  - The question says "The chord over its root: tap its 3rd, 5th and 7th".
  - The chord sounded R-5-7-10 above the root.
- **Why it matters:**
  - A teacher would show the chord as a shape above its root: the voicing just heard, or the hand shape bassists learn (R-♭3-♭5-♭7 on the A string, fret 6: D string frets 4 and 7, G string fret 6).
  - Tones scattered under the root teach no shape. A learner may also think the chord is an inversion.
  - Any octave still answers, which is fine. This is only about what is *shown*.
- **Evidence:** G7 `…\mcp-Claude_Browser-blob-1793788504982-90x642.jpg`; D♯m7♭5 `…\mcp-Claude_Browser-blob-1793788527401-95fenr.jpg`.
- **Suggestion:** show each tone at its place above the root within one hand position (the voicing played, or the nearest place above the root).

### C4. #415 classical melodic minor: in some patterns the groups run against the form's own rule
- **Where:** #415 Harmonic and melodic minor, Scale "Classical melodic minor (up melodic, down natural)", in A.
- **What the app plays:**
  - **Groups of 4 reversed:**
    - going up: `D C B A | E D C B | F♯ E D C | G♯ F♯ E D | A G♯ F♯ E`;
    - coming down: `E F G A | D E F G | C D E F | B C D E | A B C D`.
  - **Up 3, down 1:** coming down, `A G F G`, `G F E F`, rising with the natural notes.
  - **Groups of 3, Groups of 5:** correct (`E F♯ G♯ | F♯ G♯ A`, then `A G F | G F E`).
- **What the form says:** the exercise's own tip reads "Classical: the 6th and 7th raised going up, ♭7 and ♭6 coming down". The about adds that the raised notes are there to lead up to the tonic.
  - `E F G A` *rises to the tonic* with F and G natural, which is exactly what the classical form avoids.
  - `A G♯ F♯ E` *falls* with the raised notes.
  - The app follows the direction of the whole scale, not of the line the player hears.
- **Why it matters:** a teacher hearing E F G A → A in "classical melodic minor" would correct it at once. It sounds Aeolian, not melodic.
- **Suggestion:** with the classical form, spell each group by its own direction, or offer only the patterns that move with the scale (Groups of 3, 4 and 5, 3rds). See question 3.

### C5. Before ▶, a random set shows a question that is then not asked
- **Where:** tap mode with random sets.
- **What I saw:**
  - **#113 "Any string" (Lesson 1.9, step 3):**
    - Before ▶ the neck lights the A string's area (the first question's area, as the code says).
    - ▶ draws a new set, and the first question is "The open E string, then a note on it".
  - **#313:** "ready · 13 notes · ▶ to start", then "1/14". Another time: "ready · 14 notes", then "1/11".
- **Why it matters:** the preview promises a string or a length the set does not have. A beginner who reads "the A string" gets ready for the A string.
- **Evidence:**
  - #113: `…\mcp-Claude_Browser-blob-1793788329519-nylco6.jpg` (before ▶), then `…\mcp-Claude_Browser-blob-1793788346476-7xcys9.jpg`;
  - #313: the counts above, seen twice.
- **Suggestion:** keep the set drawn before ▶ as the one ▶ plays. Or, before ▶, show only the option's whole area (every string for "Any string") and "10 questions".

### C6. The same kind of exercise is greyed in one place and not in another
- **Where:** exercises that use part of the neck but have no `string`, `pos` or `zone` option.

  | Exercise | What it plays | Not greyed, while… |
  |---|---|---|
  | #229 Chromatic scale, Layout "Along one string" | E string only, frets 8–20 | #108 (all 12 notes on one string) and #319 (a scale on one string) grey the other strings |
  | #110 The octave shape, #208 Octave jumps | One string pair (E → D) | #224 Moving intervals (also a string pair) greys |
  | #111 and #220 reading, Notes "E and A strings" | The E and A strings only | #219 "E & A only" greys, in both modes |
  | #209 Dynamics ladder | The A string only | Only its frets (5–8) are greyed |
  | #336 Double stops, "R + 10th (E & G strings)" | The E and G strings only | Not greyed |

- **Why it matters:** a player sees the grey help in one exercise and miss in its neighbour, with the same idea and the same words.
- **Suggestion:** give these lines an `area` (or treat `layout: 'string'`, `pair` and `range: 'ea'` like `string`). #209 and #336 are optional.

## Irritating   (works, but annoys or slows the user)

### I1. The wrong-string hint does not mention the frets, so it can take two hints to find the place
- **Where:** #219, frets 0–5, E & A only.
- **What I did:**
  1. Asked for C, I tapped the D string's fret 10.
  2. "That C is on the D string: tap it on the E or A string."
  3. On the E string, C is at fret 8, outside the area.
  4. Tapping it gives "That C is at fret 8: tap one in frets 0–5". Only the A string's fret 3 works.
- **Evidence:** `…\mcp-Claude_Browser-blob-1793788704724-3j006o.jpg` (640×300).
- **Suggestion:** when the question has both a string and a fret limit, say both: "tap it on the E or A string, frets 0–5".

## Texts        (typos, unclear wording, inconsistent names)

### T1. "That D is at fret 0"
- **Where:** #313 in tap mode, 5th position, tapping the open D.
- **Exact text:** "That D is at fret 0: tap one in frets 5–8".
- **Suggestion:** "That D is the open D string: tap one in frets 5–8".

### T2. #315's end card: "🏅 asks for 8 of 10 on …plus m(maj7), 6 and m6"
- **Where:** #315, Library, after a set on the default "maj7, 7, m7, m7♭5, °7".
- **What I saw:** the choice's label is shown on its own. It starts with "…plus", which only makes sense beside the option it extends.
- **Evidence:** `…\mcp-Claude_Browser-blob-1793788518288-n29see.jpg`.
- **Suggestion:** give the choice a full name ("All 8: the five, plus m(maj7), 6 and m6"). See also question 2.

### T3. In tap mode, the drawer of a tap drill still describes play mode
- **Where:** #219 in tap mode, ⓘ.
- **What it says:**
  - The about: "The name of the next note is shown in the top-right corner. Find and play it before the beat; the dot appears when the beat arrives…".
  - The focus points: "Start at 50 BPM, half notes."
  - Then "How it works" describes tap mode.
- **The odd wording:** the line "The score is yours to beat; the exercise is cleared in play mode · 👆 beside › switches to play mode, the rounds played along". The words "the rounds played along" do not read as a sentence.
- **Suggestion:** "…switches to play mode, where you play the notes along on your bass."

### T4. #113 and the other games have two names on one screen
- **Where:** #113 in a lesson step. #227 and #316 work the same way.
- **What I saw:**
  - The header reads "Notes on a string, by ear".
  - The drawer's heading and the lesson row read "Hear it, tap it: notes on a string".
- **Suggestion:** fine as short and long names, but a beginner may not link them. One wording would help ("Notes on a string, by ear" in both).

## Visual

### V1. #113's short title is still cut: "Notes on a string, by …"
- **Where:** #113 header at 800×380.
- **Measured:** `B` "Notes on a string, by ear": scrollWidth 196 > clientWidth 192. The cut loses the key word, "ear".
- **Evidence:** `…\mcp-Claude_Browser-blob-1793787988211-u19uzp.jpg`.
- **Suggestion:** a shorter short title ("A string's notes, by ear", or "Notes on a string").

### V2. After switching 👆 from play mode to tap mode, the staff's label row shows all ten questions
- **Where:** #219 (and the other find drills).
- **What I did:**
  1. Opened #219 in play mode, then switched 👆 to tap mode and pressed ▶.
  2. After the first answer, the label row under the staff showed every question's note: "F C G F D F A D B G".
  3. Opened directly in tap mode, the row stays empty.
- **Measured:** 10 `text.tlbl`, all visible.
- **Evidence:** `…\mcp-Claude_Browser-blob-1793787945604-cg10fy.jpg`, `…\mcp-Claude_Browser-blob-1793787848206-i14xhe.jpg`.
- **Why it matters:** in a find drill the name *is* the question, so the coming order is given away. It also contradicts the hidden notes above it.

## Questions for the owner

1. **The grey across the strings (C1).** You chose to put the grey's edges on the strings (1d4c6df).
   - Keep that, but dim the strings outside the area (my suggestion)?
   - Or end the band halfway to the next string?
   - As it is, the edge string reads as "in" (three strings lit for one).
2. **#315's 🏅.** Should it need 8 of 10 on the set with m(maj7), 6 and m6, when its title lists the five 7th chords ("Hear the 7th chord: maj7, 7, m7, m7♭5, °7")? The 6 and m6 are not 7th chords.
3. **#415's classical form in sequence patterns (C4):**
   - spell each group by its own direction;
   - or offer the classical form only with patterns that move with the scale;
   - or keep the form by scale direction, as now.
4. **#412's numerals.** In "Minor ii – V – i" the verdict reads "ii°: C♯m7♭5". The numeral names the triad that sounds, the symbol names the progression's 7th chord. Is that the intent, or should the numeral be "iiø7" as elsewhere ("viiø7")?
5. **#225 in play mode.** The corner still reads "next F" before the interval's second note sounds, while the staff now hides that note. The about says this is the design (the name given, the place to find). But the title promises "hear it, name it". Keep it?

## Checked and fine

- **The neck's area along the frets:**
  - #102 "Fret 5" lights frets 5–8;
  - #313 lights frets 5–8 in tap mode, with "That C is at fret 3: tap one in frets 5–8";
  - #218 Zone 1 has the grey and its dashed zone together;
  - #219 frets 0–5;
  - #216 frets 0–12.
- **The rebuilt areas:** across the area table (every `string`, `pos` and `zone` choice on a 4-string), every area holds all the notes played.
  - #305 Simandl shows frets 1–6 because its line climbs four positions.
  - #319 "D string" in C plays on the A string, and its header says "on the A string".
- **The hint:**
  - It counts neither right nor wrong (✓ 0 stays).
  - The dot is light grey with a dark letter, readable at 640×300.
  - The text fits beside the question line at 640×300 and 800×380 (measured right edge 730 of 800).
  - #215's unison: "✓ B · the same pitch on another string".
  - #313: "✗ D: that D is an octave too low".
- **The games and drills:**
  - #113 greys all but the string asked and the frets past its Frets choice. Its open-string dot sits at the nut, inside the area.
  - #225 opens in tap mode with the whole neck: "✗ F, not E · the perfect 4th above · here in 2 places" (right: D string fret 3 and A string fret 8, both F3).
  - #454's prompt sets the key words big: "tap the tonic of the **minor** key with **no sharps or flats**".
  - #454's ♯9 on all 12 roots: A7 C, A♭7 B, B7 D, B♭7 D♭, C7 E♭, D7 F, D♭7 E, E7 G, E♭7 G♭, F7 A♭, G7 B♭, G♭7 A.
- **The chord ear rounds (#226 and #315, set "all"):**
  - every chord is named by its triad: G♯m6, C♯m(maj7), E♭m7, D♯°7;
  - tones spelled academically: B+ = D♯ F𝄪, F°7 = A♭ C♭ E♭♭, D♭7 = F A♭ C♭;
  - a 6th chord asks "its 3rd, 5th and 6th";
  - the root is always on the E or A string, frets 1–7.
- **#412:**
  - every chord but the tonic is asked, the ii of ii – V – I included;
  - keys spelled: C♭ as IV of G♭, G♯7 in B, the Andalusian in E♭m with D♭.
- **Lessons:**
  - Lesson 1.9's tap step: row "#113 · 👆 8 of 10", subtitle "Lesson 1.9 · step 3/3 · 8 of 10 passes", goal button "🎯 8 of 10", drawer "Goal: a set of 10 with 8 or more right. The step ticks itself.";
  - the end card "8 of 10 passes this step", with no Harder;
  - the steps ⓘ shows two clear lines.
  - Lesson 2.16's idea ("Sing the second note back before you tap it") and mistake fit the game.
- **#415:** it now offers "Classical melodic minor (up melodic, down natural)". Groups of 3 and 5 are right.
- **Classic tunes:**
  - the texts I checked are right: Ode bars 92–107 and the early F♯ in bar 12, the Saints in frets 2–5, the Canon's 28 grounds and its chords, Petzold and the 1725 notebook, Joplin's "Not fast", the Invention's subject, the Prélude's G pedal;
  - the line fingerings are one finger per fret in their positions (Canon ground 4-4-1-1-2-2-2-4 in frets 4–7; Saints 2-1-2-4 in frets 2–5);
  - cards name composer and year.
- **Settings → Audio delay in portrait (390 px):** the slider takes the whole row, and "Measuring…" sleeps while the test runs. With too few taps it says "Not enough taps to measure: one tap with each click you hear."
