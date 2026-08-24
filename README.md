# CoreSetup Studio - Premium Website (Gold/Black, interaktive 3D-Weltkugel)

Vierter Design-Durchlauf für coresetup.studio: eine komplett neue Version
auf Basis der xAI-inspirierten Gold/Schwarz-Sprache aus dem letzten
Durchlauf, aber mit einer echten, mit der Maus/per Touch drehbaren
3D-Weltkugel (Kontinente + Städte-Hubs, keine abstrakte Punktwolke mehr),
einem asymmetrischen Bento-Grid für die Leistungen, einer entzerrten
Preis-Sektion und einer Logo-Marquee für den Tech-Stack. Positioniert als
Website, für die ein Kunde fünfstellig zahlt, weil sie sichtbar keine
Vergleichbarkeit zum Wettbewerb zulässt.

Reines HTML/CSS/JS ohne Build-Schritt, keine Frameworks.

## Design-Read

Redesign-Overhaul auf Basis der bestehenden Gold/Schwarz-Version:
gleiche visuelle Grammatik (Near-Black-Canvas, Pill-Buttons, Mono-
Eyebrows, negativ getrackte Display-Typografie), aber jede Sektion neu
gedacht, um Wiederholung zu vermeiden und das Signature-Element - die
Weltkugel - so weit auszubauen, dass sie tatsächlich wie ein Kartenmaterial
aussieht statt wie ein generisches Netzwerk-Diagramm.

Dial-Werte: `DESIGN_VARIANCE: 9`, `MOTION_INTENSITY: 8` (Drag-Interaktion
mit Trägheit auf der Weltkugel, Marquee, Reveal-on-Scroll),
`VISUAL_DENSITY: 3` (weiterhin viel Schwarzraum trotz Bento-Grid, keine
Kachel-Überladung).

### Warum der Stack vanilla HTML/CSS/JS geblieben ist

Für diesen Durchlauf wurden zusätzlich `/animate`, `/ui-ux-pro-max` und
`/shadcn-ui-blocks` herangezogen. Alle drei sind für React-/Next.js-/
Tailwind-Projekte geschrieben (Motion-Komponenten, shadcn-Komponenten-
Quellcode, RSC-Konventionen). Der ursprüngliche Auftrag ist jedoch eine
statische, ohne Build-Schritt direkt auf GitHub Pages hochladbare Website
- ein Wechsel auf React/Next.js hätte diese Grundanforderung gebrochen.
Die Skills wurden deshalb **konzeptionell** angewendet statt wörtlich:

- `/animate`: die Timing-/Easing-Tabelle (Enter 200-300ms ease-out, Exit
  150-200ms ease-in, Hover 150ms) und die goldene Regel "nur `transform`
  und `opacity` animieren" wurden 1:1 in natives CSS übersetzt, inklusive
  der empfohlenen `--ease-out-quint`-Custom-Property.
- `/ui-ux-pro-max` und `/shadcn-ui-blocks`: die dahinterliegenden Layout-
  und Komponten-Prinzipien (klare Sektions-Hierarchie, konsistente
  Bausteine, kein Wildwuchs an Card-Varianten) wurden übernommen, die
  Komponenten selbst als natives HTML/CSS nachgebaut statt als
  shadcn-Quellcode kopiert, da kein npm/React-Unterbau existiert.

## Woher die Tokens kommen

Farb-, Radius- und Formsystem sind gegenüber der letzten Version
unverändert (weiterhin `xai-inspired-design-analysis` als strukturelle
Basis, Gold/Schwarz statt xAIs Weiß/Schwarz):

- **Gold-Akzent:** `#c9a961`, Hover-Stufe `#e8cd8a`, gedämpfte Stufe
  `#8a6d2f`.
- **Canvas:** `#0a0a0a`, Kartenflächen `#161513`, Nav-Bar nach Scroll
  `#1c1a15`.
- **Text:** Ink `#f5f3ee`, zwei gedämpfte Grautöne für Fließtext (siehe
  Kontrast-Check unten).
- **Typografie:** Inter 400 für Fließtext/Headlines, JetBrains Mono in
  Versalien für Eyebrows/Labels und für die Städte-Labels auf der
  Weltkugel.
- **Radien:** nur zwei Werte, `8px` für Karten/Inputs, `9999px` (Pill)
  für Buttons.
- **Schatten:** keine Standard-Schatten, nur ein zurückhaltender
  Gold-Glow auf dem primären Button-Hover und der hervorgehobenen
  "Business"-Preiskarte.

## Neu in diesem Durchlauf

- **Bento-Grid statt gleichförmiger Karten** im Leistungen-Bereich: eine
  große Kachel (2x2), drei reguläre Kacheln, eine goldene Callout-Kachel
  - bewusst asymmetrisch, keine drei gleich großen Spalten.
- **Entzerrte Preis-Sektion**: eine hervorgehobene "Business"-Karte
  (1,25fr) neben einem gestapelten Paar "Starter"/"Premium" (1fr) statt
  drei identischer Spalten.
- **Logo-Marquee** für den Tech-Stack: endlos scrollende, an den Rändern
  ausgeblendete Logo-Reihe, pausiert bei Hover und bei
  `prefers-reduced-motion`.
- **Hero-Textstapel auf vier Elemente begrenzt** (Eyebrow, Headline,
  Subtext, CTA-Paar), keine Trust-Mikroleiste mehr im Hero (die wandert
  in die separate Trust-Strip-Sektion darunter) - Headline garantiert
  zweizeilig statt per `<br>` erzwungen dreizeilig.

## Die 3D-Weltkugel im Hero

Wie beim letzten Mal ohne Three.js oder eine andere externe 3D-
Bibliothek, komplett handgeschrieben in `assets/js/main.js` auf der
nativen Canvas-2D-API - diesmal aber mit echter Geografie statt einer
abstrakten Punktwolke:

- Sechs Kontinent-Umrisse (Nord-/Südamerika, Europa, Afrika, Asien,
  Australien) sind als Polygone aus Längen-/Breitengrad-Stützpunkten im
  Skript hinterlegt.
- ~2.600 Kandidatenpunkte werden per Fibonacci-Sphere-Verteilung
  gleichmäßig auf der Kugel platziert, dann per Ray-Casting-Punkt-in-
  Polygon-Test gefiltert: nur Punkte, die auf einer Landmasse liegen,
  werden gezeichnet. Das ergibt die punktierten Kontinent-Silhouetten.
- Acht Städte (Berlin als Heimat-Hub, London, New York, Dubai,
  Singapur, Tokio, São Paulo, Sydney) sind als benannte Hubs hinterlegt,
  mit Label-Einblendung, sobald sie zur Vorderseite der Kugel rotieren.
- Von Berlin aus verlaufen gepulste Flugbahn-Bögen zu jedem anderen Hub,
  per sphärischer Interpolation (Slerp) entlang von Großkreisen, leicht
  über die Kugeloberfläche angehoben (Altitude-Bulge), plus einem
  Kometenschweif-Effekt am wandernden Lichtpunkt - der Look bekannter
  Flugrouten-Globen wie auf unitedcarriers.com, statt eines einzelnen
  blinkenden Punkts.
- Ein feines Breiten-/Längengrad-Gitter (Graticule) sowie ein weicher
  Atmosphären-Schimmer hinter der Kugel geben ihr sichtbares Volumen,
  statt einer frei schwebenden Punktwolke.
- Die Kugel ist per Pointer-Events (Maus **und** Touch) direkt greif-
  und drehbar, mit geschwindigkeitsbasierter Trägheit nach dem Loslassen
  und automatisch wieder einsetzender Ambient-Rotation nach einer
  Ruhephase.
- Reagiert auf `prefers-reduced-motion`: automatische Rotation und
  Trägheit werden deaktiviert, Drehen per Ziehen bleibt weiterhin aktiv,
  da es eine direkte Nutzerinteraktion und keine automatische Bewegung
  ist.

**Bugfix:** In der vorherigen Fassung war die Breitengrad-Achse
invertiert (Canvas-Y wächst nach unten, das wurde beim Projizieren
nicht ausgeglichen), wodurch die Erde auf dem Kopf stand, Nord- und
Südhalbkugel vertauscht. Behoben in `lngLatToXYZ()` in
`assets/js/main.js` durch Vorzeichenumkehr der Y-Komponente.

## Selbst gehostete Icons und Logos (keine Icon-CDN mehr)

Die vorherige Fassung band Phosphor Icons per `<script>`-Tag von
`unpkg.com` und die Technologie-Logos als `<img>` von
`cdn.simpleicons.org` ein. Bei der finalen QA dieses Durchlaufs fiel
auf, dass eines der verwendeten Icon-Klassennamen (`ph-server`) in
Phosphors Icon-Set gar nicht existiert und deshalb still leer geblieben
wäre - unabhängig vom CDN. Als Konsequenz wurden beide Abhängigkeiten
entfernt:

- **Phosphor Icons**: die sieben tatsächlich verwendeten Glyphen
  (`ph-code`, `ph-hard-drives`, `ph-shield-check`, `ph-gauge`,
  `ph-envelope-simple`, `ph-whatsapp-logo`, `ph-list`/`ph-x` für das
  mobile Menü) liegen als selbst gehostete Webfont-Dateien unter
  `assets/fonts/Phosphor.woff2` / `.woff`, eingebunden über
  `assets/css/phosphor.css`. Kein externes Script mehr nötig.
- **Tech-Stack-Logos** (WordPress, Webflow, Shopify, Cloudflare, Google
  Analytics, Stripe): als Inline-SVGs direkt in `index.html`
  eingebettet, eingefärbt über `currentColor`/CSS statt per CDN-
  Farbparameter.

Einzige verbleibende externe Abhängigkeit ist Google Fonts (Inter,
JetBrains Mono) - ein etablierter, sehr zuverlässiger Dienst, der schon
in der letzten Version bewusst nicht selbst gehostet wurde. Alles
andere lädt vollständig lokal.

## Wichtig: relative statt absolute Pfade

Ausschließlich **relative Pfade** (`assets/css/style.css`,
`favicon.svg`, `index.html#kontakt`, ...). Funktioniert überall: lokal
per Doppelklick auf `index.html`, auf GitHub Pages (Root oder Projekt-
Unterpfad), auf Netlify, Vercel oder jedem anderen Hoster, ohne
Anpassung. Per Playwright über das `file://`-Protokoll gegengetestet.

## Kontrast-Check (WCAG AA)

Alle Textfarben wurden rechnerisch gegen ihren jeweiligen Hintergrund
geprüft (relative Luminanz nach WCAG-Formel):

- `--body-mid` (Kartentext): `#918a78`, Kontrast 5,3:1 auf
  Kartenflächen, 5,8:1 auf Canvas.
- `--body-faint` (Fußnoten, Formular-Hinweistext): `#837c6c`, Kontrast
  4,8:1 auf Canvas.
- Goldene Haupttextfarbe (`#c9a961`) auf Canvas: 8,8:1.
- Dunkle Schrift (`--on-gold`) auf der goldenen "Business"-Preiskarte
  und der Bento-Callout-Kachel: 8,4:1 (Headlines) bzw. 4,9:1 (Fließtext
  bei 72% Deckkraft) auf dem Basis-Gold, noch höher auf der helleren
  Gold-Stufe.

Alle Werte liegen über dem AA-Minimum von 4,5:1 für Fließtext bzw.
3:1 für großformatigen Text.

## Ordnerstruktur

```
coresetup-studio/
├── index.html            One-Pager: Hero (3D-Weltkugel), Bento-
│                          Leistungen, Prozess, Projekte, Preise
│                          (asymmetrisch), Testimonial, Tech-Marquee,
│                          FAQ, Kontakt
├── impressum.html         Rechtliche Pflichtseite (Platzhalter-Angaben)
├── datenschutz.html       Datenschutzerklärung (Platzhalter-Angaben)
├── favicon.svg            Marken-Monogramm, Gold auf Schwarz
├── robots.txt              Suchmaschinen-Freigabe + Sitemap-Verweis
├── sitemap.xml             XML-Sitemap für SEO
├── README.md                diese Datei
└── assets/
    ├── css/
    │   ├── style.css       Gold/Schwarz-Tokens + alle Komponenten
    │   └── phosphor.css    Selbst gehostetes Icon-Subset (7 Glyphen)
    ├── fonts/
    │   ├── Phosphor.woff2   Icon-Webfont (self-hosted)
    │   └── Phosphor.woff
    ├── js/
    │   └── main.js         Nav-Scroll-Zustand, mobile Navigation,
    │                       IntersectionObserver-Reveal, 3D-Weltkugel
    │                       (Kontinente + Hubs + Drag/Trägheit),
    │                       Kontaktformular-Handling
    └── img/
        └── (aktuell leer, siehe "Bilder" unten)
```

## Bilder

Für den Projekte-Bereich sind aktuell Platzhalterbilder von
picsum.photos eingebunden. Vor dem Live-Gang bitte ersetzen durch:

- 4 echte Projekt-Screenshots im Bereich "Ausgewählte Arbeiten"
- Optional: ein Open-Graph-Bild unter `assets/img/og-cover.jpg`

## Vor dem Live-Gang noch zu erledigen

1. **Gold-Ton verifizieren:** Der Gold-Wert `#c9a961` ist eine
   sorgfältig abgestimmte Annahme, keine per Pixel-Messung von
   coresetup.studio übernommene exakte Markenfarbe (das Sandbox-
   Netzwerk, in dem diese Website gebaut wurde, konnte die Live-Seite
   nicht direkt für einen Farbabgleich laden). Bitte gegen das
   bestehende Logo-/Markenmaterial prüfen und bei Abweichung `--gold`
   in `assets/css/style.css` anpassen, alle anderen Gold-Stufen sind
   von diesem einen Wert abgeleitet.
2. **Impressum & Datenschutz:** alle mit `[Platzhalter]` markierten
   Angaben durch die echten Firmendaten ersetzen. Im Zweifel
   juristisch prüfen lassen.
3. **Kontaktformular:** ist aktuell nur clientseitig simuliert. An ein
   echtes Backend anbinden (z. B. Formspree, eigener Endpoint).
4. **Bilder:** Platzhalter aus `picsum.photos` durch echte Bilder
   ersetzen.
5. **WhatsApp-Link:** in `index.html` den Platzhalter-Link
   `https://wa.me/` durch die echte Nummer ergänzen
   (`https://wa.me/49XXXXXXXXXX`).

## Lokal ansehen

Einfach `index.html` direkt per Doppelklick öffnen, funktioniert dank
relativer Pfade auch ohne lokalen Server. Ein Server ist trotzdem
näher an der Produktionsumgebung:

```bash
npx serve .
# oder
python3 -m http.server 8000
```

## Deployment über GitHub Pages

1. Repo-Inhalt (diesen Ordner) in ein neues GitHub-Repository pushen.
2. In den Repo-Einstellungen unter "Pages" den Branch (z. B. `main`)
   und Root-Verzeichnis `/` als Quelle auswählen.
3. Nach ein bis zwei Minuten ist die Seite live, danach optional die
   eigene Domain `coresetup.studio` per CNAME verbinden.
