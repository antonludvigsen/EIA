/* investeringscase.js definerer de HTTP-endpoints der er tilgængelige under /api/investeringscase/.
   Hvert endpoint knyttes til en metode i controlleren — routerne indeholder ingen forretningslogik,
   de videredelegerer blot kaldet til den rette controller-metode. */

const express = require('express');
const router = express.Router();
const investeringscaseController = require('../controllers/investeringscaseController');

/* POST /api/investeringscase/opret */
router.post('/opret', investeringscaseController.opretInvesteringscase);

/* GET /api/investeringscase/hentAlle */
router.get('/hentAlle', investeringscaseController.hentAlleInvesteringscases);

/* PUT /api/investeringscase/opdater */
router.put('/opdater', investeringscaseController.opdaterInvesteringscase);

/* DELETE /api/investeringscase/slet/:id */
router.delete('/slet/:id', investeringscaseController.sletInvesteringscase);

module.exports = router;
