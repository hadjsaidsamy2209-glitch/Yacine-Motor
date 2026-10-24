const express = require('express');
const path = require('node:path');
const {agency} = require('./services/vehicles')
const helmet = require('helmet');

const PORT = process.env.PORT || 3000;
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.locals.agency = agency;

app.use(helmet());
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.urlencoded({extended : false, limit : '10kb'}));

app.get('/', (request, response) => {
  response.render('accueil');
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});