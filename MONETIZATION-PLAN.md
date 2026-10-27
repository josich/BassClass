# BassClass: plan for monetisation and the Play Store launch

Written 2026-10-27 at the user's request ("launch the app in Play Store and make it freemium with a one-time payment
to unlock features"), following the main points of Polyorbit's MONETIZATION-PLAN.md and its "Before the Play Store
launch" list (GAME-PLAN.md), adapted to BassClass. It is a proposal: the numbered decisions at the end are the user's.
Figures marked "(check)" are the platforms' published terms at the time of writing and must be read again before the
launch; they change.

## The user's decisions (2026-10-27): they replace the proposal where it differs

1. **Levels 1–3 free on every front** (the Library, the Course's Stages 1–3, the song studies), not 1–2; Pro is Levels
   4–6. 2. **The room's extras in Pro**, with **3 drum patterns of each genre** free. 3. **€7.99, launch €4.99**, "yes,
   for now". 4. **Tips**: yes. 5. **The drums and the piano inside the app**: done (no INTERNET permission). 6. **The web
   version and the GitHub APK are not kept after the launch**; the repository may go private (its consequences:
   LAUNCH-TODO.md). 7. Developer name, account and contact: later, listed in LAUNCH-TODO.md. 8. **The Pro gates are
   built now** (pro.js; ready for more Pro content: a `pro: true` or `free: true` flag on any item), off outside the
   Play build, **with a debug panel** for the gates and the purchase. Credits, licences and the legal texts sit in one
   screen under the app's logo (About). Signing: given that the key has been public, LAUNCH-TODO.md now recommends
   Play's own app signing key rather than ours.

## What we are selling, in one sentence

A bass teacher and practice room anyone can use for free, the whole beginner path included, with one payment, once,
that opens the intermediate and advanced levels and the practice room's extras for good. No subscription, no ads, no
account, nothing sent anywhere.

## Ground rules (Polyorbit's, kept)

- **Free means usable, not a demo.** A free player can learn the bass from zero to a solid beginner level, tune, and
  practise with a metronome every day without ever paying.
- **Never a wall in the middle of practising.** A gate sits between levels and lessons, never inside an exercise, a
  lesson or a session. Today's session never offers a Pro item to a free player.
- **Pay once.** A one-time purchase, owned for good, restored on a new phone. Subscriptions are what musicians complain
  about most in music apps; not having one is a selling point.
- **No ads, ever**, not even "watch an ad to unlock".
- **No server, no account, no tracking.** The purchase is checked with Google Play on the phone; the app collects
  nothing (the Data safety form says so).
- **Generous by rule.** Nothing already learned or saved is ever taken away or hidden; progress, the practice log and
  backups stay free; a shared or pirated copy is accepted rather than fought.
- **The Pro sheet opens only when the player taps something that is Pro**, with one line saying why ("Level 3 is part of
  BassClass Pro"). Never on launch, never as a nag.

## What the app has (2026-10-27, v1.0.118)

223 exercise families in 6 levels (21 / 44 / 43 / 43 / 48 / 24), the guided Course in 6 stages (22 / 32 / 36 / 35 / 40 /
18 lessons, 183 in all, with checkpoints, tests and spaced reviews), the placement check (My level), Today's session,
30 song-style studies (Make Music), the Practice room (a 1–660 BPM metronome with accents, subdivisions, muted bars and
speed up; 124 drum patterns in 13 genres with fills; a drone or chord progressions with My progression, in six sounds:
pad, e-piano, recorded grand piano, organ, rock guitar, arpeggio; the Neck), the tuner, the practice log, backup and
restore.

## The line between free and Pro (proposal)

### Free, for good

- **Levels 1 and 2 everywhere**: Course Stages 1–2 in full (54 lessons with their checkpoints and tests), Library Levels
  1–2 (65 exercises, every key and variation), the song studies of Levels 1–2. That is the beginner path, start to end.
- **The placement check** (My level), **Today's session** (built from what the player can open), the **practice log**,
  **backup and restore**, **mastery** and the reviews.
- **The tuner**, in full.
- **The Practice room's core**: the whole metronome (tempo, accents and groupings, subdivisions, muted bars, speed up,
  tap tempo), the Neck, the drone, and a starter set of the rest (below).
- **Settings**, the sound engine, the phone-speaker profile: everything that makes the free part sound as good as Pro.

### Pro, one purchase

- **Levels 3–6**: Course Stages 3–6 (129 lessons: intermediate to advanced, modes, arpeggios across the neck, walking,
  slap, jazz harmony, tapping, sweeps...), Library Levels 3–6 (158 exercises), the song studies of Levels 3–6. This is the
  hand-made heart of the app, the clearest thing a daily player pays for (as Polyorbit's courses).
- **The full drum library**: all 124 patterns and the fills (free: a starter set, say the first two of each genre, 26 in
  all; marked in the data with `free: true`, so new patterns choose their side).
- **The full harmony**: every progression (jazz cycles and Coltrane changes, minor, modal vamps...) and **My
  progression**'s editor (free: the drone, and the Pop & rock and Blues progressions).
- **The extra sounds**: Piano, Organ and Guitar (free: Pad, E-piano, Arpeggio).
- **What comes next is in it**: the reading course (roadmap phase 3) and any new levels, patterns and studies. "Pro
  includes everything we add" is a clear promise and the best review fuel.

A free player placed at Level 3 or above sees "Your starting point is Stage 3: part of BassClass Pro" with the Pro
sheet, and the session keeps working from Levels 1–2 and the room meanwhile. Pro items show a small "Pro" chip (the
Library's levels 3–6, the course map's stages 3–6, the picker's cards); a tap opens the Pro sheet.

**Alternative** (if the user wants a more generous free tier): the whole Library free and only the Course's Stages 3–6
and the room's extras in Pro. Fairer to advanced players, but the Library is most of the content, so Pro would sell far
less. The proposal above is Polyorbit's own split (the first levels of each course free).

## Price

| Item | Price | Notes |
|---|---|---|
| BassClass | free | the beginner path, the tuner, the metronome, forever |
| BassClass Pro | **€7.99 one-time** | launch weeks at **€4.99**; Play shows each country's own price |
| Tips | **€2** and **€4** | ☰/Settings → "Support BassClass"; they unlock nothing |

Why €7.99: BassClass is a whole course plus a practice room; the bass apps and courses people compare it with charge
€10–20 a month or €100+ for a course (check), and a set of strings costs about the same as Pro. Polyorbit, a smaller
app, is €4.99 (launch €2.99); BassClass sits above it. Google keeps 15 % (check): about €1.20 of €7.99.

- **Promo codes** for friends, teachers and reviewers: Play Console codes for the one-time product (up to 500 a quarter,
  check); the friend owns Pro on their Google account like a buyer.
- **Licence testers** buy for free in the testing tracks.

## How the money is taken: Google Play Billing, no server

BassClass's Android app is our own WebView wrapper (Kotlin, `MainActivity.kt`), not Capacitor, so Play Billing goes in
natively, the way the backup's `BassClassNative.saveFile` already talks to the page:

- **Kotlin**: Google Play Billing Library (the current major version, check), a `BillingClient` in `MainActivity`; the
  bridge gives the page `BassClassNative.buy(id)`, `owned()` and `prices(ids)`, answering with `bassclass-billing`
  events (as `bassclass-saved`). A purchase is **acknowledged** at once (Play refunds an unacknowledged purchase after
  three days, check); a tip is **consumed** so it can be bought again.
- **Products** (created by the user in the Play Console): `bassclass_pro` (one-time, non-consumable), `bassclass_tip_2`
  and `bassclass_tip_4` (consumable).
- **The page**: one `isPro()` read everywhere (`web/js/pro.js`), a Pro flag stored with the rest (`bassclass.pro.v1`,
  so a backup carries it, though Play is the truth), the Pro sheet (what Pro has, the local price, Buy, Restore), the
  thank-you card. At launch and on each return to the app it asks Play what the account owns: a purchase made on another
  phone turns Pro on; a refund turns it off only after a second check at least a day later (Polyorbit's rule: a phone
  offline or a slow Play never takes Pro away by mistake).
- **No server**: Google recommends checking purchases on a server; like Polyorbit, the plan trusts the phone, in line
  with "generous by rule".

### Two builds from one source (Polyorbit's lesson)

- **`play`**: an App Bundle (`bundleRelease`) for the Play Console. Pro gates on (`window.BASS_STORE = "play"`, set by the
  build), Play Billing in, **no self-update from GitHub**, no test switches. **Recommended: the drum kit and the piano
  inside the bundle** (about 3.3 MB), so it plays offline from the first launch, does not depend on the public
  repository for its sounds, and makes no network call at all: the INTERNET permission can go, and the Data safety form
  is "no data collected, no network".
- **`github`**: the APK friends install today, as now. After the launch: see decision 6.
- **The same signing key**: when joining Play App Signing, give Play our own key (`android/app/bassclass.p12`) as the
  app signing key, so a phone with the GitHub APK updates to the Play version without uninstalling (an uninstall wipes
  the progress). versionCode keeps rising across both.

## Before the Play Store launch: the checklist

**The user's (accounts and money; nothing here starts without the user's word):**
- [ ] A Google Play developer account (USD 25 once, check). One account can publish Polyorbit and BassClass both.
  Personal or organisation; identity verification.
- [ ] A payments profile (to sell in-app products), bank details, tax information.
- [ ] **EU trader status** (Digital Services Act): a developer who earns money from an app is a trader, and Play shows
  the trader's address, phone and email on the listing. Decide what to show (a business address or a PO box may do).
- [x] A contact email for players and the listing: polyorbit.app@gmail.com, shared with Polyorbit (user, 2026-10-27).
- [x] The developer name shown on Play: Josich (user, 2026-10-27).
- [ ] The three products in the Console; promo codes and licence testers.
- [ ] **Closed testing**: a new personal account must run a closed test with at least 12 testers for 14 days in a row
  before it can publish to production (check). Twelve friends with Android phones, opted in through a link.
- [ ] **Developer verification for apps installed outside Play**: Google requires a registered developer even for APK
  downloads, country by country from late 2026 (check): register the package id `com.bassclass.app` there too, or the
  GitHub APK stops installing.

**Ours (code, texts, assets):**
- [ ] The Pro gates (`pro.js`, chips, the Pro sheet, the thank-you card, the session and placement rules), off in every
  build until the `play` flavour exists; a test switch only in development builds.
- [ ] The `play` flavour and the billing bridge; tested with licence testers on the internal testing track.
- [ ] Target Android 16 (API 36): done in v1.0.66–67. Edge-to-edge checked on an Android 15/16 emulator in CI
  (Polyorbit has the workflow to copy).
- [ ] **Privacy policy** page (no data collected; purchases by Google Play; the backup file stays where the player puts
  it): e.g. `https://josich.github.io/BassClass/privacy.html` (BassClass claims no App Links, so it can live there).
- [ ] **Credits and licences** in the app: the bass (Karoryfer, CC0), the drums (MuldjordKit, CC BY 4.0 with its credit;
  Frankensnare, Virtuosity, Swirly Drums, CC0), the piano (VCSL, CC0): already in Settings and the LICENSE files;
  add the CC BY licence text where a player can read it.
- [ ] **Data safety form**: no data collected or shared; purchases handled by Google Play.
- [ ] **Content rating** questionnaire; target audience 13+ (outside the Families programme); category Music & Audio (or
  Education).
- [ ] **Store listing**: the name (30 characters), a short description (80), the full description (4000), the 512 px icon
  (we have it), a 1024 × 500 feature graphic, phone screenshots (landscape: Home, a lesson, the Library, the Practice
  room, the tuner), optionally tablet ones. The designer agent can judge the graphic and the screenshots.
- [ ] "Rate BassClass on Google Play" and "Support BassClass" (the tips) in Settings, Play build only.
- [ ] The website (GitHub Pages) "Get the app" link points to the Play listing.

## Build order and effort

1. **Pro gates in the web app**, off by default: one day.
2. **`play` flavour + billing bridge + bundled sounds**: two days, then tests with licence testers (needs the account).
3. **Privacy page, listing texts, screenshots, feature graphic**: one day (drafts by us, choices by the user).
4. **Internal test → closed test (14 days) → production**, a staged rollout (20 % → 100 %). Mostly waiting: about three
   weeks of calendar time.
5. **After the launch**: read Android vitals (crashes) and the reviews in the Play Console; promo codes to teachers and
   bass YouTubers; the launch price ends after the first weeks.

## Risks and how to keep them small

- **The public repository**: the code and the GitHub APK are public, so anyone can build an unlocked copy. Accept it (as
  Polyorbit does), or make the repository private (decision 6: then the kit's GitHub home goes, which bundling solves).
- **Play policy**: inside the Play app every payment goes through Play Billing; the app must not link to any other way
  to pay, nor update itself from GitHub.
- **Refunds**: Play handles them; Pro is taken back only after the second check.
- **Too little free**: if reviews call it a demo, the line moves down (Level 3 free, or the whole Library) rather than
  the price.
- **Feature creep into Pro**: the ground rules are the guard. If a free player cannot practise properly, the line is
  in the wrong place.

## What to measure (without tracking anyone)

The Play Console gives installs, conversions to Pro, refunds, ratings and crashes. Nothing in the app reports home.

## Decisions for the user

1. **The line**: Levels 1–2 free everywhere and 3–6 Pro (proposed), or the whole Library free and only the Course's
   Stages 3–6 Pro?
2. **The room's extras in Pro** (the full drums and fills, all progressions and My progression, Piano/Organ/Guitar), or
   the whole Practice room free?
3. **The price**: €7.99 with a €4.99 launch price, or another figure (€5.99 / €9.99)?
4. **Tips** in the Play build: yes (€2 and €4) or no?
5. **The drums and the piano inside the Play bundle** (offline from the start, no network, 3.3 MB more), as proposed?
6. **The web version and the GitHub APK after the launch**: keep them as the free tier (gates on, no buying there),
   stop the public APK releases, or leave them unlocked; and does the repository stay public?
7. **Developer name and account**: one account for Polyorbit and BassClass? Personal or organisation? Which contact
   email and trader address?
8. **When**: start the Pro gates now (they stay off until the Play build), or after the reading course (phase 3)?
