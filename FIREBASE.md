# Firebase — état de la migration

Projet : freelance-1234. Configuration Web publique dans lib/firebase/client.js ; accès Admin uniquement côté serveur dans lib/firebase/admin.js.

## Fonctionnel

- Inscription email/mot de passe avec confirmation 18+, connexion, récupération email, changement du mot de passe, déconnexion et suppression.
- Session Firebase HttpOnly, Secure en production, SameSite=Strict et contrôle d'origine.
- Firestore ihw_members : profils, points, niveaux, badges, récompenses, préférences, favoris, historique et défis.
- Firestore ihw_shares : liens, expiration, hachage des jetons de suppression et métadonnées sociales. Le seul ancien lien SQLite encore valide a été importé en préservant son ID et son jeton.
- Firestore ihw_limits : réservations atomiques des quotas avant les appels IA.
- Firestore ihw_metrics : compteurs quotidiens agrégés de création de compte, première activité, retour, intérêt Premium et limite atteinte.
- Wingman live : OpenRouter, modèle openai/gpt-4o-mini, points serveur. Aucune clé privée dans Git.

## Validation

33 tests automatisés passent. Tests Firebase réels réussis en local, préproduction et production : sessions, accès privés, points, origine, récupération/changement de mot de passe, partages et suppression. Appel OpenRouter réel et points associés validés. Comptes QA supprimés. npm audit : 0 vulnérabilité.

Production : https://imhonrywhattodo-zeta.vercel.app

## Reste d'exploitation

Le compte de service ne dispose pas de datastore.indexes.update. Activer depuis la console Firestore le TTL du champ expiresAt sur ihw_limits et ihw_shares. Les liens expirés sont déjà refusés immédiatement à la lecture.

Les anciens comptes SQLite restent dans la base locale et ne sont pas automatiquement importés dans Firebase Authentication. Le reste du projet Firebase partagé n'a pas été modifié.

Voir DEPLOIEMENT-VERCEL.md pour les variables serveur et la procédure de déploiement.
