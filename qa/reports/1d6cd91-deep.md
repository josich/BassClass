# QA deep report · 1d6cd91 · 2026-10-23
Summary: 0 critical, 3 major, 12 minor, 2 visual.

Runs:
- Monkey (general, `qa/tools/monkey14.js` on top of `monkey11.js`): seeds 1401, 1403 and 1404, 330 steps each, about 10 min.
  - 1401: 780x360, 4-string, hidden pane with the MessageChannel timer wheel.
  - 1403: 640x300, 5-string, left-handed, highest fret 17.
  - 1404: 915x412, 6-string, Do-Re-Mi, highest fret 24, Backing on Chords.
- Practice-room fuzzer (`qa/tools/roomfuzz14.js`): seeds 1402 and 1405, 300 steps each.
  - It covers Start/Stop, Space, T and the ± keys, hold buttons (released or left), tap tempo, every slider, the option segments, beats, drums on/off, styles, the Neck selects and taps, ⓘ, leaving by the rail and Back.
  - Both runs together: 50 Room starts.
- Two aborted general runs (214 steps). One was spoiled by a harness artefact (see "Checked and fine").
- Checks against known answers (`qa/tools/checks14.js`):
  - metronome scheduling on a fake audio clock: 16 tempo/subdivision pairs, beats 1–12, muted bars, speed up;
  - every drum style hit by hit, layers and the open-hat choke;
  - offline renders of the drum chain at default and maximum levels;
  - the practice log on a fake clock (midnight, idle cap, frozen page).
- Backup: round trips, 15 malformed files, a forced quota error, a restore through the real file input, the native bridge with a stub.
- Self-test, Player timing, samples and yin, corrupt storage, routes.
- Memory: 120 screen cycles, plus 2.5 min of 16ths with funk drums at 200 BPM.
- Layouts at 6 sizes.

About 3 h in all. Scope: 8a28412..1d6cd91: backup, practice log, API 36, Practice room steps 1–2 with drums, rail of five.

Test setup:
- `qa` server on `http://localhost:8878`. Before testing I unregistered the service worker and cleared the caches.
- My own tab only: tab-3.

Note on the working tree:
- The Practice-room files were changed on disk (uncommitted) while I was testing: `styles.js`, `engine.js`, `state.js`, `drums.js`, `practice.js`, `app.css` and the drum kit.
  - The kit files changed at 13:22–13:23 and the JS at 13:30–13:32.
  - My last page load was at 13:25:43. Its loaded modules match 1d6cd91: `Room` source 2,887 characters as committed (the working copy has 3,320), and the 11 committed styles.
  - The kit came from my own cache, filled earlier from the committed kit.
- So every finding here is for 1d6cd91.
- Read-only look at the uncommitted diff:
  - `engine.js` still loops piece by piece inside a beat, so M2's cause remains for any closed or pedal hat that follows an open hat in the same beat;
  - `drums.js` now has `VERSION = 2`, which makes m8's stale service-worker copies real.

## Critical
None.

## Major

### M1. The practice log counts a frozen or sleeping app as practice: up to 20 minutes per hide, or the whole gap when the first thing after the return is a tap
- Where: `web/js/practiceLog.js`
  - `credit()` (:112–121) counts `min(now, lastInput + IDLE) - since`;
  - `touched()` (:109) moves `lastInput` before any credit is made;
  - `visibilitychange` (:126) only credits; it does not stop the run.
- The credit assumes the run played all the time since the last tick. When the page is frozen (app in the background, screen off with the power button), the 15 s timer does not tick, so nothing plays but the time is still counted:
  - the first credit after the return counts the frozen time, up to 20 minutes after the last touch from before the hide;
  - if a tap comes before that first tick (for example the tap on Stop), `lastInput` has just moved to "now", so the whole gap counts.
- Steps (fake `Date`, the module's real code; `__qaLogClock` in `checks14.js` plus a hidden/visible pair):
  1. `logPlaying(true)`, then 1 minute of 15 s credits.
  2. `visibilitychange` with `document.hidden = true`, then 2 hours with no tick, then visible again.
  3. a. The overdue tick runs first, then a tap and Stop.
     b. A tap and Stop come first.
- Expected: about 1 minute logged.
- Actual:
  - (a) 1,200 s right after the overdue tick, 1,205 s after Stop, so 19 minutes are invented;
  - (b) 7,260 s, so 2 h 01′ for 1 minute of play.
  - A plain 2-hour gap with a touch at the end, without the hide, also gives 7,260 s.
- What I could not confirm: how often Android freezes the WebView's timers while an exercise or the metronome is left on. If the audio really keeps playing in the background, the timer ticks and the 20-minute cap works as designed (a 45-minute untouched run logs exactly 1,200 s).
- The headline numbers on Home (ring, 7-day total, gold days, streak) come from this log, and the inflated minutes are stored for good.
- Possible fix:
  - in `touched()`, call `credit()` before moving `lastInput`;
  - on `visibilitychange` → hidden, credit and stop counting (`since = null`), and start again on visible if the run is still on;
  - or cap one credit at about 2 × TICK.

### M2. Funk: the closed hi-hat right after the open hat does not close it; the open hat rings to the next downbeat
- Where: `web/js/practice/engine.js:74–79` and `web/js/drums.js:175–179`.
  - Inside one beat the engine schedules piece by piece: all `hhc` steps first, then `hho`.
  - `playDrum` can only choke an open hat that is already scheduled.
  - So the closed hat on the "a" of 4 (step 15) is scheduled before the open hat on the "&" of 4 (step 14) and never chokes it.
- Steps: Practice room → Drums On → Funk → Start. Or run `__qaDrumCheck()`.
- Expected: the code's rule ("a closed or pedal hi-hat closes the open one"). At 120 BPM the open hat at 1.83 s is choked at 1.955 s (step 15).
- Actual:
  - chokes come at 2.08 / 4.08 / 6.08 / 8.08 s, the next bar's downbeat;
  - the open hat rings twice as long (250 ms instead of 125 ms at 120 BPM) and sounds together with a closed hat, which a real hi-hat cannot do;
  - this happens in every bar of Funk.
  - Disco is right: its closing hat lies in the next beat.
- Evidence: scheduled `setTargetAtTime(0, t, 0.015)` times on a fake clock:
  - funk `chokes [2.08, 4.08, 6.08, 8.08]` vs expected `[1.955, 3.955, 5.955, 7.955]`;
  - disco: 15 of 15 match.
- Fix: schedule step by step (`for j … for piece …`), or sort a beat's hits by time before `playDrum`.

### M3. Leaving the Practice room while − or + is held leaves a 70 ms timer running for good: the saved tempo climbs to 260 (or falls to 30) and is written about 10 times a second until the app restarts
- Where: `web/js/ui/practice.js:48–60` (`holdButton`).
  - The repeat stops only on pointerup, pointerleave or pointercancel on the button itself.
  - `dispose()` (:265) does not stop it.
  - A button removed from the page while pressed never gets those events.
- Steps:
  1. Practice room. Press and hold + (pointerdown).
  2. While holding, leave the screen: a second finger on the rail, the system Back gesture, or a mouse back button.
  3. Release anywhere.
- Expected: the hold ends with the screen.
- Actual:
  - on Home the stored `bassclass.practice.v1` bpm went 91 → 112 → 127 in 2.8 s, then reached 260;
  - after that it kept writing: 94 writes in 12 s at 260;
  - the next visit to the Practice room opens at 260 BPM "Prestissimo".
  - Only a reload stops it.
- How often: rare (two hands, or a system gesture while holding), but the result sticks. It also drains the battery with storage writes.
- Fix: keep the hold timers in the screen and clear them in `dispose`, or listen for pointerup and pointercancel on `window`.

## Minor

### m1. Android: two quick taps on "💾 Save a backup" open two pickers. The second save always fails silently and can leave an empty file
- Where: `MainActivity.kt` `saveFile` (:90–103) and `onActivityResult` (:186–200); `screens.js` `save` (:294–297).
- What happens:
  - the second `saveFile` starts a second picker;
  - the first result writes the text and sets `pendingSave = null`;
  - the second result finds no text and reports "cancel", but the user has already picked a place, and `ACTION_CREATE_DOCUMENT` has created an empty file there;
  - on the web side each tap adds its own `{ once: true }` listener, so the first answer fires both listeners and the second answer shows no toast.
- Evidence:
  - stubbed bridge: 2 `saveFile` calls;
  - events `ok` then `cancel`: the toasts were only "Backup saved", so the second save shows no message.
  - The Kotlin part is code review only.
- Fix: ignore Save while a picker is open (a flag on both sides), or keep the text per request.

### m2. A drum download that fails half-way leaves "Loading the drums… 14%" on screen with the drums Off
- Where: `drums.js:55–61` (workers) and `practice.js:191–198`.
  - When one fetch rejects, `Promise.all` rejects and the `.catch` clears the label.
  - The other workers keep going and call `onProgress` afterwards, which writes the percentage back.
- Steps: the first 10 `.ogg` fetches succeed and the rest fail (patched `fetch`). Practice room → tap Rock.
- Actual:
  - the toast "The drums need an internet connection the first time" shows, drums go Off (stored `false`);
  - the label still reads "Loading the drums… 14%" 2 s later;
  - a retry once online works: 73 files cached, the kit ready.

### m3. Loading a backup made by a NEWER BassClass drops ✓ Clean / tempo records of every changed course step
- Where: `course/progress.js:86`.
  - A stored `rev` above this version's `REV` counts as 0, so every `CHANGED_STEPS` entry without `at` is applied again.
  - Backups make this reachable: save on an up-to-date phone, load on an older APK.
- Steps: course store with `rev: 7` (the current REV is 6) and records on `s1-test.0`, `open-triads.0`, `u-triads4-check.2`, `s6-test.8`, `open-e.0`, loaded by a fresh `progress.js`.
- Actual:
  - `open-triads.0`, `u-triads4-check.2` and `s6-test.8` are gone; `s1-test.0` survives thanks to its `at`;
  - with `rev: 6` all five stay.
- Latent today: no rev 7 exists yet.
- Fix: treat `rev > REV` as `REV`, or warn when a backup's `version` is newer.

### m4. "Load a backup" reads the whole chosen file into memory, whatever it is
- Where: `screens.js:298–308` (no `file.size` check) and `MainActivity.kt:147–158`.
  - The Android picker asks for `*/*` and ignores the input's `accept`, so videos and photos are offered too.
- Evidence: a 50 MB file → heap +50 MB, then "This file is not a BassClass backup." (66 ms here).
- Suspicion, not confirmed on a device: a multi-GB video could exhaust the WebView renderer. `onRenderProcessGone` is not handled, so that would end the app.
- Fix: refuse files over a few MB before `file.text()`, and use `params.createIntent()` or the accept types.

### m5. The drum styles count BPM in different units, and the tempo carries over silently
- Where: `practice/styles.js`. 4/4 and 5/4 count quarters, 12/8 counts dotted quarters (`beats: 4`), 7/8 counts eighths (`beats: 7, unit: 1`).
- What changes when switching style at 90 BPM:
  - Funk has 8ths at 180 per minute;
  - 7/8 has 8ths at 90 per minute, half the speed, and is still called "Andante";
  - 12/8 has 8ths at 270 per minute.
- The Italian name and the subdivision chips ("8ths" in 12/8 gives duplets) do not adapt. The ⓘ says only that the style sets the beats per bar.
- This is a player-facing explanation gap, not a timing error. The grid itself is exact.

### m6. The swing ride's accents on 2 and 4 are inaudible
- Where: `drums.js:166` (`Math.floor(vel * layers.length)`) with the 3-layer ride.
  - Both `x` (0.72) and `X` (0.95) map to layer 2.
  - Only the gain shading differs: 10^(16/20)·(0.7+0.3v) = 5.78 vs 6.22, so +0.6 dB.
- The same happens with any 3-layer or 2-layer piece (ride, rim, hho, hhp).
- The written accent (`ride: 'x..X.xx..X.x'`) is lost.

### m7. The styles differ in loudness by up to 9 dB
- Offline render, drums 80 %, metronome 60 %, 4 bars at 120 BPM, RMS at the clip input:

  | Style | RMS |
  |---|---|
  | Bossa | −16.7 dB |
  | Disco | −19.5 dB |
  | Rock | −21.3 dB |
  | Pop | −21.3 dB |
  | Funk | −21.1 dB |
  | Swing | −25.3 dB |
  | Reggae | −26.0 dB |

- The bossa shakers (+2 / +10 dB in `MIX`) peak at 0.59–1.15 before the drum bus, above the top kick layer (0.40).
- Switching styles therefore jumps in level. The mix is a taste matter; the numbers are here to help.

### m8. Web: the drum kit is cached twice, and old kit versions stay in the service-worker cache
- Evidence after one load:
  - `bassclass-drums-v1` holds 73 entries;
  - the service worker's `bassclass-v1` holds the same 73 URLs (`…/drums/*.ogg?v=1`), so about 1.1 MB more.
- When `VERSION` goes to 2, `drums.js` deletes `bassclass-drums-v1`, but the `?v=1` copies in `bassclass-v1` are never removed.
- APK and browser alike, as long as the service worker is registered.

### m9. APK: the drums come from `raw.githubusercontent.com/…/main`, not from the APK's own version
- Where: `drums.js:10–11`.
- Two consequences:
  - if the repository stops being public (still open in the roadmap), every install that has not loaded the kit yet loses the drums;
  - an old APK always fetches today's `main` files under its own `?v=` key, so a future change of `kit.json`'s format reaches APKs that cannot read it.
- Code review. Checked:
  - CORS: `Access-Control-Allow-Origin: *`, so the fetch works today;
  - the kit is left out of the APK: v1.0.71 → v1.0.72 grew 9 KB, not 1.1 MB.
- Option: pin the commit or tag in the URL (CI already stamps it into `version.js`).

### m10. A day with 30–59 s shows a "1′" bar but does not count as practised
- Where: the bars and the bubble round to the minute and show from 30 s (`practiceCard.js:50,53`), but "days practised" and the streak need 60 s (`practiceCard.js:68`, `practiceLog.js:160`).
- Evidence: log with today 45 s and Wednesday 59 s.
  - Both bars read "1′", and the ring reads "1′ of 30′".
  - The week reads "4 days practised", which leaves both out.

### m11. Corrupt or old Practice-room storage can keep the drums on with the wrong beats per bar
- Where: `practice/state.js` `load()`. It accepts `{ drums: true, style: 'odd7', beats: 4 }`.
- The engine then plays only the first 4 eighths of the 7/8 bar, while the UI blocks changing the beats ("The drum style sets the beats").
- The UI never produces this state; only stored data can.
- Fix: after loading, set `beats` to the style's beats when the drums are on.

### m12. Text
- The backup confirm dates the backup in the device's locale:
  - "Load the backup from January 2, 2026?" in en-US (`screens.js:304`, `toLocaleDateString(undefined, …)`);
  - a Spanish phone would get "2 de enero de 2026" inside an English sentence;
  - the practice card uses `en-GB` ("Friday 23 October").
- `curriculum/grooves.js:250`, a tip of `wk-mixed`: "improvise your own line with the fretboard explorer as a map". The explorer is now the Practice room's Neck.
- "Reset progress" now also erases the practice log (`screens.js:329`), but the confirm still reads "Reset all progress, the course included?".
- In the Practice room at 780x360 the Neck block starts at y = 761 in a 360 px view (two screens down), and its board is 626x156 px. Worth a look by the user QA.

## Visual

### V1. Portrait 360x780 (browser or PWA): Home's practice card and the Practice room's metronome overflow sideways
- Home:
  - the chart keeps its 120 px minimum inside a 175 px card;
  - the day bars run under "My level" (four overlaps of 5–18 px) and the today bar ends at x = 366 in a 360 px window;
  - `main` scrolls sideways (311 > 302).
- Practice room:
  - the tempo row and the option rows are 296 px wide;
  - Tap ends at x = 389 and "More beats" at 389;
  - `main` scrolls sideways (331 > 302).
- The APK is locked to landscape, so only the web app is hit. All landscape sizes are clean (780x360, 640x300, 915x412, 844x390, 1024x768).

### V2. Small touch targets on the new screens
- The practice-card day bars are 22x59 px, and 18x59 px below 640 px wide.
- The Practice room's option segments are 30 px tall: Click On/Off, Accent On/Off, the four subdivision icons (40–48 x 30 px).
- Everything else measured there is 32 px or more.

## Checked and fine
- **Self-test:** 223 exercises, 244 lessons, 27,941 builds, 1,603,446 notes, `problems: 0`.
  - `theory.js`, `fretboard.js`, `builder.js`, the curriculum, course data and views are unchanged since round 13.
- **Metronome (fake clock, exact to 1e-9 s):**
  - 30, 90, 120 and 260 BPM × 1–4 clicks per beat;
  - accent on beat 1 for 1–12 beats; accent off;
  - click off (lights only, no clicks);
  - muted bars (2+1, 1+1, 3+2, 8+8, 1+8): every silent bar right, no click in a muted bar;
  - speed up (+4/4, +2/1, +10/2, +1/16): the tempo per bar, each beat 60/bpm of its bar, the 260 cap, and a new tempo restarting the climb.
- **Real run:** 12 clicks 0.6667 s apart at 90 BPM, all scheduled 80 ms ahead.
- **Drums:** every style hits exactly its pattern for 4 bars, with the right velocity layer: rock 52, pop 84, funk 100, disco 56, shuffle 48, swing 52, bossa 116, reggae 40, 12/8 64, 5/4 56, 7/8 44 hits.
  - Every track is whole bars.
  - The kit decodes: 72 Opus files, 22 pieces, about 4 s locally.
- **Levels:**
  - at 100 % drums alone the limiter output peaks at 0.54–0.91, essentially never in the soft clip's knee (bossa 0.003 % of samples);
  - at 80 % drums with the 60 % metronome, peaks are 0.69–0.91.
  - Only the metronome at its own maximum (1.5) reaches 1.35 at the clip (accent 0.9 × 1.5). That is not new.
- **Drum loading:**
  - offline on first use: toast, drums back Off, stored Off;
  - a retry works;
  - the cache is used on the next load.
- **Practice room behaviour:**
  - Space on a focused Start button toggles once;
  - Start/Stop/leave races: in the 600 fuzzer steps, never two Rooms playing, never a Room playing off the screen;
  - after a real-click Start and a real-click leave, nothing is scheduled on Home;
  - the engine's options always matched the stored ones;
  - the practice log credited 26.5 s for 25.9 s of play (seed 1402) and 36.7 s for 36.8 s (seed 1405).
- **Practice log:**
  - a run across midnight splits correctly (585 + 315 s for 23:50 → 00:05, within one 15 s tick);
  - 45 untouched minutes log 1,200 s;
  - corrupt values (`{bad`, arrays, null, strings, numbers, 1e12, Infinity, bad dates) are ignored or capped at 86,400 s;
  - the strip starts at the first logged day (31 days for a log 30 days back), stays between 14 and 90 days, and opens scrolled to today;
  - 7-day total and bar heights are right.
- **Backup:**
  - round trip;
  - rejected: empty, whitespace, non-JSON, arrays, null, a foreign app, missing or array `data`, only foreign keys, non-string values, 100-character keys;
  - a UTF-8 BOM and UTF-16 files load (`File.text()`);
  - a forced `QuotaExceededError` restores the device's own records exactly;
  - a restore through the real file input replaces every `bassclass.*` key, keeps other keys and reloads;
  - nothing on Home or Library writes in the 700 ms before the reload;
  - the download is named `BassClass-backup-2026-10-23.json`.
- **Rail and redirects:**
  - `#/path` → Library Topics and `#/explorer` → Practice leave no Back trap (Back from them goes to Settings);
  - Back from a topic page returns to Topics;
  - `#/m/nope` → Library; `#/library?v=zzz` keeps the stored view;
  - the Levels/Topics choice is stored.
- **Bubbles (`showBubble`/`bubbleOnTap`):** never two open, never outside the window, listeners removed (accounted over all runs).
- **Memory:**
  - 120 open/close cycles of Practice ↔ Home/Library/Settings with a bubble open: heap 13.4–13.7 MB, nodes stable, no listener left;
  - 2.5 min of funk 16ths at 200 BPM: heap 13.5–14.2 MB, nodes constant;
  - monkey heaps stayed flat.
- **Android (code review):**
  - `OnBackInvokedCallback` on API 33+ with `enableOnBackInvokedCallback="true"`, `onBackPressed` kept for 12 and older;
  - the resizability opt-out sits on the activity, where Android 16 accepts it (it goes away with API 37);
  - INTERNET permission;
  - `ignoreAssetsPattern` takes the drums out (APK sizes);
  - the file chooser cancels a pending callback before a new one.
- **Regression:**
  - Player timing (count-in 4 beats, 0 ms error, empty queue after Stop) for `sc-one-octave`, `tech-alt-pluck` and `lk-ii-v-i`;
  - samples: 84 decode, regular ones within ±3.6 cents;
  - yin: 94 of 96 synthetic tones within ±2 cents, the 2 others 2.3 and 2.6 cents in the noise cases, same as round 13.
- **Harness artefacts, not bugs:**
  - one aborted run showed a Room ticking on other screens. It had been started before my timer shim replaced `clearInterval`, most likely by a click from outside my session in the fronted tab, so the shim could not clear its native interval. A clean real-click repro shows nothing.
  - the "1–3 clicks after leaving an exercise" notes are the Player's last 120 ms lookahead, scheduled between the hash change and `route()`.
