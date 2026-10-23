# Décisions de conception

Chaque décision suit le même format : problème, options, choix, raison. Les points marqués *hypothèse* sont des choix faits là où le sujet ne dit rien.

## D1. Stack

- **Problème** : choisir un langage et un framework pour un site de 4 fonctionnalités, avec un token Telegram qui doit rester secret.
- **Options** : Node.js + Express + EJS ; PHP natif ; React + API Express ; Next.js.
- **Choix** : Node.js + Express + pages EJS rendues côté serveur.
- **Raison** : un serveur est indispensable (le token ne doit pas être visible dans le navigateur). Un seul langage des deux côtés. React ou Next.js ajouteraient du build, de l'état et un second projet sans rien apporter au besoin. PHP aurait convenu techniquement ; Node + Express a été retenu pour l'apprentissage et la cohérence JavaScript.

## D2. Formulaires classiques plutôt que fetch/AJAX

- **Problème** : comment envoyer et valider les formulaires.
- **Options** : `POST` HTML classique avec page rendue côté serveur ; envoi en JavaScript avec réponses JSON.
- **Choix** : `POST` HTML classique, redirection vers `/merci` après succès.
- **Raison** : fonctionne sans JavaScript, plus simple à expliquer et à modifier, bon pour l'accessibilité. La redirection évite un double envoi si le client actualise la page.

## D3. Envoi vers Telegram

- **Problème** : transmettre chaque demande au Telegram de l'agence.
- **Options** : appel direct à l'API `sendMessage` ; bibliothèque (`node-telegram-bot-api`, `grammY`) ; webhook.
- **Choix** : un appel `fetch` natif, message en **texte brut**, délai maximal d'environ 8 secondes, **pas de nouvel essai automatique**.
- **Raison** : on ne fait qu'envoyer, les bibliothèques servent surtout à recevoir. Le texte brut empêche toute mise en forme injectée. Sans nouvel essai, on évite d'envoyer un doublon si la réponse se perd ; au pire le client réessaie. Le token n'apparaît jamais dans les logs (l'adresse de l'API le contient).

## D4. Âge minimum et ancienneté de permis

- **Problème** : trois véhicules (RS 3, M4, Golf GTI) exigent un âge et un nombre d'années de permis.
- **Options** : refuser côté serveur ; envoyer quand même avec un avertissement.
- **Choix** : refus côté serveur. Le formulaire demande la date de naissance et la date d'obtention du permis **uniquement pour ces véhicules**. Âge et ancienneté sont calculés à la **date de début de location**.
- **Raison** : donne un sens aux données du fichier et évite des demandes inutiles. Le contrôle est **déclaratif** : le site ne peut pas vérifier une identité. La vérification finale (pièce d'identité, permis) se fait par l'agence à la remise des clés. Les deux dates figurent dans le message Telegram pour permettre ce recoupement.

## D5. Véhicule indisponible

- **Problème** : un véhicule a `disponible: false` et une date `indisponible_jusqu_au`.
- **Options** : bloquer le bouton ; autoriser la réservation à partir du retour.
- **Choix** : la réservation reste possible, avec une date de début au plus tôt le **lendemain** de la date indiquée (*hypothèse*, choix prudent car l'heure du retour est inconnue). Le navigateur limite le champ date, le serveur revérifie. Sans date de retour, la réservation est impossible.
- **Raison** : le client peut anticiper sa location. **Limite connue** : il n'y a pas de calendrier des réservations (aucune base de données), donc deux clients peuvent demander les mêmes dates ; l'agence confirme ou refuse chaque demande.

## D6. Prix affiché

- **Problème** : montrer ou non un prix au client.
- **Choix** : estimation indicative = nombre de jours × `prix_jour`, avec la caution. Nombre de jours = différence entre les dates (du 10 au 12 = 2 jours), minimum 1 (*hypothèse*, convention des loueurs par tranches de 24 h). Le serveur **recalcule** toujours le prix ; celui du navigateur ne sert qu'à l'affichage.
- **Raison** : le prix est dans les données. Le fichier ne donne ni prix du kilomètre supplémentaire ni remise, d'où le mot « indicatif ».

## D7. Données personnelles

- **Choix** : champs réduits au nécessaire, case de consentement obligatoire, courte mention d'information, **aucun stockage** (ni base, ni fichier), aucune donnée personnelle dans les logs.
- **Raison** : minimisation (RGPD). **Limite** : les données transitent par Telegram, service tiers dont on ne contrôle pas la conservation.

## D8. Anti-spam

- **Problème** : un formulaire public qui écrit sur Telegram est une cible.
- **Options** : captcha ; honeypot ; limite d'envois par IP.
- **Choix** : champ piège invisible (honeypot) avec réponse silencieuse + limite d'envois par IP (`express-rate-limit`).
- **Raison** : léger, sans gêne pour le client, sans dépendance externe. **Limites** : ne stoppe pas un robot ciblé ni un spam manuel ; la limite par IP se contourne avec plusieurs adresses. Derrière un proxy d'hébergeur, il faut activer `trust proxy`, sinon tous les visiteurs partagent la même adresse.

## D9. Une page par véhicule

- **Problème** : où afficher les détails d'un véhicule et le formulaire de réservation.
- **Options** : détails repliables sur la carte + page de réservation séparée ; une page par véhicule.
- **Choix** : `/vehicules/:slug` contient tous les détails et le formulaire. Chaque carte du catalogue mène à cette page, et son bouton « Demander une réservation » ouvre directement le formulaire.
- **Raison** : parcours naturel de catalogue d'articles, moins de pages. Le champ `slug` du fichier est prévu pour cet usage.

## D10. Images manquantes

- **Choix** : le serveur vérifie au démarrage si chaque image existe et utilise une image de remplacement sinon.
- **Raison** : aucun script dans le HTML, compatible avec la politique de sécurité de `helmet`. Le fichier `vehicles.json` n'est pas modifié.

## D11. Gestion des erreurs

- **Choix** : saisie invalide ou refus métier → 400, formulaire réaffiché avec valeurs conservées ; trop de tentatives → 429 ; page inconnue → 404 ; Telegram en échec → 502 avec message de repli ; bug imprévu → 500 générique via un gestionnaire global. `.env` incomplet ou JSON illisible → arrêt au démarrage.
- **Raison** : le client ne voit jamais de détail technique. Le message de repli renvoie vers l'agence sans numéro, car le fichier n'en fournit pas.

## D12. Sécurité

- **Choix** : `.env` ignoré par Git et `.env.example` sans valeur ; échappement automatique d'EJS (jamais `<%-` sur une donnée client) ; contrôle serveur de toute donnée ; taille de requête limitée ; seul `public/` est servi ; `helmet` pour les en-têtes ; `package-lock.json` commité et `npm audit`.
- **CSRF** : évalué et non traité (pas de compte ni de session, le risque se réduit à une demande envoyée, déjà couverte par l'anti-spam).

## D13. Organisation du code

- **Choix** : `routes/` reçoit et répond ; `services/` porte la logique (`vehicles.js`, `rules.js` qui contient aussi le calcul du prix, `telegram.js`). La configuration (`.env`) est lue dans `server.js`.
- **Raison** : peu de fichiers, logique testable sans lancer de serveur.

## D14. Tests automatisés

- **Choix** : `node:test`, intégré à Node, sans dépendance. Ils portent sur le prix, les dates, l'âge, le permis et la mise en forme du message.
- **Raison** : ce sont les règles qui se cassent sans bruit. L'envoi réel vers Telegram est vérifié à la main avec un bot de test.

## D15. Déploiement et lancement

- **Choix** : pas de mise en ligne (hors périmètre des bonus choisis). Le code reste déployable : port via `PORT`, aucun chemin propre à un système, aucune écriture sur disque. Lecture de `.env` via `node --env-file` (Node ≥ 20.6), donc pas de `dotenv`.
- **Dépendances** : `express`, `ejs`, `express-rate-limit`, `helmet`.

## D16. Pages

- `/` accueil, `/vehicules` catalogue, `/vehicules/:slug` détail + réservation, `/contact`, `/merci`, pages 404 et 500. Texte uniquement en français.

## D17. Direction visuelle

- **Problème** : donner au site un aspect soigné, alors que les images du catalogue n'existent pas.
- **Options** : maquette générée par un outil (Lovable) puis réécrite à la main ; direction visuelle définie à la main à partir de principes de design.
- **Choix** : direction définie à la main, sans maquette générée. Fond blanc cassé, texte presque noir, un seul accent bleu ; police système ; titres grands et serrés, texte courant aéré ; prix et nom du véhicule en premier plan ; badges discrets ; en-tête fixe en verre dépoli (CSS seul) ; retour immédiat à l'appui des boutons ; transitions très courtes ; respect de `prefers-reduced-motion` et de `prefers-contrast` ; contrastes AA et tailles en `rem`.
- **Raison** : une conception typographique tient sans photo, et la retenue évite l'aspect générique des maquettes générées. Le CSS reste court et compréhensible ligne par ligne. Les principes viennent des conférences de design d'Apple (typographie, hiérarchie, simplicité, retour immédiat). Les parties sur les gestes et les ressorts sont écartées : le site n'a aucun geste à gérer, et ce serait du JavaScript non demandé.
