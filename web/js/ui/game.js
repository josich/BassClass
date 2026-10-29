// The tap games (curriculum/games.js; user, 2026-10-29: "step by step it sounds the note once and waits for the
// player's answer, clicking on the fretboard… after the answer it shows the result if wrong, or success with a
// growing note dot, then the next sound with a listen text on screen"). Ten rounds a set: each round sounds (or
// shows on the staff) its question, the player taps the neck, a right answer grows where it was tapped, a wrong one
// shows where it was and plays it again, and the next round comes by itself. No bass needed.
import { h, icon, toast, infoBtn } from './dom.js';
import { settings, getProgress, updateProgress } from '../store.js';
import { makeCtx } from '../fretboard.js';
import { FretboardView, degKey } from '../views/fretboardView.js';
import { bassClef } from '../views/staff.js';
import { moduleOf, LEVELS, defaultParams } from '../curriculum/index.js';
import { placesOf } from '../curriculum/games.js';
import { paramOptions } from './exercise.js';
import { setMastered, isMastered } from '../mastery.js';
import { logPlaying } from '../practiceLog.js';
import { spellMidi } from '../builder.js';
import * as A from '../audio.js';
import * as T from '../theory.js';

const ROUNDS = 10;
const HI = 12;   // the neck shown and asked: frets 0–12

export function gameScreen(root, tpl, { params = {}, onBack }) {
  const S = settings;
  const game = tpl.game;
  const prog = getProgress(tpl.id) || {};
  const p = { ...defaultParams(tpl), ...(prog.params || {}), ...params };
  for (const [k, def] of Object.entries(tpl.params || {})) {
    if (!paramOptions(def, S, p).some((o) => o[0] === p[k])) p[k] = def.default;
  }
  const ctx = makeCtx(S);
  const rand = Math.random;
  let round = null, n = 0, score = 0, streak = 0, best = 0, missed = false, found = new Set();
  let state = 'idle';   // idle (before the first round) · asking (the question sounds) · answer · done (feedback) · end
  const timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const clearTimers = () => { while (timers.length) clearTimeout(timers.pop()); };

  document.body.classList.add('in-ex');
  const btn = (name, title, onClick, cls = '') => h('button', { class: `icon-btn ${cls}`, title, 'aria-label': title, html: icon(name), onClick });
  const mod = moduleOf(tpl.module);
  const lvl = LEVELS[tpl.level - 1];
  const scoreEl = h('div', { class: 'game-score' });
  const optsSum = h('span', { class: 'opts-sum' });
  const optsBtn = h('button', { class: 'opts-btn', title: 'Change the game', onClick: () => openOptions() },
    h('span', { class: 'opts-ico', html: icon('sliders') }), h('span', { class: 'opts-txt' }, h('small', {}, 'Game · tap to change'), optsSum));
  const top = h('header', { class: 'exv-top' },
    btn('back', 'Back', () => close()),
    h('div', { class: 'exv-title' }, h('b', { title: tpl.title }, h('span', { class: 'ex-num' }, tpl.num), tpl.title), h('span', {}, `${mod?.name ?? ''} · a game, no bass needed · Level ${tpl.level} ${lvl ? lvl.name : ''}`)),
    optsBtn, h('div', { class: 'grow' }), scoreEl,
    infoBtn(tpl.about.split('\n\n'), `About ${tpl.title}`));
  const fbHost = h('div', { class: 'fb-host' });
  const boardEl = h('div', { class: 'exv-board' }, fbHost);
  const askEl = h('div', { class: 'game-ask' });
  const msgEl = h('div', { class: 'game-msg', role: 'status' });
  const replayBtn = h('button', { class: 'btn small', 'data-silent': '', onClick: () => { if (round && state !== 'end') sound(); } }, '↻ Hear it again');
  const promptEl = h('div', { class: 'game-prompt' }, askEl, msgEl, game.kind === 'ear' ? replayBtn : null);
  const dotsEl = h('div', { class: 'game-dots' });
  const startBtn = h('button', { class: 'btn primary', 'data-silent': '', onClick: () => startSet() }, '▶ Start');
  const ctrl = h('footer', { class: 'exv-ctrl game-ctrl' }, dotsEl, h('div', { class: 'grow' }), startBtn);
  const sheet = h('div', { class: 'sheet', onClick: (e) => { if (e.target === sheet) closeOptions(); } });
  const endEl = h('div', { class: 'game-end', hidden: true });
  const view = h('div', { class: 'exv game' }, top, h('div', { class: 'exv-stage' }, boardEl, promptEl, endEl), ctrl);
  root.replaceChildren(view, sheet);

  const fb = new FretboardView(fbHost, { onTap: (s, f) => tap(s, f) });
  fb.configure({ strings: ctx.tuning.length, names: ctx.names, tuning: ctx.tuning, lo: 0, hi: HI, lefty: S.lefty, zone: null });

  const say = (n) => T.noteName(n, S.notation);
  const summary = () => Object.entries(tpl.params || {}).map(([k, def]) => (paramOptions(def, S, p).find((o) => o[0] === p[k]) || [, ''])[1]).join(' · ');
  const drawScore = () => { scoreEl.textContent = state === 'idle' ? (prog.best != null ? `Best ${prog.best}/${ROUNDS}` : '') : `${score}/${marks.length} · 🔥 ${streak}`; };
  const drawDots = (marks = []) => {
    dotsEl.replaceChildren(...Array.from({ length: ROUNDS }, (_, i) => h('span', { class: `gd${i < marks.length ? (marks[i] ? ' ok' : ' no') : i === marks.length && state !== 'idle' && state !== 'end' ? ' now' : ''}` })));
  };
  const marks = [];
  optsSum.textContent = summary();
  drawScore();
  drawDots();
  idle();

  /** Before a set: what the game asks, and Start. */
  function idle() {
    state = 'idle';
    askEl.replaceChildren(h('b', {}, game.kind === 'ear' ? '🎧 Listen, then tap' : '📖 Read, then tap'));
    msgEl.textContent = game.kind === 'ear' ? 'Each round sounds once; tap the note on the neck. Ten rounds.' : 'Each round shows a note; tap it on the neck. Ten rounds.';
    replayBtn.hidden = true;
    fb.setDots([]);
  }

  function startSet() {
    clearTimers();
    A.audioCtx();
    n = 0; score = 0; streak = 0; best = 0; marks.length = 0;
    endEl.hidden = true;
    startBtn.hidden = true;
    logPlaying(true, { idleMin: 5 });
    next();
  }

  /** The next round: its question, heard or read. */
  function next() {
    if (n >= ROUNDS) { end(); return; }
    round = game.round(p, ctx, rand);
    missed = false;
    found = new Set();
    state = game.kind === 'ear' ? 'asking' : 'answer';
    drawDots(marks);
    drawScore();
    msgEl.textContent = '';
    msgEl.className = 'game-msg';
    showRefs();
    if (round.staff) {
      askEl.replaceChildren(staffSvg(round.staff));
      msgEl.textContent = round.ask;
    } else {
      replayBtn.hidden = false;
      sound();
    }
  }

  /** What the round shows on the neck before the answer (its root, its open string). */
  function refDots() {
    return round.refs.map((r) => ({ s: r.s, f: r.f, label: r.label, color: r.root ? 'root' : 'none', state: 'static' }));
  }
  function showRefs(extra = []) { fb.setDots([...refDots(), ...extra]); }

  /** The question's sound, and "Listen…" while it plays. */
  function sound() {
    const t0 = A.now() + 0.08;
    let endAt = 0;
    for (const x of round.play) {
      A.playNote(x.midi, t0 + x.at, x.dur, 0.85);
      endAt = Math.max(endAt, x.at + Math.min(x.dur, 0.6));
    }
    askEl.replaceChildren(h('b', { class: 'game-listen' }, '🎧 Listen…'));
    if (state === 'asking' || state === 'answer') {
      later(() => {
        if (!round || state === 'end' || state === 'done') return;
        state = 'answer';
        askEl.replaceChildren(h('b', {}, '👆 Tap it'));
        msgEl.textContent = round.ask;
      }, (endAt + 0.15) * 1000);
    }
  }

  /** A written note on a small bass-clef staff (the sound an octave lower, as bass is written). */
  function staffSvg({ midi, n }) {
    // one note, large: the clef, the five lines, its ledger lines and its sharp or flat (written an octave up)
    const s = 9;   // a staff space
    const written = midi + 12;
    const pos = (Math.floor(written / 12) - 1) * 7 + n.l - 22;   // half-spaces above the middle line (D3)
    const y = (q) => -q * (s / 2);
    const lo = Math.min(-4, pos), hi = Math.max(4, pos);
    const top = y(hi) - s * 1.6, bottom = y(lo) + s * 1.6;
    const x0 = 6, x1 = 120, nx = 88;
    const lines = [-4, -2, 0, 2, 4].map((q) => `<line x1="${x0}" x2="${x1}" y1="${y(q)}" y2="${y(q)}" class="sln"/>`);
    const ledgers = [];
    for (let q = -6; q >= pos; q -= 2) ledgers.push(q);
    for (let q = 6; q <= pos; q += 2) ledgers.push(q);
    const acc = n.a > 0 ? '♯' : n.a < 0 ? '♭' : '';
    const el = h('div', { class: 'game-staff' });
    el.innerHTML = `<svg viewBox="0 ${top} 128 ${bottom - top}" width="${128 * 1.15}" height="${(bottom - top) * 1.15}" class="tabsvg staff">`
      + `${lines.join('')}${bassClef(x0 + 4, y(2), s)}`
      + ledgers.map((q) => `<line x1="${nx - s * 1.1}" x2="${nx + s * 1.1}" y1="${y(q)}" y2="${y(q)}" class="sld"/>`).join('')
      + (acc ? `<text x="${nx - s * 1.9}" y="${y(pos) + s * 0.5}" font-size="${s * 1.9}" class="game-acc">${acc}</text>` : '')
      + `<ellipse cx="${nx}" cy="${y(pos)}" rx="${s * 0.68}" ry="${s * 0.46}" transform="rotate(-18 ${nx} ${y(pos)})" class="game-head"/>`
      + '</svg>';
    return el;
  }

  function tap(s, f) {
    const midi = ctx.tuning[s] + f;
    A.playNote(midi, A.now() + 0.01, 0.7, 0.7);
    fb.pluck(s, 'none');
    if (state !== 'answer' || !round) return;
    const a = round.answer;
    if (midi === a.midi) {
      if (a.all) {
        found.add(`${s}:${f}`);
        const places = placesOf(a.midi, ctx, HI);
        if (found.size < places.length) {
          showRefs([...found].map((k) => { const [fs, ff] = k.split(':').map(Number); return { s: fs, f: ff, label: say(a.n), color: 'none', state: 'current', fx: 'win' }; }));
          msgEl.textContent = `✓ ${found.size} of ${places.length}: find the other${places.length - found.size > 1 ? 's' : ''}`;
          return;
        }
      }
      win(s, f);
    } else miss(s, f, midi);
  }

  const answerColor = (label) => (label ? degKey(label.replace('↓', '')) : 'none');
  const answerLabel = (a) => a.label || say(a.n);

  function win(s, f) {
    state = 'done';
    const a = round.answer;
    if (!missed) { score++; streak++; best = Math.max(best, streak); }
    marks.push(!missed);
    const shown = a.all ? [...found].map((k) => k.split(':').map(Number)) : [[s, f]];
    showRefs(shown.map(([fs, ff]) => ({ s: fs, f: ff, label: answerLabel(a), color: answerColor(a.label), state: 'current', fx: 'win' })));
    askEl.replaceChildren(h('b', { class: 'game-ok' }, '✓ Right'));
    msgEl.className = 'game-msg ok';
    msgEl.textContent = `✓ ${say(a.n)}${a.say ? ` · ${a.say}` : ''}`;
    drawScore();
    later(() => { n++; next(); }, 1300);
  }

  function miss(s, f, midi) {
    state = 'done';
    missed = true;
    streak = 0;
    marks.push(false);
    const a = round.answer;
    const places = placesOf(a.midi, ctx, HI);
    showRefs([
      { s, f, label: say(spellMidi(midi)), color: 'sixth', state: 'static', fx: 'miss' },
      ...places.map((q) => ({ s: q.s, f: q.f, label: answerLabel(a), color: answerColor(a.label), state: 'current' })),
    ]);
    askEl.replaceChildren(h('b', { class: 'game-no' }, '✗ Missed'));
    msgEl.className = 'game-msg no';
    msgEl.textContent = `✗ That was ${say(spellMidi(midi))}. It is ${say(a.n)}${a.say ? `, ${a.say}` : ''}${places.length > 1 ? `: here on ${places.length} strings` : ''}`;
    A.playNote(a.midi, A.now() + 0.45, 1.1, 0.85);
    drawScore();
    later(() => { n++; next(); }, 2800);
  }

  function end() {
    state = 'end';
    round = null;
    logPlaying(false);
    drawDots(marks);
    drawScore();
    replayBtn.hidden = true;
    const pr = getProgress(tpl.id) || {};
    const record = pr.best == null || score > pr.best;
    updateProgress(tpl.id, { plays: (pr.plays || 0) + 1, best: Math.max(pr.best ?? 0, score), params: { ...p }, ...(score >= ROUNDS - 1 ? { met: true } : {}) });
    prog.best = Math.max(pr.best ?? 0, score);
    const stars = score >= ROUNDS ? '★★★' : score >= ROUNDS - 2 ? '★★☆' : score >= ROUNDS / 2 ? '★☆☆' : '☆☆☆';
    // (the next choice of the first option: a harder set, when there is one)
    const [k0, def0] = Object.entries(tpl.params || {})[0] || [];
    const opts0 = def0 ? paramOptions(def0, S, p) : [];
    const harder = opts0[opts0.findIndex((o) => o[0] === p[k0]) + 1];
    const masterBtn = score >= ROUNDS - 1 && !isMastered(tpl.id)
      ? h('button', { class: 'btn', onClick: () => { setMastered(tpl.id, true); toast('Mastered ✓: it counts in the Library and the course'); masterBtn.remove(); } }, '✓ Mastered')
      : null;
    endEl.replaceChildren(h('div', { class: 'game-card' },
      h('div', { class: 'game-stars' }, stars),
      h('h2', {}, `${score} of ${ROUNDS}`),
      h('p', { class: 'muted' }, `Best streak ${best}${record && pr.best != null ? ' · a new best score' : ''}`),
      h('div', { class: 'row' },
        h('button', { class: 'btn primary', 'data-silent': '', onClick: () => startSet() }, '↻ Again'),
        harder && score >= ROUNDS - 2 ? h('button', { class: 'btn', 'data-silent': '', onClick: () => { p[k0] = harder[0]; optsSum.textContent = summary(); startSet(); } }, `Harder: ${harder[1]}`) : null,
        masterBtn)));
    endEl.hidden = false;
    msgEl.textContent = '';
    askEl.replaceChildren(h('b', {}, score >= ROUNDS - 1 ? '🎉 Well done' : score >= ROUNDS / 2 ? '👍 Keep going' : '🌱 Again, slowly'));
  }

  // ------------------------------------------------------------ options
  function openOptions() {
    const groups = Object.entries(tpl.params || {}).map(([k, def]) => h('div', { class: 'opt-group' }, h('h4', {}, def.label),
      h('div', { class: 'chips' }, paramOptions(def, S, p).map(([v, l]) => h('button', { class: `chip-btn${v === p[k] ? ' on' : ''}`, onClick: () => {
        if (p[k] === v) return;
        p[k] = v;
        updateProgress(tpl.id, { params: { ...p } });
        optsSum.textContent = summary();
        openOptions();
      } }, l)))));
    sheet.replaceChildren(h('div', { class: 'panel' }, h('header', {}, h('div', {}, h('h2', {}, 'Game')), h('button', { class: 'btn primary', onClick: () => closeOptions() }, 'Done')), ...groups));
    sheet.classList.add('open');
  }
  function closeOptions() {
    sheet.classList.remove('open');
    // (a changed game starts again)
    if (state !== 'idle') { clearTimers(); logPlaying(false); startBtn.hidden = false; endEl.hidden = true; marks.length = 0; drawDots(); idle(); drawScore(); }
  }

  function close() { onBack?.(); }
  function dispose() {
    clearTimers();
    logPlaying(false);
    fb.destroy?.();
    document.body.classList.remove('in-ex');
  }
  return { dispose };
}
