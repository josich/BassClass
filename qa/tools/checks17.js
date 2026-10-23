// QA round 17 (f600870) checks: offline renders of the accompaniment as audio.js builds it now
// (accompaniment limiter -4.5 dB, knee 0, 20:1, 1 ms / 80 ms, then 1 / makeupGain(-4.5, 20); click, pad and
// drums into it; no pad limiter; the room's PAD_MAX 4.5; the harmony's sounds from audio.js PAD_SOUNDS)
// against the 77c1e47 graph (click and pad straight into the clip) and the v1.0.91 graph (70c3e4e: limiter
// -6 dB + x0.85, click / 0.85, pad limiter -8/6/12, PAD_MAX 2.5).
// Load as a CLASSIC script (it imports the app's modules by absolute URL, so it gets the app's instances):
//   python -m http.server 8882 --bind 127.0.0.1 --directory qa/tools
//   document.head.append(Object.assign(document.createElement('script'), { src: 'http://127.0.0.1:8882/checks17.js?' + Date.now() }))
// Needs the drum kit: await (await import('/js/drums.js')).loadKit()
(() => {
  const M = (p) => import(location.origin + p);
  const SR = 48000;
  const fft = (re, im) => {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
    for (let len = 2; len <= n; len <<= 1) {
      const ang = (-2 * Math.PI) / len, wr = Math.cos(ang), wi = Math.sin(ang);
      for (let i = 0; i < n; i += len) { let cr = 1, ci = 0; for (let k = 0; k < len / 2; k++) { const a = i + k, b = a + len / 2; const vr = re[b] * cr - im[b] * ci, vi = re[b] * ci + im[b] * cr; re[b] = re[a] - vr; im[b] = im[a] - vi; re[a] += vr; im[a] += vi; [cr, ci] = [cr * wr - ci * wi, cr * wi + ci * wr]; } }
    }
  };
  const aw = (f) => { const f2 = f * f; const ra = (12194 ** 2 * f2 * f2) / ((f2 + 20.6 ** 2) * Math.sqrt((f2 + 107.7 ** 2) * (f2 + 737.9 ** 2)) * (f2 + 12194 ** 2)); return ra * ra * 10 ** 0.2; };
  /** A-weighted loudness (dB) of channels between `a` and `b` seconds (frames of 4096). */
  const aLoud = (chans, a = 0, b = Infinity) => {
    const F = 4096; let e = 0, n = 0; const W = new Float64Array(F / 2); for (let k = 1; k < F / 2; k++) W[k] = aw((k * SR) / F);
    for (const d of chans) for (let at = Math.floor(a * SR); at + F <= Math.min(d.length, b * SR); at += F) { const re = new Float64Array(F), im = new Float64Array(F); re.set(d.subarray(at, at + F)); fft(re, im); for (let k = 1; k < F / 2; k++) e += (2 * (re[k] ** 2 + im[k] ** 2) * W[k]) / F; n += F; }
    return +(10 * Math.log10(e / n)).toFixed(2);
  };
  const stats = (buf, from = 0) => {
    let peak = 0, ss = 0, n = 0, over = 0;
    for (let c = 0; c < buf.numberOfChannels; c++) { const d = buf.getChannelData(c); for (let i = Math.floor(from * SR); i < d.length; i++) { const x = Math.abs(d[i]); if (x > peak) peak = x; ss += x * x; n++; if (x > 0.85) over++; } }
    return { peak: +(20 * Math.log10(peak)).toFixed(2), rms: +(10 * Math.log10(ss / n)).toFixed(2), overKnee: over };
  };
  const comp = (oc, threshold, knee, ratio, attack, release) => { const c = oc.createDynamicsCompressor(); c.threshold.value = threshold; c.knee.value = knee; c.ratio.value = ratio; c.attack.value = attack; c.release.value = release; return c; };
  const makeup = (t, r) => 10 ** ((0.6 * -t * (1 - 1 / r)) / 20);

  /** The accompaniment graphs: 'g77' (77c1e47), 'g91' (70c3e4e, v1.0.91), 'new' (f600870). Returns { click, pad, drums, out }. */
  const graph = async (oc, which, { clickVol = 0.6, padVol = 1, padTone = 1500, drumVol = 0.8 } = {}) => {
    const { drumChain } = await M('/js/audio.js');
    const out = oc.createGain();
    const click = oc.createGain(), pad = oc.createGain(), lp = oc.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = padTone; lp.Q.value = 0.3;
    pad.gain.value = 0.38 * padVol; pad.connect(lp);
    let drums = null;
    if (which === 'g77') { click.gain.value = clickVol; click.connect(out); lp.connect(out); return { click, pad, drums, out }; }
    const acc = which === 'g91' ? comp(oc, -6, 0, 20, 0.001, 0.08) : comp(oc, -4.5, 0, 20, 0.001, 0.08);
    const trim = oc.createGain(); trim.gain.value = which === 'g91' ? 0.85 : 1 / makeup(-4.5, 20);
    acc.connect(trim).connect(out);
    click.gain.value = which === 'g91' ? clickVol / 0.85 : clickVol; click.connect(acc);
    if (which === 'g91') lp.connect(comp(oc, -8, 6, 12, 0.01, 0.25)).connect(acc); else lp.connect(acc);
    const ch = drumChain(oc); const dv = oc.createGain(); dv.gain.value = drumVol; ch.output.connect(dv).connect(acc);
    drums = ch.input;
    return { click, pad, drums, out, acc };
  };
  const clickAt = (oc, dest, when, level) => {
    const o = oc.createOscillator(); const g = oc.createGain(); o.type = 'sine';
    o.frequency.value = level === 2 ? 1760 : level === 1.5 ? 1480 : level === 1 ? 1175 : 900;
    const v = level === 2 ? 0.9 : level === 1.5 ? 0.75 : level === 1 ? 0.6 : 0.25;
    g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(v, when + 0.001); g.gain.exponentialRampToValueAtTime(0.0001, when + (level === 0 ? 0.03 : 0.05));
    o.connect(g).connect(dest); o.start(when); o.stop(when + 0.07);
  };
  /** A chord on `sound` as padSet plays it (and padStop at `until`). */
  const chordAt = async (oc, dest, midis, when, until, sound = 'pad') => {
    const { PAD_SOUNDS } = await M('/js/audio.js');
    const kind = PAD_SOUNDS[sound];
    const peak = (0.16 / Math.sqrt(midis.length)) * kind.level;
    for (const m of midis) {
      const g = oc.createGain(); g.gain.value = 0; g.gain.setValueAtTime(0, when);
      const oscs = kind.voice(oc, 440 * 2 ** ((m - 69) / 12), when, g, peak);
      g.connect(dest);
      if (until != null) { g.gain.cancelAndHoldAtTime(until); g.gain.setTargetAtTime(0, until, kind.release ?? 0.15); for (const o of oscs) o.stop(until + 1.2); }
    }
  };
  const hits = async (oc, dest, s, L, bars, t0, bpm) => {
    const { voice, styleGain, trackGain } = await M('/js/drums.js'); const { beatHits } = await M('/js/practice/styles.js');
    const len = 60 / bpm; let openHat = null; let n = 0;
    for (let bar = 0; bar < bars; bar++) for (let beat = 0; beat < s.beats; beat++) {
      const tb = t0 + (bar * s.beats + beat) * len;
      for (const [f, piece, v] of beatHits(s, L, bar, beat)) {
        const vc = voice(piece, v); if (!vc) continue;
        const t = tb + f * len; const src = oc.createBufferSource(); src.buffer = vc.buffer;
        const g = oc.createGain(); g.gain.value = vc.gain * styleGain(s.key) * trackGain(s, piece);
        src.connect(g).connect(dest); src.start(t); n++;
        if (/^hh[chp]$/.test(piece) && openHat) { openHat.gain.setTargetAtTime(0, t, 0.015); openHat = null; }
        if (piece === 'hho') openHat = g;
      }
    }
    return n;
  };

  /** An exercise's click (levels per beat) and Backing pad through a graph: click peaks per level, pad RMS and A-weighted. */
  window.__ex17 = async ({ g = 'new', clickVol = 0.6, pad = [48, 52, 55, 59], levels = [2, 0, 1, 0, 1, 0, 1, 0], bpm = 100, bars = 2, padOn = true, clickOn = true } = {}) => {
    const beat = 60 / bpm; const per = levels.length / 4; const secs = bars * 4 * beat + 1.5;
    const oc = new OfflineAudioContext(1, Math.ceil(secs * SR), SR);
    const G = await graph(oc, g, { clickVol });
    G.out.connect(oc.destination);
    const times = [];
    if (clickOn) for (let b = 0; b < bars; b++) levels.forEach((L, i) => { const t = 0.8 + b * 4 * beat + (i / per) * beat; times.push([t, L]); clickAt(oc, G.click, t, L); });
    if (padOn) await chordAt(oc, G.pad, pad, 0.05, null);
    const buf = await oc.startRendering(); const d = buf.getChannelData(0);
    const pk = (a, b) => { let m = 0; for (let i = Math.floor(a * SR); i < Math.min(d.length, Math.floor(b * SR)); i++) m = Math.max(m, Math.abs(d[i])); return +(20 * Math.log10(m)).toFixed(2); };
    const rms = (a, b) => { let s = 0, n = 0; for (let i = Math.floor(a * SR); i < Math.floor(b * SR); i++) { s += d[i] * d[i]; n++; } return +(10 * Math.log10(s / n)).toFixed(2); };
    const byLevel = {};
    for (const [t, L] of times) (byLevel[L] ||= []).push(pk(t, t + 0.06));
    return { clicks: Object.fromEntries(Object.entries(byLevel).map(([L, a]) => [L, Math.max(...a)])), padRms: padOn ? rms(0.6, 0.78) : null, padA: padOn ? aLoud([d], 0.6, 0.78 + 0.1) : null, peak: pk(0, secs) };
  };

  /** The room: a pattern (or none), the click, the harmony's chords on a sound; peak, knee overs, A-weighted (whole, and pad alone). */
  window.__room17 = async ({ g = 'new', style = 'rock8', sub, drumVol = 1, clickVol = 1.5, hVol = 100, sound = 'pad', chords = [[52, 56, 59, 62, 66]], bars = 4, drums = true, click = true, bpm, restrike = true } = {}) => {
    const { STYLES, clickTimes } = await M('/js/practice/styles.js');
    const s = STYLES[style]; const B = bpm ?? s.bpm; const L = sub ?? s.sub; const len = 60 / B;
    const secs = bars * s.beats * len + 1.5;
    const oc = new OfflineAudioContext(2, Math.ceil(secs * SR), SR);
    const padMax = g === 'g91' ? 2.5 : 4.5;
    const G = await graph(oc, g, { clickVol, padVol: (hVol / 100) * padMax, padTone: g === 'g77' ? 1500 : 3200, drumVol });
    G.out.connect(oc.destination);
    if (drums && G.drums) await hits(oc, G.drums, s, L, bars, 0.05, B);
    if (click) for (let bar = 0; bar < bars; bar++) for (let beat = 0; beat < s.beats; beat++) { const t0 = 0.05 + (bar * s.beats + beat) * len; clickTimes(s, L).forEach((f, k) => clickAt(oc, G.click, t0 + f * len, k ? 0 : beat === 0 ? 2 : 1)); }
    if (chords) {
      const { PAD_SOUNDS } = await M('/js/audio.js');
      const struck = PAD_SOUNDS[sound].struck && restrike;
      // one chord per `bars / chords.length` bars; a struck sound again on each bar
      const per = bars / chords.length; const barLen = s.beats * len;
      for (let i = 0; i < chords.length; i++) {
        const from = 0.05 + i * per * barLen, to = 0.05 + (i + 1) * per * barLen;
        const strikes = struck ? Array.from({ length: Math.round(per) }, (_, k) => from + k * barLen) : [from];
        for (let k = 0; k < strikes.length; k++) {
          const end = k < strikes.length - 1 ? strikes[k + 1] : (i < chords.length - 1 ? to : null);
          await chordAt(oc, G.pad, chords[i], strikes[k], end, sound);
        }
      }
    }
    const buf = await oc.startRendering();
    return { ...stats(buf, 0.05), a: aLoud([buf.getChannelData(0), buf.getChannelData(1)], 0.3, secs - 1.2) };
  };

  /** Onsets: a click and a kick at the same time through the new graph; the first sample over -40 dB of each, alone. */
  window.__onsets17 = async () => {
    const { STYLES } = await M('/js/practice/styles.js'); const { voice, styleGain } = await M('/js/drums.js');
    const one = async (what) => {
      const oc = new OfflineAudioContext(1, SR, SR);
      const G = await graph(oc, 'new', { clickVol: 0.6, drumVol: 1 });
      G.out.connect(oc.destination);
      if (what === 'click') clickAt(oc, G.click, 0.2, 2);
      else { const vc = voice(what, 0.95); const src = oc.createBufferSource(); src.buffer = vc.buffer; const g = oc.createGain(); g.gain.value = vc.gain * styleGain('rock8'); src.connect(g).connect(G.drums); src.start(0.2); }
      const d = (await oc.startRendering()).getChannelData(0);
      const i = d.findIndex((x) => Math.abs(x) > 0.01);
      return +((i / SR - 0.2) * 1000).toFixed(2);
    };
    return { click: await one('click'), kick: await one('kick'), snare: await one('snare'), hhc: await one('hhc') };
  };

  /** Strings (or any sound) stopped: the largest sample-to-sample step near the oscillators' stop (until + 1.2 s) vs the steps just before. */
  window.__tail17 = async ({ sound = 'strings', midis = [52, 56, 59, 62], hVol = 100 } = {}) => {
    const oc = new OfflineAudioContext(1, Math.ceil(3.5 * SR), SR);
    const G = await graph(oc, 'new', { padVol: (hVol / 100) * 4.5, padTone: 3200 });
    G.out.connect(oc.destination);
    await chordAt(oc, G.pad, midis, 0.05, 1.0, sound);
    const d = (await oc.startRendering()).getChannelData(0);
    const win = (a, b) => { let m = 0, j = 0; for (let i = Math.floor(a * SR) + 1; i < Math.floor(b * SR); i++) { const s = Math.abs(d[i] - d[i - 1]); if (s > m) m = s; } return m; };
    const lvl = (a, b) => { let m = 0; for (let i = Math.floor(a * SR); i < Math.floor(b * SR); i++) m = Math.max(m, Math.abs(d[i])); return m; };
    const db = (x) => +(20 * Math.log10(x || 1e-9)).toFixed(1);
    return { held: db(lvl(0.7, 0.99)), before: db(lvl(2.1, 2.19)), stepBefore: db(win(2.1, 2.19)), stepAtStop: db(win(2.195, 2.21)), after: db(lvl(2.21, 2.3)) };
  };
  window.__checks17 = 'loaded';
})();
