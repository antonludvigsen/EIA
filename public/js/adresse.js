/* adresse.js forbinder søgefeltet med DAWA Autocomplete2 komponenten.
   Komponenten håndterer autocomplete, dropdown og valg af adresse automatisk. */

'use strict';

/* forbinder søgefeltet med DAWA Autocomplete2 komponenten */
dawaAutocomplete.dawaAutocomplete(document.getElementById('adresse-soegefelt'), {
    select: function (valgtAdresse) {
        /* kaldes når brugeren vælger en adresse fra dropdown-listen */
        const adresseId = valgtAdresse.data.id;
        window.location.href = '/ejendomsprofil.html?adresseId=' + encodeURIComponent(adresseId);
    }
});