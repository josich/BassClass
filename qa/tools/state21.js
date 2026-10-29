// QA round 21 (6d8ee74): stored records read back by a fresh app (state19's `__ifr19`, load state19.js first).
//   __state21()   the drone's keys in bassclass.practice.v1 (hQual, droneFavs, droneRecent) with the gates on and
//                 off; bassclass-dev.errors corrupt (then an error logged and read back as Feedback would);
//                 bassclass.course.v1 placed at every stage with "All yes" (M1 of round 20).
(() => {
  const devOn = JSON.stringify({ on: true, gates: true, next: 'ok', sim: [] });
  const devOff = JSON.stringify({ on: false, gates: false });
  window.__state21 = async () => {
    const R = {};
    const roomRead = async (w) => {
      const S = await w.eval(`import("${location.origin}/js/practice/state.js")`); const r = S.room;
      const harm = [...w.document.querySelectorAll('section')].find((x) => /Harmony/.test(x.querySelector('h2')?.textContent || ''));
      return JSON.stringify({ hQual: r.hQual, favs: r.droneFavs, recent: r.droneRecent, line: harm?.querySelector('.pick-now')?.innerText.replace(/\n/g, ' / '), tag: w.document.querySelector('.drone-tag')?.textContent, seg: [...w.document.querySelectorAll('.harm-bar .seg button')].map((b) => b.textContent + (b.classList.contains('on') ? '*' : '')).join('|') });
    };
    const base = { harmony: 'drone', hKey: 1, neckShow: 'chord' };
    const cases = {
      zzz: { hQual: 'zzz' }, num: { hQual: 7 }, nul: { hQual: null }, proto: { hQual: '__proto__' }, ctor: { hQual: 'constructor' },
      proOn: [{ hQual: 'dom7b9' }, devOn], proOff: [{ hQual: 'dom7b9' }, devOff], freeOn: [{ hQual: 'min7' }, devOn], rootOn: [{ hQual: 'root' }, devOn],
      favsStr: { droneFavs: 'maj', droneRecent: 'x' }, favsMixed: { droneFavs: ['nope', 'maj7', 'maj7', 3, null], droneRecent: ['min', 'min', 'dom9', 'x', 'aug', 'dim', 'sus2', 'sus4', 'maj'] },
      favsMany: { droneFavs: Array.from({ length: 150 }, (_, i) => ['maj', 'min', 'dim'][i % 3]) },
      neckScale: { hQual: 'open', neckShow: 'chord' }, neckOff: { hQual: 'min7', neckShow: 'off' },
    };
    for (const [name, c] of Object.entries(cases)) {
      const [rec, dev] = Array.isArray(c) ? c : [c, devOff];
      R[`room:${name}`] = await window.__ifr19({ 'bassclass.practice.v1': { ...base, ...rec }, 'bassclass-dev.pro': dev }, ['#/practice'], roomRead);
    }
    // the last errors, corrupt
    const errRead = async (w) => {
      const E = await w.eval(`import("${location.origin}/js/errors.js")`);
      const before = E.recentErrors();
      E.logError(new Error('qa21 probe'));
      return JSON.stringify({ before: before.length, after: E.recentErrors(), raw: w.localStorage.getItem('bassclass-dev.errors')?.slice(0, 80) });
    };
    for (const [name, v] of Object.entries({ garbage: '{{', obj: '{"a":1}', str: '"x"', nul: 'null', many: JSON.stringify(Array.from({ length: 60 }, (_, i) => `e${i}`)), nums: '[1,2,{"x":1}]' })) {
      R[`errors:${name}`] = await window.__ifr19({ 'bassclass-dev.errors': v }, ['#/'], errRead);
    }
    return R;
  };
})();
'state21 loaded';
