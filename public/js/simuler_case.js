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
        this.knap.addEventListener('click', () => this.udfoerSimulering());

        /* bloker decimaltegn og alle ikke-numeriske taster i tidshorisont-feltet */
        const tilladteTider = new Set(['0','1','2','3','4','5','6','7','8','9',
            'Backspace','Delete','Tab','ArrowLeft','ArrowRight','Home','End']);
        this.tidInput.addEventListener('keydown', (e) => {
            if (!tilladteTider.has(e.key)) e.preventDefault();
        });
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

    /* aktiverer simuler-knappen når en case er valgt og tidshorisont er et helt tal >= 30 */
    tjekKlarTilSimulering() {
        const caseValgt = this.dropdown.value !== '';
        const val = parseInt(this.tidInput.value);
        const tidGyldig = this.tidInput.value !== '' && Number.isInteger(val) && val >= 30;
        this.knap.disabled = !(caseValgt && tidGyldig);
    }

    udfoerSimulering() {
        const tidshorisonten = this.tidInput.value;

        /* fjern eventuel tidligere fejlbesked */
        const gammelFejl = this.tidInput.parentElement.querySelector('.simuler-fejl');
        if (gammelFejl) gammelFejl.remove();

        if (parseInt(tidshorisonten) < 30) {
            const fejlSpan = document.createElement('span');
            fejlSpan.className = 'simuler-fejl';
            fejlSpan.textContent = 'Tidshorisonten skal være mindst 30 år.';
            this.tidInput.insertAdjacentElement('afterend', fejlSpan);
            return;
        }

        console.log('Simulerer case:', this.dropdown.value, 'over', tidshorisonten, 'år');
    }
}

new SimulerCase();
