# BassClass: working notes for Claude

## Git workflow (always)

- Repository: https://github.com/josich/BassClass (remote `origin`, branch `main`).
- **Push every change.** After finishing any change (code, content, docs, assets): verify it, then commit and push to `origin main` in the same turn. Never leave work uncommitted or unpushed.
- The commit identity is already set locally in this repo (`josich` / `76693732+josich@users.noreply.github.com`). Don't change it or set a global one.
- End every commit message with the `Co-Authored-By` trailer from the session's attribution instructions.
- Windows PowerShell: write multi-line commit messages to a temp file and use `git commit -F <file>`. Here-strings are not passed to stdin.
- Run `git pull --rebase origin main` before pushing: CI can push commits too (it committed the signing key `android/app/bassclass.p12` on its first run).
- Each push to `main` runs two GitHub Actions workflows:
  - **Build Android APK:** builds a signed release APK and publishes GitHub Release `v1.0.<run number>`. The user installs from https://github.com/josich/BassClass/releases/latest/download/BassClass.apk. Never delete or replace `bassclass.p12`: updates would stop installing over the old version.
  - **Publish web app (GitHub Pages):** deploys `web/` to https://josich.github.io/BassClass/, only once Pages → Source is "GitHub Actions"; until then it skips.
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
- Sound: CC0 Karoryfer "darkblack" bass samples in `web/audio/bass/` (B0–E4, plus ghost notes); `web/js/audio.js` falls back to a synth.
- Design: navy/teal/periwinkle/peach palette (no brown fretboard), real string-gauge proportions, root markers drawn as rounded squares. Keep this look.
- Downloading anything new (samples, packages, SDKs) needs the user's explicit OK first.
- Jazz licks (`curriculum/licks.js`) are ORIGINAL phrases in standard jazz vocabulary, notated in C (or C minor) and transposed. Never paste note-for-note transcriptions of copyrighted recorded solos.

## QA agents (on request, 2026-10-14)

- Two agents, read-only on the app, writing only to `qa/`:
  - `qa-reviewer` (`.claude/agents/qa-reviewer.md`): adversarial deep QA. It breaks the app with seeded monkey runs, extremes, corrupt storage and interrupted flows, checks notes/timing/samples/tuner against KNOWN answers, measures leaks, checks phone layouts and reviews changed code. Report: `qa/reports/<short-sha>-deep.md`. Server `qa`, port 8878.
  - `qa-user` (`.claude/agents/qa-user.md`): player's-eye QA. Three personas (beginner, advanced player, jazz teacher) look for graphical issues, text problems, wrong or misleading information, illogical flows and incorrect musical content. Report: `qa/reports/<short-sha>-user.md`. Server `qauser`, port 8890.
- **Always ask the user before launching them.** Good moments are after big changes: a new module or screen, a change to the player, audio, fingering or theory engine, storage, the Android wrapper, or a batch of several releases since the newest report. When one would pay off, propose it in one line at the end of the round; never launch unasked.
- When he says go: launch BOTH in the background in parallel and keep working. Agent files load at session start; in a session where they are not listed as agent types, launch `general-purpose` with "Read and follow .claude/agents/<name>.md exactly" (and the commit to test).
- Relay an `URGENT:` line at once. Otherwise summarise both reports for the user, grouped by severity with a recommendation, and **fix only what he picks**. Log his decisions below so QA stops re-reporting them.

### Decisions QA should not re-report
- Navy/teal/periwinkle/peach design; root notes drawn as rounded squares; real string-gauge proportions.
- The signing key `android/app/bassclass.p12` is committed on purpose (sideloaded app; updates must install over each other).
- Jazz licks are original vocabulary, not transcriptions.
- The tuner cannot open the microphone on plain `http://` pages (browser rule); it works on https, localhost and in the APK.
