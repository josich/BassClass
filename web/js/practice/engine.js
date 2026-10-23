// The Practice room's engine: a lookahead scheduler (like the exercise player's) that plays one beat at
// a time: the metronome's clicks and, when they are on, the drum loop's hits inside that beat. Each beat
// is reported with its time, so the screen can light it when it sounds.
import * as A from '../audio.js';
import { logPlaying } from '../practiceLog.js';
import { playDrum, kitReady } from '../drums.js';
import { STYLES, levelsOf, stepTime, clickTimes } from './styles.js';

const LOOKAHEAD = 0.12;   // seconds scheduled ahead
const TICK_MS = 25;

export class Room {
  /**
   * `o`: { bpm, beats, sub, accent, click, play, mute, upBy, upEvery, drums, style };
   * `onTick({ time, bar, beat, muted, bpm })` once per beat.
   */
  constructor(o, { onTick } = {}) {
    this.o = { ...o };
    this.onTick = onTick;
    this.playing = false;
    this.starting = false;
    this.token = 0;         // bumped by stop: cancels a start still waiting for the audio to wake
    this.bpm = o.bpm;       // the tempo now (speed up raises it as it plays)
  }

  /** Changes apply from the next beat; a new tempo also resets the speed-up's climb. */
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
    this.beat = 0;
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
      const { beats, sub, accent, click, play, mute, upBy, upEvery, drums, style } = this.o;
      if (this.beat >= beats) { this.beat = 0; this.bar++; }   // (fewer beats since the last one)
      const t0 = this.next, len = 60 / this.bpm;
      // muted bars: `play` bars with the click (and drums), then `mute` bars of silence to keep the time alone
      const muted = mute > 0 && this.bar % (play + mute) >= play;
      // with the drums on, the subdivision is the pattern's (its swing, shuffle or compound feel)
      const s = drums ? STYLES[style] : null;
      const L = s && !levelsOf(s).includes(sub) ? s.sub : sub;
      if (click && !muted) clickTimes(s, L).forEach((f, k) => A.click(t0 + f * len, k ? 0 : this.beat === 0 && accent ? 2 : 1));
      if (s && kitReady() && !muted) {
        const at = ((this.bar % s.bars) * s.beats + this.beat) * s.grid;
        for (const [piece, steps] of Object.entries(s.tracks)) {
          for (let j = 0; j < s.grid; j++) {
            const v = steps[(at + j) % steps.length];
            if (!v) continue;
            // (swung, a 16th "a" lands on the last triplet unless that triplet has its own stroke)
            if (s.grid === 4 && L === 3 && j === 3 && steps[(at + 2) % steps.length]) continue;
            const f = stepTime(s, L, j, piece, v);
            if (f != null) playDrum(piece, t0 + f * len, v);
          }
        }
      }
      this.onTick?.({ time: t0, bar: this.bar, beat: this.beat, muted, bpm: this.bpm });
      this.next += len;
      if (++this.beat >= beats) {
        this.beat = 0;
        this.bar++;
        // speed up: a little faster every `upEvery` bars
        if (upBy && this.bar % upEvery === 0) this.bpm = Math.min(260, this.bpm + upBy);
      }
    }
  }
}
