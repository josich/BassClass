// Dev tool (not used by the app at runtime): builds the drum kit in web/audio/drums/ (Ogg Opus files and
// kit.json) from raw samples staged in web/_raw/drums2/ with kit2.json (piece → layers soft to hard →
// round robins → the mic files of one hit, "repo:Samples/…", staged as "repo_Samples_…"), and in
// web/_raw/kits/muldjord/ (MULDJORD below).
//   - the kit (user, 2026-10-27: "the kick feels like a goliath drum", MuldjordKit chosen by ear from clips):
//     MuldjordKit by Lars Muldjord (DrumGizmo.org), its FreePats stereo build (CC BY 4.0): kick, snare,
//     toms, hi-hats, ride, bell and crash; the pieces it has not (rim, cross-stick, flam, pedal hat) stay
//     Virtuosity Drums' (Versilian Studios + Karoryfer, CC0), its kick mic, snare mic and overheads summed;
//   - percussion: Virtuosity's close mic and overheads, stereo;
//   - brushes ("b…" pieces): Karoryfer's Swirly Drums, one mic, mono.
// Needs tools/serve.py (localhost write endpoint). Run:  (await import('./js/dev/drumprep.js')).run()
const SR = 48000;
const DIR = '/_raw/drums2/';

// seconds kept at most per piece (a hit is cut where it has died away, then faded)
const MAX = {
  kick: 1.0, snare: 1.0, rim: 1.0, xstick: 0.6, flam: 1.0, hhc: 0.6, hhh: 1.0, hho: 1.6, hhp: 0.6, ride: 2.5, bell: 2.5,
  crash: 3.5, tomh: 1.4, toml: 1.6, shakd: 0.5, shaku: 0.5, claves: 0.5, cowbell: 0.8, conga: 0.8, congam: 0.5, tumba: 0.9,
  bongoh: 0.7, bongol: 0.7, tamb: 0.8, guiro: 0.5, guirol: 0.9, cabasa: 0.5, agogoh: 0.8, agogol: 0.8, tri: 1.6, trim: 0.4,
  timb: 0.9, bkick: 0.8, bsnare: 0.9, bhhc: 0.6, bhhp: 0.6, bride: 2.5,
};
// MuldjordKit's pieces: a folder of stereo FLAC hits each; the hits sorted by peak, `layers` of them taken
// soft to hard at even steps, two round robins each (`max`: seconds kept, as MAX)
const MUL = '/_raw/kits/muldjord/MuldjordKit SFZ+FLAC-20201018/samples/';
const MULDJORD = {
  kick: { folder: 'KdrumL', layers: 4 }, snare: { folder: 'Snare1', layers: 4 }, tomh: { folder: 'Tom1', layers: 2 },
  toml: { folder: 'Tom4', layers: 2 }, hhc: { folder: 'HihatClosed', layers: 4 }, hho: { folder: 'HihatOpen', layers: 2 },
  // (a half-open hat: the open hat choked early)
  hhh: { folder: 'HihatOpen', layers: 1, max: 0.45 }, ride: { folder: 'RideL', layers: 3 }, bell: { folder: 'RideLBell', layers: 1 },
  crash: { folder: 'CrashL', layers: 2 },
};
/** A MuldjordKit piece: its hits, trimmed, as layers soft to hard of two round robins. */
async function muldjord(name, { folder, layers, max }) {
  const html = await (await fetch(MUL + encodeURIComponent(folder) + '/')).text();
  const files = [...html.matchAll(/href="([^"]+\.flac)"/g)].map((m) => decodeURIComponent(m[1]));
  const hits = [];
  for (const f of files) {
    const b = await decode(MUL + encodeURIComponent(folder) + '/' + encodeURIComponent(f));
    hits.push(trim([0, 1].map((c) => b.getChannelData(Math.min(c, b.numberOfChannels - 1)).slice()), max ?? MAX[name] ?? 1));
  }
  hits.sort((a, b) => peakOf(a) - peakOf(b));
  const out = [];
  for (let l = 0; l < layers; l++) {
    // the layer's place among the hits, softest to hardest; it and the next one up as its round robins
    const at = Math.round(((l + 1) / layers) * (hits.length - 1));
    out.push([hits[Math.max(0, at - 1)], hits[at]]);
  }
  return out;
}

// the brush stir is a long sweep: a two-beat swish cut from it (start and length in seconds)
const SEG = { bstir: [[0.6, 1.8], [3.2, 1.8]] };
const GROUP = (p) => (MULDJORD[p] ? 'muldjord' : p.startsWith('b') && p !== 'bell' && p !== 'bongoh' && p !== 'bongol' ? 'brush'
  : ['shakd', 'shaku', 'claves', 'cowbell', 'conga', 'congam', 'tumba', 'bongoh', 'bongol', 'tamb', 'guiro', 'guirol', 'cabasa', 'agogoh', 'agogol', 'tri', 'trim', 'timb'].includes(p) ? 'perc' : 'kit');

const staged = (f) => DIR + f.replace(':', '_').replace(/\//g, '_');

async function decode(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`missing ${url}`);
  return new OfflineAudioContext(2, 1, SR).decodeAudioData(await res.arrayBuffer());
}

/** One hit: its mic files summed; stereo when any mic is stereo. */
async function hit(files) {
  const bufs = await Promise.all(files.map((f) => decode(staged(f))));
  const n = Math.max(...bufs.map((b) => b.length));
  const stereo = bufs.some((b) => b.numberOfChannels > 1);
  const L = new Float32Array(n), R = stereo ? new Float32Array(n) : null;
  for (const b of bufs) {
    const l = b.getChannelData(0), r = b.numberOfChannels > 1 ? b.getChannelData(1) : l;
    for (let i = 0; i < b.length; i++) { L[i] += l[i]; if (R) R[i] += r[i]; }
  }
  return R ? [L, R] : [L];
}

const peakOf = (chs) => chs.reduce((a, c) => c.reduce((m, v) => Math.max(m, Math.abs(v)), a), 0);

/** The hit alone: from just before its onset to where it has died away (at most `max` s), faded out. */
function trim(chs, max) {
  const pk = peakOf(chs), n = chs[0].length;
  const loud = (i) => chs.some((c) => Math.abs(c[i]) >= pk * 0.04);
  let a = 0;
  while (a < n && !loud(a)) a++;
  a = Math.max(0, a - Math.round(SR * 0.0005));
  let b = n - 1;
  while (b > a && chs.every((c) => Math.abs(c[b]) < pk * 0.0015)) b--;
  b = Math.min(b + Math.round(SR * 0.02), n, a + Math.round(max * SR));
  return fade(chs.map((c) => c.slice(a, b)), 0, Math.round(SR * Math.min(0.25, ((b - a) / SR) * 0.3)));
}

/** A piece of a long sound (the stir), faded in and out. */
function segment(chs, [start, len]) {
  const a = Math.round(start * SR), b = Math.min(chs[0].length, a + Math.round(len * SR));
  return fade(chs.map((c) => c.slice(a, b)), Math.round(SR * 0.08), Math.round(SR * 0.45));
}

function fade(chs, inN, outN) {
  for (const y of chs) {
    for (let i = 0; i < inN && i < y.length; i++) y[i] *= 0.5 - 0.5 * Math.cos((Math.PI * i) / inN);
    for (let i = 0; i < outN && i < y.length; i++) y[y.length - outN + i] *= 0.5 + 0.5 * Math.cos((Math.PI * i) / outN);
  }
  return chs;
}

// ------------------------------------------------------------------ Ogg Opus (RFC 7845)
const CRC = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let r = i << 24;
    for (let k = 0; k < 8; k++) r = r & 0x80000000 ? (r << 1) ^ 0x04c11db7 : r << 1;
    t[i] = r >>> 0;
  }
  return t;
})();
function crc32(bytes) {
  let c = 0;
  for (const b of bytes) c = ((c << 8) ^ CRC[((c >>> 24) & 0xff) ^ b]) >>> 0;
  return c;
}

/** One Ogg page holding whole packets. */
function page(packets, { granule, seq, flags = 0, serial }) {
  const lacing = [];
  for (const p of packets) {
    let n = p.length;
    while (n >= 255) { lacing.push(255); n -= 255; }
    lacing.push(n);
  }
  const body = packets.reduce((a, p) => a + p.length, 0);
  const out = new Uint8Array(27 + lacing.length + body);
  const v = new DataView(out.buffer);
  out.set([0x4f, 0x67, 0x67, 0x53], 0);   // "OggS"
  out[5] = flags;
  v.setBigUint64(6, BigInt(granule), true);
  v.setUint32(14, serial, true);
  v.setUint32(18, seq, true);
  out[26] = lacing.length;
  out.set(lacing, 27);
  let o = 27 + lacing.length;
  for (const p of packets) { out.set(p, o); o += p.length; }
  v.setUint32(22, crc32(out), true);
  return out;
}

/** Mono or stereo samples at 48 kHz → an Ogg Opus file (the encoder's own OpusHead gives the pre-skip). */
async function encodeOpus(chs) {
  const packets = [];
  let head = null;
  const ch = chs.length, n = chs[0].length;
  const enc = new AudioEncoder({
    output: (chunk, meta) => {
      const b = new Uint8Array(chunk.byteLength);
      chunk.copyTo(b);
      packets.push({ b, n: Math.round((chunk.duration * SR) / 1e6) });
      if (!head && meta?.decoderConfig?.description) head = new Uint8Array(meta.decoderConfig.description);
    },
    error: (e) => { throw e; },
  });
  enc.configure({ codec: 'opus', sampleRate: SR, numberOfChannels: ch, bitrate: ch > 1 ? 128000 : 96000 });
  const data = new Float32Array(n * ch);
  chs.forEach((c, i) => data.set(c, i * n));
  enc.encode(new AudioData({ format: 'f32-planar', sampleRate: SR, numberOfFrames: n, numberOfChannels: ch, timestamp: 0, data }));
  await enc.flush();
  enc.close();
  const preSkip = head[10] | (head[11] << 8);
  const serial = (Math.random() * 2 ** 32) >>> 0;
  const vendor = new TextEncoder().encode('BassClass drumprep');
  const tags = new Uint8Array(8 + 4 + vendor.length + 4);
  tags.set(new TextEncoder().encode('OpusTags'), 0);
  new DataView(tags.buffer).setUint32(8, vendor.length, true);
  tags.set(vendor, 12);
  const pages = [page([head], { granule: 0, seq: 0, flags: 2, serial }), page([tags], { granule: 0, seq: 1, serial })];
  // audio pages of up to 50 packets (one second); the last page's granule trims the encoder's padding
  let granule = 0, seq = 2;
  for (let i = 0; i < packets.length; i += 50) {
    const group = packets.slice(i, i + 50);
    granule += group.reduce((a, p) => a + p.n, 0);
    const last = i + 50 >= packets.length;
    pages.push(page(group.map((p) => p.b), { granule: last ? preSkip + n : granule, seq: seq++, flags: last ? 4 : 0, serial }));
  }
  const out = new Uint8Array(pages.reduce((a, p) => a + p.length, 0));
  let o = 0;
  for (const p of pages) { out.set(p, o); o += p.length; }
  return out;
}

async function put(path, body, type) {
  const res = await fetch(`/__write/audio/drums/${path}`, { method: 'PUT', headers: { 'Content-Type': type }, body });
  if (!res.ok) throw new Error(`could not write ${path}: ${res.status}`);
}

export async function run() {
  const spec = await (await fetch(DIR + 'kit2.json')).json();
  // every hit once (summed, trimmed); then one gain per group, so each family keeps its recorded balance
  const done = {};
  const groupPeak = {};
  for (const [name, layers] of Object.entries(spec)) {
    done[name] = [];
    if (MULDJORD[name]) {
      done[name] = await muldjord(name, MULDJORD[name]);
      for (const row of done[name]) for (const y of row) groupPeak[GROUP(name)] = Math.max(groupPeak[GROUP(name)] || 0, peakOf(y));
      continue;
    }
    for (const layer of layers) {
      const row = [];
      for (let r = 0; r < layer.length; r++) {
        const chs = await hit(layer[r]);
        const y = SEG[name] ? segment(chs, SEG[name][r % SEG[name].length]) : trim(chs, MAX[name] ?? 1);
        row.push(y);
        groupPeak[GROUP(name)] = Math.max(groupPeak[GROUP(name)] || 0, peakOf(y));
      }
      done[name].push(row);
    }
  }
  const manifest = {
    name: 'MuldjordKit (Lars Muldjord, DrumGizmo.org; FreePats stereo build), Virtuosity Drums (Versilian Studios + Karoryfer) and Swirly Drums brushes (Karoryfer)',
    license: 'CC-BY-4.0 (MuldjordKit) and CC0-1.0 (Virtuosity Drums, Swirly Drums)',
    source: ['https://freepats.zenvoid.org/Percussion/acoustic-drum-kit.html', 'https://drumgizmo.org/wiki/doku.php?id=kits:muldjordkit', 'https://github.com/sfzinstruments/virtuosity_drums', 'https://github.com/sfzinstruments/karoryfer.swirly-drums'],
    v: 3,
    pieces: {},
  };
  let bytes = 0, seconds = 0;
  for (const [name, layers] of Object.entries(done)) {
    const gain = 0.89 / groupPeak[GROUP(name)];
    manifest.pieces[name] = [];
    for (let l = 0; l < layers.length; l++) {
      const files = [];
      for (let r = 0; r < layers[l].length; r++) {
        const chs = layers[l][r].map((c) => c.map((v) => v * gain));
        const ogg = await encodeOpus(chs);
        const file = `${name}-${l + 1}-${r + 1}.ogg`;
        await put(file, ogg, 'audio/ogg');
        files.push(file);
        bytes += ogg.length;
        seconds += chs[0].length / SR;
      }
      manifest.pieces[name].push(files);
    }
  }
  await put('kit.json', JSON.stringify(manifest, null, 1), 'application/json');
  await put('LICENSE.txt', [
    'Drum kit (kick, snare, toms, hi-hats, ride and crash): MuldjordKit by Lars Muldjord',
    '(www.muldjord.com, DrumGizmo.org), in the stereo build assembled by the FreePats project',
    '(https://freepats.zenvoid.org/Percussion/acoustic-drum-kit.html), licensed under the Creative Commons',
    'Attribution 4.0 International License: https://creativecommons.org/licenses/by/4.0/',
    'Changes: a selection of its hits, trimmed, faded, levelled and encoded as Opus for BassClass by',
    'web/js/dev/drumprep.js; the half-open hi-hat is its open hi-hat cut short.',
    '',
    'Rim shot, cross-stick, flam, pedal hi-hat and percussion: Virtuosity Drums by Versilian Studios and',
    'Karoryfer Samples; brushes: Swirly Drums by Karoryfer Samples; both released under CC0 1.0 Universal',
    '(public domain): https://creativecommons.org/publicdomain/zero/1.0/',
    'Sources: https://github.com/sfzinstruments/virtuosity_drums and',
    'https://github.com/sfzinstruments/karoryfer.swirly-drums (summed, trimmed and encoded as Opus).',
    '',
  ].join('\n'), 'text/plain');
  return { files: Object.values(manifest.pieces).flat(2).length, kb: Math.round(bytes / 1024), seconds: +seconds.toFixed(1) };
}
