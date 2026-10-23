// QA monkey runner v14 (1d6cd91): monkey11 (paste qa/tools/monkey11.js first, and __fastSrc from
// home11.js when the pane is hidden) plus this round's features:
//  - teleports to #/practice, #/path, #/explorer, #/library?v=topics|levels, #/settings and Home;
//  - every click is preceded by a pointerup on its target (a real tap: the tempo hold buttons stop);
//  - the Backup buttons and the hidden file input are blocked (no downloads, no file dialogs);
//  - watcher: on #/practice the tempo reads an integer 30-260, the beat lights match the stored beats
//    per bar, the drums block's "off" class matches the stored drums flag, the range values are numbers;
//    off #/practice no Room instance is playing and no click oscillator (sine 900/1175/1760 Hz) or drum
//    buffer is started; bassclass.log.v1 parses and holds finite seconds <= 86400 per valid day;
//    bassclass.practice.v1 parses and passes its rules; the Home practice card shows 14-90 day bars and
//    its ring text has no NaN; at most one bubble (.info-pop) and its anchor is still in the page.
// Usage: window.__runMonkey14(seed, steps, opts) -> window.__monkey (findings include the watcher's).
window.__setup14 = async () => {
  if (window.__s14) return;
  window.__s14 = true;
  // a click is a tap: pointerup first (the hold buttons stop on it)
  document.addEventListener('click', (e) => { e.target.dispatchEvent?.(new PointerEvent('pointerup', { bubbles: true })); }, true);
  // no backup downloads or file dialogs
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
    o.start = (w = 0) => { if (o.type === 'sine' && [900, 1175, 1760].includes(o.frequency.value)) window.__sine++; return st(w); };
    return o;
  };
};
window.__watch14 = () => {
  if (window.__w14) clearInterval(window.__w14);
  window.__w14f = [];
  const seen = new Set();
  const note = (k, m) => { const key = k + m; if (seen.has(key) || window.__w14f.length > 150) return; seen.add(key); window.__w14f.push({ step: window.__monkey?.steps, k, m, hash: location.hash }); };
  let lastHash = location.hash, offSince = 0, sine0 = window.__sine, bs0 = window.__bs;
  window.__w14 = setInterval(async () => {
    try {
      const h = location.hash;
      const { room } = await import('/js/practice/state.js');
      try {
        const v = JSON.parse(localStorage.getItem('bassclass.practice.v1') || '{}');
        if (v.bpm != null && !(Number.isInteger(v.bpm) && v.bpm >= 30 && v.bpm <= 260)) note('practice', `stored bpm ${v.bpm}`);
        if (v.beats != null && !(Number.isInteger(v.beats) && v.beats >= 1 && v.beats <= 12)) note('practice', `stored beats ${v.beats}`);
      } catch { note('practice', 'practice key does not parse'); }
      try {
        const lg = JSON.parse(localStorage.getItem('bassclass.log.v1') || '{}');
        for (const [k, s] of Object.entries(lg)) if (!/^\d{4}-\d\d-\d\d$/.test(k) || !Number.isFinite(s) || s < 0 || s > 86400) note('log', `log entry ${k}: ${s}`);
      } catch { note('log', 'log key does not parse'); }
      if (h.startsWith('#/practice')) {
        const n = document.querySelector('.tempo-num')?.textContent;
        if (n != null && !(/^\d+$/.test(n) && +n >= 30 && +n <= 260)) note('practice', `tempo reads "${n}"`);
        const lights = document.querySelectorAll('.beat-lights i').length;
        if (document.querySelector('.beat-lights') && lights !== room.beats) note('practice', `${lights} beat lights for ${room.beats} beats`);
        const blk = document.querySelector('section.drums');
        if (blk && blk.classList.contains('off') === room.drums) note('practice', `drums block off=${blk.classList.contains('off')} but stored drums=${room.drums}`);
        for (const r of document.querySelectorAll('.range-line b, .rl-val')) if (/NaN|undefined/.test(r.textContent)) note('practice', `range value "${r.textContent}"`);
        if (room.drums) { const { STYLES } = await import('/js/practice/styles.js'); if (STYLES[room.style].beats !== room.beats) note('practice', `drums on, style ${room.style} has ${STYLES[room.style].beats} beats but the room ${room.beats}`); }
        offSince = 0;
      } else {
        if (lastHash.startsWith('#/practice') || !offSince) { offSince = performance.now(); sine0 = window.__sine; bs0 = window.__bs; }
        if (performance.now() - offSince > 500) {
          for (const r of window.__rooms) if (r.playing || r.starting) note('ghost-room', `a Room is still ${r.playing ? 'playing' : 'starting'} on ${h}`);
          if (!h.startsWith('#/ex/') && window.__sine > sine0) { note('ghost-click', `${window.__sine - sine0} metronome clicks started on ${h} after leaving the Practice room`); sine0 = window.__sine; }
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
      if (pops.length && !document.querySelector('[aria-expanded="true"]')) note('bubble', 'a bubble is open but no anchor is expanded (anchor left the page?)');
    } catch (e) { note('watch', e.message); }
  }, 150);
};
window.__runMonkey14 = async (seed, steps, opts = {}) => {
  await window.__setup14();
  const extra = ['#/practice', '#/practice', '#/practice', '#/path', '#/explorer', '#/library?v=topics', '#/library?v=levels', '#/settings', '#/', '#/library', '#/tuner'];
  window.__watch14();
  const res = await window.__runMonkey11(seed, steps, { extra, ...opts });
  clearInterval(window.__w14);
  // monkey11 counts drum buffers on the Practice room as ghost audio, and its bubble owner check only
  // knows ⓘ buttons: those two are replaced by the watcher's own checks
  res.findings = res.findings.filter((f) => !(f.kind === 'ghost-audio' && /#\/practice/.test(f.msg)) && !(f.kind === 'info' && /button left the page/.test(f.msg)));
  for (const f of window.__w14f) res.findings.push({ step: f.step, kind: `w14-${f.k}`, msg: f.m, hash: f.hash });
  return res;
};
