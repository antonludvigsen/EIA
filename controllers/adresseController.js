
const DAWA_API = require('../services/DAWA_API');

class AdresseController {

    /* Vi validerer søgeteksten i sin egen funktion så den kan unit-testes, i stedet for at den isoleres i findAdresse */
    validerSøgeTekst(søgetekst) {
        if (!søgetekst || søgetekst.trim() === '') { /* validering og fejlhåndtering af adressesøgningen */
            return false;
        } else {
            return true;
        }
    };

    findAdresse = async (req, res) => { /* arrow functions husker automatisk hvem this er, selv når de gives videre som callbacks til Express. Normale metoder glemmer det.
        req = indkommende HTTP-request (URL, parametre, body).
        res = sende svar tilbage til browseren */

        try {
            const søgetekst = req.query.q; /* henter query-parameter q fra URL'en, altså selve søgningen på en adresse */

            if (!this.validerSøgeTekst(søgetekst)) { /* henviser til den øvrige funktion. hvis valideringen er false, sendes en fejl-status ud */
                return res.status(400).json({ fejl: 'Søgetekst mangler' });
            }

            const adresser = await DAWA_API.hentAdresse(søgetekst); /* kalder DAWA og venter på svar */
            res.status(200).json(adresser); /* sender tilbage til browseren i JSON med godkendt statuskode */

        } catch (fejl) { /* Hvis der er serverfejl skal dette også håndteres */
            console.error('Fejl i findAdresse:', fejl);
            res.status(500).json({ fejl: 'Kunne ikke hente adresser fra DAWA' });
        }
    }

}

/* eksportere til sidst klassen som et enkelt objekt */
const adresseController = new AdresseController();
module.exports = adresseController;