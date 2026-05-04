/* Håndterer logik for simulering af en investeringscase */

class SimulerCase {

    constructor() {
        this.dropdown  = document.getElementById('case-dropdown');
        this.tidInput  = document.getElementById('tidshorisont-input');
        this.knap      = document.getElementById('simuler-knap');

        this.hentOgPopulerDropdown();

        /* aktiver simuler-knappen kun når begge felter er udfyldt */
        this.dropdown.addEventListener('change', () => this.tjekKlarTilSimulering());
        this.tidInput.addEventListener('input',  () => this.tjekKlarTilSimulering());
    }

    /* henter alle investeringscases fra serveren og fylder dropdown med én option per case */
    async hentOgPopulerDropdown() {
        try {
            const svar = await fetch('/api/investeringscase/hentAlle');
            if (!svar.ok) throw new Error('Serverfejl');
            const cases = await svar.json();

            cases.forEach(ic => {
                const option = document.createElement('option');
                option.value = ic.investeringscaseID;
                option.textContent = ic.navn;
                this.dropdown.appendChild(option);
            });

            /* hvis siden åbnedes med ?id=... fra portefølje.js, forududvælg den case */
            const params = new URLSearchParams(window.location.search);
            const id = params.get('id');
            if (id) {
                this.dropdown.value = id;
                this.tjekKlarTilSimulering();
            }
        } catch (fejl) {
            console.error('Kunne ikke hente investeringscases:', fejl);
        }
    }

    /* aktiverer simuler-knappen når en case er valgt og tidshorisont er udfyldt */
    tjekKlarTilSimulering() {
        const caseValgt = this.dropdown.value !== '';
        const tidGyldig = this.tidInput.value !== '' && parseInt(this.tidInput.value) >= 1;
        this.knap.disabled = !(caseValgt && tidGyldig);
    }
}

new SimulerCase();
