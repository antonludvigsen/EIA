/* Denne fil bruges til at oprette forbindelsen og eksportere til Azure SQL via mssql-pakken.
Som beskrevet før er dette den eneste fil i projektet der må kende til databasen.
Alle repositorier importerer denne forbindelse frem for at oprette deres egen. */

const sql = require('mssql');
require('dotenv').config(); /* indlæser .env-filen så process.env.DB_SERVER og de øvrige variabler er tilgængelige. Uden denne linje ville alle process.env-værdier være undefined. */

const konfiguration = {
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT),
    options: {
        encrypt: true, /* er et krav fra Azure SQL. Alle forbindelser til Azure skal krypteres via TLS */
        trustServerCertificate: false /* sikkerhedskrav til produktion */
    }
}; /* samler alle forbindelsesoplysninger. Vi læser dem fra .env i stedet for at hardkode dem direkte, så passwordet aldrig havner i kildekoden. */

const pool = new sql.ConnectionPool(konfiguration); /* opretter en delt connection pool som alle repositorier genbruger (gør databaseforbindelse i Node.js mere effektiv) */

/* sikrer at den hardcodede standardbruger (brugerID = 1) eksisterer i databasen */
const poolForbindelse = pool.connect().then(async (pool) => {
    await pool.request().query(`
        IF NOT EXISTS (SELECT 1 FROM Bruger WHERE brugerID = 1)
            INSERT INTO Bruger (navn) VALUES ('EIA Bruger')
    `);
    return pool;
});

module.exports = {
    sql, poolForbindelse
};
