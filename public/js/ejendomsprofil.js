/* ejendomsprofil.js håndterer al UI logik for ejendomsprofilsiden. den læser adresseId fra URL'en, kalder /api/ejendomsprofil/vis og indsætter data dynamisk i HTML'en. */

/* læs adresseId fra URL'en */
const urlParametre = new URLSearchParams(window.location.search); /* er browserens indbyggede måde at læse URL-parametre på */
const adresseId = urlParametre.get('adresseId');

if (!adresseId) { /* hvis der ikke er et adresseId i URL'en, sender vi brugeren tilbage til forsiden */
    window.location.href = '/index.html';
}

/* henter her ejendomsdata fra vores backend når siden indlæses */
async function hentOgVisEjendomsdata() {
    try {
        const response = await fetch(`/api/ejendomsprofil/vis?adresseId=${encodeURIComponent(adresseId)}`);
        const data = await response.json();

        /* vis adresse i overskriften */
        const adresseTekst = `${data.adresse.vejnavn} ${data.adresse.husnummer}, ${data.adresse.postnummer} ${data.adresse.bynavn}`;
        document.getElementById('ejendom-adresse').textContent = adresseTekst;

        /* vis BBR-data i felterne */
        document.getElementById('ejendomstype').textContent = data.bbr.ejendomstype || 'Ikke registreret';
        document.getElementById('byggeaar').textContent = data.bbr.byggeaar || 'Ikke registreret';
        document.getElementById('boligareal').textContent = data.bbr.boligareal ? `${data.bbr.boligareal} m²` : 'Ikke registreret';
        document.getElementById('antalVaerelser').textContent = data.bbr.antalVaerelser || 'Ikke registreret';
        document.getElementById('grundareal').textContent = data.bbr.grundareal ? `${data.bbr.grundareal} m²` : 'Ikke registreret';

        const dato = new Date(data.bbr.senestHentet); /* henter datoen på det tidspunkt vi hentede dataen */
        document.getElementById('senestHentet').textContent = dato.toLocaleDateString('da-DK'); /* formatere datoen til læsbar dansk format */

    } catch (fejl) {
        console.error('Fejl ved hentning af ejendomsdata:', fejl);
        document.getElementById('ejendom-adresse').textContent = 'Kunne ikke hente ejendomsdata';
    }
}

/* og vi kalder selvfølgelig funktionen med det samme når siden indlæses */
hentOgVisEjendomsdata();