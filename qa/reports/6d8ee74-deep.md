# QA deep report · 6d8ee74 · 2026-10-29
Summary: 0 critical, 3 major, 6 minor, 2 visual.

Runs:
- Seeded monkeys: 1,000 steps (monkey19 + monkey20 + the new `qa/tools/monkey21.js` watcher, with teleports to free lessons' steps and Pro pages; gates and ownership switched mid-run):
  - seed 2101: 330 steps, 800x380, 4-string, gates on;
  - seed 2102: 330 steps, 640x360, 6-string, left-handed, Do-Re-Mi, a chord drone playing;
  - seed 2103: 340 steps, 640x300, 5-string.
- Drone fuzzer (`qa/tools/drone21.js`): 300 steps (seeds 2111, 2112) on #/practice in Drone mode: picks (free and locked), the Pro sheet's Buy / Restore / Escape / ✕, key, Chord | Scale | Off, sound, notation, gates and ownership, Start / Stop while playing.
- Every drone card on 12 keys: notes against the chord's formula, names, the Neck's spelling (all 44 cards, 528 pairs).
- The engine on a fake clock (`__sim19`): a drone change while playing, on the pad, e-piano, organ, arpeggio and guitar.
- Pro: every free lesson's step by id, by number, with a wrong step index, with another exercise; the map, Home, the session (placed at Stages 3, 4, 5 and 6), favourites, Back/Forward, the drone picker's locked cards and the Pro sheet's Buy → "Let's play".
- Stored records read back by a fresh app (`qa/tools/state21.js`): 14 room cases (hQual, droneFavs, droneRecent; gates on/off), 6 `bassclass-dev.errors` cases; backup → restore of the drone keys.
- Layouts at 800x380, 640x360, 640x300, 915x412 and 360x780 (room, drone picker in every group, Home, map, two free lessons, a free step, Settings, About, Library).
- Memory: 60 cycles (room → drone picker → pick → close → free lesson → its step → Home → Settings).
- Self-test, yin on synthetic tones. About 95 minutes.

Scope: 267b86f..6d8ee74 (a14a09a, fb302cc Free to try; e2519d5 launch fixes; 726d6b1 CHANGED_STEPS rev 7; 6d8ee74 drone chords). Test setup: the `qa` server (port 8878) on the working tree at 6d8ee74 (clean; checked at the start and the end), my own tab, service workers and caches cleared first. Round 20's report (267b86f) is not re-reported where nothing got worse; its M1 (placement) is fixed (see Checked and fine).

## Critical
None:
- no crash, no data loss, no state without a way out;
- no console error in any run;
- no Pro content opened for a free player in the Play setting (gates on, not owned), apart from what the free lessons are meant to open (see m1).

## Major

### M1. Drone chords break the jazz spelling rules: dominants named with sharps, their alterations written with E♯, B♯ and double accidentals
- Where:
  - `web/js/practice/drones.js:41-43`: `droneRoot` names the root with `T.bestRoot(pc, all the chord's intervals)`, which avoids a double flat in the ♭9/♭13 by switching the root to a sharp.
  - `web/js/ui/neck.js:102`: the Chord view over a drone follows `{ ivs }` (shown `'c:*'`), so `key.startsWith('dom')` is false and a dominant's alterations are not written plainly. Only `bb7` is.
- Known answer (CLAUDE.md, spelling rules, QA rounds 16-17):
  - chords chosen on their own take lead-sheet names, flats on the black keys ("A♭7♭9 and A♭7♭5 keep their names");
  - on a dominant the ♭9 ♯9 ♯11 ♭13 ♭5 ♯5 are written plainly (A♭7♭9: A; E♭7♭9: E).
  - The drone's own source comment promises "D♭7♭9" (`drones.js:44`).
- Actual, 11 dominants named with a sharp root on a black key:
  - C♯7♭9, F♯7♭9, G♯7♭9; C♯7♭13, F♯7♭13; C♯7♭5, F♯7♭5, G♯7♭5; C♯7sus♭9, F♯7sus♭9, G♯7sus♭9.
  - The same key in the same picker group mixes names: key A♭, Altered dominants: G♯7♭9, A♭7♯9, A♭7♯11, A♭7♭13, G♯7♭5, A♭7♯5, G♯7sus♭9, A♭7alt.
  - The Key menu renames the key: with the 7♭9 drone, the key picked as A♭ reads "Key G♯" (screenshot, 800x380).
- Actual, the Chord view's info line and note labels (Neck, "Note names"):
  - E7♯9: E – G♯ – B – D – F♯♯. The same chord from a progression reads E – G♯ – B – D – G.
  - G♯7♭9: G♯ – B♯ – D♯ – F♯ – A.
  - B7♯9 C♯♯; D7♯9 E♯; A7♯9 B♯; B7♯11 E♯; E7♯5 B♯; A7♯5 E♯; B7♯5 F♯♯; E♭7♭5 B♭♭; E♭7♭9 F♭; B♭7♭9 C♭.
  - Altered: D♭7alt …E – B♭♭; E7alt …F♯♯; G♭7alt …E♭♭; B7alt …C♯♯; A7alt …B♯.
  - In all, 36 of the 168 dominant card-key pairs (14 dominant cards x 12 keys) have a sharp black-key root or an alteration written as E♯, B♯, C♭, F♭ or a double accidental. That count leaves out the ♭7 C♭ / F♭ of D♭7 / G♭7 chords, which are decided chord-tone spellings.
- Evidence:
  - `droneName(8, 'dom7b9')` = "G♯7♭9";
  - the Neck's line reads "🎹 G♯7♭9: G♯ – B♯ – D♯ – F♯ – A";
  - `__neck().fol({root: E, type: 'dom7s9'})` reads "…D – G", while `fol({root: E, ivs: droneIvs('dom7s9')})` reads "…D – F♯♯".
- Fix ideas:
  - name a drone chord's root as the room's progressions do (lead-sheet: flats on black keys, sharps for minor-type chords, `keyName`/`tonicFor`);
  - pass `type: d.type` to `neck.follow` for chord cards, so the Chord view uses the progression path, and keep `ivs` only for voicings (whose `like` is a dominant: the shell7 card).

### M2. The Cm13 drone does not play its 13th: it sounds Cm11 without a 5th
- Where: `web/js/practice/drones.js:59` → `chordMidis` (`web/js/practice/harmony.js:155-160`). A chord of more than four tones drops its 5th, then keeps the first five: `min13` (1 ♭3 5 ♭7 9 11 13) becomes 1 ♭3 ♭7 9 11. The 13th, the chord's name, is cut.
- Evidence:
  - `droneMidis(0, 'min13')` = 60 63 70 74 77 = C E♭ B♭ D F.
  - The card reads "Cm13 · R ♭3 5 ♭7 9 11 13".
  - The Neck's Chord view shows the A (13) on the board, which never sounds.
  - Every key alike (12 of 12).
- All the other cards hold their defining tones (checked: every card, 12 keys; only the plain 5th is dropped, by design).
- `min13` is new to the room with this commit (My progression's chord list has no m13), and the self-test's `checkDrones` checks the range and order of the notes, not that the chord's tones are there.
- Fix idea: for 6+ tones, drop the 5th and then the 11th (a m13 voiced R ♭3 ♭7 9 13, or R ♭3 ♭7 11 13). Add a self-test check that the 3rd, 7th and the named extension sound.

### M3. "New" on the drone line never goes away for a free player (and takes 44 picks for anyone)
- Where:
  - `web/js/ui/practice.js:725`: `if (newCount(DRONE_KEYS.map(...))) … newChip(true)`. The line shows "New" while ANY of the 44 cards is unused.
  - `markUsed` runs only on a pick (`pickDrone`); a locked card is never picked.
- Steps (an install that updates to 6d8ee74, i.e. `bassclass.new.v1` without the `drone:` ids):
  1. Open the room in Drone mode: the line reads "A5 New / Root and 5th · R 5 8 / Change". The open drone the player always had is marked new too.
  2. Change → every one of the 7 group chips has the new dot; pick "Root and 5th".
  3. The line still reads "A5 New" (`newCount` 43).
- A free player cannot pick the 31 Pro cards, so the chip stays for good. A Pro player must pick all 44 cards to clear it.
- The user's rule is "disappear after being used once".
- Fix ideas:
  - clear the line's chip when the picker is opened (the cards keep theirs);
  - count only the cards the player can pick;
  - leave `drone:open` and `drone:root` out of the new ids (they are not new).

## Minor

### m1. A free lesson's step opens its whole Pro exercise through Options (to confirm with the user)
- Where:
  - `web/js/pro.js` `exerciseLock(t, ls)` opens the exercise whenever `ls` names a free lesson's step on it;
  - in the step, Options is the full sheet (`ui/exercise.js:460`: other options only stop counting for the lesson).
- Evidence, gates on and not owned: `#/ex/md-melodic-modes?ls=melodic-modes.0` → Options lists:
  - every key and the three All-12 cycles;
  - both directions;
  - 1 and 2 octaves.
- So the six exercises behind the free lessons (#413, #430, #507, #515, #611, #605) are fully usable by a free player, any key and variant, for as long as the URL carries the `ls`.
- Everything else stays closed:
  - the same exercises without `ls`, from favourites, by number or with a wrong `ls`;
  - other lessons' steps;
  - the free lessons' "Next" (Pro sheet);
  - checkpoints and tests;
  - the session.
- This may be what "their steps play inside the lesson" means. If the intent is only the steps, lock the Options sheet (or the options the step sets) for a free player in a free lesson.

### m2. The lesson header still numbers units, with numbers that moved
- `web/js/ui/course.js:28` `where()`: "Stage 4 · The whole neck · Unit 30 · Keys across the neck" on every lesson page (here Lesson 4.9).
- Units are named, not numbered, since 2026-10-28.
- These numbers moved when `u-pent3`/`u-pent4` were inserted. Round 20's m3 found the same in Settings' Pro list, and it is still there ("28. Stamina, stretch and harmonics").

### m3. The Dominant 11th drone holds the 3rd against the 11th
- `CHORDS.dom11` is 1 3 5 ♭7 9 11, so the C11 drone sounds C E B♭ D F: E and F a minor 9th apart, held for as long as the drone plays.
- That is right for the textbook formula (the chord-formulas exercise). As a drone to play over, jazz usage is a 9sus4 (no 3rd) for "C11".
- The user may want the 11th drone voiced without its 3rd (or named "11 (with 3rd)").

### m4. The last errors: a corrupt record stops all logging, and repeats push out the cause
- `web/js/errors.js:11-12`: `logError` parses the stored list and pushes onto it. When the record is valid JSON but not an array (`{"a":1}`, `"x"`, `null`), `push` throws, the catch swallows it, and nothing is ever kept again.
  - Evidence (`__state21`): with these records, `logError(new Error('qa21 probe'))` then `recentErrors()` gives `[]`.
  - Non-strings come back as "[object Object]".
- No deduplication: an error repeated in a loop fills the 20 slots and pushes out the first, often the cause.
- Fix ideas:
  - start from `[]` when the parsed value is not an array;
  - skip a message identical to the last one (or keep a count).

### m5. Android: no network permissions while the billing library ships Google's data-transport (to verify on a device)
- The manifest removes INTERNET and ACCESS_NETWORK_STATE (`tools:node="remove"`).
- About lists "Google's data-transport and encoder libraries", which come with Play Billing 9.1.0.
- As I remember it, the transport's CCT backend reads `ConnectivityManager.getActiveNetworkInfo()` when it sends its logs, and that throws a SecurityException without ACCESS_NETWORK_STATE.
- I believe the runtime catches it on its own executor (events dropped, no crash), but I could not check this here (no SDK, no device).
- Worth a logcat look on the Play build after a test purchase and 30 minutes in the background (SecurityException / "Background execution failure").
- ACCESS_NETWORK_STATE is a normal permission that gives no network access; keeping it would not change the privacy text.

### m6. Pro sheet's thank-you does not mention the drone (text)
- `ui/proSheet.js:44`: "every level, every pattern and progression, every sound, and the new content we add to them".
- The offer list and the terms now name "every drone chord", the thank-you does not. Trivial.

## Visual

### V1. Free lesson pages, 800x380: the "Next" button's Pro chip is cut off
- `#/course/major-positions` (any free lesson whose next lesson is Pro), gates on.
- `.les-next` is 327 px, `overflow: hidden`, `white-space: nowrap`. Its text is "Next: Lesson 4.10 · The 5 pentatonic positions ›".
- The chip sits at x 775-807 while the button ends at 786: the gold "Pro" is two-thirds hidden, the title ellipsised before it.
- Every free lesson now shows this button, so it is the first thing a free player sees after trying one.
- At 640x360 it fits.

### V2. Portrait 360x780: the drone line runs out of the Harmony block
- Room, Drone mode, a long name with its New chip ("C♯m11 (4ths + 3rd) New / 4ths and a 3rd · R 4 ♭7 ♭10 5").
- `.pick-now` is 274 px wide in a 232 px row: 93..367, while the block ends at 340 and the window at 360.
- "Change ›" sits on the block's border (section scrollWidth 288 > clientWidth 260).
- The Neck bar's tag wraps to four lines ("Drone: / C♯m11 / (4ths + / 3rd)").
- The Chords mode line fits (232 px). 640x300 and up are clean.

## Checked and fine
- **Self-test:** 231 exercises, 254 lessons, 124 drum patterns, 28,850 builds, 1,653,652 notes, `problems: 0` (25 s).
- **Free to try:**
  - the six free lessons are the self-test's two per Pro stage;
  - each step opens by id and by number with its `ls`, with `demo=1` and `rv=1`;
  - without `ls`, with a wrong step index, `ls=<lesson>` or `.x`, or with another exercise, it stays closed (Pro sheet, hash back to where it was);
  - the free lessons' Hear it and steps; their "Next" opens the Pro sheet;
  - the map's teal "Free" chip is on exactly the six (and on none with Pro owned or the gates off);
  - a favourite added inside a free step opens the Pro sheet from Home ("Level 4 is part of BassClass Pro").
- **Home and session for a free player:**
  - placed at Stage 4: "▶ Try free · Lesson 4.9", toast "…try it free with Lesson 4.9";
  - at Stage 5: Lesson 5.9; at Stage 6: Lesson 6.6;
  - all known: "✓ Stages 1–3 · Stages 4–6 Pro";
  - Today's session at 15/30/45/60′: 34-38 items per placement, none with a Pro `ls` or a Pro exercise (each item's href through `hashLock`); the try lesson's demo and steps come in with their `ls`.
- **Round 20 M1 fixed:** a fresh "All yes" on Stage 6 gives "✓ Course complete" and My level L6. The self-test's `checkPlacement` covers every unit.
- **Drone picker:**
  - 44 cards in 7 groups, favourites and recent, at 800x380, 640x360, 640x300, 915x412 and 360x780: no clipped text, nothing outside the window;
  - a locked card opens the Pro sheet over the room (its own history entry); closed without buying, the picker comes back; Buy (simulated ok) → "Let's play" picks the chord (hQual dom7b9, recent [dom7b9]);
  - gates switched on mid-session: a Pro drone goes back to "Root and 5th" at once (`proChanged`), and on load (`freeRoom`).
- **Drone sound:**
  - every card's notes rise from E3 to C6, root lowest, and hold their chord's tones (except M2; the plain 5th dropped on 5+ tones by design);
  - voicings: spread R 5 10 / R 5 ♭10, shells R 7 10 / R ♭7 10 / R ♭7 ♭10, 4ths R 4 ♭7 ♭10, So What R 4 ♭7 ♭10 5;
  - a change while playing lands on the next beat (pick at 2.11 s → new pad notes at 2.58 s at 120 BPM, the old voices released over 1.2 s like a chord change), on the pad, e-piano, organ and arpeggio; the guitar chugs the drone's power chord;
  - the open drone is still 57 64 69 on A.
- **Stored records:**
  - hQual `zzz`, 7, null, `__proto__`, `constructor` → "open";
  - a Pro hQual with the gates on → "open", with the gates off → kept;
  - droneFavs/droneRecent strings → [], unknown and duplicate keys dropped, recent cut to 6, favourites to 99;
  - no error, no blank screen;
  - a backup carries hQual, droneFavs and droneRecent and restores them.
- **Neck over a drone:** Chord | Scale | Off over a chord, Scale | Off over the open drone and "Root alone"; "Drone: C♯m7" / "Drone on D♭"; the info line lists one note per chord tone (300 fuzz steps, 0 mismatches).
- **Billing code (by reading):**
  - `unasked` applies late and unasked answers only with the gates on;
  - a full list without Pro starts the one-day miss, never an instant take-back;
  - the 15-minute purchase wait and the 2-minute throttle are as documented;
  - the Pro sheet thanks on a late `bassclass-pro` and removes its listener on close.
- **StoreBridge.kt (by reading):** one purchase at a time ("busy"), acknowledge/consume on every query, a pending purchase answered "pending" then sent as an update when Play completes it, query errors never reported as "owns nothing".
- **MainActivity.kt (by reading):** the microphone only for the app's origin, other URLs outside, document-start `BASS_STORE` limited to the app's origin plus the index.html fallback, renderer-crash restart with no saved state, text zoom capped at 130%. CI removes `web/js/dev` and `selftest.js` for the Play bundle, and no shipped module imports them (comments only).
- **Legal:**
  - About renders the policy, the terms and the safety note from `legal.js`;
  - `UPDATED` (29 October 2026) matches `legal/bassclass/privacy.html`;
  - no "Based on", Berklee, SBL or Gwizdala left in `web/js`, README, RESEARCH or the store listing;
  - the song studies carry the "Not a transcription…" line.
- **CHANGED_STEPS rev 7:** `u-scales-check.2` is mm-stomp and `u-feel-check.3` is mm-dust; `at` = e2519d5's commit time (16:16:47 UTC); these are the only course steps on the two rewritten riffs.
- **Monkeys:** 1,000 steps plus 300 drone-fuzz steps: 0 errors, 0 NaN/undefined/null text, 0 Pro violations, 0 picker or sheet without its history entry, no ghost audio.
  - Two harness artefacts were ruled out by hand: a Pro lesson page caught mid-redirect, and the history shim's Back sending the room to Home.
  - Live ResizeObservers climb by one per Home visit (the practice card's, the old note).
- **Memory:** 60 cycles; heap 12.6 → 15.2 → 15.1 → 15.5 MB (levels off), nodes 226 flat, 2 animations flat, localStorage 16,690 bytes flat, 0 pickers left.
- **yin:** 94 of 96 within ±2 cents, the same two noise cases as before (−2.26, −2.63); octave folding passes.
- `audio.js`, `pitch.js`, `player.js`, the samples, `theory.js`, `fretboard.js` and `builder.js` are unchanged since 267b86f. Sample pitch and Player timing were not re-measured.
