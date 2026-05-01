class Portefolje {
    constructor() {
        this.grid = document.getElementById('portefølje-grid');
        this.opdaterModal = document.getElementById('opdater-modal-overlay');
        this.opdaterNavn = document.getElementById('opdater-navn');
        this.opdaterBeskrivelse = document.getElementById('opdater-beskrivelse');
        window.portefolje = this;
        this.tilknytModalLyttere();
        this.hentOgVisPortefolje();
    }

    tilknytModalLyttere() {
        document.getElementById('opdater-modal-annuller').addEventListener('click', () => this.lukOpdaterModal());
        document.getElementById('opdater-modal-gem').addEventListener('click', () => this.gemOpdatering());
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
            <button class="kort-knap-primary" data-id="${id}" onclick="console.log('Opret investeringscase:', this.dataset.id)">Opret investeringscase</button>
            <div class="kort-knapper-række">
              <button class="kort-knap-opdater"
                data-id="${id}"
                data-navn="${this.undgåHTML(profil.navn)}"
                data-beskrivelse="${this.undgåHTML(profil.beskrivelse || '')}"
                onclick="window.portefolje.åbnOpdaterModal(this.dataset.id, this.dataset.navn, this.dataset.beskrivelse)">Opdater</button>
              <button class="kort-knap-slet" data-id="${id}" onclick="console.log('Slet:', this.dataset.id)">Slet</button>
            </div>
          </div>`;
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
