// Dev tool (not used by the app at runtime): converts the raw Virtuosity Drums samples (CC0, Versilian
// Studios and Karoryfer: the "mid" stereo mic of the kit and of the percussion), staged in
// web/_raw/drums/ (paths of web/_raw/drums/list.txt with "/" turned into "_"), into the compact kit in
// web/audio/drums/: mono Ogg Opus files and kit.json. Needs tools/serve.py (localhost write endpoint).
// Run in the console:  (await import('./js/dev/drumprep.js')).run()
// (await import('./js/dev/drumprep.js')).measure('snare') lists the snare's layers by loudness.
const SR = 48000;
const BITRATE = 96000;
const raw = (p) => `/_raw/drums/${p.replace(/\//g, '_')}`;
const K = (d, f) => `mid/${d}/mid_${d}_${f}.flac`;
const P = (d, f) => `perc/mid/${d}/${f}_Mid.wav`;
const rr = (f, n) => Array.from({ length: n }, (_, i) => f(i + 1));

// Each piece: its layers from soft to hard, each layer its round robins; `max`: seconds kept at most.
// `group`: pieces of one group keep the balance they were recorded with (the kit is one stereo mic).
export const KIT = {
  kick: { max: 1.0, layers: [1, 2, 3, 4].map((v) => rr((r) => K('kick', `snon_vl${v}_rr${r}`), 2)) },
  // (of the 36 recorded layers, pairs about −35, −28, −20 and −12.5 dB loud: ghost, soft, medium, hard)
  snare: { max: 1.0, layers: [[6, 8], [12, 14], [24, 26], [33, 35]].map((vs) => vs.map((v) => `mid/snare/mid_snare_center_vl${v}.flac`)) },
  rim: { max: 1.0, layers: [5, 8, 11].map((v) => [`mid/snare/mid_snare_rimshot_vl${v}.flac`]) },
  xstick: { max: 0.6, layers: [6, 10, 14, 16].map((v) => [`mid/snare/mid_snare_crossstick_vl${v}.flac`]) },
  hhc: { max: 0.6, layers: [1, 2, 3, 4].map((v) => rr((r) => K('hh', `closed_vl${v}_rr${r}`), 2)) },
  hhh: { max: 1.0, layers: [rr((r) => K('hh', `half_vl3_rr${r}`), 2)] },
  hho: { max: 1.6, layers: [2, 4].map((v) => [K('hh', `open_vl${v}_rr1`)]) },
  hhp: { max: 0.6, layers: [rr((r) => K('hh', `pedal_vl2_rr${r}`), 2)] },
  ride: { max: 2.5, layers: [1, 2, 3].map((v) => rr((r) => K('ride', `ride_vl${v}_rr${r}`), 2)) },
  bell: { max: 2.5, layers: [rr((r) => K('ride', `bell_vl2_rr${r}`), 2)] },
  crash: { max: 3.5, layers: [2, 3].map((v) => [K('crash', `crash_vl${v}_rr1`)]) },
  tomh: { max: 1.2, layers: [8, 14].map((v) => [`mid/htom/mid_htom_center_vl${v}.flac`]) },
  toml: { max: 1.2, layers: [8, 14].map((v) => [`mid/ltom/mid_ltom_center_vl${v}.flac`]) },
  shakd: { max: 0.5, group: 'perc', layers: [rr((r) => P('shaker', `LShaker_Shake1D_rr${r}`), 3)] },
  shaku: { max: 0.5, group: 'perc', layers: [rr((r) => P('shaker', `LShaker_Shake1U_rr${r}`), 3)] },
  claves: { max: 0.5, group: 'perc', layers: [rr((r) => P('claves', `Claves1_Hit_v2_rr${r}`), 2)] },
  cowbell: { max: 0.8, group: 'perc', layers: [rr((r) => P('cowbell', `Cowbell1_Normal_v2_rr${r}`), 2)] },
  bongoh: { max: 0.7, group: 'perc', layers: [rr((r) => P('bongoh', `BongoH_Hit1_v2_rr${r}`), 2)] },
  bongol: { max: 0.7, group: 'perc', layers: [rr((r) => P('bongol', `BongoL_Hit1_v2_rr${r}`), 2)] },
  tamb: { max: 0.8, group: 'perc', layers: [rr((r) => P('tambourine', `Tamb1_Shake_rr${r}`), 2)] },
  conga: { max: 0.8, group: 'perc', layers: [rr((r) => P('conga', `Conga_22_HitN_51_100_rr${r}`), 2), [P('conga', 'Conga_22_HitN_101_127_rr1')]] },
  congas: { max: 0.6, group: 'perc', layers: [rr((r) => P('conga', `Conga_17_HitHM1_71_127_rr${r}`), 2)] },
};

async function decode(path) {
  const res = await fetch(raw(path));
  if (!res.ok) throw new Error(`missing ${path}`);
  return new OfflineAudioContext(1, 1, SR).decodeAudioData(await res.arrayBuffer());
}

/** Mono from a stereo mic: the sum, unless the channels cancel (then the left one). */
function mono(buf) {
  const n = buf.length, ch = buf.numberOfChannels;
  const out = new Float32Array(n);
  for (let c = 0; c < ch; c++) { const d = buf.getChannelData(c); for (let i = 0; i < n; i++) out[i] += d[i] / ch; }
  if (ch < 2) return { x: out, kept: 1 };
  const e = (d) => d.reduce((a, v) => a + v * v, 0);
  const kept = Math.sqrt(e(out) / ((e(buf.getChannelData(0)) + e(buf.getChannelData(1))) / 2));
  return kept < 0.6 ? { x: buf.getChannelData(0).slice(), kept } : { x: out, kept };
}

const peakOf = (x) => x.reduce((a, v) => Math.max(a, Math.abs(v)), 0);

/** The hit alone: from just before its onset to where it has died away (at most `max` s), faded out. */
function trim(x, max) {
  const pk = peakOf(x);
  let a = x.findIndex((v) => Math.abs(v) >= pk * 0.04);
  a = Math.max(0, a - Math.round(SR * 0.0005));
  let b = x.length - 1;
  while (b > a && Math.abs(x[b]) < pk * 0.0015) b--;
  b = Math.min(b + Math.round(SR * 0.02), x.length, a + Math.round(max * SR));
  const y = x.slice(a, b);
  const fade = Math.min(y.length, Math.round(SR * Math.min(0.25, (b - a) / SR * 0.3)));
  for (let i = 0; i < fade; i++) y[y.length - fade + i] *= 0.5 + 0.5 * Math.cos((Math.PI * i) / fade);
  return y;
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

/** Mono samples at 48 kHz → an Ogg Opus file (the encoder's own OpusHead gives the pre-skip). */
async function encodeOpus(x) {
  const packets = [];
  let head = null;
  const enc = new AudioEncoder({
    output: (chunk, meta) => {
      const b = new Uint8Array(chunk.byteLength);
      chunk.copyTo(b);
      packets.push({ b, n: Math.round((chunk.duration * SR) / 1e6) });
      if (!head && meta?.decoderConfig?.description) head = new Uint8Array(meta.decoderConfig.description);
    },
    error: (e) => { throw e; },
  });
  enc.configure({ codec: 'opus', sampleRate: SR, numberOfChannels: 1, bitrate: BITRATE });
  enc.encode(new AudioData({ format: 'f32-planar', sampleRate: SR, numberOfFrames: x.length, numberOfChannels: 1, timestamp: 0, data: x }));
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
    pages.push(page(group.map((p) => p.b), { granule: last ? preSkip + x.length : granule, seq: seq++, flags: last ? 4 : 0, serial }));
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

/** The layers of a piece's raw files by loudness (peak and the first 50 ms), to choose them. */
export async function measure(piece = 'snare', files = null) {
  const list = files || KIT[piece].layers.flat();
  const out = [];
  for (const f of list) {
    const { x } = mono(await decode(f));
    const a = x.findIndex((v) => Math.abs(v) >= peakOf(x) * 0.04);
    const w = x.slice(a, a + SR * 0.05);
    out.push({ f: f.split('/').pop(), peakDb: +(20 * Math.log10(peakOf(x))).toFixed(1), rmsDb: +(10 * Math.log10(w.reduce((s, v) => s + v * v, 0) / w.length)).toFixed(1) });
  }
  return out;
}

export async function run() {
  // every file once: mono, trimmed; then one gain per group (the kit keeps its recorded balance)
  const done = {};
  const groupPeak = {};
  for (const [name, p] of Object.entries(KIT)) {
    done[name] = [];
    for (const layer of p.layers) {
      const row = [];
      for (const f of layer) {
        const { x, kept } = mono(await decode(f));
        if (kept < 0.6) console.warn(`${f}: the channels cancel (${kept.toFixed(2)}), left channel kept`);
        const y = trim(x, p.max);
        row.push(y);
        const g = p.group || 'kit';
        groupPeak[g] = Math.max(groupPeak[g] || 0, peakOf(y));
      }
      done[name].push(row);
    }
  }
  const manifest = {
    name: 'Virtuosity Drums (Versilian Studios and Karoryfer), the "mid" mic, mono',
    license: 'CC0-1.0',
    source: 'https://github.com/sfzinstruments/virtuosity_drums',
    v: 1,
    pieces: {},
  };
  let bytes = 0, seconds = 0;
  for (const [name, layers] of Object.entries(done)) {
    const gain = 0.89 / groupPeak[KIT[name].group || 'kit'];
    manifest.pieces[name] = [];
    for (let l = 0; l < layers.length; l++) {
      const files = [];
      for (let r = 0; r < layers[l].length; r++) {
        const y = layers[l][r].map((v) => v * gain);
        const ogg = await encodeOpus(y);
        const file = `${name}-${l + 1}-${r + 1}.ogg`;
        await put(file, ogg, 'audio/ogg');
        files.push(file);
        bytes += ogg.length;
        seconds += y.length / SR;
      }
      manifest.pieces[name].push(files);
    }
  }
  await put('kit.json', JSON.stringify(manifest, null, 1), 'application/json');
  await put('LICENSE.txt', [
    'Drum and percussion samples: Virtuosity Drums by Versilian Studios and Karoryfer Samples,',
    'released under CC0 1.0 Universal (public domain): https://creativecommons.org/publicdomain/zero/1.0/',
    'Source: https://github.com/sfzinstruments/virtuosity_drums (the "mid" mic, made mono, trimmed and',
    'encoded as Opus for BassClass by web/js/dev/drumprep.js).',
    '',
  ].join('\n'), 'text/plain');
  return { files: Object.values(manifest.pieces).flat(2).length, kb: Math.round(bytes / 1024), seconds: +seconds.toFixed(1) };
}
