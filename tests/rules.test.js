const test = require('node:test');
const assert = require('node:assert/strict');
const { daysBetween, addDays, yearsBetween, estimateTotal, earliestStart, driverProblems, todayInParis } = require('../src/services/rules');
const sportsCar = { age_minimum: 25, permis_minimum_annees: 5 };

test("la date du jour en heure de Paris s'écrit AAAA-MM-JJ", () => {
  assert.match(todayInParis(), /^\d{4}-\d{2}-\d{2}$/);
});

test('du 10 au 12 novembre, il y a 2 jours', () => {
    assert.equal(daysBetween('2026-11-10', '2026-11-12'),2);
});

test('fonctionne à cheval sur deux mois', () => {
  assert.equal(daysBetween('2026-10-31', '2026-11-02'), 2);
});

test("le passage à l'heure d'hiver ne change pas le nombre de jours", () => {
  assert.equal(daysBetween('2026-10-24', '2026-10-26'), 2);
});

test('ajoute un jour dans le même mois', () => {
  assert.equal(addDays('2026-11-04', 1), '2026-11-05');
});

test('ajoute un jour à la fin du mois', () => {
  assert.equal(addDays('2026-10-31', 1), '2026-11-01');
});

test("ajoute un jour à la fin de l'année", () => {
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
});

test("février n'a que 28 jours en 2026", () => {
  assert.equal(addDays('2026-02-28', 1), '2026-03-01');
});

test('âge : anniversaire déjà passé cette année', () => {
  assert.equal(yearsBetween('2000-05-01', '2026-11-10'), 26);
});

test('âge : anniversaire pas encore atteint cette année', () => {
  assert.equal(yearsBetween('2000-12-01', '2026-11-10'), 25);
});

test("âge : le jour même de l'anniversaire, on a l'âge complet", () => {
  assert.equal(yearsBetween('2000-11-10', '2026-11-10'), 26);
});

test("âge : la veille de l'anniversaire, il manque un an", () => {
  assert.equal(yearsBetween('2000-11-11', '2026-11-10'), 25);
});

test('prix : 2 jours à 75 € font 150 €', () => {
  assert.deepEqual(estimateTotal({ prix_jour: 75 }, '2026-11-10', '2026-11-12'), { days: 2, total: 150 });
});

test('prix : 1 jour à 230 € fait 230 €', () => {
  assert.deepEqual(estimateTotal({ prix_jour: 230 }, '2026-11-10', '2026-11-11'), { days: 1, total: 230 });
});

test("début possible : un véhicule disponible se loue dès aujourd'hui", () => {
  assert.equal(earliestStart({ disponible: true }, '2026-10-24'), '2026-10-24');
});

test('début possible : le lendemain du retour du véhicule', () => {
  const vehicle = { disponible: false, indisponible_jusqu_au: '2026-11-04' };
  assert.equal(earliestStart(vehicle, '2026-10-24'), '2026-11-05');
});

test('début possible : un retour déjà passé ne bloque plus', () => {
  const vehicle = { disponible: false, indisponible_jusqu_au: '2026-10-01' };
  assert.equal(earliestStart(vehicle, '2026-10-24'), '2026-10-24');
});

test('début possible : indisponible sans date de retour, impossible', () => {
  assert.equal(earliestStart({ disponible: false }, '2026-10-24'), null);
});


test('conducteur : un véhicule sans condition accepte tout le monde', () => {
  assert.deepEqual(driverProblems({}, {}, '2026-11-10'), []);
});

test('conducteur : âge et permis suffisants', () => {
  const driver = { birthDate: '1990-03-01', licenseDate: '2010-06-01' };
  assert.deepEqual(driverProblems(sportsCar, driver, '2026-11-10'), []);
});

test('conducteur : trop jeune', () => {
  const driver = { birthDate: '2004-05-01', licenseDate: '2020-01-01' };
  const problems = driverProblems(sportsCar, driver, '2026-11-10');
  assert.equal(problems.length, 1);
  assert.ok(problems[0].includes('25 ans minimum'));
});

test('conducteur : permis trop récent', () => {
  const driver = { birthDate: '1990-03-01', licenseDate: '2024-01-01' };
  const problems = driverProblems(sportsCar, driver, '2026-11-10');
  assert.equal(problems.length, 1);
  assert.ok(problems[0].includes('5 ans de permis'));
});

test('conducteur : trop jeune ET permis trop récent donnent deux problèmes', () => {
  const driver = { birthDate: '2004-05-01', licenseDate: '2024-01-01' };
  assert.equal(driverProblems(sportsCar, driver, '2026-11-10').length, 2);
});

test('limite : le jour des 25 ans, le conducteur est accepté', () => {
  const driver = { birthDate: '2001-11-10', licenseDate: '2015-01-01' };
  assert.deepEqual(driverProblems(sportsCar, driver, '2026-11-10'), []);
});

test('limite : la veille des 25 ans, le conducteur est refusé', () => {
  const driver = { birthDate: '2001-11-11', licenseDate: '2015-01-01' };
  assert.equal(driverProblems(sportsCar, driver, '2026-11-10').length, 1);
});