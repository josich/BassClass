# QA deep report · f15a4eb · 2026-10-23
Summary: 1 critical, 3 major, 9 minor, 1 visual.

Runs:
- Seeded monkeys (`qa/tools/monkey18.js`: monkey17 plus watchers for the beat lights, accents, grouping, ↺, the Drums line's "played", stored `accents`/`hSound`), 1,470 steps:
  - seed 1801: 340 steps, 800x380, 4-string;
  - seed 1802: 340 steps, 640x300, 6-string, left-handed, solfège;
  - seed 1803: 340 steps, 915x412, 5-string;
  - seed 1804: 450 steps, room only (rail blocked, `<main>` scrolled at random), Arpeggio, 7/8 drums.
- Room fuzz in real time, seed 1805: 140 actions while playing (beat lights, ↺, the four sounds, odd patterns through the picker, drums and harmony on/off, beats, tempo). It found C1 again.
- Fake-clock engine runs (`qa/tools/sim18.js`): the arpeggio against every pattern and subdivision, at 1/30/300/660 BPM, Stop, tempo change, sound switch, muted bars and count-in; click levels and drum hits per beat for 63 accent groupings.
- Renders through the REAL audio graph (`qa/tools/audio18.js`). A same-origin iframe gets an OfflineAudioContext before audio.js builds its graph, then the app's own `click`, `playNote`, `playDrum`, `padSet`, `arpNote` and `tapTick` play into it. Measured: onsets, click levels at 20-100 %, the Backing's dip under clicks, the arpeggio against the pad, the loudest mix, render cost.
- Old vs new builds (`__compare17`, f600870 served on :8883): 4,632 exercise builds and 1,392 room progressions.
- Also:
  - self-test;
  - the Neck in 5,448 followed states;
  - stored records read back by a fresh app (`qa/tools/state18.js`, 30 cases);
  - layouts at 7 sizes (`qa/tools/layout18.js`);
  - memory: 80 room cycles, and 3 minutes of playing;
  - Player timing, samples, yin, bad routes.
- About 95 minutes.

Scope: f600870..f15a4eb (fab014c, 2bf680f, 11eaef8, 949b199, f15a4eb).

Test setup: a frozen copy of the tree (`git archive f15a4eb web tools`), served on 127.0.0.1:8878 by its own `tools/serve.py`, in my own background tab. Hidden-pane timers ran on the MessageChannel wheel (`home11.js` `__fastSrc`).

## Critical

### C1. Switch the Sound to Arpeggio while the room plays: the last chord never stops, even after Stop and on other screens
- Where: `web/js/practice/engine.js`.
  - `set()`: `if (changed('hSound')) this.hSig = null;` forgets that a pad chord is held.
  - `_harmony()`, arpeggio branch: `if (this.hSig != null) { A.padStop(t0); … }` therefore never releases it.
  - `stop()`: `if (this.hSig != null) A.padStop();` does not release it either.
  - The held voices stay in `audio.js` `padVoices` with no stop time.
- Steps:
  1. Practice room → Harmony: Chords (12-bar blues in A), Sound: Pad.
  2. Start. When the first chord sounds, tap Arpeggio.
  3. Stop.
  4. Tap Home.
- Expected: the pad gives way to the arpeggio at the next beat, and Stop silences everything.
- Actual:
  - The A7 pad chord keeps sounding under the arpeggio, against D7 and E7. Four sawtooth voices (220.0, 277.2, 329.6, 392.0 Hz) and their triangles have no stop time.
  - After Stop it still sounds, and it is still sounding on Home 2.5 s later.
  - Going back to the room, then Start + Stop on the arpeggio, Harmony Off, or opening an exercise: still held.
  - Only these end it: choosing Pad, E-piano or Organ again and pressing Start + Stop (the next `padSet` releases the old voices), or reloading the app.
- Evidence:
  - Real clock: the UI clicks above with an oscillator log. The counts read "playing the arpeggio: 4 pad sawtooths still held", "after Stop: 4", "on Home 2.5 s later: 4 still held".
  - Fuzz seed 1805 hit it on its own: step 134 Arpeggio (playing), step 137 Stop, then "stopped but 15 voices held" at steps 137-139.
  - Fake clock (`__arp18`, part 5):
    - the pad starts at 0.08 s;
    - the switch to Arpeggio comes at 2.3 s, and the arpeggio starts at 2.58 s;
    - the pad's oscillators get a stop time only when the sound goes back to Pad at 5.58 s (stop 6.78 s);
    - 12 arpeggio notes played over the held chord.
  - The same holds for the drone and the organ. By the code, the e-piano's voices settle at 20 % of their strike and also hold.
- Fix idea:
  - release the held sound whenever the arpeggio takes over, with a flag that does not depend on `hSig` (for example, call `A.padStop(t0)` on the first arpeggio beat after a sound change);
  - make `stop()` call `A.padStop()` unconditionally (with no voices it does nothing).

## Major

### M1. The arpeggio plays straight 8ths over a shuffle
- Where: `engine.js` `_harmony()`: `const t = t0 + (k * len) / L;`. The clicks and drums use the pattern's feel (`clickTimes`, `stepTime`).
- Actual, inside a beat:
  - On all 20 triplet-grid patterns (beat q, grid 3) at the 8ths subdivision (the Shuffle), the arpeggio plays at 0 and 0.5 of the beat. The click and drums play at 0 and 0.667.
  - Nine patterns default to 8ths, so picking one of them with Arpeggio clashes at once: rockshuffle, texasshuffle, chicagoshuffle, doubleshuffle, jumpblues, upswing, bebop, onedrop, countryshuffle.
- Evidence: `__arp18().feel`, every pattern x every offered subdivision at 100 BPM, for example `chicagoshuffle (grid 3, beat q) L2: arp at 0 0.5 | clicks at 0 0.667`. Every other case agrees: x/8 patterns, compound (dotted-quarter) patterns, swung 16ths (triplets on a 16th pattern), and drums off.
- Fix: take the arpeggio's offsets from `clickTimes(this._pattern(), L)` (they already hold the feel).

### M2. Major | Minor does not undo itself: a major My progression's borrowed chords become other chords
- Where: `ui/practice.js` `toMode()`.
  - Every chord whose quality is its degree's usual one is converted.
  - `usualQuality(d, false)` also calls ♭III maj7, ♭VI maj7 and ♭VII7 usual in a major key.
  - Major → Minor leaves them alone: 3, 8 and 10 are not keys of `MAJOR_TO_MINOR`.
  - Minor → Major then converts them: ♭III → iii, ♭VI → vi, ♭VII → vii°.
- Steps and actual (through the UI, key C):
  - C – B♭ (I – ♭VII, the Mixolydian vamp copied with ✎ Edit) → Minor: Cm – B♭ → Major: **C – B°**.
  - Cmaj7 E♭maj7 A♭maj7 B♭7 → Minor: Cm7 E♭maj7 A♭maj7 B♭7 → Major: **Cmaj7 Em7 Am7 Bm7♭5**.
- Expected: the round-17 decision says "chords the player chose stay". A ♭VII picked in the major key is the player's choice, and Minor then Major should give back what was there.
- Fine: diatonic lists round-trip, both as 7ths (I ii iii IV V vi viiø) and as triads (C G Am F → Cm G A♭ Fm → C G Am F).
- Fix idea: convert only in the direction a chord came from. For example, Minor → Major converts ♭III/♭VI/♭VII only if a Major → Minor produced them (mark converted chords). Or leave out of the conversion the borrowed degrees that are already usual in the source key.

### M3. Portrait phones: the six sliders beside the tempo shrink to 0-7 px and cannot be used
- Where: `web/css/app.css` (fab014c), `@media (max-width: 700px) { .metro-opts { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); … } }`.
- The affected sliders: Click volume, Muted bars Play/Mute, and Speed up Add/Every/Up to.
- Actual: each column's `range-line` holds the label (46 px), the slider, and the value (up to 64 px, e.g. "+10 BPM").

  | Window | Column | Slider width |
  |---|---|---|
  | 360x780 | 107 px | **0 px** (all six) |
  | 412x915 | 133 px | **7 px** (all six) |
  | 640x300 | 248 px | 122 px |
  | 780x360 | side by side | 154 px |

- In portrait none of the six can be dragged. The room is open in portrait (no rotate prompt), and earlier rounds checked it at 360x780.
- Fix idea: one column below about 480 px, or put the value under the slider in the two-column grid.

## Minor

### m1. The arpeggio's loudness follows the tempo, about +3 dB per doubling
- `arpNote`'s √(2/L) evens out the subdivisions at a given tempo (within 0.5 dB). It does not even out tempos, because the notes per second grow with the BPM.
- A-weighted against the held pad, A7 voicing, harmony 70 %, real graph:

  | BPM | x1 | x2 | x3 | x4 |
  |---|---|---|---|---|
  | 60 | −3.3 | −3.3 | −3.3 | −3.4 |
  | 120 | −0.3 | −0.4 | −0.1 | −0.4 |
  | 200 | +1.9 | +2.0 | +2.4 | +0.9 |

- That is 5.3 dB from 60 to 200 BPM, extrapolating to about −6 dB at 30 BPM and +7 dB at 660 (then the limiter).
- The round-17 decision accepted a softer e-piano at slow tempos. This one is larger, and it also gets louder at fast tempos.
- Fix idea: scale each note by the notes per second (bpm x L), not by L alone.

### m2. Arpeggio cost at fast tempos (a suspicion for phones, not confirmed on a device)
- Each note keeps 2 oscillators and 3 gains for 2 s. At its 0.32 s decay it is −33 dB after 1.2 s and −54 dB at 2 s.
- Offline render time through the real graph on this PC, as a share of real time:

  | Content | Share of real time |
  |---|---|
  | Held pad | 1 % |
  | 300 BPM 16ths, drums alone | 10 % |
  | 300 BPM 16ths, arpeggio alone | 15 % |
  | 300 BPM 16ths, arpeggio + drums | 21 % |
  | 660 BPM 16ths, drums alone | 25 % |
  | 660 BPM 16ths, arpeggio + drums | 56 % |

- A phone several times slower than this PC could drop out at fast arpeggios.
- In the fake-clock run, 660 BPM 16ths keeps 176 arpeggio oscillators alive.
- Fix idea: stop each note at about 1.2 s, or use one oscillator.

### m3. With the drums off, the chords' half bars ignore the grouping the click plays
- `Room._chords()` passes `this._pattern()?.groups`, which is null with the drums off. A split bar then changes chord at its rounded half.
- With the default groupings of 8-11 beats, the second chord lands inside a group:
  - Rhythm changes (A), Jazz blues, the ii – V – I cycle and Giant Steps in 8 beats change on beat 5, while the accents fall on 1, 4 and 7 (3 + 3 + 2);
  - in 9, 10 and 11 beats they change on beats 6, 6 and 7, all mid-group.
- A player's own 5/4 accented 2 + 3 still splits chords 3 + 2. Rhythm changes in 5/4 change on beat 4.
- With the drums on, all 89,088 regrouped cases land on group starts.
- Fix idea: with the drums off, pass `groupsOf(beats, accents)`.

### m4. Tuner: the second tap on a string plays the tap tick and the reference note together
- Evidence: a real click on A, then on A again, gives a tick at t = 558.925 and the 3 s A1 sample at 558.940.
- The string buttons are "controls that sound themselves" but are not marked `data-silent`.
- Untested here (no microphone): the tick on every tuner tap also reaches the microphone while the tuner listens.

### m5. Settings → Tap sounds gives the opposite of a preview
- Real clicks: "Off" ticks once, and "On" is silent.
- Cause: the capture listener in `app.js` reads `settings.tapSounds` before the segment's handler changes it.

### m6. The Neck names the blues scale on pc 3 "D♯ Blues", while the Library writes "E♭ blues"
- The Neck's own Minor pentatonic on the same key says E♭. `tonicFor('blues')` uses the minor key's name, which CLAUDE.md gives as "E♭ blues".
- Since f15a4eb the drone follows the Neck (`rootName`), so it reads "Drone on D♯".
- The Neck's root picker named it D♯ before this commit too.
- The other black keys agree: B♭, G♯, C♯, F♯.

### m7. One bad entry in the stored accents drops every metre's groupings
- `RULES.accents` in `practice/state.js` is all or nothing. `{ 7: [0,3,5], 5: [0,7] }` loads as `{}`, so the player's 7/8 grouping is lost too.
- The round-16 rule for stored lists drops only the bad entry.
- Corruption only. `{ "7.0": [0,3] }` is accepted (harmless).

### m8. Picker search: what a phone keyboard types finds nothing
- "bvii" or "bVII" → 0 progressions, while "♭VII" → 4. `wordsOf` splits words on ♭ and on "+".
- "3+2" → 0 drum patterns, while "3 + 2" → 8.
- Not a regression: the old substring search missed them too.

### m9. A beat light tapped by keyboard (Enter) loses the keyboard focus
- `drawLights()` rebuilds the buttons, so focus drops to `<body>` and Tab starts again from the top.
- Fine: Space with a focused light starts the room and leaves the accent alone (keydown is prevented).

## Visual

### V1. "↺" (back to the usual grouping) is 30 x 26 px at every size
- Measured at 360x780, 640x300, 780x360, 800x380 and 915x412.
- The other new controls are 32-36 px or more: chord chips 36 px, beat lights 22 px with a 38 px tap area.
- See also M3 (portrait sliders).

## Checked and fine

**Self-test (f15a4eb):** 223 exercises, 244 lessons, 99 drum patterns, 27,953 builds, about 1.61 M notes, `problems: 0`.

**Spelling (f600870 → f15a4eb, `__compare17`):** 4,632 builds, 70 differences. All of them are the round-17 decisions:
- A♭7♭5 / D♭7♭5 in D♭ / G♭ and F♯7♯5 in B are back.
- D♯7 (with F𝄪) leads to G♯m in G♯ minor and in B major (III7, autumn, rhythm bridge, walking lines).
- The Andalusian in G♯ minor reads G♯m F♯ E D♯.
- Room progressions: 1,392 builds in 4 metres. Only those five pairs are renamed, and the MIDI is unchanged.

**Neck:**
- One spelling per note, Chord vs Scale view: 2,688 preset chords (12 keys) and 2,760 My-progression cases (every quality x 12 degrees x 5 keys x major/minor). No pitch is spelled two ways. Examples:
  - G7alt: G B F A♯ E♭ | altered G A♭ A♯ B D♭ E♭ F;
  - F♯°7: F♯ A C E♭ | whole-half F♯ G♯ A B C D E♭ F;
  - G♯m(maj7): F𝄪 in both views.
- Over a dominant a scale repeats letters by the plain-alterations rule (B7 Lydian dominant: … F F♯ …).
- Altered on flats for all 12 roots (A♭ Altered: A♭ A B C D E G♭; D♭ and G♭ keep their ♭7 C♭ and F♭ as chord tones).
- `rootName` matches the root picker for all 38 sets, with no error.

**Click (v3 scale), real graph, peak dBFS:**

| Slider | Accent | Group | Beat | Sub |
|---|---|---|---|---|
| 20 % | −18.79 | −20.66 | −22.39 | −30.80 |
| 40 % | −12.77 | −14.64 | −16.37 | −24.78 |
| 60 % | −9.25 | −11.12 | −12.85 | −21.26 |
| 80 % (default) | −6.75 | −8.62 | −10.35 | −18.76 |
| 100 % | −4.81 | −6.68 | −8.41 | −16.82 |

- The accent sits 3.60 dB over the beat and the group accent 1.73 dB over it, at every level.
- The Backing pad's worst dip under the clicks is 0.04-0.19 dB (no ducking).

**Alignment (ALIGN):** onsets at the output through the real graph:

| Source | Lag |
|---|---|
| Click | 20.7 ms |
| Kick | 20.9 ms |
| Snare | 20.7 ms |
| Closed hat | 20.7 ms |
| Bass sample | 21.5 ms |
| Arpeggio | 20.9 ms |
| E-piano | 21.0 ms |
| Organ | 21.1 ms |
| Tap tick | 10.3 ms |

All the music lands within 0.8 ms.

**Settings v3** (a fresh app in an iframe each time):
- clickVol 0.6 → 1.2, 0.9 → 1.5, 1.5 → 1.5;
- a v1 record (bassVol 1, clickVol 0.3) → 2 / 0.6;
- a v3 record is left alone, and so is v9 (a newer backup);
- `v: "2"` migrates;
- a string clickVol → the default 1.2, and a bad `tapSounds` → true;
- a v2 record read twice doubles once (the record is not rewritten until a save, and the migration repeats identically).

**Practice record:**
- the old `accent: false` → `{ beats: [] }`, and `accent: true` → `{}`;
- out-of-range, duplicate, fractional, `[]`, `"x"`, `__proto__` and 13-beat accents → `{}`;
- `hSound: "strings"` → arp, and "xx" → pad;
- garbage JSON → defaults.
- No error or NaN text on the room, Settings or Home in any of the 30 cases.

**Accents and regroup:**
- 63 engine runs (9 odd patterns x 7 groupings): the click pitch on every beat and the drum hits on every beat match the regrouped pattern.
- `regroup` on all 3,072 accent sets of the 9 odd patterns, groups up to 12 beats: whole bars, the downbeat kept, every group on a source head, no undefined velocity. seven223 played 3 + 2 + 2 equals the written seven322.
- Chords over regrouped patterns: 89,088 progressions, all on group starts, in whole bars.
- The engine's accents follow the drums on and off (7 beats: 0,2,4 → seven322 0,3,5 → 0,2,4).

**Arpeggio:**
- Exact grid at 1, 30, 300 and 660 BPM x 1-4 notes a beat.
- Stop cuts the notes still to come in the beat; a tempo change at 1 BPM cuts the old beat's notes.
- Silent in muted bars and the count-in.
- The loudest mix (drums, click and harmony at 100 %): peak −3.0 dB and 0 samples over the soft clip's knee (rock16 at 200 BPM in 16ths, rock8 at 120 in 8ths, samba at 200 in 16ths).
- 3 minutes at 300 BPM in 16ths with drums: `Room.ahead` 12-16, 81 live oscillators, heap and nodes flat.

**Tap sounds** (real clicks, ticks counted on the 1650 Hz automation):
- Start, exercise Play and the beat lights are silent.
- ⓘ, Change and a picker card tick once (Enter on a card too).

**Picker:**
- Shift+Tab wraps inside it, and after a pick the keys go to the new Change.
- Search results:
  - "ii" finds 7 progressions (no iii or ♭VII);
  - 2-5-1, 251, autumn, modal, coltrane, pachelbel and doo-wop work;
  - brush, 7/8, 12/8, bembe, baiao and afro-cuban work.

**Layout** (800x380, 780x360, 640x300, 640x360, 915x412, 412x915, 360x780):
- no sideways scroll and no overlapping controls;
- chord chips 36 px;
- the Degree row scrolls at 640 px;
- the boundary between two beat lights' tap areas lies 1 px from their midpoint.

**Monkeys:** 1,470 steps and 0 errors. No NaN/undefined text, no stuck picker, no light/accent/grouping/"played" mismatch, no bad stored record. Heap 17-47 MB with no trend.

**Memory:**
- 80 room cycles (Start, a light, Tap, a sound, Stop, picker, ⓘ, Home): nodes 289 flat, `localStorage` 6.55 kB flat, 0 animations, heap 20-41 MB (GC sawtooth).
- The live ResizeObserver count still rises about 1 per Home visit in a hidden pane, as in round 17. Not confirmed as a leak: the observers disconnect in their callback, which a hidden pane does not run.

**Regression:**
- Player timing 0 ms error: sc-one-octave, rh-odd-meters (5-beat count-in), lk-ii-v-i.
- 84 samples decode; the regular ones are within ±3.6 cents.
- yin: 94 of 96 within ±2 cents (the same two noise cases, 2.26 and 2.63).
- Bad routes load without error: `#/ex/nope`, `#/m/nope`, `?key=99&scale=zzz`, `?lick=999`, `#/practice?to=zz`, `#/explorer`, `#/path`, `#/course/nope`.
