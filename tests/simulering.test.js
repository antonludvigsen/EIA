/* UNITTEST 3:

I denne test vil vi med Jest unit teste hvordan klassen "Simulering" fra /domain/simulering.js opfører sig. 
Klassen simulerer en ejendomsinvestering måned for måned over en given tidshorisont: */

const { Simulering } = require('../domain/simulering');

describe('Simulering.eksekver()', () => {

    const standardParametre = {
        ejendomspris:                      3000000,
        koebsomkostninger:                 50000,
        advokatudgifter:                   30000,
        tinglysningsudgifter:              10000,
        overtagelsesudgifter:              5000,
        laanebeloeb:                       2400000,
        rente:                             3.5,
        loebetid:                          360,
        afdragsfriPeriode:                 0,
        planlagteRenoveringOgForbedringer: 0,
        renoveringstidspunkt:              null,
        driftsomkostninger:                2000,
        udlejning:                         false,
        maanedligLeje:                     0,
        udlejningsudgifter:                0,
        udlejningMaanederAarligt:          12
    };

    /* test 1: vi tester at eksekver() returnerer arrays med den korrekte længde svarende til tidshorisont i måneder */
    test('returnerer tre arrays med korrekt længde for 30 år', () => {
        const sim = new Simulering(30);
        const resultat = sim.eksekver(standardParametre);
        expect(resultat.egenkapitalOverTid).toHaveLength(360);
        expect(resultat.cashflowOverTid).toHaveLength(360);
        expect(resultat.gaeldOverTid).toHaveLength(360);
    });

    /* test 2: vi tester at gælden falder over tid når der betales normale afdrag */
    test('gæld falder over tid med normale afdrag', () => {
        const sim = new Simulering(30);
        const resultat = sim.eksekver(standardParametre);
        const gaeld = resultat.gaeldOverTid;
        expect(gaeld[0]).toBeLessThan(standardParametre.laanebeloeb);
        expect(gaeld[gaeld.length - 1]).toBeLessThan(gaeld[0]);
    });

    /* test 3: vi tester at valideringen kaster en fejl når ejendomsprisen er 0 */
    test('validerParametre kaster fejl ved manglende ejendomspris', () => {
        const sim = new Simulering(30);
        expect(() => sim.eksekver({ ...standardParametre, ejendomspris: 0 }))
            .toThrow('Ejendomspris skal være større end 0');
    });

});
