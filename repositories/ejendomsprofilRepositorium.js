const { sql, poolForbindelse } = require('../database/connection');

class EjendomsprofilRepositorium {

    async gemEjendomsprofil(navn, beskrivelse, adresseData, ejendomsData) {
        const pool = await poolForbindelse;

        /* 1. Indsæt adresse og hent det auto-genererede adresseID */
        const adresseRequest = pool.request();
        adresseRequest.input('vejnavn',    sql.NVarChar(255), adresseData.vejnavn); /* sql.NVarChar bruges på alle tekstfelter så danske tegn (æøå) gemmes korrekt */
        adresseRequest.input('husnummer',  sql.NVarChar(20),  adresseData.husnummer); 
        adresseRequest.input('postnummer', sql.NVarChar(10),  adresseData.postnummer);
        adresseRequest.input('bynavn',     sql.NVarChar(255), adresseData.bynavn);
        const adresseResultat = await adresseRequest.query(`
            INSERT INTO Adresse (vejnavn, husnummer, postnummer, bynavn)
            OUTPUT INSERTED.adresseID
            VALUES (@vejnavn, @husnummer, @postnummer, @bynavn)
        `);
        const adresseID = adresseResultat.recordset[0].adresseID;

        /* 2. Indsæt ejendomsdata og hent det auto-genererede ejendomsdataID */
        const ejendomsdataRequest = pool.request();
        ejendomsdataRequest.input('ejendomstype',   sql.NVarChar(255), ejendomsData.ejendomstype);
        ejendomsdataRequest.input('byggeaar',        sql.Int,           ejendomsData.byggeår);
        ejendomsdataRequest.input('boligareal',      sql.Float,         ejendomsData.boligareal);
        ejendomsdataRequest.input('antalVaerelser',  sql.Int,           ejendomsData.antalVærelser);
        ejendomsdataRequest.input('grundareal',      sql.Float,         ejendomsData.grundareal);
        const ejendomsdataResultat = await ejendomsdataRequest.query(`
            INSERT INTO Ejendomsdata (ejendomstype, byggeaar, boligareal, antalVaerelser, grundareal)
            OUTPUT INSERTED.ejendomsdataID
            VALUES (@ejendomstype, @byggeaar, @boligareal, @antalVaerelser, @grundareal)
        `);
        const ejendomsdataID = ejendomsdataResultat.recordset[0].ejendomsdataID;

        /* 3. Indsæt selve ejendomsprofilen med de to fremmednøgler */
        const profilRequest = pool.request();
        profilRequest.input('navn',           sql.NVarChar(255), navn);
        profilRequest.input('beskrivelse',    sql.NVarChar(sql.MAX), beskrivelse); /* beskrivelse bruger sql.NVarChar(sql.MAX) da den er fri tekst uden fast længde */
        profilRequest.input('brugerID',       sql.Int, 1);
        profilRequest.input('adresseID',      sql.Int, adresseID);
        profilRequest.input('ejendomsdataID', sql.Int, ejendomsdataID);
        await profilRequest.query(`
            INSERT INTO Ejendomsprofil (navn, beskrivelse, brugerID, adresseID, ejendomsdataID)
            VALUES (@navn, @beskrivelse, @brugerID, @adresseID, @ejendomsdataID)
        `);
    }

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
                a.postnummer,
                a.bynavn
            FROM Ejendomsprofil ep
            JOIN Adresse a ON ep.adresseID = a.adresseID
            ORDER BY ep.oprettetDato DESC
        `);
        return resultat.recordset;
    }
}

module.exports = new EjendomsprofilRepositorium();
