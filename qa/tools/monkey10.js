// QA monkey runner v10 (341ccfe): monkey9 with goBack-aware link clicks (a click that the in-flight
// Back blocks is not turned into a hash change by the harness) and a depth check after every step.
// --- monkey9 header:
// QA monkey runner v9 (626f29c): monkey8 plus
//  - the exercise tip (.coach): its x is a target; after every step: never more than one tip in the
//    DOM, never a visible tip outside an exercise;
//  - listener accounting: document capture 'pointerdown' and window 'keydown' listeners must not grow
//    (the tip's pressAnywhere and the exercise's onKey are removed on dispose);
//  - course teleports: with probability pTele the run jumps to a random lesson page or step of
//    Stages 3-6 (all-keys steps, Giant Steps, the 12-key cycles included), so the course gets most taps;
//  - heap / DOM samples every 50 steps (window.__monkey.mem).
// Usage in a fresh qa tab (after one real click on Play):
//   const A = await import('/js/audio.js'); window.__acNow = () => A.audioCtx().currentTime;
//   window.__runMonkey9(seed, steps, { pTele })  -> window.__monkey
(() => {
  if (!window.__shim9) {
    window.__shim9 = true;
    window.confirm = () => Math.random() < 0.5;
    window.__startIdx = navigation.currentEntry.index - (history.state?.depth || 0);
    window.__leave = [];
    const ob0 = history.back.bind(history);
    history.back = () => {
      const idx = navigation.currentEntry.index;
      if (idx <= window.__startIdx) { window.__leave.push(`history.back() at the app's first entry (${location.hash}, state ${JSON.stringify(history.state)})`); location.hash = '#/'; return; }
      ob0();
    };
    window.requestAnimationFrame = (cb) => setTimeout(() => cb(performance.now()), 16);
    window.cancelAnimationFrame = (id) => clearTimeout(id);
    // listener accounting
    window.__lst = new Map();
    const key = (t, type, cap) => `${t === document ? 'doc' : 'win'}:${type}:${!!(cap === true || cap?.capture)}`;
    for (const tgt of [document, window]) {
      const add = tgt.addEventListener.bind(tgt), rem = tgt.removeEventListener.bind(tgt);
      tgt.addEventListener = (type, fn, cap) => { const k = key(tgt, type, cap); if (!window.__lst.has(k)) window.__lst.set(k, new Set()); window.__lst.get(k).add(fn); return add(type, fn, cap); };
      tgt.removeEventListener = (type, fn, cap) => { window.__lst.get(key(tgt, type, cap))?.delete(fn); return rem(type, fn, cap); };
    }
    const AC = window.AudioContext;
    const ob = AC.prototype.createBufferSource;
    window.__bs = 0;
    AC.prototype.createBufferSource = function () { window.__bs++; return ob.call(this); };
    window.__osc = [];
    const oc = AC.prototype.createOscillator;
    AC.prototype.createOscillator = function () { const o = oc.call(this); const rec = { type: null, stop: null, ended: false }; window.__osc.push(rec); if (window.__osc.length > 4000) window.__osc.splice(0, 2000); const st = o.start.bind(o), sp = o.stop.bind(o); o.start = (w = 0) => { rec.type = o.type; return st(w); }; o.stop = (w = 0) => { rec.stop = w; return sp(w); }; o.addEventListener('ended', () => { rec.ended = true; }); return o; };
    window.__errs = [];
    window.addEventListener('error', (e) => window.__errs.push(`${e.message} @ ${(e.error?.stack || '').split('\n')[1]?.trim()}`));
    window.addEventListener('unhandledrejection', (e) => window.__errs.push('rejection ' + (e.reason?.message || e.reason)));
    const ce = console.error.bind(console);
    console.error = (...a) => { window.__errs.push('console.error ' + a.map((x) => x?.message || String(x)).join(' ')); ce(...a); };
    document.addEventListener('click', (e) => { if (e.target.closest?.('.tn-start')) { e.stopPropagation(); e.preventDefault(); } }, true);
    const st = document.createElement('style'); st.textContent = '*{transition:none!important;animation:none!important}'; document.head.append(st);
    window.__lsWrites = [];
    const si = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) {
      if (/[?&]ls=/.test(location.hash) && (k === 'bassclass.progress.v1' || k === 'bassclass.settings.v1')) {
        try {
          const old = JSON.parse(this.getItem(k) || '{}'), nw = JSON.parse(v);
          if (k === 'bassclass.progress.v1') {
            const id = location.hash.match(/#\/ex\/([^?]+)/)?.[1];
            const a = old[id] || {}, b = nw[id] || {};
            for (const f of ['params', 'lastBpm', 'sub', 'bestBpm', 'plays']) if (JSON.stringify(a[f]) !== JSON.stringify(b[f])) window.__lsWrites.push(`${f} of ${id} written in a lesson step: ${JSON.stringify(a[f])} -> ${JSON.stringify(b[f])}`);
          } else if (old.backing !== nw.backing && !window.__actIsBacking) window.__lsWrites.push(`Backing setting changed in a lesson step without the Backing button: ${old.backing} -> ${nw.backing}`);
        } catch { /* ignore */ }
      }
      return si.call(this, k, v);
    };
  }
  const mulberry = (seed) => () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const SEL = 'button, a[href], select, input[type=range], input[type=checkbox], input.search, .card, .item, .course-next, .tcol, svg.fb, .sheet.open, .exv-tab svg';
  function visible(el) {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    if (r.right < 0 || r.bottom < 0 || r.left > innerWidth || r.top > innerHeight) return false;
    if (el.disabled) return false;
    const cx = Math.min(innerWidth - 1, Math.max(0, r.left + r.width / 2)), cy = Math.min(innerHeight - 1, Math.max(0, r.top + r.height / 2));
    const hit = document.elementFromPoint(cx, cy);
    return !!hit && (el === hit || el.contains(hit) || hit.contains(el) || (el.tagName === 'INPUT' && hit.closest('label')?.contains(el)));
  }
  const desc = (el) => {
    const t = (el.getAttribute('aria-label') || el.title || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 28);
    return `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : ''}[${t}]`;
  };
  const GOAL = /^(↺ Options|✓ Clean\??|✓ Still clean\?|✓ Got them( all\?)?|✓ Still got them\?|🎯 (\d+|–|review)\/\d+|🎯 1 round)$/;
  const SEARCHES = ['12/8', 'giant', 'G7alt', 'all keys', '', '42', '#191', '191', 'cycle', 'reading', 'ear', 'colour', 'zzz'];
  window.__runMonkey10 = async (seed, steps, { pDouble = 0.05, pEsc = 0.03, pBack = 0.04, pRapid = 0.04, pTele = 0.05, stay = false, start = null, extra = null } = {}) => {
    const rnd = mulberry(seed);
    const pick = (a) => a[Math.floor(rnd() * a.length)];
    const { LESSONS, STAGES } = await import('/js/course/data.js');
    const { stepHref } = await import('/js/ui/course.js');
    const late = LESSONS.filter((l) => STAGES.indexOf(l.stage) >= 2);
    const res = { seed, steps: 0, findings: [], log: [], t0: Date.now(), done: false, mem: [], teleports: 0 };
    window.__monkey = res;
    if (start) { location.hash = start; await sleep(500); }
    const note = (kind, msg) => { if (res.findings.length < 200) res.findings.push({ step: res.steps, kind, msg, hash: location.hash }); };
    let errN = window.__errs.length, leaveN = window.__leave.length, lsN = window.__lsWrites.length;
    let lastCnt = null, lastCntChange = Date.now();
    let depthWarned = 0, lstWarned = 0;
    for (let i = 0; i < steps; i++) {
      res.steps = i + 1;
      const els = [...document.querySelectorAll(SEL)].filter(visible);
      const r = rnd();
      let act;
      window.__actIsBacking = false;
      try {
        if (r < pTele && extra && rnd() < 0.3) {
          location.hash = pick(extra);
          res.teleports++;
          act = `teleport ${location.hash}`;
        } else if (r < pTele) {
          const l = pick(late);
          const k = Math.floor(rnd() * (l.steps.length + 1));
          location.hash = k === l.steps.length ? `#/course/${l.id}` : stepHref(l, k, rnd() < 0.1 ? { demo: 1 } : {});
          res.teleports++;
          act = `teleport ${location.hash}`;
        } else if (r < pTele + pEsc) {
          act = 'Escape';
          window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
        } else if (!stay && r < pTele + pEsc + pBack) {
          act = 'history.back';
          history.back();
        } else if (r < pTele + pEsc + pBack + 0.04) {
          const k = pick([['Space', ' '], ['ArrowRight', 'ArrowRight'], ['ArrowLeft', 'ArrowLeft'], ['Equal', '+'], ['Minus', '-']]);
          act = `key ${k[1]}`;
          window.dispatchEvent(new KeyboardEvent('keydown', { code: k[0], key: k[1], bubbles: true }));
        } else if (els.length) {
          const course = els.filter((el) => el.closest('.course-block, .les-cols, .les-head, .place-list, .unit-grid, .coach') || el.matches('.goal-btn, .routine-next, .step-row, .les-row'));
          const el = course.length && rnd() < 0.5 ? pick(course) : pick(els);
          window.__actIsBacking = /Backing/.test(el.title || '') || el.closest('.mi')?.textContent.includes('Backing');
          // every press starts with a pointerdown (the tip closes on it)
          el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
          if (el.tagName === 'SELECT') {
            const o = pick([...el.options]);
            el.value = o.value; el.dispatchEvent(new Event('change', { bubbles: true }));
            act = `select ${desc(el)} = ${o.value}`;
          } else if (el.matches('input.search')) {
            el.value = pick(SEARCHES);
            el.dispatchEvent(new Event('input', { bubbles: true }));
            act = `search "${el.value}"`;
          } else if (el.matches('input[type=checkbox]')) {
            el.click();
            act = `checkbox ${desc(el.closest('label') || el)} -> ${el.checked}`;
          } else if (el.tagName === 'INPUT') {
            const v = Number(el.min) + rnd() * (Number(el.max) - Number(el.min));
            el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
            act = `slider ${desc(el)} = ${el.value}`;
          } else if (el.matches('svg.fb')) {
            const b = el.getBoundingClientRect();
            const x = b.left + rnd() * b.width, y = b.top + rnd() * b.height;
            el.dispatchEvent(new PointerEvent('pointerdown', { clientX: x, clientY: y, bubbles: true }));
            act = `fretboard tap ${Math.round(x - b.left)},${Math.round(y - b.top)}`;
          } else if (el.matches('.exv-tab svg')) {
            const tab = el.closest('.exv-tab'); tab.scrollLeft = rnd() * tab.scrollWidth; tab.dispatchEvent(new Event('scroll')); await sleep(140);
            const b = tab.getBoundingClientRect();
            const x = b.left + rnd() * b.width, y = b.top + b.height / 2;
            const tgt = document.elementFromPoint(x, y);
            if (rnd() < 0.5 && tgt) { tgt.dispatchEvent(new MouseEvent('click', { clientX: x, clientY: y, bubbles: true })); act = `strip scroll ${Math.round(tab.scrollLeft)} + tap`; }
            else act = `strip scroll ${Math.round(tab.scrollLeft)}`;
          } else if (el.matches('.sheet.open')) {
            el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            act = 'sheet backdrop click';
          } else {
            const n = rnd() < pRapid ? 4 : rnd() < pDouble ? 2 : 1;
            let passed = true;
            for (let k = 0; k < n; k++) passed = el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })) && passed;
            act = `${n > 1 ? n + 'x ' : ''}click ${desc(el)}${passed ? '' : ' (blocked)'}`;
            if (passed && el.tagName === 'A' && el.getAttribute('href')?.startsWith('#')) location.hash = el.getAttribute('href');
          }
        } else act = 'nothing visible';
      } catch (e) { note('harness', `${act}: ${e.message}`); }
      res.log.push(`${i + 1} ${location.hash} :: ${act}`);
      await sleep(150 + rnd() * 120);
      if (window.__errs.length > errN) { for (const e of window.__errs.slice(errN)) note('error', `${e} (after: ${act})`); errN = window.__errs.length; }
      if (window.__leave.length > leaveN) { for (const e of window.__leave.slice(leaveN)) note('leave-app', `${e} (after: ${act})`); leaveN = window.__leave.length; }
      if (window.__lsWrites.length > lsN) { for (const e of window.__lsWrites.slice(lsN)) note('lesson-write', `${e} (after: ${act})`); lsN = window.__lsWrites.length; }
      const realDepth = navigation.currentEntry.index - window.__startIdx;
      if (history.state && typeof history.state.depth === 'number' && history.state.depth !== realDepth && depthWarned < 5 && navigation.currentEntry.index < 49 && !(window.__navBacking && window.__navBacking())) { depthWarned++; note('depth', `history.state.depth ${history.state.depth} but real depth ${realDepth} (after: ${act})`); }
      const pd = window.__lst.get('doc:pointerdown:true')?.size || 0, kd = window.__lst.get('win:keydown:false')?.size || 0;
      if ((pd > 3 || kd > 3) && lstWarned < 3) { lstWarned++; note('leak', `document capture pointerdown listeners ${pd}, window keydown listeners ${kd} (after: ${act})`); }
      try { JSON.parse(localStorage.getItem('bassclass.course.v1') || 'null'); } catch { note('storage', 'course key does not parse'); }
      if (document.documentElement.scrollWidth > document.documentElement.clientWidth + 1) note('hscroll', `scrollWidth ${document.documentElement.scrollWidth} > ${document.documentElement.clientWidth}`);
      const inEx = document.body.classList.contains('in-ex') && location.hash.startsWith('#/ex/');
      const coaches = document.querySelectorAll('.coach');
      if (coaches.length > 1) note('state', `${coaches.length} tips in the DOM`);
      if (!location.hash.startsWith('#/ex/') && [...coaches].some((c) => !c.hidden)) note('state', 'a tip is visible outside an exercise');
      if (document.body.classList.contains('in-ex') && !location.hash.startsWith('#/ex/')) note('state', 'body.in-ex left on a non-exercise screen');
      const badTxt = document.body.innerText.match(/[^\n]{0,25}\b(NaN|undefined|Infinity|null)\b[^\n]{0,25}/);
      if (badTxt) note('text', `"${badTxt[0]}"`);
      if (inEx) {
        const bpm = document.querySelector('.bpm')?.textContent || '';
        if (!/^\d+BPM$/.test(bpm) || Number(bpm.replace('BPM', '')) > 260 || Number(bpm.replace('BPM', '')) < 30) note('text', `BPM readout "${bpm}"`);
        const now = document.querySelector('.exv-now')?.textContent || '';
        if (/NaN|undefined|null|Infinity/.test(now) || !now) note('text', `now "${now}"`);
        const g = document.querySelector('.goal-btn');
        if (g && !GOAL.test(g.textContent)) note('text', `goal button "${g.textContent}"`);
        if (/[?&]ls=/.test(location.hash) && !/[?&]demo=1/.test(location.hash) && !g && /ls=[a-z0-9-]+\.\d/.test(location.hash)) note('state', 'lesson route without a goal button');
        const cnt = document.querySelector('.exv-now .cnt')?.textContent;
        const playing = document.querySelector('.exv-ctrl .big')?.innerHTML.includes('M7 5h4');
        if (cnt !== lastCnt) { lastCnt = cnt; lastCntChange = Date.now(); }
        else if (playing && Date.now() - lastCntChange > 12000) { note('stuck', `playing but step readout "${cnt}" unchanged for 12 s`); lastCntChange = Date.now(); }
        const sh = document.querySelector('.sheet.open');
        if (sh && !visible(sh.querySelector('.btn.primary') || sh)) note('state', 'options sheet open without a visible Done button');
        const dr = document.querySelector('.drawer.open');
        if (dr && !visible(dr.querySelector('[data-close]') || dr)) note('state', 'info drawer open without a visible close button');
      } else {
        const c0 = window.__bs;
        await sleep(600);
        if (window.__bs > c0 && !/^#\/(explorer|tuner)/.test(location.hash)) note('ghost-audio', `${window.__bs - c0} notes scheduled on ${location.hash || '#/'} with no exercise open`);
        const now = window.__acNow ? window.__acNow() : 0;
        const padLive = (window.__osc || []).filter((o) => (o.type === 'sawtooth' || o.type === 'triangle') && !o.ended && (o.stop == null || o.stop > now + 1.3));
        if (padLive.length) note('ghost-pad', `${padLive.length} pad oscillators still running on ${location.hash || '#/'}`);
      }
      if (i % 50 === 0) res.mem.push({ step: i, heap: Math.round((performance.memory?.usedJSHeapSize || 0) / 1e5) / 10, nodes: document.getElementsByTagName('*').length, anims: document.getAnimations().length, ls: Object.keys(localStorage).reduce((a, k) => a + (localStorage.getItem(k) || '').length, 0) });
    }
    res.done = true;
    res.ms = Date.now() - res.t0;
    try { localStorage.setItem('__qa_log', JSON.stringify({ seed, findings: res.findings, log: res.log.slice(-400) })); } catch { /* full */ }
    return res;
  };
})();
