/*
 * Synthesizes the meditation gong (soft singing bowl) as a WAV file: assets/sounds/gong.wav.
 * Run: node scripts/make-sounds.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const RATE = 22050;
const SECONDS = 5;
// Partials of a small bowl: frequency ratio, loudness, how long it rings.
const BASE = 392;
const PARTIALS = [
  [1, 1, 3.2],
  [2.76, 0.42, 1.7],
  [5.4, 0.18, 0.9],
  [8.93, 0.07, 0.5],
];

const n = RATE * SECONDS;
const samples = new Float32Array(n);
for (let i = 0; i < n; i++) {
  const t = i / RATE;
  const attack = Math.min(1, t / 0.012);
  let v = 0;
  for (const [ratio, amp, decay] of PARTIALS) {
    // A slight beating between two close tones makes it shimmer like a real bowl.
    const f = BASE * ratio;
    v += amp * Math.exp(-t / decay) * (Math.sin(2 * Math.PI * f * t) + 0.35 * Math.sin(2 * Math.PI * (f + 1.6) * t));
  }
  samples[i] = attack * v;
}
let peak = 0;
for (const s of samples) peak = Math.max(peak, Math.abs(s));
const fadeOut = RATE * 0.3;

const buf = Buffer.alloc(44 + n * 2);
buf.write('RIFF', 0);
buf.writeUInt32LE(36 + n * 2, 4);
buf.write('WAVE', 8);
buf.write('fmt ', 12);
buf.writeUInt32LE(16, 16);
buf.writeUInt16LE(1, 20);
buf.writeUInt16LE(1, 22);
buf.writeUInt32LE(RATE, 24);
buf.writeUInt32LE(RATE * 2, 28);
buf.writeUInt16LE(2, 32);
buf.writeUInt16LE(16, 34);
buf.write('data', 36);
buf.writeUInt32LE(n * 2, 40);
for (let i = 0; i < n; i++) {
  const tail = i > n - fadeOut ? (n - i) / fadeOut : 1;
  buf.writeInt16LE(Math.round((samples[i] / peak) * 0.7 * tail * 32767), 44 + i * 2);
}

const out = join(root, 'assets/sounds/gong.wav');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, buf);
console.log('wrote assets/sounds/gong.wav', Math.round(buf.length / 1024) + ' KB');
