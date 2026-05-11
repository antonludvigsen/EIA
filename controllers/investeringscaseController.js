/* investeringscaseController.js modtager HTTP-kald fra routeren, validerer input og delegerer arbejdet
til investeringscaseRepositoriet. 

Controlleren er ansvarlig for HTTP-statuskoder og fejlhåndtering. Repositoriet kender hverken til req eller res, kun til databaseoperationer.

Alle metoder er arrow functions så this er korrekt bundet, når Express kalder dem som callbacks. */

const investeringscaseRepositorium = require('../repositories/investeringscaseRepositorium');

class InvesteringscaseController {

    /* opretInvesteringscase() modtager ejendomsprofilID, navn, beskrivelse og et parametre-objekt fra req.body. */
    opretInvesteringscase = async (req, res) => {

        try {
            const { ejendomsprofilID, navn, beskrivelse, parametre } = req.body;

            /* Validerer at de påkrævede felter er til stede, trimmer navn og beskrivelse for whitespace */
            if (!ejendomsprofilID || !navn || navn.trim() === '') {
                return res.status(400).json({ fejl: 'ejendomsprofilID og navn er påkrævet' });
            }
        
            /* og sender data videre til repositoriet som opretter to rækker i databasen: en i InvesteringsParametre og en i Investeringscase. */
            await investeringscaseRepositorium.opretInvesteringscase(
                ejendomsprofilID,
                navn.trim(),
                beskrivelse ? beskrivelse.trim() : '', /* beskrivelse er valgfrit, men vi sender en tom streng frem for null for at undgå at databasen gemmer null i et felt der normalt indeholder tekst. */
                parametre
            );
            res.status(200).json({ success: true });
        } catch (fejl) {
            console.error('Fejl i opretInvesteringscase:', fejl);
            res.status(500).json({ fejl: 'Kunne ikke oprette investeringscase' });
        }
    }

    /* hentAlleInvesteringscases() returnerer alle investeringscases på tværs af alle ejendomsprofiler
    som JSON til porteføljesiden og sammenligning-siden, der begge bruger dette endpoint til at
    fylde deres dropdowns og kortvisninger. */
    hentAlleInvesteringscases = async (req, res) => {
        try {
            const cases = await investeringscaseRepositorium.hentAlleInvesteringscases();
            res.status(200).json(cases);
        } catch (fejl) {
            console.error('Fejl i hentAlleInvesteringscases:', fejl);
            res.status(500).json({ fejl: 'Kunne ikke hente investeringscases' });
        }
    }

    /* opdaterInvesteringscase() opdaterer navn og beskrivelse på en eksisterende investeringscase.
    Finansielle parametre opdateres via et separat endpoint (opdaterParametre) for at holde de to ansvarsområder adskilt. */
    opdaterInvesteringscase = async (req, res) => {
        try {
            const { investeringscaseID, navn, beskrivelse } = req.body;

            /* Et navn er påkrævet, da det er den primære identifikator i porteføljens UI. */
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

    /* opdaterParametre() opdaterer alle finansielle parametre for en eksisterende investeringscase.
    Endpoint er adskilt fra opdaterInvesteringscase() fordi de to operationer sker parallelt
    fra frontend (Promise.all) og håndteres bedre som to uafhængige PUT-kald. */
    opdaterParametre = async (req, res) => {
        try {
            const { investeringscaseID, parametre } = req.body;

            if (!investeringscaseID) {
                return res.status(400).json({ fejl: 'investeringscaseID mangler' });
            }

            await investeringscaseRepositorium.opdaterParametre(investeringscaseID, parametre);
            res.status(200).json({ success: true });
        } catch (fejl) {
            console.error('Fejl i opdaterParametre:', fejl);
            res.status(500).json({ fejl: 'Kunne ikke opdatere parametre' });
        }
    }

    /* duplikerInvesteringscase() opretter en kopi af en eksisterende investeringscase med alle
    dens finansielle parametre. Bruges til at lave varianter af en case, fx med forskellig
    finansiering, uden at ændre originalen. */
    duplikerInvesteringscase = async (req, res) => {
        try {

            /* id modtages som URL-parameter via req.params.id. parseInt bruges fordi URL-parametre
            altid leveres som strenge, og repositoriet forventer et heltal som databasenøgle. */
            const investeringscaseID = parseInt(req.params.id);
            
            if (!investeringscaseID) {
                return res.status(400).json({ fejl: 'investeringscaseID mangler' });
            }
            
            await investeringscaseRepositorium.duplikerInvesteringscase(investeringscaseID);

            res.status(200).json({ success: true });
        } catch (fejl) {
            console.error('Fejl i duplikerInvesteringscase:', fejl);
            res.status(500).json({ fejl: 'Kunne ikke duplikere investeringscase' });
        }
    }

    /* sletInvesteringscase() sletter en investeringscase og alt dens tilknyttede data. */
    sletInvesteringscase = async (req, res) => {
        try {

            /* samme logik: med modtagelse af id som fra duplikerInvesteringscase */
            const investeringscaseID = parseInt(req.params.id);

            if (!investeringscaseID) {
                return res.status(400).json({ fejl: 'investeringscaseID mangler' });
            }

            await investeringscaseRepositorium.sletInvesteringscase(investeringscaseID);

            res.status(200).json({ success: true });
        } catch (fejl) {
            console.error('Fejl i sletInvesteringscase:', fejl);
            res.status(500).json({ fejl: 'Kunne ikke slette investeringscase' });
        }
    }
}

module.exports = new InvesteringscaseController();
