# BassClass: working notes for Claude

## Git workflow (always)

- Repository: https://github.com/josich/BassClass (remote `origin`, branch `main`).
- **Push every change.** After finishing any change (code, content, docs, assets): verify it, then commit and push to `origin main` in the same turn. Never leave work uncommitted or unpushed.
- The commit identity is already set locally in this repo (`josich` / `76693732+josich@users.noreply.github.com`). Don't change it or set a global one.
- End every commit message with the `Co-Authored-By` trailer from the session's attribution instructions.
- Windows PowerShell: write multi-line commit messages to a temp file and use `git commit -F <file>`. Here-strings are not passed to stdin.
- Order: `git add -A` → `git commit` → `git pull --rebase origin main` → `git push origin main`. The pull must come after the commit (rebase refuses unstaged changes). CI can push commits too: it committed the signing key `android/app/bassclass.p12` on its first run.
- Each push to `main` runs two GitHub Actions workflows:
  - **Build Android APK:** builds a signed release APK and publishes GitHub Release `v1.0.<run number>`. The user installs from https://github.com/josich/BassClass/releases/latest/download/BassClass.apk. Never delete or replace `bassclass.p12`: updates would stop installing over the old version.
  - **Publish web app (GitHub Pages):** deploys `web/` to https://josich.github.io/BassClass/, only once Pages → Source is "GitHub Actions"; until then it skips.
- Commits that change nothing in the app (QA reports, notes) end their first line with `[skip ci]` so no identical APK release is published.
- After pushing, check the runs at `https://api.github.com/repos/josich/BassClass/actions/runs` and fix any failure before reporting the work as done.

## Before committing

1. Start the dev server: `python tools/serve.py`, or the `bassclass` launch config. It serves `web/` on http://localhost:8765.
2. In the page console run `(await import('/js/selftest.js')).run()`. It must report `problems: 0`. It builds every exercise on 4/5/6-string basses and checks every note.
3. If exercises were added or changed, regenerate the catalogue: `(await import('/js/selftest.js')).saveCatalogue()` → `docs/CATALOGUE.md`.
4. Check UI changes visually in the browser pane at a landscape phone size (e.g. 800×380).

## Project facts

- `web/` is the whole app: static ES modules, no build step. `android/` wraps it in a WebView (`assets.srcDirs("../../web")`).
- This PC has no JDK, Android SDK, Node, Gradle or numpy, so APKs are built only by GitHub Actions. Audio processing runs in the browser (`web/js/dev/sampleprep.js`).
- Exercises live in `web/js/curriculum/`, one file per module, with shared helpers in `common.js`. See README "Adding an exercise".
- Exercise numbers follow the Library order: level, then topic (PATH_ORDER), then the order of the module's `export default [...]` list (computed in `curriculum/index.js`). Put a new exercise where it belongs in that list; the ones after it move up by one (user's choice, 2026-10-15, replacing the earlier frozen `numbers.js`). Everything stored uses ids, never numbers.
- `web/js/version.js` is overwritten by CI with the release number (`1.0.<run number>`) and commit, shown at the bottom of Settings. Keep the committed copy empty (it reads "development version" locally).
- Sound: CC0 Karoryfer "darkblack" bass samples in `web/audio/bass/` (B0–E4, plus ghost notes); `web/js/audio.js` falls back to a synth.
- Design: navy/teal/periwinkle/peach palette (no brown fretboard), real string-gauge proportions, root markers drawn as rounded squares. Keep this look.
- Downloading anything new (samples, packages, SDKs) needs the user's explicit OK first.
- Jazz licks (`curriculum/licks.js`) are ORIGINAL phrases in standard jazz vocabulary, notated in C (or C minor) and transposed. Never paste note-for-note transcriptions of copyrighted recorded solos.

## QA agents (on request, 2026-10-14)

- Two agents, read-only on the app, writing only to `qa/`:
  - `qa-reviewer` (`.claude/agents/qa-reviewer.md`): adversarial deep QA. It breaks the app with seeded monkey runs, extremes, corrupt storage and interrupted flows, checks notes/timing/samples/tuner against KNOWN answers, measures leaks, checks phone layouts and reviews changed code. Report: `qa/reports/<short-sha>-deep.md`. Server `qa`, port 8878.
  - `qa-user` (`.claude/agents/qa-user.md`): player's-eye QA. Three personas (beginner, advanced player, jazz teacher) look for graphical issues, text problems, wrong or misleading information, illogical flows and incorrect musical content. Report: `qa/reports/<short-sha>-user.md`. Server `qauser`, port 8890.
- **Always ask the user before launching them.** Good moments are after big changes: a new module or screen, a change to the player, audio, fingering or theory engine, storage, the Android wrapper, or a batch of several releases since the newest report. When one would pay off, propose it in one line at the end of the round; never launch unasked.
- When the user says go: launch BOTH in the background in parallel and keep working. Agent files load at session start; in a session where they are not listed as agent types, launch `general-purpose` with "Read and follow .claude/agents/<name>.md exactly" (and the commit to test).
- Relay an `URGENT:` line at once. Otherwise summarise both reports for the user, grouped by severity with a recommendation, and **fix only what the user picks**. Log the user's decisions below so QA stops re-reporting them.

### Decisions QA should not re-report
- Navy/teal/periwinkle/peach design; root notes drawn as rounded squares; real string-gauge proportions.
- The signing key `android/app/bassclass.p12` is committed on purpose (sideloaded app; updates must install over each other).
- Jazz licks are original vocabulary, not transcriptions.
- The tuner cannot open the microphone on plain `http://` pages (browser rule); it works on https, localhost and in the APK.
- Scale and pentatonic positions are numbered from the root (Position 1 = the box with the root on the E string); a position that would start above fret 12 is played an octave lower. (QA round 1, user's choice.)
- Inside a level the path lists hands and time first: technique, rhythm, fretboard, reading, intervals, ear training, scales, modes, triads, arpeggios, harmony, grooves, walking, licks, slap. (QA round 1, user's choice; reading and ear training added in round 4.)
- Notation (round 4): bass guitar is written in the bass clef an octave above its sound (open E on the first ledger line below). Key signatures are drawn; a note shows an accidental only where it differs from the key signature (♮ cancels), with no carrying through the bar. Written notes above E4 are drawn an octave lower under "8va". Rhythm is shown with simple stems and flags (no beams).
- Backing (round 4): Off / Drone / Chords under ⋯, saved as a setting. It follows the badges: a chord symbol plays its chord (up to the 7th), a scale or mode badge its triad (read from the note labels); badges without a note name ("#3", "Pos 2") fall back to the text or play nothing.
- Ear training (round 4): each round is heard with its notes hidden (no dots, "?" in the strip), then a silent answer step shows the name and the shape. The next-note preview never shows an answer.
- Approach and enclosure notes are labelled "→" in every module. Licks label the other notes against the chord under them in jazz terms (9, ♭9, ♯9, 11, ♯11, ♭13, 13); a dominant's ♭9/♯9 always keeps its name.
- Lick notes are spelled against their chord. Chord tones keep their academic spelling; tensions, blue and passing notes with a double accidental become the plain enharmonic, and the ♯9 uses whichever of ♭3/♯2 reads more easily (B♭ over G7, B over A♭7).
- When an exercise physically cannot fit under "Highest fret used" (e.g. two octaves of E♭ on a 4-string with 17 frets) it goes over and shows a notice. Intended.
- Double accidentals are drawn as two glyphs (♭♭/♯♯), not 𝄫/𝄪, because Android system fonts may lack those characters.
- Exercises with a written rhythm (licks, grooves, walking, approach drills) hide the subdivision selector and show "♪ Written rhythm".
- Library shows every exercise by level (with search and level jump buttons); the Path shows the topics. The user asked for this swap (2026-10-15): do not suggest swapping the names back. Inside each level the Library uses the path's topic order, then the exercise number (QA round 3, user's choice), so new exercises sit with their topic.
- Spelling rule (user, 2026-10-15): the academic spelling, so no musician can call it wrong; where a widely used simpler spelling is also accepted, the simpler one. In practice:
  - Keys and chords chosen on their own get lead-sheet names: never B♯, E♯, C♭ or F♭; flats on black keys except minor-type chords/scales (C♯m, G♯m, F♯m); a minor key with a raised 6th/7th is named after its key signature (G♯ harmonic minor). Cycle drills use the cycle's names (C F B♭ E♭ A♭ D♭ G♭ B E A D G) unless that would force a double flat (F♯m, D♯°).
  - Notes keep their academic spelling: scales use each letter once (G♯ harmonic minor has F𝄪), chord tones keep their interval (the 3rd of D♯7 is F𝄪), and chords/modes inside a key keep the key's spelling (C♭ is the IV of G♭ major). Interval and chord-construction drills keep textbook spellings (B♭♭).
  - Only in jazz exercises (progressions, walking, grooves, licks, altered chord-scales): altered notes, diminished 7ths, blue and passing notes with a double accidental or C♭/F♭/E♯/B♯ are written the plain way (A♭7♭9: A; C°7: C E♭ G♭ A; ♭13 of E♭7: B). `Builder(ctx, S, { jazz: true })`. Chord tones stay academic there too: the ♭3 of a minor chord (A♭m7 = A♭ C♭ E♭ G♭), the ♭5 of m7♭5 and ° chords, the ♭7 of any non-major chord. A ♭3 over a major or dominant chord and a ♭7 over a major chord are blue notes (plain). On a dominant the ♭9/♯9/♯11/♭13 are alterations even when the symbol names them (A♭7♭9: A). Licks keep a natural ♯11 over a major chord (E♯ in a C♯ triad over B).
  - Plain-spelled scales name their keys with flats on the black keys (D♭ whole-half, A♭ Messiaen mode 7).
  - The altered scale over its dominant is written the jazz way everywhere it stands alone (Mode study, Pitch axis, chord-scale): G A♭ B♭ B D♭ E♭ F = R ♭9 ♯9 3 ♭5 ♭13 ♭7. Inside the melodic-minor family exercise it keeps the parent's spelling and labels (♭4, ♭6).
  - Scales without one note per letter (diminished, whole tone, augmented, Messiaen's modes) are spelled plainly: no double accidentals, no C♭/F♭/E♯/B♯ (`Builder(ctx, S, { plain: true })`). On them the "skip one note" sequence is called "Skip one note", not "In 3rds".
  - Parallel modes and pitch axis: each mode takes its most readable root name (C♯ Dorian, D♭ Lydian); when it differs from the chosen key the badge adds "(= D♭)". (QA round 3, user's choice.)
  - Licks name the tritone and the minor 6th as they are spelled (D♭ over G7 = ♭5, C♯ = ♯11); a note respelled plainly keeps its jazz name (B over E♭7 = ♭13). (QA round 3, user's choice.)
- A favourite stores the exercise only, not its options; it opens with the last options you used. (QA round 2, user's choice.)
- Over the V7(♭9) of a minor ii–V–i, the chord-scale exercise (and the walking lines) use Phrygian dominant (♭9, ♭13). (QA round 2, user's choice.)
- The UI uses British spelling ("favourites", "colours", "practise", "harmonised"); the Library search also finds the American spelling.
- Sound (user, 2026-10-15): no sound options in Settings. Always the recorded bass (the synth only while samples load), no octave-up layer, phone-speaker profile fixed at +15 dB. The bass volume is shown as 0–100% (internally 0–2 into the limiter; default 100%). The phone-speaker profile plays only in the Android app on the phone's own speaker (Android 13+: the device actually playing media); browsers always get the natural sound, because they cannot see headphones.
- Broken chords end on the root held to the bar line, so every key starts on beat 1. Two-octave arpeggios and scales always start on the E string ("Root on" shows as fixed). In one-octave scale and triad drills a root that would sit at frets 10–12 of the chosen string moves to the string below, shown as fixed (A major from the A string → E string fret 5).
- Chord-scale (QA round 4, user's choice): modes by function, Berklee style. Diatonic chords take the mode of their degree (I Ionian, ii Dorian, iii Phrygian, IV Lydian, V Mixolydian, vi Aeolian, viiø Locrian; minor key: i Aeolian, iiø Locrian, iv Dorian, V7 → minor Phrygian dominant); other chords by quality (secondary dominant Mixolydian, m(maj7) melodic minor, °7 whole-half). Dominant tensions are named 9, 11, 13.
- Pop, rock, folk, disco and reggae progressions are triads (A E F♯m D); jazz, soul, funk and blues keep 7th chords. Exercises whose voicing needs a 7th (shells, R-7-10, R-3-5-7 patterns) use 7th chords on any progression. (QA round 4, user's choice.)
- Warm-ups at Levels 1–2 keep the range, position, zone and string options at their defaults.
- An exercise that is a preset of another keeps the option that gives it its name (e.g. Giant Steps arpeggios only offer Giant Steps; open spread triads have no Stack option).
- On scales without one note per letter the sequences are "Skip one note"/"Skip two notes"; the Barry Harris scale is harmonised every other note (C6 and dim7 chords).
- Settings sliders (bass and metronome volume) both run 0–100%.
- "World scales" (not "exotic"); the augmented scale is in it and in Symmetric scales. (QA round 3, user's choice.)
- Mode study offers every mode family (major, melodic minor, harmonic minor, harmonic major) even though it is Level 4 and the dedicated family exercises come at Levels 5–6: it is a free practice tool. (QA round 3, user's choice.)
- Every scale-based exercise has a Range option with 2 octaves (user, 2026-10-15). Exceptions, by nature: scales along one string (12 frets per octave), one position or box (all keys in one position, the 7 major and 5 pentatonic positions), scale in octaves (double stops on a string pair) and chord-scale progressions.
