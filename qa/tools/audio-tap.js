// QA (53a1753): audio graph tap. Paste into the qa tab BEFORE the app creates its AudioContext (load
// the home screen, paste, then open an exercise and press Play with a real click). It:
//  - logs every oscillator (type, frequency, detune, start, stop, ended) in window.__osc;
//    pad voices are sawtooth -6 cents + triangle +5 cents (audio.js padSet);
//  - captures the output soft clipper (the only WaveShaper) and records, per 4096-sample block, the peak
//    of the clipper INPUT (limiter + click + pad) and of the pad alone (the lowpass that feeds the clipper);
//    window.__rec = [{ t, pre, pad, over }] where over = samples above 0.85 (the clipper's knee).
(() => {
  const AC = window.AudioContext;
  window.__osc = [];
  window.__rec = [];
  const oc = AC.prototype.createOscillator;
  AC.prototype.createOscillator = function () {
    const o = oc.call(this);
    const rec = { type: null, f: null, det: null, start: null, stop: null, ended: false, created: this.currentTime };
    window.__osc.push(rec);
    const st = o.start.bind(o), sp = o.stop.bind(o);
    o.start = (when = 0) => { rec.type = o.type; rec.f = o.frequency.value; rec.det = o.detune.value; rec.start = when; return st(when); };
    o.stop = (when = 0) => { rec.stop = when; return sp(when); };
    o.addEventListener('ended', () => { rec.ended = true; });
    return o;
  };
  const ws = AC.prototype.createWaveShaper;
  AC.prototype.createWaveShaper = function () {
    const n = ws.call(this);
    if (!window.__clip) {
      window.__clip = n;
      const ctx = this;
      const pre = ctx.createGain();
      const padTap = ctx.createGain();
      const merger = ctx.createChannelMerger(2);
      pre.connect(merger, 0, 0);
      padTap.connect(merger, 0, 1);
      const sp = ctx.createScriptProcessor(4096, 2, 1);
      merger.connect(sp);
      const mute = ctx.createGain(); mute.gain.value = 0;
      sp.connect(mute).connect(ctx.destination);
      sp.onaudioprocess = (e) => {
        const a = e.inputBuffer.getChannelData(0), b = e.inputBuffer.getChannelData(1);
        let pa = 0, pb = 0, over = 0;
        for (let i = 0; i < a.length; i++) { const x = Math.abs(a[i]); if (x > pa) pa = x; if (x > 0.85) over++; const y = Math.abs(b[i]); if (y > pb) pb = y; }
        if (window.__rec.length < 20000) window.__rec.push({ t: +e.playbackTime.toFixed(3), pre: +pa.toFixed(3), pad: +pb.toFixed(3), over });
      };
      window.__tap = { pre, padTap, sp };
    }
    return n;
  };
  const conn = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (dest, ...rest) {
    const r = conn.call(this, dest, ...rest);
    if (window.__clip && dest === window.__clip && window.__tap) {
      conn.call(this, window.__tap.pre);
      if (this instanceof BiquadFilterNode) conn.call(this, window.__tap.padTap);
    }
    return r;
  };
})();
