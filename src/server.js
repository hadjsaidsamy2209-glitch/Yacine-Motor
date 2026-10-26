const express = require('express');
const path = require('node:path');
const helmet = require('helmet');

const pagesRouter = require('./routes/pages');
const { agency } = require('./services/vehicles')
const { formatPrice, formatDate } = require('./services/format');


// Le site ne sert à rien sans Telegram : mieux vaut s'arrêter tout de suite avec un message clair.
const REQUIRED_ENV = ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID'];
const missingEnv = REQUIRED_ENV.filter((name) => !process.env[name]);
if (missingEnv.length > 0) {
  console.error(`Variables manquantes dans .env : ${missingEnv.join(', ')}. Voir .env.example.`);
  process.exit(1);
}

const PORT = process.env.PORT || 3000;
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.locals.agency = agency;
app.locals.formatPrice = formatPrice;
app.locals.formatDate = formatDate;

app.use(helmet());
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.urlencoded({ extended : false, limit : '10kb' }));

app.use('/', pagesRouter);


// Aucune route n'a répondu : page introuvable.
app.use((request, response) => {
  response.status(404).render('erreur', {
    title: 'Page introuvable',
    message: "Cette page n'existe pas ou a été déplacée.",
  });
});

// Erreur imprévue : le détail va dans les journaux, le visiteur ne voit rien de technique.
app.use((error, request, response, next) => {
  console.error(`[erreur] ${error.name} : ${error.message}`);

  if (response.headersSent) {
    return next(error);
  }

  const tooLarge = error.status === 413;
  response.status(tooLarge ? 413 : 500).render('erreur', {
    title: tooLarge ? 'Envoi trop volumineux' : 'Un problème est survenu',
    message: tooLarge
      ? 'Votre envoi dépasse la taille autorisée.'
      : 'Nous rencontrons une difficulté technique. Réessayez dans un instant.',
  });
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});

