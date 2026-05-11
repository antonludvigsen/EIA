/* sammenlign_cases.js håndterer al UI-logik for sammenligningssiden. 
Siden giver brugeren mulighed for at vælge to eller flere investeringscases fra en multi-select dropdown, angive en tidshorisont og køre parallelle simuleringer via Promise.all(). Resultatet vises som fem separate Chart.js-linjediagrammer (en graf per finansiel parameter) og en sammenlignings-tabel der stiller nøgletal op side om side. */

class SammenlignCases {

    constructor() {
        this.dropdown = document.getElementById('sammenlign-dropdown');
        this.tidInput = document.getElementById('sammenlign-tidshorisont');
        this.knap     = document.getElementById('sammenlign-knap');
        this.charts   = {}; /* gemmer Chart-instanserne (en per parameter) så de kan destrueres inden genopbygning ved en ny sammenligning. */

        this.indlaesDropdown();

        /* registrerer lyttere der aktiverer sammenlign-knappen når betingelserne er opfyldt. */
        this.dropdown.addEventListener('change', () => this.tjekKlarTilSammenligning());
        this.tidInput.addEventListener('input',  () => this.tjekKlarTilSammenligning());
        this.knap.addEventListener('click', () => this.udfoerSammenligning());
    }

    /* henter alle investeringscases fra serveren og fylder multi-select dropdown med én option per case. */
    async indlaesDropdown() {
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
        } catch (fejl) {
            console.error('Kunne ikke hente investeringscases:', fejl);
        }
    }

    /* aktiverer sammenlign-knappen når mindst to cases er valgt og tidshorisont er >= 30. */
    tjekKlarTilSammenligning() {
        let antalValgte = 0;
        for (let i = 0; i < this.dropdown.options.length; i++) {
            if (this.dropdown.options[i].selected) {
                antalValgte++;
            }
        }

        let tidGyldig = false;
        if (this.tidInput.value !== '') {
            const val = parseInt(this.tidInput.value);
            if (Number.isInteger(val) && val >= 30) tidGyldig = true;
        }

        if (antalValgte >= 2 && tidGyldig) {
            this.knap.disabled = false;
        } else {
            this.knap.disabled = true;
        }
    }

    /* udfoerSammenligning() kører alle valgte simuleringer parallelt via Promise.all().
    Knappen deaktiveres mens anmodningerne behandles og genaktiveres i finally-blokken. */
    async udfoerSammenligning() {
        const gammelFejl = document.querySelector('.simuler-api-fejl');
        
        if (gammelFejl) {
            gammelFejl.remove();
        }

        const valgte = [];
        for (let i = 0; i < this.dropdown.options.length; i++) {
            if (this.dropdown.options[i].selected) {
                valgte.push(parseInt(this.dropdown.options[i].value));
            }
        }

        this.knap.disabled = true;
        this.knap.textContent = 'Sammenligner...';

        try {
            const anmodninger = [];
            for (let i = 0; i < valgte.length; i++) {
                const anmodning = fetch('/api/simulering/eksekver', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        investeringscaseID: valgte[i],
                        tidshorisont: parseInt(this.tidInput.value)
                    })
                }).then(response => {
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    return response.json();
                });
                anmodninger.push(anmodning);
            }
            const resultater = await Promise.all(anmodninger);

            this.visResultater(valgte, resultater);

        } catch (fejl) {
            console.error('Sammenligning fejlede:', fejl);
            const fejlEl = document.createElement('p');
            fejlEl.className = 'simuler-fejl simuler-api-fejl';
            fejlEl.textContent = 'Der opstod en fejl under sammenligningen. Prøv igen.';
            this.knap.insertAdjacentElement('afterend', fejlEl); /* indsætter fejlbeskeden lige efter knappen */
        } finally {
            this.knap.disabled = false;
            this.knap.textContent = 'Sammenlign';
        }
    }

    /* visResultater() bygger fem Chart.js-linjediagrammer og en sammenlignings-tabel. De eksisterende Chart-instanser destrueres inden genopbygning — se simuler_case.js. for forklaring af hvorfor Chart.js kræver dette. */
    visResultater(valgteIds, resultater) {
        const farver = [ '#9a7b2f', '#2e7d32', '#c0392b', '#1a5276', '#6c3483', '#784212' ];

        /* slår hvert valgt ID op i dropdown'en og henter case-navnet. */
        const navne = [];
        for (let i = 0; i < valgteIds.length; i++) {
            const option = this.dropdown.querySelector(`option[value="${valgteIds[i]}"]`);
            navne.push(option.textContent);
        }

        /* finder det højeste antal simulerede år på tværs af alle cases. */
        let antalAar = 0;
        for (let i = 0; i < resultater.length; i++) {
            if (resultater[i].aarlige.egenkapital.length > antalAar) {
                antalAar = resultater[i].aarlige.egenkapital.length;
            }
        }

        /* bygger x-akse labels fra År 0 til År antalAar. */
        const aarLabels = ['År 0'];
        for (let i = 1; i <= antalAar; i++) {
            aarLabels.push(`År ${i}`);
        }

        const container = document.getElementById('sammenlign-resultater');

        /* destruer eksisterende Chart-instanser inden genopbygning — Chart.js fejler ellers på samme canvas. */
        const parametre = ['egenkapital', 'aktiver', 'likviditetsholdning', 'cashflow', 'gaeld'];
        for (let i = 0; i < parametre.length; i++) {
            if (this.charts[parametre[i]]) {
                this.charts[parametre[i]].destroy();
            }
        }

        /* byg datasæt per parameter med år 0 som første datapunkt */
        const datasaet = {
            egenkapital: [],
            aktiver: [],
            likviditetsholdning: [],
            cashflow: [],
            gaeld: []
        };

        for (let i = 0; i < resultater.length; i++) {
            const r = resultater[i];
            const farve = farver[i % farver.length];

            datasaet.egenkapital.push({
                label: navne[i],
                data: [r.maanedlige.egenkapital[0], ...r.aarlige.egenkapital],
                borderColor: farve,
                backgroundColor: 'transparent',
                tension: 0.3,
                pointRadius: 2
            });

            datasaet.aktiver.push({
                label: navne[i],
                data: [r.maanedlige.aktiver[0], ...r.aarlige.aktiver],
                borderColor: farve,
                backgroundColor: 'transparent',
                tension: 0.3,
                pointRadius: 2
            });

            datasaet.likviditetsholdning.push({
                label: navne[i],
                data: [r.maanedlige.likviditetsholdning[0], ...r.aarlige.likviditetsholdning],
                borderColor: farve,
                backgroundColor: 'transparent',
                tension: 0.3,
                pointRadius: 2
            });

            datasaet.cashflow.push({
                label: navne[i],
                data: [r.maanedlige.cashflow[0], ...r.aarlige.cashflow],
                borderColor: farve,
                backgroundColor: 'transparent',
                tension: 0.3,
                pointRadius: 2
            });

            datasaet.gaeld.push({
                label: navne[i],
                data: [r.maanedlige.gaeld[0], ...r.aarlige.gaeld],
                borderColor: farve,
                backgroundColor: 'transparent',
                tension: 0.3,
                pointRadius: 2
            });
        }

        const chartTitler = {
            egenkapital: 'Egenkapital (kr.)',
            aktiver: 'Aktiver (kr.)',
            likviditetsholdning: 'Likviditetsholding (kr.)',
            cashflow: 'Cashflow (kr.)',
            gaeld: 'Gæld (kr.)'
        };

        const chartOptions = (titel) => ({
            responsive: true,
            plugins: {
                legend: { display: true, position: 'top' },
                title: { display: true, text: titel, align: 'center' }
            },
            scales: {
                y: {
                    ticks: {
                        callback: (val) => val.toLocaleString('da-DK') + ' kr.'
                    }
                }
            }
        });

        container.innerHTML = `
            <div class="simuler-grafer">
                <div class="simuler-graf-kort">
                    <canvas id="graf-egenkapital"></canvas>
                </div>
                <div class="simuler-graf-kort">
                    <canvas id="graf-aktiver"></canvas>
                </div>
                <div class="simuler-graf-kort">
                    <canvas id="graf-likviditetsholdning"></canvas>
                </div>
            </div>
            <div class="sammenlign-grafer-bundræk">
                <div class="simuler-graf-kort">
                    <canvas id="graf-cashflow"></canvas>
                </div>
                <div class="simuler-graf-kort">
                    <canvas id="graf-gaeld"></canvas>
                </div>
            </div>
            <div class="simuler-noegletal" id="sammenlign-noegletal"></div>`;

        ['egenkapital', 'aktiver', 'likviditetsholdning', 'cashflow', 'gaeld'].forEach(key => {
            this.charts[key] = new Chart(
                document.getElementById(`graf-${key}`),
                {
                    type: 'line',
                    data: { labels: aarLabels, datasets: datasaet[key] },
                    options: chartOptions(chartTitler[key])
                }
            );
        });

        /* byg sammenlignings-tabel */
        let kolonneHeaders = '';
        for (let i = 0; i < navne.length; i++) {
            kolonneHeaders += `<th style="color: var(--farve-tekst-moerk); font-weight: bold; text-align: right; padding: 16px 24px; font-family: var(--skrift-serif); font-size: 0.85rem;">${navne[i]}</th>`;
        }

        const rækker = [];
        for (let i = 0; i < resultater.length; i++) {
            const r = resultater[i];

            const slutAktiver = r.aarlige.aktiver[r.aarlige.aktiver.length - 1];
            const slutEgenkapital = r.aarlige.egenkapital[r.aarlige.egenkapital.length - 1];
            const slutLikviditetsholdning = r.aarlige.likviditetsholdning[r.aarlige.likviditetsholdning.length - 1];
            const slutGaeld = r.aarlige.gaeld[r.aarlige.gaeld.length - 1];
            const foersteEgenkapital = r.aarlige.egenkapital[0];
            const egenkapitalvaekst = slutEgenkapital - foersteEgenkapital;

            let samletCashflow = 0;
            for (let j = 0; j < r.aarlige.cashflow.length; j++) {
                samletCashflow += r.aarlige.cashflow[j];
            }

            rækker.push({ slutAktiver, slutEgenkapital, slutLikviditetsholdning, samletCashflow, slutGaeld, egenkapitalvaekst });
        }

        const celStyle = (val, farvekodet) => {
            const farve = farvekodet
                ? `color: ${val >= 0 ? '#2e7d32' : '#c0392b'};`
                : '';
            return `style="${farve} text-align: right; padding: 16px 24px; font-family: var(--skrift-serif); font-size: 1.1rem; font-weight: bold;"`;
        };

        const labelStyle = 'style="color: var(--farve-tekst-graa); font-size: 0.85rem; padding: 16px 24px; font-family: var(--skrift-serif); width: 25%;"';

        const bygRække = (label, getter, farvekodet = false) => `
            <tr style="border-bottom: 1px solid #dddddd;">
                <td ${labelStyle}>${label}</td>
                ${rækker.map(r => `<td ${celStyle(getter(r), farvekodet)}>${getter(r).toLocaleString('da-DK')} kr.</td>`).join('')}
            </tr>`;

        document.getElementById('sammenlign-noegletal').innerHTML = `
            <table class="noegletal-tabel">
                <thead>
                    <tr style="border-bottom: 1px solid #dddddd;">
                        <th style="padding: 16px 24px;"></th>
                        ${kolonneHeaders}
                    </tr>
                </thead>
                <tbody>
                    ${bygRække('Ejendomsværdi (Aktiver) ved periodens slutning', r => r.slutAktiver)}
                    ${bygRække('Egenkapital ved periodens slutning',              r => r.slutEgenkapital)}
                    ${bygRække('Samlet likviditetsholding over perioden',         r => r.slutLikviditetsholdning, true)}
                    ${bygRække('Samlet cashflow over perioden',                   r => r.samletCashflow,         true)}
                    ${bygRække('Restgæld ved periodens slutning',                 r => r.slutGaeld)}
                    ${bygRække('Samlet egenkapitalvækst',                         r => r.egenkapitalvaekst,      true)}
                </tbody>
            </table>`;
    }
}

new SammenlignCases();
