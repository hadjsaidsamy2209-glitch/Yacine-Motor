const { formatPrice, formatDate } = require('./format');
const { yearsBetween } = require('./rules');
const TELEGRAM_TIMEOUT_MS = 8000;


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



async function sendMessage(text, { fetchFn = fetch, env = process.env } = {}) {
  const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;

  let response;
  try {
    response = await fetchFn(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text }),
      signal: AbortSignal.timeout(TELEGRAM_TIMEOUT_MS),
    });
  } catch (error) {
    throw new Error(`Telegram injoignable (${error.name})`);
  }

  const result = await response.json().catch(() => ({}));
  if (!result.ok) {
    const code = result.error_code ?? response.status;
    throw new Error(`Telegram a refusé le message (${code}) : ${result.description ?? 'réponse inattendue'}`);
  }
}



module.exports = { formatReservationMessage, formatContactMessage, sendMessage };

