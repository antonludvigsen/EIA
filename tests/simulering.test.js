const { Simulering, beregnMaanedligYdelse } = require('../domain/Simulering');
const InvesteringsParametre = require('../domain/InvesteringsParametre');

test('beregner månedlig ydelse større end 0', () => {
    const ydelse = beregnMaanedligYdelse(2000000, 4, 30);

    expect(ydelse).toBeGreaterThan(0);
});

test('simulering returnerer et resultat for hvert år', () => {
    const parametre = new InvesteringsParametre({
        ejendomspris: 2500000,
        koebsomkostninger: 50000,
        advokatudgifter: 15000,
        tinglysningsudgifter: 20000,
        overtagelsesudgifter: 10000,
        laanebeloeb: 2000000,
        rente: 4,
        loebetid: 30,
        afdragsfriPeriode: 0,
        laanetype: 'Realkreditlaan',
        planlagteRenoveringOgForbedringer: 100000,
        renoveringstidspunkt: 5,
        driftsomkostninger: 3000,
        udlejning: true,
        maanedligLeje: 12000,
        udlejningsudgifter: 1000
    });

    const simulering = new Simulering(30);
    const resultat = simulering.eksekver(parametre);

    expect(resultat.egenkapitalOverTid.length).toBe(30);
    expect(resultat.cashflowOverTid.length).toBe(30);
    expect(resultat.gaeldOverTid.length).toBe(30);
});

test('gæld falder over tid ved lån med afdrag', () => {
    const parametre = new InvesteringsParametre({
        ejendomspris: 2500000,
        laanebeloeb: 2000000,
        rente: 4,
        loebetid: 30,
        afdragsfriPeriode: 0,
        driftsomkostninger: 3000,
        udlejning: true,
        maanedligLeje: 12000,
        udlejningsudgifter: 1000
    });

    const simulering = new Simulering(30);
    const resultat = simulering.eksekver(parametre);

    expect(resultat.gaeldOverTid[29]).toBeLessThan(resultat.gaeldOverTid[0]);
});
