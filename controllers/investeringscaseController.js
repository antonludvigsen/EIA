/* investeringscaseController.js modtager HTTP-kald fra routeren, validerer input og delegerer arbejdet
   til investeringscaseRepositoriet. Controlleren er ansvarlig for HTTP-statuskoder og fejlhåndtering —
   repositoriet kender hverken til req eller res, kun til databaseoperationer. */

const investeringscaseRepositorium = require('../repositories/investeringscaseRepositorium');

class InvesteringscaseController {

    /* modtager ejendomsprofilID, navn, beskrivelse og et parametre-objekt fra req.body.
       Validerer at de påkrævede felter er til stede, trimmer navn og beskrivelse for whitespace,
       og sender data videre til repositoriet. */
    opretInvesteringscase = async (req, res) => {
        try {
            const { ejendomsprofilID, navn, beskrivelse, parametre } = req.body;

            if (!ejendomsprofilID || !navn || navn.trim() === '') {
                return res.status(400).json({ fejl: 'ejendomsprofilID og navn er påkrævet' });
            }

            await investeringscaseRepositorium.opretInvesteringscase(
                ejendomsprofilID,
                navn.trim(),
                beskrivelse ? beskrivelse.trim() : '', /* beskrivelse er valgfrit — vi sender en tom streng frem for null */
                parametre
            );
            res.status(200).json({ success: true });
        } catch (fejl) {
            console.error('Fejl i opretInvesteringscase:', fejl);
            res.status(500).json({ fejl: 'Kunne ikke oprette investeringscase' });
        }
    }

    /* henter alle investeringscases og returnerer dem som JSON til porteføljesiden.
       Ingen filtrering — sorteringen håndteres af repositoriets SQL-forespørgsel. */
    hentAlleInvesteringscases = async (req, res) => {
        try {
            const cases = await investeringscaseRepositorium.hentAlleInvesteringscases();
            res.status(200).json(cases);
        } catch (fejl) {
            console.error('Fejl i hentAlleInvesteringscases:', fejl);
            res.status(500).json({ fejl: 'Kunne ikke hente investeringscases' });
        }
    }

    /* modtager investeringscaseID, navn og beskrivelse fra req.body.
       Kræver et ikke-tomt navn, da det er den primære identifikator i porteføljens UI. */
    opdaterInvesteringscase = async (req, res) => {
        try {
            const { investeringscaseID, navn, beskrivelse } = req.body;

            if (!investeringscaseID || !navn || navn.trim() === '') {
                return res.status(400).json({ fejl: 'investeringscaseID og navn er påkrævet' });
            }

            await investeringscaseRepositorium.opdaterInvesteringscase(
                investeringscaseID,
                navn.trim(),
                beskrivelse ? beskrivelse.trim() : ''
            );
            res.status(200).json({ success: true });
        } catch (fejl) {
            console.error('Fejl i opdaterInvesteringscase:', fejl);
            res.status(500).json({ fejl: 'Kunne ikke opdatere investeringscase' });
        }
    }

    duplikerInvesteringscase = async (req, res) => {
        try {
            const investeringscaseID = parseInt(req.params.id);
            if (!investeringscaseID) return res.status(400).json({ fejl: 'investeringscaseID mangler' });
            await investeringscaseRepositorium.duplikerInvesteringscase(investeringscaseID);
            res.status(200).json({ success: true });
        } catch (fejl) {
            console.error('Fejl i duplikerInvesteringscase:', fejl);
            res.status(500).json({ fejl: 'Kunne ikke duplikere investeringscase' });
        }
    }

    /* modtager id som URL-parameter via req.params.id. parseInt bruges fordi URL-parametre
       altid leveres som strenge, og repositoriet forventer et heltal som databasenøgle. */
    sletInvesteringscase = async (req, res) => {
        try {
            const investeringscaseID = parseInt(req.params.id);
            if (!investeringscaseID) return res.status(400).json({ fejl: 'investeringscaseID mangler' });
            await investeringscaseRepositorium.sletInvesteringscase(investeringscaseID);
            res.status(200).json({ success: true });
        } catch (fejl) {
            console.error('Fejl i sletInvesteringscase:', fejl);
            res.status(500).json({ fejl: 'Kunne ikke slette investeringscase' });
        }
    }
}

module.exports = new InvesteringscaseController();
