// QA round 24 (7c4c571): a self-contained monkey, pasted into the qa tab (no second server).
// Store it once:  localStorage['__qa_m24'] = <this file's text>;  then  await eval(localStorage['__qa_m24'])
// and run      await __m24.run(seed, steps, { tele: 0.15 })   (async; results in window.__m24.res and
// localStorage['__qa_log'], one line per step, so a run that outlives a tool call can be read back).
// It stubs confirm / alert / window.open, blocks external, mailto, file and download controls, watches errors,
// NaN / undefined / null text, sideways scroll, ⓘ bubbles, open sheets, and Players playing off an exercise.
(async () => {
  const P = await import('/js/player.js');
  const St = await import('/js/store.js');
  const C = await import('/js/curriculum/index.js');
  const D = await import('/js/course/data.js');
  if (!window.__m24hooks) {
    window.__m24hooks = 1;
    window.__errs ||= [];
    window.addEventListener('error', (e) => __errs.push(String(e.message)));
    window.addEventListener('unhandledrejection', (e) => __errs.push('rej ' + String(e.reason && e.reason.stack || e.reason)));
    window.__players = new Set();
    const play = P.Player.prototype.play;
    P.Player.prototype.play = function (...a) { __players.add(this); return play.apply(this, a); };
    window.confirm = () => Math.random() < 0.5;
    window.alert = () => {};
    window.open = () => null;
    // external links, mailto and downloads never leave the tab
    document.addEventListener('click', (e) => {
      const a = e.target.closest && e.target.closest('a[href]');
      if (a && !a.getAttribute('href').startsWith('#')) { e.preventDefault(); e.stopPropagation(); }
    }, true);
  }
  const mulberry = (a) => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const BAN = /backup|save to|load a|reset|feedback|send|rate |google play|buy|restore|forget|✕ forget|download|open-source|licen/i;
  const visible = (el) => { const r = el.getBoundingClientRect(); return r.width > 2 && r.height > 2 && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth && getComputedStyle(el).visibility !== 'hidden'; };
  const controls = () => [...document.querySelectorAll('button, a[href^="#"], select, input[type=range], input[type=checkbox], summary, .card, .chip-btn, [role=button]')]
    .filter((el) => !el.disabled && visible(el) && !BAN.test((el.textContent || '') + ' ' + (el.getAttribute('aria-label') || '') + ' ' + (el.title || '')) && !el.closest('[data-qa-skip]'));
  const lessons = D.LESSONS;
  const tunes = C.EXERCISES.filter((t) => t.module === 'tunes');
  const TELE = () => {
    const r = Math.random();
    const L = lessons[Math.floor(Math.random() * lessons.length)];
    const t = tunes[Math.floor(Math.random() * tunes.length)];
    const parts = t.params?.part?.options?.map((o) => o[0]) || [];
    const picks = [
      `#/ex/${t.id}${parts.length ? `?part=${parts[Math.floor(Math.random() * parts.length)]}` : ''}`,
      '#/ex/game-theory', '#/ex/game-harmony', '#/ex/ear-triads', '#/ex/ear-sevenths?set=all', '#/ex/ear-progressions', '#/ex/iv-ear-quiz',
      '#/ex/rd-naturals', '#/ex/rd-melodies', '#/ex/sc-minor-family', '#/settings', '#/library', '#/course', '#/', '#/practice', '#/tuner',
      `#/course/${L.id}`, `#/ex/${L.steps[0].ex}?ls=${L.id}.0`, '#/ex/sc-one-octave?type=ionian&root=E&oct=1&key=7&ls=s1-test.7',
      '#/ex/game-ear-intervals?set=triad&dir=up&ls=interval-ear.0', '#/ex/ear-sevenths?set=all&ls=s5-test.13', '#/ex/tn-air?part=all', '#/ex/tn-invention?part=all',
      '#/ex/nope', '#/ex/tn-bourree?part=99', '#/ex/game-harmony?ask=zzz', '#/course/9.99',
    ];
    return picks[Math.floor(r * picks.length)];
  };
  function check(log) {
    const issues = [];
    if (document.scrollingElement.scrollWidth > innerWidth + 1) issues.push(`sideways scroll ${document.scrollingElement.scrollWidth}`);
    const txt = document.body.innerText;
    const m = txt.match(/.{0,30}\b(NaN|undefined|null)\b.{0,30}/);
    if (m) issues.push(`text: ${m[0].replace(/\s+/g, ' ')}`);
    const pops = [...document.querySelectorAll('.info-pop')].filter(visible).length;
    if (pops > 1) issues.push(`${pops} info bubbles`);
    if (!/#\/ex\//.test(location.hash)) for (const p of __players) if (p.playing) issues.push('a Player plays off an exercise');
    const svgNaN = [...document.querySelectorAll('svg [x="NaN"], svg [y="NaN"], svg [cx="NaN"], svg [d*="NaN"], svg [transform*="NaN"]')].length;
    if (svgNaN) issues.push(`NaN in SVG ×${svgNaN}`);
    return issues;
  }
  async function step(rnd, i) {
    const r = rnd();
    let act;
    if (r < (window.__m24.opts.tele ?? 0.12)) { const hsh = TELE(); location.hash = hsh; act = `tele ${hsh}`; await sleep(350); return act; }
    if (r < 0.17) { history.back(); act = 'back'; await sleep(350); return act; }
    if (r < 0.21) { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true })); return 'Escape'; }
    if (r < 0.24) { const k = ['Space', 'ArrowRight', 'ArrowLeft'][Math.floor(rnd() * 3)]; (document.activeElement || document.body).dispatchEvent(new KeyboardEvent('keydown', { key: k === 'Space' ? ' ' : k, code: k, bubbles: true })); return `key ${k}`; }
    if (r < 0.34 && window.__fb && document.contains(__fb.svg)) { const s = Math.floor(rnd() * (__fb.strings || 4)); const f = Math.floor(rnd() * 13); try { __fb.onTap?.(s, f); } catch (e) { __errs.push('onTap ' + e.message); } return `neck ${s}:${f}`; }
    if (r < 0.37) { const strings = [4, 5, 6][Math.floor(rnd() * 3)], lefty = rnd() < 0.3, notation = rnd() < 0.3 ? 'solfege' : 'letters'; St.saveSettings({ strings, lefty, notation }); return `settings strings ${strings} lefty ${lefty} ${notation}`; }
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
  window.__m24 = {
    opts: {},
    res: null,
    async run(seed, steps, opts = {}) {
      this.opts = opts;
      const rnd = mulberry(seed);
      const res = { seed, steps: 0, issues: [], errs: [] };
      this.res = res;
      localStorage.__qa_log = '';
      const seen = new Set();
      const e0 = __errs.length;
      for (let i = 0; i < steps; i++) {
        let act;
        try { act = await step(rnd, i); } catch (e) { act = 'harness ' + e.message; }
        await sleep(opts.wait ?? 120);
        const iss = check();
        for (const x of iss) { const key = x.slice(0, 50); if (!seen.has(key)) { seen.add(key); res.issues.push(`#${i} ${location.hash} after ${act}: ${x}`); } }
        if (__errs.length > e0 + res.errs.length) { for (const er of __errs.slice(e0 + res.errs.length)) res.errs.push(`#${i} ${location.hash} after ${act}: ${er}`); }
        res.steps = i + 1;
        try { localStorage.__qa_log += `${i} ${location.hash} ${act}\n`; } catch { /* full */ }
      }
      for (const p of __players) if (p.playing && !/#\/ex\//.test(location.hash)) res.issues.push('end: Player playing off exercise');
      return res;
    },
  };
  return 'm24 ready';
})()
