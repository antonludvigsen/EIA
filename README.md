# EIA — Ejendoms Investerings Applikation

EIA er en fuld-stack webapplikation til analyse og simulering af danske ejendomsinvesteringer. Applikationen henter automatisk adresse- og bygningsdata fra offentlige danske API'er (DAWA, BBR og Dataforsyningen) og lader brugeren simulere investeringscases over en valgt tidshorisont. Resultaterne visualiseres som interaktive grafer og nøgletal.

Projektet er udviklet som eksamensaflevering på 2. semester af HA(it) på Copenhagen Business School, forår 2026.

## Teknologistak

- **Backend:** Node.js, Express
- **Database:** Azure SQL (mssql-pakken)
- **Frontend:** HTML, CSS, vanilla JavaScript (class-baseret)
- **Visualisering:** Chart.js
- **Test:** Jest
- **Eksterne API'er:** DAWA, BBR, Dataforsyningen (WMS)

## Forudsætninger

For at køre projektet lokalt kræves følgende:

- Node.js version 18 eller nyere
- npm (følger med Node.js)
- Adgang til Azure SQL-databasen (kontakt projektgruppen for credentials)
- En BBR-bruger oprettet hos Datafordeleren med tilhørende password
- En API-token til Dataforsyningens WMS-tjeneste

## Installation

### 1. Klon repositoriet

```bash
git clone https://github.com/antonludvigsen/EIA.git
cd EIA
```

### 2. Installer afhængigheder

```bash
npm install
```

### 3. Opret .env-fil

Opret en fil ved navn `.env` i projektets rod med følgende indhold: (SES I RAPPORTEN)

`.env`-filen er ekskluderet via `.gitignore` og må aldrig committes til repositoriet.

### 4. Initialiser databasen

Databasen opsættes ved at køre indholdet af `database/schema.sql` mod Azure SQL-instansen. Dette kan gøres via VS Code's SQL Server-udvidelse eller via Azure Data Studio. Scriptet opretter alle tabeller og indsætter den hardkodede standardbruger (brugerID = 1).

## Kørsel

Start serveren med:

```bash
node server.js
```

Serveren kører som standard på `http://localhost:2026`. Åbn denne URL i en browser for at tilgå applikationen.

## Test

Projektet indeholder tre unit test-filer placeret i `tests/`:

- `validerSøgeTekst.test.js` (3 tests)
- `beregnMaanedligYdelse.test.js` (3 tests)
- `simulering.test.js` (3 tests)

Kør alle tests med:

```bash
npm test
```

Eller kør en enkelt testfil med:

```bash
npx jest tests/simulering.test.js
```

## Funktionel afprøvning

Applikationens hovedfunktioner kan afprøves i følgende rækkefølge:

1. **Søg adresse:** På forsiden indtastes en dansk adresse i søgefeltet. DAWA's autocomplete foreslår matchende adresser undervejs.
2. **Opret ejendomsprofil:** Vælg en adresse fra dropdown. BBR-data og luftfoto vises automatisk. Tilføj en beskrivelse og gem profilen.
3. **Opret investeringscase:** Gå til "Min Portefølje", klik på den oprettede ejendomsprofil og vælg "Opret investeringscase". Udfyld den 5-trins formular med købsdetaljer, lånedetaljer, drift, renovering og udlejning.
4. **Simuler case:** Gå til "Simuler Case", vælg den oprettede investeringscase, angiv en tidshorisont (minimum 30 år) og klik "Simuler". Resultatet vises som et kombineret linjediagram og en nøgletalstabel.
5. **Sammenlign cases:** Gå til "Sammenlign Cases", vælg to eller flere investeringscases og angiv en tidshorisont. Resultaterne vises som fem separate grafer og en sammenligningstabel.

## Projektstruktur
