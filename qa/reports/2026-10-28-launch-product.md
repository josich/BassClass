# Launch product review · 2026-10-28 (commits 267b86f → a14a09a)

**The question:** what BassClass still needs, as a product, to launch on Google Play and keep its first players.

**Setup:**
- Commit tested: a14a09a, "Free to try: the first two lessons of each Pro stage". It landed while I worked; the coordinator's message asked me to judge it.
- Server and tab: my own `qauser` server (port 8890), in my own tab. I never touched 8765.
- Profile: a clean `bassclass.*` profile, then Pro gates **On (as on Play)**, Pro not owned.
- Sizes:
  - 800×380 landscape (main).
  - 390×844 portrait. The Android app is locked to landscape, so portrait only matters on the web.
  - Text scaled ×1.3 and ×2.0 to mimic Android's font-size setting.
- Personas, the first ten minutes of each:
  - A beginner.
  - An intermediate player who uses "My level".
  - A player who only wants the Practice room.
- Bugs already in `qa/reports/267b86f-user.md` are not repeated. Where a product point builds on one, I cite it, for example "QA C6".

**Prices and policies:** checked on the web on 2026-10-28, with sources at the end. Several competitors do not publish prices, so some figures come from aggregators and are marked as such.

---

## Verdict in brief

BassClass is already more complete than most paid bass apps on Play:
- A real course, placement, a daily plan, spaced reviews, a practice log, an offline practice room with recorded drums, and an honest one-time Pro.
- The free tier is generous by any standard.

Four things stand between it and a good launch:

1. **Placement is broken for every new install.** Answering "All yes" to Stages 1–6 in "My level" leaves the player at **L3, with Continue on the Stage 3 test** (details in A1). Every intermediate and advanced player who installs on launch day is affected. Free players placed high never meet the Stage 4–6 tasters or the Pro row. This is the most important finding and an S fix.
2. **The app never asks about the player's bass.** A 5-string or left-handed player gets a 4-string, right-handed neck until they find Settings.
3. **Nothing brings a player back** once the app is closed: no account, no e-mail, no notification. The in-app loop is strong; the out-of-app loop is missing.
4. **The six Pro tasters are the least persuasive lessons in Stages 4–6.** They are technique and all-keys drills, and four of them play with no Backing. Keep the first lesson of each stage and swap the second for the stage's signature musical lesson.

The rest is listing work (drafted below in full) and a short accessibility and crash-safety pass.

---

## 1. First run and activation

### What a new player sees

| | |
|---|---|
| Home (800×380) | Practice card "0′ of 30′, Play an exercise or the Practice room to start" · **My level "?"** · Course **▶ Start · Lesson 1.1 · Holding and tuning the bass** · Today's session (2 warm-ups + 7 practice rows) · Favourites (empty state). No onboarding, no questions. |
| Defaults | 4-string, right-handed, letter names (C D E). The bass, hand and note names are only in Settings. |
| Orientation | The Android app is landscape-only (`sensorLandscape`). The web shows "Turn your phone sideways" only inside exercises. |

### Time to the first sound and the first win

| Persona | First sound | First win |
|---|---|---|
| **Beginner** | **2 taps**: Home ▶ Start → lesson page ▶ Hear it (about 10 s). Or 3 taps to play the step. | **Lesson 1.1 complete**, about 1.5–3 min. The step opens at 50 BPM and its goal is 66: the player must raise the tempo by 16, play a full loop (about 12 s), then tick ✓ Clean. A tip explains it; then the toast "Goal reached!", the toast "Lesson 1.1 complete ✓", and on the lesson page "✓ Complete · Next review tomorrow" with **Next: Lesson 1.2**. Clear, but quiet: two toasts. |
| **Intermediate ("My level")** | About 6 taps and 1–2 min. My level holds **39 statements on about 7 screens** (2,757 px at 380 px tall). "All yes" per stage makes it quick. | Should be "placed at my level". **Broken today** (A1): every answer above Stage 3 lands on L3 and the Stage 3 test. |
| **Practice room only** | **1 tap** (Start), and the metronome clicks. Drums are Off by default: scroll to Drums → On → Start. | Drums with a groove in about 4 taps. The free patterns (3 per genre) are scattered among 13 gold-edged Pro cards (Rock: positions 1, 3 and 10 of 16). |

### Findings

**A1. My level places nobody above Stage 3 (MUST, S)**
- **Steps:** a clean profile → My level → "All yes" on Stage 6 (this also says yes to every earlier stage) → See my starting point.
- **What happens:**
  - The toast reads "Start here: Stage test: Harmony on the neck".
  - Home shows **L3**, and Continue offers the **Stage 3 test**.
  - The same happens for "All yes" on Stage 4 or 5. I checked all three; the store holds 37 known units.
- **Cause:**
  - A stage test counts as known only when every unit of its stage is known (`isKnown` in `course/progress.js`).
  - `u-pent3` and `u-pent4` ("Pentatonic colours…") have no placement statement (`PLACEMENT` in `ui/course.js`), so they never become known.
  - Their `added` exception (`state.placed < u.added`) only covers placements made *before* 1793180000000. Every new install places after that date.
  - So the Stage 3 test is never known, and `firstGap()` stops there for good.
- **Relation to QA C6:** C6 saw the open unit. The product consequence is bigger than it looked:
  - Every advanced player is told they are Level 3.
  - Their session is Stage 3 test material.
  - A free player placed high never meets the new Stage 4–6 tasters or the locked "Stages 4–6" row, which is the main Pro moment for experienced players.
- **Fix:**
  - Add the two placement lines QA C6 proposed.
  - Add a self-test: "All yes on every stage → `firstGap()` is null", so a unit added without a placement line fails the test, not the players.
- **Launch note:** at launch every player is new, so the `added` dates of units and lessons protect nobody. When the numbers are frozen (LAUNCH-TODO), consider dropping `added` on everything shipped before the launch.

**A2. Ask about the bass once (MUST, S)**
- This is the only onboarding the app needs. Today a 5-string player sees a 4-string neck, and a left-handed player sees a right-handed one, until they open Settings. Nothing on Home says those settings exist.
- One of the app's selling points, "fingering for 4, 5 and 6 strings", is invisible on day 1.
- **Proposed minimum:** a card at the top of Home on the first start only. No wizard, no new screen.
  - "**Your bass:** [4] [5] [6] strings · [Right-handed] [Left-handed]"
  - "[▶ New to bass: start Lesson 1.1] [I already play: find my level]"
- It goes once answered, or once the first exercise is played. The same choices stay in Settings.
- It also settles the "which Start?" question for a new player (two Starts on Home, a 2026-10-21 decision I am not reopening), without changing Home.
- Note names (Do Re Mi) and the daily goal can stay in Settings: the defaults are fine for most players.

**A3. Day 1's session begins with fretboard drills (SHOULD, S)**
- A brand-new player's 30′ plan opens with the warm-ups "**Landmark frets: 3, 5, 7, 9, 12**" and "**Natural notes on one string**", before Lesson 1.1 has taught them to hold the bass.
- **Why:** warm-ups may not use the next four lessons' exercises, so they come from the Level 1 Library.
- **Fix:** no warm-ups until the first unit is done (or until the first session is ticked ✓ Practised).
- QA Q1, the repeated "Open strings" rows, is the same first-day impression. Fix both together.

**A4. Let the very first step pass on its first loop (SHOULD, S, data only)**
- Lesson 1.1's step opens at 50 BPM with a goal of 66. A player on their first minute with a bass must find the tempo control before anything counts.
- Set that one step's `from` equal to its `goal`, so the first full loop is the first win. Later steps keep their climb.

**A5. Lesson 1.1 is three paragraphs of text about posture (AFTER LAUNCH, M)**
- Every competitor teaches posture on video. Two or three drawn diagrams in Unit 1 would do in this app's style: sitting and standing, the plucking hand, the fretting thumb.
- The listing must not suggest video lessons.

---

## 2. Retention

### What the app already has

| Lever | What it does | Verdict |
|---|---|---|
| Practice log | A ring for today against the daily goal, the 7 days with gold bars, the days practised, 🔥 streak from 2 | Strong. It is Home's headline. |
| Today's session | A teacher's 15–60′ plan: warm-ups, due reviews, next steps, a rotating focus topic | Strong. It is the habit engine. |
| Spaced reviews | Lessons come back at 1, 3, 7, 21 and 60 days | Strong, and rare in this category. |
| Mastery and course | ✓ mastered everywhere, checkpoints, stage tests, "My level" | Strong. |
| "New" chips | Content an update adds is marked until used | Good for re-engagement after updates. QA I2: on Pro items they never clear for free players. |
| Rate reminder | At 10 h and 20 h of play, at the end of something | Too late for launch (R2). |
| Backup | A file in Settings | Good. A safety net for phone changes is still needed (R3). |

### What is missing

**R1. A practice reminder, as a local notification (SHOULD, M)**
- With no account and no e-mail, a notification is the only way to bring back a player who closed the app.
- The log and the streak only work for players who open the app; most of a cohort's day-7 loss is people who simply forget.
- **Keep it within the simplicity rule:**
  - One line in Settings: "Daily reminder: Off / 18:00".
  - Offered **once**, after the first day practised: "Remind me tomorrow at this time?" Android 13+'s notification permission is asked only then.
  - At most one notification a day, skipped when today's goal is already met.
  - The text names what is next, from data the app has: "Lesson 1.4 is next · 3 days in a row".
  - No server: WorkManager or an inexact alarm, plus a boot receiver.
- **Not a Must:** the app works without it. But the closed test (12 testers × 14 days) is the right place to try it, so build it before then.

**R2. Ask for the first rating earlier (SHOULD, S)**
- **The problem:** at launch the listing has 0 ratings, and the first 20–50 decide whether strangers install. Most installs never log 10 hours, so the current reminder reaches few players in the first weeks.
- **Proposal:**
  - Add one earlier ask at a high point: the first checkpoint passed, or the 3rd day practised with 2 h or more logged, whichever comes first.
  - Keep 10 h and 20 h as they are.
  - Keep Google's rules: no filtering, the Play card in the app. Play's own quota limits how often its card shows anyway.

**R3. Prove that progress survives a phone change (MUST, S, a test, no code)**
- With no account, losing progress is the one-star review that writes itself.
- **Already in place:** Android's Auto Backup is on (`allowBackup`), and it should carry the WebView's storage.
- **Test on the internal track:** practise, then on a second phone with the same Google account install from Play.
  - Do the log, the course and the settings come back?
  - Does Pro come back through Play?
- If the WebView's storage is not restored, add a once-only nudge after 7 days practised: "Save a backup?"

**R4. Not needed:** streak freezes, badges, leaderboards, weekly e-mails. They add clutter and need accounts.

**R5. A stage-complete moment (AFTER LAUNCH, S)**
- Passing a stage test today ends with the same toast as any step.
- A one-time card listing the stage's "I can" lines, which already exist in the data, would mark the biggest wins: "Stage 2 complete: you can now…".

---

## 3. Monetisation

### The split as it stands (a14a09a)

| | Free | Pro |
|---|---|---|
| Library | Levels 1–3: **111 of 231** exercises (48%), including 15 of the 30 song-style studies | Levels 4–6: 120 exercises |
| Course | Stages 1–3 (93 lessons) + **2 lessons of each later stage** (6) | The other Stage 4–6 lessons |
| Practice room | Whole metronome, Neck, drone, **39 of 124** drum patterns, Pop & rock + Blues + My progression with ✎ Edit, Pad / E-piano / Arpeggio | 85 patterns, the fills, the other progressions, Piano / Organ / Guitar |
| Always free | Tuner, log, session, reviews, backup | |

**Assessment:** this is generous, which is right. It keeps the reviews kind and meets "free means usable".

**The consequence for revenue:**
- A beginner can practise for months without meeting a gate. Reaching Stage 4 takes about 93 lessons, realistically 3–6 months, and most beginners churn before that.
- So Pro will mostly be bought by two groups:
  - **(a) Experienced players placed at Stage 4 or above.** Today they are all sent to Stage 3 (A1).
  - **(b) Practice-room regulars** who want more drums, progressions or sounds.
- Both conversion paths deserve polish before the launch. The beginner's path will convert late, whatever we do.

### The six tasters (the owner's update): good mechanics, weak sample

The new free lessons are:
- Stage 4: Stretching towards the nut, Endurance 16ths
- Stage 5: Permutations across the strings, Thumb, index and middle
- Stage 6: Odd groupings in 16ths, Alternating 3rds in all keys

**What is right about them:**
- They are the stage's first lessons, so Continue and the session lead into them without jumping around the map.
- A free player placed high gets warm-up material at their level.
- `free: true` in the stage files makes any later change a data edit.

**Why they sell Pro poorly:**
- **They are the stage's gym, not its music.** Four are technique drills, and technique drills play with **no Backing** ("No backing in technique drills"). The other two are all-keys scale drills. None shows what the stage is for:
  - walking and soul grooves (Stage 4);
  - jazz language, licks and solo devices (Stage 5);
  - chordal bass and Coltrane changes (Stage 6).
- **They look like Stage 3 again.** A Stage 3 graduate has just played legato, string skips, Simandl and accent shifting.
- **The demo is the hook.** A taster's "Hear it" is what makes a player want the level. A demo of endurance 16ths on roots does not.

**Recommendation (S, data plus one Continue rule):** keep each stage's **first** lesson for the flow, and make the **second** taster the stage's signature lesson:

| Stage | Keep | Replace the second with | Why it sells |
|---|---|---|---|
| 4 · The whole neck | Stretching towards the nut | **Walking with approach notes** (`walk-approach`; alternative: **Soul and neo-soul**, `soul`) | Walking bass is the skill intermediate players search for most. It follows Stage 3's free "Walking with chord tones" and plays over the chords. |
| 5 · Jazz language | Permutations across the strings | **Licks on the ii–V–I** (`licks-251`) | It is the stage's name made audible: original licks over the changes with Backing. |
| 6 · Mastery | Odd groupings in 16ths | **Chordal bass: R-5-10 and R-7-10** (`chordal`; alternative: **Giant Steps arpeggios**, whose name carries the stage) | It sounds like a finished piece on the first listen. |

**What this needs:**
- When Continue stops at a stage's first Pro lesson, it offers that stage's other free lesson: "Try free: Walking with approach notes". The map's "Free" chip already marks it.
- Optional, one flag each: one song-style study per Pro level free in the Library (`free: true` on the exercise). For example the Level 4 disco-octaves study and the Level 5 soul study. The study cards are the Library's strongest hook.

**One flow to check:** a taster step's exercise stays Pro in the Library. A player who stars it from inside the lesson gets a locked favourite on Home. Hide ☆ in a taster step, or let that favourite open the lesson step.

### The Pro sheet

It works well:
- It opens only on a tap.
- It says why ("Ride 8ths is part of BassClass Pro: three patterns of each genre are free").
- Its contents are counted from the data, and the one free line holds all of the above.
- It shows "one payment, yours for good", Restore, and Buy kept in view.

Two suggestions:
- **M1. Name skills before counts (SHOULD, S).** "🎓 Levels 4–6: walking bass, slap, jazz licks, sweeps and tapping · 88 lessons, 120 exercises" sells better than counts alone.
- **M2. In the picker, show a free player's playable cards first (SHOULD, S).** A genre now reads as a wall of 13 gold edges with 3 playable cards scattered among them. Sort free cards first while the gates are on and Pro is not owned. Nothing else changes.

### Hear before you buy (AFTER LAUNCH, M)

- A tap on a locked drum pattern or sound could play 2 bars of it under the Pro sheet.
- This is the strongest converter for audio content, and the opposite of a wall in the middle of practising.

### Price against the market

| Product | Model | Price (2026, see sources) |
|---|---|---|
| Yousician (guitar, bass, piano, ukulele, voice) | Subscription | Official page not public. Aggregators: Premium about $90–120 a year, Premium+ about $120–180 a year. |
| Fender Play (guitar, bass, ukulele) | Subscription, trial | Aggregators: from $9.99 a month. Guitar.com: £19.49 a month or £144.99 a year (UK, undated). |
| BassBuzz "Beginner to Badass" (web, video) | One-time | **€185**, or a pay plan; 180-day guarantee (official page, fetched today). |
| Scott's Bass Lessons (web, video) | Membership | $199 a year (official page, possibly older); lifetime offers $697–$897. |
| Fretboard trainers on Play | One-time | About $1–5. |
| **BassClass Pro** | **One-time** | **€7.99 (launch €4.99)** |

**Assessment:**
- €7.99 one-time is very cheap against the courses and the subscriptions. It is right for a first launch with no audience, no video and no listening feature: BassClass competes as *a course plus a practice tool*, where €5–15 one-time is the norm.
- "No subscription" is the strongest line in the listing. Many reviews of the subscription apps complain about the subscriptions.

**Recommendation:**
- **Keep €7.99.** Use the €4.99 launch price only if it is a real Play price for a fixed few weeks: either a discount offer on the one-time product (some of these features are still in Google's Early Access Program, per its help page), or the product priced at €4.99 and then raised.
- Never put the price or "launch" in the title, icon or screenshots (Play's metadata policy).
- **Plan the next step now:** €9.99 when the reading course (roadmap phase 3) ships. "Everything we add later is part of Pro" makes each content drop a fair reason to raise the price, and early buyers feel rewarded.
- Use Play's local pricing templates (purchasing-power prices for BR, MX, IN, TR…) rather than plain currency conversion.
- **Tips** (€2, €4): fine where they are, in Settings after Pro. No change.

---

## 4. Store listing

### Title (30 characters at most)

| Option | Characters | Note |
|---|---|---|
| **BassClass: Bass Guitar Lessons** | 30 | **Recommended.** It holds the highest-volume query, "bass guitar lessons", and the brand. |
| BassClass: Learn Bass Guitar | 28 | "learn bass" is the second-largest query. |

Title rules: no "free", "best", "#1", price, emoji or capitals for emphasis.

### Short description (80 characters at most)

| Option | Characters |
|---|---|
| **Learn bass guitar: a guided course, 200+ exercises, drum grooves and a tuner.** | 77 · recommended: keywords up front |
| Bass lessons on the neck, 200+ exercises, drums and a tuner. No subscription. | 77 · leads with the pay-once difference |
| From your first note to walking bass and slap: lessons, drums, tuner, offline. | 78 · leads with the journey |

Use "200+" and "over 180" rather than exact counts, so the listing does not go stale with every update.

### Full description (3,023 characters; the limit is 4,000)

Sections in capitals with bullets, the way Play renders them. Edit freely: the brackets of the structure are **Learn / Look up / Practise / Also / Free and Pro / Good to know**.

```
BassClass teaches bass guitar the way a good teacher does: one step at a time, with every note shown on the neck as a recorded bass plays it. Start from your first open string, or tell the app what you already play and start at your own level.

★ LEARN: A GUIDED COURSE
• 6 stages and over 180 short lessons, from holding the bass to walking lines, slap and jazz harmony
• Every lesson has one idea, a short explanation, a demo you can hear, practice steps with a goal tempo, and the mistakes to watch out for
• Checkpoints, stage tests and spaced reviews, so what you learn stays learned
• Already play? "My level" asks what you can do and finds your starting point
• Today's session: a 15 to 60 minute practice plan for your level, with warm-ups, reviews and your next steps

★ LOOK UP: 200+ BASS EXERCISES
• Technique, rhythm, the notes on the neck, reading, intervals, ear training, scales, modes, triads, arpeggios, harmony, grooves, walking bass, licks and slap, in six levels
• Any key, or all 12 keys in a row
• Watch each note light up on the fretboard, with its name, its degree in the chord or the finger to use
• Tab or real bass-clef notation, written the way a music teacher would write it
• Fingerings for 4, 5 and 6-string basses, right or left-handed
• 30 original bass lines in famous styles, from rock riffs and disco octaves to funk, slap and fusion

★ PRACTISE: THE PRACTICE ROOM
• A metronome from 1 to 660 BPM, with accents, odd-metre groupings, subdivisions, muted bars, a speed-up trainer and tap tempo
• 124 drum grooves in 13 styles, from rock and funk to jazz, Latin, reggae and odd metres, played on recorded drum kits
• A drone or a chord progression to jam over, in any key, or write your own
• The neck shows the scale or the chord that fits each chord as it goes by

★ ALSO INSIDE
• A chromatic tuner that hears down to a 5-string's low B
• A practice log with a daily goal, the last days at a glance and your streak
• Favourites, and a backup of all your progress to a file you keep
• Works offline. No account, no ads, no tracking.

★ FREE, AND PRO WHEN YOU WANT MORE
Free for good: Levels 1 to 3 of the course and the exercises, the first lessons of every later stage, the tuner, the whole metronome and the Practice room's starter set (three drum grooves of each style, the pop, rock and blues progressions, your own progression, the drone and the neck).

BassClass Pro is one payment, yours for good. No subscription. It opens Levels 4 to 6 (walking bass, slap, jazz licks and harmony, sweeps and tapping), every drum groove and the fills, every progression, and the piano, organ and guitar sounds. Everything we add later is part of Pro too.

★ GOOD TO KNOW
• BassClass is in English. Note names can be C D E or Do Re Mi.
• It runs in landscape: the neck needs the width.
• BassClass shows you what to play and keeps the time. It does not listen to your playing (the tuner does): when a step felt clean, you tick it yourself.

Questions and ideas are welcome: polyorbit.app@gmail.com
```

**Notes on the text:**
- **"It does not listen to your playing"** is deliberate. Players coming from Yousician expect the app to hear them. Saying so up front avoids the one-star "it doesn't hear me" review and sets the app apart honestly.
- **No song, artist, teacher or competitor names** anywhere in the listing:
  - Play's metadata and impersonation rules.
  - The owner's own rule for the pentatonic studies' source.
  - The README's "Grounded in…" list must not be copied here.
  - "Famous styles" carries the idea.
- If the tasters change to mid-stage lessons, change "the first lessons of every later stage" to "two lessons of every later stage, to try them".
- About 950 characters are left for a short "Who it is for" paragraph (beginners, returning players, jazz and funk players, teachers), if the owner wants one.

**First release notes (500 characters at most):** "BassClass is now on Google Play: a guided bass course from your first note to jazz, 200+ exercises in every key, and a practice room with drums and chords. Free to start; Pro is one payment, no subscription."

### Keywords for ASO

Play has no keyword field. It reads the title, the short description and the full description, so these phrases should appear naturally, two to four times each, never as a list. Play penalises keyword stuffing.

- **Core:** bass guitar lessons · learn bass · bass guitar · bass lessons · bass practice · bass exercises
- **Skills:** walking bass · slap bass · funk bass · jazz bass · bass scales · arpeggios · modes · bass tab · reading bass clef · ear training · music theory for bass
- **Tools:** bass tuner · metronome · drum beats / drum grooves · backing chords · fretboard trainer · learn the fretboard
- **Segments:** 5 string bass · 6 string bass · left handed bass · beginner bass · offline

### Category

**Education** (primary), as the main lesson apps are listed (Similarweb lists Yousician under Education). BassClass's centre is a course; Music & Audio is crowded with players, tuners and streaming. Pick Play's tags closest to music lessons and musical instruments.

Two more fields:
- **Content rating:** everyone.
- **Target audience:** 13+, as in LAUNCH-TODO.

### Screenshots (8, landscape 1920×1080, the app's real UI, short captions)

**Set-up for every shot:**
- Pro **owned**, so the shots carry no lock clutter. The listing's "Contains in-app purchases" label and the description say what Pro is.
- A lived-in profile: a 5-day streak, a few mastered exercises.
- Degree labels and Reveal "Shape" for colour.
- No prices, "free", "#1" or "new" in the captions or the feature graphic.
- The first three shots decide most installs.

| # | Screen and state | Caption |
|---|---|---|
| 1 | **An exercise playing**: Walking with chord tones (`wk-chord-tones`, Level 3), key F, Backing on Chords, degree labels, mid-bar with the next-note arc, tab strip showing Fmaj7 Dm7 Gm7 C7 | **See every note. Hear it played.** |
| 2 | **Home**: practice card with the ring at 24′/30′, gold bars, "🔥 5", L3 tile, Course "Continue" with a named lesson, Today's session with some rows ticked | **A practice plan for every day** |
| 3 | **Practice room**: Drums on (a funk or soul pattern), Harmony Chords (a blues or pop progression), chips lit mid-progression, the Neck following "🎹 D7 · Mixolydian…", Start floating in its peach "Stop" state | **Jam with drums and chords** |
| 4 | **A lesson page** (a Stage 2 lesson, Read more open, 2–3 steps with 🎯 goals, one ticked) | **A guided course, step by step** |
| 5 | **Staff view**: a reading or groove exercise in notation (`rd-melodies`, or a funk groove with ghost notes and 16ths beamed) | **Tab or real bass-clef notation** |
| 6 | **The drum picker**: genre chips and cards, a few ★ favourites | **124 drum grooves in 13 styles** |
| 7 | **Library** at Level 3 open, mastered ticks, 🎯 goals, the L1–L6 bar | **200+ exercises, every key** |
| 8 | **Tuner** on a 5-string, the needle near 0 on B0 | **4, 5 and 6 strings, right or left-handed** |

**Feature graphic (1024×500):** the clef icon, the wordmark "BassClass", and a strip of the neck with a few coloured degree markers. No claims and no price.

**Promo video (SHOULD, S–M):** a 30–45 s screen recording with the app's own sound, no voice.
- Lesson demo → exercise → Practice room with drums.
- Screenshots are silent, and the recorded bass and drums are the selling point.
- It must be on YouTube.

### Still needed for the listing (already in LAUNCH-TODO)

- A public privacy-policy URL.
- The Data safety form.
- The content rating questionnaire.
- The contact e-mail (decided).
- EU trader details.

**Two checks to add:**
- **Data safety and Play Billing:** Google's own page on what the Billing Library requires was not found today. Third-party guides say to declare purchase history. Read Google's Data safety help when filling the form, so "no data collected" stays true where it is true.
- **The name:** no other "BassClass" app turned up in a quick search. Run a trademark search (EUIPO, USPTO) before the name goes on a paid listing.

---

## 5. Quality bar for a paid launch

### Accessibility

**TalkBack labels: good.**
- A script over Home, Library, Practice room, Tuner, Settings, About, the course map and an exercise found **no unnamed buttons or links**. Icon buttons carry `aria-label`s ("Play / pause (space)", "Back to start", "Add to favourites"…).
- **Tuner:** the A4 `−` and `+` buttons have no label, so TalkBack says "minus" and "plus". Name them "Lower A4" and "Raise A4". S.
- **Map rows:** they start with status glyphs (✓ ○) that TalkBack reads as symbols. An `aria-label` per row ("1.1 Holding and tuning the bass, known") would fix it. S.

**Contrast:**
- The palette passes, except **`--dim` (#6b7199)**: 3.84:1 on the page, 3.48 on cards, 3.09 on raised cards and 2.64 on the darkest chips.
- `--dim` is used for:
  - **the titles of locked Pro items** (the things we want players to read);
  - fret numbers;
  - the log's day letters;
  - the "BPM" label;
  - the map's status column.
- **Fix:** **#868db8** keeps the "greyed" look and gives 5.6 / 5.1 / 4.5 on page / panel / panel-2. S.

**Touch targets:**
- Most controls are 32–38 CSS px:
  - ⓘ 32×32;
  - the session-length chips 35–37×32;
  - the room's steppers 34×34;
  - the exercise's transport 38×38.
- The **beat lights are 22×22**.
- Play's pre-launch report (Accessibility) will flag anything under 48 dp. The layout cannot grow at 380 px tall, but hit areas can, invisibly (padding or `::after`). Start with the beat lights and the ⓘ buttons. S.

**Large font:**
- Android's font size probably reaches the WebView's `textZoom` (one community report says so; Chromium's docs say font scale comes only from TextZoom). Verify on a phone at "Largest".
- **Emulated results:**
  - At **×1.3**, Home and the exercise hold.
  - At **×2.0**, the exercise squeezes the neck into a thin strip, truncates the title, overlaps the tab labels and clips the subdivision menu.
- **Fix (MUST, S, after checking on a phone):** cap `settings.textZoom` at about 130 in `MainActivity`.

**Zoom:** `user-scalable=no` blocks pinch zoom. That is normal in an app; Android's system magnification still works.

### Orientation and screens

- **Android: landscape only.**
  - The listing must say so (done in the draft).
  - Take landscape screenshots.
- **Tablets:**
  - The manifest opts out of Android 16's large-screen resizing (`PROPERTY_COMPAT_ALLOW_RESTRICTED_RESIZABILITY`). That opt-out exists only for API 36.
  - When Play's yearly target-API rule moves to API 37 (check the date), tablets will ignore the landscape lock.
  - Plan a resizable layout before then. AFTER LAUNCH, M–L.

### Crashes and errors (no analytics, so build the minimum)

- **C1. Renderer crash handling (MUST, S).**
  - `MainActivity` has no `onRenderProcessGone`.
  - A WebView renderer crash (likely on low-memory phones, with about 11 MB of audio decoded) closes the app and counts in Android vitals' crash rate, which affects Play visibility.
  - Recreate the WebView and reload Home.
- **C2. A local error log in Feedback (MUST, S).**
  - JavaScript errors never reach Android vitals or the owner.
  - Keep the last 20 `error` and `unhandledrejection` messages in a `bassclass-dev.*` key, outside backups.
  - Add them to the foot of the Feedback e-mail, which the player sees before pressing Send.
  - This respects "nothing sent anywhere", and turns "it froze" e-mails into fixable reports.
- **C3.** Read the **pre-launch report** of the closed track. Robo crawls the app on real devices and flags crashes, accessibility and performance.
- **Seen today:** the screens I visited logged **no console errors**.

### Empty states

All covered:
- Home's log: "Play an exercise or the Practice room to start".
- Favourites: "No favourites yet · Tap ☆ on any exercise to pin it here".
- Library search: "Nothing found.".
- An unknown exercise number: a toast.

### Offline

- The APK has **no INTERNET permission**, and everything (bass, drums, piano) is inside. Purchases and the review card go through the Play Store app; Feedback goes through the mail app.
- Offline first launch, offline practice and offline drums all work by design. This is a real selling point (rehearsal rooms, flights), and it is in the listing draft.
- **One behaviour to know:**
  - `onPause` pauses the WebView, so the metronome and drums stop when the player switches to another app (a YouTube video, a backing track).
  - The screen stays on while the app is open (`FLAG_KEEP_SCREEN_ON`).
  - Fine for launch. Mention it in a future FAQ if players ask.

### English only

- Fine for launch.
- **Already in the app:** Do Re Mi note names help in Spanish, French, Italian and Portuguese markets.
- **After launch, S each:** store listings translated into Spanish first (the owner's language), then German, French and Portuguese (Brazil). Each says "The app is in English" in its first lines, so nobody installs expecting their language.
- **Translating the app is L** (lessons, tips and options are thousands of strings). Only after the listing translations show demand.

---

## Not repeated here (already in QA round 20)

Several QA round-20 items affect what the first players see and are worth doing before launch:
- **W1:** spelling in the new progressions.
- **C4:** "○ ✓ Checkpoint".
- **C6:** the placement lines. A1 above makes this urgent.
- **I2:** "New" stays on Pro items.
- **T1:** "42" in the search hint.
- **V1:** long picker names overflow.

The owner picks from that report as usual.

## Sources

- BassBuzz price and guarantee (official page, fetched 2026-10-28): https://www.bassbuzz.com/lessons/beginner
- Yousician:
  - Plans: https://account.yousician.com/plans
  - Aggregators: https://subger.com/en/service/yousician, https://www.guitarchalk.com/yousician-cost/, https://www.softwr.com/pricing/yousician
  - Category: https://similarweb.com/tr/app/google/com.yousician.yousician
- Fender Play: https://subger.com/en/service/fender-play, https://guitar.com/news/music-news/fender-play-samsung-tv/, https://apppricinglab.com/iap/apple/1226057939
- Scott's Bass Lessons: https://learnbass.scottsbasslessons.com/p/26-week-technique-accelerator, https://join.scottsbasslessons.com/lifetime
- Play one-time products and discount offers: https://support.google.com/googleplay/android-developer/answer/16430488, https://community.revenuecat.com/sdks-51/re-progress-on-one-time-product-discounts-on-the-play-store-7811
- Play metadata policy (title rules, testimonials): https://support.google.com/googleplay/android-developer/answer/9898842
- Play closed testing (12 testers, 14 days; third-party summaries, check in the Console): https://extendsclass.com/blog/google-plays-closed-testing-requirement-what-developers-need-to-know-in-2026
- Play screenshot specs (third-party, check in the Console): https://appradar.com/blog/android-app-screenshot-sizes-and-guidelines-for-google-play
- WebView text zoom: https://chromium.googlesource.com/chromium/src/+/HEAD/android_webview/docs/web-page-layout.md, https://forum.obsidian.md/t/android-latex-with-different-system-font-size/105362
- Play Billing Library v8 deadline: https://developer.android.com/google/play/billing/query-purchase-history
