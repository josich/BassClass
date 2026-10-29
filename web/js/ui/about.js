// About BassClass (#/about; the rail's logo opens it; user, 2026-10-27: "all licences and mentions for samples and
// all legal and mandatory documentation under the app logo"): the version, the credits of every recorded sound
// with their licences (the CC BY one as its licence asks: who made it, the licence, what was changed), the licence
// files themselves, where the content comes from, the libraries, the privacy policy, the terms of the purchase. The
// legal texts live in ../legal.js (the public privacy page is made from the same text); they follow the launch legal
// review (qa/reports/2026-10-28-launch-legal.md).
import { h, icon } from './dom.js';
import { VERSION, COMMIT } from '../version.js';
import { canGoBack, goBack } from './nav.js';
import { go } from './screens.js';
import { FREE_LEVELS } from '../pro.js';
import { FREE_LINE } from './proSheet.js';
import { DEVELOPER, CONTACT, privacyPolicy, purchaseTerms, SAFETY } from '../legal.js';

/** A legal text's blocks (legal.js) as the page's paragraphs and lists. */
const blocks = (list) => list.map(([kind, x]) => (kind === 'h' ? h('h3', { class: 'about-h' }, x)
  : kind === 'ul' ? h('ul', { class: 'about-list' }, x.map((it) => (Array.isArray(it) ? h('li', {}, h('b', {}, it[0]), it[1]) : h('li', {}, it))))
    : h('p', {}, x)));

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
        li(h('b', {}, 'Made in the app: '), 'the metronome click, the tap sounds and the harmony\'s pad, electric piano, organ, guitar and arpeggio are synthesised by BassClass itself; the drone and the chords play in the sound you pick, the piano being the recorded one above.'))),

    section('📄 Licence files', false,
      p('The licence notices that come with the sounds, as they are:'),
      licenceFile('audio/bass/LICENSE.txt'),
      licenceFile('audio/drums/LICENSE.txt'),
      licenceFile('audio/piano/LICENSE.txt'),
      p('CC BY 4.0: you are free to share and adapt the material for any purpose, even commercially, as long as you give appropriate credit, provide a link to the licence and indicate if changes were made. Full text: creativecommons.org/licenses/by/4.0/legalcode'),
      p('CC0 1.0: the authors have dedicated these works to the public domain. Full text: creativecommons.org/publicdomain/zero/1.0/legalcode')),

    section('🎼 The content', false,
      p('The exercises, lessons, licks, grooves, drum patterns and progressions were written for BassClass. The song-style studies are original lines in the style of famous songs: they keep a song\'s key, feel and technique; they are not transcriptions, and the notes are our own.'),
      p('Songs, artists, players, books, methods and exam syllabi named in the app (an exercise\'s "Related" line, a study\'s source) are mentioned for reference only, as related listening and reading. BassClass is not affiliated with or endorsed by them, and their names and trademarks belong to their owners.'),
      p('BassClass has no tracking, no ads and no third-party web code or fonts: all of its code was written for BassClass. The Android app uses a few libraries (below).')),

    section('🧩 Libraries', false,
      p('The Android app uses these libraries:'),
      h('ul', { class: 'about-list' },
        li(h('b', {}, 'AndroidX '), '(WebKit, Core, Activity and the libraries they use): © The Android Open Source Project, under the Apache License 2.0.'),
        li(h('b', {}, 'The Kotlin standard library: '), '© JetBrains s.r.o. and Kotlin Programming Language contributors, under the Apache License 2.0.'),
        li(h('b', {}, 'Google\'s data-transport and encoder libraries: '), '© Google LLC, under the Apache License 2.0.'),
        li(h('b', {}, 'The Google Play In-App Review library: '), '© Google LLC, under the Play Core Software Development Kit Terms of Service (developer.android.com/guide/playcore/license).'),
        li(h('b', {}, 'The Google Play Billing Library and Google Play services components '), '(in the app from Google Play): © Google LLC, under the Android Software Development Kit License Agreement (developer.android.com/studio/terms).')),
      p('The Apache License, Version 2.0: licensed under the Apache License, Version 2.0 (the "License"); you may not use these files except in compliance with the License. Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. The License in full:'),
      licenceFile('licenses/APACHE-2.0.txt')),

    // (the web version's own line while it exists: its host's logs)
    section('🔒 Privacy policy', false, ...blocks(privacyPolicy(location.hostname === 'appassets.androidplatform.net' ? 'app' : 'web'))),
    section('🧾 Terms of the purchase', false, ...blocks(purchaseTerms({ free: FREE_LINE, from: FREE_LEVELS + 1 }))),
    section('⚠ Good to know', false, p(SAFETY)));
}
