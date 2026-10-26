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
- **Choix** : le formulaire affiche « Prix total : X € » (sans détail du calcul), **seulement une fois les deux dates saisies et valides**, grâce à un petit script côté navigateur. Le prix est égal au nombre de jours × `prix_jour`. Nombre de jours = différence entre les dates (du 10 au 12 = 2 jours), minimum 1 (*hypothèse*, convention des loueurs par tranches de 24 h). La caution est affichée dans les conditions de location de la fiche véhicule. Le serveur **recalcule** toujours le prix : celui du navigateur ne sert qu'à l'affichage, et c'est le prix du serveur qui figure dans le message Telegram. Sans JavaScript, le prix n'apparaît pas avant l'envoi mais figure dans le message reçu par l'agence.
- **Raison** : le prix est dans les données, et le client le voit tout de suite après avoir choisi ses dates. **Limite** : le fichier ne donne ni prix du kilomètre supplémentaire ni remise ; l'agence confirme le montant définitif à la réponse.

## D7. Données personnelles

- **Choix** : champs réduits au nécessaire, case de consentement obligatoire, courte mention d'information, **aucun stockage** (ni base, ni fichier), aucune donnée personnelle dans les logs.
- **Raison** : minimisation (RGPD). **Limite** : les données transitent par Telegram, service tiers dont on ne contrôle pas la conservation.

## D8. Anti-spam

- **Problème** : un formulaire public qui écrit sur Telegram est une cible.
- **Options** : captcha ; honeypot ; limite d'envois par IP.
- **Choix** : champ piège invisible (honeypot `website`) avec réponse silencieuse (redirection vers `/merci`, rien n'est envoyé) + limite de **10 envois par adresse IP et par quart d'heure** sur les deux formulaires (`express-rate-limit`, page 429 au-delà).
- **Raison** : léger, sans gêne pour le client, sans dépendance externe. **Limites** : ne stoppe pas un robot ciblé ni un spam manuel ; la limite par IP se contourne avec plusieurs adresses. Derrière un proxy d'hébergeur, il faut activer `trust proxy`, sinon tous les visiteurs partagent la même adresse.

## D9. Une page par véhicule

- **Problème** : où afficher les détails d'un véhicule et le formulaire de réservation.
- **Options** : détails repliables sur la carte + page de réservation séparée ; une page par véhicule.
- **Choix** : `/vehicules/:slug` contient tous les détails et le formulaire. Chaque carte du catalogue mène à cette page ; le bouton « Demander une réservation » se trouve sur la fiche (voir D18), pas sur le catalogue.
- **Raison** : parcours naturel de catalogue d'articles, moins de pages. Le champ `slug` du fichier est prévu pour cet usage.

## D10. Images manquantes

- **Options** : photos réelles (droits d'auteur incertains, une image trouvée sur Google/Shutterstock a été écartée) ; blocs gris sans image ; images générées par IA.
- **Choix** : 10 images générées par IA, recadrées et enregistrées sous les chemins prévus par `vehicles.json` (`public/images/vehicles/…`). Le serveur vérifie que le fichier existe (`resolveImage`) ; sinon la carte affiche un bloc gris portant la catégorie. Légende « Visuel illustratif » sur la fiche : ce ne sont pas les véhicules réels de l'agence. `vehicles.json` n'est pas modifié.
- **Raison** : le site est plus parlant avec des visuels, sans problème de droits. Le repli évite une image cassée si un fichier manque, et le site reste valable avec un autre catalogue.

## D11. Gestion des erreurs

- **Choix** : saisie invalide ou refus métier → 400, formulaire réaffiché avec valeurs conservées ; trop de tentatives → 429 ; page inconnue → 404 ; envoi trop volumineux → 413 ; Telegram en échec → 502 avec message de repli ; bug imprévu → 500 générique via un gestionnaire global. `.env` incomplet ou JSON illisible → arrêt au démarrage.
- **Raison** : le client ne voit jamais de détail technique. Le message de repli renvoie vers l'agence sans numéro, car le fichier n'en fournit pas.

## D12. Sécurité

- **Choix** : `.env` ignoré par Git et `.env.example` sans valeur ; échappement automatique d'EJS (jamais `<%-` sur une donnée client) ; contrôle serveur de toute donnée ; taille de requête limitée ; seul `public/` est servi ; `helmet` pour les en-têtes ; `package-lock.json` commité et `npm audit`.
- **CSRF** : évalué et non traité (pas de compte ni de session, le risque se réduit à une demande envoyée, déjà couverte par l'anti-spam).

## D13. Organisation du code

- **Choix** : `routes/` reçoit et répond ; `services/` porte la logique (`vehicles.js`, `rules.js` qui contient aussi le calcul du prix, `validation.js` qui valide les deux formulaires, `telegram.js`, `format.js` pour prix et dates). La configuration (`.env`) est lue dans `server.js`.
- **Raison** : la validation est séparée des routes pour être testée sans serveur. Les deux formulaires demandent **prénom et nom séparément** ; le message Telegram affiche « Nom : » puis « Prénom : » sur deux lignes, plus lisible pour l'agence.
- **Raison** : peu de fichiers, logique testable sans lancer de serveur.

## D14. Tests automatisés

- **Choix** : `node:test`, intégré à Node, sans dépendance. Ils portent sur le prix, les dates, l'âge, le permis, la validation des formulaires, la mise en forme et l'envoi du message (avec un faux `fetch`, sans réseau) et la synthèse du catalogue.
- **Raison** : ce sont les règles qui se cassent sans bruit. L'envoi réel vers Telegram est vérifié à la main avec un bot de test.

## D15. Déploiement et lancement

- **Choix** : pas de mise en ligne (hors périmètre des bonus choisis). Le code reste déployable : port via `PORT`, aucun chemin propre à un système, aucune écriture sur disque. Lecture de `.env` via `node --env-file` (Node ≥ 20.6), donc pas de `dotenv`.
- **Dépendances** : `express`, `ejs`, `express-rate-limit`, `helmet`.

## D16. Pages

- `/` accueil, `/vehicules` catalogue, `/vehicules/:slug` détail + réservation, `/contact` (formulaire + cartes d'orientation), `/merci`, pages 404, 429 et 500. Texte uniquement en français.

## D17. Direction visuelle

- **Problème** : donner au site un aspect soigné et premium, sans framework CSS.
- **Options** : maquette générée par un outil (Lovable) puis réécrite ; direction définie à la main.
- **Choix** : direction définie à la main, inspirée du rythme en bandes (sombre / clair / gris) d'un site de location connu, **sans sa palette orange**. Monochrome : noir `#1d1d1f`, gris clair, blanc ; **ni bleu ni dégradé** (aspect « généré » écarté). Police système, titres en minuscules avec interlettrage serré, boutons noirs en pilule, en-tête translucide fixe (CSS seul), retour immédiat à l'appui, respect de `prefers-reduced-motion`, `prefers-reduced-transparency` et `prefers-contrast`, contrastes AA, tailles en `rem`. Lovable n'a servi qu'à imaginer la maquette du formulaire, aucun code généré n'est repris.
- **Raison** : le CSS reste compréhensible ligne par ligne, et la retenue évite l'aspect générique. Les gestes et ressorts des conférences Apple sont écartés : aucun geste à gérer, ce serait du JavaScript non demandé.
- **À ne pas afficher** : aucun chiffre dépendant de la taille du catalogue (« 10 véhicules »…), puisque le catalogue n'est qu'un exemple.

## D18. Formulaire de réservation en fenêtre

- **Problème** : où mettre le bouton et le formulaire de réservation.
- **Options** : bouton sur chaque carte du catalogue ; bouton sur la fiche, formulaire dans la page ou en fenêtre.
- **Choix** : le catalogue ne propose que « voir la fiche ». Sur la fiche, le bouton « Demander une réservation » ouvre le formulaire dans une fenêtre native `<dialog>`. Elle se rouvre toute seule si le serveur renvoie des erreurs. Sans JavaScript, le formulaire s'affiche dans la page (`<noscript>`).
- **Raison** : le client voit le véhicule et ses conditions avant de réserver ; `<dialog>` est natif (accessibilité, touche Échap) et le script reste dans un fichier externe (compatible avec la politique de `helmet`).

## D19. Ce qui n'a pas été fait

- **Filtre et tri du catalogue** : bonus non choisi, donc absent.
- **Catégories cliquables, statistiques d'accueil, « 10 véhicules »** : essayés puis retirés, ils dépendaient de la taille du catalogue et alourdissaient la page.
- **Délais de réponse, téléphone, adresse** : non fournis par le sujet, donc non inventés (la page Contact n'en affiche pas).
