/* simulering.js indeholder al domænelogik for investeringssimulering.

Modulet eksporterer to ting: klassen Simulering og hjælpefunktionen beregnMaanedligYdelse.

beregnMaanedligYdelse er udskilt fra klassen for at bruge den som unit test.

Simulering.eksekver() er den eneste metode der kalder beregnMaanedligYdelse, og den er det naturlige indgangspunkt for at køre en simulering. */

const simuleringResultat = require('./simuleringResultat');

/* Udskilt fra klassen så den kan unit-testes direkte.

Beregningen af den månedlige låneydelse er baseret på den klassiske annuitetsformel for annuitetslån. Formlen er hentet fra Systime Matematik Finansiel Regning: https://mathfc.systime.dk/?id=576 */
function beregnMaanedligYdelse(laanebeloeb, rente, loebetid) {

    /* omdanner den årlige rente fra procent til en månedlig decimalrente. fx. 4% om året -> 4 / 100 = 0,04 -> 0,04 / 12 = 0,00333... pr. måned */
    const maanedligRente = rente / 100 / 12;

    /* løbetiden er allerede i måneder, ingen omregning nødvendig */
    const antalMaaneder = loebetid;

    /* særtilfælde: hvis renten er 0% giver annuitetsformlen division med nul, så i stedet fordeles lånet bare ligeligt over alle måneder */
    if (maanedligRente === 0) {
        return laanebeloeb / antalMaaneder;
    }

    /* (1 + r)^(-n): tilbagediskonteringsfaktoren fortæller hvor meget en krone til betaling om n måneder er værd i dag ved renten r. Jo højere rente og jo længere løbetid, desto tættere på 0 */
    const renteFaktor = Math.pow(1 + maanedligRente, -antalMaaneder);

    /* 1 - (1+r)^(-n): nævneren i annuitetsformlen. Den er større jo højere renten er og jo kortere løbetiden er */
    const naevner = 1 - renteFaktor;

    /* r / (1 - (1+r)^(-n)): annuitetsfaktoren, dvs. den andel af lånebeløbet man skal betale hver måned for at tilbagebetale præcis til tid */
    const annuitetsFaktor = maanedligRente / naevner;

    /* den faste månedlige ydelse = lånebeløb * annuitetsfaktoren. Denne ydelse er konstant i hele lånets løbetid (forudsat fast rente) */
    return laanebeloeb * annuitetsFaktor;
}

class Simulering {

    /* tidshorisont angives i år og bestemmer hvor mange iterationer eksekver() kører (tidshorisont * 12). oprettetDato sættes i constructoren og gemmes ikke i databasen. den bruges kun til sporbarhed i tilfælde af fejlsøgning. */
    constructor(tidshorisont) {
        this.tidshorisont = tidshorisont;
        this.oprettetDato = new Date();
    }

    /* eksekver() er hovedmetoden. Den modtager investeringsparametre og beregner cashflow, gæld, aktiver,
    likviditetsholdning og egenkapital måned for måned. tidshorisont er i år, så løkken kører tidshorisont * 12 iterationer. */
    eksekver(parametre) {
        this.validerParametre(parametre)

        /* de fem tidsserier der bygges op måned for måned og til sidst returneres */
        const egenkapitalOverTid = [];
        const cashflowOverTid = [];
        const gaeldOverTid = [];
        const aktiverOverTid = [];
        const likviditetsholdningOverTid = [];

        /* gælden starter på det fulde lånebeløb og falder med afdragene hver måned */
        let gaeld = parametre.laanebeloeb;

        /* løbende sum af alle måneders cashflow som bruges til at beregne egenkapitalen */
        let akkumuleretCashflow = 0;

        /* løbende sum af alle måneders lejeindtægt. dette er likviditetsholdningen */
        let akkumuleretLeje = 0;

        /* vi antager 4% årlig prisstigning på ejendommen, hvilket er en fast antagelse i modellen */
        const aarligVaerdistigning = 0.04;

        /* omregner den årlige stigning til en ækvivalent månedlig faktor via renters rente. (1 + 0,04)^(1/12) - 1 ≈ 0,00327 pr. måned. Giver præcis 4% stigning over 12 måneder */
        const maanedligVaerdistigning = Math.pow(1 + aarligVaerdistigning, 1 / 12) - 1;

        /* løkken kører en gang per måned i hele tidshorisonten */
        for (let maaned = 1; maaned <= this.tidshorisont * 12; maaned++) {

            /* --- Udlejning --- */

            /* antal måneder ejendommen udlejes per år (standard: 12 = helårlig udlejning) */
            const udlejningsMaaneder = parametre.udlejningMaanederAarligt ?? 12;

            /* brøk af året med udlejning: fx 6 måneder = 0,5. Bruges til at skalere lejeindtægten til en månedlig gennemsnitsindtægt */
            const udlejningsBrøk = udlejningsMaaneder / 12;

            /* lejeindtægt denne måned: kun hvis udlejning er slået til. fx. månedlig leje 10.000 kr. * 0,5 (halvårlig) = 5.000 kr. pr. måned i gennemsnit */
            const maanedligLejeIndtægt = parametre.udlejning ? parametre.maanedligLeje * udlejningsBrøk : 0;

            /* udgifter til administration og vedligehold af udlejningen: kun hvis udlejning er slået til */
            const maanedligeUdlejningsudgifter = parametre.udlejning ? parametre.udlejningsudgifter : 0;

            /* faste månedlige driftsomkostninger (fx ejendomsskat, forsikring) */
            const maanedligeDriftomkostninger = parametre.driftsomkostninger;

            /* --- Lån og ydelse --- */

            /* renteudgiften denne måned = restgæld * månedlig rente. Falder over tid fordi gælden nedbringes med afdragene */
            const maanedligRente = gaeld * (parametre.rente / 100 / 12);

            /* er vi inden for den afdragsfrie periode? i så fald betales kun renter */
            const erAfdragsfritMaaned = maaned <= parametre.afdragsfriPeriode;

            let maanedligYdelse;
            let afdrag;

            if (erAfdragsfritMaaned) {
                /* i den afdragsfrie periode betales kun renterne. gælden falder ikke */
                maanedligYdelse = maanedligRente;
                afdrag = 0;
            } else {
                /* efter den afdragsfrie periode betales den faste annuitetsydelse. Bemærk: ydelsen beregnes altid ud fra det oprindelige lånebeløb og den fulde løbetid, ikke ud fra restgælden som er korrekt for annuitetslån. */
                maanedligYdelse = beregnMaanedligYdelse(
                    parametre.laanebeloeb,
                    parametre.rente,
                    parametre.loebetid
                );

                /* afdrag = ydelse - renteudgiften (den del der faktisk bringer gælden ned. Math.max sikrer at afdrag aldrig er negativtt) */
                afdrag = Math.max(0, maanedligYdelse - maanedligRente);
            }

            /* --- Engangsudgifter --- */

            /* alle købs-engangsudgifter (advokat, tinglysning osv.) trækkes kun i måned 1 */
            const koebsudgifterIMaaned = maaned === 1 ? this.beregnSamledeKoebsudgifter(parametre) : 0;

            /* renoveringsudgiften trækkes kun i den måned brugeren har angivet */
            const renoveringsudgifterIMaaned = maaned === parametre.renoveringstidspunkt ? parametre.planlagteRenoveringOgForbedringer : 0;

            /* --- Cashflow denne måned --- */

            /* cashflow = alle indtægter - alle udgifter denne måned. 
            Positivt cashflow = overskud, negativt = underskud */
            const cashflow = maanedligLejeIndtægt
                - maanedligeUdlejningsudgifter
                - maanedligeDriftomkostninger
                - maanedligYdelse
                - koebsudgifterIMaaned
                - renoveringsudgifterIMaaned;

            /* akkumuleret cashflow summerer alle måneders cashflow fra start til nu */
            akkumuleretCashflow += cashflow;

            /* akkumuleret leje = samlet lejeindtægt fra start til nu = likviditetsholdning */
            akkumuleretLeje += maanedligLejeIndtægt;

            /* --- Opdater gæld --- */

            /* gælden nedbringes med dette måneds afdrag. Math.max sikrer at gælden aldrig går i minus (fx sidst i løbetiden) */
            gaeld = Math.max(0, gaeld - afdrag);

            /* --- Ejendomsværdi og egenkapital --- */

            /* ejendomsværdien stiger med den månedlige faktor opløftet i antal måneder. Renters rente: jo flere måneder, jo større stigning */
            const aktuelEjendomsvaerdi = parametre.ejendomspris
                * Math.pow(1 + maanedligVaerdistigning, maaned);

            /* aktiver = ejendomsværdi (i denne model ejer man kun ejendommen) */
            const aktiver = aktuelEjendomsvaerdi;

            /* egenkapital er hvad der er tilbage hvis man solgte ejendommen nu: ejendomsværdi minus restgæld, plus det akkumulerede cashflow. Akkumuleret cashflow medtages fordi det afspejler den reelle position, så man har enten tjent eller tabt disse penge løbende */
            const egenkapital = aktuelEjendomsvaerdi - gaeld + akkumuleretCashflow;

            /* gem denne måneds værdier i de fem tidsserier (Math.round fjerner decimaler) */
            cashflowOverTid.push(Math.round(cashflow));
            gaeldOverTid.push(Math.round(gaeld));
            egenkapitalOverTid.push(Math.round(egenkapital));
            aktiverOverTid.push(Math.round(aktiver));
            likviditetsholdningOverTid.push(Math.round(akkumuleretLeje));
        }

        /* returner et SimuleringResultat-objekt med de fem færdige tidsserier */
        return new simuleringResultat(
            egenkapitalOverTid,
            cashflowOverTid,
            gaeldOverTid,
            aktiverOverTid,
            likviditetsholdningOverTid
        );
    }

    /* beregnSamledeKoebsudgifter() samler alle købsrelaterede engangsudgifter. Den er lavet som en separat metode for at undgå at gentage samme udregning inde i løkken. */
    beregnSamledeKoebsudgifter(parametre) {
        return parametre.koebsomkostninger
        + parametre.advokatudgifter
        + parametre.tinglysningsudgifter
        + parametre.overtagelsesudgifter;
    }

    /* validerParametre() sikrer at simuleringen ikke køres med manglende eller ugyldige hovedtal */
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

        if (parametre.afdragsfriPeriode > parametre.loebetid) {
            throw new Error('Afdragsfri periode må ikke overstige løbetid');
        }

        if (parametre.udlejningMaanederAarligt != null) {
            if (parametre.udlejningMaanederAarligt < 1 || parametre.udlejningMaanederAarligt > 12) {
                throw new Error('Antal måneder til udlejning skal være mellem 1 og 12');
            }
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
