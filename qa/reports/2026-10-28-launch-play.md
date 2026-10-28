# BassClass on Google Play: what remains before production

Release-engineering review, 2026-10-28, at `a14a09a` (Android files, `billing.js` and the workflows are unchanged since
`267b86f`). Read-only: nothing in the app was edited, built or downloaded. Requirements were checked on Google's and
GitHub's own pages today (sources below); line numbers are at `a14a09a`. In-app defects are left to QA round 20
(`qa/reports/267b86f-*.md`). That includes its m6, the Play review library's licence in About, which is not repeated here.

Owner: **ours** = code or texts (Claude), **owner** = Play Console, account or money (the user).
Effort: **S** = hours, **M** = a day or two, **L** = several days or calendar time.

## 1. Current Google Play requirements (verified 2026-10-28)

| Requirement | The rule today | BassClass | Source (page date) |
|---|---|---|---|
| Target API | New apps and updates must target **API 36** since 31 Aug 2026; an extension can be requested to 1 Nov 2026. Existing apps must target 35 or higher to stay visible on newer Android. No later deadline has been announced; the yearly pattern points to API 37 around Aug 2027 (our inference). | `targetSdk = 36`, `compileSdk = 36` ✓ (`app/build.gradle.kts:15,21`) | [target-sdk](https://developer.android.com/google/play/requirements/target-sdk) (2026-10-16) |
| Play Billing Library | New apps and updates must use **v8 or later** since 31 Aug 2026 (extension to 1 Nov 2026); v8's own deadline is 31 Aug 2027. Latest is **9.1.0** (2026-06-18). v8 removed `queryPurchaseHistory`, the no-argument `enablePendingPurchases()` and `querySkuDetails`, and added `enableAutoServiceReconnection()` and unfetched products in `queryProductDetailsAsync`. 8.1 raised minSdk to 23 and supports Kotlin 2.2. 9.0 needs AndroidX Core ≥ 1.9 for one error code. | Not integrated | [deprecation FAQ](https://developer.android.com/google/play/billing/deprecation-faq) (2026-10-23), [release notes](https://developer.android.com/google/play/billing/release-notes), [integrate](https://developer.android.com/google/play/billing/integrate) |
| 16 KB page size | Apps targeting 35+ must support 16 KB pages. Updates without it are blocked from **1 Feb 2027**. An app whose code and libraries are all Java/Kotlin already complies. | No native code (WebKit, Review and Billing are Java) ✓. Add a check that the bundle has no `.so` (S2). | [page-sizes](https://developer.android.com/guide/practices/page-sizes) (2026-10-16) |
| App Bundle, Play App Signing | New apps must publish an **AAB** (since Aug 2021). A new app is enrolled in Play App Signing automatically, with a Google-generated key (RSA 4096). The upload key should be RSA ≥ 2048 and separate from the app signing key; a lost upload key can be reset. | Only an APK, signed with the public `bassclass.p12` | [Play App Signing](https://support.google.com/googleplay/android-developer/answer/9842756), [AAB requirement](https://support.google.com/googleplay/android-developer/answer/9844279) |
| Testing before production | Personal accounts created after **13 Nov 2023**: a **closed test** with **≥ 12 testers opted in continuously for ≥ 14 days**, then "Apply for production" (review "usually seven days or less"). The page words it per app ("a closed test for their app"). Internal testing does not count. Organisation accounts are exempt (third-party sources only). | Not started | [answer 14151465](https://support.google.com/googleplay/android-developer/answer/14151465) |
| Android developer verification | Play developers: the identity already verified in Play Console is enough. Creating the app in Play Console registers the package name; about 99% of apps were registered automatically. Enforcement started **30 Sep 2026** in Brazil, Indonesia, Singapore and Thailand and goes global in **2027**. Apps distributed outside Play register through the Android Developer Console. | `com.bassclass.app` is free on Play (its store page returns 404) | [developer-verification](https://developer.android.com/developer-verification), [Play Console guide](https://developer.android.com/developer-verification/guides/google-play-console) (2026-09-30) |
| Personal account, what is public | Play shows your **legal name, country and developer email**, and your **full address once you monetise**. Contact email and phone are checked by one-time code. Verifying the payments profile can take up to 5 days. | Account type still open (LAUNCH-TODO) | [answer 13628312](https://support.google.com/googleplay/android-developer/answer/13628312) |
| Permissions | RECORD_AUDIO is a normal runtime permission and is **not** on the Permissions Declaration Form (that form covers SMS, Call Log and similar). | Only RECORD_AUDIO and MODIFY_AUDIO_SETTINGS (`AndroidManifest.xml:7-8`) ✓ | [answer 9859455](https://support.google.com/googleplay/android-developer/answer/9859455) |
| WebView / spam | Forbidden: showing "a webview of a website without permission" and apps whose main purpose is affiliate traffic. Apps that bundle their own content are not the target, but the "low quality" and minimum-functionality rules still apply. | Original, offline content served from the APK ✓ | [Spam and minimum functionality](https://support.google.com/googleplay/android-developer/answer/9899034) |
| Payments | Digital items and app features go through Play Billing; only tax-exempt donations are excluded, so **tips must use Play Billing**. The app must not lead users to any other way to pay. | Tips are Play products ✓. No other payment links (grep: none) ✓ | [Payments policy](https://support.google.com/googleplay/android-developer/answer/9858738) |
| Data safety, privacy policy | "Collect" means **transmitting data off the device**, so on-device processing is not collection. Every app fills in the form and **links a privacy policy**, even one that collects nothing. Google lists Billing Library use as a reason to consider declaring "Purchase history", and RECORD_AUDIO under "Voice or sound recordings" (only if the audio is transmitted). | Policy exists only inside the app (About) | [answer 10787469](https://support.google.com/googleplay/android-developer/answer/10787469), [collect-share](https://developer.android.com/guide/topics/data/collect-share) |
| Store listing graphics | Publishing needs a **512 px icon**, a **1024×500 feature graphic** and **at least 2 screenshots**. A screenshot's long side may be **at most twice its short side**. | Icon ✓. Feature graphic and screenshots marked "Later" in LAUNCH-TODO | [answer 9866151](https://support.google.com/googleplay/android-developer/answer/9866151) |
| Content rating, target audience | Unrated apps "may be removed". If the target audience includes children, the Families policy applies. | To do | [answer 9859455](https://support.google.com/googleplay/android-developer/answer/9859455) |
| Android 16 behaviour (API 36) | On screens ≥ sw600dp the orientation lock is ignored. The opt-out property works only until apps target **API 37**. `onBackPressed` is no longer called. The edge-to-edge opt-out is disabled. | Opt-out set (`AndroidManifest.xml:27`) ✓. Back goes through `OnBackInvokedDispatcher` ✓ | [behaviour changes 16](https://developer.android.com/about/versions/16/behavior-changes-16) |
| GitHub, private repository | GitHub Free gives private repositories **2,000 Actions minutes a month** and **500 MB of artifact storage**; extra Linux minutes cost $0.006. Public repositories are free. Pages from a private repository needs a paid plan. | Public today | [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions) |

Not verified today: Google's DSA "trader" help page (its URL returned 404) and the Play Console's current list of
"App content" declarations beyond the six on answer 9859455. The Console shows both as tasks.

## 2. Blockers (Play will reject the app, or purchases will not work)

### B1. The `play` flavour, the App Bundle and upload-key signing (ours, M)
Nothing builds a Play artifact yet. `app/build.gradle.kts` has one variant, signed with the public key.

- **Flavours**: `flavorDimensions += "store"`, with `github` (as today) and `play`. Turn on `buildFeatures { buildConfig = true }`
  and add `buildConfigField("String", "STORE", "\"play\"")` (or `""` for github).
- **Signing gotcha**: `buildTypes.release` sets `signingConfig` (`build.gradle.kts:39`), and a build type's signing
  config **overrides the flavour's**. Take it out of the build type and set it per flavour:
  - `github` → `bassclass` (the committed key, as today).
  - `play` → `upload`, read from environment variables: `UPLOAD_KEYSTORE` (a file path), `UPLOAD_STORE_PASSWORD`,
    `UPLOAD_KEY_ALIAS`, `UPLOAD_KEY_PASSWORD`.
  - Fail `bundlePlayRelease` when those variables are missing, so an unsigned or wrongly signed bundle never comes out.
    Never use `bassclass.p12` as the upload key: it is public.
- **Tasks**: `assembleGithubRelease` writes `apk/github/release/app-github-release.apk`. The copy at
  `android-apk.yml:58` must follow, or CI breaks. `bundlePlayRelease` writes `bundle/playRelease/app-play-release.aab`.
- **`window.BASS_STORE = "play"` before any page script.** `pro.js:41` reads it once, when `app.js` imports it, so
  setting it later does nothing. Two ways, best used together:
  1. `WebViewCompat.addDocumentStartJavaScript(web, "window.BASS_STORE='play';", setOf("https://appassets.androidplatform.net"))`,
     guarded by `WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)`. It is in androidx.webkit
     1.12.1, already a dependency, and the origin rule keeps it off any other page.
  2. A fallback that works on every WebView: in `MimeFixingHandler` (`MainActivity.kt:370`), when `BuildConfig.STORE`
     is not empty and the path is `index.html`, rewrite the response to put
     `<script>window.BASS_STORE="play"</script>` before `<script type="module" src="js/app.js">` (`web/index.html:23`).
     Without a fallback, a phone with an old WebView would get the Play build with every gate off.
- **Debug panel**: already off when `PLAY` (`proDebug.js:119,132`) ✓. Leave `web/js/dev/` (drum lab, icon tools)
  and `web/js/selftest.js` out of the Play bundle (S7).
- **Billing only in `play`**: add `"playImplementation"("com.android.billingclient:billing:9.1.0")`. The review library
  can stay in both flavours.
- **One JS object, two flavours**: `billing.js` expects the billing methods on `BassClassNative` itself
  (`billing.js:21`), and a WebView exposes one Java object per name. Make `NativeBridge` extend a flavour class:
  - `src/play/java/.../StoreBridge.kt`: `open class StoreBridge(a: MainActivity)` with the three
    `@JavascriptInterface` billing methods.
  - `src/github/java/.../StoreBridge.kt`: the same class, empty.
  - `MainActivity.kt:85`: `inner class NativeBridge : StoreBridge(this@MainActivity)`. The WebView exposes inherited
    annotated public methods.

### B2. The billing bridge in Kotlin (ours, M–L)
This is the full list for `billing.js`'s protocol (`billing.js:6-12`). Section 5 has the method-by-method spec.
- Use Billing Library **9.1.0**, or at least 8.x.
- **Probably bump Kotlin** (`android/build.gradle.kts:3`, `2.0.21` → `2.2.x`, which works with AGP 8.13.2). Billing
  8.1+ is built for Kotlin 2.2, and a 2.0 compiler cannot read 2.2 metadata, so the build is likely to fail with
  "compiled with an incompatible version of Kotlin". This is an inference; the first CI run will show it.
- The client: one `BillingClient`, built with
  `enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())` and
  `enableAutoServiceReconnection()`. Close it in `onDestroy`.
- The calls: `queryProductDetailsAsync`, which must handle `getUnfetchedProductList()`, and `launchBillingFlow` on the
  main thread. `@JavascriptInterface` calls arrive on a background thread.
- Purchases: grant only at `PURCHASED`. Acknowledge Pro and consume tips (`consumeAsync`) at once. Run
  `queryPurchasesAsync` on every `billingOwned` and in `onResume`, to acknowledge or consume anything left over.
- Handle `onPurchasesUpdated` calls that come with no request waiting (see B3).
- Product IDs are permanent and cannot be reused. Play Console has **no "consumable" setting**: the code decides by
  consuming. LAUNCH-TODO's "(consumable)" is a code rule, not a Console field.

### B3. Three gaps in the JS protocol that lose real purchases (ours, S)
- **The 60-second timeout** (`billing.js:35`) also applies to `billingBuy`. Buying can easily take longer: adding a
  card, a bank's 3-D Secure check, a password prompt. Then:
  - `buy()` resolves `'error'` and the sheet says the purchase failed.
  - Play's late answer is **dropped**, because the listener finds no waiting request (`billing.js:26-27`).
  - The next check is throttled for 30 minutes (`billing.js:96`), and `pendingPro` is false. A player who paid sees
    no Pro until a restart or Restore.

  Fix: no timeout for `billingBuy` (or 10 minutes or more), and apply a late answer anyway.
- **No answers that arrive on their own.** Play calls `onPurchasesUpdated` without a request when a pending purchase
  completes while the app is open, and for some promotional purchases. The protocol has no event for this. Fix: native
  sends `bassclass-billing` with `req: null` and `ids`, and `billing.js` then calls `setOwned(true)` or
  `syncPro({ force: true })`.
- **A promo code redeemed in the Play Store app.** It does not show on returning to the app for up to 30 minutes
  (`billing.js:96`). Fix: on return, force the check when the Pro sheet is open, or shorten the throttle to a minute or
  two. Native `onResume` already queries purchases (B2).

### B4. The upload key and GitHub secrets (owner + ours, S)
- Make a BassClass-only upload key: `keytool -genkeypair -storetype PKCS12 -keyalg RSA -keysize 4096 -validity 10000 -alias upload`.
- Save it to the user's Drive beside Polyorbit's.
- Add four repository secrets: `PLAY_UPLOAD_KEYSTORE_B64` (the file, base64), `PLAY_UPLOAD_STORE_PASSWORD`,
  `PLAY_UPLOAD_KEY_ALIAS` and `PLAY_UPLOAD_KEY_PASSWORD`.
- Keep Play's Google-generated app signing key, which is the default: do not press "Change key".
- `.gitignore` has no `*.jks`, `*.keystore` or `upload*.p12` lines. Add them before the key exists anywhere near the
  working tree.

### B5. The account and money (owner, M, plus waiting)
- **The developer account** (personal or organisation).
  - Personal: since you sell, Play **shows your legal name and full home address** on the listing, and the 12×14
    closed test applies.
  - Organisation: needs a D-U-N-S number, shows the organisation's address, and (by third-party accounts) skips the
    closed test.
  - Decide this first; it changes the timeline.
- **The payments profile and merchant account**: bank details and tax information; verification takes up to 5 days.
- **EU trader status (DSA)**: declare it in the Console. Without it, Google has said EU distribution stops (the help
  page could not be re-read today).
- **Products, in this order**: upload a first AAB that has the Billing Library (which brings the `BILLING`
  permission) to internal testing, *then* create `bassclass_pro`, `bassclass_tip_2` and `bassclass_tip_4`. The Console
  generally lets you create products only once such a build is uploaded.

### B6. Closed test, then production access (owner, L: at least 14 days of calendar time)
- **12 testers opted in for 14 days in a row.** If the count drops below 12 the clock restarts (third-party
  reports), so recruit 14–15.
- **Add every tester as a licence tester** (Play Console → Settings → License testing). Otherwise a tester who buys
  Pro **pays real money**.
- Then "Apply for production" (about 7 days), then the first production review.
- If Polyorbit's account already did this, BassClass probably still needs its own closed test (the help page words it
  per app).

### B7. The privacy policy at a public URL that stays up (owner + ours, S)
Play needs a URL, and today the text exists only in About (`about.js:78-89`). GitHub Pages ends when the repository
goes private (LAUNCH-TODO, "What changes once it is private"), so host it somewhere that stays public. A small public repository
`josich.github.io` (as Polyorbit's) works on the free plan. Do this **before** the switch: a dead privacy URL is grounds
for removal.

### B8. The App content declarations (owner, S; drafts below)
- **Privacy policy**: the URL from B7.
- **Ads**: No.
- **App access**: everything is open without sign-in. Optionally tell reviewers that Pro is bought through Play.
- **Advertising ID**: No (check that `AD_ID` is absent from the merged manifest, S2).
- **Content rating (IARC)**: expect Everyone / PEGI 3, with "In-app purchases".
- **Target audience**: 13+. Keep under-13s out, so the Families policy does not apply. The privacy policy already
  says so (`about.js:88`).
- **The other declarations the Console lists** (government, financial features, health, news): No.
- **Data safety**:
  - "No data collected" holds under Google's own definition. The tuner's audio, the progress, the backups and the Pro
    flag never leave the phone.
  - Feedback is an e-mail the player sends from their own mail app (user-initiated).
  - The cautious alternative is to declare **Purchase history**: collected, not shared, required, for App
    functionality. Google lists the Billing Library as a reason to consider it.
  - The owner decides. Either way the privacy policy must match.

### B9. The store listing (ours drafts, owner approves, M)
- **Texts**: title (≤ 30 characters), short description (≤ 80) and full description (≤ 4000).
- **Graphics**: the feature graphic **1024×500** and **at least 2 screenshots**.
  - LAUNCH-TODO has these as "Later", but publishing needs them.
  - Landscape phone captures at 20:9 (2400×1080) **break the 2:1 limit**: crop or pad them to 1920×1080 or
    2160×1080.
  - At least 4 screenshots of 1080 px or more make the listing eligible for recommendations.

## 3. Should do before launch

### S1. Keep the bridge and the microphone on the app's own origin (ours, S)
- `addJavascriptInterface` (`MainActivity.kt:196`) exposes `BassClassNative` to **every** page the WebView shows.
- `shouldOverrideUrlLoading` returns `false` for every scheme but `mailto` (`MainActivity.kt:204`), so an `https:`
  link would load inside the WebView with the bridge, and with billing, in reach.
- No INTERNET permission makes this theoretical today. It stops being theoretical if a library ever merges INTERNET
  in (see S2).
- Fixes:
  - Open any host other than `appassets.androidplatform.net` with `ACTION_VIEW` and return `true`.
  - Grant `RESOURCE_AUDIO_CAPTURE` only when `request.origin.host` is the app's own (`MainActivity.kt:216-227`).
  - Set `allowContentAccess = false`. `allowFileAccess` already defaults to false at API 36; say so in code
    (`MainActivity.kt:191-193`).
  - Optional, for later: `WebViewCompat.addWebMessageListener` with an origin rule, instead of
    `addJavascriptInterface`.

### S2. Checks on what the build contains, in CI (ours, S)
Neither the review library nor the billing library's merged manifest could be inspected here, and nothing checks it.
After `bundlePlayRelease`, fail the job unless all of these hold:
- The merged manifest (`app/build/intermediates/merged_manifest*/playRelease/**/AndroidManifest.xml`) has **no**
  `android.permission.INTERNET` and **no** `com.google.android.gms.permission.AD_ID`, and has
  `com.android.vending.BILLING`. The privacy policy (`about.js:87`) and the Data safety answer rely on this.
- `unzip -l` of the AAB lists no `.so` (16 KB).
- `jarsigner -verify` passes on the AAB, and its certificate is the upload key, not `CN=BassClass, O=josich`.

Print the permissions of the GitHub APK too: `$ANDROID_HOME/cmdline-tools/latest/bin/apkanalyzer manifest permissions`.

### S3. Backup rules (ours, S–M, test on a phone)
- `allowBackup="true"` (`AndroidManifest.xml:12`) has no `android:dataExtractionRules` (API 31+) and no
  `android:fullBackupContent` (API ≤ 30).
- Auto Backup takes every `getDir()` folder, so all of `app_webview/` goes: the Local Storage that holds progress, and
  also the drum and piano copies in Cache Storage (`bassclass-drums-v4`, about 3.5 MB) and other WebView state.
- The quota is 25 MB per app; over it, the backup is not made at all.
- Fix: include `app_webview/Default/Local Storage/` (plus `IndexedDB/` if it is ever used) and exclude the rest.
- Test with `adb shell bmgr backupnow com.bassclass.app` and a restore on a phone from the internal track. The privacy
  policy already mentions Android's backup.

### S4. The `versionCode` rule (ours, S)
`versionCode = GITHUB_RUN_NUMBER` (`build.gradle.kts:7,22`) is fine for Play while it only goes up. Three ways to
break it:
- **Renaming `android-apk.yml`** makes a new workflow whose runs start again at 1.
- **"Re-run jobs"** keeps the same run number, and Play refuses a code it already has.
- Building the Play bundle in **another workflow file** gives it its own numbers, unrelated to the `v1.0.N` that
  Settings shows (`version.js`).

Keep the Play job in `android-apk.yml`, never rename the file, and upload a re-run only after a new run. Optionally add
an offset (`1000 + run`) so there is room for a manual hotfix.

### S5. Prices in the Play build (ours, S)
- In the Play build, show a price only when Play gives one. Today the €7.99 / €2 / €4 placeholders
  (`pro.js:24`, `billing.js:72-75`) appear whenever Play does not answer (offline, slow). During the €4.99 launch, and
  in every non-euro country, that is wrong.
- Do the launch price by setting the base price to €4.99 and raising it later. Do not show a "€7.99 → €4.99" reduction:
  the EU's price-reduction rule (Omnibus Directive) wants the prior price to be the lowest of the last 30 days, which
  a price never charged is not. The app shows no reduction today ✓; keep it that way in the listing too.
- If you use a one-time-product *discount offer* instead, `billingPrices` and `billingBuy` must pick the same offer
  token.

### S6. Native `onResume` purchase query (ours, S; part of B2)
Google asks for `queryPurchasesAsync` in `onResume`. Today it depends on the JS `visibilitychange` sync, which is
throttled to 30 minutes (`billing.js:96`, `app.js:221`). Acknowledgement (the 3-day refund rule) and consuming a stuck
tip must not wait for that throttle.

### S7. Leave the developer tools out of the Play bundle (ours, S)
- `web/js/dev/` (144 KB: the drum lab, the icon and sample tools) and `web/js/selftest.js` ship in the APK today.
  Nothing links to them, but they are not app content.
- `ignoreAssetsPattern` (`build.gradle.kts:63`) is global, so the simplest fix is in the Play job of CI:
  `rm -rf web/js/dev web/js/selftest.js` before `bundlePlayRelease`. The GitHub APK keeps them for testing.

### S8. The store-listing texts and the metadata policy (ours + owner, S)
- Keep artists, song titles, other teachers and brands **out of the listing**: online bass schools, other teachers, the
  famous songs behind the style studies. Play's metadata and intellectual-property rules treat third-party names in
  descriptions as keyword stuffing or impersonation.
- In-app, About already says they are named for reference only ✓.
- Say "In-app purchase: BassClass Pro, once" plainly. Use no ranking claims ("best", "#1") and no "free" in the title.

### S9. Test purchases before the closed test (ours + owner, M)
On the internal track, with licence testers:
- buy, cancel, and the test cards that **decline** and that **approve or decline after a few minutes**, which exercise
  pending purchases and the timeout in B3;
- a purchase that takes more than 60 seconds;
- a refund from Order management, then two checks a day apart;
- Restore on a second phone; the app opened offline;
- a tip bought twice in a row; Pro bought when already owned (`ITEM_ALREADY_OWNED` → `'owned'`);
- `requestReview`, which shows only in an app installed from Play.

### S10. Going private (owner + ours, S; on the day, in this order)
1. Move the privacy policy (B7).
2. **Delete the old Actions artifacts.** There are **139 APK artifacts, about 1 GB** (763 MB in the newest 100 alone; up to 10.7 MB each), kept for 90 days.
   That is over the Free plan's **500 MB** for private repositories, so new uploads would fail and the build job with
   them. Then add `retention-days: 3` to `actions/upload-artifact` (`android-apk.yml:60-63`), or drop that step:
   the Release already holds the APK.
3. Remove `pages.yml`. Its `check` job still costs a billed minute on every push.
4. Stop the GitHub APK releases, as decided, and build the Play bundle on demand (Section 6).
5. Sign `gh` in, so Claude's CI checks keep working (LAUNCH-TODO already says this).

On minutes: an APK run takes 75–90 s, billed as 2 minutes, plus about a minute for Pages, so about 3–4 minutes a push.
2,000 minutes is about 500 pushes a month. That is enough if the Play bundle is built on demand.

### S11. Stale lines in MONETIZATION-PLAN.md (ours, S)
- Line 108 names the bridge `buy(id)`, `owned()`, `prices(ids)`. `billing.js` and LAUNCH-TODO say `billingBuy`,
  `billingOwned`, `billingPrices`.
- Lines 129-131 still say to give Play our own `bassclass.p12` as the app signing key, the opposite of the decision in
  LAUNCH-TODO ("Signing").

Whoever builds the bridge should read `billing.js` only.

## 4. Can wait

- **C1. R8 / minify** (`build.gradle.kts:38`, ours, S–M). It gains little, because about 9 MB of the app is audio.
  - If it is turned on: `-keepclassmembers class * { @android.webkit.JavascriptInterface <methods>; }` and
    `-keepattributes JavascriptInterface`. Without them, R8 renames the bridge and every native call fails silently.
  - The Billing and Review libraries bring their own consumer rules. AGP puts the mapping file in the AAB.
- **C2. API 37 and tablets** (owner + ours, M–L, before about Aug 2027). The orientation opt-out
  (`AndroidManifest.xml:27`) ends when the target moves to 37. Then tablets and foldables (sw600dp or wider) can run
  the app in portrait, and today they would show the "Turn your phone sideways" screen (`index.html:18-22`). Plan a
  portrait or resizable layout for large screens.
- **C3. Edge-to-edge warnings.** `android:statusBarColor` and `navigationBarColor` have no effect at API 35+, and
  `shortEdges` is deprecated there (`themes.xml:5-7`). Play Console may list them as recommendations; it does not
  reject for them. The app hides the system bars anyway.
- **C4. Automatic upload to the internal track.** Use a service account and an upload action. Upload the first bundle
  by hand in the Console.
- **C5. `androidx.core` ≥ 1.9.** Billing 9 then reports a Play Store blocked by the system (a kids mode, say) as
  `BILLING_UNAVAILABLE` instead of `ERROR`. Both map to `'error'` in our protocol, so this is cosmetic.
- **C6. Developer verification for the GitHub APK.** It matters only if that APK lives into 2027, or reaches the four
  countries enforced since 30 Sep 2026. It is decided to stop at the launch.
- **C7. Checking purchases on the phone.** Checking the purchase signature on the phone can be bypassed. Google
  recommends a server, and the plan accepts trusting the phone ("generous by rule"). Write it down as an accepted risk.
- **C8. The privacy text mentions the web version** (`about.js:87`). Update it when the web version goes.
- **C9. Microphone explanation.** A one-line explanation before Android's microphone dialog is good practice. Policy
  does not require it, since the audio stays on the phone.

## 5. The billing bridge, method by method

The protocol is the one at the top of `billing.js`. The answer goes to
`window.dispatchEvent(new CustomEvent('bassclass-billing', {detail: <JSON>}))` through `evaluateJavascript` on the main
thread. Build the JSON with `JSONObject`: prices hold `€` and non-breaking spaces.

| JS call | Native work | Answer |
|---|---|---|
| `billingPrices(idsJson, req)` | `queryProductDetailsAsync` for the ids as `ProductType.INAPP`; for each `ProductDetails`, the `formattedPrice` of the offer you sell (`oneTimePurchaseOfferDetailsList`); unfetched products are left out | `{req, result:'ok', prices:{id: '4,99 €'}}`; any other code → `{req, result:'error', error:'<code>'}` |
| `billingBuy(id, consumable, req)` | One at a time (a second call → `'error'`, busy). Query `ProductDetails` fresh (Google: do not cache), pick the offer token, `launchBillingFlow` **on the main thread**. Keep `(id, consumable, req)` waiting. | Launch not OK → answer now: `ITEM_ALREADY_OWNED` → `'owned'` (Pro) or consume the stuck tip and answer `'error'`; `USER_CANCELED` → `'cancel'`; others → `'error'` |
| `onPurchasesUpdated` | `PURCHASED` → tip: `consumeAsync`; Pro: `acknowledgePurchase` if not acknowledged. `PENDING` → grant nothing, acknowledge nothing. | The waiting request: `'ok'` (after the acknowledgement or consumption; if that fails, still `'ok'` and retry later), `'pending'`, `'cancel'`, `'owned'`, `'error'` + the code and sub-code. **No request waiting** → `{req:null, result:'update', ids:[…]}` (B3) |
| `billingOwned(req)` | `queryPurchasesAsync(QueryPurchasesParams.newBuilder().setProductType(INAPP).build())`. Each `PURCHASED` purchase: Pro → into `ids`, acknowledged if not yet; tip → consumed. `PENDING` → not in `ids` (optionally `pending:[…]`). | `{req, result:'ok', ids:[…]}`; **any** failure (`SERVICE_UNAVAILABLE`, `BILLING_UNAVAILABLE`, disconnected) → `'error'`, never an empty `ids`. `billing.js:100` relies on this to tell "could not ask" from "not owned". |
| `onResume` (native) | The same query as `billingOwned`, for acknowledgement and consumption; send `'update'` only when Pro's state changed | — |

Refunds: a refunded one-time product drops out of `queryPurchasesAsync`, and the JS takes Pro back on a second check a
day later (`billing.js:106-116`). Without a server there is no Voided Purchases API. Play also refunds by itself a
purchase left unacknowledged for 3 days: the acknowledgement on every `billingOwned` and `onResume` covers that.

Small points in the JS:
- A pending *tip* has no follow-up, so its thank-you never comes. Harmless.
- `canBuy()` is true as soon as the bridge exists, even when Play answers `BILLING_UNAVAILABLE` (no Play Store, signed
  out). Acceptable, because the sheet then reports the error.

## 6. CI: the Play bundle beside the GitHub APK

Keep one workflow (`android-apk.yml`), so the version numbers stay together:

```yaml
on:
  push: { branches: [main] }          # GitHub APK, as today (until the launch)
  workflow_dispatch:                   # the Play bundle: run by hand (or on a `play-*` tag)
    inputs: { play: { type: boolean, default: true } }
...
      - name: Build GitHub APK
        run: |
          gradle -p android assembleGithubRelease
          cp android/app/build/outputs/apk/github/release/app-github-release.apk BassClass.apk
      - name: Build Play bundle
        if: github.event_name == 'workflow_dispatch' && inputs.play
        env:
          KS_B64: ${{ secrets.PLAY_UPLOAD_KEYSTORE_B64 }}
          UPLOAD_STORE_PASSWORD: ${{ secrets.PLAY_UPLOAD_STORE_PASSWORD }}
          UPLOAD_KEY_ALIAS: ${{ secrets.PLAY_UPLOAD_KEY_ALIAS }}
          UPLOAD_KEY_PASSWORD: ${{ secrets.PLAY_UPLOAD_KEY_PASSWORD }}
        run: |
          echo "$KS_B64" | base64 -d > "$RUNNER_TEMP/upload.p12"
          export UPLOAD_KEYSTORE="$RUNNER_TEMP/upload.p12"
          rm -rf web/js/dev web/js/selftest.js            # S7
          gradle -p android bundlePlayRelease
          # S2 checks: no INTERNET / AD_ID, BILLING present, no .so, signed with the upload key
          rm -f "$RUNNER_TEMP/upload.p12"
      - uses: actions/upload-artifact@v4
        if: github.event_name == 'workflow_dispatch' && inputs.play
        with: { name: BassClass-play-aab, path: android/app/build/outputs/bundle/playRelease/*.aab, retention-days: 7 }
```

- **Never attach the AAB to a GitHub Release.** While the repository is public, even artifacts can be downloaded by
  any signed-in GitHub user. Prefer building Play bundles once the repository is private, or keep retention short.
- Secrets are not given to workflows from forks, so outside pull requests cannot reach the key.
- After the launch the push trigger can stop building the GitHub APK. A `[skip ci]` habit already exists for notes.

## 7. Order and calendar

1. Owner: account and type (B5), payments profile, trader status. Ours: B1, B2, B3, S1, S2, S5–S7 (about 3–4 days of
   code), and the upload key (B4).
2. Upload the first AAB to **internal testing** → create the 3 products → licence testers → the S9 test matrix
   (2–3 days).
3. Privacy URL (B7), App content (B8), listing and graphics (B9), then the **closed test**: 12 or more testers, all
   licence testers, **14 days**.
4. Apply for production (about 7 days), then a production review, then a staged rollout.
5. Freeze the numbers (LAUNCH-TODO) and make the repository private (S10) just before production.

Realistic earliest production date: about **4 weeks** after the first internal-testing upload, if the account is
personal and the 14 days run without a reset.
