# Entscheidungsnotiz: Technik (Phase 0, freigegeben am 26.10.2026)

> „You Do You“ ist eine zweite, warme Version der App „Haven't Done It Yet!“ (früher „Don't Fall for Traps“), entstanden am 27.10.2026 als Kopie mit Meditation als dritter Funktion. Die Technik-Entscheidung gilt für beide.

## Entscheidung

**Expo (React Native) + TypeScript + Expo Router**, im Web über react-native-web. Eine Codebasis für Web, Android und iOS.

| Anforderung | Lösung | Web / iOS / Android |
|---|---|---|
| Konfetti, Level-Up, Toasts | react-native-reanimated, „Bewegung reduzieren“ wird respektiert | ✅ / ✅ / ✅ |
| Heatmap, Tagesziel-Ring, Sonnen-Emblem, Logo | react-native-svg | ✅ / ✅ / ✅ |
| Schriften (Fraunces, Nunito) | @expo-google-fonts | ✅ / ✅ / ✅ |
| Meditation: Gong, Bildschirm bleibt an | expo-audio, expo-keep-awake | ✅ / ✅ / ✅ |
| „Nicht stören“ während der Meditation | eigenes kleines Expo-Modul (`modules/dnd-control`, Kotlin) | – / Hinweis / ✅ (mit Erlaubnis) |
| Glas-Effekt in Tab- und Kopfleiste | expo-blur | ✅ / ✅ / deckende Fläche (Unschärfe auf Android experimentell) |
| Offline, lokale Daten | gemeinsame Schnittstelle `LocalStore`: Web IndexedDB, Apps expo-sqlite | ✅ / ✅ / ✅ |
| Benachrichtigungen | expo-notifications (Phase 3) | – / ✅ / ✅ |

Im Web ist IndexedDB nötig, weil expo-sqlite dort COOP/COEP-Header braucht, die GitHub Pages nicht setzen kann.

## Alternative

Vite-Web-App + Capacitor: HTML/CSS des Prototyps fast 1:1 übernehmbar, Phase 1 schneller. Dafür wären die Apps Webseiten in einer Hülle, mit weniger nativem Gefühl und mehr Handarbeit bei Haptik und Push. Weil die Apps das Hauptziel sind, fiel die Wahl auf Expo.

## Konten und Kosten

| Phase | Was | Kosten |
|---|---|---|
| 1 | GitHub, GitHub CLI (`gh auth login`) | kostenlos |
| 2 | Supabase, Resend | kostenlos |
| 3 | Expo (EAS Build) | kostenlos (begrenzte Cloud-Builds) |
| 3 | Firebase-Projekt für Push auf Android (FCM) | kostenlos |
| 3 | Apple Developer Program | 99 €/Jahr |
| 4 | Google-Play-Entwicklerkonto | 25 $ einmalig |

## Hinweise

- Expo Go auf Android unterstützt keine Push-Benachrichtigungen mehr; dafür braucht es einen Development Build.
- Morgen-Mail: `pg_cron` alle 15 Minuten, verschickt an Nutzer, deren lokale Uhrzeit erreicht ist; eine Tabelle merkt sich, was schon verschickt wurde. Zusätzlich ein täglicher Ping per GitHub Action gegen das Pausieren kostenloser Supabase-Projekte.
- Resend-Testabsender schickt nur an die eigene Konto-Adresse.
- Google-Play-Regel für neue private Konten (geschlossener Test mit Testern über 14 Tage) vor Phase 4 erneut prüfen.

## Erkenntnisse aus Phase 1

- Expo SDK 58: Eine eigene `src/app/+html.tsx` muss `useServerDocumentContext()` verwenden und `headNodes`/`bodyNodes` selbst einsetzen, sonst fehlen im statischen Export Skripte und Styles.
- react-native-web 0.21 wertet `accessibilityState`/`accessibilityValue` nicht mehr aus; deshalb nutzt der Code `aria-checked`, `aria-selected`, `aria-expanded`, `aria-valuenow` (funktioniert auch nativ).
- Der statische Export wird ohne Kenntnis des Geräte-Themes vorgerendert. Bis die App im Browser läuft, zeigt sie deshalb eine neutrale Hülle; sonst bliebe der Hintergrund im Dunkelmodus hell.
- `react-native-worklets` muss als eigene Abhängigkeit installiert sein (Peer-Dependency von Reanimated 4), sonst stürzt die App in nativen Builds ab. `npx expo-doctor` findet das.
- Erinnerungen sind einmalige lokale Benachrichtigungen ohne exakten Wecker; so braucht Android keine Sonderberechtigung (`SCHEDULE_EXACT_ALARM` ist bewusst blockiert).

## Erkenntnisse „You Do You“

- iOS erlaubt Apps nicht, den Fokus „Nicht stören“ zu schalten. Android erlaubt es mit der Berechtigung `ACCESS_NOTIFICATION_POLICY`, die der Nutzer einmalig in den Systemeinstellungen freigibt. Die App schaltet während der Sitzung auf „nur Wecker“ und stellt den vorherigen Modus wieder her, auch nach einem Absturz beim nächsten Start.
- Das native Modul ist bewusst minimal und folgt dem Aufbau von `expo-keep-awake`. Es wurde hier nicht kompiliert; der erste Android-Build (Preview) prüft es. Schlägt er fehl, ist `modules/dnd-control` der einzige neue native Code.
- Beide Apps laufen unter derselben GitHub-Pages-Domain; „You Do You“ nutzt deshalb eine eigene Browser-Datenbank (`youdoyou`).
