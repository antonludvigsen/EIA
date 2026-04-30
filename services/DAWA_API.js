
class DAWA_API {

    /* --- henter en adresse fra DAWA-api'et --- */
    async hentAdresse(søgning) {
        const søgningKodet = encodeURIComponent(søgning); /* encodeURIComponent() bruges fordi brugerens søgning kan indeholde mellemrum, æ, ø, å eller andre tegn der skal kodes korrekt for at virke i en URL. */
        const url = `https://api.dataforsyningen.dk/autocomplete?q=${søgningKodet}&type=adresse`; /* bygger URL'en til DAWA's autocomplete-endpoint.*/

        const svar = await fetch(url); /* sender HTTP-requesten til DAWA og venter på svar. */

        if (!svar.ok) { /* hvis svaret vi fetcher fra DAWA ikke er ok, sender vi en fejl tilbage */
            throw new Error(`DAWA-API fejl: ${svar.status}`);
        }

        const data = await svar.json(); /* parser svaret fra DAWA som JSON */
        return data; /* og returnerer det */
    };

        /* --- henter detaljerede adresseoplysninger fra DAWA på baggrund af adresseId. strukturen returnerer adgangsAdresseId, som vi videregiver til BBR-kaldet. --- */
    async hentAdresseDetaljer(adresseId) {
        const url = `https://api.dataforsyningen.dk/adresser/${adresseId}?format=json`;

        const svar = await fetch(url);

        if (!svar.ok) {
            throw new Error(`DAWA detalje-API fejl: ${svar.status}`);
        }

        const data = await svar.json();

        let etage = null;
        if (data.etage) {
            etage = data.etage;
        }

        let dør = null;
        if (data.dør) {
            dør = data.dør;
        }

        return {
            vejnavn: data.adgangsadresse.vejstykke.navn,
            husnummer: data.adgangsadresse.husnr,
            etage: etage,
            dør: dør,
            postnummer: data.adgangsadresse.postnummer.nr,
            bynavn: data.adgangsadresse.postnummer.navn,
            adgangsAdresseId: data.adgangsadresse.id
        };
    };
}

/* eksporterer funktionen så andre filer kan importere den. */
module.exports = new DAWA_API();
