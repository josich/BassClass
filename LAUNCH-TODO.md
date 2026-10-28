# BassClass: to do before the Play Store launch

Kept at the user's request (2026-10-27): "keep it in a doc of things to do before launch". The plan and its reasons:
MONETIZATION-PLAN.md. Tick items off here as they are done; the user's decisions go in "Decided".

## Decided (user, 2026-10-27)

- **Free**: Levels 1–3 on every front (the Library's exercises and song studies, the Course's Stages 1–3), the tuner,
  the whole metronome, the Neck, the drone, the log, backup; in the room, **3 drum patterns of each genre**, the Pop &
  rock and Blues progressions, the Pad, E-piano and Arpeggio sounds.
- **Pro** (one-time): Levels 4–6, every drum pattern and the fills, every progression and My progression, the Piano,
  Organ and Guitar sounds, and what comes next.
- **Price**: €7.99, launch price €4.99 ("yes, for now"). **Tips**: yes, €2 and €4.
- **Sounds inside the app** (drums and piano bundled, 7.7 → about 11 MB): done 2026-10-27; no INTERNET permission.
- **The web version and the public GitHub APK**: not kept after the launch (the user's "No").
- **Credits, licences and legal texts**: one screen under the app's logo (About, `#/about`): done 2026-10-27.
- **The Pro gates**: built 2026-10-27 (pro.js), off outside the Play build, with a debug panel (Settings: seven taps on
  the version line, test builds only).
- **Signing**: Google Play's own app signing key, not ours (user, 2026-10-27: "use the Play signing key, not ours"). Our
  `bassclass.p12` stays for the GitHub test builds only; the Play bundle is uploaded with a new upload key kept out of
  git (a GitHub secret). Friends with the GitHub APK move to Play by Backup → uninstall → install from Play → load the
  backup.
- **Nobody gets the app outside Google Play after the launch** (user's concern, 2026-10-27: "random people can download
  the app for free from GitHub without passing by the Play Store"): see "The repository and the free copies" below.

## Still the user's

- [x] **Developer name** (user, 2026-10-27): Josich, shown on Play and in About (`DEVELOPER` in `web/js/ui/about.js`).
- [ ] **Account type**: personal or organisation; identity verification. USD 25 once (check).
- [x] **Contact email** (user, 2026-10-27): polyorbit.app@gmail.com, the same as Polyorbit, in `web/js/feedback.js`
  (`CONTACT`): Settings → Feedback writes to it, About and the privacy policy show it. Use it on the Play listing too.
- [ ] **EU trader details** (Digital Services Act): the address, phone and email Play shows on the listing.
- [ ] **Payments profile** (to sell): bank and tax details.
- [ ] **The products** in the Play Console: `bassclass_pro` (one-time), `bassclass_tip_2` and `bassclass_tip_4`
  (consumable); licence testers; promo codes for friends and teachers.
- [ ] **Closed test**: 12 testers for 14 days in a row before production (check, personal accounts).
- [ ] **The repository goes private at the launch** (the user switches it, or tells Claude to): see below.
- [ ] Read the legal texts in About (privacy policy, terms of the purchase) before they go public; a lawyer's look is
  worth it once money is involved.

## Still ours (code and texts)

- [ ] **The Play build**: a `play` flavour that builds an App Bundle (`bundleRelease`) beside the GitHub APK, writes
  `window.BASS_STORE = "play"` first in the page (the gates on, the debug panel gone), and is signed for Play (see
  "Signing" below).
- [ ] **The billing bridge** in `MainActivity.kt` (Play flavour only): Google Play Billing Library, `billingBuy`,
  `billingOwned`, `billingPrices`, answering with `bassclass-billing` events; acknowledge each purchase, consume each
  tip (the protocol is written at the top of `web/js/billing.js`). The BILLING permission comes with the library.
- [ ] **Test real purchases** in the internal testing track with licence testers: buy, cancel, pending, refund (Pro
  goes after the second check a day later), restore on a second phone.
- [x] "Rate BassClass on Google Play" in Settings → Support BassClass (2026-10-27; it opens the listing, which exists once published).
- [x] The rate reminder (2026-10-28, `web/js/ui/rate.js`): a card with 5 stars at 10 and 20 hours played, at the end of
  something; it opens the listing too.
- [ ] Maybe: Google Play's in-app review card (the rating inside the app, without leaving it) for the reminder: it needs
  Google's Play Review library in the Android app (a new dependency: ask before adding it).
- [ ] **The privacy policy at a public address** (Play asks for a URL): the same text as About's, on a public page
  (e.g. the `josich.github.io` repository, as Polyorbit's).
- [ ] **Store listing texts**: name (30), short description (80), full description (4000). Drafts by us.
- [ ] Later (not now, the user's word): screenshots and the 1024 × 500 feature graphic.
- [ ] **Data safety form**: no data collected or shared; purchases handled by Google Play. Content rating; target
  audience 13+; category Music & Audio (or Education).
- [ ] Stop the GitHub APK releases and the web version at the launch (the workflow), and point anything that linked
  to them to the Play listing.

## Signing (decided: Google Play's key)

The signing key `android/app/bassclass.p12` and its password are in the repository's history, which has been public:
anyone could sign an APK that installs over BassClass. So **Google Play makes its own app signing key** (Play App
Signing) and we upload with a **new upload key** kept out of git (a GitHub secret). A phone with the GitHub APK cannot
update into the Play version: its owner saves a backup (Settings → Backup), uninstalls, installs from Play and loads the
backup, and keeps everything.

**Which key is which** (user, 2026-10-27: "I keep the Play signing key in Drive for Polyorbit, is that the same key?"):
no. Polyorbit's `polyorbit-release.p12` (alias polyorbit, 4096-bit RSA) was made privately and is kept secret, in the
user's Drive. BassClass's `bassclass.p12` (alias bassclass, 2048-bit, password "bassclass") was made by the build robot
on 2026-10-14 and committed to the public repository: not secret, hence Play's key for BassClass. With Play App
Signing, Google keeps BassClass's app signing key itself; what the user keeps is an **upload key**: a new one, made for
BassClass alone (not Polyorbit's: one key per app, so a leak never touches the other), made like Polyorbit's (a file
and a "keep secret" note outside git, plus what to paste into GitHub's secrets), and saved in the user's Drive beside
Polyorbit's. A lost upload key can be replaced through Play support (an app signing key could not).
- [ ] Make BassClass's upload key with the Play build; the user saves it in Drive.

## The repository and the free copies (the user's concern)

Today the repository is **public**: anyone on the internet can see every file, download the APK (the releases) and use
the web version (josich.github.io/BassClass), all with everything open (the gates are off outside the Play build). At
the launch, so that the app only comes from Google Play:

1. **Make the repository private** (GitHub → the repository → Settings → General → Danger Zone → Change visibility →
   Private). From then on only its owner (and people invited) can see the code, the releases and the files.
2. **Stop the public builds**: the GitHub APK releases and the web version (both stop being reachable anyway once
   private; the workflow then builds the Play bundle on request only).
3. **The old releases**: once private, the 100+ APKs published so far are no longer downloadable from GitHub. Copies
   people already downloaded keep working on their phones; that cannot be undone, and it is accepted ("generous by
   rule"): they have no Pro gates, but they also never get updates.
4. **The Play app itself**: an APK copied off a phone that has it from Play still has the gates on; Pro needs a
   purchase on the player's own Google account.
5. **Before the launch** the repository stays public, so friends can keep testing with the GitHub APK; the Play
   closed test (12 testers, 14 days) then takes over.

### What changes once it is private

- **GitHub Pages stops** on a free account (Pages from a private repository needs a paid plan): the web version goes
  (decided anyway), and anything else hosted there must move, the privacy policy first (see above).
- **The APK releases stop being downloadable** for anyone but the owner (decided anyway).
- **Actions minutes**: a private repository has a monthly allowance (2,000 minutes on the free plan, check), and every
  push builds the APK and the site. Build the Play bundle on demand (a manual or tagged run) and drop the site job.
- **The sounds**: no effect any more (they are inside the app since 2026-10-27).
- **The signing key**: see "Signing": private now does not undo public before.
- **Claude's checks**: the CI status at `api.github.com/repos/josich/BassClass/actions/runs` needs a login for a
  private repository (`gh` signed in).
- Developer verification for APKs outside Play no longer matters once the GitHub APK stops.
