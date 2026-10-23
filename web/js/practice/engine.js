// The Practice room's engine: a lookahead scheduler (like the exercise player's) that plays the
// metronome; drums and harmony join it as layers. Each scheduled tick is reported with its time, so
// the screen can light the beat when it sounds.
import * as A from '../audio.js';
import { logPlaying } from '../practiceLog.js';

const LOOKAHEAD = 0.12;   // seconds scheduled ahead
const TICK_MS = 25;

export class Room {
  /** `o`: { bpm, beats, sub, accent, play, mute, upBy, upEvery }; `onTick({ time, bar, beat, sub, muted, level, bpm })`. */
  constructor(o, { onTick } = {}) {
    this.o = { ...o };
    this.onTick = onTick;
    this.playing = false;
    this.starting = false;
    this.token = 0;         // bumped by stop: cancels a start still waiting for the audio to wake
    this.bpm = o.bpm;       // the tempo now (the speed trainer raises it as it plays)
  }

  /** Changes apply from the next click; a new tempo also resets the speed trainer's climb. */
  set(patch) {
    Object.assign(this.o, patch);
    if ('bpm' in patch) this.bpm = patch.bpm;
  }

  async start() {
    if (this.playing || this.starting) return;
    this.starting = true;
    const token = ++this.token;
    // (a sleeping audio clock would jump on waking and stack the first clicks: wait for it)
    const ac = A.audioCtx();
    if (ac.state !== 'running') { try { await ac.resume(); } catch { /* plays as it can */ } }
    if (token !== this.token) return;
    this.starting = false;
    this.playing = true;
    this.bpm = this.o.bpm;
    this.bar = 0;
    this.pos = 0;            // the click inside the bar (beats × clicks per beat)
    this.next = A.now() + 0.08;
    this.timer = setInterval(() => this._tick(), TICK_MS);
    this._tick();
    logPlaying(true);
  }

  stop() {
    this.token++;
    this.starting = false;
    if (!this.playing) return;
    this.playing = false;
    clearInterval(this.timer);
    logPlaying(false);
  }

  _tick() {
    const end = A.now() + LOOKAHEAD;
    while (this.next < end) {
      const { beats, sub, accent, play, mute, upBy, upEvery } = this.o;
      if (this.pos >= beats * sub) { this.pos = 0; this.bar++; }   // (fewer beats or clicks since the last one)
      const beat = Math.floor(this.pos / sub), part = this.pos % sub;
      // muted bars: `play` bars with the click, then `mute` bars of silence to keep the time alone
      const muted = mute > 0 && this.bar % (play + mute) >= play;
      const level = part ? 0 : beat === 0 && accent ? 2 : 1;
      if (!muted) A.click(this.next, level);
      this.onTick?.({ time: this.next, bar: this.bar, beat, sub: part, muted, level, bpm: this.bpm });
      this.next += 60 / this.bpm / sub;
      this.pos++;
      if (this.pos >= beats * sub) {
        this.pos = 0;
        this.bar++;
        // speed up: a little faster every `upEvery` bars
        if (upBy && this.bar % upEvery === 0) this.bpm = Math.min(260, this.bpm + upBy);
      }
    }
  }
}
