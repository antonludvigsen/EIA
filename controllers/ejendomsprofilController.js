
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

    visPortefølje = async (req, res) => {
        try {
            const profiler = await ejendomsprofilRepositorium.hentAlleEjendomsprofiler();
            res.status(200).json(profiler);
        } catch (fejl) {
            console.error('Fejl i visPortefølje:', fejl);
            res.status(500).json({ fejl: 'Kunne ikke hente portefølje' });
        }
    }

    opdaterEjendomsprofil = async (req, res) => {
        try {
            const { ejendomsprofilID, navn, beskrivelse } = req.body;

            if (!ejendomsprofilID || !navn || navn.trim() === '') {
                return res.status(400).json({ fejl: 'ejendomsprofilID og navn er påkrævet' });
            }

            await ejendomsprofilRepositorium.opdaterEjendomsprofil(ejendomsprofilID, navn.trim(), beskrivelse ? beskrivelse.trim() : '');
            res.status(200).json({ success: true });
        } catch (fejl) {
            console.error('Fejl i opdaterEjendomsprofil:', fejl);
            res.status(500).json({ fejl: 'Kunne ikke opdatere ejendomsprofil' });
        }
    }

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

    gemEjendomsprofil = async (req, res) => {
        try {
            const { navn, beskrivelse, adresse, ejendomsdata } = req.body;

            await ejendomsprofilRepositorium.gemEjendomsprofil(navn, beskrivelse, adresse, ejendomsdata);

            res.status(200).json({ success: true });

        } catch (fejl) {
            console.error('Fejl i gemEjendomsprofil:', fejl);
            res.status(500).json({ fejl: 'Kunne ikke gemme ejendomsprofil' });
        }
    }

}

module.exports = new EjendomsprofilController();
