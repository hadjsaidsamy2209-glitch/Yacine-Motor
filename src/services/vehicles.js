const fs = require('node:fs');
const path = require('node:path');

const CATALOGUE_FILE = path.join(__dirname, '..', '..', 'data', 'vehicles.json');

function loadCatalogue() {
    try {
        return JSON.parse(fs.readFileSync(CATALOGUE_FILE, 'utf8'));
    } catch (error) {
        throw new Error(`Catalogue illisible (${CATALOGUE_FILE}) : ${error.message}`);
    }
}

const catalogue = loadCatalogue();
const agency = catalogue.agence;
const vehicles = catalogue.vehicules;

function listVehicles() {
  return vehicles;
}

function findBySlug(slug) {
  return vehicles.find((vehicle) => vehicle.slug === slug);
}

// Le nombre de véhicules et le prix journalier le plus bas, pour l'accueil.
function catalogueStats(list) {
  return { count: list.length, minPrice: Math.min(...list.map((vehicle) => vehicle.prix_jour)) };
}

// Par catégorie : nombre de véhicules et prix minimum, de la moins chère à la plus chère.
function summarizeCategories(list) {
  const byCategory = new Map();

  list.forEach((vehicle) => {
    const current = byCategory.get(vehicle.categorie);
    byCategory.set(vehicle.categorie, {
      name: vehicle.categorie,
      count: (current?.count ?? 0) + 1,
      minPrice: Math.min(current?.minPrice ?? Infinity, vehicle.prix_jour),
    });
  });

  return [...byCategory.values()].sort((a, b) => a.minPrice - b.minPrice);
}

// Pour chaque catégorie, le véhicule disponible le moins cher.
function featuredVehicles(list) {
  const cheapest = new Map();

  list
    .filter((vehicle) => vehicle.disponible)
    .forEach((vehicle) => {
      const current = cheapest.get(vehicle.categorie);
      if (!current || vehicle.prix_jour < current.prix_jour) {
        cheapest.set(vehicle.categorie, vehicle);
      }
    });

  return [...cheapest.values()].sort((a, b) => a.prix_jour - b.prix_jour);
}

module.exports = { agency, listVehicles, findBySlug, catalogueStats, summarizeCategories, featuredVehicles };

