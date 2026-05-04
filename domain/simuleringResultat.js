class SimuleringResultat {
    constructor(egenkapitalOverTid, cashflowOverTid, gaeldOverTid) {
        this.egenkapitalOverTid = egenkapitalOverTid;
        this.cashflowOverTid = cashflowOverTid;
        this.gaeldOverTid = gaeldOverTid;
        this.genereretDato = new Date();
    }
}

module.exports = SimuleringResultat