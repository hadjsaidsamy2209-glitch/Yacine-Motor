const express = require('express');
const { listVehicles } = require('../services/vehicles');

const router = express.Router();

router.get('/', (request, response) => {
  response.render('accueil');
});

router.get('/vehicules', (request, response) => {
  response.render('vehicules', { vehicles: listVehicles() });
});

module.exports = router;