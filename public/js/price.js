// Affiche le prix total dès que les deux dates sont renseignées.
// Simple confort : le serveur recalcule toujours le prix avant l'envoi.
const form = document.querySelector('[data-price-per-day]');

if (form) {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const pricePerDay = Number(form.dataset.pricePerDay);
  const start = form.elements.startDate;
  const end = form.elements.endDate;
  const box = document.getElementById('price-box');
  const total = document.getElementById('price-total');
  const firstPossibleEnd = end.min;

  const dayAfter = (isoDate) => new Date(Date.parse(isoDate) + MS_PER_DAY).toISOString().slice(0, 10);

  const update = () => {
    const days = (Date.parse(end.value) - Date.parse(start.value)) / MS_PER_DAY;

    if (start.value && end.value && days >= 1) {
      total.textContent = `${new Intl.NumberFormat('fr-FR').format(days * pricePerDay)} €`;
      box.hidden = false;
    } else {
      box.hidden = true;
    }
  };

  start.addEventListener('change', () => {
    end.min = start.value ? dayAfter(start.value) : firstPossibleEnd;
    update();
  });
  end.addEventListener('change', update);
  update();
}
