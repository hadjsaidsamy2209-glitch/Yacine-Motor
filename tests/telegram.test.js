const test = require('node:test');
const assert = require('node:assert/strict');
const { formatReservationMessage, formatContactMessage, sendMessage } = require('../src/services/telegram');
const { formatPrice } = require('../src/services/format');

const rs3 = {
  marque: 'Audi',
  modele: 'RS 3 Sportback',
  version: '2.5 TFSI quattro S tronic',
  caution: 5000,
  age_minimum: 25,
  permis_minimum_annees: 5,
};
const clio = { marque: 'Renault', modele: 'Clio', version: 'TCe 90 Evolution', caution: 800 };

const request = {
  name: 'Jean Dupont',
  phone: '06 00 00 00 00',
  email: 'jean@example.com',
  startDate: '2026-11-10',
  endDate: '2026-11-12',
  birthDate: '2000-05-01',
  licenseDate: '2018-06-15',
  message: 'Je souhaite récupérer le véhicule le matin.',
};

test('réservation : contient le véhicule, les dates et le client', () => {
  const text = formatReservationMessage(rs3, request, { days: 2, total: 460 });
  assert.ok(text.includes('Nouvelle demande de réservation'));
  assert.ok(text.includes('Véhicule : Audi RS 3 Sportback (2.5 TFSI quattro S tronic)'));
  assert.ok(text.includes('Dates : du 10/11/2026 au 12/11/2026 (2 jours)'));
  assert.ok(text.includes('Client : Jean Dupont'));
  assert.ok(text.includes('Message : Je souhaite récupérer le véhicule le matin.'));
});

test('réservation : contient le prix total et la caution', () => {
  const text = formatReservationMessage(rs3, request, { days: 2, total: 460 });
  assert.ok(text.includes(`Prix total : ${formatPrice(460)} | Caution : ${formatPrice(5000)}`));
});

test('réservation : un véhicule à conditions affiche naissance et permis avec les âges', () => {
  const text = formatReservationMessage(rs3, request, { days: 2, total: 460 });
  assert.ok(text.includes('Naissance : 01/05/2000 (26 ans, minimum 25)'));
  assert.ok(text.includes('Permis : 15/06/2018 (8 ans, minimum 5)'));
});

test('réservation : sans condition ni message, ces lignes sont absentes', () => {
  const simpleRequest = { ...request, birthDate: undefined, licenseDate: undefined, message: '' };
  const text = formatReservationMessage(clio, simpleRequest, { days: 1, total: 45 });
  assert.ok(text.includes('(1 jour)'));
  assert.ok(!text.includes('Naissance'));
  assert.ok(!text.includes('Permis'));
  assert.ok(!text.includes('Message'));
});

test('contact : seul le téléphone est renseigné', () => {
  const text = formatContactMessage({ name: 'Léa', phone: '06 11 22 33 44', email: '', message: 'Bonjour' });
  assert.ok(text.includes('Nouveau message de contact'));
  assert.ok(text.includes('Téléphone : 06 11 22 33 44'));
  assert.ok(!text.includes('Email'));
  assert.ok(text.includes('Message : Bonjour'));
});

const fakeEnv = { TELEGRAM_BOT_TOKEN: 'SECRET_TOKEN_123', TELEGRAM_CHAT_ID: '42' };

function fakeFetch(answer) {
  const calls = [];
  const fn = async (url, options) => {
    calls.push({ url, options });
    if (answer instanceof Error) {
      throw answer;
    }
    return { json: async () => answer };
  };
  return { fn, calls };
}

test('envoi : appelle Telegram avec le bon texte et le bon destinataire', async () => {
  const { fn, calls } = fakeFetch({ ok: true });
  await sendMessage('Bonjour', { fetchFn: fn, env: fakeEnv });
  assert.equal(calls.length, 1);
  assert.ok(calls[0].url.endsWith('/sendMessage'));
  assert.deepEqual(JSON.parse(calls[0].options.body), { chat_id: '42', text: 'Bonjour' });
  assert.ok(calls[0].options.signal instanceof AbortSignal);
});

test('envoi : un refus de Telegram lève une erreur lisible', async () => {
  const { fn } = fakeFetch({ ok: false, error_code: 401, description: 'Unauthorized' });
  await assert.rejects(
    sendMessage('Bonjour', { fetchFn: fn, env: fakeEnv }),
    (error) => error.message.includes('401') && error.message.includes('Unauthorized'),
  );
});

test("envoi : l'erreur ne contient jamais le token", async () => {
  const { fn } = fakeFetch({ ok: false, error_code: 401, description: 'Unauthorized' });
  await assert.rejects(
    sendMessage('Bonjour', { fetchFn: fn, env: fakeEnv }),
    (error) => !error.message.includes('SECRET_TOKEN_123'),
  );
});

test('envoi : un réseau coupé lève une erreur sans le token', async () => {
  const { fn } = fakeFetch(new TypeError('fetch failed'));
  await assert.rejects(
    sendMessage('Bonjour', { fetchFn: fn, env: fakeEnv }),
    (error) => error.message.includes('injoignable') && !error.message.includes('SECRET_TOKEN_123'),
  );
});