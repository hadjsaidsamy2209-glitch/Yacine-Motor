const { formatPrice, formatDate } = require('./format');
const { yearsBetween } = require('./rules');

function formatReservationMessage(vehicle, request, estimate) {
  const dayWord = estimate.days > 1 ? 'jours' : 'jour';
  const lines = [
    'Nouvelle demande de réservation',
    `Véhicule : ${vehicle.marque} ${vehicle.modele} (${vehicle.version})`,
    `Dates : du ${formatDate(request.startDate)} au ${formatDate(request.endDate)} (${estimate.days} ${dayWord})`,
    `Prix total : ${formatPrice(estimate.total)} | Caution : ${formatPrice(vehicle.caution)}`,
    `Client : ${request.name}`,
    `Téléphone : ${request.phone}`,
    `Email : ${request.email}`,
  ];

  if (vehicle.age_minimum) {
    const age = yearsBetween(request.birthDate, request.startDate);
    lines.push(`Naissance : ${formatDate(request.birthDate)} (${age} ans, minimum ${vehicle.age_minimum})`);
  }
  if (vehicle.permis_minimum_annees) {
    const years = yearsBetween(request.licenseDate, request.startDate);
    lines.push(`Permis : ${formatDate(request.licenseDate)} (${years} ans, minimum ${vehicle.permis_minimum_annees})`);
  }
  if (request.message) {
    lines.push(`Message : ${request.message}`);
  }

  return lines.join('\n');
}

function formatContactMessage(contact) {
  const lines = ['Nouveau message de contact', `Nom : ${contact.name}`];

  if (contact.phone) {
    lines.push(`Téléphone : ${contact.phone}`);
  }
  if (contact.email) {
    lines.push(`Email : ${contact.email}`);
  }
  lines.push(`Message : ${contact.message}`);

  return lines.join('\n');
}

module.exports = { formatReservationMessage, formatContactMessage };