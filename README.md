# BassClass: a visual bass trainer

A landscape app to learn bass from the first open string to mastery. Every exercise is shown **note by note on a fretboard**. Each marker appears as it plays, with the note name, degree or finger, and a dashed arc points to the next note. You hear a **recorded bass**, a metronome counts, and a scrolling tab strip below the neck shows what is coming. A **microphone tuner** is built in.

- **A guided course.** A teacher's path through the exercises: stages, units and short lessons. Each lesson has one key idea, a short explanation, a demo the app plays on the neck, practice steps with a starting and a goal tempo, and the common mistakes to avoid; songs in the style of famous tracks (Make Music) come after some unit checkpoints and in every stage test. A step passes when the app has recorded a full loop from the first note at the goal tempo (in the step's own notes per beat) and you tick ✓ Clean. Every unit ends with a checkpoint ("I can…"), every stage with a test. Nothing is locked: the course points at the next lesson. Completed lessons come back for review after 1, 3, 7, 21 and 60 days. "My level", a short survey on Home, marks what you already know: every line starts at "Not yet", you tap Yes for what you play ("All not yet" on a stage also answers the later stages). The course map opens at the next lesson and has a jump button per stage. Six stages take you from the first open string to mastery (Levels 1–6: 55 units, 183 lessons, six of them optional), and every exercise of the Library appears in at least one lesson.
- **223 exercise families** in 16 topics and 6 levels: fretboard & notes, **reading (bass clef)**, technique/rudiments, rhythm, intervals, **ear training**, scales, modes, triads, arpeggios & 7ths, chords & harmony, grooves, walking bass, **jazz licks**, slap and **Make Music**. See [docs/CATALOGUE.md](docs/CATALOGUE.md).
- **Sweeps and tapping.** Sweep picking across the strings (triads, 7th chords and a five-string shape, with a pick or with finger rakes) and two-hand tapping (tap–pull-off–hammer triplets, two-hand arpeggios, a tapped melody over a left-hand pedal), through progressions in any key.
- **Make Music.** 30 original bass lines in the style of famous songs, from "Seven Nation Army" to "Teen Town" and a complete bass solo in the spirit of "Anesthesia". Each takes its song's key, feel and technique (a stomping riff, disco octaves, a 7/4 riff, slap, double thumbing), at a practice tempo, but never its notes, in two to four parts with a "Whole tune" option.
- **Tab or staff.** The strip under the neck shows tab or standard notation on a bass-clef staff, engraved properly: written an octave above the sound, key and time signatures, dotted values, ties, rests, beams per beat, tuplets, accidentals held to the bar line and 8va above the ledger lines. The Reading exercises open on the staff, show no note names and hide each dot until it sounds.
- **Backing.** A soft pad under any exercise with chords or scales: a drone on the root, or the chords (the mode's triad, or the chord of the progression).
- **Ear training.** Chords and progressions play with their notes hidden; the answer and the shape appear afterwards.
- **Every exercise is generated, not hard-coded.** Any key, or all 12 keys in a row (cycle of 4ths/5ths/chromatic), plus inversions, scales, patterns, positions, zones and rhythms. That adds up to thousands of distinct drills.
- **Correct fingering.** A fingering engine models the hand position (one finger per fret, stretches, shifts along a string) and adapts to **4, 5 or 6-string** basses.
- **Correct spelling.** E.g. B♭ vs A♯, D♭maj7 vs C♯maj7. Degree colours: root, 3rd, 5th, 7th.
- **Real bass sound.** A finger-style 5-string bass recorded note by note (B0–E4, CC0 samples from Karoryfer). It has real ghost notes, velocity-dependent tone and natural string damping. A physical-model synth is the fallback. The output runs through a compressor and limiter, so the bass volume (shown as 0–100%) can drive it hard without distortion. Phone speakers cannot play a bass's low notes (they start around 500 Hz; the open E is 41 Hz), so on the phone's own speaker a "phone-speaker" profile cuts the inaudible lows and lifts the recording's own overtones (+15 dB around 850 Hz), which the ear uses to hear the low notes. The Android app switches it on and off automatically when headphones or a speaker are connected; a browser cannot see headphones, so there the natural sound always plays. There are no sound options to tune: only the bass and metronome volumes.
- **Tuner.** Chromatic or per-string, with a cents gauge, adjustable A4 and reference tones. It uses YIN pitch detection, which works down to a 5-string's low B.
- **Elegant fretboard.** Navy board, nickel round-wound strings drawn at real gauge ratios (.045–.130), and glossy colour-coded markers (root = square).
- **Built for practice.** Step-by-step mode (◀ ▶), loop, tempo 30–260 BPM, subdivision selector (whole notes to sextuplets; fixed where the rhythm is written in, as in licks and grooves), count-in, speed trainer (+4 BPM per loop), "Shape" and "Quiz" reveal modes, and mastered/best-BPM tracking.
- **A teacher's plan for every day.** Home holds My level, the course (one button: carry on), today's session and your favourites. The session is planned for your level like a teacher's assignment: two warm-ups (more on request), the reviews that are due, the next course steps and a focus topic that moves on every session (scales, chords, lines and grooves, ear and reading), 15 to 60 minutes. It stays the same until you mark it ✓ Practised; the next one builds on the last ones. Explanations sit behind ⓘ buttons, so the screens stay short on a phone.
- **Organised for daily use.** Star any exercise to pin it to your favourites on Home and drag the list into your own order. The Library shows every exercise, by level (each level folds) or by topic (one card per topic, its exercises from Level 1 to 6), with search. Five places on the rail: Home (learn), Library (look up), Practice (the metronome, drums and the neck), Tuner and Settings. Every exercise has a number, its place in the Library (1 = Alternate plucking, 2 = Chromatic 1-2-3-4…), so you can point someone to "exercise 42": type 42 in the search, or open `#/ex/42`. Numbers can move up when new exercises are added before them.
- **Practice room.** A metronome on its own (rail → Practice), 1 to 660 BPM: a big tempo with − and + (hold to run), a slider with 120 at its middle that gives the usual 60–160 range about twice the room of an even scale, tap tempo, one floating Start/Stop you can drag anywhere on the screen, beats per bar with their accents (tap a beat light to accent it and make your own groupings, 3 + 2 + 2 or 2 + 2 + 3; longer bars start on the usual one, and a drum pattern brings its own; in an odd metre the drums play your grouping too), the subdivision (quarters, 8ths, triplets, 16ths), muted bars (the click plays some bars and stops for others while you keep the time), speed up (off until you turn it on: a few BPM faster every few bars, up to a ceiling) and, with the drums or the harmony, a bar of count-in. A drummer to play with (one line names the pattern playing; Change opens them all, by genre, with your ★ favourites and recent picks): 124 drum patterns written for BassClass in 13 genres (rock, metal, pop, funk, soul & R&B, electronic, blues, jazz, Latin, world, reggae & Caribbean, country & folk, odd metres), with optional fills every 4 or 8 bars, each with its metre, usual tempo and subdivision; the Subdivision buttons play more or less of a pattern (16ths add its ghost-note fills, triplets swing a straight groove). The kit is a real recorded one, in stereo: MuldjordKit (Lars Muldjord, CC BY 4.0) for the kick, hi-hats, cymbals and toms, a 14×6.5 maple snare from Karoryfer's Frankensnare (CC0), Virtuosity Drums (Versilian Studios and Karoryfer, CC0) for the rim and cross-stick and the Latin percussion, and Swirly Drums brushes (Karoryfer, CC0) for jazz. It (about 2 MB of Opus) loads once on first use, from the repository in the Android app, then plays offline. Something to play over: a drone on any key, or a chord progression (pop and rock, blues, jazz with the 12-key cycles, minor, vamps), voiced above the bass and loud enough to play along with a real bass, as a pad, an electric piano, an organ or an arpeggio in time, whose chords light up and fill with the pulse as they sound (stopped, tap one to see it on the neck and hear it); the neck shows the chord sounding or its scale, and names the next change. My progression: your own chords by degree (the key moves them), up to 16 with their lengths, or any progression copied in to change it.
- **Feels like an instrument.** Every tap of a button gives a soft, short tick (Settings → Tap sounds turns it off).
- **One record of progress.** An exercise is mastered once a full loop reaches its goal tempo (the 🎯 on its card) and you tick it, in the Library, today's session or a lesson; it then counts everywhere: the course's steps on it pass, and a Library level 80% mastered moves your level on.
- **Your progress is yours.** Settings → Backup saves everything (progress, course, sessions, favourites, practice log and settings) to one file and loads it back, on this phone or a new one. Home opens with your practice log: today's minutes as a ring against your session length, the last 7 days' total and each day as a bar (gold where you reached your goal).
- **Jazz licks for advanced players.** 33 original phrases in real jazz vocabulary (ii–V–I, minor ii–V–i, blues, turnarounds, bebop, modern sounds, bass-solo devices). Each plays over its chord changes in all 12 keys, with swing and colour-coded tensions.
- **Grounded in real curricula.** Content draws on Scott's Bass Lessons, TalkingBass, StudyBass, BassBuzz, RSL/Trinity/LCM grades, Berklee, MI, Spanish conservatories, Bass Fitness, Willis, Friedland, Barry Harris, Banacos, Gwizdala and others. See [docs/RESEARCH.md](docs/RESEARCH.md).

## Run it on this computer

```bash
python tools/serve.py
```

Then open http://localhost:8765 (Chrome or Edge). Keyboard: Space = play/pause, ← → = step, +/- = tempo.

The tuner needs microphone access. Browsers only allow it on `https://` or `localhost` pages, and in the installed Android app, which asks for the permission the first time you open the tuner.

## Get it on your Android phone

### Install the app (recommended)
On your phone, open **https://github.com/josich/BassClass/releases/latest/download/BassClass.apk**. Then:
1. Download the file and open it.
2. If asked, allow "install unknown apps" for your browser or file manager.
3. Tap **Install**.

Every push to `main` publishes a new release (version 1.0.N), so opening the same link later gets you the newest build. Updates install over the previous version and keep your progress, because every build is signed with the same key, `android/app/bassclass.p12`. The first CI run created that key.

Other ways to run it:

### 1. Open it from your PC over Wi-Fi (quick test)
1. Run `python tools/serve.py` on the PC.
2. On the phone (same Wi-Fi), open `http://<PC-IP>:8765` in Chrome. Find the IP with `ipconfig`; it looks like `192.168.x.x`.

Everything except the tuner works. Browsers block the microphone on plain `http://`. Installing to the home screen in full-screen mode also needs HTTPS, which options 2 and 3 provide.

### 2. Install as a web app (PWA)
Host the `web/` folder on any HTTPS static host, e.g. GitHub Pages, Netlify or Cloudflare Pages. Open it in Chrome on the phone and choose **⋮ → Add to Home screen / Install app**. It then:
- starts full screen in landscape;
- works offline after the first load.

### 3. Build the real APK (`android/` project)
The `android/` folder is an Android Studio project. It wraps the same `web/` code in a full-screen landscape WebView that keeps the screen awake. Its one use of the internet: the Practice room's drum samples load once, on first use, and are then kept for offline use.

- **Android Studio:** File → Open → `android/`. Let it sync, then **Build → Build APK(s)**. Copy `app/build/outputs/apk/debug/app-debug.apk` to the phone and open it to install. You need to allow installing from unknown sources.
- **No local SDK (GitHub):** every push to `main` runs `.github/workflows/android-apk.yml`, which builds a signed release APK and publishes it as a GitHub Release (see "Install the app" above).

Any change you make in `web/` is included automatically in the next APK build.

## Project layout

```
web/                    the app (static HTML/CSS/JS, no build step)
  js/theory.js          notes, intervals, scales, chords, keys (correct spelling)
  js/fretboard.js       tunings + fingering engine (hand-position search)
  js/builder.js         exercise builder, sequences, arpeggio shapes
  js/audio.js           sampled bass + physical-model fallback, metronome, microphone
  js/pitch.js           YIN pitch detection for the tuner
  audio/bass/           recorded bass samples (CC0), see audio/bass/LICENSE.txt
  js/player.js          sample-accurate scheduler, loop, speed trainer
  js/views/             SVG fretboard and tab strip
  js/ui/                screens (home with the practice log, course, session + favourites; course; library; practice room with its neck; tuner; settings; player)
  js/curriculum/        all exercise generators, one file per module
  js/course/            the guided course: data.js (stages, units, lessons, steps), progress.js (tempos, ticks, reviews)
  js/selftest.js        builds every exercise on 4/5/6-string and checks every note
  js/dev/sampleprep.js  dev tool that converted the raw samples (trim, retune, level-match, 22 kHz)
android/                Android Studio WebView wrapper (Kotlin)
tools/serve.py          local dev server (also saves files for the dev tools in web/js/dev/:
                        sampleprep.js processes the bass samples, iconprep.js renders the PNG icons
                        and Android layers from web/icons/icon.svg; icons.html previews an icon at
                        launcher sizes, masks and wallpapers)
.claude/agents/         the two QA agents (qa-reviewer, qa-user; reports in qa/reports/) and the
                        designer (design reviews; reports in design/reports/)
docs/                   research summary and generated exercise catalogue
```

## Adding an exercise

Each exercise is a template with parameters and a `build(params, ctx, settings)` function that returns note steps. Example, using the helpers in `js/curriculum/common.js`:

```js
const myDrill = ex({
  id: 'tri-my-drill', module: 'triads', level: 3,
  title: 'My drill', summary: 'One line for the card.',
  about: 'What, why and how.', tips: ['Focus point'], source: 'Where the idea comes from',
  params: { key: keyP(), quality: sel('Triad', QUALITY_TRIADS) },
  bpm: 70, sub: 2, label: 'degree',
  build(p, ctx, S) {
    return arpBuild(p, ctx, S, { ivs: T.CHORDS[p.quality].iv, type: p.quality, shape: 'updown' }).build({ label: 'degree' });
  },
});
```

Add it to the module's `export default [...]` list, at the place where it belongs inside its level: exercise numbers follow the Library order (level, then topic, then that list), so the exercises after it move up by one. Progress, favourites and warm-ups are stored by id, so nothing breaks. Then check it in the browser console:

```js
(await import('./js/selftest.js')).run()
```

## Adding a course lesson

Lessons live in `js/course/stages/s1.js` … `s6.js`, one file per stage (the format is described at the top of `js/course/data.js`). A step opens an exercise with the options that matter for the lesson (`p`, by option value; the others stay the player's own) and gives its tempos:

```js
{ ex: 'sc-one-octave', p: { type: 'ionian', key: '0', root: 'A', oct: '1' }, from: 60, goal: 84, do: 'C major from the A string.' }
```

Give `sub` (notes per beat) when the exercise lets the player choose it, and only then: the goal counts in it. Leave out `goal` for drills without a tempo target (ear training: one full round passes). `music: true` marks the "make music" step and `backing: 'chords'` (or `'drone'`) turns the backing on for that step only. Lesson ids are stored in the player's progress, so never rename one; steps are stored by their place in the lesson, so add new steps at the end and never insert or reorder them. If a released step has to play different notes (another key, pattern or progression), list it in `CHANGED_STEPS` in `js/course/progress.js` with the next `rev`: what players saved for it before is dropped once, so an old tempo or tick never counts for new notes. The self-test checks every step: the exercise and its options exist on a 4-string bass, the tempos make sense and it builds on 4, 5 and 6 strings.

## Credits

- **Drum kit:** "MuldjordKit" by Lars Muldjord (www.muldjord.com, DrumGizmo.org), in the stereo build assembled by the FreePats project (https://freepats.zenvoid.org/Percussion/acoustic-drum-kit.html), licensed under CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/), for the kick, toms, hi-hats, ride and crash. Changed for this app: a selection of its hits, trimmed, faded, levelled and encoded as Opus; the half-open hi-hat is its open hi-hat cut short; the kick shortened and equalised. The app's Settings and `web/audio/drums/LICENSE.txt` carry the same credit.
- **Snare:** the 14×6.5 maple snare of "Frankensnare" by Karoryfer Samples, CC0 1.0: https://github.com/sfzinstruments/karoryfer.frankensnare. Its top, bottom and overhead mics mixed, equalised, shortened and encoded as Opus.
- **Percussion and brushes:** Virtuosity Drums (Versilian Studios and Karoryfer Samples) and Swirly Drums (Karoryfer Samples), CC0 1.0: https://github.com/sfzinstruments/virtuosity_drums, https://github.com/sfzinstruments/karoryfer.swirly-drums. Summed from their mics, trimmed and encoded as Opus.
- **Bass samples:** Karoryfer Samples, "Black And Blue Basses" (darkblack). Released into the public domain under CC0 1.0: https://github.com/sfzinstruments/karoryfer.black-and-blue-basses. Trimmed, retuned (the upper register was up to 22 cents flat), level-matched and resampled to 22.05 kHz mono for this app.
