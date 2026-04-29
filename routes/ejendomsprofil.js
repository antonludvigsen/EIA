const express = require('express');
const router = express.Router();
const ejendomsprofilController = require('../controllers/ejendomsprofilController');

/* GET /api/ejendomsprofil/vis?adresseId=... */
router.get('/vis', ejendomsprofilController.visEjendomsprofil);

module.exports = router;