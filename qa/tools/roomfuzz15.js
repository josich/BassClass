// QA round 15 (77c1e47): Practice-room fuzzer, roomfuzz14 updated for the floating Start/Stop (.room-fab,
// tapped, dragged with synthetic touch pointers, tapped with a small move), the 1-660 tempo slider
// (2000 positions), the Harmony block (Off/Drone/Chords, key, progression, Follow/Off, volume) and the
// Neck following it.
// Setup in the qa tab (once per page load), after one real click on Start:
//   window.__errs (error collector), window.__oscs (pad oscillator tracker: OscillatorNode start/stop
//   patched to record non-sine oscillators), and a Room tracker:
//   const E = await import('/js/practice/engine.js'); window.__rooms2 = [];
//   const os = E.Room.prototype.start;
//   E.Room.prototype.start = function (...a) { if (!this.__id) { this.__id = window.__rooms2.length + 1; window.__rooms2.push(this); } return os.apply(this, a); };
// Then window.__roomFuzz15(seed, steps) -> window.__rf (findings, log, playMs, log credit).
// After each step: never two Rooms playing, none off the room, no pad oscillator still scheduled to sound
// after leaving the room, button text agrees with the engine, the engine's options equal the stored ones,
// tempo in 1-660 and equal to the store when stopped, beat lights = beats, drums on => the style's beats,
// chord chips = the progression's length with at most one lit, the Neck's pickers greyed exactly when it
// follows, its info line not stale ("Just the notes" must show the natural-notes line), the fab inside the
// window, no horizontal scroll, at most one bubble.
window.__roomFuzz15 = async (seed, n, { known = [] } = {}) => {
  const mul = (s) => () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const rnd = mul(seed); const pick = (a) => a[Math.floor(rnd() * a.length)];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const A = await import('/js/audio.js');
  const { room } = await import('/js/practice/state.js');
  const { STYLES } = await import('/js/practice/styles.js');
  const H = await import('/js/practice/harmony.js');
  const L = await import('/js/practiceLog.js');
  const res = { seed, steps: 0, findings: [], log: [], playMs: 0, logBefore: L.lastDays(1)[0].min * 60, knownErr: 0 };
  window.__rf = res;
  const note = (k, m) => { if (res.findings.length < 150) res.findings.push({ step: res.steps, k, m, hash: location.hash }); };
  let errN = window.__errs.length;
  let playingSince = null;
  const anyPlaying = () => window.__rooms2.some((r) => r.playing);
  const click = (el, k = 1) => { el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerId: 1, pointerType: 'mouse' })); for (let i = 0; i < k; i++) { el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 1, pointerType: 'mouse' })); el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); } };
  const key = (k) => (document.activeElement && document.activeElement !== document.body ? document.activeElement : document.body).dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
  const fabDrag = async (x, y, steps = 8) => {
    const f = document.querySelector('.room-fab'); if (!f) return;
    const r = f.getBoundingClientRect(); const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const pe = (t, px, py) => f.dispatchEvent(new PointerEvent(t, { pointerId: 9, pointerType: 'touch', clientX: px, clientY: py, bubbles: true, cancelable: true, isPrimary: true }));
    pe('pointerdown', cx, cy);
    for (let i = 1; i <= steps; i++) pe('pointermove', cx + ((x - cx) * i) / steps, cy + ((y - cy) * i) / steps);
    pe(rnd() < 0.9 ? 'pointerup' : 'pointercancel', x, y);
    f.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  };
  for (let i = 0; i < n; i++) {
    if (window.__stopMonkey) break;
    res.steps = i + 1;
    let act = '';
    const onP = location.hash.startsWith('#/practice');
    try {
      if (!onP) {
        if (rnd() < 0.75) { location.hash = '#/practice'; act = 'rail Practice'; }
        else { const els = [...document.querySelectorAll('main button, .rail a')].filter((e) => e.getBoundingClientRect().width > 2 && !/backup|Reset/i.test(e.textContent)); const el = pick(els); if (el) { click(el); if (el.tagName === 'A') location.hash = el.getAttribute('href'); act = 'off-screen click ' + (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 20); } }
      } else {
        const r = rnd();
        const q = (s) => [...document.querySelectorAll(s)];
        if (r < 0.12) { const f = document.querySelector('.room-fab'); click(f, rnd() < 0.15 ? 2 : 1); act = 'fab tap ' + f.textContent; }
        else if (r < 0.17) { const x = rnd() * innerWidth * 1.2 - 40, y = rnd() * innerHeight * 1.2 - 40; await fabDrag(x, y, 2 + Math.floor(rnd() * 10)); act = `fab drag to ${Math.round(x)},${Math.round(y)}`; }
        else if (r < 0.19) { const f = document.querySelector('.room-fab'); const b = f.getBoundingClientRect(); const pe = (t, dx) => f.dispatchEvent(new PointerEvent(t, { pointerId: 10, pointerType: 'touch', clientX: b.left + 20 + dx, clientY: b.top + 20, bubbles: true, cancelable: true })); pe('pointerdown', 0); pe('pointermove', 5); pe('pointerup', 5); f.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); act = 'fab tap with a 5 px move'; }
        else if (r < 0.23) { key(' '); act = 'Space'; }
        else if (r < 0.26) { const k = pick(['+', '-', 'ArrowUp', 'ArrowDown', 't', 'T', '=']); key(k); act = 'key ' + k; }
        else if (r < 0.30) { const b = pick(q('button[aria-label="Faster"], button[aria-label="Slower"]')); b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true })); const hold = rnd() * 1200; await sleep(hold); b.dispatchEvent(new PointerEvent(rnd() < 0.8 ? 'pointerup' : 'pointerleave', { bubbles: true })); act = `hold ${b.getAttribute('aria-label')} ${Math.round(hold)} ms`; }
        else if (r < 0.33) { const tb = document.querySelector('.tap-btn'); const k = 1 + Math.floor(rnd() * 6); const gap = 150 + rnd() * 900; for (let j = 0; j < k; j++) { click(tb); await sleep(gap); } act = `tap x${k} every ${Math.round(gap)} ms`; }
        else if (r < 0.44) { const s = pick(q('main input[type=range]')); const v = Math.round(Number(s.min) + rnd() * (Number(s.max) - Number(s.min))); s.value = v; s.dispatchEvent(new Event('input', { bubbles: true })); act = `slider ${s.getAttribute('aria-label')} = ${v}`; }
        else if (r < 0.47) { const s = document.querySelector('.tempo-slider'); s.focus(); const k = pick(['ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End']); s.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true })); act = 'slider key ' + k; }
        else if (r < 0.56) { const b = pick(q('.metro-opts button')); click(b); act = 'opt ' + (b.getAttribute('aria-label') || b.textContent).trim().slice(0, 20); }
        else if (r < 0.64) { const b = pick(q('section.drums button:not(.info-btn)')); click(b, rnd() < 0.1 ? 3 : 1); act = 'drums ' + b.textContent.trim().slice(0, 20); }
        else if (r < 0.72) { const b = pick(q('section.harmony button:not(.info-btn)')); if (b) { click(b); act = 'harmony ' + b.textContent.trim(); } }
        else if (r < 0.77) { const s = pick(q('section.harmony select')); if (s) { const o = pick([...s.options]); s.value = o.value; s.dispatchEvent(new Event('change', { bubbles: true })); act = `harmony ${s.getAttribute('aria-label')} = ${o.value}`; } else act = 'harmony select (none)'; }
        else if (r < 0.82) { const s = pick(q('.neck select:not(:disabled)')); if (s) { const o = pick([...s.options]); s.value = o.value; s.dispatchEvent(new Event('change', { bubbles: true })); act = `neck ${s.getAttribute('aria-label')} = ${o.value}`; } }
        else if (r < 0.85) { const fb = document.querySelector('.neck svg.fb'); const b = fb.getBoundingClientRect(); fb.dispatchEvent(new PointerEvent('pointerdown', { clientX: b.left + rnd() * b.width, clientY: b.top + rnd() * b.height, bubbles: true })); act = 'neck tap'; }
        else if (r < 0.88) { const b = pick(q('main .info-btn')); click(b); act = 'info ' + b.getAttribute('aria-label'); }
        else if (r < 0.94) { const a = pick(q('.rail a')); click(a); location.hash = a.getAttribute('href'); act = 'leave via rail ' + a.getAttribute('href'); }
        else if (r < 0.97) { history.back(); act = 'history.back'; }
        else { key('Escape'); act = 'Escape'; }
      }
    } catch (e) { note('harness', `${act}: ${e.message}`); }
    res.log.push(`${i + 1} ${location.hash} :: ${act}`);
    await sleep(120 + rnd() * 200);
    if (window.__errs.length > errN) {
      for (const e of window.__errs.slice(errN)) { if (known.some((k) => e.includes(k))) res.knownErr++; else note('error', `${e} (after ${act})`); }
      errN = window.__errs.length;
    }
    const playing = anyPlaying();
    if (playing && playingSince == null) playingSince = performance.now();
    if (!playing && playingSince != null) { res.playMs += performance.now() - playingSince; playingSince = null; }
    const live = window.__rooms2.filter((r) => r.playing);
    if (live.length > 1) note('rooms', `${live.length} Rooms playing at once`);
    if (location.hash.startsWith('#/practice')) {
      const f = document.querySelector('.room-fab');
      const btn = f?.textContent;
      const eng = live[0];
      if (eng && btn !== 'Stop') note('ui', `a Room plays but the button reads "${btn}" (after ${act})`);
      if (!eng && btn === 'Stop' && !window.__rooms2.some((r) => r.starting)) note('ui', `nothing plays but the button reads Stop (after ${act})`);
      if (eng) { for (const k of ['beats', 'sub', 'accent', 'click', 'play', 'mute', 'upBy', 'upEvery', 'upTo', 'drums', 'style', 'harmony', 'hKey', 'hProg']) if (eng.o[k] !== room[k]) note('sync', `engine ${k}=${eng.o[k]} but stored ${room[k]} (after ${act})`); }
      const t = document.querySelector('.tempo-num')?.textContent;
      if (!/^\d+$/.test(t || '') || +t < 1 || +t > 660) note('ui', `tempo "${t}"`);
      if (!eng && +t !== room.bpm) note('ui', `stopped, tempo shows ${t} but stored ${room.bpm}`);
      if (document.querySelectorAll('.beat-lights i').length !== room.beats) note('ui', `lights ${document.querySelectorAll('.beat-lights i').length} vs beats ${room.beats}`);
      if (room.drums && STYLES[room.style].beats !== room.beats) note('sync', `drums on: style ${room.style} ${STYLES[room.style].beats} beats, room ${room.beats}`);
      const chips = document.querySelectorAll('.chord-chip');
      if (room.harmony === 'chords') { const p = H.progression(room.hProg, room.hKey, room.beats); if (chips.length !== p.length) note('ui', `chips ${chips.length} vs progression ${p.length}`); } else if (chips.length) note('ui', `chips shown with harmony ${room.harmony}`);
      if (document.querySelectorAll('.chord-chip.on').length > 1) note('ui', 'two chips lit');
      if (!eng && document.querySelectorAll('.chord-chip.on').length) note('ui', 'a chip lit while stopped');
      const following = room.harmony !== 'off' && room.neckFollow;
      const rootSel = document.querySelector('.neck select[aria-label="Key"]');
      if (rootSel && rootSel.disabled !== following) note('ui', `neck key picker disabled=${rootSel.disabled} but following=${following}`);
      const setSel = document.querySelector('.neck select[aria-label="Scale or chord"]');
      const info = document.querySelector('.neck .muted.small')?.textContent || '';
      if (/undefined|NaN|null/.test(info)) note('ui', `neck info "${info}"`);
      if (setSel && setSel.value === 'n:none' && !(following && room.harmony === 'chords') && !info.startsWith('Natural notes')) note('stale', `neck shows all notes but its info reads "${info.slice(0, 40)}" (after ${act})`);
      if (f) { const b = f.getBoundingClientRect(); if (b.left < 0 || b.top < 0 || b.right > innerWidth || b.bottom > innerHeight) note('fab', `fab outside the window ${Math.round(b.left)},${Math.round(b.top)}`); }
    } else {
      if (live.length) note('ghost', `a Room plays on ${location.hash} (after ${act})`);
      if (window.__oscs) { const now = A.now(); const hang = [...window.__oscs.values()].filter((o) => o.stop == null || o.stop > now + 1.3); if (hang.length) note('pad', `${hang.length} pad oscillators still scheduled on ${location.hash} (after ${act})`); }
    }
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

// Harmony-heavy run (seed 1503, 60 steps): starts the room and keeps it playing while it changes the
// harmony mode, key, progression, Follow, drum genre/pattern/on-off, beats per bar, tempo and muted bars;
// after each step (while playing) the pad's notes (engine.hSig) must be the sounding chord's
// (progression(...)[engine.hIdx].midis) or the drone's, the lit chip the engine's chord (or the one
// before, within the lookahead), and the Neck's info line that chord.
window.__harmFuzz = async (seed, n) => {
  const mul = (s) => () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const rnd = mul(seed); const pick = (a) => a[Math.floor(rnd() * a.length)];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const { room } = await import('/js/practice/state.js');
  const H = await import('/js/practice/harmony.js');
  const res = { seed, steps: 0, findings: [], log: [], checks: 0 };
  window.__hf = res;
  const note = (k, m) => { if (res.findings.length < 80) res.findings.push({ step: res.steps, k, m }); };
  const q = (s) => [...document.querySelectorAll(s)];
  location.hash = '#/practice'; await sleep(300);
  let errN = window.__errs.length;
  for (let i = 0; i < n; i++) {
    res.steps = i + 1;
    const live = window.__rooms2.filter((r) => r.playing);
    if (!live.length && rnd() < 0.7) document.querySelector('.room-fab').click();
    const r = rnd(); let act = '';
    try {
      if (r < 0.25) { const b = pick(q('section.harmony .block-head .seg button')); b.click(); act = 'mode ' + b.textContent; }
      else if (r < 0.45) { const s = pick(q('section.harmony select')); if (s) { const o = pick([...s.options]); s.value = o.value; s.dispatchEvent(new Event('change', { bubbles: true })); act = `${s.getAttribute('aria-label')}=${o.value}`; } }
      else if (r < 0.55) { const b = pick(q('section.harmony .room-field .seg button')); if (b) { b.click(); act = 'follow ' + b.textContent; } }
      else if (r < 0.65) { const b = pick(q('.style-chip, .genre-tabs button')); b.click(); act = 'drums ' + b.textContent.slice(0, 15); }
      else if (r < 0.72) { const b = pick(q('section.drums .block-head .seg button')); b.click(); act = 'drums ' + b.textContent; }
      else if (r < 0.8) { const b = pick(q('.stepper button')); b.click(); act = 'beats ' + b.getAttribute('aria-label'); }
      else if (r < 0.88) { const s = document.querySelector('.tempo-slider'); s.value = Math.round(500 + rnd() * 1200); s.dispatchEvent(new Event('input', { bubbles: true })); act = 'tempo ' + room.bpm; }
      else if (r < 0.93) { const s = pick(q('.range-line[data-key="mute"] input, .range-line[data-key="play"] input')); s.value = Math.floor(rnd() * 4); s.dispatchEvent(new Event('input', { bubbles: true })); act = 'muted ' + s.value; }
      else { document.querySelector('.room-fab').click(); act = 'fab'; }
    } catch (e) { note('harness', act + ' ' + e.message); }
    res.log.push(`${i + 1} ${act}`);
    await sleep(250 + rnd() * 1500);
    if (window.__errs.length > errN) { for (const e of window.__errs.slice(errN)) note('error', `${e} (after ${act})`); errN = window.__errs.length; }
    const eng = window.__rooms2.find((x) => x.playing);
    const lit = q('.chord-chip').findIndex((c) => c.classList.contains('on'));
    if (eng) {
      res.checks++;
      if (room.harmony === 'chords' && eng.hIdx != null && eng.hIdx >= 0) {
        const ch = H.progression(room.hProg, room.hKey, room.beats);
        if (eng.hSig !== ch[eng.hIdx].midis.join()) note('pad', `pad ${eng.hSig} but chord ${eng.hIdx} ${ch[eng.hIdx].sym} is ${ch[eng.hIdx].midis.join()}`);
        if (lit >= 0 && lit !== eng.hIdx && lit !== (eng.hIdx - 1 + ch.length) % ch.length) note('chip', `chip ${lit} lit, engine at ${eng.hIdx}`);
        const info = document.querySelector('.neck .muted.small').textContent;
        if (room.neckFollow && lit >= 0 && !info.startsWith('🎹 ' + ch[lit].sym + ':')) note('neck', `neck "${info.slice(0, 30)}" vs lit ${ch[lit].sym}`);
      }
      if (room.harmony === 'drone' && eng.hSig && eng.hSig !== H.droneMidis(room.hKey).join()) note('pad', `drone ${eng.hSig} vs key ${room.hKey}`);
      if (room.harmony === 'off' && eng.hSig) note('pad', `pad ${eng.hSig} with harmony off`);
    }
  }
  for (const r of window.__rooms2) if (r.playing) r.stop();
  res.done = true; return res;
};
