# BassClass: the launch guide, step by step

Kept at the user's request (2026-10-27: "keep it in a doc of things to do before launch"; 2026-10-28: "my first time
publishing an app: a step by step, very organised and well explained order of things to do"). It holds every item of the
three launch reviews of 2026-10-28, in `qa/reports/`: `2026-10-28-launch-play.md` (Google Play release),
`2026-10-28-launch-legal.md` (legal and privacy) and `2026-10-28-launch-product.md` (product, listing). The plan and its
reasons: MONETIZATION-PLAN.md. The listing texts: STORE-LISTING.md.

**How to read it.** Work from the top. Each step says **who** does it (👤 you, 🤖 Claude, 👥 both), **why** it matters,
**how** to do it, and how long it takes. Tick ☐ → ☑ as you go (or tell Claude, who ticks it). A ⚖ marks where a short
paid consultation (a *gestor* / accountant, or a lawyer) is worth the money.

**How long.** About **4 weeks** from the first upload to Google Play until the app is public: the closed test takes
**14 days** that cannot be shortened, and Google reviews the request for production in about **7 days**. The steps before
it take a few days of your time spread over a week or two (identity and payments checks take up to 5 days each).

```
 Part 1  Your decisions .................... you, now (an hour, plus a gestor's appointment)
 Part 2  Accounts and keys ................. you + Claude, week 1 (identity and payment checks: up to 5 days)
 Part 3  The first upload and the products . you + Claude, week 1–2
 Part 4  Testing purchases ................. you + friends, week 2 (2–3 days)
 Part 5  Declarations and the listing ...... you + Claude, week 2
 Part 6  Closed test (14 days) ............. you + 12 or more testers, weeks 2–4
 Part 7  Production ........................ Google (about 7 days), then you
 Part 8  Launch day ........................ you + Claude, in this order
 Part 9  After the launch .................. ongoing
```

---

## Already decided (the user, 2026-10-27/28)

- **Free**: Levels 1–3 on every front (the Library's exercises and song studies, the Course's Stages 1–3), two lessons
  of each of Stages 4–6 to try (scales, modes, two-octave arpeggios), the tuner, the whole metronome, the Neck, the
  drone, the log, backup; in the room, **3 drum patterns of each genre**, the Pop & rock and Blues progressions, My
  progression and its ✎ Edit, the Pad, E-piano and Arpeggio sounds, the drone on its root and 5th or octave, the triads,
  the five basic 7th chords and their spread and shell voicings.
- **Pro** (one-time): Levels 4–6, every drum pattern and the fills, every progression, the Piano, Organ and Guitar sounds,
  the drone's other chords and voicings, and the new content added to these parts later.
- **Price**: €7.99, launch price €4.99. **Tips**: €2 and €4. Products `bassclass_pro`, `bassclass_tip_2`,
  `bassclass_tip_4`.
- **Developer name**: Josich. **Contact**: polyorbit.app@gmail.com (the same as Polyorbit).
- **Signing**: Google Play's own app signing key, and a new upload key kept out of git (see "Keys" below).
- **Nobody gets the app outside Google Play after the launch**: the repository goes private, the web version and the
  GitHub APK stop (Part 8).
- **Sounds inside the app**, no internet permission; credits, licences and legal texts in About (the logo).

## Done by Claude (2026-10-28, from the three reviews)

- ☑ **My level placed nobody above Stage 3**: the Pentatonic colours units had no statement. Fixed, and the self-test
  now checks that every unit has one.
- ☑ **The Play build** (`play` flavour): an App Bundle with the Pro gates on, Google Play Billing 9.1.0, signed with the
  upload key from GitHub's secrets; CI builds it on every push as a check and signs it when run by hand.
- ☑ **The purchase code** (Kotlin, `StoreBridge.kt`): buy, restore, prices in your currency, acknowledged at once, tips
  consumed, pending purchases, a check on every return to the app.
- ☑ **Purchases are no longer lost**: a purchase may take 15 minutes (a new card, a bank check); a late or pending one
  is applied when it arrives; the check runs every 2 minutes, not 30.
- ☑ **Prices**: the Play build shows only Google Play's price, in the player's currency (no written "€7.99").
- ☑ **Legal texts** in About (privacy policy, terms of the purchase, libraries, safety) rewritten to the legal review,
  and the public privacy page `legal/bassclass/privacy.html` made from the same text.
- ☑ **No suspicion of copying**: "Based on" became "Related"; no online school, paid course, course code or the YouTube
  teacher named anywhere (app, README, research notes, docs); song studies say "not a transcription: the notes are our
  own; not affiliated"; the two studies whose openings echoed their records (Seven Nation Army, Another One Bites the
  Dust) have new openings.
- ☑ **Safety and privacy in the Android app**: no internet, network-state or advertising-ID permission (CI refuses a
  bundle that has one); no WebView statistics; other web addresses open outside the app; the microphone only for the
  app's own pages; Android's backup keeps the progress without the caches.
- ☑ **Robustness**: a crash of the page's renderer restarts the page instead of closing the app; text zoom capped at
  130% (Android's largest fonts broke the exercise screen); the last error messages go into the Feedback e-mail.
- ☑ The rating card's stars are a picture (one button), the store listing drafted (STORE-LISTING.md), the stale lines of
  MONETIZATION-PLAN.md and README fixed.

---

## Part 1 · Your decisions (do these first)

### ☐ 1.1 Personal or organisation account 👤 ⚖
**Why.** It decides what Google shows publicly, and **it cannot be changed later**.
- **Personal** (you as a person): since you sell, Google shows on the listing your **legal name, your full home address,
  your country and the contact email** (EU law, the Digital Services Act). Personal accounts created after 13 Nov 2023
  must also run the **closed test** (Part 6: 12 testers for 14 days).
- **Organisation** (a company, e.g. an SL): the company's name and business address are shown instead (a business or
  virtual office address works); it needs a free D-U-N-S number; the closed test is reported not to apply (unconfirmed). Forming and running a
  company costs money every year: only worth it if the apps earn enough.
**How.** Decide with your *gestor* (1.2). Most indie developers start personal and accept the address.

### ☐ 1.2 Register the activity for tax 👤 ⚖ (gestor)
**Why.** Selling, even through Google, is an economic activity. Google collects and pays the **VAT** for EU buyers (it is
the "merchant of record"), but **you declare the income**. A wrong start costs surcharges.
**How (Spain, the assumed country; confirm yours).** Ask a *gestor* about: the census registration (modelo 036/037)
with an activity code, the self-employed regime (RETA) if it is habitual, the intra-community operator registry (ROI)
and modelo 349 (sales to Google Ireland), and quarterly IRPF. Bring the expected prices (€4.99–7.99, tips €2/€4).

### ☐ 1.3 Your legal name and postal address 👤 → 🤖
**Why.** The privacy policy must say who is responsible for the data (the "controller"): "Josich" is only a trade name.
Use the same name and address as the payments profile (step 2.3).
**How.** Tell Claude, who fills `OWNER` in `web/js/legal.js` and makes the privacy page again. The signed Play bundle
refuses to build while it is empty.

### ☐ 1.4 Check the privacy policy's promises 👤
**Why.** They become commitments. Read About → Privacy policy (or `legal/bassclass/privacy.html`) and confirm:
- emails kept **up to two years** after the conversation; order records **as long as tax law asks** (Spain: six years);
- **two-step verification** on the Gmail and the Google Play account (step 2.1);
- the complaint authority (**AEPD**, Spain): change it if you live elsewhere.

### ☐ 1.5 The launch price 👤
**Why.** EU rules forbid showing "€4.99, was €7.99" for a price never charged. **How.** Set the product at **€4.99 as
its plain price**; weeks later, raise it to €7.99. Never write "was", a strike-through or "−37%" in the app, listing or
screenshots. (The product review suggests €9.99 once the reading course ships.)

### ☐ 1.6 Which extra features before the launch 👤 (Claude recommends the ★ ones)
None is required by Google; each helps players. Say which to build:
- ★ **A first-start card** on Home: "Your bass: 4 / 5 / 6 strings · right / left-handed" and "New to bass: Lesson 1.1 /
  I already play: My level". The only onboarding needed (a 5-string or left-handed player now sees the wrong neck until
  they find Settings). Small.
- ★ **A practice reminder**: an opt-in notification, offered once after the first day practised, at most one a day,
  skipped when the day's goal is met. The only way to bring back a player who closed the app. Medium (needs the
  notification permission on Android 13+; nothing leaves the phone).
- ★ **An earlier first rating ask**: at the first checkpoint or the 3rd day practised (the 10 h and 20 h asks stay);
  most players never reach 10 hours in the first weeks, when the first ratings matter most. Small.
- ★ **Free cards first in the pickers**: a free player sees 13 gold Pro cards around the 3 free ones in each genre. Small.
- **The Pro sheet names skills** before counts ("walking bass, slap, jazz licks…"). Small.
- **Readability**: the dimmed text (`--dim`) is hard to read (contrast 2.6–3.8:1); a lighter tone keeps the look.
  Larger tap areas on the beat lights (22 px) and ⓘ buttons (32 px); names for the tuner's A4 −/+ for TalkBack. Small.
- **The first day's session** starts with fretboard drills before Lesson 1.1; and Lesson 1.1's first step could pass on
  its first loop. Small.
- After the launch (not now): hear a locked drum pattern or sound before buying; posture drawings in Unit 1; a
  stage-complete card; the listing translated (Spanish first).

### ☐ 1.7 Which QA round 20 fixes 👤 (`qa/reports/267b86f-deep.md`, `267b86f-user.md`)
Already fixed: M1/C6 (My level), m6 (libraries in About), T5 (the privacy date). Still open, Claude recommends all of
the first group before the launch:
- **Wrong or confusing for players**: spelling in the new progressions (minor bossa in E♭m and B♭m, the modal form in
  Cm and Fm); exercises whose chords change off the bar line (chord formulas, pentatonic double stops, rolled harmonic
  chords); the 3-box exercise's boxes 2 and 3 not fingered as one box; harmonics not marked in the tab and one node with
  three names; the chord-formula lesson calling C°7's B♭♭ a 3rd and the ⓘ promising every tension (C13 lacks the 11);
  checkpoint rows reading "○ ✓"; I – ♭VI – ♭VII – I playing 7ths in Pop & rock; ✎ Edit on the modal form giving 12 bars
  and Aeolian; the #417 text (says root, 5th and octave; the groove plays the 3rd).
- **Polish**: new exercises lowering Levels 3–5's 80% pass share; a "New" chip on a Pro item never clearing for a free
  player; the rate card over a screen just entered or the tuner; identical session rows ("Open strings" ×3); unit
  numbers left in the Pro list and lesson headers; the search hint "42" (now "305"); the room's ⓘ missing Soul & R&B;
  long progression names overflowing picker cards; the Level 2 root-notes drill offering 34 progressions; `added` dates
  later than the release.
- **Questions for you** in the reports (Q1–Q4): session duplicates, the stars, the chord formulas' extended family at
  Level 3, naming the tunes' changes.

---

## Part 2 · Accounts and keys (week 1)

### ☐ 2.1 Protect the two accounts 👤 (10 minutes)
**Why.** The privacy policy promises it, and losing the Play account loses the app.
**How.** Turn on **2-Step Verification** for polyorbit.app@gmail.com and for the Google account that will own the Play
developer account (myaccount.google.com → Security). Keep backup codes somewhere safe.

### ☐ 2.2 Create the Google Play developer account 👤 (30 minutes, then up to a few days)
**Why.** Everything on Google Play happens in the Play Console. If Polyorbit already has a developer account, **use the
same one** (one account can hold many apps; skip to 2.3).
**How.** play.google.com/console → sign up → choose the type from 1.1 → pay the one-time fee (US$25) → verify your
identity (ID document) and the contact email and phone (one-time codes). Developer name: **Josich**.

### ☐ 2.3 The payments profile (merchant account) 👤 (20 minutes, then up to 5 days)
**Why.** Needed to sell Pro and tips. **Its country and type cannot be changed later.**
**How.** Play Console → Setup → Payments profile → create it with your **legal name and address (as in 1.3)**, bank
account and tax details. Google may ask for documents; verification can take up to 5 days.

### ☐ 2.4 EU trader status 👤 (10 minutes)
**Why.** EU law: a seller must declare it, and Google shows the details on the listing.
**How.** Play Console → the account's details → declare yourself a **trader**; the name, address, email and phone it
shows come from the account and the payments profile. A separate cheap phone number avoids showing your own.

### ☐ 2.5 Make the upload key 🤖 + 👤 (15 minutes)
**Why.** Google signs the app with its own key; you sign each upload with an **upload key** that proves it is you. It
must never be in git (BassClass's old key is public). One key for BassClass alone (not Polyorbit's).
**How.** Tell Claude "make the upload key": Claude creates `bassclass-upload.p12` (RSA 4096) with a strong password
**outside the repository**, with a "keep secret" note, as for Polyorbit. You save the file and the note in your Drive
next to Polyorbit's. A lost upload key can be reset through Play support; still, keep it safe.

### ☐ 2.6 Put the key in GitHub's secrets 👤 or 🤖 (10 minutes)
**Why.** CI signs the Play bundle with it, without the key ever being in the repository.
**How.** github.com/josich/BassClass → Settings → Secrets and variables → Actions → New repository secret, four times:
`PLAY_UPLOAD_KEYSTORE_B64` (the file as base64; Claude gives you the text), `PLAY_UPLOAD_STORE_PASSWORD`,
`PLAY_UPLOAD_KEY_ALIAS` (`upload`), `PLAY_UPLOAD_KEY_PASSWORD`. (Claude can set them with `gh` if you sign it in.)

### ☐ 2.7 Publish the privacy page 👤 → 🤖 (after 1.3)
**Why.** Google Play requires a privacy policy at a public address that stays up (GitHub Pages of this repository stops
when it goes private).
**How.** Your public site `josich.github.io` already serves Polyorbit's privacy page. With your OK, Claude adds
`legal/bassclass/privacy.html` to that repository as `bassclass/privacy.html`; the address becomes
**https://josich.github.io/bassclass/privacy.html**. Never change it after the launch without updating the Play
Console. (⚖ Spain may also want an "Aviso legal" with your name, address, email and NIF on that page: ask the gestor.)

---

## Part 3 · The first upload and the products (week 1–2)

### ☐ 3.1 Create the app in the Play Console 👤 (15 minutes)
**How.** Play Console → Create app → name **BassClass** (the listing title comes later), default language English
(United Kingdom), **App**, **Free** (it has in-app purchases), accept the declarations. Creating it reserves the package
name `com.bassclass.app`.

### ☐ 3.2 Build the signed Play bundle 👤 or 🤖 (5 minutes, after 1.3 and 2.6)
**How.** github.com/josich/BassClass → Actions → **Build Android APK** → **Run workflow** (branch main). When it ends,
open the run → Artifacts → download **BassClass-play-aab** (a zip holding `app-play-release.aab`). The run refuses to
build without the secrets or the legal name. Never rename that workflow file: the version code is its run number.

### ☐ 3.3 Upload it to Internal testing 👤 (20 minutes)
**Why.** The internal track is private (up to 100 testers), instant, and needed before products can be created.
**How.** Play Console → Test and release → Testing → **Internal testing** → Create release:
- **Play App Signing**: accept the **Google-generated key** (the default). Do **not** press "Change key" or upload ours.
- Upload the `.aab`, add release notes, save, review, start the rollout.
- Testers: add your own Gmail (and a friend's), copy the opt-in link, open it on the phone, install from Play.

### ☐ 3.4 Licence testers 👤 (5 minutes)
**Why.** A licence tester buys with test cards and is **never charged**. Without it, a tester who buys Pro pays real
money.
**How.** Play Console → Settings → **License testing** → add every tester's Gmail (yours, and later all closed-test
testers), response "RESPOND_NORMALLY".

### ☐ 3.5 Create the three products 👤 (20 minutes)
**How.** Play Console → Monetize with Play → Products → **One-time products** → Create:
- `bassclass_pro`: name "BassClass Pro", description "Levels 4–6, every drum pattern and the fills, every progression,
  the piano, organ and guitar sounds. One payment." Price **€4.99** (step 1.5); let Play fill the other countries (its
  local price templates). Activate.
- `bassclass_tip_2` ("Tip", "A small thank-you: it unlocks nothing."), €2. Activate.
- `bassclass_tip_4` ("Big tip", same text), €4. Activate.
Product ids are permanent and can never be reused. There is no "consumable" setting: the app consumes tips itself.

---

## Part 4 · Testing purchases (week 2, 2–3 days) 👤 + friends, report to 🤖

Install from the internal track (only an app installed from Play can buy or show the rating card). Try each and tell
Claude what happened:
- ☐ Buy Pro with the test card that **approves**: Pro opens, "Let's play" does what was tapped.
- ☐ Buy and **cancel** on Google Play's sheet; buy with the card that **declines**.
- ☐ Buy with the cards that **approve or decline after a few minutes** (a pending purchase): Pro opens by itself when it
  completes, also after leaving and coming back.
- ☐ A purchase that takes **more than a minute** (wait on Play's sheet): still applied.
- ☐ **Restore purchase** on a second phone with the same Google account.
- ☐ **Refund** in Play Console → Order management: Pro stays a day, then closes at the next check a day later.
- ☐ A **tip twice** in a row; Pro bought when already owned ("owned").
- ☐ Open the app **offline**: everything plays; buying says Google Play could not be reached.
- ☐ The **rating card** (Settings → Support → Rate, or the 10-hour reminder): Google's card shows.
- ☐ **A new phone**: practise, then install from Play on a second phone with the same Google account: do the log, the
  course and the settings come back (Android's backup), and Pro (Restore)? If not, tell Claude.
- ☐ Read the **pre-launch report** (Play Console → Testing → Pre-launch report): crashes, accessibility, screenshots on
  real devices.
- ☐ **Logcat after a purchase** (QA round 21): with the phone on a computer (Android Studio → Logcat, or
  `adb logcat`), buy with a test card, then leave the app in the background for 30 minutes. Look for
  `SecurityException`, `ACCESS_NETWORK_STATE` or "Background execution failure" from `com.google.android.datatransport`:
  Google's billing library sends its own logs and may need the network-state permission, which the build removes. If
  they show, tell Claude: adding ACCESS_NETWORK_STATE back gives no internet access and changes no privacy text.
**If buying fails with a network error**, Google's library may need the internet permission after all: tell Claude,
who adds it back and updates the privacy policy and the Data safety answer (1 hour).

---

## Part 5 · Declarations and the listing (week 2)

### ☐ 5.1 App content 👤 (Play Console → Policy → App content; 30 minutes)
- **Privacy policy**: https://josich.github.io/bassclass/privacy.html (step 2.7).
- **Ads**: No. **App access**: all functionality is available without special access (Pro is a purchase).
- **Advertising ID**: No (the app has none; CI checks it).
- **Content rating** (IARC questionnaire): category Reference/Education (or "Other"); no violence, no user interaction or
  sharing, no location; **digital purchases: yes**. Expect Everyone / PEGI 3.
- **Target audience**: **13–15, 16–17, 18+** only (no group under 13, so the Families policy does not apply); the store
  listing does not appeal to children.
- **Government apps, financial features, health, news**: No / none.
- **Data safety**: "Does your app collect or share any of the required user data types?" → **No**. Encryption and
  deletion questions then do not appear. Why it is true: the tuner's sound, the progress, the backups and the Pro flag
  never leave the phone; Feedback is an e-mail the player sends from their own mail app; purchases and the rating card
  go through the Play Store app; the app has no internet permission (CI checks it). Keep this reasoning in case Google
  asks. (If the internet permission ever comes back, declare **App info and performance → Diagnostics**.)

### ☐ 5.2 The store listing 👤 + 🤖 (Grow → Store presence → Main store listing)
- **Texts**: from STORE-LISTING.md (name, short and full description). Read its rules: no songs, artists, teachers or
  brands; "free to start, optional one-time Pro"; no price claims.
- **Graphics**: app icon 512×512 (exists), **feature graphic 1024×500**, **at least 2 phone screenshots** (4 or more,
  1920×1080, landscape: a 20:9 capture must be cropped). Claude prepares them with you (the designer agent can judge
  them); the list of 8 shots and captions is in STORE-LISTING.md.
- **Category**: Education. **Contact**: polyorbit.app@gmail.com (and the website, optional).

### ☐ 5.3 Ear check of the riff studies 👤 (30 minutes)
**Why.** The studies are original lines "in the style of" famous songs; none may sound like the record's riff. Two
openings were changed already (Seven Nation Army, Another One Bites the Dust).
**How.** Library → Make Music: play Under Pressure, Good Times, Smooth Criminal, Can't Stop, Billie Jean and Money style
next to the records (or ask a musician friend). If any bar is recognisable as the record's bass riff, tell Claude, who
changes its notes.

### ☐ 5.4 Read the legal texts 👤 ⚖ (optional lawyer, about an hour)
About → Privacy policy and Terms of the purchase (the same text as the public page). A one-hour review by a lawyer in
your country is worth it once money is involved; the legal review's report (`qa/reports/2026-10-28-launch-legal.md`)
gives the reasons for every line.

### ☐ 5.5 Freeze the numbers 🤖 (just before the closed test)
Renumber the exercises (`web/js/curriculum/numbers.js`, level + two digits) and the lessons (`web/js/course/numbers.js`,
stage + number) once, in course order, so the first public numbers are tidy; drop the `added` dates of everything
shipped before the launch (at the launch every player is new). After that, never change a number again: new content
takes the next free one, removed numbers are retired.

---

## Part 6 · The closed test (14 days) 👤

### ☐ 6.1 Recruit 15 testers (12 is the minimum)
**Why.** A new personal account must run a closed test with **at least 12 testers opted in for 14 days in a row**
before it can ask for production. If the count drops under 12, the 14 days start again: recruit 14–15. (If Polyorbit's
account already ran one, BassClass probably still needs its own: Google words the rule per app.)
**How.** Friends, bass students, teachers, a Google Group (easiest: testers join the group). Each needs a Gmail and an
Android phone. Ask them to keep the app installed and to open it now and then, and to send feedback (Settings →
Feedback). Add every tester as a **licence tester** (3.4).

### ☐ 6.2 Run it
**How.** Test and release → Testing → **Closed testing** → create a track → add the testers (emails or the Google
Group) → upload a bundle (the same as internal, or a newer one from 3.2) → roll out → send them the opt-in link.
Count 14 days from the day the 12th tester joined. Fix what they report (Claude), uploading new bundles as needed.

---

## Part 7 · Production 👤

### ☐ 7.1 Apply for production access
Play Console → Dashboard → **Apply for production** (after the 14 days). Google asks about the test (how many testers,
what feedback, what changed). Answer honestly; review takes **about 7 days**.

### ☐ 7.2 The production release
Test and release → **Production** → create a release with the latest bundle → release notes (STORE-LISTING.md) →
choose the countries (all, or start with a few) → **staged rollout** (e.g. 20%, then 100% after a few days without
crashes) → send for review (usually hours to a few days).

---

## Part 8 · Launch day (in this order) 👤 + 🤖

1. ☐ Check the privacy page address works (step 2.7).
2. ☐ 🤖 **Delete the old build artifacts** on GitHub (about 140 APKs, about 1 GB; a private repository's free plan
   holds 500 MB, and over it every build would fail). The APK artifacts are kept 7 days from now on.
3. ☐ 🤖 Remove the web version's workflow (`pages.yml`) and stop the GitHub APK releases; the Play bundle is then built
   on demand only (Actions → Run workflow).
4. ☐ 👤 **Make the repository private**: github.com/josich/BassClass → Settings → General → Danger Zone → Change
   visibility → Private. From then on only you see the code and the releases; GitHub Pages stops (decided), the APKs
   already downloaded keep working (no Pro gates, no updates: accepted).
5. ☐ 👤 Sign `gh` in on this PC (`gh auth login`), so Claude can still check CI on a private repository.
6. ☐ 👤 Tell the friends with the GitHub APK: Settings → Backup → Save; uninstall; install from Google Play; Settings →
   Backup → Load. They keep everything (the Play version is signed by Google, so it cannot update over the GitHub one).

---

## Part 9 · After the launch

- ☐ **Answer paying players within 3 business days** (Google's distribution agreement): watch polyorbit.app@gmail.com.
- ☐ Reply to reviews in the Play Console; read Android vitals (crashes, slow starts).
- ☐ Raise Pro to **€7.99** when the launch weeks end (no "was" anywhere).
- ☐ Before about **August 2027** (Google Play's next target, API 37): tablets will ignore the landscape lock; plan a
  layout for large screens (product review, C2).
- Later, by choice: hear a locked pattern before buying; the listing in Spanish (then German, French, Portuguese), each
  saying the app is in English; posture drawings in Unit 1; listening to the player (the strategic gap against the
  subscription apps; never promised in the listing).

### ☐ Maybe: the app in other languages 👤 + 🤖 (decide after launch, once the texts stop changing)

The user asked (2026-10-29) about Spanish, Catalan, French, German, Japanese, Basque and others. A maybe, not a plan:
decide with Play Console's sales by country in hand.

**Why after launch.** BassClass sells worldwide in English as it is, and Play already shows prices in each player's
currency. The texts still change several times a week (QA rounds, new lessons), and every change would have to be made
again in each language.

**How much text.** About 63,000 words per language, plus a few thousand short labels:
- exercise texts and options: about 28,700 words;
- the course (lessons, mistakes, checkpoints, My level): about 25,400;
- screens, ⓘ bubbles, buttons and messages: about 6,700;
- the legal texts: about 1,000;
- the store listing: about 1,400.

**What it costs.**
| Route | Per language | Quality |
|---|---|---|
| Professional translators (about €0.08–0.15 a word, Japanese more) | about €5–10k (six languages: €35–60k) | good, with a music glossary |
| Claude translates, a native bassist reviews (30–40 hours) | about €1–1.5k for the reviewer, less with volunteers | good with a careful reviewer |
| Claude translates, nobody reviews | only Claude usage | not good enough for a teaching app |

- **Claude's part, once:** move every text out of the code (about 100 files, many sentences built from pieces) into
  one file per language, with whole-sentence templates and plurals. Also: a language choice in Settings (the phone's
  language by default), search words per language, and a self-test that every text exists in every language. It is a
  refactor of nearly every file: several long sessions, before any translation.
- **Then for good:** every new exercise, lesson and text fix is done again in each language. Six languages make each
  round of changes about seven times the text work.

**Risks.**
- **Music terms**, where a wrong word costs a teacher's trust. Each language needs a glossary and a musician to check it:
  - German names B as H and B♭ as B: a third note-name setting beside C D E and Do Re Mi.
  - French jazz writes C7M for Cmaj7.
  - Spanish and Catalan have their own names for note values (negra, corchea; corxera).
  - Some words stay English in every language (slap, groove, walking bass): decide which.
  - The Do Re Mi setting already helps Spanish, Catalan, French and Basque.
- **Layouts**: German runs about 30% longer and French about 20%, and the phone screens at 800×380 are tight. Every
  language needs its own visual check.
- **Japanese** is the hardest: line breaking, its own conventions, high expectations of polish. Selling there may bring
  seller-disclosure rules (the Specified Commercial Transactions Act): ask a lawyer first.
- **Legal texts**: marketing a country in its language generally means the privacy policy and terms in that language too
  (Spain and Catalonia have their own consumer-language rules). A professional translation of each, ideally with a
  legal check.
- **Return**: Spanish (Spain and Latin America), German, French and Japanese are large markets; Catalan and Basque
  speakers almost all read Spanish, so those two are mostly a gesture (regional language programmes sometimes fund such
  work: worth asking). Brazilian Portuguese is a larger bass market than some of the languages above.

**If yes, in this order.**
1. Freeze the English texts for a few weeks.
2. Claude builds the language system once.
3. **Spanish first, as the pilot**: Claude translates, a bassist reviews; the store listing and the legal texts in
   Spanish too.
4. After a few months, compare Spanish-speaking sales with before. Then German, French or Portuguese by demand;
   Japanese last, with a professional translator.

---

## Keys (decided: Google Play's key)

The old signing key `android/app/bassclass.p12` and its password are in the repository's history, which has been
public: anyone could sign an APK that installs over the GitHub BassClass. So **Google Play makes and keeps the app
signing key** (Play App Signing, the default for a new app), and each upload is signed with a **new upload key** kept
out of git (steps 2.5–2.6). `bassclass.p12` keeps signing the GitHub test builds only; never delete it (updates of the
test builds need it).

**Which key is which** (user, 2026-10-27: "I keep the Play signing key in Drive for Polyorbit, is that the same key?"):
no. Polyorbit's `polyorbit-release.p12` was made privately and is kept secret in your Drive. BassClass gets its own
upload key (one key per app, so a leak never touches the other), saved beside it.

## Can wait (technical, not needed for the launch)

- Shrinking the code with R8 (little gain: most of the app is audio); if turned on, keep the bridge's methods.
- Edge-to-edge warnings in the Play Console (recommendations, never a rejection; the app hides the system bars).
- Uploading to Play automatically from CI (a service account).
- Checking purchases on a server: the app trusts the phone (Google recommends a server; accepted, "generous by rule").
- A short explanation before Android's microphone dialog (good practice, not required: the sound stays on the phone).
