// Dev tool (not used by the app at runtime): renders every PNG icon from web/icons/icon.svg
// (web/PWA icons and the Android launcher layers) and saves them through tools/serve.py.
// Run in the console on localhost:  (await import('./js/dev/iconprep.js')).run()

const ANDROID = [['mdpi', 1], ['hdpi', 1.5], ['xhdpi', 2], ['xxhdpi', 3], ['xxxhdpi', 4]];

// [published path, size in px, dot diameter as a share of the size, background]
const JOBS = [
  ['icons/icon-192.png', 192, 1],
  ['icons/icon-512.png', 512, 1],
  // maskable: the dot inside the 80% safe zone, on the app's navy
  ['icons/icon-maskable-512.png', 512, 0.8, '#12142a'],
  // Android 7 (no adaptive icons): the dot with a small margin
  ...ANDROID.map(([d, k]) => [`android/mipmap-${d}/ic_launcher.png`, Math.round(48 * k), 0.92]),
  // Android 8+: adaptive-icon foreground (108 dp, 72 dp visible): a 70 dp dot on transparent
  ...ANDROID.map(([d, k]) => [`android/mipmap-${d}/ic_launcher_foreground.png`, Math.round(108 * k), 70 / 108]),
];

function loadSvg(text, px) {
  // give the SVG its pixel size so it is rasterised sharply at that size
  const sized = text.replace('<svg ', `<svg width="${px}" height="${px}" `);
  const url = URL.createObjectURL(new Blob([sized], { type: 'image/svg+xml' }));
  return new Promise((ok, fail) => {
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); ok(img); };
    img.onerror = fail;
    img.src = url;
  });
}

export async function run() {
  const text = await fetch('/icons/icon.svg', { cache: 'no-store' }).then((r) => r.text());
  const done = [];
  for (const [path, size, share, bg] of JOBS) {
    const dot = Math.round(size * share);
    const img = await loadSvg(text, dot);
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    if (bg) { g.fillStyle = bg; g.fillRect(0, 0, size, size); }
    g.drawImage(img, (size - dot) / 2, (size - dot) / 2, dot, dot);
    const blob = await new Promise((ok) => c.toBlob(ok, 'image/png'));
    const res = await fetch(`/__write/${path}`, { method: 'PUT', body: blob });
    if (!res.ok) throw new Error(`${path}: ${res.status}`);
    done.push(`${path} ${size}px`);
  }
  return done;
}
