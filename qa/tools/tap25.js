// QA round 25 (1d4c6df): tap mode against its known answers. Needs area25.js loaded first (it hooks the neck and the
// Player). Timers run 20x faster while `window.__fast` is set (the app's own setTimeout calls), so a set of ten takes
// about a second. For every tap exercise and option it plays a set through the neck's own onTap and checks:
//   - every place that answers a question (tapPlaces' rule) is on the board and outside the grey;
//   - the right pitch tapped outside the question's places is a hint (count unchanged, "That … " prompt), never a miss,
//     where the question has an area; where it has none, what happens is recorded;
//   - a wrong note is ✗, a right one ✓, and the end card's score is the number answered right.
// Run: await __t25.playSet('#/ex/game-ear-notes?frets=5&string=any', { wrongAt: [2, 7] })
(async () => {
  const T = await import('/js/theory.js');
  const G = await import('/js/curriculum/games.js');
  if (!window.__realST) {
    window.__realST = window.setTimeout;
    window.setTimeout = function (fn, ms, ...a) { return window.__realST(fn, window.__fast ? (ms || 0) * window.__fast : ms, ...a); };
  }
  const rs = (ms) => new Promise((r) => window.__realST(r, ms));
  const places = (a, inst, fb) => {
    const hi = a.hi ?? inst.tap.hi ?? 12, lo = a.lo ?? 0;
    const pcs = a.multi ? a.multi.map((x) => x.pc) : [a.pc];
    let pl = a.midi != null && !a.multi ? G.placesOf(a.midi, { tuning: fb.tuning }, hi)
      : fb.tuning.flatMap((o, s) => Array.from({ length: hi + 1 }, (_, f) => ({ s, f })).filter((q) => pcs.some((pc) => T.mod(o + q.f - pc, 12) === 0)));
    pl = pl.filter((q) => q.f >= lo);
    if (a.strings) pl = pl.filter((q) => a.strings.includes(q.s));
    if (a.not) pl = pl.filter((q) => !a.not.some((x) => x.s === q.s && x.f === q.f));
    return pl;
  };
  const same = (a, fb) => fb.tuning.flatMap((o, s) => Array.from({ length: fb.hi + 1 }, (_, f) => ({ s, f, m: o + f })))
    .filter((q) => q.f >= fb.lo && (a.midi != null && !a.multi ? q.m === a.midi : T.mod(q.m - a.pc, 12) === 0));
  const grey = (fb, q) => { const r = __a25.rects(fb), x = fb.fretX(q.f), y = fb.stringY(q.s); return __a25.inGrey(r, x, y - 2) || __a25.inGrey(r, x, y + 2); };
  window.__t25 = {
    places, same, grey,
    async playSet(hash, { wrongAt = [], hint = true } = {}) {
      window.__fast = 0.05;
      try {
        await __a25.open(hash);
        if (!__inst.tap) return { hash, err: 'not in tap mode' };
        const b0 = __inst;
        document.querySelector('button[title^="Play / pause"]').click();
        for (let k = 0; k < 100 && __inst === b0; k++) await rs(10);
        const inst = __inst, fb = __fb, asks = inst.tap.asks;
        const nowEl = document.querySelector('.exv-now'), pEl = document.querySelector('.exv-prompt');
        const res = { hash, kind: inst.tap.kind, n: asks.length, issues: [], hints: 0, noAreaRight: [], greyHintsNot: 0, expect: 0 };
        for (let j = 0; j < asks.length; j++) {
          for (let k = 0; k < 400; k++) { if (nowEl.textContent.startsWith(`${j + 1}/`) && !/Listen/.test(pEl.textContent)) break; await rs(5); }
          if (!nowEl.textContent.startsWith(`${j + 1}/`)) { res.issues.push(`q${j}: never asked ("${nowEl.textContent}")`); break; }
          const a = asks[j].answer, pl = places(a, inst, fb);
          if (!pl.length) res.issues.push(`q${j}: no place answers ${JSON.stringify(a).slice(0, 160)}`);
          for (const q of pl) {
            if (q.f < fb.lo || q.f > fb.hi || q.s >= fb.strings) res.issues.push(`q${j}: answer ${q.s}:${q.f} off the board (${fb.lo}–${fb.hi})`);
            else if (grey(fb, q)) res.issues.push(`q${j}: answer ${q.s}:${q.f} greyed, area ${JSON.stringify(__area)}`);
          }
          // the right pitch outside the places: a hint where there is an area
          if (hint && !a.multi) {
            const alt = same(a, fb).filter((q) => !pl.some((p) => p.s === q.s && p.f === q.f) && !(a.not || []).some((x) => x.s === q.s && x.f === q.f));
            if (alt.length) {
              const q = alt[Math.floor(Math.random() * alt.length)];
              const before = nowEl.textContent;
              fb.onTap(q.s, q.f);
              const hasArea = a.midi == null || !!a.strings || a.hi != null || !!a.lo;
              const answered = !!pEl.querySelector('.tap-ok,.tap-no');
              if (hasArea) {
                res.hints++;
                if (answered || nowEl.textContent !== before || !/^That /.test(pEl.textContent)) res.issues.push(`q${j}: hint at ${q.s}:${q.f} counted: "${nowEl.textContent}" / "${pEl.textContent}"`);
                if (!grey(fb, q)) res.greyHintsNot++, res.hintNotGrey ||= `${q.s}:${q.f} (view ${fb.lo}–${fb.hi}) area ${JSON.stringify(__area)} prompt "${pEl.textContent}"`;
              } else {
                res.noAreaRight.push(`q${j} ${q.s}:${q.f} → ${answered ? (pEl.querySelector('.tap-ok') ? '✓' : '✗') : 'nothing'} "${pEl.textContent.slice(0, 70)}"`);
                if (answered) { if (pEl.querySelector('.tap-ok')) res.expect++; continue; }
              }
            }
          }
          if (wrongAt.includes(j)) {
            const pcs = a.multi ? [...a.multi.map((x) => x.pc), ...(asks[j].refs || []).map((x) => T.mod(x.midi, 12))] : [a.midi != null ? T.mod(a.midi, 12) : a.pc];
            let w = null;
            for (let s = 0; s < fb.strings && !w; s++) for (let f = Math.max(fb.lo, 1); f <= Math.min(fb.hi, 12) && !w; f++) {
              const m = fb.tuning[s] + f;
              if (!pcs.includes(T.mod(m, 12)) && !(a.strings && !a.strings.includes(s)) && f <= (a.hi ?? 99) && f >= (a.lo ?? 0)) w = { s, f };
            }
            fb.onTap(w.s, w.f);
            if (!pEl.querySelector('.tap-no')) res.issues.push(`q${j}: a wrong note ${w.s}:${w.f} was not ✗: "${pEl.textContent}"`);
            continue;
          }
          if (a.multi) {
            const seen = new Set();
            for (const t of a.multi) { const q = pl.find((x) => T.mod(fb.tuning[x.s] + x.f - t.pc, 12) === 0); if (q && !seen.has(t.pc)) { seen.add(t.pc); fb.onTap(q.s, q.f); } }
          } else if (a.all) for (const q of pl) fb.onTap(q.s, q.f);
          else { const q = pl[Math.floor(Math.random() * pl.length)]; if (q) fb.onTap(q.s, q.f); }
          if (!pEl.querySelector('.tap-ok')) res.issues.push(`q${j}: the right answer was not ✓: "${pEl.textContent}" (${JSON.stringify(a).slice(0, 140)})`);
          else res.expect++;
        }
        const end = document.querySelector('.game-end');
        for (let k = 0; k < 200 && end.hidden; k++) await rs(10);
        res.end = end.hidden ? 'no end card' : end.querySelector('h2')?.textContent;
        if (res.end !== `${res.expect} of ${res.n}`) res.issues.push(`end card "${res.end}", expected ${res.expect} of ${res.n}`);
        return res;
      } finally { window.__fast = 0; }
    },
  };
  return 't25 ready';
})()
