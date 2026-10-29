// QA round 21 (6d8ee74): a drone-focused fuzzer for the Practice room, loaded after monkey19.js (its error, Room and
// oscillator hooks). `__droneFuzz21(seed, n)` stays on #/practice in Drone mode and, n times: opens the drone picker
// and picks a random card (free or locked: a locked one opens the Pro sheet, then Buy, Escape or ✕), stars a card,
// switches groups, changes the key, Chord | Scale | Off, the sound, the notation, gates / Pro owned, Start / Stop,
// Escape, ✕, leaving the room (no raw history.back(): the tab's earlier pages would load). After each action it checks: errors; the stored hQual valid and free for a free player; the playing
// Room's hQual = the room's; the drone line and the Neck's tag name droneName(hKey, hQual); the Chord view's info
// line names the same chord and lists one note per tone of droneIvs; one picker / Pro sheet at most, never both;
// the picker always with its history entry. Results in window.__d21.
(() => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  window.__droneFuzz21 = async (seed, n = 150) => {
    let s = seed; const rnd = () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const pick = (a) => a[Math.floor(rnd() * a.length)];
    const im = (p) => import(location.origin + p);
    const D = await im('/js/practice/drones.js'); const st = await im('/js/practice/state.js'); const P = await im('/js/pro.js'); const S = await im('/js/store.js');
    const res = window.__d21 = { seed, steps: 0, log: [], findings: [] };
    const note = (kind, msg) => { if (res.findings.length < 120 && !res.findings.some((f) => f.msg === msg)) res.findings.push({ step: res.steps, kind, msg, last: res.log.slice(-3) }); };
    let e0 = window.__errs?.length || 0;
    const harm = () => [...document.querySelectorAll('section')].find((x) => /Harmony/.test(x.querySelector('h2')?.textContent || ''));
    const ensureDrone = async () => {
      if (!location.hash.startsWith('#/practice')) { location.hash = '#/practice'; await sleep(700); }
      const h = harm(); if (!h) return;
      if (st.room.harmony !== 'drone') { [...h.querySelectorAll('.seg button')].find((b) => b.textContent === 'Drone')?.click(); await sleep(150); }
    };
    for (let i = 0; i < n; i++) {
      res.steps = i + 1; let act = '';
      try {
        await ensureDrone();
        const r = rnd();
        const picker = document.querySelector('.picker-backdrop:not(.pro-backdrop)');
        const sheet = document.querySelector('.pro-sheet');
        if (sheet) {
          const c = pick(['buy', 'esc', 'close', 'restore']); act = `sheet ${c}`;
          if (c === 'buy') { P.setDev({ next: pick(['ok', 'cancel', 'pending', 'error']) }); sheet.querySelector('.pro-buy')?.click(); await sleep(900); sheet.querySelector('.pro-actions .btn.primary')?.click(); }
          else if (c === 'restore') { [...sheet.querySelectorAll('button')].find((b) => /Restore/.test(b.textContent))?.click(); await sleep(500); }
          else if (c === 'esc') document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
          else sheet.querySelector('.picker-close')?.click();
        } else if (picker) {
          const c = r < 0.55 ? 'pick' : r < 0.7 ? 'group' : r < 0.8 ? 'star' : r < 0.9 ? 'esc' : 'back'; act = `picker ${c}`;
          if (c === 'pick') { const cards = [...picker.querySelectorAll('.picker-pick')]; const el = pick(cards); act += ` "${el?.querySelector('b')?.textContent}"`; el?.click(); }
          else if (c === 'group') { const g = pick([...picker.querySelectorAll('.picker-chip-row button')]); act += ` ${g?.textContent}`; g?.click(); }
          else if (c === 'star') { const g = pick([...picker.querySelectorAll('.picker-star')]); act += ` ${g?.getAttribute('aria-label')}`; g?.click(); }
          else if (c === 'esc') document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
          else picker.querySelector('.picker-close')?.click();
        } else {
          const h = harm();
          if (r < 0.3) { act = 'open picker'; await sleep(450); h.querySelector('.pick-now')?.click(); await sleep(450); }
          else if (r < 0.42) { const sel = h.querySelector('select'); const o = pick([...sel.options]); sel.value = o.value; sel.dispatchEvent(new Event('change', { bubbles: true })); act = `key ${o.textContent}`; }
          else if (r < 0.54) { const b = pick([...document.querySelectorAll('.harm-bar .seg button')]); act = `neck ${b?.textContent}`; b?.click(); }
          else if (r < 0.62) { const b = pick([...h.querySelectorAll('.seg button, button')].filter((x) => /^(Pad|E-piano|Piano|Organ|Guitar|Arpeggio)$/.test(x.textContent))); act = `sound ${b?.textContent}`; b?.click(); }
          else if (r < 0.7) { act = 'start/stop'; document.querySelector('.room-fab')?.click(); }
          else if (r < 0.76) { const v = pick(['letters', 'solfege']); act = `notation ${v}`; S.saveSettings({ notation: v }); location.hash = '#/settings'; await sleep(200); location.hash = '#/practice'; }
          else if (r < 0.84) { const g = rnd() < 0.8; act = `gates ${g}`; P.setDev({ gates: g, on: true }); }
          else if (r < 0.9) { const o = rnd() < 0.4; act = `owned ${o}`; P.setOwned(o); }
          else if (r < 0.95) { act = 'harmony off/drone'; [...h.querySelectorAll('.seg button')].find((b) => b.textContent === pick(['Off', 'Chords', 'Drone']))?.click(); }
          else { act = 'leave and come back'; location.hash = '#/'; await sleep(300); }
        }
      } catch (e) { note('harness', `${act}: ${e.message}`); }
      res.log.push(`${i + 1} ${act}`); if (res.log.length > 300) res.log.splice(0, 100);
      await sleep(120 + rnd() * 200);
      try {
        if ((window.__errs?.length || 0) > e0) { for (const e of window.__errs.slice(e0)) note('error', e); e0 = window.__errs.length; }
        const room = st.room;
        if (!D.DRONES[room.hQual]) note('store', `hQual ${room.hQual}`);
        if (!P.isPro() && P.droneLock(room.hQual)) note('pro', `free player holds the Pro drone ${room.hQual}`);
        const pk = document.querySelectorAll('.picker-backdrop:not(.pro-backdrop)').length, sh = document.querySelectorAll('.pro-sheet').length;
        if (pk > 1 || sh > 1 || (pk && sh)) note('ui', `${pk} pickers, ${sh} sheets`);
        if ((pk || sh) && !history.state?.picker) note('ui', 'picker or sheet without its history entry');
        for (const r of window.__rooms || []) if (r.playing && r.o.hQual !== room.hQual) note('engine', `Room hQual ${r.o.hQual} vs room ${room.hQual}`);
        if (location.hash.startsWith('#/practice') && room.harmony === 'drone' && !pk && !sh) {
          const name = D.droneName(room.hKey, room.hQual, S.settings.notation);
          const open = room.hQual === 'open' || room.hQual === 'root';
          const line = harm()?.querySelector('.pick-now .pick-text b')?.childNodes[0]?.textContent?.trim();
          if (line && line !== name) note('ui', `drone line "${line}" want "${name}"`);
          const tag = document.querySelector('.drone-tag')?.textContent;
          if (tag && !open && tag !== `Drone: ${name}`) note('ui', `tag "${tag}" want "Drone: ${name}"`);
          const lit = document.querySelector('.harm-bar .seg button.on')?.textContent;
          const info = [...document.querySelectorAll('.neck-block .muted.small, section .muted.small')].map((x) => x.textContent).find((t) => t.startsWith('🎹'));
          if (lit === 'Chord' && !open) {
            if (!info || !info.startsWith(`🎹 ${name}:`)) note('neck', `Chord view reads "${info?.slice(0, 50)}" for ${name}`);
            else { const tones = info.split(':')[1].split('·')[0].split('–').map((x) => x.trim()).filter(Boolean); if (tones.length !== D.droneIvs(room.hQual).length) note('neck', `${name}: ${tones.length} tones on the Neck, ${D.droneIvs(room.hQual).length} in the chord`); }
          }
          if (lit === 'Chord' && open) note('neck', `Chord lit over the open drone ${room.hQual}`);
        }
      } catch (e) { note('harness', `check: ${e.message}`); }
    }
    return res;
  };
})();
'drone21 loaded';
