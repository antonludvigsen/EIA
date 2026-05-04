const express = require('express');
const router = express.Router();
const ejendomsprofilController = require('../controllers/ejendomsprofilController');

/* GET /api/ejendomsprofil/vis?adresseId=... */
router.get('/vis', ejendomsprofilController.visEjendomsprofil);

/* GET /api/ejendomsprofil/portefolje */
router.get('/portefolje', ejendomsprofilController.visPortefølje);

/* POST /api/ejendomsprofil/gem */
router.post('/gem', ejendomsprofilController.gemEjendomsprofil);

/* PUT /api/ejendomsprofil/opdater */
router.put('/opdater', ejendomsprofilController.opdaterEjendomsprofil);

/* DELETE /api/ejendomsprofil/slet/:id */
router.delete('/slet/:id', ejendomsprofilController.sletEjendomsprofil);

module.exports = router;