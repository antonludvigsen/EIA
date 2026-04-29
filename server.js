
const express = require('express'); /* importerer Express-frameworket. */
const path = require('path'); /* importerer Node.js' indbyggede path-modul */

const adresseRoute = require('./routes/adresse'); /* importere adresse routeren i server.js */
const ejendomsprofilRoute = require('./routes/ejendomsprofil');

const app = express(); /* opretter selve Express-applikationen. app er objektet vi hænger alle routes og middleware på. */
const PORT = 3000; /* vi sætter porten til at være 3000, så når vi skal hoste kommer det på http://localhost:3000 */

app.use(express.json()); /*  */
app.use(express.static(path.join(__dirname, 'public'))); /* vi sætter den statiske visning til de ting der ligger i public-mappen */

/* routerens interne /søg bliver tilgængelig på /api/adresse/søg. 
Præfikset /api/ er konvention for at adskille API-endpoints fra HTML-sider. */
app.use('/api/adresse', adresseRoute);
app.use('/api/ejendomsprofil', ejendomsprofilRoute);

app.listen(PORT, () => {
    console.log(`EIA-server kører på http://localhost:${PORT}`);
});


/* TEST: af forbindelse til databasen når serveren startes
const { poolForbindelse } = require('./database/connection');

poolForbindelse
    .then(() => console.log('Furbundet til Azure SQL'))
    .catch(fejl => console.error('Databasefejl:', fejl));
*/