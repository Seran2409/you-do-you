# Geld verdienen mit „You Do You“

**Kurz:** Ja, Downloads allein bringen bei einer kostenlosen App kein Geld. Du brauchst eine Erlösquelle in der App. Für diese App passen zwei: eine **Pro-Version** (Haupteinnahme) und **freiwillige Video-Werbung** als Spielmechanik. Beides baust du am besten nicht zum Start ein, sondern 4 bis 8 Wochen danach.

> Keine Steuer- oder Rechtsberatung. Vor den ersten Einnahmen ein Gespräch mit Steuerberatung einplanen.

## Empfehlung

1. **Start (Version 1.0):** kostenlos, ohne Werbung, ohne Käufe. Das macht die Prüfung bei Apple und Google einfacher, bringt bessere erste Bewertungen und hält Datenschutz-Angaben bei „keine Daten“. Außerdem musst du als Nicht-Händler deine Adresse im App Store nicht veröffentlichen.
2. **Version 1.1 (nach 4 bis 8 Wochen):** Pro-Version mit Einmalkauf oder Jahresabo.
3. **Version 1.2:** „Streak retten“ per freiwilligem Werbevideo, für alle ohne Pro.

## 1. Pro-Version (Haupteinnahme)

Die Grundfunktionen bleiben kostenlos, sonst leiden Bewertungen und Downloads. Pro verkauft **Komfort, Schutz und Stil**:

| Pro-Funktion | Warum sie zieht |
|---|---|
| **Sync zwischen Geräten + Morgen-Mail** (Phase 2) | Echter Mehrwert, rechtfertigt die laufenden Kosten für den Server |
| **Streak-Schutz**: 2 automatische Freeze-Tage pro Monat | Passt perfekt zur Gamifizierung, Verlustangst motiviert |
| **Meditation Plus**: weitere Atemübungen, sanfte Hintergrundklänge (Regen, Wald, Meer), geführte Kurz-Meditationen | Passt perfekt zu „You Do You“, Meditation ist eine Kategorie mit hoher Zahlungsbereitschaft |
| **Designs**: weitere Farbwelten (Sonnenuntergang, Wald, Meer), alternative App-Icons | Geringer Aufwand, beliebt |
| **Statistik**: Heatmap über 12 Monate, Erfolge als Bild teilen | Teilen bringt zusätzlich Reichweite |
| **Keine Werbung** | Sobald es Werbung gibt |

**Preisvorschlag zum Testen:** Jahresabo 12,99 € mit 7 Tagen gratis, Monatsabo 1,99 €, alternativ einmalig 7,99 € für „Pro für immer“. Preise später mit Rabattaktionen testen.

**Technik:** In-App-Käufe laufen über Apple und Google. Zur Verwaltung empfehle ich [RevenueCat](https://www.revenuecat.com) mit `react-native-purchases`. RevenueCat ist kostenlos bis 2.500 $ Monatsumsatz, darüber kostet es 1 % des Umsatzes. Es übernimmt Abo-Status, Testphasen und Wiederherstellen von Käufen.

**Provision der Stores:** Mit dem Small Business Program von Apple (Antrag in App Store Connect) und bei Google auf die erste Million im Jahr behalten die Stores in der Regel 15 % statt 30 % ein. Google hat 2026 seine Gebühren umgestellt, prüfe die aktuellen Bedingungen in der Play Console. Apple und Google führen bei App-Käufen die Umsatzsteuer an die Kundenländer ab.

## 2. Werbung: unaufdringlich, aber nie versteckt

Wichtig vorab: Werbung muss als Werbung erkennbar sein. Das verlangen das Gesetz (§ 6 DDG, UWG) und die Richtlinien von Google AdMob. Versteckte oder irreführend platzierte Anzeigen, etwa direkt neben dem Abhaken-Knopf, führen zur Sperre deines AdMob-Kontos und zu Abmahnrisiken. „Unterschwellig“ heißt hier deshalb: **selten, freiwillig und passend zum Spiel**.

| Format | Wo | Empfehlung |
|---|---|---|
| **Belohnungsvideo „Streak retten“** | Wenn gestern nichts erledigt wurde: „Video ansehen und Streak behalten (1× pro Woche)“ | **Ja.** Freiwillig, nervt nicht, bringt am meisten pro Anzeige |
| **Belohnungsvideo „Doppelte XP für 30 Minuten“** | Knopf im Level-Tab | Optional |
| **Kleines Banner** | Nur ganz unten im Level-Tab, nie in To-dos oder Routinen | Höchstens, bringt wenig |
| Vollbild-Werbung zwischendurch | | **Nein.** Kostet Bewertungen und Nutzer |

**Was dafür nötig ist:**
- Konto bei [Google AdMob](https://admob.google.com), App dort anlegen, Anzeigenblöcke erstellen.
- Datei `app-ads.txt` im **Hauptverzeichnis** deiner Entwickler-Website. Die jetzige Seite liegt in einem Unterordner, deshalb: zusätzliches GitHub-Repo `seran2409.github.io` anlegen oder eine eigene Domain (wenige Euro im Jahr) nutzen und als Website in beiden Stores eintragen.
- Einwilligungsdialog in der EU (Google UMP, Pflicht für personalisierte Werbung) und auf dem iPhone die Tracking-Abfrage (App Tracking Transparency). Mit nur nicht-personalisierter Werbung entfällt die Tracking-Abfrage, die Erlöse sind dann aber geringer.
- Datenschutzerklärung, Apple-Datenschutzangaben und Googles „Datensicherheit“ anpassen. Die Texte habe ich dafür vorbereitet, Abschnitt „Änderungen“.
- Technisch: `react-native-google-mobile-ads` (hat ein Expo-Plugin, funktioniert in EAS-Builds, nicht in Expo Go und nicht im Web).

## 3. Rechenbeispiel (Annahmen, keine Marktdaten)

Damit du ein Gefühl für die Größenordnung bekommst. Alle Werte sind **angenommen** und schwanken in der Praxis stark.

| Annahme | Wert |
|---|---|
| Aktive Nutzer pro Monat | 1.000 |
| Anteil, der Pro kauft | 3 % |
| Preis Pro (Jahresabo) | 12,99 € |
| Store-Provision | 15 % |
| Streak-Videos pro Monat (Nicht-Pro-Nutzer) | 400 |
| Erlös je 1.000 Videos (angenommen) | 10 € |

- Pro: 30 Käufe × 12,99 € × 0,85 ≈ **330 € pro Jahr**
- Videos: 400 / 1.000 × 10 € ≈ **4 € pro Monat**, also rund 50 € im Jahr

**Fazit:** Bei kleinen Nutzerzahlen bringt Werbung fast nichts, die Pro-Version macht den Unterschied. Werbung lohnt sich erst bei vielen Tausend aktiven Nutzern. Darum zuerst Nutzer gewinnen (siehe [PROMOTION.md](PROMOTION.md)), dann Pro einführen.

## 4. Weitere Möglichkeiten

- **Trinkgeld-Kauf** („Kaffee spendieren“ für 2,99 €) als In-App-Kauf. Einfach umzusetzen, wenig Ertrag, aber sympathisch.
- **App kostenpflichtig machen**: Davon rate ich ab. Ein Preis vor dem Download senkt die Downloadzahlen stark, und ohne Bewertungen findet dich niemand.
- **Kooperationen** später, zum Beispiel mit Lern- oder Fitness-Marken für gesponserte Challenges, klar als Werbung gekennzeichnet.

## 5. Bevor das erste Geld fließt

1. **Gewerbe anmelden** beim Gewerbeamt deiner Stadt, danach beim Finanzamt über ELSTER den „Fragebogen zur steuerlichen Erfassung“ ausfüllen. Die Kleinunternehmerregelung (§ 19 UStG) ist möglich, solange der Umsatz im Vorjahr höchstens 25.000 € und im laufenden Jahr voraussichtlich höchstens 100.000 € beträgt.
2. **Apple:** in App Store Connect die Vereinbarung für kostenpflichtige Apps annehmen, Bank- und Steuerdaten eintragen, **Händlerstatus** setzen. Dann werden Name, Adresse, Telefon und E-Mail in der EU öffentlich angezeigt. Wenn du das vermeiden willst, nutze eine c/o-Geschäftsadresse.
3. **Google:** Zahlungsprofil anlegen und Händlerkonto verknüpfen.
4. **Rechtstexte aktualisieren:** Datenschutzerklärung um Werbung bzw. Käufe ergänzen. § 5 der AGB deckt Käufe und Abos bereits ab.

## 6. Umsetzungs-Reihenfolge im Code (wenn du so weit bist)

1. Spielmechanik „Streak-Schutz“ (Freeze-Tage) in `src/game` mit Tests.
2. Pro-Bildschirm mit RevenueCat, Pro-Status in den Einstellungen, „Käufe wiederherstellen“-Knopf (Apple-Pflicht).
3. Belohnungsvideo „Streak retten“ mit AdMob und Einwilligungsdialog, nur für Nicht-Pro-Nutzer.
4. Store-Angaben und Rechtstexte anpassen, neuer Build, neue Prüfung.

Sag Bescheid, dann baue ich die Schritte nacheinander ein.
