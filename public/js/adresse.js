/* adresse.js forbinder søgefeltet med DAWA Autocomplete2 komponenten.
   Komponenten håndterer autocomplete, dropdown og valg af adresse automatisk. */

'use strict';

/* forbinder søgefeltet med DAWA Autocomplete2 komponenten */
dawaAutocomplete.dawaAutocomplete(document.getElementById('adresse-søgefelt'), { /* henter den adresse der er valgt i dropdown */
    select: function (valgtAdresse) { /* fx. "Ordrup Jagtvej 21, 2920 Charlottenlund" */
        const adresseId = valgtAdresse.data.id; /* bliver til "0a3f50a3-eb37-32b8-e044-0003ba298018" */
        window.location.href = '/ejendomsprofil.html?adresseId=' + encodeURIComponent(adresseId); /* sender brugeren videre til ejendomsprofilens side */
    }
});