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

## Still the user's

- [ ] **Developer name** shown on Play (one account for Polyorbit and BassClass? "josich" or a studio name).
- [ ] **Account type**: personal or organisation; identity verification. USD 25 once (check).
- [ ] **Contact email** for players and the listing (e.g. bassclass.app@gmail.com, or one address for both apps).
  Then fill `DEVELOPER` and `CONTACT` in `web/js/ui/about.js` (About and the privacy policy show them).
- [ ] **EU trader details** (Digital Services Act): the address, phone and email Play shows on the listing.
- [ ] **Payments profile** (to sell): bank and tax details.
- [ ] **The products** in the Play Console: `bassclass_pro` (one-time), `bassclass_tip_2` and `bassclass_tip_4`
  (consumable); licence testers; promo codes for friends and teachers.
- [ ] **Closed test**: 12 testers for 14 days in a row before production (check, personal accounts).
- [ ] **The repository**: private after the launch? See "If the repository goes private" below.
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
- [ ] "Rate BassClass on Google Play" in Settings (Play build only).
- [ ] **The privacy policy at a public address** (Play asks for a URL): the same text as About's, on a public page
  (e.g. the `josich.github.io` repository, as Polyorbit's).
- [ ] **Store listing texts**: name (30), short description (80), full description (4000). Drafts by us.
- [ ] Later (not now, the user's word): screenshots and the 1024 × 500 feature graphic.
- [ ] **Data safety form**: no data collected or shared; purchases handled by Google Play. Content rating; target
  audience 13+; category Music & Audio (or Education).
- [ ] Stop the GitHub APK releases and the web version at the launch (the workflow), and point anything that linked
  to them to the Play listing.

## Signing (decide before the first Play upload)

The signing key `android/app/bassclass.p12` and its password are in the repository's history, which has been public:
anyone could sign an APK that installs over BassClass. Making the repository private later does not un-publish them
(clones and forks keep them). So, recommended: **let Google Play make its own app signing key** (Play App Signing)
and upload with a **new upload key** kept out of git (a GitHub secret). The cost: a phone with the GitHub APK cannot
update into the Play version; its owner saves a backup (Settings → Backup), uninstalls, installs from Play and loads
the backup, and keeps everything. (MONETIZATION-PLAN.md's first idea, giving Play our own key, would avoid that step
but would sign the Play app with a key the whole world has had.)

## If the repository goes private

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
