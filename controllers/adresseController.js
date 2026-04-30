/* (..) betyder "gå en mappe ud", vi går fra services ud til roden og ind til controllers */
const eksternAPIService = require('../services/DAWA_API');

class AdresseController {

    /* Vi validerer søgeteksten i sin egen funktion så den kan unit-testes, i stedet for at den isoleres i findAdresse */
    validerSøgeTekst(søgetekst) {
        if (!søgetekst || søgetekst.trim() === '') { /* validering og fejlhåndtering af adressesøgningen */
            return false;
        } else {
            return true;
        }
    };

    async findAdresse(req, res) { /* modtager Express request og response objekter.
        req = indkommende HTTP-request (URL, parametre, body).
        res = sende svar tilbage til browseren */

        try {
            const søgetekst = req.query.q; /* henter query-parameter q fra URL'en, altså selve søgningen på en adresse */

            if (!adresseController.validerSøgeTekst(søgetekst)) { /* henviser til den øvrige funktion. hvis valideringen er false, sendes en fejl-status ud */
                return res.status(400).json({ fejl: 'Søgetekst mangler' });
            }

            const adresser = await eksternAPIService.hentAdresse(søgetekst); /* kalder DAWA og venter på svar */
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
