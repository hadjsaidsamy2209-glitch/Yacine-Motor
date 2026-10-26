const test = require('node:test');
const assert = require('node:assert/strict');
const { listVehicles, lowestPrice, featuredVehicles, resolveImage } = require('../src/services/vehicles');

const sample = [
  { slug: 'q5', categorie: 'SUV', prix_jour: 125, disponible: true },
  { slug: 'rafale', categorie: 'SUV', prix_jour: 95, disponible: true },
  { slug: 'x3', categorie: 'SUV', prix_jour: 80, disponible: false },
  { slug: 'clio', categorie: 'Citadine', prix_jour: 45, disponible: true },
  { slug: 'm4', categorie: 'Sportive', prix_jour: 300, disponible: false },
];

test('prix le plus bas du catalogue', () => {
  assert.equal(lowestPrice(sample), 45);
});

test('à la une : le véhicule disponible le moins cher de chaque catégorie', () => {
  const slugs = featuredVehicles(sample).map((vehicle) => vehicle.slug);
  assert.deepEqual(slugs, ['clio', 'rafale']);
});

test("à la une : une catégorie sans véhicule disponible n'apparaît pas", () => {
  const slugs = featuredVehicles(sample).map((vehicle) => vehicle.slug);
  assert.ok(!slugs.includes('m4'));
});

test('les fonctions ne modifient pas la liste reçue', () => {
  const copy = JSON.parse(JSON.stringify(sample));
  lowestPrice(sample);
  featuredVehicles(sample);
  assert.deepEqual(sample, copy);
});

test("image : un fichier qui n'existe pas donne null (la page affichera un bloc neutre)", () => {
  assert.equal(resolveImage('/images/vehicles/fichier-inexistant.jpg'), null);
});

test("image : aucun chemin donne null", () => {
  assert.equal(resolveImage(undefined), null);
});

test("image : chaque véhicule a un champ image, un chemin ou null", () => {
  listVehicles().forEach((vehicle) => {
    assert.ok(vehicle.image === null || vehicle.image.startsWith('/images/'));
  });
});

test("sur le vrai catalogue : le prix le plus bas n'est supérieur à aucun tarif", () => {
  const list = listVehicles();
  assert.ok(list.every((vehicle) => lowestPrice(list) <= vehicle.prix_jour));
});
