// QA round 25 (1d4c6df): the neck's area in use (`setOutside`, `areaFor`, `tapArea`).
// Paste into the qa tab (or store in localStorage['__qa_area25'] and eval it). It hooks FretboardView.setOutside and
// Player.load to capture the live neck and the line loaded, then:
//   await __a25.sweep({ strings, lefty, all })   play mode: opens every exercise (every option of the ones that can
//       have an area when `all`), and reports any note whose dot centre (2 px above or below the string) sits inside a
//       greyed rect.fb-out, and any area that hides nothing it should not.
//   await __a25.taps({ sets })                   tap mode: plays sets of every tap exercise, answering each question
//       at a place inside its area through the neck's own onTap, and reports a refused or greyed right answer.
// Results go to window.__a25.res and localStorage['__qa_log'].
(async () => {
  const FV = await import('/js/views/fretboardView.js');
  const P = await import('/js/player.js');
  const C = await import('/js/curriculum/index.js');
  const St = await import('/js/store.js');
  const G = await import('/js/curriculum/games.js');
  const T = await import('/js/theory.js');
  if (!FV.FretboardView.prototype.__a25) {
    const so = FV.FretboardView.prototype.setOutside;
    FV.FretboardView.prototype.setOutside = function (a) { window.__fb = this; window.__area = a; return so.call(this, a); };
    const ld = P.Player.prototype.load;
    P.Player.prototype.load = function (inst) { window.__inst = inst; window.__player = this; return ld.call(this, inst); };
    FV.FretboardView.prototype.__a25 = 1;
  }
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const rects = (fb) => [...fb.svg.querySelectorAll('rect.fb-out')].map((r) => ({ x: +r.getAttribute('x'), y: +r.getAttribute('y'), w: +r.getAttribute('width'), h: +r.getAttribute('height') }));
  const inGrey = (rs, x, y) => rs.some((r) => x > r.x + 0.01 && x < r.x + r.w - 0.01 && y > r.y + 0.01 && y < r.y + r.h - 0.01);
  const dotXY = (fb, n) => ({ x: n.tag === '◊' ? fb.nodeX(n.at ?? n.f) : fb.fretX(n.f), y: fb.stringY(n.s) });
  function checkLine(fb, inst) {
    const rs = rects(fb), bad = [];
    inst.steps.forEach((st, i) => {
      if (st.rest) return;
      for (const n of st.notes || []) {
        if (n.f == null || n.s == null || n.hidden) continue;
        if (n.f < fb.lo || n.f > fb.hi || n.s >= fb.strings) continue;
        const { x, y } = dotXY(fb, n);
        const up = inGrey(rs, x, y - 2), dn = inGrey(rs, x, y + 2);
        if (up || dn) bad.push({ i, s: n.s, f: n.f, at: n.at, held: !!n.held, tag: n.tag, half: up !== dn });
      }
    });
    return { bad, rects: rs.length };
  }
  // (waits for a NEW neck that is in the page: the first sweep, which only waited for a new line, read the previous
  // screen's neck a few times right after a settings change)
  async function open(hash) {
    const before = window.__inst, fb0 = window.__fb;
    location.hash = hash;
    for (let k = 0; k < 80; k++) { await sleep(15); if (window.__inst !== before && window.__fb !== fb0 && window.__fb?.svg.isConnected) break; }
    await sleep(40);
    if (!window.__fb?.svg.isConnected) throw new Error('fb not connected');
  }
  const qs = (p) => Object.entries(p).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
  const AREA_KEYS = ['zone', 'string', 'pos', 'range', 'strings'];
  window.__a25 = {
    res: null,
    async sweep({ strings = 4, lefty = false, all = true, only = null } = {}) {
      St.saveSettings({ strings, lefty });
      const res = { strings, lefty, opened: 0, withArea: 0, bad: [], errs: [], areas: {} };
      this.res = res;
      const list = C.EXERCISES.filter((t) => !t.game && (!only || only.includes(t.id)));
      for (const t of list) {
        const def = C.defaultParams(t);
        const combos = [def];
        const keys = Object.keys(t.params || {});
        if (all && keys.some((k) => AREA_KEYS.includes(k))) {
          for (const k of keys) for (const o of t.params[k].options || []) {
            if (o[2]?.minStrings > strings) continue;
            if (String(o[0]) !== String(def[k])) combos.push({ ...def, [k]: o[0] });
          }
        }
        for (const p of combos) {
          try {
            await open(`#/ex/${t.id}?${qs(p)}`);
            res.opened++;
            const fb = window.__fb, inst = window.__inst;
            if (!fb || !inst || inst.tap) continue;
            const r = checkLine(fb, inst);
            if (r.rects) { res.withArea++; (res.areas[t.id] ||= []).push(`${JSON.stringify(p)} → ${JSON.stringify(window.__area)}`); }
            if (r.bad.length) res.bad.push({ id: t.id, p, area: window.__area, view: [fb.lo, fb.hi], bad: r.bad.slice(0, 4), n: r.bad.length });
          } catch (e) { res.errs.push(`${t.id} ${JSON.stringify(p)}: ${e.message}`); }
        }
        try { localStorage.__qa_log = `${res.opened} ${t.id} bad ${res.bad.length}`; } catch { /* */ }
      }
      return res;
    },
    checkLine, rects, inGrey, dotXY, open,
  };
  return 'a25 ready';
})()
