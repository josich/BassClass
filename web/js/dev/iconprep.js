// Dev tool (not used by the app at runtime): renders every PNG icon from web/icons/icon.svg
// (web/PWA icons and the Android launcher layers) and saves them through tools/serve.py.
// Run in the console on localhost:  (await import('./js/dev/iconprep.js')).run()
// Preview the icon at launcher sizes, masks and wallpapers: /js/dev/icons.html
//
// icon.svg is drawn on the 108-unit Android adaptive-icon canvas: 72 units show (18..90), and the
// launcher masks (circle, squircle...) keep at least the 66-unit circle around (54, 54). Its viewBox
// shows the visible 72 units clipped to a rounded tile (the favicon and the app's rail logo).
//   <g id="art" clip-path="url(#tile)"> <g id="bg">full-bleed background</g> <g id="fg">glyph</g> </g>
//   <g id="rim">rim light and edge, on the rounded tile only (launchers draw their own edge)</g>
//   <g id="mono" display="none">the glyph as one flat shape (Android 13 themed icons)</g>
// icon-dark.svg is the same icon in navy, kept for dark surfaces and other uses (not rendered here).

const ANDROID = [['mdpi', 1], ['hdpi', 1.5], ['xhdpi', 2], ['xxhdpi', 3], ['xxxhdpi', 4]];

const BOX = {
  icon: '18 18 72 72', // the rounded tile
  visible: '18 18 72 72', // what a launcher shows before its mask
  maskable: '12 12 84 84', // PWA maskable: the 66-unit circle inside the 80% safe circle
  fg: '0 0 108 108',
  bg: '0 0 108 108',
  mono: '0 0 108 108',
};

// One rendering of the layered SVG. An SVG without #art (a flat icon) is returned as it is.
export function variant(text, kind, viewBox = BOX[kind]) {
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  const svg = doc.documentElement;
  const art = doc.getElementById('art');
  if (!art) return text;
  const set = (id, shown) => {
    const el = doc.getElementById(id);
    if (!el) return;
    if (shown) el.removeAttribute('display');
    else el.setAttribute('display', 'none');
  };
  if (kind !== 'icon') { art.removeAttribute('clip-path'); set('rim', false); }
  svg.setAttribute('viewBox', viewBox);
  if (kind === 'fg') set('bg', false);
  if (kind === 'bg') set('fg', false);
  if (kind === 'mono') { set('art', false); set('rim', false); set('mono', true); }
  return new XMLSerializer().serializeToString(doc);
}

// [published path, size in px, kind, share of the size the image fills]
const JOBS = [
  ['icons/icon-192.png', 192, 'icon', 1],
  ['icons/icon-512.png', 512, 'icon', 1],
  ['icons/icon-maskable-512.png', 512, 'maskable', 1],
  // iOS masks the square itself and fills transparent corners with black
  ['icons/apple-touch-icon.png', 180, 'visible', 1],
  // Android 7 (no adaptive icons): the tile with a small margin
  ...ANDROID.map(([d, k]) => [`android/mipmap-${d}/ic_launcher.png`, Math.round(48 * k), 'icon', 0.92]),
  // Android 8+: the adaptive-icon layers (108 dp, 72 dp visible); 13+: the themed (monochrome) layer
  ...['fg', 'bg', 'mono'].flatMap((kind) => ANDROID.map(([d, k]) => [
    `android/mipmap-${d}/ic_launcher_${{ fg: 'foreground', bg: 'background', mono: 'monochrome' }[kind]}.png`,
    Math.round(108 * k), kind, 1,
  ])),
];

export function loadSvg(text, px) {
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

export async function render(text, kind, size, share = 1) {
  const px = Math.round(size * share);
  const img = await loadSvg(variant(text, kind), px);
  const c = document.createElement('canvas');
  c.width = c.height = size;
  c.getContext('2d').drawImage(img, (size - px) / 2, (size - px) / 2, px, px);
  return c;
}

export async function run() {
  const text = await fetch('/icons/icon.svg', { cache: 'no-store' }).then((r) => r.text());
  const done = [];
  for (const [path, size, kind, share] of JOBS) {
    const c = await render(text, kind, size, share);
    const blob = await new Promise((ok) => c.toBlob(ok, 'image/png'));
    const res = await fetch(`/__write/${path}`, { method: 'PUT', body: blob });
    if (!res.ok) throw new Error(`${path}: ${res.status}`);
    done.push(`${path} ${size}px`);
  }
  return done;
}
