# QA deep report · 70c3e4e · 2026-10-23
Summary: 0 critical, 2 major, 10 minor, 2 visual.

Runs:
- General monkey (`qa/tools/monkey16.js`, new, self-contained):
  - seed 1601: 330 steps, 800x380, 4-string;
  - seed 1602: 340 steps, 640x300, 6-string, left-handed, solfège;
  - seed 1603: 340 steps, 915x412, 5-string.
- Room-focused monkey (rail links blocked, `<main>` and the picker grid scrolled at random every 450 ms):
  - seed 1604: 420 steps, 800x380;
  - seed 1605: 450 steps, 800x380 (picker, My progression, Neck, chips, stars, fab drags all hit).
- Harmony fuzz on a fake audio clock (`__harmFuzz16`, seed 1606): 120 s, 60 random changes (pattern, drums, beats 1-12, key, progression, mode, My progression, muted bars, tempo).
- Checks against known answers (`qa/tools/checks16.js`):
  - `progression()` for all 23 presets x 1-12 beats x every pattern's groups (437 cases);
  - the engine on a fake clock: restart rules, count-in, muted bars, tempo changes and `Room.ahead` cuts;
  - pad voicings for all 23 qualities x 12 roots; Neck "Scale" for every preset chord in 12 keys and every My progression quality on every degree;
  - offline renders: all 99 patterns through `drumChain` (CHAIN_DB claim), through the whole room chain at 80% and at the finest subdivision, and at the loudest mix; the exercise click and Backing pad through the 77c1e47 graph and the new one.
- Picker, guardSliders, hold buttons and Start drag with synthetic and real (computer tool) input; corrupt storage; bad routes; layouts at 360x780, 640x300, 780x360, 800x380, 915x412.
- Memory: 150 picker open/close cycles, 200 My progression edits, 2 min of play at 296 BPM (16th funk, jazz blues, Neck on Scale), 100 Home/Library cycles.
- Self-test, Player timing, samples, yin.

About 2 h.

Scope: 77c1e47..70c3e4e (93a6987, b2f98ca round-15 fixes; 9cb0251 drum loudness, pad, Neck Chord/Scale; e75bff4, 9f7a061 My progression; 70c3e4e the shared picker; plus the drum-balance commits ab29ba3..a7ded7a).

Test setup:
- `qa` server on `http://localhost:8878`, my own tab only (tab-7). Service worker unregistered, caches and storage cleared, loaded with a cache-busting query.
- The working tree was clean at 70c3e4e at every page load (checked with `git status` before each reload).
- Round-15 findings M1 (harmony off the bar lines in odd metres), M2 (Neck "Just the notes"), M3 (slow tempo silence), m1 (needless restarts), m2 (minor keys named major), m6 (quick mouse drag) and V1 (portrait My level) are fixed (see "Checked and fine").

## Critical
None.

## Major

### M1. The exercise click and Backing pad are louder than before (click +3.4 dB, pad +5.2 dB) and the click's accent barely stands out
- Where: `web/js/audio.js:115-136`. The click, the pad and the drums now go through `accomp` (DynamicsCompressor -6 dB, knee 0, 20:1) and a 0.85 trim; the pad also through `padLimit` (-8 dB, knee 6, 12:1).
  - Chrome's DynamicsCompressorNode adds an automatic make-up gain (Web Audio spec: the 0.6 power of 1 / the curve's gain at 0 dBFS). Measured on a steady 1 kHz sine well under the threshold:
    - `accomp`: +3.42 dB;
    - `padLimit`: +3.23 dB.
  - So everything under the thresholds comes out louder:
    - click: x 1/0.85 (`CLICK_LIFT`), x 1.48, x 0.85 = +3.42 dB;
    - pad: +3.23 + 3.42 - 1.41 = +5.24 dB.
  - The comment at `audio.js:8` ("it sounds as loud as before") and CLAUDE.md ("the click lifted by 1/0.85 so it sounds as before") assume unity gain under the threshold.
- Expected: the exercise's click and Backing as in 77c1e47 (the brief asked to check that they did not change audibly).
- Actual (offline render of both graphs, same click and pad code as `audio.js`, peak dBFS at the clip input):

  | Click volume | Accent (old → new) | Beat (old → new) | Subdivision (old → new) |
  |---|---|---|---|
  | 0.3 | -11.4 → -8.0 | -15.0 → -11.6 | -23.4 → -20.0 |
  | 0.6 (default) | -5.4 → -3.5 | -9.0 → -5.6 | -17.4 → -14.0 |
  | 1.0 | -0.9 → -2.8 | -4.5 → -3.4 | -13.0 → -9.5 |
  | 1.5 (max) | +2.6 → -2.2 | -1.0 → -2.9 | -9.4 → -6.0 |

  - The accent's lead over the beat drops from 3.6 dB to 2.1 dB at the default volume, and to 0.6-0.7 dB at 100-150 %. The bar's "1" is then marked almost only by its pitch.
  - Backing pad RMS, four voicings (A2-G♯3 register, padVol 1, 1.5 kHz): -26.6 → -21.4, -27.4 → -22.2, -26.9 → -21.6, -27.7 → -22.6 dB. That is +5.2 dB on every one.
  - At the maximum click volume the click ducks the pad through the shared limiter. Below 500 Hz the pad drops 6.5 dB for about 50 ms after each click (-18.3 → -24.8 dB, back by 80 ms). At the default volume the dip is 1 dB. The old graph had no dip.
- The same gain is in the Practice room:
  - its click is also +3.4 dB;
  - the room pad's measured "+13 dB" (I measure +13.1 dB at 70 % and 100 %, any voicing) is 8 dB from `PAD_MAX` and about 5 dB from this make-up gain.
- Fix ideas:
  - divide the trims by the make-up gain (`accompTrim` 0.85 / 1.483, and after `padLimit` / 1.45), keeping `CLICK_LIFT`;
  - or keep the exercise's click and pad out of `accomp` while no drums play;
  - then render again with `__ex16`.

### M2. A double tap on the Drums "Change" picks whatever pattern card opens under the finger
- Where: Practice room → Drums → Change (`ui/picker.js`, `ui/practice.js:390`). The picker opens at once over the screen, its cards at the height of the row that was tapped.
- Steps:
  1. 800x380, Drums off, 90 BPM, the Drums row scrolled to the middle of the screen.
  2. Double-tap (here: a real mouse double-click, computer tool) on "Change".
- Expected: the picker opens; the second tap does nothing, or is ignored for a moment.
- Actual: the second click lands on the "Half-time" card. The pattern is picked and the picker closes:
  - drums turned On, style `rockhalf`, tempo 90 → 140 BPM;
  - toast "Half-time · 4/4 · 140 BPM";
  - `history.state` back to `{depth: 1}`.
  - The player's tempo is lost.
- Under the three points of the Change row (x 117 / 426 / 726) lie the cards "Straight 8ths", "Half-time" and "Punk (fast)". For the progressions' Change, the group chips lie there (harmless).
- A phone tap that seems not to respond is often repeated, so this will happen. Fix idea: ignore picks for about 300 ms after opening, or only accept a card tap whose pointerdown started inside the picker.

## Minor

### m1. My progression loops off the bar lines when its length is not a whole number of bars
- Where: `practice/harmony.js` `progression()` and `engine.js` `_harmony` (`hBeat % hTotal`). Lengths are ½, 1, 2 and 4 bars, and nothing pads the form to a bar line.
- Evidence (fake clock, chord changes as bar.beat):
  - ½ bar I + 1 bar V7 (1½ bars) in 4/4: `0@1.1 1@1.3 0@2.3 1@3.1 0@4.1 1@4.3 0@5.3`. Every second loop starts on beat 3.
  - The same in 3/4: `0@1.1 1@1.3 0@2.3 1@3.2 0@4.2 1@5.1`.
- ✎ Edit makes such progressions too:
  - "ii – V – I in all 12 keys" copies its first 16 chords: 10½ bars, ending on the ii of the sixth key;
  - in E♭ the copy also re-spells (C♯m7 → D♭m7, F♯7 → G♭7).
- The drums and the accent keep the metre while the chords drift against them.
- Fix ideas: show the total ("10½ bars") and pad the last chord to the bar line, or make ✎ Edit stop at a whole bar.

### m2. ✎ Edit on a minor progression loses its minor key
- Where: `harmony.js` `mineFrom()` / `progression(MINE…)`. My progression is always read in a major key (`progChords` with no `minor`).
- Evidence (copy vs original):
  - Key "C♯m", minor blues: C♯m7 → D♭m7, F♯m7 → G♭m7, G♯7 → A♭7.
  - Minor ii–V–i: D♯m7♭5 → E♭m7♭5, G♯7♭9 → A♭7♭9, C♯m(maj7) → D♭m(maj7).
  - The same in F♯m and G♯m, and with i–♭VII–♭VI–V, i–iv–v and the minor vamp.
  - The Key menu switches from minor names to major ones (C♯m → D♭).
  - The Neck's "Scale" changes:
    - the i chord: Aeolian → Dorian (`0:min` is not in the major table);
    - ♭III: Ionian → Lydian;
    - ♭VII: Mixolydian → Lydian ("borrowed").
- CLAUDE.md: minor-type chords keep sharps (C♯m, G♯m, F♯m).
- Fix ideas: store a `minor` flag with My progression (set by the copy, or by a Major/Minor switch), or name the copy's key from the preset.

### m3. Tapping the Degree already lit resets the chord's quality
- Where: `ui/practice.js:478`, `onClick: () => patch({ d, q: usualQuality(d) })`, also for the degree already chosen.
- Evidence: slot V with "7alt", then a tap on the lit "V" gives `{"d":7,"q":"dom7alt","b":2}` → `{"d":7,"q":"dom7","b":2}`.
- Fix: skip the patch when `d === c.d`.

### m4. A no-op edit in My progression restarts it and silences the pad until the next bar line
- Where: `engine.js:36`. `changed('myProg')` compares arrays by reference, and every editor tap builds a new array: the lit Length, Chord or Degree button, or "+".
- Evidence (fake clock, the same progression set again at bar 2 beat 2): `0@1.1 1@1.3 2@2.1 null@2.2 0@3.1`.
  - The pad stops at 2.2.
  - The form starts again from chord 0 at bar 3.
- Round 15 fixed the same thing for "a tap on the mode already on". Fix: compare the content (`JSON.stringify`), or skip patches that change nothing.

### m5. Neck "Scale": a few chords get a scale without one of their own tones
- Where: the room's rules in `ui/practice.js:537-545`, and the course's `modeFor`.
- Evidence: every preset chord in 12 keys passes (each scale holds all its chord's tones). Each My progression quality on each degree (between I and V7) also passes, except:
  - iii m9 (Em9 in C): base m7 → Phrygian (E F G A B C D). It lacks the chord's own 9th, F♯, which the pad plays (m9 drops its 5th: E G D F♯). The board shows F a half step from the pad's F♯.
  - 7♯9 on every degree: Altered (the course's `MODE_FOR`). It lacks the chord's natural 5th, which the Neck's "Chord" view shows (the pad drops it). Half-whole diminished would hold every tone.
- The iii m9 is a rare chord. Listed because the Neck then contradicts the pad.

### m6. One unknown key drops the whole favourites, recents or My progression list
- Where: `practice/state.js:17`, `keysOf` and the `myProg` rule. The whole list must validate, else the default is used, and the next save writes the default over it.
- Evidence (the committed `state.js` loaded as a blob module):
  - `drumFavs: ['rock8', 'funk16', 'gone-pattern']` → `[]`;
  - `progFavs: ['blues', 'giant-steps']` → `[]`;
  - a My progression with one chord of length 3 → the default I–vi–ii–V.
- Latent today. It will bite when a pattern is renamed or removed (the libraries are meant to grow), or when a backup from a newer version (new patterns, qualities, lengths) is loaded.
- Also: `drumFavs: ['__proto__']` passes, because `!!STYLES['__proto__']` is true (`style` itself uses `hasOwnProperty`). Harmless, since the picker filters it out.
- Fix: filter the unknown entries out instead of rejecting the list; use `hasOwnProperty`.

### m7. Keyboard: the picker does not take focus, so Enter or Space opens a second picker
- Steps:
  1. Click "Change" (focus stays on it, behind the backdrop).
  2. Press Enter (real key, computer tool).
- Actual:
  - two `.picker-backdrop` and two history entries;
  - one Escape then closes both (each picker's capture listener runs).
  - Tab also walks through the room's controls behind the `aria-modal` dialog.
- Fix: focus the search field (or the panel) on open, return focus to Change on close.

### m8. Back then Forward leaves a dead picker entry (web)
- Steps: open the picker → browser Back (closes it, correct) → browser Forward.
- Actual:
  - `history.state` is `{"depth":1,"picker":true}` and no picker shows;
  - the next Back is a dead press (same URL, no hashchange).
- Android has no Forward, so web only.
- Leaving the room with the picker open by a route change from code also leaves the entry, but no user path reaches that (the backdrop covers the rail).

### m9. The mouse wheel over a sideways row never gives the vertical scroll back
- Where: `ui/dom.js:172-176` (`sideScroll`). `preventDefault` runs whenever the row overflows and the wheel is mostly vertical, also at the row's ends.
- Evidence: Practice room, the jazz blues chips row (1044 px in 502 px):
  - scrolled to its end, a `deltaY: 100` wheel is still `defaultPrevented`;
  - at its start, `deltaY: -100` too.
- With a mouse, scrolling the room stops while the pointer passes over the Neck's chord row (also the picker's chips).
- Fix: let the event through when the row cannot move further that way.

### m10. Accompaniment peaks: the "-1.9 dB" claim is not reproduced (inaudible)
- How measured: offline, all 99 patterns at their finest subdivision, drums 100 %, the click 150 % on every subdivision, the room pad 100 % with 5-note 13th chords at 3.2 kHz, through the new graph.
- Peaks at the clip input: -2.17 to -1.19 dB.
  - mambo -1.19, samba -1.32, rockhalf -1.37, funkrock -1.38;
  - these four put 2-4 samples above the soft clip's knee (0.85 = -1.41 dB).
- No pattern goes near 1.0. Like round 15's m4, this is a claim mismatch, not a sound problem.

## Visual

### V1. A new player's Home shows only 3 of the 7 days at 640x300 (5 of 7 at 780x360)
- Cause: the empty-card line changed in b2f98ca to "Play an exercise or the Practice room to start".
  - `.pc-sub` is `nowrap` inside `.pc-week { flex: none }`, so the totals column grows to 226 px.
  - The chart falls to its 120 px minimum, and the day strip to 90 px.
- With a practice log the line is short:
  - 640x300: 7 of 7 days in view, `.pc-week` 122 px, strip 184 px;
  - 360x780 (portrait): 7 of 7 either way.
- The days are all empty for a new player, so this is cosmetic. It contradicts round 15's "the 7 days … all in view" at 640 px. Fix: let `.pc-sub` ellipsize, or wrap it to two lines.

### V2. Small touch targets in the new controls
- My progression editor:
  - Degree buttons 20-38 x 30 px ("I" is 20 x 30);
  - the 23 Chord buttons and the Length buttons are 30 px tall.
- Picker group chips: 30 px tall.
- Measured at 360x780, 640x300 and 780x360. Everything else in the room, the picker (✕ 34 px, stars 36 x 48, cards 50+) and the Neck bar is 31 px or more.

## Checked and fine
- **Self-test:** 223 exercises, 244 lessons, 99 drum patterns, 27,941 builds, 1,606,371 notes, `problems: 0`.
- **Harmony bar lines (round-15 M1 fixed):**
  - `progression()` for all 23 presets x 1-12 beats x every pattern's groups (437 cases): each form is exactly bars x beats, and every 4/4 bar line falls on a room bar line.
  - Half-bar splits:

    | Metre | Split |
    |---|---|
    | 3/4 | 2 + 1 |
    | 5/4 | 3 + 2 (2 + 3 with the 2 + 3 pattern) |
    | 7/8 2+2+3 | 4 + 3 |
    | 7/8 3+2+2 | 3 + 4 |
    | 9/8 | 4 + 5 |
    | 11/8 | 4 + 7 |
    | 1 beat | each 4/4 beat one pulse |

  - Engine: jazz blues over the 5/4 swing changes on beat 4 of the half bars; rhythm changes in 7/8 3+2+2 on beat 4.
- **Restart rules (round-15 m1 fixed), fake clock, change at bar 3 beat 2:**
  - no restart for another 4/4 pattern, drums off, a tap on the mode already on, or a volume change;
  - a key, progression, beats or mode change: silent from that beat, chord 0 at the next bar line.
- **Engine:**
  - count-in with the harmony alone: 4 clicks, the accent first, the pad from bar 0;
  - muted bars: the form goes on, the pad starts only in played bars;
  - harmony fuzz (seed 1606): 0 problems.
- **Tempo changes (round-15 M3 fixed):**
  - 100 → 1 → 100 BPM: beats at 0.08, 0.68, 1.28, 1.88, 2.48 s, no gap.
  - 30 BPM 16ths → 200 mid-beat: the old beat's three later clicks are cut; the new beat comes at now + 0.03 s.
  - With funk16 at 40 → 180: 7 hits and clicks cut, none left after the new beat.
- **Pad voicings:** all 23 qualities x 12 roots, root 52-63 (E3-D♯4), at most 5 notes, a plain 5th dropped above 4 notes (G13 = G B F A E, G7alt = G B F A♯ E♭).
- **Minor keys (round-15 m2 fixed):** Cm C♯m Dm E♭m Em Fm F♯m Gm G♯m Am B♭m Bm; solfège Do♯m, Fa♯m, Sol♯m, Si♭m. No double accidentals in any preset in any key (C♭ only as the key's own IV/♭VI, by decision).
- **Neck:**
  - Chord / Scale / Off lines ("🎹 Bm7 · Dorian → E7"); the key and set pickers hidden while following;
  - while playing it follows E7 Mixolydian → Amaj7, and F♯°7 whole-half, A7 Phrygian dominant in the jazz blues;
  - "Just the notes" reads "Natural notes are bright…" with harmony off, drone and chords/Off, no error (round-15 M2 fixed);
  - `neckFollow` false/true migrates to off/chord.
- **My progression:**
  - "+" stops at 16; Remove is disabled at 1;
  - a new degree takes its usual chord (V → V7);
  - ✎ Edit of a 36-chord preset copies 16 with the toast;
  - chips = slots.
- **Picker:**
  - Escape (also inside the search), ✕, outside and Back close it with the history clean;
  - Space, T, +, - and the arrows are asleep while it is open;
  - search: case- and accent-insensitive ("bembe", "SAMBA"), "brush" gives 3 patterns, "7/8" gives 2, nothing found gives "Nothing matches that search";
  - recents at most 6;
  - open/close with even a 0 ms macrotask between: history stays clean (only same-task scripted sequences stack entries, which no user can do);
  - 150 open/close cycles: heap, nodes and listeners flat.
- **guardSliders:**
  - a touch held, moved vertically, or a tap: the value stays;
  - a sideways move applies it; a second finger passes; the mouse passes.
- **Hold buttons on touch:** a tap steps 1, a cancelled touch (scroll) 0, a 1 s hold 10; a mouse press steps 1.
- **Start (round-15 m6 fixed):** a quick real mouse drag onto the rail moves it, keeps it at rail + 8 px (76 px), saves the place and does not toggle. Portrait keeps it right of the 58 px rail.
- **Home:**
  - My level 84 px (780/800/915), 76 px (640), a full row at 360x780 (round-15 V1 fixed);
  - "?" chip for a new player;
  - 7 days in view at 640x300 with a log (see V1 for a new player).
- **Drum loudness claims:**
  - through `drumChain` at 100 %: 98 of 99 patterns within 1 dB of the median (countryrock +1.02), peaks at most -1.85 dB (onedrop);
  - through the whole room chain at 80 %: 98/99 within 1 dB, peaks at most -3.37 dB;
  - at the finest subdivision: 99/99, no subdivision moves a pattern more than 2 dB.
- **Room pad:** +13.1 dB over the 77c1e47 graph at 70 % and 100 % (see M1 for where 5 dB of it comes from).
- **Interrupts:**
  - leaving during the count-in (bar -1) or with the picker open: no Room playing, no oscillator left;
  - Back with the picker open closes only the picker, and the room keeps playing.
- **Bad routes:** `#/practice?to=zzz`, `?to=`, `#/practice/neck/x`, `?bpm=999&harmony=xx`, `#/explorer?to=neck` all open the room, with no errors.
- **Corrupt storage:** every `bassclass.*` key garbage at once (settings, progress, practice, log, loggoal, session, course). Every screen, both pickers and an exercise open, with no console error and no NaN/undefined/null text.
- **Monkeys:** 1,880 steps, 0 errors, 0 stuck pickers, 0 Rooms or pads alive off the room, the fab always inside the window and right of the rail. Heaps flat:
  - 1601: 15.2-17.5 MB;
  - 1602: 17.3-18.1 MB;
  - 1603: 17.6-18.4 MB;
  - 1604: 17.8-19.3 MB;
  - 1605: 18.2-19.4 MB.
- **Memory:**
  - 200 My progression edits: 18.8-19.4 MB, nodes flat;
  - 2 min at 296 BPM with drums, chords and the Neck on Scale: 18.9-19.5 MB, nodes 601-613, `Room.ahead` at most 7, no oscillator alive after Stop.
  - The practice card's ResizeObserver is never disconnected when Home is left (one per visit), but the heap stays flat.
- **Regression:**
  - Player timing for `sc-one-octave`, `lk-ii-v-i` and `rh-odd-meters`: count-in 4, 4 and 5 beats, 0 ms error, empty queue after Stop;
  - samples: 84 decode, regular ones within ±3.61 cents;
  - yin: 94 of 96 synthetic tones within ±2 cents (the same 2 noise cases as rounds 14-15, 2.26 and 2.63 cents).
