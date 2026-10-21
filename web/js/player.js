// Sample-accurate exercise playback (lookahead scheduler) with UI sync callbacks.
import * as A from './audio.js';
import { harmonyAt } from './harmony.js';

const LOOKAHEAD = 0.12;   // seconds scheduled ahead
const TICK_MS = 25;
export const MIN_BPM = 30;
export const MAX_BPM = 260;

export class Player {
  constructor(cb = {}) {
    this.cb = cb;               // { onStep(idx), onBeat(level, beatInBar), onState(playing), onLoop(n, bpm, done) }
    this.inst = null;
    this.bpm = 80;
    this.sub = 2;               // notes per beat for uniform exercises
    this.loop = true;
    this.metro = true;
    this.clickSubs = false;     // also click subdivisions
    this.sound = true;
    this.countIn = true;
    this.trainer = { on: false, inc: 4, target: 160 };
    this.playing = false;
    this.cur = 0;
    this._timer = null;
    this._raf = null;
    this.queue = [];
    this._token = 0;            // bumped by pause/stop: cancels a play() still waiting for samples
  }

  load(inst, { keepStep = false } = {}) {
    const was = this.playing;
    this.stop(true);
    this.inst = inst;
    if (!keepStep || this.cur >= inst.steps.length) this.cur = 0;
    this._layout();
    A.prepare(inst.steps.flatMap((s) => s.notes.map((n) => n.midi)));
    return was;
  }

  _layout() {
    const inst = this.inst;
    const bpb = inst.beatsPerBar || 4;
    this.fillLen = new WeakMap();
    let b = 0;
    this.starts = inst.steps.map((s) => {
      const st = b;
      let len = this.beatsOf(s);
      if (s.fill) {
        // a closing note held to the next bar line (a whole bar when it starts on one),
        // so the loop and the next key start on beat 1 at any subdivision
        const toBar = Math.ceil(st / bpb - 1e-9) * bpb - st;
        len = Math.max(len, toBar > 1e-9 ? toBar : bpb);
        this.fillLen.set(s, len);
      }
      b += len;
      return st;
    });
    this.total = Math.max(bpb, Math.ceil(b / bpb - 1e-9) * bpb);
  }

  beatsOf(step) {
    const fill = this.fillLen?.get(step);
    if (fill != null) return fill;
    return this.inst.uniform ? step.dur / this.sub : step.dur;
  }

  setSub(sub) { this.sub = sub; if (this.inst) this._relayout(); }
  _relayout() {
    const was = this.playing;
    if (was) this.pause();
    this._layout();
    if (was) this.play();
  }

  setBpm(bpm) {
    bpm = Math.max(MIN_BPM, Math.min(MAX_BPM, Math.round(bpm) || MIN_BPM));
    if (this.playing) {
      // re-anchor at the next scheduled event so the change is seamless
      // (clicks only count while they are actually being scheduled)
      const clicking = this.metro || this.nextClickAbs < this.countInEnd;
      const b = clicking ? Math.min(this.nextStepAbs, this.nextClickAbs) : this.nextStepAbs;
      this.anchorTime = this._time(b);
      this.anchorBeat = b;
    }
    this.pendingBpm = null; // a manual change overrides a speed-trainer step not yet applied
    this.bpm = bpm;
    // a loop is credited at the slowest tempo it was played at
    if (this.playing) this.loopMin = Math.min(this.loopMin ?? bpm, bpm);
  }

  _time(absBeat) { return this.anchorTime + (absBeat - this.anchorBeat) * (60 / this.bpm); }

  async play() {
    if (!this.inst || this.playing || this._starting) return;
    this._starting = true;
    const token = ++this._token;
    A.audioCtx();
    await A.whenReady();
    // leaving the exercise (or pressing pause) while samples loaded cancels this start
    if (token !== this._token) return;
    this._starting = false;
    if (this.playing || !this.inst) return;
    const ac = A.audioCtx();
    // synthesize every string sound up front so the scheduler never stalls
    A.prepare(this.inst.steps.flatMap((s) => s.notes.map((n) => n.play ?? n.midi)));
    this.playing = true;
    const startBeat = this.starts[this.cur] || 0;
    const pre = this.countIn ? (this.inst.beatsPerBar || 4) : 0;
    this.anchorTime = ac.currentTime + 0.08;
    this.anchorBeat = startBeat - pre;
    this.loopBase = 0;
    this.loopN = 0;
    // only a pass that starts on the first note is a full loop (one started from ◀ or a tap on the strip is not)
    this.loopFull = this.cur === 0;
    this.loopMin = this.bpm;
    this.si = this.cur;
    this.nextStepAbs = startBeat;
    this.nextClickAbs = Math.ceil(startBeat - pre - 1e-9);
    this.countInEnd = startBeat;
    this.endAbs = null;
    this.pendingBpm = null;
    this.queue = [];
    this._timer = setInterval(() => this._tick(), TICK_MS);
    this._tick();
    this._frame();
    this.cb.onState?.(true);
  }

  pause() {
    this._token++;
    this._starting = false;
    if (!this.playing) return;
    this.playing = false;
    A.padStop();
    this.padPrimed = false;
    clearInterval(this._timer);
    cancelAnimationFrame(this._raf);
    this.queue = [];
    this.cb.onState?.(false);
  }

  stop(silent = false) {
    this.pause();
    if (!silent) { this.cur = 0; this.cb.onStep?.(-1); }
  }

  toggle() { (this.playing || this._starting) ? this.pause() : this.play(); }

  /** Manual stepping: move to step i and sound it. */
  stepTo(i, sound = true) {
    if (!this.inst) return;
    const n = this.inst.steps.length;
    this.cur = ((i % n) + n) % n;
    const st = this.inst.steps[this.cur];
    if (sound && this.sound) {
      A.audioCtx();
      const t = A.now() + 0.01;
      for (const note of st.notes) A.playNote(note.play ?? note.midi, t, 0.9, st.vel ?? 1, note.tag === 'x', note.tag === '◊');
    }
    this.cb.onStep?.(this.cur);
  }

  _tick() {
    const ac = A.audioCtx();
    const horizon = ac.currentTime + LOOKAHEAD;
    const steps = this.inst.steps;
    const bpb = this.inst.beatsPerBar || 4;
    const clickInc = this.clickSubs && this.inst.uniform ? 1 / this.sub : 1;
    for (let guard = 0; guard < 512; guard++) {
      // a speed-trainer step takes effect at the loop point, once every click before it is scheduled
      if (this.pendingBpm) {
        const clicking = this.metro || this.nextClickAbs < this.countInEnd;
        const nextAbs = Math.min(this.nextStepAbs, clicking ? this.nextClickAbs : Infinity);
        if (nextAbs >= this.pendingBpm.at - 1e-9) {
          this.anchorTime = this._time(this.pendingBpm.at);
          this.anchorBeat = this.pendingBpm.at;
          this.bpm = this.pendingBpm.bpm;
          this.pendingBpm = null;
        }
      }
      const tStep = this.endAbs == null ? this._time(this.nextStepAbs) : Infinity;
      const clickOk = (this.metro || this.nextClickAbs < this.countInEnd) && (this.endAbs == null || this.nextClickAbs < this.endAbs - 1e-9);
      const tClick = clickOk ? this._time(this.nextClickAbs) : Infinity;
      const t = Math.min(tStep, tClick);
      if (t > horizon) break;
      if (tClick <= tStep && tClick < ac.currentTime - 0.02) {
        // stale clicks (metronome was off): jump straight to the next upcoming click
        const nowBeat = this.anchorBeat + ((ac.currentTime - this.anchorTime) * this.bpm) / 60;
        this.nextClickAbs = Math.max(this.nextClickAbs + clickInc, Math.ceil(nowBeat / clickInc - 1e-9) * clickInc);
        continue;
      }
      if (tClick <= tStep) {
        const rel = this.nextClickAbs - this.loopBase;
        const inBar = ((rel % bpb) + bpb) % bpb;
        const onBeat = Math.abs(inBar - Math.round(inBar)) < 1e-6;
        const level = !onBeat ? 0 : Math.round(inBar) % bpb === 0 ? 2 : 1;
        const bar = Math.floor((rel + 1e-6) / bpb);
        const counting = this.nextClickAbs < this.countInEnd;
        const muted = !counting && (
          (this.inst.clickBeats && (!onBeat || !this.inst.clickBeats.includes(Math.round(inBar) % bpb)))
          || (this.inst.clickEvery && ((bar % this.inst.clickEvery) + this.inst.clickEvery) % this.inst.clickEvery !== 0));
        if (!muted) A.click(tClick, this.inst.clickBeats && !counting ? 1 : level);
        if (onBeat) this._q({ time: tClick, type: 'beat', level, beat: Math.round(inBar) });
        this.nextClickAbs += clickInc;
        continue;
      }
      // schedule a step
      const idx = this.si;
      const step = steps[idx];
      if (idx === 0) this.loopMin = this.bpm; // a pass starts at the tempo of its first note
      const beats = this.beatsOf(step);
      const secs = beats * (60 / this.bpm);
      // backing pad: a new harmony starts with its step (and the first step played sets it up)
      if (this.harmony) {
        const hm = this.padPrimed ? this.harmony[idx] : harmonyAt(this.harmony, idx);
        if (hm) A.padSet(hm, tStep);
        this.padPrimed = true;
      }
      if (this.sound && !step.rest && !step.silent) {
        const rel = this.starts[idx];
        const onBeat = Math.abs(rel - Math.round(rel)) < 1e-6;
        const vel = step.vel ?? (step.accent ? 1 : onBeat ? 0.88 : 0.74);
        for (const n of step.notes) {
          const tag = n.tag;
          const v = tag === 'H' || tag === 'PO' || tag === 'sl' ? vel * 0.7 : vel;
          A.playNote(n.play ?? n.midi, tStep, secs * 0.94, v, tag === 'x', tag === '◊');
        }
      }
      this._q({ time: tStep, type: 'step', idx });
      this.si++;
      if (this.si >= steps.length) {
        if (this.loop) {
          this.loopBase += this.total;
          this.si = 0;
          this.nextStepAbs = this.loopBase + this.starts[0];
          this.loopN++;
          // `done` is the tempo of the loop just completed (what "best BPM" may credit): its slowest
          // tempo, and null when the pass did not start on the first note
          const done = this.loopFull ? Math.min(this.loopMin, this.bpm) : null;
          this.loopFull = true;
          if (this.trainer.on && this.bpm < this.trainer.target) {
            const nb = Math.min(this.trainer.target, this.bpm + this.trainer.inc);
            // the rest of this loop (clicks after the last note) keeps the old tempo
            this.pendingBpm = { at: this.loopBase, bpm: nb };
            this._q({ time: this._time(this.loopBase), type: 'loop', n: this.loopN, bpm: nb, done });
          } else {
            this._q({ time: this._time(this.loopBase), type: 'loop', n: this.loopN, bpm: this.bpm, done });
          }
        } else {
          this.endAbs = this.loopBase + this.total;
          if (this.harmony) A.padStop(this._time(this.endAbs));
          // (`full`: the pass started on the first note, so it was played through)
          this._q({ time: this._time(this.endAbs), type: 'end', full: this.loopFull });
        }
      } else {
        this.nextStepAbs = this.loopBase + this.starts[this.si];
      }
    }
  }

  /** Insert a UI event keeping the queue in time order. */
  _q(e) {
    // UI events drain on animation frames; if frames are paused (hidden app) keep the queue bounded
    if (this.queue.length > 3000) this.queue.splice(0, 1500);
    let i = this.queue.length;
    while (i > 0 && this.queue[i - 1].time > e.time) i--;
    this.queue.splice(i, 0, e);
  }

  _frame() {
    const ac = A.audioCtx();
    const t = ac.currentTime;
    while (this.queue.length && this.queue[0].time <= t + 0.005) {
      const e = this.queue.shift();
      if (e.type === 'step') { this.cur = e.idx; this.cb.onStep?.(e.idx); }
      else if (e.type === 'beat') this.cb.onBeat?.(e.level, e.beat);
      else if (e.type === 'loop') this.cb.onLoop?.(e.n, e.bpm, e.done);
      else if (e.type === 'end') { this.pause(); this.cur = 0; this.cb.onEnd?.(e.full); return; }
    }
    if (this.playing) this._raf = requestAnimationFrame(() => this._frame());
  }
}
