/* UNITTEST 2:

I denne test vil vi med Jest unit teste hvordan funktionen "beregnMaanedligYdelse(laanebeloeb, rente, antalMaaneder)" fra /domain/simulering.js opfører sig. 
Funktionen beregner den månedlige ydelse på et annuitetslån: */

const { beregnMaanedligYdelse } = require('../domain/simulering');

describe('beregnMaanedligYdelse', () => {

    /* test 1: vi tester at funktionen beregner den korrekte månedlige ydelse for et standardlån */
    test('beregner korrekt månedlig ydelse med standard annuitet', () => {
        const ydelse = beregnMaanedligYdelse(1000000, 4, 360); /* 1.000.000 kr. lån, 4% rente, 360 måneder.  */
        expect(ydelse).toBeCloseTo(4774, 0); /* Forventet månedlig ydelse ca. 4.774 kr. */
    });

    /* test 2: vi tester at funktionen håndterer 0% rente korrekt (simpel division) */
    test('returnerer simpel division ved 0% rente', () => {
        const ydelse = beregnMaanedligYdelse(1200000, 0, 120);
        expect(ydelse).toBeCloseTo(10000, 0);
    });

    /* test 3: vi tester at en højere rente resulterer i en højere månedlig ydelse */
    test('højere rente giver højere månedlig ydelse', () => {
        const lav = beregnMaanedligYdelse(1000000, 1, 360); 
        const høj = beregnMaanedligYdelse(1000000, 5, 360);
        expect(høj).toBeGreaterThan(lav);
    });

});
