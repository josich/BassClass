// QA round 19 (3219994): stored records read back by a fresh app in a same-origin iframe (state18's method), for
// any keys. `__ifr19(records, hashes, read)`: writes each record (a string as is, an object as JSON, undefined
// removes it), loads the app, visits each hash (drawn or EMPTY, NaN/undefined/null text, a Pro sheet open),
// then `read(w)` (async, in the iframe's window) and the errors. It puts back every record it touched.
//   __state19()   the round's cases: bassclass.pro.v1 and bassclass-dev.pro corrupt, the room's new keys
//                 (fills, upFrom, lightsTapped, hSound piano/guitar) with the gates on and off, settings v4,
//                 progress `met`.
(() => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  window.__ifr19 = async (records = {}, hashes = ['#/', '#/practice', '#/settings'], read = null) => {
    const keep = Object.fromEntries(Object.keys(records).map((k) => [k, localStorage.getItem(k)]));
    const put = (k, v) => { if (v === undefined || v === null) localStorage.removeItem(k); else localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)); };
    for (const [k, v] of Object.entries(records)) put(k, v);
    const f = document.createElement('iframe');
    f.style.cssText = 'position:fixed;left:0;top:0;width:800px;height:380px;opacity:0.01;pointer-events:none;z-index:-1';
    const errs = [];
    f.src = `/?ifr19=${Math.random()}${hashes[0]}`;
    document.body.append(f);
    try {
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
        texts.push(`${h} -> ${w.location.hash}: ${main.children.length ? 'drawn' : 'EMPTY'}${bad ? ` BAD TEXT "${bad[0]}"` : ''}${w.document.querySelector('.pro-sheet') ? ' PRO SHEET' : ''}`);
        w.document.querySelector('.pro-sheet .picker-close')?.click(); await sleep(150);
      }
      const extra = read ? await read(w) : null;
      return { texts, errs, extra };
    } finally {
      f.remove();
      for (const [k, v] of Object.entries(keep)) put(k, v);
    }
  };

  window.__state19 = async () => {
    const R = {};
    const proRead = async (w) => { const P = await w.eval(`import("${location.origin}/js/pro.js")`); return { gates: P.gatesOn(), isPro: P.isPro(), owned: P.owned(), rec: JSON.stringify(P.proRecord()), dev: JSON.stringify(P.dev()) }; };
    const devOn = JSON.stringify({ on: true, gates: true, next: 'ok', sim: [] });
    const proCases = {
      garbage: '{{', array: '[]', str: '"x"', ownedString: { owned: 'yes', src: 'test' }, playOnTest: { owned: true, src: 'play', miss: null },
      missString: { owned: true, src: 'test', miss: 'x' }, missFuture: { owned: true, src: 'test', miss: 9e15 }, nullRec: 'null',
    };
    for (const [name, v] of Object.entries(proCases)) R[`pro:${name}`] = await window.__ifr19({ 'bassclass.pro.v1': v, 'bassclass-dev.pro': devOn }, ['#/', '#/library', '#/settings'], proRead);
    const devCases = { garbage: '{{', simNull: { on: true, gates: true, next: 'ok', sim: null }, simString: { on: true, gates: true, sim: 'x' }, gatesString: { on: true, gates: 'no' }, nextBad: { on: true, gates: true, next: 'zzz', sim: [] } };
    for (const [name, v] of Object.entries(devCases)) R[`dev:${name}`] = await window.__ifr19({ 'bassclass-dev.pro': v, 'bassclass.pro.v1': undefined }, ['#/settings', '#/library'], proRead);
    // the room's new keys
    const roomRead = async (w) => { const S = await w.eval(`import("${location.origin}/js/practice/state.js")`); const r = S.room; return JSON.stringify({ fills: r.fills, upFrom: r.upFrom, lightsTapped: r.lightsTapped, hSound: r.hSound, style: r.style, hProg: r.hProg, drums: r.drums }); };
    const roomCases = {
      proGatesOn: [{ drums: true, style: 'blast', genre: 'metal', fills: 8, harmony: 'chords', hProg: 'giant-steps', hSound: 'organ' }, devOn],
      proGatesOff: [{ drums: true, style: 'blast', genre: 'metal', fills: 8, harmony: 'chords', hProg: 'giant-steps', hSound: 'organ' }, JSON.stringify({ on: false, gates: false })],
      badKeys: [{ fills: 3, upFrom: 'x', lightsTapped: 'yes', hSound: 'strings' }, undefined],
      upFromZero: [{ upFrom: 0, speedUp: true }, undefined],
      pianoOn: [{ harmony: 'chords', hSound: 'piano' }, undefined],
      guitarDrone: [{ harmony: 'drone', hSound: 'guitar' }, undefined],
      genreUnknownStyleOk: [{ drums: true, style: 'seven322', genre: 'zzz' }, devOn],
    };
    for (const [name, [room, dev]] of Object.entries(roomCases)) R[`room:${name}`] = await window.__ifr19({ 'bassclass.practice.v1': { bpm: 90, beats: 4, ...room }, 'bassclass-dev.pro': dev }, ['#/practice', '#/'], roomRead);
    // settings v4 migration
    const setRead = async (w) => { const S = await w.eval(`import("${location.origin}/js/store.js")`); return JSON.stringify({ clickVol: S.settings.clickVol, v: S.settings.v }); };
    for (const [name, s] of Object.entries({ v3default: { v: 3, clickVol: 1.2 }, v3other: { v: 3, clickVol: 0.9 }, v4keep: { v: 4, clickVol: 1.2 }, v2: { v: 2, clickVol: 0.6 }, v1: { clickVol: 0.3 } })) R[`settings:${name}`] = await window.__ifr19({ 'bassclass.settings.v1': s }, ['#/settings'], setRead);
    // progress `met`
    const prRead = async (w) => { const S = await w.eval(`import("${location.origin}/js/store.js")`); return JSON.stringify(S.getProgress('tech-spider')); };
    R['progress:met'] = await window.__ifr19({ 'bassclass.progress.v1': { 'tech-spider': { plays: 2, met: 'yes', done: 1, bestBpm: 'fast', lastBpm: 999 } } }, ['#/library', '#/'], prRead);
    return R;
  };
  window.__state19ready = true;
})();
