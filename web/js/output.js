// The device playing the sound, and its audio delay (user, 2026-11-03: "build the per-device memory with the
// calibration method"): Bluetooth headphones and speakers each bring the sound late by their own amount (100–300 ms),
// so a delay measured once for a device (Settings → Audio delay) comes back whenever that device plays. The Android
// app says which device plays (BassClassNative.audioOutput(), and a 'bassclass-output' event when it changes); a
// browser cannot tell, so it keeps one delay for everything ('default'). What is drawn waits as long (audio.js).
import { settings, saveSettings } from './store.js';
import * as A from './audio.js';

const KINDS = ['bluetooth', 'wired', 'usb', 'speaker', 'other'];
const norm = (o) => {
  const kind = KINDS.includes(o?.kind) ? o.kind : 'other';
  const name = String(o?.name || '').trim().slice(0, 60);
  return { kind, name, key: `${kind}:${name || kind}` };
};
function read() {
  try {
    const j = window.BassClassNative?.audioOutput?.();
    if (j) return norm(JSON.parse(j));
  } catch { /* not in the app */ }
  return { kind: 'browser', name: '', key: 'default' };
}

let now = read();
const listeners = new Set();

/** The device playing now: { kind, name, key }. */
export const output = () => now;
/** Called with the new device when it changes. */
export const onOutput = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

/** A device's name as the player knows it ("Galaxy Buds2", "The phone's speaker", "This browser"). */
export function outputName(o = now) {
  if (o.kind === 'browser') return 'This browser';
  if (o.kind === 'speaker') return 'The phone\'s speaker';
  return o.name || { bluetooth: 'Bluetooth', wired: 'Wired headphones', usb: 'USB audio', other: 'Audio output' }[o.kind];
}
/** Its icon: 🎧 Bluetooth, 🔌 wired or USB, 📱 the phone's speaker, 🔈 anything else. */
export const outputIcon = (o = now) => ({ bluetooth: '🎧', wired: '🔌', usb: '🔌', speaker: '📱' }[o.kind] || '🔈');

/** The delay kept for a device (ms; 0 until measured). */
export const delayFor = (key = now.key) => settings.audioDelays?.[key] ?? 0;
/** The devices with a delay kept, the one playing first: [{ key, name, icon, ms }]. */
export function keptDelays() {
  return Object.entries(settings.audioDelays || {}).map(([key, ms]) => {
    const [kind, ...rest] = key.split(':');
    const o = key === 'default' ? { kind: 'browser', name: '' } : { kind, name: rest.join(':') === kind ? '' : rest.join(':') };
    return { key, ms, name: outputName(o), icon: outputIcon(o) };
  }).sort((a, b) => (a.key === now.key ? -1 : b.key === now.key ? 1 : a.name.localeCompare(b.name)));
}
/** What is drawn waits for the sound of the device playing now. */
export const applyDelay = () => A.setAudioOptions({ visualDelay: delayFor() / 1000 });
/** Keep a delay for a device (the one playing, by default). */
export function setDelay(ms, key = now.key) {
  saveSettings({ audioDelays: { ...(settings.audioDelays || {}), [key]: ms } });
  if (key === now.key) applyDelay();
}
/** Forget a device's delay. */
export function forgetDelay(key) {
  const d = { ...(settings.audioDelays || {}) };
  delete d[key];
  saveSettings({ audioDelays: d });
  if (key === now.key) applyDelay();
}
/** A Bluetooth device with no delay measured yet, not asked about before (the app offers the test once). */
export function needsMeasure(o = now) {
  return o.kind === 'bluetooth' && settings.audioDelays?.[o.key] == null && !(settings.delayAsked || []).includes(o.key);
}
export const markAsked = (key = now.key) => saveSettings({ delayAsked: [...(settings.delayAsked || []).filter((k) => k !== key), key].slice(-30) });

window.addEventListener('bassclass-output', (e) => {
  let o;
  try { o = norm(JSON.parse(e.detail)); } catch { return; }
  if (o.key === now.key) return;
  now = o;
  applyDelay();
  for (const fn of listeners) fn(now);
});
applyDelay();
