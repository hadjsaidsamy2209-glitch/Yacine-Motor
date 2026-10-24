const express = require('express');
const path = require('node:path');
const pagesRouter = require('./routes/pages');
const { agency } = require('./services/vehicles')
const { formatPrice, formatDate } = require('./services/format');
const helmet = require('helmet');

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