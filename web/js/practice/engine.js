// The Practice room's engine: a lookahead scheduler (like the exercise player's) that plays one beat at
// a time: the metronome's clicks and, when they are on, the drum loop's hits inside that beat and the
// harmony's pad (a drone, or the chords of a progression, changing on their beats). Each beat and each
// chord change is reported with its time, so the screen can show it when it sounds.
import * as A from '../audio.js';
import { logPlaying } from '../practiceLog.js';
import { playDrum, kitReady, styleGain, trackGain } from '../drums.js';
import { STYLES, levelsOf, clickTimes, groupStarts, beatHits } from './styles.js';
import { progression, droneMidis } from './harmony.js';

const LOOKAHEAD = 0.12;   // seconds scheduled ahead
const TICK_MS = 25;

export class Room {
  /**
   * `o`: { bpm, beats, sub, accent, click, play, mute, upBy, upEvery, upTo, drums, style, countIn,
   *   harmony ('off' | 'drone' | 'chords'), hProg, hKey, notation };
   * `onTick({ time, bar, beat, muted, count, bpm, chord })` once per beat (`count`: the count-in bar;
   *   `chord`: { at, of }, this beat's place in the progression's chord sounding, else null);
   * `onChord({ time, idx })` when the harmony's chord changes (idx -1: the drone, null: none; in muted
   *   bars the form goes on, silent, and its chord is still reported).
   */
  constructor(o, { onTick, onChord } = {}) {
    this.o = { ...o };
    this.onTick = onTick;
    this.onChord = onChord;
    this.hSig = null;       // the pad sounding (its notes), null when silent
    this.playing = false;
    this.starting = false;
    this.token = 0;         // bumped by stop: cancels a start still waiting for the audio to wake
    this.bpm = o.bpm;       // the tempo now (speed up raises it as it plays)
  }

  /** Changes apply from the next beat; a new tempo also resets the speed-up's climb. */
  set(patch) {
    // (by value: an edit of My progression that changes nothing does not start it again)
    const changed = (k) => k in patch && JSON.stringify(patch[k]) !== JSON.stringify(this.o[k]);
    // a new key, progression or metre starts the progression again, on the next bar line; another
    // pattern in the same metre only regroups its bars (7/8 2 + 2 + 3 or 3 + 2 + 2)
    const restart = ['harmony', 'hProg', 'hKey', 'beats', 'myProg', 'myMinor'].some(changed);
    // (another sound plays from the next beat, the progression going on)
    if (changed('hSound')) this.hSig = null;
    const regroup = restart || changed('style') || changed('drums');
    Object.assign(this.o, patch);
    if (regroup) this.chords = null;
    if (restart) this.hRestart = true;
    if ('bpm' in patch) {
      this.bpm = patch.bpm;
      // the next beat counts from the last one at the new tempo: one left far ahead by a slow tempo
      // (the slider's left end, a moment ago) comes in at once
      if (this.playing && this.last != null) {
        const due = Math.max(this.last + 60 / this.bpm, A.now() + 0.03);
        if (due < this.next) {
          this.next = due;
          // the old beat's clicks and hits that would land after it are cut (a 1 BPM beat spreads them over a minute)
          for (const [t, node] of this.ahead) if (t >= due - 0.005) node.disconnect();
          this.ahead = this.ahead.filter(([t]) => t < due - 0.005);
        }
      }
    }
  }

  /** The progression's chords (cached until the key, progression or metre changes). */
  _chords() {
    const { harmony, hProg, hKey, beats, notation, drums, style, myProg, myMinor } = this.o;
    if (harmony !== 'chords') return null;
    if (!this.chords) {
      this.chords = progression(hProg, hKey, beats, { notation }, drums ? STYLES[style]?.groups : null, myProg, myMinor);
      this.hTotal = this.chords.reduce((a, c) => a + c.beats, 0);
    }
    return this.chords;
  }

  /**
   * The pad on this beat: the drone, the chord the progression has reached, or silence (off, muted bars).
   * Returns the beat's place in the chord ({ at, of }: beat `at` of its `of`), or null.
   */
  _harmony(t0, muted, len, L) {
    if (this.hRestart && this.beat === 0) { this.hRestart = false; this.hBeat = 0; }
    let midis = null, idx = null, place = null;
    if (!this.hRestart) {
      if (this.o.harmony === 'drone') { midis = droneMidis(this.o.hKey); idx = -1; }
      const chords = this._chords();
      if (chords) {
        let pos = this.hBeat % this.hTotal;
        idx = 0;
        while (pos >= chords[idx].beats) { pos -= chords[idx].beats; idx++; }
        midis = chords[idx].midis;
        place = { at: pos, of: chords[idx].beats };
      }
    }
    // (the same notes again sound on, as a held chord; new ones, or silence, replace them; muted bars are
    // silent while the form goes on)
    const sound = muted ? null : midis;
    if (idx !== this.hIdx) this.arpAt = 0;
    if (A.PAD_SOUNDS[this.o.hSound]?.arp) {
      // an arpeggio: the chord's notes up and down, one per subdivision of the beat, from its lowest at each change
      if (this.hSig != null) { A.padStop(t0); this.hSig = null; }
      if (sound) {
        const up = [...sound].sort((a, b) => a - b);
        const turn = up.length > 2 ? [...up, ...up.slice(1, -1).reverse()] : up;
        for (let k = 0; k < L; k++) {
          const t = t0 + (k * len) / L;
          const node = A.arpNote(turn[this.arpAt++ % turn.length], t, L);
          if (k) this.ahead.push([t, node]);
        }
      }
    } else {
      const sig = sound ? sound.join() : null;
      // (a struck sound, the e-piano, is struck again on each bar so a long chord does not die away)
      const restrike = sound && this.beat === 0 && A.PAD_SOUNDS[this.o.hSound]?.struck;
      if (sig !== this.hSig || restrike) {
        if (sound) A.padSet(sound, t0, this.o.hSound); else A.padStop(t0);
        this.hSig = sig;
      }
    }
    if (idx !== this.hIdx) { this.hIdx = idx; this.onChord?.({ time: t0, idx }); }
    this.hBeat++;
    return place;
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
    // with the drums or the harmony, a bar of clicks first when the count-in is on (Settings)
    this.bar = (this.o.drums || this.o.harmony !== 'off') && this.o.countIn ? -1 : 0;
    this.last = null;
    this.ahead = [];   // [time, node] of the clicks and hits inside the last beats, still to sound
    this.beat = 0;
    this.hBeat = 0;
    this.hSig = null;
    this.hIdx = null;
    this.hRestart = false;
    this.arpAt = 0;
    this.next = A.now() + 0.08;
    this.timer = setInterval(() => this._tick(), TICK_MS);
    this._tick();
    // (a play-along runs long untouched: the practice log counts up to an hour without a touch here)
    logPlaying(true, { idleMin: 60 });
  }

  stop() {
    this.token++;
    this.starting = false;
    if (!this.playing) return;
    this.playing = false;
    clearInterval(this.timer);
    // (what was scheduled ahead and has not sounded yet is cut: a slow arpeggio does not ring on after Stop)
    const now = A.now();
    for (const [t, node] of this.ahead) if (t > now) node.disconnect();
    this.ahead = [];
    if (this.hSig != null) A.padStop();
    this.hSig = null;
    if (this.hIdx != null) { this.hIdx = null; this.onChord?.({ time: A.now(), idx: null }); }
    logPlaying(false);
  }

  _tick() {
    const end = A.now() + LOOKAHEAD;
    while (this.next < end) {
      const { beats, sub, accent, click, play, mute, speedUp, upBy, upEvery, upTo = 660, drums, style } = this.o;
      if (this.beat >= beats) { this.beat = 0; this.bar++; }   // (fewer beats since the last one)
      const t0 = this.next, len = 60 / this.bpm;
      const count = this.bar < 0;
      // muted bars: `play` bars with the click (and drums), then `mute` bars of silence to keep the time alone
      const muted = !count && mute > 0 && this.bar % (play + mute) >= play;
      // with the drums on, the subdivision is the pattern's (its swing, shuffle or compound feel)
      const s = drums ? STYLES[style] : null;
      const L = s && !levelsOf(s).includes(sub) ? s.sub : sub;
      // the bar's first beat is the accent, an odd metre's group starts a lighter one
      const level = this.beat === 0 && accent ? 2 : accent && groupStarts(s).has(this.beat) ? 1.5 : 1;
      const now = A.now();
      this.ahead = this.ahead.filter(([t]) => t > now);
      if (count) A.click(t0, this.beat === 0 ? 2 : 1);
      else if (click && !muted) clickTimes(s, L).forEach((f, k) => { const node = A.click(t0 + f * len, k ? 0 : level); if (f) this.ahead.push([t0 + f * len, node]); });
      if (s && kitReady() && !muted && !count) {
        // in time order, so a closed hi-hat after an open one closes it
        const g = styleGain(style);
        for (const [f, piece, v] of beatHits(s, L, this.bar, this.beat)) {
          const t = t0 + f * len;
          const node = playDrum(piece, t, v, g * trackGain(s, piece));
          if (node && f) this.ahead.push([t, node]);
        }
      }
      const chord = count ? null : this._harmony(t0, muted, len, L);
      this.onTick?.({ time: t0, bar: this.bar, beat: this.beat, muted, count, bpm: this.bpm, chord });
      this.last = t0;
      this.next += len;
      if (++this.beat >= beats) {
        this.beat = 0;
        this.bar++;
        // speed up: a little faster every `upEvery` bars, up to `upTo`
        if (speedUp && upBy && this.bar > 0 && this.bar % upEvery === 0 && this.bpm < upTo) this.bpm = Math.min(upTo, 660, this.bpm + upBy);
      }
    }
  }
}
