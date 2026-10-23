// QA round 18 (f15a4eb): renders through the REAL audio graph. A same-origin iframe loads the app, its
// AudioContext is swapped for an OfflineAudioContext before audio.js builds its graph (nothing has clicked
// in the iframe, so the context does not exist yet), and the app's own functions schedule the sounds
// (click, playNote, playDrum, padSet, arpNote, tapTick). Classic script, loaded from the qa tab.
//   __render18(secs, schedule, { opts, kit })  -> AudioBuffer of the app's output (after the soft clip)
//   __onsets18()      each source's delay at the output (first sample over -40 dB after its time)
//   __clicks18()      click peaks per level at 20-100 % (v3 scale), alone and over the Backing pad, and
//                     the pad's worst dip under the clicks (pad band below ~400 Hz, 10 ms windows)
//   __arpLoud18()     the arpeggio against the pad (A-weighted), per tempo and subdivision, room levels
//   __arpMix18()      the loudest room mix with the arpeggio: peak and samples over the soft clip's knee
(() => {
  const SR = 48000;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  window.__render18 = async (secs, schedule, { opts = {}, kit = false } = {}) => {
    const f = document.createElement('iframe');
    f.style.cssText = 'position:fixed;left:0;top:0;width:800px;height:380px;opacity:0.01;pointer-events:none;z-index:-1';
    f.src = `/?r18=${Math.random()}#/settings`;
    document.body.append(f);
    await new Promise((r) => { f.onload = r; });
    await sleep(300);
    const w = f.contentWindow;
    const OAC = w.OfflineAudioContext;
    w.AudioContext = function () { return new OAC(2, Math.ceil(secs * SR), SR); };
    w.webkitAudioContext = w.AudioContext;
    try {
      const A = await w.eval(`import("${location.origin}/js/audio.js")`);
      const D = await w.eval(`import("${location.origin}/js/drums.js")`);
      A.setAudioOptions({ bassVol: 2, clickVol: 1.2, padVol: 1, padTone: 1500, drumVol: 0.8, ...opts });
      const ac = A.audioCtx();
      if (!(ac instanceof OAC)) throw new Error('the iframe already had a live AudioContext');
      await A.whenReady(10000);
      if (kit) await D.loadKit();
      await schedule({ A, D, ac, w });
      const buf = await ac.startRendering();
      return { buf, samples: A.samplesReady() };
    } finally { f.remove(); }
  };
  const db = (x) => +(20 * Math.log10(Math.max(1e-9, x))).toFixed(2);
  const peak = (d, a, b) => { let m = 0; for (let i = Math.max(0, Math.floor(a * SR)); i < Math.min(d.length, Math.floor(b * SR)); i++) m = Math.max(m, Math.abs(d[i])); return m; };
  const onset = (d, t, thr = 0.01) => { for (let i = Math.max(0, Math.floor((t - 0.002) * SR)); i < Math.min(d.length, Math.floor((t + 0.2) * SR)); i++) if (Math.abs(d[i]) > thr) return +((i / SR - t) * 1000).toFixed(2); return null; };

  window.__onsets18 = async () => {
    const T = { tap: 0.005, click: 0.5, kick: 1.5, snare: 2.5, hhc: 3.5, bass: 4.5, arp: 5.5, epiano: 6.5, pad: 7.5 };
    const { buf, samples } = await window.__render18(9, ({ A, D }) => {
      A.tapTick();
      A.click(T.click, 2);
      D.playDrum('kick', T.kick, 0.95, 1); D.playDrum('snare', T.snare, 0.95, 1); D.playDrum('hhc', T.hhc, 0.95, 1);
      A.playNote(40, T.bass, 0.5, 1);
      A.arpNote(57, T.arp, 2);
      A.padSet([57], T.epiano, 'epiano'); A.padStop(T.epiano + 0.5);
      A.padSet([57], T.pad, 'pad'); A.padStop(T.pad + 0.6);
    }, { kit: true, opts: { clickVol: 1.5, padVol: 4.5, padTone: 3200, drumVol: 1 } });
    const d = buf.getChannelData(0);
    // the pad swells (time constant 0.12 s): its threshold onset says little; the rest have attacks of 0-4 ms
    return { samples, ms: Object.fromEntries(Object.entries(T).map(([k, t]) => [k, onset(d, t)])) };
  };

  // biquad low-pass (RBJ) applied twice: the pad band, the click (1.2-1.8 kHz) about 40 dB down
  const lowpass = (x, fc = 400) => {
    const w0 = (2 * Math.PI * fc) / SR, al = Math.sin(w0) / (2 * 0.707), c = Math.cos(w0);
    const b0 = (1 - c) / 2, b1 = 1 - c, b2 = (1 - c) / 2, a0 = 1 + al, a1 = -2 * c, a2 = 1 - al;
    let y = x;
    for (let pass = 0; pass < 2; pass++) {
      const o = new Float32Array(y.length); let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
      for (let i = 0; i < y.length; i++) { const v = (b0 * y[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0; x2 = x1; x1 = y[i]; y2 = y1; y1 = v; o[i] = v; }
      y = o;
    }
    return y;
  };
  const rmsWin = (d, a, b) => { let s = 0, n = 0; for (let i = Math.floor(a * SR); i < Math.floor(b * SR); i++) { s += d[i] * d[i]; n++; } return Math.sqrt(s / n); };

  window.__clicks18 = async () => {
    const out = [];
    const bpm = 120, beat = 0.5;
    const pattern = [2, 0, 1, 0, 1.5, 0, 1, 0];   // accent, sub, beat, sub, group accent, sub, beat, sub
    const times = []; for (let bar = 0; bar < 2; bar++) pattern.forEach((L, i) => times.push([1 + bar * 2 + (i * beat) / 2, L]));
    for (const pct of [20, 40, 60, 80, 100]) {
      const clickVol = (pct / 100) * 1.5;
      const alone = await window.__render18(6, ({ A }) => { for (const [t, L] of times) A.click(t, L); }, { opts: { clickVol } });
      const withPad = await window.__render18(6, ({ A }) => { A.padSet([48, 52, 55, 59], 0.05, 'pad'); for (const [t, L] of times) A.click(t, L); }, { opts: { clickVol } });
      const padOnly = await window.__render18(6, ({ A }) => { A.padSet([48, 52, 55, 59], 0.05, 'pad'); }, { opts: { clickVol } });
      const d = alone.buf.getChannelData(0);
      const lv = {}; for (const [t, L] of times) lv[L] = Math.max(lv[L] || 0, peak(d, t, t + 0.06));
      const lp1 = lowpass(withPad.buf.getChannelData(0)), lp0 = lowpass(padOnly.buf.getChannelData(0));
      let worst = 0, worstAt = null;
      for (const [t, L] of times) for (let a = t; a < t + 0.12; a += 0.005) { const r = db(rmsWin(lp1, a, a + 0.01) / rmsWin(lp0, a, a + 0.01)); if (r < worst) { worst = r; worstAt = `${L}@${t.toFixed(2)}`; } }
      out.push({ pct, clickVol: +clickVol.toFixed(3), accent: db(lv[2]), group: db(lv[1.5]), beat: db(lv[1]), sub: db(lv[0]), accentOverBeat: +(db(lv[2]) - db(lv[1])).toFixed(2), groupOverBeat: +(db(lv[1.5]) - db(lv[1])).toFixed(2), padDip: worst, padDipAt: worstAt });
    }
    return out;
  };

  /** A-weighted loudness of a mono signal between a and b seconds. */
  const aw = (f) => { const f2 = f * f; const ra = (12194 ** 2 * f2 * f2) / ((f2 + 20.6 ** 2) * Math.sqrt((f2 + 107.7 ** 2) * (f2 + 737.9 ** 2)) * (f2 + 12194 ** 2)); return ra * ra * 10 ** 0.2; };
  const fft = (re, im) => {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
    for (let len = 2; len <= n; len <<= 1) { const ang = (-2 * Math.PI) / len, wr = Math.cos(ang), wi = Math.sin(ang); for (let i = 0; i < n; i += len) { let cr = 1, ci = 0; for (let k = 0; k < len / 2; k++) { const a = i + k, b = a + len / 2; const vr = re[b] * cr - im[b] * ci, vi = re[b] * ci + im[b] * cr; re[b] = re[a] - vr; im[b] = im[a] - vi; re[a] += vr; im[a] += vi; [cr, ci] = [cr * wr - ci * wi, cr * wi + ci * wr]; } } }
  };
  const aLoud = (d, a, b) => {
    const F = 4096; let e = 0, n = 0; const W = new Float64Array(F / 2); for (let k = 1; k < F / 2; k++) W[k] = aw((k * SR) / F);
    for (let at = Math.floor(a * SR); at + F <= Math.min(d.length, b * SR); at += F) { const re = new Float64Array(F), im = new Float64Array(F); re.set(d.subarray(at, at + F)); fft(re, im); for (let k = 1; k < F / 2; k++) e += (2 * (re[k] ** 2 + im[k] ** 2) * W[k]) / F; n += F; }
    return +(10 * Math.log10(e / n)).toFixed(2);
  };

  window.__arpLoud18 = async ({ chord = [57, 61, 64, 67], hVol = 70 } = {}) => {
    const opts = { padVol: (hVol / 100) * 4.5, padTone: 3200, clickVol: 0 };
    const pad = await window.__render18(8, ({ A }) => { A.padSet(chord, 0.05, 'pad'); }, { opts });
    const padA = aLoud(pad.buf.getChannelData(0), 1, 7);
    const up = [...chord].sort((a, b) => a - b); const turn = [...up, ...up.slice(1, -1).reverse()];
    const rows = [];
    for (const bpm of [60, 120, 200]) for (const L of [1, 2, 3, 4]) {
      const len = 60 / bpm;
      const r = await window.__render18(8, ({ A }) => { let k = 0; for (let t = 0.05; t < 7.6; t += len / L) A.arpNote(turn[k++ % turn.length], t, L); }, { opts });
      rows.push(`${bpm} BPM x${L}: ${(aLoud(r.buf.getChannelData(0), 1, 7) - padA).toFixed(2)} dB against the pad (peak ${db(peak(r.buf.getChannelData(0), 1, 7))})`);
    }
    return { padA, rows };
  };

  window.__arpMix18 = async ({ style = 'rock16', bpm = 200, L = 4, bars = 4 } = {}) => {
    const M = (p) => import(location.origin + p);
    const { STYLES, beatHits, clickTimes } = await M('/js/practice/styles.js');
    const s = STYLES[style]; const len = 60 / bpm;
    const secs = bars * s.beats * len + 1.5;
    const { buf } = await window.__render18(secs, ({ A, D }) => {
      const chord = [52, 56, 59, 62, 66]; const up = [...chord]; const turn = [...up, ...up.slice(1, -1).reverse()]; let k = 0;
      for (let bar = 0; bar < bars; bar++) for (let beat = 0; beat < s.beats; beat++) {
        const t0 = 0.05 + (bar * s.beats + beat) * len;
        for (const [f, piece, v] of beatHits(s, L, bar, beat)) D.playDrum(piece, t0 + f * len, v, D.styleGain(style) * D.trackGain(s, piece));
        clickTimes(s, L).forEach((f, j) => A.click(t0 + f * len, j ? 0 : beat === 0 ? 2 : 1));
        for (let j = 0; j < L; j++) A.arpNote(turn[k++ % turn.length], t0 + (j * len) / L, L);
      }
    }, { kit: true, opts: { clickVol: 1.5, padVol: 4.5, padTone: 3200, drumVol: 1 } });
    let over = 0, pk = 0;
    for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < d.length; i++) { const x = Math.abs(d[i]); if (x > pk) pk = x; if (x > 0.85) over++; } }
    return { style, bpm, L, peak: db(pk), overKnee: over };
  };
  window.__audio18ready = true;
})();
