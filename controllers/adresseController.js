
/* adresseController.js modtager HTTP-kald fra adresse-routeren og delegerer dem til DAWA_API-servicen. Selve API-kaldet håndteres af DAWA_API, som controlleren ikke kender til udover dens offentlige interface.

Controlleren er ansvarlig for validering af input og korrekte HTTP-statuskoder i svaret. */

const DAWA_API = require('../services/DAWA_API');

class AdresseController {

    /* validerSøgeTekst() er udskilt som en separat metode frem for at ligge inde i findAdresse(),
    fordi den dermed kan unit-testes direkte. Det er et eksempel på testbarhed som designprincip hvor en funktion der kun afhænger af sit input er langt nemmere at teste end en der er begravet i middleware-logik. "søgetekst" er den streng brugeren har sendt via query-parameteren ?q=
    returnerer true hvis søgeteksten er gyldig, false hvis den er tom eller mangler */
    validerSøgeTekst(søgetekst) {
        if (!søgetekst || søgetekst.trim() === '') {
            return false;
        } else {
            return true;
        }
    };

    /* findAdresse() er det endpoint browseren kalder, mens brugeren skriver i søgefeltet.
    Den henter autocomplete-forslag fra DAWA og returnerer dem som JSON til frontend. 
    arrow function bruges så this forbliver bundet korrekt når Express kalder den som callback, 
    hvor en normal metode ville miste sin this-binding og validerSøgeTekst() ville fejle. */
    findAdresse = async (req, res) => {
        try {
            const søgetekst = req.query.q; /* "req.query.q" indeholder søgeteksten fra URL'en, fx. "/api/adresse/soeg?q=Ordrup" */

            /* afviser tomme forespørgsler tidligt frem for at sende et meningsløst kald til DAWA */
            if (!this.validerSøgeTekst(søgetekst)) {
                return res.status(400).json({ fejl: 'Søgetekst mangler' });
            }

            const adresser = await DAWA_API.hentAdresse(søgetekst);
            res.status(200).json(adresser);

        } catch (fejl) {
            console.error('Fejl i findAdresse:', fejl);
            res.status(500).json({ fejl: 'Kunne ikke hente adresser fra DAWA' });
        }
    }

}

const adresseController = new AdresseController();

module.exports = adresseController;
