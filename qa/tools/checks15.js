// QA round 15 (77c1e47) checks against known answers for the Practice room's harmony and the louder
// drum chain. Paste into the qa tab (http://localhost:8878) after one real click on Start (audio
// unlocked) and after the drum kit has loaded (`await (await import('/js/drums.js')).loadKit()`).
//
// window.__sim15(opts, secs, during?) : drives a practice/engine.js Room through its real start() with a
//   FAKE audio clock and records every oscillator start/stop (clicks are 'sine', the pad 'sawtooth' and
//   'triangle'), every drum buffer start, the onTick ticks and the onChord changes (times from the fake
//   start). `during(room, t)` runs after each 25 ms tick (to change options mid-play).
// window.__cap15(opts, secs) : the same, but also captures, for every drum hit, its AudioBuffer, its gain
//   and its choke (setTargetAtTime on that gain), for an offline render.
// window.__render15({ style, drumVol, clickVol, click, harmony, hProg, hKey, hVol, bars, sub, bpm }) :
//   offline render of what the room plays, through a copy of audio.js's output graph after the bass limiter:
//   drum bus (drumVol) -> glue comp (-20 dB, knee 10, 2.5:1, 8 ms, 200 ms) -> x1.4 -> limiter (-10 dB,
//   knee 0, 20:1, 0 ms, 50 ms) -> x0.84, plus the click bus (clickVol) and the pad bus (0.38 x padVol,
//   lowpass 1500 Hz), summed at the soft clip's input. Returns the peak at the clip input (dBFS), the
//   share of samples above the knee (0.85) and above 1 (saturated), and the drum chain's own peak.
window.__sim15 = async (opts, secs, during) => {
  const A = await import('/js/audio.js'); const { Room } = await import('/js/practice/engine.js');
  const ac = A.audioCtx();
  let fake = 1000;
  const P = { oS: OscillatorNode.prototype.start, bS: AudioBufferSourceNode.prototype.start, oT: OscillatorNode.prototype.stop, bT: AudioBufferSourceNode.prototype.stop };
  const ev = [], ticks = [], chords = [];
  Object.defineProperty(ac, 'currentTime', { get: () => fake, configurable: true });
  OscillatorNode.prototype.start = function (when = 0) { ev.push({ k: this.type === 'sine' ? 'click' : 'pad', type: this.type, when: +(when - 1000).toFixed(6), midi: Math.round(69 + 12 * Math.log2(this.frequency.value / 440)), f: this.frequency.value, node: this }); };
  OscillatorNode.prototype.stop = function (when = 0) { ev.push({ k: 'stop', type: this.type, when: +(when - 1000).toFixed(6), node: this }); };
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

window.__cap15 = async (opts, secs) => {
  const A = await import('/js/audio.js'); const { Room } = await import('/js/practice/engine.js');
  const ac = A.audioCtx();
  let fake = 1000;
  const P = { oS: OscillatorNode.prototype.start, bS: AudioBufferSourceNode.prototype.start, oT: OscillatorNode.prototype.stop, bT: AudioBufferSourceNode.prototype.stop, con: AudioNode.prototype.connect, sT: AudioParam.prototype.setTargetAtTime };
  const hits = [], oscs = [], stops = new Map();
  const srcGain = new WeakMap(), paramHit = new WeakMap();
  Object.defineProperty(ac, 'currentTime', { get: () => fake, configurable: true });
  AudioNode.prototype.connect = function (dest, ...rest) { if (this instanceof AudioBufferSourceNode && dest instanceof GainNode) srcGain.set(this, dest); return P.con.call(this, dest, ...rest); };
  AudioBufferSourceNode.prototype.start = function (when = 0) { const g = srcGain.get(this); const h = { buf: this.buffer, when: when - 1000, gain: g ? g.gain.value : 1, choke: null }; hits.push(h); if (g) paramHit.set(g.gain, h); };
  AudioBufferSourceNode.prototype.stop = function () {};
  AudioParam.prototype.setTargetAtTime = function (target, when, tc) { const h = paramHit.get(this); if (h && target === 0) h.choke = { when: when - 1000, tc }; return P.sT.call(this, target, when, tc); };
  OscillatorNode.prototype.start = function (when = 0) { oscs.push({ node: this, type: this.type, f: this.frequency.value, when: when - 1000 }); };
  OscillatorNode.prototype.stop = function (when = 0) { stops.set(this, when - 1000); };
  const r = new Room(opts, {});
  try {
    await r.start(); clearInterval(r.timer);
    for (let i = 0; i < Math.round(secs / 0.025); i++) { fake += 0.025; r._tick(); }
    r.stop();
  } finally {
    clearInterval(r.timer);
    delete ac.currentTime;
    Object.assign(OscillatorNode.prototype, { start: P.oS, stop: P.oT });
    Object.assign(AudioBufferSourceNode.prototype, { start: P.bS, stop: P.bT });
    AudioNode.prototype.connect = P.con; AudioParam.prototype.setTargetAtTime = P.sT;
  }
  for (const o of oscs) o.stop = stops.get(o.node) ?? null;
  return { hits, oscs };
};

window.__render15 = async ({ style = 'rock8', drumVol = 0.8, clickVol = 0.6, click = true, harmony = 'off', hProg = 'blues', hKey = 9, hVol = 70, bars = 4, sub, bpm, drums = true, beats } = {}) => {
  const { STYLES } = await import('/js/practice/styles.js');
  const s = STYLES[style];
  const B = bpm ?? s.bpm;
  const secs = (bars * (beats ?? s.beats) * 60) / B;
  const opts = { bpm: B, beats: beats ?? s.beats, sub: sub ?? s.sub, accent: true, click, play: 2, mute: 0, upBy: 0, upEvery: 4, upTo: 660, drums, style, countIn: false, harmony, hProg, hKey, notation: 'letters' };
  const { hits, oscs } = await window.__cap15(opts, secs + 0.2);
  const sr = 48000, len = Math.ceil((secs + 2.5) * sr);
  const oc = new OfflineAudioContext(2, len, sr);
  const comp = (threshold, knee, ratio, attack, release) => { const c = oc.createDynamicsCompressor(); Object.assign(c, {}); c.threshold.value = threshold; c.knee.value = knee; c.ratio.value = ratio; c.attack.value = attack; c.release.value = release; return c; };
  const sum = oc.createGain(); sum.connect(oc.destination);
  const drumBus = oc.createGain(); drumBus.gain.value = drumVol;
  const makeup = oc.createGain(); makeup.gain.value = 1.4;
  const trim = oc.createGain(); trim.gain.value = 0.84;
  // the drum chain's own output, also rendered alone in the second channel? (no: summed; drum-only peak via a second pass)
  drumBus.connect(comp(-20, 10, 2.5, 0.008, 0.2)).connect(makeup).connect(comp(-10, 0, 20, 0, 0.05)).connect(trim).connect(sum);
  const clickBus = oc.createGain(); clickBus.gain.value = clickVol; clickBus.connect(sum);
  const padBus = oc.createGain(); padBus.gain.value = 0.38 * (hVol / 100) * 1.5;
  const padTone = oc.createBiquadFilter(); padTone.type = 'lowpass'; padTone.frequency.value = 1500; padTone.Q.value = 0.3;
  padBus.connect(padTone).connect(sum);
  for (const h of hits) {
    const src = oc.createBufferSource(); src.buffer = h.buf;
    const g = oc.createGain(); g.gain.value = h.gain;
    if (h.choke) g.gain.setTargetAtTime(0, Math.max(0, h.choke.when + 0.2), h.choke.tc);
    src.connect(g).connect(drumBus); src.start(Math.max(0, h.when + 0.2));
  }
  // pad voices grouped by start time (level 0.16 / sqrt(notes))
  const padGroups = {};
  for (const o of oscs.filter((o) => o.type !== 'sine')) (padGroups[o.when.toFixed(6)] ||= []).push(o);
  for (const grp of Object.values(padGroups)) {
    const notes = grp.length / 2, level = 0.16 / Math.sqrt(notes);
    for (let i = 0; i < grp.length; i += 2) {
      const g = oc.createGain(); g.gain.value = 0;
      const t = Math.max(0, grp[i].when + 0.2);
      g.gain.setValueAtTime(0, t); g.gain.setTargetAtTime(level, t, 0.12);
      const end = grp[i].stop != null ? grp[i].stop + 0.2 : secs + 2.4;
      if (grp[i].stop != null) g.gain.setTargetAtTime(0, end - 1.2, 0.15);
      for (const o of [grp[i], grp[i + 1]]) { const x = oc.createOscillator(); x.type = o.type; x.frequency.value = o.f; x.detune.value = o.type === 'sawtooth' ? -6 : 5; x.connect(g); x.start(t); x.stop(Math.min(end, secs + 2.4)); }
      g.connect(padBus);
    }
  }
  for (const o of oscs.filter((o) => o.type === 'sine')) {
    const f = o.f, level = f === 1760 ? 2 : f === 1480 ? 1.5 : f === 1175 ? 1 : 0;
    const v = level === 2 ? 0.9 : level === 1.5 ? 0.75 : level === 1 ? 0.6 : 0.25;
    const t = Math.max(0, o.when + 0.2);
    const x = oc.createOscillator(); x.type = 'sine'; x.frequency.value = f;
    const g = oc.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.001); g.gain.exponentialRampToValueAtTime(0.0001, t + (level === 0 ? 0.03 : 0.05));
    x.connect(g).connect(clickBus); x.start(t); x.stop(t + 0.07);
  }
  const buf = await oc.startRendering();
  let peak = 0, overKnee = 0, overOne = 0, n = 0, ss = 0;
  for (let c = 0; c < buf.numberOfChannels; c++) { const d = buf.getChannelData(c); for (let i = 0; i < d.length; i++) { const a = Math.abs(d[i]); if (a > peak) peak = a; if (a > 0.85) overKnee++; if (a > 1) overOne++; ss += d[i] * d[i]; n++; } }
  const db = (x) => +(20 * Math.log10(x)).toFixed(2);
  return { style, bpm: B, hits: hits.length, peak: +peak.toFixed(4), peakDb: db(peak), rmsDb: db(Math.sqrt(ss / n)), overKneePct: +((100 * overKnee) / n).toFixed(4), overOnePct: +((100 * overOne) / n).toFixed(4) };
};
