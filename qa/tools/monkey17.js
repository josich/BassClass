// QA monkey runner v17 (f600870; monkey16 loadable as a classic script, imports by absolute URL; pad check counts the e-piano and organ's sine voices; see checks17.js for loading)
// v16 header: (70c3e4e): a self-contained whole-app monkey (no monkey11 core needed), weighted
// toward this round's changes: the shared picker (drum patterns, progressions: search, chips, stars,
// cards, close by ✕ / outside / Escape / Back), My progression (slots, +, Degree/Chord/Length, Remove,
// Done, ✎ Edit), the Neck's Chord | Scale | Off, harmony modes and keys, drums, the floating Start
// (taps and touch drags), sliders and the hold buttons (mouse and touch pointer events).
// Setup changes mid-run: strings 4/5/6, left-handed, solfège.
// After every step it checks: errors; NaN/undefined/null in visible text; horizontal scroll; at most one
// picker, none off the room, none left when its history entry is gone; no Room playing and no click or
// pad oscillator alive off the room/exercise; the Start button inside the window and right of the rail;
// the stored room record valid (bpm 1-660 integer, myProg 1-16, favs/recents arrays); the room's tempo
// text; chord chips = the progression's chords; listener counts (document keydown capture, window
// popstate / resize / keydown) and live ResizeObservers must not grow; heap / nodes every 50 steps.
// The tuner's microphone: stub navigator.mediaDevices.getUserMedia first (the pane shows a notice).
// A room-focused run: block .rail links and bounce hash changes back to #/practice, and scroll <main>
// (and the picker grid) to random places every 450 ms, or the monkey only sees the room's first screen.
// Usage (qa tab, after one real click on Start): paste, then `await window.__runMonkey17(seed, steps)`
// in chunks: `window.__runMonkey17(seed, 330)` runs in the background; read `window.__m17`.
(() => {
  if (!window.__m17s) {
    window.__m17s = true;
    window.__errs = [];
    addEventListener('error', (e) => window.__errs.push(`${e.message} @ ${(e.error?.stack || '').split('\n')[1]?.trim()}`));
    addEventListener('unhandledrejection', (e) => window.__errs.push('rejection ' + (e.reason?.message || e.reason)));
    const ce = console.error; console.error = (...a) => { window.__errs.push('console.error ' + a.map((x) => x?.message || String(x)).join(' ')); ce(...a); };
    window.confirm = () => Math.random() < 0.5; window.alert = () => {};
    // Back never leaves the app
    window.__leave = [];
    window.__startIdx = navigation.currentEntry.index - (history.state?.depth || 0);
    const ob = history.back.bind(history);
    history.back = () => { if (navigation.currentEntry.index <= window.__startIdx) { window.__leave.push(location.hash); location.hash = '#/'; return; } ob(); };
    // no downloads, no file dialogs, no microphone prompt
    document.addEventListener('click', (e) => { const b = e.target.closest?.('button, input'); if (b && (/backup/i.test(b.textContent || '') || b.type === 'file')) { e.stopImmediatePropagation(); e.preventDefault(); } }, true);
    HTMLAnchorElement.prototype.click = new Proxy(HTMLAnchorElement.prototype.click, { apply(t, self, a) { if (self.download) return undefined; return Reflect.apply(t, self, a); } });
    // rAF as a timer (a background pane throttles it)
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
    // live ResizeObservers
    window.__ro = 0;
    const RO = window.ResizeObserver;
    window.ResizeObserver = class extends RO { constructor(cb) { super(cb); this.__n = 0; } observe(t, o) { if (!this.__n++) window.__ro++; return super.observe(t, o); } disconnect() { if (this.__n) { this.__n = 0; window.__ro--; } return super.disconnect(); } };
    // oscillators: clicks (sine) and pad voices (sawtooth / triangle), with their stop times
    window.__osc = [];
    const oc = AudioContext.prototype.createOscillator;
    AudioContext.prototype.createOscillator = function () { const o = oc.call(this); const rec = { type: null, start: null, stop: null }; window.__osc.push(rec); if (window.__osc.length > 6000) window.__osc.splice(0, 3000); const st = o.start.bind(o), sp = o.stop.bind(o); o.start = (w = 0) => { rec.type = o.type; rec.start = w; return st(w); }; o.stop = (w = 0) => { rec.stop = w; return sp(w); }; return o; };
  }
  const mulberry = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const visible = (el) => { const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2 || r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) return false; const cs = getComputedStyle(el); return cs.visibility !== 'hidden' && cs.display !== 'none' && !el.closest('[hidden]'); };
  const desc = (el) => `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''}"${(el.getAttribute('aria-label') || el.textContent || el.value || '').trim().slice(0, 24)}"`;
  const WORDS = ['brush', '7/8', 'rock', 'jazz', 'zz', 'BLUES', 'bembé', '', 'ii', 'latin 12/8', '  '];
  window.__runMonkey17 = async (seed, steps, { pDouble = 0.07, pEsc = 0.04, pBack = 0.05, pFwd = 0.015, pRapid = 0.04, pTele = 0.08, pSetup = 0.02, pDrag = 0.03, pKey = 0.04 } = {}) => {
    const rnd = mulberry(seed); const pick = (a) => a[Math.floor(rnd() * a.length)];
    const { Room } = await import(location.origin + '/js/practice/engine.js');
    if (!Room.prototype.__m17) { Room.prototype.__m17 = true; window.__rooms = new Set(); const os = Room.prototype.start; Room.prototype.start = function (...a) { window.__rooms.add(this); return os.apply(this, a); }; }
    const { room } = await import(location.origin + '/js/practice/state.js'); const H = await import(location.origin + '/js/practice/harmony.js');
    const S = await import(location.origin + '/js/store.js'); const A = await import(location.origin + '/js/audio.js');
    const allEx = (await import(location.origin + '/js/curriculum/index.js')).EXERCISES.map((e) => e.id);
    const C = await import(location.origin + '/js/course/data.js').catch(() => ({}));
    const lessons = (C.LESSONS || []).map((l) => l.id).filter(Boolean);
    const res = window.__m17 = { seed, steps: 0, log: [], findings: [], mem: [], done: false };
    const note = (kind, msg) => { if (res.findings.length < 250 && !res.findings.some((f) => f.kind === kind && f.msg === msg)) res.findings.push({ step: res.steps, kind, msg, hash: location.hash, last: res.log.slice(-3) }); };
    const lc = (k) => window.__lst.get(k)?.size || 0;
    const LK = ['doc:keydown:true', 'doc:keydown:false', 'win:popstate:false', 'win:resize:false', 'win:keydown:false'];
    let base = null; let errs0 = window.__errs.length; let offSince = null, offHash = null;
    const tele = () => pick(['#/', '#/library', '#/library?v=topics', '#/practice', '#/practice', '#/practice', '#/practice?to=neck', '#/tuner', '#/settings', '#/course', '#/course/placement',
      allEx.length ? `#/ex/${pick(allEx)}` : '#/library', lessons.length ? `#/course/${pick(lessons)}` : '#/course']);
    for (let i = 0; i < steps; i++) {
      res.steps = i + 1;
      const r = rnd(); let act = '';
      try {
        if (r < pTele) { const h = tele(); act = `tele ${h}`; location.hash = h; }
        else if (r < pTele + pBack) { act = 'back'; history.back(); }
        else if (r < pTele + pBack + pFwd) { act = 'forward'; history.forward(); }
        else if (r < pTele + pBack + pFwd + pEsc) { act = 'Escape'; document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })); }
        else if (r < pTele + pBack + pFwd + pEsc + pKey) { const k = pick([' ', 't', '+', '-', 'ArrowUp', 'ArrowDown']); act = `key "${k}"`; (document.activeElement || document.body).dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true })); }
        else if (r < pTele + pBack + pFwd + pEsc + pKey + pSetup) {
          const ch = pick([{ strings: pick([4, 5, 6]) }, { lefty: rnd() < 0.5 }, { notation: pick(['letters', 'solfege']) }]);
          act = `setup ${JSON.stringify(ch)}`; S.saveSettings(ch); const h = location.hash; location.hash = '#/settings'; await sleep(60); location.hash = h;
        }
        else if (r < pTele + pBack + pFwd + pEsc + pKey + pSetup + pDrag && document.querySelector('.room-fab')) {
          const b = document.querySelector('.room-fab'); const bx = b.getBoundingClientRect(); const x0 = bx.x + bx.width / 2, y0 = bx.y + bx.height / 2;
          const x1 = rnd() * innerWidth, y1 = rnd() * innerHeight; const id = 77; const pt = rnd() < 0.5 ? 'touch' : 'mouse';
          act = `drag fab (${pt}) to ${Math.round(x1)},${Math.round(y1)}`;
          b.dispatchEvent(new PointerEvent('pointerdown', { pointerId: id, pointerType: pt, clientX: x0, clientY: y0, bubbles: true }));
          for (let k = 1; k <= 4; k++) b.dispatchEvent(new PointerEvent('pointermove', { pointerId: id, pointerType: pt, clientX: x0 + ((x1 - x0) * k) / 4, clientY: y0 + ((y1 - y0) * k) / 4, bubbles: true }));
          b.dispatchEvent(new PointerEvent('pointerup', { pointerId: id, pointerType: pt, clientX: x1, clientY: y1, bubbles: true }));
          b.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        } else {
          const scope = document.querySelector('.picker-backdrop') || document;
          let els = [...scope.querySelectorAll('button, a[href], input, select, summary, .chord-chip, .fb-host')].filter((el) => !el.disabled && visible(el));
          // weight: room controls x3 on the room
          if (location.hash.startsWith('#/practice') && scope === document) els = els.concat(els.filter((el) => el.closest('.room-block, .room-fab')), els.filter((el) => el.closest('.harmony, .mine-edit, .harm-bar, .drums')));
          if (!els.length) { act = 'no target'; }
          else {
            const el = pick(els); act = desc(el);
            if (el.tagName === 'INPUT' && el.type === 'range') {
              const v = Math.round(Number(el.min || 0) + rnd() * (Number(el.max || 100) - Number(el.min || 0))); act += ` = ${v}`;
              if (rnd() < 0.3) { // a touch that is really a scroll (guardSliders must hold it)
                const t0 = el.value; const tch = (x, y) => new Touch({ identifier: 5, target: el, clientX: x, clientY: y });
                const rr = el.getBoundingClientRect(); const x = rr.x + rr.width / 2, y = rr.y + rr.height / 2;
                el.dispatchEvent(new TouchEvent('touchstart', { touches: [tch(x, y)], bubbles: true, cancelable: true }));
                el.value = v; el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new TouchEvent('touchmove', { touches: [tch(x + 1, y + 40)], bubbles: true, cancelable: true }));
                el.value = v; el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new TouchEvent('touchend', { touches: [], bubbles: true }));
                act += ' (vertical touch)';
                if (el.value !== t0) note('slider', `a vertical touch moved ${desc(el)} ${t0} -> ${el.value}`);
              } else { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }
            } else if (el.tagName === 'SELECT') {
              const o = pick([...el.options]); el.value = o.value; act += ` = ${o.textContent}`; el.dispatchEvent(new Event('change', { bubbles: true }));
            } else if (el.tagName === 'INPUT' && (el.type === 'search' || el.type === 'text')) {
              el.focus(); el.value = pick(WORDS); act += ` type "${el.value}"`; el.dispatchEvent(new Event('input', { bubbles: true }));
            } else if (el.classList.contains('fb-host')) {
              const rr = el.getBoundingClientRect(); const x = rr.x + rnd() * rr.width, y = rr.y + rnd() * rr.height; act += ` at ${Math.round(x - rr.x)},${Math.round(y - rr.y)}`;
              const t = document.elementFromPoint(x, y); t?.dispatchEvent(new PointerEvent('pointerdown', { clientX: x, clientY: y, bubbles: true })); t?.dispatchEvent(new PointerEvent('pointerup', { clientX: x, clientY: y, bubbles: true })); t?.dispatchEvent(new MouseEvent('click', { clientX: x, clientY: y, bubbles: true }));
            } else if (el.matches('.round') && el.closest('.tempo-row') && rnd() < 0.5) {
              // the hold buttons: a touch press held 0-900 ms, sometimes cancelled as a scroll
              const pt = rnd() < 0.6 ? 'touch' : 'mouse'; const hold = Math.round(rnd() * 900); const cancel = pt === 'touch' && rnd() < 0.3;
              act += ` hold ${pt} ${hold}ms${cancel ? ' cancelled' : ''}`;
              el.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 9, pointerType: pt, bubbles: true, cancelable: true })); await sleep(hold);
              el.dispatchEvent(new PointerEvent(cancel ? 'pointercancel' : 'pointerup', { pointerId: 9, pointerType: pt, bubbles: true }));
            } else {
              const n = rnd() < pDouble ? 2 : rnd() < pRapid ? 3 + Math.floor(rnd() * 4) : 1;
              if (n > 1) act += ` x${n}`;
              const rr = el.getBoundingClientRect(); const cx = rr.x + rr.width / 2, cy = rr.y + rr.height / 2;
              for (let k = 0; k < n; k++) { const t = k ? (document.elementFromPoint(cx, cy) || el) : el; (t.closest?.('button, a, summary, input, select, .chord-chip') || t).click?.(); if (n > 1) await sleep(rnd() < 0.5 ? 0 : 30 + rnd() * 80); }
            }
          }
        }
      } catch (e) { note('harness', `${act}: ${e.message}`); }
      res.log.push(`${i + 1} ${act}`); if (res.log.length > 400) res.log.splice(0, 100);
      await sleep(40 + rnd() * 120);
      // ---------------------------------------------------------------- checks
      try {
        const h = location.hash;
        if (window.__errs.length > errs0) { for (const e of window.__errs.slice(errs0)) note('error', e); errs0 = window.__errs.length; }
        const main = document.querySelector('main') || document.body;
        const txt = [...main.querySelectorAll('*')].filter((e) => e.children.length === 0 && visible(e)).map((e) => e.textContent).join(' | ');
        const bad = txt.match(/[^|]{0,30}\b(NaN|undefined|null)\b[^|]{0,30}/);
        if (bad) note('text', bad[0]);
        if (document.documentElement.scrollWidth > innerWidth + 1) note('layout', `page scrolls sideways ${document.documentElement.scrollWidth} > ${innerWidth}`);
        const bds = document.querySelectorAll('.picker-backdrop').length;
        if (bds > 1) note('picker', `${bds} pickers open`);
        if (bds && !h.startsWith('#/practice')) note('picker', 'a picker open off the room');
        if (bds && !history.state?.picker) note('picker', 'a picker open without its history entry (Back would leave the room)');
        const playingRooms = [...(window.__rooms || [])].filter((x) => x.playing || x.starting);
        if (!h.startsWith('#/practice') && playingRooms.length) note('audio', `${playingRooms.length} Room(s) playing off the room`);
        if (playingRooms.length > 1) note('audio', `${playingRooms.length} Rooms playing at once`);
        const now = A.now();
        const offRoomEx = !h.startsWith('#/practice') && !h.startsWith('#/ex/');
        if (offRoomEx) { if (offHash !== h) { offHash = h; offSince = performance.now(); } } else { offSince = null; offHash = null; }
        if (offRoomEx && offSince && performance.now() - offSince > 1500) {
          const live = window.__osc.filter((o) => o.type && o.start != null && (o.stop == null || o.stop > now + 0.2));
          const pads = live.filter((o) => !(o.type === 'sine' && o.stop != null && Math.abs(o.stop - o.start - 0.07) < 1e-6));
          if (pads.length) note('audio', `${pads.length} pad oscillator(s) still sounding on ${h}`);
          if (live.some((o) => o.type === 'sine' && o.start > now)) note('audio', `clicks still scheduled on ${h}`);
        }
        const fab = document.querySelector('.room-fab');
        if (fab) {
          const fr = fab.getBoundingClientRect(); const rail = document.querySelector('.rail')?.getBoundingClientRect();
          if (fr.left < -1 || fr.top < -1 || fr.right > innerWidth + 1 || fr.bottom > innerHeight + 1) note('fab', `Start outside the window ${Math.round(fr.left)},${Math.round(fr.top)} ${Math.round(fr.width)}x${Math.round(fr.height)}`);
          if (rail && rail.width && fr.left < rail.right - 1) note('fab', `Start over the rail (left ${Math.round(fr.left)} < ${Math.round(rail.right)})`);
          const n = document.querySelector('.tempo-num')?.textContent;
          if (!(/^\d+$/.test(n || '') && +n >= 1 && +n <= 660)) note('room', `tempo reads "${n}"`);
          const chips = document.querySelectorAll('.chord-chip').length;
          if (room.harmony === 'chords') { const want = H.progression(room.hProg, room.hKey, room.beats, {}, null, room.myProg, room.myMinor).length; if (chips !== want) note('room', `${chips} chord chips for ${want} chords (${room.hProg})`); }
          else if (chips) note('room', `${chips} chord chips with harmony ${room.harmony}`);
          if (document.querySelectorAll('.chord-chip.on').length > 1) note('room', 'two chord chips lit');
        }
        try {
          const v = JSON.parse(localStorage.getItem('bassclass.practice.v1') || '{}');
          if (v.bpm != null && !(Number.isInteger(v.bpm) && v.bpm >= 1 && v.bpm <= 660)) note('store', `stored bpm ${v.bpm}`);
          if (v.myProg != null && !(Array.isArray(v.myProg) && v.myProg.length >= 1 && v.myProg.length <= 16)) note('store', `stored myProg ${JSON.stringify(v.myProg).slice(0, 60)}`);
          for (const k of ['drumFavs', 'drumRecent', 'progFavs', 'progRecent']) if (v[k] != null && !Array.isArray(v[k])) note('store', `stored ${k} ${v[k]}`);
          if ((v.drumRecent?.length || 0) > 6 || (v.progRecent?.length || 0) > 6) note('store', 'more than 6 recent');
        } catch { note('store', 'practice record does not parse'); }
        const L = LK.map(lc);
        if (h === '#/' && !bds) { if (!base) base = { L, ro: window.__ro }; else { if (L.some((x, j) => x > base.L[j] + 2)) note('leak', `listeners ${LK.map((k, j) => `${k}=${L[j]}`).join(' ')} (base ${base.L.join('/')})`); if (window.__ro > base.ro + 6) note('leak', `${window.__ro} live ResizeObservers on Home (base ${base.ro})`); } }
        if (i % 50 === 0) res.mem.push({ step: i, heap: Math.round((performance.memory?.usedJSHeapSize || 0) / 1e5) / 10, nodes: document.getElementsByTagName('*').length, ro: window.__ro, L: L.join('/'), hl: history.length });
      } catch (e) { note('harness', `check: ${e.message}`); }
    }
    res.done = true;
    return res;
  };
})();
'monkey17 loaded';
