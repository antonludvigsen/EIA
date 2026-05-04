/* portefølje.js håndterer al UI-logik for porteføljesiden. Den henter og viser gemte ejendomsprofiler
   og investeringscases, styrer opdaterings- og sletningsflows, og indeholder den femtrinsmodale
   formular til oprettelse af nye investeringscases. Al kommunikation med serveren sker via fetch-kald
   til /api/ejendomsprofil/... og /api/investeringscase/... */

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
        this.hentOgVisPortefolje();
        this.hentOgVisInvesteringscases();
    }

    /* knytter alle klik-lyttere til modal-knapperne. Samles her frem for i konstruktøren
       for at holde initialiseringslogikken overskuelig. */
    tilknytModalLyttere() {
        document.getElementById('opdater-modal-annuller').addEventListener('click', () => this.lukOpdaterModal());
        document.getElementById('opdater-modal-gem').addEventListener('click', () => this.gemOpdatering());
        document.getElementById('investering-modal-annuller').addEventListener('click', () => this.lukInvesteringModal());
        document.getElementById('investering-modal-naeste').addEventListener('click', () => this.næsteStep1());
        document.getElementById('inv-step2-tilbage').addEventListener('click', () => this.tilbageStep2());
        document.getElementById('inv-step2-naeste').addEventListener('click', () => this.næsteStep2());
        document.getElementById('inv-step3-tilbage').addEventListener('click', () => this.tilbageStep3());
        document.getElementById('inv-step3-naeste').addEventListener('click', () => this.næsteStep3());
        document.getElementById('inv-tilfoej-renovering').addEventListener('click', () => this.tilfoejRenoveringRække());
        document.getElementById('inv-step4-tilbage').addEventListener('click', () => this.tilbageStep4());
        document.getElementById('inv-step4-naeste').addEventListener('click', () => this.næsteStep4());
        document.getElementById('inv-tilfoej-drift').addEventListener('click', () => this.tilfoejDriftRække());
        document.getElementById('inv-step5-tilbage').addEventListener('click', () => this.tilbageStep5());
        document.getElementById('inv-step5-opret').addEventListener('click', () => this.opretInvesteringscase());
        document.getElementById('opdater-ic-modal-annuller').addEventListener('click', () => this.lukOpdaterICModal());
        document.getElementById('opdater-ic-modal-gem').addEventListener('click', () => this.gemOpdateringIC());
    }

    /* åbner opdateringsmodalen for en ejendomsprofil og forududfylder beskrivelsesfeltet.
       id gemmes på modal-elementets dataset så gemOpdatering() kan hente det ved klik på gem-knappen. */
    åbnOpdaterModal(id, beskrivelse) {
        this.opdaterModal.dataset.id = id;
        this.opdaterBeskrivelse.value = beskrivelse;
        this.opdaterModal.classList.add('aktiv');
    }

    lukOpdaterModal() {
        this.opdaterModal.classList.remove('aktiv');
    }

    /* sender en PUT-anmodning med den opdaterede beskrivelse til serveren og genindlæser siden
       for at afspejle ændringen i porteføljekortet. */
    async gemOpdatering() {
        const ejendomsprofilID = this.opdaterModal.dataset.id;
        const beskrivelse = this.opdaterBeskrivelse.value.trim();

        try {
            const svar = await fetch('/api/ejendomsprofil/opdater', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ejendomsprofilID, beskrivelse })
            });
            if (!svar.ok) throw new Error('Serverfejl');
            this.lukOpdaterModal();
            location.reload();
        } catch (fejl) {
            console.error('Kunne ikke opdatere ejendomsprofil:', fejl);
            alert('Der opstod en fejl. Prøv igen.');
        }
    }

    /* åbner opdateringsmodalen for en investeringscase og forududfylder navn og beskrivelse. */
    åbnOpdaterICModal(id, navn, beskrivelse) {
        this.opdaterICModal.dataset.id = id;
        this.opdaterICNavn.value = navn;
        this.opdaterICBeskrivelse.value = beskrivelse;
        this.opdaterICModal.classList.add('aktiv');
    }

    lukOpdaterICModal() {
        this.opdaterICModal.classList.remove('aktiv');
    }

    /* sender en PUT-anmodning med opdateret navn og beskrivelse for en investeringscase.
       Opdaterer herefter listen uden en fuld sidereload, da investeringscases opdateres hyppigere. */
    async gemOpdateringIC() {
        const investeringscaseID = this.opdaterICModal.dataset.id;
        const navn = this.opdaterICNavn.value.trim();
        const beskrivelse = this.opdaterICBeskrivelse.value.trim();

        if (!navn) {
            this.opdaterICNavn.focus();
            return;
        }

        try {
            const svar = await fetch('/api/investeringscase/opdater', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ investeringscaseID, navn, beskrivelse })
            });
            if (!svar.ok) throw new Error('Serverfejl');
            this.lukOpdaterICModal();
            await this.hentOgVisInvesteringscases();
        } catch (fejl) {
            console.error('Kunne ikke opdatere investeringscase:', fejl);
            alert('Der opstod en fejl. Prøv igen.');
        }
    }

    /* beder brugeren bekræfte inden sletning, da handlingen ikke kan fortrydes.
       Genindlæser siden så det slettede kort forsvinder fra porteføljegriddet. */
    async sletEjendomsprofil(id) {
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

    /* henter alle gemte ejendomsprofiler fra serveren og sender dem til visProfiler().
       Fejl ignoreres stille — gridet forbliver tomt frem for at vise en fejlbesked. */
    async hentOgVisPortefolje() {
        try {
            const svar = await fetch('/api/ejendomsprofil/portefolje');
            if (!svar.ok) throw new Error('Serverfejl');
            const profiler = await svar.json();
            this.visProfiler(profiler);
        } catch (fejl) {
            // fejl ignoreres stille – grid forbliver tomt
        }
    }

    /* genererer HTML-kort for alle profiler og indsætter dem i porteføljeGriddet. */
    visProfiler(profiler) {
        this.grid.innerHTML = profiler.map(profil => this.byggKort(profil)).join('');
    }

    /* henter alle investeringscases og sender dem til visInvesteringscases(). */
    async hentOgVisInvesteringscases() {
        try {
            const svar = await fetch('/api/investeringscase/hentAlle');
            if (!svar.ok) throw new Error('Serverfejl');
            const cases = await svar.json();
            this.visInvesteringscases(cases);
        } catch (fejl) {
            // fejl ignoreres stille – grid forbliver tomt
        }
    }

    /* bygger HTML-kort for alle investeringscases og indsætter dem i investeringscase-gridet.
       data-id, data-navn og data-beskrivelse bruges til at videregive ID og tekst til onclick-handleren,
       da inline HTML-attributter ikke kan tilgå lokale JavaScript-variabler direkte. */
    visInvesteringscases(cases) {
        const grid = document.getElementById('investeringscase-grid');
        if (!grid) return;
        grid.innerHTML = cases.map(ic => {
            const dato = new Date(ic.oprettetDato).toLocaleDateString('da-DK', {
                day: '2-digit', month: 'long', year: 'numeric'
            });
            const beskrivelse = ic.beskrivelse
                ? `<p class="portefølje-kort-beskrivelse">${this.undgåHTML(ic.beskrivelse)}</p>`
                : '';
            const id = ic.investeringscaseID;
            return `
              <div class="portefølje-kort">
                <h2 class="portefølje-kort-navn">${this.undgåHTML(ic.navn)}</h2>
                <p class="portefølje-kort-adresse">${this.undgåHTML(ic.ejendomsprofilNavn)}</p>
                ${beskrivelse}
                <span class="portefølje-kort-dato">Oprettet ${dato}</span>
                <button class="kort-knap-primary" data-id="${id}" onclick="window.portefolje.simulerCase(this.dataset.id)">Simuler case</button>
                <button class="kort-knap-primary" data-id="${id}" onclick="window.portefolje.sammenlignCase(this.dataset.id)">Sammenlign cases</button>
                <div class="kort-knapper-række">
                  <button class="kort-knap-opdater"
                    data-id="${id}"
                    data-navn="${this.undgåHTML(ic.navn)}"
                    data-beskrivelse="${this.undgåHTML(ic.beskrivelse || '')}"
                    onclick="window.portefolje.åbnOpdaterICModal(this.dataset.id, this.dataset.navn, this.dataset.beskrivelse)">Opdater</button>
                  <button class="kort-knap-slet" data-id="${id}" onclick="window.portefolje.sletInvesteringscase(this.dataset.id)">Slet</button>
                </div>
              </div>`;
        }).join('');
    }

    /* beder brugeren bekræfte inden sletning og opdaterer derefter listen uden fuld sidereload. */
    async sletInvesteringscase(id) {
        if (!confirm('Er du sikker på, at du vil slette denne investeringscase? Dette kan ikke fortrydes.')) return;
        try {
            const svar = await fetch(`/api/investeringscase/slet/${id}`, { method: 'DELETE' });
            if (!svar.ok) throw new Error('Serverfejl');
            await this.hentOgVisInvesteringscases();
        } catch (fejl) {
            console.error('Kunne ikke slette investeringscase:', fejl);
            alert('Der opstod en fejl. Prøv igen.');
        }
    }

    simulerCase(investeringscaseID) {
        window.location.href = `/simuler_case.html?id=${investeringscaseID}`;
    }

    sammenlignCase(investeringscaseID) {
        window.location.href = `/sammenlign_cases.html?id=${investeringscaseID}`;
    }

    /* bygger HTML-strengen for ét ejendomsprofilkort. Adressefelterne fra databasen samles til
       én læsbar adressestreng. data-beskrivelse bruges til at videregive beskrivelsen til
       opdateringsmodalen via onclick-attributten uden at indlejre den som en JS-variabel. */
    byggKort(profil) {
        const adresse = `${profil.vejnavn} ${profil.husnummer}, ${profil.postnummer} ${profil.bynavn}`;
        const dato = new Date(profil.oprettetDato).toLocaleDateString('da-DK', {
            day: '2-digit', month: 'long', year: 'numeric'
        });
        const beskrivelse = profil.beskrivelse
            ? `<p class="portefølje-kort-beskrivelse">${this.undgåHTML(profil.beskrivelse)}</p>`
            : '';
        const id = profil.ejendomsprofilID || profil._id || profil.id || ''; /* forsøger alle mulige ID-felter for robusthed */

        return `
          <div class="portefølje-kort">
            <h2 class="portefølje-kort-navn">${this.undgåHTML(profil.navn)}</h2>
            ${beskrivelse}
            <span class="portefølje-kort-dato">Oprettet ${dato}</span>
            <button class="kort-knap-primary" data-id="${id}" onclick="window.portefolje.åbnInvesteringModal(this.dataset.id)">Opret investeringscase</button>
            <div class="kort-knapper-række">
              <button class="kort-knap-opdater"
                data-id="${id}"
                data-beskrivelse="${this.undgåHTML(profil.beskrivelse || '')}"
                onclick="window.portefolje.åbnOpdaterModal(this.dataset.id, this.dataset.beskrivelse)">Opdater</button>
              <button class="kort-knap-slet" data-id="${id}" onclick="window.portefolje.sletEjendomsprofil(this.dataset.id)">Slet</button>
            </div>
          </div>`;
    }

    /* viser en fejlbesked under et inputfelt ved at farve kanten rød og indsætte et span-element.
       Opretter kun et nyt span-element hvis der ikke allerede findes et — forhindrer duplikerede fejlbeskeder. */
    visModalFejl(inputElement, besked) {
        inputElement.style.border = '1px solid #c0392b';
        let fejlSpan = inputElement.parentElement.querySelector('.modal-fejl');
        if (!fejlSpan) {
            fejlSpan = document.createElement('span');
            fejlSpan.className = 'modal-fejl';
            inputElement.insertAdjacentElement('afterend', fejlSpan);
        }
        fejlSpan.textContent = besked;
    }

    /* fjerner fejlmarkering fra et inputfelt — kaldes både ved navigation til næste trin
       og når feltets indhold valideres korrekt. */
    fjernModalFejl(inputElement) {
        inputElement.style.border = '';
        const fejlSpan = inputElement.parentElement.querySelector('.modal-fejl');
        if (fejlSpan) fejlSpan.remove();
    }

    /* forhindrer brugeren i at skrive bogstaver og specialtegn i numeriske inputfelter.
       Komma og punktum er begge tilladt, da danske decimaltal kan skrives med komma,
       mens browseren selv sender tallet med punktum til JavaScript.
       dataset.blokerAttached bruges som en vagt der forhindrer at samme keydown-lytter
       tilknyttes flere gange, hvis modalen åbnes og lukkes gentagne gange. */
    blokerIkkeNumeriskInput(inputElement) {
        if (inputElement.dataset.blokerAttached) return;
        inputElement.dataset.blokerAttached = 'true';
        const tilladte = new Set(['0','1','2','3','4','5','6','7','8','9',
            ',','.','Backspace','Delete','Tab','ArrowLeft','ArrowRight','Home','End']);
        inputElement.addEventListener('keydown', (e) => {
            if (!tilladte.has(e.key)) e.preventDefault();
        });
    }

    /* skifter det synlige trin i investeringscasemodalen ved at vise ét step og skjule alle andre. */
    visStep(n) {
        [1, 2, 3, 4, 5].forEach(i => {
            document.getElementById(`inv-step-${i}`).style.display = i === n ? 'flex' : 'none';
        });
    }

    /* åbner investeringscasemodalen og nulstiller alle felter og formData, så tidligere indtastninger
       ikke genbruges hvis brugeren åbner modalen for en anden ejendomsprofil. */
    åbnInvesteringModal(ejendomsprofilID) {
        this.investeringModal.dataset.id = ejendomsprofilID;
        this.formData = {};
        const alleNumeriske = ['inv-ejendomspris', 'inv-advokatudgifter', 'inv-tinglysningsudgifter',
            'inv-overtagelsesudgifter', 'inv-koebsomkostninger',
            'inv-laanebeloeb', 'inv-rente', 'inv-loebetid', 'inv-afdragsfri',
            'inv-renoveringstidspunkt'];
        alleNumeriske.forEach(id => {
            const el = document.getElementById(id);
            el.value = '';
            this.fjernModalFejl(el);
            this.blokerIkkeNumeriskInput(el);
        });
        const laanetype = document.getElementById('inv-laanetype');
        laanetype.value = '';
        this.fjernModalFejl(laanetype);
        document.getElementById('inv-renovering-liste').innerHTML = '';
        document.getElementById('inv-drift-liste').innerHTML = '';
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

    /* validerer trin 1 (købsdetaljer) og gemmer de godkendte værdier i this.formData.køb.
       Ejendomspris er påkrævet. De øvrige felter er valgfrie, men valideres for gyldigt format
       hvis de udfyldes. */
    næsteStep1() {
        const felter = {
            ejendomspris:        document.getElementById('inv-ejendomspris'),
            advokatudgifter:     document.getElementById('inv-advokatudgifter'),
            tinglysningsudgifter:document.getElementById('inv-tinglysningsudgifter'),
            overtagelsesudgifter:document.getElementById('inv-overtagelsesudgifter'),
            koebsomkostninger:   document.getElementById('inv-koebsomkostninger'),
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
            advokatudgifter:      parseFloat(felter.advokatudgifter.value)      || 0,
            tinglysningsudgifter: parseFloat(felter.tinglysningsudgifter.value) || 0,
            overtagelsesudgifter: parseFloat(felter.overtagelsesudgifter.value) || 0,
            koebsomkostninger:    parseFloat(felter.koebsomkostninger.value)    || 0,
        };
        console.log('Step 1 complete', this.formData);
        this.visStep(2);
    }

    /* gendanner de tidligere indtastede værdier i trin 1 når brugeren navigerer tilbage.
       Bevarelse af data er vigtigt for brugeroplevelsen — tab af data ville gøre flowet ubrugeligt. */
    tilbageStep2() {
        const k = this.formData.køb || {};
        document.getElementById('inv-ejendomspris').value        = k.ejendomspris        || '';
        document.getElementById('inv-advokatudgifter').value     = k.advokatudgifter     || '';
        document.getElementById('inv-tinglysningsudgifter').value= k.tinglysningsudgifter|| '';
        document.getElementById('inv-overtagelsesudgifter').value= k.overtagelsesudgifter|| '';
        document.getElementById('inv-koebsomkostninger').value   = k.koebsomkostninger   || '';
        ['inv-ejendomspris', 'inv-advokatudgifter', 'inv-tinglysningsudgifter',
         'inv-overtagelsesudgifter', 'inv-koebsomkostninger'].forEach(id => {
            this.fjernModalFejl(document.getElementById(id));
        });
        this.visStep(1);
    }

    /* validerer trin 2 (lånedetaljer) og gemmer de godkendte værdier i this.formData.laan.
       Alle felter er valgfrie, men valideres for gyldigt format og logisk sammenhæng
       (afdragsfri periode skal være kortere end løbetiden). */
    næsteStep2() {
        const felter = {
            laanebeloeb:      document.getElementById('inv-laanebeloeb'),
            rente:            document.getElementById('inv-rente'),
            loebetid:         document.getElementById('inv-loebetid'),
            afdragsfriPeriode:document.getElementById('inv-afdragsfri'),
            laanetype:        document.getElementById('inv-laanetype'),
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
        console.log('Step 2 complete', this.formData);
        this.visStep(3);
    }

    /* opretter en ny dynamisk række i renoveringslisten.
       Hver række har et navnfelt, et beløbsfelt og en fjern-knap der sletter rækken fra DOM'en. */
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
        this.blokerIkkeNumeriskInput(beloebInput);

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

    /* gendanner trin 2-felterne og renoveringslistens rækker fra formData når brugeren navigerer tilbage. */
    tilbageStep3() {
        const l = this.formData.laan || {};
        document.getElementById('inv-laanebeloeb').value  = l.laanebeloeb        ?? '';
        document.getElementById('inv-rente').value        = l.rente              ?? '';
        document.getElementById('inv-loebetid').value     = l.loebetid           ?? '';
        document.getElementById('inv-afdragsfri').value   = l.afdragsfriPeriode  ?? '';
        document.getElementById('inv-laanetype').value    = l.laanetype          ?? '';
        ['inv-laanebeloeb', 'inv-rente', 'inv-loebetid', 'inv-afdragsfri', 'inv-laanetype'].forEach(id => {
            this.fjernModalFejl(document.getElementById(id));
        });
        this.visStep(2);
    }

    /* validerer trin 3 (renovering). Rækker med gyldigt beløb gemmes med beløbet; rækker med
       kun et navn (uden beløb) gemmes med null. Rækker der er helt tomme ignoreres. */
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
            const harNavn     = navnInput.value.trim() !== '';
            const harBeloeb   = beloebInput.value.trim() !== '';

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
        console.log('Step 3 complete', this.formData);
        this.visStep(4);
    }

    /* opretter en ny dynamisk række i driftslisten — samme mønster som tilfoejRenoveringRække(). */
    tilfoejDriftRække() {
        const liste = document.getElementById('inv-drift-liste');

        const kort = document.createElement('div');
        kort.className = 'renovering-kort';

        const navnInput = document.createElement('input');
        navnInput.type = 'text';
        navnInput.className = 'modal-input';
        navnInput.placeholder = 'Navn på omkostning';
        navnInput.style.cssText = 'flex:1; min-width:0;';

        const beloebInput = document.createElement('input');
        beloebInput.type = 'number';
        beloebInput.className = 'modal-input';
        beloebInput.min = '0';
        beloebInput.step = '0.01';
        beloebInput.placeholder = 'fx. 10.000';
        beloebInput.style.cssText = 'flex:1; min-width:0;';
        this.blokerIkkeNumeriskInput(beloebInput);

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

    /* validerer trin 4 (driftsomkostninger) og sætter udlejningstoggle-lytteren op.
       toggle.onchange tildeles direkte (frem for addEventListener) fordi modalen kan åbnes og lukkes
       flere gange — direkte tildeling overskriver den tidligere lytter, mens addEventListener
       ville stable lyttere op og afvikle dem flere gange ved hvert klik. */
    næsteStep4() {
        const korts = document.getElementById('inv-drift-liste').querySelectorAll('.renovering-kort');

        let gyldig = true;
        korts.forEach(kort => this.fjernModalFejl(kort.querySelectorAll('input')[1]));

        const poster = [];
        korts.forEach(kort => {
            const inputs = kort.querySelectorAll('input');
            const navnInput   = inputs[0];
            const beloebInput = inputs[1];
            const harNavn     = navnInput.value.trim() !== '';
            const harBeloeb   = beloebInput.value.trim() !== '';

            if (harBeloeb) {
                const beloeb = parseFloat(beloebInput.value);
                if (!Number.isFinite(beloeb) || beloeb < 0) {
                    this.visModalFejl(beloebInput, 'Indtast et gyldigt beløb (0 eller derover).');
                    gyldig = false;
                } else {
                    poster.push({ navn: navnInput.value.trim(), maanedligBeloeb: beloeb });
                }
            } else if (harNavn) {
                poster.push({ navn: navnInput.value.trim(), maanedligBeloeb: null });
            }
        });

        if (!gyldig) return;

        this.formData.drift = { poster };
        console.log('Step 4 complete', this.formData);

        ['inv-maanedlig-leje', 'inv-udlejningsudgifter'].forEach(id => {
            this.blokerIkkeNumeriskInput(document.getElementById(id));
        });
        const toggle = document.getElementById('udlejning-toggle');
        const detaljer = document.getElementById('udlejning-detaljer');
        toggle.onchange = () => {
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
        const liste = document.getElementById('inv-drift-liste');
        liste.innerHTML = '';
        (d.poster || []).forEach(post => {
            this.tilfoejDriftRække();
            const korts = liste.querySelectorAll('.renovering-kort');
            const kort = korts[korts.length - 1];
            const inputs = kort.querySelectorAll('input');
            inputs[0].value = post.navn || '';
            inputs[1].value = post.maanedligBeloeb ?? '';
        });
        this.visStep(4);
    }

    /* samler data fra alle fem trin og sender dem til serveren som ét POST-kald.
       planlagteRenoveringOgForbedringer og driftsomkostninger beregnes her ved at summere
       beløbene fra renoveringsposterne og driftsposterne via reduce — serveren gemmer kun totaler,
       ikke de individuelle poster. */
    async opretInvesteringscase() {
        const toggle        = document.getElementById('udlejning-toggle');
        const lejeEl        = document.getElementById('inv-maanedlig-leje');
        const udgiftEl      = document.getElementById('inv-udlejningsudgifter');
        const navnEl        = document.getElementById('inv-case-navn');
        const beskrivelseEl = document.getElementById('inv-case-beskrivelse');
        const udlejning     = toggle.checked;

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
            ejendomspris:                      køb.ejendomspris ?? null,
            advokatudgifter:                   køb.advokatudgifter ?? null,
            tinglysningsudgifter:              køb.tinglysningsudgifter ?? null,
            overtagelsesudgifter:              køb.overtagelsesudgifter ?? null,
            koebsomkostninger:                 køb.koebsomkostninger ?? null,
            laanebeloeb:                       laan.laanebeloeb ?? null,
            rente:                             laan.rente ?? null,
            loebetid:                          laan.loebetid ?? null,
            afdragsfriPeriode:                 laan.afdragsfriPeriode ?? null,
            laanetype:                         laan.laanetype ?? null,
            planlagteRenoveringOgForbedringer: (renovering.poster || []).reduce((sum, p) => sum + (p.beloeb || 0), 0), /* summer alle renoveringsbeløb til ét samlet tal */
            renoveringstidspunkt:              renovering.renoveringstidspunkt ?? null,
            driftsomkostninger:                (drift.poster || []).reduce((sum, p) => sum + (p.maanedligBeloeb || 0), 0), /* summer alle månedlige driftsomkostninger */
            udlejning,
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
            await this.hentOgVisInvesteringscases();
        } catch (fejl) {
            console.error('Kunne ikke oprette investeringscase:', fejl.message);
            alert('Der opstod en fejl. Prøv igen.');
        }
    }

    /* escaper HTML-specialtegn inden brugerdata indsættes i template literals.
       Forhindrer XSS-angreb hvor data med <script>-tags eller HTML-attributter ellers
       ville blive fortolket og eksekveret af browseren som kode. */
    undgåHTML(tekst) {
        return tekst
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
}

new Portefolje();
