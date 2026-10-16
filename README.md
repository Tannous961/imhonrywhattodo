# imhornywhattodo.com — Application v7 — développement local

Application Node.js 24, interface néon, serveur IA et stockage SQLite. Aucun paquet externe à installer. Le design v2 est conservé. Le site s’utilise maintenant par son serveur HTTP, pas en ouvrant directement un fichier HTML.

Le guide principal de cette étape est **DEMARRAGE-LOCAL.md**. Le projet reste local ; aucun déploiement n’a été effectué.

## Démarrer sur votre ordinateur

1. Décompressez le ZIP dans un dossier.
2. Sous Windows, double-cliquez `start.cmd`. Il utilise Node.js installé ou le runtime local de Codex s’il est présent. Autrement, installez Node.js 24 depuis https://nodejs.org.
3. Ouvrez http://localhost:4173. Gardez la fenêtre de démarrage ouverte pendant l’utilisation.

Depuis un terminal : `npm start`. Les vérifications se lancent avec `npm test`.

## Activer le vrai Wingman

Copiez `.env.example` en `.env` et renseignez `OPENAI_API_KEY` **sur votre ordinateur ou dans les variables secrètes de l’hébergeur**. Ne transmettez pas la clé dans le chat, le JavaScript public ou un dépôt. Redémarrez le serveur.

Le modèle par défaut est `gpt-5.4-mini`, modifiable via `OPENAI_MODEL`. L’application utilise l’API Responses, avec `store: false`, un délai maximal et un plafond de sortie. Cela désactive le stockage de réponse demandé par l’application, sans garantir l’absence de conservation chez le fournisseur. La compatibilité d’un autre modèle avec `reasoning.effort: low` doit être vérifiée.

Sans clé, la mention **DEMO** reste affichée. Avec une clé, l’IA devient sélectionnable ; la validité de la clé et l’accès au modèle sont vérifiés lors de l’appel, pas simplement par sa présence. Aucun appel réel n’a été effectué pendant la livraison. Un échec du fournisseur affiche une erreur et ne remplace jamais silencieusement une réponse par une démo.

L’utilisateur choisit explicitement la démo locale ou l’IA. Un écran 18+ apparaît avant le site et mémorise la confirmation pendant la session. Il s’agit d’une déclaration, pas d’une vérification d’âge ou d’identité. Le mode, le ton et le contexte sont alors envoyés à OpenAI. Le contexte saisi n’est pas enregistré. Les résultats sont enregistrés dans le compte uniquement si son historique est activé, ou si vous ajoutez un favori. Le texte d’une réponse peut contenir des détails de votre contexte.

## Chaos Club : comptes et fidélité en local

Cliquez **Join the chaos**. Créez un compte avec un pseudonyme (3–24 caractères), un nom affiché et un mot de passe (12–128 caractères). Aucun email n’est demandé. **Enregistrez immédiatement le code de récupération**, affiché une fois : sans lui ni votre mot de passe, il n’existe pas de récupération par email. Le menu Recover remplace le mot de passe et renouvelle le code. Un changement de mot de passe ou une récupération invalide les autres sessions.

Les comptes appartiennent à la base du serveur local, pas au navigateur. Le cookie de session essentiel est HttpOnly, SameSite=Strict, valable 12 heures, et Secure sur HTTPS. Le serveur conserve uniquement le hachage du jeton. Les écritures de compte demandent un jeton CSRF. Mots de passe : scrypt avec sel individuel, N=131072, r=8, p=1 ; deux calculs simultanés au maximum et limitation des tentatives par connexion/pseudonyme. Les codes de récupération sont hachés et renouvelés après utilisation.

- 20 points à la création du compte.
- Chaque jour UTC : visite +5, Decision Machine +10, découverte d’un défi Roulette +10, génération Wingman (démo ou IA) +10, ajout d’un favori +5. Total maximal : 40/jour. Répéter une activité ne donne aucun point supplémentaire ce jour-là. Le serveur choisit les montants et contrôle les résultats reconnus ; les activités locales peuvent être automatisées, ce mécanisme ne prouve pas qu’un défi a été accompli dans la vie réelle.
- Récompenses sans valeur monétaire : style PNG Lemon Pop 50 points, Peach Glow 90, badge privé Little Menace 100. Après un achat, choisissez le style dans **Profile & card style**. Les niveaux reposent sur les points cumulés et ne baissent pas après un achat. Aucun paiement, concours ni classement public.
- 30 favoris privés au maximum. Historique du compte : désactivé par défaut, 50 résultats au maximum si activé, effaçable. Désactiver l’historique arrête les futurs enregistrements sans effacer les anciens ; utilisez Clear account history pour les supprimer. Le contexte libre est exclu, mais une réponse IA peut le reprendre.
- Suppression du compte avec mot de passe et confirmation DELETE : profil, sessions, points, récompenses, favoris et historique du compte sont supprimés. L’historique sur l’appareil et les liens de résultats créés séparément ont leurs propres commandes d’effacement et ne sont pas supprimés avec le compte.

La migration SQLite ajoute les tables sans supprimer les anciens liens ou compteurs. Conservez le dossier de données existant pour retrouver vos comptes lors d’une mise à jour. Aucune clé IA ni base de démonstration n’est livrée dans le ZIP. Les points ne donnent pas droit à davantage d’appels IA payants.

Références : [OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html), [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html), [Node crypto scrypt](https://nodejs.org/api/crypto.html#cryptoscryptpassword-salt-keylen-options-callback).

## Vidéo du bandeau et défilement

La vidéo fournie est intégrée à droite du titre sur ordinateur et sous le titre sur mobile. Le défilement avance ou recule dans les 10 secondes du clip. Le bandeau garde sa place dans la page, sans ajouter de zone vide pour l’animation. **Pause animation** fige l’image ; **Animate on scroll** réactive la synchronisation. Aucune lecture automatique en boucle.

Le fichier livré `public/assets/hero-scroll.mp4` est une version H.264 1280 × 720 avec **la piste audio retirée**, optimisée pour les déplacements dans la vidéo. L’élément est aussi muet. Le chargement vidéo commence après la confirmation 18+ ; une image fixe reste disponible si le chargement échoue. Avec « réduire les animations » activé sur l’appareil, seule l’image fixe est montrée par défaut ; l’utilisateur peut activer l’animation volontairement. Le serveur accepte les requêtes HTTP Range pour permettre la recherche dans le clip.

## Challenge System v1

Un résultat reconnu de Horny Roulette peut devenir un défi privé avec **Accept challenge**. Un compte conserve un seul défi actif. Chaos Club permet de le terminer ou de l’abandonner ; l’abandon demande confirmation et ne pénalise aucune série.

Terminer un défi rapporte 15 points au maximum une fois par jour UTC. Le plafond quotidien total est désormais de 55 points. Les répétitions, consultations et abandons ne donnent rien. Les 30 derniers défis clos sont affichés dans l’historique privé et supprimés avec le compte.

Trois badges privés sont calculés côté serveur : `First Move` après le premier défi terminé, `Roulette Regular` après cinq défis terminés, et `Wingman Apprentice` après cinq jours distincts récompensés avec le Wingman. Le suivi détaillé des prochaines user stories se trouve dans `BACKLOG.md`.

## Fonctionnalités

- Decision Machine : quatre étapes, 48 suggestions, prise en compte du contexte, de l’énergie et de l’audace. Chaque niveau a deux suggestions par contexte/énergie, pour éviter les résultats systématiquement identiques.
- Roulette : six catégories et 18 idées, roue réellement synchronisée et filtres « stay in », « go out », « connect ».
- Wingman : API serveur, démo explicite, états de chargement, erreurs et quotas.
- Partage : en local, un lien qui s’ouvre uniquement sur cet ordinateur ; carte PNG illustrée ou texte pour partager à l’extérieur. Lien court avec aperçu social, stockage serveur, expiration par défaut à 30 jours ; le champ de contexte libre est exclu. Une réponse IA peut toutefois reprendre des détails personnels : relisez avant de partager. Les téléchargements/copies déjà effectués ne peuvent pas être révoqués.
- Suppression : le créateur peut supprimer son lien depuis la même session de navigateur. Le jeton de suppression est dans `sessionStorage` ; après fermeture de cette session, il peut être perdu. Sans ce jeton, le lien expire automatiquement.
- Historique : opt-in, 20 résultats au maximum sur l’appareil, bouton d’effacement. Aucun stockage du champ contexte ; le texte d’une réponse peut contenir des détails personnels.
- Export PNG et copie de résultat ; messages correctement insérés en texte pour éviter les injections HTML.
- Navigation clavier, affichage mobile et ordinateur, réduction des animations.

## Limites et coûts

Par défaut : 10 tentatives IA/heure et 20/jour par adresse de connexion, 100 tentatives/jour pour tout le site, 2 appels simultanés au maximum. Les échecs fournisseur consomment aussi une tentative. Les compteurs sont persistants, mis à jour atomiquement avant l’appel ; le budget global est partagé par les processus qui utilisent **la même base de données**. Ils ne sont pas partagés entre plusieurs serveurs ayant des bases séparées. Les compteurs repartent aux bornes horaires/journalières UTC.

Ces quotas limitent les requêtes, pas un montant exact en euros. Configurez également le suivi des dépenses côté fournisseur. Une adresse IP partagée (Wi-Fi, VPN) partage le quota. Les identifiants de limitation sont des HMAC d’IP avec rotation quotidienne ; aucune IP brute n’est enregistrée par l’application. L’hébergeur peut conserver ses propres journaux. Les lignes de compteurs et liens expirés sont purgées au démarrage et tous les 100 échanges, et ne sont plus accessibles dès leur expiration.

Pour une audience importante, plusieurs instances ou un usage monétisé, faire évoluer les quotas vers un service partagé, ajouter une protection anti-abus adaptée et mesurer les coûts réels avant d’augmenter les limites. Cette version n’inclut ni paiements, ni communauté publique.

## Stockage et exploitation

`DATA_DIR` contient `app.sqlite` et ses éventuels fichiers WAL/SHM. **En production, un chemin absolu et persistant est obligatoire**, hors du dossier remplacé lors des déploiements et hors de toute racine web. L’application refuse de démarrer en production si le chemin n’est pas absolu. Vérifiez les permissions et sauvegardez ce dossier. Pour une sauvegarde simple et cohérente, arrêtez le serveur, copiez tout le dossier, puis redémarrez-le. Ne copiez pas seulement le fichier principal pendant que des écritures sont en cours.

Déploiement par conteneur possible avec `Dockerfile` et un volume persistant monté sur `/data`. Utilisez une seule instance pour cette première version et un proxy HTTPS.

## Documentation

- `DEPLOIEMENT-HOSTINGER.md` : réglages Hostinger et domaine.
- `VERIFICATION.md` : tests effectués et limites restantes.
- `public/ILLUSTRATIONS.md` : provenance et prompts des visuels.

Sources techniques consultées : [OpenAI Text generation](https://developers.openai.com/api/docs/guides/text), [GPT-5.4 Mini](https://developers.openai.com/api/docs/models/gpt-5.4-mini), [Node.js SQLite](https://nodejs.org/api/sqlite.html).
