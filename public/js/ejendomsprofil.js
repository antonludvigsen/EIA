/* ejendomsprofil.js håndterer al UI logik for ejendomsprofilsiden. den læser adresseId fra URL'en, kalder /api/ejendomsprofil/vis og indsætter data dynamisk i HTML'en. */

class EjendomsprofilUI {

    constructor() {
        /* læs adresseId fra URL'en */
        const urlParametre = new URLSearchParams(window.location.search); /* er browserens indbyggede måde at læse URL-parametre på */
        this.adresseId = urlParametre.get('adresseId');

        if (!this.adresseId) { /* hvis der ikke er et adresseId i URL'en, sender vi brugeren tilbage til forsiden */
            window.location.href = '/index.html';
        }

        /* Modal-logik */
        this.modalOverlay = document.getElementById('modal-overlay');
        this.modalAnnuller = document.getElementById('modal-annuller');
        this.gemKnap = document.getElementById('gem-ejendomsprofil');
    }

    /* henter her ejendomsdata fra vores backend når siden indlæses */
    async hentOgVisEjendomsdata() {
        try {
            const svar = await fetch(`/api/ejendomsprofil/vis?adresseId=${encodeURIComponent(this.adresseId)}`);
            const data = await svar.json();

            /* vis adresse i overskriften */
            const vejnavn = data.dawa.vejnavn;
            const husnummer = data.dawa.husnummer;
            const etage = data.dawa.etage;
            const dør = data.dawa.dør;
            const postnummer = data.dawa.postnummer;
            const bynavn = data.dawa.bynavn;

            /* byg adresseteksten, og tilføj kun etage og dør hvis de findes */
            let adresseTekst = `${vejnavn} ${husnummer}`;
            if (etage) { adresseTekst += `, ${etage}`; }
            if (dør) { adresseTekst += ` ${dør}`; }
            adresseTekst += `, ${postnummer} ${bynavn}`;
            document.getElementById('ejendom-adresse').textContent = adresseTekst;

            /* vis BBR-data i felterne */
            let ejendomstypeTekst;
            if (data.bbr.ejendomstype) {
                ejendomstypeTekst = data.bbr.ejendomstype;
            } else {
                ejendomstypeTekst = 'Ikke registreret';
            }

            let byggeårTekst;
            if (data.bbr.byggeår) {
                byggeårTekst = data.bbr.byggeår;
            } else {
                byggeårTekst = 'Ikke registreret';
            }

            let boligarealTekst;
            if (data.bbr.boligareal) {
                boligarealTekst = `${data.bbr.boligareal} m²`;
            } else {
                boligarealTekst = 'Ikke registreret';
            }

            let antalVærelseTekst;
            if (data.bbr.antalVærelser) {
                antalVærelseTekst = data.bbr.antalVærelser;
            } else {
                antalVærelseTekst = 'Ikke registreret';
            }

            let grundarealTekst;
            if (data.bbr.grundareal) {
                grundarealTekst = `${data.bbr.grundareal} m²`;
            } else {
                grundarealTekst = 'Ikke registreret';
            }

            document.getElementById('ejendomstype').textContent = ejendomstypeTekst;
            document.getElementById('byggeår').textContent = byggeårTekst;
            document.getElementById('boligareal').textContent = boligarealTekst;
            document.getElementById('antalVærelser').textContent = antalVærelseTekst;
            document.getElementById('grundareal').textContent = grundarealTekst;

            const dato = new Date(data.bbr.senestHentet); /* henter datoen på det tidspunkt vi hentede dataen */
            document.getElementById('senestHentet').textContent = dato.toLocaleDateString('da-DK'); /* formatere datoen til læsbar dansk format */

        } catch (fejl) {
            console.error('Fejl ved hentning af ejendomsdata:', fejl);
            document.getElementById('ejendom-adresse').textContent = 'Kunne ikke hente ejendomsdata';
        }
    }

    initialiser() {
        /* og vi kalder selvfølgelig funktionen med det samme når siden indlæses */
        this.hentOgVisEjendomsdata();

        /* åbn modalen når brugeren trykker gem-knappen */
        this.gemKnap.addEventListener('click', () => {
            /* forududfyld navn med adressen */
            const adresseTekst = document.getElementById('ejendom-adresse').textContent;
            document.getElementById('profil-navn').value = adresseTekst;
            this.modalOverlay.classList.add('aktiv');
        });

        /* luk modalen når brugeren trykker annuller */
        this.modalAnnuller.addEventListener('click', () => {
            this.modalOverlay.classList.remove('aktiv');
        });
    }
}

/* instantiér og initialisér når siden indlæses */
const ejendomsprofilUI = new EjendomsprofilUI();
ejendomsprofilUI.initialiser();
