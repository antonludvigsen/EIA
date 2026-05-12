/* SimuleringResultat er objektet der bærer resultatet af en simulering. 
Det modtager fem månedlige arrays fra Simulering.eksekver() og beregner automatisk fem tilsvarende årlige arrays ved at sample det 12. element i hvert år.  */

class SimuleringResultat {

    /* konstruktøren modtager alle fem tidsserier som månedlige arrays af heltal.
    genereretDato sættes her så tidsstemplet afspejler hvornår beregningen skete, ikke hvornår resultatet evt. gemmes i databasen. */
    constructor(
        egenkapitalOverTid,
        cashflowOverTid,
        gaeldOverTid,
        aktiverOverTid,
        likviditetsholdningOverTid
    ) {
        /* månedligt */
        this.egenkapitalOverTid         = egenkapitalOverTid;
        this.cashflowOverTid            = cashflowOverTid;
        this.gaeldOverTid               = gaeldOverTid;
        this.aktiverOverTid             = aktiverOverTid;
        this.likviditetsholdningOverTid = likviditetsholdningOverTid;
        this.genereretDato              = new Date();

        /* årligt */
        this.egenkapitalAarligt         = this.hentAarligeVaerdier(egenkapitalOverTid);
        this.cashflowAarligt            = this.hentAarligeVaerdier(cashflowOverTid);
        this.gaeldAarligt               = this.hentAarligeVaerdier(gaeldOverTid);
        this.aktiverAarligt             = this.hentAarligeVaerdier(aktiverOverTid);
        this.likviditetsholdningAarligt = this.hentAarligeVaerdier(likviditetsholdningOverTid);
    }

    /* hentAarligeVaerdier() tager værdien ved slutningen af hvert år (index 11, 23, 35...) fra et månedligt array og returnerer et array med en værdi per år. Index 11 er december i år 1 (0-baseret), index 23 er december i år 2 osv. */
    hentAarligeVaerdier(maanedligArray) {
        const aarlige = [];
        for (let i = 11; i < maanedligArray.length; i += 12) {
            aarlige.push(maanedligArray[i]);
        }
        return aarlige;
    }
}

module.exports = SimuleringResultat