/* simuler_case.js håndterer al UI-logik for simuleringsiden.
Siden giver brugeren mulighed for at vælge en investeringscase fra dropdown'en, angive en tidshorisont (minimum 30 år) og kalde /api/simulering/eksekver.
Resultatet vises som et kombineret Chart.js-linjediagram og en nøgletals-tabel. Siden kan åbnes med ?id=... fra portefølje.js, der forududvælger den aktuelle case. */

class SimulerCase {

    constructor() {
        /* sætter elementreferencer op, henter cases til dropdown'en */
        this.dropdown = document.getElementById('case-dropdown');
        this.tidInput = document.getElementById('tidshorisont-input');
        this.knap = document.getElementById('simuler-knap');
        this.charts = {}; /* gemmer Chart-instanser så de kan destrueres ved ny simulering */

        this.indlaesDropdown();

        /* registrerer lyttere der aktiverer simuler-knappen når betingelserne er opfyldt. */
        this.dropdown.addEventListener('change', () => this.tjekKlarTilSimulering());
        this.tidInput.addEventListener('input',  () => this.tjekKlarTilSimulering());
        this.knap.addEventListener('click', () => this.udfoerSimulering());
    }

    /* henter alle investeringscases fra serveren og fylder dropdown med én option per case. */
    async indlaesDropdown() {
        try {
            const svar = await fetch('/api/investeringscase/hentAlle');
            if (!svar.ok) throw new Error('Serverfejl');
            const cases = await svar.json();

            for (let i = 0; i < cases.length; i++) {
                const option = document.createElement('option');
                option.value = cases[i].investeringscaseID;
                option.textContent = cases[i].navn;
                this.dropdown.appendChild(option);
            }

            /* hvis siden åbnedes med ?id=... fra portefølje.js, forududvælg den case. */
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

    /* aktiverer simuler-knappen når en case er valgt og tidshorisont er >= 30. */
    tjekKlarTilSimulering() {
        let caseValgt = false;
        if (this.dropdown.value !== '') caseValgt = true;

        let tidGyldig = false;
        if (this.tidInput.value !== '') {
            const val = parseInt(this.tidInput.value);
            if (Number.isInteger(val) && val >= 30) tidGyldig = true;
        }

        if (caseValgt && tidGyldig) {
            this.knap.disabled = false;
        } else {
            this.knap.disabled = true;
        }
    }

    /* sender POST til /api/simulering/eksekver og viser resultatet.
       Knappen deaktiveres mens anmodningen behandles og genaktiveres i finally-blokken. */
    async udfoerSimulering() {
        /* fjern eventuel tidligere fejlbesked */
        const gammelFejl = document.querySelector('.simuler-api-fejl');
        if (gammelFejl) gammelFejl.remove();

        this.knap.disabled = true;
        this.knap.textContent = 'Simulerer...';

        try {
            const svar = await fetch('/api/simulering/eksekver', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    investeringscaseID: parseInt(this.dropdown.value),
                    tidshorisont: parseInt(this.tidInput.value)
                })
            });

            if (!svar.ok) {
                const fejlData = await svar.json().catch(() => ({}));
                throw new Error(fejlData.fejl || `HTTP ${svar.status}`);
            }

            const data = await svar.json();
            this.visResultater(data);

        } catch (fejl) {
            console.error('Simulering fejlede:', fejl);
            const fejlEl = document.createElement('p');
            fejlEl.className = 'simuler-fejl simuler-api-fejl';
            fejlEl.textContent = 'Der opstod en fejl under simuleringen. Prøv igen.';
            this.knap.insertAdjacentElement('afterend', fejlEl);
        } finally {
            this.knap.disabled = false;
            this.knap.textContent = 'Simuler';
        }
    }

    /* visResultater() bygger eller genbruger resultat-sektionen og tegner ét kombineret linjediagram.
       År 0 behandles særskilt: de aarlige arrays indeholder kun hele afsluttede år,
       så maaned-1-værdien bruges som tilnærmet starttilstand for År 0.
       Chart-instansen destrueres inden genbrug af canvas — Chart.js tillader ikke to instanser på samme canvas. */
    visResultater(data) {
        const caseNavn = this.dropdown.options[this.dropdown.selectedIndex].text;
        const antalAar = data.aarlige.egenkapital.length;

        /* byg eller genbrug resultat-sektionen */
        let sektion = document.getElementById('simuler-resultater');
        if (!sektion) {
            sektion = document.createElement('div');
            sektion.id = 'simuler-resultater';
            sektion.className = 'simuler-resultater';
            document.querySelector('.portefølje-sektion').appendChild(sektion);
        }

        sektion.innerHTML = `
            <h2 class="portefølje-underoverskrift">
                Simuleringsresultat — ${caseNavn} over ${data.tidshorisont} år
            </h2>
            <div class="simuler-grafer">
                <div class="simuler-graf-kort" style="grid-column: 1 / -1;">
                    <canvas id="graf-kombineret"></canvas>
                </div>
            </div>
            <div class="simuler-noegletal" id="simuler-noegletal"></div>`;

        /* bygger x-akse labels fra År 0 til År antalAar. */
        const aarLabels = ['År 0'];
        for (let i = 1; i <= antalAar; i++) {
            aarLabels.push(`År ${i}`);
        }

        /* år 0: brug måned-1-værdien som tilnærmet starttilstand. */
        const egenkapitalMedAar0 = [data.maanedlige.egenkapital[0], ...data.aarlige.egenkapital];
        const cashflowMedAar0  = [data.maanedlige.cashflow[0], ...data.aarlige.cashflow];
        const gaeldMedAar0 = [data.maanedlige.gaeld[0], ...data.aarlige.gaeld];
        const aktiverMedAar0 = [data.maanedlige.aktiver[0], ...data.aarlige.aktiver];
        const likviditetsholdningAar0 = [data.maanedlige.likviditetsholdning[0], ...data.aarlige.likviditetsholdning];

        /* destruer eksisterende Chart-instans inden genopbygning — Chart.js fejler ellers på samme canvas. */
        if (this.charts.kombineret) this.charts.kombineret.destroy();

        this.charts.kombineret = new Chart(document.getElementById('graf-kombineret'), {
            type: 'line',
            data: {
                labels: aarLabels,
                datasets: [
                    {
                        label: 'Egenkapital',
                        data: egenkapitalMedAar0,
                        borderColor: '#9a7b2f',
                        backgroundColor: 'transparent',
                        tension: 0.3,
                        pointRadius: 3
                    },
                    {
                        label: 'Aktiver',
                        data: aktiverMedAar0,
                        borderColor: '#1a5276',
                        backgroundColor: 'transparent',
                        tension: 0.3,
                        pointRadius: 3
                    },
                    {
                        label: 'Likviditetsholding',
                        data: likviditetsholdningAar0,
                        borderColor: '#6c3483',
                        backgroundColor: 'transparent',
                        tension: 0.3,
                        pointRadius: 3
                    },
                    {
                        label: 'Cashflow',
                        data: cashflowMedAar0,
                        borderColor: '#2e7d32',
                        backgroundColor: 'transparent',
                        tension: 0.3,
                        pointRadius: 3
                    },
                    {
                        label: 'Gæld',
                        data: gaeldMedAar0,
                        borderColor: '#c0392b',
                        backgroundColor: 'transparent',
                        tension: 0.3,
                        pointRadius: 3
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: true, position: 'top' },
                    title: {
                        display: true,
                        text: 'Investering over tid (kr.)',
                        align: 'center'
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            callback: (val) => val.toLocaleString('da-DK') + ' kr.'
                        }
                    }
                }
            }
        });

        /* beregn nøgletal fra simuleringsresultatet. */
        const slutAktiver = data.aarlige.aktiver[data.aarlige.aktiver.length - 1];
        const slutEgenkapital = data.aarlige.egenkapital[data.aarlige.egenkapital.length - 1];
        const slutLikviditetsholdning = data.aarlige.likviditetsholdning[data.aarlige.likviditetsholdning.length - 1];
        const slutGaeld = data.aarlige.gaeld[data.aarlige.gaeld.length - 1];
        const foersteEgenkapital = data.aarlige.egenkapital[0];
        const egenkapitalvaekst = slutEgenkapital - foersteEgenkapital;

        let samletCashflow = 0;
        for (let i = 0; i < data.aarlige.cashflow.length; i++) {
            samletCashflow += data.aarlige.cashflow[i];
        }

        document.getElementById('simuler-noegletal').innerHTML = `
          <table class="noegletal-tabel">
            <tbody>
              <tr>
                <td class="noegletal-label">Ejendomsværdi (Aktiver) ved periodens slutning</td>
                <td class="noegletal-vaerdi">
                  ${slutAktiver.toLocaleString('da-DK')} kr.
                </td>
              </tr>
              <tr>
                <td class="noegletal-label">Egenkapital ved periodens slutning</td>
                <td class="noegletal-vaerdi">
                  ${slutEgenkapital.toLocaleString('da-DK')} kr.
                </td>
              </tr>
              <tr>
                <td class="noegletal-label">Samlet likviditetsholding over perioden</td>
                <td class="noegletal-vaerdi" style="color: ${slutLikviditetsholdning >= 0 ? '#2e7d32' : '#c0392b'};">
                  ${slutLikviditetsholdning.toLocaleString('da-DK')} kr.
                </td>
              </tr>
              <tr>
                <td class="noegletal-label">Samlet cashflow over perioden</td>
                <td class="noegletal-vaerdi" style="color: ${samletCashflow >= 0 ? '#2e7d32' : '#c0392b'};">
                  ${samletCashflow.toLocaleString('da-DK')} kr.
                </td>
              </tr>
              <tr>
                <td class="noegletal-label">Restgæld ved periodens slutning</td>
                <td class="noegletal-vaerdi">
                  ${slutGaeld.toLocaleString('da-DK')} kr.
                </td>
              </tr>
              <tr>
                <td class="noegletal-label">Samlet egenkapitalvækst</td>
                <td class="noegletal-vaerdi" style="color: ${egenkapitalvaekst >= 0 ? '#2e7d32' : '#c0392b'};">
                  ${egenkapitalvaekst.toLocaleString('da-DK')} kr.
                </td>
              </tr>
            </tbody>
          </table>`;
    }
}

new SimulerCase();
