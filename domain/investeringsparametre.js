
/* InvesteringsParametre repræsenterer de økonomiske input, som brugeren indtaster i den guidede investeringsformular.
Klassen samler køb, finansiering, renovering, drift og udlejning i ét objekt, så Simulering senere kan beregne cashflow, gæld og egenkapital ud fra de samme data. */

class InvesteringsParametre {
    constructor(data) {
        /* ejendomspris bruges til at beregne egenkapitalen over tid */
        this.ejendomspris = data.ejendomspris;

        /* koebsomkostninger er ekstra omkostninger ved køb, fx rådgivning og gebyrer */
        this.koebsomkostninger = data.koebsomkostninger || 0;

        /* advokatudgifter er udgifter til juridisk rådgivning ved køb */
        this.advokatudgifter = data.advokatudgifter || 0;

        /* tinglysningsudgifter er offentlige/gebyrmæssige udgifter ved registrering af køb/lån */
        this.tinglysningsudgifter = data.tinglysningsudgifter || 0;

        /* overtagelsesudgifter dækker øvrige udgifter i forbindelse med overtagelse */
        this.overtagelsesudgifter = data.overtagelsesudgifter || 0;

        /* --- Finansiering og lån --- */

        /* laanebeloeb er det beløb brugeren finansierer gennem lån */
        this.laanebeloeb = data.laanebeloeb;

        /* rente gemmes som procent, fx 4 for 4% */
        this.rente = data.rente;

        /* loebetid er lånets løbetid i år, fx 30 */
        this.loebetid = data.loebetid;

        /* afdragsfriPeriode angiver hvor mange år der ikke afdrages på lånet */
        this.afdragsfriPeriode = data.afdragsfriPeriode || 0;

        /* laanetype er et informationsfelt, fx Realkreditlaan eller Banklaan */
        this.laanetype = data.laanetype || 'Realkreditlaan';

        /* --- Renovering og forbedringer --- */
        
        /* planlagteRenoveringOgForbedringer er et samlet beløb for planlagte forbedringer */
        this.planlagteRenoveringOgForberedringer = data.planlagteRenoveringOgForberedringer || 0;

        /* renoveringstidspunkt angiver hvilket år renoveringen sker, fx år 5 */
        this.renoveringstidspunkt = data.renoveringstidspunkt || null;

        /* --- Drift --- */

        /* driftsomkostninger er månedlige udgifter til drift af ejendommen */
        this.driftsomkostninger = data.driftsomkostninger || 0;

        /* --- Udlejning --- */

        /* udlejning er true/false og angiver om ejendommen skal bruges til udlejning */
        this.udlejning = data.udlejning || false;

        /* maanedligLeje er den månedlige lejeindtægt, hvis ejendommen udlejes */
        this.maanedligLeje = data.maanedligLeje || 0;

        /* udlejningsudgifter er månedlige udgifter forbundet med udlejning */
        this.udlejningsudgifter = data.udlejningsudgifter || 0;
    }

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
            planlagteRenoveringOgForberedringer: this.planlagteRenoveringOgForberedringer,
            renoveringstidspunkt: this.renoveringstidspunkt,
            driftsomkostninger: this.driftsomkostninger,
            udlejning: this.udlejning,
            maanedligLeje: this.udlejning,
            udlejningsudgifter: this.udlejningsudgifter
        }
    }

    /* opdater() bruges hvis brugeren senere ændrer tal i investeringscasen.
    Det passer til opgavekravet om, at tallene senere skal kunne ændres og beregnes igen. */
    opdater(data) {
        Object.assign(this, data);
    }
}

module.exports = InvesteringsParametre


