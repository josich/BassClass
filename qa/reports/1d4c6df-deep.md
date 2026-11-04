# QA deep report · 1d4c6df · 2026-11-04
Summary: 0 critical, 2 major, 4 minor, 1 visual. Runs: monkey seeds 2501 (330 steps, 800x380, 4-string), 2502 (330 steps, 640x360, 6-string, left-handed, Do-Re-Mi), 2503 (330 steps, 915x412, 5-string, Pro gates on, free at the start); 990 steps, about 15 minutes, 0 errors. Plus a play-mode area sweep (3,074 exercise renders), a tap-mode sweep (210 sets, 2,306 questions, 779 hints) and targeted checks.

Scope: 7c4c571..1d4c6df (7 commits): QA round 24's fixes (6a67391), the quiz staff `hideAhead` (86f2c5e) and the neck's area in use (6258fb4, 62577c3, 1b0eae9, 1d4c6df: `setOutside`, `areaFor` / `playArea` / `tapArea`, the right note outside the area as a hint with a black-and-white dot). The `qa` server (port 8878) served the working tree, clean at 1d4c6df. The qa origin's own localStorage was snapshotted first and restored at the end; port 8765 was never opened. Recorded takes stay on hold and were not tested.

Tools added: `qa/tools/area25.js`, `qa/tools/tap25.js`, `qa/tools/monkey25.js` (see `qa/tools/README.md`).

## Critical

None.

## Major

### M1. A note-finding or interval quiz still shows where its hidden notes are on the staff: at 8ths or faster, each hidden note's stem still starts at its head
- Where: #219 Note-finder quiz and #225 Interval quiz in play mode, staff view (`hideAhead`, `web/js/views/tabView.js:116-120`). The reading game's own hiding (`tap-hidden`, `decorateStaff` in `web/js/ui/exercise.js:1429-1441`) has the same gap.
  - The cause: `web/js/views/staff.js:506-520` draws a beamed group's stems (`line.sst`) and beams (`path.sbm`) outside the notes' `.sn[data-i]` groups. Only `.sn` gets `future` or `tap-hidden`.
  - Each stem runs from its note head (`y1 = far[j]`) to the beam, so the stem's end marks the head's line or space.
- Steps:
  1. Settings: staff view. Open `#/ex/fb-quiz?range=12&strings=all&notes=nat` in play mode.
  2. Set the subdivision to ♪ 2/beat or 16ths, before ▶.
- Expected: no note of the quiz can be read before it sounds, as with half notes and quarters.
- Actual: every note head is hidden, but every stem and beam stays. The contour, and each note's exact staff position, can be read from the stem ends. With half or quarter notes, the default, there are no beams and nothing shows.
- Evidence (DOM readout, 4-string):
  - #219 at 16ths: 24 of 24 hidden notes have a visible stem whose `y1` equals the hidden head's y. Note 0: head at y 68.0, stem `y1=68 y2=96`. Note 2: head at y 52, stem `y1=52 y2=90.2`. All 24 beams are visible.
  - #225 `#/ex/iv-ear-quiz?key=0&set=basic` in play mode: 0 of 24 at its default quarter notes, 24 of 24 at 16ths.
  - In the reading game (`#/ex/rd-melodies?key=0`, tap mode, before ▶), 4 of 14 hidden notes show their stems. These are the beamed 8ths. In 'read' this only lets the player read ahead; the note asked is shown anyway.
  - A zoomed screenshot of #219 at 8ths shows the beams and stems alone, as stair-steps along the empty staff.
- Suggested fix: write each beamed stem into its own note's `.sn` group, and the beam into a group that carries the `data-i` of its notes. Hide that group while any of its notes is hidden.

### M2. #112 "Every place, to the 12th fret": the right pitch at fret 13 (shown, not greyed) ends the question as a miss, reading "✗ F, not F"
- Where: `game-read-notes`, Places "Every place, to the 12th fret".
  - The answer carries no `hi` (`web/js/curriculum/games.js:251`), so `hasArea` is false (`web/js/ui/exercise.js:1548`).
  - The tap is not in `places` (frets 0–12), and `ok` excludes `a.all` (`exercise.js:1559`).
  - `tapVerdict` (`exercise.js:1495-1499`) then writes ", not F", because the pitch tapped is the pitch asked.
  - Tap mode fits the neck to 0–13 (`fit(0, 12, 12)`, `exercise.js:500`, `fretboardView.js:96-102`). `tapArea` returns null, so fret 13 is not greyed.
- Steps:
  1. Open `#/ex/game-read-notes?notes=f&places=all` and press ▶.
  2. When the note is F (F2, 41), tap fret 13 of the E string.
- Expected: by the round's own rule (user, 2026-11-04: the right note outside the area "is neither right nor wrong"), a hint that changes nothing, with fret 13 greyed. At the least, not a miss.
- Actual: ✗, the question is over and counts against the 8 of 10. The verdict reads "✗ F, not F", the same message the user flagged on 2026-11-04 ("✗ E, not E").
- Evidence: the tap-mode sweep hit it on all three basses.
  - 4-string: `q8 0:13 → ✗ "✗ F, not F"`
  - 5-string: `q3 1:13 → ✗ "✗ F, not F"`
  - 6-string, left-handed: `q8 1:13 → ✗ "✗ F, not F"`
  - In "One place is enough" mode the same tap at fret 13 counts ✓.
- Suggested fix: give the "all" answer `hi: 12`, so fret 13 greys and the tap becomes a hint. Never write "✗ X, not X".

## Minor

### m1. Note-name questions say "tap one in frets 0–12" for a tap at fret 13, but fret 13 is drawn bright
- Where: the theory games #251 and #454 and #412 (ear progressions, the root).
  - Their `pc` answers have no area, so `tapArea` returns null (`exercise.js:1385-1388`) and nothing is greyed.
  - The neck shows frets 0–13, but `tapPlaces` stops at 12. The right note at fret 13 therefore takes the hint path (`hasArea` is true for every `pc` answer, `exercise.js:1548`).
- Steps: open `#/ex/game-theory?ask=sevenths` and press ▶. Tap the answer's note at fret 13.
- Expected: either fret 13 is greyed, like #216 Find every note, whose answer has `hi` and greys 13; or the tap counts.
- Actual: the prompt says "That F is at fret 13: tap one in frets 0–12", over a fret that looks like part of the area.
- Evidence: the 4-string sweep alone produced 37 such hints, for example `#/ex/game-harmony?ask=numerals` "That E♭ is at fret 13: tap one in frets 0–12", `area null`, view 0–13.
- Suggested fix: when the view passes a question's highest fret, have `tapArea` return `{ lo: 0, hi: inst.tap.hi }`. M2's #112 "one place" mode would stay as it is: any place counts there.

### m2. Unticking a lesson step on an 80%-rule exercise leaves "✓ 23 cleared · 20 of 24 needed for 🏅" with no 🏅, and any later tick brings 🏅 back without the unticked choice
- Where: `untickStep` (`web/js/course/progress.js:197-203`) calls `setMastered(id, false, true)` (`web/js/mastery.js:222`), which sets only `done: false`. `settle` (`mastery.js:192`) re-masters on any `setCleared`, even on a choice already cleared.
- Steps:
  1. Master `tech-permutations` (24 choices, 80% rule: 20 needed).
  2. On Lesson "independence", step 1, ↺ untick the step.
  3. Open the exercise's Options. Then tick ✓ Cleared on any choice that was already cleared (or play anything that calls `setCleared` on it).
- Expected: one consistent state. Either 🏅 stays off until the unticked choice is cleared again, with the sheet saying so; or 🏅 stays and the step stays ticked.
- Actual:
  - After step 2: `{ mastered: false, cleared 23 of 24, need 20 }`. The Options sheet reads "✓ 23 cleared · 20 of 24 needed for 🏅", next to an exercise that is not mastered.
  - After step 3: `setCleared(id, <a cleared choice>, true)` gives `mastered: true`, while the unticked choice '1243' is still not cleared.
- Evidence: the readouts above (mastery API on the live store). 64 lesson steps sit on exercises with a `pct` rule. With the "all of them" rule the state stays consistent.

### m3. A Pro preview's grey comes from its first bar only, not from the exercise it previews
- Where: `rebuild()` (`exercise.js:463-467`) cuts `inst` to the first bar in a preview. `playArea()` (`exercise.js:1368`) then works out the area from that cut line, while the strip draws the whole line (`stripInst`).
- Steps:
  1. Turn the gates on: debug state `{ gates: true }`, Pro not owned.
  2. Open `#/ex/tech-permutations-across?perm=1324&pos=5`.
- Expected: the grey shows the part of the neck the exercise uses, frets 5–11 (the full build).
- Actual: the area is frets 5–8 (the first bar's), so frets 9–11, which the faded strip goes on to use, are greyed.
  - For `sc-positions?key=0&pos=1` and `fb-key-box`, the first bar happens to span the whole position, or the zone is kept, so they look right.
- Suggested fix: `areaFor(stripInst || inst)`.

### m4. Do-Re-Mi: #219's tap question names the strings in letters, its new hint in solfège
- Where: the round's ask is built from fixed text (`web/js/curriculum/fretboardNotes.js:322`: `' on the E or A string'`). The hint uses the notation (`exercise.js:1552-1554`).
- Steps: Settings, Do-Re-Mi, 6-string. Open `#/ex/fb-quiz?range=5&strings=EA&notes=all` in tap mode and press ▶. Tap the right note on the B string.
- Actual: the header reads "1/10 · ✓ 0 · Do on the E or A string, frets 0–5", and the prompt reads "That Do is on the Si string: tap it on the Mi or La string".
- Expected: one naming. #113's ask already uses the notation ("The open Sol string, then a note on it").

## Visual

### V1. Tap mode on small landscape phones: the hidden staff keeps its height, and the strings the area now asks for are 12 px apart
- Where: tap mode before the first answer (`tap-empty` is `visibility: hidden`, so it keeps its box). Since this round this covers the ear sets too (`kind !== 'read'`, `exercise.js:1432`).
- Size and settings: 640x300.
  - 5-string, #219: the neck host is 87 px tall and the hidden strip 97 px. Strings are 11.8 px apart, with a dot radius of 9.
  - 6-string, #113: neck 100 px, string gap 12 px.
  - 4-string, #113: neck 106 px, gap 19.5 px.
- Why now: #113 and #219 now take a tap only on the asked string. A tap on the neighbouring string is a hint: nothing counted, but the player taps again. Those string targets are well under the ~32 px guide, while 97 px of blank sits below the neck.
- Suggested fix: collapse the hidden strip (`display: none`, or a height of 0) until the first answer, so the neck gets the space. Or use the room for a larger neck in tap mode.

## Checked and fine
- Self-test: `problems: 0`. 262 exercises, 268 lessons, 124 drum patterns, 31,706 builds, 1,735,610 notes.
- Neck area, play mode: no played note's dot (2 px above or below its string, harmonics at their node) is ever in the grey.
  - First sweep: 2,002 renders, every exercise with defaults and every option of the ones with zone, string, pos, range or strings options, on 4, 5 and 6 strings and 4-string left-handed.
  - Second sweep, with a stricter "new neck" wait: 1,072 renders of the 29 exercises that have an area, on 4, 5, 6 left-handed and 5 left-handed. 1,049 of them drew a grey.
  - The areas make sense: one string for String options, `[s, s+1]` for unisons, a position's frets, zones from fret 0 when they start at fret 1, and an area widened to the notes. `sc-one-string` on D in C moves to the A string, and its area follows it.
- Grey geometry: every rect's top and bottom lie on a string line or the board's edge, and its sides on a fret wire, the open column or the board's end.
  - Every cell inside the frets on a string in use is bright; every cell outside is grey.
  - Checked on 35 screens over 5 configurations, and again after a resize from 915x412 to 640x300 once the ResizeObserver fired. A hidden pane delays it: the svg keeps its old 903 px until the next frame.
  - Portrait 360x780 shows the rotate prompt, with no sideways scroll.
- Tap mode: 210 sets, 2,306 questions (4-string, 5-string, 6-string left-handed), every exercise with a game or a tap and every option.
  - Every place that answers is on the board and outside the grey.
  - 779 right-pitch taps outside the places were hints that never changed the count or the score.
  - Planted wrong notes were ✗, right answers ✓, and every end card matched (for example "9 of 10" with one planted miss).
- Stale areas: none found.
  - ‹ › over an answered #113 'Any string' set: the area follows each question (13 steps, 0 mismatches).
  - Play and tap switching and option changes in either mode update the area. #219 went through 0–5 E&A, 0–12 E&A, 0–12 all strings, play 0–12 (fret 13 grey) and play 0–17 E&A.
  - Each screen has its own `FretboardView`, so nothing carries over between exercises.
- The hint dot: grey with a black label (`.dot.mono`). It is drawn over the grey and replaced by the next answer. Hint texts fit at 640x300 and 780x360 in Do-Re-Mi on 6 strings (no clipping, no overlap with the neck).
- Ear and theory rounds:
  - 2,400 chord and progression rounds: refs on their place, root shown on the E or A string at frets 1–7 (every pitch class covered), tones' pitch classes right.
  - Names by triad: G♯m6, C♯m7♭5. 6th chords ask "3rd, 5th and 6th". #412 asks no tonic.
  - #454: the ♯9 is B♭ over G7, D over B7, C over A7, A over G♭7; ♭9 of E♭7 is E; ♯11 of E♭7 is A. #251 opens on Major keys.
- Tunes:
  - The Air's folded beats keep their octave on 4 and 6 strings: within a beat only ±12 and steps, no unisons or double octaves, nothing under E1.
  - The Musette's whole tune (A A B B A) is 48 bars of 2/4. With a logged Player at 92 BPM: a count-in of exactly one bar (2 clicks, 0.652 s apart), then 8ths 0.326 s apart.
  - #415 classical melodic minor in C: up C D E♭ F G A B C, down C B♭ A♭ G F E♭ D C.
- Tuner maths: `yin` on 24 synthetic tones (B0–D4, fundamental at 0.15 under a 0.6 second harmonic, noise, detuned 0, −23 and +17 cents) all within 0.1 cents. Samples were not re-decoded: `web/audio/` is unchanged since 7c4c571.
- Storage:
  - A truncated settings JSON gives the defaults.
  - Wrong types (`strings: 7`, `maxFret: 3`, `bassVol: -5`, `notation: "xx"`, `score: 42`, …) fall back per key.
  - Progress with `tapOn: "yes"`, `lastBpm: "fast"`, `cleared: 5`, `bests: "x"` and option values that no longer exist opens every screen with no errors.
- Bad routes fall back to the defaults with no errors: `game-ear-notes?frets=99&string=Q`, `fb-position-notes?zone=-3` and `zone=99`, `rd-upper?pos=99`, `fb-find-note?range=999`, `sc-one-string?string=C` on a 4-string, `tn-bourree?part=99`, `game-theory?ask=zzz`.
- Memory, 80 cycles of open, play a tap set or loop, answer, leave, on four area exercises:
  - DOM 270 elements throughout, 0 animations, localStorage flat at 30,562 B.
  - Heap 20.8 → 21.7 MB, with the harness holding a reference to all 49 Players.
- Code review of the round-24 changes (`setMastered(…, keep)`, `lineFingers`, `onlyLost`, `LABEL_VALUES` with 'hide' kept per exercise, the test-click bus at least at the default level, the counted dots, the search's `head`): nothing beyond m2.
