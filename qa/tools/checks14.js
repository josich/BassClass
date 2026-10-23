// QA round 14 (1d6cd91) checks against known answers for the new features. Paste into the qa tab
// (http://localhost:8878) after the drum kit has loaded once (open the Practice room, Drums On).
//
// window.__qaSim(opts, secs, during?) : drives a practice/engine.js Room with a FAKE audio clock
//   (ac.currentTime overridden on the instance) and records, silently, every click oscillator start,
//   drum buffer start (name "piece:layer:rr") and setTargetAtTime (the open-hat choke). Times are
//   relative to the fake start (first beat at 0.08 s).
// window.__qaDrumCheck() : every style for 4 bars at 120 BPM: hits vs the pattern strings, velocity
//   layers, and where the open hi-hat is choked against the next closed/pedal hat.
// window.__qaRender(style, bpm, drumVol, clickVol, click, sub) : offline render of the drum chain
//   (drum bus -> compressor -8 dB / 10:1 -> sum with the click bus) and the peak / time in the soft
//   clip's knee (> 0.85).
// window.__qaLogClock() : practiceLog.js with a fake Date: a run across midnight, the 20-minute idle
//   cap, and a 2-hour gap with no timer tick followed by a touch and Stop.
//
// Results of this round (see qa/reports/1d6cd91-deep.md):
//  - metronome grid, accents, subdivisions, muted bars, speed-up: exact;
//  - funk: the open hat at step 14 is choked at the next bar's downbeat, not by the closed hat at
//    step 15 (expChoke 1.955 s, got 2.08 s at 120 BPM);
//  - drum peaks 0.54-0.91 at 100 % drums; RMS -16.7 dB (bossa) to -26.0 dB (reggae);
//  - 2-hour gap + touch: 7260 s credited.
window.__qaSimSetup = async () => {
  const A = await import('/js/audio.js');
  const { Room } = await import('/js/practice/engine.js');
  const D = await import('/js/drums.js');
  const ac = A.audioCtx();
  window.__qaBufName = new Map();
  const kit = await D.loadKit();
  for (const [p, layers] of Object.entries(kit)) layers.forEach((l, li) => l.forEach((b, ri) => window.__qaBufName.set(b, `${p}:${li}:${ri}`)));
  const P = { oS: OscillatorNode.prototype.start, bS: AudioBufferSourceNode.prototype.start, oT: OscillatorNode.prototype.stop, bT: AudioBufferSourceNode.prototype.stop, sT: AudioParam.prototype.setTargetAtTime };
  window.__qaSim = async (opts, secs, during) => {
    let fake = 1000;
    Object.defineProperty(ac, 'currentTime', { get: () => fake, configurable: true });
    const ev = [], ticks = [];
    OscillatorNode.prototype.start = function (when = 0) { ev.push({ k: 'click', when: when - 1000, f: this.frequency.value }); };
    OscillatorNode.prototype.stop = function () {};
    AudioBufferSourceNode.prototype.start = function (when = 0) { ev.push({ k: 'drum', when: when - 1000, name: window.__qaBufName.get(this.buffer) || '?' }); };
    AudioBufferSourceNode.prototype.stop = function () {};
    AudioParam.prototype.setTargetAtTime = function (target, when, tc) { ev.push({ k: 'choke', when: when - 1000, target, tc }); return this; };
    const r = new Room(opts, { onTick: (t) => ticks.push({ ...t, time: t.time - 1000 }) });
    try {
      r.playing = true; r.bpm = r.o.bpm; r.bar = 0; r.beat = 0; r.next = A.now() + 0.08;
      for (let i = 0; i < Math.round(secs / 0.025); i++) { fake += 0.025; r._tick(); if (during) during(r, fake - 1000); }
    } finally {
      delete ac.currentTime;
      OscillatorNode.prototype.start = P.oS; AudioBufferSourceNode.prototype.start = P.bS; OscillatorNode.prototype.stop = P.oT; AudioBufferSourceNode.prototype.stop = P.bT; AudioParam.prototype.setTargetAtTime = P.sT;
    }
    return { ev, ticks };
  };
};
window.__qaDrumCheck = async () => {
  const { STYLES } = await import('/js/practice/styles.js');
  const D = await import('/js/drums.js');
  const kit = await D.loadKit();
  const base = { bpm: 120, beats: 4, sub: 1, accent: true, click: false, play: 2, mute: 0, upBy: 0, upEvery: 4, drums: true, style: 'rock' };
  const res = {};
  for (const [key, s] of Object.entries(STYLES)) {
    const len = 0.5, per = s.beats * s.unit, barsRun = 4;
    const { ev } = await window.__qaSim({ ...base, style: key, beats: s.beats }, barsRun * s.beats * len + 0.05);
    const got = ev.filter((e) => e.k === 'drum' && e.when < 0.08 + barsRun * s.beats * len - 1e-9);
    const exp = [];
    for (let bar = 0; bar < barsRun; bar++) for (const [piece, steps] of Object.entries(s.tracks)) for (let i = 0; i < per; i++) { const v = steps[((bar % s.bars) * per + i) % steps.length]; if (v) exp.push({ piece, when: 0.08 + (bar * per + i) * len / s.unit, v }); }
    let missing = 0, wrongLayer = 0;
    for (const e of exp) {
      const m = got.find((h) => h.name.startsWith(e.piece + ':') && Math.abs(h.when - e.when) < 1e-6);
      if (!m) { missing++; continue; }
      if (+m.name.split(':')[1] !== Math.min(kit[e.piece].length - 1, Math.floor(e.v * kit[e.piece].length))) wrongLayer++;
    }
    const opens = got.filter((h) => h.name.startsWith('hho')).map((h) => h.when);
    const closers = got.filter((h) => /^(hhc|hhp|hhh):/.test(h.name)).map((h) => h.when).sort((a, b) => a - b);
    res[key] = { expHits: exp.length, gotHits: got.length, missing, wrongLayer, chokes: ev.filter((e) => e.k === 'choke').map((e) => +e.when.toFixed(4)), expChoke: opens.map((o) => closers.find((c) => c > o + 1e-9)).filter((x) => x != null).map((x) => +x.toFixed(4)) };
  }
  return res;
};
window.__qaLogClock = async () => {
  const L = await import('/js/practiceLog.js');
  const RealDate = Date;
  let fake = new RealDate(2026, 9, 23, 23, 50, 0).getTime();
  class FakeDate extends RealDate { constructor(...a) { if (a.length === 0) super(fake); else super(...a); } static now() { return fake; } }
  window.Date = FakeDate;
  const saved = localStorage.getItem('bassclass.log.v1');
  const res = {};
  try {
    const adv = (sec, step = 15) => { for (let t = 0; t < sec; t += step) { fake += step * 1000; L.lastDays(1); } };
    L.resetLog(); L.logPlaying(true);
    for (let m = 0; m < 15; m++) { window.dispatchEvent(new PointerEvent('pointerdown')); adv(60); }
    L.logPlaying(false); res.midnight = JSON.parse(localStorage.getItem('bassclass.log.v1'));
    L.resetLog(); fake = new RealDate(2026, 9, 24, 10, 0, 0).getTime();
    L.logPlaying(true); adv(45 * 60); L.logPlaying(false); res.idle45 = JSON.parse(localStorage.getItem('bassclass.log.v1'));
    L.resetLog(); fake = new RealDate(2026, 9, 24, 10, 0, 0).getTime();
    L.logPlaying(true); fake += 2 * 3600e3; window.dispatchEvent(new PointerEvent('pointerdown')); fake += 60e3; L.logPlaying(false);
    res.gap2hThenTouch = JSON.parse(localStorage.getItem('bassclass.log.v1'));
  } finally { window.Date = RealDate; if (saved == null) localStorage.removeItem('bassclass.log.v1'); else localStorage.setItem('bassclass.log.v1', saved); }
  return res;
};
