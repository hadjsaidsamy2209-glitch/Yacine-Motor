const express = require('express');
const { listVehicles, findBySlug } = require('../services/vehicles');

const router = express.Router();

router.get('/', (request, response) => {
  response.render('accueil');
});

router.get('/vehicules', (request, response) => {
  response.render('vehicules', { vehicles: listVehicles() });
});

router.get('/vehicules/:slug', (request, response) => {
    const vehicle = findBySlug(request.params.slug);

    if (!vehicle) {
        return response.status(404).render('erreur', {
            title: 'Véhicule introuvable',
            message: "Ce véhicule n'existe pas ou n'est plus au catalogue.",
        });
    }

    response.render('vehicule', { vehicle });
});


module.exports = router;