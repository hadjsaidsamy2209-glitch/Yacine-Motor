const fs = require('node:fs');
const path = require('node:path');

const CATALOGUE_FILE = path.join(__dirname, '..', '..', 'data', 'vehicles.json');
const PUBLIC_DIR = path.join(__dirname, '..', '..', 'public');

function loadCatalogue() {
    try {
        return JSON.parse(fs.readFileSync(CATALOGUE_FILE, 'utf8'));
    } catch (error) {
        throw new Error(`Catalogue illisible (${CATALOGUE_FILE}) : ${error.message}`);
    }
}

// Le chemin d'image du JSON, seulement si le fichier existe vraiment : sinon null, et la page affiche un bloc neutre.
function resolveImage(imagePath) {
  return imagePath && fs.existsSync(path.join(PUBLIC_DIR, imagePath)) ? imagePath : null;
}

const catalogue = loadCatalogue();
const agency = catalogue.agence;
const vehicles = catalogue.vehicules.map((vehicle) => ({
  ...vehicle,
  image: resolveImage(vehicle.images?.[0]),
}));

function listVehicles() {
  return vehicles;
}

function findBySlug(slug) {
  return vehicles.find((vehicle) => vehicle.slug === slug);
}

// Le prix journalier le plus bas du catalogue, pour l'accueil.
function lowestPrice(list) {
  return Math.min(...list.map((vehicle) => vehicle.prix_jour));
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

module.exports = { agency, listVehicles, findBySlug, lowestPrice, featuredVehicles, resolveImage };

