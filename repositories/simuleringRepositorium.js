/* simuleringRepositorium.js håndterer al direkte kommunikation med databasen for simuleringer.
Alle SQL-forespørgsler til tabellerne Simulering og SimuleringResultat er samlet her */

const { sql, poolForbindelse } = require('../database/connection');

class SimuleringRepositorium {

    /* gemmer en ny simulering og returnerer det auto-genererede simuleringID. simuleringID bruges efterfølgende af gemSimuleringResultat som fremmednøgle. */
    async gemSimulering(investeringscaseID, tidshorisont) {
        const pool = await poolForbindelse;
        const request = pool.request();
        request.input('investeringscaseID', sql.Int, investeringscaseID);
        request.input('tidshorisont', sql.Int, tidshorisont);
        const resultat = await request.query(`
            INSERT INTO Simulering (investeringscaseID, tidshorisont)
            OUTPUT INSERTED.simuleringID
            VALUES (@investeringscaseID, @tidshorisont)
        `);
        return resultat.recordset[0].simuleringID;
    }

    /* gemmer SimuleringResultat med alle fem tidsserier gemt som JSON-strenge.
    JSON.stringify bruges frem for at gemme tallene i separate kolonner, fordi arrays af variabel længde ikke passer naturligt ind i en relationel tabelstruktur. */
    async gemSimuleringResultat(simuleringID, simuleringResultat) {
        const pool = await poolForbindelse;
        const request = pool.request();
        request.input('simuleringID', sql.Int, simuleringID);
        request.input('egenkapitalOverTid', sql.NVarChar(sql.MAX), JSON.stringify(simuleringResultat.egenkapitalOverTid));
        request.input('cashflowOverTid', sql.NVarChar(sql.MAX), JSON.stringify(simuleringResultat.cashflowOverTid));
        request.input('gaeldOverTid', sql.NVarChar(sql.MAX), JSON.stringify(simuleringResultat.gaeldOverTid));
        request.input('aktiverOverTid', sql.NVarChar(sql.MAX), JSON.stringify(simuleringResultat.aktiverOverTid));
        request.input('likviditetsholdningOverTid', sql.NVarChar(sql.MAX), JSON.stringify(simuleringResultat.likviditetsholdningOverTid));
        await request.query(`
            INSERT INTO SimuleringResultat (simuleringID, egenkapitalOverTid, cashflowOverTid, gaeldOverTid, aktiverOverTid, likviditetsholdningOverTid)
            VALUES (@simuleringID, @egenkapitalOverTid, @cashflowOverTid, @gaeldOverTid, @aktiverOverTid, @likviditetsholdningOverTid)
        `);
    }

    /* henter det seneste SimuleringResultat for en given investeringscase.
    TOP 1 + ORDER BY genereretDato DESC sikrer at vi altid får det nyeste resultat.
    s.tidshorisont medtages så frontend kan genskabe den korrekte x-akse. */
    async hentSenesteSimulering(investeringscaseID) {
        const pool = await poolForbindelse;
        const request = pool.request();
        request.input('investeringscaseID', sql.Int, investeringscaseID);
        const resultat = await request.query(`
            SELECT TOP 1 sr.*, s.tidshorisont
            FROM SimuleringResultat sr
            JOIN Simulering s ON sr.simuleringID = s.simuleringID
            WHERE s.investeringscaseID = @investeringscaseID
            ORDER BY sr.genereretDato DESC
        `);
        return resultat.recordset[0] ?? null; /* null hvis ingen simulering er kørt for denne case */
    }
}

module.exports = new SimuleringRepositorium();
