/* simulering.js definerer de HTTP-endpoints der er tilgængelige under /api/simulering/. */

const express = require('express');
const router = express.Router();
const simuleringController = require('../controllers/simuleringController');

/* POST /api/simulering/eksekver */
router.post('/eksekver', simuleringController.eksekverSimulering);

/* GET /api/simulering/hentSeneste/:investeringscaseID */
router.get('/hentSeneste/:investeringscaseID', simuleringController.hentSenesteSimulering);

module.exports = router;
