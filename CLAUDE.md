# BassClass: working notes for Claude

## Git workflow (always)

- Repository: https://github.com/josich/BassClass (remote `origin`, branch `main`).
- **Push every change.** After finishing any change (code, content, docs, assets): verify it, then commit and push to `origin main` in the same turn. Never leave work uncommitted or unpushed.
- The commit identity is already set locally in this repo (`josich` / `76693732+josich@users.noreply.github.com`). Don't change it or set a global one.
- End every commit message with the `Co-Authored-By` trailer from the session's attribution instructions.
- Windows PowerShell: write multi-line commit messages to a temp file and use `git commit -F <file>`. Here-strings are not passed to stdin.
- Each push to `main` runs two GitHub Actions workflows:
  - **Build Android APK:** the artifact `BassClass-debug-apk` is the installable APK.
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
