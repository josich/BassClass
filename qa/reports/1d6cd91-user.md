# QA User report · 1d6cd91 · 2026-10-23

Setup: round 14. Focus: what changed since round 13 (8a28412): Home's practice-log headline, Settings → Backup, the Practice room (Metronome, Drums with 11 styles, Neck) and the rail of five (Path folded into the Library's Topics view, the Neck explorer into the room). Quick pass over the rest.
- Server and tab: my own `qauser` server (port 8890) in my own background tab. The `seed` tab and ports 8765/8878 were not touched. At the end: storage, caches (`bassclass-v1`, `bassclass-drums-v1`) and the service worker cleared, viewport reset, tab closed, server stopped.
- Code tested: HEAD 1d6cd91, clean working tree (only the deep QA's untracked `qa/tools/monkey14.js`).
- Profile: empty at the start (service worker, caches and localStorage cleared), cache-busting `?qa=u14a`. Then a seeded practice log (`bassclass.log.v1`, my tab's own storage) to see the headline with real-looking weeks: today 12.4 min, the days before 34, 22, 0.7, 0, 47, 75 min, and older days back to 20 days ago.
- Sizes: 800x380 and 780x360 (main), 640x360, 915x412, 1024x768. 4-string.
- Method: real taps on Start/Stop, the style cards, the greyed beats stepper, the day bars, the ring and the ⓘ bubbles; real Play in lesson 1.1's step (the log rose by 15 s per tick); the Backup load flow driven through its file input with a synthetic file (`confirm` intercepted to read its text); Reset progress with `confirm` intercepted. The drum patterns read from `web/js/practice/styles.js` and the engine's arithmetic, and each kit sample's level measured (decoded in the page, peak and RMS over 100 ms, plus the `MIX` dB).
- Not testable here: the sound itself (I cannot hear the grooves; my verdicts on them are from the written patterns and measured levels), the microphone, the Android app (native "Save to" picker, drums fetched from GitHub). I did not press "Save a backup" for real (it would download a file onto this PC): `backupText()` was read instead. The pane was hidden, so the beat lights updated slowly; I checked what is scheduled, not the light timing.
- Screenshots are under `C:\Users\OscarGaya\.claude\projects\E--CLAUDE-BassClass\c7f026a2-fcf4-440e-b62e-e6df46b13395\tool-results\` (shortened to `…\` below).

Counts: Blocking 0 · Wrong 2 · Confusing 6 · Irritating 4 · Texts 5 · Visual 2, plus 6 questions.

## Expert verdict (short)

The new pieces work and read well. The practice log adds up (3 h 11′ is the exact sum, the streak and "days practised" follow their rule), the day bubble and the ring bubble are clear, the backup flow is safe (it asks, names what it replaces, rejects foreign and empty files, then reloads), and the rail of five loses nothing: `#/path` opens the Topics view and remembers it, `#/explorer` opens the room, and Back from a topic returns to the same place. Most drum grooves are textbook: rock, pop, funk, disco, shuffle, 12/8 blues, the one-drop, 5/4 as 3+2 and 7/8 as 2+2+3 put kick, snare and hats where a drummer would.

What weighs most:
- The **bossa nova** loop is written at double speed. Per beat it plays the rhythm the app itself calls *samba*, and it runs twice as fast as the app's own bossa bass line at the same BPM.
- The **Subdivision** buttons divide the beat, whatever the metre or feel. In 7/8 "Quarter notes" clicks 8ths, in 12/8 "8ths" clicks dotted 8ths, and over Shuffle, Swing and the one-drop "8ths" are straight against swung drums: a 111 ms flam at 90 BPM.
- **One tempo serves every style while the beat unit changes** (quarter, dotted quarter, 8th). A switch from Rock to 7/8 at 90 halves the pulse, and nothing on screen names the beat.
- On the headline: **past gold days change** when today's session length changes, a 42-second day shows "1′" but does not count as practised, and the ring text overflows the ring from 60 minutes on.

## Blocking     (a user cannot do what the screen is for)

None found.

## Wrong        (incorrect musical or factual information)

### W1. "Bossa nova" drums are a samba-speed pattern: twice as fast as the app's own bossa
- Where: Practice → Drums → Bossa nova (`styles.js`, `bossa`: `unit: 4`, one bar).
- What I saw: per beat the kick plays `X..s` (a dotted 8th and a 16th), and the cross-stick bossa clave `x..x..x...x..x..` completes in ONE 4/4 bar of 16ths. In standard drum-set (and lead-sheet) notation, bossa nova is written in 8ths over TWO bars: the kick plays a dotted quarter and an 8th per half bar (1, &2, 3, &4), the clave spans two bars, and the hi-hat or shaker keeps steady 8ths. The room's version is that groove written in half the note values, so the room's beat is a lead-sheet half note.
- Why it matters: the app contradicts itself. Its own exercise #98 `gr-world`, "Bossa nova (R-5 dotted)", is R 1.5 + 5 0.5 + 5 1.5 + R 0.5 beats per bar at 92 BPM (`grooves.js:23`). Its own *samba* is 0.75 + 0.25 per beat (`grooves.js`, `samba`), which is exactly the room's bossa kick. A player who practises #98 at 92 and opens the room's bossa at 92 gets drums twice as fast as the bass line. At the room's default 90, the groove equals a bossa at ♩ = 180 (typical bossa: about 110–140), so it feels like a samba.
- Evidence: `bossa.kick = 'X..sX..sX..sX..s'` (0, 3, 4, 7, 8, 11, 12, 15 of 16); `xstick = 'x..x..x...x..x..'`; `shakd`+`shaku` and `hhc` play 8 hits per bar (every other step), so the steady subdivision of a bossa is also at half density.
- Suggestion: rewrite it on an 8th grid over two bars (`unit: 2`; kick `X..xX..x|X..xX..x`, clave `x..x..x.|..x..x..`, hats/shaker on every 8th), so 120–140 BPM sounds like a bossa.

### W2. The Subdivision buttons click fractions of the beat, not the note values they show
- Where: Practice → Metronome → Subdivision (♩ / ♫ / triplet / 16ths icons; titles "Quarter notes", "8ths", "Triplets", "16ths"; ⓘ "🎵 Subdivision: a click on every quarter, 8th, triplet or 16th").
- What I saw: the engine plays `sub` clicks per beat (`A.click(t0 + (k * len) / sub, …)`), and the beat is whatever the style sets:
  - 7/8 (beat = 8th): "Quarter notes" clicks 8ths and "8ths" clicks 16ths.
  - 12/8 blues (beat = dotted quarter): "8ths" clicks two per beat, i.e. dotted 8ths. The real 8ths of 12/8 are the "Triplets" button.
  - Shuffle, Swing, Reggae one-drop and 12/8 are on the triplet grid: "8ths" adds a straight off-beat click while the hi-hat or ride plays the swung one. At 90 BPM the click's "&" falls at 333 ms and the drums' swung note at 444 ms, a 111 ms flam on every beat. "16ths" over a triplet grid clashes the same way.
- Why it matters: the icons and the ⓘ make statements about note values that are false in two of the room's metres. With drums on, a beginner who picks "8ths" to feel the subdivision hears the click fight the groove.
- Evidence: `engine.js` `_tick`; `styles.js` (`odd7.unit = 1`, `blues128/shuffle/swing/reggae.unit = 3`); `practice.js` `SUB_NAMES`, `SUB_ICONS`, `INFO`.
- Suggestion: name the buttons by clicks per beat ("1, 2, 3, 4 per beat"), or draw the icons from the metre (in 7/8: ♪, two 16ths…; in 12/8: ♩., three 8ths). With a triplet-grid style, swing the 8ths or offer only 1 and 3.

## Confusing    (misleading, illogical, makes no sense)

### C1. One tempo for every style, while the beat it counts changes, and nothing says which
- Where: Practice → Metronome tempo ("90 BPM Andante") with Drums styles.
- What I saw: the room keeps one BPM. Choosing a style changes what a beat is: a quarter in the 4/4 and 5/4 styles, a dotted quarter in 12/8, an 8th in 7/8 (and a lead-sheet half note in the bossa, W1). The display says only "BPM" plus an Italian name computed from the number. Examples at the default 90:
  - Rock 90 → 7/8 90: the 8th-note pulse drops from 180 to 90 a minute, so a 7/8 bar lasts 4.7 s ("Andante" for what feels like ♩ = 45). The course itself says "In 7/8 the metronome clicks every 8th note, so the tempo number is higher" and trains 7/8 from 120 to 160 (`s4.js`, lesson `odd-meters`).
  - 12/8 blues at 90 is a brisk 12/8 (8ths at 270 a minute). The app's own 12/8 slow-blues exercise opens at 60.
  - Disco at 90 is sluggish (disco sits around 110–130).
- Suggestion: give each style a starting tempo (e.g. Rock 100, Pop 100, Funk 96, Disco 118, Shuffle 110, Swing 140, Bossa 130 once rewritten, One-drop 75, 12/8 60, 5/4 150, 7/8 200), applied when the style is picked (the player's own change kept per style). Show the beat unit beside BPM (♩, ♩., ♪).

### C2. Changing today's session length repaints the past: gold days come and go
- Where: Home → practice log bars, Today's session 15′/30′/45′/60′.
- What I saw: the goal is not stored per day. Every bar is compared with today's session length. With my seeded week, 30′ shows 4 gold days. Switching to 60′ leaves 1 gold day (the 47′ and 34′ days lose their gold); 15′ turns almost everything gold.
- Why it matters: the ⓘ says "🟨 A gold bar: a day that reached it". A player who picks a short session on a busy day sees their whole history turn gold. One who raises the length loses past achievements, which is the opposite of motivating.
- Evidence: `practiceCard.js` `dayBar(d, …, goal)` with `goal = sessionMinutes()`; DOM `.pc-day.met` count 4 at 30′ → 1 at 60′.
- Suggestion: store the day's goal with its minutes (or the length in force that day) and colour each bar against its own goal.

### C3. A day can show "1′" yet not count as practised; the ring can read "30′ of 30′" and not be done
- Where: Home → practice log.
- What I saw: bars, the 7-day total and the bubbles round from 30 s, while "days practised" and the 🔥 streak need 60 s. A day with 42 s shows a "1′" bar and the bubble "Tuesday 20 October / ⏱ 1′", but the line reads "5 days practised" without it, and "🔥 3 in a row" stops at it. At the goal the same rounding gives a ring "30′ of 30′" that is not gold, and a bubble "⏱ 30′ of your 30′ / ▶ 0′ to go" (29.6 min logged).
- Evidence: `practiceCard.js` (`d.min < 0.5` for bars, `d.min >= 1` for days), `practiceLog.js` `streak()` (`>= 60` s); screenshots `…\mcp-Claude_Browser-blob-1792752715563-kbt0jo.jpg` (the 1′ bubble), `…\mcp-Claude_Browser-blob-1792752700070-w0i1ir.png` (1′ bar, "5 days practised").
- Suggestion: one threshold everywhere (a bar only from 1 minute), and round down, or show "met" from the rounded value.

### C4. "Reset progress" now also erases the practice log, without saying so
- Where: Settings → Progress → Reset progress.
- What I saw: the question still reads "Reset all progress, the course included?". After OK, `bassclass.log.v1` is `{}`: every day's minutes and the streak are gone. Nothing suggests saving a backup first.
- Why it matters: "progress" on this screen meant mastered exercises and the course. Practice history is a different thing, and many players would want to keep it.
- Suggestion: "Reset all progress: mastered exercises, the course and your practice log? (Save a backup first if you may want them back.)", or keep the log out of the reset.

### C5. Returning players: the Neck is two to three screens down the Practice room, and old links land at the top
- Where: rail → Practice; `#/explorer`.
- What I saw: the Neck explorer is now the third block, under the Metronome and the Drums. At 800x380 the Neck block starts 761 px down the page (two screens). At 640x360 it starts 972 px down (almost three). `#/explorer` redirects to `#/practice` at scrollTop 0. No rail label, ⓘ or jump says where the neck went. One exercise still sends players to "the fretboard explorer" (T4).
- Suggestion: make `#/explorer` scroll to the Neck block, and add a small jump bar at the room's top (Metronome · Drums · Neck), like the Library's L1–L6.

### C6. On a 640-px phone the streak and the goal label disappear, while the ⓘ still explains them
- Where: Home headline at 640x360.
- What I saw: `@media (max-width: 640px) { .pc-streak { display: none } … .pc-goal-label { display: none } }`. Measured: `.pc-streak` "🔥 3 in a row" is in the DOM with display none, and `.pc-goal-label` is display none. The dashed goal line stays with no label. The ⓘ still lists "🔥 Days in a row with some practice". The streak is one of the headline's three facts.
- Evidence: `…\mcp-Claude_Browser-blob-1792752822519-2hhqgg.jpg` (640x360: "5 days practised" and no 🔥; the same data at 800 shows "🔥 3 in a row").
- Suggestion: keep the streak in a shorter form ("5 days · 🔥 3"), and put the 🎯 at the line's right end.

## Irritating   (works, but annoys or slows the user)

### I1. The drum styles and Start are never on screen together on small phones
- Where: Practice room.
- What I saw: at 800x380 Start is at y 247–292, the first style card at y 511 and the last (7/8) at y 651. At 640x360 the first card is at y 722. Trying a groove means scrolling down to pick it, then up to Start, then down again. Space works only with a keyboard. While it plays, a tap on a style switches live, which helps once it is running.
- Suggestion: a Start/Stop in the Drums block head (or a tap on a style starts when stopped).

### I2. No count-in before the drums
- Where: Practice room, Start with drums on.
- What I saw: the groove and the accent hit beat 1 at once. Settings → Count-in ("One bar") counts exercises in, but the room ignores it. A player with both hands on the bass gets no bar to come in.
- Suggestion: honour the Count-in setting here (one bar of clicks, then the drums).

### I3. The click's volume and subdivision settings are split between the room and Settings
- Where: Practice → Metronome; Settings → "Metronome volume" (40% by default) and "Metronome clicks: Beats only / Beats + subdivisions".
- What I saw: the Drums block has its own Volume, but the click's level only exists in Settings, so balancing click against drums means leaving the room. Settings' "Metronome clicks" does nothing in the room, which has its own "Subdivision". Two controls for the same idea, in two places, with two names.
- Suggestion: a click volume beside "Click On/Off" in the room, and rename the Settings one "Exercise metronome clicks".

### I4. Speed up climbs without a ceiling, and the tempo reached is lost on Stop
- Where: Practice → Metronome → Speed up.
- What I saw: with "+5 BPM every 1 bar" from 240 the display went 240 → 245 → 250 → 255. The climb only stops at 260. On Stop it shows the set tempo again, so the player cannot see or keep the best tempo they managed.
- Suggestion: an "up to" value and a toast or label with the last tempo reached ("Reached 132 BPM, keep it?").

## Texts        (typos, unclear wording, inconsistent names)

### T1. The practice log says it counts exercises only; the Practice room counts too
- Where: Home headline ⓘ "⏱ The minutes an exercise plays, counted each day", and the new player's line "Play any exercise to start".
- What I saw: the room's engine calls `logPlaying` (90 s of metronome were credited to today), and the room is where a player may practise longest. Also, the ring bubble "⏱ 12′ of your 30′" leaves "30′" unnamed.
- Suggestion: "⏱ The minutes the app plays for you: exercises and the Practice room", "Play an exercise or the metronome to start", "12′ of your 30′ goal".

### T2. The backup question mixes the device's date format into an English sentence
- Where: Settings → Load a backup → confirm.
- What I saw: "Load the backup from October 23, 2026? It replaces the progress, …" (`toLocaleDateString(undefined, …)`: this browser is en-US). The practice log writes "Tuesday 20 October" (fixed `en-GB`). On a Spanish phone it would read "Load the backup from 23 de octubre de 2026?".
- Suggestion: use `'en-GB'` as `practiceCard.js` does.

### T3. "Meter" (American) in visible option labels
- Where: #114 `rh-odd-meters` (header summary "Open A · Meter: 5/4 (3+2)", under the title "Odd metres: 5/4, 7/8, …") and `gr-odd-meters` (`grooves.js:172`, `sel('Meter', …)`).
- Evidence: screenshot `…\mcp-Claude_Browser-blob-1792753107858-4s1poe.jpg`. The house rule is "Metre" in all prose and titles (ids stay).
- Suggestion: `sel('Metre', …)` in both.

### T4. A tip points to a screen that no longer exists
- Where: #146 `wk-mixed` "Complete walking lines (mixed devices)", tip 2: "Then improvise your own line with the fretboard explorer as a map." (`grooves.js:250`).
- Suggestion: "…with the Neck in the Practice room as a map."

### T5. Style cards repeat their metre
- Where: Practice → Drums: "12/8 blues · 12/8", "5/4 (3 + 2) · 5/4", "7/8 (2 + 2 + 3) · 7/8".
- Suggestion: name them by feel ("Slow blues · 12/8", "Odd 3+2 · 5/4", "Odd 2+2+3 · 7/8"), or show the subtitle only when it adds something.

## Visual

### V1. The ring's minutes overflow the ring from 60 minutes on
- Where: Home headline ring.
- What I saw: "1 h 00′", "1 h 05′" and "2 h 15′" are 47.6 px wide (15 px bold), while the ring's hole is 38 px (56 px ring, r 22, stroke 6). The text crosses the coloured stroke by about 5 px on each side. Every player with a 60′ session who meets the goal sees it.
- Evidence: `getBoundingClientRect` text 99–146.6 px against a ring of 94.8–150.8 px; screenshot `…\mcp-Claude_Browser-blob-1792752750674-4bvajs.png`.
- Suggestion: use the bars' short form ("1h05") or a smaller size from 60 minutes on.

### V2. Small targets and crowding in the new blocks
- Day bars are 22 px wide (18 px at ≤640 px) with 6 px gaps, tight for a finger. The bubble works when hit.
- In the Neck block at "Frets 0–24" on a 640-px phone, fret numbers 21–24 run together ("212223 24") and neighbouring dots touch (`…\mcp-Claude_Browser-blob-1792752862539-wi0166.jpg`). The block is 170 px tall where the explorer had a whole screen.

## Questions for the owner

1. **The 20-minute idle cut in the Practice room.** A run with no touch for 20 minutes stops counting (your decision). In the room, playing along with a groove for 40 minutes without touching the phone is the normal use, and only 20 would be logged. Keep the rule there, or count while the click or drums play?
2. **Swing drum details.** The snare ghost sits on the middle triplet of beat 3 (`snare: '.......g....'`, index 7). Jazz comping usually lands on the beat or on the last triplet ("let": index 8, or the "a" of 2 and 4, index 5 and 11). Also, the ride's accents on 2 and 4 use the same sample layer as the other ride notes (the ride has 3 layers: `floor(0.72×3) = floor(0.95×3) = 2`), so the accent is only the 0.6 dB gain difference. Intended?
3. **Hi-hat levels, an ear check.** Measured peaks after `MIX`: closed hi-hat −38.7 / −28.7 / −23.3 / −12.6 dB (soft to hard); snare hard −2.7; kick hard −8. In Pop and Funk the 16th "s" hats sit about 16 dB under the beat hats and about 26 dB under the snare, so the 16th motion that defines those grooves may be faint on a phone speaker. In Rock the "&" hats are about 11 dB under the beat hats.
4. **Odd-metre accents.** The click accents only beat 1. The course teaches "the accented notes mark the groups". Should the 5/4 and 7/8 clicks accent the group starts (5/4: 1, 4; 7/8: 1, 3, 5), at least with those styles on?
5. **Names.** The rail's "Practice" is the metronome room, while Home's "Today's session" is the day's practice. A beginner may tap Practice expecting their session. Is that fine, or should the rail read "Room" or "Metronome"?
6. **Per-style tempo memory** (see C1): should each style keep its own last tempo, so a jazz player can switch between Swing at 180 and the slow 12/8 without retyping?

## Checked and fine

- **Rail of five:** Home, Library, Practice, Tuner, Settings, each with an icon and label, at every size. `#/path` opens the Library in Topics and keeps that view; `#/explorer` opens the room; the Levels/Topics switch sits by the title, is remembered (`libView`) and hides the L1–L6 jumps in Topics. Back from a topic returns to Topics at the same scroll (777 px). Counts agree: 16 topics and 6 levels both add up to 223 exercises. The Library ⓘ names both views, and search works from both. No leftover "Path" wording in the UI or the course map ("The Library has every exercise in the meantime, by level or by topic").
- **Practice log:**
  - Exercise playback credits today (+15 s after one tick in lesson 1.1's step), and so does the room.
  - The 7-day total is exact (3 h 11′ = 191.1 min), and the days practised (5) and streak (3, today included, yesterday's run kept) follow their rule.
  - The strip starts at the first logged day (21 days back), today is at the right, fades show at the edges, and Monday has its gap.
  - Day and ring bubbles: "Tuesday 20 October / ⏱ 1′", "Today / ⏱ 12′ of your 30′ / ▶ 18′ to go", and "🎯 done" once met. One bubble at a time.
  - Changing the session length refreshes the ring and the goal line. Bar labels fit their bars up to "2h15". Dates are en-GB.
- **Backup:**
  - The file holds every `bassclass.*` key, with `app`, `kind`, `v`, `version` and `saved`.
  - Load asks first and names what it replaces, then shows "Backup loaded" and reloads with the data back.
  - A foreign JSON gives "This file is not a BassClass backup.", an empty one "This backup is empty.". The input accepts .json.
  - The ⓘ lines are clear.
- **Metronome:**
  - The tempo names match the usual metronome bands (Andante 76–107, Allegro 120–167…).
  - −/+ and the slider work, and Tap needs two taps and resets after 2 s.
  - The beat lights follow the beats per bar, with gold on 1 when accented, and turn hollow in muted bars.
  - Muted bars "Play 1 / Mute 1" alternate as labelled, and "Play" greys while Mute is Off. Speed up adds per bar as set, and "Every" greys while Add is Off.
  - With drums on the beats stepper greys, and a tap says "The drum style sets the beats: 7/8".
  - Click Off leaves the lights (and drums) keeping time. The drawn note icons render at phone size.
- **Drums:**
  - The kit (72 files, about 1.1 MB, CC0 with its LICENSE and source) loads with a percentage, and the cards grey while drums are Off. Volume is 80% by default.
  - Patterns that are right for their names:
    - Rock: kick 1, 3, &3, snare 2 and 4, 8th hats.
    - Pop: 16th hats, kick 1, &2, 3.
    - Funk: syncopated kick, ghost snares, open hat on the & of 4.
    - Disco: four on the floor, open hat on every &.
    - Shuffle: long-short hats, kick 1 and 3, snare 2 and 4.
    - Swing: ride "ding ding-a", hi-hat foot on 2 and 4, feathered kick.
    - Reggae one-drop: kick and cross-stick on 3 only, swung hats.
    - 12/8 blues: 12 ride 8ths, kick 1 and 3, snare 2 and 4 in dotted-quarter beats.
    - 5/4 (3 + 2): kick 1 and 4, snare 3 and 5.
    - 7/8 (2 + 2 + 3): hat accents on 1, 3, 5; kick 1 and 5; snare 3 and 6.
  - The closed hat chokes the open one.
- **Neck block:** the same choices as the old explorer (21 scales, 16 chords, all notes), the same degrees and names, and a tap plays the fret. It fits at 640–1024 px with frets 0–12 and 0–17.
- **Sizes:** no horizontal scroll at 640–1024 px. The Metronome block stacks its settings under Start below 700 px. The headline card and "My level" sit side by side at every size.
- **Quick pass:** lesson 1.1 and its step, the exercise player, the tuner screen, the Library cards' ⓘ bubbles (one at a time, a second tap closes), the Settings fields. Nothing changed for the worse.
