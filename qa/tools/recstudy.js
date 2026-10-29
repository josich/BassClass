// QA study, 2026-10-29 (qa/reports/2026-10-29-study-recording.md): can BassClass judge a recorded take with classic
// DSP (no machine learning, no server)? Not part of the app. Classic script: serve qa/tools on :8882 and add
// <script src="http://127.0.0.1:8882/recstudy.js"> from the qa tab (localhost:8878); it imports the app's modules by
// absolute URL. It renders "takes" from the app's own bass samples (web/audio/bass/, the same envelopes as playNote)
// with KNOWN answers (timing errors, wrong / missed / extra notes, ringing strings, pitched ghosts, legato notes,
// uneven fingers), through a model of a phone's microphone with the app's click and pad leaking in, then runs a
// prototype analyser (spectral-flux onsets, score-informed alignment, the tuner's yin per note, Goertzel checks for
// ringing) and scores it against the answers.
//   await __rs.take({ id, params, strings, bpm, sub, perf, cond })   one take: { truth, found, eval }
//   await __rs.suite()                                                the report's tables (window.__rsOut)
(() => {
  const SR = 48000;   // a phone's AudioContext rate
  const AR = 12000;   // the analysis rate (the tuner's: 48 kHz / 4)
  const M = (p) => import(location.origin + p);

  // ------------------------------------------------------------------ small tools
  const rng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const gauss = (r) => { let u = 0; while (!u) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); };
  const db = (x) => 20 * Math.log10(Math.max(1e-12, x));
  const midiF = (m) => 440 * 2 ** ((m - 69) / 12);
  const median = (a) => { if (!a.length) return NaN; const s = [...a].sort((x, y) => x - y); const k = s.length >> 1; return s.length % 2 ? s[k] : (s[k - 1] + s[k]) / 2; };
  const mean = (a) => a.reduce((s, v) => s + v, 0) / (a.length || 1);
  const sd = (a) => { const m = mean(a); return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / Math.max(1, a.length - 1)); };
  const pct = (a, p) => { if (!a.length) return NaN; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
  const r1 = (x) => Math.round(x * 10) / 10;

  function biquad(x, type, f0, Q, sr, gainDb = 0) {
    const w = 2 * Math.PI * f0 / sr, cw = Math.cos(w), sw = Math.sin(w), al = sw / (2 * Q), A = 10 ** (gainDb / 40);
    let b0, b1, b2, a0, a1, a2;
    if (type === 'lp') { b0 = (1 - cw) / 2; b1 = 1 - cw; b2 = b0; a0 = 1 + al; a1 = -2 * cw; a2 = 1 - al; }
    else if (type === 'hp') { b0 = (1 + cw) / 2; b1 = -(1 + cw); b2 = b0; a0 = 1 + al; a1 = -2 * cw; a2 = 1 - al; }
    else if (type === 'notch') { b0 = 1; b1 = -2 * cw; b2 = 1; a0 = 1 + al; a1 = -2 * cw; a2 = 1 - al; }
    else if (type === 'peak') { b0 = 1 + al * A; b1 = -2 * cw; b2 = 1 - al * A; a0 = 1 + al / A; a1 = -2 * cw; a2 = 1 - al / A; }
    b0 /= a0; b1 /= a0; b2 /= a0; a1 /= a0; a2 /= a0;
    const y = new Float32Array(x.length);
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < x.length; i++) { const v = b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v; }
    return y;
  }

  function fft(re, im) {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) {
      let bit = n >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; }
    }
    for (let len = 2; len <= n; len <<= 1) {
      const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang), half = len >> 1;
      for (let i = 0; i < n; i += len) {
        let cr = 1, ci = 0;
        for (let k = 0; k < half; k++) {
          const a = i + k, b = a + half;
          const tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr;
          re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
          const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr;
        }
      }
    }
  }

  // Goertzel power of `f` over x[a..b) with a Hann window (relative, per sample)
  function goertzel(x, a, b, f, sr) {
    const n = b - a; if (n < 8) return 0;
    const w = 2 * Math.PI * f / sr, c = 2 * Math.cos(w);
    let s1 = 0, s2 = 0;
    for (let i = 0; i < n; i++) { const win = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (n - 1)); const s = x[a + i] * win + c * s1 - s2; s2 = s1; s1 = s; }
    const p = s1 * s1 + s2 * s2 - c * s1 * s2;
    return p / (n * n);
  }

  // ------------------------------------------------------------------ the app's bass samples
  let BANK = null;
  async function bank() {
    if (BANK) return BANK;
    const man = await (await fetch('/audio/bass/manifest.json')).json();
    const oc = new OfflineAudioContext(1, 1, SR);
    const load = async (kind) => {
      const m = new Map();
      await Promise.all(Object.entries(man[kind] || {}).map(async ([midi, file]) => {
        const buf = await oc.decodeAudioData(await (await fetch('/audio/bass/' + file)).arrayBuffer());
        m.set(+midi, buf);
      }));
      return m;
    };
    BANK = { reg: await load('reg'), ghost: await load('ghost'), lead: new Map() };
    // each sample's physical start: its first sample over 1% of its peak (the files are trimmed to the pluck)
    for (const [m, b] of BANK.reg) {
      const d = b.getChannelData(0); let pk = 0;
      for (let i = 0; i < d.length; i++) pk = Math.max(pk, Math.abs(d[i]));
      let i = 0; while (i < d.length && Math.abs(d[i]) < pk * 0.01) i++;
      BANK.lead.set(m, i / b.sampleRate);
    }
    return BANK;
  }
  const nearest = (map, midi) => { let best = null; for (const m of map.keys()) if (!best || Math.abs(m - midi) < Math.abs(best - midi)) best = m; return best; };

  // ------------------------------------------------------------------ the score, as the app's Player lays it out
  async function score(id, { params = {}, strings = 4, bpm = 100, sub = 2, line = null } = {}) {
    if (line) {
      // a written line: [[midi, beats], ...] in 4/4 after one count-in bar
      const spb = 60 / bpm, bpb = 4, pre = bpb * spb; let b = 0;
      const notes = line.map(([midi, beats], i) => { const n = { i, step: i, t: pre + b * spb, dur: beats * spb, midi, tag: '', vel: Math.abs(b - Math.round(b)) < 1e-6 ? 0.88 : 0.74, chord: false }; b += beats; return n; });
      const total = pre + Math.ceil(b / bpb) * bpb * spb;
      const clicks = []; for (let k = 0; k * spb < total - 1e-9; k++) clicks.push({ t: k * spb, level: k % bpb === 0 ? 2 : 1 });
      return { id: 'line', notes, clicks, total, bpm, sub, bpb, spb, pre, uniform: false };
    }
    const F = await M('/js/fretboard.js'); const I = await M('/js/curriculum/index.js'); const { Player } = await M('/js/player.js');
    const S = { strings, notation: 'letters', maxFret: 20, label: 'note', backing: 'off' };
    const t = I.byId.get(id);
    const inst = t.build({ ...I.defaultParams(t), ...params }, F.makeCtx(S), S);
    const p = new Player({}); p.load(inst); p.bpm = bpm; p.sub = sub; p._layout();
    const spb = 60 / bpm, bpb = inst.beatsPerBar || 4, pre = bpb * spb;   // one count-in bar
    const notes = [];
    inst.steps.forEach((st, i) => {
      if (st.rest || st.silent) return;
      const rel = p.starts[i], onBeat = Math.abs(rel - Math.round(rel)) < 1e-6;
      const vel = st.vel ?? (st.accent ? 1 : onBeat ? 0.88 : 0.74);
      for (const n of st.notes) notes.push({ step: i, t: pre + rel * spb, dur: p.beatsOf(st) * spb, midi: n.play ?? n.midi, tag: n.tag || '', vel, chord: st.notes.length > 1, string: n.string });
    });
    notes.sort((a, b) => a.t - b.t);
    notes.forEach((n, k) => { n.i = k; });
    const total = pre + p.total * spb;
    const clicks = [];
    for (let b = 0; b * spb < total - 1e-9; b++) clicks.push({ t: b * spb, level: b % bpb === 0 ? 2 : 1 });
    return { id, notes, clicks, total, bpm, sub, bpb, spb, pre, uniform: !!inst.uniform };
  }

  // ------------------------------------------------------------------ the player: the score played with known faults
  // perf: { seed, sd (ms), bias (ms), rushBar, rushMs, late: [[i, ms]], wrong: [[i, semis]], miss: [i],
  //         extra: [[i, semis]] (a note half-way to the next), ring: [i], pitchedGhost: true, legato: true (H/PO
  //         without a pluck), velSd (dB), uneven (dB off every second note) }
  function perform(sc, o = {}) {
    const r = rng(o.seed ?? 1);
    const truth = [];
    const notes = sc.notes;
    for (const n of notes) {
      const k = n.i;
      const tr = { ...n, played: !(o.miss || []).includes(k), dt: 0, midiPlayed: n.midi, ring: (o.ring || []).includes(k), extra: false };
      let dt = (o.bias || 0) + gauss(r) * (o.sd || 0);
      const bar = Math.floor((n.t - sc.pre + 1e-6) / (sc.bpb * sc.spb));
      tr.bar = bar;
      if (o.rushBar != null && bar === o.rushBar) dt += o.rushMs;
      for (const [i, ms] of o.late || []) if (i === k) dt += ms;
      tr.dt = dt / 1000;
      for (const [i, s] of o.wrong || []) if (i === k) tr.midiPlayed = n.midi + s;
      const gdb = (o.velSd || 0) * gauss(r) - (o.uneven && k % 2 ? o.uneven : 0);
      tr.v = n.vel;
      tr.ampDb = 1.3 * db(n.vel) + gdb;
      tr.ghost = n.tag === 'x';
      tr.legato = !!o.legato && (n.tag === 'H' || n.tag === 'PO');
      truth.push(tr);
    }
    for (const [i, s] of o.extra || []) {
      const a = notes[i], b = notes[i + 1]; if (!a || !b) continue;
      truth.push({ i: -1, t: (a.t + b.t) / 2, dt: 0, dur: (b.t - a.t) / 2, midi: a.midi + s, midiPlayed: a.midi + s, played: true, extra: true, v: 0.8, ampDb: 1.3 * db(0.8), ghost: false, tag: '', ring: false });
    }
    truth.sort((a, b) => (a.t + a.dt) - (b.t + b.dt));
    // what sounds: each note held to its length (the app's playNote: hold dur*0.94, then fingers stop it in ~50 ms),
    // a ringing note held 0.9 s more, a legato note entering without its pluck (the one before cut there)
    const ev = [];
    const played = truth.filter((x) => x.played);
    played.forEach((x, j) => {
      const on = x.t + x.dt;
      let hold = x.ghost ? Math.min(x.dur, 0.09) : Math.max(0.06, x.dur * 0.94 + (x.extra ? 0 : 0));
      if (x.ring) hold += 0.9;
      const e = { t: on, midi: x.midiPlayed, ghost: x.ghost && !o.pitchedGhost, v: x.ghost && o.pitchedGhost ? 0.45 : x.v, amp: 10 ** (x.ampDb / 20) * (x.ghost ? (o.pitchedGhost ? 0.6 : 0.55) : 1), hold, tau: x.ghost ? 0.02 : 0.05, legato: x.legato };
      if (x.legato && ev.length) { const p = ev[ev.length - 1]; p.hold = Math.max(0.01, on - p.t); p.tau = 0.004; }
      // (an extra note is played on the same string: it stops the note before it)
      if (x.extra && ev.length) { const p = ev[ev.length - 1]; p.hold = Math.min(p.hold, Math.max(0.01, on - p.t)); }
      ev.push(e);
    });
    return { truth, ev };
  }

  // ------------------------------------------------------------------ rendering (OfflineAudioContext, the app's envelopes)
  async function renderBass(ev, total) {
    const B = await bank();
    const oc = new OfflineAudioContext(1, Math.ceil((total + 1.6) * SR), SR);
    for (const e of ev) {
      const map = e.ghost ? B.ghost : B.reg;
      const sm = nearest(map, e.midi);
      const src = oc.createBufferSource(); src.buffer = map.get(sm); src.playbackRate.value = 2 ** ((e.midi - sm) / 12);
      const lp = oc.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = e.ghost ? 700 : 900 + 5200 * e.v * e.v; lp.Q.value = 0.3;
      const g = oc.createGain();
      if (e.legato) { g.gain.setValueAtTime(0, e.t); g.gain.linearRampToValueAtTime(e.amp * 0.8, e.t + 0.006); }
      else g.gain.setValueAtTime(e.amp, e.t);
      g.gain.setValueAtTime(e.legato ? e.amp * 0.8 : e.amp, e.t + e.hold);
      g.gain.setTargetAtTime(0, e.t + e.hold, e.tau);
      src.connect(lp).connect(g).connect(oc.destination);
      // (a hammer-on or pull-off: the string already sounds, no pluck: the sample entered 60 ms in)
      src.start(e.t, e.legato ? 0.06 : 0);
      src.stop(e.t + e.hold + 0.5);
    }
    return (await oc.startRendering()).getChannelData(0);
  }

  // the app's click (audio.js click()): a sine, 1 ms attack, 90 ms exponential tail
  // (vary: dB of random level change per click, jitter: ms of random timing error per click: what a real phone's
  // speaker, its automatic gain and a moving player do to the bleed, which the subtraction assumes constant)
  // high: a click made for recording (a candidate, not the app's): 4.5 / 5.3 kHz with a 4 ms smooth attack, so it
  // has no energy in the band the analyser reads (40-2500 Hz)
  async function renderClicks(clicks, total, { vary = 0, jitter = 0, seed = 11, high = false } = {}) {
    const oc = new OfflineAudioContext(1, Math.ceil((total + 1.6) * SR), SR);
    const r = rng(seed);
    for (const c0 of clicks) {
      const c = { ...c0, t: Math.max(0, c0.t + (jitter ? gauss(r) * jitter / 1000 : 0)) };
      const o = oc.createOscillator(), g = oc.createGain();
      o.frequency.value = high ? (c.level === 2 ? 5300 : 4500) : c.level === 2 ? 1760 : c.level === 1 ? 1175 : 900;
      const v = (c.level === 2 ? 0.9 : c.level === 1 ? 0.6 : 0.25) * 10 ** ((vary ? gauss(r) * vary : 0) / 20);
      if (high) {
        const curve = new Float32Array(64); for (let i = 0; i < 64; i++) curve[i] = v * (0.5 - 0.5 * Math.cos(Math.PI * i / 63));
        g.gain.setValueAtTime(0, c.t); g.gain.setValueCurveAtTime(curve, c.t, 0.004);
        g.gain.setTargetAtTime(0, c.t + 0.004, 0.02);
        o.connect(g).connect(oc.destination); o.start(c.t); o.stop(c.t + 0.15);
        continue;
      }
      g.gain.setValueAtTime(0, c.t); g.gain.linearRampToValueAtTime(v, c.t + 0.001);
      g.gain.exponentialRampToValueAtTime(0.0001, c.t + (c.level === 0 ? 0.03 : 0.09));
      o.connect(g).connect(oc.destination); o.start(c.t); o.stop(c.t + 0.11);
    }
    return (await oc.startRendering()).getChannelData(0);
  }

  // the Backing's pad (audio.js PAD_SOUNDS.pad: sawtooth -6 cents + triangle +5 cents, swelling, 1.5 kHz low-pass)
  async function renderPad(midis, from, total) {
    const oc = new OfflineAudioContext(1, Math.ceil((total + 1.6) * SR), SR);
    const lp = oc.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1500; lp.Q.value = 0.3; lp.connect(oc.destination);
    for (const m of midis) {
      const g = oc.createGain(); g.gain.setValueAtTime(0, from); g.gain.setTargetAtTime(0.2, from, 0.12); g.connect(lp);
      for (const [type, cents] of [['sawtooth', -6], ['triangle', 5]]) { const o = oc.createOscillator(); o.type = type; o.frequency.value = midiF(m) * 2 ** (cents / 1200); o.connect(g); o.start(from); o.stop(total); }
    }
    return (await oc.startRendering()).getChannelData(0);
  }

  async function webChain(x, build) {
    const oc = new OfflineAudioContext(1, x.length, SR);
    const b = oc.createBuffer(1, x.length, SR); b.copyToChannel(x, 0);
    const src = oc.createBufferSource(); src.buffer = b;
    build(oc, src).connect(oc.destination); src.start();
    return (await oc.startRendering()).getChannelData(0);
  }
  const bq = (oc, type, f, Q = 0.707, gain = 0) => { const n = oc.createBiquadFilter(); n.type = type; n.frequency.value = f; n.Q.value = Q; n.gain.value = gain; return n; };
  function roomIR(oc, rt60 = 0.35, wetDb = -14, seed = 5) {
    const r = rng(seed), len = Math.round(SR * rt60 * 1.2), b = oc.createBuffer(1, len, SR), d = b.getChannelData(0);
    let e = 0;
    for (let i = 1; i < len; i++) { d[i] = (r() * 2 - 1) * Math.exp(-6.9 * i / (SR * rt60)); e += d[i] * d[i]; }
    const k = 10 ** (wetDb / 20) / Math.sqrt(e); for (let i = 1; i < len; i++) d[i] *= k;
    d[0] = 1;
    const c = oc.createConvolver(); c.normalize = false; c.buffer = b; return c;
  }

  // the microphone: what reaches a phone's mic from the bass, by setup
  //   amp: an amp ~1 m away (the mic's low roll-off, a small room); unplugged: an unplugged solid body ~25 cm away
  //   (thin, no fundamental, quiet: the room's noise relatively louder); line: a USB interface (the best case)
  const MIC = {
    line: (oc, s) => s,
    amp: (oc, s) => s.connect(bq(oc, 'highpass', 70)).connect(bq(oc, 'highpass', 40)).connect(roomIR(oc, 0.35, -14)),
    unplugged: (oc, s) => s.connect(bq(oc, 'highpass', 180)).connect(bq(oc, 'highpass', 180)).connect(bq(oc, 'peaking', 1600, 0.8, 6)).connect(roomIR(oc, 0.3, -20)),
  };
  // the phone's own speaker heard by its own mic: nothing under ~400 Hz, a little distortion
  const SPEAKER = (oc, s) => {
    const ws = oc.createWaveShaper(); const c = new Float32Array(1025); for (let i = 0; i < c.length; i++) { const x = i / 512 - 1; c[i] = Math.tanh(1.5 * x) / Math.tanh(1.5); } ws.curve = c;
    return s.connect(bq(oc, 'highpass', 420)).connect(bq(oc, 'highpass', 420)).connect(bq(oc, 'lowpass', 7000)).connect(ws).connect(roomIR(oc, 0.3, -18, 9));
  };

  // cond: { mic: 'amp'|'unplugged'|'line', click: dB of the click's peak over the bass notes' median peak (null = none,
  //   headphones), pad: dB of the pad's RMS against the bass's RMS (null = none), noise: dB of the noise floor under the
  //   bass's median peak, agc: true (a phone's automatic gain riding the level), latency: s (the round trip) }
  async function record(sc, perf, cond) {
    const { truth, ev } = perform(sc, perf);
    const total = sc.total;
    const bassDry = await renderBass(ev, total);
    const bass = await webChain(bassDry, (oc, s) => MIC[cond.mic || 'amp'](oc, s));
    const n = bass.length;
    // the bass notes' median peak (a reference for the bleed levels)
    const peaks = truth.filter((x) => x.played && !x.ghost).map((x) => { const a = Math.round((x.t + x.dt) * SR), b = Math.min(n, a + Math.round(0.08 * SR)); let pk = 0; for (let i = a; i < b; i++) pk = Math.max(pk, Math.abs(bass[i])); return pk; });
    const ref = median(peaks) || 0.1;
    let bassRms = 0; for (let i = 0; i < n; i++) bassRms += bass[i] * bass[i]; bassRms = Math.sqrt(bassRms / n);
    const L = cond.latency ?? 0.15, sh = Math.round(L * SR);
    const mix = new Float32Array(n + sh); mix.set(bass, sh);   // the round trip: what the mic hears is stamped L late
    if (cond.click != null) {
      const cl = await webChain(await renderClicks(sc.clicks, total, { vary: cond.clickVary || 0, jitter: cond.clickJitter || 0, high: !!cond.clickHigh }), (oc, s) => SPEAKER(oc, s));
      let pk = 0; for (let i = 0; i < n; i++) pk = Math.max(pk, Math.abs(cl[i]));
      const k = ref * 10 ** (cond.click / 20) / pk;
      for (let i = 0; i < n; i++) mix[i + sh] += cl[i] * k;
    }
    if (cond.pad != null) {
      const root = 52 + ((sc.notes[0].midi - 52) % 12 + 12) % 12;   // the key's triad, E3-D#4, as the Backing voices it
      var padNotes = cond.padNotes || [root, root + 4, root + 7];
      const pd = await webChain(await renderPad(padNotes, sc.pre, total), (oc, s) => SPEAKER(oc, s));
      let rm = 0; for (let i = 0; i < n; i++) rm += pd[i] * pd[i]; rm = Math.sqrt(rm / n);
      const k = bassRms * 10 ** (cond.pad / 20) / rm;
      for (let i = 0; i < n; i++) mix[i + sh] += pd[i] * k;
    }
    // noise floor (pinkish), over the whole recording
    const r = rng(77); let b0 = 0, b1 = 0;
    const nk = ref * 10 ** ((cond.noise ?? -60) / 20) * 3;
    for (let i = 0; i < mix.length; i++) { const w = r() * 2 - 1; b0 = 0.99765 * b0 + w * 0.099; b1 = 0.963 * b1 + w * 0.2965; mix[i] += (b0 + b1 + w * 0.18) * nk * 0.3; }
    let pk = 0; for (let i = 0; i < mix.length; i++) pk = Math.max(pk, Math.abs(mix[i]));
    for (let i = 0; i < mix.length; i++) mix[i] *= 0.5 / pk;   // the recording's level
    // a phone's automatic gain control: rides the level (5 ms attack, 0.8 s release) towards about -20 dBFS
    let shifted = mix;
    if (cond.agc) {
      shifted = new Float32Array(mix.length); let env = 0.01; const at = Math.exp(-1 / (0.005 * SR)), rl = Math.exp(-1 / (0.8 * SR));
      for (let i = 0; i < mix.length; i++) { const a = Math.abs(mix[i]); env = a > env ? at * env + (1 - at) * a : rl * env + (1 - rl) * a; shifted[i] = mix[i] * Math.min(8, 0.1 / Math.max(env, 1e-4)); }
    }
    const B = await bank();
    for (const x of truth) x.tRec = x.t + x.dt + L + (x.played && !x.ghost ? (B.lead.get(nearest(B.reg, x.midiPlayed)) || 0) : 0);
    return { sc, truth, rec: shifted, L, padNotes: typeof padNotes === 'undefined' ? null : padNotes };
  }

  // ------------------------------------------------------------------ the analyser (the prototype under test)
  const CLICK_FREQS = [900, 1175, 1480, 1760, 2350, 3520];
  function prep(rec, { notch = true, padNotes = null } = {}) {
    // 48 -> 12 kHz (anti-alias low-pass, then every 4th sample), a 30 Hz high-pass, the click's frequencies notched
    let x = biquad(biquad(rec, 'lp', 4800, 0.54, SR), 'lp', 4800, 1.31, SR);
    const y = new Float32Array(Math.floor(x.length / 4)); for (let i = 0; i < y.length; i++) y[i] = x[i * 4];
    let z = biquad(y, 'hp', 30, 0.707, AR);
    if (notch) for (const f of CLICK_FREQS) z = biquad(z, 'notch', f, 2.5, AR);
    // the Backing's pad notched out, partial by partial (its notes are known), up to 2.5 kHz
    if (padNotes) for (const m of padNotes) for (let h = 1; midiF(m) * h < 2500; h++) z = biquad(z, 'notch', midiF(m) * h, 12, AR);
    return z;
  }

  // onset detection function: log-magnitude spectral flux (frequency max-filtered, as in "SuperFlux") over 40-2500 Hz,
  // N = 512 (43 ms) at 12 kHz, hop 24 (2 ms); click bands left out
  let N = 512, HOP = 24, WEIGHT = 'none';
  // BG: the flux measured against a slow average of each bin too (0.4 s), plus 6 dB, so a steady sound that beats
  // (the Backing's detuned pad heard through the speaker) does not make onsets; null = plain flux
  let BG = null;
  let BAND = [40, 2500];
  function odf(z) {
    const nf = Math.floor((z.length - N) / HOP);
    const win = new Float32Array(N); for (let i = 0; i < N; i++) win[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / N);
    const kLo = Math.round(BAND[0] * N / AR), kHi = Math.round(BAND[1] * N / AR);
    const skip = new Uint8Array(N / 2); for (const f of CLICK_FREQS) { const k = Math.round(f * N / AR); for (let j = k - 2; j <= k + 2; j++) if (j >= 0 && j < N / 2) skip[j] = 1; }
    const re = new Float32Array(N), im = new Float32Array(N);
    const prev = []; const LAG = 2;
    const flux = new Float32Array(nf), low = new Float32Array(nf);
    let bg = null; const alpha = BG ? (HOP / AR) / BG.tau : 0;
    for (let f = 0; f < nf; f++) {
      for (let i = 0; i < N; i++) { re[i] = z[f * HOP + i] * win[i]; im[i] = 0; }
      fft(re, im);
      const L = new Float32Array(N / 2);
      let le = 0;
      for (let k = 0; k < N / 2; k++) { const m = Math.hypot(re[k], im[k]); L[k] = Math.log(1 + 1000 * m); if (k >= 2 && k <= 43) le += m * m; }
      low[f] = Math.log(1e-9 + le);
      const P = prev[(f - LAG) % (LAG + 1)];
      if (BG && !bg) bg = Float32Array.from(L);
      if (P) {
        let s = 0;
        for (let k = kLo; k <= kHi; k++) { if (skip[k]) continue; let ref = Math.max(P[k - 1], P[k], P[k + 1]); if (bg) ref = Math.max(ref, bg[k] + BG.margin); const d = L[k] - ref; if (d > 0) s += WEIGHT === 'hfc' ? d * k / kHi : d; }
        flux[f] = s;
      }
      if (bg) for (let k = 0; k < N / 2; k++) bg[k] += alpha * (L[k] - bg[k]);
      prev[f % (LAG + 1)] = L;
    }
    return { flux, low, nf, t: (f) => (f * HOP + N / 2) / AR };
  }

  function peaks(o, { minGap = 0.045, delta = 0.12 } = {}) {
    const { flux, nf } = o;
    const s = [...flux].sort((a, b) => a - b); const hi = s[Math.floor(0.98 * s.length)] || 1;
    const out = [];
    const pre = Math.round(0.1 * AR / HOP), post = Math.round(0.03 * AR / HOP), w = Math.round(0.03 * AR / HOP);
    for (let f = 1; f < nf - 1; f++) {
      const v = flux[f]; if (v <= 0) continue;
      let isMax = true; for (let j = Math.max(0, f - w); j <= Math.min(nf - 1, f + w); j++) if (flux[j] > v) { isMax = false; break; }
      if (!isMax) continue;
      let m = 0, c = 0; for (let j = Math.max(0, f - pre); j <= Math.min(nf - 1, f + post); j++) { m += flux[j]; c++; }
      if (v < m / c + delta * hi) continue;
      const t = o.t(f);
      if (out.length && t - out[out.length - 1].t < minGap) { if (v > out[out.length - 1].s) out[out.length - 1] = { t, s: v, f }; continue; }
      out.push({ t, s: v / hi, f });
    }
    return out;
  }

  // where an onset is put (compared in the report):
  //   'peak'   the flux peak, interpolated between frames (parabola)
  //   'energy' the steepest rise of the log energy (1.5 ms windows, over +-3 ms), 25 ms before to 10 ms after the peak
  //   'hf'     the same on the signal above 300 Hz (the pluck's attack, not the string's slow low build-up)
  let REFINE = 'peak';
  function place(o, p, z, zh) {
    const f = p.f, y = o.flux;
    const a = y[f - 1] ?? y[f], b = y[f], c = y[f + 1] ?? y[f], den = a - 2 * b + c;
    const tp = o.t(f + (den ? Math.max(-1, Math.min(1, 0.5 * (a - c) / den)) : 0));
    if (REFINE === 'peak') return tp;
    return refine(REFINE === 'hf' ? zh : z, tp, -0.025, 0.01);
  }
  function refine(z, t, from = -0.06, to = 0.02) {
    const a = Math.max(40, Math.round((t + from) * AR)), b = Math.min(z.length - 40, Math.round((t + to) * AR));
    const W = 18, K = 36;
    const e = new Float32Array(b - a + 2 * K + W);
    for (let i = 0; i < e.length; i++) { let s = 0; const st = a - K + i; for (let j = 0; j < W; j++) { const v = z[st + j] || 0; s += v * v; } e[i] = Math.log10(1e-12 + s); }
    let best = -1e9, bi = 0;
    for (let i = K; i < e.length - K; i++) { const d = e[i + K] - e[i - K]; if (d > best) { best = d; bi = i; } }
    return (a - K + bi + W / 2) / AR;
  }

  // the score-informed alignment: a monotonic match of detected onsets to the expected notes (dynamic programming):
  // a match costs (dt / tol)^2, a missed note 1, an extra onset 0.25 + its strength
  // the onset's own pitch (yin, 30-130 ms after it) against the note expected there: the same pitch class costs
  // nothing, another 0.6, no clear pitch 0.3 (PITCHCOST; off = timing and strength only)
  let PITCHCOST = true;
  function pitchCost(d, e) {
    if (d.f == null) return 0.3;
    const c = 1200 * Math.log2(d.f / midiF(e.midi)); const pcErr = ((c % 1200) + 1800) % 1200 - 600;
    return Math.abs(pcErr) <= 50 ? 0 : 0.6;
  }
  function align(det, exp) {
    const n = det.length, m = exp.length, INF = 1e9;
    const D = Array.from({ length: n + 1 }, () => new Float64Array(m + 1).fill(INF));
    const P = Array.from({ length: n + 1 }, () => new Int8Array(m + 1));
    D[0][0] = 0;
    for (let i = 0; i <= n; i++) for (let j = 0; j <= m; j++) {
      const v = D[i][j]; if (v >= INF) continue;
      if (i < n && j < m) { const dt = det[i].t - exp[j].t; const tol = exp[j].tol; if (Math.abs(dt) < tol) { const c = v + (dt / tol) ** 2 + (PITCHCOST ? pitchCost(det[i], exp[j]) : 0); if (c < D[i + 1][j + 1]) { D[i + 1][j + 1] = c; P[i + 1][j + 1] = 1; } } }
      if (i < n) { const c = v + (PITCHCOST ? 0.35 + (det[i].clar > 0.9 ? 0.4 : 0) : 0.25 + det[i].s); if (c < D[i + 1][j]) { D[i + 1][j] = c; P[i + 1][j] = 2; } }
      if (j < m) { const c = v + 1; if (c < D[i][j + 1]) { D[i][j + 1] = c; P[i][j + 1] = 3; } }
    }
    const pairs = []; let i = n, j = m;
    while (i > 0 || j > 0) { const p = P[i][j]; if (p === 1) { pairs.push([i - 1, j - 1]); i--; j--; } else if (p === 2) { pairs.push([i - 1, -1]); i--; } else { pairs.push([-1, j - 1]); j--; } }
    return pairs.reverse();
  }

  // the click taken out of the recording: the count-in's clicks (heard alone, before the player starts) are averaged
  // into one template per click sound, which is then subtracted at every known click time (same clock: exact places)
  function subtractClicks(rec, sc, L) {
    const x = Float32Array.from(rec), pre = Math.round(0.002 * SR), len = Math.round(0.25 * SR);
    const tpl = {};
    for (const lv of [2, 1]) {
      const ins = sc.clicks.filter((c) => c.level === lv && c.t < sc.pre - 1e-6);
      if (!ins.length) continue;
      const t = new Float32Array(len);
      for (const c of ins) { const s = Math.round((c.t + L) * SR) - pre; for (let i = 0; i < len; i++) t[i] += (rec[s + i] || 0) / ins.length; }
      tpl[lv] = t;
    }
    for (const c of sc.clicks) {
      const t = tpl[c.level] || tpl[1] || tpl[2]; if (!t) continue;
      const s = Math.round((c.t + L) * SR) - pre;
      const end = Math.min(len, Math.round((sc.spb * 0.98) * SR));   // (never into the next click)
      for (let i = 0; i < end; i++) if (s + i >= 0 && s + i < x.length) x[s + i] -= t[i];
    }
    return x;
  }

  let PITCH = null;
  async function analyse(take, { L = take.L, notch = true, informed = true, subtract = false, padNotes = null } = {}) {
    PITCH ||= await M('/js/pitch.js');
    const t0 = performance.now();
    const z = prep(subtract ? subtractClicks(take.rec, take.sc, L) : take.rec, { notch, padNotes });
    const zp = biquad(biquad(z, 'lp', 1100, 0.707, AR), 'lp', 1100, 0.707, AR);   // the tuner's pitch band
    const o = odf(z);
    const zh = REFINE === 'hf' ? biquad(biquad(z, 'hp', 300, 0.707, AR), 'hp', 300, 0.707, AR) : null;
    const rmsOf = (x, a, b) => { a = Math.max(0, Math.round(a * AR)); b = Math.min(x.length, Math.round(b * AR)); let s = 0; for (let i = a; i < b; i++) s += x[i] * x[i]; return Math.sqrt(s / Math.max(1, b - a)); };
    // the room's noise, heard in the count-in (the player waits for it), in the pitch band; an onset must be 12 dB over it
    const floor = rmsOf(zp, L + 0.05, take.sc.pre + L - 0.05);
    const cand = peaks(o).map((p) => ({ ...p, tr: place(o, p, z, zh) })).map((p) => ({ ...p, lv: rmsOf(zp, p.tr, p.tr + 0.06) }));
    const det = cand.filter((p) => p.lv > floor * 10 ** (12 / 20));
    for (const d of det) { const y = PITCH.yin(zp.subarray(Math.round((d.tr + 0.03) * AR), Math.round((d.tr + 0.13) * AR)), AR, { fmin: 26, fmax: 520 }); d.f = y?.freq ?? null; d.clar = y?.clarity ?? 0; }
    const sc = take.sc;
    const exp = sc.notes.map((n, j) => {
      const prevT = j ? sc.notes[j - 1].t : -1, nextT = sc.notes[j + 1]?.t ?? 1e9;
      const ioi = Math.min(n.t - prevT, nextT - n.t);
      return { ...n, t: n.t + L, tol: Math.min(0.11, Math.max(0.04, 0.45 * ioi)) };
    });
    const pairs = align(det.map((d) => ({ t: d.tr, s: d.s, f: d.f, clar: d.clar })), exp);
    const res = [];
    const onsets = det.map((d) => d.tr);
    for (const [di, ej] of pairs) {
      const d = di >= 0 ? det[di] : null, e = ej >= 0 ? exp[ej] : null;
      const r = { exp: ej, det: di, t: d?.tr ?? null, s: d?.s ?? 0 };
      if (d) {
        // the note's sustained part: 35 ms after the onset, up to the next onset (at most 260 ms)
        const nxt = onsets.find((x) => x > d.tr + 0.03) ?? d.tr + 1;
        const a = Math.round((d.tr + 0.035) * AR), b = Math.round(Math.min(d.tr + 0.26, nxt - 0.01) * AR);
        r.len = (b - a) / AR;
        let fmin = 26;
        if (e && informed) fmin = Math.max(26, midiF(e.midi) / 2.3);   // the expected note bounds the longest period
        const seg = zp.subarray(a, b);
        const y = b - a > 0 ? PITCH.yin(seg, AR, { fmin, fmax: 520 }) : null;
        r.f = y?.freq ?? null; r.clarity = y?.clarity ?? 0;
        r.midiHeard = y ? 69 + 12 * Math.log2(y.freq / 440) : null;
        // level: the loudest 10 ms (RMS) in the first 60 ms, in the pitch band
        let lv = 0; const s0 = Math.round(d.tr * AR);
        for (let k = s0; k < s0 + Math.round(0.06 * AR); k += 12) { let s = 0; for (let q = 0; q < 120; q++) s += (zp[k + q] || 0) ** 2; lv = Math.max(lv, Math.sqrt(s / 120)); }
        r.levelDb = db(lv);
        if (e) {
          r.dt = d.tr - e.t;
          if (r.midiHeard != null) {
            const c = (r.midiHeard - e.midi) * 100;
            const pcErr = ((c % 1200) + 1800) % 1200 - 600;   // -600..600 cents, octave folded
            r.pc = Math.abs(pcErr) <= 50 ? 'ok' : `${pcErr > 0 ? '+' : ''}${Math.round(pcErr / 100)}`;
            r.oct = Math.round((c - pcErr) / 1200);
            // informed check: the harmonics of the expected note against its neighbours' (Goertzel, h = 1..6)
            const sal = (m) => { let s = 0; for (let h = 1; h <= 6; h++) { const f = midiF(m) * h; if (f < 1000) s += Math.sqrt(goertzel(zp, a, Math.max(a + 64, b), f, AR)) / Math.sqrt(h); } return s; };
            const se = sal(e.midi), sn = Math.max(sal(e.midi - 1), sal(e.midi + 1), sal(e.midi - 2), sal(e.midi + 2));
            r.salDb = db(se / (sn || 1e-12));
          }
        }
      }
      res.push(r);
    }
    // an onset left over is an extra NOTE only when it is about as strong as the notes and has a clear pitch
    const medS = median(res.filter((r) => r.exp >= 0 && r.det >= 0).map((r) => r.s));
    for (const r of res) if (r.exp < 0) r.extraNote = r.s > 0.35 * medS && r.clarity > 0.8;
    // a weak onset matched to a note whose pitch was not heard: the note was most likely not played
    for (const r of res) if (r.exp >= 0 && r.det >= 0 && r.s < 0.35 * medS && r.pc !== 'ok') r.weak = true;
    const strong = res.filter((r) => r.det >= 0 && r.s > 0.35 * medS).map((r) => r.t).sort((a, b) => a - b);
    // ringing: the previous note's harmonics (those far from the new note's) 80-300 ms into the new note, against
    // the previous note's own level
    const matched = res.filter((r) => r.exp >= 0 && r.det >= 0 && !r.weak).sort((a, b) => a.t - b.t);
    for (let q = 1; q < matched.length; q++) {
      const cur = matched[q], pr = matched[q - 1];
      const fPrev = midiF(exp[pr.exp].midi), fCur = midiF(exp[cur.exp].midi);
      const nextOn = strong.find((x) => x > cur.t + 0.03) ?? cur.t + 1;
      const a = Math.round((cur.t + 0.08) * AR), b = Math.round(Math.min(cur.t + 0.3, nextOn - 0.01) * AR);
      // (only when the previous note was heard as written: its pitch is then known)
      if (b - a < 0.05 * AR || exp[pr.exp].midi === exp[cur.exp].midi || pr.pc !== 'ok') continue;
      const res2 = 1.5 * AR / (b - a);   // Hann main lobe half-width, Hz
      let now = 0, then = 0, used = 0;
      const a0 = Math.round((pr.t + 0.04) * AR), b0 = Math.min(Math.round(pr.t * AR) + (b - a) + Math.round(0.04 * AR), Math.round((cur.t - 0.005) * AR));
      for (let h = 1; h <= 5; h++) {
        const f = fPrev * h; if (f > 1000) break;
        let clear = true; for (let k = 1; k <= 12; k++) if (Math.abs(fCur * k - f) < 2 * res2) clear = false;
        if (!clear) continue;
        now += goertzel(zp, a, b, f, AR); then += goertzel(zp, a0, Math.max(a0 + 64, b0), f, AR); used++;
      }
      if (used) cur.ringDb = db(Math.sqrt(now / then));
    }
    return { det, pairs: res, ms: performance.now() - t0, z };
  }

  // count-in calibration: the count-in clicks (heard alone on the phone's speaker) against the click's waveform
  function calibrate(take) {
    const z = prep(take.rec, { notch: false });
    const sc = take.sc;
    const lags = [];
    for (const c of sc.clicks.filter((c) => c.t < sc.pre - 1e-6)) {
      const f = c.level === 2 ? 1760 : 1175, len = Math.round(0.09 * AR);
      const tpl = new Float32Array(len); for (let i = 0; i < len; i++) tpl[i] = Math.sin(2 * Math.PI * f * i / AR) * Math.min(1, i / 12) * Math.exp(-i / (0.013 * AR));
      let best = -1, bl = 0;
      for (let lag = Math.round(0.0 * AR); lag < Math.round(0.6 * AR); lag++) {
        const st = Math.round(c.t * AR) + lag; let s = 0;
        for (let i = 0; i < len; i += 1) s += (z[st + i] || 0) * tpl[i];
        if (s > best) { best = s; bl = lag; }
      }
      lags.push(bl / AR);
    }
    return { L: median(lags), lags };
  }

  // ------------------------------------------------------------------ scoring against the known answers
  function evaluate(take, an) {
    const T = take.truth, sc = take.sc;
    const byI = new Map(T.filter((x) => x.i >= 0).map((x) => [x.i, x]));
    const out = { onsetErr: [], dtErr: [], byReg: {}, missedTrue: 0, missedFound: 0, missedFalse: 0, extraTrue: T.filter((x) => x.extra).length, extraFound: 0, extraFalse: 0, pitch: { ok: 0, wrongTrue: 0, wrongFound: 0, falseWrong: 0, octave: 0, none: 0, n: 0 }, ring: { rung: [], damped: [] }, levels: [] };
    const extraDet = an.pairs.filter((r) => r.exp < 0 && r.det >= 0 && r.extraNote);
    for (const r of an.pairs) {
      if (r.exp < 0) continue;
      const tr = byI.get(r.exp); if (!tr) continue;
      if (!tr.played) { out.missedTrue++; if (r.det < 0 || r.weak) out.missedFound++; continue; }
      if (r.det < 0 || r.weak) { out.missedFalse++; continue; }
      if (tr.ghost) continue;
      const err = (r.t - tr.tRec) * 1000;
      out.onsetErr.push(err);
      const reg = tr.midiPlayed < 33 ? 'B0-G#1' : tr.midiPlayed < 45 ? 'A1-G#2' : 'A2-E4';
      (out.byReg[reg] ||= []).push(err);
      out.dtErr.push((r.dt - tr.dt) * 1000);
      out.levels.push({ i: tr.i, meas: r.levelDb, truth: tr.ampDb, midi: tr.midiPlayed });
      // pitch
      out.pitch.n++;
      const wrong = tr.midiPlayed !== tr.midi;
      const saysWrong = r.pc != null && r.pc !== 'ok' && r.salDb < 0;   // yin and the harmonics agree: another note
      if (wrong) { out.pitch.wrongTrue++; if (saysWrong) out.pitch.wrongFound++; }
      else if (r.pc == null) out.pitch.none++;
      else if (saysWrong) out.pitch.falseWrong++;
      else { out.pitch.ok++; if (r.oct) out.pitch.octave++; }
      if (r.ringDb != null) {
        const prev = T.filter((x) => x.played && !x.extra && x.i >= 0 && x.i < tr.i).pop();
        (prev?.ring ? out.ring.rung : out.ring.damped).push(r.ringDb);
      }
    }
    // an extra onset counts as found when it lies within 40 ms of a real extra note
    for (const r of extraDet) {
      const hit = T.find((x) => x.extra && Math.abs(x.tRec - r.t) < 0.04);
      if (hit) out.extraFound++; else out.extraFalse++;
    }
    const s = (a) => a.length ? { n: a.length, bias: r1(median(a)), sd: r1(sd(a)), p95: r1(pct(a.map(Math.abs), 0.95)), max: r1(Math.max(...a.map(Math.abs))) } : null;
    return {
      onset: s(out.onsetErr), afterBias: s(out.onsetErr.map((e) => e - median(out.onsetErr))), dtErr: s(out.dtErr),
      byReg: Object.fromEntries(Object.entries(out.byReg).map(([k, v]) => [k, s(v)])),
      missed: { true: out.missedTrue, found: out.missedFound, falseAlarms: out.missedFalse },
      extra: { true: out.extraTrue, found: out.extraFound, falseAlarms: out.extraFalse },
      pitch: out.pitch,
      ring: { rung: out.ring.rung.map(r1), damped: { n: out.ring.damped.length, max: r1(Math.max(-99, ...out.ring.damped)), p95: r1(pct(out.ring.damped, 0.95)) } },
      levels: out.levels,
      detected: an.det.length, expected: sc.notes.length, ms: Math.round(an.ms), seconds: r1(take.rec.length / SR),
    };
  }

  async function take(o = {}) {
    const sc = await score(o.id || 'sc-one-octave', o);
    const tk = await record(sc, o.perf || {}, o.cond || {});
    let L = tk.L;
    let cal = null;
    if (o.calibrate) { cal = calibrate(tk); L = cal.L; }
    if (o.Lknown != null) L = o.Lknown;
    const an = await analyse(tk, { L, notch: o.notch ?? true, informed: o.informed ?? true, subtract: !!o.subtract, padNotes: o.padNotch && o.cond?.pad != null ? tk.padNotes : null });
    const ev = evaluate(tk, an);
    if (cal) ev.cal = { L: tk.L, est: cal.L, errMs: r1((cal.L - tk.L) * 1000), spreadMs: r1(sd(cal.lags) * 1000) };
    return { sc, truth: tk.truth, found: an.pairs, eval: ev, take: tk };
  }

  // ------------------------------------------------------------------ the report's runs
  async function suite({ seeds = [1, 2, 3] } = {}) {
    const out = {};
    const pool = (evs) => {
      const on = evs.flatMap((e) => e.onsetErr || []);
      return on;
    };
    const run = async (name, base) => {
      const evs = [];
      for (const seed of seeds) {
        const t = await take({ ...base, perf: { seed, ...(base.perf || {}) } });
        t.eval.onsetErr = t.found.filter((r) => r.exp >= 0 && r.det >= 0).map((r) => { const tr = t.truth.find((x) => x.i === r.exp); return tr && tr.played && !tr.ghost ? (r.t - tr.tRec) * 1000 : null; }).filter((x) => x != null);
        evs.push(t.eval);
      }
      const on = pool(evs);
      const sum = (f) => evs.reduce((s, e) => s + f(e), 0);
      const row = {
        notes: sum((e) => e.expected), det: sum((e) => e.detected),
        onsetBias: r1(median(on)), onsetSd: r1(sd(on.map((e) => e - median(on)))), onsetP95: r1(pct(on.map((e) => Math.abs(e - median(on))), 0.95)),
        missed: `${sum((e) => e.missed.found)}/${sum((e) => e.missed.true)} (+${sum((e) => e.missed.falseAlarms)} false)`,
        extra: `${sum((e) => e.extra.found)}/${sum((e) => e.extra.true)} (+${sum((e) => e.extra.falseAlarms)} false)`,
        pitchOk: `${sum((e) => e.pitch.ok)}/${sum((e) => e.pitch.n - e.pitch.wrongTrue)}`,
        octaveOff: sum((e) => e.pitch.octave), noPitch: sum((e) => e.pitch.none), falseWrong: sum((e) => e.pitch.falseWrong),
        wrongFound: `${sum((e) => e.pitch.wrongFound)}/${sum((e) => e.pitch.wrongTrue)}`,
        ringRung: evs.flatMap((e) => e.ring.rung), ringDampedMax: Math.max(...evs.map((e) => e.ring.damped.max)), ringDampedP95: Math.max(...evs.map((e) => e.ring.damped.p95)),
        byReg: Object.fromEntries(['B0-G#1', 'A1-G#2', 'A2-E4'].map((k) => { const v = evs.flatMap((e) => (e.byReg[k] ? [e.byReg[k]] : [])); return [k, v.length ? { bias: r1(mean(v.map((x) => x.bias))), sd: r1(mean(v.map((x) => x.sd))) } : null]; })),
        cal: evs[0].cal ? evs.map((e) => e.cal.errMs) : undefined,
        ms: Math.round(mean(evs.map((e) => e.ms))), seconds: evs[0].seconds,
      };
      out[name] = row;
      console.log(name, row);
      return row;
    };
    const faults = { sd: 0, wrong: [[3, 1], [9, -1]], miss: [6], extra: [[11, 2]], ring: [1, 12] };
    const S1 = { id: 'sc-one-octave', bpm: 100, sub: 2 };
    const LOWB = [[23, 1], [23, 0.5], [26, 0.5], [28, 1], [30, 1], [31, 1], [30, 0.5], [28, 0.5], [26, 1], [23, 1], [35, 1], [33, 1], [31, 1], [30, 1], [28, 1], [26, 1], [23, 2]];
    const amp = { mic: 'amp', noise: -60 }, unp = { mic: 'unplugged', noise: -40 };
    // 1. how exactly onsets are found, by setup (a clean player: every error is the analyser's)
    await run('USB interface (line), no bleed', { ...S1, cond: { mic: 'line', noise: -70 } });
    await run('amp, headphones', { ...S1, cond: amp });
    await run('amp, headphones, AGC', { ...S1, cond: { ...amp, noise: -55, agc: true } });
    await run('unplugged, headphones', { ...S1, cond: unp });
    await run('amp, app click on speaker +10 dB, not removed', { ...S1, notch: false, cond: { ...amp, click: 10 } });
    await run('amp, app click +10 dB, notched', { ...S1, cond: { ...amp, click: 10 } });
    await run('amp, app click +10 dB, subtracted (ideal)', { ...S1, subtract: true, cond: { ...amp, click: 10 } });
    await run('amp, app click +10 dB, subtracted, 1 dB / 20 us wobble', { ...S1, subtract: true, cond: { ...amp, click: 10, clickVary: 1, clickJitter: 0.02 } });
    await run('amp, recording click +20 dB', { ...S1, notch: false, cond: { ...amp, click: 20, clickHigh: true, clickVary: 3, clickJitter: 0.1 } });
    await run('unplugged, recording click +30 dB, AGC', { ...S1, notch: false, cond: { ...unp, click: 30, clickHigh: true, agc: true } });
    await run('amp, recording click +10, pad 0 dB', { ...S1, notch: false, cond: { ...amp, click: 10, clickHigh: true, pad: 0 } });
    await run('amp, recording click +10, pad +6 dB', { ...S1, notch: false, cond: { ...amp, click: 10, clickHigh: true, pad: 6 } });
    await run('unplugged, recording click +20, pad +10 dB', { ...S1, notch: false, cond: { ...unp, click: 20, clickHigh: true, pad: 10 } });
    // 2. faults: wrong, missed, extra notes and ringing strings
    await run('faults, amp, headphones', { ...S1, perf: faults, cond: amp });
    await run('faults, amp, recording click +10, pad 0', { ...S1, notch: false, perf: faults, cond: { ...amp, click: 10, clickHigh: true, pad: 0 } });
    await run('faults, unplugged, headphones', { ...S1, perf: faults, cond: unp });
    await run('faults, unplugged, recording click +20, pad +10', { ...S1, notch: false, perf: faults, cond: { ...unp, click: 20, clickHigh: true, pad: 10 } });
    // 3. fast notes, the low B, two octaves
    await run('16ths at 120, amp, headphones', { id: 'sc-one-octave', bpm: 120, sub: 4, perf: { wrong: [[5, 1]] }, cond: amp });
    await run('16ths at 140, amp, headphones', { id: 'sc-one-octave', bpm: 140, sub: 4, perf: { wrong: [[5, 1]] }, cond: amp });
    await run('16ths at 120, unplugged', { id: 'sc-one-octave', bpm: 120, sub: 4, perf: { wrong: [[5, 1]] }, cond: unp });
    await run('low B line (5-string), amp', { line: LOWB, bpm: 90, perf: { wrong: [[4, 1]] }, cond: amp });
    await run('low B line (5-string), unplugged', { line: LOWB, bpm: 90, perf: { wrong: [[4, 1]] }, cond: unp });
    await run('two octaves, amp, headphones', { id: 'sc-two-octaves', bpm: 90, sub: 2, perf: { wrong: [[5, 1], [17, -1]] }, cond: amp });
    // 4. the player's own timing, recovered: dt error = measured minus true deviation
    out.timing = [];
    for (const seed of seeds) {
      const t = await take({ ...S1, notch: false, perf: { seed, sd: 15, rushBar: 1, rushMs: -30, late: [[10, 50]] }, cond: { mic: 'amp', click: 10, clickHigh: true, noise: -60 } });
      const m = t.found.filter((r) => r.exp >= 0 && r.det >= 0).map((r) => { const tr = t.truth.find((x) => x.i === r.exp); return { i: r.exp, bar: tr.bar, trueMs: r1(tr.dt * 1000), measMs: r1(r.dt * 1000) }; });
      const err = m.map((x) => x.measMs - x.trueMs);
      const bars = {}; for (const x of m) (bars[x.bar] ||= { t: [], m: [] }), bars[x.bar].t.push(x.trueMs), bars[x.bar].m.push(x.measMs);
      out.timing.push({ seed, errSd: r1(sd(err)), errBias: r1(median(err)), bars: Object.fromEntries(Object.entries(bars).map(([b, v]) => [b, { trueMean: r1(mean(v.t)), measMean: r1(mean(v.m)) }])), late10: m.find((x) => x.i === 10) });
    }
    console.log('timing', out.timing);
    // 5. calibration from the count-in's clicks on the phone's speaker
    out.calibration = [];
    for (const L of [0.083, 0.151, 0.236]) for (const cond of [{ mic: 'amp', click: 0, noise: -60 }, { mic: 'unplugged', click: 20, noise: -40 }]) {
      const t = await take({ ...S1, calibrate: true, perf: { seed: 4 }, cond: { ...cond, latency: L } });
      out.calibration.push({ L, mic: cond.mic, ...t.eval.cal, onsetBias: t.eval.onset?.bias });
    }
    console.log('calibration', out.calibration);
    // 6. ghost notes: found, and told from pitched ghosts by yin's clarity
    out.ghosts = [];
    for (const pitched of [false, true]) {
      const t = await take({ id: 'tech-ghost-16ths', bpm: 90, sub: 4, perf: { seed: 3, pitchedGhost: pitched }, cond: { mic: 'amp', noise: -60 } });
      const g = t.found.filter((r) => r.exp >= 0).map((r) => ({ r, tr: t.truth.find((x) => x.i === r.exp) })).filter((x) => x.tr?.ghost);
      const reg = t.found.filter((r) => r.exp >= 0 && r.det >= 0).map((r) => ({ r, tr: t.truth.find((x) => x.i === r.exp) })).filter((x) => x.tr && !x.tr.ghost);
      out.ghosts.push({ pitched, ghosts: g.length, found: g.filter((x) => x.r.det >= 0).length, clarityGhost: r1(median(g.filter((x) => x.r.det >= 0).map((x) => x.r.clarity * 100))) / 100, clarityGhostP90: r1(pct(g.filter((x) => x.r.det >= 0).map((x) => x.r.clarity * 100), 0.9)) / 100, clarityNotes: r1(median(reg.map((x) => x.r.clarity * 100))) / 100, ghostPitchHeard: g.filter((x) => x.r.det >= 0 && x.r.pc === 'ok').length, levelGhostVsNote: r1(median(g.filter((x) => x.r.det >= 0).map((x) => x.r.levelDb)) - median(reg.map((x) => x.r.levelDb))) });
    }
    console.log('ghosts', out.ghosts);
    // 7. hammer-ons and pull-offs: no pluck, only the pitch changes
    out.legato = [];
    for (const legato of [false, true]) {
      const t = await take({ id: 'tech-legato', bpm: 80, sub: 4, perf: { seed: 2, legato }, cond: { mic: 'amp', noise: -60 } });
      const hp = t.found.filter((r) => r.exp >= 0).map((r) => ({ r, tr: t.truth.find((x) => x.i === r.exp) })).filter((x) => x.tr && (x.tr.tag === 'H' || x.tr.tag === 'PO'));
      const errs = hp.filter((x) => x.r.det >= 0).map((x) => (x.r.t - x.tr.tRec) * 1000);
      out.legato.push({ legato, hp: hp.length, found: hp.filter((x) => x.r.det >= 0).length, bias: r1(median(errs)), sd: r1(sd(errs)), pitchOk: hp.filter((x) => x.r.pc === 'ok').length });
    }
    console.log('legato', out.legato);
    // 8. evenness: every second note 3 dB softer (i-m), on one open string, through an AGC or not
    out.evenness = [];
    for (const agc of [false, true]) for (const uneven of [0, 3]) {
      const t = await take({ id: 'tech-alt-pluck', bpm: 90, sub: 2, perf: { seed: 5, uneven, velSd: 1 }, cond: { mic: 'amp', noise: -60, agc } });
      const lv = t.eval.levels.filter((x) => x.midi === t.eval.levels[0].midi);
      const odd = lv.filter((x) => x.i % 2).map((x) => x.meas), even = lv.filter((x) => !(x.i % 2)).map((x) => x.meas);
      const todd = lv.filter((x) => x.i % 2).map((x) => x.truth), teven = lv.filter((x) => !(x.i % 2)).map((x) => x.truth);
      out.evenness.push({ agc, uneven, n: lv.length, trueDiff: r1(mean(teven) - mean(todd)), measDiff: r1(mean(even) - mean(odd)), measSd: r1(sd(lv.map((x) => x.meas))), trueSd: r1(sd(lv.map((x) => x.truth))) });
    }
    console.log('evenness', out.evenness);
    window.__rsOut = out;
    return out;
  }

  window.__rs = { take, suite, score, perform, record, analyse, calibrate, evaluate, bank, set refine(v) { REFINE = v; }, get refine() { return REFINE; }, set band(v) { BAND = v; }, get band() { return BAND; }, set frame(v) { [N, HOP] = v; }, get frame() { return [N, HOP]; }, set weight(v) { WEIGHT = v; }, set bg(v) { BG = v; }, set pitchCost(v) { PITCHCOST = v; } };
})();
