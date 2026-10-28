/*
 * Store graphics with captions, German and English, in the warm "You Do You" style:
 *   App Store  1320×2868 (iPhone 6.9")  → docs/store/screenshots/ios/<lang>/
 *   Google Play 1080×1920               → docs/store/screenshots/android/<lang>/
 *   Play feature graphic 1024×500       → docs/store/feature-graphic-<lang>.png
 * Needs the web export served (npm run export:web && npm run serve:web) and Playwright's Chromium.
 * Run: node scripts/store-assets.mjs [baseUrl]
 */
import { chromium } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.argv[2] || 'http://localhost:8090/you-do-you/';
const TODAY = '2026-10-27';
const font = (p) => readFileSync(join(root, 'node_modules/@expo-google-fonts', p)).toString('base64');
const FONTS = `
@font-face{font-family:Fraunces;font-weight:700;src:url(data:font/ttf;base64,${font('fraunces/700Bold/Fraunces_700Bold.ttf')})}
@font-face{font-family:Fraunces;font-weight:600;font-style:italic;src:url(data:font/ttf;base64,${font('fraunces/600SemiBold_Italic/Fraunces_600SemiBold_Italic.ttf')})}
@font-face{font-family:Nunito;font-weight:400;src:url(data:font/ttf;base64,${font('nunito/400Regular/Nunito_400Regular.ttf')})}`;

const SUN = (size) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><defs><linearGradient id="s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFD36B"/><stop offset="1" stop-color="#E8734A"/></linearGradient></defs><g stroke="#F2A33A" stroke-width="1.7" stroke-linecap="round"><path d="M12 1.5v2M12 20.5v2M1.5 12h2M20.5 12h2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M4.6 19.4L6 18M18 6l1.4-1.4M7.8 2.6l.6 1.5M15.6 19.9l.6 1.5M2.6 16.2l1.5-.6M19.9 8.4l1.5-.6M16.2 2.6l-.6 1.5M8.4 19.9l-.6 1.5M2.6 7.8l1.5.6M19.9 15.6l1.5.6"/></g><circle cx="12" cy="12" r="6.2" fill="url(#s)"/></svg>`;

const SAMPLE = {
  de: {
    todos: [
      ['t1', 'Steuererklärung abschicken', 'tag', 3, ['Belege sammeln', 'Formular ausfüllen']],
      ['t2', 'Mama anrufen', 'ewig', 1],
      ['t3', 'Blumen gießen', 'tag-1', 1],
      ['t4', 'Fahrrad reparieren', 'woche', 2, ['Schlauch kaufen', 'Reifen wechseln', 'Bremsen prüfen']],
      ['t5', 'Wäsche aufhängen', 'done', 1],
    ],
    routines: [['r4', 'Dehnen', '🧘', 'tag', 1, 'morning'], ['r1', 'Wasser trinken (Glas)', '💧', 'tag', 8], ['r2', 'Lesen', '📚', 'tag', 1, 'evening'], ['r3', 'Spazieren gehen', '🚶', 'woche', 3]],
  },
  en: {
    todos: [
      ['t1', 'File the tax return', 'tag', 3, ['Collect receipts', 'Fill in the form']],
      ['t2', 'Call mom', 'ewig', 1],
      ['t3', 'Water the plants', 'tag-1', 1],
      ['t4', 'Fix the bike', 'woche', 2, ['Buy a tube', 'Change the tire', 'Check the brakes']],
      ['t5', 'Hang up the laundry', 'done', 1],
    ],
    routines: [['r4', 'Stretch', '🧘', 'tag', 1, 'morning'], ['r1', 'Drink water (glass)', '💧', 'tag', 8], ['r2', 'Read', '📚', 'tag', 1, 'evening'], ['r3', 'Go for a walk', '🚶', 'woche', 3]],
  },
};

// [route, scheme, headline, subline, background]
const SHOTS = {
  de: [
    ['', 'light', 'Dein Tag.<br><i>In deinem Tempo.</i>', 'To-dos, Routinen und Meditation in einer App.', 'peach'],
    ['meditate', 'light', 'Einen Moment<br><i>nur für dich.</i>', 'Timer, Atemführung, sanfter Gong.', 'lavender'],
    ['session', 'light', 'Atme mit<br><i>der Sonne.</i>', 'Ruhig, Box oder ganz frei.', 'sunrise'],
    ['routines', 'dark', 'Routinen für<br><i>morgens bis abends.</i>', 'Tagesziel, Streak und Bonus-XP.', 'cocoa'],
    ['level', 'light', 'Wachse<br><i>Schritt für Schritt.</i>', 'Vom Samenkorn bis zum Leuchtturm.', 'peach'],
    ['todos', 'light', 'Kleine Schritte<br><i>zählen.</i>', 'Ohne Konto. Ohne Werbung.', 'lavender'],
  ],
  en: [
    ['', 'light', 'Your day.<br><i>Your pace.</i>', 'To-dos, habits and meditation in one app.', 'peach'],
    ['meditate', 'light', 'A moment<br><i>just for you.</i>', 'Timer, breathing guide, soft gong.', 'lavender'],
    ['session', 'light', 'Breathe with<br><i>the sun.</i>', 'Calm, box or completely free.', 'sunrise'],
    ['routines', 'dark', 'Routines from<br><i>morning to night.</i>', 'Daily goal, streak and bonus XP.', 'cocoa'],
    ['level', 'light', 'Grow<br><i>step by step.</i>', 'From Seed to Lighthouse.', 'peach'],
    ['todos', 'light', 'Small steps<br><i>count.</i>', 'No account. No ads.', 'lavender'],
  ],
};

const THEMES = {
  peach: { bg: 'linear-gradient(170deg,#FFF3E2,#FFCFA8)', head: '#3B2A21', accent: '#B5582F', sub: '#6B4E3F' },
  lavender: { bg: 'linear-gradient(170deg,#FBF4EE,#E2D6F4)', head: '#3B2A21', accent: '#6F5BA8', sub: '#5E5070' },
  sunrise: { bg: 'linear-gradient(170deg,#FFE2B8,#F7A27C)', head: '#3B2A21', accent: '#8E3B1C', sub: '#5A3626' },
  cocoa: { bg: 'linear-gradient(170deg,#8E5236,#3E2216)', head: '#FFF1E2', accent: '#FFC98A', sub: '#F3D9C6' },
};

function day(n) {
  const d = new Date(TODAY + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function docs(lang) {
  const s = SAMPLE[lang];
  const out = [];
  const put = (col, id, doc) => out.push({ key: col + '/' + id, col, id, doc, updatedAt: 0 });
  put('settings', 'main', { name: lang === 'de' ? 'Mia' : 'Mia', language: lang, timezone: 'Europe/Berlin', dailyGoal: 3, mindfulGoal: 10, mail: { enabled: false }, theme: 'system', onboarded: true, meditation: { minutes: 10, pattern: 'calm', bell: true, dnd: true } });
  s.todos.forEach(([id, title, kind, diff, subs = []], i) => {
    const scope = kind === 'done' || kind === 'tag-1' ? 'tag' : kind;
    const period = scope === 'ewig' ? null : scope === 'woche' ? '2026-W44' : kind === 'tag-1' ? day(-1) : TODAY;
    put('todos', id, {
      title, scope, period, diff, done: kind === 'done', doneOn: kind === 'done' ? TODAY : null, createdAt: '2026-10-01T08:00:00Z', order: i,
      subs: subs.map((t, j) => ({ id: `${id}s${j}`, title: t, done: j === 0, doneOn: j === 0 ? TODAY : null })),
    });
  });
  for (let i = 1; i <= 46; i++) {
    put('todos', 'h' + i, { title: 'done', scope: 'ewig', period: null, diff: 1 + (i % 3), subs: [], done: true, doneOn: day(-((i * 2) % 90) - 1), archived: true, createdAt: '2026-08-01', order: 100 + i });
  }
  s.routines.forEach(([id, title, emoji, scope, target, slot], i) => put('routines', id, { title, emoji, scope, target, ...(slot ? { slot } : {}), createdAt: '2026-08-01', order: i }));
  for (let i = -100; i <= 0; i++) {
    if (i < -14 && (i * 7) % 5 === 0) continue;
    const r = { r4: 1, r1: i === 0 ? 3 : 3 + ((((i * 13) % 6) + 6) % 6), r2: i === 0 ? 0 : i % 3 ? 1 : 0 };
    if (i % 2 === 0) r.r3 = 1;
    put('days', day(i), { date: day(i), routines: Object.fromEntries(Object.entries(r).filter(([, n]) => n > 0)) });
    if (i < 0 && i % 3 !== 1) {
      const min = [5, 10, 3, 15, 10, 20][Math.abs(i) % 6];
      put('sessions', 's' + -i, { date: day(i), startedAt: day(i) + 'T07:30:00Z', minutes: min, seconds: min * 60, completed: true, pattern: i % 2 ? 'calm' : 'box', moodAfter: 3 + (Math.abs(i) % 3) });
    }
  }
  put('sessions', 'today', { date: TODAY, startedAt: TODAY + 'T07:00:00Z', minutes: 5, seconds: 300, completed: true, pattern: 'calm', moodAfter: 5 });
  return out;
}

async function seed(page, lang) {
  await page.evaluate(
    (d) =>
      new Promise((resolve, reject) => {
        const req = indexedDB.open('youdoyou', 1);
        req.onupgradeneeded = () => req.result.createObjectStore('docs', { keyPath: 'key' });
        req.onsuccess = () => {
          const tx = req.result.transaction('docs', 'readwrite');
          const st = tx.objectStore('docs');
          st.clear();
          for (const x of d) st.put(x);
          tx.oncomplete = () => resolve(null);
          tx.onerror = () => reject(tx.error);
        };
      }),
    docs(lang),
  );
}

async function raw(browser, lang, route, scheme) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: scheme, locale: lang === 'de' ? 'de-DE' : 'en-US', timezoneId: 'Europe/Berlin' });
  const page = await ctx.newPage();
  await page.clock.setFixedTime(new Date('2026-10-27T08:30:00+01:00'));
  await page.goto(BASE);
  await seed(page, lang);
  await page.goto(BASE + route);
  await page.waitForTimeout(1800);
  const png = await page.screenshot();
  await ctx.close();
  return png.toString('base64');
}

function composeHtml({ w, h, head, sub, theme, img, headSize, subSize, phoneW, top }) {
  const t = THEMES[theme];
  return `<!doctype html><html><head><style>${FONTS}
*{margin:0;box-sizing:border-box}
body{width:${w}px;height:${h}px;background:${t.bg};overflow:hidden;position:relative;font-family:Nunito,sans-serif;padding-top:${top}px}
.sun{position:absolute;right:${-w * 0.1}px;bottom:${-w * 0.1}px;opacity:.6}
h1{font-family:Fraunces;font-weight:700;color:${t.head};font-size:${headSize}px;line-height:1.08;letter-spacing:-0.01em;text-align:center;padding:0 ${Math.round(w * 0.06)}px;position:relative}
h1 i{font-weight:600;font-style:italic;color:${t.accent}}
p{color:${t.sub};font-size:${subSize}px;text-align:center;margin-top:${Math.round(subSize * 0.6)}px;padding:0 ${Math.round(w * 0.08)}px;position:relative}
.phone{position:relative;margin:${Math.round(subSize * 1.6)}px auto 0;width:${phoneW}px;border-radius:${Math.round(phoneW * 0.12)}px;background:#3B2A21;padding:${Math.round(phoneW * 0.018)}px;box-shadow:0 ${Math.round(w * 0.02)}px ${Math.round(w * 0.06)}px rgba(90,50,30,.28)}
.phone img{display:block;width:100%;border-radius:${Math.round(phoneW * 0.1)}px}
</style></head><body><div class="sun">${SUN(Math.round(w * 0.42))}</div><h1>${head}</h1><p>${sub}</p><div class="phone"><img src="data:image/png;base64,${img}"></div></body></html>`;
}

function featureHtml(lang, img) {
  const tag = lang === 'de' ? 'To-dos, Routinen und Meditation.<br>In deinem Tempo.' : 'To-dos, habits and meditation.<br>At your own pace.';
  return `<!doctype html><html><head><style>${FONTS}
*{margin:0;box-sizing:border-box}
body{width:1024px;height:500px;background:linear-gradient(160deg,#FFF3E2,#FFC99F);overflow:hidden;position:relative;font-family:Nunito,sans-serif}
.logo{position:absolute;left:64px;top:140px;display:flex;align-items:center;gap:16px;font-family:Fraunces;font-weight:700;font-size:72px;color:#3B2A21}
.logo i{font-weight:600;color:#B5582F}
.tag{position:absolute;left:68px;top:270px;color:#6B4E3F;font-size:30px;line-height:1.35}
.phone{position:absolute;right:50px;top:40px;width:250px;border-radius:32px;background:#3B2A21;padding:6px;transform:rotate(5deg);box-shadow:0 20px 50px rgba(90,50,30,.35)}
.phone img{display:block;width:100%;border-radius:27px}
</style></head><body><div class="logo">${SUN(84)}<span>you do <i>you</i></span></div><div class="tag">${tag}</div><div class="phone"><img src="data:image/png;base64,${img}"></div></body></html>`;
}

async function render(browser, html, w, h, file) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, await page.screenshot());
  await page.close();
  console.log('wrote', file.replace(root, '').replace(/^[\\/]/, ''));
}

const browser = await chromium.launch();
for (const lang of ['de', 'en']) {
  let first = null;
  for (let i = 0; i < SHOTS[lang].length; i++) {
    const [route, scheme, head, sub, theme] = SHOTS[lang][i];
    const img = await raw(browser, lang, route, scheme);
    first ??= img;
    const n = `${i + 1}-${route || 'start'}-${scheme}`;
    await render(browser, composeHtml({ w: 1320, h: 2868, head, sub, theme, img, headSize: 112, subSize: 54, phoneW: 1000, top: 190 }), 1320, 2868, join(root, `docs/store/screenshots/ios/${lang}/${n}.png`));
    await render(browser, composeHtml({ w: 1080, h: 1920, head, sub, theme, img, headSize: 74, subSize: 36, phoneW: 640, top: 110 }), 1080, 1920, join(root, `docs/store/screenshots/android/${lang}/${n}.png`));
  }
  await render(browser, featureHtml(lang, first), 1024, 500, join(root, `docs/store/feature-graphic-${lang}.png`));
}
await browser.close();
