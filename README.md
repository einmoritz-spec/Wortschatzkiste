# Wortschatzkiste

Eine schlichte App zum Sammeln von besonderen Wörtern: Neologismen, Komposita, seltene oder veraltete Wörter, witzige Wörter und besondere Formen (z. B. *auserkoren / auserkiest*).

Reines HTML, CSS und JavaScript, ohne Build-Schritt und ohne Abhängigkeiten.

## Bedienung

- **Liste:** alle Wörter von A bis Z, mit Bedeutung in einer Zeile. Antippen öffnet die Details.
- **Suche:** das Feld oben durchsucht alles (Wort, Bedeutung, Beispiel, Tags, Notiz).
- **Filter:** klappt Kategorien, Tags, Sortierung und Favoriten auf. Standardmäßig eingeklappt.
- **Neues Wort (+):** nur Wort und Bedeutung sind sichtbar. Unter "Mehr Optionen" liegen Kategorie, andere Formen, Beispielsatz, Tags und Notiz.
- **Andere Formen:** mit Komma trennen, Hinweise in Klammern, z. B. `auserkiest (Nebenform), auserkoren`.
- **Details:** Favorit, Bearbeiten und Löschen finden sich in der Detailansicht eines Worts.
- **Menü (⋯):** Zufälliges Wort, Dunkelmodus, Sicherung herunterladen und laden, Alles löschen.
- Als App auf dem Handy installierbar, funktioniert offline.

## Auf GitHub Pages hosten

1. Auf GitHub ein neues Repository anlegen (z. B. `wortschatzkiste`).
2. Den **Inhalt** dieses Ordners hochladen (Add file → Upload files), nicht den Ordner selbst. `index.html` muss direkt im Hauptverzeichnis des Repos liegen.
3. Im Repository: **Settings → Pages**. Unter "Build and deployment" als Source **Deploy from a branch** wählen, Branch `main` und Ordner `/ (root)`, dann speichern.
4. Nach ein bis zwei Minuten ist die App erreichbar unter `https://DEINNAME.github.io/wortschatzkiste/`.

## Auf dem Handy installieren

- **iPhone (Safari):** Teilen-Symbol → "Zum Home-Bildschirm"
- **Android (Chrome):** Menü ⋮ → "App installieren" bzw. "Zum Startbildschirm hinzufügen"

## Wichtig zu den Daten

Die Wörter werden im Browser deines Geräts gespeichert (localStorage). Das heißt:

- Handy und Rechner haben getrennte Sammlungen. Zum Abgleichen: im Menü eine Sicherung herunterladen und auf dem anderen Gerät laden (bereits vorhandene Wörter werden nicht doppelt angelegt).
- Wenn du die Browserdaten löschst, sind die Wörter weg. Mach also ab und zu eine Sicherung.
- Auf dem iPhone kann Safari Daten von selten genutzten Webseiten löschen. Die Installation auf dem Home-Bildschirm und regelmäßige Sicherungen schützen davor.

## Updates einspielen

Wenn du Dateien änderst, erhöhe in `sw.js` die Zahl bei `CACHE` (z. B. `wortschatzkiste-v3`), damit installierte Apps die neue Version laden.
