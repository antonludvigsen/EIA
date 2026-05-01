
require('dotenv').config(); /* vi starter med at kalde .env filen så brugernavne og adgangskoder kan indlæses */

/* --- Hentning af luftfoto, matrikelkort og highlighting på matriklne fra Dataforsyningen --- */

class KORT_API {

    constructor() { /* vi laver nogle værdier statiske så vi kan referere til dem */
        this.token = process.env.KORT_TOKEN;
        this.afsæt = 60; /* bestemmer, hvor meget af landskabet der skal med omkring det centrale punkt. Da koden benytter koordinatsystemet EPSG:25832, arbejdes der i meter */
        this.width = 800; /* px */
        this.height = 600; /* px */
    }

    /* En privat hjælpe-metode til at beregne BBOX, så vi ikke gentager kode */
    beregnBBOX(x, y) {
        return {
            minX: x - this.afsæt, /* minX og minY: repræsenterer det nederste venstre hjørne af kortudsnittet. Ved at trække 80 meter fra de centrale koordinater, flyttes kanten mod vest og syd. */
            minY: y - this.afsæt,
            maxX: x + this.afsæt, /* maxX og maxY: Disse repræsenterer det øverste højre hjørne af udsnittet */
            maxY: y + this.afsæt
        };
    }

    /* returnere et luftfoto af ejendommen baseret på koordinater fra DAWA (x og y) */
    hentLuftfotoURL(x, y) {
        const { minX, minY, maxX, maxY } = this.beregnBBOX(x, y); /* beregner alle fire værdier med parameterne x og y fra beregnBBOX */

        return `https://api.dataforsyningen.dk/orto_foraar_DAF` + /* "orto_foraar_DAR": endpoint for luftfotoet */
            `?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0` + /* anvendelse af Web Map Service, vi skal bruge GetMap, og versionen 1.3.0 */
            `&LAYERS=orto_foraar&STYLES=&FORMAT=image/jpeg&TRANSPARENT=FALSE` + /* præcisering af kortlag, ingen styles, format er jpeg, og at vi behøver ikke transparanthed for visningen af luftfotoet */
            `&CRS=EPSG:25832` + /* Coordinate Reference System: de tal vi sender til BBOX er i rette format */
            `&BBOX=${minX},${minY},${maxX},${maxY}` + /* indsætter de beregnede koordinater fra før. Det definerer den geografiske ramme, som kameraet skal fokusere på */
            `&WIDTH=${this.width}&HEIGHT=${this.height}` + /* Bestemmer størrelsen på det modtagne billede i pixels */
            `&token=${this.token}`; /* vores egen token id vi fik fra dataforsyningen.dk */
    }

    /* Returnerer en matrikel over luftfotoet (igen, baseret på DAWA koordinaterne (x og y)) */
    hentMatrikelURL(x, y) {
        const { minX, minY, maxX, maxY } = this.beregnBBOX(x, y);

        return `https://api.dataforsyningen.dk/wms/MatGaeldendeOgForeloebigWMS_DAF` +
            `?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0` +
            `&LAYERS=MatrikelSkel_Gaeldende&STYLES=&FORMAT=image/png&TRANSPARENT=TRUE` +
            `&CRS=EPSG:25832` +
            `&BBOX=${minX},${minY},${maxX},${maxY}` +
            `&WIDTH=${this.width}&HEIGHT=${this.height}` +
            `&token=${this.token}`;
    }
}

module.exports = new KORT_API();
