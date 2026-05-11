
/* InvesteringsParametre repræsenterer de økonomiske input, som brugeren indtaster i den guidede investeringsformular. 

Klassen samler køb, finansiering, renovering, drift og udlejning i et objekt, så Simulering.eksekver() kan beregne cashflow, gæld, egenkapital, likvid og aktiver ud fra de samme data. 

Konstruktøren sætter standardværdier for valgfrie felter
hentData() eksporterer alle felter som et plain objekt
opdater() opdaterer felterne med nye data */

class InvesteringsParametre {
    constructor(data) {

        /* --- Køb --- */

        this.ejendomspris = data.ejendomspris; /* ejendomspris bruges til at beregne egenkapitalen over tid */
        this.koebsomkostninger = data.koebsomkostninger || 0; /* koebsomkostninger er ekstra omkostninger ved køb, fx rådgivning og gebyrer */
        this.advokatudgifter = data.advokatudgifter || 0; /* advokatudgifter er udgifter til juridisk rådgivning ved køb */
        this.tinglysningsudgifter = data.tinglysningsudgifter || 0; /* tinglysningsudgifter er offentlige/gebyrmæssige udgifter ved registrering af køb/lån */
        this.overtagelsesudgifter = data.overtagelsesudgifter || 0; /* overtagelsesudgifter dækker øvrige udgifter i forbindelse med overtagelse */

        /* --- Finansiering og lån --- */

        this.laanebeloeb = data.laanebeloeb; /* laanebeloeb er det beløb brugeren finansierer gennem lån */
        this.rente = data.rente; /* rente gemmes som procent, fx 4 for 4% */
        this.loebetid = data.loebetid; /* loebetid er lånets løbetid i måneder, fx 360 */
        this.afdragsfriPeriode = data.afdragsfriPeriode || 0; /* afdragsfriPeriode angiver hvor mange måneder der ikke afdrages på lånet */
        this.laanetype = data.laanetype || 'Realkreditlaan'; /* laanetype er et informationsfelt, fx Realkreditlaan eller Banklaan */

        /* --- Renovering og forbedringer --- */

        this.planlagteRenoveringOgForbedringer = data.planlagteRenoveringOgForbedringer || 0; /* planlagteRenoveringOgForbedringer er et samlet beløb for planlagte forbedringer */
        this.renoveringstidspunkt = data.renoveringstidspunkt || null; /* renoveringstidspunkt angiver hvilken måned renoveringen sker, fx måned 24 */

        /* --- Drift --- */

        this.driftsomkostninger = data.driftsomkostninger || 0; /* driftsomkostninger er månedlige udgifter til drift af ejendommen */

        /* --- Udlejning --- */

        this.udlejning = data.udlejning || false; /* udlejning er true/false og angiver om ejendommen skal bruges til udlejning */
        this.maanedligLeje = data.maanedligLeje || 0; /* maanedligLeje er den månedlige lejeindtægt, hvis ejendommen udlejes */
        this.udlejningsudgifter = data.udlejningsudgifter || 0; /* udlejningsudgifter er månedlige udgifter forbundet med udlejning */
        this.udlejningMaanederAarligt = data.udlejningMaanederAarligt || 12; /* udlejningMaanederAarligt angiver hvor mange måneder ejendommen udlejes per år, fx 6 for halvårlig udlejning */
    }

    /* hentData() returnerer alle felter som et plain JavaScript-objekt. Bruges når man skal sende parametrene videre til et eksternt lag (fx en API-respons eller repositoriet) uden at medsende klassens metoder */
    hentData() {
        return {
            ejendomspris: this.ejendomspris,
            koebsomkostninger: this.koebsomkostninger,
            advokatudgifter: this.advokatudgifter,
            tinglysningsudgifter: this.tinglysningsudgifter,
            overtagelsesudgifter: this.overtagelsesudgifter,
            laanebeloeb: this.laanebeloeb,
            rente: this.rente,
            loebetid: this.loebetid,
            afdragsfriPeriode: this.afdragsfriPeriode,
            laanetype: this.laanetype,
            planlagteRenoveringOgForbedringer: this.planlagteRenoveringOgForbedringer,
            renoveringstidspunkt: this.renoveringstidspunkt,
            driftsomkostninger: this.driftsomkostninger,
            udlejning: this.udlejning,
            maanedligLeje: this.maanedligLeje,
            udlejningsudgifter: this.udlejningsudgifter,
            udlejningMaanederAarligt: this.udlejningMaanederAarligt
        }
    }

    /* opdater() overskriver eksisterende felter med nye værdier fra data-objektet. */
    opdater(data) {
        Object.assign(this, data); /* Object.assign kopierer kun de felter der faktisk er til stede i data. felter der ikke er med forbliver uændrede. */
    }
}

module.exports = InvesteringsParametre
