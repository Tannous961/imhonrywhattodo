# Démarrer et tester en local

Le projet utilise Next.js/React et Firebase pour les comptes, points, défis et liens. Une connexion Internet reste nécessaire pour les comptes Firebase et le Wingman IA. Les anciens comptes SQLite ne sont pas automatiquement importés dans Firebase.

Depuis le dossier de l’application, dans PowerShell :

```powershell
$env:PORT = '4180'
npm run dev
```

Gardez le terminal ouvert, puis ouvrez http://localhost:4180/account. La configuration privée est chargée depuis `.env` ; ne publiez jamais ce fichier. Node.js 24 est recommandé.

Le lanceur `start.cmd` est aussi disponible : il utilise normalement 4173, ou 4174 si 4173 est occupé. Utilisez l’URL affichée dans le terminal.

## Après une mise à jour

1. Arrêtez l’ancien serveur avec Ctrl+C dans son terminal.
2. Relancez-le depuis le dossier actuel de l’application.
3. Rechargez le navigateur avec Ctrl+F5.

Les modules serveur Firebase ne sont pas rechargés automatiquement par Next.js. Une ancienne API peut donc continuer de tourner alors que les pages ont été mises à jour. Si le port est déjà occupé, ne lancez pas une deuxième instance sur le même port : retrouvez d’abord le terminal de l’ancienne instance.

## Fonctionnalités

- Decision Machine : trois choix et récapitulatif, puis idée issue du catalogue.
- Roulette : activité aléatoire et défi facultatif.
- Wingman : IA sélectionnée si configurée, connexion et confirmation 18+ requises avant un appel. Cinq tentatives Free par jour UTC. Démo de phrases disponible sans appel IA.
- Compte Firebase : email et mot de passe ; récupération par email. Aucun code local de récupération à conserver.
- Fidélité : 20 points de bienvenue, puis jusqu’à 55 points par jour UTC. Défi quotidien et défi Roulette partagent la récompense de défi. Points cosmétiques, sans valeur monétaire et sans conversion en requêtes IA.
- Favoris privés et historique du compte facultatif. Historique de l’appareil distinct, également facultatif.
- Partage : résultats conservés dans Firestore, avec expiration de 30 jours vérifiée par le serveur. Les URL localhost restent accessibles uniquement sur cet ordinateur.

Le site public est distinct : https://imhonrywhattodo-zeta.vercel.app. Premium et paiement ne sont pas activés.

## Vérification

```powershell
npm test
```

Les tests unitaires/HTTP utilisent des données temporaires. `scripts/firebase-qa.mjs` vérifie les comptes et le parcours contre Firebase réel, puis supprime son compte de test. Les tests d’IA réelle ne s’exécutent que si `QA_LIVE=true`.
