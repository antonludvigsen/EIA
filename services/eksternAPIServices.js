/* "EksternAPIService" håndterer alle kald til eksterne API'er. 
Hverken controllere eller domæneklasser må kalde eksterne API'er direkte. 
Al ekstern kommunikation går gennem denne fil. */

require('dotenv').config(); /* vi starter med at kalde .env filen så brugernavne og adgangskoder kan indlæses */

/* --- henter en adresse fra DAWA-api'et --- */
async function hentAdresse(søgning) { /* async: netværkskald tager tid */
    const url = `https://api.dataforsyningen.dk/autocomplete?q=${encodeURIComponent(søgning)}&type=adresse`; /* bygger URL'en til DAWA's autocomplete-endpoint. encodeURIComponent() bruges fordi brugerens søgning kan indeholde mellemrum, æ, ø, å eller andre tegn der skal kodes korrekt for at virke i en URL.*/

    const response = await fetch(url); /* sender HTTP-requesten til DAWA og venter på svar. */

    if (!response.ok) { /* Fejhåndtering: hvis svaret vi fetcher fra DAWA ikke er ok, sender vi en fejl tilbage */
        throw new Error(`DAWA-API fejl: ${response.status}`);
    }

    const data = await response.json(); /* parser svaret fra DAWA som JSON */
    return data; /* og returnerer det */
}

/* --- Hentning af BBR-data ---  */
async function hentBBRData(adresseId) {
    const brugernavn = process.env.BBR_BRUGERNAVN;
    const password = process.env.BBR_PASSWORD;

    const url = `https://services.datafordeler.dk/BBR/BBRPublic/1/REST/bygning?husnummer=${encodeURIComponent(adresseId)}&username=${brugernavn}&password=${password}&format=JSON`;
    /* https://services.datafordeler.dk/BBR/BBRPublic/1/REST/bygning er selve endpoint-adressen til BBR's bygning-metode. */
    /* ? markerer starten på query-parametre, altså de filtre vi sender med i kaldet. */
    /* husnummer=${encodeURIComponent(adresseId)} sender DAWA's adresse-ID som parameter. */
    /* &username=${brugernavn} sender brugernavnet fra .env. & adskiller parametre fra hinanden. */
    /* &password=${password} sender passwordet fra .env. Det er derfor vi aldrig hardkoder det direkte i koden, men læser det fra miljøvariablen i stedet. */
    /* &format=JSON fortæller BBR at vi vil have svaret i JSON-format. Uden den parameter returnerer BBR XML som standard. */

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`BBR-API fejl: ${response.status}`);
    }

    const data = await response.json();

    /* BBR returnerer et array af bygninger, vi tager den første */
    if (!data || data.length === 0) {
        throw new Error('Ingen BBR-data fundet for denne adresse');
    }

    /* Udtrækker de relevante felter fra API'ets response vi skal bruge til ejendomsprofilen */
    const bygning = data[0];
    return {
        ejendomstype: bygning.byg021BygningensAnvendelse || null,
        byggeaar: bygning.byg026Opførelsesår || null,
        boligareal: bygning.byg038SamletBygningsareal || null,
        antalVaerelser: null, /* Her sætter vi bevidst null direkte fordi antal værelser ikke kommer fra bygning-endpointet men fra enhed-endpointet. Hentes fra enhed-endpoint senere */
        grundareal: bygning.byg041BebyggetAreal || null,
        senestHentet: new Date().toISOString() /* new Date() opretter et JavaScript Date-objekt med det aktuelle tidspunkt og konvertere det (fx 2026-04-29T13:22:00.000Z). Det er det format databasen forventer i DATETIME-kolonnen senestHentet. */

    }; /* BBR's feltnavne som byg021BygningensAnvendelse og byg026Opførelsesår er interne BBR-koder der er svære at læse og arbejde med i resten af koden. Vi oversætter dem til vores egne navne fra DCD'et, altså ejendomstype, byggeaar osv. Hvis BBR en dag ændrer deres feltnavn, er der kun ét sted at rette det, nemlig her i eksternApiService.js. */
}

/* --- henter detaljerede adresseoplysninger fra DAWA på baggrund af adresseId --- */
async function hentAdresseDetaljer(adresseId) {
    const url = `https://api.dataforsyningen.dk/adgangsadresser/${adresseId}?format=json&struktur=mini`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`DAWA detalje-API fejl: ${response.status}`);
    }

    const data = await response.json();

    /* mapper DAWA's feltnavne til vores egne fra DCD'et */
    return {
        vejnavn: data.vejnavn,
        husnummer: data.husnr,
        postnummer: data.postnr,
        bynavn: data.postnrnavn
    };
}

/* eksporterer funktionen så andre filer kan importere den. Vi eksporterer som et objekt med navngivne metoder, så vi senere kan tilføje hentBBRData og hentLuftfoto til samme objekt. */
module.exports = {
    hentAdresse,
    hentBBRData,
    hentAdresseDetaljer
};