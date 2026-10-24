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

module.exports = { agency, listVehicles, findBySlug };

