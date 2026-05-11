/* ejendomsprofilRepositorium.js håndterer al direkte kommunikation med databasen for ejendomsprofiler. 

Alle SQL-forespørgsler til tabellerne: Ejendomsprofil, Adresse og Ejendomsdata er samlet her, så resten af applikationen aldrig behøver kende til databasestrukturen eller SQL-syntaks. */

/* poolForbindelse er den aktive databaseforbindelse. */
const { sql, poolForbindelse } = require('../database/connection');

class EjendomsprofilRepositorium {

    /* gemmer en ny ejendomsprofil i tre trin: adresse, ejendomsdata og selve profilen.
    Rækkefølgen er nødvendig fordi Ejendomsprofil refererer de to andre tabeller via fremmednøgler */
    async gemEjendomsprofil(navn, beskrivelse, adresseData, ejendomsData) {
        const pool = await poolForbindelse;

        /* 1. Indsæt adresse og hent det auto-genererede adresseID */
        const adresseRequest = pool.request();
        adresseRequest.input('vejnavn', sql.NVarChar(255), adresseData.vejnavn); /* sql.NVarChar bruges på alle tekstfelter så danske tegn (æøå) gemmes korrekt */
        adresseRequest.input('husnummer', sql.NVarChar(20), adresseData.husnummer);
        adresseRequest.input('etage', sql.NVarChar(20), adresseData.etage || null);
        adresseRequest.input('doer', sql.NVarChar(20), adresseData.doer  || null);
        adresseRequest.input('postnummer', sql.NVarChar(10), adresseData.postnummer);
        adresseRequest.input('bynavn', sql.NVarChar(255), adresseData.bynavn);
        const adresseResultat = await adresseRequest.query(`
            INSERT INTO Adresse (vejnavn, husnummer, etage, doer, postnummer, bynavn)
            OUTPUT INSERTED.adresseID
            VALUES (@vejnavn, @husnummer, @etage, @doer, @postnummer, @bynavn)
        `);
        const adresseID = adresseResultat.recordset[0].adresseID; /* OUTPUT INSERTED returnerer det nye ID direkte, så vi undgår et separat SELECT-kald */

        /* 2. Indsæt ejendomsdata og hent det auto-genererede ejendomsdataID */
        const ejendomsdataRequest = pool.request();
        ejendomsdataRequest.input('ejendomstype', sql.NVarChar(255), ejendomsData.ejendomstype);
        ejendomsdataRequest.input('byggeaar', sql.Int, ejendomsData.byggeår);
        ejendomsdataRequest.input('boligareal', sql.Float, ejendomsData.boligareal);
        ejendomsdataRequest.input('antalVaerelser', sql.Int, ejendomsData.antalVærelser);
        ejendomsdataRequest.input('grundareal', sql.Float, ejendomsData.grundareal);
        const ejendomsdataResultat = await ejendomsdataRequest.query(`
            INSERT INTO Ejendomsdata (ejendomstype, byggeaar, boligareal, antalVaerelser, grundareal)
            OUTPUT INSERTED.ejendomsdataID
            VALUES (@ejendomstype, @byggeaar, @boligareal, @antalVaerelser, @grundareal)
        `);
        const ejendomsdataID = ejendomsdataResultat.recordset[0].ejendomsdataID;

        /* 3. Indsæt selve ejendomsprofilen med de to fremmednøgler */
        const profilRequest = pool.request();
        profilRequest.input('navn', sql.NVarChar(255), navn);
        profilRequest.input('beskrivelse', sql.NVarChar(sql.MAX), beskrivelse);
        profilRequest.input('brugerID', sql.Int, 1); /* brugerID er hardkodet til 1: applikationen har ingen autentificering */
        profilRequest.input('adresseID', sql.Int, adresseID);
        profilRequest.input('ejendomsdataID', sql.Int, ejendomsdataID);
        await profilRequest.query(`
            INSERT INTO Ejendomsprofil (navn, beskrivelse, brugerID, adresseID, ejendomsdataID)
            VALUES (@navn, @beskrivelse, @brugerID, @adresseID, @ejendomsdataID)
        `);
    }

    /* opdaterer beskrivelsen på en eksisterende ejendomsprofil. 
    Kun beskrivelse kan ændres. navn er afledt fra adressen ved oprettelse og gemmes uforanderligt i databasen. */
    async opdaterEjendomsprofil(ejendomsprofilID, beskrivelse) {
        const pool = await poolForbindelse;
        const request = pool.request();
        request.input('ejendomsprofilID', sql.Int, ejendomsprofilID);
        request.input('beskrivelse', sql.NVarChar(sql.MAX), beskrivelse);
        await request.query(`
            UPDATE Ejendomsprofil
            SET beskrivelse = @beskrivelse
            WHERE ejendomsprofilID = @ejendomsprofilID
        `);
    }

    /* sletter en ejendomsprofil og alt tilknyttet data. Rækkefølgen er bestemt af fremmednøgle afhængigheder. tabeller der refererer Ejendomsprofil slettes inden profilen selv, og Adresse og Ejendomsdata slettes til sidst da profilen refererede dem. */
    async sletEjendomsprofil(ejendomsprofilID) {
        const pool = await poolForbindelse;

        /* hent adresseID og ejendomsdataID inden vi sletter profilen, så vi kan rydde op bagefter */
        const idRequest = pool.request();
        idRequest.input('id', sql.Int, ejendomsprofilID);
        const idResultat = await idRequest.query(`
            SELECT adresseID, ejendomsdataID 
            FROM Ejendomsprofil 
            WHERE ejendomsprofilID = @id
        `);
        if (idResultat.recordset.length === 0) return;
        const { adresseID, ejendomsdataID } = idResultat.recordset[0];

        /* slet i rækkefølge der respekterer FK-afhængigheder */
        const r1 = pool.request(); r1.input('id', sql.Int, ejendomsprofilID);
        await r1.query(`
            DELETE FROM SammenligningCase
            WHERE investeringscaseID IN (
                SELECT investeringscaseID 
                FROM Investeringscase 
                WHERE ejendomsprofilID = @id
            )
        `);

        const r2 = pool.request(); r2.input('id', sql.Int, ejendomsprofilID);
        await r2.query(`
            DELETE FROM SimuleringResultat
            WHERE simuleringID IN (
                SELECT simuleringID 
                FROM Simulering
                WHERE investeringscaseID IN (
                    SELECT investeringscaseID 
                    FROM Investeringscase 
                    WHERE ejendomsprofilID = @id
                )
            )
        `);

        const r3 = pool.request(); r3.input('id', sql.Int, ejendomsprofilID);
        await r3.query(`
            DELETE FROM Simulering
            WHERE investeringscaseID IN (
                SELECT investeringscaseID 
                FROM Investeringscase 
                WHERE ejendomsprofilID = @id
            )
        `);

        const r4 = pool.request(); r4.input('id', sql.Int, ejendomsprofilID);
        await r4.query(`DELETE FROM Investeringscase WHERE ejendomsprofilID = @id`);

        const r5 = pool.request(); r5.input('id', sql.Int, ejendomsprofilID);
        await r5.query(`DELETE FROM Ejendomsprofil WHERE ejendomsprofilID = @id`);

        const r6 = pool.request(); r6.input('adresseID', sql.Int, adresseID);
        await r6.query(`DELETE FROM Adresse WHERE adresseID = @adresseID`);

        const r7 = pool.request(); r7.input('ejendomsdataID', sql.Int, ejendomsdataID);
        await r7.query(`DELETE FROM Ejendomsdata WHERE ejendomsdataID = @ejendomsdataID`);
    }

    /* duplikerer en eksisterende ejendomsprofil ved at kopiere dens adresse, ejendomsdata og selve profilen til nye rækker. 
    Fremmednøgle-rækkefølgen er den samme som i gemEjendomsprofil. */
    async duplikerEjendomsprofil(ejendomsprofilID) {
        const pool = await poolForbindelse;

        /* hent eksisterende profil med adresse og ejendomsdata via JOIN */
        const hentRequest = pool.request();
        hentRequest.input('id', sql.Int, ejendomsprofilID);
        const hentResultat = await hentRequest.query(`
            SELECT
                ep.navn, ep.beskrivelse,
                a.vejnavn, a.husnummer, a.etage, a.doer, a.postnummer, a.bynavn,
                ed.ejendomstype, ed.byggeaar, ed.boligareal, ed.antalVaerelser, ed.grundareal
            FROM Ejendomsprofil ep
            JOIN Adresse a ON ep.adresseID = a.adresseID
            JOIN Ejendomsdata ed ON ep.ejendomsdataID = ed.ejendomsdataID
            WHERE ep.ejendomsprofilID = @id
        `);
        if (hentResultat.recordset.length === 0) return;
        const k = hentResultat.recordset[0];

        /* 1. Indsæt kopi af adresse og hent nyt adresseID */
        const adresseRequest = pool.request();
        adresseRequest.input('vejnavn', sql.NVarChar(255), k.vejnavn);
        adresseRequest.input('husnummer', sql.NVarChar(20), k.husnummer);
        adresseRequest.input('etage', sql.NVarChar(20), k.etage || null);
        adresseRequest.input('doer', sql.NVarChar(20), k.doer || null);
        adresseRequest.input('postnummer', sql.NVarChar(10), k.postnummer);
        adresseRequest.input('bynavn', sql.NVarChar(255), k.bynavn);
        const adresseResultat = await adresseRequest.query(`
            INSERT INTO Adresse (vejnavn, husnummer, etage, doer, postnummer, bynavn)
            OUTPUT INSERTED.adresseID
            VALUES (@vejnavn, @husnummer, @etage, @doer, @postnummer, @bynavn)
        `);
        const nyAdresseID = adresseResultat.recordset[0].adresseID;

        /* 2. Indsæt kopi af ejendomsdata og hent nyt ejendomsdataID */
        const ejendomsdataRequest = pool.request();
        ejendomsdataRequest.input('ejendomstype', sql.NVarChar(255), k.ejendomstype);
        ejendomsdataRequest.input('byggeaar', sql.Int, k.byggeaar);
        ejendomsdataRequest.input('boligareal', sql.Float, k.boligareal);
        ejendomsdataRequest.input('antalVaerelser', sql.Int, k.antalVaerelser);
        ejendomsdataRequest.input('grundareal', sql.Float, k.grundareal);
        const ejendomsdataResultat = await ejendomsdataRequest.query(`
            INSERT INTO Ejendomsdata (ejendomstype, byggeaar, boligareal, antalVaerelser, grundareal)
            OUTPUT INSERTED.ejendomsdataID
            VALUES (@ejendomstype, @byggeaar, @boligareal, @antalVaerelser, @grundareal)
        `);
        const nyEjendomsdataID = ejendomsdataResultat.recordset[0].ejendomsdataID;

        /* 3. Indsæt kopi af selve profilen med de to nye fremmednøgler */
        const profilRequest = pool.request();
        profilRequest.input('navn', sql.NVarChar(255), k.navn);
        profilRequest.input('beskrivelse', sql.NVarChar(sql.MAX), k.beskrivelse);
        profilRequest.input('brugerID', sql.Int, 1); /* brugerID er hardkodet til 1 — applikationen har ingen autentificering */
        profilRequest.input('adresseID', sql.Int, nyAdresseID);
        profilRequest.input('ejendomsdataID', sql.Int, nyEjendomsdataID);
        await profilRequest.query(`
            INSERT INTO Ejendomsprofil (navn, beskrivelse, brugerID, adresseID, ejendomsdataID)
            VALUES (@navn, @beskrivelse, @brugerID, @adresseID, @ejendomsdataID)
        `);
    }

    /* henter ejendomsdata for en given ejendomsprofil direkte fra databasen. Bruges af info-modalen i portefølje.js til at vise BBR-data uden et nyt API-kald. */
    async hentEjendomsdata(ejendomsprofilID) {
        const pool = await poolForbindelse;
        const request = pool.request();
        request.input('ejendomsprofilID', sql.Int, ejendomsprofilID);
        const resultat = await request.query(`
            SELECT
                ed.ejendomstype,
                ed.byggeaar,
                ed.boligareal,
                ed.antalVaerelser,
                ed.grundareal,
                ed.senestHentet
            FROM Ejendomsdata ed
            JOIN Ejendomsprofil ep ON ep.ejendomsdataID = ed.ejendomsdataID
            WHERE ep.ejendomsprofilID = @ejendomsprofilID
        `);
        return resultat.recordset[0] ?? null;
    }

    /* henter alle ejendomsprofiler med tilhørende adressedata til porteføljesiden.
    JOINer med Adresse-tabellen for at flette vejnavn, husnummer, postnummer og bynavn direkte ind i resultatet, så frontend slipper for et separat adresseopslag per profil. */
    async hentAlleEjendomsprofiler() {
        const pool = await poolForbindelse;
        const resultat = await pool.request().query(`
            SELECT
                ep.ejendomsprofilID,
                ep.navn,
                ep.beskrivelse,
                ep.oprettetDato,
                a.vejnavn,
                a.husnummer,
                a.etage,
                a.doer,
                a.postnummer,
                a.bynavn,
                COUNT(ic.investeringscaseID) AS antalCases
            FROM Ejendomsprofil ep
            JOIN Adresse a ON ep.adresseID = a.adresseID
            LEFT JOIN Investeringscase ic ON ep.ejendomsprofilID = ic.ejendomsprofilID  /* LEFT JOIN: profiler uden cases skal stadig vises med antalCases = 0 */
            GROUP BY
                ep.ejendomsprofilID, ep.navn, ep.beskrivelse, ep.oprettetDato, a.vejnavn, a.husnummer, a.etage, a.doer, a.postnummer, a.bynavn
            ORDER BY ep.oprettetDato DESC
        `);
        return resultat.recordset;
    }
}

module.exports = new EjendomsprofilRepositorium();
