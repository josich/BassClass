// QA monkey runner v5 (53a1753). monkey4 plus checks for the round-5 features. Needs qa/tools/audio-tap.js
// pasted first (window.__osc, window.__rec). Extra checks after every step:
//  - a backing-pad oscillator (sawtooth/triangle) still running with no stop time on a screen without an exercise;
//  - a pad burst: the pad tap above 0.6 (a normal pad peaks at ~0.2);
//  - staff strip text with NaN/undefined; the Backing / Tab-Staff toggles empty.
// Paste into the qa tab after one real click on Play. Results: window.__monkey; log in localStorage['__qa_log'].
(() => {
  if (!window.__shim) {
    window.__shim = true;
    window.confirm = () => Math.random() < 0.5;
    window.__depth = 0;
    window.addEventListener('hashchange', () => { window.__depth++; });
    const ob0 = history.back.bind(history);
    history.back = () => { if (window.__depth >= 1) { window.__depth -= 2; ob0(); } else { location.hash = '#/'; } };
    window.requestAnimationFrame = (cb) => setTimeout(() => cb(performance.now()), 16);
    window.cancelAnimationFrame = (id) => clearTimeout(id);
    const AC = window.AudioContext;
    const ob = AC.prototype.createBufferSource;
    window.__bs = 0;
    AC.prototype.createBufferSource = function () { window.__bs++; return ob.call(this); };
    window.__errs = [];
    window.addEventListener('error', (e) => window.__errs.push(`${e.message} @ ${(e.error?.stack || '').split('\n')[1]?.trim()}`));
    window.addEventListener('unhandledrejection', (e) => window.__errs.push('rejection ' + (e.reason?.message || e.reason)));
    const ce = console.error.bind(console);
    console.error = (...a) => { window.__errs.push('console.error ' + a.map((x) => x?.message || String(x)).join(' ')); ce(...a); };
    document.addEventListener('click', (e) => { if (e.target.closest?.('.tn-start')) { e.stopPropagation(); e.preventDefault(); } }, true);
    const st = document.createElement('style'); st.textContent = '*{transition:none!important}'; document.head.append(st);
  }
  const mulberry = (seed) => () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const SEL = 'button, a[href], select, input[type=range], input.search, .card, .item, .tcol, svg.fb, .sheet.open';
  function visible(el) {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    if (r.right < 0 || r.bottom < 0 || r.left > innerWidth || r.top > innerHeight) return false;
    if (el.disabled) return false;
    const cx = Math.min(innerWidth - 1, Math.max(0, r.left + r.width / 2)), cy = Math.min(innerHeight - 1, Math.max(0, r.top + r.height / 2));
    const hit = document.elementFromPoint(cx, cy);
    return !!hit && (el === hit || el.contains(hit) || hit.contains(el));
  }
  const desc = (el) => {
    const t = (el.getAttribute('aria-label') || el.title || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 28);
    return `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : ''}[${t}]`;
  };
  const SEARCHES = ['', '42', '#186', '186', '187', '0', 'reading', 'ear', 'hear', 'staff', 'muting', 'samba', 'pick', 'slap', 'zzz', 'b', '♭♭', 'clef'];
  window.__runMonkey = async (seed, steps, { pDouble = 0.05, pEsc = 0.03, pBack = 0.03, pRapid = 0.04, start = null, stay = false } = {}) => {
    const rnd = mulberry(seed);
    const pick = (a) => a[Math.floor(rnd() * a.length)];
    const res = { seed, steps: 0, findings: [], log: [], t0: Date.now(), done: false };
    window.__monkey = res;
    if (start) { location.hash = start; await sleep(500); }
    const note = (kind, msg) => { if (res.findings.length < 200) res.findings.push({ step: res.steps, kind, msg, hash: location.hash }); };
    let errN = window.__errs.length;
    let recN = (window.__rec || []).length;
    let lastCnt = null, lastCntChange = Date.now();
    let pushes = 0;
    const onHash = () => { pushes++; };
    window.addEventListener('hashchange', onHash);
    for (let i = 0; i < steps; i++) {
      res.steps = i + 1;
      if (stay && start && !location.hash.startsWith(start.split('?')[0])) { location.hash = start; await sleep(400); }
      const els = [...document.querySelectorAll(SEL)].filter(visible).filter((el) => !stay || !(el.closest('nav.rail') || /^Back$/.test(el.getAttribute('aria-label') || '')));
      const r = rnd();
      let act;
      try {
        if (r < pEsc) {
          act = 'Escape';
          window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
        } else if (!stay && r < pEsc + pBack && pushes > 2) {
          act = 'history.back';
          pushes -= 2;
          history.back();
        } else if (r < pEsc + pBack + 0.04) {
          const k = pick([['Space', ' '], ['ArrowRight', 'ArrowRight'], ['ArrowLeft', 'ArrowLeft'], ['Equal', '+'], ['Minus', '-']]);
          act = `key ${k[1]}`;
          window.dispatchEvent(new KeyboardEvent('keydown', { code: k[0], key: k[1], bubbles: true }));
        } else if (els.length) {
          const el = pick(els);
          if (el.tagName === 'SELECT') {
            const o = pick([...el.options]);
            el.value = o.value; el.dispatchEvent(new Event('change', { bubbles: true }));
            act = `select ${desc(el)} = ${o.value}`;
          } else if (el.matches('input.search')) {
            el.value = pick(SEARCHES);
            el.dispatchEvent(new Event('input', { bubbles: true }));
            act = `search "${el.value}"`;
          } else if (el.tagName === 'INPUT') {
            const v = Number(el.min) + rnd() * (Number(el.max) - Number(el.min));
            el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
            act = `slider ${desc(el)} = ${el.value}`;
          } else if (el.matches('svg.fb')) {
            const b = el.getBoundingClientRect();
            const x = b.left + rnd() * b.width, y = b.top + rnd() * b.height;
            el.dispatchEvent(new PointerEvent('pointerdown', { clientX: x, clientY: y, bubbles: true }));
            act = `fretboard tap ${Math.round(x - b.left)},${Math.round(y - b.top)}`;
          } else if (el.matches('.sheet.open')) {
            el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            act = 'sheet backdrop click';
          } else {
            const n = rnd() < pRapid ? 4 : rnd() < pDouble ? 2 : 1;
            for (let k = 0; k < n; k++) el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
            act = `${n > 1 ? n + 'x ' : ''}click ${desc(el)}`;
            if (el.tagName === 'A' && el.getAttribute('href')?.startsWith('#')) location.hash = el.getAttribute('href');
          }
        } else act = 'nothing visible';
      } catch (e) { note('harness', `${act}: ${e.message}`); }
      res.log.push(`${i + 1} ${location.hash} :: ${act}`);
      await sleep(120 + rnd() * 120);
      if (window.__errs.length > errN) { for (const e of window.__errs.slice(errN)) note('error', `${e} (after: ${act})`); errN = window.__errs.length; }
      if (window.__rec && window.__rec.length > recN) {
        const burst = window.__rec.slice(recN).filter((x) => x.pad > 0.6);
        if (burst.length) note('pad-burst', `pad peak ${Math.max(...burst.map((x) => x.pad))} (after: ${act})`);
        recN = window.__rec.length;
      }
      if (document.documentElement.scrollWidth > document.documentElement.clientWidth + 1) note('hscroll', `scrollWidth ${document.documentElement.scrollWidth} > ${document.documentElement.clientWidth}`);
      const inEx = document.body.classList.contains('in-ex') && location.hash.startsWith('#/ex/');
      if (document.body.classList.contains('in-ex') && !location.hash.startsWith('#/ex/')) note('state', 'body.in-ex left on a non-exercise screen');
      const bodyTxt = document.body.innerText;
      const badTxt = bodyTxt.match(/[^\n]{0,25}\b(NaN|undefined|Infinity)\b[^\n]{0,25}/);
      if (badTxt) note('text', `"${badTxt[0]}"`);
      const pct = [...document.querySelectorAll('.pct')].map((x) => x.textContent).filter((t) => !/^\d{1,3}%$/.test(t));
      if (pct.length) note('text', `settings readout ${JSON.stringify(pct)}`);
      if (inEx) {
        const bpm = document.querySelector('.bpm')?.textContent || '';
        if (!/^\d+BPM$/.test(bpm)) note('text', `BPM readout "${bpm}"`);
        const now = document.querySelector('.exv-now')?.textContent || '';
        if (/NaN|undefined|null|Infinity/.test(now) || !now) note('text', `now "${now}"`);
        const lb = [...document.querySelectorAll('.exv-ctrl .lbl-btn')].map((b) => b.textContent);
        if (lb.some((t) => !t)) note('text', `empty toggle label ${JSON.stringify(lb)}`);
        const tabTxt = [...document.querySelectorAll('.tlbl, .tchord, .sacc, .s8va')].map((t) => t.textContent).join(' ');
        if (/NaN|undefined|null/.test(tabTxt)) note('text', 'tab/staff label has NaN/undefined');
        if ([...document.querySelectorAll('.exv-tab [cx], .exv-tab [cy], .exv-tab [y]')].some((e) => /NaN/.test(e.getAttribute('cx') + e.getAttribute('cy') + e.getAttribute('y')))) note('text', 'staff/tab coordinate NaN');
        const nums = [...document.querySelectorAll('.tnum')].map((t) => t.textContent).filter((t) => /^-|^\d+$/.test(t) && (Number(t) < 0 || Number(t) > 24));
        if (nums.length) note('fret', `tab strip shows fret ${[...new Set(nums)].join(',')}`);
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
        await sleep(450);
        if (window.__bs > c0 && !/^#\/(explorer|tuner)/.test(location.hash)) note('ghost-audio', `${window.__bs - c0} notes scheduled on ${location.hash || '#/'} with no exercise open`);
        const now = window.__clip ? window.__clip.context.currentTime : 0;
        const padLive = (window.__osc || []).filter((o) => (o.type === 'sawtooth' || o.type === 'triangle') && !o.ended && (o.stop == null || o.stop > now + 1.3));
        if (padLive.length) note('ghost-pad', `${padLive.length} pad oscillators still running on ${location.hash || '#/'}`);
      }
    }
    window.removeEventListener('hashchange', onHash);
    res.done = true;
    res.ms = Date.now() - res.t0;
    try { localStorage.setItem('__qa_log', JSON.stringify({ seed, findings: res.findings, log: res.log.slice(-400) })); } catch { /* full */ }
    return res;
  };
})();
