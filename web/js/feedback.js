// Send feedback (user, 2026-10-27: "build the feedback button, use the same address as Polyorbit"): Settings →
// Feedback opens the player's own email app with a message to us, the app's version and the phone already in it,
// so a problem can be found faster. Nothing is sent unless the player presses Send there; no server. In the Android
// app the mail goes through the bridge (`BassClassNative.sendMail`: Android's "send to" for e-mail apps, answered by a
// `bassclass-mail` event when the phone has none); elsewhere through a mailto: link.
import { VERSION, COMMIT } from './version.js';
import { settings } from './store.js';
import { toast } from './ui/dom.js';

/** The address players write to (the same as Polyorbit's), shown in About and its privacy policy too. */
export const CONTACT = 'polyorbit.app@gmail.com';

/** The phone or computer, as far as the browser tells: "Android 14 · Pixel 7", "Windows", "iPhone". */
function device() {
  const ua = navigator.userAgent;
  const a = ua.match(/Android ([\d.]+);\s*([^;)]*?)(?:\s+Build\/|\)|;)/);
  // (a reduced user agent names no model: "K"; a WebView's may give only its "wv" mark)
  if (a) return `Android ${a[1]}${a[2] && a[2] !== 'K' && a[2] !== 'wv' ? ` · ${a[2].trim()}` : ''}`;
  return /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : /Windows/.test(ua) ? 'Windows' : /Macintosh/.test(ua) ? 'Mac' : /Linux/.test(ua) ? 'Linux' : 'other';
}

export function sendFeedback() {
  const app = location.hostname === 'appassets.androidplatform.net' ? 'Android app' : 'web';
  const version = VERSION ? `BassClass ${VERSION}${COMMIT ? ` · build ${COMMIT}` : ''}` : `BassClass · development version${COMMIT ? ` · build ${COMMIT}` : ''}`;
  const subject = `BassClass feedback · ${VERSION || 'development'}`;
  const body = [
    '(Your message: what happened, or your idea)',
    '', '', '',
    '---',
    version,
    `${app} · ${device()} · screen ${screen.width}×${screen.height}`,
    `${settings.strings}-string bass · ${new Date().toLocaleDateString('en-GB')}`,
  ].join('\r\n');
  try {
    if (window.BassClassNative?.sendMail) { window.BassClassNative.sendMail(CONTACT, subject, body); return; }
  } catch { /* the bridge failed: the mailto: link instead */ }
  location.href = `mailto:${CONTACT}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// (the Android app found no e-mail app: say where to write)
addEventListener('bassclass-mail', (e) => {
  if (e.detail === 'none') toast(`No email app on this phone: write to ${CONTACT}`, 5000);
});
