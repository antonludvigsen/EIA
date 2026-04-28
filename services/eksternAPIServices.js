/* "EksternAPIService" håndterer alle kald til eksterne API'er. 
Hverken controllere eller domæneklasser må kalde eksterne API'er direkte. 
Al ekstern kommunikation går gennem denne fil. */

/* funktionen der henter en adresse fra DAWA-api'et */
async function hentAdresse(søgning) { /* async: netværkskald tager tid */
    const url = `https://api.dataforsyningen.dk/autocomplete?q=${encodeURIComponent(søgning)}&type=adresse`; /* bygger URL'en til DAWA's autocomplete-endpoint. encodeURIComponent() bruges fordi brugerens søgning kan indeholde mellemrum, æ, ø, å eller andre tegn der skal kodes korrekt for at virke i en URL.*/

    const response = await fetch(url); /* sender HTTP-requesten til DAWA og venter på svar. */

    if (!response.ok) { /* Fejhåndtering: hvis svaret vi fetcher fra DAWA ikke er ok, sender vi en fejl tilbage */
        throw new Error(`DAWA-API fejl: ${response.status}`);
    }

    const data = await response.json(); /* parser svaret fra DAWA som JSON */
    return data; /* og returnerer det */
}

/* eksporterer funktionen så andre filer kan importere den. Vi eksporterer som et objekt med navngivne metoder, så vi senere kan tilføje hentBBRData og hentLuftfoto til samme objekt. */
module.exports = {
    hentAdresse
}