const test = require('node:test');
const assert = require('node:assert/strict');
const { validateReservation, validateContact } = require('../src/services/validation');

const TODAY = '2026-10-25';

const validContact = {
  name: 'Léa Martin',
  phone: '06 11 22 33 44',
  email: '',
  message: 'Bonjour, avez-vous des véhicules pour décembre ?',
  consent: 'on',
};

test('contact : un message avec un téléphone seul est accepté', () => {
  assert.deepEqual(validateContact(validContact).errors, {});
});

test('contact : un message avec un email seul est accepté', () => {
  const form = { ...validContact, phone: '', email: 'lea@example.com' };
  assert.deepEqual(validateContact(form).errors, {});
});

test('contact : sans téléphone ni email, impossible de répondre', () => {
  const { errors } = validateContact({ ...validContact, phone: '', email: '' });
  assert.ok(errors.contact);
});

test('contact : un email renseigné doit être valide', () => {
  const { errors } = validateContact({ ...validContact, email: 'lea@' });
  assert.ok(errors.email);
});

test('contact : un téléphone renseigné doit être valide', () => {
  const { errors } = validateContact({ ...validContact, phone: 'abc' });
  assert.ok(errors.phone);
});

test('contact : le nom est obligatoire', () => {
  const { errors } = validateContact({ ...validContact, name: '   ' });
  assert.ok(errors.name);
});

test('contact : le message est obligatoire', () => {
  const { errors } = validateContact({ ...validContact, message: '' });
  assert.ok(errors.message);
});

test('contact : un message de plus de 1000 caractères est refusé', () => {
  const { errors } = validateContact({ ...validContact, message: 'a'.repeat(1001) });
  assert.ok(errors.message);
});

test('contact : sans consentement, le message est refusé', () => {
  const { errors } = validateContact({ ...validContact, consent: undefined });
  assert.ok(errors.consent);
});

test('contact : les espaces autour des valeurs sont retirés', () => {
  const { values } = validateContact({ ...validContact, name: '  Léa Martin  ' });
  assert.equal(values.name, 'Léa Martin');
});

const clio = { prix_jour: 45, disponible: true };
const rs3 = { prix_jour: 230, disponible: true, age_minimum: 25, permis_minimum_annees: 5 };
const x3 = { prix_jour: 125, disponible: false, indisponible_jusqu_au: '2026-11-04' };
const unavailable = { prix_jour: 100, disponible: false };

const validForm = {
  name: 'Jean Dupont',
  phone: '06 00 00 00 00',
  email: 'jean@example.com',
  startDate: '2026-11-10',
  endDate: '2026-11-12',
  birthDate: '',
  licenseDate: '',
  message: '',
  consent: 'on',
};

test('un formulaire correct ne produit aucune erreur', () => {
  const { errors } = validateReservation(validForm, clio, TODAY);
  assert.deepEqual(errors, {});
});

test('les espaces autour des valeurs sont retirés', () => {
  const form = { ...validForm, name: '  Jean Dupont  ', email: ' jean@example.com ' };
  const { values } = validateReservation(form, clio, TODAY);
  assert.equal(values.name, 'Jean Dupont');
  assert.equal(values.email, 'jean@example.com');
});

test('un formulaire vide signale tous les champs obligatoires', () => {
  const { errors } = validateReservation({}, clio, TODAY);
  assert.deepEqual(Object.keys(errors).sort(), ['consent', 'email', 'endDate', 'name', 'phone', 'startDate']);
});

test('un email invalide est refusé', () => {
  const { errors } = validateReservation({ ...validForm, email: 'jean@' }, clio, TODAY);
  assert.ok(errors.email);
});

test('un téléphone avec des lettres est refusé', () => {
  const { errors } = validateReservation({ ...validForm, phone: 'abc' }, clio, TODAY);
  assert.ok(errors.phone);
});

test('un message de plus de 1000 caractères est refusé', () => {
  const { errors } = validateReservation({ ...validForm, message: 'a'.repeat(1001) }, clio, TODAY);
  assert.ok(errors.message);
});

test('sans consentement, la demande est refusée', () => {
  const { errors } = validateReservation({ ...validForm, consent: undefined }, clio, TODAY);
  assert.ok(errors.consent);
});

test('une date de début dans le passé est refusée', () => {
  const { errors } = validateReservation({ ...validForm, startDate: '2026-10-01', endDate: '2026-10-03' }, clio, TODAY);
  assert.ok(errors.startDate);
});

test("une date qui n'existe pas est refusée", () => {
  const { errors } = validateReservation({ ...validForm, startDate: '2026-02-30' }, clio, TODAY);
  assert.ok(errors.startDate);
});

test('la date de fin doit être après la date de début', () => {
  const { errors } = validateReservation({ ...validForm, endDate: '2026-11-10' }, clio, TODAY);
  assert.ok(errors.endDate);
});

test('un véhicule indisponible ne peut pas commencer avant le lendemain de son retour', () => {
  const form = { ...validForm, startDate: '2026-11-04', endDate: '2026-11-06' };
  const { errors } = validateReservation(form, x3, TODAY);
  assert.ok(errors.startDate.includes('05/11/2026'));
});

test('un véhicule indisponible se réserve dès le lendemain de son retour', () => {
  const form = { ...validForm, startDate: '2026-11-05', endDate: '2026-11-07' };
  const { errors } = validateReservation(form, x3, TODAY);
  assert.deepEqual(errors, {});
});

test('un véhicule indisponible sans date de retour ne se réserve pas', () => {
  const { errors } = validateReservation(validForm, unavailable, TODAY);
  assert.ok(errors.startDate.includes('pas réservable'));
});

test('un véhicule à conditions exige la naissance et le permis', () => {
  const { errors } = validateReservation(validForm, rs3, TODAY);
  assert.ok(errors.birthDate);
  assert.ok(errors.licenseDate);
});

test('un conducteur trop jeune pour le véhicule est refusé', () => {
  const form = { ...validForm, birthDate: '2004-05-01', licenseDate: '2020-01-01' };
  const { errors } = validateReservation(form, rs3, TODAY);
  assert.ok(errors.conditions.includes('25 ans minimum'));
});

test('un conducteur qui remplit les conditions est accepté', () => {
  const form = { ...validForm, birthDate: '1990-03-01', licenseDate: '2010-06-01' };
  const { errors } = validateReservation(form, rs3, TODAY);
  assert.deepEqual(errors, {});
});
