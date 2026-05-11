/* adresse.js forbinder søgefeltet med DAWA Autocomplete2 komponenten. 

Komponenten håndterer autocomplete-dropdown og valg af adresse automatisk via en extern JS-pakke:
    (<scrip src="dawa-autocomplete2.min.js">)

vi konfigurerer den kun med select-callback'et, der sender brugeren videre med adressens unikke ID som query-parameter. */

'use strict'; /* Vedligeholdbarhed: vi aktiverer strict mode, som er en skærpet fortolkningstilstand der fanger flere fejl og forbyder visse usikre mønstre. */

dawaAutocomplete.dawaAutocomplete(document.getElementById('adresse-søgefelt'), {
    select: function (valgtAdresse) { /* fx. "Ordrup Jagtvej 21, 2920 Charlottenlund" */
        const adresseId = valgtAdresse.data.id; /* ID: fx "0a3f50a3-eb37-32b8-e044-0003ba298018" */
        window.location.href = '/ejendomsprofil.html?adresseId=' + encodeURIComponent(adresseId); /* encodeURIComponent sikrer at UUID'et ikke ødelægges i URL'en */
    }
});