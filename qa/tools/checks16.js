// QA round 16 (70c3e4e) checks against known answers: the room's engine on a fake clock, and offline
// renders of the new accompaniment chain (audio.js: drumChain -> drum volume -> accompaniment limiter
// (-6 dB, knee 0, 20:1, 1 ms, 80 ms; Chrome adds its automatic make-up gain) -> x0.85 -> clip; the pad
// through lowpass (padTone) -> pad limiter (-8 dB, knee 6, 12:1, 10 ms, 250 ms) -> the same limiter; the
// click at clickVol / 0.85 into it) against the 77c1e47 chain (click and pad straight into the clip).
// Paste into the qa tab after one real click (audio unlocked) and `await (await import('/js/drums.js')).loadKit()`.
//
// __sim16(opts, secs, during) : a Room through its real start() on a FAKE clock; records clicks (with
//   `cut` when the engine disconnected their gain), pad oscillators, drum starts (with `cut`), ticks, chords.
// __drums16(key, { sub, bars, gain }) : one pattern rendered through drumChain at 100% (like the app:
//   voice() x styleGain x trackGain), returns { db (A-weighted, frames of 4096), peak }.
// __room16({ style, sub, drumVol, clickVol, hVol, chords (midi arrays per bar), bars, clip }) : the room's whole
//   accompaniment through the new chain; peak / RMS at the clip input.
// __ex16({ chain: 'old' | 'new', clickVol, pad (midis), levels, bpm }) : an exercise's click and Backing pad
//   through either chain; per-click peaks and the pad's RMS.
window.__sim16 = async (opts, secs, during) => {
  const A = await import('/js/audio.js'); const { Room } = await import('/js/practice/engine.js');
  const ac = A.audioCtx();
  let fake = 1000;
  const P = { oS: OscillatorNode.prototype.start, bS: AudioBufferSourceNode.prototype.start, oT: OscillatorNode.prototype.stop, bT: AudioBufferSourceNode.prototype.stop, con: AudioNode.prototype.connect, dis: AudioNode.prototype.disconnect };
  const ev = [], ticks = [], chords = [];
  const byGain = new Map();
  Object.defineProperty(ac, 'currentTime', { get: () => fake, configurable: true });
  AudioNode.prototype.connect = function (dest, ...rest) { if ((this instanceof OscillatorNode || this instanceof AudioBufferSourceNode) && dest instanceof GainNode) this.__g = dest; return P.con.call(this, dest, ...rest); };
  AudioNode.prototype.disconnect = function (...a) { const e = byGain.get(this); if (e) { e.cut = true; e.cutAt = +(fake - 1000).toFixed(4); } return P.dis.apply(this, a); };
  OscillatorNode.prototype.start = function (when = 0) { const e = { k: this.type === 'sine' ? 'click' : 'pad', type: this.type, when: +(when - 1000).toFixed(6), midi: Math.round(69 + 12 * Math.log2(this.frequency.value / 440)), f: this.frequency.value }; ev.push(e); if (this.__g) byGain.set(this.__g, e); this.__e = e; };
  OscillatorNode.prototype.stop = function (when = 0) { if (this.__e) this.__e.stop = +(when - 1000).toFixed(6); };
  AudioBufferSourceNode.prototype.start = function (when = 0) { const e = { k: 'drum', when: +(when - 1000).toFixed(6) }; ev.push(e); if (this.__g) byGain.set(this.__g, e); };
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
    AudioNode.prototype.connect = P.con; AudioNode.prototype.disconnect = P.dis;
  }
  return { ev, ticks, chords, r };
};

// ---- A-weighted loudness (the same method as the dev tool, re-implemented here)
const __fft = (re, im) => {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len, wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) { let cr = 1, ci = 0; for (let k = 0; k < len / 2; k++) { const a = i + k, b = a + len / 2; const vr = re[b] * cr - im[b] * ci, vi = re[b] * ci + im[b] * cr; re[b] = re[a] - vr; im[b] = im[a] - vi; re[a] += vr; im[a] += vi; [cr, ci] = [cr * wr - ci * wi, cr * wi + ci * wr]; } }
  }
};
const __aw = (f) => { const f2 = f * f; const ra = (12194 ** 2 * f2 * f2) / ((f2 + 20.6 ** 2) * Math.sqrt((f2 + 107.7 ** 2) * (f2 + 737.9 ** 2)) * (f2 + 12194 ** 2)); return ra * ra * 10 ** 0.2; };
window.__aLoud16 = (chans, sr) => {
  const F = 4096; let e = 0; const W = new Float64Array(F / 2); for (let k = 1; k < F / 2; k++) W[k] = __aw((k * sr) / F);
  for (const d of chans) for (let at = 0; at + F <= d.length; at += F) { const re = new Float64Array(F), im = new Float64Array(F); re.set(d.subarray(at, at + F)); __fft(re, im); for (let k = 1; k < F / 2; k++) e += (2 * (re[k] ** 2 + im[k] ** 2) * W[k]) / F; }
  return 10 * Math.log10(e / chans.length / chans[0].length);
};
const __stats = (buf, from = 0) => {
  let peak = 0, ss = 0, n = 0, over = 0;
  for (let c = 0; c < buf.numberOfChannels; c++) { const d = buf.getChannelData(c); for (let i = Math.floor(from * buf.sampleRate); i < d.length; i++) { const x = Math.abs(d[i]); if (x > peak) peak = x; ss += x * x; n++; if (x > 0.85) over++; } }
  return { peak: +(20 * Math.log10(peak)).toFixed(2), rms: +(10 * Math.log10(ss / n)).toFixed(2), overKnee: over };
};
const __comp = (oc, threshold, knee, ratio, attack, release) => { const c = oc.createDynamicsCompressor(); c.threshold.value = threshold; c.knee.value = knee; c.ratio.value = ratio; c.attack.value = attack; c.release.value = release; return c; };

/** Schedule one pattern's hits (as the engine does) into `dest` of the offline context `oc`. */
const __hits16 = async (oc, dest, s, L, bars, t0 = 0.05, gainMul = 1, bpm = s.bpm) => {
  const { voice, styleGain, trackGain } = await import('/js/drums.js'); const { beatHits } = await import('/js/practice/styles.js');
  const len = 60 / bpm; let openHat = null; let n = 0;
  for (let bar = 0; bar < bars; bar++) for (let beat = 0; beat < s.beats; beat++) {
    const tb = t0 + (bar * s.beats + beat) * len;
    for (const [f, piece, v] of beatHits(s, L, bar, beat)) {
      const vc = voice(piece, v); if (!vc) continue;
      const t = tb + f * len; const src = oc.createBufferSource(); src.buffer = vc.buffer;
      const g = oc.createGain(); g.gain.value = vc.gain * styleGain(s.key) * trackGain(s, piece) * gainMul;
      src.connect(g).connect(dest); src.start(t); n++;
      if (/^hh[chp]$/.test(piece) && openHat) { openHat.gain.setTargetAtTime(0, t, 0.015); openHat = null; }
      if (piece === 'hho') openHat = g;
    }
  }
  return n;
};

window.__drums16 = async (key, { sub, bars = 8, gain = 1 } = {}) => {
  const { drumChain } = await import('/js/audio.js'); const { STYLES } = await import('/js/practice/styles.js');
  const s = STYLES[key]; const SR = 48000; const len = 60 / s.bpm;
  const oc = new OfflineAudioContext(2, Math.ceil((bars * s.beats * len + 1) * SR), SR);
  const ch = drumChain(oc); ch.output.connect(oc.destination);
  await __hits16(oc, ch.input, s, sub ?? s.sub, bars, 0.05, gain);
  const buf = await oc.startRendering();
  const st = __stats(buf);
  return { db: +window.__aLoud16([buf.getChannelData(0), buf.getChannelData(1)], SR).toFixed(2), peak: st.peak };
};

/** The pad voices as audio.js plays them (padSet), into `dest`. */
const __pad16 = (oc, dest, midis, when, until) => {
  const level = 0.16 / Math.sqrt(midis.length);
  for (const m of midis) {
    const g = oc.createGain(); g.gain.value = 0; g.gain.setValueAtTime(0, when); g.gain.setTargetAtTime(level, when, 0.12);
    if (until != null) { g.gain.cancelAndHoldAtTime?.(until); g.gain.setTargetAtTime(0, until, 0.15); }
    for (const [type, cents] of [['sawtooth', -6], ['triangle', 5]]) { const o = oc.createOscillator(); o.type = type; o.frequency.value = 440 * 2 ** ((m - 69) / 12); o.detune.value = cents; o.connect(g); o.start(when); o.stop((until ?? when + 30) + 1.2); }
    g.connect(dest);
  }
};
/** One click as audio.js plays it (click), into `dest`. */
const __click16 = (oc, dest, when, level) => {
  const o = oc.createOscillator(); const g = oc.createGain(); o.type = 'sine';
  o.frequency.value = level === 2 ? 1760 : level === 1.5 ? 1480 : level === 1 ? 1175 : 900;
  const v = level === 2 ? 0.9 : level === 1.5 ? 0.75 : level === 1 ? 0.6 : 0.25;
  g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(v, when + 0.001); g.gain.exponentialRampToValueAtTime(0.0001, when + (level === 0 ? 0.03 : 0.05));
  o.connect(g).connect(dest); o.start(when); o.stop(when + 0.07);
};
const __clipCurve = () => { const c = new Float32Array(4097); for (let i = 0; i < c.length; i++) { const x = i / 2048 - 1, ax = Math.abs(x); c[i] = Math.sign(x) * (ax <= 0.85 ? ax : 0.85 + 0.15 * Math.tanh((ax - 0.85) / 0.15)); } return c; };

/** The new accompaniment graph (70c3e4e) in `oc`: returns { click, pad, drums, out } (out = the clip input). */
const __newGraph = async (oc, { clickVol = 0.6, padVol = 1, padTone = 1500, drumVol = 0.8 } = {}) => {
  const { drumChain } = await import('/js/audio.js');
  const out = oc.createGain();
  const accomp = __comp(oc, -6, 0, 20, 0.001, 0.08); const trim = oc.createGain(); trim.gain.value = 0.85; accomp.connect(trim).connect(out);
  const click = oc.createGain(); click.gain.value = clickVol / 0.85; click.connect(accomp);
  const pad = oc.createGain(); pad.gain.value = 0.38 * padVol; const lp = oc.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = padTone; lp.Q.value = 0.3;
  pad.connect(lp).connect(__comp(oc, -8, 6, 12, 0.01, 0.25)).connect(accomp);
  const ch = drumChain(oc); const dv = oc.createGain(); dv.gain.value = drumVol; ch.output.connect(dv).connect(accomp);
  return { click, pad, drums: ch.input, out, accomp };
};
/** The 77c1e47 graph: click and pad straight into the clip. */
const __oldGraph = async (oc, { clickVol = 0.6, padVol = 1 } = {}) => {
  const out = oc.createGain();
  const click = oc.createGain(); click.gain.value = clickVol; click.connect(out);
  const pad = oc.createGain(); pad.gain.value = 0.38 * padVol; const lp = oc.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1500; lp.Q.value = 0.3; pad.connect(lp).connect(out);
  return { click, pad, out };
};

window.__ex16 = async ({ chain = 'new', clickVol = 0.6, pad = [48, 52, 55, 59], levels = [2, 0, 1, 0, 1, 0, 1, 0], bpm = 100, bars = 2, padOn = true, clickOn = true } = {}) => {
  const SR = 48000; const beat = 60 / bpm; const per = levels.length / 4; const secs = bars * 4 * beat + 1;
  const oc = new OfflineAudioContext(1, Math.ceil(secs * SR), SR);
  const G = chain === 'new' ? await __newGraph(oc, { clickVol }) : await __oldGraph(oc, { clickVol });
  G.out.connect(oc.destination);
  const times = [];
  if (clickOn) for (let b = 0; b < bars; b++) levels.forEach((L, i) => { const t = 0.5 + b * 4 * beat + (i / per) * beat; times.push([t, L]); __click16(oc, G.click, t, L); });
  if (padOn) __pad16(oc, G.pad, pad, 0.05, null);
  const buf = await oc.startRendering(); const d = buf.getChannelData(0);
  const pk = (a, b) => { let m = 0; for (let i = Math.floor(a * SR); i < Math.min(d.length, Math.floor(b * SR)); i++) m = Math.max(m, Math.abs(d[i])); return +(20 * Math.log10(m)).toFixed(2); };
  const rms = (a, b) => { let s = 0, n = 0; for (let i = Math.floor(a * SR); i < Math.floor(b * SR); i++) { s += d[i] * d[i]; n++; } return +(10 * Math.log10(s / n)).toFixed(2); };
  const byLevel = {};
  for (const [t, L] of times) (byLevel[L] ||= []).push(pk(t, t + 0.06));
  return { clicks: Object.fromEntries(Object.entries(byLevel).map(([L, a]) => [L, Math.max(...a)])), padRms: padOn ? rms(0.45, 0.5) : null, padRmsLate: padOn ? rms(secs - 0.6, secs - 0.1) : null, peak: pk(0, secs) };
};

/** The room's accompaniment at once: a pattern (or none), the click on its levels, the pad's chords. */
window.__room16 = async ({ style = 'rock8', sub, drumVol = 1, clickVol = 1.5, hVol = 100, chords = [[52, 56, 59, 62, 66]], bars = 4, drums = true, click = true, bpm } = {}) => {
  const { STYLES, clickTimes } = await import('/js/practice/styles.js');
  const s = STYLES[style]; const B = bpm ?? s.bpm; const L = sub ?? s.sub; const len = 60 / B; const SR = 48000;
  const secs = bars * s.beats * len + 1.5;
  const oc = new OfflineAudioContext(2, Math.ceil(secs * SR), SR);
  const G = await __newGraph(oc, { clickVol, padVol: (hVol / 100) * 2.5, padTone: 3200, drumVol });
  G.out.connect(oc.destination);
  if (drums) await __hits16(oc, G.drums, s, L, bars, 0.05, 1, B);
  if (click) for (let bar = 0; bar < bars; bar++) for (let beat = 0; beat < s.beats; beat++) { const t0 = 0.05 + (bar * s.beats + beat) * len; clickTimes(s, L).forEach((f, k) => __click16(oc, G.click, t0 + f * len, k ? 0 : beat === 0 ? 2 : 1)); }
  if (chords) chords.forEach((m, i) => { const per = bars / chords.length; __pad16(oc, G.pad, m, 0.05 + i * per * s.beats * len, i < chords.length - 1 ? 0.05 + (i + 1) * per * s.beats * len : null); });
  const buf = await oc.startRendering();
  return __stats(buf, 0.05);
};
'checks16 loaded';

// ---- also run inline this round (kept here so the next run can repeat them)
// __harmFuzz16(seed, secs): a Room on the fake clock with a random patch every 0.5-3.5 s (pattern, drums,
// beats 1-12, key, progression, mode, My progression of whole bars, muted bars, tempo 120-520); checks that
// the chord's place counts 0, 1, 2… inside each chord, that the form (chord 0) always starts on a bar line,
// and that the pad never starts in a muted or count-in beat. Seed 1606, 120 s: 467 beats, 60 changes, 0 problems.
window.__harmFuzz16 = async (seed = 1606, secs = 120) => {
  const H = await import('/js/practice/harmony.js'); const { STYLES } = await import('/js/practice/styles.js');
  let s = seed; const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; const pick = (a) => a[Math.floor(rnd() * a.length)];
  const progs = H.PROG_KEYS.filter((k) => k !== 'mine'); const styles = Object.keys(STYLES);
  const wholeMine = () => { const l = Array.from({ length: 1 + Math.floor(rnd() * 6) }, () => ({ d: Math.floor(rnd() * 12), q: pick(H.QUALITIES)[0], b: pick([4, 8, 16, 2]) })); if (l.reduce((a, c) => a + c.b, 0) % 4) l.push({ d: 0, q: 'maj7', b: 2 }); return l; };
  const base = { bpm: 200, beats: 4, sub: 2, accent: true, click: true, play: 3, mute: 0, speedUp: false, upBy: 2, upEvery: 4, upTo: 200, drums: false, style: 'rock8', countIn: true, harmony: 'chords', hProg: 'blues', hKey: 0, notation: 'letters', myProg: wholeMine() };
  let nextAt = 1; const changes = [];
  const sim = await window.__sim16(base, secs, (r, t) => {
    if (t < nextAt) return; nextAt = t + 0.5 + rnd() * 3;
    const k = pick(['style', 'drums', 'beats', 'hKey', 'hProg', 'harmony', 'myProg', 'mute', 'bpm']); let p;
    if (k === 'style') { const st = STYLES[pick(styles)]; p = { style: st.key, drums: true, beats: st.beats, sub: st.sub }; }
    else if (k === 'drums') p = { drums: !r.o.drums };
    else if (k === 'beats') p = { drums: false, beats: 1 + Math.floor(rnd() * 12) };
    else if (k === 'hKey') p = { hKey: Math.floor(rnd() * 12) };
    else if (k === 'hProg') p = { hProg: pick(progs) };
    else if (k === 'harmony') p = { harmony: pick(['off', 'drone', 'chords', 'chords']) };
    else if (k === 'myProg') p = { hProg: 'mine', myProg: wholeMine() };
    else if (k === 'mute') p = { mute: pick([0, 0, 1, 2]), play: 1 + Math.floor(rnd() * 3) };
    else p = { bpm: 120 + Math.floor(rnd() * 400) };
    changes.push(p); r.set(p);
  });
  const bad = []; const T = sim.ticks;
  for (let i = 1; i < T.length; i++) { const a = T[i - 1], b = T[i]; if (a.chord && b.chord && b.chord.at !== 0 && b.chord.at !== a.chord.at + 1) bad.push(`at ${a.chord.at}->${b.chord.at}`); }
  for (const c of sim.chords) { if (c.idx !== 0) continue; const tk = T.find((x) => Math.abs(x.time - c.time) < 1e-6); if (tk && tk.beat !== 0) bad.push(`form restarts mid-bar @${tk.bar}.${tk.beat}`); }
  for (const p of sim.ev.filter((e) => e.k === 'pad')) { const tk = T.find((x) => Math.abs(x.time - p.when) < 1e-6); if (tk && (tk.muted || tk.count)) bad.push(`pad in a ${tk.muted ? 'muted' : 'count-in'} beat`); }
  return { beats: T.length, changes: changes.length, bad };
};
// Picker repros (real input, computer tool): with the Drums row at the screen's middle (800x380), a
// double_click on "Change" picks the card under the pointer; a left_click on "Change" then key "Return"
// opens a second picker (focus stays on the button behind the backdrop).
