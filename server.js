/* server.js er applikationens indgangspunkt. Den opretter Express-applikationen, registrerer middleware
   og monterer de tre route-moduler under /api/-præfikset. Al forretningslogik, databasekommunikation
   og eksterne API-kald håndteres i de respektive controllers, repositories og services. */

const express = require('express'); /* importerer Express-frameworket. */
const path = require('path'); /* importerer Node.js' indbyggede path-modul */

const adresseRoute = require('./routes/adresse'); /* importere adresse routeren i server.js */
const ejendomsprofilRoute = require('./routes/ejendomsprofil'); /* routes for gem, vis, opdater og slet på ejendomsprofiler */
const investeringscaseRoute = require('./routes/investeringscase'); /* routes for opret, hent, opdater og slet på investeringscases */

const app = express(); /* opretter selve Express-applikationen. app er objektet vi hænger alle routes og middleware på. */
const PORT = 2026; /* vi sætter porten til at være 2026, så når vi skal hoste kommer det på http://localhost:2026 */

app.use(express.json()); /* gør at Express automatisk parser JSON-body i indkommende POST/PUT-kald og gør den tilgængelig som req.body */
app.use(express.static(path.join(__dirname, 'public'))); /* vi sætter den statiske visning til de ting der ligger i public-mappen */
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules'))); /* gør node_modules tilgængeligt som en statisk mappe i Express. */

/* routerens interne /søg bliver tilgængelig på /api/adresse/søg. 
Præfikset /api/ er konvention for at adskille API-endpoints fra HTML-sider. */
app.use('/api/adresse', adresseRoute);
app.use('/api/ejendomsprofil', ejendomsprofilRoute);
app.use('/api/investeringscase', investeringscaseRoute);

app.listen(PORT, () => {
    console.log(`EIA-server kører på http://localhost:${PORT}`);
});


/* TEST: af forbindelse til databasen når serveren startes
const { poolForbindelse } = require('./database/connection');

poolForbindelse
    .then(() => console.log('Furbundet til Azure SQL'))
    .catch(fejl => console.error('Databasefejl:', fejl));
*/