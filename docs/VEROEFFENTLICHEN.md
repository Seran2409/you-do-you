# Veröffentlichen von Windows aus

Für den ganzen Weg in App Store und Google Play brauchst du **keinen Mac**. Gebaut wird in der Cloud (EAS Build), hochgeladen per Befehl (EAS Submit), der Rest läuft im Browser (App Store Connect, Play Console).

Die App ist dafür vorbereitet: `app.json` (Bundle-ID, Berechtigungen, Datenschutz-Manifest, Export-Compliance), `eas.json` (Build-Profile), Icons, Splash, Store-Texte, Screenshots und Rechtstexte liegen bereit.

## 0. Einmalig vorbereiten (ca. 30 Minuten)

1. **Projekt aus OneDrive holen.** OneDrive legt `node_modules` als Cloud-Platzhalter ab, daran scheitert der lokale Bundler. Verschiebe den Ordner nach z. B. `C:\Users\seran\code\you-do-you` und führe dort einmal `npm ci` aus.
2. **Deine Angaben eintragen** in `legal.config.json` (Name, Anschrift, E-Mail, Telefon), dann:
   ```bash
   npm run legal
   ```
   Tipp: Lege dir eine eigene Support-Adresse an, z. B. bei GMX. Wenn du deine Wohnadresse nicht veröffentlichen willst, gibt es Impressums-Adressdienste (c/o-Anschrift) für wenige Euro im Monat.
3. **Pushen**, damit Datenschutz-, AGB-, Impressums- und Hilfeseite online sind. Die Stores prüfen diese Links.

## 1. Konten anlegen

| Konto | Kosten | Wofür |
|---|---|---|
| [Expo](https://expo.dev/signup) | kostenlos (15 iOS- + 15 Android-Builds/Monat) | Cloud-Builds, Upload |
| [Apple Developer Program](https://developer.apple.com/programs/enroll/) | 99 € pro Jahr | App Store, TestFlight |
| [Google Play Console](https://play.google.com/console/signup) | 25 $ einmalig | Google Play |

- **Apple**: Als Einzelperson anmelden (keine D-U-N-S-Nummer nötig). Am einfachsten über die App „Apple Developer“ auf dem iPhone. Deine Apple-ID braucht Zwei-Faktor-Authentifizierung. Die Freischaltung kann ein bis zwei Tage dauern.
- **Google**: Privates Konto, Identitätsprüfung mit Ausweis. **Wichtig:** Neue private Konten müssen vor der Veröffentlichung einen **geschlossenen Test mit mindestens 12 Testern über 14 Tage** durchführen (siehe Abschnitt 4). Organisationskonten sind davon ausgenommen, brauchen aber ein Unternehmen mit D-U-N-S-Nummer.

## 2. EAS einrichten (einmalig)

```bash
npm install -g eas-cli
```

```bash
eas login
```

```bash
eas init
```

`eas init` verknüpft das Projekt mit deinem Expo-Konto und trägt eine `projectId` in `app.json` ein. Diese Änderung committen.

## 3. iOS: bauen, hochladen, TestFlight

```bash
eas build --platform ios --profile production
```

- EAS fragt nach deiner Apple-ID und legt Zertifikat und Provisioning-Profil **automatisch** an. Das funktioniert unter Windows. Antworte bei „Generate a new Apple Distribution Certificate?“ und „Generate a new Provisioning Profile?“ jeweils mit **Yes**.
- Der Build dauert in der kostenlosen Warteschlange meist 15 bis 45 Minuten.

```bash
eas submit --platform ios --latest
```

- Legt den App-Eintrag in App Store Connect an, falls er noch fehlt, und lädt den Build hoch.
- Nach etwa 10 bis 30 Minuten Verarbeitung erscheint der Build unter **TestFlight**. Füge dich als internen Tester hinzu, installiere die App „TestFlight“ auf dem iPhone und teste.

**In [App Store Connect](https://appstoreconnect.apple.com) ausfüllen** (Texte aus [store/STORE-TEXTE.md](store/STORE-TEXTE.md)):
1. App-Informationen: Name, Untertitel, Kategorie Produktivität, Datenschutz-URL.
2. Preise und Verfügbarkeit: Kostenlos, alle Länder.
3. App-Datenschutz: **Keine Daten erfasst**.
4. Altersfreigabe-Fragebogen: überall „Nein“ → 4+.
5. Version 1.0: Screenshots (`docs/store/screenshots/ios/de` für Deutsch, `…/en` für Englisch), Beschreibung, Schlüsselwörter, Support-URL, Werbetext, Build auswählen.
6. **Händlerstatus (EU, Digital Services Act)**: Für eine kostenlose App ohne Werbung und Käufe bist du kein Händler. Sobald du Geld verdienst (Werbung oder Käufe), musst du dich als Händler eintragen; dann zeigt Apple deine Adresse, Telefonnummer und E-Mail in der EU öffentlich an.
7. „Zur Prüfung einreichen“. Die Prüfung dauert meist ein bis zwei Tage. Hinweise für die Prüfer stehen in den Store-Texten.

## 4. Android: bauen, testen, veröffentlichen

Zum Ausprobieren auf deinem Android-Handy ohne Store:

```bash
eas build --platform android --profile preview
```

Den Link zur APK öffnest du auf dem Handy und installierst die App direkt.

Für den Store:

```bash
eas build --platform android --profile production
```

**Erster Upload**: Lade die `.aab`-Datei aus dem Build einmal **von Hand** in der [Play Console](https://play.google.com/console) unter Testen → Interner Test hoch. Danach klappen spätere Uploads automatisch mit `eas submit --platform android` (dafür in der Play Console ein Dienstkonto anlegen und dessen JSON-Schlüssel bei `eas submit` angeben).

**In der Play Console ausfüllen**:
1. App erstellen: Name, Standardsprache Deutsch, App (nicht Spiel), kostenlos.
2. Store-Eintrag: Kurz- und Langbeschreibung, Icon (`public/icons/icon-512.png`), Feature-Grafik (`docs/store/feature-graphic-de.png`), Screenshots (`docs/store/screenshots/android/de`). Englisch als Übersetzung hinzufügen.
3. App-Inhalte: Datenschutzerklärung (URL), Werbung „Nein“, App-Zugriff „Alle Funktionen ohne Einschränkung verfügbar“, Einstufung (Fragebogen), Zielgruppe ab 13 Jahren, Datensicherheit „Keine Daten erhoben oder geteilt“.
4. **Geschlossener Test**: Erstelle einen geschlossenen Test, lade 12 oder mehr Personen per E-Mail-Liste ein (Familie, Freunde, Arbeit, eine Tester-Community) und lass sie die App 14 Tage lang installiert behalten und ab und zu öffnen. Danach beantragst du in der Play Console den Produktionszugang.
5. Produktion: Release aus dem Test übernehmen, „Zur Prüfung senden“.

## 5. Updates

1. Version in `app.json` erhöhen (z. B. `1.0.1`). Die Build-Nummern zählt EAS automatisch hoch.
2. Bauen und hochladen:
   ```bash
   eas build --platform all --profile production --auto-submit
   ```
3. In App Store Connect und Play Console die neue Version mit „Neu in dieser Version“ einreichen.

## „Nicht stören“ auf Android testen

Die Funktion braucht echten Android-Code und läuft nicht in Expo Go:

1. `eas build --platform android --profile preview` bauen und die APK installieren.
2. In der App: Meditation → „Nicht stören“ an → „Zugriff erlauben“ → in der Liste „You Do You“ erlauben.
3. Meditation mit 1 Minute starten, Statusleiste prüfen (Symbol „Bitte nicht stören“), nach dem Gong muss der vorherige Modus zurück sein.

Falls der Android-Build an `modules/dnd-control` scheitert, schick mir die Fehlermeldung aus dem EAS-Log. Das Modul ist der einzige eigene native Code.

## Häufige Stolperfallen

- **Apple lehnt ab wegen „Minimum Functionality“ (4.2)**: Unwahrscheinlich, weil die App eigenständig funktioniert. Falls doch, in der Antwort auf Erinnerungen, Abzeichen und den Offline-Betrieb hinweisen.
- **Platzhalter in den Rechtstexten**: Die Seiten markieren offene Platzhalter gelb. Vor dem Einreichen `npm run legal` ausführen und prüfen, dass nichts Gelbes mehr da ist.
- **Bundle-ID**: `de.seran.youdoyou` ist nach der ersten Veröffentlichung fest. Wenn du sie ändern willst, dann jetzt in `app.json`.
- **Expo Go**: Für einen schnellen Blick auf dem Handy reicht `npx expo start` und die App Expo Go. Erinnerungen und der echte App-Name gibt es aber nur im Build (Preview, TestFlight).
