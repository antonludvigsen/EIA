/* server.js er applikationens indgangspunkt og det eneste sted, hvor Express-applikationen oprettes og konfigureres. */

const express = require('express');
const path = require('path');

/* De fire route-moduler importeres her og monteres nedenfor. Hvert modul samler alle endpoints for sit ansvarsområde, så server.js ikke fyldes med individuelle routes. */
const adresseRoute = require('./routes/adresse');
const ejendomsprofilRoute = require('./routes/ejendomsprofil');
const investeringscaseRoute = require('./routes/investeringscase');
const simuleringRoute = require('./routes/simulering');

const app = express();
const PORT = 2026; /* porten 2026 bruges */

app.use(express.json()); /* gør at Express automatisk parser JSON-body i indkommende POST/PUT-kald og gør den tilgængelig som req.body */

/* gør alt indhold i /public-mappen tilgængeligt som statiske filer: HTML, CSS og klient-JS serveres herfra */
app.use(express.static(path.join(__dirname, 'public')));

/* Chart.js og andre npm-pakker importeres direkte i HTML via /node_modules/-stien.
Dette undgår et build-trin og holder opsætningen simpel for et skoleprojekt. */
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

/* Præfikset /api/ er konvention for at adskille API-endpoints fra HTML-sider.
Hvert route-modul håndterer sin del af URL-hierarkiet selvstændigt. */
app.use('/api/adresse', adresseRoute);
app.use('/api/ejendomsprofil', ejendomsprofilRoute);
app.use('/api/investeringscase', investeringscaseRoute);
app.use('/api/simulering', simuleringRoute);

/* starter serveren og bekræfter i konsollen, at den kører korrekt */
app.listen(PORT, () => {
   console.log(`EIA-server kører på http://localhost:${PORT}`);
});
