/*
 * Builds the legal pages (privacy, terms, imprint, help; German and English) into public/legal/.
 * Your details come from legal.config.json, so name and address live in one place.
 * Run: npm run legal
 *
 * These are careful templates, not legal advice. Have them checked before you monetize the app.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cfg = JSON.parse(readFileSync(join(root, 'legal.config.json'), 'utf8'));
const APP = "You Do You";
const SITE = 'https://seran2409.github.io/you-do-you';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/** Placeholders like [Name] are highlighted so nothing unfinished goes live unnoticed. */
const v = (s) => (/^\[.*\]$/.test(s) ? `<mark>${esc(s)}</mark>` : esc(s));
const mail = () => (/^\[.*\]$/.test(cfg.email) ? v(cfg.email) : `<a href="mailto:${esc(cfg.email)}">${esc(cfg.email)}</a>`);
const address = (en) => `${v(cfg.name)}<br>${v(cfg.street)}<br>${v(cfg.city)}<br>${esc(en ? cfg.countryEn : cfg.country)}`;

const SUN = '<svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFD36B"/><stop offset="1" stop-color="#E8734A"/></linearGradient></defs><g stroke="#F2A33A" stroke-width="1.7" stroke-linecap="round"><path d="M12 1.5v2M12 20.5v2M1.5 12h2M20.5 12h2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M4.6 19.4L6 18M18 6l1.4-1.4"/></g><circle cx="12" cy="12" r="6.2" fill="url(#s)"/></svg>';

const NAV = {
  de: [['datenschutz', 'Datenschutz'], ['agb', 'AGB'], ['impressum', 'Impressum'], ['hilfe', 'Hilfe']],
  en: [['privacy', 'Privacy'], ['terms', 'Terms'], ['imprint', 'Imprint'], ['support', 'Support']],
};
const SWITCH = { datenschutz: 'privacy', agb: 'terms', impressum: 'imprint', hilfe: 'support' };
const BACK = Object.fromEntries(Object.entries(SWITCH).map(([a, b]) => [b, a]));

function page(lang, slug, title, body) {
  const other = lang === 'de' ? SWITCH[slug] : BACK[slug];
  const nav = NAV[lang].map(([s, l]) => `<a href="${s}.html"${s === slug ? ' aria-current="page"' : ''}>${l}</a>`).join('');
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} · ${esc(APP)}</title>
<meta name="robots" content="index, follow">
<link rel="icon" type="image/png" href="../icons/icon-192.png">
<style>
:root{--bg:#FFF8EF;--surface:#fff;--ink:#3B2A21;--muted:#8B7264;--line:#F0E2D2;--accent:#B5582F}
@media (prefers-color-scheme:dark){:root{--bg:#1E1712;--surface:#2A2019;--ink:#FBEEDF;--muted:#C4AD9B;--line:#3D3027;--accent:#F0A070}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.wrap{max-width:760px;margin:0 auto;padding:24px 16px 64px}
.logo{display:inline-flex;align-items:center;gap:8px;text-decoration:none;color:var(--ink);font:600 22px/1 Georgia,'Times New Roman',serif}
.logo i{color:var(--accent)}
h1,h2{font-family:Georgia,'Times New Roman',serif}
nav{display:flex;flex-wrap:wrap;gap:6px;margin:20px 0 8px}
nav a{padding:6px 12px;border-radius:99px;border:1px solid var(--line);color:var(--ink);text-decoration:none;font-weight:600;font-size:14px;background:var(--surface)}
nav a[aria-current]{background:var(--accent);color:#fff;border-color:var(--accent)}
.lang{font-size:14px;color:var(--muted)}
h1{font-size:28px;line-height:1.2;margin:28px 0 4px}
h2{font-size:19px;margin:28px 0 6px}
p,li{color:var(--ink)}
.muted{color:var(--muted);font-size:14px}
a{color:var(--accent)}
mark{background:#FFE58A;color:#1C1A0F;padding:0 3px;border-radius:3px}
.card{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:14px 16px}
footer{margin-top:40px;font-size:14px;color:var(--muted)}
</style>
</head>
<body>
<div class="wrap">
<a href="${SITE}/" class="logo" aria-label="${esc(APP)}">${SUN}you do <i>you</i></a>
<nav>${nav}</nav>
<p class="lang"><a href="${other}.html">${lang === 'de' ? 'English version' : 'Deutsche Fassung'}</a></p>
<h1>${esc(title)}</h1>
${body}
<footer>${lang === 'de' ? `Stand: ${esc(cfg.updated)}` : `Last updated: ${esc(cfg.updatedEn)}`} · ${esc(APP)}</footer>
</div>
</body>
</html>
`;
}

/* ---------------- German ---------------- */

const datenschutz = `
<p class="muted">Für die App „${esc(APP)}“ (iOS, Android) und die Web-Version.</p>
<h2>1. Verantwortlicher</h2>
<p class="card">${address(false)}<br>E-Mail: ${mail()}</p>
<h2>2. Das Wichtigste in Kürze</h2>
<ul>
<li>Die App funktioniert ohne Konto. Deine To-dos, Routinen, Einträge und Einstellungen werden <strong>nur auf deinem Gerät</strong> gespeichert, in der Web-Version im Speicher deines Browsers.</li>
<li>Wir erhalten diese Inhalte nicht. Es gibt keinen eigenen Server, keine Analyse- oder Tracking-Werkzeuge und keine Werbung.</li>
<li>Erinnerungen plant die App direkt auf deinem Gerät, ohne Push-Server.</li>
</ul>
<h2>3. Daten auf deinem Gerät</h2>
<p>Gespeichert werden die Titel und der Status deiner To-dos und Unterpunkte, deine Routinen und Einträge, deine Meditationen (Datum, Dauer, Atemrhythmus und, falls du sie angibst, deine Stimmung danach) sowie deine Einstellungen (optional dein Vorname, Sprache, Darstellung, Tagesziel, Erinnerungszeiten). Zweck ist allein die Bereitstellung der App-Funktionen. Diese Daten verlassen dein Gerät nicht, außer du exportierst sie selbst.</p>
<p>Löschen kannst du alles in der App unter Einstellungen → „Alle Daten löschen“, durch Deinstallieren der App oder in der Web-Version durch Löschen der Websitedaten in deinem Browser.</p>
<h2>4. Erinnerungen</h2>
<p>Erinnerungen gibt es nur, wenn du sie einschaltest und deinem Gerät die Erlaubnis für Benachrichtigungen gibst. Ihr Inhalt wird auf dem Gerät erzeugt. Du kannst sie jederzeit in der App oder in den Systemeinstellungen abschalten.</p>
<h2>4a. Meditation und „Nicht stören“</h2>
<p>Während einer Meditation bleibt der Bildschirm an, und die App plant ihre eigenen Erinnerungen so, dass sie nicht stören. Auf Android-Geräten kann die App den Modus „Bitte nicht stören“ für die Dauer der Sitzung auf „nur Wecker“ stellen und danach den vorherigen Modus wiederherstellen. Das geschieht nur, wenn du ihr diesen Zugriff in den Systemeinstellungen ausdrücklich erlaubst; du kannst ihn dort jederzeit wieder entziehen. Dabei werden keine Daten übertragen. Auf dem iPhone ist das technisch nicht möglich, dort ändert die App nichts an deinen Fokus-Einstellungen.</p>
<h2>5. Export und Import</h2>
<p>Der Export erzeugt eine Datei mit deinen Daten. Wo du sie speicherst oder mit wem du sie teilst, entscheidest du; dann gelten die Bedingungen des jeweiligen Dienstes.</p>
<h2>6. Download über App Store und Google Play</h2>
<p>Beim Download verarbeiten Apple bzw. Google Daten (zum Beispiel dein Store-Konto und Downloadinformationen) in eigener Verantwortung. Darauf haben wir keinen Einfluss. Von den Stores erhalten wir zusammengefasste Statistiken wie Downloadzahlen und Bewertungen, außerdem Absturzberichte und Nutzungsstatistiken ohne direkten Personenbezug, sofern du der Weitergabe an Entwickler in den Einstellungen deines Geräts zugestimmt hast. Diese Auswertung dient der Fehlerbehebung und Verbesserung der App (Art. 6 Abs. 1 lit. f DSGVO).</p>
<p>Datenschutzhinweise der Stores: <a href="https://www.apple.com/de/legal/privacy/">Apple</a> · <a href="https://policies.google.com/privacy?hl=de">Google</a></p>
<h2>7. Website und Web-Version (GitHub Pages)</h2>
<p>Diese Seiten und die Web-Version werden von GitHub, Inc., 88 Colin P Kelly Jr St, San Francisco, CA 94107, USA bereitgestellt. Beim Aufruf verarbeitet GitHub technisch notwendige Daten wie IP-Adresse, Zeitpunkt, aufgerufene Seite und Browsertyp, um die Seiten auszuliefern und abzusichern (Art. 6 Abs. 1 lit. f DSGVO). GitHub ist nach eigenen Angaben unter dem EU-US Data Privacy Framework zertifiziert, auf das sich die Übermittlung in die USA stützt (Art. 45 DSGVO). Mehr dazu in der <a href="https://docs.github.com/de/site-policy/privacy-policies/github-general-privacy-statement">Datenschutzerklärung von GitHub</a>.</p>
<p>Die Web-Version setzt keine Cookies. Sie speichert deine Inhalte im lokalen Speicher deines Browsers; das ist für die Funktion technisch erforderlich (§ 25 Abs. 2 Nr. 2 TDDDG). Schriftarten werden mit der App ausgeliefert, es werden keine Server von Google angefragt.</p>
<h2>8. Kontakt per E-Mail</h2>
<p>Wenn du uns schreibst, verwenden wir deine Angaben nur, um deine Anfrage zu bearbeiten (Art. 6 Abs. 1 lit. b oder f DSGVO), und löschen sie, sobald sie dafür nicht mehr nötig sind und keine gesetzlichen Aufbewahrungspflichten bestehen.</p>
<h2>9. Deine Rechte</h2>
<p>Du hast das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch (Art. 21). Außerdem kannst du dich bei einer Datenschutz-Aufsichtsbehörde beschweren (Art. 77), etwa bei der Behörde deines Wohnorts. Da deine App-Inhalte nur auf deinem Gerät liegen, kannst du sie dort selbst einsehen, exportieren und löschen.</p>
<h2>10. Änderungen</h2>
<p>Kommen neue Funktionen hinzu, zum Beispiel ein Konto mit Synchronisation, Werbung oder In-App-Käufe, passen wir diese Erklärung an, bevor die Funktion startet.</p>
`;

const agb = `
<p class="muted">Nutzungsbedingungen für die App „${esc(APP)}“ (iOS, Android) und die Web-Version.</p>
<h2>§ 1 Geltungsbereich und Anbieter</h2>
<p>(1) Diese Bedingungen gelten für die Nutzung der App „${esc(APP)}“ und ihrer Web-Version (zusammen „App“).<br>(2) Anbieter ist ${v(cfg.name)}, ${v(cfg.street)}, ${v(cfg.city)} (siehe <a href="impressum.html">Impressum</a>).<br>(3) Abweichende Bedingungen von Nutzerinnen und Nutzern gelten nicht.</p>
<h2>§ 2 Leistungen</h2>
<p>(1) Die App hilft dir, To-dos und Routinen zu organisieren, und belohnt Erledigtes spielerisch mit Erfahrungspunkten (XP), Leveln, Serien (Streaks) und Abzeichen. Punkte, Level und Abzeichen haben keinen Geldwert, sind nicht übertragbar und können nicht ausgezahlt werden.<br>(2) Die Grundfunktionen sind kostenlos.<br>(3) Die App ist ein Hilfsmittel zur Selbstorganisation. Sie ersetzt keine medizinische, therapeutische oder sonstige fachliche Beratung. Ein bestimmter Erfolg wird nicht geschuldet.<br>(4) Die Meditationsfunktion ist ein Angebot zur Entspannung und Achtsamkeit, keine Therapie. Bei gesundheitlichen oder psychischen Beschwerden wende dich bitte an eine Ärztin, einen Arzt oder eine Psychotherapeutin bzw. einen Psychotherapeuten.</p>
<h2>§ 3 Vertragsschluss und Bezug</h2>
<p>(1) Der Nutzungsvertrag kommt zustande, wenn du die App herunterlädst oder die Web-Version aufrufst und nutzt.<br>(2) Den Download wickeln der Apple App Store bzw. Google Play ab; dafür gelten zusätzlich deren Bedingungen. Für über den Apple App Store bezogene Apps gilt ergänzend der Standard-Lizenzvertrag für Endnutzer von Apple (Licensed Application End User License Agreement).</p>
<h2>§ 4 Nutzungsrecht</h2>
<p>(1) Du erhältst für die Dauer des Vertrags das einfache, nicht übertragbare Recht, die App für private Zwecke zu nutzen.<br>(2) Nicht erlaubt sind insbesondere das Umgehen technischer Schutzmaßnahmen, das Weiterverbreiten der App und ihre gewerbliche Nutzung ohne unsere Zustimmung. Zwingende gesetzliche Rechte, etwa nach §§ 69d und 69e UrhG, bleiben unberührt.</p>
<h2>§ 5 Kostenpflichtige Zusatzfunktionen</h2>
<p>(1) Derzeit gibt es keine kostenpflichtigen Funktionen. Werden später optionale Zusatzfunktionen angeboten (etwa eine einmalige Freischaltung oder ein Abonnement), zeigen App und Store Umfang und Preis vor dem Kauf an.<br>(2) Kauf und Zahlung laufen ausschließlich über den Apple App Store bzw. Google Play; dafür gelten die Bedingungen des jeweiligen Stores.<br>(3) Abonnements verlängern sich automatisch, wenn du sie nicht spätestens 24 Stunden vor Ablauf des Zeitraums in den Kontoeinstellungen des Stores kündigst.<br>(4) Widerruf und Erstattungen wickelt der jeweilige Store nach seinen Bedingungen und den gesetzlichen Vorgaben ab.</p>
<h2>§ 6 Deine Daten und Datensicherung</h2>
<p>(1) Deine Inhalte werden nur auf deinem Gerät gespeichert. Einzelheiten stehen in der <a href="datenschutz.html">Datenschutzerklärung</a>.<br>(2) Für die Sicherung deiner Daten bist du selbst verantwortlich. Nutze dafür die Export-Funktion. Ohne Export gehen deine Daten beim Deinstallieren, beim Gerätewechsel oder beim Löschen der Browserdaten verloren.</p>
<h2>§ 7 Verfügbarkeit und Weiterentwicklung</h2>
<p>Wir entwickeln die App weiter und stellen Updates bereit, insbesondere zur Fehlerbehebung und Sicherheit. Ein Anspruch auf bestimmte neue Funktionen oder auf eine ununterbrochene Erreichbarkeit der Web-Version besteht nicht. Gesetzliche Pflichten bleiben unberührt.</p>
<h2>§ 8 Haftung</h2>
<p>(1) Wir haften unbeschränkt bei Vorsatz und grober Fahrlässigkeit, bei Verletzung von Leben, Körper oder Gesundheit, nach dem Produkthaftungsgesetz sowie im Umfang einer übernommenen Garantie.<br>(2) Bei leicht fahrlässiger Verletzung einer wesentlichen Vertragspflicht, also einer Pflicht, deren Erfüllung die ordnungsgemäße Durchführung des Vertrags erst ermöglicht und auf deren Einhaltung du regelmäßig vertrauen darfst, ist die Haftung auf den vertragstypischen, vorhersehbaren Schaden begrenzt.<br>(3) Im Übrigen ist die Haftung für leichte Fahrlässigkeit ausgeschlossen.<br>(4) Für den Verlust von Daten haften wir nur in dem Umfang, in dem er auch bei regelmäßiger Sicherung über die Export-Funktion eingetreten wäre.</p>
<h2>§ 9 Laufzeit und Beendigung</h2>
<p>Du kannst die Nutzung jederzeit beenden, indem du die App löschst. Abonnements kündigst du über die Kontoeinstellungen des jeweiligen Stores.</p>
<h2>§ 10 Änderungen dieser Bedingungen</h2>
<p>Wir können diese Bedingungen mit Wirkung für die Zukunft ändern, wenn es dafür einen sachlichen Grund gibt, etwa neue Funktionen oder geänderte Gesetze. Über wesentliche Änderungen informieren wir rechtzeitig in der App. Für bereits bezahlte Leistungen gelten die Bedingungen zum Zeitpunkt des Kaufs.</p>
<h2>§ 11 Schlussbestimmungen</h2>
<p>(1) Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts. Bist du Verbraucherin oder Verbraucher, bleiben die zwingenden Verbraucherschutzvorschriften des Staates deines gewöhnlichen Aufenthalts unberührt.<br>(2) Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.<br>(3) Sind einzelne Bestimmungen unwirksam, bleibt der Vertrag im Übrigen wirksam (§ 306 BGB).</p>
`;

const impressum = `
<h2>Angaben gemäß § 5 DDG</h2>
<p class="card">${address(false)}</p>
<h2>Kontakt</h2>
<p>E-Mail: ${mail()}<br>Telefon: ${v(cfg.phone)}</p>
${cfg.vatId ? `<h2>Umsatzsteuer-ID</h2><p>Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: ${v(cfg.vatId)}</p>` : ''}
<h2>Verbraucherstreitbeilegung</h2>
<p>Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
<h2>Weitere Rechtstexte</h2>
<p><a href="datenschutz.html">Datenschutzerklärung</a> · <a href="agb.html">Nutzungsbedingungen (AGB)</a></p>
`;

const hilfe = `
<p>Fragen, Fehler oder Ideen? Schreib an ${mail()}. Wir antworten so schnell wie möglich.</p>
<h2>Wo sind meine Daten?</h2>
<p>Nur auf deinem Gerät. Es gibt kein Konto und keinen Server. Deshalb sieht auch niemand außer dir deine Listen.</p>
<h2>Wie sichere ich meine Daten oder nehme sie aufs neue Handy mit?</h2>
<p>Einstellungen → „Daten exportieren“ erzeugt eine Datei. Auf dem neuen Gerät: Einstellungen → „Daten importieren“ und die Datei wählen. Der Import ersetzt die Daten auf dem neuen Gerät.</p>
<h2>Die Erinnerungen kommen nicht.</h2>
<p>Prüfe in den Einstellungen der App, ob „Morgens erinnern“ an ist, und in den Systemeinstellungen deines Handys, ob die App Benachrichtigungen senden darf. Auf manchen Android-Geräten verzögern Energiesparfunktionen Erinnerungen; nimm die App dort von der Akku-Optimierung aus. Öffne die App ab und zu, dann plant sie die Erinnerungen der nächsten Tage neu.</p>
<h2>Warum schaltet die App „Nicht stören“ nicht ein?</h2>
<p>Auf Android braucht die App dafür einmalig deine Erlaubnis: Meditation → „Nicht stören“ → „Zugriff erlauben“. Auf dem iPhone erlaubt Apple Apps das nicht; aktiviere dort vor der Meditation den Fokus „Nicht stören“ im Kontrollzentrum.</p>
<h2>Wie funktionieren XP und Level?</h2>
<p>Jedes erledigte To-do, jeder Unterpunkt, jeder Routinen-Eintrag und jede Minute Meditation bringt XP. Schwierige To-dos zählen mehr, erreichte Ziele geben Bonus-XP. Die genaue Tabelle steht in der App im Tab „Level“.</p>
<h2>Wie lösche ich alles?</h2>
<p>Einstellungen → „Alle Daten löschen“. Oder du deinstallierst die App.</p>
`;

/* ---------------- English ---------------- */

const privacy = `
<p class="muted">For the app “${esc(APP)}” (iOS, Android) and its web version.</p>
<h2>1. Controller</h2>
<p class="card">${address(true)}<br>Email: ${mail()}</p>
<h2>2. In short</h2>
<ul>
<li>The app works without an account. Your to-dos, routines, entries and settings are stored <strong>only on your device</strong>; in the web version, in your browser's storage.</li>
<li>We do not receive this content. There is no server of ours, no analytics or tracking tools and no advertising.</li>
<li>Reminders are scheduled on your device, without a push server.</li>
</ul>
<h2>3. Data on your device</h2>
<p>The app stores the titles and status of your to-dos and subtasks, your routines and entries, your meditations (date, length, breathing rhythm and, if you enter it, your mood afterwards) and your settings (optionally your first name, language, appearance, daily goal, reminder times). Its only purpose is to provide the app's features. This data does not leave your device unless you export it yourself.</p>
<p>You can delete everything in the app under Settings → “Delete all data”, by uninstalling the app or, for the web version, by clearing the site data in your browser.</p>
<h2>4. Reminders</h2>
<p>Reminders are only sent if you turn them on and allow notifications on your device. Their content is created on the device. You can turn them off at any time in the app or in your system settings.</p>
<h2>4a. Meditation and Do Not Disturb</h2>
<p>During a meditation the screen stays on, and the app keeps its own reminders out of the way. On Android devices the app can switch Do Not Disturb to "alarms only" for the length of the session and restore your previous mode afterwards. It only does this if you explicitly grant this access in your system settings, and you can revoke it there at any time. No data is transferred. On iPhone this is technically not possible; the app does not change your Focus settings there.</p>
<h2>5. Export and import</h2>
<p>Export creates a file with your data. Where you store it or whom you share it with is up to you; the terms of that service then apply.</p>
<h2>6. Download via the App Store and Google Play</h2>
<p>When you download the app, Apple or Google process data (such as your store account and download information) under their own responsibility. We have no influence on this. From the stores we receive aggregated statistics such as download numbers and ratings, and crash reports and usage statistics without direct personal reference if you agreed to share them with developers in your device settings. We use them to fix bugs and improve the app (Art. 6(1)(f) GDPR).</p>
<p>Store privacy notices: <a href="https://www.apple.com/legal/privacy/">Apple</a> · <a href="https://policies.google.com/privacy">Google</a></p>
<h2>7. Website and web version (GitHub Pages)</h2>
<p>These pages and the web version are hosted by GitHub, Inc., 88 Colin P Kelly Jr St, San Francisco, CA 94107, USA. When you visit them, GitHub processes technically necessary data such as your IP address, time of access, requested page and browser type to deliver and secure the pages (Art. 6(1)(f) GDPR). According to GitHub, it is certified under the EU-US Data Privacy Framework, on which the transfer to the USA is based (Art. 45 GDPR). See <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement">GitHub's privacy statement</a>.</p>
<p>The web version sets no cookies. It stores your content in your browser's local storage, which is technically required for it to work. Fonts ship with the app; no Google servers are contacted.</p>
<h2>8. Contact by email</h2>
<p>If you email us, we use your details only to handle your request (Art. 6(1)(b) or (f) GDPR) and delete them once they are no longer needed and no legal retention period applies.</p>
<h2>9. Your rights</h2>
<p>You have the right of access (Art. 15 GDPR), rectification (Art. 16), erasure (Art. 17), restriction of processing (Art. 18), data portability (Art. 20) and to object (Art. 21). You can also lodge a complaint with a data protection supervisory authority (Art. 77). Since your app content stays on your device, you can view, export and delete it there yourself.</p>
<h2>10. Changes</h2>
<p>If new features are added, for example an account with sync, advertising or in-app purchases, we will update this policy before they launch.</p>
`;

const terms = `
<p class="muted">Terms of use for the app “${esc(APP)}” (iOS, Android) and its web version. The German version is legally binding.</p>
<h2>1. Scope and provider</h2>
<p>These terms apply to the use of the app “${esc(APP)}” and its web version (together “app”). The provider is ${v(cfg.name)}, ${v(cfg.street)}, ${v(cfg.city)} (see <a href="imprint.html">imprint</a>).</p>
<h2>2. Service</h2>
<p>The app helps you organize to-dos and routines and rewards progress with experience points (XP), levels, streaks and badges. Points, levels and badges have no monetary value, cannot be transferred and cannot be paid out. The core features are free. The app is a self-organization tool; it does not replace medical, therapeutic or other professional advice, and no particular result is owed. The meditation feature is meant for relaxation and mindfulness, not as therapy. If you have health or mental health concerns, please talk to a doctor or therapist.</p>
<h2>3. Contract and download</h2>
<p>The contract of use is formed when you download the app or open and use the web version. Downloads are handled by the Apple App Store or Google Play, whose terms also apply. For apps obtained from the Apple App Store, Apple's standard Licensed Application End User License Agreement applies in addition.</p>
<h2>4. Right of use</h2>
<p>For the duration of the contract you receive a simple, non-transferable right to use the app for private purposes. Circumventing technical protection, redistributing the app or using it commercially without our consent is not permitted. Mandatory statutory rights remain unaffected.</p>
<h2>5. Paid extras</h2>
<p>There are currently no paid features. If optional paid extras are offered later (such as a one-time unlock or a subscription), the app and store show scope and price before purchase. Purchases and payment are handled exclusively by the Apple App Store or Google Play under their terms. Subscriptions renew automatically unless cancelled in the store's account settings at least 24 hours before the end of the period. Withdrawal and refunds are handled by the store under its terms and the law.</p>
<h2>6. Your data and backups</h2>
<p>Your content is stored only on your device; see the <a href="privacy.html">privacy policy</a>. You are responsible for backing up your data using the export feature. Without an export, your data is lost when you uninstall the app, switch devices or clear browser data.</p>
<h2>7. Availability and updates</h2>
<p>We keep developing the app and provide updates, especially for bug fixes and security. There is no right to specific new features or to uninterrupted availability of the web version. Statutory obligations remain unaffected.</p>
<h2>8. Liability</h2>
<p>We are fully liable for intent and gross negligence, for injury to life, body or health, under the German Product Liability Act and to the extent of any guarantee given. For slightly negligent breach of an essential contractual obligation, liability is limited to the foreseeable damage typical for the contract. Otherwise, liability for slight negligence is excluded. For loss of data we are only liable to the extent it would also have occurred with regular backups via the export feature.</p>
<h2>9. Term and termination</h2>
<p>You can stop using the app at any time by deleting it. Subscriptions are cancelled in the store's account settings.</p>
<h2>10. Changes to these terms</h2>
<p>We may change these terms for the future if there is a valid reason, such as new features or changes in the law. We will inform you in the app in good time about material changes. Paid services already purchased remain subject to the terms at the time of purchase.</p>
<h2>11. Final provisions</h2>
<p>German law applies, excluding the UN Convention on Contracts for the International Sale of Goods. If you are a consumer, the mandatory consumer protection rules of your country of habitual residence remain unaffected. We are neither willing nor obliged to take part in dispute resolution proceedings before a consumer arbitration board.</p>
`;

const imprint = `
<h2>Information according to § 5 DDG (German Digital Services Act)</h2>
<p class="card">${address(true)}</p>
<h2>Contact</h2>
<p>Email: ${mail()}<br>Phone: ${v(cfg.phone)}</p>
${cfg.vatId ? `<h2>VAT ID</h2><p>VAT identification number according to § 27a UStG: ${v(cfg.vatId)}</p>` : ''}
<h2>Consumer dispute resolution</h2>
<p>We are neither willing nor obliged to take part in dispute resolution proceedings before a consumer arbitration board.</p>
<h2>More legal texts</h2>
<p><a href="privacy.html">Privacy policy</a> · <a href="terms.html">Terms of use</a></p>
`;

const support = `
<p>Questions, bugs or ideas? Write to ${mail()}. We'll answer as soon as we can.</p>
<h2>Where is my data?</h2>
<p>Only on your device. There is no account and no server, so nobody but you sees your lists.</p>
<h2>How do I back up my data or move it to a new phone?</h2>
<p>Settings → “Export data” creates a file. On the new device: Settings → “Import data” and pick the file. Importing replaces the data on the new device.</p>
<h2>Reminders don't arrive.</h2>
<p>Check in the app's settings that “Morning reminder” is on, and in your phone's system settings that the app may send notifications. Some Android phones delay reminders to save battery; exclude the app from battery optimization there. Open the app now and then so it can plan the next days' reminders.</p>
<h2>Why doesn't the app turn on Do Not Disturb?</h2>
<p>On Android the app needs your permission once: Meditate → “Do not disturb” → “Allow access”. On iPhone, Apple doesn't allow apps to do this; turn on the Do Not Disturb focus in Control Center before you meditate.</p>
<h2>How do XP and levels work?</h2>
<p>Every finished to-do, subtask, routine check-in and minute of meditation earns XP. Hard to-dos count more, reached goals give bonus XP. The full table is in the app's “Level” tab.</p>
<h2>How do I delete everything?</h2>
<p>Settings → “Delete all data”, or uninstall the app.</p>
`;

const pages = [
  ['de', 'datenschutz', 'Datenschutzerklärung', datenschutz],
  ['de', 'agb', 'Nutzungsbedingungen (AGB)', agb],
  ['de', 'impressum', 'Impressum', impressum],
  ['de', 'hilfe', 'Hilfe und Kontakt', hilfe],
  ['en', 'privacy', 'Privacy policy', privacy],
  ['en', 'terms', 'Terms of use', terms],
  ['en', 'imprint', 'Imprint', imprint],
  ['en', 'support', 'Help and contact', support],
];

const outDir = join(root, 'public', 'legal');
mkdirSync(outDir, { recursive: true });
for (const [lang, slug, title, body] of pages) {
  writeFileSync(join(outDir, `${slug}.html`), page(lang, slug, title, body));
  console.log('wrote public/legal/' + slug + '.html');
}
const { _hinweis, ...fields } = cfg;
const open = JSON.stringify(fields).match(/\[[^\]]+\]/g);
if (open) console.log('\nNoch offene Platzhalter in legal.config.json:', [...new Set(open)].join(', '));
