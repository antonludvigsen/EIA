/* investeringscase.js definerer de HTTP-endpoints der er tilgængelige under /api/investeringscase/.

Hvert endpoint knyttes til en metode i controlleren (videredelegerer blot kaldet til den rette controller-metode) */

const express = require('express');
const router = express.Router();
const investeringscaseController = require('../controllers/investeringscaseController');

/* POST /api/investeringscase/opret */
router.post('/opret', investeringscaseController.opretInvesteringscase);

/* GET /api/investeringscase/hentAlle */
router.get('/hentAlle', investeringscaseController.hentAlleInvesteringscases);

/* PUT /api/investeringscase/opdater */
router.put('/opdater', investeringscaseController.opdaterInvesteringscase);

/* PUT /api/investeringscase/opdaterParametre */
router.put('/opdaterParametre', investeringscaseController.opdaterParametre);

/* DELETE /api/investeringscase/slet/:id */
router.delete('/slet/:id', investeringscaseController.sletInvesteringscase);

/* POST /api/investeringscase/dupliker/:id */
router.post('/dupliker/:id', investeringscaseController.duplikerInvesteringscase);

module.exports = router;
