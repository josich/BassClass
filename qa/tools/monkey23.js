// QA monkey watcher v23 (ee6a706), loaded AFTER monkey19.js, monkey20.js and monkey21.js (classic scripts served from
// qa/tools on :8882). It runs monkey21 and adds:
//  - teleports (every ~2 s with probability pT) to this round's new parts: the band exercises (sometimes with the
//    style in the address, then ⋯ → Band, Change and a pick, or a tap on the beat lights), the tap games and tap drills
//    (👆 switched, ▶ pressed, a tap on the neck), Pro previews, the seven new grooves, #551 false harmonics, #508
//    groups of 5, ✓ Cleared / 🏅 under ⋯, lesson steps (then a tap on the title: the course map), ⏮ while playing;
//  - a watcher every 150 ms: no Player playing off an exercise; the exercise's Player: a band only on a band exercise,
//    a free player never on a Pro pattern or sound, a preview never longer than one bar and never looping; the beat
//    row's title without undefined; one band panel at most; tap mode's count "j/n · ✓ k" with k <= j <= n <= 10.
// `await __runMonkey23(seed, steps, opts)`; results in window.__m19 (monkey), __w20, __w21 and __w23.
(() => {
  window.__w23 = [];
  window.__w23tele = [];
  const note = (kind, msg) => { if (window.__w23.length < 200 && !window.__w23.some((f) => f.kind === kind && f.msg === msg)) window.__w23.push({ kind, msg, hash: location.hash, step: window.__m19?.steps, last: window.__m19?.log?.slice(-4) }); };
  let M = null;
  window.__players = new Set();
  (async () => {
    const im = (p) => import(location.origin + p);
    M = { P: await im('/js/pro.js'), I: await im('/js/curriculum/index.js'), C: await im('/js/course/data.js'), S: await im('/js/store.js'), B: await im('/js/band.js'), ST: await im('/js/practice/styles.js'), PL: await im('/js/player.js'), MA: await im('/js/mastery.js') };
    const proto = M.PL.Player.prototype;
    if (!proto.__m23) { proto.__m23 = true; const op = proto.play; proto.play = function (...a) { window.__players.add(this); return op.apply(this, a); }; }
  })();
  const tick = () => {
    if (!window.__w23on || !M) return;
    try {
      const { P, I, B, ST } = M; const h = location.hash;
      const playing = [...window.__players].filter((p) => p.playing);
      // (the router runs on hashchange, a task after the hash changes: only a Player playing 400 ms off an exercise counts)
      if (playing.length && !h.startsWith('#/ex/')) { if (!window.__offAt || window.__offHash !== h) { window.__offAt = performance.now(); window.__offHash = h; } else if (performance.now() - window.__offAt > 400) note('audio', `a Player still playing on ${h.split('?')[0]}`); } else window.__offAt = null;
      if (playing.length > 1) note('audio', `${playing.length} Players playing at once`);
      if (h.startsWith('#/ex/')) {
        const id = decodeURIComponent(h.slice(5).split('?')[0]);
        const t = I.byId.get(id) || I.byNumber?.get(Number(id));
        const pl = playing[0];
        if (t && pl) {
          if (pl.band && !B.isBandExercise(t)) note('band', `the band plays on ${t.id}, not a band exercise`);
          if (pl.band && !P.isPro() && P.gatesOn?.()) {
            if (!ST.STYLES[pl.band.key]?.free && P.styleLock(pl.band.key)) note('band', `a free player hears the Pro pattern ${pl.band.key} on ${t.id}`);
            if (P.soundLock(pl.band.sound)) note('band', `a free player hears the Pro sound ${pl.band.sound} on ${t.id}`);
          }
          if (document.querySelector('.pro-try')) {
            const bpb = pl.inst.beatsPerBar || 4;
            const beats = pl.inst.steps.reduce((a, s) => a + pl.beatsOf(s), 0);
            if (pl.inst.steps.length > 1 && beats > bpb + 1e-6 && pl.inst.steps.length > 1) {
              const lastStart = pl.starts[pl.inst.steps.length - 1];
              if (lastStart >= bpb - 1e-9) note('preview', `a preview plays past its first bar on ${t.id}: ${beats} beats, ${pl.inst.steps.length} steps`);
            }
            if (pl.loop) note('preview', `a preview loops on ${t.id}`);
            if (pl.trainer?.on) note('preview', `a preview runs the speed trainer on ${t.id}`);
          }
        }
        const row = document.querySelector('.beat-row');
        if (row && /undefined|null|NaN/.test(row.title || '')) note('band', `beat row title "${row.title}"`);
        if (document.querySelectorAll('.band-panel').length > 1) note('band', 'two band panels');
        const cnt = document.querySelector('.exv-now .cnt')?.textContent || '';
        if (/NaN|undefined|null/.test(cnt)) note('text', `count "${cnt}"`);
        const m = cnt.match(/^(\d+)\/(\d+) · ✓ (\d+)/);
        if (m && !(+m[3] <= +m[1] && +m[1] <= +m[2] && +m[2] <= 10)) note('tap', `count "${cnt}"`);
        const m2 = cnt.match(/^(\d+)\/(\d+)$/);
        if (m2 && +m2[1] > +m2[2]) note('text', `step count "${cnt}"`);
      }
      // stored settings for the band
      const st = M.S.settings;
      if (st.bandStyles && Object.values(st.bandStyles).some((k) => !ST.STYLES[k])) note('store', `bandStyles names a missing pattern ${JSON.stringify(st.bandStyles).slice(0, 80)}`);
    } catch (e) { note('harness', e.message); }
  };
  setInterval(tick, 150);
  const teleTimer = { id: null };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  window.__runMonkey23 = async (seed, steps, opts = {}) => {
    const pT = opts.pT23 ?? 0.7;
    // (no microphone prompt: the pane would show the user a notice)
    if (navigator.mediaDevices && !navigator.mediaDevices.__stub) { navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException('stub', 'NotAllowedError')); navigator.mediaDevices.__stub = true; }
    let s = (seed * 2654435761) >>> 0; const rnd = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const pick = (a) => a[Math.floor(rnd() * a.length)];
    while (!M) await sleep(50);
    const { C, I, B } = M;
    const band = I.EXERCISES.filter(B.isBandExercise);
    const taps = I.EXERCISES.filter((t) => t.game || t.tap);
    const proEx = I.EXERCISES.filter((t) => t.level > 3);
    const fresh = ['gr-waltz', 'gr-metal', 'gr-reggae', 'gr-world-grooves', 'gr-latin', 'gr-electronic', 'gr-gospel', 'tech-false-harmonics', 'sc-odd-groupings', 'sc-symmetric'];
    const stepsOf = C.LESSONS.flatMap((l) => l.steps.map((x, i) => `${x.ex}?ls=${l.id}.${i}`));
    const clickSel = (sel, filter) => { const el = [...document.querySelectorAll(sel)].find((x) => (!filter || filter(x)) && x.getBoundingClientRect().width > 0); el?.click(); return !!el; };
    const tele = async () => {
      const kind = pick(['band', 'band', 'band', 'tap', 'tap', 'pro', 'fresh', 'fresh', 'master', 'step', 'restart']);
      let hh;
      if (kind === 'band') {
        const t = pick(band); const by = B.bandBy(t);
        hh = `#/ex/${t.id}${by && rnd() < 0.5 ? `?${by}=${pick(t.params[by].options)[0]}` : ''}`;
      } else if (kind === 'tap') hh = `#/ex/${pick(taps).id}`;
      else if (kind === 'pro') hh = `#/ex/${pick(proEx).id}`;
      else if (kind === 'fresh' || kind === 'restart' || kind === 'master') hh = `#/ex/${pick(fresh)}`;
      else hh = `#/ex/${pick(stepsOf)}`;
      window.__w23tele.push(`${window.__m19?.steps} ${kind} ${hh}`);
      location.hash = hh;
      await sleep(450);
      if (!location.hash.startsWith('#/ex/')) return;
      const r = rnd();
      if (kind === 'band') {
        if (r < 0.4) { clickSel('.more-btn'); await sleep(80); clickSel('.mi button[aria-label="The band"]'); await sleep(200); if (rnd() < 0.6) { clickSel('.band-panel .pick-now'); await sleep(250); const cards = [...document.querySelectorAll('.picker-backdrop .pick-card, .picker-backdrop [class*="card"]')].filter((x) => x.getBoundingClientRect().width); if (cards.length) pick(cards).click(); } if (rnd() < 0.5) clickSel('.band-panel .chip-btn', () => rnd() < 0.3); }
        else if (r < 0.7) { clickSel('.beat-row'); if (rnd() < 0.5) clickSel('.exv-ctrl .big'); }
        else clickSel('.exv-ctrl .big');
      } else if (kind === 'tap') {
        if (r < 0.3) clickSel('.exv-ctrl button[aria-label^="👆"], .exv-ctrl button[aria-label^="▶ Play mode"]');
        await sleep(60);
        clickSel('.exv-ctrl .big');
      } else if (kind === 'master') {
        clickSel('.more-btn'); await sleep(80);
        if (r < 0.5) clickSel('.mi button[aria-label^="Cleared"], .mi button[title^="Cleared"]'); else clickSel('.mi .medal');
      } else if (kind === 'step') {
        if (r < 0.3) clickSel('.exv-title'); else if (r < 0.6) clickSel('.goal-btn'); else clickSel('.exv-ctrl .big');
      } else if (kind === 'restart' || kind === 'fresh' || kind === 'pro') {
        clickSel('.exv-ctrl .big'); await sleep(300 + rnd() * 900);
        if (kind === 'restart') clickSel('.exv-ctrl button[aria-label="Back to start"]');
      }
    };
    clearInterval(teleTimer.id);
    teleTimer.id = setInterval(() => { if (window.__w23on && rnd() < pT) tele(); }, opts.every23 ?? 900);
    window.__w23on = true;
    try { return await window.__runMonkey21(seed, steps, { pT: 0.08, ...opts }); } finally { window.__w23on = false; clearInterval(teleTimer.id); }
  };
})();
'monkey23 loaded';
