# Yacine Motors

Site de location de véhicules pour l'agence Yacine Motors (Marseille), réalisé pour le test technique Lemdint.

- **Accueil** : présentation et véhicules à la une.
- **Catalogue** : les véhicules lus depuis `data/vehicles.json` (fichier jamais modifié).
- **Fiche véhicule** : détails, conditions, et formulaire de demande de réservation (prix total calculé avant l'envoi).
- **Contact** : formulaire de message.
- Les deux formulaires envoient un message sur le Telegram de l'agence. Aucune base de données, aucun paiement en ligne.
- **Bonus choisis** : anti-spam (champ piège + limite d'envois par IP) et tests automatisés.

## 1. Installation

Prérequis : **Node.js 20.6 ou plus** (développé avec Node 22).

```bash
npm install
```

Créer le fichier `.env` à partir de l'exemple, puis le remplir :

```bash
cp .env.example .env
```

| Variable | Rôle |
|---|---|
| `TELEGRAM_BOT_TOKEN` | token du bot, donné par @BotFather |
| `TELEGRAM_CHAT_ID` | identifiant de la conversation qui reçoit les messages |
| `PORT` | port du site (3000 par défaut) |

Si une des deux variables Telegram manque, le site refuse de démarrer avec un message clair.

```bash
npm start      # lance le site sur http://localhost:3000
npm test       # lance les tests automatisés
npm run dev    # relance le site à chaque modification
```

**Obtenir un bot de test** : écrire à @BotFather sur Telegram (`/newbot`) pour le token, envoyer un message au bot, puis ouvrir `https://api.telegram.org/bot<TOKEN>/getUpdates` pour lire `chat.id`.

## 2. Choix techniques et architecture

**Stack** : Node.js + Express, pages rendues côté serveur avec EJS, CSS écrit à la main. Un serveur est indispensable : le token Telegram ne doit jamais être visible dans le navigateur. React ou Next.js auraient ajouté du build et un second projet pour un besoin simple.

```
src/
  server.js          démarrage, sécurité (helmet), erreurs 404/500
  routes/pages.js    reçoit les requêtes et répond
  services/
    vehicles.js      lecture du JSON, images, synthèse du catalogue
    rules.js         dates, âge, permis, calcul du prix
    validation.js    validation des deux formulaires
    telegram.js      mise en forme et envoi du message
    format.js        prix et dates à l'affichage
  views/             pages EJS et morceaux réutilisables
public/              CSS, JavaScript du navigateur, images
tests/               tests automatisés (node:test)
data/vehicles.json   catalogue (non modifié)
```

Principes :
- La logique (prix, âge, validation, message) est dans des fonctions simples, testables sans lancer de serveur.
- Formulaires HTML classiques : fonctionnent sans JavaScript, redirection vers `/merci` après succès (pas de double envoi si on actualise).
- Le prix est **toujours recalculé par le serveur**. Celui du navigateur ne sert qu'à l'affichage.
- Appel `fetch` natif vers Telegram, message en texte brut, délai maximal de 8 s, sans nouvel essai automatique (évite un doublon si la réponse se perd).
- Dépendances : `express`, `ejs`, `express-rate-limit`, `helmet`. Le `.env` est lu par `node --env-file`, sans `dotenv`.

Le détail de chaque choix (problème, options, raison) est dans [DECISIONS.md](DECISIONS.md).

## 3. Workflow avec l'IA

J'ai utilisé Claude (Claude Code) comme assistant, avec un cadre précis :
- **Réflexion avant code** : sujet reformulé, ambiguïtés listées et tranchées une par une, puis conception validée avant d'écrire du code. Les décisions sont notées dans `DECISIONS.md`.
- **Petites étapes** : une fonctionnalité à la fois, tests écrits d'abord pour les règles métier (rouge puis vert).
- **Je garde la main** : tous les commits et pushs sont faits par moi, l'IA ne touche jamais à Git.
- **Secrets** : aucun token dans le code ni dans les échanges prévus. Le `.env` est ignoré par Git.

Là où j'ai corrigé ou refusé ce que proposait l'IA :
- Image de véhicule trouvée sur un moteur de recherche (droits incertains) : refusée. Les images finales sont générées par IA et signalées comme illustratives.
- Délais de réponse inventés (« sous 24 h ») : retirés, le sujet ne les donne pas.
- Filtre et tri du catalogue : retirés, c'est un bonus que je n'ai pas choisi.
- Blocs de catégories et chiffres du type « 10 véhicules » : retirés, ils dépendaient de la taille du catalogue.
- Bouton de réservation sur chaque carte : déplacé sur la fiche véhicule, formulaire en fenêtre.
- Prénom et nom : séparés dans les deux formulaires, et affichés sur deux lignes dans Telegram.
- Design : demande explicite de ne pas utiliser de bleu ni de dégradé (aspect « généré »). Lovable n'a servi qu'à imaginer la maquette du formulaire, aucun de ses codes n'est repris.

## 4. Sécurité

- **Secrets** : `.env` ignoré par Git, `.env.example` sans valeur, token jamais écrit dans les logs ni les erreurs.
- **Anti-spam** : champ piège invisible (`website`, réponse silencieuse, rien n'est envoyé) et **10 envois maximum par adresse IP et par quart d'heure** (page 429 au-delà).
- **Validation côté serveur** de toutes les données (formats, longueurs, dates, âge, permis, consentement). Le navigateur n'est jamais cru.
- **XSS** : échappement automatique d'EJS, aucune donnée client affichée sans échappement.
- **En-têtes** : `helmet` (politique de sécurité du contenu stricte, donc aucun script dans le HTML : les scripts sont des fichiers séparés).
- **Taille des requêtes limitée** (10 ko), seul `public/` est servi (`/.env` et `/src` renvoient 404).
- **Erreurs** : le client ne voit jamais de détail technique (pages 404, 413, 429, 500 génériques).
- **Données personnelles** : champs réduits au nécessaire, case de consentement obligatoire, aucun stockage (ni base, ni fichier).
- **Dépendances** : `package-lock.json` versionné, `npm audit` sans vulnérabilité.

## 5. Choix face aux points flous du sujet

| Point flou | Choix |
|---|---|
| Véhicule avec âge minimum / ancienneté de permis | Dates de naissance et de permis demandées **uniquement** pour ces véhicules, contrôle côté serveur à la date de début de location. |
| Véhicule indisponible jusqu'à une date | Réservation possible à partir du **lendemain** de cette date (hypothèse prudente). Sans date de retour : impossible. |
| Nombre de jours de location | Différence entre les dates (du 10 au 12 = 2 jours), minimum 1. Prix = jours × prix/jour. |
| Images absentes des données | 10 images générées par IA, légende « Visuel illustratif », bloc gris avec la catégorie si un fichier manque. |
| Coordonnées et délais de l'agence | Non fournis, donc non affichés ni inventés. |
| Où réserver | Sur la fiche du véhicule, pour voir le véhicule et ses conditions avant d'envoyer. |
| Échec de Telegram | Message d'erreur clair, formulaire conservé, le client peut réessayer. |

## 6. Limites et suites possibles

- **Contrôle d'âge et de permis déclaratif** : le site ne peut pas vérifier une identité. L'agence vérifie à la remise des clés, et les deux dates figurent dans le message Telegram.
- **Pas de calendrier des réservations** (pas de base de données) : deux clients peuvent demander les mêmes dates. L'agence confirme ou refuse chaque demande.
- **Anti-spam limité** : ne stoppe pas un robot ciblé ni un spam manuel. La limite par IP se contourne avec plusieurs adresses. Derrière un hébergeur (proxy), il faut activer `trust proxy`, sinon tous les visiteurs partagent la même adresse.
- **Telegram est un service tiers** : on ne contrôle pas la conservation des données qui y transitent.
- **Pas de CSRF dédié** : pas de compte ni de session, le risque se limite à une demande envoyée, déjà couverte par l'anti-spam.
- **Prix indicatif** : le fichier ne donne ni prix du kilomètre supplémentaire ni remise, l'agence confirme le montant définitif.
- **Non déployé** : hors périmètre des bonus choisis. Le code reste déployable (port via `PORT`, aucune écriture sur disque).
- **Suites possibles** : confirmation par email au client, tableau de bord des demandes, vrai calendrier de disponibilités, déploiement.
