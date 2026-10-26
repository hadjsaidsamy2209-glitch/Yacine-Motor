const express = require('express');
const { listVehicles, findBySlug } = require('../services/vehicles');
const { earliestStart, estimateTotal, todayInParis } = require('../services/rules');
const { validateReservation } = require('../services/validation');
const { formatReservationMessage, sendMessage } = require('../services/telegram');

const router = express.Router();

function notFound(response) {
  return response.status(404).render('erreur', {
    title: 'Véhicule introuvable',
    message: "Ce véhicule n'existe pas ou n'est plus au catalogue.",
  });
}

// Les données dont la page d'un véhicule a besoin, formulaire vide ou rempli.
function vehiclePage(vehicle, { form = {}, errors = {}, sendError = false } = {}) {
  return { vehicle, form, errors, sendError, minStart: earliestStart(vehicle, todayInParis()) };
}

router.get('/', (request, response) => {
  response.render('accueil');
});

router.get('/vehicules', (request, response) => {
  response.render('catalogue', { vehicles: listVehicles() });
});

router.get('/vehicules/:slug', (request, response) => {
  const vehicle = findBySlug(request.params.slug);

  if (!vehicle) {
    return notFound(response);
  }

  response.render('vehicule', vehiclePage(vehicle));
});

router.post('/vehicules/:slug', async (request, response) => {
  const vehicle = findBySlug(request.params.slug);
  const form = request.body ?? {};

  if (!vehicle) {
    return notFound(response);
  }

  // Champ piège : seul un robot le remplit. On fait semblant que tout va bien, sans rien envoyer.
  if (form.website) {
    return response.redirect('/merci');
  }

  const { errors, values } = validateReservation(form, vehicle, todayInParis());
  if (Object.keys(errors).length > 0) {
    return response.status(400).render('vehicule', vehiclePage(vehicle, { form: values, errors }));
  }

  const estimate = estimateTotal(vehicle, values.startDate, values.endDate); //calcule le prix total
  try {  // envoie le formulaire a telegram avec un try catch en cas d'erreur 
    await sendMessage(formatReservationMessage(vehicle, values, estimate));
  } catch (error) {

    console.error(`[telegram] ${error.message}`);
    return response.status(502).render('vehicule', vehiclePage(vehicle, { form: values, sendError: true }));
  }

  response.redirect('/merci');
});

router.get('/merci', (request, response) => {
  response.render('merci');
});

module.exports = router;
