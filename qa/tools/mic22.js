// QA round 22 (d278266): a stand-in microphone for the 🎙 recorded take (ui/exercise.js + judge.js), in the browser
// pane where the real microphone is blocked. Inject from the qa tab (localhost:8878):
//   <script src="http://localhost:8882/mic22.js">, then
//   await __mic22.install({ latency: 0.12, echo: true, faults: { skip: [3], wrong: [[5, 1]], late: [[7, 0.07]] } })
// - getUserMedia returns a fresh MediaStreamAudioDestinationNode stream of the app's own AudioContext;
// - every step the exercise's Player queues (Player.prototype._q, 'step') is "played" into that stream as a plucked
//   tone at its time + latency (the human playing along), with the planted faults;
// - echo: the recording click's oscillators (4600 / 5000 / 5300 Hz) are copied into the stream at time + latency
//   (the speaker's bleed); echo false = headphones.
// __mic22.log: { clicks: [{ f, when }], steps: [{ idx, time, midi }], gum: n }. __mic22.uninstall() restores all.
(() => {
  const M = (p) => import(location.origin + p);
  const st = { dest: null, opts: {}, orig: null, origStart: null, origQ: null, log: { clicks: [], steps: [], gum: 0 } };
  const REC = new Set([4600, 5000, 5300]);
  async function install(opts = {}) {
    const A = await M('/js/audio.js');
    const { Player } = await M('/js/player.js');
    st.opts = { latency: 0.12, echo: true, faults: {}, gumDelay: 0, ...opts };
    st.log = { clicks: [], steps: [], gum: 0 };
    if (!st.orig) st.orig = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = async () => {
      st.log.gum++;
      if (st.opts.gumDelay) await new Promise((r) => setTimeout(r, st.opts.gumDelay));
      if (st.opts.deny) { const e = new Error('Permission denied'); e.name = 'NotAllowedError'; throw e; }
      const ac = A.audioCtx();
      st.dest = ac.createMediaStreamDestination();
      return st.dest.stream;
    };
    if (!st.origStart) {
      st.origStart = OscillatorNode.prototype.start;
      OscillatorNode.prototype.start = function (when = 0, ...rest) {
        const f = this.frequency.value;
        if (!this.__qa) {
          st.log.clicks.push({ f, when });
          if (REC.has(f) && st.opts.echo && st.dest) {
            const ac = this.context;
            const o = ac.createOscillator(); o.__qa = true; o.frequency.value = f;
            const g = ac.createGain();
            const t = when + st.opts.latency;
            g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.5, t + 0.002); g.gain.setTargetAtTime(0, t + 0.002, 0.0015);
            o.connect(g).connect(st.dest);
            st.origStart.call(o, t); o.stop(t + 0.02);
          }
        }
        return st.origStart.call(this, when, ...rest);
      };
    }
    if (!st.origQ) {
      st.origQ = Player.prototype._q;
      Player.prototype._q = function (e) {
        if (e.type === 'step' && st.dest) {
          const step = this.inst?.steps?.[e.idx];
          const n = step?.notes?.[0];
          if (n && !step.rest && !step.silent) {
            const k = st.log.steps.length;
            const f = st.opts.faults || {};
            st.log.steps.push({ idx: e.idx, time: e.time, midi: n.play ?? n.midi });
            if (!(f.skip || []).includes(k)) {
              const semis = (f.wrong || []).find(([i]) => i === k)?.[1] || 0;
              const late = (f.late || []).find(([i]) => i === k)?.[1] || 0;
              pluck(this.inst, e.idx, (n.play ?? n.midi) + semis, e.time + st.opts.latency + late);
            }
          }
        }
        return st.origQ.call(this, e);
      };
    }
    return 'installed';
  }
  function pluck(inst, idx, midi, t) {
    const ac = st.dest.context;
    const f = 440 * 2 ** ((midi - 69) / 12);
    const o = ac.createOscillator(); o.__qa = true; o.type = 'sawtooth'; o.frequency.value = f;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400;
    const g = ac.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.4, t + 0.004); g.gain.setTargetAtTime(0, t + 0.004, 0.25);
    o.connect(lp).connect(g).connect(st.dest);
    o.start(t); o.stop(t + 1.2);
  }
  function uninstall() {
    if (st.orig) navigator.mediaDevices.getUserMedia = st.orig;
    if (st.origStart) OscillatorNode.prototype.start = st.origStart;
    M('/js/player.js').then(({ Player }) => { if (st.origQ) Player.prototype._q = st.origQ; st.origQ = null; });
    st.orig = null; st.origStart = null; st.dest = null;
    return 'uninstalled';
  }
  window.__mic22 = { install, uninstall, get log() { return st.log; }, get opts() { return st.opts; }, set opts(v) { Object.assign(st.opts, v); } };
})();
