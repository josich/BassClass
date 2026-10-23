// QA round 17 (f600870): the room's engine on a FAKE clock (as checks16.js __sim16, loadable as a classic script;
// see checks17.js), plus a harmony fuzz that also changes the sound (hSound), the key's quality (myMinor),
// My progression (with local keys `k` and part bars) and the new presets.
//   __sim17(opts, secs, during)  -> { ev (clicks, pad oscillators with type/f/when/stop, drums), ticks, chords, r }
//   __harmFuzz17(seed, secs)     -> { beats, changes, bad }
(() => {
  const M = (p) => import(location.origin + p);
  window.__sim17 = async (opts, secs, during) => {
    const A = await M('/js/audio.js'); const { Room } = await M('/js/practice/engine.js');
    const ac = A.audioCtx();
    let fake = 1000;
    const P = { oS: OscillatorNode.prototype.start, bS: AudioBufferSourceNode.prototype.start, oT: OscillatorNode.prototype.stop, bT: AudioBufferSourceNode.prototype.stop };
    const ev = [], ticks = [], chords = [];
    Object.defineProperty(ac, 'currentTime', { get: () => fake, configurable: true });
    OscillatorNode.prototype.start = function (when = 0) { const e = { k: 'osc', type: this.type, when: +(when - 1000).toFixed(6), f: +this.frequency.value.toFixed(1) }; ev.push(e); this.__e = e; };
    OscillatorNode.prototype.stop = function (when = 0) { if (this.__e) this.__e.stop = +(when - 1000).toFixed(6); };
    AudioBufferSourceNode.prototype.start = function (when = 0) { ev.push({ k: 'drum', when: +(when - 1000).toFixed(6) }); };
    AudioBufferSourceNode.prototype.stop = function () {};
    const r = new Room(opts, { onTick: (t) => ticks.push({ ...t, time: +(t.time - 1000).toFixed(6) }), onChord: (c) => chords.push({ ...c, time: +(c.time - 1000).toFixed(6) }) });
    try {
      await r.start(); clearInterval(r.timer);
      for (let i = 0; i < Math.round(secs / 0.025); i++) { fake += 0.025; r._tick(); if (during) during(r, fake - 1000); }
      r.stop();
    } finally {
      clearInterval(r.timer);
      delete ac.currentTime;
      OscillatorNode.prototype.start = P.oS; AudioBufferSourceNode.prototype.start = P.bS; OscillatorNode.prototype.stop = P.oT; AudioBufferSourceNode.prototype.stop = P.bT;
    }
    return { ev, ticks, chords, r };
  };

  window.__harmFuzz17 = async (seed = 1706, secs = 120) => {
    const H = await M('/js/practice/harmony.js'); const { STYLES } = await M('/js/practice/styles.js');
    let s = seed; const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; const pick = (a) => a[Math.floor(rnd() * a.length)];
    const progs = H.PROG_KEYS.filter((k) => k !== H.MINE); const styles = Object.keys(STYLES);
    // My progression: any lengths (the engine pads the last chord to the bar), sometimes a copied preset
    const mine = () => (rnd() < 0.3 ? H.mineFrom(pick(progs)).chords : Array.from({ length: 1 + Math.floor(rnd() * 7) }, () => ({ d: Math.floor(rnd() * 12), q: pick(H.QUALITIES)[0], b: pick([2, 4, 8, 16]) })));
    const base = { bpm: 200, beats: 4, sub: 2, accent: true, click: true, play: 3, mute: 0, speedUp: false, upBy: 2, upEvery: 4, upTo: 200, drums: false, style: 'rock8', countIn: true, harmony: 'chords', hProg: 'blues', hKey: 0, notation: 'letters', myProg: mine(), myMinor: false, hSound: 'pad' };
    let nextAt = 1; const changes = [];
    const sim = await window.__sim17(base, secs, (r, t) => {
      if (t < nextAt) return; nextAt = t + 0.5 + rnd() * 3;
      const k = pick(['style', 'drums', 'beats', 'hKey', 'hProg', 'harmony', 'myProg', 'myMinor', 'hSound', 'hSound', 'mute', 'bpm']); let p;
      if (k === 'style') { const st = STYLES[pick(styles)]; p = { style: st.key, drums: true, beats: st.beats, sub: st.sub }; }
      else if (k === 'drums') p = { drums: !r.o.drums };
      else if (k === 'beats') p = { drums: false, beats: 1 + Math.floor(rnd() * 12) };
      else if (k === 'hKey') p = { hKey: Math.floor(rnd() * 12) };
      else if (k === 'hProg') p = { hProg: pick(progs) };
      else if (k === 'harmony') p = { harmony: pick(['off', 'drone', 'chords', 'chords']) };
      else if (k === 'myProg') p = { hProg: H.MINE, myProg: mine() };
      else if (k === 'myMinor') p = { myMinor: !r.o.myMinor };
      else if (k === 'hSound') p = { hSound: pick(['pad', 'epiano', 'organ', 'strings']) };
      else if (k === 'mute') p = { mute: pick([0, 0, 1, 2]), play: 1 + Math.floor(rnd() * 3) };
      else p = { bpm: 60 + Math.floor(rnd() * 460) };
      changes.push({ t: +t.toFixed(3), ...p }); r.set(p);
    });
    const bad = []; const T = sim.ticks;
    for (let i = 1; i < T.length; i++) { const a = T[i - 1], b = T[i]; if (a.chord && b.chord && b.chord.at !== 0 && b.chord.at !== a.chord.at + 1) bad.push(`at ${a.chord.at}->${b.chord.at} @${b.time}`); }
    for (const c of sim.chords) { if (c.idx !== 0) continue; const tk = T.find((x) => Math.abs(x.time - c.time) < 1e-6); if (tk && tk.beat !== 0) bad.push(`form restarts mid-bar @${tk.bar}.${tk.beat}`); }
    // pad oscillators (not the clicks: sines at the click pitches with a stop 0.07 s later)
    const pads = sim.ev.filter((e) => e.k === 'osc' && !(e.type === 'sine' && [900, 1175, 1480, 1760].includes(Math.round(e.f)) && Math.abs(e.stop - e.when - 0.07) < 1e-6));
    for (const p of pads) { const tk = T.find((x) => Math.abs(x.time - p.when) < 1e-6); if (tk && (tk.muted || tk.count)) bad.push(`pad in a ${tk.muted ? 'muted' : 'count-in'} beat @${p.when}`); if (p.stop == null) bad.push(`pad oscillator never stopped @${p.when}`); }
    return { beats: T.length, changes: changes.length, pads: pads.length, bad: bad.slice(0, 30), nBad: bad.length };
  };
  window.__sim17ready = true;
})();
