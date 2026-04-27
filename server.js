
const express = require('express'); /* importerer Express-frameworket. */
const path = require('path'); /* importerer Node.js' indbyggede path-modul */

const app = express(); /* opretter selve Express-applikationen. app er objektet vi hænger alle routes og middleware på. */
const PORT = 3000; /* vi sætter porten til at være 3000 */

app.use(express.json()); /*  */
app.use(express.static(path.join(__dirname, 'public'))); /* vi sætter den statiske visning til de ting der ligger i frontend-mappen */

app.listen(PORT, () => {
    console.log(`EIA-server kører på http://localhost:${PORT}`);
});

