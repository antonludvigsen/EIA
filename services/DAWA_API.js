/* "EksternAPIService" håndterer alle kald til eksterne API'er. Hverken controllere eller domæneklasser må kalde eksterne API'er direkte. Al ekstern kommunikation går gennem denne fil. */

require('dotenv').config(); /* vi starter med at kalde .env filen så brugernavne og adgangskoder kan indlæses */

class DAWA_API {

    /* --- henter en adresse fra DAWA-api'et --- */
    async hentAdresse(søgning) {
        const søgningKodet = encodeURIComponent(søgning); /* encodeURIComponent() bruges fordi brugerens søgning kan indeholde mellemrum, æ, ø, å eller andre tegn der skal kodes korrekt for at virke i en URL. */
        const autocompleteURL = `https://api.dataforsyningen.dk/autocomplete?q=${søgningKodet}&type=adresse`; /* bygger URL'en til DAWA's autocomplete-endpoint.*/

        const response = await fetch(autocompleteURL); /* sender HTTP-requesten til DAWA og venter på svar. */

        if (!response.ok) { /* hvis svaret vi fetcher fra DAWA ikke er ok, sender vi en fejl tilbage */
            throw new Error(`DAWA-API fejl: ${response.status}`);
        }

        const data = await response.json(); /* parser svaret fra DAWA som JSON */
        return data; /* og returnerer det */
    };

}

/* eksporterer funktionen så andre filer kan importere den. */
module.exports = new DAWA_API();
