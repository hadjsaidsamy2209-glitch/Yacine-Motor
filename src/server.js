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

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});

