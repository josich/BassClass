# QA User report · 77c1e47 · 2026-10-23

Setup: round 15. The focus was what changed since round 14 (1d6cd91), which is mostly the Practice room and Home:
- the new Harmony block: Off / Drone / Chords, the key, the progressions, the chord chips, "On the neck: Follow", the volume;
- the Start/Stop button you can now drag;
- the PolyOrbit tempo slider;
- the Drums block, now 99 patterns in 10 genre tabs (round 14 only saw 11 styles);
- Home: the "My level" tile and the day strip.

I also did a quick pass over Settings, the tuner, the course map and placement.

- **Server and tab.** I used my own `qauser` server (port 8890) in my own tab (tab-4). I did not touch the `seed` tab or ports 8765 and 8878.
- **Code tested.** HEAD 77c1e47, clean working tree.
- **Profile.**
  - At the start the profile was empty: I unregistered the service worker, cleared the `bassclass-v1` cache and cleared localStorage, then loaded with the cache-busting query `?qa=u15a`.
  - Later I seeded a practice log in my tab's own storage (`bassclass.log.v1`): today 12.4′, then 34, 22, 0.7, 0, 47, 75′ and older days.
  - Placement: "All yes" to Stage 4, which gives L5.
- **Sizes.** 800x380 and 780x360 (main), 640x360, 915x412, 1024x768. I measured layout with `getBoundingClientRect` because the pane's screenshots render at odd scales. 4-string bass.
- **Method.**
  - Real clicks on Start/Stop, the Harmony modes, the ⓘ bubbles, the pattern cards and the My level tile, plus real drags of the floating button.
  - I read every progression in all 12 keys from the room's own module (`practice/harmony.js` `progression()`).
  - Timing checks:
    - I ran the room's real engine (`practice/engine.js` `Room`) with its `onTick` and `onChord` callbacks. That gives chord changes against bar and beat at their audio times.
    - The pane was hidden, so the screen's chip and light updates were throttled. Timing verdicts come from the scheduled events, not from the throttled screen.
  - I listened to nothing.
- **Not testable here.**
  - The sound itself: the pad's tone, the drums' new loudness, the balance between click, drums and pad.
  - A touch drag on a real phone. Touch pointers are captured by the browser, and I could only drag with a mouse or with synthetic events.
  - The Android app.
- **Screenshots** are in `C:\Users\OscarGaya\.claude\projects\E--CLAUDE-BassClass\c7f026a2-fcf4-440e-b62e-e6df46b13395\tool-results\`, shortened to `…\` below.

Counts: Blocking 0 · Wrong 2 · Confusing 5 · Irritating 5 · Texts 6 · Visual 3, plus 5 questions.

## Expert verdict (short)

The Harmony block is a good addition, and its musical content is right. I checked all 21 progressions in all 12 keys:
- the blues forms, including a correct jazz blues with the ♯iv°7;
- the ii–V–Is, the turnarounds, the relative-minor cycle and the rhythm-changes A section;
- the pop and minor triad progressions;
- the vamps.

Every progression has the right chords, and the spelling follows the house rules. The drone (root, 5th, octave) is right. In 4/4 the chips light and the Neck switches to the new chord exactly at the bar line. The 99 drum patterns read as a drummer would write them:
- bossa clave, rumba clave and 2-3 son clave;
- the 6/8 bembé bell, the habanera, the Bo Diddley beat and the dembow;
- the Motown four-on-the-snare and the train beat;
- jazz ride with hi-hat on 2 and 4.

What weighs most:
- **Chords shorter than a bar break the form in any metre whose beats do not split in half** (3/4, 5/4, 5/8, 7/8, 7/4, 9/8, 11/8). The jazz blues over the app's own Jazz waltz runs 13 bars, with every change from bar 5 on beat 2. Rhythm changes drift across the bar line.
- **A minor progression on a black key reads as two keys at once.** The Key picker says "A♭" while the chips say G♯m7, C♯m7… The picker never says the key is minor.
- **The following Neck contradicts itself and is not explained.** The greyed picker reads "Scale · Major (Ionian)" while the board shows A7. In muted bars the Neck jumps back to chord 1 while the form goes on.
- **Changing the drum pattern while playing sends the progression back to bar 1**, with a beat of silence. This happens even when the metre stays the same.
- On Home, **"Last 7 days" stands next to only 5–6 visible days** on phones (640–800 px).

## Blocking     (a user cannot do what the screen is for)

None found.

## Wrong        (incorrect musical or factual information)

### W1. Chords shorter than a bar break the form in 3/4, 5/4, 5/8, 7/8, 7/4, 9/8 and 11/8
- **Where:** Practice → Harmony → Chords, with "Jazz blues" or "Rhythm changes (A section)". The metre comes from a drum pattern (Jazz waltz, Waltz, 3/4 rock, 5/4 swing, 5/4, 5/8, 7/8, 7/4, 9/8, 11/8) or from Beats per bar with the drums off. The cause is `harmony.js` `progression()`: `beats: Math.max(1, Math.round((c.beats * beatsPerBar) / 4))`.
- **What I saw:** each 4/4 chord length is scaled and rounded on its own, so the two halves of a bar are each rounded up:

  | Metre | Half bar becomes | Total | Should be |
  |---|---|---|---|
  | 3/4 | 2 beats | 2+2 = 4 | 3 |
  | 5/4, 5/8 | 3 | 3+3 = 6 | 5 |
  | 7/8, 7/4 | 4 | 4+4 = 8 | 7 |
  | 9/8 | 5 | 5+5 = 10 | 9 |
  | 11/8 | 6 | 6+6 = 12 | 11 |

  This is what the room's engine scheduled (key A, chord@bar.beat):
  - Jazz blues in 3/4: `A7@1.1 D7@2.1 A7@3.1 Em7@4.1 A7@4.3 D7@5.2 D♯°7@6.2 A7@7.2 F♯7@8.2 Bm7@9.2 E7@10.2 A7@11.2 F♯7@12.1 Bm7@12.3 E7@13.2 A7@14.1`. The 12-bar form is 13 bars long, and from bar 5 every chord arrives on beat 2.
  - Rhythm changes A in 3/4: `Amaj7@1.1 F♯7@1.3 Bm7@2.2 E7@3.1 … E7@11.1 Amaj7@11.3`. The 8-bar section lasts 10⅔ bars, and the second time round starts on beat 3.
  - Jazz blues in 5/4: 12.6 bars, with the second chorus starting at bar 13, beat 4. Rhythm A: 9.6 bars (5/4), 9.14 (7/8), 8.89 (9/8), 8.73 (11/8).
  - With Beats per bar at 1 (drums off), a 2-beat chord gets a whole bar like a 4-beat chord, so the jazz blues lasts 15 bars.
- **Why it matters:**
  - A jazz blues over the Jazz waltz is exactly what a jazz player picks. CLAUDE.md promises "a 4/4 bar of it becoming one bar of the room's metre".
  - Here the harmony drifts against the drums' bar line and the beat lights. A player who trusts the chips learns a wrong form.
  - Only the two progressions with half-bar chords are affected; every other progression stays on its bar lines in every metre.
- **Evidence:** engine runs with `Room` (bpm 600, harmony 'chords', hKey 9), listed above. `progression()` output for metres 1–12 (11 and 12 included) is in my session log.
- **Suggestion:** split each bar by its running total. Round where each chord starts (`round(start·bpb/4)`) and take the differences, which gives 2+1 in 3/4, 3+2 in 5/4 and 4+3 in 7/8. Better still, put the split on the metre's group start (3+2 in 5/4, 2+2+3 in 7/8). Each 4/4 bar then stays one bar.

### W2. Odd-metre grooves at their own tempo are all called "Prestissimo"
- **Where:** Practice → Metronome tempo name, after picking a pattern in the Odd metres tab.
- **What I saw:** 5/8 (3 + 2) at 220, 7/8 (2 + 2 + 3) at 220, 9/8 (2 + 2 + 2 + 3) at 260 and 11/8 at 240 all read "**Prestissimo**". Each pattern's own default tempo counts 8th notes ("BPM ♪"), and the Italian name is worked out from that number as if it were a quarter-note pulse (`tempoName()`: 200 and up = Prestissimo).
- **Why it matters:**
  - Italian tempo words name the felt pulse.
  - 7/8 at ♪ = 220 is ♩ = 110, with about 94 group pulses a minute: a moderate groove.
  - 9/8 at ♪ = 260 has about 115 pulses a minute.
  - "Prestissimo" (faster than presto) tells a player the groove is extremely fast when it is not.
- **Evidence:** DOM after each pattern pick: `["7/8 (2 + 2 + 3)", "220", "Prestissimo"]`, and the same for 5/8, 9/8 and 11/8. Screenshot `…\mcp-Claude_Browser-blob-1792762049810-rz80y6.jpg` (11/8: "240 BPM ♪ Prestissimo").
- **Suggestion:** with an 8th-note beat, name the tempo from the quarter (bpm ÷ 2), or show no Italian name.

## Confusing    (misleading, illogical, makes no sense)

### C1. With a minor progression, the Key picker names a major key with another letter
- **Where:** Practice → Harmony → Chords → Key, with Minor blues, Minor ii – V – i, the three Minor progressions or the minor vamp.
- **What I saw:** the Key list is always the 12 major-key names (`keyName()` = `bestRoot(pc, ionian)`): C D♭ D E♭ E F G♭ G A♭ A B♭ B. A minor progression, however, is spelled from its minor tonic (`progChords` uses `aeolian`). So:
  - Key "**A♭**" plays `G♯m7 C♯m7 G♯m7 G♯m7 C♯m7 C♯m7 G♯m7 G♯m7 E7 D♯7 G♯m7 D♯7`, and the Neck's (greyed) key reads "G♯".
  - Key "D♭" plays C♯m7…, and Key "G♭" plays F♯m7….
  - Minor ii–V–i in "D♭" is D♯m7♭5 G♯7♭9 C♯m(maj7).
  - Even on a white key, the picker shows "A", never "Am" or "A minor".
- **Why it matters:** the house rule names minor keys on black keys with sharps (C♯m, G♯m, F♯m). The picker and the chips then disagree on the letter, and nothing tells the player the key is minor.
- **Evidence:** screenshot `…\mcp-Claude_Browser-blob-1792761712449-a9k6re.jpg` (Key "A♭", Minor blues, chips G♯m7…, Neck "G♯").
- **Suggestion:** when the progression is minor, list minor keys by the same rule (Am, B♭m, Bm, Cm, C♯m, Dm, E♭m, Em, Fm, F♯m, Gm, G♯m).

### C2. The following Neck: the greyed picker contradicts the board, and nothing says why it is locked
- **Where:** Practice → Harmony on (Chords or Drone), "On the neck: Follow" (the default), Neck block.
- **What I saw:**
  - With Chords, the Neck shows the chord, but the greyed scale/chord picker keeps showing the player's own choice: "**Scale · Major (Ionian)**" above a board of A7 (R 3 5 ♭7). The info line under it says "🎹 A7: A – C♯ – E – G".
  - The disabled pickers do nothing when tapped, and the Neck's ⓘ ("A scale or chord on the whole neck, in any key…") does not mention following. Elsewhere in the app, a greyed option says why when tapped.
  - All of this is remembered (`harmony`, `neckFollow`). A player who once left Harmony on Chords returns to a Neck explorer locked on chord 1, even with nothing playing. The way out ("On the neck: Off") is in the block above.
- **Evidence:** DOM `sels: [{txt: "A", dis: true}, {txt: "Scale · Major (Ionian)", dis: true}, …]`, info `🎹 A7: A – C♯ – E – G`. Screenshot `…\mcp-Claude_Browser-blob-1792761518591-8z2sqi.jpg`.
- **Suggestion:**
  - While following, show the chord in the picker ("🎹 Following: A7"), or hide the picker.
  - Add a line to the Neck's ⓘ ("🎹 Following the Harmony: set On the neck to Off to explore").
  - Or follow only while the room plays.

### C3. In muted bars the chips go dark and the Neck jumps back to chord 1, while the form goes on
- **Where:** Practice → Metronome → Muted bars (Mute 1–8), with Harmony → Chords and Follow on.
- **What I saw:**
  - Silence in muted bars is your decision; I am not reporting that.
  - What I am reporting: the engine reports `idx: null` there, and `showChord()` then shows `ch[0]`.
  - So during the silent bars the Neck shows the progression's first chord, not the chord the form has reached (the progression keeps counting underneath).
  - With Play 2 / Mute 2 on the 12-bar blues in A: bars 3–4, 7–8 and 11–12 are dark, and the Neck shows A7. With Play 1 / Mute 1, bars 6 and 10 (D7) and 12 (E7) show A7.
- **Why it matters:** muted bars train keeping the form in your head. The one visual clue left then shows the wrong chord.
- **Evidence:** engine run (blues, play 2, mute 2): `A7 (form bar 1)@bar1, A7 (2)@bar2, (none)@bar3, D7 (5)@bar5, D7 (6)@bar6, (none)@bar7, E7 (9)@bar9, D7 (10)@bar10, (none)@bar11, A7 (1)@bar13`.
- **Suggestion:** in muted bars, keep showing the chord of the form (dimmed chip, Neck unchanged) while the pad is silent.

### C4. The chord chips do not show bars
- **Where:** Practice → Harmony → Chords, the chip row.
- **What I saw:**
  - Each chord is one equal chip, whatever its length.
  - The jazz blues is 15 chips for 12 bars. At 800 px they wrap as 13 + 2, so "Em7 A7" (bar 4) and "F♯7 Bm7 E7" (bars 11–12) look like separate bars.
  - Rhythm changes A is 16 chips for 8 bars. ii – V – I is three chips, the last one two bars long.
  - The plain 12-bar blues wraps as 12 on one line at 800 and as 8 + 4 at 640, never as the 4 + 4 + 4 every chart uses.
- **Why it matters:** a player reads changes by the bar. Here they cannot tell a half-bar chord from a whole bar, or see the form's lines.
- **Evidence:** screenshot `…\mcp-Claude_Browser-blob-1792761586459-e0wr0w.jpg` (jazz blues in A, 13 + 2 chips); `…\mcp-Claude_Browser-blob-1792761728304-2ojffv.jpg` (640 px, 8 + 4).
- **Suggestion:** one box per bar (two chips share a box), four bars to a line, like a lead sheet.

### C5. Home: "Last 7 days" stands next to only 5 or 6 visible days on phones
- **Where:** Home → practice-log card, next to the new "My level" tile (`min-width: 104px`).
- **What I saw:** with my seeded week ("Last 7 days 3 h 11′ · 6 days practised · 🔥 4 in a row"), the strip shows fewer whole days than the headline counts:

  | Width | Whole days visible | Hidden from the 7 counted |
  |---|---|---|
  | 640 | 5 (M T W T F) | Sun 47′, Sat 75′ |
  | 780 | 5 + 1 cut | Sat |
  | 800 | 6 + 1 cut | Sat 75′, the week's biggest day |
  | 915 | 10 | none |
  | 1024 | 11 | none |

- **Why it matters:** the visible bars add up to 69′ at 640 px against a headline of 3 h 11′. The ⓘ says the bars are "the 7 days".
- **Evidence:** `.pc-scroll` 211 px wide at 800 (bars 26 px); 142 px at 640 (bars 22 px). Screenshots `…\mcp-Claude_Browser-blob-1792761836978-xh0ire.jpg` (800) and `…\mcp-Claude_Browser-blob-1792761854544-3rxc1e.jpg` (640).
- **Suggestion:** make sure the strip fits 7 days. A narrower My level tile (about 84 px) would do it at 800; a smaller bar pitch or a tighter ring gap at 640.

## Irritating   (works, but annoys or slows the user)

### I1. A new drum pattern sends the progression back to bar 1, with a gap, even in the same metre
- **Where:** Practice → Drums, while Harmony (Chords or Drone) plays.
- **What I saw:**
  - Picking a pattern sends `beats` to the engine even when the metre does not change (`pickStyle`, and `drumsOn(true)` too). `Room.set` treats any `beats` (or `harmony`) in a change as a new metre: the pad goes silent until the bar line, then the progression starts again from chord 1.
  - Tapping the Harmony mode that is already on ("Chords" again) does the same.
  - Engine run: blues in A, a 4/4 pattern change in bar 7 gives `A7 (form bar 7)@7.1, (silent)@7.4, A7 (form bar 1)@8.1`. Bars 8–12 of the form are skipped.
  - A drone also drops out for the rest of the bar.
- **Why it matters:** trying grooves under one chorus is a natural thing to do in the room. CLAUDE.md lists only "a new key, progression or metre" as restarts.
- **Suggestion:** restart only when `beats` really changes (compare it with the current value), and ignore a tap on the mode already chosen.

### I2. No count-in before the chords when the drums are off
- **Where:** Practice room, Harmony → Chords, Drums Off, Settings → Count-in "One bar".
- **What I saw:** the count-in bar only plays with the drums on (`this.bar = this.o.drums && this.o.countIn ? -1 : 0`). With the click and the chords alone, the first chord sounds at once on Start. A player with both hands on the bass gets no bar to come in.
- **Suggestion:** apply the count-in whenever the drums or the harmony are on.

### I3. The harmony and the Neck that follows it are never on one screen; the room is now 4–5 screens tall
- **Where:** Practice room, Harmony on Chords.

  | Size | Room height | Harmony starts | Neck starts | Chips to end of neck board |
  |---|---|---|---|---|
  | 800x380 | 1443 px (3.8 screens) | 803 | 1087 | 404 px |
  | 640x360 | 1725 px (4.8 screens) | 1044 | 1328 | 444 px |

- **What I saw:** the chips and the whole neck board never fit on one screen together. The tempo and its −/+ are 1000 px above the Neck.
- **Why it matters:** while playing, you watch the Neck; to see what comes next (the chips) or to nudge the tempo, you scroll.
- **Suggestion:**
  - a jump bar at the top (Metronome · Drums · Harmony · Neck), or blocks that fold like the Library levels;
  - and/or the current and next chord named on the Neck's own line.

### I4. 3–4 of the 10 genre tabs are off-screen, with no fade or arrow
- **Where:** Practice → Drums, genre tabs (a horizontal scroller with its scrollbar hidden).
- **What I saw:**
  - At 800 px "Reggae & Caribbean" is cut, and "Country & Folk" and "Odd metres" are not visible (`scrollWidth` 1029 against 659). At 640 px four tabs are hidden.
  - There is no fade at the edge, unlike Home's day strip.
  - A mouse wheel does not scroll the tabs (only shift+wheel), so on a computer "Odd metres" is hard to find.
- **Suggestion:** wrap the tabs onto two rows, or add the edge fade and the wheel handler the day strip already has.

### I5. With a mouse, a quick drag of Start does nothing
- **Where:** the floating Start/Stop, in a desktop browser (GitHub Pages).
- **What I saw:**
  - The drag only starts on a `pointermove` over the button: the listener is on the button, and capture comes after the first move.
  - A quick mouse drag jumps off the button on its first move, so the button stays put. A slow drag works (place saved, and the click after it is not taken as a tap).
  - On a phone, touch pointers are captured by the browser, so this should not happen there (I could not test touch).
- **Evidence:** event log: `pointerdown:560,328:fab`, then `pointermove:440,284:DIV`, then `pointerup:320,240:DIV`; `room.fab` stays null.
- **Suggestion:** call `setPointerCapture` in `pointerdown`.

## Texts        (typos, unclear wording, inconsistent names)

### T1. Home still says "Play any exercise to start"
- **Where:** a new player's practice-log card.
- **What I saw:** the ⓘ was updated ("The minutes an exercise or the Practice room plays"), but the line under "0′" still names exercises only. The room is where a new player may well start (metronome, drone).
- **Suggestion:** "Play an exercise or the Practice room to start".

### T2. The toast after picking a pattern repeats its metre
- **Where:** Practice → Drums, toast on a pattern pick.
- **What I saw:** the cards were fixed in round 14, but the toast was not:
  - "12/8 minor blues (ride) · 12/8 · 52 BPM"
  - "7/8 (2 + 2 + 3) · 7/8 · 220 BPM"
  - "5/4 (3 + 2) · 5/4 · 120 BPM"
- **Evidence:** `…\mcp-Claude_Browser-blob-1792762056017-g0jmqr.jpg`.
- **Suggestion:** use the card's rule (leave out the metre when the name has it).

### T3. "Afro-Cuban 6/8 (bembé)" is a 12/8 pattern
- **Where:** Practice → Drums → Latin.
- **What I saw:** the card reads "Afro-Cuban 6/8 (bembé) — **12/8** · 100 BPM", the toast "… · 12/8 · 100 BPM", and four beat lights. A player who reads "6/8" expects two beats per bar.
- **Suggestion:** "Afro-Cuban 12/8 (bembé)". Many players do call it "6/8", but the app should not name two metres for one card.

### T4. "Odd metres" holds 3/4 rock and 6/8 rock
- **Where:** Practice → Drums → Odd metres (its last two cards).
- **What I saw:** 3/4 (simple triple) and 6/8 (compound duple) are not odd metres. The app's own `gr-odd-meters` text keeps them apart ("Odd metres (5/4, 7/8, 7/4) … and 6/8 is the compound metre of ballads").
- **Suggestion:** move them to Rock, or name the tab "Odd & other metres".

### T5. Harmony words a beginner may not know
- **Where:** Harmony block and its ⓘ.
- **What I saw:**
  - "🎹 Something to play over: a drone on a key, or a chord progression" never says what a drone is.
  - "On the neck: Follow / Off" does not say what is followed.
  - The ⓘ does not say that each chip is a chord in order (or how long it lasts), or that muted bars silence the harmony too.
  - The progression names mix dash styles: "I – V – vi – IV (pop)" against "Canon (I–V–vi–iii–IV–I–IV–V)" and "ii–V–I–IV–iiø–V–i (relative minor cycle)".
- **Suggestion:**
  - "🎹 A drone (the key's root and 5th, held) to play scales and modes over, or a chord progression";
  - "Neck: follow the chords";
  - "🔇 Muted bars silence the harmony too";
  - one dash style throughout.

### T6. README overstates the slider's middle range
- **Where:** README "Practice room": "a slider that gives most of its travel to the usual 60–160 range".
- **What I saw:** from the slider's own formula (`posToBpm`), 60 BPM sits at 24.8% of the travel and 160 BPM at 59.9%. So 60–160 gets 35%, while 160–660 gets 40% and 1–60 gets 25%. The range is much wider than on an even 1–660 slider (15%), but it is not "most".
- **Suggestion:** "a slider with 120 in the middle that gives the usual 60–160 range twice the room of an even scale".

## Visual

### V1. The floating Start covers a control on most of the page, and it can sit on the rail
- **Where:** Practice room.
- **What I saw:**
  - **Covers controls.** At its default place (800x380: 672–788 × 324–370 px, 116×46) it covers a control or a value at 38 of 54 scroll positions (70%). The room's right-hand column of values and On/Off switches runs exactly under it. On the first screen it hides the Muted bars values "2 bars" and "Off", and further down Drums On/Off, the Latin/Reggae tabs, the last chord chip and the Frets picker. The 64 px spacer clears the end of the page, and scrolling clears the rest, so nothing is lost for good.
  - **Can sit on the rail.** A drag can park it on the rail: it is kept 8 px from the window edge, so it can cover a rail item. At 640x360 it covered "Library" (button at 8–140 × 124–176).
- **Evidence:** screenshots `…\mcp-Claude_Browser-blob-1792761492150-6d9t1l.jpg` (first screen) and `…\mcp-Claude_Browser-blob-1792762072489-m875is.jpg` (over the rail).
- **Suggestion (opinion):** a round 56 px ▶/■ button (the label in its aria and tooltip) would cover about a third of the area. Keep it to the right of the rail when clamping.

### V2. For a new player, "My level" is a big tile with nothing in it
- **Where:** Home, before any placement.
- **What I saw:** the tile is 104×77 px and holds only the words "My level". The big level chip appears only after placement (then "L5" on top, which looks good). On touch, the explanation is in a `title` tooltip that never shows. A beginner has no hint that this is a 1-minute survey.
- **Suggestion:** a "?" chip in the chip's place, or "Find my level".

### V3. The chosen pattern's genre tab stays highlighted while the drums are off
- **Where:** Practice → Drums Off.
- **What I saw:** the genre of the remembered pattern keeps its teal "playing" outline (`.genre-tabs button.playing`), for example "Rock" while "Jazz" is the open tab. The pattern card itself goes neutral when the drums are off (`.drums.off .style-chip.on`). The tab suggests something is playing.
- **Suggestion:** apply the same `.drums.off` reset to the tab.

## Questions for the owner

1. **Cycles in the room.** The course's `PROGS` already has "ii–V–I in all 12 keys" and "Dominant 7ths around the cycle". An advanced player in the room can only play a ii–V–I in one key at a time. Add those to the Jazz group, or a "move the key every N bars (4ths / random)" option?
2. **What the Neck follows.** It shows the chord's tones only. Over a minor vamp or a ii–V, many players would rather see the chord-scale (Dorian, Mixolydian…), as the app's chord-scale exercise teaches by function. Offer "Chord / Scale" when following?
3. **Next chord.** Reading changes means looking one chord ahead. Name the next chord on the Neck's line ("A7 → D7"), or ghost its root, in the last beat before the change?
4. **Rhythm changes in G♭.** Bar 6 reads "C♭maj7 Bm7" (IV, then iv renamed because C♭m7 needs double flats). This follows the spelling rule, but the same root then has two letters within one bar. Keep it, or name the iv from the IV's letter in such pairs?
5. **Click volume in the room** (round 14 I3, still open). The room now has three sound sources, two with their own Volume (Drums, Harmony), while the click's level stays in Settings → Metronome volume. Add a click volume beside Click On/Off?

## Checked and fine

- **Harmony content.** I checked all 21 progressions in all 12 keys:
  - 12-bar blues, quick change and minor blues (i iv i i iv iv i i ♭VI7 V7 i V7);
  - jazz blues: I7 IV7 I7 vm7–I7 IV7 ♯iv°7 I7 VI7 ii7 V7 I7–VI7 ii7–V7, with ♯iv°7 spelled D♯°7 in A and B°7 in F;
  - ii – V – I, minor ii – V – i (m7♭5, 7♭9, m(maj7)), I – vi – ii – V, iii – vi – ii – V – I;
  - the relative-minor cycle (Dm7 G7 Cmaj7 Fmaj7 Bm7♭5 E7 Am7);
  - rhythm changes A (I VI7 ii V | iii VI7 ii V | I I7 IV iv | iii VI7 ii V);
  - pop and minor progressions as triads (Canon in B: B F♯ G♯m D♯m E B E F♯);
  - Andalusian (Am G F E), epic minor, and both vamps.

  Spellings follow the house rules: key spelling (C♭ in G♭), lead-sheet names for chromatic chords (I – ♭VII – IV in D♭: B), and minor keys on black keys with sharps in the chips. Do-Re-Mi works: "Sol♭7 Si7 … Do°7".
- **Pad and drone.**
  - The drone is root, 5th and octave (A2 E3 A3).
  - Chords are voiced up to the 7th, root between A2 and G♯3.
  - The harmony is silent during the count-in.
  - Leaving the room stops the pad and gives the exercise Backing its own level back.
- **Timing in 4/4, 2/4, 6/8 and 12/8.** Every chord is a whole number of bars. In 4/4 the chip lights and the Neck turns to "🎹 D7" on beat 1 of bar 2 (engine and screen sampled together).
- **Drone and Neck.** The player's own scale shows on the drone's key, with the key picker greyed and the scale picker free. Harmony Off frees the Neck again.
- **Neck labels while following.** ♭♭7 is drawn as two glyphs (dim7). The ♭9 shows on 7♭9. The info line reads "🎹 A7: A – C♯ – E – G".
- **Draggable Start.**
  - A slow drag moves it and saves its place as fractions (`[0.84, 0.84]`), and the click that ends a drag does not start the room.
  - The place stays inside the window when it is resized (from 640x360 to 1024x768).
  - Its "Stop" label and peach colour while playing, and the "Reached N BPM" toast after a speed-up, are as designed.
- **Metronome.**
  - The subdivision buttons follow the pattern: 7/8 "8th notes: the beat / 16ths: the fills"; 12/8 "Dotted quarters: the beat / 8ths"; swing "Quarter notes / Shuffle / Triplets: the fills"; straight 8ths adds "Swing: the groove in triplets".
  - "BPM" shows the beat's note.
  - Odd-metre beat lights mark group starts (dashed gold, e.g. 11/8).
- **Drums.** I read all 99 patterns as a teacher. All are idiomatic, including:
  - bossa nova clave 0-3-6-10-13 over two bars, with the kick on 1, &2, 3, &4 (round 14's W1 is fixed: 2 bars, 120 BPM);
  - rumba clave 3-2, son clave 2-3 (mambo), and the 6/8 bembé bell x.x.xx.x.x.x;
  - habanera, Bo Diddley 3-2, reggaeton dembow (a1, &2), one drop, steppers, ska;
  - Motown four on the snare, train beat, polka, waltz;
  - medium swing (ding ding-a, hi-hat on 2 and 4, feathered kick, ghost on the "let" of 3);
  - jazz waltz, 5/4 swing with accents on 1 and 4, and 9/8 as 2+2+2+3.

  Patterns set their own tempo, and the beats stepper greys with a toast.
- **Round-14 fixes seen working.**
  - Pattern cards no longer repeat their metre.
  - "Metre" labels.
  - The ring shows "1h05" (code).
  - At 640 px the streak shows as "🔥 4" and the 🎯 goal label stays.
  - The practice-log ⓘ names the room.
  - The backup date is en-GB, and Reset progress names the practice log.
  - `#/explorer` opens the room at the Neck.
- **Home.**
  - After placement, the My level tile shows "L5" big over "My level", at the card's height (77 px) at every size.
  - Today stays at the right end of the strip at every width (640–1024).
  - No horizontal page scroll at 640, 780, 800, 915 or 1024 px, on Home or in the room.
  - No cut text in the room (leaf-element overflow scan). The progression picker fits its longest name at 800 px.
- **Quick pass.** Settings, the tuner screen, the course map and the placement survey (All yes → L5 → Continue on lesson 38.1) look as before.
