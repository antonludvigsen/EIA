/* ejendomsprofilController.js modtager HTTP-kald fra routeren, validerer input og delegerer arbejdet til
   ejendomsprofilRepositoriet. Derudover koordinerer den kald til DAWA_API, BBR_API og KORT_API, da
   visEjendomsprofil kræver data fra alle tre eksterne tjenester samlet i ét svar til frontend. */

const DAWA_API = require('../services/DAWA_API')
const BBR_API = require('../services/BBR_API');
const KORT_API = require('../services/KORT_API');
const ejendomsprofilRepositorium = require('../repositories/ejendomsprofilRepositorium');

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
            /* returner det samlede data til frontend. Vi returnerer begge datasæt samlet i et JSON-objekt med tre nøgler, dawa, bbr og kort. Det giver frontend ét enkelt kald at lave i stedet for tre. */
            res.status(200).json({
                dawa: DAWAData,
                bbr: BBRData,
                kort: {
                    luftfotoURL: KORT_API.hentLuftfotoURL(DAWAData.x, DAWAData.y),
                    matrikelURL: KORT_API.hentMatrikelURL(DAWAData.x, DAWAData.y)
                }
            });

        } catch (fejl) {
            console.error('Fejl i visEjendomsprofil:', fejl);
            res.status(500).json({ fejl: 'Kunne ikke hente ejendomsdata' });
        }
    }

    /* henter alle gemte ejendomsprofiler fra databasen og returnerer dem som JSON til porteføljesiden. */
    visPortefølje = async (req, res) => {
        try {
            const profiler = await ejendomsprofilRepositorium.hentAlleEjendomsprofiler();
            res.status(200).json(profiler);
        } catch (fejl) {
            console.error('Fejl i visPortefølje:', fejl);
            res.status(500).json({ fejl: 'Kunne ikke hente portefølje' });
        }
    }

    /* opdaterer kun beskrivelsen på en eksisterende ejendomsprofil. Profilnavnet er fast og afledt
       fra adressen ved oprettelse — det kan ikke ændres efterfølgende. */
    opdaterEjendomsprofil = async (req, res) => {
        try {
            const { ejendomsprofilID, beskrivelse } = req.body;

            if (!ejendomsprofilID) {
                return res.status(400).json({ fejl: 'ejendomsprofilID er påkrævet' });
            }

            await ejendomsprofilRepositorium.opdaterEjendomsprofil(ejendomsprofilID, beskrivelse ? beskrivelse.trim() : '');
            res.status(200).json({ success: true });
        } catch (fejl) {
            console.error('Fejl i opdaterEjendomsprofil:', fejl);
            res.status(500).json({ fejl: 'Kunne ikke opdatere ejendomsprofil' });
        }
    }

    /* sletter en ejendomsprofil og alt tilknyttet data. Modtager id som URL-parameter,
       som konverteres til int inden det sendes videre til repositoriet. */
    sletEjendomsprofil = async (req, res) => {
        try {
            const ejendomsprofilID = parseInt(req.params.id);
            if (!ejendomsprofilID) return res.status(400).json({ fejl: 'ejendomsprofilID mangler' });
            await ejendomsprofilRepositorium.sletEjendomsprofil(ejendomsprofilID);
            res.status(200).json({ success: true });
        } catch (fejl) {
            console.error('Fejl i sletEjendomsprofil:', fejl);
            res.status(500).json({ fejl: 'Kunne ikke slette ejendomsprofil' });
        }
    }

    /* gemmer en ny ejendomsprofil med tilhørende adresse og ejendomsdata. Profilnavnet afledes
       automatisk fra adresseobjektet i formatet "vejnavn husnummer, postnummer bynavn", så brugeren
       ikke behøver at indtaste et navn — adressen er altid den præcise og entydige identifikator. */
    gemEjendomsprofil = async (req, res) => {
        try {
            const { beskrivelse, adresse, ejendomsdata } = req.body;
            const navn = `${adresse.vejnavn} ${adresse.husnummer}, ${adresse.postnummer} ${adresse.bynavn}`;

            await ejendomsprofilRepositorium.gemEjendomsprofil(navn, beskrivelse, adresse, ejendomsdata);

            res.status(200).json({ success: true });

        } catch (fejl) {
            console.error('Fejl i gemEjendomsprofil:', fejl);
            res.status(500).json({ fejl: 'Kunne ikke gemme ejendomsprofil' });
        }
    }

}

module.exports = new EjendomsprofilController();
