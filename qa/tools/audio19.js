// QA round 19 (3219994): renders through the app's REAL audio graph (audio18's method: a same-origin iframe gets an
// OfflineAudioContext before audio.js builds its graph). Adds a `pre(w)` hook (run before the graph exists, e.g.
// the phone-speaker route) and the round's measurements. Classic script, loaded from the qa tab.
//   __render19(secs, schedule, { opts, kit, piano, pre })  -> { buf, ms (render time), samples }
//   __bass19()      a low phrase at 100%: natural path and phone path; peak, share over the clip's knee, RMS, A-weighted
//   __drums19(keys, { fills, every })  each pattern at its own tempo and subdivision, 4 bars, drums 100% alone and
//                   with the click 100% + harmony pad 100% (peak, samples over the knee)
//   __sounds19()    each harmony sound at 100% against the pad (A-weighted), peaks; guitar chugs per tempo/subdivision
//   __idle19()      render cost of 20 s of silence through the whole graph (the organ's Leslie and the guitar's amp
//                   run from the start) against a bare context
(() => {
  const SR = 48000;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const db = (x) => +(20 * Math.log10(Math.max(1e-9, x))).toFixed(2);
  window.__render19 = async (secs, schedule, { opts = {}, kit = false, piano = false, pre = null } = {}) => {
    const f = document.createElement('iframe');
    f.style.cssText = 'position:fixed;left:0;top:0;width:800px;height:380px;opacity:0.01;pointer-events:none;z-index:-1';
    f.src = `/?r19=${Math.random()}#/settings`;
    document.body.append(f);
    await new Promise((r) => { f.onload = r; });
    await sleep(250);
    const w = f.contentWindow;
    const OAC = w.OfflineAudioContext;
    w.AudioContext = function () { return new OAC(2, Math.ceil(secs * SR), SR); };
    w.webkitAudioContext = w.AudioContext;
    try {
      const A = await w.eval(`import("${location.origin}/js/audio.js")`);
      const D = await w.eval(`import("${location.origin}/js/drums.js")`);
      const Pn = await w.eval(`import("${location.origin}/js/piano.js")`);
      if (pre) await pre(w, A);
      A.setAudioOptions({ bassVol: 2, clickVol: 0.75, padVol: 1, padTone: 1500, drumVol: 0.8, ...opts });
      const ac = A.audioCtx();
      if (!(ac instanceof OAC)) throw new Error('the iframe already had a live AudioContext');
      await A.whenReady(10000);
      if (kit) await D.loadKit();
      if (piano) await Pn.loadPiano();
      await schedule({ A, D, ac, w, Pn });
      const t0 = performance.now();
      const buf = await ac.startRendering();
      return { buf, ms: performance.now() - t0, samples: A.samplesReady(), pianoReady: Pn.pianoReady() };
    } finally { f.remove(); }
  };
  const stats = (buf, a = 0, b = Infinity) => {
    let pk = 0, over = 0, n = 0, ss = 0;
    for (let c = 0; c < buf.numberOfChannels; c++) {
      const d = buf.getChannelData(c);
      for (let i = Math.floor(a * SR); i < Math.min(d.length, b * SR); i++) { const x = Math.abs(d[i]); if (x > pk) pk = x; if (x > 0.85) over++; ss += d[i] * d[i]; n++; }
    }
    return { peak: db(pk), over, overPct: +((100 * over) / n).toFixed(3), rms: db(Math.sqrt(ss / n)) };
  };
  // A-weighting (as audio18)
  const aw = (f) => { const f2 = f * f; const ra = (12194 ** 2 * f2 * f2) / ((f2 + 20.6 ** 2) * Math.sqrt((f2 + 107.7 ** 2) * (f2 + 737.9 ** 2)) * (f2 + 12194 ** 2)); return ra * ra * 10 ** 0.2; };
  const fft = (re, im) => {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
    for (let len = 2; len <= n; len <<= 1) { const ang = (-2 * Math.PI) / len, wr = Math.cos(ang), wi = Math.sin(ang); for (let i = 0; i < n; i += len) { let cr = 1, ci = 0; for (let k = 0; k < len / 2; k++) { const a = i + k, b = a + len / 2; const vr = re[b] * cr - im[b] * ci, vi = re[b] * ci + im[b] * cr; re[b] = re[a] - vr; im[b] = im[a] - vi; re[a] += vr; im[a] += vi; [cr, ci] = [cr * wr - ci * wi, cr * wi + ci * wr]; } } }
  };
  const aLoud = (buf, a, b) => {
    const F = 4096; let e = 0, n = 0; const W = new Float64Array(F / 2); for (let k = 1; k < F / 2; k++) W[k] = aw((k * SR) / F);
    for (let c = 0; c < buf.numberOfChannels; c++) {
      const d = buf.getChannelData(c);
      for (let at = Math.floor(a * SR); at + F <= Math.min(d.length, b * SR); at += F) { const re = new Float64Array(F), im = new Float64Array(F); re.set(d.subarray(at, at + F)); fft(re, im); for (let k = 1; k < F / 2; k++) e += (2 * (re[k] ** 2 + im[k] ** 2) * W[k]) / F; n += F; }
    }
    return +(10 * Math.log10(e / n)).toFixed(2);
  };
  window.__aLoud19 = aLoud; window.__stats19 = stats;

  window.__bass19 = async () => {
    const phrase = [28, 28, 31, 33, 35, 33, 31, 28, 26, 26, 29, 31, 33, 31, 29, 26];
    const play = ({ A }) => { const len = 0.25; let t = 0.1; for (let r = 0; r < 4; r++) for (const m of phrase) { A.playNote(m, t, len * 0.95, 1); t += len; } A.playNote(28, t, 1.5, 1); A.playNote(35, t, 1.5, 1); };
    const out = {};
    for (const route of ['natural', 'phone']) {
      const pre = route === 'phone' ? (w) => { w.dispatchEvent(new w.CustomEvent('bassclass-route', { detail: 'speaker' })); } : null;
      const r = await window.__render19(19, play, { pre, opts: { bassVol: 2 } });
      out[route] = { ...stats(r.buf, 0, 18.5), aw: aLoud(r.buf, 0.5, 18), samples: r.samples };
      const rc = await window.__render19(19, (x) => { play(x); for (let t = 0.1; t < 18; t += 0.5) x.A.click(t, Math.round((t - 0.1) / 0.5) % 4 === 0 ? 2 : 1); }, { pre, opts: { bassVol: 2, clickVol: 1.5 } });
      out[route + '+click100'] = stats(rc.buf, 0, 18.5);
    }
    return out;
  };

  window.__drums19 = async (keys, { every = 4, bars = 4, withAll = false } = {}) => {
    const M = (p) => import(location.origin + p);
    const { STYLES, phraseHits, clickTimes } = await M('/js/practice/styles.js');
    const rows = [];
    for (const key of keys) {
      const s = STYLES[key]; const len = 60 / s.bpm; const L = s.sub;
      const secs = bars * s.beats * len + 1.2;
      const sched = ({ A, D }) => {
        for (let bar = 0; bar < bars; bar++) for (let beat = 0; beat < s.beats; beat++) {
          const t0 = 0.05 + (bar * s.beats + beat) * len;
          for (const [f, piece, v] of phraseHits(s, L, bar, beat, every, s.bpm)) D.playDrum(piece, t0 + f * len, v, D.styleGain(key) * D.trackGain(s, piece));
          if (withAll) {
            clickTimes(s, L).forEach((f, j) => A.click(t0 + f * len, j ? 0 : beat === 0 ? 2 : 1));
            if (beat === 0) { A.padSet([52, 56, 59, 62], t0, 'pad'); }
          }
        }
      };
      const r = await window.__render19(secs, sched, { kit: true, opts: withAll ? { drumVol: 1, clickVol: 1.5, padVol: 4.5, padTone: 3200 } : { drumVol: 1, clickVol: 0 } });
      rows.push({ key, bpm: s.bpm, ...stats(r.buf), aw: aLoud(r.buf, 0.05, secs - 1) });
    }
    return rows;
  };

  window.__sounds19 = async () => {
    const chords = [[57, 61, 64, 67], [62, 66, 69, 72], [64, 68, 71, 74]];
    const out = {};
    const opts = { padVol: 4.5, padTone: 3200, clickVol: 0, drumVol: 0 };
    for (const sound of ['pad', 'epiano', 'piano', 'organ', 'guitar-open']) {
      const name = sound === 'guitar-open' ? 'guitar' : sound;
      const r = await window.__render19(8, ({ A }) => { chords.forEach((c, i) => A.padSet(c, 0.05 + i * 2.5, name)); A.padStop(7.5); }, { opts, piano: sound === 'piano' });
      out[sound] = { ...stats(r.buf, 0, 8), aw: aLoud(r.buf, 0.1, 7.4), pianoReady: r.pianoReady, renderPct: +((r.ms / 8000) * 100).toFixed(1) };
    }
    // the guitar chugs at 60/120/200 BPM x 1-4 per beat (the engine's rate = bpm * L / 60)
    out.chugs = [];
    for (const bpm of [60, 120, 200]) for (const L of [1, 2, 3, 4]) {
      const len = 60 / bpm;
      const r = await window.__render19(8, ({ A }) => { let k = 0; for (let t = 0.05; t < 7.5; t += len / L) { A.chugNote(chords[0], t, (bpm * L) / 60, k % L === 0); k++; } }, { opts });
      out.chugs.push(`${bpm} x${L}: aw ${(aLoud(r.buf, 0.5, 7.4) - out.pad.aw).toFixed(1)} dB vs pad, peak ${stats(r.buf).peak}, over ${stats(r.buf).over}, render ${((r.ms / 8000) * 100).toFixed(1)}%`);
    }
    return out;
  };

  window.__idle19 = async () => {
    const r = await window.__render19(20, () => {}, {});
    const bare = new OfflineAudioContext(2, 20 * SR, SR);
    const o = bare.createGain(); o.connect(bare.destination);
    const t0 = performance.now(); await bare.startRendering(); const bareMs = performance.now() - t0;
    return { graphMs: Math.round(r.ms), bareMs: Math.round(bareMs), graphPctRealtime: +((r.ms / 20000) * 100).toFixed(2) };
  };
  window.__audio19ready = true;
})();
