// QA monkey watcher v21 (6d8ee74), loaded AFTER monkey19.js and monkey20.js. It runs monkey20 (monkey19 + the round-20
// watcher) and adds, every 150 ms while `window.__w21on`:
//  - the drone's chord (practice/drones.js): a free player's room never holds a Pro drone (droneLock); the stored
//    hQual is a DRONES key, droneFavs / droneRecent arrays of keys (recent <= 6); a playing Room plays the room's
//    hQual; the Harmony row's drone line names `droneName(hKey, hQual)`; the Neck's bar reads "Drone: <name>" for a
//    chord, "Drone on <key>" for the open drone; the Chord | Scale | Off switch has Chord only over a chord drone;
//  - Free to try: a free player inside an exercise opened from a free lesson's step only (exerciseLock with its ls);
//    the course row reads "▶ Try free" only while the next lesson is Pro; the map's "Free" chip only on free lessons;
//  - the Pro sheet: never over a Pro sheet, the drone picker never open with a Pro sheet;
// and, every ~2.5 s with probability `pT`, teleports to a free lesson's step (by id or number, sometimes with a
// wrong step index or another exercise), a free lesson page, the drone picker or a Pro lesson page.
// `__runMonkey21(seed, steps, opts)`; results in window.__m19 (monkey), __w20 and __w21.
(() => {
  window.__w21 = [];
  window.__w21tele = [];
  const note = (kind, msg) => { if (window.__w21.length < 200 && !window.__w21.some((f) => f.kind === kind && f.msg === msg)) window.__w21.push({ kind, msg, hash: location.hash, step: window.__m19?.steps, last: window.__m19?.log?.slice(-3) }); };
  let M = null;
  (async () => {
    const im = (p) => import(location.origin + p);
    M = { P: await im('/js/pro.js'), D: await im('/js/practice/drones.js'), st: await im('/js/practice/state.js'), C: await im('/js/course/data.js'), I: await im('/js/curriculum/index.js'), S: await im('/js/store.js') };
  })();
  const tick = () => {
    if (!window.__w21on || !M) return;
    try {
      const { P, D, st, C, I, S } = M; const room = st.room; const h = location.hash;
      // ---- the drone
      if (!D.DRONES[room.hQual]) note('store', `room.hQual ${room.hQual}`);
      try {
        const v = JSON.parse(localStorage.getItem('bassclass.practice.v1') || '{}');
        if (v.hQual != null && !D.DRONES[v.hQual]) note('store', `stored hQual ${v.hQual}`);
        for (const k of ['droneFavs', 'droneRecent']) if (v[k] != null && !(Array.isArray(v[k]) && v[k].every((x) => D.DRONES[x]))) note('store', `stored ${k} ${JSON.stringify(v[k]).slice(0, 80)}`);
        if ((v.droneRecent?.length || 0) > 6) note('store', 'more than 6 recent drones');
      } catch { note('store', 'practice record does not parse'); }
      if (h.startsWith('#/practice') && document.querySelector('.room-fab')) {
        if (!P.isPro() && room.harmony === 'drone' && P.droneLock(room.hQual)) note('pro', `free room plays the Pro drone ${room.hQual}`);
        for (const r of window.__rooms || []) if (r.playing && r.o.harmony === 'drone' && r.o.hQual !== room.hQual) note('room', `Room plays drone ${r.o.hQual}, room says ${room.hQual}`);
        if (room.harmony === 'drone') {
          const open = room.hQual === 'open' || room.hQual === 'root';
          const harm = [...document.querySelectorAll('section')].find((x) => /Harmony/.test(x.querySelector('h2')?.textContent || ''));
          const line = harm?.querySelector('.pick-now .pick-text b')?.childNodes[0]?.textContent?.trim();
          const want = D.droneName(room.hKey, room.hQual, S.settings.notation);
          if (line != null && line !== want) note('room', `drone line "${line}" want "${want}"`);
          const tag = document.querySelector('.drone-tag')?.textContent || '';
          if (tag && (open ? !tag.startsWith('Drone on ') : tag !== `Drone: ${want}`)) note('room', `drone tag "${tag}" (hQual ${room.hQual})`);
          const seg = [...document.querySelectorAll('.harm-bar .seg button')].map((b) => b.textContent);
          if (seg.length && seg.includes('Chord') === open) note('room', `Neck switch ${seg.join('|')} over drone ${room.hQual}`);
        }
      }
      if (document.querySelector('.pro-sheet') && document.querySelectorAll('.pro-sheet').length > 1) note('pro', 'two Pro sheets');
      // ---- free to try
      if (!P.isPro()) {
        const row = document.querySelector('.course-block .course-go');
        if (row && /Try free/.test(row.textContent)) {
          const name = row.querySelector('span')?.textContent || '';
          const L = C.LESSONS.find((l) => name.includes(l.title));
          if (L && P.lessonLock(L)) note('pro', `Try free points at a Pro lesson ${L.id}`);
        }
        for (const c of document.querySelectorAll('.chip.try')) {
          const a = c.closest('a[href^="#/course/"]') || c.closest('.les-row')?.querySelector('a[href^="#/course/"]');
          const L = a ? C.lessonById.get(a.getAttribute('href').split('/')[2].split('?')[0]) : null;
          if (L && !L.free && !L.unit?.free && !L.stage?.free) note('pro', `"Free" chip on ${L.id}`);
        }
      } else if (document.querySelector('.chip.try')) note('pro', 'a "Free" chip while everything is open');
    } catch (e) { note('harness', e.message); }
  };
  setInterval(tick, 150);
  const teleTimer = { id: null };
  window.__runMonkey21 = async (seed, steps, opts = {}) => {
    const pT = opts.pT ?? 0.35;
    let s = seed ^ 0x5bd1e995; const rnd = () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const pick = (a) => a[Math.floor(rnd() * a.length)];
    while (!M) await new Promise((r) => setTimeout(r, 50));
    const { C, I } = M;
    const free = C.LESSONS.filter((l) => l.free);
    const pro = C.LESSONS.filter((l) => l.stage.level > 3 && !l.free);
    const proEx = I.EXERCISES.filter((t) => t.level > 3);
    const hashes = () => {
      const L = pick(free); const i = Math.floor(rnd() * L.steps.length); const t = I.byId.get(L.steps[i].ex);
      return pick([
        `#/ex/${t.id}?ls=${L.id}.${i}`, `#/ex/${t.num}?ls=${L.id}.${i}`, `#/ex/${t.id}?ls=${L.id}.${i}&demo=1`, `#/ex/${t.id}?ls=${L.id}.${i}&rv=1`,
        `#/ex/${t.id}?ls=${L.id}.${i + 7}`, `#/ex/${pick(proEx).id}?ls=${L.id}.${i}`, `#/ex/${t.id}?ls=${L.id}`, `#/ex/${t.id}?ls=${L.id}.x`,
        `#/course/${L.id}`, `#/course/${pick(pro).id}`, '#/course', '#/', '#/practice',
      ]);
    };
    clearInterval(teleTimer.id);
    teleTimer.id = setInterval(() => { if (window.__w21on && rnd() < pT) { const h = hashes(); window.__w21tele.push(`${window.__m19?.steps} ${h}`); location.hash = h; } }, 2500);
    window.__w21on = true;
    try { return await window.__runMonkey20(seed, steps, opts); } finally { window.__w21on = false; clearInterval(teleTimer.id); }
  };
})();
'monkey21 loaded';
