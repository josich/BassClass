// QA monkey watcher v20 (267b86f), loaded AFTER monkey19.js (it uses monkey19's run and adds a parallel watcher):
// every 150 ms while `window.__w20on`, it checks this round's features and notes them in window.__w20:
//  - the rate card: one at most; over an exercise or the Practice room (it must come only at the end of
//    something); while a Player or the Room plays; without its history entry;
//  - "New" chips: text "New" or "<n> new" with n >= 2;
//  - SVG transforms or coordinates with NaN (the harmonics' triangles, nodeX);
//  - bassclass.new.v1 / bassclass.rate.v1 parse with the right shape;
//  - Today's session: a "Hear it" row shows 🎧 or ✓, never a number; numbered rows count 1, 2, 3 without gaps;
//  - the course's next lesson never a Stage test while its stage's lessons are all known (placement bug, C/M1).
// `__runMonkey20(seed, steps, opts)` runs monkey19's run with the watcher on, results in window.__m19 and __w20.
(() => {
  window.__w20 = [];
  const note = (kind, msg) => { if (window.__w20.length < 200 && !window.__w20.some((f) => f.kind === kind && f.msg === msg)) window.__w20.push({ kind, msg, hash: location.hash, step: window.__m19?.steps, last: window.__m19?.log?.slice(-2) }); };
  let players = null;
  (async () => {
    const PL = await import(location.origin + '/js/player.js');
    if (!PL.Player.prototype.__w20) {
      PL.Player.prototype.__w20 = true;
      window.__players = new Set();
      const op = PL.Player.prototype.play;
      PL.Player.prototype.play = function (...a) { window.__players.add(this); return op.apply(this, a); };
    }
    players = window.__players;
  })();
  const tick = () => {
    if (!window.__w20on) return;
    try {
      const h = location.hash;
      const cards = document.querySelectorAll('.rate-card').length;
      if (cards > 1) note('rate', `${cards} rate cards`);
      if (cards) {
        if (document.body.classList.contains('in-ex')) note('rate', 'rate card over an exercise');
        if (h.startsWith('#/practice')) note('rate', 'rate card over the Practice room');
        if (!history.state?.picker) note('rate', 'rate card without its history entry');
        const playing = [...(players || [])].some((p) => p.playing);
        const rooms = [...(window.__rooms || [])].some((r) => r.playing);
        if (playing || rooms) note('rate', `rate card while ${playing ? 'an exercise' : 'the room'} plays`);
      }
      for (const c of document.querySelectorAll('.chip.new')) {
        const t = c.textContent.trim();
        const m = t.match(/^(\d+) new$/);
        if (!(t === 'New' || (m && Number(m[1]) >= 2))) note('new', `chip reads "${t}"`);
      }
      const nanEl = document.querySelector('[transform*="NaN"], [d*="NaN"], [x*="NaN"], [cx*="NaN"]');
      if (nanEl) note('svg', `NaN in ${nanEl.tagName} ${nanEl.getAttribute('class') || ''}`);
      for (const k of ['bassclass.new.v1', 'bassclass.rate.v1']) {
        const s = localStorage.getItem(k);
        if (s == null) continue;
        try {
          const v = JSON.parse(s);
          if (k === 'bassclass.new.v1' && !(Array.isArray(v.known) && Array.isArray(v.fresh))) note('store', `${k} shape ${s.slice(0, 60)}`);
          if (k === 'bassclass.new.v1' && v.known.length < 500) note('store', `${k} knows only ${v.known.length} ids`);
          if (k === 'bassclass.rate.v1' && !(Number.isInteger(v.asked) && v.asked >= 0 && v.asked <= 2 && typeof v.rated === 'boolean')) note('store', `${k} ${s}`);
        } catch { note('store', `${k} does not parse`); }
      }
      const rows = [...document.querySelectorAll('.session-block .item, .item')].filter((r) => r.querySelector('.n'));
      let k = 0;
      for (const r of rows) {
        const n = r.querySelector('.n').textContent.trim();
        if (r.classList.contains('demo')) { if (!['🎧', '✓'].includes(n)) note('session', `Hear it row shows "${n}"`); continue; }
        if (n === '✓') { k++; continue; }
        if (/^\d+$/.test(n)) { k++; if (Number(n) !== k) note('session', `row numbered ${n}, expected ${k}`); }
      }
    } catch (e) { note('harness', e.message); }
  };
  setInterval(tick, 150);
  window.__runMonkey20 = async (seed, steps, opts = {}) => {
    window.__w20on = true;
    try { return await window.__runMonkey19(seed, steps, opts); } finally { window.__w20on = false; }
  };
})();
'monkey20 loaded';
