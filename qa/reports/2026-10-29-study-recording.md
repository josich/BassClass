# Study: can BassClass record the player and judge the take? (2026-10-29)

A feasibility study, not a change to the app. Tested against `f1aaa10`. The prototype is `qa/tools/recstudy.js`, and
every number in this report comes from it. The approach is classic signal processing on the phone: no machine-learned
models, no server.

---

## Verdict

**Yes, for single-note lines, with conditions. No for chords, tone and technique.**

| What | Verdict | Accuracy measured (simulation, best case) | Conditions |
|---|---|---|---|
| Record and listen back | **Feasible now** | n/a | Any phone with a microphone. Not judged, so no conditions. |
| Timing (each note against the grid) | **Feasible** | Analyser error SD 4–6 ms, 95% within 10–16 ms. The player's own deviations are recovered to within about ±5 ms. | Wired headphones, or the speaker with a click built for recording (not today's click). Backing off. One calibration per phone and output. **Not over Bluetooth.** |
| Right note / wrong note | **Feasible** | Every semitone mistake found with headphones (5 of 6 with the pad on the speaker); right notes called wrong: 0–1 in 45. "Could not hear" on 0–8% of notes. | The app compares each note with the written one. Pitch class only: the octave is not judged. |
| Missed and extra notes | **Feasible** | All found. 0–1 false alarms per 45 notes with headphones. | Same as timing. |
| Ringing strings (muting) | **A hint only** | Clear in simulation: −2 to −6 dB when a string rang, −28 dB or less when stopped. | Headphones only (the pad's bleed makes the check useless). Real basses resonate in ways the simulation lacks. |
| Ghost notes | **Partly** | 2 in 3 ghosts found as onsets. A ghost that sounds a pitch is caught every time. | Headphones. |
| Evenness (dynamics) | **Weak** | Without automatic gain control (AGC), a true 5.2 dB gap between fingers reads as 3.9 dB. With AGC, a 2.2 dB gap reads as 4.5 dB. | Only if real phones show no AGC. Relative, within one take. |
| Hammer-ons, pull-offs | **Partly** | 24/24 found in simulation (the pitch change makes the onset). | The simulation is crude here. Slides, bends and vibrato: no. |
| Low B, unplugged bass | **Weaker** | Pitch is fine with the informed check (48/48). Onsets in the low register spread to SD 16 ms, p95 61 ms. | An amp or headphones help. Unplugged on the speaker is the worst case. |
| Double stops, chords, harmonics, slap articulation, tone, fingering, posture | **No** | Not measured. | Out of scope for classic DSP on a phone mic: polyphony and technique are beyond it. |

**The three findings that shape everything:**

1. **The app's own sound is the main enemy, not the bass.**
   - On the phone's speaker the click reaches the mic 10–30 dB louder than the bass.
   - Today's click (900–1760 Hz sines with a 1 ms edge) pulls every onset towards the beat. It biases timing by −15 ms and doubles the spread. Notches do not fix it.
   - Subtracting the click works only if every click is identical: a 1 dB / 20 µs wobble ruins it.
   - A different click used only while recording solves it in simulation, even at +30 dB with AGC: a 4.5–5.3 kHz tick with a 4 ms soft edge, above the band the analyser reads.
   - The Backing's pad on the speaker breaks the analysis (onsets p95 63 ms, only 21/45 pitches heard). Notching its known partials helps but does not cure it.
   - So: **judged takes are click-only on the speaker, or anything with headphones.**
2. **Latency is solvable on the speaker and on wired headphones. Bluetooth is not.**
   - Capture inside the same AudioContext that plays the click, so both share one clock and the offset is one constant.
   - The count-in's clicks heard on the speaker measure that constant, to the sample in simulation.
   - Bluetooth adds 100–300 ms, which is unknown and varies. Refuse timing over Bluetooth; recording is still fine.
3. **This simulation is the best case.**
   - It uses the app's own samples: one bass, one recorded attack per note, idealised speaker and mic models.
   - Real plucks, rooms and phones will be worse.
   - Before any judging ships, a small corpus of real takes is needed, recorded on 4–6 phones with a DI recording at the same time as the truth.

---

## 1. Recording

**What the WebView offers.** The app is Chromium's Android WebView: minSdk 24, kept up to date through Play.
- The tuner already opens the microphone: `A.openMic()` calls `getUserMedia` with echo cancellation, noise suppression and AGC off.
- `MainActivity.kt` grants `RESOURCE_AUDIO_CAPTURE` to the app's own origin only, after Android's RECORD_AUDIO prompt.
- Nothing new is needed in the wrapper.
- In this Chromium (152), `AudioWorklet` and `MediaRecorder` (`audio/webm;codecs=opus`, `audio/mp4`) are present, and so are `AudioEncoder` (WebCodecs) and `AudioContext.getOutputTimestamp`. The supported constraints include `latency` and `voiceIsolation`. Check all of these on the oldest WebView seen on test phones.

**Two ways to capture. Use the first for analysis.**

| | AudioWorklet in the app's AudioContext | MediaRecorder |
|---|---|---|
| What you get | Raw PCM, 128 frames per render quantum, stamped on the **same clock** that schedules the click and the notes | A compressed file (Opus in WebM, or MP4) |
| Alignment | The offset to the score is one constant (the round trip) | Its start is not tied to the AudioContext clock: tens of ms of unknown offset |
| Use | Analysis, and aligned playback over the click | Keeping a take small for listening later |

- Route the mic into the worklet with `ctx.createMediaStreamSource(stream)`, as the tuner does, then into an `AudioWorkletNode`. The worklet copies frames into a ring buffer and posts a transferable `Float32Array` about every 100 ms. Posting 128-frame chunks (375 messages a second) would load the main thread for nothing.
- Add `voiceIsolation: false` to the constraints. Chromium now lists it, and voice isolation would eat a bass.

**Format and memory.**

| Form | Rate | 30-second take |
|---|---|---|
| Float32 PCM, 48 kHz mono (while recording) | 192 KB/s | 5.8 MB |
| Int16 PCM, 48 kHz mono (kept for playback) | 96 KB/s | 2.9 MB |
| PCM decimated to 12 kHz (analysis) | 48 KB/s (Float32) | 1.4 MB |
| Opus, 64 kbit/s | 8 KB/s | 240 KB |

- Cap a take at 60 seconds or 8 loops. Memory is no issue on any phone that runs the app.

**Keeping takes only on the phone.**
- **In memory** (simplest, most private): the last 3 takes of the open exercise, gone when the player leaves it.
- **Stored** (for "first take against latest take" per lesson, as the students' review asked): IndexedDB holding Opus blobs.
  - It lives under `app_webview/Default/IndexedDB/`.
  - `backup_rules.xml` and `data_extraction_rules.xml` exclude only the Service Worker and GPU caches today. **IndexedDB would go into Android's own backup to the player's Google account.** Exclude that folder (or the takes' database) in both files.
  - The BassClass backup file reads only `bassclass.*` localStorage keys, so it leaves takes out by itself. Say so in the backup's ⓘ.
- **Export** (a take sent to a teacher, as the teachers' review asked) through the existing `BassClassNative.saveFile` / share route: a separate decision (privacy, section 7).
- Stop the take when the page is hidden (`visibilitychange`). Android has not given the microphone to background apps since Android 9, so the take would only record silence anyway.

---

## 2. Alignment

**What the offset is made of.**
- Output: the scheduler's time → the app's own delays → Chromium's output buffer → the device.
  - The app's own delays: `ALIGN` click 18 ms, plus one compressor's 6 ms look-ahead. Everything leaves at about +24 ms.
  - Chromium's output buffer is `baseLatency`, about 10 ms; this desktop reads 0.01 s.
  - The device's share is `outputLatency`, 0 on this desktop, and wider on phones.
- Input: the mic → the device → Chromium's input FIFO → the worklet. No web API reports this part reliably.
- On Android through a browser engine, the round trip commonly lands between a few tens and a couple of hundred ms. It differs by phone, by Android version and by output, so it must be **measured, not assumed**.

**Why one constant is enough.** The player plays to what they hear.
- A note played exactly with a click that sounds at real time *T* reaches the mic at *T*.
- That is exactly when the click's own bleed reaches the mic.
- So the click's round trip is exactly the offset the player's notes need. The app's `ALIGN` delays are inside it, as long as the calibration click and the take's click take **the same path** through the graph. A click that bypassed the last limiter would move by 6 ms.

**Calibration, by output.**

| Output | How | Measured |
|---|---|---|
| Phone speaker | The count-in's clicks in every take (the player waits for them), cross-correlated with the click's waveform. A separate 8-click check with the phone on a table works too. | Exact to the sample at 83, 151 and 236 ms round trip, amp and unplugged (simulation). Real phones: test the repeatability. |
| Wired headphones | No bleed to measure. Measure the speaker once, then add the difference of `outputLatency` between the routes. Or trust that a wired jack on the same codec matches the speaker within a few ms. **Must be checked per test phone.** | Not measurable in simulation |
| USB audio | As wired, but its own clock: drift of about 50 ppm is 3 ms a minute, negligible for 60-second takes | Not measured |
| Bluetooth | 100–300 ms, varying by codec and device; `outputLatency` may or may not include it. **Do not judge timing.** The app already knows the route (`audioRoute()`, the A2DP/BLE device types in `MainActivity.kt`). | n/a |

- **Tap calibration is a poor substitute.** The player plucks a muted string with 8 clicks. People playing to a metronome sit early by 10–40 ms on average ("negative mean asynchrony" in the sensorimotor-synchronization literature), so this method takes the player's own habit into the offset.
- **Absolute and relative timing.**
  - Report the mean offset ("12 ms behind the click") only when the route is calibrated.
  - Spread, rushing and dragging per bar, and single late notes need no calibration. Always show those.
- **Glitches.** If the WebView misses an audio deadline, Chromium's input FIFO can drop or repeat a block and the offset jumps mid-take. On the speaker the clicks reveal it (re-estimate per bar). With headphones the take can only be marked "uncertain" when the worklet sees a gap. Test this on a slow phone.

---

## 3. Hearing the bass apart from the app

**How loud is what, at the phone's mic** (estimates; measure on real phones):
- The phone's speaker is centimetres from its own mic: the click and the backing are very loud there.
- A bass amp at practice level, a metre away, sounds roughly as loud as the click.
- An unplugged solid body sounds 20–30 dB under the click.

The simulation therefore puts the click at +10 to +30 dB over the bass notes' peaks.

**Echo cancellation off is right.**
- Chromium's echo canceller cancels only audio received from a WebRTC peer, not the page's own Web Audio (a known WebRTC issue, on desktop and Android). Turning it on would not remove the click.
- Android's voice-communication processing would bring in noise suppression and AGC, and could switch the phone to its call audio mode.
- Noise suppression treats a sustained bass note as noise. Off is right.
- The tuner's choice (all three off) is also right for recording.
- The app must deal with its own bleed itself.

**What the prototype measured** (analyser error in ms against the true pluck: median / SD / p95; 3 takes × 15 notes, C major in 8ths at 100 BPM, player perfectly in time):

| Setup | Median | SD | p95 | Notes |
|---|---|---|---|---|
| USB interface, no bleed | +3.3 | 5.2 | 16.2 | |
| Amp, headphones | +3.2 | 5.2 | 15.3 | |
| Amp, headphones, AGC | +3.3 | 5.0 | 14.1 | AGC does not hurt onsets |
| Unplugged, headphones | +4.2 | 4.5 | 12.5 | |
| Amp, **today's click** +10 dB on the speaker, not removed | −16.2 | 9.4 | 21.9 | 18 of 45 notes wrongly called missed |
| Same, click frequencies notched | −15.1 | 10.4 | 22.5 | Every note pulled towards the click |
| Same, click subtracted (every click identical) | +4.2 | 5.1 | 16.3 | Ideal case only |
| Same, subtracted, each click wobbling 1 dB / 20 µs | −10.2 | 9.1 | 17.6 | Real speakers, AGC and a moving player do more |
| Amp, **recording click** +20 dB (3 dB / 0.1 ms wobble) | +1.8 | 5.1 | 13.8 | The click is invisible to the analyser |
| Unplugged, recording click +30 dB, AGC | +4.0 | 4.1 | 10.9 | |
| Amp, recording click, **pad 0 dB**, not handled | +6.4 | 23.7 | 62.9 | Pitch heard on 21/45 notes |
| Same, pad notched (its notes are known) + steady-sound flux | +7.8 | 6.6 | 19.2 | Pitch 45/45; the ringing check becomes useless |
| Same, pad +6 dB, handled | +8.4 | 10.2 | 30.0 | |
| Unplugged, recording click +20, pad +10 dB, handled | +10.2 | 12.3 | 34.3 | 12 octave errors |

**Recommendations:**
- **A judged take has its own sound set.**
  - The app's bass is off: on the speaker it is a second bassist.
  - Backing, drone and drums are off on the speaker. Drums are worse than the pad: a kick sits in the bass's own band.
  - The click is the recording click.
  - With wired headphones, anything may play.
  - Say it on the Record sheet: "🎧 Headphones: everything plays. Speaker: click only."
- **The recording click needs the owner's ear.** It is higher and softer-edged than today's: more a shaker or a woodblock than a beep.
  - It must stay audible over an amp. A phone speaker plays 4–5 kHz well.
  - It must keep the accents: two pitches, as in the prototype, 4.5 and 5.3 kHz.
- **AGC.** It barely moves onsets or pitch, but it corrupts levels (evenness, section 4). Measure whether real phones apply it despite `autoGainControl: false`.
- **The high-pass.** Phones often cut below about 100 Hz, so the low B (31 Hz) and E (41 Hz) fundamentals all but vanish.
  - Pitch still works from the harmonics: the tuner already hears a low B, and Android's CDD asks the voice-recognition input to be flat (±3 dB) only from 100 Hz to 4 kHz.
  - Low-register onsets get softer, which is where the unplugged low-B line lost accuracy.
- **Clipping.** An amp close to the phone can clip the input. Detect samples at full scale and say "Too loud: move the phone away from the amp".

---

## 4. Judging, measure by measure

### Timing (note onsets against the grid)
- **Method that worked best.**
  - Downsample 48 kHz → 12 kHz.
  - Log-magnitude spectral flux over 40–2500 Hz: 512-point frames (43 ms), a 2 ms hop, and a ±1-bin maximum filter on the previous frame ("SuperFlux"-style).
  - Peak-pick with a local mean threshold, then interpolate the peak between frames.
  - A noise gate learnt from the count-in (onsets must be 12 dB over the room's noise).
- **Alternatives tried and dropped.**
  - The steepest rise of the log energy: SD 7–15 ms against 5–6.
  - The same above 300 Hz: SD 9–16.
  - 256-point frames: an outlier of −45 ms on low notes.
  - Restricting the flux to 40–800 Hz to dodge the click: SD 9–16.
- **Bias by register** (12 takes of 4 exercises, amp, headphones; median / SD in ms):

| Register | Median | SD |
|---|---|---|
| The first note, from silence | −11.9 | 0.3 |
| A1–D♯2 | +6.6 | 1.4 |
| E2–G♯2 | +5.3 | 2.7 |
| A2–D♯3 | −0.7 | 2.5 |
| E3 and up | −8.1 | 2.1 |

  - The spread inside a register is 1.4–2.7 ms; most of the overall 5 ms is a pitch-dependent bias of about 15 ms from the low to the high register.
  - A bias table by pitch, fitted on real recordings, would bring the overall SD to about 3 ms.
  - Without it, a scale would look as if it "rushes going up". **Fit the table on real takes, not on the samples.**
- **The player's timing, recovered.**
  - The test player: an SD of 15 ms, bar 2 rushed by 30 ms, one note 50 ms late; amp, recording click +10 dB; 3 takes.
  - Each note's measured deviation was off by SD 4.8–5.0 ms, bias +3 ms.
  - The rushed bar's mean: true −22, −18, −24 ms; measured −18, −15, −22 ms.
  - The late note: true +54 ms, measured +50 ms.
- **What that means for the player.**
  - Listeners start to notice asynchronies of roughly 10–20 ms, and steady players keep their notes within roughly 10–20 ms of the beat (the sensorimotor-synchronization literature).
  - So the app can honestly say "late by 30 ms", "bar 3 rushed", "spread ±18 ms". It cannot honestly say "late by 6 ms".
  - Show bands, not milliseconds per note: within ±15 ms, slightly early or late (15–35), early or late (over 35).
- **Speed.** 16ths at 120 and at 140 BPM (C2 and up) gave the same accuracy (SD 6.3, p95 19), every pitch judged.
  - Notes closer than about 45 ms (the peak picker's gap) would merge: 32nds at 160.
  - The lowest notes (B0–E1) need about 70 ms of sustain for the pitch check, so fast 16ths on the B and E strings will show more "?". Higher notes need less.

### Pitch of each note
- **Method.**
  - Run the tuner's own `yin()` (`web/js/pitch.js`) on each note's sustained part: from 35 ms after the onset to the next onset, at most 260 ms, on the tuner's 1.1 kHz-low-passed signal.
  - Then an **informed check**: yin's normalised difference at the written note's period (±50 cents). Below 0.3, the written note is there.
  - A semitone mistake is called only when yin hears another pitch class **and** the written note's harmonics are weaker than a neighbour's (Goertzel, harmonics 1–6).
- **Results** (faults: 2 wrong notes, 1 missed, 1 extra, 2 ringing; player SD 8 ms):

| Test | Right notes heard as right | Wrong notes found | Right notes called wrong |
|---|---|---|---|
| Amp, headphones | 35/36 (1 "no pitch") | 6/6 | 0 |
| Unplugged, headphones | 33/36 (3 "no pitch") | 6/6 | 0 |
| Amp, recording click, pad 0 dB handled | 35/36 | 5/6 | 0 |
| Unplugged, recording click, pad +10 dB handled | 32/34 | 5/6 | 0 (8 octave errors) |
| 16ths at 120 and 140 BPM, amp | 42/42 each | 3/3 each | 0 (1 in an earlier run at 140) |
| Two octaves, amp | 81/81 | 6/6 | 0 |
| Low-B line (5-string, B0–B1), amp | 48/48 | 3/3 | 0 |
| Low-B line, unplugged | 48/48 (blind yin alone: 34/46) | 3/3 | 0 |

- **The low register needs the informed check.** Blind yin heard B0 on 7/12 notes with an amp and 3/12 unplugged, and D1 on 7/9 and 4/9. From E1 up it heard 100%.
- **Octaves.** Judge the pitch class, not the octave.
  - Octave errors appear with the pad's bleed and the unplugged bass's missing fundamental.
  - On bass, a note in the wrong octave is usually a fingering choice, not a wrong note.
- **Tuning.** Use the player's A4 setting. Estimate the take's overall tuning offset (the median cents of the notes heard right) before judging, so a bass 30 cents flat does not turn into wrong notes.

### Missed and extra notes
- **Method.** A monotonic alignment of the onsets to the written notes (dynamic programming, as in score following).
  - A match costs (Δt / tolerance)², plus 0.6 if the onset's own pitch is another pitch class, or 0.3 if it has none.
  - The tolerance is 45% of the gap to the nearest note, between 40 and 110 ms.
  - A missed note costs 1. Skipping an onset costs 0.35, or 0.75 if it has a clear pitch.
  - Weighing pitch was the key fix: the low-B line unplugged went from SD 29.9 / p95 93 ms to SD 10.1 / p95 11 ms.
- **Extra notes.** A leftover onset counts as an extra note only if it is about as strong as the notes, has a clear pitch, and that pitch is not the note already sounding (a low string's sustain swells and makes onsets of its own).
- **Results:**

| Setup (3 takes, 45 notes) | Missed found | Extra found | False alarms in the 45 notes |
|---|---|---|---|
| Amp, headphones | 3/3 | 3/3 | 0 |
| Unplugged, headphones | 3/3 | 3/3 | 1 |
| Pad on the speaker, handled | 3/3 | 3/3 | 4 (amp) to 10 (unplugged) |

### Ringing strings (muting)
- **Method.** 80–300 ms into each note, Goertzel at the previous note's harmonics (only those well clear of the new note's), against that note's own level.
  - Skipped when the previous note was not heard as written.
- **Results.** With headphones a ringing string read −2 to −6 dB, a stopped one −28 dB or less. That is a clean gap in simulation.
- **With the pad on the speaker, damped notes read up to +0.6 dB.** The pad's partials sit on the bass's harmonics, so the check is useless there.
- **Real life.**
  - Sympathetic strings, an open string set off by a neighbour, and the amp's cabinet all add energy at old pitches.
  - Offer it as a hint ("the open A may be ringing in bar 3"), headphones only, never as a fail.
  - Its best use is the muting drill (#202), which the app already tells to "record yourself".

### Evenness, ghost notes, legato, slap, harmonics, double stops
- **Evenness** (8 notes on the open E, i–m, one finger 3 dB weaker, ±1 dB random):

| | True difference | Measured |
|---|---|---|
| No AGC, uneven fingers | 5.2 dB | 3.9 dB |
| No AGC, even fingers | 2.2 dB | 1.5 dB |
| AGC, uneven fingers | 5.2 dB | 7.0 dB |
| AGC, even fingers | 2.2 dB | 4.5 dB |

  - With AGC the measured note-to-note spread doubled (SD 4.8 against 2.9 true).
  - Only on one string, only relative, and only once AGC is known to be off on that phone.
  - Different notes differ in loudness by nature (the bass's dead spots, the register), so compare like with like.
- **Ghost notes.**
  - Real dead notes were found as onsets 16/24 times, 9.9 dB under the notes, with no pitch at all (yin clarity 0 against 0.996).
  - Ghosts that sounded a pitch (a common fault) were found 24/24 and heard with a pitch every time. "Your ghost notes sound a pitch" is a fair check; "every ghost was played" is not.
- **Hammer-ons and pull-offs.**
  - Rendered without a pluck (the sample entered 60 ms in), all 24 were found from the pitch change: −3.7 ± 4.9 ms.
  - A real hammer-on is similar, but slides, bends and vibrato are not: they need a pitch tracker, frame by frame. Leave them out.
- **Slap.**
  - Thumb and pop attacks are the easiest onsets there are, so timing and pitch work.
  - Telling a thumb from a pop is technique: out of scope.
- **Harmonics.** Nearly pure tones: pitch is easy (they ring an octave or more up, so judge the pitch class). The onsets are soft. Plausible, not measured.
- **Double stops and chords.** At most an informed "were both written pitches there?" with the same period check. Two bass notes share many harmonics (a 5th or an octave above all the more), so expect false passes. Out of scope for a first version.

---

## 5. The prototype

**`qa/tools/recstudy.js`** (classic script; serve `qa/tools` on :8882 and load it from the qa tab, as round 21's tools do).

**How each take is made:**
- **The score.** Any app exercise, built by the app's own builders and laid out by the app's own `Player._layout()` (starts, `beatsOf`, fills), with one count-in bar and its clicks. Or a written line: the low-B riff.
- **The performance.** Each note at its time plus known errors: Gaussian timing spread, a rushed bar, a late note, wrong notes (±1–2 semitones), a missed note, an extra note, a string left ringing, pitched ghosts, legato notes without a pluck, a weaker finger.
- **The rendering.**
  - The app's own bass samples (`web/audio/bass/`, decoded at 48 kHz), with `playNote`'s envelope, tone filter and velocity curve.
  - The app's click (`click()`: sine, 1 ms attack, 90 ms tail), or the candidate recording click.
  - The Backing's pad (sawtooth −6 ¢ + triangle +5 ¢, the 1.5 kHz low-pass).
  - All through an `OfflineAudioContext`.
- **The microphone model.**
  - *line* (USB interface).
  - *amp*: high-passes at 70 and 40 Hz, a 0.35 s room.
  - *unplugged*: a 4th-order high-pass at 180 Hz, +6 dB at 1.6 kHz, quiet against the room's noise (−40 dB).
  - The phone speaker for the bleed: high-passed at 420 Hz, mildly distorted, in its own room.
  - Plus pink noise, an optional AGC (5 ms attack, 0.8 s release) and the round trip.
- **The analyser.** As in section 4. Variants are switchable (`__rs.refine`, `band`, `frame`, `pitchCost`, `bg`) to compare methods.
- **Methods it follows** (all classic, published):
  - onset detection: the onset-detection tutorial of Bello et al. (2005) and the maximum-filter flux of Böck and Widmer (2013, "SuperFlux");
  - pitch: YIN (de Cheveigné and Kawahara, 2002), the tuner's own;
  - alignment: score following by dynamic programming, as in dynamic time warping (Müller, *Fundamentals of Music Processing*);
  - single frequencies: the Goertzel algorithm.

**Speed.**
- 150–180 ms to analyse a 9-second take, 300–340 ms for 15 seconds, in desktop Chrome: about 2% of real time, unoptimised JavaScript.
- A mid-range phone is perhaps 5–10 times slower: 3–6 seconds after a 30-second take, or nothing noticeable if the onset function runs during the take.

**What the simulation cannot tell** (why real takes are needed before judging ships):
- **The attack.** Every note of a pitch has the same recorded attack. Real plucks vary in finger, place, force and the noise of the string against the frets.
- **The bass and the room.** No sympathetic strings, fret buzz, dead spots or cabinet resonance. The speaker and mic models are simple filters; real phones add AGC, limiters, noise suppression they cannot turn off, and wind noise from the player's breath.
- **The bleed.** It is perfectly repeatable in the simulation. That is why subtraction looked perfect until a wobble was added.

**Build a real test corpus.**
- The owner plays exercises into the phone while a USB interface records the bass's DI on a computer at the same time.
- Line the two up with a clap.
- The DI's onsets and pitches, which are trivial to detect, are the truth.
- About 10 takes per condition: amp or unplugged, speaker or headphones, 3 or 4 phones.

---

## 6. What the player sees

**Before the take.**
- A Record sheet: Loops (1–8), Output ("🎧 everything plays" / "📱 click only"), and a level meter with "Pluck your open E". This reuses the tuner's path and catches a covered mic or a silent input.
- The landscape grip can cover the bottom mic: say where the mic is.
- If the output is Bluetooth: "Bluetooth adds a delay the app cannot measure: your take is recorded, timing is not judged".

**During the take.**
- The count-in always plays, because it gives the noise floor and, on the speaker, the calibration.
- A red dot, and the take stops on its own after N loops.

**After the take.**
- **Listen back:** the take alone, over the click, or beside the app's line (A/B); scrub by tapping the tab strip. This alone is phase 1, and it is useful with no judging at all.
- **A timing strip** under the tab strip: one dot per note, left of its line when early and right when late, in three bands (in time ±15 ms / slightly / clearly). Below it, one line per take: "On average 12 ms behind the click · spread ±9 ms · bar 3 rushed".
- **Notes on the tab:**
  - a note heard as another pitch is marked with the pitch heard ("heard F♯");
  - a missed note is drawn hollow;
  - an extra note is a small mark between notes;
  - "?" where the app could not hear.
- **Honesty.** A confidence line per take:
  - "Heard clearly";
  - "Heard partly: 4 notes unclear";
  - "Could not hear clearly: too quiet / too much backing / Bluetooth".
  
  Never a judgement on a note the app did not hear well.
- **No single score at first.** A percentage invites the player to argue with the machine; numbers and marks they can check by listening invite them to listen.

**How it fits ✓ Clean** (the player's own tick, QA round 8):
- The analysis is evidence beside the tick, not a replacement.
- After a judged take: "The app heard 31/32 notes as written · timing ±11 ms · tick ✓ Clean if it felt clean."
- Mastery and step passes keep their rules (`mastery.js`, `course/progress.js`).
- A later, optional "strict mode" could require a judged take for stage tests. That is an owner's decision; until real-phone accuracy is known, no.

**Out of scope:**
- tone and sound quality;
- which finger plucked (and so i–m alternation);
- rest strokes, muting technique and posture;
- chords and double stops;
- slides, bends and vibrato;
- telling a slap thumb from a pop;
- absolute loudness;
- judging the Practice room (it has no written notes, so listen back only);
- any ranking or comparison with other players;
- anything in the cloud.

---

## 7. Privacy and Google Play

- **The privacy policy** (`web/js/legal.js`) says today: "The microphone is used only by the tuner… never recorded, stored or sent." It must change. Proposed text:
  > **The microphone** is used by the tuner, and to record your playing when you press ● Record, only while that screen is open. The tuner analyses the sound on the phone and never records it. A recording is analysed on the phone, stays in the app, is never sent anywhere, and is not part of BassClass backups or Android's backup. It is deleted when you delete it, when you leave the exercise *(or: when it is no longer among your last takes)*, or when you uninstall the app.

  Then bump `UPDATED`, make the public page again (`web/js/dev/legal.html`), and copy it.
- **The Data safety form.** Google Play does not count data that is processed only on the device and never sent off it as "collected", so it needs no new entry while takes never leave the phone. The Android app has no INTERNET permission, so it could not send them anyway.
  - **If takes can be exported or shared later:** Play counts transfers to another app on the device as "sharing", except a transfer the user starts and expects (sharing through the share sheet, say).
  - That exemption probably applies to a "Send to my teacher" button, but it is the owner's call. Write it in the policy either way.
- **Permissions.**
  - RECORD_AUDIO and MODIFY_AUDIO_SETTINGS are already declared and asked at first use.
  - Under today's Play policies, recording needs no declaration form (those are for SMS, call log, all-files access, background location and the like).
  - No foreground service: record only while the screen is open.
  - Android 12+ shows its microphone dot while the mic is open. Open it for the take only, never in advance.
- **Android's backup.** Exclude the takes' storage (section 1), or the policy line above is false.
- **Families.**
  - The app is for 13 and over today.
  - If it ever targets children, a take may hold a child's voice.
  - Keeping takes on the phone and never transmitting them keeps them outside "collection". Any export or upload would then need a parental-consent review (COPPA, GDPR for children) before it ships.
  - The default "takes are deleted when you leave" is the safe one there.
- **The store listing.** LAUNCH-TODO already says listening is "never promised in the listing". If timing ships, describe what it does ("hear your take; see your timing against the click"), not "the app listens and corrects you".

---

## 8. Performance, battery and phones

- **CPU.**
  - Analysis takes about 2% of real time on a desktop, perhaps 10–20% on a mid-range phone: a few seconds after a take.
  - Run it in a Worker so the screen stays smooth, or compute the onset function in the AudioWorklet during the take (about 500 FFTs of 512 points a second: light).
  - The tuner's yin runs per note, not per frame, so it costs little.
- **Battery.** Recording costs little more than the audio output the exercise already runs. A minute of capture plus seconds of analysis is negligible next to the screen. Nothing runs between takes.
- **Memory.** Under 10 MB for a 60-second take while analysing.
- **What differs between phones**, and the test for each:

| Phone property | Test |
|---|---|
| Mic quality and high-pass (often 80–150 Hz) | Record the open B/E/A at a known level: how much fundamental is left? |
| AGC that `autoGainControl: false` does not stop (vendor effects; which Android input preset Chromium picks is not documented) | Play a click train in 6 dB steps from another device: are the steps 6 dB in the recording? |
| Noise suppression that eats sustain | A held note: does it fade faster than on a DI? |
| Which mic Chromium uses (bottom, top, a camera's) | The landscape grip and the phone stand may cover it |
| The speaker sitting next to the mic | Bleed level in dB at full click volume |
| Playback volume dropping or going mono when the mic opens (call audio mode) | Must not happen with processing off. Check with the click playing while the tuner is open. |
| Input clipping near an amp | Record a hard pluck 30 cm from a loud amp |
| Round-trip stability | 10 loopback calibrations: after a restart, after headphones in and out, after a long session |
| Timer and audio glitches on slow phones | A 60-second take with the Performance overlay on |

- **A native capture fallback, only if the tests demand it.**
  - Kotlin's `AudioRecord` through the bridge, with no native code (CI rejects native code). It can pick `UNPROCESSED`: no AGC, no high-pass, no echo cancellation, ±10 dB from 100 Hz to 7 kHz, where the phone offers it. Otherwise `VOICE_RECOGNITION`: ±3 dB from 100 Hz to 4 kHz.
  - The cost: PCM through the bridge, and a clock that is not the AudioContext's, so loopback calibration becomes mandatory.
  - Start with `getUserMedia`. Keep this as plan B.

---

## Phased plan

| Phase | What | Size | Main risks | Must be tested on real phones |
|---|---|---|---|---|
| **1. Record and listen back** | ● Record in the exercise (and the room, listen only): count-in, N loops, AudioWorklet capture, stop on leaving. Playback alone, over the click, A/B with the app's line (aligned by the count-in on the speaker, or by a one-off loopback calibration). Last 3 takes in memory; optionally first and latest per lesson in IndexedDB, excluded from both backups. Privacy policy line. Headphones advised. | **M** (S without aligned playback and storage) | The phone going into call audio mode or lowering playback when the mic opens; the mic covered by the grip; storage reaching Android's backup by mistake | Playback volume with the mic open; the round trip and its repeatability per output; what the mic hears (high-pass, AGC); 4–6 phones from at least three makers, one low-end, one Android 8–10 |
| **2. Timing** | Recording click and the "speaker = click only" sound set; calibration per output (loopback, count-in); Bluetooth refused; onset detection, pitch-weighted alignment, bands; timing strip, bar trends, confidence. Then a bias table by pitch fitted on real takes. | **M–L** | Real plucks (soft fingers, the thumb, muted notes) less clean than samples; room echo; AGC; latency jumps; the register bias; whether the owner likes the recording click | The DI-plus-phone corpus: onset error per phone and setup. Ship only if p95 ≤ 20 ms and missed/extra false alarms ≤ 1 per 50 notes with headphones. |
| **3. Notes** | yin per note plus the informed check; wrong / missed / extra marks on the tab; tuning offset from the take; pitch class only; single-note exercises only (exercises with chords, double stops or harmonics are flagged "timing only") | **M** | The low B unplugged; pad bleed (headphones only, or backing off); fast 16ths (short windows); a detuned bass | Right notes called wrong: target 0 in 500 notes; low-B and drop-tuned basses |
| **4. Muting and more** | Ringing-string hints (headphones), "ghosts sound a pitch", hammer-on and pull-off timing, evenness only where AGC is proven off | **L** | False alarms from sympathetic strings and cabinets; AGC; players taking hints as verdicts | Muting drill takes judged by the owner's ear against the app's hints |

---

## Open questions for the owner

1. **Headphones or speaker.** Is "speaker = click only, with a different click" acceptable, or should judged takes simply require headphones (simpler and more accurate)?
2. **The recording click.** Willing to choose a second click sound by ear (high, soft-edged) used only while recording?
3. **Keeping takes.** In memory only (gone when leaving), or the first and latest take per lesson kept on the phone? Export to a teacher (`saveFile` / share), now or never?
4. **Pro or free.** The musician's review proposed recording as Pro. Listen-back free and judging Pro, all free, or all Pro?
5. **✓ Clean.** Confirm that the analysis only informs the tick and never ticks or blocks a step by itself, at least until real-phone accuracy is known.
6. **Bluetooth.** OK to record but not judge timing over Bluetooth?
7. **Phones and a DI.** Which phones can the owner test on, and is a USB interface available to record the DI for the test corpus?
8. **Scope.** Agree that chords, double stops, slides, tone and technique stay out, and that the Practice room records but never judges?
