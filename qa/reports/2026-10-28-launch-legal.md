# BassClass: launch legal and compliance review

Date: 2026-10-28. Commit reviewed: `a14a09a` ("Free to try: the first two lessons of each Pro stage").
Reviewer: compliance review by Claude (app-compliance reviewer, **not a lawyer**). This is a checklist of risks and
fixes, not legal advice. Items marked **⚖ lawyer** are where a short paid consultation (a lawyer, or for tax an
accountant / *gestor*) is worth the money.

Scope: privacy (GDPR, Google Play User Data and Data safety), selling digital content in the EU through Google Play,
licences of every bundled asset and library, IP and naming, and age. Read: `web/js/ui/about.js`, `web/js/feedback.js`,
`web/js/ui/rate.js`, `web/js/ui/proSheet.js`, `web/js/ui/proDebug.js`, `web/js/pro.js`, `web/js/billing.js`,
`web/js/curriculum/songs.js` and the `source:` lines of every curriculum module, `web/audio/*/LICENSE.txt`,
`web/licenses/`, README "Credits", `LAUNCH-TODO.md`, `MONETIZATION-PLAN.md`, `CLAUDE.md`,
`android/app/build.gradle.kts`, `AndroidManifest.xml`, `MainActivity.kt`, and the staged licence files in
`web/_raw/kits/` (gitignored). Every network call in `web/js` was checked: all are relative (the app's own files).

**Assumption on the country.** Google Play opened in the Spanish store from this PC, and the course cites Spanish
conservatories and Taller de Músics, so where national law matters this report uses **Spain** as the example. Confirm
your country of residence; the EU-level points apply anywhere in the EU.

---

## 0. The verdict in one table

| # | Item | Bucket | Who acts | ⚖ |
|---|---|---|---|---|
| 1 | Privacy policy at a public, permanent URL (Play blocks publishing without it; RECORD_AUDIO makes it certain) | **Must** | owner + us | |
| 2 | Privacy policy content: controller identity, legal bases, retention, rights, Google/Gmail, what Play Console gives us, the network sentence | **Must** | us (text) | ⚖ light |
| 3 | Play Billing Library pulls in Google's data-transport (telemetry) libraries, very likely adding the INTERNET permission: check the merged manifest, then strip or disclose | **Must** | us (code) | |
| 4 | "provided as is, without warranty" in a paid consumer app; add "your statutory rights are not affected" | **Must** | us (text) | |
| 5 | About's "Open-source libraries" says everything is Apache 2.0: Play Review / Billing are not; Google's notices | **Must** | us (text, build) | |
| 6 | DSA trader declaration: as a monetising personal account your legal name and full address become public | **Must** (decision) | owner | ⚖ |
| 7 | Tax and business registration before the first sale (Spain: census, IAE, RETA, ROI/349 for sales to Google Ireland) | **Must** (decision) | owner | ⚖ (gestor) |
| 8 | Store listing rules: no song or artist names, no "was €7.99" launch strike-through | **Must** (when writing it) | us + owner | |
| 9 | Purchase terms: precise "yours for good", "everything we add", modification clause, refunds through us too | Should | us (text) | ⚖ light |
| 10 | Tip buttons hard-code "€2 / €4"; Pro shows "€7.99" until Play answers | Should | us (code) | |
| 11 | "Based on" lines name competitors' paid courses (SBL, TalkingBass, BassBuzz, StudyBass, Berklee Online, MI codes) and specific exam grades | Should | us (text) | |
| 12 | Song studies: soften "never its notes", add "not affiliated" to each study, an ear check of 6 riff studies | Should | us + owner | ⚖ optional |
| 13 | WebView usage-statistics opt-out (one manifest line) so "nothing sent" stays true | Should | us (code) | |
| 14 | Feedback: policy lists only "version and phone model"; the mail also carries Android version, screen, strings, date | Should | us (text) | |
| 15 | DDA support duty: answer paid-product users within 3 business days | Should (operational) | owner | |
| 16 | Fallback rate card: five star buttons that all do the same thing | Should (low) | us (code) | |
| 17 | CC BY credit (MuldjordKit), CC0 credits, bass clef icon, the name "BassClass", age 13+, review card flow, tips via Play Billing, withdrawal waiver, VAT | Fine | — | |

---

## 1. Privacy

### 1.1 What the code really does (data map)

| Data | Where it goes | Who can see it | About's policy says | Accurate? |
|---|---|---|---|---|
| Settings, progress, course, sessions, favourites, practice log, Pro flag (`bassclass.*` in WebView localStorage) | stays on the phone | the player only | yes | ✓ |
| Microphone audio (tuner) | analysed in memory (`audio.js` `getUserMedia`, no `MediaRecorder`), never stored | nobody | yes | ✓ |
| Backup JSON (`backup.js`, `BassClassNative.saveFile` → Android "Save to") | a place the player picks | the player | yes | ✓ |
| Android Auto Backup (`android:allowBackup="true"`, no rules file) | the player's Google account (Google's service) | Google | yes | ✓ (could name Google's policy) |
| Feedback (`feedback.js`) | the player's own email app, pre-filled to polyorbit.app@gmail.com | **us**, and Google (Gmail hosts the inbox) | "naming the app's version and your phone's model" | **Partly**: the body also carries Android version, screen size, number of strings, date, "Android app"/"web" |
| Purchases (Play Billing, bridge to come) | Play Store app ↔ Google; the page gets only product ids/results (`billing.js` protocol) | Google; **we get order records in Play Console** (order number, product, price, date, buyer country/region) | "BassClass receives only whether a purchase was made" | **Incomplete**: true of the app, not of the developer (GDPR art. 14 covers data we get from Google) |
| Play in-app review (`play:review:2.0.2`) | Google Play | Google; **the review is public and shown to us** in Play Console | "talks only to Google Play … for its rating card" | **Incomplete**: reviews reach us |
| Play Console statistics (installs, crashes/ANRs, ratings) | Google → us | us | not mentioned | add one line |
| Billing Library's own dependencies (see 1.6) | very likely Google telemetry over the network | Google | "works without an internet connection; it talks only to Google Play" | **Check** after the bridge is built |
| Web version (GitHub Pages, until launch) | GitHub logs IP addresses "for security purposes" | GitHub | yes | ✓ (until the web version stops) |

### 1.2 Gaps against GDPR art. 13/14 and Play's User Data policy

Google Play requires every app to have a privacy policy linked in the Console **and** in the app, on "an active,
publicly accessible and non-geofenced URL (no PDFs)", clearly labelled, covering developer information and a privacy
contact, the data accessed/collected/used/shared and with whom, secure handling, and "the developer's data retention
and deletion policy"; apps that touch no personal data "must still submit a privacy policy"
([User Data policy](https://support.google.com/googleplay/android-developer/answer/10144311)). GDPR art. 13 (data from
the person: the emails) and art. 14 (data from Google: orders, reviews) add the controller's identity, purposes and
legal bases, recipients, transfers outside the EU, retention, the rights and the right to complain to a supervisory
authority ([GDPR](https://eur-lex.europa.eu/eli/reg/2016/679/oj)). The Google APIs Terms (which the Play Core SDK
terms incorporate) also require a policy that "clearly and accurately describes" what you collect
([Google APIs ToS §3d](https://developers.google.com/terms)), and the DDA §4.8 a "legally valid" privacy notice where
you collect personal information ([DDA](https://play.google/developer-distribution-agreement.html)).

Missing or wrong today:

1. **Controller identity.** "Josich" is a trade name. GDPR asks for the controller's identity and contact; give the
   legal name and a postal address (the same one Play will show anyway, see §2.4). ⚖ light: whether an email-only
   contact suffices in your country.
2. **"BassClass collects no personal data."** True of the app, not of you: you receive emails and Play Console order
   and review data. Rephrase as "The app collects nothing about you" and add a "What reaches us" part.
3. **Legal bases, retention, rights, complaint authority**: absent. Play explicitly asks for retention and deletion.
4. **Recipients and transfers**: the inbox is consumer Gmail (Google LLC, US; covered by the EU–US Data Privacy
   Framework). Say so. (Optional: a Google Workspace address gives you a data processing agreement; consumer Gmail does
   not. Low risk for an indie, but it is the cleaner set-up.)
5. **"Secure data handling"** (a Play requirement): one line is enough (two-step verification on the inbox and the
   Play account; order data only in Play Console).
6. **Feedback fields**: list them all (see 1.1). They are visible and editable before sending, which is good; say so.
7. **Network sentence**: depends on 1.6.
8. **Web version paragraph**: drop it from the Play build's text once the web version stops; if the public policy page
   is itself on GitHub Pages, keep one line saying the page's host logs IP addresses.
9. **Children** (COPPA/GDPR hygiene): add "if a child under 13 writes to us, we delete the message once answered".

### 1.3 Proposed privacy policy (paste into About and the public page; fill the brackets)

> **Privacy policy: BassClass**
> Last updated: [date].
>
> **Who we are.** BassClass is made by Josich, the trading name of [LEGAL NAME], [POSTAL ADDRESS, COUNTRY] ("we").
> Contact: polyorbit.app@gmail.com. We are responsible (the "controller") for the personal data described here.
>
> **In short.** The app collects nothing about you: no account, no ads, no analytics, no tracking. Personal data
> reaches us only if you write to us, and from Google Play about purchases and reviews.
>
> **What stays on your device**
> - Your settings, progress, course, sessions, favourites, practice log and whether you own Pro are stored in the app
>   on your phone. We cannot see them. Uninstalling the app deletes them.
> - The microphone is used only by the tuner, only while it is open. The sound is analysed on the phone to find the
>   pitch and is never recorded, stored or sent.
> - A backup is a file you save where you choose. We never receive it.
> - Android's own backup, when it is on in your phone's settings, copies the app's data to your Google account so a new
>   phone can restore it. That is a Google service under Google's privacy policy; we never receive the copy.
>
> **What reaches us**
> - **Email.** If you write to us (Settings → Feedback, or any email) we receive your address, your message and what
>   you attach. Feedback fills in, where you can see and delete it before sending: the app's version, your phone's
>   model and Android version, the screen size, your bass's number of strings and the date. We use it only to answer
>   you and to improve BassClass (our legitimate interest, GDPR art. 6(1)(f); for a question about a purchase, art.
>   6(1)(b)). We keep emails for up to [2 years] after the conversation ends. Our mailbox is Gmail, provided by Google,
>   which may store it outside the EU under the EU–US Data Privacy Framework.
> - **Purchases.** BassClass Pro and tips are sold through Google Play. Google handles your payment details; we never
>   see them. For each purchase Google gives us an order number, the product, the price, the date and your country or
>   region, not your name, email or card. On your phone the app learns only which of our products your Google account
>   owns. We use order records for refunds, accounting and tax (contract and legal obligation, art. 6(1)(b) and (c))
>   and keep them as long as tax law requires ([6] years).
> - **Ratings and reviews.** A review you post on Google Play is public under your Google Play name; Google shows it to
>   us with your device model and language, and we may reply there.
> - **Statistics.** Google Play gives us statistics (installs, crash and performance reports, ratings) that do not
>   identify you.
> - **Google Play in the app.** BassClass itself makes no network requests. Google Play's purchase and rating
>   components inside it talk to the Google Play app on your phone, under Google's privacy policy
>   (policies.google.com/privacy). [If the INTERNET permission is kept, see §1.6: "…and may send Google diagnostic data
>   about purchases and the rating card."]
>
> **Sharing.** We do not sell or share your personal data. Google provides our email and runs Google Play.
>
> **Security.** Our mailbox and Google Play account use strong passwords and two-step verification; order data stays
> in the Google Play Console.
>
> **Your rights.** You can ask us for access to, correction or deletion of your data, to restrict or object to its
> use, or for a copy: write to us and we answer within a month. You may also complain to your data protection
> authority (in Spain, the AEPD: aepd.es).
>
> **Children.** BassClass is for players aged 13 and over and is not directed to children under 13. If a child under
> 13 writes to us, we delete the message once we have answered.
>
> **Changes.** We post changes here and in the app (About), with a new date.

(Until the web version stops, keep a line: "The web version is hosted on GitHub Pages, which logs visitors' IP
addresses for security (GitHub's privacy statement)." Keep the same line on the public page if it stays on GitHub
Pages.) ⚖ light: a one-hour review of this text by a privacy lawyer in your country is worth it once money is involved,
as LAUNCH-TODO already notes.

### 1.4 Play Data safety form: the answers, field by field

Google defines "collect" as "transmitting data from your app off a user's device"; data "only processed locally …
does not need to be disclosed"; transmissions by SDKs in the app count; a transfer "based on a specific
user-initiated action, where the user reasonably expects the data to be shared" is not "sharing"
([Data safety help](https://support.google.com/googleplay/android-developer/answer/10787469)).

| Console field | Answer | Reason |
|---|---|---|
| Does your app collect or share any of the required user data types? | **No** (provided §1.6 ends with no app-side network traffic) | Microphone: on-device only. Progress: on-device. Backup file and Feedback: user-initiated hand-offs to a place / an email app the player chooses (the "user-initiated action" exception). Android Auto Backup: an OS service into the user's own Google account; Google's help does not address it, and it is commonly not declared (the policy text discloses it anyway). Play Billing / Review: talk to the Play Store app on the device; Google publishes no Data-safety guidance for either library (checked the [SDK Index](https://play.google.com/sdks/details/com-android-billingclient-billing) and [Play services disclosures](https://developers.google.com/android/guides/play-data-disclosure)). |
| Encrypted in transit / deletion request | not asked when the answer is No | |
| Privacy policy URL | the public page (§1.5) | required even with no data ([Data safety help](https://support.google.com/googleplay/android-developer/answer/10787469)) |
| If INTERNET stays in the merged manifest (§1.6) | conservative option: **App info and performance → Diagnostics**: collected, not shared, required, for "App functionality" | SDK transmissions count; you would lose the "No data collected" label. Stripping the permission avoids this. |

The email you receive afterwards is not "collected by the app" under Google's definition (the player's email app sends
it). Some developers still declare "Email address (optional)"; with the reasoning above, No is defensible. Keep this
table with the launch notes so the answer can be justified if Google asks.

Other Console declarations (owner, 10 minutes): Ads: **No**. App access: everything is reachable without login (Pro is
a purchase, not an access restriction). Advertising ID: **No** (confirm the merged manifest has no
`com.google.android.gms.permission.AD_ID`). Financial features: **none** (in-app purchases are not a financial
feature). Health: **none**. News / Government: **No**. Content rating (IARC): music education, no violence, no user
interaction or sharing, **digital purchases: yes**. Target audience: see §5.

### 1.5 The public URL, and after GitHub Pages stops

LAUNCH-TODO already plans it. Options, cheapest first:
1. **A separate public repository just for the legal pages** (`josich/josich.github.io` user site, or
   `josich/bassclass-legal`) with GitHub Pages: free (the app repository can then go private), HTML, permanent. GitHub
   logs visitors' IPs ([GitHub Pages docs](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages)): say so on the page.
2. Google Sites (free, no new processor beyond Google).
3. A page on a domain you own (best long-term: survives any host change; about €10/year).

Keep one source for the text: generate the public page from the same strings as About, or the two drift. Point the
Console's "Privacy policy" field and, if you like, the listing's "Website" to it. The URL must not change after
launch without updating the Console.

### 1.6 Technical items that decide what the policy and Data safety may claim (us, code)

- **The Play Billing Library is not dependency-free.** Its POM (current 9.1.0, and 8.0.0) pulls in
  `com.google.android.datatransport:transport-api / transport-runtime / transport-backend-cct` (Google's event
  transport, Apache 2.0, with `firebase-encoders`), `play-services-base`, `-basement`, `-tasks` and
  `play-services-location:19.0.0`, plus `androidx.activity` and `androidx.core`
  ([billing-9.1.0.pom](https://dl.google.com/dl/android/maven2/com/android/billingclient/billing/9.1.0/billing-9.1.0.pom),
  [transport-backend-cct pom](https://dl.google.com/dl/android/maven2/com/google/android/datatransport/transport-backend-cct/3.1.8/transport-backend-cct-3.1.8.pom)).
  The transport backend uploads events over the network, so its manifest very likely declares `INTERNET` and
  `ACCESS_NETWORK_STATE`, which the manifest merger adds to the app. This would make "no INTERNET permission"
  (CLAUDE.md, LAUNCH-TODO) and the policy's network sentence untrue. **Do:** on the first Play build, print the merged
  manifest's permissions in CI (`aapt2 dump permissions` or `build/intermediates/merged_manifests`). Then either
  (a) remove them with `tools:node="remove"` in `AndroidManifest.xml` (billing goes through the Play Store app by IPC
  and should not need them; **verify buy, pending, restore and refund with licence testers**), keeping "no data
  collected"; or (b) keep them and use the bracketed policy wording plus the Diagnostics row in §1.4. Option (a) fits
  the app's promise.
- **Play Review 2.0.2** pulls `play-services-basement`, `play-services-tasks` and `core-common`
  ([review-2.0.2.pom](https://dl.google.com/dl/android/maven2/com/google/android/play/review/2.0.2/review-2.0.2.pom)).
- **WebView diagnostics.** Android System WebView may upload usage statistics through its own provider app when the
  user has "usage & diagnostics" on, whatever the app's permissions. Add inside `<application>`:
  `<meta-data android:name="android.webkit.WebView.MetricsOptOut" android:value="true" />`
  ([WebView privacy](https://developer.android.com/develop/ui/views/layout/webapps/webview-privacy)). Crash reports
  are not affected and carry no URLs. Optional: `android.webkit.WebView.EnableSafeBrowsing` = false, since the WebView
  only loads the app's own assets.
- **Auto Backup.** Fine to keep (decided in QA round 19). Note the 25 MB quota: if the WebView's Cache Storage still
  holds a copy of the kit, the backup may exceed it and silently stop; a `dataExtractionRules` /
  `fullBackupContent` file excluding `app_webview/…/Service Worker` and caches keeps the backup small and limited to
  progress. Not legal, but it keeps the policy's promise working.

---

## 2. Selling digital content in the EU through Google Play

### 2.1 Merchant of record, VAT

- In the countries Google lists (all EU states, the UK and others) Google acts as your agent and "is considered the
  merchant of record" for the sale; elsewhere you are (DDA §3.4, [DDA](https://play.google/developer-distribution-agreement.html),
  effective 15 Sep 2025; country list:
  [Play Console Help 7645364](https://support.google.com/googleplay/android-developer/answer/7645364)).
- For EU and UK customers "Google is responsible for charging, collecting and remitting the VAT"
  ([Google Play tax info](https://support.google.com/googleplay/answer/2850368)); payouts are net of it.
- **You** still declare the income in your country and, in the EU, your supply to Google's Irish entity is normally a
  B2B service under the reverse charge. In Spain that typically means: census registration (modelo 036/037) with an
  activity code, the self-employed regime (RETA) when the activity is habitual, intra-community operator registration
  (ROI) and modelo 349, and quarterly IRPF payments. **⚖ gestor/accountant before the first sale**: this is the one
  area where a wrong start costs real money (surcharges, social-security arrears).

### 2.2 The 14-day withdrawal right and immediate supply

- The right is lost for digital content not on a tangible medium once supply has begun, if the consumer gave prior
  express consent, acknowledged the loss, and got a confirmation (Consumer Rights Directive art. 16(m), as amended by
  2019/2161; [CRD](https://eur-lex.europa.eu/eli/dir/2011/83/oj)).
- Google's EEA/UK page: when you buy digital content (apps, games, in-app items) "you agree that the digital content
  will be available to you immediately, and you acknowledge" that you waive the right; refunds then only if the
  content is "defective, unavailable, or doesn't perform as stated"
  ([Google Play EEA refund policies](https://support.google.com/googleplay/answer/15576634)). Google's checkout takes
  the acknowledgement and sends the receipt; Google is the merchant of record. **Nothing extra is needed in the app or
  listing**; just don't contradict it.
- The new online "withdrawal function" (Directive 2023/2673, art. 11a CRD, applying from 19 June 2026) applies only
  where a withdrawal right exists; Google Play already shows a "Withdraw from Digital Services" link in its footer
  (seen on the Spanish store, 2026-10-28). Nothing for you to build.
- The EU ODR-platform link is **no longer required**: the platform closed on 20 July 2025 (Regulation 2024/3228;
  [summary](https://www.iubenda.com/en/blog/discontinuation-of-the-european-online-dispute-resolution-odr-platform/)).
  Don't add one.

### 2.3 Refunds and conformity

- DDA §3.8: you authorise Google to refund under its policy and deduct it from payouts; §8.2: after a legal takedown,
  Google can ask you to refund buyers of the last 12 months. You can also refund any order yourself in Play Console
  (Order management).
- Statutory conformity rights (Digital Content Directive 2019/770: content must stay as described and working;
  [DCD](https://eur-lex.europa.eu/eli/dir/2019/770/oj)) cannot be excluded. "Refunds follow Google Play's refund
  policy" is fine, but add "Nothing here limits your rights under consumer law" and offer to refund through us.

### 2.4 Digital Services Act: trader status and what becomes public

- The DSA (art. 30) makes Google collect and show traders' contact details to EU consumers
  ([DSA](https://eur-lex.europa.eu/eli/reg/2022/2065/oj)). Selling Pro and tips makes you a **trader**: declare it in
  the Console.
- Google's own rule for **personal** accounts: it shows your legal name, your country and the developer email; "If
  you decide to monetize on Google Play then Google will display your full address", taken from the payments profile
  ([Play Console Help 13628312](https://support.google.com/googleplay/android-developer/answer/13628312)). Some regions
  add the phone. So **your real name and home address will appear on the listing** once Pro is on sale. "Josich"
  stays the developer name shown at the top.
- Ways to avoid showing a home address (owner's decision, **⚖ gestor**):
  1. Accept it (simplest; many indies do).
  2. A personal account cannot usually use a mailbox or PO box: Google verifies the payments-profile address against
     proof of residence (a developer who tried reports exactly that:
     [jakelee.co.uk](https://blog.jakelee.co.uk/publishing-on-google-play-without-exposing-info/), Jan 2025).
  3. An **organisation** account for a company whose registered office is a business address (in Spain a
     *domiciliación* / virtual office is legal for an SL), with a free D-U-N-S number: the company's address and phone
     are shown instead. Costs: forming and running an SL (notary, registry, annual accounts, corporate tax): only worth
     it if BassClass and Polyorbit earn enough, or for other reasons.
  4. For the phone, a separate cheap prepaid or VoIP number.
- Decide this **before** creating the payments profile: Google does not let you change the country or the
  individual/organisation type of an existing payments profile.
- Spain also has LSSI-CE art. 10 (an online seller's name, address, email and NIF easily accessible:
  [BOE](https://www.boe.es/buscar/act.php?id=BOE-A-2002-13758)). Whether it applies to an app sold through Google
  Play as merchant of record, and whether the Play listing satisfies it, is a **⚖ lawyer** question; the usual answer is
  an "Aviso legal" on the same public page as the privacy policy.

### 2.5 Prices, promotions and pressure

- **Hard-coded prices.** The tip buttons read "Tip €2"/"Tip €4" (`TIPS` in `pro.js`), and the Pro button shows
  `PRICE` "€7.99" until Play's price arrives. Outside the euro area, or during the €4.99 launch, that is a wrong price
  on screen (Unfair Commercial Practices Directive art. 6(1)(d); [UCPD](https://eur-lex.europa.eu/eli/dir/2005/29/oj)).
  Play's own sheet shows the true price before payment, so the harm is small, but fix it: show Play's localised price
  for tips too (`prices()` already does it for Pro), and show nothing (or "…") until Play answers.
- **Launch price.** Never present €4.99 as a reduction from €7.99 ("was €7.99", strike-through, "−37%") unless €7.99
  was charged in the 30 days before: the prior price must be the lowest of the previous 30 days (Price Indication
  Directive art. 6a, added by 2019/2161; [Omnibus](https://eur-lex.europa.eu/eli/dir/2019/2161/oj)). Launch at €4.99 as
  the plain price and raise it later. "Introductory price until [date]" is fine only if true: a false "limited time"
  claim is on the UCPD's blacklist (Annex I, point 7).
- **Exhortations.** The Pro sheet opens only on a tap on Pro content, and "⭐ Get BassClass Pro" is a normal button for
  a 13+ audience. Keep it so: no countdowns, no nag on launch (already a ground rule), consistent with the EU consumer
  authorities' common position on in-app purchases (no direct exhortations to children to buy).

### 2.6 Support obligations (owner)

DDA §4.7: you are responsible for support, must give valid contact details, and for paid products and in-app purchases
must answer support requests within **three business days** (24 hours for issues Google flags as urgent). The shared
Polyorbit inbox is fine; just watch it.

### 2.7 The terms of the purchase in About: line by line

Current text (About → "🧾 Terms of the purchase") is short and honest. Points:

| Phrase | Risk | Change |
|---|---|---|
| "It is yours for good" (also the Pro button: "one payment, yours for good", and the thank-you) | Low. It is backed by DDA §5.3 (users get a "non-exclusive, worldwide, perpetual" licence), §3.9 (unlimited reinstalls) and §8.1 (a voluntary removal does not affect past buyers), and the app needs no server. Residual: Google's legal takedown (§3.9), a lost Google account. | Keep the button wording; make the terms precise (below). |
| "and what we add to them later" / Pro sheet "✨ Everything we add next" / thank-you "and everything we add" | A contractual promise. Fine if you mean it; it rules out ever selling a separate add-on (a second course, a sample pack) to Pro owners. | Scope it in the terms: "new content we add to these parts". The sheet line can stay "✨ What we add to them next". |
| "What is free today stays free" | A promise; fine (the free taste just made more free). | Keep. |
| "Refunds follow Google Play's refund policy" | Could read as excluding statutory remedies. | Add "or write to us" and the statutory-rights sentence. |
| "Tips are optional and unlock nothing" | Good. Play's payments policy forbids Play Billing only for "tax exempt donations" (charity); a tip to the developer is an ordinary in-app product and must use Play Billing, as it does ([Payments policy](https://play.google.com/about/monetization-ads/payments)). | Add "not a charitable donation". |
| Not said: who sells, what happens if the app is withdrawn, modifications | DCD art. 19 lets a trader modify digital content only if the contract allows it and for a valid reason; a change that removes something significant gives the buyer a right to end the contract. | Add a modification clause (below). ⚖ light |

Proposed text:

> **Terms of the purchase**
> - BassClass is free to use, with no time limit: [FREE_LINE].
> - BassClass Pro is a one-time purchase: one payment, no subscription, no ads. It is sold through Google Play, which
>   takes the payment, charges VAT where it applies, sends your receipt and applies its terms of service.
> - Pro gives your Google account a licence to use BassClass's Pro content, with no time limit, on the Android devices
>   where you use BassClass with that account. On a new phone, use Restore purchase with the same Google account.
> - Pro opens Levels [4]–6, every drum pattern and the fills, every progression, the extra sounds, and the new content
>   we add to these parts later, at no extra cost. What is free today stays free.
> - We keep improving BassClass. We will not take away what Pro gives you unless we must (for example, a licence or
>   legal problem); if that ever happens we will say so in the app, and you can ask for a refund.
> - Pro is supplied at once: at checkout Google Play asks you to agree to that and to acknowledge that you then lose
>   the 14-day right of withdrawal.
> - Refunds: through Google Play, or write to us at [contact] and we can refund you through Google Play. A refunded
>   purchase closes Pro again.
> - Tips are optional gifts to support BassClass. They unlock nothing and are not charitable donations.
> - Prices are shown by Google Play in your currency, taxes included where they apply.
> - Nothing in these terms limits your rights under consumer law.

### 2.8 "Good to know": remove the warranty disclaimer (Must)

"BassClass is provided as is, without warranty" in a paid B2C product: legal conformity of digital content cannot be
excluded against consumers (DCD art. 22; Unfair Terms Directive 93/13, annex point 1(b)); in Spain a clause limiting
consumers' legal rights is abusive and void (TRLGDCU, e.g. art. 86), and consumer authorities can fine its use. Replace
the last paragraph with:

> Practise at a comfortable volume, also with headphones, and take breaks: stop if your hands or wrists hurt. BassClass
> is a practice tool, not a substitute for a teacher's care. Nothing here limits your rights under consumer law.

(The phrase "provided as is" inside the CC licence summaries and the Apache text is fine: those are licences of the
libraries, not your consumer terms.)

---

## 3. Licences

### 3.1 Recorded sounds

| Asset | Licence (verified) | Attribution required | About / LICENSE.txt / README | Verdict |
|---|---|---|---|---|
| Bass: Karoryfer "Black And Blue Basses" (darkblack) | CC0 1.0 ([repo](https://github.com/sfzinstruments/karoryfer.black-and-blue-basses)) | none | credited, changes listed | ✓ |
| Kick, toms, hats, ride, bell, crash: **MuldjordKit**, Lars Muldjord, FreePats stereo build (assembled by roberto@zenvoid.org) | **CC BY 4.0** ([FreePats page](https://freepats.zenvoid.org/Percussion/acoustic-drum-kit.html); staged README and LICENSE.txt) | yes | see 3.2 | ✓ |
| Snare: Karoryfer Frankensnare 14×6.5 maple | CC0 1.0 (staged `license`) | none | credited | ✓ |
| Rim, cross-stick, flam, pedal hat, percussion: Virtuosity Drums (Versilian + Karoryfer) | CC0 1.0 ([repo](https://github.com/sfzinstruments/virtuosity_drums)) | none | credited | ✓ |
| Brushes: Karoryfer Swirly Drums | CC0 1.0 (per LICENSE.txt and sources list) | none | credited | ✓ |
| Piano: VCSL Kawai grand (Versilian Studios) | CC0 1.0 (staged LICENSE) | none | credited | ✓ |
| Synthesised sounds, click, tap sounds | own code | — | stated | ✓ |
| Candidates staged but **not shipped** (DRSKit CC BY, Gogodze, ShittyKit with extra conditions) | — | — | `web/_raw/` is gitignored; `kit.json` sources list only the four shipped libraries | ✓ keep it so |

### 3.2 MuldjordKit, CC BY 4.0 checklist (licence §3(a)(1),
[legal code](https://creativecommons.org/licenses/by/4.0/legalcode))

| Requirement | About today | OK? |
|---|---|---|
| Creator and others designated to receive credit | "Lars Muldjord … in the stereo build assembled by the FreePats project" | ✓ (optional: "recorded by Lars Muldjord, 2010; FreePats build by Roberto (zenvoid.org)") |
| Copyright notice / disclaimer notice, if supplied | none supplied beyond the licence text; About links the legal code | ✓ |
| URI to the material, where reasonably practicable | domains in About; the full FreePats URL in `drums/LICENSE.txt`, shown in About → Licence files | ✓ (optional: the full URL in the About line too) |
| Licence name and link | "CC BY 4.0 (creativecommons.org/licenses/by/4.0)" | ✓ |
| Indicate changes, and keep earlier ones | "a selection of its hits, trimmed, faded, equalised, levelled, Opus…; the half-open hat… the kick shortened and equalised"; FreePats' stereo build named | ✓ |
| No added terms or technological measures that restrict recipients (§2(a)(5)(B)) | The samples sit unencrypted in the APK; Pro gates the app's own patterns, not the samples (free patterns play every piece). | ✓ Low risk. Don't enable anything that encrypts assets, and add one line to the purchase terms or credits: "The drum samples remain under CC BY 4.0; nothing in these terms limits your rights under that licence." CC's own 4.0 notes flag store-level DRM as a grey zone ([CC wiki](https://wiki.creativecommons.org/4.0/Technical_protection_measures)). |

### 3.3 Android libraries: About is out of date (Must)

About → "🧩 Open-source libraries" says the Android app uses AndroidX WebKit and the Kotlin standard library, "each
under the Apache License 2.0". Since 2026-10-28 it also ships **Play Review 2.0.2**, and Play Billing is coming:

| Library | Licence | What it requires in the app |
|---|---|---|
| AndroidX WebKit, Core, Activity, Annotation… | Apache 2.0 | licence text (present in `web/licenses/APACHE-2.0.txt`) and notices; ✓ |
| Kotlin stdlib | Apache 2.0 | as above; ✓ |
| `com.google.android.play:review` and `core-common` | **Play Core Software Development Kit Terms of Service** ([terms](https://developer.android.com/guide/playcore/license)): redistribute only inside your app, no modification; incorporates the [Google APIs ToS](https://developers.google.com/terms) (privacy policy duty §3d; no claim of Google partnership §6c) | no attribution required; list it truthfully |
| `com.android.billingclient:billing`, `play-services-base/-basement/-tasks/-location` | **Android SDK License Agreement** ([terms](https://developer.android.com/studio/terms)): don't remove Google's notices (§3.8); open-source parts under their own licences (§3.5) | Google: "you as a developer are responsible for appropriately displaying the notices" of open-source code inside Play services ([guide](https://developers.google.com/android/guides/opensource)) |
| `com.google.android.datatransport:*`, `com.google.firebase:firebase-encoders*` | Apache 2.0 | licence text and notices |

Do: (1) replace the section's text, e.g.

> **Libraries.** The Android app uses AndroidX (WebKit, Core, Activity and the libraries they use; © The Android Open
> Source Project) and the Kotlin standard library (© JetBrains s.r.o. and contributors), under the Apache License 2.0;
> Google's data-transport and encoder libraries (© Google LLC), Apache License 2.0; the Google Play In-App Review
> library (© Google LLC), under the Play Core SDK Terms of Service; and the Google Play Billing Library and Google Play
> services components (© Google LLC), under the Android Software Development Kit License Agreement. Their open-source
> notices follow.

and change "The Android app is built with a few open-source libraries" (The content section) to "a few libraries".
(2) Generate the notices at build time: Google's `oss-licenses-plugin` (a Gradle plugin, build-time only) collects
them; About can read its output file without the runtime `play-services-oss-licenses` activity. **A new build
dependency: ask the user before adding it** (CLAUDE.md rule).

### 3.4 Small inconsistencies (trivial)

- README Credits: "The app's Settings … carry the same credit": it is About now. Piano range "D3 to A5" in README vs
  "D3 to C6" in `piano/LICENSE.txt`.
- `about.js` header comment still calls the texts drafts: fine, it's a comment.

---

## 4. IP and naming

### 4.1 Song "style studies" (`curriculum/songs.js`, 30 studies)

What the law protects: the melody/riff as expression (copyright), not a style, feel, key, tempo, chord progression
or technique; a song title is generally not protected by copyright; the names of famous bands and artists are
commonly registered as trademarks for recordings, merchandise and entertainment (not checked one by one here) and, in
Spain, a
person's name used "for advertising, commercial or similar purposes" without consent is an unlawful intrusion
(LO 1/1982 art. 7.6, [BOE](https://www.boe.es/buscar/act.php?id=BOE-A-1982-11196)). Referring to a song to say what a
study is in the style of is referential use, allowed "in accordance with honest practices" and without suggesting a
connection (EU Trade Mark Regulation art. 14, [EUTMR](https://eur-lex.europa.eu/eli/reg/2017/1001/oj)). Google Play's
IP and impersonation policies act on complaints, so the practical risk is a takedown notice, not a lawsuit.

The app's wording is good: titles "Seven Nation Army style", the Source line "Original line in the style of …: its
key, feel and technique, at a practice tempo, not its notes", About's "not affiliated with or endorsed by them". Pro
marketing counts studies, never names them (`proDetails`, Pro sheet). Improvements:

1. **"never its notes" (About) / "not its notes" (Source)** is an absolute factual claim. Spot check: Seven Nation
   Army's study opens E–E–G (the song's first three pitches, in a different rhythm, then a different continuation);
   Under Pressure keeps a D pedal with a 16th pickup (the idea, not the pitches); Billie Jean and Money take different
   contours. Those are style, but "never" invites nit-picking. Say "not a transcription: the notes are our own".
2. Add to each study's Source line: "Not affiliated with or endorsed by the artist or the song's owners." (one string
   in `song()`).
3. **Ear check** (owner or a musician friend, 30 minutes) of the studies where the song *is* its bass riff, against the
   records: Seven Nation Army, Another One Bites the Dust (the repeated-E 16ths), Under Pressure, Good Times, Smooth
   Criminal (pedal-alternating 16ths), Can't Stop. If any bar is recognisable as the record's riff, change its pitches.
   ⚖ optional: a musicologist's opinion only if a rights holder ever complains.
4. **Never in the listing, screenshots, feature graphic or ads**: no song titles, artist names or photos ("30 original
   studies in the styles of famous rock, funk, pop and fusion bass lines" is fine). This is where trademark, personality
   right and Play metadata rules bite.

### 4.2 "Based on" lines: competitors' courses and exam grades (Should)

Each exercise's info panel shows **"Based on"** followed by its `source` (`ui/exercise.js`). About 70 strings name
commercial products and courses: BassBuzz, StudyBass (a "STUDYBASS" US trademark filing exists), TalkingBass courses (Chord
Tone Essentials, Groove Trainer, Slap Bass Essentials…), SBL Zones / Slap Accelerator / Fretboard Accelerator, Berklee
Online course and lesson codes ("ILBS-244", "Rock Bass L10"), MI course numbers ("MI 069E", "MI 021"), Hal Leonard Bass
Method, and specific grades ("LCM Grade 3 (all five types)", "RSL Grade 8", "Trinity Grade 5"). Issues:

- "Based on" asserts derivation from paid courses in a paid product: it invites a "you copied our course" complaint and
  suggests a connection. Ideas and methods are free to use; the label is the problem.
- Specific grades conflict with the project's own rule (CLAUDE.md: never claim a specific grade requires something),
  and syllabi change yearly, so they go stale.
- A YouTube teacher is named in five arpeggio `source` lines, although CLAUDE.md decided the pentatonic studies do not
  name him because his book is a commercial product. Pick one rule.

Fix (us, text): rename the heading to **"Related"** (or "Also covered in"); keep classic books as bibliography
(author and title: Ed Friedland, Mark Levine, Slonimsky, Chuck Sher, Rufus Reid), keep exam boards generic ("graded
exams (RSL, LCM, Trinity), advanced grades"), drop course codes and paid-course product names; and add to About's
content paragraph: "Books, methods and exam syllabi named under an exercise are listed as related reading; BassClass
is not affiliated with or endorsed by them." The about-texts already follow the "appears in graded exams" rule ✓.

### 4.3 The name "BassClass"

Searches on 2026-10-28:
- **TMview** (EUIPO, all EU national offices, USPTO and others): "bassclass" → one hit, FENWICK BASSCLASS (Japan,
  class 28, **expired**); "bass class" → BASS CLASS (USPTO 74103759, Berkley Inc., class 28 fishing tackle,
  **ended**), then unrelated BASS CLASSIC / BASS MASTERS CLASSIC fishing and beer marks; "bassklass" → none. **No live
  mark for BASS CLASS in classes 9 or 41.** ([TMview](https://www.tmdn.org/tmview/))
- **Google Play** (Spanish store): "bass class" → "No results"; "bassclass" → no app of that name.
- **Web**: no app, course or brand called BassClass/Bass Class for bass found (a Paris school uses "Bass Class" as a
  plain description of its group lessons).

Verdict: **low conflict risk.** Note the flip side: "bass class" describes the service, so a word-mark application in
classes 9/41 may be refused as descriptive (EUTMR art. 7(1)(b)–(c)). If you want protection later, a figurative mark
(the clef logo with the name) at EUIPO or the Spanish OEPM has better odds (check current fees). Not needed for launch.
Optional: register the matching domain(s) if you want a home for the legal pages (§1.5).

### 4.4 The icon

A bass clef is a public-domain musical symbol; BassClass's is its own drawing (design reports in `design/`). ✓

### 4.5 Public history

Making the repository private does not remove forks, clones or archives of the public history (e.g. Software Heritage
archives public GitHub repositories). CLAUDE.md publicly describes which teachers' videos and which sites inspired
content ("concepts only, every line original"): that is fine (ideas are free), but don't write anything there you
would not want read later. The signing-key consequence is already handled in LAUNCH-TODO.

---

## 5. Age (13+)

- **Target audience form**: choose **13–15, 16–17, 18+** and answer that the listing does not unintentionally appeal
  to children. Including any under-13 group brings in the Families policy. The navy palette, the clef icon and the
  study material do not read as a children's app ✓. Keep the listing free of cartoon art and child-directed copy.
- **Purchases**: Google handles age and parental approval (Google accounts for minors, Family Link purchase approval);
  Google is merchant of record. The Pro sheet opens only on a tap on Pro content; the rate reminder is a single,
  dismissible card at 10 and 20 hours. Nothing here conflicts with the EU consumer authorities' common position on
  in-app purchases (no direct exhortations to children, clear "free" claims). Describe the app in the listing as "free
  to start, with an optional one-time Pro unlock", never just "free".
- **Email**: GDPR art. 8 (parental consent) applies only to consent-based processing; answering an email rests on
  legitimate interest. Add the "under 13 → delete" line (§1.3) for COPPA hygiene in the US.
- **Review prompt**: Google's guidelines are met: no question before the card, no button that triggers the API in the
  Play build (the debug panel's is never in it), the card shown as is
  ([in-app review guide](https://developer.android.com/guide/playcore/in-app-review)). The fallback card (shown only
  when Play's card errors) has five star buttons that all open the Play page: not a rating gate (all stars do the same,
  as Google asks), but stars look like an input. Low-priority polish: make them decorative and keep the single
  "⭐ Rate on Google Play" button.
- **UK** (if distributed there): the Children's Code applies to services "likely to be accessed" by under-18s;
  BassClass collects nothing, so its standards are met by design.
- **Accessibility Act** (EU 2019/882): microenterprises providing services are exempt ([EAA](https://eur-lex.europa.eu/eli/dir/2019/882/oj)). Fine as is.

---

## 6. Owner's checklist (Console and account), in order

1. Decide personal vs organisation account and accept what becomes public (§2.4). ⚖ gestor.
2. Register the activity for tax and social security (§2.1). ⚖ gestor.
3. Payments profile with the chosen legal name and address; then the trader declaration (§2.4).
4. Publish the privacy policy page (and, if your lawyer says so, an "Aviso legal") at its permanent URL (§1.5).
5. Products `bassclass_pro`, `bassclass_tip_2`, `bassclass_tip_4`; €4.99 as the plain launch price (§2.5).
6. Data safety: "No data collected or shared", if §1.6 ends with no network permission (§1.4); the other declarations
   (§1.4).
7. Target audience 13+; IARC questionnaire with "digital purchases".
8. Listing texts with no song or artist names; "free to start, optional one-time Pro unlock".
9. Watch the inbox: 3-business-day answers (§2.6).

## 7. Our checklist (code and text)

1. About: privacy policy (§1.3), terms (§2.7), "Good to know" (§2.8), libraries (§3.3), content paragraph (§4.1–4.2).
2. Play build: print the merged manifest's permissions; strip INTERNET/ACCESS_NETWORK_STATE if billing works without
   (§1.6); add WebView `MetricsOptOut`; check no AD_ID.
3. Prices from Play for tips; no hard-coded fallback price on screen (§2.5).
4. `song()` Source line wording; "Based on" → "Related" and the source-line clean-up (§4.1–4.2).
5. Optional: backup rules file (§1.6), decorative stars on the fallback rate card (§5), README fixes (§3.4).

---

## Sources

Google Play and Android
- Data safety section help: https://support.google.com/googleplay/android-developer/answer/10787469
- User Data policy: https://support.google.com/googleplay/android-developer/answer/10144311
- Developer Distribution Agreement (effective 15 Sep 2025): https://play.google/developer-distribution-agreement.html
- Merchant-of-record countries: https://support.google.com/googleplay/android-developer/answer/7645364
- Tax information for Google Play purchases: https://support.google.com/googleplay/answer/2850368
- EEA/UK refund policies: https://support.google.com/googleplay/answer/15576634
- Required information for a developer account (what is displayed): https://support.google.com/googleplay/android-developer/answer/13628312
- Payments policy: https://play.google.com/about/monetization-ads/payments
- In-app review guide: https://developer.android.com/guide/playcore/in-app-review
- Play Core SDK Terms of Service: https://developer.android.com/guide/playcore/license
- Google APIs Terms of Service: https://developers.google.com/terms
- Android SDK License Agreement: https://developer.android.com/studio/terms
- Open-source notices for Play services: https://developers.google.com/android/guides/opensource
- Play services data disclosures: https://developers.google.com/android/guides/play-data-disclosure
- Google Play SDK Index, Play Billing: https://play.google.com/sdks/details/com-android-billingclient-billing
- POMs: https://dl.google.com/dl/android/maven2/com/google/android/play/review/2.0.2/review-2.0.2.pom ,
  https://dl.google.com/dl/android/maven2/com/android/billingclient/billing/9.1.0/billing-9.1.0.pom ,
  https://dl.google.com/dl/android/maven2/com/android/billingclient/billing/8.0.0/billing-8.0.0.pom ,
  https://dl.google.com/dl/android/maven2/com/google/android/datatransport/transport-backend-cct/3.1.8/transport-backend-cct-3.1.8.pom
- WebView privacy (MetricsOptOut): https://developer.android.com/develop/ui/views/layout/webapps/webview-privacy
- GitHub Pages (IP logging): https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages
- Personal-account address experience (secondary): https://blog.jakelee.co.uk/publishing-on-google-play-without-exposing-info/

EU and Spanish law
- GDPR: https://eur-lex.europa.eu/eli/reg/2016/679/oj
- Consumer Rights Directive: https://eur-lex.europa.eu/eli/dir/2011/83/oj ; Omnibus Directive 2019/2161: https://eur-lex.europa.eu/eli/dir/2019/2161/oj
- Withdrawal function (Directive 2023/2673), summary: https://www.gtlaw.com/en/insights/2026/5/eu-consumer-law-new-withdrawal-button-requirements-for-online-contracts
- Digital Content Directive: https://eur-lex.europa.eu/eli/dir/2019/770/oj
- Unfair Commercial Practices Directive: https://eur-lex.europa.eu/eli/dir/2005/29/oj
- Digital Services Act: https://eur-lex.europa.eu/eli/reg/2022/2065/oj
- ODR platform closure: https://www.iubenda.com/en/blog/discontinuation-of-the-european-online-dispute-resolution-odr-platform/
- European Accessibility Act: https://eur-lex.europa.eu/eli/dir/2019/882/oj
- EU Trade Mark Regulation: https://eur-lex.europa.eu/eli/reg/2017/1001/oj
- LSSI-CE: https://www.boe.es/buscar/act.php?id=BOE-A-2002-13758 ; LO 1/1982: https://www.boe.es/buscar/act.php?id=BOE-A-1982-11196

Licences and searches
- CC BY 4.0 legal code: https://creativecommons.org/licenses/by/4.0/legalcode ; CC FAQ: https://creativecommons.org/faq/ ;
  CC 4.0 technical measures notes: https://wiki.creativecommons.org/4.0/Technical_protection_measures
- MuldjordKit FreePats page: https://freepats.zenvoid.org/Percussion/acoustic-drum-kit.html
- Karoryfer Black And Blue Basses: https://github.com/sfzinstruments/karoryfer.black-and-blue-basses ;
  Virtuosity Drums: https://github.com/sfzinstruments/virtuosity_drums
- TMview searches "bassclass", "bass class", "bassklass": https://www.tmdn.org/tmview/
- Google Play searches "bass class", "bassclass" (Spanish store, 2026-10-28): https://play.google.com/store/search?q=bassclass&c=apps
