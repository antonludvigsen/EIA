/* simuleringController.js styrer hele simuleringsflowet: den modtager HTTP-kald fra routeren, henter investeringsparametre fra databasen, kører simuleringen og gemmer resultatet.

Controlleren er det eneste sted hvor domæneklassen Simulering instansieres, altså den fungerer som bro mellem HTTP-laget og domænelogikken, og kender til begge sider. Repositorierne og domæneklasserne kender jo ikke til req eller res. */

const { Simulering } = require('../domain/simulering');
const simuleringRepositorium = require('../repositories/simuleringRepositorium');
const investeringscaseRepositorium = require('../repositories/investeringscaseRepositorium');

/* sample() tager det 12. element i hvert års data (index 11, 23, 35...) fra et månedligt array og returnerer et array med en værdi per år. Den bruges i hentSenesteSimulering() fordi vi der arbejder med rå JSON-arrays fra databasen, ikke SimuleringResultat-objekter. SimuleringResultat har sin egen identiske sample()-metode og denne funktion eksisterer separat for at undgå at instansiere et domæneobjekt kun til dette formål. */
function sample(maanedligArray) {
    const aarlige = [];
    for (let i = 11; i < maanedligArray.length; i += 12) {
        aarlige.push(maanedligArray[i]);
    }
    return aarlige;
}

class SimuleringController {

    /* eksekverSimulering() er det primære endpoint der kører en ny simulering og gemmer resultatet.
    Flowet er: 
    1. hent parametre
    2. null-sikr valgfrie felter
    3. kør domænesimulering
    4. gem i DB
    5. returner til frontend.

    Domæneklassen Simulering.eksekver() kaster en fejl ved ugyldige parametre og den fanges i catch-blokken. */
    eksekverSimulering = async (req, res) => {
        try {
            const { investeringscaseID, tidshorisont } = req.body;

            if (!investeringscaseID || !tidshorisont || tidshorisont < 30) {
                return res.status(400).json({ fejl: 'investeringscaseID og tidshorisont (min. 30) er påkrævet' }); /* tidshorisont skal være mindst 30 år for at give meningsfulde investeringsresultater. */
            }

            /* hent parametre fra databasen som et plain objekt, ikke en InvesteringsParametre-instans */
            const raaParametre = await investeringscaseRepositorium.hentParametreForCase(investeringscaseID);
            if (!raaParametre) {
                return res.status(404).json({ fejl: 'Ingen parametre fundet for denne investeringscase' });
            }

            /* null-sikre valgfrie numeriske felter så domæneklassen ikke modtager null. Domæneklassen forventer tal, null ville give NaN i beregningerne. */
            const parametre = {
                ...raaParametre, /* Vi bruger spread-operatoren for at bevare felter uændrede */
                afdragsfriPeriode: raaParametre.afdragsfriPeriode ?? 0,
                driftsomkostninger: raaParametre.driftsomkostninger               ?? 0,
                koebsomkostninger: raaParametre.koebsomkostninger ?? 0,
                advokatudgifter: raaParametre.advokatudgifter ?? 0,
                tinglysningsudgifter: raaParametre.tinglysningsudgifter ?? 0,
                overtagelsesudgifter: raaParametre.overtagelsesudgifter ?? 0,
                planlagteRenoveringOgForbedringer: raaParametre.planlagteRenoveringOgForbedringer ?? 0,
                maanedligLeje: raaParametre.maanedligLeje ?? 0,
                udlejningsudgifter: raaParametre.udlejningsudgifter ?? 0,
            };

            /* kør domænesimuleringen. ingen databasekald herfra, al logik er i domæneklassen */
            const sim = new Simulering(tidshorisont);
            const resultat = sim.eksekver(parametre);

            /* gem simulering og resultat i databasen. det er to separate kald fordi Simulering-rækken skal oprettes først for at vi kan få dens ID til SimuleringResultat */
            const simuleringID = await simuleringRepositorium.gemSimulering(investeringscaseID, tidshorisont);

            await simuleringRepositorium.gemSimuleringResultat(simuleringID, resultat);

            /* returner både månedlige og årlige arrays så frontend kan vælge. De månedlige bruges til år-0-datapunktet; de årlige bruges til grafernes x-akse. */
            res.status(200).json({
                maanedlige: {
                    egenkapital: resultat.egenkapitalOverTid,
                    cashflow: resultat.cashflowOverTid,
                    gaeld: resultat.gaeldOverTid,
                    aktiver: resultat.aktiverOverTid,
                    likviditetsholdning: resultat.likviditetsholdningOverTid
                },
                aarlige: {
                    egenkapital: resultat.egenkapitalAarligt,
                    cashflow: resultat.cashflowAarligt,
                    gaeld: resultat.gaeldAarligt,
                    aktiver: resultat.aktiverAarligt,
                    likviditetsholdning: resultat.likviditetsholdningAarligt
                },
                tidshorisont: tidshorisont
            });

        } catch (fejl) {
            console.error('Fejl i eksekverSimulering:', fejl);
            res.status(500).json({ fejl: 'Kunne ikke gennemføre simulering' });
        }
    }

    /* hentSenesteSimulering() henter det valgte simuleringsresultat for en given investeringscase. Resultatet er gemt som JSON-string i databasen og skal parses inden det returneres. Metoden returnerer nøjagtigt samme format som eksekverSimulering() og det gør at frontend kan kalde begge endpoints og behandle svaret identisk. */ 
    hentSenesteSimulering = async (req, res) => {
        try {
            const investeringscaseID = parseInt(req.params.investeringscaseID);
            if (!investeringscaseID) return res.status(400).json({ fejl: 'investeringscaseID mangler' });

            const row = await simuleringRepositorium.hentSenesteSimulering(investeringscaseID);
            if (!row) return res.status(404).json({ fejl: 'Ingen simulering fundet for denne case' });

            /* de tre grundlæggende kolonner er altid til stede — de to nye guards med ? */
            const egenkapital = JSON.parse(row.egenkapitalOverTid);
            const cashflow = JSON.parse(row.cashflowOverTid);
            const gaeld = JSON.parse(row.gaeldOverTid);
            /* De to nye kolonner (aktiverOverTid og likviditetsholdningOverTid) henter JSON-data fra databaserækken "row". De beskytter også mod null eller manglende værdier ved at fallbacke til et tomt array */
            const aktiver = row.aktiverOverTid ? JSON.parse(row.aktiverOverTid) : [];
            const likviditetsholdning = row.likviditetsholdningOverTid ? JSON.parse(row.likviditetsholdningOverTid) : [];

            /* de årlige arrays beregnes her ved at sample de månedlige arrays,
            da de ikke er gemt separat i databasen */
            res.status(200).json({
                maanedlige: { egenkapital, cashflow, gaeld, aktiver, likviditetsholdning },
                aarlige: {
                    egenkapital: sample(egenkapital),
                    cashflow: sample(cashflow),
                    gaeld: sample(gaeld),
                    aktiver: sample(aktiver),
                    likviditetsholdning: sample(likviditetsholdning)
                },
                tidshorisont: row.tidshorisont
            });
        } catch (fejl) {
            console.error('Fejl i hentSenesteSimulering:', fejl);
            res.status(500).json({ fejl: 'Kunne ikke hente simuleringsresultat' });
        }
    }
}

module.exports = new SimuleringController();
