/* investeringscaseRepositorium.js håndterer al direkte kommunikation med databasen for investeringscases.
   
Alle SQL-forespørgsler til tabellerne Investeringscase og InvesteringsParametre er samlet her */

const { sql, poolForbindelse } = require('../database/connection');

class InvesteringscaseRepositorium {

    /* opretter en ny investeringscase i to trin:
       1. indsætter alle finansielle parametre i InvesteringsParametre og henter det auto-genererede ID
       2. indsætter selve casen i Investeringscase med fremmednøgler til profilen og parametrene.
       To-trins-tilgangen er nødvendig fordi Investeringscase refererer InvesteringsParametre via FK. vi skal kende parametrenes ID inden vi kan indsætte casen. */
    async opretInvesteringscase(ejendomsprofilID, navn, beskrivelse, parametre) {
        const pool = await poolForbindelse;

        /* 1. Indsæt InvesteringsParametre og hent det auto-genererede ID */
        const paramRequest = pool.request();
        /* ?? null sikrer at valgfrie felter sendes som NULL i stedet for undefined, som mssql-pakken ikke accepterer */
        paramRequest.input('ejendomspris', sql.Float, parametre.ejendomspris ?? null);
        paramRequest.input('advokatudgifter', sql.Float, parametre.advokatudgifter ?? null);
        paramRequest.input('tinglysningsudgifter', sql.Float, parametre.tinglysningsudgifter ?? null);
        paramRequest.input('overtagelsesudgifter', sql.Float, parametre.overtagelsesudgifter ?? null);
        paramRequest.input('koebsomkostninger', sql.Float, parametre.koebsomkostninger ?? null);
        paramRequest.input('laanebeloeb', sql.Float, parametre.laanebeloeb ?? null);
        paramRequest.input('rente', sql.Float, parametre.rente ?? null);
        paramRequest.input('loebetid', sql.Int, parametre.loebetid ?? null);
        paramRequest.input('afdragsfriPeriode', sql.Int, parametre.afdragsfriPeriode ?? null);
        paramRequest.input('laanetype', sql.NVarChar(50), parametre.laanetype ?? null);
        paramRequest.input('planlagteRenoveringOgForbedringer', sql.Float, parametre.planlagteRenoveringOgForbedringer ?? null);
        paramRequest.input('renoveringstidspunkt', sql.Int, parametre.renoveringstidspunkt ?? null);
        paramRequest.input('driftsomkostninger', sql.Float, parametre.driftsomkostninger ?? null);
        paramRequest.input('udlejning', sql.Bit, parametre.udlejning ? 1 : 0); /* SQL BIT-typen forventer 0 eller 1 - ikke JavaScript-booleans */
        paramRequest.input('udlejningMaanederAarligt', sql.Int, parametre.udlejningMaanederAarligt ?? null);
        paramRequest.input('maanedligLeje', sql.Float, parametre.maanedligLeje ?? null);
        paramRequest.input('udlejningsudgifter', sql.Float, parametre.udlejningsudgifter ?? null);
        
        const paramResultat = await paramRequest.query(`
            INSERT INTO InvesteringsParametre (
                ejendomspris, 
                advokatudgifter, 
                tinglysningsudgifter, 
                overtagelsesudgifter, 
                koebsomkostninger, 
                laanebeloeb, 
                rente, 
                loebetid, 
                afdragsfriPeriode, 
                laanetype, 
                planlagteRenoveringOgForbedringer, 
                renoveringstidspunkt,
                driftsomkostninger, 
                udlejning, 
                udlejningMaanederAarligt, 
                maanedligLeje, 
                udlejningsudgifter
            )
            OUTPUT INSERTED.investeringsparametreID
            VALUES (
                @ejendomspris, @advokatudgifter, @tinglysningsudgifter, @overtagelsesudgifter, @koebsomkostninger, @laanebeloeb, @rente, @loebetid, @afdragsfriPeriode, @laanetype, @planlagteRenoveringOgForbedringer, @renoveringstidspunkt, @driftsomkostninger, @udlejning, @udlejningMaanederAarligt, @maanedligLeje, @udlejningsudgifter
            )
        `);

        const investeringsparametreID = paramResultat.recordset[0].investeringsparametreID; /* OUTPUT INSERTED returnerer det nye ID direkte, så vi undgår et separat SELECT-kald */

        /* 2. Indsæt selve investeringscasen med de to fremmednøgler */
        const caseRequest = pool.request();
        caseRequest.input('navn', sql.NVarChar(200), navn);
        caseRequest.input('beskrivelse', sql.NVarChar(sql.MAX), beskrivelse);
        caseRequest.input('ejendomsprofilID', sql.Int, ejendomsprofilID);
        caseRequest.input('investeringsparametreID', sql.Int, investeringsparametreID);
        await caseRequest.query(`
            INSERT INTO Investeringscase (navn, beskrivelse, ejendomsprofilID, investeringsparametreID)
            VALUES (@navn, @beskrivelse, @ejendomsprofilID, @investeringsparametreID)
        `);
    }

    /* duplikerer en eksisterende investeringscase ved at kopiere dens parametre og selve casen til nye rækker. Fremmednøgle-rækkefølgen er den samme som i opretInvesteringscase. */
    async duplikerInvesteringscase(investeringscaseID) {
        const pool = await poolForbindelse;

        /* hent eksisterende case og dens parametre via LEFT JOIN */
        const hentRequest = pool.request();
        hentRequest.input('id', sql.Int, investeringscaseID);
        const hentResultat = await hentRequest.query(`
            SELECT
                ic.navn, 
                ic.beskrivelse, 
                ic.ejendomsprofilID,
                ip.ejendomspris, 
                ip.advokatudgifter, 
                ip.tinglysningsudgifter,
                ip.overtagelsesudgifter, 
                ip.koebsomkostninger,
                ip.laanebeloeb, 
                ip.rente, 
                ip.loebetid, 
                ip.afdragsfriPeriode, 
                ip.laanetype,
                ip.planlagteRenoveringOgForbedringer, 
                ip.renoveringstidspunkt,
                ip.driftsomkostninger, 
                ip.udlejning, 
                ip.udlejningMaanederAarligt, 
                ip.maanedligLeje, 
                ip.udlejningsudgifter
            FROM Investeringscase ic
            LEFT JOIN InvesteringsParametre ip ON ic.investeringsparametreID = ip.investeringsparametreID
            WHERE ic.investeringscaseID = @id
        `);
        if (hentResultat.recordset.length === 0) return;
        const k = hentResultat.recordset[0];

        /* 1. Indsæt kopi af InvesteringsParametre og hent nyt ID */
        const paramRequest = pool.request();
        paramRequest.input('ejendomspris', sql.Float, k.ejendomspris ?? null);
        paramRequest.input('advokatudgifter', sql.Float, k.advokatudgifter ?? null);
        paramRequest.input('tinglysningsudgifter', sql.Float, k.tinglysningsudgifter ?? null);
        paramRequest.input('overtagelsesudgifter', sql.Float, k.overtagelsesudgifter ?? null);
        paramRequest.input('koebsomkostninger', sql.Float, k.koebsomkostninger ?? null);
        paramRequest.input('laanebeloeb', sql.Float, k.laanebeloeb ?? null);
        paramRequest.input('rente', sql.Float, k.rente ?? null);
        paramRequest.input('loebetid', sql.Int, k.loebetid ?? null);
        paramRequest.input('afdragsfriPeriode', sql.Int, k.afdragsfriPeriode ?? null);
        paramRequest.input('laanetype', sql.NVarChar(50), k.laanetype ?? null);
        paramRequest.input('planlagteRenoveringOgForbedringer', sql.Float, k.planlagteRenoveringOgForbedringer ?? null);
        paramRequest.input('renoveringstidspunkt', sql.Int, k.renoveringstidspunkt ?? null);
        paramRequest.input('driftsomkostninger', sql.Float, k.driftsomkostninger ?? null);
        paramRequest.input('udlejning', sql.Bit, k.udlejning ? 1 : 0);
        paramRequest.input('udlejningMaanederAarligt', sql.Int, k.udlejningMaanederAarligt ?? null);
        paramRequest.input('maanedligLeje', sql.Float, k.maanedligLeje ?? null);
        paramRequest.input('udlejningsudgifter', sql.Float, k.udlejningsudgifter ?? null);
        
        const paramResultat = await paramRequest.query(`
            INSERT INTO InvesteringsParametre (
                ejendomspris, 
                advokatudgifter, 
                tinglysningsudgifter, 
                overtagelsesudgifter, 
                koebsomkostninger,
                laanebeloeb, 
                rente, 
                loebetid, 
                afdragsfriPeriode, 
                laanetype,
                planlagteRenoveringOgForbedringer, 
                renoveringstidspunkt,
                driftsomkostninger, 
                udlejning, 
                udlejningMaanederAarligt, 
                maanedligLeje, 
                udlejningsudgifter
            )
            OUTPUT INSERTED.investeringsparametreID
            VALUES (
                @ejendomspris, @advokatudgifter, @tinglysningsudgifter, @overtagelsesudgifter, @koebsomkostninger,
                @laanebeloeb, @rente, @loebetid, @afdragsfriPeriode, @laanetype,
                @planlagteRenoveringOgForbedringer, @renoveringstidspunkt,
                @driftsomkostninger, @udlejning, @udlejningMaanederAarligt, @maanedligLeje, @udlejningsudgifter
            )
        `);
        const nyInvesteringsparametreID = paramResultat.recordset[0].investeringsparametreID;

        /* 2. Indsæt kopi af selve casen med det nye parametreID */
        const caseRequest = pool.request();
        caseRequest.input('navn', sql.NVarChar(200), k.navn);
        caseRequest.input('beskrivelse', sql.NVarChar(sql.MAX), k.beskrivelse ?? '');
        caseRequest.input('ejendomsprofilID',        sql.Int,              k.ejendomsprofilID);
        caseRequest.input('investeringsparametreID', sql.Int,              nyInvesteringsparametreID);
        await caseRequest.query(`
            INSERT INTO Investeringscase (navn, beskrivelse, ejendomsprofilID, investeringsparametreID)
            VALUES (@navn, @beskrivelse, @ejendomsprofilID, @investeringsparametreID)
        `);
    }

    /* henter alle investeringscases med tilhørende profilnavn og ejendomspris til porteføljesiden.
    JOINer med Ejendomsprofil for at hente profilnavnet (vises under casens titel i UI'et), og LEFT JOINer med InvesteringsParametre fordi parametrene teknisk set kan mangle men vi vil stadig vise casen fremfor at udelukke den fra listen. */
    async hentAlleInvesteringscases() {
        const pool = await poolForbindelse;
        const resultat = await pool.request().query(`
            SELECT
                ic.investeringscaseID,
                ic.navn,
                ic.beskrivelse,
                ic.oprettetDato,
                ic.ejendomsprofilID,
                ep.navn AS ejendomsprofilNavn,
                ip.ejendomspris,
                ip.advokatudgifter,
                ip.tinglysningsudgifter,
                ip.overtagelsesudgifter,
                ip.koebsomkostninger,
                ip.laanebeloeb,
                ip.rente,
                ip.loebetid,
                ip.afdragsfriPeriode,
                ip.laanetype,
                ip.planlagteRenoveringOgForbedringer,
                ip.renoveringstidspunkt,
                ip.driftsomkostninger,
                ip.udlejning,
                ip.udlejningMaanederAarligt,
                ip.maanedligLeje,
                ip.udlejningsudgifter
            FROM Investeringscase ic
            JOIN Ejendomsprofil ep ON ic.ejendomsprofilID = ep.ejendomsprofilID     /* INNER JOIN: en case uden ejendomsprofil er ubrugelig og vises ikke */
            LEFT JOIN InvesteringsParametre ip ON ic.investeringsparametreID = ip.investeringsparametreID       /* LEFT JOIN: viser casen selvom den ikke har parametre */
            ORDER BY ic.oprettetDato DESC
        `);
        return resultat.recordset;
    }

    /* henter InvesteringsParametre for en given investeringscase som et plain objekt. 
    Bruges af simuleringController som input til domæneklassen Simulering.eksekver(). */
    async hentParametreForCase(investeringscaseID) {
        const pool = await poolForbindelse;
        const request = pool.request();
        request.input('investeringscaseID', sql.Int, investeringscaseID);
        const resultat = await request.query(`
            SELECT ip.*
            FROM InvesteringsParametre ip
            JOIN Investeringscase ic ON ip.investeringsparametreID = ic.investeringsparametreID
            WHERE ic.investeringscaseID = @investeringscaseID
        `);
        return resultat.recordset[0] ?? null; /* null hvis casen ikke har tilknyttede parametre */
    }

    /* opdaterer navn og beskrivelse på en eksisterende investeringscase.
    Ejendomsprofil og finansielle parametre kan ikke ændres via denne metode. */
    async opdaterInvesteringscase(investeringscaseID, navn, beskrivelse) {
        const pool = await poolForbindelse;
        const request = pool.request();
        request.input('investeringscaseID', sql.Int, investeringscaseID);
        request.input('navn', sql.NVarChar(200), navn);
        request.input('beskrivelse', sql.NVarChar(sql.MAX), beskrivelse);
        await request.query(`
            UPDATE Investeringscase
            SET navn = @navn, beskrivelse = @beskrivelse
            WHERE investeringscaseID = @investeringscaseID
        `);
    }

    /* opdaterer alle finansielle parametre for en given investeringscase.
    Finder investeringsparametreID via Investeringscase, derefter UPDATE på InvesteringsParametre.
    To-trins-tilgangen er nødvendig fordi InvesteringsParametre ikke har en direkte reference til investeringscaseID — vi skal gå via Investeringscase for at finde det rigtige parametreID. */
    async opdaterParametre(investeringscaseID, parametre) {
        const pool = await poolForbindelse;

        const idRequest = pool.request();
        idRequest.input('investeringscaseID', sql.Int, investeringscaseID);
        const idResultat = await idRequest.query(`
            SELECT investeringsparametreID FROM Investeringscase
            WHERE investeringscaseID = @investeringscaseID
        `);
        if (idResultat.recordset.length === 0) return;
        const { investeringsparametreID } = idResultat.recordset[0];

        const req = pool.request();
        req.input('investeringsparametreID', sql.Int, investeringsparametreID);
        req.input('ejendomspris', sql.Float, parametre.ejendomspris ?? null);
        req.input('advokatudgifter', sql.Float, parametre.advokatudgifter ?? null);
        req.input('tinglysningsudgifter', sql.Float, parametre.tinglysningsudgifter ?? null);
        req.input('overtagelsesudgifter', sql.Float, parametre.overtagelsesudgifter ?? null);
        req.input('koebsomkostninger', sql.Float, parametre.koebsomkostninger ?? null);
        req.input('laanebeloeb', sql.Float, parametre.laanebeloeb ?? null);
        req.input('rente', sql.Float, parametre.rente ?? null);
        req.input('loebetid', sql.Int, parametre.loebetid ?? null);
        req.input('afdragsfriPeriode', sql.Int, parametre.afdragsfriPeriode ?? null);
        req.input('laanetype', sql.NVarChar(50), parametre.laanetype ?? null);
        req.input('planlagteRenoveringOgForbedringer', sql.Float, parametre.planlagteRenoveringOgForbedringer ?? null);
        req.input('renoveringstidspunkt', sql.Int, parametre.renoveringstidspunkt ?? null);
        req.input('driftsomkostninger', sql.Float, parametre.driftsomkostninger ?? null);
        req.input('udlejning', sql.Bit, parametre.udlejning ? 1 : 0);
        req.input('udlejningMaanederAarligt', sql.Int, parametre.udlejningMaanederAarligt ?? null);
        req.input('maanedligLeje', sql.Float, parametre.maanedligLeje ?? null);
        req.input('udlejningsudgifter', sql.Float, parametre.udlejningsudgifter ?? null);
        await req.query(`
            UPDATE InvesteringsParametre SET
                ejendomspris = @ejendomspris,
                advokatudgifter = @advokatudgifter,
                tinglysningsudgifter  = @tinglysningsudgifter,
                overtagelsesudgifter = @overtagelsesudgifter,
                koebsomkostninger = @koebsomkostninger,
                laanebeloeb = @laanebeloeb,
                rente = @rente,
                loebetid = @loebetid,
                afdragsfriPeriode = @afdragsfriPeriode,
                laanetype = @laanetype,
                planlagteRenoveringOgForbedringer = @planlagteRenoveringOgForbedringer,
                renoveringstidspunkt = @renoveringstidspunkt,
                driftsomkostninger = @driftsomkostninger,
                udlejning = @udlejning,
                udlejningMaanederAarligt = @udlejningMaanederAarligt,
                maanedligLeje = @maanedligLeje,
                udlejningsudgifter = @udlejningsudgifter
            WHERE investeringsparametreID = @investeringsparametreID
        `);
    }

    /* sletter en investeringscase og alt dens tilknyttede data. 
    Rækkefølgen af DELETE-sætninger er bestemt af databasens fremmednøgle-afhængigheder. 
    child-tabeller slettes altid inden parent-tabellen, ellers afviser databasen sletningen med en FK-constraint-fejl. */
    async sletInvesteringscase(investeringscaseID) {
        const pool = await poolForbindelse;

        /* hent investeringsparametreID inden sletning, så vi kan rydde op bagefter */
        const idRequest = pool.request();
        idRequest.input('id', sql.Int, investeringscaseID);
        const idResultat = await idRequest.query(`
            SELECT investeringsparametreID 
            FROM Investeringscase 
            WHERE investeringscaseID = @id
        `);
        
        if (idResultat.recordset.length === 0) return;
        const { investeringsparametreID } = idResultat.recordset[0];

        /* slet i rækkefølge der respekterer FK-afhængigheder */
        const r1 = pool.request(); r1.input('id', sql.Int, investeringscaseID);
        await r1.query(`DELETE FROM SammenligningCase WHERE investeringscaseID = @id`);

        const r2 = pool.request(); r2.input('id', sql.Int, investeringscaseID);
        await r2.query(`
            DELETE FROM SimuleringResultat
            WHERE simuleringID IN (SELECT simuleringID FROM Simulering WHERE investeringscaseID = @id)
        `);

        const r3 = pool.request(); r3.input('id', sql.Int, investeringscaseID);
        await r3.query(`DELETE FROM Simulering WHERE investeringscaseID = @id`);

        const r4 = pool.request(); r4.input('id', sql.Int, investeringscaseID);
        await r4.query(`DELETE FROM Investeringscase WHERE investeringscaseID = @id`);

        if (investeringsparametreID) {
            const r5 = pool.request(); r5.input('investeringsparametreID', sql.Int, investeringsparametreID);
            await r5.query(`DELETE FROM InvesteringsParametre WHERE investeringsparametreID = @investeringsparametreID`);
        }
    }
}

module.exports = new InvesteringscaseRepositorium();
