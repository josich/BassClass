// QA round 22 (d278266): the recorded take's judge (web/js/judge.js) against KNOWN answers.
// Needs qa/tools/recstudy.js loaded first (window.__rs). Inject from the qa tab (localhost:8878):
//   <script src="http://localhost:8882/judge22.js">  then  await __jq.run({ id, params, strings, bpm, sub, perf, cond, appClick })
// cond: recstudy's record() conditions (click: dB over the bass, clickHigh: the study's recording click; or
// appClick: dB, the APP's own recClick (4.6/5.0/5.3 kHz, 2 ms up, tau 1.5 ms) added after the render, through a
// crude speaker model (no lows, a short room tail)).
(() => {
  const SR = 48000;
  const M = (p) => import(location.origin + p);
  const median = (a) => { if (!a.length) return NaN; const s = [...a].sort((x, y) => x - y); const k = s.length >> 1; return s.length % 2 ? s[k] : (s[k - 1] + s[k]) / 2; };

  async function appClicks(clicks, n) {
    // the app's recClick, rendered exactly as audio.js schedules it
    const oc = new OfflineAudioContext(1, n, SR);
    const out = oc.createBiquadFilter(); out.type = 'highpass'; out.frequency.value = 420; out.connect(oc.destination);
    for (const c of clicks) {
      const o = oc.createOscillator(), g = oc.createGain();
      o.type = 'sine';
      o.frequency.value = c.level === 2 ? 5300 : c.level === 1.5 ? 5000 : 4600;
      const v = c.level === 2 ? 0.9 : c.level === 1.5 ? 0.8 : c.level === 1 ? 0.7 : 0.3;
      g.gain.setValueAtTime(0, c.t);
      g.gain.linearRampToValueAtTime(v, c.t + 0.002);
      g.gain.setTargetAtTime(0, c.t + 0.002, 0.0015);
      o.connect(g).connect(out);
      o.start(c.t); o.stop(c.t + 0.02);
    }
    const d = (await oc.startRendering()).getChannelData(0);
    // a short room tail (-18 dB, 0.25 s)
    const y = new Float32Array(d.length);
    let s = 0;
    for (let i = 0; i < d.length; i++) { s = 0.9995 * s + d[i]; y[i] = d[i] + 0.0006 * s * Math.sin(i * 1.7); }
    return y;
  }

  /** One take rendered by the study's harness, judged by the app's judge(), compared with the truth. */
  async function run({ id = 'sc-one-octave', params = {}, strings = 4, bpm = 80, sub = 2, perf = {}, cond = { mic: 'amp', click: null }, appClick = null, mutate = null } = {}) {
    const J = await M('/js/judge.js');
    const sc = await __rs.score(id, { params, strings, bpm, sub });
    const tk = await __rs.record(sc, perf, cond);
    let rec = tk.rec;
    if (appClick != null) {
      const cl = await appClicks(sc.clicks.map((c) => ({ ...c, t: c.t + tk.L })), rec.length);
      // the bass notes' median peak
      const pk = median(tk.truth.filter((x) => x.played && !x.ghost).map((x) => { const a = Math.round(x.tRec * SR); let p = 0; for (let i = a; i < Math.min(rec.length, a + 0.08 * SR); i++) p = Math.max(p, Math.abs(rec[i])); return p; })) || 0.1;
      let cp = 0; for (const v of cl) cp = Math.max(cp, Math.abs(v));
      const k = pk * 10 ** (appClick / 20) / cp;
      rec = Float32Array.from(rec, (v, i) => v + (cl[i] || 0) * k);
      let m = 0; for (const v of rec) m = Math.max(m, Math.abs(v));
      for (let i = 0; i < rec.length; i++) rec[i] *= 0.5 / m;
    }
    if (mutate) rec = mutate(rec, tk);
    const sched = { clicks: sc.clicks.filter((c) => c.t < sc.pre - 1e-9).map((c) => c.t), notes: sc.notes.map((n) => ({ t: n.t, midi: n.midi })) };
    const t0 = performance.now();
    const res = J.judge({ samples: rec, sr: SR, t0: 0 }, sched, { inputLatency: 0.012 });
    const ms = performance.now() - t0;
    // the truth, note by note
    const thrOf = (j) => { const n = sc.notes; const prevT = j ? n[j - 1].t : -1e9, nextT = n[j + 1]?.t ?? 1e9; const ioi = Math.min(n[j].t - prevT, nextT - n[j].t); return Math.min(0.05, Math.max(0.025, 0.2 * ioi)); };
    const rows = sc.notes.map((n, j) => {
      const tr = tk.truth.find((x) => x.i === j);
      const want = !tr.played ? 'missed' : ((tr.midiPlayed - n.midi) % 12 + 12) % 12 ? 'wrong' : 'ok';
      const r = res.notes[j];
      return { j, midi: n.midi, want, got: r.pitch, dtTrue: Math.round(tr.dt * 1000), dtGot: r.dt == null ? null : Math.round(r.dt * 1000), inTimeTrue: tr.played ? Math.abs(tr.dt) <= thrOf(j) + 1e-9 : null, inTimeGot: r.inTime ?? null };
    });
    const extraTrue = tk.truth.filter((x) => x.extra).length;
    const faults = rows.filter((r) => r.want !== 'ok').length + extraTrue + rows.filter((r) => r.inTimeTrue === false).length;
    const pitchErr = rows.filter((r) => r.want !== r.got && !(r.want === 'ok' && r.got === 'unclear'));
    const timeErr = rows.filter((r) => r.inTimeTrue != null && r.inTimeGot != null && r.inTimeTrue !== r.inTimeGot);
    const dtErr = rows.filter((r) => r.dtGot != null).map((r) => r.dtGot - r.dtTrue);
    return {
      id, strings, bpm, sub, n: rows.length, timing: res.timing, lag: Math.round(res.lag * 1000), L: Math.round(tk.L * 1000),
      clean: res.clean, truthClean: faults === 0, summary: res.summary, extraTrue,
      pitchErr: pitchErr.map((r) => `${r.j}:${r.midi} want ${r.want} got ${r.got}`),
      timeErr: timeErr.map((r) => `${r.j}: true ${r.dtTrue} got ${r.dtGot}`),
      dtErrMed: Math.round(median(dtErr)), dtErrMax: dtErr.length ? Math.max(...dtErr.map(Math.abs)) : null,
      ms: Math.round(ms),
    };
  }
  window.__jq = { run, appClicks };
})();
