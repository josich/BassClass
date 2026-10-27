// About BassClass (#/about; the rail's logo opens it; user, 2026-10-27: "all licences and mentions for samples and
// all legal and mandatory documentation under the app logo"): the version, the credits of every recorded sound
// with their licences (the CC BY one as its licence asks: who made it, the licence, what was changed), the licence
// files themselves, where the content comes from, the privacy policy, the terms of the purchase. The legal texts are
// drafts to review before the Play Store launch (LAUNCH-TODO.md); CONTACT and DEVELOPER fill in then.
import { h, icon } from './dom.js';
import { VERSION, COMMIT } from '../version.js';
import { canGoBack, goBack } from './nav.js';
import { go } from './screens.js';
import { FREE_LEVELS } from '../pro.js';
import { FREE_LINE } from './proSheet.js';
import { CONTACT } from '../feedback.js';

/** The developer's name, once chosen (LAUNCH-TODO.md); the contact address is Settings' Feedback one (feedback.js). */
const DEVELOPER = '';
const UPDATED = '27 October 2026';

const section = (title, open, ...kids) => h('details', { class: 'lv-fold about-fold', open },
  h('summary', { class: 'section' }, h('h2', {}, title)), h('div', { class: 'about-body' }, ...kids));
const p = (...kids) => h('p', {}, ...kids);
const li = (...kids) => h('li', {}, ...kids);

/**
 * A licence file of the app, its paragraphs joined so they wrap to the screen (the files are hard-wrapped at about
 * 100 characters) and the developer tools' paths left out (QA round 19).
 */
function licenceFile(path) {
  const box = h('div', { class: 'about-licence' }, 'Loading…');
  fetch(path).then((r) => (r.ok ? r.text() : Promise.reject())).then((t) => {
    const paras = t.trim().split(/\n\s*\n/).map((x) => x.replace(/\s*\n\s*/g, ' ').replace(/ by web\/js\/dev\/[a-z]+\.js/g, '').trim());
    box.replaceChildren(...paras.map((x) => h('p', {}, x)));
  }).catch(() => { box.textContent = `(${path} could not be read)`; });
  return box;
}

export function aboutScreen(main) {
  const back = () => (canGoBack() ? goBack() : go('#/'));
  const version = VERSION ? `Version ${VERSION}${COMMIT ? ` · build ${COMMIT}` : ''}` : `Development version${COMMIT ? ` · build ${COMMIT}` : ''}`;
  main.replaceChildren(
    h('div', { class: 'page-head' }, h('button', { class: 'icon-btn', 'aria-label': 'Back', html: icon('back'), onClick: back }),
      h('h1', {}, 'About BassClass')),
    h('div', { class: 'about-top' }, h('img', { class: 'about-logo', src: 'icons/icon.svg', alt: '' }),
      h('div', {}, h('b', {}, 'BassClass'), h('div', { class: 'muted small' }, version),
        DEVELOPER ? h('div', { class: 'muted small' }, `Made by ${DEVELOPER}`) : null,
        CONTACT ? h('div', { class: 'muted small' }, `Contact: ${CONTACT}`) : null)),

    section('🔊 Sounds and their authors', true,
      p('Every recorded sound in BassClass is used under a free licence. Thank you to their makers.'),
      h('ul', { class: 'about-list' },
        li(h('b', {}, 'Bass: '), '"Black And Blue Basses" (darkblack) by Karoryfer Samples, CC0 1.0 (public domain). Trimmed, retuned, level-matched and resampled for BassClass.'),
        li(h('b', {}, 'Drum kit (kick, toms, hi-hats, ride, crash): '), '"MuldjordKit" by Lars Muldjord (muldjord.com, DrumGizmo.org), in the stereo build assembled by the FreePats project (freepats.zenvoid.org), licensed under the Creative Commons Attribution 4.0 International licence, CC BY 4.0 (creativecommons.org/licenses/by/4.0). Changes: a selection of its hits, trimmed, faded, equalised, levelled and encoded as Opus; the half-open hi-hat is its open hi-hat cut short; the kick shortened and equalised.'),
        li(h('b', {}, 'Snare: '), 'the 14×6.5 maple snare of "Frankensnare" by Karoryfer Samples, CC0 1.0. Its microphones mixed, equalised and shortened.'),
        li(h('b', {}, 'Rim shot, cross-stick, flam, pedal hi-hat and percussion: '), '"Virtuosity Drums" by Versilian Studios and Karoryfer Samples, CC0 1.0.'),
        li(h('b', {}, 'Brushes: '), '"Swirly Drums" by Karoryfer Samples, CC0 1.0.'),
        li(h('b', {}, 'Piano: '), 'the Kawai grand piano of the Versilian Community Sample Library (VCSL) by Versilian Studios, CC0 1.0.'),
        li(h('b', {}, 'Made in the app: '), 'the metronome click, the pad, the electric piano, the organ, the guitar, the arpeggio, the drone and the tap sounds are synthesised by BassClass itself.'))),

    section('📄 Licence files', false,
      p('The licence notices that come with the sounds, as they are:'),
      licenceFile('audio/bass/LICENSE.txt'),
      licenceFile('audio/drums/LICENSE.txt'),
      licenceFile('audio/piano/LICENSE.txt'),
      p('CC BY 4.0: you are free to share and adapt the material for any purpose, even commercially, as long as you give appropriate credit, provide a link to the licence and indicate if changes were made. Full text: creativecommons.org/licenses/by/4.0/legalcode'),
      p('CC0 1.0: the authors have dedicated these works to the public domain. Full text: creativecommons.org/publicdomain/zero/1.0/legalcode')),

    section('🎼 The content', false,
      p('The exercises, lessons, licks, grooves, drum patterns and progressions were written for BassClass. The song-style studies are original lines in the style of famous songs: they keep a song\'s key, feel and technique, never its notes, and are not transcriptions. Song titles, artists and the methods named in an exercise\'s sources are mentioned for reference only; BassClass is not affiliated with or endorsed by them, and their names and trademarks belong to their owners.'),
      p('BassClass has no tracking, no ads and no third-party web code or fonts: the app itself was written for it. The Android app is built with a few open-source libraries (below).')),

    section('🧩 Open-source libraries', false,
      p('The Android app uses these libraries, each under the Apache License 2.0:'),
      h('ul', { class: 'about-list' },
        li(h('b', {}, 'AndroidX WebKit '), 'and the AndroidX libraries it uses: Copyright The Android Open Source Project.'),
        li(h('b', {}, 'The Kotlin standard library: '), 'Copyright JetBrains s.r.o. and Kotlin Programming Language contributors.')),
      p('Licensed under the Apache License, Version 2.0 (the "License"); you may not use these files except in compliance with the License. Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. The License in full:'),
      licenceFile('licenses/APACHE-2.0.txt')),

    section('🔒 Privacy policy', false,
      p(`Last updated: ${UPDATED}.`),
      p('BassClass collects no personal data. It has no account, no ads, no analytics and no tracking, and it sends nothing about you anywhere.'),
      h('ul', { class: 'about-list' },
        li(h('b', {}, 'Your progress stays on your device. '), 'Settings, progress, the course, sessions, favourites and the practice log are stored on your phone (or in your browser), and BassClass never sends them anywhere. Android\'s own backup, when it is on in your phone\'s settings, may copy the app\'s data to your Google account and bring it back on a new phone; otherwise uninstalling the app (or clearing the browser\'s data) deletes them.'),
        li(h('b', {}, 'Backups are yours. '), 'A backup is a file saved where you choose; BassClass never sends it anywhere.'),
        li(h('b', {}, 'Feedback '), '(Settings) opens your own email app with a message to us, naming the app\'s version and your phone\'s model; nothing is sent unless you press Send there. We use what you write only to answer you and to improve BassClass.'),
        li(h('b', {}, 'The microphone '), 'is used only by the tuner, only while it is open, and only on your device: the sound is analysed to find the pitch and is never recorded, stored or sent.'),
        li(h('b', {}, 'Purchases '), 'are made through Google Play. BassClass receives only whether a purchase was made; Google\'s own privacy policy covers your payment.'),
        li(h('b', {}, 'Network: '), 'the Android app works without an internet connection; it talks only to Google Play, for purchases. The web version loads the app from its site, GitHub Pages, which, like any web server, may log visitors\' IP addresses.'),
        li(h('b', {}, 'Children: '), 'BassClass is not directed to children under 13 and collects no data from anyone.')),
      CONTACT ? p(`Questions: ${CONTACT}`) : null),

    section('🧾 Terms of the purchase', false,
      h('ul', { class: 'about-list' },
        li(`BassClass is free to use, with no time limit: ${FREE_LINE}.`),
        li('BassClass Pro is a one-time purchase made through Google Play, tied to your Google account. It is yours for good: no subscription, no ads. On a new phone, use Restore purchase with the same Google account.'),
        li(`Pro opens Levels ${FREE_LEVELS + 1}–6, every drum pattern and the fills, every progression and My progression, the extra sounds, and what we add to them later. What is free today stays free.`),
        li('Prices are shown by Google Play in your currency. Refunds follow Google Play\'s refund policy; a refunded purchase closes Pro again.'),
        li('Tips are optional and unlock nothing; refunds follow Google Play\'s policy.'))),

    section('⚠ Good to know', false,
      p('Practise at a comfortable volume, also with headphones, and take breaks: stop if your hands or wrists hurt. BassClass is provided as is, without warranty; it is a practice tool, not a substitute for a teacher\'s care.')));
}
