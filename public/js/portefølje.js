class Portefolje {
    constructor() {
        this.grid = document.getElementById('portefølje-grid');
        this.opdaterModal = document.getElementById('opdater-modal-overlay');
        this.opdaterNavn = document.getElementById('opdater-navn');
        this.opdaterBeskrivelse = document.getElementById('opdater-beskrivelse');
        this.investeringModal = document.getElementById('investering-modal-overlay');
        this.formData = {};
        window.portefolje = this;
        this.tilknytModalLyttere();
        this.hentOgVisPortefolje();
    }

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
    }

    åbnOpdaterModal(id, navn, beskrivelse) {
        this.opdaterModal.dataset.id = id;
        this.opdaterNavn.value = navn;
        this.opdaterBeskrivelse.value = beskrivelse;
        this.opdaterModal.classList.add('aktiv');
    }

    lukOpdaterModal() {
        this.opdaterModal.classList.remove('aktiv');
    }

    async gemOpdatering() {
        const ejendomsprofilID = this.opdaterModal.dataset.id;
        const navn = this.opdaterNavn.value.trim();
        const beskrivelse = this.opdaterBeskrivelse.value.trim();

        if (!navn) {
            this.opdaterNavn.focus();
            return;
        }

        try {
            const svar = await fetch('/api/ejendomsprofil/opdater', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ejendomsprofilID, navn, beskrivelse })
            });
            if (!svar.ok) throw new Error('Serverfejl');
            this.lukOpdaterModal();
            location.reload();
        } catch (fejl) {
            console.error('Kunne ikke opdatere ejendomsprofil:', fejl);
            alert('Der opstod en fejl. Prøv igen.');
        }
    }

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

    visProfiler(profiler) {
        this.grid.innerHTML = profiler.map(profil => this.byggKort(profil)).join('');
    }

    byggKort(profil) {
        const adresse = `${profil.vejnavn} ${profil.husnummer}, ${profil.postnummer} ${profil.bynavn}`;
        const dato = new Date(profil.oprettetDato).toLocaleDateString('da-DK', {
            day: '2-digit', month: 'long', year: 'numeric'
        });
        const beskrivelse = profil.beskrivelse
            ? `<p class="portefølje-kort-beskrivelse">${this.undgåHTML(profil.beskrivelse)}</p>`
            : '';
        const id = profil.ejendomsprofilID || profil._id || profil.id || '';

        return `
          <div class="portefølje-kort">
            <h2 class="portefølje-kort-navn">${this.undgåHTML(profil.navn)}</h2>
            <p class="portefølje-kort-adresse">${this.undgåHTML(adresse)}</p>
            ${beskrivelse}
            <span class="portefølje-kort-dato">Oprettet ${dato}</span>
            <button class="kort-knap-primary" data-id="${id}" onclick="window.portefolje.åbnInvesteringModal(this.dataset.id)">Opret investeringscase</button>
            <div class="kort-knapper-række">
              <button class="kort-knap-opdater"
                data-id="${id}"
                data-navn="${this.undgåHTML(profil.navn)}"
                data-beskrivelse="${this.undgåHTML(profil.beskrivelse || '')}"
                onclick="window.portefolje.åbnOpdaterModal(this.dataset.id, this.dataset.navn, this.dataset.beskrivelse)">Opdater</button>
              <button class="kort-knap-slet" data-id="${id}" onclick="window.portefolje.sletEjendomsprofil(this.dataset.id)">Slet</button>
            </div>
          </div>`;
    }

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

    fjernModalFejl(inputElement) {
        inputElement.style.border = '';
        const fejlSpan = inputElement.parentElement.querySelector('.modal-fejl');
        if (fejlSpan) fejlSpan.remove();
    }

    blokerIkkeNumeriskInput(inputElement) {
        if (inputElement.dataset.blokerAttached) return;
        inputElement.dataset.blokerAttached = 'true';
        const tilladte = new Set(['0','1','2','3','4','5','6','7','8','9',
            ',','.','Backspace','Delete','Tab','ArrowLeft','ArrowRight','Home','End']);
        inputElement.addEventListener('keydown', (e) => {
            if (!tilladte.has(e.key)) e.preventDefault();
        });
    }

    visStep(n) {
        [1, 2, 3].forEach(i => {
            document.getElementById(`inv-step-${i}`).style.display = i === n ? 'flex' : 'none';
        });
    }

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
        this.visStep(1);
        this.investeringModal.classList.add('aktiv');
    }

    lukInvesteringModal() {
        this.investeringModal.classList.remove('aktiv');
    }

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
            if (!Number.isFinite(loebetid) || loebetid < 1 || loebetid > 30) {
                this.visModalFejl(felter.loebetid, 'Løbetid skal være et helt tal mellem 1 og 30.');
                gyldig = false;
            }
        }

        let afdragsfriPeriode = null;
        if (felter.afdragsfriPeriode.value.trim() !== '') {
            afdragsfriPeriode = parseInt(felter.afdragsfriPeriode.value, 10);
            if (!Number.isFinite(afdragsfriPeriode) || afdragsfriPeriode < 0) {
                this.visModalFejl(felter.afdragsfriPeriode, 'Afdragsfri periode skal være et helt tal (0 eller derover).');
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
        beloebInput.placeholder = 'fx. 250.000';
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
    }

    undgåHTML(tekst) {
        return tekst
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
}

new Portefolje();
