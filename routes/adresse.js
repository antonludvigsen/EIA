/* adresse.js definerer det ene HTTP-endpoint der er tilgængeligt under /api/adresse/.
Routeren indeholder ingen forretningslogik. Den videresender blot kaldet til controlleren. */

const express = require('express');
const router = express.Router();
const adresseController = require('../controllers/adresseController');

router.get('/soeg', adresseController.findAdresse);

module.exports = router;

