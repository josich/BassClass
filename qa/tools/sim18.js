// QA round 18 (f15a4eb): the room's engine on a FAKE clock, with the arpeggio (arpNote: a triangle and a sine an
// octave up, stopped 2 s after their start) and what Stop / a tempo change cut (a disconnected gain).
// Classic script (imports the app by absolute URL, the same module instances); needs one real click first
// (a running AudioContext), and the drum kit for drum hits: await (await import('/js/drums.js')).loadKit()
//   __sim18(opts, secs, during)   -> { ev: [{ k: 'osc' | 'drum', type, f, when, stop, cut }], ticks, chords, r }
//   __arp18()                     -> the arpeggio checks (feel, extremes, Stop, tempo change, sound switch)
//   __accents18()                 -> click levels per beat against the accents, and regrouped drums per beat
(() => {
  const M = (p) => import(location.origin + p);
  const CLICK_F = [900, 1175, 1480, 1760];
  window.__sim18 = async (opts, secs, during) => {
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
    AudioBufferSourceNode.prototype.start = function (when = 0) { const e = { k: 'drum', when: +(when - 1000).toFixed(6), node: this }; ev.push(e); };
    AudioBufferSourceNode.prototype.stop = function () {};
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
    // a sound is cut when a node on its way out (up to 3 hops) was disconnected
    for (const e of ev) { let n = e.node, cut = false; for (let h = 0; h < 4 && n; h++) { if (n.__cut) { cut = true; break; } n = n.__to; } e.cut = cut; delete e.node; }
    return { ev, ticks, chords, r, stoppedAt };
  };
  const isClick = (e) => e.type === 'sine' && CLICK_F.includes(Math.round(e.f)) && Math.abs(e.stop - e.when - 0.07) < 1e-6;
  const isArp = (e) => e.type === 'triangle' && e.stop != null && Math.abs(e.stop - e.when - 2) < 1e-6;
  window.__isArp18 = isArp; window.__isClick18 = isClick;

  const base = { bpm: 120, beats: 4, sub: 2, accents: [0], click: true, play: 2, mute: 0, speedUp: false, upBy: 2, upEvery: 4, upTo: 200, drums: false, style: 'rock8', countIn: false, harmony: 'chords', hProg: 'blues', hKey: 9, notation: 'letters', hSound: 'arp', myProg: [{ d: 0, q: 'maj', b: 4 }], myMinor: false };

  window.__arp18 = async () => {
    const { STYLES, clickTimes, levelsOf } = await M('/js/practice/styles.js');
    const out = { feel: [], extremes: [], stop: null, tempo: null, switch: null, muted: null, countIn: null };
    // 1. the arpeggio's notes inside a beat against the clicks (the drums' feel), every pattern and subdivision
    for (const s of Object.values(STYLES)) for (const L of levelsOf(s)) {
      const sim = await window.__sim18({ ...base, drums: true, style: s.key, beats: s.beats, sub: L, bpm: 100 }, 3);
      const t0s = sim.ticks.filter((t) => !t.count).map((t) => t.time);
      const len = 60 / 100;
      const arp = sim.ev.filter(isArp).map((e) => e.when);
      const want = clickTimes(s, L);
      // per beat: the arp's offsets in the beat
      const beat = t0s[2];
      const offs = arp.filter((w) => w >= beat - 1e-6 && w < beat + len - 1e-6).map((w) => +((w - beat) / len).toFixed(3));
      const wantR = want.map((x) => +x.toFixed(3));
      if (offs.join() !== wantR.join()) out.feel.push(`${s.key} (grid ${s.grid}, beat ${s.beat}) L${L}: arp at ${offs.join(' ')} | clicks at ${wantR.join(' ')}`);
    }
    // 2. extremes: 1, 30, 300, 660 BPM x subdivisions 1-4, drums off: notes per beat and spacing
    for (const bpm of [1, 30, 300, 660]) for (const sub of [1, 2, 3, 4]) {
      const secs = bpm === 1 ? 130 : 6;
      const sim = await window.__sim18({ ...base, bpm, sub }, secs);
      const arp = sim.ev.filter(isArp); const len = 60 / bpm;
      const t0s = sim.ticks.map((t) => t.time);
      let bad = 0;
      for (const t0 of t0s.slice(0, -1)) { const n = arp.filter((e) => e.when >= t0 - 1e-6 && e.when < t0 + len - 1e-6); if (n.length !== sub || n.some((e, k) => Math.abs(e.when - (t0 + (k * len) / sub)) > 1e-6)) bad++; }
      const alive = (t) => arp.filter((e) => e.when <= t && e.stop > t).length;
      const tMid = t0s[Math.floor(t0s.length / 2)] ?? 0;
      out.extremes.push(`${bpm} BPM sub ${sub}: ${t0s.length} beats, ${arp.length} notes, beats with the wrong notes ${bad}, arp voices alive mid-run ${alive(tMid) * 2} oscillators`);
    }
    // 3. Stop at 30 BPM, 16ths: the notes after Stop are cut, except the one at the beat now scheduled
    {
      const sim = await window.__sim18({ ...base, bpm: 30, sub: 4 }, 5.05);
      const after = sim.ev.filter(isArp).filter((e) => e.when > sim.stoppedAt + 1e-6);
      out.stop = { stoppedAt: sim.stoppedAt, after: after.map((e) => `${e.when}${e.cut ? ' cut' : ' SOUNDS'}`) };
    }
    // 4. a tempo change at 1 BPM in the middle of a beat: the old beat's later notes are cut
    {
      let done = false;
      const sim = await window.__sim18({ ...base, bpm: 1, sub: 4 }, 25, (r, t) => { if (!done && t > 20) { done = true; r.set({ bpm: 120 }); } });
      const arp = sim.ev.filter(isArp);
      out.tempo = arp.filter((e) => e.when > 10 && e.when < 61).map((e) => `${e.when}${e.cut ? ' cut' : ''}`).slice(0, 12);
    }
    // 5. a sound switch pad -> arp -> pad while playing (the pad stops when the arpeggio starts and back)
    {
      const sw = [];
      const sim = await window.__sim18({ ...base, hSound: 'pad', bpm: 120 }, 9, (r, t) => {
        if (t > 2.3 && r.o.hSound === 'pad' && !sw.length) { sw.push(t); r.set({ hSound: 'arp' }); }
        else if (t > 5.3 && r.o.hSound === 'arp' && sw.length === 1) { sw.push(t); r.set({ hSound: 'pad' }); }
      });
      const pads = sim.ev.filter((e) => e.k === 'osc' && e.type === 'sawtooth');
      const arp = sim.ev.filter(isArp);
      out.switch = { switchedAt: sw.map((x) => +x.toFixed(3)), padStarts: [...new Set(pads.map((e) => e.when))], padStops: [...new Set(pads.map((e) => e.stop))].slice(0, 6), arpFirst: arp[0]?.when, arpLast: arp.at(-1)?.when, overlapping: arp.filter((a) => pads.some((p) => p.when <= a.when && (p.stop == null || p.stop - 1.2 > a.when + 0.05))).length };
    }
    // 6. muted bars and the count-in: no arpeggio there
    {
      const sim = await window.__sim18({ ...base, mute: 1, play: 1, countIn: true, bpm: 240 }, 8);
      const arp = sim.ev.filter(isArp);
      const bad = arp.filter((e) => { const tk = [...sim.ticks].reverse().find((t) => t.time <= e.when + 1e-6); return tk && (tk.muted || tk.count); });
      out.muted = { notes: arp.length, inMutedOrCount: bad.length, countBeats: sim.ticks.filter((t) => t.count).length, mutedBeats: sim.ticks.filter((t) => t.muted).length };
    }
    return out;
  };

  window.__accents18 = async () => {
    const { STYLES, regroup, beatHits, levelsOf } = await M('/js/practice/styles.js'); const { groupsOf } = await M('/js/practice/accents.js');
    const bad = [];
    const odd = Object.values(STYLES).filter((s) => s.groups);
    let runs = 0;
    for (const s of odd) {
      // a few player groupings per pattern (and its own)
      const subsets = [[0], s.groups.reduce((a, g, i) => (a.push(i ? a[i - 1] + s.groups[i - 1] : 0), a), []), [0, 3], [0, 2, 4], [0, 1], [0, s.beats - 1], [2, 4]].filter((l) => l.every((b) => b < s.beats));
      for (const acc of subsets) {
        runs++;
        const sim = await window.__sim18({ ...base, harmony: 'off', drums: true, style: s.key, beats: s.beats, sub: s.sub, bpm: 100, accents: acc }, (60 / 100) * s.beats * 2 + 0.3);
        // click levels: the first click of each beat (sine at 1760 accent, 1480 group, 1175 beat)
        const clicks = sim.ev.filter(isClick);
        for (const t of sim.ticks) {
          const c = clicks.find((e) => Math.abs(e.when - t.time) < 1e-6);
          const want = acc.includes(t.beat) ? (t.beat === 0 ? 1760 : 1480) : 1175;
          if (!c || Math.round(c.f) !== want) bad.push(`${s.key} acc ${acc.join(',')} beat ${t.beat}: click ${c ? Math.round(c.f) : 'none'} want ${want}`);
        }
        // drums: the hits per beat are those of the regrouped pattern
        const r = regroup(s, groupsOf(s.beats, acc));
        const drums = sim.ev.filter((e) => e.k === 'drum');
        for (const t of sim.ticks) {
          const n = drums.filter((e) => e.when >= t.time - 1e-6 && e.when < t.time + 0.6 - 1e-6).length;
          const want = beatHits(r, levelsOf(r).includes(s.sub) ? s.sub : r.sub, t.bar, t.beat).length;
          if (n !== want) bad.push(`${s.key} acc ${acc.join(',')} bar ${t.bar} beat ${t.beat}: ${n} hits, regrouped pattern has ${want}`);
        }
      }
    }
    return { runs, nBad: bad.length, bad: bad.slice(0, 30) };
  };
  window.__sim18ready = true;
})();
