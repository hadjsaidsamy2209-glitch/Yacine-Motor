// Ouvre le formulaire de réservation dans une fenêtre posée sur la page (balise <dialog> native).
const dialog = document.getElementById('reservation-dialog');

if (dialog && typeof dialog.showModal === 'function') {
  const open = () => {
    if (!dialog.open) {
      dialog.showModal();
    }
  };

  document.querySelectorAll('[data-open-dialog]').forEach((button) => {
    button.addEventListener('click', open);
  });

  dialog.querySelectorAll('[data-close-dialog]').forEach((button) => {
    button.addEventListener('click', () => dialog.close());
  });

  // Un clic sur le fond assombri, en dehors du panneau, ferme la fenêtre.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });

  // Après un envoi refusé, le serveur réaffiche la page : on rouvre la fenêtre pour montrer les erreurs.
  if (dialog.dataset.open === 'true' || window.location.hash === '#reservation') {
    open();
  }
}
