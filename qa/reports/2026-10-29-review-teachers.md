# Teachers' review · 2026-10-29 (commit 39bca42)

**The question:** what is missing before bass teachers adopt BassClass, recommend it, and use it in lessons and for
homework. The gaps come first. The "already strong" list is short and is there only to keep the gaps in proportion.

**Who reviewed it.** Three working teachers:
- **(P) Private teacher.** 25 weekly students aged 8 to 60, one-to-one lessons, homework every week.
- **(A) Music-school teacher.** Group classes of 4 to 6 students and graded-exam preparation.
- **(S) Secondary-school teacher.** A class of mixed instruments with a few bassists, a projector or interactive
  whiteboard, and school rules on privacy and children.

**How:**
- My own server (`qauser`, port 8890), in my own tab. I saved the origin's localStorage at the start and restored it at
  the end (10 keys back, `bassclass-dev.pro` as it was).
- I started from a clean profile, as a new student would.
- Viewports:
  - 800×380 (phone).
  - 1024×768 (a projected tablet or laptop).
  - 1920×1080, measured with scripts, for a classroom projector.
- I looked at the free tier once (debug panel → gates On, Pro not owned), then switched it back.
- I read `CLAUDE.md`, the README, the catalogue, the stage files, `LAUNCH-TODO.md`, the launch product review, `legal.js`,
  the router, the exercise screen, the player, the reading generator, the backup, the practice log and the Android
  manifest and bridge.
- **Not repeated here** (already in `2026-10-28-launch-product.md`): the first-start card, the practice reminder (R1),
  rating asks, the Pro tasters, contrast and touch targets, crashes and the listing. Where a gap builds on one of them,
  I cite it.

---

## Verdict

BassClass is a good tool **for the student**. A teacher would happily use its content:
- correct spelling and notation;
- every exercise in any key, on 4, 5 or 6 strings, left- or right-handed;
- stable exercise and lesson numbers;
- "I can" checkpoints;
- a practice room that gives backing in any key at once.

It has **nothing for the teacher's side of the relationship**:
- **Nothing goes in.** A teacher cannot send a student an exact setup or a week's homework.
- **Nothing comes back.** The student cannot send the teacher what they practised, how fast, or how it sounded.
- **Nothing leaves the app.** No printing, no PDF, no sharing.
- **No classroom view.** The notation stays 67 px tall even on a 1080p projector.
- **Few devices from launch day.** It will run only on Android phones and tablets. The web version stops at launch
  (decided), there is no iOS version, and the privacy policy excludes under-13s. Many of a private teacher's students and
  a school's pupils cannot use it.

The good news: the privacy model is not in the way. Almost every gap below can be closed **without a server, an account
or the internet permission**, using what students already pass around: short codes, links, QR codes, files, and
Android's share sheet and print service. The course's own lesson format (`{ ex, p, sub, from, goal, do }`) is already
the right shape for a teacher's homework.

**Teachers' one-line verdict:**
- (P): "I'd use it in lessons. I can't run homework through it yet, and half my students have iPhones."
- (A): "Great technical-work drills. Nothing I can print, set or check."
- (S): "The room is a ready-made class backing band. I can't project the notation, and I can't recommend it to Year 7."

---

## Must have

### M1. Share an exact setup: exercise + options + tempo, as a code, a link or a QR code
- **Missing.** A teacher can say "do 202" (numbers are stable, good) but cannot send *how* to do it: the pattern,
  the key, the note length, the tempo, or the same reading melody.
- **Evidence:**
  - Changing an option leaves the address at `#/ex/202`. Options are saved per exercise on the device
    (`progress.v1 → params`).
  - The router does accept options in the address (`#/ex/202?pattern=skip&length=quarter` opened with them set), but:
    - this is undocumented;
    - it carries no tempo;
    - the Android manifest has no VIEW intent filter, so no link can open the app;
    - the web version stops at launch.
  - Reading drills are random on every open (`Math.random` in `curriculum/reading.js`, no seed): two students can never
    read the same melody.
  - Favourites store the exercise only (QA round 2, the owner's choice; kept), so they cannot carry a setup either.
- **Why it matters.** "Play this, like this, at this speed" is the basic unit of a teacher's instruction. Without it,
  every assignment is a paragraph of tap-by-tap directions, and students get it wrong.
- **Suggestion (S–M, no server):**
  - A "Share" button in the exercise header gives a **short text code** (e.g. `202-F2-72`: number, option indices,
    tempo, plus a seed for random drills). It can be written on a whiteboard or in a lesson notebook.
  - Beside the code, a **QR code** and a link. Two ways for the link to open the app:
    - an Android App Link on the domain that already hosts the privacy page (`/.well-known/assetlinks.json` on
      josich.github.io), opening the app directly;
    - a custom scheme as a fallback.
  - Without the app, the page shows the setup in words and the Play link. It is static hosting, already disclosed in the
    privacy policy ("GitHub Pages logs visitors' IP addresses").
  - The receiving side: "Enter a code" in the Library search (it already takes numbers), plus the link handler.
  - The exercise opens with the options **preset, as a lesson step is**: the student's own saved options are not
    overwritten.
  - Notes:
    - A QR encoder is a small library: it needs the owner's OK to download, or a few hundred lines of our own.
    - No camera permission is needed: the phone's camera app reads the QR.

### M2. Homework: "teacher lessons" built from exercises and shown in Today's session
- **Missing.** A teacher cannot set homework: a list of 3 to 6 items, each with its options, a start and goal tempo
  and a note. Today's session is planned only by the app.
- **Evidence:**
  - Home has My level, the Course, Today's session and Favourites (`ui/course.js`), with no place for a teacher's list.
  - Exercise goals come only from the course (`goalOf`, `LS.goal`).
  - The best tempo is one number per exercise whatever the options (`bestBpm` in `progress.v1`), so "92 in E♭ on the
    fretted pattern" cannot be checked.
- **Why it matters.** Homework is how a private teacher (P) and an academy (A) run a week. A student who opens the app
  and gets the *app's* plan instead of the teacher's will drift away from the lesson, and the teacher will stop
  recommending the app.
- **Suggestion (M, no server). Reuse the course engine:**
  - A teacher's assignment *is* a lesson: a title, the teacher's note as the idea, and steps in the existing format
    (`ex`, `p`, `sub`, `from`, `goal`, `do`).
  - It travels as a code, link, QR or small file (M1's channel).
  - The student's app shows it:
    - as the existing lesson page ("From your teacher"), with "Hear it", ✓ Clean and per-step best tempos, which the
      course already tracks per step (`stepState(...).best`);
    - as the **first rows of Today's session**, tagged "Homework". This keeps Home's three-blocks rule (2026-10-21):
      no new block.
  - **Teacher side:** "＋ Add to homework" in the exercise's ⋯ menu takes the current options and tempo as `from`. A
    homework screen holds the title, the note, the goal per item and Share.
  - A new assignment replaces the last one. The old one goes into a short history.
  - It never touches course progress, mastery or the student's saved options (as lesson steps don't).
  - Pro items in an assignment show the Pro chip **on the teacher's screen too**, with a "my students use the free
    version" switch that keeps the builder inside Levels 1–3.

### M3. "Send my week to my teacher"
- **Missing.** No summary of what was practised, and no way to send one. The teacher sees the student's week only if the
  student hands over their phone.
- **Evidence:**
  - The practice log stores **minutes per day only** (`bassclass.log.v1`).
  - What was played is scattered: `last` and `bestBpm` per exercise, completion days per lesson, and the session history
    (`HISTORY = 12`, ids only).
  - The Android bridge has `sendMail` (ACTION_SENDTO) but no share sheet (no ACTION_SEND), so WhatsApp and other chat
    apps, where most private teachers talk to students and parents, cannot be reached.
  - A backup file is no substitute: loading one **replaces** every record on the teacher's phone (`restoreBackup`).
- **Why it matters.** The app does not listen (honest, and said in the listing), so the teacher is the check. That only
  works if the teacher sees what was done. Parents paying for lessons also ask.
- **Suggestion (S–M, no server).** A "This week" card (behind the practice card's ⓘ, or under Settings → Progress) that
  writes a short text:
  - minutes per day and the days practised;
  - each homework item with its best tempo, the goal, and whether ✓ Clean was ticked;
  - lessons completed, reviews done, exercises newly mastered.
  - It is sent through **Android's share sheet** (one new bridge method) or copied, and the student sees it before
    sending, as with Feedback.
  - It carries a compact machine-readable line, so a teacher roster (N1) can read it later.
  - Tick marks are labelled as the student's own ("✓ ticked clean").

### M4. Reach: iPhones, laptops and whiteboards
- **Missing.** After launch BassClass runs only on Android.
- **Evidence:**
  - LAUNCH-TODO, "Already decided": "Nobody gets the app outside Google Play after the launch… the web version and the
    GitHub APK stop".
  - There is no iOS project.
  - Today the web version is what a teacher would put on a laptop or interactive whiteboard. At launch that goes, and the
    Android app is landscape-locked and opts out of large-screen resizing.
- **Why it matters (I am raising a decision already taken, knowingly).**
  - A teacher recommends one app to *all* students. With iPhones common among teenagers, "only if you have Android"
    rules it out for many teachers.
  - Classrooms project from laptops and Chromebooks.
  - Exposure: the Play bundle ships the same JavaScript as assets, so turning the web off protects Pro less than it
    seems. The real costs of a web edition are hosting, a second sales channel, and support.
- **Suggestion. In order of size:**
  1. **(S) A teachers' page** that says how to project the Android app today: cast the screen, or use a USB-C to HDMI
     adapter. Add the presentation mode in S2.
  2. **(M, no server) A free "web classroom edition"** on the static host: Levels 1–3 and the room's free set, with Pro
     gates on and no way to buy ("Pro is in the Android app").
     - iPhone students get the free tier.
     - Teachers get a laptop and whiteboard version.
     - Caveat: on Safari, an iPhone that does not install the page to the Home Screen may lose its storage after 7
       days unused. Say "Add to Home Screen" and offer the backup.
  3. **(L) An iOS app.** The same WebView wrapper on WKWebView, with StoreKit for Pro.
     - It needs a Mac or macOS CI runners and Apple's yearly developer fee.
     - It is the only full answer for teachers in markets where teenagers mostly use iPhones.

### M5. Print, or save as PDF: exercise sheets, lesson pages and checklists
- **Missing.** Nothing can be printed or exported.
- **Evidence:**
  - No `window.print`, no print stylesheet, no bridge method for Android's print service.
  - The staff exists only as the scrolling strip.
  - The catalogue is a Markdown file in a repository that goes private at launch.
- **Why it matters.**
  - (A) prepares exam books and class handouts.
  - (S) needs worksheets for the bassists while the class does something else, and paper for a lesson without phones.
  - (P) keeps a folder per student.
  - An app that generates **any scale, arpeggio or groove in any key** is a worksheet generator that teachers would pay
    for. Today that value is locked inside the phone.
- **Suggestion (M, no server, no new permission).** "🖨 Print / PDF" in the exercise's ⋯ menu:
  - **The sheet:** number and title, options, tempo, the whole line in tab and staff in systems (not the strip), the
    neck diagram of the shape, the ⓘ text and tips.
  - **On Android:** `WebView.createPrintDocumentAdapter` through Android's print service, which has "Save as PDF" built
    in.
  - **On the web:** `window.print` with a print stylesheet.
  - **Also:** a lesson page, a unit's checkpoint as an "I can" checklist with tick boxes, and "this key / all 12 keys"
    sheets.
  - Pro content prints only where it is open.

### M6. Children: a decision on under-13s
- **Missing.** BassClass says it is not for under-13s.
- **Evidence:**
  - Privacy policy: "BassClass is for players aged 13 and over and is not directed to children under 13" (`legal.js`).
  - Play target audience 13+ (LAUNCH-TODO 5.1).
- **Why it matters.**
  - (P) teaches 8- to 12-year-olds.
  - (S) has 11- and 12-year-olds in the first years of secondary school.
  - A teacher cannot formally recommend an app to children it excludes, and a school cannot either.
  - The teacher *operating* the app in class is fine. It is the students' own phones that are blocked.
- **Suggestion (decision first; then M, policy more than code).**
  - BassClass already has no ads, no analytics, no accounts, no internet and no user-generated content, so it is an
    unusually good fit for Google Play's Families policy.
  - Check:
    - what that policy needs for in-app purchases and outside links: a parental gate before Buy, Feedback's e-mail and
      the Play links;
    - the e-mail contact exception under US children's privacy law;
    - whether the "Teacher Approved" programme for children's apps applies.
  - If the owner keeps 13+, say so plainly on the teachers' page, so schools know before they plan.

---

## Should have

### S1. Loop a few bars, and a "test me" mode
- **Missing (loop).** The loop is always the whole exercise.
  - Evidence: in `player.js`, `loopBase += total`, and the next pass restarts at `starts[0]`.
  - A tap on the strip starts from that note, but the next pass starts again at bar 1.
- **Missing (test me).** No one-tap mode for playing from memory.
  - Today the student has to know to switch Bass sound off and Reveal to Quiz, keep the count-in and turn Loop off.
- **Why it matters.** "Loop bars 3–4 at 60" is half of what a teacher does with a line (P, A). Playing a scale "from
  memory, one pass, after a count-in" is how exams and lessons check technical work.
- **Suggestion (S–M):**
  - Long-press two bars on the strip to loop them (the loop counts for the bars only, never as a full loop for goals).
  - A "🎓 Test me" switch in ⋯: bass off, Quiz, count-in, one pass, then "How was it? ✓ / again".

### S2. A classroom display: notation and chords big enough to read from the back
- **Missing.**
  - The tab/staff strip is **67 px tall at 800×380, 1024×768 and 1920×1080 alike**; the neck grows to 879 px.
  - Body text is 14 px at any size.
  - In the room, the chord chips are 14 px text in 64×36 px boxes on a 1920 px screen.
  - The Android app caps text zoom at 130%.
- **Why it matters.** (S) and (A) project. Students at the back must read the notes and the chord changes. Today the
  neck is huge and the notation is tiny.
- **Suggestion (S–M):**
  - Let the strip's height follow the window on large screens (a share of the height, not a fixed size).
  - Add a "Notation" layout (staff big, neck small).
  - In the room, a **chord chart view** for a class band: the current chord huge, the next chord, the bar in the form, the
    count-in.
  - Optional (S): chord names for B♭ and E♭ instruments in the chart, for the school band's trumpets, clarinets and
    saxophones.

### S3. Record a take and send it
- **Missing.** No recording.
  - Evidence: the microphone is used only by the tuner. The privacy policy says so in those words: "The microphone is
    used only by the tuner".
- **Why it matters.**
  - The app does not listen, and listening is a strategic "maybe, later" (LAUNCH-TODO Part 9).
  - For a teacher, a 30-second recording over the backing is *better* than a score from an app: the teacher hears time,
    tone and muting.
  - It is also the evidence a school (S) needs for performance assessment.
- **Suggestion (M, no server):**
  - "● Record" in an exercise and in the room: microphone only, with headphones advised (the app knows the backing and
    can mix it in afterwards).
  - The take is saved where the student chooses, or shared through the share sheet (M3's method).
  - **The privacy policy must change:** "and, only when you press Record, to record your playing, saved where you
    choose; we never receive it".

### S4. Find a lesson by number or name
- **Missing.** Lessons cannot be searched.
  - Evidence: the Library search reads exercise titles, summaries, about texts, topics, songs and options. "1.2", "3.15",
    "lesson 1.2" and "checkpoint" all give "Nothing found."
  - Lesson numbers are on the map only.
- **Why it matters.** "Do lesson 3.15" is how teachers will refer to the course. Today the student opens the map, jumps
  to S3 and scrolls.
- **Suggestion (S):**
  - The Library search finds lessons by number and title (a "Lessons" group above the exercises).
  - `#/course/3.15` opens one.

### S5. A teachers' guide: the syllabus, the numbers, the facts for schools
- **Missing.** Nothing tells a teacher what is in the course, in what order, under which numbers, or what each lesson
  aims at.
- **Why it matters.**
  - A teacher maps the app onto their own plan before recommending it (P, A).
  - A school needs a privacy and safeguarding summary before using any app (S).
- **Suggestion (S, static page and PDF, no server).** Generated from the data, as `CATALOGUE.md` is, and hosted beside
  the privacy page:
  - the six stages, their units, lessons and "I can" lines with numbers;
  - the exercise list with numbers and levels;
  - "how to set homework" (after M1/M2);
  - a one-page "BassClass for schools and parents": what is stored, where, no accounts, no ads, no chat, no internet
    permission, the microphone, and the age policy (M6).
  - Graded exams named only generically (the 2026-10-28 rule).
  - Regenerated at each content release.

### S6. Sight-reading and counting closer to lesson and exam use
- **Missing.**
  - The reading melodies are always 4 bars of 4/4, drawn from 8 rhythm cells with **no rests, ties, 16ths, 3/4 or 6/8,
    and no dynamics** (`CELLS`, `melody()` in `reading.js`).
  - They are unseeded (see M1).
  - Nothing shows the counting ("1 e & a", "1 trip-let") under rhythms: the dot labels are note, degree, finger or none.
- **Why it matters.**
  - Graded exams test sight-reading with exactly those features, plus a short look at the music before playing (A).
  - Counting aloud is how every class teaches rhythm (S, P).
- **Suggestion (M):**
  - Reading levels add rests, ties, 3/4 and 6/8, 16ths and dynamics.
  - A "look first" countdown before the count-in (e.g. 30 s, then the dots and the sound go away).
  - The seed in the share code.
  - A "Count" label mode on rhythm, groove and reading exercises.
  - Exam boards stay generic: no grade numbers in the app (2026-10-28 rule). A teacher who wants "Grade 3 sight-reading"
    names their own assignment (M2).

### S7. More than one "My progression", and sharing them
- **Missing.** One progression slot (`myProg`, up to 16 chords).
- **Why it matters.** (S) runs several class songs; (P) has a song per student. The room is already the best backing a
  teacher can get in a lesson. A slot per song, shared to students, makes it homework too.
- **Suggestion (S–M):**
  - A "Mine" group holding several named progressions, through the shared picker. It is built to scale, as CLAUDE.md
    asks.
  - Share a progression with its key, pattern and tempo through M1's code, as a "room setup".

### S8. Several players on one device
- **Missing.** One profile per device.
  - Evidence: every record is a global `bassclass.*` key, and loading a backup replaces them all.
- **Why it matters.** A school's set of tablets, a teacher's demo phone used with many students, siblings sharing a
  tablet.
- **Suggestion (M, no server):**
  - Up to 6 named players, switched from Settings (records namespaced per player).
  - Pro stays the device's, as now.
  - A backup per player.

### S9. Search by the student's problem
- **Missing.** Teachers search by symptom.
  - Evidence:
    - Zero results: "rushing", "posture", "plectrum", "sixteenth", "circle of fifths" and "rhythm reading".
    - "timing" finds only 101 and 209.
  - Muting, ghost notes and stretches search well.
- **Why it matters.** "My student rushes the 8ths / can't mute / loses the pulse when the click stops" is how a lesson
  starts.
- **Suggestion (S):**
  - A synonym list in the search: rushing/dragging/timing → pulse, gap click, subdivisions; plectrum → pick;
    sixteenth → 16th; circle of fifths → cycle; posture → Lesson 1.1.
  - Search the lessons too (S4).
  - This is the Library's search, not the picker's (whose search was removed on 2026-10-27).

### S10. The app in the students' language
- Already in LAUNCH-TODO as a "maybe" after launch; it is not repeated here.
- From the teachers' side:
  - For a Spanish academy or a secondary school, English-only rules out the younger students.
  - Do Re Mi helps, but lesson texts do not translate themselves.
- If the owner pilots Spanish, schools and academies are the audience that would notice first.

---

## Nice to have

| # | What is missing | Why a teacher wants it | Size · server? |
|---|---|---|---|
| N1 | **A teacher's roster.** Reads the students' "This week" reports (M3) into a local list: name, last report, minutes, homework status. | (P) with 25 students: one screen instead of 25 chats. | M–L · no server: the reports arrive as text or files the students send |
| N2 | **Bring your own line.** The teacher types a bass line in the songs' text notation (`E1:dq A1:e:x` over `Em:4 D/F#:4`), or uses a simple editor; it plays on the neck and staff and is shared by code or file. | The class's piece (S), the student's song (P). The app's own studies are "in the style of" only. | L (M with a text box only) · no server. The user's content stays the user's: nothing hosted |
| N3 | **Aural tests:** echo a phrase (the app plays 1–2 bars, the student plays them back, then the answer shows), metre recognition, cadences. | Every graded-exam syllabus has them (A); call-and-response is classroom staple (S). Today: chord qualities, 7ths, progressions and the interval quiz. | M · no server |
| N4 | **Drop D and other tunings** (EADG only; `TUNINGS` keyed by string count). | Rock and metal students (S, P). | M (fingering rules, self-test) · no server |
| N5 | **Private notes per exercise or lesson** ("thumb on the pickup!"). | The teacher writes it on the student's phone in the lesson. | S · no server |
| N6 | **Shorter texts for children** (an "easy words" version of Stage 1). | 8- to 12-year-olds (P), if M6 opens the app to them. | M (writing) · no server |
| N7 | **Teacher-set goals on any exercise.** Covered by M2's steps; listed so it is not lost if M2 is cut. | Exam tempos are the teacher's, not the app's. | S within M2 |

---

## Already strong (short, for proportion)

- **Stable numbers.** Exercise numbers (305) and lesson numbers (3.15) are frozen at launch. A teacher can write them
  in a notebook and they stay true.
- **Trustworthy music.** Academic spelling, real bass-clef engraving an octave up, key signatures, sensible fingering
  on 4, 5 and 6 strings, left-handed. Teachers will not be embarrassed in front of a student.
- **Any key, any variation.** It is generated, not stored. Hence the worksheet potential in M5.
- **A real course.** Each lesson has an idea, mistakes, "Hear it", stepped tempos, "I can" checkpoints, stage tests and
  spaced reviews: a syllabus and a rubric already written.
- **Honest about listening.** The student ticks ✓ Clean. This complements a teacher instead of pretending to replace
  one.
- **Lesson tools.** Bass sound off, count-in, step mode ◀ ▶, a speed trainer, tempos down to 30, and a tap to start
  from any note.
- **The Practice room.** Drums, chords in any key, My progression and the Neck following the chords: an instant backing
  band for a lesson or a class.
- **Privacy.** No account, no tracking, no internet permission. It is the easiest school privacy review there is
  (except the age rule, M6).
- **A generous free tier.** Levels 1–3 cover a beginner's first year or two with a teacher.

---

## Pricing and licensing for teachers and schools

**Keep one product. Do not make a paid "teacher edition".** Every teacher feature above sells Pro *through students*:
each assignment, share and report puts the app on another phone. So:
- **Teacher tools free for everyone:** share codes, homework, reports and printing. Only what they open is gated:
  printing a Level 5 sheet needs Pro, as playing it does.
- **Pro free for teachers.** Use Play promo codes for the one-time product (up to 500 a quarter; check in the Console),
  given on request from a teacher (a school address, a teaching website). MONETIZATION-PLAN already plans promo codes
  for teachers. Make it visible: a line on the teachers' page.

**Students on the free tier.** This works well, and should be said:
- Levels 1–3 are free: 91 lessons (Stages 1–3 on the map today) and 111 exercises, about a year or two of weekly lessons for a beginner.
- The homework builder's "my students use the free version" switch (M2) keeps assignments playable.
- When a student outgrows it, Pro costs less than a set of strings. No discount is needed at €4.99–7.99.
- As far as we know, Play's promo codes give a product away rather than discount it, and one-time products have no
  per-teacher discount codes (check). Do not build a discount system.

**Schools:**
- **Shared tablets on one school Google account.** The terms already say Pro is a licence for "the Android devices where
  you use BassClass with that account". One purchase therefore covers a set of unmanaged school tablets signed into one
  account. Decide whether that is intended, then say it on the teachers' page: it is the simplest school licence there
  is.
- **Managed school devices (managed Google Play, Chromebooks).** Paid apps and in-app purchases are often blocked there
  (check per region). Options, in order of effort:
  1. Promo codes for the school's account.
  2. A **school code**: a licence signed by the developer and checked offline with a public key in the app (WebCrypto,
     no server).
     - It is sold by invoice, outside the app. Check Google Play's payments policy first: access to content bought
       elsewhere is generally allowed if the app does not point to the outside sale.
     - It satisfies the 2026-10-28 rule that a file edit must never open Pro.
  3. The web classroom edition (M4.2) for laptops and whiteboards.
- **What a school asks before buying.** A privacy and safeguarding one-pager (S5), the age policy (M6), whether it works
  without the internet (yes), and an invoice. The last needs the trader details already in LAUNCH-TODO Part 1.

**Price signal.** Against a lesson (€20–40) or an exam book, Pro is trivial. Teachers will not ask for a discount. They
will ask "can all my students use it?", which is a question about reach (M4, M6), not price.

---

## Summary table

| # | Gap | Size | Server? |
|---|---|---|---|
| M1 | Share an exact setup (code, link, QR) | S–M | No (an App Link on the existing static host is optional) |
| M2 | Homework as teacher lessons in Today's session | M | No |
| M3 | "Send my week" through the share sheet | S–M | No |
| M4 | iPhones and classrooms: teachers' page → web classroom edition → iOS | S / M / L | No (static hosting for the web) |
| M5 | Print / PDF sheets, lessons, checklists | M | No |
| M6 | Under-13s: decide; Families policy | M (policy) | No |
| S1 | Loop bars; "Test me" | S–M | No |
| S2 | Classroom display, chord chart | S–M | No |
| S3 | Record a take (privacy text changes) | M | No |
| S4 | Find lessons by number or name | S | No |
| S5 | Teachers' guide and the schools one-pager | S | No |
| S6 | Sight-reading features, seed, counting labels | M | No |
| S7 | Several progressions, shared | S–M | No |
| S8 | Players on one device | M | No |
| S9 | Search by the student's problem | S | No |
| S10 | Language (existing plan) | L | No |
