// QA monkey watcher v22 (d278266), loaded AFTER monkey19.js, monkey20.js, monkey21.js and mic22.js (the stand-in
// microphone, installed first). It runs monkey21 and adds:
//  - teleports (every ~2 s with probability pT) to this round's new parts: the tap games (every game, sometimes with
//    options in the address), the two exercises with 🎙 Record (and the Record card opened, sometimes Record pressed),
//    the tuner (and its ✎ Each string panel), Pro exercises and Pro lesson pages (previews, with the gates on),
//    lessons by number (#/course/3.15) and bad lesson numbers;
//  - a watcher every 150 ms: a take (the red badge) only on an exercise screen; no microphone track left live with no
//    take running or opening (the stand-in's streams); the recording click (4.6-5.3 kHz) only during a take; a game's
//    score "x/y" with x <= y <= 10; the tuner's strings named as its tuning; a Pro exercise never records progress in a
//    preview (its progress record unchanged, the dot-label choice aside).
// `await __runMonkey22(seed, steps, opts)`; results in window.__m19 (monkey), __w20, __w21 and __w22.
(() => {
  window.__w22 = [];
  window.__w22tele = [];
  const note = (kind, msg) => { if (window.__w22.length < 200 && !window.__w22.some((f) => f.kind === kind && f.msg === msg)) window.__w22.push({ kind, msg, hash: location.hash, step: window.__m19?.steps, last: window.__m19?.log?.slice(-4) }); };
  let M = null;
  (async () => {
    const im = (p) => import(location.origin + p);
    M = { P: await im('/js/pro.js'), I: await im('/js/curriculum/index.js'), C: await im('/js/course/data.js'), S: await im('/js/store.js'), TU: await im('/js/ui/tuner.js') };
  })();
  // every microphone stream the app opened (through the stand-in)
  window.__micStreams = [];
  const gum = navigator.mediaDevices.getUserMedia;
  navigator.mediaDevices.getUserMedia = async (...a) => { const s = await gum.apply(navigator.mediaDevices, a); window.__micStreams.push({ s, at: performance.now(), hash: location.hash }); return s; };
  const proProg = new Map();
  const tick = () => {
    if (!window.__w22on || !M) return;
    try {
      const { P, I, S, TU } = M; const h = location.hash;
      const badge = document.querySelector('.rec-badge:not([hidden])');
      if (badge && !h.startsWith('#/ex/')) note('rec', 'a take badge off the exercise screen');
      const opening = /Opening the microphone/.test(document.querySelector('.rec-layer:not([hidden])')?.textContent || '');
      const live = window.__micStreams.filter((x) => x.s.getAudioTracks()[0]?.readyState === 'live');
      if (live.length > 1) note('rec', `${live.length} microphone streams live at once`);
      if (live.length && !badge && !opening && !h.startsWith('#/tuner')) {
        const old = live.filter((x) => performance.now() - x.at > 4000);
        if (old.length) note('rec', `a microphone stream left live (opened at ${old[0].hash}) with no take running`);
      }
      // a game's score
      const sc = document.querySelector('.game-score')?.textContent || '';
      const m = sc.match(/^(\d+)\/(\d+)/);
      if (m && (+m[1] > +m[2] || +m[2] > 10)) note('game', `score ${sc}`);
      if (/NaN|undefined/.test(sc)) note('game', `score text ${sc}`);
      // the tuner's strings as its tuning names them
      if (h.startsWith('#/tuner') && document.querySelector('.tn-key')) {
        const st = S.settings;
        const offs = Array.isArray(st.tunerOffs) && st.tunerOffs.length === (st.strings || 4) ? st.tunerOffs : null;
        const t = TU.tunerTuning(st.strings, st.tunerShift, st.tunerDrop, offs);
        const shown = [...document.querySelectorAll('.tn-strings button')].slice(1).map((b) => b.querySelector('b')?.textContent);
        const want = t.midi.map((x, i) => `${(window.__noteName || ((n) => n))(t.names[i])}${Math.floor(x / 12) - 1}`);
        if (shown.length && st.notation === 'letters' && shown.join(' ') !== want.join(' ')) note('tuner', `strings "${shown.join(' ')}" want "${want.join(' ')}"`);
      }
      // a Pro exercise in a preview records nothing (but its dot-label choice)
      if (!P.isPro() && h.startsWith('#/ex/')) {
        const id = decodeURIComponent(h.slice(5).split('?')[0]);
        const t = I.byId.get(id) || I.byNumber?.get(Number(id));
        if (t && document.querySelector('.pro-try')) {
          const pr = S.getProgress(t.id);
          const key = JSON.stringify(pr ? { ...pr, last: 0, label: 0 } : null);
          if (!proProg.has(t.id)) proProg.set(t.id, key);
          else if (proProg.get(t.id) !== key) { note('pro', `preview of ${t.id} changed its progress: ${key.slice(0, 120)}`); proProg.set(t.id, key); }
        }
      }
    } catch (e) { note('harness', e.message); }
  };
  setInterval(tick, 150);
  const teleTimer = { id: null };
  window.__runMonkey22 = async (seed, steps, opts = {}) => {
    const pT = opts.pT22 ?? 0.4;
    let s = (seed * 2654435761) >>> 0; const rnd = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const pick = (a) => a[Math.floor(rnd() * a.length)];
    while (!M) await new Promise((r) => setTimeout(r, 50));
    const { C, I } = M;
    const games = ['game-ear-notes', 'game-ear-intervals', 'game-ear-chordtones', 'game-read-notes'];
    const proEx = I.EXERCISES.filter((t) => t.level > 3);
    const proLessons = C.LESSONS.filter((l) => l.stage.level > 3 && !l.free);
    const tele = async () => {
      const kind = pick(['game', 'game', 'rec', 'rec', 'tuner', 'pro', 'proL', 'num']);
      let hh;
      if (kind === 'game') hh = `#/ex/${pick(games)}${rnd() < 0.3 ? `?notes=${pick(['f', 'neck', 'sharps', 'zz'])}&places=${pick(['one', 'all'])}` : ''}`;
      else if (kind === 'rec') hh = `#/ex/${pick(['sc-one-octave', 'fb-open-strings', 'fb-open-strings?reps=1&ls=open-strings.1'])}`;
      else if (kind === 'tuner') hh = '#/tuner';
      else if (kind === 'pro') hh = `#/ex/${pick(proEx).id}`;
      else if (kind === 'proL') hh = `#/course/${pick(proLessons).id}`;
      else hh = `#/course/${pick(['3.15', '1.1', '6.40', '9.99', '3.155', '0.0', '2.33', '3.40'])}`;
      window.__w22tele.push(`${window.__m19?.steps} ${hh}`);
      location.hash = hh;
      await new Promise((r) => setTimeout(r, 500));
      // sometimes go one step further on the new screen
      if (kind === 'rec' && rnd() < 0.7) {
        document.querySelector('.exv-top button[aria-label^="Record a take"]')?.click();
        await new Promise((r) => setTimeout(r, 150));
        if (rnd() < 0.6) [...document.querySelectorAll('.rec-btns button')].find((x) => /Record|Again/.test(x.textContent))?.click();
      } else if (kind === 'tuner' && rnd() < 0.6) document.querySelector('.tn-each')?.click();
      else if (kind === 'game' && rnd() < 0.7) document.querySelector('.game-ctrl .btn.primary')?.click();
    };
    clearInterval(teleTimer.id);
    teleTimer.id = setInterval(() => { if (window.__w22on && rnd() < pT) tele(); }, 2000);
    window.__w22on = true;
    try { return await window.__runMonkey21(seed, steps, { pT: 0.1, ...opts }); } finally { window.__w22on = false; clearInterval(teleTimer.id); }
  };
})();
'monkey22 loaded';
