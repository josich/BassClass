// Progress backup: every BassClass record in this device's storage (progress, course, sessions,
// favourites, practice log, settings) saved to a file, and loaded back on this or another device.
import { VERSION } from './version.js';
import { dayKey } from './practiceLog.js';

const PREFIX = 'bassclass.';
const NOT_A_BACKUP = 'This file is not a BassClass backup.';

function ownKeys() {
  const keys = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX)) keys.push(k);
    }
  } catch { /* storage unavailable */ }
  return keys;
}

export function backupText() {
  const data = Object.fromEntries(ownKeys().map((k) => [k, localStorage.getItem(k)]));
  return JSON.stringify({ app: 'BassClass', kind: 'backup', v: 1, version: VERSION || 'development', saved: new Date().toISOString(), data });
}

/**
 * Saves a backup file: through Android's "Save to" picker in the app (it answers with a
 * 'bassclass-saved' event: 'ok', 'cancel' or 'error'), as a download in a browser.
 * Returns 'native' or 'download'.
 */
export function saveBackup() {
  const text = backupText();
  const name = `BassClass-backup-${dayKey()}.json`;
  const native = window.BassClassNative;
  if (native && typeof native.saveFile === 'function') {
    native.saveFile(name, text);
    return 'native';
  }
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return 'download';
}

/** A backup file's contents: { saved, data }, or an Error with a message for the player. */
export function parseBackup(text) {
  let v;
  try { v = JSON.parse(text); } catch { throw new Error(NOT_A_BACKUP); }
  if (!v || v.app !== 'BassClass' || v.kind !== 'backup' || !v.data || typeof v.data !== 'object' || Array.isArray(v.data)) throw new Error(NOT_A_BACKUP);
  // (only BassClass records, as text: each one is checked again by its own reader on load)
  const data = Object.fromEntries(Object.entries(v.data).filter(([k, s]) => k.startsWith(PREFIX) && k.length < 80 && typeof s === 'string'));
  if (!Object.keys(data).length) throw new Error('This backup is empty.');
  const saved = Date.parse(v.saved);
  return { saved: Number.isFinite(saved) ? new Date(saved) : null, data };
}

/** Replaces every BassClass record on this device with the backup's. The page must reload after it. */
// (Pro stays the device's own: a backup never turns it on or off, QA round 19: a one-word edit of the file must not
// open Pro; a buyer's new phone gets it back from Google Play, Restore purchase)
const KEEP = new Set(['bassclass.pro.v1']);
export function restoreBackup(data) {
  const old = Object.fromEntries(ownKeys().map((k) => [k, localStorage.getItem(k)]));
  try {
    for (const k of Object.keys(old)) if (!KEEP.has(k)) localStorage.removeItem(k);
    for (const [k, s] of Object.entries(data)) if (!KEEP.has(k)) localStorage.setItem(k, s);
  } catch (err) {
    // (storage full or blocked: put the device's own records back)
    try {
      for (const k of ownKeys()) localStorage.removeItem(k);
      for (const [k, s] of Object.entries(old)) localStorage.setItem(k, s);
    } catch { /* storage unavailable */ }
    throw new Error('The backup could not be stored on this device.');
  }
}
