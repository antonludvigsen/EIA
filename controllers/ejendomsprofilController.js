/* ejendomsprofilController.js modtager HTTP-kald fra routeren, validerer input og delegerer arbejdet til ejendomsprofilRepositoriet. 

Derudover koordinerer den kald til DAWA_API, BBR_API og KORT_API, da visEjendomsprofil kræver data fra alle tre eksterne tjenester samlet i ét svar til frontend.

Controlleren er ansvarlig for HTTP-statuskoder og fejlhåndtering, da de underliggende
services og repositorier kender hverken til req eller res. */

const DAWA_API = require('../services/DAWA_API')
const BBR_API = require('../services/BBR_API');
const KORT_API = require('../services/Kortdata_API');
const ejendomsprofilRepositorium = require('../repositories/ejendomsprofilRepositorium');

class EjendomsprofilController {

    /* henter adressedata fra DAWA og BBR-data og returnerer det samlet til frontend. */
    visEjendomsprofil = async (req, res) => {

        try {
            const adresseId = req.query.adresseId; /* adresseId sendes som query-parameter: /api/ejendomsprofil/vis?adresseId=... */

            if (!adresseId || adresseId.trim() === '') {
                return res.status(400).json({ fejl: 'AdresseId mangler' });
            }

            /* DAWA hentes først, da BBR kræver "adgangsAdresseId" som kun DAWA returnerer */
            const DAWAData = await DAWA_API.hentAdresseDetaljer(adresseId);
            const BBRData = await BBR_API.hentBBRData(DAWAData.adgangsAdresseId); /* De tre datakald sker sekventielt frem for parallelt, fordi BBR-kaldet afhænger af "adgangsAdresseId" */

            /* alle tre datasæt returneres i et JSON-objekt med nøglerne dawa, bbr og kort,
            så frontend kan nøjes med et API-kald i stedet for tre separate */
            res.status(200).json({
                dawa: DAWAData,
                bbr: BBRData,
                kort: {
                    luftfotoURL: KORT_API.hentLuftfotoURL(DAWAData.x, DAWAData.y),
                    matrikelURL: KORT_API.hentMatrikelURL(DAWAData.x, DAWAData.y)
                } /* KORT_API kræver ingen asynkrone kald, da den bygger blot 
                URL-strenge ud fra de koordinater DAWA returnerer. */
            });

        } catch (fejl) {
            console.error('Fejl i visEjendomsprofil:', fejl);
            res.status(500).json({ fejl: 'Kunne ikke hente ejendomsdata' });
        }
    }

    /* henter alle gemte ejendomsprofiler fra databasen og returnerer dem som JSON til porteføljesiden.
    Metoden kalder repositoriet direkte, hvor sorteringen er håndteret i SQL-forespørgslen (nyeste profil øverst). */
    visPortefølje = async (req, res) => {
        try {
            const profiler = await ejendomsprofilRepositorium.hentAlleEjendomsprofiler();
            res.status(200).json(profiler);
        } catch (fejl) {
            console.error('Fejl i visPortefølje:', fejl);
            res.status(500).json({ fejl: 'Kunne ikke hente portefølje' });
        }
    }

    /* opdaterer kun beskrivelsen på en eksisterende ejendomsprofil. Profilnavnet er fast fra adressen ved oprettelse, hvilket ikke kan ændres efterfølgende. */
    opdaterEjendomsprofil = async (req, res) => {
        try {
            const { ejendomsprofilID, beskrivelse } = req.body;

            if (!ejendomsprofilID) {
                return res.status(400).json({ fejl: 'ejendomsprofilID er påkrævet' });
            }

            /* Hvis beskrivelse er tom sender vi en tom streng frem for null, for at undgå
            at databasen gemmer null i et felt der normalt indeholder tekst. */
            await ejendomsprofilRepositorium.opdaterEjendomsprofil(ejendomsprofilID, beskrivelse ? beskrivelse.trim() : '');
            res.status(200).json({ success: true });
        } catch (fejl) {
            console.error('Fejl i opdaterEjendomsprofil:', fejl);
            res.status(500).json({ fejl: 'Kunne ikke opdatere ejendomsprofil' });
        }
    }

    /* sletter en ejendomsprofil og alt tilknyttet data (investeringscases, simuleringer mm.). */
    sletEjendomsprofil = async (req, res) => {
        try {
            /* id modtages som URL-parameter og konverteres til int fordi URL-parametre altid er strenge,
            mens repositoriet forventer et heltal som databasenøgle. */
            const ejendomsprofilID = parseInt(req.params.id);

            if (!ejendomsprofilID) return res.status(400).json({ fejl: 'ejendomsprofilID mangler' });
            await ejendomsprofilRepositorium.sletEjendomsprofil(ejendomsprofilID);
            res.status(200).json({ success: true });
        } catch (fejl) {
            console.error('Fejl i sletEjendomsprofil:', fejl);
            res.status(500).json({ fejl: 'Kunne ikke slette ejendomsprofil' });
        }
    }

    /* henter BBR-ejendomsdata for en enkelt ejendomsprofil fra databasen.
    Bruges af info-modalen i portefølje.js til at vise de BBR-oplysninger
    der blev hentet og gemt da profilen blev oprettet uden at kalde BBR-API igen. */
    hentEjendomsdata = async (req, res) => {
        try {
            const ejendomsprofilID = parseInt(req.params.id);
            if (!ejendomsprofilID) return res.status(400).json({ fejl: 'ejendomsprofilID mangler' });
            const data = await ejendomsprofilRepositorium.hentEjendomsdata(ejendomsprofilID);
            res.status(200).json(data);
        } catch (fejl) {
            console.error('Fejl i hentEjendomsdata:', fejl);
            res.status(500).json({ fejl: 'Kunne ikke hente ejendomsdata' });
        }
    }

    /* Bruges til hurtigt at oprette en kopi af en profil man vil modificere. 
    Investeringscases kopieres ikke, den nye profil starter tom. */
    duplikerEjendomsprofil = async (req, res) => {
        try {
            const ejendomsprofilID = parseInt(req.params.id);
            if (!ejendomsprofilID) return res.status(400).json({ fejl: 'ejendomsprofilID mangler' });
            await ejendomsprofilRepositorium.duplikerEjendomsprofil(ejendomsprofilID); /* duplikerer en eksisterende ejendomsprofil inkl. adresse og ejendomsdata som nye rækker. */
            res.status(200).json({ success: true });
        } catch (fejl) {
            console.error('Fejl i duplikerEjendomsprofil:', fejl);
            res.status(500).json({ fejl: 'Kunne ikke duplikere ejendomsprofil' });
        }
    }

    /* Profilnavnet afledes automatisk af adressen: brugeren behøver ikke angive et navn.
    Navneformatet er "vejnavn husnummer[, etage][. dør], postnummer bynavn",
    hvor etage og dør kun inkluderes hvis de er udfyldte (lejlighedsadresser). */
    gemEjendomsprofil = async (req, res) => {
        try {
            const { beskrivelse, adresse, ejendomsdata } = req.body;

            /* byg profilnavnet dynamisk ud fra adressefelterne —
            tom streng for etage/dør sikrer at de ikke efterlader et komma i navnet */
            const etage = adresse.etage ? `, ${adresse.etage}` : '';
            const doer  = adresse.doer  ? `. ${adresse.doer}`  : '';
            const navn  = `${adresse.vejnavn} ${adresse.husnummer}${etage}${doer}, ${adresse.postnummer} ${adresse.bynavn}`;

            await ejendomsprofilRepositorium.gemEjendomsprofil(navn, beskrivelse, adresse, ejendomsdata); /* gemmer en ny ejendomsprofil med tilhørende adresse og ejendomsdata. */

            res.status(200).json({ success: true });

        } catch (fejl) {
            console.error('Fejl i gemEjendomsprofil:', fejl);
            res.status(500).json({ fejl: 'Kunne ikke gemme ejendomsprofil' });
        }
    }

}

module.exports = new EjendomsprofilController();
