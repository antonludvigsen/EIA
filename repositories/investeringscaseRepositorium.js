/* investeringscaseRepositorium.js håndterer al direkte kommunikation med databasen for investeringscases.
   Alle SQL-forespørgsler til tabellerne Investeringscase og InvesteringsParametre er samlet her,
   så resten af applikationen aldrig selv behøver kende til databasestrukturen eller SQL-syntaks. */

const { sql, poolForbindelse } = require('../database/connection');

class InvesteringscaseRepositorium {

    /* opretter en ny investeringscase i to trin:
       1. indsætter alle finansielle parametre i InvesteringsParametre og henter det auto-genererede ID
       2. indsætter selve casen i Investeringscase med fremmednøgler til profilen og parametrene.
       To-trins-tilgangen er nødvendig fordi Investeringscase refererer InvesteringsParametre via FK —
       vi skal kende parametrenes ID inden vi kan indsætte casen. */
    async opretInvesteringscase(ejendomsprofilID, navn, beskrivelse, parametre) {
        const pool = await poolForbindelse;

        /* 1. Indsæt InvesteringsParametre og hent det auto-genererede ID */
        const paramRequest = pool.request();
        /* ?? null sikrer at valgfrie felter sendes som NULL i stedet for undefined, som mssql-pakken ikke accepterer */
        paramRequest.input('ejendomspris',                      sql.Float,          parametre.ejendomspris ?? null);
        paramRequest.input('advokatudgifter',                   sql.Float,          parametre.advokatudgifter ?? null);
        paramRequest.input('tinglysningsudgifter',              sql.Float,          parametre.tinglysningsudgifter ?? null);
        paramRequest.input('overtagelsesudgifter',              sql.Float,          parametre.overtagelsesudgifter ?? null);
        paramRequest.input('koebsomkostninger',                 sql.Float,          parametre.koebsomkostninger ?? null);
        paramRequest.input('laanebeloeb',                       sql.Float,          parametre.laanebeloeb ?? null);
        paramRequest.input('rente',                             sql.Float,          parametre.rente ?? null);
        paramRequest.input('loebetid',                          sql.Int,            parametre.loebetid ?? null);
        paramRequest.input('afdragsfriPeriode',                 sql.Int,            parametre.afdragsfriPeriode ?? null);
        paramRequest.input('laanetype',                         sql.NVarChar(50),   parametre.laanetype ?? null);
        paramRequest.input('planlagteRenoveringOgForbedringer', sql.Float,          parametre.planlagteRenoveringOgForbedringer ?? null);
        paramRequest.input('renoveringstidspunkt',              sql.Int,            parametre.renoveringstidspunkt ?? null);
        paramRequest.input('driftsomkostninger',                sql.Float,          parametre.driftsomkostninger ?? null);
        paramRequest.input('udlejning',                         sql.Bit,            parametre.udlejning ? 1 : 0); /* SQL BIT-typen forventer 0 eller 1 — ikke JavaScript-booleans */
        paramRequest.input('maanedligLeje',                     sql.Float,          parametre.maanedligLeje ?? null);
        paramRequest.input('udlejningsudgifter',                sql.Float,          parametre.udlejningsudgifter ?? null);
        const paramResultat = await paramRequest.query(`
            INSERT INTO InvesteringsParametre (
                ejendomspris, advokatudgifter, tinglysningsudgifter, overtagelsesudgifter, koebsomkostninger,
                laanebeloeb, rente, loebetid, afdragsfriPeriode, laanetype,
                planlagteRenoveringOgForbedringer, renoveringstidspunkt,
                driftsomkostninger, udlejning, maanedligLeje, udlejningsudgifter
            )
            OUTPUT INSERTED.investeringsparametreID
            VALUES (
                @ejendomspris, @advokatudgifter, @tinglysningsudgifter, @overtagelsesudgifter, @koebsomkostninger,
                @laanebeloeb, @rente, @loebetid, @afdragsfriPeriode, @laanetype,
                @planlagteRenoveringOgForbedringer, @renoveringstidspunkt,
                @driftsomkostninger, @udlejning, @maanedligLeje, @udlejningsudgifter
            )
        `);
        const investeringsparametreID = paramResultat.recordset[0].investeringsparametreID; /* OUTPUT INSERTED returnerer det nye ID direkte, så vi undgår et separat SELECT-kald */

        /* 2. Indsæt selve investeringscasen med de to fremmednøgler */
        const caseRequest = pool.request();
        caseRequest.input('navn',                    sql.NVarChar(200),    navn);
        caseRequest.input('beskrivelse',             sql.NVarChar(sql.MAX), beskrivelse);
        caseRequest.input('ejendomsprofilID',        sql.Int,              ejendomsprofilID);
        caseRequest.input('investeringsparametreID', sql.Int,              investeringsparametreID);
        await caseRequest.query(`
            INSERT INTO Investeringscase (navn, beskrivelse, ejendomsprofilID, investeringsparametreID)
            VALUES (@navn, @beskrivelse, @ejendomsprofilID, @investeringsparametreID)
        `);
    }

    /* duplikerer en eksisterende investeringscase ved at kopiere dens parametre og selve casen
       til nye rækker. Fremmednøgle-rækkefølgen er den samme som i opretInvesteringscase. */
    async duplikerInvesteringscase(investeringscaseID) {
        const pool = await poolForbindelse;

        /* hent eksisterende case og dens parametre via LEFT JOIN */
        const hentRequest = pool.request();
        hentRequest.input('id', sql.Int, investeringscaseID);
        const hentResultat = await hentRequest.query(`
            SELECT
                ic.navn, ic.beskrivelse, ic.ejendomsprofilID,
                ip.ejendomspris, ip.advokatudgifter, ip.tinglysningsudgifter,
                ip.overtagelsesudgifter, ip.koebsomkostninger,
                ip.laanebeloeb, ip.rente, ip.loebetid, ip.afdragsfriPeriode, ip.laanetype,
                ip.planlagteRenoveringOgForbedringer, ip.renoveringstidspunkt,
                ip.driftsomkostninger, ip.udlejning, ip.maanedligLeje, ip.udlejningsudgifter
            FROM Investeringscase ic
            LEFT JOIN InvesteringsParametre ip ON ic.investeringsparametreID = ip.investeringsparametreID
            WHERE ic.investeringscaseID = @id
        `);
        if (hentResultat.recordset.length === 0) return;
        const k = hentResultat.recordset[0];

        /* 1. Indsæt kopi af InvesteringsParametre og hent nyt ID */
        const paramRequest = pool.request();
        paramRequest.input('ejendomspris',                      sql.Float,        k.ejendomspris ?? null);
        paramRequest.input('advokatudgifter',                   sql.Float,        k.advokatudgifter ?? null);
        paramRequest.input('tinglysningsudgifter',              sql.Float,        k.tinglysningsudgifter ?? null);
        paramRequest.input('overtagelsesudgifter',              sql.Float,        k.overtagelsesudgifter ?? null);
        paramRequest.input('koebsomkostninger',                 sql.Float,        k.koebsomkostninger ?? null);
        paramRequest.input('laanebeloeb',                       sql.Float,        k.laanebeloeb ?? null);
        paramRequest.input('rente',                             sql.Float,        k.rente ?? null);
        paramRequest.input('loebetid',                          sql.Int,          k.loebetid ?? null);
        paramRequest.input('afdragsfriPeriode',                 sql.Int,          k.afdragsfriPeriode ?? null);
        paramRequest.input('laanetype',                         sql.NVarChar(50), k.laanetype ?? null);
        paramRequest.input('planlagteRenoveringOgForbedringer', sql.Float,        k.planlagteRenoveringOgForbedringer ?? null);
        paramRequest.input('renoveringstidspunkt',              sql.Int,          k.renoveringstidspunkt ?? null);
        paramRequest.input('driftsomkostninger',                sql.Float,        k.driftsomkostninger ?? null);
        paramRequest.input('udlejning',                         sql.Bit,          k.udlejning ? 1 : 0);
        paramRequest.input('maanedligLeje',                     sql.Float,        k.maanedligLeje ?? null);
        paramRequest.input('udlejningsudgifter',                sql.Float,        k.udlejningsudgifter ?? null);
        const paramResultat = await paramRequest.query(`
            INSERT INTO InvesteringsParametre (
                ejendomspris, advokatudgifter, tinglysningsudgifter, overtagelsesudgifter, koebsomkostninger,
                laanebeloeb, rente, loebetid, afdragsfriPeriode, laanetype,
                planlagteRenoveringOgForbedringer, renoveringstidspunkt,
                driftsomkostninger, udlejning, maanedligLeje, udlejningsudgifter
            )
            OUTPUT INSERTED.investeringsparametreID
            VALUES (
                @ejendomspris, @advokatudgifter, @tinglysningsudgifter, @overtagelsesudgifter, @koebsomkostninger,
                @laanebeloeb, @rente, @loebetid, @afdragsfriPeriode, @laanetype,
                @planlagteRenoveringOgForbedringer, @renoveringstidspunkt,
                @driftsomkostninger, @udlejning, @maanedligLeje, @udlejningsudgifter
            )
        `);
        const nyInvesteringsparametreID = paramResultat.recordset[0].investeringsparametreID;

        /* 2. Indsæt kopi af selve casen med det nye parametreID */
        const caseRequest = pool.request();
        caseRequest.input('navn',                    sql.NVarChar(200),    k.navn);
        caseRequest.input('beskrivelse',             sql.NVarChar(sql.MAX), k.beskrivelse ?? '');
        caseRequest.input('ejendomsprofilID',        sql.Int,              k.ejendomsprofilID);
        caseRequest.input('investeringsparametreID', sql.Int,              nyInvesteringsparametreID);
        await caseRequest.query(`
            INSERT INTO Investeringscase (navn, beskrivelse, ejendomsprofilID, investeringsparametreID)
            VALUES (@navn, @beskrivelse, @ejendomsprofilID, @investeringsparametreID)
        `);
    }

    /* henter alle investeringscases med tilhørende profilnavn og ejendomspris til porteføljesiden.
       JOINer med Ejendomsprofil for at hente profilnavnet (vises under casens titel i UI'et),
       og LEFT JOINer med InvesteringsParametre fordi parametrene teknisk set kan mangle — vi
       vil stadig vise casen fremfor at udelukke den fra listen. */
    async hentAlleInvesteringscases() {
        const pool = await poolForbindelse;
        const resultat = await pool.request().query(`
            SELECT
                ic.investeringscaseID,
                ic.navn,
                ic.beskrivelse,
                ic.oprettetDato,
                ic.ejendomsprofilID,
                ep.navn AS ejendomsprofilNavn,  /* alias så frontend kan skelne casens eget navn fra profilnavnet */
                ip.ejendomspris
            FROM Investeringscase ic
            JOIN Ejendomsprofil ep ON ic.ejendomsprofilID = ep.ejendomsprofilID  /* INNER JOIN: en case uden ejendomsprofil er ubrugelig og vises ikke */
            LEFT JOIN InvesteringsParametre ip ON ic.investeringsparametreID = ip.investeringsparametreID  /* LEFT JOIN: viser casen selvom den ikke har parametre */
            ORDER BY ic.oprettetDato DESC
        `);
        return resultat.recordset;
    }

    /* opdaterer navn og beskrivelse på en eksisterende investeringscase.
       Ejendomsprofil og finansielle parametre kan ikke ændres via denne metode. */
    async opdaterInvesteringscase(investeringscaseID, navn, beskrivelse) {
        const pool = await poolForbindelse;
        const request = pool.request();
        request.input('investeringscaseID', sql.Int,               investeringscaseID);
        request.input('navn',               sql.NVarChar(200),     navn);
        request.input('beskrivelse',        sql.NVarChar(sql.MAX), beskrivelse);
        await request.query(`
            UPDATE Investeringscase
            SET navn = @navn, beskrivelse = @beskrivelse
            WHERE investeringscaseID = @investeringscaseID
        `);
    }

    /* sletter en investeringscase og alt dens tilknyttede data. Rækkefølgen af DELETE-sætninger
       er bestemt af databasens fremmednøgle-afhængigheder — børnetabeller slettes altid inden
       forældetabellen, ellers afviser databasen sletningen med en FK-constraint-fejl. */
    async sletInvesteringscase(investeringscaseID) {
        const pool = await poolForbindelse;

        /* hent investeringsparametreID inden sletning, så vi kan rydde op bagefter */
        const idRequest = pool.request();
        idRequest.input('id', sql.Int, investeringscaseID);
        const idResultat = await idRequest.query(`
            SELECT investeringsparametreID FROM Investeringscase WHERE investeringscaseID = @id
        `);
        if (idResultat.recordset.length === 0) return; /* casen eksisterer ikke — intet at slette */
        const { investeringsparametreID } = idResultat.recordset[0];

        /* slet i rækkefølge der respekterer FK-afhængigheder */
        const r1 = pool.request(); r1.input('id', sql.Int, investeringscaseID);
        await r1.query(`DELETE FROM SammenligningCase WHERE investeringscaseID = @id`); /* SammenligningCase refererer Investeringscase — slettes først */

        const r2 = pool.request(); r2.input('id', sql.Int, investeringscaseID);
        await r2.query(`
            DELETE FROM SimuleringResultat
            WHERE simuleringID IN (SELECT simuleringID FROM Simulering WHERE investeringscaseID = @id)
        `); /* SimuleringResultat er to niveauer dybere — slettes via subquery over Simulering */

        const r3 = pool.request(); r3.input('id', sql.Int, investeringscaseID);
        await r3.query(`DELETE FROM Simulering WHERE investeringscaseID = @id`); /* Simulering slettes efter dens resultater er fjernet */

        const r4 = pool.request(); r4.input('id', sql.Int, investeringscaseID);
        await r4.query(`DELETE FROM Investeringscase WHERE investeringscaseID = @id`); /* selve casen kan nu slettes */

        if (investeringsparametreID) {
            const r5 = pool.request(); r5.input('investeringsparametreID', sql.Int, investeringsparametreID);
            await r5.query(`DELETE FROM InvesteringsParametre WHERE investeringsparametreID = @investeringsparametreID`); /* parametrene slettes sidst, da Investeringscase refererede dem */
        }
    }
}

module.exports = new InvesteringscaseRepositorium();
