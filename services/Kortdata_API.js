
require('dotenv').config(); /* vi starter med at kalde .env filen så brugernavne og adgangskoder kan indlæses */

/* Kortdata_API.js leverer URL'er til to kortvisninger fra Dataforsyningen: et ortofoto (luftfoto) og et matrikelkort lagt oven på luftfotoet.
Koordinaterne der sendes ind (x, y) stammer fra DAWA_API og er i EPSG:25832. dvs. meter øst og meter nord i det danske koordinatsystem. */

class KORT_API {

    /* Konstruktøren sætter de faste værdier der bruges i begge URL-byggere. De gemmes på instansen frem for at gentages i hver metode. 
    Vi laver nogle værdier statiske så vi kan referere til dem*/
    constructor() {
        this.token = process.env.KORT_TOKEN;
        this.afsæt = 60; /* bestemmer, hvor meget af landskabet der skal med omkring det centrale punkt. */
        this.width = 800; /* px */
        this.height = 600; /* px */
    }

    /* beregnBBOX() er en privat hjælpemetode der beregner den geografiske ramme (bounding box) som WMS-kaldet skal vise. Parameterne er ejendommens koordinater*/
    beregnBBOX(x, y) {
        return {
            minX: x - this.afsæt, /* minX og minY: repræsenterer det nederste venstre hjørne af kortudsnittet */
            minY: y - this.afsæt,
            maxX: x + this.afsæt, /* maxX og maxY: Disse repræsenterer det øverste højre hjørne af udsnittet */
            maxY: y + this.afsæt
        };
    }

    /* hentLuftfotoURL() returnerer en WMS-URL der giver et ortofoto (lodret luftfoto) af ejendommen. */
    hentLuftfotoURL(x, y) {
        const { minX, minY, maxX, maxY } = this.beregnBBOX(x, y); /* beregner alle fire værdier med parameterne x og y fra beregnBBOX */

        return `https://api.dataforsyningen.dk/orto_foraar_DAF` + /* "orto_foraar_DAF": endpoint for luftfotoet */
            `?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0` + /* anvendelse af Web Map Service, vi skal bruge GetMap, og versionen 1.3.0 */
            `&LAYERS=orto_foraar&STYLES=&FORMAT=image/jpeg&TRANSPARENT=FALSE` + /* præcisering af kortlag, ingen styles, format er jpeg, og at vi behøver ikke transparanthed for visningen af luftfotoet */
            `&CRS=EPSG:25832` + /* Coordinate Reference System: de tal vi sender til BBOX er i rette format */
            `&BBOX=${minX},${minY},${maxX},${maxY}` + /* indsætter de beregnede koordinater fra før. Det definerer den geografiske ramme for kameraet */
            `&WIDTH=${this.width}&HEIGHT=${this.height}` + /* Bestemmer størrelsen på det modtagne billede i pixels */
            `&token=${this.token}`; /* vores egen token id */
    }

    /* hentMatrikelURL() returnerer en WMS-URL der viser matrikelskellene oven på luftfotoet. Matrikelkortet er et PNG med transparent baggrund (TRANSPARENT=TRUE) og kan lægges som et overlay oven på luftfotoet i browseren */
    hentMatrikelURL(x, y) {
        const { minX, minY, maxX, maxY } = this.beregnBBOX(x, y);

        return `https://api.dataforsyningen.dk/wms/MatGaeldendeOgForeloebigWMS_DAF` +
            `?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0` +
            `&LAYERS=MatrikelSkel_Gaeldende&STYLES=&FORMAT=image/png&TRANSPARENT=TRUE` + /* PNG med transparens så matrikellinjer kan ligge oven på luftfotoet */
            `&CRS=EPSG:25832` +
            `&BBOX=${minX},${minY},${maxX},${maxY}` +
            `&WIDTH=${this.width}&HEIGHT=${this.height}` +
            `&token=${this.token}`;
    }
}

module.exports = new KORT_API();
