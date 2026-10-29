// The app's last error messages (launch product review, 2026-10-28: with no analytics, a "it froze" e-mail should carry
// what went wrong): kept on the phone only, outside backups (`bassclass-dev.errors`), and added to the foot of the
// Feedback e-mail (feedback.js), where the player sees them before pressing Send. Nothing is sent anywhere else.
const KEY = 'bassclass-dev.errors';
const MAX = 20;

/** An error's words: an Error's message, a string, else the value written out ({"a":1}, not [object Object]). */
function text(err) {
  if (err?.message) return String(err.message);
  if (typeof err === 'string') return err;
  try { return JSON.stringify(err) ?? String(err); } catch { return String(err); }
}
/** Keeps one error message (an Error, an event's message, any value). */
export function logError(err) {
  try {
    const msg = (text(err) || 'error').replace(/\s+/g, ' ').slice(0, 240);
    // (a record that is not a list starts again, or nothing would ever be kept: QA round 21)
    let list;
    try { list = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { list = []; }
    if (!Array.isArray(list)) list = [];
    // (the same error again, as in a loop, is counted on its line instead of pushing out the one that caused it)
    const last = String(list.at(-1) ?? '').match(/^(\S+ \S+) (.*?)(?: \(×(\d+)\))?$/);
    if (last && last[2] === msg) list[list.length - 1] = `${last[1]} ${msg} (×${Number(last[3] || 1) + 1})`;
    else list.push(`${new Date().toISOString().slice(0, 16).replace('T', ' ')} ${msg}`);
    localStorage.setItem(KEY, JSON.stringify(list.slice(-MAX)));
  } catch { /* storage unavailable or full: nothing kept */ }
}

/** The last `n` error messages, oldest first. */
export function recentErrors(n = 5) {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(list) ? list.slice(-n).map(String) : [];
  } catch { return []; }
}

/** From the start: every uncaught error and rejected promise is kept. */
export function watchErrors() {
  addEventListener('error', (e) => logError(`${e.message || 'error'}${e.filename ? ` (${e.filename.split('/').pop()}:${e.lineno})` : ''}`));
  addEventListener('unhandledrejection', (e) => logError(`unhandled: ${e.reason?.message || e.reason}`));
}
