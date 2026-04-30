/* --- Hentning af BBR-data ---  */

class BBR_API {

    async hentBBRData(adresseId) {
        const brugernavn = process.env.BBR_BRUGERNAVN;
        const password = process.env.BBR_PASSWORD;

        const adresseIdKodet = encodeURIComponent(adresseId);
        const bygningURL = `https://services.datafordeler.dk/BBR/BBRPublic/1/REST/bygning?husnummer=${adresseIdKodet}&username=${brugernavn}&password=${password}&format=JSON`;
        /* https://services.datafordeler.dk/BBR/BBRPublic/1/REST/bygning: endpoint-adressen til BBR's bygning-metode. */
        /* ? markerer starten på query-parametre, altså de filtre vi sender med i kaldet. */
        /* husnummer=${adresseIdKodet} sender adgangsadresse-ID'et fra DAWA som parameter. encodeURIComponent er kaldt på forhånd og gemt i adresseIdKodet. */
        /* &username=${brugernavn} sender brugernavnet fra .env. &password=${password} sender passwordet fra .env. Det er derfor vi aldrig hardkoder det direkte i koden, men læser det fra miljøvariablen i stedet. */
        /* &format=JSON fortæller BBR at vi vil have svaret i JSON-format. Uden den parameter returnerer BBR XML som standard. */

        /* BBR returnerer ejendomstype som en numerisk kode (byg021). Vi oversætter koden til et læsbart navn via denne kodeliste. Baseret på BBR's officielle kodeliste for bygningsanvendelse. */
        const ejendomsTypeKoder = {
            '110': 'Stuehus til landbrugsejendom',
            '120': 'Fritliggende enfamiliehus',
            '121': 'Sammenbygget enfamiliehus',
            '130': 'Række-, kæde- eller dobbelthus',
            '140': 'Etageboligbebyggelse',
            '150': 'Kollegium',
            '160': 'Boligbygning til døgninstitution',
            '190': 'Anden helårsbeboelse',
            '210': 'Erhvervsbygning',
            '220': 'Kontor og administration',
            '230': 'Detailhandel',
            '290': 'Andet erhverv',
            '320': 'Garage',
            '330': 'Carport',
            '390': 'Andet udhus',
            '920': 'Sommerhus',
            '940': 'Kolonihavehus',
            '999': 'Ukendt'
        };

        const response = await fetch(bygningURL);

        if (!response.ok) {
            throw new Error(`BBR-API fejl: ${response.status}`);
        }

        const data = await response.json();

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

        let byggeaar = null;
        if (bygning.byg026Opførelsesår) {
            byggeaar = bygning.byg026Opførelsesår;
        }

        let boligareal = null;
        if (bygning.byg038SamletBygningsareal) {
            boligareal = bygning.byg038SamletBygningsareal;
        }

        let grundareal = null;
        if (bygning.byg041BebyggetAreal) {
            grundareal = bygning.byg041BebyggetAreal;
        }

        /* Vi går her ind og henter det specifikke antal af værelser fra BBR */
        let antalVaerelser = null;
        try {
            const bygningId = encodeURIComponent(bygning.id_lokalId);
            const enhedURL = `https://services.datafordeler.dk/BBR/BBRPublic/1/REST/enhed?Bygning=${bygningId}&username=${brugernavn}&password=${password}&format=JSON`;

            const enhedResponse = await fetch(enhedURL);

            if (enhedResponse.ok) {
                const enhedData = await enhedResponse.json();

                if (enhedData && enhedData.length > 0) {
                    const enhed = enhedData[0];

                    antalVaerelser = enhed.enh031AntalVærelser || null; /* hvis antal værelser findes i BBR registeres sættes det til antallet, eller null */
                }
            }
        } catch (enhedFejl) {
            antalVaerelser = null;
        }

        const senestHentet = new Date().toISOString(); /* new Date() opretter et JavaScript Date-objekt med det aktuelle tidspunkt og konvertere det (fx 2026-04-29T13:22:00.000Z). Det er det format databasen forventer i DATETIME-kolonnen senestHentet. */

        return {
            ejendomstype: ejendomstype,
            byggeaar: byggeaar,
            boligareal: boligareal,
            antalVaerelser: antalVaerelser,
            grundareal: grundareal,
            senestHentet: senestHentet
        }; /* BBR's feltnavne som byg021BygningensAnvendelse og byg026Opførelsesår er interne BBR-koder der er svære at læse og arbejde med i resten af koden. Vi oversætter dem til vores egne navne fra DCD'et, altså ejendomstype, byggeaar osv. Hvis BBR en dag ændrer deres feltnavn, er der kun ét sted at rette det, nemlig her i eksternApiService.js. */
    };

    /* --- henter detaljerede adresseoplysninger fra DAWA på baggrund af adresseId. strukturen returnerer adgangsadresseid, som vi videregiver til BBR-kaldet. --- */
    async hentAdresseDetaljer(adresseId) {
        const adresseDetaljerURL = `https://api.dataforsyningen.dk/adresser/${adresseId}?format=json&struktur=mini`;

        const response = await fetch(adresseDetaljerURL);

        if (!response.ok) {
            throw new Error(`DAWA detalje-API fejl: ${response.status}`);
        }

        const data = await response.json();

        let etage = null;
        if (data.etage) {
            etage = data.etage;
        }

        let dør = null;
        if (data.dør) {
            dør = data.dør;
        }

        return {
            vejnavn: data.vejnavn,
            husnummer: data.husnr,
            etage: etage,
            dør: dør,
            postnummer: data.postnr,
            bynavn: data.postnrnavn,
            adgangsadresseid: data.adgangsadresseid
        };
    };

}

module.exports = new BBR_API();
