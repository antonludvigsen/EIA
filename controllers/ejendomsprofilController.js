const eksternAPIService = require('../services/eksternAPIServices');

/* henter adressedata fra DAWA og BBR-data og returnerer det samlet til frontend */
async function visEjendomsprofil(req, res) {
    try {
        const adresseId = req.query.adresseId;

        /* validering af adresseId */
        if (!adresseId || adresseId.trim() === '') {
            return res.status(400).json({ fejl: 'AdresseId mangler' });
        }

        /* hent adressedata fra DAWA og BBR-data. Vi holder dem adskildt for at begge kald kan hentes (så de ikke er afhængige af hindanden) */
        const adresseData = await eksternAPIService.hentAdresseDetaljer(adresseId);
        const BBRData = await eksternAPIService.hentBBRData(adresseId);

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

module.exports = {
    visEjendomsprofil
};