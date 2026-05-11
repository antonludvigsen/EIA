/* connection.js er den eneste fil i projektet der må kende til databasekonfigurationen.

Den opretter en delt connection pool til Azure SQL via mssql-pakken og eksporterer den som et løst promise (poolForbindelse), som alle repositories awaiter inden de laver forespørgsler. 

Ved at samle forbindelseslogikken et sted undgår vi at konfigurationen gentages i hvert repositorium. */

const sql = require('mssql');
require('dotenv').config(); /* indlæser .env-filen så process.env.DB_SERVER. Uden denne linje ville alle process.env-værdier være undefined. */

/* forbindelseskonfigurationen læses fra .env i stedet for at hardkodes direkte, så adgangskoden aldrig havner i kildekoden og ikke følger med i et git-commit */
const konfiguration = {
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT), /* DB_PORT er en streng i .env, konverteres den som "parseInt" til et tal som mssql forventer */
    options: {
        encrypt: true, /* er et krav fra Azure SQL. Alle forbindelser til Azure skal krypteres via TLS */
        trustServerCertificate: false /* vi stoler kun på certifikater signeret af en anerkendt CA, som er vigtigt i produktion */
    }
};

/* ConnectionPool genbruger en fysisk TCP-forbindelse på tværs af alle samtidige forespørgsler i stedet for at åbne og lukke en ny forbindelse for hvert databasekald. Det er afgørende for ydeevnen i en Node.js-applikation */
const pool = new sql.ConnectionPool(konfiguration);

/* pool.connect() er asynkront og returnerer et promise. Vi gemmer dette promise i poolForbindelse frem for at awaite det her, fordi applikationen på dette tidspunkt ikke er klar til at tage imod forespørgsler endnu. Repositorierne awaiter i stedet poolForbindelse øverst i hver metode, hvilket er det der garantere at forbindelsen er klar inden de første HTTP-kald ankommer. */
const poolForbindelse = pool.connect().then(async (pool) => {

    /* sikrer at den hardcodede standardbruger (brugerID = 1) altid eksisterer i databasen. Alle handlinger knyttes til en fast bruger. IF NOT EXISTS forhindrer en fejl ved gentagne opstart af serveren. */
    await pool.request().query(`
        IF NOT EXISTS (
            SELECT 1 
            FROM Bruger 
            WHERE brugerID = 1
        )

        INSERT INTO Bruger (navn) 
        VALUES ('EIA Bruger')
    `);
    return pool;
});

/* sql eksporteres så repositories kan bruge sql.Int, sql.NVarChar, sql.Float osv. */
module.exports = {
    sql, poolForbindelse
};
