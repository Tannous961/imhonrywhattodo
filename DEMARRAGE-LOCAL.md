# Utiliser le projet en local

1. Décompressez `imhornywhattodo-local-v7.zip` dans un dossier.
2. Double-cliquez **start.cmd** et gardez cette fenêtre ouverte.
3. Ouvrez **http://localhost:4173**.
4. À l’entrée, confirmez que vous avez au moins 18 ans, ou choisissez **Leave**. Le site est masqué avant ce choix. La confirmation est mémorisée dans l’onglet pour la session, sans cookie ; ce n’est pas une vérification d’identité ou d’âge.

Le lanceur utilise Node.js 22.14 ou plus récent, installé sur l’ordinateur ou fourni par Codex si disponible. Node.js 24 est recommandé pour Vercel. Aucun paquet supplémentaire n’est nécessaire. Pour arrêter l’application, faites Ctrl+C dans la fenêtre de démarrage.

Le nouveau bandeau utilise votre vidéo sans aucune piste audio : descendez pour avancer dans le clip, remontez pour revenir en arrière. Le bouton Pause animation permet de figer l’image. Le réglage de réduction des animations de l’appareil est respecté.

## Ce qui fonctionne

- **Decision Machine** : quatre étapes, récapitulatif, retour et réinitialisation. Quatre situations distinctes, dont « Just Bored », 48 suggestions et alternance des idées.
- **Horny Roulette** : roue animée, filtres, 18 suggestions réparties en six catégories. Les résultats s’affichent dans le module utilisé.
- **Wingman** : modèles locaux par défaut. L’IA réelle est disponible uniquement si vous configurez une clé côté serveur, puis sélectionnez explicitement ce mode. Aucun appel payant n’est nécessaire pour tester le site.
- **Résultats** : carte commune accessible via « Latest result », copie du texte, export PNG illustré, lien sauvegardé et suppression avec le jeton de la session créatrice.
- **Historique optionnel** : jusqu’à 20 résultats sur l’appareil, restauration après rechargement et effacement. Le contexte libre de saisie est exclu des enregistrements et de la copie ; une réponse IA peut malgré tout le reprendre dans son texte.

## Votre compte et vos points

Cliquez **Join the chaos**, créez un compte et conservez le code de récupération affiché. Aucun email n’est nécessaire. Le compte reste sur ce serveur local ; il ne devient pas public. Vos données sont dans `data/app.sqlite` lors d’un lancement normal. La confirmation 18+ reste propre à l’onglet ; une connexion utilise en plus un cookie essentiel de 12 heures.

Vous recevez 20 points de bienvenue, puis jusqu’à 40 par jour UTC avec les activités du site. Les points débloquent des styles de cartes PNG et un badge de profil. Ils ne représentent pas d’argent. Les favoris sont privés ; l’historique du compte est optionnel et distinct de l’historique sur l’appareil. Tout se gère dans **My club**. La démo Wingman compte pour la progression : aucune clé payante n’est requise.

Pour mettre à jour une ancienne installation : arrêtez le serveur, sauvegardez son dossier `data`, remplacez les fichiers de l’application en conservant `data` et `.env`, puis redémarrez. Ne lancez pas une nouvelle copie avec une base vide en espérant retrouver les anciens comptes.

## Comprendre les liens locaux

Un lien `http://localhost:4173/r/...` s’ouvre **sur cet ordinateur**, quand le serveur fonctionne. L’envoyer à un ami ne lui donne pas accès à votre ordinateur. Pour partager maintenant, utilisez la carte PNG ou le texte copié. Les liens durent 30 jours par défaut et les données sont conservées dans le dossier privé `data/` lors d’un lancement normal.

Ne supprimez pas `data/` si vous voulez conserver les liens. Ce dossier, les clés et les préférences personnelles ne sont pas inclus dans le ZIP livré.

## Tester

Depuis le dossier du projet, avec Node.js 24 disponible :

```text
npm run build
npm test
```

Les tests IA utilisent un fournisseur simulé. La livraison inclut 28 tests couvrant les parcours essentiels, le stockage, les limites d’utilisation, les liens, l’export de texte, l’écran 18+ et le cycle privé des défis.

Les polices Google Fonts requièrent Internet ; des polices de repli sont utilisées si elles sont indisponibles. Le mode démo et les jeux n’envoient aucun contexte à une IA. La page et le serveur restent locaux ; aucun déploiement n’a été effectué.
