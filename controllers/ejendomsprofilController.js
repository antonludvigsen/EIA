
const DAWA_API = require('../services/DAWA_API')
const BBR_API = require('../services/BBR_API');

class EjendomsprofilController {

    /* henter adressedata fra DAWA og BBR-data og returnerer det samlet til frontend */
    visEjendomsprofil = async (req, res) => {

        try {
            const adresseId = req.query.adresseId;

            /* validering af adresseId */
            if (!adresseId || adresseId.trim() === '') {
                return res.status(400).json({ fejl: 'AdresseId mangler' });
            }

            /* hent adressedata fra DAWA først, da vi skal bruge adgangsAdresseId til BBR-kaldet */
            const DAWAData = await DAWA_API.hentAdresseDetaljer(adresseId);
            /* BBR bruger adgangsAdresse-ID (ikke adresse-ID) som husnummer-parameter */
            const BBRData = await BBR_API.hentBBRData(DAWAData.adgangsAdresseId);

            /* returner det samlede data til frontend. Vi returnerer begge datasæt samlet i et JSON-objekt med to nøgler, adresse og bbr. Det giver frontend dt enkelt kald at lave i stedet for to. */
            res.status(200).json({
                dawa: DAWAData,
                bbr: BBRData
            });

        } catch (fejl) {
            console.error('Fejl i visEjendomsprofil:', fejl);
            res.status(500).json({ fejl: 'Kunne ikke hente ejendomsdata' });
        }
    }

}

module.exports = new EjendomsprofilController();
