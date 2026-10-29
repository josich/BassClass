// The legal texts (launch legal review, 2026-10-28: qa/reports/2026-10-28-launch-legal.md): the privacy policy, the
// terms of the purchase and the safety note. One source for About (ui/about.js) and for the public privacy page that
// Google Play links to (`legal/bassclass/privacy.html`, written by web/js/dev/legal.html from this file): change the
// text here, then make the page again, so the two never drift.
//
// A text is a list of blocks: ['h', heading], ['p', text], ['ul', [item, …]], an item being a text or
// [bold start, the rest].

/** The developer's name, as on Google Play (user, 2026-10-27). */
export const DEVELOPER = 'Josich';
/** The address players write to (the same as Polyorbit's): Settings → Feedback, About, the privacy policy. */
export const CONTACT = 'polyorbit.app@gmail.com';
/**
 * Who is responsible for the data (GDPR: the controller): the legal name and postal address behind "Josich", the same
 * as on the Google Play payments profile. To fill in before the launch (LAUNCH-TODO.md); the signed Play bundle is not
 * built while it is empty (.github/workflows/android-apk.yml).
 */
export const OWNER = { name: '', address: '' };
/** The date the privacy policy and the terms last changed. */
export const UPDATED = '29 October 2026';

/**
 * The privacy policy. `where`: 'app' (the Android app), 'web' (the web version, until the launch) or 'page' (the
 * public page on GitHub Pages).
 */
export function privacyPolicy(where = 'app') {
  const who = OWNER.name ? `, the trading name of ${OWNER.name}, ${OWNER.address}` : '';
  return [
    ['p', `Last updated: ${UPDATED}.`],
    ['h', 'Who we are'],
    ['p', `BassClass is made by ${DEVELOPER}${who} ("we"). Contact: ${CONTACT}. We are responsible (the "controller") for the personal data described here.`],
    ['h', 'In short'],
    ['p', 'The app collects nothing about you: no account, no ads, no analytics, no tracking. Personal data reaches us only if you write to us, and from Google Play about purchases and reviews.'],
    ['h', 'What stays on your device'],
    ['ul', [
      ['Your progress. ', 'Your settings, progress, course, sessions, favourites, practice log and whether you own Pro are stored in the app on your phone. We cannot see them. Uninstalling the app deletes them.'],
      ['The microphone ', 'is used only by the tuner, only while it is open. The sound is analysed on the phone to find the pitch and is never recorded, stored or sent.'],
      ['Backups. ', 'A backup is a file you save where you choose. We never receive it.'],
      ['Android\'s own backup, ', 'when it is on in your phone\'s settings, copies the app\'s data to your Google account so a new phone can restore it. That is a Google service, under Google\'s privacy policy; we never receive the copy.'],
    ]],
    ['h', 'What reaches us'],
    ['ul', [
      ['Email. ', 'If you write to us (Settings → Feedback, or any email) we receive your address, your message and what you attach. Feedback fills in, where you can see and delete it before sending: the app\'s version, your phone\'s model and Android version, the screen size, your bass\'s number of strings, the date and the app\'s last error messages, if any. We use it only to answer you and to improve BassClass (our legitimate interest, GDPR art. 6(1)(f); for a question about a purchase, art. 6(1)(b)). We keep emails for up to two years after the conversation ends. Our mailbox is Gmail, provided by Google, which may store it outside the EU under the EU–US Data Privacy Framework.'],
      ['Purchases. ', 'BassClass Pro and tips are sold through Google Play. Google handles your payment details; we never see them. For each purchase Google gives us an order number, the product, the price, the date and your country or region, not your name, email or card. On your phone the app learns only which of our products your Google account owns. We use order records for refunds, accounting and tax (contract and legal obligation, art. 6(1)(b) and (c)) and keep them as long as tax and accounting law requires (in Spain, up to six years).'],
      ['Ratings and reviews. ', 'A review you post on Google Play is public under your Google Play name; Google shows it to us with your device model and language, and we may reply there.'],
      ['Statistics. ', 'Google Play gives us statistics (installs, crash and performance reports, ratings) that do not identify you.'],
      ['Network. ', 'BassClass itself makes no network requests: the Android app has no permission to use the internet. Google Play\'s purchase and rating components inside it talk to the Google Play app on your phone, under Google\'s privacy policy (policies.google.com/privacy).'],
      ...(where === 'web' ? [['The web version ', 'loads the app from its site, GitHub Pages, which logs visitors\' IP addresses for security (GitHub\'s privacy statement).']] : []),
      ...(where === 'page' ? [['This page ', 'is hosted on GitHub Pages, which logs visitors\' IP addresses for security (GitHub\'s privacy statement).']] : []),
    ]],
    ['h', 'Sharing'],
    ['p', 'We do not sell or share your personal data. Google provides our email and runs Google Play.'],
    ['h', 'Security'],
    ['p', 'Our mailbox and Google Play account use strong passwords and two-step verification; order data stays in the Google Play Console.'],
    ['h', 'Your rights'],
    ['p', 'You can ask us for access to, correction or deletion of your data, to restrict or object to its use, or for a copy: write to us and we answer within a month. You may also complain to your data protection authority (in Spain, the AEPD: aepd.es).'],
    ['h', 'Children'],
    ['p', 'BassClass is for players aged 13 and over and is not directed to children under 13. If a child under 13 writes to us, we delete the message once we have answered.'],
    ['h', 'Changes'],
    ['p', 'We post changes here and in the app (About), with a new date.'],
  ];
}

/** The terms of the purchase. `free`: the free part in one line (FREE_LINE); `from`: the first Pro level. */
export function purchaseTerms({ free, from }) {
  return [
    ['ul', [
      `BassClass is free to use, with no time limit: ${free}.`,
      'BassClass Pro is a one-time purchase: one payment, no subscription, no ads. It is sold through Google Play, which takes the payment, charges VAT where it applies, sends your receipt and applies its terms of service.',
      'Pro gives your Google account a licence to use BassClass\'s Pro content, with no time limit, on the Android devices where you use BassClass with that account. On a new phone, use Restore purchase with the same Google account.',
      `Pro opens Levels ${from}–6, every drum pattern and the fills, every progression, the extra sounds, the drone's other chords and voicings, and the new content we add to these parts later, at no extra cost. What is free today stays free.`,
      'We keep improving BassClass. We will not take away what Pro gives you unless we must (for example, a licence or legal problem); if that ever happens we will say so in the app, and you can ask for a refund.',
      'Pro is supplied at once: at checkout Google Play asks you to agree to that and to acknowledge that you then lose the 14-day right of withdrawal.',
      `Refunds: through Google Play, or write to us at ${CONTACT} and we can refund you through Google Play. A refunded purchase closes Pro again.`,
      'Tips are optional gifts to support BassClass. They unlock nothing and are not charitable donations.',
      'Prices are shown by Google Play in your currency, taxes included where they apply.',
      'The drum samples remain under their CC BY 4.0 licence (see the credits): nothing in these terms limits your rights under it.',
      'Nothing in these terms limits your rights under consumer law.',
    ]],
  ];
}

/** "Good to know": playing safely, and no exclusion of the player's legal rights (EU consumer law). */
export const SAFETY = 'Practise at a comfortable volume, also with headphones, and take breaks: stop if your hands or wrists hurt. BassClass is a practice tool, not a substitute for a teacher\'s care. Nothing here limits your rights under consumer law.';
