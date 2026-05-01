/* ejendomsprofil.js håndterer al UI logik for ejendomsprofilsiden. den læser adresseId fra URL'en, kalder /api/ejendomsprofil/vis og indsætter data dynamisk i HTML'en. */

class EjendomsprofilUI {

    constructor() {
        /* adresse-logik */
        const urlParametre = new URLSearchParams(window.location.search); /* er browserens indbyggede måde at læse URL-parametre på */
        this.adresseId = urlParametre.get('adresseId'); /* vi bygger videre på logikken fra adresse.js: "Ordrup Jagtvej 21, 2920 Charlottenlund" -> "0a3f50a3-eb37-32b8-e044-0003ba298018" */

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
            const svar = await fetch(`/api/ejendomsprofil/vis?adresseId=${this.adresseId}`); /* bruger "0a3f50a3-eb37-32b8-e044-0003ba298018" og bygger URL'en */
            const data = await svar.json();

            /* trækker de forskellige datatyper ud. logikken er data -> controlleren -> DAWA værdier*/
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

            /* gem data på instansen så gemEjendomsprofil() kan bruge det */
            this.dawaData = data.dawa;
            this.bbrData = data.bbr;

            /* vis luftfoto og matrikelkort af ejendommen */
            document.getElementById('luftfoto').src = data.kort.luftfotoURL;
            document.getElementById('matrikel').src = data.kort.matrikelURL;

        } catch (fejl) {
            console.error('Fejl ved hentning af ejendomsdata:', fejl);
            document.getElementById('ejendom-adresse').textContent = 'Kunne ikke hente ejendomsdata';
        }
    }

    async gemEjendomsprofil() {
        try {
            const navn = document.getElementById('profil-navn').value;
            const beskrivelse = document.getElementById('profil-beskrivelse').value;

            const svar = await fetch('/api/ejendomsprofil/gem', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    navn,
                    beskrivelse,
                    adresse: this.dawaData,
                    ejendomsdata: this.bbrData
                })
            });

            if (!svar.ok) {
                throw new Error(`Server svarede med status ${svar.status}`);
            }

            this.modalOverlay.classList.remove('aktiv');
            alert("Denne ejendomsprofil er nu gemt i 'Min Portefølje'");
            window.location.href = '/index.html';

        } catch (fejl) {
            console.error('Fejl ved gemning af ejendomsprofil:', fejl);
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

        /* gem ejendomsprofilen når brugeren trykker gem i modalen */
        document.getElementById('modal-gem').addEventListener('click', () => {
            this.gemEjendomsprofil();
        });
    }
}

/* instantiér og initialisér når siden indlæses */
const ejendomsprofilUI = new EjendomsprofilUI();
ejendomsprofilUI.initialiser();
