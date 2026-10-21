// QA (bdc08e7): helpers for the Home redesign round. Paste into a qa tab (top-level await).
//  window.__fastSrc()   : replaces setTimeout/setInterval/rAF with a MessageChannel timer wheel, so a
//                         hidden Browser pane (timers clamped to ~600 ms) runs the app and the harness
//                         at foreground speed. Store '(' + fn + ')()' in localStorage to re-eval in new tabs.
//  window.__ifr(sessionJson, courseJson, hash) : loads the app in a hidden same-origin iframe after
//                         writing bassclass.session.v1 (and optionally the course store); returns its
//                         errors, whether .main has children, and its text (corrupt-storage cases).
//  window.__sess()      : renders Home's session for 15/30/45/60 min into a detached <main> and lists
//                         the rows (✓ = shown as played) and the level chips.
//  window.__infoTest2(cap) : opens and closes up to `cap` ⓘ bubbles on the current screen and measures
//                         each bubble against the window (out, covering its button, clipped) and
//                         whether a click on it navigated.
//  window.__homeFuzz(seed, n) : seeded Home/session fuzzer (lengths, More warm-up, double ✓ Practised,
//                         session rows with play/Next/Back, ⓘ, My level with random stage answers,
//                         map + course reset, Forward); notes errors, >12 history, two bubbles, empty
//                         session, My level vs session level. Results in window.__hf.
window.__fastSrc = function () {
  if (window.__fast) return; window.__fast = true;
  const timers = new Map(); let id = 1e6; let running = false;
  const ch = new MessageChannel();
  const pump = () => {
    const now = performance.now();
    for (const [k, t] of [...timers]) {
      if (!timers.has(k) || t.due > now) continue;
      if (t.every != null) t.due = now + t.every; else timers.delete(k);
      try { t.fn(...t.args); } catch (e) { queueMicrotask(() => { throw e; }); }
    }
    if (timers.size) ch.port2.postMessage(0); else running = false;
  };
  ch.port1.onmessage = pump;
  const kick = () => { if (!running) { running = true; ch.port2.postMessage(0); } };
  window.setTimeout = (fn, ms = 0, ...args) => { if (typeof fn !== 'function') fn = new Function(fn); const k = ++id; timers.set(k, { fn, args, due: performance.now() + Math.max(0, Number(ms) || 0) }); kick(); return k; };
  window.clearTimeout = (k) => { timers.delete(k); };
  window.setInterval = (fn, ms = 0, ...args) => { const k = ++id; const e = Math.max(1, Number(ms) || 0); timers.set(k, { fn, args, due: performance.now() + e, every: e }); kick(); return k; };
  window.clearInterval = (k) => { timers.delete(k); };
  window.requestAnimationFrame = (cb) => window.setTimeout(() => cb(performance.now()), 16);
  window.cancelAnimationFrame = (k) => window.clearTimeout(k);
};

window.__ifr = async (sessionVal, courseVal, hash = '#/', wait = 9000) => {
  if (sessionVal === undefined) localStorage.removeItem('bassclass.session.v1'); else if (sessionVal !== null) localStorage.setItem('bassclass.session.v1', sessionVal);
  if (courseVal !== undefined) localStorage.setItem('bassclass.course.v1', courseVal);
  const f = document.createElement('iframe'); f.style.cssText = 'position:fixed;left:0;top:0;width:844px;height:390px;opacity:0.01;pointer-events:none;z-index:-1';
  const errs = [];
  f.src = '/?ifr=' + Math.random() + hash;
  document.body.append(f);
  const t0 = Date.now(); let hooked = null, t = null;
  while (Date.now() - t0 < wait) {
    const w = f.contentWindow;
    if (w && w !== hooked && w.location.href !== 'about:blank') { hooked = w; w.addEventListener('error', (e) => errs.push(e.message)); w.addEventListener('unhandledrejection', (e) => errs.push('rej ' + (e.reason?.message || e.reason))); w.console.error = (...a) => { errs.push('ce ' + a.map((x) => x?.message || String(x)).join(' ')); }; }
    if (f.contentDocument?.querySelector('.main') && t == null) t = Date.now() - t0;
    if (t != null && Date.now() - t0 > t + 600) break;
    await new Promise((r) => setTimeout(r, 30));
  }
  const main = f.contentDocument.querySelector('.main');
  const out = { t, errs, mainKids: main ? main.children.length : -1, text: (main?.innerText || '').replace(/\n/g, ' / ').slice(0, 500) };
  f.remove();
  return out;
};

window.__sess = async () => {
  const P = await import('/js/course/progress.js'); const S = await import('/js/ui/screens.js');
  const out = {};
  for (const m of P.SESSION_LENGTHS) {
    P.setSessionMinutes(m);
    const main = document.createElement('main'); S.homeScreen(main);
    const rows = [...main.querySelectorAll('.session-list .item')].map((r) => `${r.classList.contains('played') ? '✓' : '·'} ${r.querySelector('.t b').textContent}${r.querySelector('.tag') ? ' [' + r.querySelector('.tag').textContent + ']' : ''}`);
    out[m] = { lv: main.querySelector('.session-path')?.innerText.replace(/\n/g, ' '), my: main.querySelector('.level-btn')?.innerText.replace(/\n/g, ' '), rows, btn: main.querySelector('.session-foot .btn')?.textContent };
  }
  return out;
};

window.__infoTest2 = async (cap = 25) => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const visible = (el) => { const r = el.getBoundingClientRect(); if (r.width < 2 || r.bottom < 0 || r.top > innerHeight) return false; const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!hit && (el === hit || el.contains(hit) || hit.contains(el)); };
  const all = [...document.querySelectorAll('.info-btn')];
  const step = Math.max(1, Math.floor(all.length / cap));
  const out = [];
  for (const b of all.filter((_, i) => i % step === 0 || i === all.length - 1)) {
    b.scrollIntoView({ block: 'center' }); await sleep(80);
    if (!visible(b)) { out.push({ label: b.title, hidden: true }); continue; }
    const h0 = location.hash; let p = null;
    for (let t = 0; t < 2 && !p; t++) { b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); b.click(); await sleep(30); p = document.querySelector('.info-pop'); }
    const br = b.getBoundingClientRect(), r = p?.getBoundingClientRect();
    const rec = { label: b.title, open: !!p, nav: location.hash !== h0 };
    if (r) { rec.pop = `${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)}`; rec.out = r.top < 0 || r.left < 0 || r.bottom > innerHeight + 0.5 || r.right > innerWidth + 0.5; rec.cover = !(r.bottom <= br.top || r.top >= br.bottom || r.right <= br.left || r.left >= br.right); rec.clip = p.scrollHeight > p.clientHeight + 1; }
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await sleep(20);
    rec.closed = !document.querySelector('.info-pop');
    out.push(rec);
  }
  return out;
};

window.__homeFuzz = async (seed, n) => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  let s = seed; const rnd = () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const res = { log: [], notes: [], done: false }; window.__hf = res;
  const errN0 = (window.__errs || []).length;
  const home = async () => { if (location.hash !== '#/') { location.hash = '#/'; await sleep(250); } };
  for (let i = 0; i < n; i++) {
    const r = rnd(); let act = '';
    try {
      await home();
      const blk = document.querySelector('.session-block');
      if (!blk) res.notes.push(`${i} no session block`);
      if (r < 0.15) { const b = pick([...blk.querySelectorAll('.seg button')]); b.click(); act = 'length ' + b.textContent; }
      else if (r < 0.25) { blk.querySelector('.more-warm').click(); act = 'more warm-up'; }
      else if (r < 0.33) { const k = rnd() < 0.3 ? 2 : 1; for (let j = 0; j < k; j++) [...document.querySelectorAll('.session-foot .btn')].find((x) => x.textContent.includes('Practised')).click(); act = `practised x${k}`; }
      else if (r < 0.60) {
        const rows = [...blk.querySelectorAll('.session-list .item')]; const idx = Math.floor(rnd() * rows.length);
        if (!rows.length) act = 'no rows';
        else {
          rows[idx].click(); await sleep(400); act = `row ${idx} -> ${location.hash.slice(0, 60)}`;
          if (location.hash.startsWith('#/ex/')) {
            if (rnd() < 0.6) { document.querySelector('.exv-ctrl .big').click(); await sleep(300 + rnd() * 1500); act += ' play'; }
            const nx = document.querySelector('.routine-next'); if (nx && rnd() < 0.4) { nx.click(); await sleep(400); act += ` next -> ${location.hash.slice(0, 50)}`; }
            if (rnd() < 0.5) { history.back(); await sleep(400); act += ' back'; } else { document.querySelector('.exv-top .icon-btn')?.click(); await sleep(400); act += ' in-app back'; }
          }
        }
      } else if (r < 0.70) { const b = pick([...document.querySelectorAll('.main .info-btn')]); b.click(); await sleep(50); act = 'info ' + b.title + (document.querySelector('.info-pop') ? ' open' : ' closed'); if (rnd() < 0.5) b.click(); }
      else if (r < 0.80) {
        document.querySelector('.level-btn').click(); await sleep(300);
        for (const sg of document.querySelectorAll('.place-stage')) { const bs = sg.querySelectorAll('.btn'); (rnd() < 0.5 ? bs[0] : bs[1]).click(); await sleep(10); }
        const done = [...document.querySelectorAll('.main .btn.primary')].find((b) => b.textContent.includes('starting point'));
        if (done && !done.disabled && rnd() < 0.8) { done.click(); await sleep(400); act = `placement -> ${location.hash}`; } else { history.back(); await sleep(300); act = 'placement abandoned'; }
      } else if (r < 0.84) { document.querySelector('.map-btn').click(); await sleep(400); if (rnd() < 0.3) { window.confirm = () => true; [...document.querySelectorAll('.main .btn')].find((b) => b.textContent.includes('Reset course'))?.click(); await sleep(100); act = 'map + reset course'; } else act = 'map'; history.back(); await sleep(300); }
      else if (r < 0.92) { const cg = document.querySelector('.course-go'); if (cg) { cg.click(); await sleep(300); const sr = [...document.querySelectorAll('.step-row')]; if (sr.length && rnd() < 0.5) { pick(sr).click(); await sleep(400); } act = 'course go ' + location.hash.slice(0, 40); history.back(); await sleep(300); history.back(); await sleep(300); } else act = 'no course-go'; }
      else { history.forward(); await sleep(400); act = 'forward -> ' + location.hash.slice(0, 50); }
    } catch (e) { res.notes.push(`${i} harness ${act}: ${e.message}`); }
    res.log.push(`${i} ${act}`);
    if ((window.__errs || []).length > errN0) { res.notes.push(`${i} errors: ${window.__errs.slice(errN0).join(' | ')}`); break; }
    const ss = JSON.parse(localStorage.getItem('bassclass.session.v1') || 'null');
    if (ss && ss.history.length > 12) res.notes.push(`${i} history ${ss.history.length}`);
    if (document.body.innerText.match(/\b(NaN|undefined)\b/)) res.notes.push(`${i} bad text`);
    if (document.querySelectorAll('.info-pop').length > 1) res.notes.push(`${i} two pops`);
    if (location.hash === '#/') {
      if (!document.querySelectorAll('.session-list .item').length) res.notes.push(`${i} empty session`);
      const lv = document.querySelector('.level-btn .chip')?.textContent, sl = document.querySelector('.session-path .chip')?.textContent;
      if (lv && sl && lv.replace('L', '') !== sl.replace('Level ', '') && res.notes.filter((x) => x.includes('level mismatch')).length < 3) res.notes.push(`${i} level mismatch: My level ${lv} vs session ${sl} (after ${act})`);
    }
  }
  res.done = true;
  return res;
};
