
class DAWA_API {

    /* henter en adresse fra DAWA-api'et */
    async hentAdresse(søgning) { /* søgning = fx. "Ordrup Jagtvej 21, 2920 Charlottenlund" */
        const søgningKodet = encodeURIComponent(søgning); /* søgningKodet = "Ordrup%20Jagtvej%2021%2C%202920%20Charlottenlund" */
        const url = `https://api.dataforsyningen.dk/autocomplete?q=${søgningKodet}&type=adresse`; /* bygger URL'en til DAWA's autocomplete-endpoint.*/

        const svar = await fetch(url); /* sender HTTP-requesten til DAWA og venter på svar. */

        if (!svar.ok) { /* hvis svaret vi fetcher fra DAWA ikke er ok, sender vi en fejl tilbage */
            throw new Error(`DAWA-API fejl: ${svar.status}`);
        }

        const data = await svar.json(); /* parser svaret fra DAWA som JSON */
        return data; /* og returnerer det */
    };

    /* videregiver adresseId fra DAWA-kaldet til BBR-kaldet */
    async hentAdresseDetaljer(adresseId) { /* fx. "0a3f50a3-eb37-32b8-e044-0003ba298018" */
        const url = `https://api.dataforsyningen.dk/adresser/${adresseId}?format=json&srid=25832`;

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
            adgangsAdresseId: data.adgangsadresse.id,
            x: data.adgangsadresse.adgangspunkt.koordinater[0],
            y: data.adgangsadresse.adgangspunkt.koordinater[1]
        };
    };
}

/* eksporterer funktionen så andre filer kan importere den. */
module.exports = new DAWA_API();
