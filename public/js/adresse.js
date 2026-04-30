/* adresse.js forbinder søgefeltet med DAWA Autocomplete2 komponenten.
   Komponenten håndterer autocomplete, dropdown og valg af adresse automatisk. */

'use strict';

/* forbinder søgefeltet med DAWA Autocomplete2 komponenten */
dawaAutocomplete.dawaAutocomplete(document.getElementById('adresse-søgefelt'), {
    select: function (valgtAdresse) {
        /* kaldes når brugeren vælger en adresse fra dropdown-listen */
        const adresseId = valgtAdresse.data.id; /* fx. "0a3f50a3-eb37-32b8-e044-0003ba298018" */
        window.location.href = '/ejendomsprofil.html?adresseId=' + encodeURIComponent(adresseId);
    }
});