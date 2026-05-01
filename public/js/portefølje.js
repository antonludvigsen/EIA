class Portefolje {
    constructor() {
        this.grid = document.getElementById('portefølje-grid');
        this.antal = document.getElementById('portefølje-antal');
        this.hentOgVisPortefolje();
    }

    async hentOgVisPortefolje() {
        try {
            const svar = await fetch('/api/ejendomsprofil/portefolje');
            if (!svar.ok) throw new Error('Serverfejl');
            const profiler = await svar.json();
            this.visProfiler(profiler);
        } catch (fejl) {
            this.antal.textContent = 'Kunne ikke hente portefølje.';
        }
    }

    visProfiler(profiler) {
        this.antal.textContent = profiler.length === 0
            ? 'Ingen gemte ejendomsprofiler endnu.'
            : `${profiler.length} gemt${profiler.length === 1 ? '' : 'e'} ejendomsprofil${profiler.length === 1 ? '' : 'er'}`;

        if (profiler.length === 0) {
            this.grid.innerHTML = '<p class="portefølje-tom">Søg efter en adresse på forsiden og gem din første ejendomsprofil.</p>';
            return;
        }

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

        return `
          <div class="portefølje-kort">
            <h2 class="portefølje-kort-navn">${this.undgåHTML(profil.navn)}</h2>
            <p class="portefølje-kort-adresse">${this.undgåHTML(adresse)}</p>
            ${beskrivelse}
            <span class="portefølje-kort-dato">Oprettet ${dato}</span>
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