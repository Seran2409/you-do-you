/*
 * Renders the warm "You Do You" icons: a rising sun with a soft check mark on a peach gradient,
 * Android adaptive layers, splash wordmark, favicon, web/PWA icons and the notification icon.
 * Run: node scripts/make-icons.mjs
 */
import { Resvg } from '@resvg/resvg-js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const FONTS = [
  join(root, 'node_modules/@expo-google-fonts/fraunces/600SemiBold/Fraunces_600SemiBold.ttf'),
  join(root, 'node_modules/@expo-google-fonts/fraunces/600SemiBold_Italic/Fraunces_600SemiBold_Italic.ttf'),
];
const INK = '#3B2A21';
const TERRACOTTA = '#B5582F';

function svg(size, body, bg) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF1DE"/><stop offset="1" stop-color="#FFC99F"/></linearGradient>
      <linearGradient id="disc" x1="0.15" y1="0.1" x2="0.85" y2="0.95"><stop offset="0" stop-color="#FFD978"/><stop offset="1" stop-color="#EE7A50"/></linearGradient>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${size * 0.04}"/></filter>
    </defs>
    ${bg === 'gradient' ? `<rect width="${size}" height="${size}" fill="url(#bg)"/>` : bg ? `<rect width="${size}" height="${size}" fill="${bg}"/>` : ''}
    ${body}
  </svg>`;
}

/** Sun with rays, centered at (cx, cy) with disc radius r. `check` draws a white tick into the disc. */
function sun(cx, cy, r, { check = true, mono = false } = {}) {
  const rays = Array.from({ length: 12 }, (_, i) => {
    const a = (i * Math.PI) / 6;
    const r1 = r * 1.28;
    const r2 = r * (i % 2 ? 1.5 : 1.62);
    return `<line x1="${cx + Math.cos(a) * r1}" y1="${cy + Math.sin(a) * r1}" x2="${cx + Math.cos(a) * r2}" y2="${cy + Math.sin(a) * r2}" />`;
  }).join('');
  const tick = check
    ? `<path d="M ${cx - r * 0.42} ${cy + r * 0.02} L ${cx - r * 0.1} ${cy + r * 0.34} L ${cx + r * 0.46} ${cy - r * 0.3}" fill="none" stroke="${mono ? '#000' : '#FFFFFF'}" stroke-width="${r * 0.17}" stroke-linecap="round" stroke-linejoin="round"/>`
    : '';
  return `
    ${mono ? '' : `<circle cx="${cx}" cy="${cy}" r="${r * 1.1}" fill="#FFB86B" opacity="0.45" filter="url(#glow)"/>`}
    <g stroke="${mono ? '#FFFFFF' : '#F4A23E'}" stroke-width="${r * 0.15}" stroke-linecap="round">${rays}</g>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${mono ? '#FFFFFF' : 'url(#disc)'}"/>
    ${mono ? '' : tick}`;
}

const appIcon = (size, { scale = 1, bg = 'gradient', mono = false, check = true } = {}) => svg(size, sun(size / 2, size / 2, size * 0.25 * scale, { check, mono }), bg);

/** Splash: sun and "you do you" wordmark, centered. Dark variant uses light text. */
function splash(size, dark = false) {
  const fs = size * 0.1;
  return svg(
    size,
    `${sun(size * 0.17, size / 2, size * 0.062, { check: false })}
     <text x="${size * 0.315}" y="${size / 2 + fs * 0.34}" font-family="Fraunces" font-weight="600" font-size="${fs}" fill="${dark ? '#FBEEDF' : INK}">you do <tspan font-style="italic" fill="${dark ? '#F0A070' : TERRACOTTA}">you</tspan></text>`,
  );
}

function render(file, svgText, width) {
  const png = new Resvg(svgText, {
    fitTo: { mode: 'width', value: width },
    font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: 'Fraunces' },
  })
    .render()
    .asPng();
  const out = join(root, file);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, png);
  console.log('wrote', file, width + 'px');
}

render('assets/icon.png', appIcon(1024), 1024);
render('assets/android-icon-foreground.png', appIcon(1024, { scale: 0.66, bg: null }), 1024);
render('assets/android-icon-background.png', svg(1024, '', 'gradient'), 1024);
render('assets/android-icon-monochrome.png', appIcon(1024, { scale: 0.66, bg: null, mono: true }), 1024);
render('assets/splash-icon.png', splash(1024), 1024);
render('assets/splash-icon-dark.png', splash(1024, true), 1024);
render('assets/favicon.png', appIcon(1024, { scale: 1.3, check: false }), 48);
render('public/icons/icon-192.png', appIcon(1024), 192);
render('public/icons/icon-512.png', appIcon(1024), 512);
render('public/icons/maskable-512.png', appIcon(1024, { scale: 0.82 }), 512);
render('public/icons/apple-touch-icon.png', appIcon(1024), 180);
render('assets/notification-icon.png', appIcon(96, { scale: 1.15, bg: null, mono: true, check: false }), 96);
