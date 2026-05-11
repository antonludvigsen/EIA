/* DAWA_API.js håndterer al kommunikation med DAWA */

class DAWA_API {

    /* hentAdresse() bruges af søgefeltet til at levere autocomplete-forslag mens brugeren skriver.
    Den modtager en fritekst-søgestreng og returnerer et array af matchende adresser fra DAWA. */
    async hentAdresse(søgning) {
        const søgningKodet = encodeURIComponent(søgning); /* encodeURIComponent sikrer at mellemrum og specialtegn i søgeteksten ikke ødelægger URL'en */

        /* type=adresse begrænser resultater til fulde adresser. Uden den returneres også vejnavne og postnumre */
        const url = `https://api.dataforsyningen.dk/autocomplete?q=${søgningKodet}&type=adresse`;

        const svar = await fetch(url);

        if (!svar.ok) {
            throw new Error(`DAWA-API fejl: ${svar.status}`);
        }

        return svar.json();
    };

    /* hentAdresseDetaljer() bruges efter brugeren har valgt en konkret adresse fra autocomplete-listen.
    Den modtager det unikke DAWA-adresse-ID og returnerer et struktureret objekt med adressefelter, koordinater og adgangsAdresseId
    "adgangsAdresseId" er nødvendigt fordi BBR anvender dette som søgeparameter. */
    async hentAdresseDetaljer(adresseId) {
        const url = `https://api.dataforsyningen.dk/adresser/${adresseId}?format=json&srid=25832`; /* srid=25832 angiver koordinatsystemet EPSG:25832 (UTM32N), som er det koordinatsystem KORT_API forventer. Det er det officielle danske koordinatsystem og angiver koordinater i meter. */
        const svar = await fetch(url);

        if (!svar.ok) {
            throw new Error(`DAWA detalje-API fejl: ${svar.status}`);
        }

        const data = await svar.json();

        /* etage og dør er valgfrie felter — ikke alle adresser har dem. Vi sætter dem eksplicit til null frem for at sende undefined videre, da databasen og downstream-services forventer null for tomme felter. */
        let etage = null;
        if (data.etage) {
            etage = data.etage;
        }

        let dør = null;
        if (data.dør) {
            dør = data.dør;
        }

        /* vi oversætter DAWA's interne feltnavne (data.adgangsadresse.vejstykke.navn osv.) til de kortere, applikationsspecifikke navne vi bruger i resten af systemet. */
        return {
            vejnavn: data.adgangsadresse.vejstykke.navn,
            husnummer: data.adgangsadresse.husnr,
            etage: etage,
            dør: dør,
            postnummer: data.adgangsadresse.postnummer.nr,
            bynavn: data.adgangsadresse.postnummer.navn,
            adgangsAdresseId: data.adgangsadresse.id, /* bruges som søgeparameter i BBR-kaldet */
            x: data.adgangsadresse.adgangspunkt.koordinater[0],
            y: data.adgangsadresse.adgangspunkt.koordinater[1]
        };
    };
}

module.exports = new DAWA_API();
