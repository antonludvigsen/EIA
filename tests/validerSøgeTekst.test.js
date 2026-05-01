/* UNITTEST 1:

I denne test vil vi med Jest unit teste hvordan funktionen "validerSøgeTekst(søgetekst)" fra /adresseController.js opfører sig. Funktionen tester og validerer brugerens søgeinput: */

const { validerSøgeTekst } = require('../controllers/adresseController');

/* test 1: vi tester for en tom streng */
test('afviser tom streng', () => {
    expect(validerSøgeTekst('')).toBe(false);
});

/* test 2: vi tester for strenge kun med mellemrum */
test('afviser streng med kun mellemrum', () => {
    expect(validerSøgeTekst('  ')).toBe(false);
});

/* test 3: skal godkende hvis søgeteksten er gyldig */
test('godkender gyldig søgetekst', () => {
    expect(validerSøgeTekst('Birkegade')).toBe(true);
});

