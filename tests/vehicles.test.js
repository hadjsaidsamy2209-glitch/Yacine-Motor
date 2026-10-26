const test = require('node:test');
const assert = require('node:assert/strict');
const {
  listVehicles,
  catalogueStats,
  summarizeCategories,
  featuredVehicles,
} = require('../src/services/vehicles');

const sample = [
  { slug: 'q5', categorie: 'SUV', prix_jour: 125, disponible: true },
  { slug: 'rafale', categorie: 'SUV', prix_jour: 95, disponible: true },
  { slug: 'x3', categorie: 'SUV', prix_jour: 80, disponible: false },
  { slug: 'clio', categorie: 'Citadine', prix_jour: 45, disponible: true },
  { slug: 'm4', categorie: 'Sportive', prix_jour: 300, disponible: false },
];

test('statistiques : nombre de véhicules et prix minimum', () => {
  assert.deepEqual(catalogueStats(sample), { count: 5, minPrice: 45 });
});

test('catégories : nombre et prix minimum, du moins cher au plus cher', () => {
  assert.deepEqual(summarizeCategories(sample), [
    { name: 'Citadine', count: 1, minPrice: 45 },
    { name: 'SUV', count: 3, minPrice: 80 },
    { name: 'Sportive', count: 1, minPrice: 300 },
  ]);
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
  catalogueStats(sample);
  summarizeCategories(sample);
  featuredVehicles(sample);
  assert.deepEqual(sample, copy);
});

test('sur le vrai catalogue : quatre catégories, du prix minimum 45 €', () => {
  const names = summarizeCategories(listVehicles()).map((category) => category.name);
  assert.deepEqual(names, ['Citadine', 'Compacte', 'SUV', 'Sportive']);
  assert.equal(catalogueStats(listVehicles()).minPrice, 45);
});
