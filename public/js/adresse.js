/* adresse.js håndterer alt UI logik for adressesøgningen
Der kaldes /api/adresse/soeg via fetch() og viser resultater */

const soegefelt = document.getElementById('adresse-soegefelt');
const resultatListe = document.getElementById('soege-resultater');

/* vi sætter en variabel der kan bruges til at gemme den valgte adresse (så SØG-knappen kan bruge den) */
let valgtAdresse = null;

soegefelt.addEventListener('input', async function () { /* lytter på hvert enkelt tastetryk i søgefeltet. Hver gang brugeren taster et tegn, køres funktionen automatisk. Det er det der giver autocomplete-effekten. */
  const søgning = soegefelt.value;

  /* hver gang brugeren trykker på søgefeltet, nulstilles valgt adresse */
  valgtAdresse = null;

  /* Ryd listen hvis søgefeltet er tomt */
  if (!søgning || søgning.trim() === '') {
    resultatListe.innerHTML = '';
    return;
  }

  try {
    const response = await fetch(`/api/adresse/soeg?q=${encodeURIComponent(søgning)}`); /* kalder vores Express-endpoint, og encodeURIComponent sikrer at specialtegn som æ, ø og å kodes korrekt i URL'en. */
    const data = await response.json();

    /* vi vil gerne ryde alle tidligere resultater */
    resultatListe.innerHTML = '';

    /* og tilføje hvert resultat som en liste */
    for (let i = 0; i < data.length; i++) {
      const li = document.createElement('li');
      li.textContent = data[i].forslagstekst;

      /* når brugeren klikker på et resultat */
      li.addEventListener('click', function () {

        if (data[i].type === 'adresse') { /* fuldt valgt adresse, luk listen og gem */
          /* vises den valgte adresse først statisk i søgefeltet */
          soegefelt.value = data[i].forslagstekst;

          /* gem adresseobjektet til at bruge videre */
          valgtAdresse = data[i];

          /* skjul resultatlisten */
          resultatListe.innerHTML = '';
        } else { /* vejnavn eller by valgt, søg videre med det valgte tekst */
          soegefelt.value = data[i].tekst;
          valgtAdresse = null;
          resultatListe.innerHTML = '';
          soegefelt.dispatchEvent(new Event('input'));
        }
      });

      resultatListe.appendChild(li);
    }
  } catch (fejl) {
    console.error('fejl ved adressesøgning', fejl);
  }
});

/* SØG-knappen */

const søgknap = document.querySelector('.hero-soeg-knap'); /* henter søgknappen */

søgknap.addEventListener('click', function () {

  /* validering om den valgte adresse er fra listen */
  if (!valgtAdresse) {
    alert('Vælg venligst en adresse fra listen');
    return;
  }

  /* herfra sender vi brugeren videre med den valgte adresse som URL parameter */
  const adresseId = valgtAdresse.data.id;
  window.location.href = `/ejendomsprofil.html?adresseId=${encodeURIComponent(adresseId)}`;
});

