// QA round 14 (1d6cd91): Practice-room fuzzer (seeds 1402 and 1405). Paste monkey11.js first (for
// window.__errs), then install a Room tracker:
//   const E = await import('/js/practice/engine.js'); window.__rooms2 = [];
//   const os = E.Room.prototype.start;
//   E.Room.prototype.start = function (...a) { if (!this.__id) { this.__id = window.__rooms2.length + 1; window.__rooms2.push(this); } return os.apply(this, a); };
// then window.__roomFuzz(seed, steps) -> window.__rf.
// Each step: Start/Stop, Space, + - T keys, a hold on − or + (released or left), tap tempo, a slider, an
// option segment, the drums (on/off, styles), the Neck selects or a tap on it, ⓘ, leaving by the rail or
// Back (75 % of the steps off the room come straight back). After each step: never two Rooms playing,
// none playing off the room, the button agrees with the engine, the engine's options equal the stored
// ones, tempo / slider / beat lights agree with the store, drums on => the style's beats. At the end the
// practice log's credit is compared with the time a Room was playing (playMs vs logAfter - logBefore).
window.__roomFuzz = async (seed, n) => {
  const mul = (s) => () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const rnd = mul(seed); const pick = (a) => a[Math.floor(rnd() * a.length)];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const { room } = await import('/js/practice/state.js');
  const { STYLES } = await import('/js/practice/styles.js');
  const L = await import('/js/practiceLog.js');
  const res = { seed, steps: 0, findings: [], log: [], playMs: 0, logBefore: L.lastDays(1)[0].min * 60 };
  window.__rf = res;
  const note = (k, m) => { if (res.findings.length < 120) res.findings.push({ step: res.steps, k, m, hash: location.hash }); };
  let errN = window.__errs.length;
  let playingSince = null;
  const anyPlaying = () => window.__rooms2.some((r) => r.playing);
  const click = (el, k = 1) => { el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true })); for (let i = 0; i < k; i++) { el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })); el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); } };
  const key = (k) => (document.activeElement && document.activeElement !== document.body ? document.activeElement : document.body).dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
  for (let i = 0; i < n; i++) {
    if (window.__stopMonkey) break;
    res.steps = i + 1;
    let act = '';
    const onP = location.hash.startsWith('#/practice');
    try {
      if (!onP) {
        if (rnd() < 0.75) { const a = document.querySelector('.rail a[href="#/practice"]'); if (a) { click(a); location.hash = '#/practice'; } act = 'rail Practice'; }
        else { const els = [...document.querySelectorAll('main button, .rail a')].filter((e) => e.getBoundingClientRect().width > 2 && !/backup|Reset/i.test(e.textContent)); const el = pick(els); if (el) { click(el); if (el.tagName === 'A') location.hash = el.getAttribute('href'); act = 'off-screen click ' + (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 20); } }
      } else {
        const r = rnd();
        const q = (s) => [...document.querySelectorAll(s)];
        if (r < 0.16) { click(document.querySelector('.room-play'), rnd() < 0.15 ? 2 : 1); act = 'Start/Stop ' + document.querySelector('.room-play').textContent; }
        else if (r < 0.22) { key(' '); act = 'Space'; }
        else if (r < 0.26) { const k = pick(['+', '-', 'ArrowUp', 'ArrowDown', 't', 'T', '=']); key(k); act = 'key ' + k; }
        else if (r < 0.33) { const b = pick(q('button[aria-label="Faster"], button[aria-label="Slower"]')); b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true })); const hold = rnd() * 1200; await sleep(hold); b.dispatchEvent(new PointerEvent(rnd() < 0.8 ? 'pointerup' : 'pointerleave', { bubbles: true })); act = `hold ${b.getAttribute('aria-label')} ${Math.round(hold)} ms`; }
        else if (r < 0.38) { const tb = document.querySelector('.tap-btn'); const k = 1 + Math.floor(rnd() * 6); const gap = 150 + rnd() * 900; for (let j = 0; j < k; j++) { click(tb); await sleep(gap); } act = `tap x${k} every ${Math.round(gap)} ms`; }
        else if (r < 0.52) { const s = pick(q('main input[type=range]')); const v = Math.round(Number(s.min) + rnd() * (Number(s.max) - Number(s.min))); s.value = v; s.dispatchEvent(new Event('input', { bubbles: true })); act = `slider ${s.getAttribute('aria-label')} = ${v}`; }
        else if (r < 0.66) { const b = pick(q('.metro-opts button')); click(b); act = 'opt ' + (b.getAttribute('aria-label') || b.textContent).trim().slice(0, 20); }
        else if (r < 0.78) { const b = pick(q('section.drums button:not(.info-btn)')); click(b, rnd() < 0.1 ? 3 : 1); act = 'drums ' + b.textContent.trim().slice(0, 20); }
        else if (r < 0.83) { const s = pick(q('.neck select')); const o = pick([...s.options]); s.value = o.value; s.dispatchEvent(new Event('change', { bubbles: true })); act = `neck ${s.getAttribute('aria-label')} = ${o.value}`; }
        else if (r < 0.86) { const fb = document.querySelector('.neck svg.fb'); const b = fb.getBoundingClientRect(); fb.dispatchEvent(new PointerEvent('pointerdown', { clientX: b.left + rnd() * b.width, clientY: b.top + rnd() * b.height, bubbles: true })); act = 'neck tap'; }
        else if (r < 0.9) { const b = pick(q('main .info-btn')); click(b); act = 'info ' + b.getAttribute('aria-label'); }
        else if (r < 0.95) { const a = pick(q('.rail a')); click(a); location.hash = a.getAttribute('href'); act = 'leave via rail ' + a.getAttribute('href'); }
        else if (r < 0.97) { history.back(); act = 'history.back'; }
        else { key('Escape'); act = 'Escape'; }
      }
    } catch (e) { note('harness', `${act}: ${e.message}`); }
    res.log.push(`${i + 1} ${location.hash} :: ${act}`);
    await sleep(120 + rnd() * 200);
    if (window.__errs.length > errN) { for (const e of window.__errs.slice(errN)) note('error', `${e} (after ${act})`); errN = window.__errs.length; }
    const playing = anyPlaying();
    if (playing && playingSince == null) playingSince = performance.now();
    if (!playing && playingSince != null) { res.playMs += performance.now() - playingSince; playingSince = null; }
    const live = window.__rooms2.filter((r) => r.playing);
    if (live.length > 1) note('rooms', `${live.length} Rooms playing at once`);
    if (location.hash.startsWith('#/practice')) {
      const btn = document.querySelector('.room-play')?.textContent;
      const eng = live[0];
      if (eng && btn !== 'Stop') note('ui', `a Room plays but the button reads "${btn}" (after ${act})`);
      if (!eng && btn === 'Stop' && !window.__rooms2.some((r) => r.starting)) note('ui', `nothing plays but the button reads Stop (after ${act})`);
      if (eng) { for (const k of ['beats', 'sub', 'accent', 'click', 'play', 'mute', 'upBy', 'upEvery', 'drums', 'style']) if (eng.o[k] !== room[k]) note('sync', `engine ${k}=${eng.o[k]} but stored ${room[k]} (after ${act})`); }
      const t = document.querySelector('.tempo-num')?.textContent;
      if (!/^\d+$/.test(t || '') || +t < 30 || +t > 260) note('ui', `tempo "${t}"`);
      if (!eng && +t !== room.bpm) note('ui', `stopped, tempo shows ${t} but stored ${room.bpm}`);
      if (document.querySelectorAll('.beat-lights i').length !== room.beats) note('ui', `lights ${document.querySelectorAll('.beat-lights i').length} vs beats ${room.beats}`);
      if (room.drums && STYLES[room.style].beats !== room.beats) note('sync', `drums on: style ${room.style} ${STYLES[room.style].beats} beats, room ${room.beats}`);
      const sl = document.querySelector('.tempo-slider'); if (sl && !eng && +sl.value !== room.bpm) note('ui', `slider ${sl.value} vs stored ${room.bpm}`);
    } else if (live.length) note('ghost', `a Room plays on ${location.hash} (after ${act})`);
    if (document.documentElement.scrollWidth > document.documentElement.clientWidth + 1) note('hscroll', `${document.documentElement.scrollWidth}`);
    if (document.querySelectorAll('.info-pop').length > 1) note('bubble', 'two bubbles');
  }
  if (playingSince != null) res.playMs += performance.now() - playingSince;
  for (const r of window.__rooms2) if (r.playing) r.stop();
  await sleep(300);
  res.logAfter = L.lastDays(1)[0].min * 60;
  res.done = true;
  return res;
};
