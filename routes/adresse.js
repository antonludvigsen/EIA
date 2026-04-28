
const express = require('express');
const router = express.Router(); /* oprettes til at have sine egne routes - mønster for at holde routes opdelt på funktionalitet i stedet for at have alle routes i server.js. */
const adresseController = require('../controllers/adresseController'); 

router.get('/soeg', adresseController.findAdresse); /* definerer at en GET-request til /soeg skal kalde findAdresse-metoden i controlleren. 

Bemærk at vi ikke skriver findAdresse() med parenteser, vi giver Express en reference til funktionen som den selv kalder med (req, res). 

Derudover angiver vi det som "soeg" og ikke "søg", da vi har at gøre med browseren her og det dermed er upraktisk at bruge danske tegn i URL-stien*/

module.exports = router; /* eksportere routeren så server.js kan registrere den */

