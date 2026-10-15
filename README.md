# BassClass: a visual bass trainer

A landscape app to learn bass from the first open string to mastery. Every exercise is shown **note by note on a fretboard**. Each marker appears as it plays, with the note name, degree or finger, and a dashed arc points to the next note. You hear a **recorded bass**, a metronome counts, and a scrolling tab strip below the neck shows what is coming. A **microphone tuner** is built in.

- **170 exercise families** in 13 modules and 6 levels: fretboard & notes, technique/rudiments, rhythm, intervals, scales, modes, triads, arpeggios & 7ths, chords & harmony, grooves, walking bass, **jazz licks**, slap. See [docs/CATALOGUE.md](docs/CATALOGUE.md).
- **Every exercise is generated, not hard-coded.** Any key, or all 12 keys in a row (cycle of 4ths/5ths/chromatic), plus inversions, scales, patterns, positions, zones and rhythms. That adds up to thousands of distinct drills.
- **Correct fingering.** A fingering engine models the hand position (one finger per fret, stretches, shifts along a string) and adapts to **4, 5 or 6-string** basses.
- **Correct spelling.** E.g. B♭ vs A♯, D♭maj7 vs C♯maj7. Degree colours: root, 3rd, 5th, 7th.
- **Real bass sound.** A finger-style 5-string bass recorded note by note (B0–E4, CC0 samples from Karoryfer). It has real ghost notes, velocity-dependent tone and natural string damping. A physical-model synth is the fallback. The output runs through a compressor and limiter (bass volume up to 200%). Phone speakers cannot play a bass's low notes (they start around 500 Hz; the open E is 41 Hz), so on the phone's own speaker a "phone-speaker" profile cuts the inaudible lows, lifts the presence band and adds harmonics from which the ear rebuilds the low pitch (virtual bass). The Android app switches it on and off automatically when headphones or a speaker are connected; Settings has a speaker test to compare.
- **Tuner.** Chromatic or per-string, with a cents gauge, adjustable A4 and reference tones. It uses YIN pitch detection, which works down to a 5-string's low B.
- **Elegant fretboard.** Navy board, nickel round-wound strings drawn at real gauge ratios (.045–.130), and glossy colour-coded markers (root = square).
- **Built for practice.** Step-by-step mode (◀ ▶), loop, tempo 30–260 BPM, subdivision selector (whole notes to sextuplets; fixed where the rhythm is written in, as in licks and grooves), count-in, speed trainer (+4 BPM per loop), "Shape" and "Quiz" reveal modes, mastered/best-BPM tracking and a neck explorer.
- **Organised for daily use.** Home holds the daily warm-up (a fresh random routine every day) and your favourites: star any exercise and drag the list into your own order. The Path walks through the topics, and the Library shows every exercise at once, by level, with search. Every exercise has a fixed number (1 = Alternate plucking, 2 = Chromatic 1-2-3-4…), so you can point someone to "exercise 42": type 42 in the search, or open `#/ex/42`.
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
The `android/` folder is an Android Studio project. It wraps the same `web/` code in a full-screen landscape WebView that keeps the screen awake. No internet permission is needed.

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
  js/ui/                screens (home with warm-up + favorites, path, library, explorer, settings, player)
  js/curriculum/        all exercise generators, one file per module
  js/selftest.js        builds every exercise on 4/5/6-string and checks every note
  js/dev/sampleprep.js  dev tool that converted the raw samples (trim, retune, level-match, 22 kHz)
android/                Android Studio WebView wrapper (Kotlin)
tools/serve.py          local dev server (also saves files for the dev tools in web/js/dev/:
                        sampleprep.js processes the bass samples, iconprep.js renders the PNG icons
                        from web/icons/icon.svg)
.claude/agents/         the two QA agents (qa-reviewer, qa-user); reports go to qa/reports/
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

Add it to the module's `export default [...]` list, and add its id at the END of `js/curriculum/numbers.js` so it gets the next exercise number (numbers never change once given). Then check it in the browser console:

```js
(await import('./js/selftest.js')).run()
```

## Credits

- **Bass samples:** Karoryfer Samples, "Black And Blue Basses" (darkblack). Released into the public domain under CC0 1.0: https://github.com/sfzinstruments/karoryfer.black-and-blue-basses. Trimmed, retuned (the upper register was up to 22 cents flat), level-matched and resampled to 22.05 kHz mono for this app.
