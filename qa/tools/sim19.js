// QA round 19 (3219994): the room's engine on a FAKE clock (sim18's method), now telling the guitar's chugs
// apart: a chug is six AudioBufferSources (3 notes x 2 takes) that go through a StereoPanner, then a gain
// connected to the amp. Classic script, loaded from the qa tab after one real click (a running AudioContext).
//   __sim19(opts, secs, during)  -> { ev: [{ k: 'osc'|'buf', pan, when, stop, cut, type, f }], ticks, chords }
//   __chug19()                   -> the guitar checks: feel per pattern/subdivision, accents, Stop, tempo
//                                   change, muted bars, count-in, sound switches both ways, drone
//   __fills19()                  -> phraseHits: every pattern x subdivision x fills 4/8 at 3 tempos: whole
//                                   bars, hits inside the beat, fill on the grid the beat plays (swing!)
(() => {
  const M = (p) => import(location.origin + p);
  window.__sim19 = async (opts, secs, during) => {
    const A = await M('/js/audio.js'); const { Room } = await M('/js/practice/engine.js');
    const ac = A.audioCtx();
    let fake = 1000;
    const P = { oS: OscillatorNode.prototype.start, bS: AudioBufferSourceNode.prototype.start, oT: OscillatorNode.prototype.stop, bT: AudioBufferSourceNode.prototype.stop, c: AudioNode.prototype.connect, d: AudioNode.prototype.disconnect };
    const ev = [], ticks = [], chords = [];
    Object.defineProperty(ac, 'currentTime', { get: () => fake, configurable: true });
    AudioNode.prototype.connect = function (to, ...a) { if (!this.__to) this.__to = to; return P.c.call(this, to, ...a); };
    AudioNode.prototype.disconnect = function (...a) { this.__cut = true; return P.d.apply(this, a); };
    OscillatorNode.prototype.start = function (when = 0) { const e = { k: 'osc', type: this.type, when: +(when - 1000).toFixed(6), f: +this.frequency.value.toFixed(2), node: this }; ev.push(e); this.__e = e; };
    OscillatorNode.prototype.stop = function (when = 0) { if (this.__e) this.__e.stop = +(when - 1000).toFixed(6); };
    AudioBufferSourceNode.prototype.start = function (when = 0) { const e = { k: 'buf', pan: this.__to instanceof StereoPannerNode, rate: this.playbackRate.value, len: this.buffer?.duration, when: +(when - 1000).toFixed(6), node: this }; ev.push(e); this.__e = e; };
    AudioBufferSourceNode.prototype.stop = function (when = 0) { if (this.__e) this.__e.stop = +(when - 1000).toFixed(6); };
    const r = new Room(opts, { onTick: (t) => ticks.push({ ...t, time: +(t.time - 1000).toFixed(6) }), onChord: (c) => chords.push({ ...c, time: +(c.time - 1000).toFixed(6) }) });
    let stoppedAt = null;
    try {
      await r.start(); clearInterval(r.timer);
      for (let i = 0; i < Math.round(secs / 0.025); i++) { fake += 0.025; r._tick(); if (during) during(r, fake - 1000); if (!r.playing) break; }
      stoppedAt = fake - 1000;
      r.stop();
    } finally {
      clearInterval(r.timer);
      delete ac.currentTime;
      OscillatorNode.prototype.start = P.oS; AudioBufferSourceNode.prototype.start = P.bS; OscillatorNode.prototype.stop = P.oT; AudioBufferSourceNode.prototype.stop = P.bT;
      AudioNode.prototype.connect = P.c; AudioNode.prototype.disconnect = P.d;
    }
    for (const e of ev) { let n = e.node, cut = false, peak = null; for (let h = 0; h < 5 && n; h++) { if (n.__cut) { cut = true; break; } n = n.__to; } e.cut = cut; delete e.node; }
    return { ev, ticks, chords, r, stoppedAt };
  };
  const base = { bpm: 120, beats: 4, sub: 2, accents: [0], click: true, play: 2, mute: 0, speedUp: false, upBy: 2, upEvery: 4, upTo: 200, drums: false, style: 'rock8', countIn: false, harmony: 'chords', hProg: 'blues', hKey: 9, notation: 'letters', hSound: 'guitar', myProg: [{ d: 0, q: 'maj', b: 4 }], myMinor: false, fills: 0 };
  window.__base19 = base;
  // a chug = the earliest of a cluster of panned buffers (6 per chug, within 20 ms)
  const chugsOf = (ev) => {
    const b = ev.filter((e) => e.k === 'buf' && e.pan).sort((x, y) => x.when - y.when);
    const out = [];
    for (const e of b) { const last = out.at(-1); if (last && e.when - last.when < 0.019) { last.n++; last.cut = last.cut || e.cut; last.stop = Math.max(last.stop ?? 0, e.stop ?? 0); } else out.push({ when: e.when, n: 1, cut: e.cut, stop: e.stop }); }
    return out;
  };
  window.__chugsOf19 = chugsOf;

  window.__chug19 = async () => {
    const { STYLES, clickTimes, levelsOf } = await M('/js/practice/styles.js');
    const out = { feel: [], counts: [], extremes: [], stop: null, tempo: null, muted: null, countIn: null, switchToPad: null, switchToGuitar: null, drone: null };
    // 1. feel: every pattern x subdivision at 100 BPM, beat 3 of the run: chug offsets against the clicks
    for (const s of Object.values(STYLES)) for (const L of levelsOf(s)) {
      const sim = await window.__sim19({ ...base, drums: true, style: s.key, beats: s.beats, sub: L, bpm: 100 }, 3);
      const t0s = sim.ticks.filter((t) => !t.count).map((t) => t.time);
      const len = 60 / 100; const beat = t0s[2];
      const ch = chugsOf(sim.ev).filter((c) => c.when >= beat - 1e-6 && c.when < beat + len - 1e-6);
      const offs = ch.map((c) => +((c.when - beat) / len).toFixed(2));
      const want = clickTimes(s, L).map((x) => +x.toFixed(2));
      // (each strike may be up to 3 ms late; 0.01 of a beat at 100 BPM is 6 ms)
      const okOffs = offs.length === want.length && offs.every((o, i) => Math.abs(o - want[i]) <= 0.01);
      if (!okOffs) out.feel.push(`${s.key} L${L}: chugs at ${offs.join(' ')} | clicks at ${want.join(' ')}`);
      if (ch.some((c) => c.n !== 6)) out.counts.push(`${s.key} L${L}: sources per chug ${ch.map((c) => c.n).join(',')}`);
    }
    // 2. extremes, drums off
    for (const bpm of [1, 30, 300, 660]) for (const sub of [1, 2, 3, 4]) {
      const secs = bpm === 1 ? 130 : 6;
      const sim = await window.__sim19({ ...base, bpm, sub }, secs);
      const ch = chugsOf(sim.ev); const len = 60 / bpm; const t0s = sim.ticks.map((t) => t.time);
      let bad = 0;
      for (const t0 of t0s.slice(0, -1)) { const n = ch.filter((c) => c.when >= t0 - 1e-6 && c.when < t0 + len - 1e-6); if (n.length !== sub || n.some((c, k) => Math.abs(c.when - (t0 + (k * len) / sub)) > 0.0035)) bad++; }
      const rings = ch.map((c) => c.stop - c.when);
      out.extremes.push(`${bpm} BPM x${sub}: ${t0s.length} beats, ${ch.length} chugs, ${bad} bad beats, ring ${Math.min(...rings).toFixed(3)}-${Math.max(...rings).toFixed(3)} s`);
    }
    // 3. Stop at 1 BPM x4 in the middle of a beat: chugs after Stop must be cut
    {
      const sim = await window.__sim19({ ...base, bpm: 30, sub: 4 }, 3.1, (r, t) => { if (t >= 3.05 && r.playing) r.stop(); });
      const ch = chugsOf(sim.ev);
      out.stop = { stoppedAt: sim.stoppedAt, after: ch.filter((c) => c.when > sim.stoppedAt).map((c) => `${c.when}${c.cut ? ' cut' : ' SOUNDS'}`) };
    }
    // 4. tempo change mid-beat 30 -> 200
    {
      let changed = null;
      const sim = await window.__sim19({ ...base, bpm: 30, sub: 4 }, 6, (r, t) => { if (!changed && t >= 2.6) { changed = t; r.set({ bpm: 200 }); } });
      const ch = chugsOf(sim.ev);
      const old = ch.filter((c) => c.when > changed && c.when < 4 && !c.cut);
      out.tempo = { changedAt: changed, oldBeatSounding: old.slice(0, 8).map((c) => c.when), cutAfter: ch.filter((c) => c.cut).length };
    }
    // 5. muted bars, count-in
    {
      const sim = await window.__sim19({ ...base, bpm: 120, sub: 2, play: 1, mute: 1 }, 8);
      const ch = chugsOf(sim.ev);
      const mutedT = sim.ticks.filter((t) => t.muted).map((t) => t.time);
      out.muted = { mutedBeats: mutedT.length, chugsInMuted: ch.filter((c) => mutedT.some((t) => c.when >= t - 1e-6 && c.when < t + 0.5 - 1e-6)).length };
      const sim2 = await window.__sim19({ ...base, bpm: 120, sub: 2, countIn: true }, 4);
      const cnt = sim2.ticks.filter((t) => t.count).map((t) => t.time);
      out.countIn = { countBeats: cnt.length, chugsInCount: chugsOf(sim2.ev).filter((c) => c.when < (sim2.ticks.find((t) => !t.count)?.time ?? 99) - 1e-6).length };
    }
    // 6. switches: guitar -> pad and pad -> guitar mid-play
    {
      let at = null;
      const sim = await window.__sim19({ ...base, bpm: 120, sub: 2 }, 6, (r, t) => { if (!at && t >= 2.3) { at = t; r.set({ hSound: 'pad' }); } });
      const ch = chugsOf(sim.ev); const pads = sim.ev.filter((e) => e.k === 'osc' && e.type === 'sawtooth');
      out.switchToPad = { at, lastChug: ch.filter((c) => !c.cut).at(-1)?.when, firstPad: pads[0]?.when, padsStopped: pads.every((p) => p.stop != null) };
      let at2 = null;
      const sim2 = await window.__sim19({ ...base, bpm: 120, sub: 2, hSound: 'pad' }, 6, (r, t) => { if (!at2 && t >= 2.3) { at2 = t; r.set({ hSound: 'guitar' }); } });
      const ch2 = chugsOf(sim2.ev); const pads2 = sim2.ev.filter((e) => e.k === 'osc' && e.type === 'sawtooth');
      out.switchToGuitar = { at: at2, firstChug: ch2[0]?.when, padStops: [...new Set(pads2.map((p) => p.stop))], padsHeldAfterSwitch: pads2.filter((p) => p.stop == null || p.stop > ch2[0]?.when + 0.5).length };
    }
    // 7. drone with the guitar: a power chord on the drone's root
    {
      const sim = await window.__sim19({ ...base, harmony: 'drone', bpm: 120, sub: 1 }, 3);
      const b = sim.ev.filter((e) => e.k === 'buf' && e.pan);
      out.drone = { chugs: chugsOf(sim.ev).length, sources: b.length };
    }
    return out;
  };

  window.__fills19 = async () => {
    const { STYLES, levelsOf, phraseHits, beatHits } = await M('/js/practice/styles.js');
    const out = { checked: 0, outside: [], swingClash: [], noFillOnLast: [], crashMissing: [], kickLost: [], fillVoices: {} };
    for (const s of Object.values(STYLES)) for (const L of levelsOf(s)) for (const every of [4, 8]) for (const bpm of [80, 140, 200]) {
      out.checked++;
      for (let bar = 0; bar < every * 2; bar++) for (let beat = 0; beat < s.beats; beat++) {
        const hits = phraseHits(s, L, bar, beat, every, bpm);
        const plain = beatHits(s, L, bar, beat);
        if (hits.some(([f]) => !(f >= 0 && f < 1))) out.outside.push(`${s.key} L${L} bar ${bar} beat ${beat}: ${hits.map(([f]) => f).join(',')}`);
        if (bar % every === 0 && beat === 0 && !hits.some(([, p]) => p === 'crash') && !Object.keys(s.tracks).some((p) => /^b/.test(p) || /conga|tumba/.test(p))) out.crashMissing.push(`${s.key}`);
        const fillHits = hits.filter(([, p], i) => !plain.some((q) => q[1] === p && q[0] === hits[i][0]));
        // the fill's grid against the beat's own grid (the clicks' feel): a straight 16th fill over swung 8ths
        if (bar % every === every - 1 && fillHits.length) {
          const pos = [...new Set(plain.map(([f]) => +f.toFixed(3)))];
          const fpos = [...new Set(fillHits.map(([f]) => +f.toFixed(3)))];
          const offGrid = fpos.filter((f) => !pos.includes(f) && pos.length > 1);
          if (offGrid.length && L === 3 && s.grid === 4) out.swingClash.push(`${s.key} L${L} ${bpm} BPM: groove at ${pos.join(' ')} | fill at ${fpos.join(' ')}`);
          out.fillVoices[s.key] = [...new Set(fillHits.map(([, p]) => p))].join(',');
        }
        if (bar % every === every - 1 && beat === s.beats - 1 && !hits.some(([, p]) => ['snare', 'tomh', 'toml', 'bsnare', 'conga', 'congam', 'tumba'].includes(p))) out.noFillOnLast.push(`${s.key} L${L} ${bpm}`);
        const kicks = plain.filter(([, p]) => p === 'kick' || p === 'bkick').length;
        if (hits.filter(([, p]) => p === 'kick' || p === 'bkick').length < kicks) out.kickLost.push(`${s.key} bar ${bar} beat ${beat}`);
      }
    }
    out.swingClash = [...new Set(out.swingClash.map((x) => x.split(' ')[0] + ' ' + x.split(' ')[1]))].concat(out.swingClash.slice(0, 3));
    out.crashMissing = [...new Set(out.crashMissing)];
    out.noFillOnLast = [...new Set(out.noFillOnLast)].slice(0, 20);
    return out;
  };
  window.__sim19ready = true;
})();
