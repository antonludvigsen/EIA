const simuleringResultat = require('./simuleringResultat');

/* beregnMaanedligYdelse() er en hjælpefunktion til låneberegning.
Den er lagt uden for klassen, fordi den er en isoleret matematisk beregning, som senere kan unit-testes direkte. */
function beregnMaanedligYdelse(laanebeloeb, rente, loebetid) {
    const maanedligRente = rente / 100 / 12; 
    const antalMaaneder = loebetid * 12;

    /* Hvis renten er 0, bruges en simpel beregning uden rente.
    Det er et edge case, fordi annuitetsformlen ellers vil dividere med 0. */
    if (maanedligRente === 0) {
        return laanebeloeb / antalMaaneder;
    }

    /* Annuitetsformlen beregner en fast månedlig ydelse på lånet.
    Den er valgt, fordi den er enkel, realistisk og nem at forklare til eksamen. */
    return laanebeloeb * 
    (maanedligRente * Math.pow(1 + maanedligRente, antalMaaneder)) /
    (Math.pow(1 + maanedligRente, antalMaaneder) - 1);
}

/* Simulering repræsenterer den beregning, der fremskriver en investeringscase over tid.
Klassen passer til DCD'et, hvor Simulering producerer et SimuleringResultat. */

class Simulering {
    constructor(tidshorisont) {

        /* tidshorisont er antal år simuleringen skal køre */
        this.tidshorisont = tidshorisont;

        /* oprettetDato sættes automatisk, når simuleringen oprettes */
        this.oprettetDato = new Date();
    }

     /* eksekver() er hovedmetoden.
    Den modtager investeringsparametre og beregner cashflow, gæld og egenkapital år for år. */
    eksekver(parametre) {
        this.validerParametre(parametre)

        const egenkapitalOverTid = [];
        const cashflowOverTid = [];
        const gaeldOverTid = [];

        let gaeld = parametre.laanebeloeb;

        const maanedligYdelse = beregnMaanedligYdelse(
            parametre.laanebeloeb,
            parametre.rente,
            parametre.loebetid
        );

        for (let aar = 1;  aar <= this.tidshorisont; aar++) {
            const aarligLeje = parametre.udlejning ? parametre.maanedligLeje * 12 : 0;
            const aarligeUdlejningsudgifter = parametre.udlejning ? parametre.udlejningsudgifter * 12 : 0;
            const aarligeDriftomkostninger = parametre.driftsomkostninger * 12;

            /* I en afdragsfri periode betales der kun renter, og gælden falder derfor ikke. */
            const aarligeRente = gaeld * (parametre.rente / 100);
            const erAfdragsfritAar = aar <= parametre.afdragsfriPeriode;

            let aarligeYdelse;
            let afdrag;

            if (erAfdragsfritAar) {
                aarligeYdelse = aarligeRente;
                afdrag = 0;
            } else {
                aarligeYdelse = maanedligYdelse * 12;
                afdrag = Math.max(0, aarligeYdelse - aarligeRente);
            }

            /* Købsomkostninger tages med i første år, fordi de er engangsudgifter ved opstart. */
            const koebsudgifterIAar = aar === 1 ? this.beregnSamledeKoebsudgifter(parametre) : 0;

            /* Renovering tages kun med i det år, brugeren har angivet som renoveringstidspunkt. */
            const renoveringsudgifterIAar =
            aar === parametre.renoveringstidspunkt
            ? parametre.planlagteRenoveringOgForbedringer
            : 0;

            /* Cashflow er indtægter minus udgifter.
            Her medregnes lejeindtægter, drift, udlejning, låneydelse, køb og eventuel renovering. */
            const cashflow = aarligLeje
            - aarligeUdlejningsudgifter
            - aarligeDriftomkostninger
            - aarligeYdelse
            - koebsudgifterIAar
            renoveringsudgifterIAar;

            gaeld = Math.max(0, gaeld - afdrag);

            /* I denne første version antager vi, at ejendommens værdi er konstant.
            Egenkapital beregnes derfor som ejendomspris minus resterende gæld. */
            const egenkapital = parametre.ejendomspris - gaeld;

            cashflowOverTid.push(Math.round(cashflow));
            gaeldOverTid.push(Math.round(gaeld));
            egenkapitalOverTid.push(Math.round(egenkapital));
        }

        return new simuleringResultat(
            egenkapitalOverTid,
            cashflowOverTid,
            gaeldOverTid
        );
    }

    /* beregnSamledeKoebsudgifter() samler alle købsrelaterede engangsudgifter.
    Den er lavet som en separat metode for at undgå at gentage samme udregning inde i løkken. */
    beregnSamledeKoebsudgifter(parametre) {
        return parametre.koebsomkostninger
        + parametre.advokatudgifter
        + parametre.tinglysningsudgifter
        + parametre.overtagelsesudgifter;
    }

     /* validerParametre() sikrer, at simuleringen ikke køres med manglende eller ugyldige hovedtal.
    Det passer til opgavens krav om validering og fejlhåndtering. */
    validerParametre(parametre) {
        if (!parametre) {
            throw new Error('Investeringsparametre mangler');
        }

         if (!parametre.ejendomspris || parametre.ejendomspris <= 0) {
            throw new Error('Ejendomspris skal være større end 0');
        }

        if (!parametre.laanebeloeb || parametre.laanebeloeb <= 0) {
            throw new Error('Lånebeløb skal være større end 0');
        }

        if (parametre.rente < 0) {
            throw new Error('Rente må ikke være negativ');
        }

        if (!parametre.loebetid || parametre.loebetid <= 0) {
            throw new Error('Løbetid skal være større end 0');
        }

        if (!this.tidshorisont || this.tidshorisont <= 0) {
            throw new Error('Tidshorisont skal være større end 0');
        }
    }
}

module.exports = {
    Simulering,
    beregnMaanedligYdelse
};