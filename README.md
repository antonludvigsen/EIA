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

Opret en fil ved navn `.env` i projektets rod med følgende indhold:
