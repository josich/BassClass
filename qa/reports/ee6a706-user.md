# QA User report · ee6a706 · 2026-11-02

Setup:
- **Commit:** ee6a706 (main). Scope: `git diff d278266..ee6a706`, which covers:
  - the band;
  - mastery by main options (docs/MASTERY.md);
  - tap mode (ear games, reading and note-finding drills);
  - Pro previews (first bar only);
  - the new grooves #248, #350–352, #448–450 and False harmonics #551, with lessons 2.34, 3.42–3.44, 4.39–4.41 and 5.43;
  - the renumbering, the course map from a step title, the goal button, ⏮ while playing.
- **Commits during my session:** the main session pushed cb61fb0 and c8636ac. They only change the ★ core flags and add a "Core essentials" Library topic. None of the findings below touch them, and I did not review them.
- **Server and tab:** my own `qauser` server (port 8890) in my own tab. I never touched ports 8765 or 8878. At the end I reset the viewport, closed the tab and stopped the server.
- **Profile:** empty at the start: one service worker unregistered, cache `bassclass-v1` deleted, localStorage and sessionStorage cleared, loaded with `?qa=u23b`.
- **Sizes:** 780x360 (main), 640x300, 915x412 and 1024x768. Layout confirmed with `getBoundingClientRect`. 4-string bass, C D E notation.
- **Free player:** the debug gates were on (Pro not owned) for the free-player checks, then set back to off.
- **Personas:**
  - Beginner: Home → Lesson 1.1 → its step, the goal button, the title → map, today's session, Finish session.
  - Advanced player: the band (⋯ → Band, the beat lights, the picker), Options' cleared chips, Library cards, tap mode, previews.
  - Teacher: every new groove dumped through the exercises' own `build()` in 12 keys (6,948 notes):
    - labels checked against the chord;
    - spelling checked against the pitch;
    - leaps and fret jumps measured.
    - Also: 4,800 game rounds, the drum patterns behind the band, and every lesson text of the new units.
- **Not testable here:**
  - the sound itself (the Practice room's louder drone, the band's balance);
  - real touch and Android.
  - I checked what is scheduled instead of what sounds.
- **Screenshots:** in `C:\Users\OscarGaya\.claude\projects\E--CLAUDE-BassClass\c7f026a2-fcf4-440e-b62e-e6df46b13395\tool-results\`, shortened to `…\` below.

Counts: Blocking 0 · Wrong 5 · Confusing 9 · Irritating 2 · Texts 5 · Visual 1, plus 4 questions.

## Short verdict

What works well:
- **The band feels like a real step up.** Every exercise and style option finds a pattern of its metre for a Pro player.
- **The band switch is easy once you know it.** A tap on the lights switches between the band and the click, with clear toasts. The Band panel and its ⓘ are tidy. Metronome and Backing grey out and say why.
- **Mastery reads well.** The Options chips go green with a tick. Then "✓ R-5-8-5 quarters cleared · 3 of 4 for 🏅". Library cards show 🏅 Mastered with a green edge, and "✓ 2/4".
- **Tap mode is clear.** For example: "✓ 2 of 4: find the others", or "✗ A♯, not G · fret 3 of the G string · here on 2 strings".
- **The game answers are right.** Every interval, chord tone and note in 4,800 rounds is spelled to its pitch and to its interval.

What must be fixed first:
1. **The gospel walk-up does not walk up into the next chord.** Every bar climbs 5–6–7 of its own chord, then drops 6 to 18 semitones to the approach note (W1).
2. **The country waltz never plays the IV chord's root.** It plays A | A | E | E over A D E A (W2).
3. **False harmonics are notated as natural harmonics.** The tab writes only `<15>`, and the finger labels put a little finger "4" where the plucking hand's thumb touches (W4, W5).
4. **The maqsum text puts the second dum on the "&" of 2.** It sits on beat 3, as the app's own drum pattern plays it (W3).

## Blocking     (a user cannot do what the screen is for)

None found.

## Wrong        (incorrect musical or factual information)

### W1. Gospel walk-ups do not walk up into the next chord: they leap down 6–18 semitones before every chord change
- **Where:** #450 Gospel and R&B, Groove "Gospel walk-ups into each chord" (I – VI7 – ii – V), every key; Lesson 4.41, step 1.
- **The texts promise:**
  - Exercise: "a run up from the 5th through the 6th and the 7th into each new chord".
  - Tip: "The walk-up lands on the next root on beat 1".
  - Lesson mistakes: "A walk-up that lands late. The next root is on beat 1."
- **What the notes do:** each bar walks up to its own chord's 7th, then jumps down to a half-step approach below the next root. In A (default), measured on the neck (E=28, A=33, D=38, G=43):
  - `[Amaj7] A A E F♯ G♯ → F(→)`: −15, then F♯.
  - `[F♯7] … C♯ D♯ E → A♯(→)`: −6.
  - `[Bm7] … F♯ G♯ A → D♯(→)`: −6.
  - `[E7] … B C♯ D → G♯(→)`: −18.
- **All 12 keys:** the same in all 12 keys. 24 of 276 moves are leaps of more than an octave; the largest is 18 semitones.
- **Why it matters:** a 5–6–7 run leads to the octave of the chord it is on, not to a root a 3rd or a 4th away. The line teaches a walk-up that never arrives and a leap where the style is stepwise.
- **Evidence:** the tab at 640x300: `…\mcp-Claude_Browser-blob-1793634699014-k80l4l.jpg` (G♯ on D6, then F on E1).
- **Suggestion:** walk into the next root (for example 5–6–♭7 → next root when it is a 4th up, or 1–2–3 → 4). Or place the run in the next root's octave.

### W2. Country waltz: the IV chord and the return to I never get their root
- **Where:** #248, Groove "Country waltz (root, then the 5th below)", the style's usual progression I – IV – V – I; Lesson 2.34, step 1.
- **What I saw:** each 4/4 bar becomes one 3/4 bar, but the pattern is two bars long (root, then the 5th below). So the chords and the pattern fall out of step: `[A] A(R) | [D] A(5) | [E] E(R) | [A] E(5)`.
  - Over D the bass plays A, so D/A sounds for a whole bar.
  - The loop's last A bar has E in the bass.
  - D is never heard.
- **The texts say:** the lesson step reads "the root on 1, then the 5th below on the next bar's 1". The about says "plays the root, then the 5th below on the next bar".
- **Why it matters:** a Level 2 player learns to play a chord change on its 5th.
- **Suggestion:** two waltz bars per chord, or the root on every chord change and the 5th below only when a chord lasts two bars.

### W3. Maqsum: the dums are on 1 and 3, not on 1 and the "&" of 2
- **Where:** #352 about and tip; Lesson 3.44, second paragraph.
- **What the texts say:**
  - About: "plays its low "dum" strokes on beat 1 and the "&" of 2: the bass follows the dums".
  - Tip: "Maqsum: dum on 1 and the "&" of 2, tek in between".
- **The fact:** the maqsum is Dum Tek – Tek Dum – Tek – (in 8ths), so its dums fall on beats 1 and 3. The app's own band pattern `maqsum` plays it that way:
  - low tom (dum) on 8th positions 0 and 4;
  - rim (tek) on 1, 3 and 6.
- **The bass line:** it plays R on 1, R on the "&" of 2 (a tek), the 5th on 3, the ♭3 on 4 and R on the "&" of 4. So "the bass follows the dums" is not true either. (The "&" of 2 dum belongs to the saidi.)
- **Suggestion:** "dums on beats 1 and 3, teks in between". And let the line's long notes sit on 1 and 3.

### W4. False harmonics: the thumb's touch point is labelled finger "4", and every fretted note "1"
- **Where:** #551, Dot labels: Fingers.
- **What I saw:**
  - The fretted C (A string, fret 3) shows "1".
  - The touch triangle at fret 15 shows "4".
  - The same for every note: frets 3, 5 and 7 of the A string are all "1", and all touch points are "4".
- **What was meant:** the build gives the fretted note a finger per fret and the touch point the thumb (`finger: 'T'`). The finger numbers are re-assigned later, so a fretting-hand little finger now sits where the plucking hand's thumb goes.
- **Evidence:**
  - DOM labels while stepping: `1@174,166 4@622,168 | 1@258,166 4@679,168 | …`.
  - Screenshot: `…\mcp-Claude_Browser-blob-1793634225177-j62hew.jpg`.
- **Also:** the line keeps C D E on the A string at frets 3–5–7. The comment says "one fret behind the root to four ahead", which allows a 6-fret window for four fingers. In the hand's own position, E would sit on the D string's 2nd fret.

### W5. False harmonics are notated as natural harmonics: `<15>` with no fretted note
- **Where:** #551, tab strip.
- **What I saw:** `C major scale <15> C <17> D <19> E <15> F <17> G <19> A <16> B <17> C …`. The fretted fret (3, 5, 7…) appears nowhere.
- **Why it matters:** `<15>` on the A string is how tab writes a natural harmonic at the 15th fret of the open string, which is not what is played. The lesson's whole point (fret, then touch 12 frets higher) is not on the page.
- **Evidence:** `…\mcp-Claude_Browser-blob-1793634204421-mfgzim.jpg`. The staff's diamonds at the sounding pitch are fine.
- **Suggestion:** the fretted number with "A.H." and the node in brackets, for example `3 (15)` or `3 A.H.`, as tab books do.

## Confusing    (misleading, illogical, makes no sense)

### C1. The 12/8 slow blues must be cleared at 120 BPM
- **Where:** #240 Blues lines, Groove "12/8 slow blues (triplets)".
- **What I saw:** `goalOf('gr-blues', 'slowBlues')` is 120 BPM. The choice has no course step of its own, so it takes the exercise's goal. Its own tempo is 60 dotted quarters.
- **Why it matters:**
  - 120 dotted-quarter beats is a fast shuffle, not a slow blues.
  - #240 needs all 5 grooves for 🏅, so mastery asks for it.
  - No other choice in the Library is off by this much: I scanned every choice for a goal under 0.6 or over 1.6 times its own tempo.
- **Suggestion:** give slowBlues its own goal (about 66), or let a compound groove's goal scale from its own tempo.

### C2. "To master it: a full loop at 140 BPM": one goal shown, but each choice has its own
- **Where:** the exercise ⓘ, YOUR PROGRESS, for example #350.
- **What I saw:** "🎯 to master it: a full loop at 140 BPM, then ✓ Cleared (0 of 5 cleared)". Yet:
  - Doom clears at 66 BPM and Djent at 108.
  - #248's 6/8 ballad clears at 63 and its jazz waltz at 138.
- **Why it matters:** a player reads "Doom at 140".
- **Suggestion:** "each groove at its own goal (🎯 shows it)", or list them.

### C3. A free player gets no band in 6/8, and the first tap on the lights switches the band off everywhere
- **Where:** #248 6/8 ballad (Level 2, free); #438 6/8; #546 Schism 5/8. The debug gates were on, Pro not owned.
- **What I did:** opened the 6/8 ballad. The click plays (no free 6/8 pattern; `matchedStyle(…, false)` is null). The drum glyph is grey, but the band setting is still On.
  1. My first tap on the lights, to get the band, toasted "Band off: the click keeps the time" and saved `band: false`.
  2. The second tap toasted "No free drum pattern in 6/8: the click keeps the time".
  3. Every other style exercise (#119…) then played the click until I tapped the band back on there.
- **Evidence:** `…\mcp-Claude_Browser-blob-1793634590981-c2odee.jpg`.
- **Suggestion:**
  - Show "No free drum pattern in 6/8" on the first tap, and leave the setting alone.
  - Mark one 6/8 pattern (Folk 6/8) free, since the free levels teach 6/8.

### C4. A beginner is not told that drums replaced the click, or how to get the click back
- **Where:** every style exercise, for example #119 in Lesson 1.12.
- **What I saw:**
  - The only sign is a 22x20 px drum glyph beside four 9 px dots.
  - The whole switch (`.beat-row`) is 91x28 px.
  - "Tap: the click instead" lives in a `title` tooltip, which touch screens never show, and in the Band panel's ⓘ under ⋯.
- **Also:** On/Off is one setting for every style exercise, but neither the Band panel nor the toast says so.
- **Suggestion:** a one-time toast on the first band start ("🥁 The band plays with you: tap the lights for the click"), and a 44 px target.

### C5. "Clean" in the course, "Cleared" in the Library, and a lit "Cleared" on an unpassed step
- **Where:** Lesson 1.12, step 1 (#119, Rock 8ths, goal 110), after Rock 8ths was cleared in the Library (goal 120).
- **What I saw:** the step's ⋯ menu shows "Cleared" lit (title "Cleared: this choice played clean at the goal"). The header still reads "🎯 –/110" and the step is not passed.
- **Two words for one act:**
  - in a lesson: a full loop at the goal, then ✓ Clean;
  - in the Library: the same, then ✓ Cleared.
  - Both ✓ marks look the same.
- **Why it matters:** "cleared, but not passed" on one screen. MASTERY.md says only mastery passes steps, but nothing on the screen says so.
- **Evidence:** `…\mcp-Claude_Browser-blob-1793635018929-n33j6i.jpg`.
- **Suggestion:** one word for both. Either let a cleared choice pass that choice's easier steps, or hide "Cleared" inside a step (see Q2).

### C6. Lesson 4.39's idea contradicts three of its four grooves
- **Where:** Lesson 4.39 idea, and #448 about.
- **What it says:** "Latin bass plays with the clave and leaves the downbeat to the percussion".
- **What the grooves do:** partido alto, baião and cha-cha-chá all play beat 1. The same lesson says "The cha-cha-chá plays beat 1". Only the songo leaves it.
- **Suggestion:** "Cuban bass often leaves the downbeat to the percussion (the songo, the tumbao)…".

### C7. Drum & bass "long roots, half-time feel" is not long
- **Where:** #449 Groove "Drum & bass (long roots, half-time feel)"; Lesson 4.40.
- **What I saw:** the line is a dotted quarter, an 8th, a quarter rest, then two 8ths, at 168 BPM. No note is longer than 0.54 s, and the 8ths last 0.18 s.
- **The texts say:** "the bass plays long notes in half time" and "Hold the long notes their full length".
- **Suggestion:** half and whole notes (a sub-bass line), or a name that matches the line.

### C8. Tap mode in "Find every C" ignores the Key option
- **Where:** #216 with 👆 on; Options "Key: C · Frets 0–12".
- **What I saw:** ▶ asks "1/10 · Every C", then F, B♭, E♭, A♭, D♭, G♭, B, E, A (the labels row shows the whole set).
- **Evidence:** `…\mcp-Claude_Browser-blob-1793634635180-nv1j4f.jpg`.
- **Why it matters:** the header promises C.
- **Suggestion:** say "10 notes round the cycle" in tap mode, or ask ten rounds of the chosen note's places.

### C9. Today's session shows ● on rows that were never played
- **Where:** Home, today's session.
- **What I did:** after Open strings (#106) was mastered, the three course-step rows "Open strings · 2 per string / 4 per string / 1 per string" showed ● at once.
- **The ⓘ says:** "● once played through" (MASTERY.md: "● Today's session: a row played today").
- **Evidence:** `…\mcp-Claude_Browser-blob-1793634432389-ueuomk.jpg`.
- **Why it matters:** this is minor, but it blurs the ✓ / 🏅 / ● split the round set out to make.

## Irritating   (works, but annoys or slows the user)

### I1. No volume for the band in an exercise
- **Where:** ⋯ → Band.
- **What I saw:**
  - The panel has On/Off, the drum pattern and the chord sound, but no level.
  - The drums silently take the Practice room's drum volume (`A.setAudioOptions({ drumVol: room.drumVol / 100 })` in `applyBand`).
  - The chords have no level at all.
  - Nothing tells the player where to turn the drums down under a real bass.
- **Suggestion:** one Band volume slider in the panel, or a line in its ⓘ ("set in the Practice room").

### I2. Wide leaps and hand jumps in the new grooves
This was measured over 12 keys with the exercises' own `build()`. Every approach note is a half step from its target (216 of 216); the leaps come before it.
- **Jazz waltz (#248, ii – V – I):** the approach drops 15–18 semitones after the 5th.
  - Example: `[E♭maj7] B♭(5) G string 8 → E(→) open E` = −18.
  - 12 of 132 moves are over an octave.
- **Soca and songo:** the octave goes to the G string's 10th–13th fret, then the next root is two octaves down. Soca in A♭: −22; songo in F: −17.
- **Partido alto in A (`[Amaj7]`):** E on the D string's 14th fret alternates with A on its 7th, in 16ths. G string 9, under the hand, has the same E.
- **Drum & bass in A:** after the open A, G and A are played at the A string's 10th and 12th frets every bar. D string 5 and 7, or open G and 2, have the same notes.
- **Why it matters:** these are places a teacher would re-finger at once. Fixing the gospel walk (W1) may fix most of them.

## Texts        (typos, unclear wording, inconsistent names)

### T1. "Goal reached on R-5-8-5 quarters (112 BPM)" reads like the tempo played
- **Where:** the goal tip after a full loop (#119). I played at 160.
- **Suggestion:** "🎯 Goal (112 BPM) reached on R-5-8-5 quarters…".
- **Evidence:** `…\mcp-Claude_Browser-blob-1793634772957-vmljzk.jpg`.

### T2. "✓ 0 of 21 (of 26) cleared for 🏅"
- **Where:** Options, main option header (#236; #204 "0 of 20 (of 24)").
- **Why it matters:** the double "of" and an emoji used as a word. For a beginner: "0 of 4 cleared for 🏅".
- **Suggestion:** "0 of 21 needed for 🏅 Mastered (26 in all)".

### T3. "Steppers (roots under four on the floor)" plays the 5th and the 3rd on beats 3 and 4
- **Where:** #351, Lesson 3.43 ("steppers drives roots under a kick on every beat").
- **What I saw:** `[Am] A r A E(5) C(♭3)`.
- **Suggestion:** "Steppers (root-led, under four on the floor)", or play roots on beats 3 and 4.

### T4. "The ♭5 and ♭6 are the darkest notes of the minor sound"
- **Where:** #350 about; Lesson 3.42.
- **Why it matters:** the ♭6 belongs to the minor scale, but the ♭5 does not. It is the blue note, or the tritone.
- **Suggestion:** "the ♭5 (the tritone) and the minor scale's ♭6", or name the Phrygian ♭2, which the breakdown's vamp uses.

### T5. "✗ B, not B" in the Unisons tap mode
- **Where:** #215 with 👆. Asked for B (E string, fret 7) on another string; I tapped B on the D string's 9th fret, an octave up.
- **What I saw:** "✗ B, not B · the same pitch on another string".
- **Suggestion:** "✗ that B is an octave higher: the same pitch is on the A string's 2nd fret".
- **Evidence:** `…\mcp-Claude_Browser-blob-1793634690045-gxx4kk.jpg`.

## Visual

### V1. A Pro preview's header at 640x300 leaves three letters of the title
- **Where:** #450 as a free player.
- **What I measured:** the title box (`.exv-title`, number chip included) is 81 px wide, so the title reads "450 Gos…".
  - The ⭐ Get Pro button takes 92 px.
  - The options summary takes 214 px.
- **At 780x360:** #448 reads "Latin groo…".
- **Suggestion:** let the options summary give way first.

## Questions for the owner

1. **The intervals game (#227) gives double flats on black-key roots.** The root takes its lead-sheet name (G♭, D♭), then the interval is spelled from it:
   - the minor 3rd above G♭ is B♭♭;
   - above D♭ it is F♭ (51 of about 4,800 rounds);
   - also C♭ and E♭♭.
   This is correct textbook spelling and follows the drill rule. But for a Level 2 ear game, should the root be named per interval (F♯, so A)?
2. **Should a choice cleared in the Library pass the course steps on that choice whose goal is no harder?** (Mastery already does; see C5.)
3. **A per-style default sound and key for the band?** Today the chord sound is global: metal chugs and doom play over the E-piano by default, and a free player cannot pick Guitar. And #350 opens in A at the 5th fret, while the pick patterns (#210/#308) open on the open E, by your choice.
4. **Tap mode on neck drills (#215, #216, #219) shows an empty 4/4 bass-clef staff** with a half rest before any answer. Keep it, as the record of the answers, or hide it until the first answer?

## Checked and fine

- **The band:**
  - **Every exercise finds a pattern** (Pro player, every exercise and style option checked). Grooves, walking, licks, slap, the song studies and the pentatonic and pick studies all get a pattern of their own metre, groups included (7/8 2 + 2 + 3 → `seven223`).
  - **The odd metres are matched:** Schism's 5/8 and 7/8, YYZ 5/4, Money 7/4.
  - **Free players get a free pattern of the same grid or genre,** except 6/8 and 5/8 (C3).
  - **The kit:** once loaded, the drums replace the click; the count-in stays clicks.
  - **The menu:** Metronome greys with "The band keeps the time…"; Backing shows "Band" and explains.
  - **The picker:** "Drum patterns in 4/4 · 104", with the ↺ back to the matched one. The Band ⓘ is clear.
- **The matched patterns fit their styles:** steppers' four on the floor, the waltz, the jazz waltz, the bembé on the Afro-Cuban 12/8, the gospel shuffle, songo, partido alto, baião, garage, D&B, trip-hop.
  - Two are loose fits: the chugs start on a "Thrash skank beat" (written for 200 BPM) at 120, and the walk-ups on Memphis soul.
- **Mastery:**
  - Options chips: "Rock 8ths ✓" with a green edge.
  - Clearing toast: "✓ R-5-8-5 quarters cleared · 3 of 4 for 🏅".
  - Library: "🏅 Mastered" with a green border (rgb 70,201,162), "✓ 2/4", "1/23 mastered". The Library ⓘ explains 🎯, 🏅 and ✓ 2/4.
  - "E and A strings is a step on the way: All four strings clears this exercise" is a good message.
  - "To clear Rock 8ths: a full loop at 120 BPM, then ✓ Cleared". Finish session asks "Nothing played yet. Finish this session anyway?".
- **New grooves:**
  - **Labels:** all 6,948 notes in 12 keys are spelled to their pitch with no double accidentals, and every R/3/♭3/5/♭5/6/♭6/7/♭7 label matches its chord. (The songo's anticipated root is labelled R under the old chord, as its tip says.)
  - **Bar lengths:** the 3/4, 6/8 and 12/8 bars are whole, and the 6/8 is engraved in dotted quarters.
  - **Styles:** cumbia, rocksteady, ska, highlife, baião and the Afro-Cuban and gospel 12/8 lines are idiomatic.
- **Tap mode:**
  - **Reading drills (#111):** "1/16 · ✓ 0 · tap it on the neck", then "✗ A, not G · here on 2 strings" with both places shown.
  - **Find every C:** "✓ 2 of 4: find the others".
  - **Ear game (#113):** "🎧 Listen…", then "👆 tap it · ▶ hear it again"; the answer is written on the staff in green or red.
  - **Game answers (4,800 rounds):** every interval label matches its letter distance and semitones; the chord tones are correct.
- **Pro previews:**
  - The first bar is clear and the rest of the strip fades.
  - "ready · 28 notes" counts the whole exercise.
  - The end tip: "That was a preview: its first bar, once…" with a gold ⭐ Get Pro.
  - Tap mode in a preview (#409) shows its first bar only.
- **Lesson step tools:**
  - Lesson 1.1: the goal button sets 66 BPM ("Tempo set to the goal, 66 BPM…").
  - A step's title opens the map with 1.1 glowing (`#/course?f=hold`).
  - ⏮ while playing goes back to note 1 within 250 ms with no count-in (19/48 → 1/48).
- **The renumbering:** no stale "#NNN" in texts, and the search hint "#305" still fits.
- **False harmonics:** the triangle sits on the 15th fret wire for a note fretted at 3. The held note is not plucked, and the harmonic sounds an octave up.
