/* adresse.js håndterer alt UI logik for adressesøgningen
Der kaldes /api/adresse/soeg via fetch() og viser resultater */

const soegefelt = document.getElementById('adresse-soegefelt');
const resultatListe = document.getElementById('soege-resultater');

soegefelt.addEventListener('input', async function () { /* lytter på hvert enkelt tastetryk i søgefeltet. Hver gang brugeren taster et tegn, køres funktionen automatisk. Det er det der giver autocomplete-effekten. */
    const søgning = soegefelt.value;

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
        resultatListe.appendChild(li);
      }
    } catch (fejl) {
        console.error('fejl ved adressesøgning', fejl);
    }
});