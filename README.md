# Jeopardy

Eigenes Jeopardy-Quiz im Browser: Kategorien, Fragen und Antworten selbst anlegen, optional mit Bildern, Videos oder Musik, und mit mehreren Spielern spielen.

**Direkt spielen:** https://demuhb.github.io/jeopardy/

## Funktionen

- Beliebig viele Kategorien und Fragen pro Kategorie (je 1–10), Punktwerte frei einstellbar (auch pro Frage)
- Frage und Antwort jeweils mit Text und optional Bild, Video oder Audio
- Mehrere Spieler, Startspieler wird ausgelost (Namen wechseln schnell und bleiben bei einem stehen), danach wird reihum gewählt
- Option: Wer die Frage gewählt hat, bekommt bei richtiger Antwort die doppelte Punktzahl
- Alle raten mit – nach dem Aufdecken werden alle angeklickt, die richtig lagen
- Punkte per Klick korrigierbar, letzte Frage rückgängig machbar
- Laufende Spiele werden gespeichert und können fortgesetzt werden

## Spiele auf einen anderen PC bringen

Spiele werden im Browser gespeichert (IndexedDB). Auf der Startseite **Exportieren** wählen – das erzeugt eine `.zip`-Datei mit allen Fragen und Medien. Auf dem anderen PC die Seite öffnen und **Spiel importieren** klicken.

## Entwicklung

```bash
npm install
npm run dev     # lokaler Server
npm test        # Tests
npm run build   # Produktions-Build nach dist/
```

Jeder Push auf `main` wird per GitHub Actions automatisch auf GitHub Pages veröffentlicht.
