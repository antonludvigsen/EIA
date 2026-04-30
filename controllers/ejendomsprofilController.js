const eksternAPIService = require('../services/BBR_API');

class EjendomsprofilController {

    /* henter adressedata fra DAWA og BBR-data og returnerer det samlet til frontend */
    async visEjendomsprofil(req, res) {
        try {
            const adresseId = req.query.adresseId;

            /* validering af adresseId */
            if (!adresseId || adresseId.trim() === '') {
                return res.status(400).json({ fejl: 'AdresseId mangler' });
            }

            /* hent adressedata fra DAWA først, da vi skal bruge adgangsadresseid til BBR-kaldet */
            const adresseData = await eksternAPIService.hentAdresseDetaljer(adresseId);

            /* BBR bruger adgangsadresse-ID (ikke adresse-ID) som husnummer-parameter */
            const BBRData = await eksternAPIService.hentBBRData(adresseData.adgangsadresseid);

            /* returner det samlede data til frontend. Vi returnerer begge datasæt samlet i et JSON-objekt med to nøgler, adresse og bbr. Det giver frontend dt enkelt kald at lave i stedet for to. */
            res.status(200).json({
                adresse: adresseData,
                bbr: BBRData
            });

        } catch (fejl) {
            console.error('Fejl i visEjendomsprofil:', fejl);
            res.status(500).json({ fejl: 'Kunne ikke hente ejendomsdata' });
        }
    }

}

module.exports = new EjendomsprofilController();
