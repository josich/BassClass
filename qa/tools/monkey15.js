// QA monkey runner v15 (77c1e47): monkey11 (paste qa/tools/monkey11.js first) with monkey14's setup
// (a click is a tap, no backup downloads or file dialogs, Room and click-oscillator tracking) and a
// watcher updated for this round:
//  - the Practice room's tempo reads an integer 1-660 (PolyOrbit's range), its stored bpm too;
//  - harmony: chord chips = the progression's length (Chords), none otherwise; at most one lit;
//    the Neck's key picker greyed exactly when it follows; its info line never stale ("Just the notes"
//    must read "Natural notes...", unless it follows a chord);
//  - the floating Start/Stop inside the window;
//  - off #/practice: no Room playing, no click oscillator, no pad oscillator still sounding after 1.3 s
//    (monkey11's ghost-pad check is kept off the room, where the harmony's pad is expected);
//  - monkey14's log, bubble and Home checks.
// Usage: window.__runMonkey15(seed, steps, opts) -> window.__monkey.
window.__setup15 = async () => {
  if (window.__s15) return;
  window.__s15 = true;
  document.addEventListener('click', (e) => { e.target.dispatchEvent?.(new PointerEvent('pointerup', { bubbles: true })); }, true);
  document.addEventListener('click', (e) => {
    const b = e.target.closest?.('button, input');
    if (b && (/backup/i.test(b.textContent || '') || b.type === 'file')) { e.stopPropagation(); e.preventDefault(); }
  }, true);
  HTMLInputElement.prototype.click = new Proxy(HTMLInputElement.prototype.click, { apply(t, self, a) { if (self.type === 'file') return undefined; return Reflect.apply(t, self, a); } });
  const E = await import('/js/practice/engine.js');
  window.__rooms = new Set();
  const os = E.Room.prototype.start;
  E.Room.prototype.start = function (...a) { window.__rooms.add(this); return os.apply(this, a); };
  window.__sine = 0;
  const oc = AudioContext.prototype.createOscillator;
  AudioContext.prototype.createOscillator = function () {
    const o = oc.call(this);
    const st = o.start.bind(o);
    o.start = (w = 0) => { if (o.type === 'sine' && [900, 1175, 1480, 1760].includes(o.frequency.value)) window.__sine++; return st(w); };
    return o;
  };
};
window.__watch15 = () => {
  if (window.__w15) clearInterval(window.__w15);
  window.__w15f = [];
  const seen = new Set();
  const note = (k, m) => { const key = k + m; if (seen.has(key) || window.__w15f.length > 150) return; seen.add(key); window.__w15f.push({ step: window.__monkey?.steps, k, m, hash: location.hash }); };
  let lastHash = location.hash, offSince = 0, sine0 = window.__sine;
  window.__w15 = setInterval(async () => {
    try {
      const h = location.hash;
      const { room } = await import('/js/practice/state.js');
      const H = await import('/js/practice/harmony.js');
      try {
        const v = JSON.parse(localStorage.getItem('bassclass.practice.v1') || '{}');
        if (v.bpm != null && !(Number.isInteger(v.bpm) && v.bpm >= 1 && v.bpm <= 660)) note('practice', `stored bpm ${v.bpm}`);
      } catch { note('practice', 'practice key does not parse'); }
      try {
        const lg = JSON.parse(localStorage.getItem('bassclass.log.v1') || '{}');
        for (const [k, s] of Object.entries(lg)) if (!/^\d{4}-\d\d-\d\d$/.test(k) || !Number.isFinite(s) || s < 0 || s > 86400) note('log', `log entry ${k}: ${s}`);
      } catch { note('log', 'log key does not parse'); }
      if (h.startsWith('#/practice')) {
        const n = document.querySelector('.tempo-num')?.textContent;
        if (n != null && !(/^\d+$/.test(n) && +n >= 1 && +n <= 660)) note('practice', `tempo reads "${n}"`);
        const lights = document.querySelectorAll('.beat-lights i').length;
        if (document.querySelector('.beat-lights') && lights !== room.beats) note('practice', `${lights} beat lights for ${room.beats} beats`);
        for (const r of document.querySelectorAll('.rl-val')) if (/NaN|undefined/.test(r.textContent)) note('practice', `range value "${r.textContent}"`);
        const chips = document.querySelectorAll('.chord-chip');
        if (room.harmony === 'chords') { const p = H.progression(room.hProg, room.hKey, room.beats); if (chips.length !== p.length) note('harmony', `chips ${chips.length} vs progression ${p.length}`); } else if (chips.length) note('harmony', `chips with harmony ${room.harmony}`);
        if (document.querySelectorAll('.chord-chip.on').length > 1) note('harmony', 'two chips lit');
        const following = room.harmony !== 'off' && room.neckFollow;
        const rootSel = document.querySelector('.neck select[aria-label="Key"]');
        if (rootSel && rootSel.disabled !== following) note('neck', `key picker disabled=${rootSel.disabled}, following=${following}`);
        const setSel = document.querySelector('.neck select[aria-label="Scale or chord"]');
        const info = document.querySelector('.neck .muted.small')?.textContent || '';
        if (setSel && setSel.value === 'n:none' && !(following && room.harmony === 'chords') && !info.startsWith('Natural notes')) note('neck-stale', `"Just the notes" shown, info reads "${info.slice(0, 40)}"`);
        const f = document.querySelector('.room-fab');
        if (f) { const b = f.getBoundingClientRect(); if (b.left < 0 || b.top < 0 || b.right > innerWidth || b.bottom > innerHeight) note('fab', `outside the window at ${Math.round(b.left)},${Math.round(b.top)}`); }
        offSince = 0;
      } else {
        if (lastHash.startsWith('#/practice') || !offSince) { offSince = performance.now(); sine0 = window.__sine; }
        if (performance.now() - offSince > 500) {
          for (const r of window.__rooms) if (r.playing || r.starting) note('ghost-room', `a Room is still ${r.playing ? 'playing' : 'starting'} on ${h}`);
          if (!h.startsWith('#/ex/') && window.__sine > sine0) { note('ghost-click', `${window.__sine - sine0} clicks started on ${h} after leaving the room`); sine0 = window.__sine; }
        }
      }
      lastHash = h;
      if (h === '#/' || h === '') {
        const days = document.querySelectorAll('.practice-card .pc-day').length;
        if (document.querySelector('.practice-card') && (days < 14 || days > 90)) note('home', `${days} day bars`);
        const ring = document.querySelector('.pc-ring')?.innerText || '';
        if (/NaN|undefined|Infinity/.test(ring)) note('home', `ring "${ring}"`);
      }
      const pops = document.querySelectorAll('.info-pop');
      if (pops.length > 1) note('bubble', `${pops.length} bubbles open`);
      if (pops.length && !document.querySelector('[aria-expanded="true"]')) note('bubble', 'a bubble is open but no anchor is expanded');
    } catch (e) { note('watch', e.message); }
  }, 150);
};
window.__runMonkey15 = async (seed, steps, opts = {}) => {
  await window.__setup15();
  const extra = ['#/practice', '#/practice', '#/practice', '#/practice?to=neck', '#/explorer', '#/path', '#/library?v=topics', '#/library?v=levels', '#/settings', '#/', '#/library', '#/tuner'];
  window.__watch15();
  const res = await window.__runMonkey11(seed, steps, { extra, ...opts });
  clearInterval(window.__w15);
  // drums and the pad belong to the room: monkey11's ghost checks only count off it
  res.findings = res.findings.filter((f) => !(/ghost-(audio|pad)/.test(f.kind) && /#\/practice/.test(f.msg)) && !(f.kind === 'info' && /button left the page/.test(f.msg)));
  for (const f of window.__w15f) res.findings.push({ step: f.step, kind: `w15-${f.k}`, msg: f.m, hash: f.hash });
  return res;
};
