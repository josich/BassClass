// QA round 18 (f15a4eb): stored records read back by a fresh copy of the app in a same-origin iframe.
//   __ifr18({ settings, practice }, hashes)  writes the raw strings (undefined: removed), loads the app in an
//     iframe, visits each hash, and returns the settings and room the iframe's modules hold, the stored
//     records after the visit, errors, and any NaN/undefined/null text.
//   __state18()  the round's cases: accents (old `accent: false`, corrupt, out of range), hSound "strings",
//     tapSounds, the settings v3 migration (clickVol doubled once, capped at 1.5, a newer record left alone).
// Classic script; it overwrites bassclass.settings.v1 and bassclass.practice.v1 of this origin and puts
// back what was there.
(() => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  window.__ifr18 = async ({ settings, practice } = {}, hashes = ['#/practice', '#/settings', '#/']) => {
    const put = (k, v) => { if (v === undefined) localStorage.removeItem(k); else localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)); };
    put('bassclass.settings.v1', settings); put('bassclass.practice.v1', practice);
    const f = document.createElement('iframe');
    f.style.cssText = 'position:fixed;left:0;top:0;width:800px;height:380px;opacity:0.01;pointer-events:none;z-index:-1';
    const errs = [];
    f.src = `/?ifr18=${Math.random()}${hashes[0]}`;
    document.body.append(f);
    await new Promise((r) => { f.onload = r; });
    const w = f.contentWindow;
    w.addEventListener('error', (e) => errs.push(e.message));
    w.addEventListener('unhandledrejection', (e) => errs.push(`rejection ${e.reason?.message || e.reason}`));
    const ce = w.console.error; w.console.error = (...a) => { errs.push(a.map(String).join(' ')); ce(...a); };
    const texts = [];
    for (const h of hashes) {
      w.location.hash = h; await sleep(700);
      const main = w.document.querySelector('main') || w.document.body;
      const t = main.innerText || '';
      const bad = t.match(/.{0,30}\b(NaN|undefined|null)\b.{0,30}/);
      texts.push(`${h}: ${main.children.length ? 'drawn' : 'EMPTY'}${bad ? ` BAD TEXT "${bad[0]}"` : ''}`);
    }
    const st = await w.eval(`import("${location.origin}/js/store.js")`); const pr = await w.eval(`import("${location.origin}/js/practice/state.js")`);
    const out = {
      settings: { clickVol: st.settings.clickVol, bassVol: st.settings.bassVol, v: st.settings.v, tapSounds: st.settings.tapSounds },
      room: { accents: JSON.stringify(pr.room.accents), hSound: pr.room.hSound, beats: pr.room.beats, accent: pr.room.accent },
      storedSettings: localStorage.getItem('bassclass.settings.v1'),
      storedRoom: (localStorage.getItem('bassclass.practice.v1') || '').slice(0, 160),
      lights: [...w.document.querySelectorAll('.beat-lights > *')].map((b) => (b.classList.contains('accent') ? (b.classList.contains('group') ? 'g' : 'A') : '.')).join(''),
      grouping: w.document.querySelector('.beat-grouping')?.textContent ?? null,
      texts, errs,
    };
    f.remove();
    return out;
  };

  window.__state18 = async () => {
    const keep = { s: localStorage.getItem('bassclass.settings.v1'), p: localStorage.getItem('bassclass.practice.v1') };
    const R = {};
    const room = (o) => ({ bpm: 90, beats: 4, ...o });
    const cases = {
      oldAccentOff7: { practice: room({ accent: false, beats: 7 }) },
      oldAccentOffBadBeats: { practice: room({ accent: false, beats: 99 }) },
      oldAccentOn: { practice: room({ accent: true, beats: 7 }) },
      accentOffWithAccents: { practice: room({ accent: false, accents: { 5: [0, 2] }, beats: 5 }) },
      outOfRange: { practice: room({ accents: { 7: [0, 9] }, beats: 7 }) },
      dup: { practice: room({ accents: { 7: [0, 3, 3] }, beats: 7 }) },
      key13: { practice: room({ accents: { 13: [0] } }) },
      array: { practice: room({ accents: [] }) },
      string: { practice: room({ accents: 'x' }) },
      proto: { practice: '{"bpm":90,"beats":7,"accents":{"__proto__":[0,3]}}' },
      frac: { practice: room({ accents: { 7: [0, 2.5] }, beats: 7 }) },
      oneGoodOneBad: { practice: room({ accents: { 7: [0, 3, 5], 5: [0, 7] }, beats: 7 }) },
      keyWithDot: { practice: room({ accents: { '7.0': [0, 3] }, beats: 7 }) },
      noBeatOne: { practice: room({ accents: { 7: [3, 5] }, beats: 7 }) },
      empty7: { practice: room({ accents: { 7: [] }, beats: 7 }) },
      strings: { practice: room({ hSound: 'strings' }) },
      badSound: { practice: room({ hSound: 'xx' }) },
      garbage: { practice: '{"accents": {"7": [0', settings: 'not json' },
      // settings v3
      v2default: { settings: { v: 2, clickVol: 0.6 } },
      v2loud: { settings: { v: 2, clickVol: 0.9 } },
      v2max: { settings: { v: 2, clickVol: 1.5 } },
      v1: { settings: { clickVol: 0.3, bassVol: 1 } },
      v3: { settings: { v: 3, clickVol: 0.6 } },
      vString: { settings: { v: '2', clickVol: 0.6 } },
      newer: { settings: { v: 9, clickVol: 0.6 } },
      clickString: { settings: { v: 2, clickVol: '0.6' } },
      tapBad: { settings: { v: 3, tapSounds: 'no' } },
      tapOff: { settings: { v: 3, tapSounds: false } },
    };
    try {
      for (const [k, c] of Object.entries(cases)) R[k] = await window.__ifr18(c);
      // a migrated v2 record loaded twice: doubled once only?
      const first = await window.__ifr18({ settings: { v: 2, clickVol: 0.6 } }, ['#/settings']);
      const second = await window.__ifr18({ settings: localStorage.getItem('bassclass.settings.v1') ?? undefined }, ['#/settings']);
      R.twice = { first: first.settings, storedAfterFirst: first.storedSettings, second: second.settings };
    } finally {
      if (keep.s == null) localStorage.removeItem('bassclass.settings.v1'); else localStorage.setItem('bassclass.settings.v1', keep.s);
      if (keep.p == null) localStorage.removeItem('bassclass.practice.v1'); else localStorage.setItem('bassclass.practice.v1', keep.p);
    }
    return R;
  };
  window.__state18ready = true;
})();
