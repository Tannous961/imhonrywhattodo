# Déployer chez Hostinger

Le guide officiel Hostinger indique la prise en charge des applications Node.js sur **Business Web Hosting et les offres Cloud listées**, ainsi que sur VPS avec configuration manuelle. Le nom de votre offre n’est pas encore connu. Ne remplacez pas votre site existant avant d’avoir validé cette compatibilité et sauvegardé son contenu.

Source : [Ajouter une application Node.js chez Hostinger](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/).

## Offre avec « Node.js Web App »

1. Dans hPanel, allez dans **Websites → Create Website → Web App** puis choisissez l’import d’un ZIP. Importez `imhornywhattodo-local-v7.zip` ; `package.json` doit être à la racine du projet importé.
2. Sélectionnez **Node.js 24.x**, type d’application **Other** si la détection est demandée. Le point d’entrée est `server/index.mjs`. Commande de démarrage : `npm start`. Il n’y a pas de compilation ; si une commande de build est exigée, `npm run build` vérifie la syntaxe du point d’entrée. Si un dossier de sortie est exigé pour les assets, choisissez `public`, mais conservez un **serveur backend actif** : publier `public` seul désactiverait les API.
3. Ajoutez les variables dans les réglages serveur, jamais dans `public/` :

| Variable | Valeur |
| --- | --- |
| `NODE_ENV` | `production` |
| `HOST` | `0.0.0.0` |
| `PUBLIC_URL` | L’origine HTTPS du domaine temporaire Hostinger pour le test, puis `https://imhornywhattodo.com` |
| `PORT` | Utiliser le port injecté par Hostinger ; ne pas imposer un port différent |
| `DATA_DIR` | Chemin absolu d’un dossier privé persistant et inscriptible, hors des dossiers de déploiement |
| `OPENAI_API_KEY` | Clé du projet API, dans les secrets Hostinger ; facultative pour commencer en démo |
| `OPENAI_MODEL` | `gpt-5.4-mini` |
| `AI_HOURLY_LIMIT` | `10` |
| `AI_DAILY_LIMIT` | `20` |
| `AI_GLOBAL_DAILY_LIMIT` | `100` |
| `SHARE_DAYS` | `30` |
| `TRUST_PROXY` | `false` au départ ; voir ci-dessous |

**Point à valider dans votre offre :** Hostinger précise que `hbuilds/` et `public_html` sont remplacés aux déploiements. La base SQLite ne doit pas y être stockée. Faites confirmer un dossier privé qui survit aux redéploiements et reste accessible au processus Node.js ; son chemin dépend de votre compte. S’il n’existe pas sur votre offre, cette configuration SQLite ne convient pas : utilisez votre VPS avec un volume durable, ou adaptez la couche de stockage à la base MySQL Hostinger avant la publication. Ne présentez pas des liens comme durables sans avoir vérifié ce point.

4. Déployez d’abord sur le domaine temporaire. Vérifiez `/healthz`, le chargement des images, les trois expériences et un lien partagé ouvert dans une autre fenêtre. Redéployez une fois et vérifiez que ce lien fonctionne toujours : cela valide concrètement la persistance.
5. Connectez `imhornywhattodo.com` au projet dans hPanel, configurez les enregistrements DNS **indiqués pour ce projet**, puis activez HTTPS. Conservez vos MX de messagerie. Mettez `PUBLIC_URL=https://imhornywhattodo.com` et redéployez ; tous les nouveaux liens utiliseront ce domaine. Les liens créés sur le domaine temporaire gardent leur ancienne origine.
6. Choisissez une redirection canonique de `www` vers le domaine racine et de HTTP vers HTTPS, via les réglages d’hébergement.

### Limitation par IP derrière un proxy

`TRUST_PROXY=false` ignore les en-têtes IP fournis par les clients. Derrière un proxy, cela peut faire partager le quota à tous les visiteurs. N’activez `TRUST_PROXY=true` qu’après confirmation que le proxy **écrase/assainit `X-Forwarded-For`** et que le port Node n’est pas accessible directement. L’application utilise alors l’adresse la plus à droite de cet en-tête. Si Hostinger utilise une autre convention, adaptez-la et testez-la avant activation.

## Si votre offre n’accepte pas Node.js

N’envoyez pas ce projet complet dans `public_html` comme un simple site statique. Le dossier public seul afficherait le design, mais le vrai Wingman et les liens sauvegardés ne fonctionneraient pas. Il faut alors une offre Node.js compatible, un VPS ou un backend hébergé ailleurs avec une adaptation explicite du routage. Aucune migration payante n’a été engagée.

## VPS

Le projet est conteneurisable avec `Dockerfile`, ou exécutable par Node.js 24 sous un gestionnaire de processus. Montez un volume privé persistant pour SQLite et placez un proxy HTTPS devant l’application. Ouvrez uniquement les ports web au public. Les chemins, certificats et règles réseau doivent être adaptés au VPS réel ; aucune connexion à votre compte n’a été effectuée.

## Fin de mise en service

Après configuration d’une vraie clé, essayez un message non sensible dans le Wingman : il doit afficher un résultat **LIVE AI**. Une clé présente mais invalide produit une erreur, jamais une fausse réponse IA. Réglez le suivi des dépenses fournisseur et testez les quotas. Sauvegardez les données avant chaque mise à jour.

