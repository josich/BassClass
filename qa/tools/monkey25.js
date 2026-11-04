// QA round 25 (1d4c6df): monkey24 plus the neck's area. Paste area25.js first (it hooks setOutside / Player.load and
// sets window.__fb). After every step, on an exercise screen, it also checks that no dot the app draws (but a hint's
// black-and-white dot and a wrong tap's red) sits inside the grey (rect.fb-out), that rect.fb-out only appears where
// an area is set, and that the area set matches the line in play mode (every note of __inst inside it).
// Run: await __m25.run(seed, steps, { tele: 0.15 }); results in window.__m25.res, the log in localStorage['__qa_log'].
(async () => {
  const P = await import('/js/player.js');
  const St = await import('/js/store.js');
  const C = await import('/js/curriculum/index.js');
  const D = await import('/js/course/data.js');
  if (!window.__m25hooks) {
    window.__m25hooks = 1;
    window.__errs ||= [];
    window.__players = new Set();
    const play = P.Player.prototype.play;
    P.Player.prototype.play = function (...a) { __players.add(this); return play.apply(this, a); };
    window.confirm = () => Math.random() < 0.5;
    window.alert = () => {};
    window.open = () => null;
    if (navigator.mediaDevices) navigator.mediaDevices.getUserMedia = () => Promise.reject(new Error('qa: no mic'));
    document.addEventListener('click', (e) => {
      const a = e.target.closest && e.target.closest('a[href]');
      if (a && !a.getAttribute('href').startsWith('#')) { e.preventDefault(); e.stopPropagation(); }
    }, true);
  }
  const mulberry = (a) => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const sleep = (ms) => new Promise((r) => (window.__realST || setTimeout)(r, ms));
  const BAN = /backup|save to|load a|reset|feedback|send|rate |google play|buy|restore|forget|✕ forget|download|open-source|licen|measure|again/i;
  const visible = (el) => { const r = el.getBoundingClientRect(); return r.width > 2 && r.height > 2 && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth && getComputedStyle(el).visibility !== 'hidden'; };
  const controls = () => [...document.querySelectorAll('button, a[href^="#"], select, input[type=range], input[type=checkbox], summary, .card, .chip-btn, [role=button]')]
    .filter((el) => !el.disabled && visible(el) && !BAN.test((el.textContent || '') + ' ' + (el.getAttribute('aria-label') || '') + ' ' + (el.title || '')) && !el.closest('[data-qa-skip]'));
  const lessons = D.LESSONS;
  const tapLessons = lessons.filter((l) => l.steps.some((s) => /^game-|^ear-|iv-ear-quiz/.test(s.ex)));
  const AREA = ['fb-naturals', 'fb-chromatic-string', 'fb-unison', 'fb-find-note', 'fb-cycle-zone', 'fb-quiz', 'fb-position-notes', 'fb-key-box', 'tech-1234', 'tech-spider', 'tech-shifting', 'tech-simandl', 'iv-moving', 'sc-one-string', 'sc-keys-one-position', 'sc-3nps', 'sc-positions', 'sc-pent-positions', 'tri-zone-cycle', 'arp-zone-cycle', 'rd-upper'];
  const TELE = () => {
    const L = lessons[Math.floor(Math.random() * lessons.length)];
    const TL = tapLessons[Math.floor(Math.random() * tapLessons.length)];
    const ti = TL.steps.findIndex((s) => /^game-|^ear-|iv-ear-quiz/.test(s.ex));
    const id = AREA[Math.floor(Math.random() * AREA.length)];
    const t = C.EXERCISES.find((x) => x.id === id);
    const opt = Object.entries(t.params || {}).map(([k, v]) => { const o = v.options || []; return `${k}=${encodeURIComponent(o[Math.floor(Math.random() * o.length)]?.[0] ?? '')}`; }).join('&');
    const picks = [
      `#/ex/${id}?${opt}`, `#/ex/${id}`, `#/ex/${id}?${opt}`,
      '#/ex/game-ear-notes?frets=12&string=any', '#/ex/game-ear-notes?frets=5&string=G', '#/ex/fb-quiz?range=17&strings=EA&notes=all', '#/ex/iv-ear-quiz',
      '#/ex/rd-upper?pos=9&key=9', '#/ex/game-read-notes?places=all', '#/ex/game-theory', '#/ex/game-harmony?ask=altered', '#/ex/ear-sevenths?set=all',
      `#/course/${L.id}`, `#/ex/${TL.steps[ti].ex}?ls=${TL.id}.${ti}`, `#/course/${TL.id}`,
      '#/ex/tn-musette?part=all', '#/ex/tn-air?part=all', '#/ex/sc-minor-family?type=melodicClassical', '#/settings', '#/library', '#/', '#/practice', '#/tuner',
      '#/ex/nope', '#/ex/fb-position-notes?zone=99', '#/ex/sc-positions?pos=zz', '#/ex/game-ear-notes?string=C&frets=99', '#/course/9.99',
    ];
    return picks[Math.floor(Math.random() * picks.length)];
  };
  function neckCheck() {
    const out = [];
    const fb = window.__fb;
    if (!fb || !fb.svg.isConnected || !/^#\/ex\//.test(location.hash)) return out;
    const rs = __a25.rects(fb);
    if (rs.length && !fb.outside) out.push('grey drawn with no area');
    for (const g of fb.svg.querySelectorAll('g.dot')) {
      if (g.classList.contains('mono') || g.classList.contains('miss')) continue;
      const m = (g.getAttribute('transform') || '').match(/translate\(([-\d.]+),([-\d.]+)\)/);
      if (!m) continue;
      const x = +m[1], y = +m[2];
      if (__a25.inGrey(rs, x, y - 2) || __a25.inGrey(rs, x, y + 2)) out.push(`dot in the grey at ${x.toFixed(0)},${y.toFixed(0)} (${g.getAttribute('class')}) area ${JSON.stringify(fb.outside)}`);
    }
    if (window.__inst && !window.__inst.tap && fb.outside) {
      const bad = __a25.checkLine(fb, window.__inst).bad;
      if (bad.length) out.push(`line note in the grey ×${bad.length}: ${JSON.stringify(bad[0])}`);
    }
    return out;
  }
  function check() {
    const issues = [];
    if (document.scrollingElement.scrollWidth > innerWidth + 1) issues.push(`sideways scroll ${document.scrollingElement.scrollWidth}`);
    const txt = document.body.innerText;
    const m = txt.match(/.{0,30}\b(NaN|undefined|null)\b.{0,30}/);
    if (m) issues.push(`text: ${m[0].replace(/\s+/g, ' ')}`);
    const pops = [...document.querySelectorAll('.info-pop')].filter(visible).length;
    if (pops > 1) issues.push(`${pops} info bubbles`);
    if (!/#\/ex\//.test(location.hash)) for (const p of __players) if (p.playing) issues.push('a Player plays off an exercise');
    const svgNaN = [...document.querySelectorAll('svg [x="NaN"], svg [y="NaN"], svg [width="NaN"], svg [cx="NaN"], svg [d*="NaN"], svg [transform*="NaN"]')].length;
    if (svgNaN) issues.push(`NaN in SVG ×${svgNaN}`);
    issues.push(...neckCheck());
    return issues;
  }
  async function step(rnd) {
    const r = rnd();
    if (r < (window.__m25.opts.tele ?? 0.12)) { const hsh = TELE(); location.hash = hsh; await sleep(350); return `tele ${hsh}`; }
    if (r < 0.17) { history.back(); await sleep(350); return 'back'; }
    if (r < 0.21) { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true })); return 'Escape'; }
    if (r < 0.24) { const k = ['Space', 'ArrowRight', 'ArrowLeft'][Math.floor(rnd() * 3)]; (document.activeElement || document.body).dispatchEvent(new KeyboardEvent('keydown', { key: k === 'Space' ? ' ' : k, code: k, bubbles: true })); return `key ${k}`; }
    if (r < 0.36 && window.__fb && document.contains(__fb.svg)) { const s = Math.floor(rnd() * (__fb.strings || 4)); const f = Math.floor(rnd() * 14); try { __fb.onTap?.(s, f); } catch (e) { __errs.push('onTap ' + e.message); } return `neck ${s}:${f}`; }
    if (r < 0.39) { const strings = [4, 5, 6][Math.floor(rnd() * 3)], lefty = rnd() < 0.3, notation = rnd() < 0.3 ? 'solfege' : 'letters'; St.saveSettings({ strings, lefty, notation }); return `settings strings ${strings} lefty ${lefty} ${notation}`; }
    const list = controls();
    if (!list.length) return 'no controls';
    const el = list[Math.floor(rnd() * list.length)];
    const name = `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : ''} "${(el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 28)}"`;
    if (el.tagName === 'SELECT') { const o = el.options; el.selectedIndex = Math.floor(rnd() * o.length); el.dispatchEvent(new Event('change', { bubbles: true })); return `select ${name} → ${el.value}`; }
    if (el.type === 'range') { const min = Number(el.min || 0), max = Number(el.max || 100); el.value = String(min + rnd() * (max - min)); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); return `range ${name} → ${el.value}`; }
    const n = rnd() < 0.12 ? 2 : 1;
    for (let k = 0; k < n; k++) {
      const rect = el.getBoundingClientRect();
      const opt = { bubbles: true, clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2, pointerId: 1, isPrimary: true };
      el.dispatchEvent(new PointerEvent('pointerdown', opt));
      el.dispatchEvent(new PointerEvent('pointerup', opt));
      el.click();
    }
    return `click${n > 1 ? '×2' : ''} ${name}`;
  }
  window.__m25 = {
    opts: {}, res: null,
    async run(seed, steps, opts = {}) {
      this.opts = opts;
      const rnd = mulberry(seed);
      const res = { seed, steps: 0, issues: [], errs: [], done: false };
      this.res = res;
      localStorage.__qa_log = '';
      const seen = new Set();
      const e0 = __errs.length;
      for (let i = 0; i < steps; i++) {
        let act;
        try { act = await step(rnd); } catch (e) { act = 'harness ' + e.message; }
        await sleep(opts.wait ?? 120);
        for (const x of check()) { const key = x.slice(0, 40); if (!seen.has(key)) { seen.add(key); res.issues.push(`#${i} ${location.hash} after ${act}: ${x}`); } }
        if (__errs.length > e0 + res.errs.length) for (const er of __errs.slice(e0 + res.errs.length)) res.errs.push(`#${i} ${location.hash} after ${act}: ${er}`);
        res.steps = i + 1;
        try { localStorage.__qa_log += `${i} ${location.hash} ${act}\n`; } catch { /* full */ }
      }
      for (const p of __players) if (p.playing && !/#\/ex\//.test(location.hash)) res.issues.push('end: Player playing off exercise');
      res.done = true;
      return res;
    },
  };
  return 'm25 ready';
})()
