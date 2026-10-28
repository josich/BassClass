// The app's last error messages (launch product review, 2026-10-28: with no analytics, a "it froze" e-mail should carry
// what went wrong): kept on the phone only, outside backups (`bassclass-dev.errors`), and added to the foot of the
// Feedback e-mail (feedback.js), where the player sees them before pressing Send. Nothing is sent anywhere else.
const KEY = 'bassclass-dev.errors';
const MAX = 20;

/** Keeps one error message (an Error, an event's message, any value). */
export function logError(err) {
  try {
    const msg = String(err?.message || err || 'error').replace(/\s+/g, ' ').slice(0, 240);
    const list = JSON.parse(localStorage.getItem(KEY) || '[]');
    list.push(`${new Date().toISOString().slice(0, 16).replace('T', ' ')} ${msg}`);
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
