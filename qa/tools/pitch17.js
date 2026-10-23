// (round 17 copy of pitch-check.js loadable as a classic script: imports and fetches by absolute URL)
// QA: pitch checks (paste into the qa server tab).
// 1) window.__yinSynth(): yin() on synthetic bass tones at the tuner's analysis rate (12 kHz, 2048
//    samples): weak fundamental, noise, detune; plus the selected-string octave folding.
// 2) window.__samplePitch(from, to): decode each regular sample (OfflineAudioContext, 22.05 kHz) and
//    measure its pitch with yin over several windows after the attack; report cents vs its MIDI note.
window.__yinSynth = async () => {
  const { yin, freqToNote, midiFreq } = await import(location.origin + '/js/pitch.js');
  const sr = 12000, N = 2048;
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const tone = (f, { fundamental = 1, harm = [1, 0.8, 0.6, 0.45, 0.3, 0.2], noise = 0, phase0 = 0 } = {}) => {
    const b = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      let v = 0;
      harm.forEach((a, k) => { v += (k === 0 ? fundamental : a) * Math.sin(2 * Math.PI * f * (k + 1) * i / sr + phase0 * (k + 1)); });
      b[i] = v * 0.2 + (rnd() * 2 - 1) * noise;
    }
    return b;
  };
  const out = [];
  const strings = [23, 28, 33, 38, 43, 48];
  for (const m of strings) {
    for (const det of [0, -7, 23, -45]) {
      for (const [name, o] of [['clean', {}], ['weak fundamental', { fundamental: 0.08 }], ['noise', { noise: 0.06 }], ['weak f0 + noise', { fundamental: 0.1, noise: 0.05 }]]) {
        const f = midiFreq(m) * Math.pow(2, det / 1200);
        const r = yin(tone(f, o), sr);
        if (!r) { out.push({ m, det, name, res: 'null' }); continue; }
        const nn = freqToNote(r.freq);
        const err = 1200 * Math.log2(r.freq / f);
        if (Math.abs(err) > 2) out.push({ m, det, name, got: +r.freq.toFixed(2), want: +f.toFixed(2), errCents: +err.toFixed(2), note: nn.midi, clarity: +r.clarity.toFixed(2) });
      }
    }
  }
  // folding: detected an octave high / low while tuning string m
  const fold = [];
  for (const m of strings) for (const k of [-1, 1, 2]) {
    const tf = midiFreq(m);
    let f = tf * Math.pow(2, k) * Math.pow(2, 6 / 1200);
    f *= Math.pow(2, Math.round(Math.log2(tf / f)));
    const c = 1200 * Math.log2(f / tf);
    if (Math.abs(c - 6) > 0.01) fold.push({ m, k, c });
  }
  return { failures: out, foldFailures: fold, cases: strings.length * 16 };
};
window.__samplePitch = async (from = 23, to = 64) => {
  const { yin } = await import(location.origin + '/js/pitch.js');
  const man = await fetch(location.origin + '/audio/bass/manifest.json').then((r) => r.json());
  const res = [];
  for (const [kind, map] of [['reg', man.reg], ['ghost', man.ghost]]) {
    for (const [midiS, file] of Object.entries(map)) {
      const midi = Number(midiS);
      if (midi < from || midi > to) continue;
      const data = await fetch(location.origin + '/audio/bass/' + file).then((r) => r.arrayBuffer());
      let buf;
      try { buf = await new OfflineAudioContext(1, 1, 22050).decodeAudioData(data); } catch (e) { res.push({ kind, midi, err: 'decode failed ' + e.message }); continue; }
      if (kind === 'ghost') { res.push({ kind, midi, ok: true, dur: +buf.duration.toFixed(3) }); continue; }
      const ch = buf.getChannelData(0), sr = buf.sampleRate;
      const ests = [];
      for (const t of [0.15, 0.3, 0.45, 0.6]) {
        const s = Math.floor(t * sr);
        if (s + 4096 > ch.length) break;
        const r = yin(ch.subarray(s, s + 4096), sr, { fmin: 26, fmax: 700 });
        if (r) ests.push(r.freq);
      }
      ests.sort((a, b) => a - b);
      const f = ests[Math.floor(ests.length / 2)];
      const want = 440 * Math.pow(2, (midi - 69) / 12);
      res.push({ kind, midi, sr, dur: +buf.duration.toFixed(2), cents: f ? +(1200 * Math.log2(f / want)).toFixed(1) : null, n: ests.length });
    }
  }
  return res;
};
