
require('dotenv').config(); /* vi starter med at kalde .env filen så brugernavne og adgangskoder kan indlæses */

/* BBR returnerer ejendomstype som en numerisk kode, vi oversætter til beskrivelse (kilde: https://teknik.bbr.dk/kodelister/0/1/0/BygAnvendelse) */
const ejendomsTypeKoder = {
    '110': 'Stuehus til landbrugsejendom',
    '120': 'Fritliggende enfamiliehus',
    '121': 'Sammenbygget enfamiliehus',
    '122': 'Fritliggende enfamiliehus i tæt-lav bebyggelse',
    '130': '(UDFASES) Række-, kæde-, eller dobbelthus (lodret adskillelse mellem enhederne)',
    '131': 'Række-, kæde- og klyngehus',
    '132': 'Dobbelthus',
    '140': 'Etagebolig-bygning, flerfamiliehus eller to-familiehus',
    '150': 'Kollegium',
    '160': 'Boligbygning til døgninstitution',
    '185': 'Anneks i tilknytning til helårsbolig',
    '190': 'Anden bygning til helårsbeboelse',
    '210': '(UDFASES) Bygning til erhvervsmæssig produktion vedrørende landbrug, gartneri, råstofudvinding o. lign',
    '211': 'Stald til svin',
    '212': 'Stald til kvæg, får mv.',
    '213': 'Stald til fjerkræ',
    '214': 'Minkhal',
    '215': 'Væksthus',
    '216': 'Lade til foder, afgrøder mv.',
    '217': 'Maskinhus, garage mv.',
    '218': 'Lade til halm, hø mv.',
    '219': 'Anden bygning til landbrug mv.',
    '220': '(UDFASES) Bygning til erhvervsmæssig produktion vedrørende industri, håndværk m.v. (fabrik, værksted o.lign.)',
    '221': 'Bygning til industri med integreret produktionsapparat',
    '222': 'Bygning til industri uden integreret produktionsapparat',
    '223': 'Værksted',
    '229': 'Anden bygning til produktion',
    '230': '(UDFASES) El-, gas-, vand- eller varmeværk, forbrændingsanstalt m.v.',
    '231': 'Bygning til energiproduktion',
    '232': 'Bygning til energidistribution',
    '233': 'Bygning til vandforsyning',
    '234': 'Bygning til håndtering af affald og spildevand',
    '239': 'Anden bygning til energiproduktion og forsyning',
    '290': '(UDFASES) Anden bygning til landbrug, industri etc.',
    '310': '(UDFASES) Transport- og garageanlæg',
    '311': 'Bygning til jernbane- og busdrift',
    '312': 'Bygning til luftfart',
    '313': 'Bygning til parkering- og transportanlæg',
    '314': 'Bygning til parkering af flere end to køretøjer i tilknytning til boliger',
    '315': 'Havneanlæg',
    '319': 'Andet transportanlæg',
    '320': '(UDFASES) Bygning til kontor, handel, lager, herunder offentlig administration',
    '321': 'Bygning til kontor',
    '322': 'Bygning til detailhandel',
    '323': 'Bygning til lager',
    '324': 'Butikscenter',
    '325': 'Tankstation',
    '329': 'Anden bygning til kontor, handel og lager',
    '330': '(UDFASES) Bygning til hotel, restaurant, vaskeri, frisør og anden servicevirksomhed',
    '331': 'Hotel, kro eller konferencecenter med overnatning',
    '332': 'Bed & breakfast mv.',
    '333': 'Restaurant, café og konferencecenter uden overnatning',
    '334': 'Privat servicevirksomhed som frisør, vaskeri, netcafé mv.',
    '339': 'Anden bygning til serviceerhverv',
    '390': '(UDFASES) Anden bygning til transport, handel etc',
    '410': '(UDFASES) Bygning til biograf, teater, erhvervsmæssig udstilling, bibliotek, museum, kirke o. lign.',
    '411': 'Biograf, teater, koncertsted mv.',
    '412': 'Museum',
    '413': 'Bibliotek',
    '414': 'Kirke eller anden bygning til trosudøvelse for statsanerkendte trossamfund',
    '415': 'Forsamlingshus',
    '416': 'Forlystelsespark',
    '419': 'Anden bygning til kulturelle formål',
    '420': '(UDFASES) Bygning til undervisning og forskning',
    '421': 'Grundskole',
    '422': 'Universitet',
    '429': 'Anden bygning til undervisning og forskning',
    '430': '(UDFASES) Bygning til hospital, sygehjem, fødeklinik o. lign.',
    '431': 'Hospital og sygehus',
    '432': 'Hospice, behandlingshjem mv.',
    '433': 'Sundhedscenter, lægehus, fødeklinik mv.',
    '439': 'Anden bygning til sundhedsformål',
    '440': '(UDFASES) Bygning til daginstitution',
    '441': 'Daginstitution',
    '442': 'Servicefunktion på døgninstitution',
    '443': 'Kaserne',
    '444': 'Fængsel, arresthus mv.',
    '449': 'Anden bygning til institutionsformål',
    '451': 'Beskyttelsesrum',
    '490': '(UDFASES) Bygning til anden institution, herunder kaserne, fængsel o. lign.',
    '510': 'Sommerhus',
    '520': '(UDFASES) Bygning til feriekoloni, vandrehjem o.lign. bortset fra sommerhus',
    '521': 'Feriecenter, center til campingplads mv.',
    '522': 'Bygning med ferielejligheder til erhvervsmæssig udlejning',
    '523': 'Bygning med ferielejligheder til eget brug',
    '529': 'Anden bygning til ferieformål',
    '530': '(UDFASES) Bygning i forbindelse med idrætsudøvelse',
    '531': 'Klubhus i forbindelse med fritid og idræt',
    '532': 'Svømmehal',
    '533': 'Idrætshal',
    '534': 'Tribune i forbindelse med stadion',
    '535': 'Bygning til træning og opstaldning af heste',
    '539': 'Anden bygning til idrætformål',
    '540': 'Kolonihavehus',
    '585': 'Anneks i tilknytning til fritids- og sommerhus',
    '590': 'Anden bygning til fritidsformål',
    '910': 'Garage',
    '920': 'Carport',
    '930': 'Udhus',
    '940': 'Drivhus',
    '950': 'Fritliggende overdækning',
    '960': 'Fritliggende udestue',
    '970': 'Tiloversbleven landbrugsbygning',
    '990': 'Faldefærdig bygning',
    '999': 'Ukendt bygning'
};

class BBR_API {

    async hentBBRData(adgangsAdresseId) {

        const brugernavn = process.env.BBR_BRUGERNAVN;
        const password = process.env.BBR_PASSWORD;

        /* Vi bruger forskellige endpoint kald, da dette er nødsaget for at få fat i antal værelser og grundarealet */
        const bygningURL = `https://services.datafordeler.dk/BBR/BBRPublic/1/REST/bygning?husnummer=${adgangsAdresseId}&username=${brugernavn}&password=${password}&format=JSON`;

        /* Opbygning af BBR kald: "https://services.datafordeler.dk/BBR/BBRPublic/1/REST/" er det plain kald, herfra bygges der ovenpå
        1:      "bygning" endpoint til BBR's bygning-metode
        2:      "?" markerer starten på filtre vi sender med i kaldet
        3:      "husnummer=${adresseId}" er adressens dawakode fx. "0a3f507b-4e55-32b8-e044-0003ba298018"
        4:      "&username=${brugernavn}" sender brugernavnet fra .env
        5:      "&password=${password}" sender passwordet fra .env
        6:      "&format=JSON" fortæller BBR at vi vil have svaret i JSON-format */

        const svar = await fetch(bygningURL);

        if (!svar.ok) {
            throw new Error(`BBR-API fejl: ${svar.status}`);
        }

        const data = await svar.json();

        /* BBR returnerer et array af bygninger, vi tager den første */
        if (!data || data.length === 0) {
            throw new Error('Ingen BBR-data fundet for denne adresse');
        }

        /* Udtrækker de relevante felter fra API'ets response vi skal bruge til ejendomsprofilen */
        const bygning = data[0];

        /* konverterer BBR's numeriske kode til string så den matcher nøglerne i kodelisten */
        const ejendomsTypeKode = String(bygning.byg021BygningensAnvendelse);

        let ejendomstype;
        if (ejendomsTypeKoder[ejendomsTypeKode]) {
            ejendomstype = ejendomsTypeKoder[ejendomsTypeKode]; /* slår koden op i kodelisten. Hvis koden ikke kendes, vises "Ukendt type" efterfulgt af koden */
        } else {
            ejendomstype = `Ukendt type (${ejendomsTypeKode})`;
        }

        let byggeår = null;
        if (bygning.byg026Opførelsesår) {
            byggeår = bygning.byg026Opførelsesår;
        }

        let boligareal = null;
        if (bygning.byg040BygningensSamledeErhvervsAreal) { /* bedste kald vi kunne finde der reflekterede lejligheder */
            boligareal = bygning.byg040BygningensSamledeErhvervsAreal;
        } else if (bygning.byg038SamletBygningsareal) { /* og her det bedste kald for huse */
            boligareal = bygning.byg038SamletBygningsareal;
        } else if (bygning.byg039BygningensSamledeBoligAreal) { /* og en fallback just in case */
            boligareal = bygning.byg039BygningensSamledeBoligAreal;
        }

        let grundareal = null;
        if (bygning.byg039BygningensSamledeBoligAreal) { /* igen, bedste bud på hvad det kunne være når man ser på de værdier vi får af test kald */
            grundareal = bygning.byg039BygningensSamledeBoligAreal;
        }

        /* Vi går her ind og henter det specifikke antal af værelser fra BBR i /enhed */
        let antalVærelser = null;
        try {
            const bygningId = encodeURIComponent(bygning.id_lokalId);
            const enhedURL = `https://services.datafordeler.dk/BBR/BBRPublic/1/REST/enhed?Bygning=${bygningId}&username=${brugernavn}&password=${password}&format=JSON`;
            const enhedSvar = await fetch(enhedURL);

            if (enhedSvar.ok) {
                const enhedData = await enhedSvar.json();
                if (enhedData && enhedData.length > 0) {
                    const enhed = enhedData[0];
                    antalVærelser = enhed.enh031AntalVærelser || null; /* hvis antal værelser findes i BBR registeres sættes det til antallet, eller null */

                    /* hvis er ikke blev fundet et boligareal fra /bygning laver vi et kald her som fallback */
                    if (boligareal === null) {
                        boligareal = enhed.enh027ArealTilBeboelse;
                    }

                    /* samme her */
                    if (grundareal === null) {
                        grundareal = enhed.enh027ArealTilBeboelse;
                    }
                }
            }
        } catch (enhedFejl) {
            antalVærelser = null;
        }

        const senestHentet = new Date().toISOString(); /* new Date() opretter et JavaScript Date-objekt med det aktuelle tidspunkt og konvertere det (fx 2026-04-29T13:22:00.000Z). Det er det format databasen forventer i DATETIME-kolonnen senestHentet. */

        return {
            ejendomstype: ejendomstype,
            byggeår: byggeår,
            boligareal: boligareal,
            antalVærelser: antalVærelser,
            grundareal: grundareal,
            senestHentet: senestHentet
        }; /* BBR's feltnavne: "byg021BygningensAnvendelse" og "byg026Opførelsesår" er interne BBR-koder der er svære at læse og arbejde med i resten af koden. Vi oversætter dem til vores egne navne fra DCD'et. */
    };
};

module.exports = new BBR_API();
