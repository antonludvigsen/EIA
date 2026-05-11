/* portefølje.js håndterer al UI-logik for porteføljesiden samt den femtrinsmodale formular til oprettelse af nye investeringscases.
Den henter og viser gemte ejendomsprofiler og investeringscases, styrer oprettelses-, opdaterings-, infovisnings-, duplikerings og sletningsflows. 
Al kommunikation med serveren sker via fetch-kald til /api/ejendomsprofil/... og /api/investeringscase/... */

class Portefolje {
    constructor() {
        this.grid = document.getElementById('portefølje-grid');
        this.opdaterModal = document.getElementById('opdater-modal-overlay');
        this.opdaterBeskrivelse = document.getElementById('opdater-beskrivelse');
        this.investeringModal = document.getElementById('investering-modal-overlay');
        this.opdaterICModal = document.getElementById('opdater-investeringscase-modal-overlay');
        this.opdaterICNavn = document.getElementById('opdater-ic-navn');
        this.opdaterICBeskrivelse = document.getElementById('opdater-ic-beskrivelse');
        this.formData = {}; /* akkumulerer brugerdata på tværs af de fem trin i investeringscase-modalen */
        window.portefolje = this; /* eksponeres globalt så inline onclick-attributter i HTML-skabelonerne kan kalde klassens metoder */
        this.tilknytModalLyttere();
        this.hentOgVisEPer();
        this.hentOgVisICs();
    }

    /* knytter alle klik-lyttere til modal-knapperne. Samles her frem for i konstruktøren for at holde initialiseringslogikken overskuelig. */
    tilknytModalLyttere() {
        document.getElementById('opdater-modal-annuller').addEventListener('click', () => this.lukOpdaterEP());
        document.getElementById('opdater-modal-gem').addEventListener('click', () => this.gemOpdateringEP());
        document.getElementById('investering-modal-annuller').addEventListener('click', () => this.lukInvesteringModal());
        document.getElementById('investering-modal-naeste').addEventListener('click', () => this.næsteStep1());
        document.getElementById('inv-step2-tilbage').addEventListener('click', () => this.tilbageStep2());
        document.getElementById('inv-step2-naeste').addEventListener('click', () => this.næsteStep2());
        document.getElementById('inv-step3-tilbage').addEventListener('click', () => this.tilbageStep3());
        document.getElementById('inv-step3-naeste').addEventListener('click', () => this.næsteStep3());
        document.getElementById('inv-tilfoej-renovering').addEventListener('click', () => this.tilfoejRenoveringRække());
        document.getElementById('inv-step4-tilbage').addEventListener('click', () => this.tilbageStep4());
        document.getElementById('inv-step4-naeste').addEventListener('click', () => this.næsteStep4());
        document.getElementById('inv-step5-tilbage').addEventListener('click', () => this.tilbageStep5());
        document.getElementById('inv-step5-opret').addEventListener('click', () => this.opretIC());
        document.getElementById('opdater-ic-modal-annuller').addEventListener('click', () => this.lukOpdaterIC());
        document.getElementById('opdater-ic-modal-gem').addEventListener('click', () => this.gemOpdateringIC());

        document.getElementById('info-ep-luk').addEventListener('click', () => {
            document.getElementById('info-ep-modal-overlay').classList.remove('aktiv');
        });
        document.getElementById('info-ic-luk').addEventListener('click', () => {
            document.getElementById('info-ic-modal-overlay').classList.remove('aktiv');
        });
    }

    /* ---------------------------------------------------------------------------------- */
    /* PORTEFØLJEVISNING (EJENDOMSPROFILER) */

    /* henter alle gemte ejendomsprofiler fra serveren og sender dem til visEPer(). */
    async hentOgVisEPer() {
        try {
            const svar = await fetch('/api/ejendomsprofil/portefolje');
            if (!svar.ok) throw new Error('Serverfejl');
            const profiler = await svar.json();
            this.profiler = profiler;
            this.visEPer(profiler);
        } catch (fejl) {
            /* fejl ignoreres stille og grid forbliver tomt */
        }
    }

    /* genererer HTML-kort for alle profiler og indsætter dem i portefølje-griddet. */
    visEPer(profiler) {
        this.grid.innerHTML = profiler.map(profil => this.bygKortEP(profil)).join('');
    }

    /* PORTEFØLJEVISNING (INVESTERINGSCASES) */

    /* henter alle investeringscases og sender dem til visICs(). */
    async hentOgVisICs() {
        try {
            const svar = await fetch('/api/investeringscase/hentAlle');
            if (!svar.ok) throw new Error('Serverfejl');
            const cases = await svar.json();
            this.cases = cases;
            this.visICs(cases);
        } catch (fejl) {
            /* fejl ignoreres stille og grid forbliver tomt */
        }
    }
    
    /* bygger HTML-kort for alle cases og indsætter dem i investeringscase-gridet. */
    visICs(cases) {
        const grid = document.getElementById('investeringscase-grid');
        if (!grid) return;
        grid.innerHTML = cases.map(ic => {
            const dato = new Date(ic.oprettetDato).toLocaleDateString('da-DK', {
                day: '2-digit', month: 'long', year: 'numeric'
            });
            const beskrivelse = ic.beskrivelse
            ? `<p class="portefølje-kort-beskrivelse">${this.undgåHTML(ic.beskrivelse)}</p>`
            : '';
            const id = ic.investeringscaseID; /* data-id, data-navn og data-beskrivelse bruges til at videregive ID og tekst til onclick-handleren, da inline HTML-attributter ikke kan tilgå lokale JavaScript-variabler direkte. */
            return `
            <div class="portefølje-kort">
            <div class="kort-header">
            <div>
            <h2 class="portefølje-kort-navn">${this.undgåHTML(ic.navn)}</h2>
            ${beskrivelse}
            </div>
            <div class="kort-header-knapper">
            <button class="kort-info-knap"
            data-id="${id}"
            onclick="window.portefolje.visICInfo(this.dataset.id)"
            title="Se investeringscaseoplysninger">ℹ</button>
            <button class="kort-dupliker-knap"
            data-id="${id}"
            onclick="window.portefolje.duplikerIC(this.dataset.id)"
            title="Duplikér investeringscase">⧉</button>
            </div>
            </div>
            <hr class="kort-divider">
            <p class="portefølje-kort-adresse">${this.undgåHTML(ic.ejendomsprofilNavn)}</p>
            <span class="portefølje-kort-dato">Oprettet ${dato}</span>
            <button class="kort-knap-primary" data-id="${id}" onclick="window.portefolje.simulerCase(this.dataset.id)">Simuler case</button>
            <button class="kort-knap-primary" data-id="${id}" onclick="window.portefolje.sammenlignCase(this.dataset.id)">Sammenlign cases</button>
            <div class="kort-knapper-række">
            <button class="kort-knap-opdater"
            onclick="window.portefolje.åbnOpdaterIC('${id}', '${this.undgåHTML(ic.navn)}', '${this.undgåHTML(ic.beskrivelse || '')}', window.portefolje.cases.find(c => String(c.investeringscaseID) === '${id}'))">Opdater</button>
            <button class="kort-knap-slet" data-id="${id}" onclick="window.portefolje.sletInvesteringscase(this.dataset.id)">Slet</button>
            </div>
            </div>`;
        }).join('');
    }
    
    /* ---------------------------------------------------------------------------------- */
    /* KORTOPBYGNING (EJENDOMSPROFIL) */

    /* bygger HTML-strengen for et ejendomsprofilkort. Adressefelterne fra databasen samles til en læsbar adressestreng. data-beskrivelse bruges til at videregive beskrivelsen til opdateringsmodalen via onclick-attributten uden at indlejre den som en JS-variabel. */
    bygKortEP(profil) {
        const etage = profil.etage ? `, ${profil.etage}` : '';
        const doer = profil.doer ? `. ${profil.doer}` : '';
        const adresse = `${profil.vejnavn} ${profil.husnummer}${etage}${doer}, ${profil.postnummer} ${profil.bynavn}`;
        const dato = new Date(profil.oprettetDato).toLocaleDateString('da-DK', {
            day: '2-digit', month: 'long', year: 'numeric'
        });
        const beskrivelse = profil.beskrivelse
            ? `<p class="portefølje-kort-beskrivelse">${this.undgåHTML(profil.beskrivelse)}</p>`
            : '';
        const id = profil.ejendomsprofilID || profil._id || profil.id || ''; /* forsøger alle mulige ID-felter for robusthed */

        return `
          <div class="portefølje-kort">
            <div class="kort-header">
              <div>
                <h2 class="portefølje-kort-navn">${this.undgåHTML(profil.navn)}</h2>
                ${beskrivelse}
              </div>
              <div class="kort-header-knapper">
                <button class="kort-info-knap"
                  data-id="${id}"
                  onclick="window.portefolje.visEPInfo(this.dataset.id)"
                  title="Se ejendomsprofiloplysninger">ℹ</button>
                <button class="kort-dupliker-knap"
                  data-id="${id}"
                  onclick="window.portefolje.duplikerEP(this.dataset.id)"
                  title="Duplikér ejendomsprofil">⧉</button>
              </div>
            </div>
            <hr class="kort-divider">
            <p class="portefølje-kort-cases">
              ${profil.antalCases === 1
                ? '1 investeringscase tilknyttet'
                : `${profil.antalCases} investeringscases tilknyttet`}
            </p>
            <span class="portefølje-kort-dato">Oprettet ${dato}</span>
            <button class="kort-knap-primary" data-id="${id}" onclick="window.portefolje.åbnInvesteringModal(this.dataset.id)">Opret investeringscase</button>
            <div class="kort-knapper-række">
              <button class="kort-knap-opdater"
                data-id="${id}"
                data-beskrivelse="${this.undgåHTML(profil.beskrivelse || '')}"
                onclick="window.portefolje.åbnOpdaterEP(this.dataset.id, this.dataset.beskrivelse)">Opdater</button>
              <button class="kort-knap-slet" data-id="${id}" onclick="window.portefolje.sletEP(this.dataset.id)">Slet</button>
            </div>
          </div>`;
    }

    /* ---------------------------------------------------------------------------------- */
    /* FRONTEND (UI) FEJLHÅNDTERINGSVISNING */

    /* viser en fejlbesked under et inputfelt ved at farve kanten rød og indsætte et span-element */
    visModalFejl(inputElement, besked) {
        inputElement.style.border = '1px solid #c0392b';
        let fejlSpan = inputElement.parentElement.querySelector('.modal-fejl');
        if (!fejlSpan) { /* Opretter kun et nyt span-element hvis der ikke allerede findes et, forhindrer duplikerede fejlbeskeder. */
            fejlSpan = document.createElement('span');
            fejlSpan.className = 'modal-fejl';
            inputElement.insertAdjacentElement('afterend', fejlSpan);
        }
        fejlSpan.textContent = besked;
    }

    /* fjerner fejlmarkering fra et inputfelt, kaldes både ved navigation til næste trin og når feltets indhold valideres korrekt. */
    fjernModalFejl(inputElement) {
        inputElement.style.border = '';
        const fejlSpan = inputElement.parentElement.querySelector('.modal-fejl');
        if (fejlSpan) fejlSpan.remove();
    }

    /* ---------------------------------------------------------------------------------- */
    /* 5-SIDET FORMULAR OG OPRETTELSE AF INVESTERINGSCASE */

    /* "bladre i bogen" logik. skifter det synlige trin i investeringscasemodalen ved at vise et step og skjule alle andre. */
    visStep(n) {
        [1, 2, 3, 4, 5].forEach(i => {
            document.getElementById(`inv-step-${i}`).style.display = i === n ? 'flex' : 'none';
        });
    }

    /* Nulstiller alle felter og formData, så tidligere indtastninger ikke genbruges hvis brugeren åbner modalen for en anden ejendomsprofil. */
    åbnInvesteringModal(ejendomsprofilID) {
        this.investeringModal.dataset.id = ejendomsprofilID;
        this.formData = {}; 
        const alleNumeriske = ['inv-ejendomspris', 'inv-advokatudgifter', 'inv-tinglysningsudgifter',
            'inv-overtagelsesudgifter', 'inv-koebsomkostninger',
            'inv-laanebeloeb', 'inv-rente', 'inv-loebetid', 'inv-afdragsfri',
            'inv-renoveringstidspunkt', 'inv-drift-beloeb'];
        alleNumeriske.forEach(id => {
            const el = document.getElementById(id);
            el.value = '';
            this.fjernModalFejl(el);
        });
        const laanetype = document.getElementById('inv-laanetype');
        laanetype.value = '';
        this.fjernModalFejl(laanetype);
        document.getElementById('inv-renovering-liste').innerHTML = '';
        document.getElementById('inv-drift-navn').value = '';
        document.getElementById('udlejning-toggle').checked = false;
        document.getElementById('inv-maanedlig-leje').value = '';
        document.getElementById('inv-udlejningsudgifter').value = '';
        document.getElementById('udlejning-detaljer').style.display = 'none';
        const caseNavn = document.getElementById('inv-case-navn');
        caseNavn.value = '';
        this.fjernModalFejl(caseNavn);
        document.getElementById('inv-case-beskrivelse').value = '';
        this.visStep(1);
        this.investeringModal.classList.add('aktiv');
    }

    lukInvesteringModal() {
        this.investeringModal.classList.remove('aktiv');
    }

    /* SIDE 1: KØBSDETALJER */

    /* validerer trin 1 (købsdetaljer) og gemmer de godkendte værdier i this.formData.køb. 
    Ejendomspris er påkrævet. De øvrige felter er valgfrie, men valideres for gyldigt format hvis de udfyldes. */
    næsteStep1() {
        const felter = {
            ejendomspris: document.getElementById('inv-ejendomspris'),
            advokatudgifter: document.getElementById('inv-advokatudgifter'),
            tinglysningsudgifter: document.getElementById('inv-tinglysningsudgifter'),
            overtagelsesudgifter: document.getElementById('inv-overtagelsesudgifter'),
            koebsomkostninger: document.getElementById('inv-koebsomkostninger'),
        };

        let gyldig = true;
        Object.entries(felter).forEach(([, el]) => this.fjernModalFejl(el));

        const ejendomspris = parseFloat(felter.ejendomspris.value);
        if (!Number.isFinite(ejendomspris) || ejendomspris <= 0) {
            this.visModalFejl(felter.ejendomspris, 'Ejendomspris er påkrævet og skal være et positivt beløb.');
            gyldig = false;
        }

        const valgfrie = ['advokatudgifter', 'tinglysningsudgifter', 'overtagelsesudgifter', 'koebsomkostninger'];
        valgfrie.forEach(navn => {
            const el = felter[navn];
            if (el.value.trim() !== '') {
                const val = parseFloat(el.value);
                if (!Number.isFinite(val) || val < 0) {
                    this.visModalFejl(el, 'Indtast et gyldigt beløb (0 eller derover).');
                    gyldig = false;
                }
            }
        });

        if (!gyldig) return;

        this.formData.køb = {
            ejendomspris,
            advokatudgifter: parseFloat(felter.advokatudgifter.value) || 0,
            tinglysningsudgifter: parseFloat(felter.tinglysningsudgifter.value) || 0,
            overtagelsesudgifter: parseFloat(felter.overtagelsesudgifter.value) || 0,
            koebsomkostninger: parseFloat(felter.koebsomkostninger.value) || 0,
        };
        this.visStep(2);
    }

    /* gendanner de tidligere indtastede værdier i trin 1 når brugeren navigerer tilbage. Bevarelse af data er vigtigt for brugeroplevelsen, tab af data ville gøre flowet ubrugeligt. */
    tilbageStep2() {
        const k = this.formData.køb || {};
        document.getElementById('inv-ejendomspris').value = k.ejendomspris || '';
        document.getElementById('inv-advokatudgifter').value = k.advokatudgifter || '';
        document.getElementById('inv-tinglysningsudgifter').value = k.tinglysningsudgifter || '';
        document.getElementById('inv-overtagelsesudgifter').value = k.overtagelsesudgifter || '';
        document.getElementById('inv-koebsomkostninger').value = k.koebsomkostninger || '';
        ['inv-ejendomspris', 'inv-advokatudgifter', 'inv-tinglysningsudgifter',
            'inv-overtagelsesudgifter', 'inv-koebsomkostninger'].forEach(id => {
                this.fjernModalFejl(document.getElementById(id));
            });
        this.visStep(1);
    }

    /* SIDE 2: LØNEDETALJER */

    /* validerer trin 2 (lånedetaljer) og gemmer de godkendte værdier i this.formData.laan. Alle felter er valgfrie, men valideres for gyldigt format og logisk sammenhæng (afdragsfri periode skal være kortere end løbetiden). */
    næsteStep2() {
        const felter = {
            laanebeloeb: document.getElementById('inv-laanebeloeb'),
            rente: document.getElementById('inv-rente'),
            loebetid: document.getElementById('inv-loebetid'),
            afdragsfriPeriode: document.getElementById('inv-afdragsfri'),
            laanetype: document.getElementById('inv-laanetype'),
        };

        let gyldig = true;
        Object.entries(felter).forEach(([, el]) => this.fjernModalFejl(el));

        let laanebeloeb = null;
        if (felter.laanebeloeb.value.trim() !== '') {
            laanebeloeb = parseFloat(felter.laanebeloeb.value);
            if (!Number.isFinite(laanebeloeb) || laanebeloeb < 0) {
                this.visModalFejl(felter.laanebeloeb, 'Indtast et gyldigt beløb (0 eller derover).');
                gyldig = false;
            }
        }

        let rente = null;
        if (felter.rente.value.trim() !== '') {
            rente = parseFloat(felter.rente.value);
            if (!Number.isFinite(rente) || rente < 0) {
                this.visModalFejl(felter.rente, 'Indtast en gyldig rente (0 eller derover).');
                gyldig = false;
            }
        }

        let loebetid = null;
        if (felter.loebetid.value.trim() !== '') {
            loebetid = parseInt(felter.loebetid.value, 10);
            if (!Number.isFinite(loebetid) || loebetid < 1 || loebetid > 360) {
                this.visModalFejl(felter.loebetid, 'Løbetid skal være et helt tal mellem 1 og 360 måneder.');
                gyldig = false;
            }
        }

        let afdragsfriPeriode = null;
        if (felter.afdragsfriPeriode.value.trim() !== '') {
            afdragsfriPeriode = parseInt(felter.afdragsfriPeriode.value, 10);
            if (!Number.isFinite(afdragsfriPeriode) || afdragsfriPeriode < 0) {
                this.visModalFejl(felter.afdragsfriPeriode, 'Afdragsfri periode skal være et helt tal (0 eller derover) i måneder.');
                gyldig = false;
            } else if (loebetid !== null && afdragsfriPeriode >= loebetid) {
                this.visModalFejl(felter.afdragsfriPeriode, 'Afdragsfri periode skal være kortere end løbetiden.');
                gyldig = false;
            }
        }

        if (!gyldig) return;

        this.formData.laan = {
            laanebeloeb,
            rente,
            loebetid,
            afdragsfriPeriode,
            laanetype: felter.laanetype.value || null,
        };
        this.visStep(3);
    }

    /* SIDE 3: RENOVERING OG FORBEDRING */

    /* gendanner trin 2-felterne og renoveringslistens rækker fra formData når brugeren navigerer tilbage. */
    tilbageStep3() {
        const l = this.formData.laan || {};
        document.getElementById('inv-laanebeloeb').value = l.laanebeloeb ?? '';
        document.getElementById('inv-rente').value = l.rente ?? '';
        document.getElementById('inv-loebetid').value = l.loebetid ?? '';
        document.getElementById('inv-afdragsfri').value = l.afdragsfriPeriode ?? '';
        document.getElementById('inv-laanetype').value = l.laanetype ?? '';
        ['inv-laanebeloeb', 'inv-rente', 'inv-loebetid', 'inv-afdragsfri', 'inv-laanetype'].forEach(id => {
            this.fjernModalFejl(document.getElementById(id));
        });
        this.visStep(2);
    }

    /* opretter en ny dynamisk række i renoveringslisten. Hver række har et navnfelt, et beløbsfelt og en fjern-knap der sletter rækken fra DOM'en. */
    tilfoejRenoveringRække() {
        const liste = document.getElementById('inv-renovering-liste');

        const kort = document.createElement('div');
        kort.className = 'renovering-kort';

        const navnInput = document.createElement('input');
        navnInput.type = 'text';
        navnInput.className = 'modal-input';
        navnInput.placeholder = 'Navn på udgift';
        navnInput.style.cssText = 'flex:1; min-width:0;';

        const beloebInput = document.createElement('input');
        beloebInput.type = 'number';
        beloebInput.className = 'modal-input';
        beloebInput.min = '0';
        beloebInput.step = '0.01';
        beloebInput.placeholder = 'fx. 250.000 kr.';
        beloebInput.style.cssText = 'flex:1; min-width:0;';

        const fjernKnap = document.createElement('button');
        fjernKnap.type = 'button';
        fjernKnap.className = 'modal-fjern-knap';
        fjernKnap.innerHTML = '&times;';
        fjernKnap.addEventListener('click', () => liste.removeChild(kort));

        kort.appendChild(navnInput);
        kort.appendChild(beloebInput);
        kort.appendChild(fjernKnap);
        liste.appendChild(kort);
    }

    /* SIDE 4: DRIFTSOMKOSTNINGER */

    /* validerer trin 3 (renovering). Rækker med gyldigt beløb gemmes; rækker med kun navn gemmes med null; tomme rækker ignoreres. */
    næsteStep3() {
        const tidspunktEl = document.getElementById('inv-renoveringstidspunkt');
        const rækker = document.getElementById('inv-renovering-liste').querySelectorAll('.renovering-kort');

        let gyldig = true;
        this.fjernModalFejl(tidspunktEl);
        rækker.forEach(række => this.fjernModalFejl(række.querySelectorAll('input')[1]));

        const poster = [];
        rækker.forEach(række => {
            const inputs = række.querySelectorAll('input');
            const navnInput   = inputs[0];
            const beloebInput = inputs[1];
            const harNavn   = navnInput.value.trim() !== '';
            const harBeloeb = beloebInput.value.trim() !== '';

            if (harBeloeb) {
                const beloeb = parseFloat(beloebInput.value);
                if (!Number.isFinite(beloeb) || beloeb < 0) {
                    this.visModalFejl(beloebInput, 'Indtast et gyldigt beløb (0 eller derover).');
                    gyldig = false;
                } else {
                    poster.push({ navn: navnInput.value.trim(), beloeb });
                }
            } else if (harNavn) {
                poster.push({ navn: navnInput.value.trim(), beloeb: null });
            }
        });

        let renoveringstidspunkt = null;
        if (tidspunktEl.value.trim() !== '') {
            renoveringstidspunkt = parseInt(tidspunktEl.value, 10);
            if (!Number.isFinite(renoveringstidspunkt) || !Number.isInteger(renoveringstidspunkt) || renoveringstidspunkt < 0) {
                this.visModalFejl(tidspunktEl, 'Angiv et helt tal (0 eller derover).');
                gyldig = false;
            }
        }

        if (!gyldig) return;

        this.formData.renovering = { poster, renoveringstidspunkt };
        this.visStep(4);
    }

    /* gendanner trin 3-felterne fra formData ved navigation tilbage. */
    tilbageStep4() {
        const r = this.formData.renovering || {};
        document.getElementById('inv-renoveringstidspunkt').value = r.renoveringstidspunkt ?? '';
        this.fjernModalFejl(document.getElementById('inv-renoveringstidspunkt'));

        const liste = document.getElementById('inv-renovering-liste');
        liste.innerHTML = '';
        (r.poster || []).forEach(post => {
            this.tilfoejRenoveringRække();
            const korts = liste.querySelectorAll('.renovering-kort');
            const kort = korts[korts.length - 1];
            const inputs = kort.querySelectorAll('input');
            inputs[0].value = post.navn || '';
            inputs[1].value = post.beloeb ?? '';
        });
        this.visStep(3);
    }

    /* SIDE 5: UDLEJNING */

    /* validerer trin 4 (driftsomkostninger) og sætter udlejningstoggle-lytteren op. */
    næsteStep4() {
        const beloebInput = document.getElementById('inv-drift-beloeb');
        this.fjernModalFejl(beloebInput);

        const beloebStr = beloebInput.value.trim();
        if (beloebStr !== '') {
            const beloeb = parseFloat(beloebStr);
            if (!Number.isFinite(beloeb) || beloeb < 0) {
                this.visModalFejl(beloebInput, 'Indtast et gyldigt beløb (0 eller derover).');
                return;
            }
        }

        this.formData.drift = {
            navn: document.getElementById('inv-drift-navn').value.trim(),
            beloeb: beloebStr !== '' ? parseFloat(beloebStr) : null
        };

        const toggle = document.getElementById('udlejning-toggle');
        const detaljer = document.getElementById('udlejning-detaljer');
        toggle.onchange = () => { /* toggle.onchange: sætter en funktion der kører hver gang brugeren slår udlejnings-togglen til eller fra. tildeles direkte (frem for addEventListener) fordi modalen kan åbnes og lukkes flere gange */
            if (toggle.checked) {
                detaljer.style.cssText = 'display:flex; flex-direction:column; gap:24px;';
            } else {
                detaljer.style.display = 'none';
                document.getElementById('inv-maanedlig-leje').value = '';
                document.getElementById('inv-udlejningsudgifter').value = '';
            }
        };
        this.visStep(5);
    }

    /* gendanner trin 4-felterne fra formData ved navigation tilbage. */
    tilbageStep5() {
        const d = this.formData.drift || {};
        document.getElementById('inv-drift-navn').value = d.navn || '';
        document.getElementById('inv-drift-beloeb').value = d.beloeb ?? '';
        this.visStep(4);
    }

    /* OPRETTELSE AF INVESTERINGSCASE */

    /* samler data fra alle fem trin og sender dem til serveren som et POST-kald. 
    "El" = Element */
    async opretIC() {
        const toggle = document.getElementById('udlejning-toggle');
        const lejeEl = document.getElementById('inv-maanedlig-leje');
        const udgiftEl = document.getElementById('inv-udlejningsudgifter');
        const navnEl = document.getElementById('inv-case-navn');
        const beskrivelseEl = document.getElementById('inv-case-beskrivelse');
        const udlejning = toggle.checked;

        let gyldig = true;
        [lejeEl, udgiftEl, navnEl].forEach(el => this.fjernModalFejl(el));

        let maanedligLeje = null;
        let udlejningsudgifter = null;

        if (udlejning) {
            if (lejeEl.value.trim() !== '') {
                maanedligLeje = parseFloat(lejeEl.value);
                if (!Number.isFinite(maanedligLeje) || maanedligLeje < 0) {
                    this.visModalFejl(lejeEl, 'Indtast et gyldigt beløb (0 eller derover).');
                    gyldig = false;
                }
            }
            if (udgiftEl.value.trim() !== '') {
                udlejningsudgifter = parseFloat(udgiftEl.value);
                if (!Number.isFinite(udlejningsudgifter) || udlejningsudgifter < 0) {
                    this.visModalFejl(udgiftEl, 'Indtast et gyldigt beløb (0 eller derover).');
                    gyldig = false;
                }
            }
        }

        const navn = navnEl.value.trim();
        if (!navn) {
            this.visModalFejl(navnEl, 'Navn på investeringscasen er påkrævet.');
            gyldig = false;
        }

        if (!gyldig) return;

        const køb = this.formData.køb || {};
        const laan = this.formData.laan || {};
        const renovering = this.formData.renovering || {};
        const drift = this.formData.drift || {};

        const parametre = {
            ejendomspris: køb.ejendomspris ?? null,
            advokatudgifter: køb.advokatudgifter ?? null,
            tinglysningsudgifter: køb.tinglysningsudgifter ?? null,
            overtagelsesudgifter: køb.overtagelsesudgifter ?? null,
            koebsomkostninger: køb.koebsomkostninger ?? null,
            laanebeloeb: laan.laanebeloeb ?? null,
            rente: laan.rente ?? null,
            loebetid: laan.loebetid ?? null,
            afdragsfriPeriode: laan.afdragsfriPeriode ?? null,
            laanetype: laan.laanetype ?? null,
            planlagteRenoveringOgForbedringer: (renovering.poster || []).reduce((sum, p) => sum + (p.beloeb || 0), 0),
            renoveringstidspunkt: renovering.renoveringstidspunkt ?? null,
            driftsomkostninger: drift.beloeb ?? 0,
            udlejning, /* altså enten er det valgt eller ej */
            udlejningMaanederAarligt: parseInt(document.getElementById('inv-udlejning-maaneder').value) || 12,
            maanedligLeje,
            udlejningsudgifter,
        };

        try {
            const svar = await fetch('/api/investeringscase/opret', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ejendomsprofilID: this.investeringModal.dataset.id,
                    navn,
                    beskrivelse: beskrivelseEl.value.trim() || '',
                    parametre,
                })
            });
            if (!svar.ok) {
                const fejlData = await svar.json().catch(() => ({})); /* .catch(() => ({})) sikrer et tomt objekt hvis serversvaret ikke er valid JSON */
                throw new Error(fejlData.fejl || `HTTP ${svar.status}`);
            }
            this.lukInvesteringModal();
            await this.hentOgVisICs();
        } catch (fejl) {
            console.error('Kunne ikke oprette investeringscase:', fejl.message);
            alert('Der opstod en fejl. Prøv igen.');
        }
    }

    /* ---------------------------------------------------------------------------------- */
    /* OPDATERRING (EJENDOMSPROFILER) */
    
    åbnOpdaterEP(id, beskrivelse) {
        this.opdaterModal.dataset.id = id; /* id gemmes på modal-elementets dataset så gemOpdateringEP() kan hente det ved klik på gem-knappen. */
        this.opdaterBeskrivelse.value = beskrivelse;
        this.opdaterModal.classList.add('aktiv');
    }

    lukOpdaterEP() {
        this.opdaterModal.classList.remove('aktiv');
    }

    async gemOpdateringEP() {
        const ejendomsprofilID = this.opdaterModal.dataset.id;
        const beskrivelse = this.opdaterBeskrivelse.value.trim();

        try {
            const svar = await fetch('/api/ejendomsprofil/opdater', {
                method: 'PUT', /* sender en PUT-anmodning med den opdaterede beskrivelse til serveren og genindlæser siden for at afspejle ændringen i porteføljekortet. */
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ejendomsprofilID, beskrivelse })
            });
            if (!svar.ok) throw new Error('Serverfejl');
            this.lukOpdaterEP();
            location.reload();
        } catch (fejl) {
            console.error('Kunne ikke opdatere ejendomsprofil:', fejl);
            alert('Der opstod en fejl. Prøv igen.');
        }
    }

    /* OPDATERRING (INVESTERINGSCASE) */

    /* åbner opdateringsmodalen for en investeringscase og forududfylder navn, beskrivelse og alle parameterfelter. */
    åbnOpdaterIC(id, navn, beskrivelse, ic) {
        this.opdaterICModal.dataset.id = id;
        this.opdaterICNavn.value = navn;
        this.opdaterICBeskrivelse.value = beskrivelse;

        if (ic) {
            const sæt = (elId, val) => { const el = document.getElementById(elId); if (el) el.value = val ?? ''; };
            sæt('inv-opdater-ejendomspris', ic.ejendomspris);
            sæt('inv-opdater-advokatudgifter', ic.advokatudgifter);
            sæt('inv-opdater-tinglysningsudgifter', ic.tinglysningsudgifter);
            sæt('inv-opdater-overtagelsesudgifter', ic.overtagelsesudgifter);
            sæt('inv-opdater-koebsomkostninger', ic.koebsomkostninger);
            sæt('inv-opdater-laanebeloeb', ic.laanebeloeb);
            sæt('inv-opdater-rente', ic.rente);
            sæt('inv-opdater-loebetid', ic.loebetid);
            sæt('inv-opdater-afdragsfriperiode', ic.afdragsfriPeriode);
            sæt('inv-opdater-laanetype', ic.laanetype);
            sæt('inv-opdater-renoveringer', ic.planlagteRenoveringOgForbedringer);
            sæt('inv-opdater-renoveringstidspunkt', ic.renoveringstidspunkt);
            sæt('inv-opdater-driftsomkostninger', ic.driftsomkostninger);
            sæt('inv-opdater-udlejning', ic.udlejning ? '1' : '0');
            sæt('inv-opdater-udlejning-maaneder', ic.udlejningMaanederAarligt);
            sæt('inv-opdater-maanedligleje', ic.maanedligLeje);
            sæt('inv-opdater-udlejningsudgifter', ic.udlejningsudgifter);
        }

        this.opdaterICModal.classList.add('aktiv');
    }

    lukOpdaterIC() {
        this.opdaterICModal.classList.remove('aktiv');
    }

    async gemOpdateringIC() {
        const investeringscaseID = this.opdaterICModal.dataset.id;
        const navn = this.opdaterICNavn.value.trim();
        const beskrivelse = this.opdaterICBeskrivelse.value.trim();

        if (!navn) {
            this.opdaterICNavn.focus();
            return;
        }

        const hent = (id) => document.getElementById(id)?.value ?? '';
        const tal = (id) => { const v = hent(id); return v !== '' ? parseFloat(v) : null; };
        const int = (id) => { const v = hent(id); return v !== '' ? parseInt(v, 10) : null; };

        const parametre = {
            ejendomspris: tal('inv-opdater-ejendomspris'),
            advokatudgifter: tal('inv-opdater-advokatudgifter'),
            tinglysningsudgifter: tal('inv-opdater-tinglysningsudgifter'),
            overtagelsesudgifter: tal('inv-opdater-overtagelsesudgifter'),
            koebsomkostninger: tal('inv-opdater-koebsomkostninger'),
            laanebeloeb: tal('inv-opdater-laanebeloeb'),
            rente: tal('inv-opdater-rente'),
            loebetid: int('inv-opdater-loebetid'),
            afdragsfriPeriode: int('inv-opdater-afdragsfriperiode'),
            laanetype: hent('inv-opdater-laanetype') || null,
            planlagteRenoveringOgForbedringer: tal('inv-opdater-renoveringer'),
            renoveringstidspunkt: int('inv-opdater-renoveringstidspunkt'),
            driftsomkostninger: tal('inv-opdater-driftsomkostninger'),
            udlejning: hent('inv-opdater-udlejning') === '1',
            udlejningMaanederAarligt: int('inv-opdater-udlejning-maaneder') || null,
            maanedligLeje: tal('inv-opdater-maanedligleje'),
            udlejningsudgifter: tal('inv-opdater-udlejningsudgifter'),
        };

        /* sender to parallelle PUT-anmodninger: en med navn/beskrivelse og en med alle parameterfelter. */
        try {
            const [svar1, svar2] = await Promise.all([
                fetch('/api/investeringscase/opdater', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ investeringscaseID, navn, beskrivelse })
                }),
                fetch('/api/investeringscase/opdaterParametre', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ investeringscaseID, parametre })
                })
            ]);
            if (!svar1.ok || !svar2.ok) throw new Error('Serverfejl');
            this.lukOpdaterIC();
            await this.hentOgVisICs();
        } catch (fejl) {
            console.error('Kunne ikke opdatere investeringscase:', fejl);
            alert('Der opstod en fejl. Prøv igen.');
        }
    }

    /* ---------------------------------------------------------------------------------- */
    /* SLETNING (EJENDOMSPROFILER) */

    /* beder brugeren bekræfte inden sletning, da handlingen ikke kan fortrydes. Genindlæser siden så det slettede kort forsvinder fra porteføljegriddet. */
    async sletEP(id) {
        if (!confirm('Er du sikker på, at du vil slette denne ejendomsprofil? Dette kan ikke fortrydes.')) return;
        try {
            const svar = await fetch(`/api/ejendomsprofil/slet/${id}`, { method: 'DELETE' });
            if (!svar.ok) throw new Error('Serverfejl');
            location.reload();
        } catch (fejl) {
            console.error('Kunne ikke slette ejendomsprofil:', fejl);
            alert('Der opstod en fejl. Prøv igen.');
        }
    }

    /* SLETNING (INVESTERINGSCASES) */
    
    /* beder brugeren bekræfte inden sletning og opdaterer derefter listen uden fuld sidereload. */
    async sletInvesteringscase(id) {
        if (!confirm('Er du sikker på, at du vil slette denne investeringscase? Dette kan ikke fortrydes.')) return;
        try {
            const svar = await fetch(`/api/investeringscase/slet/${id}`, { method: 'DELETE' });
            if (!svar.ok) throw new Error('Serverfejl');
            await this.hentOgVisICs();
        } catch (fejl) {
            console.error('Kunne ikke slette investeringscase:', fejl);
            alert('Der opstod en fejl. Prøv igen.');
        }
    }


    /* ---------------------------------------------------------------------------------- */
    /* DUPLIKERING (EJENDOMSPROFILER) */
    
    /* beder brugeren bekræfte inden duplikering og genindlæser siden så den nye profil vises. */
    async duplikerEP(id) {
        if (!confirm('Du har trykket på dupliker. Vil du fortsætte?')) return;
        try {
            const svar = await fetch(`/api/ejendomsprofil/dupliker/${id}`, { method: 'POST' });
            if (!svar.ok) throw new Error('Serverfejl');
            location.reload();
        } catch (fejl) {
            console.error('Kunne ikke duplikere ejendomsprofil:', fejl);
            alert('Der opstod en fejl. Prøv igen.');
        }
    }

    /* DUPLIKERINGSLOGIK (INVESTERINGSCASE) */
    
    /* beder brugeren bekræfte inden duplikering og opdaterer investeringscase-listen uden fuld sidereload. */
    async duplikerIC(id) {
        if (!confirm('Du har trykket på dupliker. Vil du fortsætte?')) return;
        try {
            const svar = await fetch(`/api/investeringscase/dupliker/${id}`, { method: 'POST' });
            if (!svar.ok) throw new Error('Serverfejl');
            location.reload();
        } catch (fejl) {
            console.error('Kunne ikke duplikere investeringscase:', fejl);
            alert('Der opstod en fejl. Prøv igen.');
        }
    }

    /* ---------------------------------------------------------------------------------- */
    /* SIMULER OG SAMMENLIGN VIDEREGIVELE */

    /* sender brugeren til simuler_case.html med investeringscaseID som query-parameter, så siden kan forududvælge den korrekte case i dropdown'en. */
    simulerCase(investeringscaseID) {
        window.location.href = `/simuler_case.html?id=${investeringscaseID}`;
    }

    /* sender brugeren til sammenlign_cases.html med investeringscaseID som query-parameter. */
    sammenlignCase(investeringscaseID) {
        window.location.href = `/sammenlign_cases.html?id=${investeringscaseID}`;
    }


    /* ---------------------------------------------------------------------------------- */
    /* INFOVISNING (EJENDOMSPROFIL) */

    /* viser info-modalen for en ejendomsprofil med adresse, beskrivelse og BBR-ejendomsdata. BBR-data hentes fra vores eget API frem for fra BBR direkte, fordi dataene allerede er gemt i databasen fra da profilen blev oprettet. */
    async visEPInfo(id) {
        const profil = this.profiler.find(p => String(p.ejendomsprofilID) === String(id));
        if (!profil) return;

        const ejendomSvar = await fetch(`/api/ejendomsprofil/ejendomsdata/${id}`);
        const ed = ejendomSvar.ok ? await ejendomSvar.json() : null;

        const formatDato = (d) => new Date(d).toLocaleDateString('da-DK', {
            day: '2-digit', month: 'long', year: 'numeric'
        });

        document.getElementById('info-ep-titel').textContent = profil.navn;

        const etage = profil.etage ? `, ${profil.etage}` : '';
        const doer = profil.doer ? `. ${profil.doer}` : '';
        const adresse = `${profil.vejnavn} ${profil.husnummer}${etage}${doer}, ${profil.postnummer} ${profil.bynavn}`;

        document.getElementById('info-ep-indhold').innerHTML = `
            <table class="noegletal-tabel">
              <tbody>
                <tr><td class="noegletal-label">Adresse</td>
                    <td class="noegletal-vaerdi">${this.undgåHTML(adresse)}</td></tr>
                <tr><td class="noegletal-label">Beskrivelse</td>
                    <td class="noegletal-vaerdi">
                      ${profil.beskrivelse ? this.undgåHTML(profil.beskrivelse) : '—'}
                    </td></tr>
                <tr><td class="noegletal-label">Tilknyttede cases</td>
                    <td class="noegletal-vaerdi">${profil.antalCases}</td></tr>
                <tr><td class="noegletal-label">Oprettet</td>
                    <td class="noegletal-vaerdi">${formatDato(profil.oprettetDato)}</td></tr>
                ${ed ? `
                <tr><td class="noegletal-label" colspan="2"
                    style="padding-top:16px; font-weight:bold; color:var(--farve-tekst-moerk);">
                    Ejendomsdata (BBR)</td></tr>
                <tr><td class="noegletal-label">Ejendomstype</td>
                    <td class="noegletal-vaerdi">${ed.ejendomstype ?? '—'}</td></tr>
                <tr><td class="noegletal-label">Byggeår</td>
                    <td class="noegletal-vaerdi">${ed.byggeaar ?? '—'}</td></tr>
                <tr><td class="noegletal-label">Boligareal</td>
                    <td class="noegletal-vaerdi">${ed.boligareal ? ed.boligareal + ' m²' : '—'}</td></tr>
                <tr><td class="noegletal-label">Antal værelser</td>
                    <td class="noegletal-vaerdi">${ed.antalVaerelser ?? '—'}</td></tr>
                <tr><td class="noegletal-label">Grundareal</td>
                    <td class="noegletal-vaerdi">${ed.grundareal ? ed.grundareal + ' m²' : '—'}</td></tr>
                <tr><td class="noegletal-label">Data hentet</td>
                    <td class="noegletal-vaerdi">${ed.senestHentet ? formatDato(ed.senestHentet) : '—'}</td></tr>
                ` : ''}
              </tbody>
            </table>`;

        document.getElementById('info-ep-modal-overlay').classList.add('aktiv');
    }

    /* INFOVISNING (INVESTERINGSCASE) */

    /* viser info-modalen for en investeringscase med alle finansielle parametre. Dataene er allerede i this.cases fra hentOgVisICs(). */
    visICInfo(id) {
        const ic = this.cases.find(c => String(c.investeringscaseID) === String(id));
        if (!ic) return;

        document.getElementById('info-ic-titel').textContent = ic.navn;

        const dato = new Date(ic.oprettetDato).toLocaleDateString('da-DK', {
            day: '2-digit', month: 'long', year: 'numeric'
        });

        const vis = (val, suffix = '') => val != null ? `${val}${suffix}` : '—';

        const sektion = (tekst) =>
            `<tr><td class="noegletal-label" colspan="2"
                style="padding-top:16px; font-weight:bold; color:var(--farve-tekst-moerk);">${tekst}</td></tr>`;

        document.getElementById('info-ic-indhold').innerHTML = `
            <table class="noegletal-tabel">
              <tbody>
                <tr><td class="noegletal-label">Tilknyttet ejendom</td>
                    <td class="noegletal-vaerdi">${this.undgåHTML(ic.ejendomsprofilNavn)}</td></tr>
                <tr><td class="noegletal-label">Oprettet</td>
                    <td class="noegletal-vaerdi">${dato}</td></tr>
                ${sektion('Købsdetaljer')}
                <tr><td class="noegletal-label">Ejendomspris</td>
                    <td class="noegletal-vaerdi">${vis(ic.ejendomspris, ' kr.')}</td></tr>
                <tr><td class="noegletal-label">Advokatudgifter</td>
                    <td class="noegletal-vaerdi">${vis(ic.advokatudgifter, ' kr.')}</td></tr>
                <tr><td class="noegletal-label">Tinglysningsudgifter</td>
                    <td class="noegletal-vaerdi">${vis(ic.tinglysningsudgifter, ' kr.')}</td></tr>
                <tr><td class="noegletal-label">Overtagelsesudgifter</td>
                    <td class="noegletal-vaerdi">${vis(ic.overtagelsesudgifter, ' kr.')}</td></tr>
                <tr><td class="noegletal-label">Øvrige købsomkostninger</td>
                    <td class="noegletal-vaerdi">${vis(ic.koebsomkostninger, ' kr.')}</td></tr>
                ${sektion('Lånedetaljer')}
                <tr><td class="noegletal-label">Lånebeløb</td>
                    <td class="noegletal-vaerdi">${vis(ic.laanebeloeb, ' kr.')}</td></tr>
                <tr><td class="noegletal-label">Rente</td>
                    <td class="noegletal-vaerdi">${vis(ic.rente, ' %')}</td></tr>
                <tr><td class="noegletal-label">Løbetid</td>
                    <td class="noegletal-vaerdi">${vis(ic.loebetid, ' mdr.')}</td></tr>
                <tr><td class="noegletal-label">Afdragsfri periode</td>
                    <td class="noegletal-vaerdi">${vis(ic.afdragsfriPeriode, ' mdr.')}</td></tr>
                <tr><td class="noegletal-label">Lånetype</td>
                    <td class="noegletal-vaerdi">${ic.laanetype ?? '—'}</td></tr>
                ${sektion('Renovering & Drift')}
                <tr><td class="noegletal-label">Planlagte renoveringer</td>
                    <td class="noegletal-vaerdi">${vis(ic.planlagteRenoveringOgForbedringer, ' kr.')}</td></tr>
                <tr><td class="noegletal-label">Renoveringstidspunkt</td>
                    <td class="noegletal-vaerdi">${vis(ic.renoveringstidspunkt, '. måned')}</td></tr>
                <tr><td class="noegletal-label">Driftsomkostninger pr. måned</td>
                    <td class="noegletal-vaerdi">${vis(ic.driftsomkostninger, ' kr.')}</td></tr>
                ${sektion('Udlejning')}
                <tr><td class="noegletal-label">Udlejes</td>
                    <td class="noegletal-vaerdi">${ic.udlejning ? 'Ja' : 'Nej'}</td></tr>
                <tr><td class="noegletal-label">Månedlig leje</td>
                    <td class="noegletal-vaerdi">${vis(ic.maanedligLeje, ' kr.')}</td></tr>
                <tr><td class="noegletal-label">Udlejningsudgifter pr. måned</td>
                    <td class="noegletal-vaerdi">${vis(ic.udlejningsudgifter, ' kr.')}</td></tr>
              </tbody>
            </table>`;

        document.getElementById('info-ic-modal-overlay').classList.add('aktiv');
    }

    /* Forhindrer XSS-angreb hvor data med <script>-tags eller HTML-attributter ellers ville blive fortolket og eksekveret af browseren som kode. */ 
    undgåHTML(tekst) {
        return tekst
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
}

new Portefolje();
