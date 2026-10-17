# Checklist QA — Lot Free / Premium

Cette checklist valide la monétisation sans modifier la direction artistique. Les tests doivent être exécutés avec un compte gratuit, un compte Premium actif, un abonnement annulé et un utilisateur non connecté.

## 1. Accès et âge

- [ ] L’écran +18 apparaît en premier sur `/`, `/decision`, `/roulette`, `/wingman`, `/account` et `/challenges`.
- [ ] Un visiteur ne peut pas appeler une expérience protégée avant validation +18.
- [ ] Le consentement +18 est conservé uniquement selon la politique prévue et peut être révoqué.
- [ ] Les routes et API ne divulguent aucune donnée d’un autre compte.

## 2. Compte et sessions

- [ ] Inscription, connexion, déconnexion et récupération fonctionnent avec des erreurs génériques.
- [ ] Une session expirée renvoie vers une action de connexion sans perdre les données non sensibles.
- [ ] Un compte gratuit voit son solde de points, ses défis et ses limites.
- [ ] La suppression du compte supprime points, défis, badges, historique et statut Premium associés.

## 3. Quotas Free

- [ ] Les quotas journaliers sont calculés côté serveur et non depuis le compteur affiché dans le navigateur.
- [ ] Chaque message Wingman consommant un quota est compté une seule fois, même après double clic ou retry réseau.
- [ ] Un spin Roulette et une création de défi respectent leurs quotas configurés.
- [ ] Le compteur restant se met à jour après succès, erreur contrôlée et rechargement.
- [ ] Le changement de fuseau horaire client ne permet pas de récupérer un quota.
- [ ] L’atteinte d’une limite affiche le paywall prévu sans casser la navigation ni l’historique.
- [ ] Une nouvelle journée UTC réinitialise les quotas exactement une fois.

## 4. Accès Premium

- [ ] Un abonnement actif ouvre les quotas et contenus Premium après confirmation serveur.
- [ ] Un client ne peut pas s’attribuer Premium en modifiant le local storage, les cookies ou le corps d’une requête.
- [ ] Les droits sont vérifiés sur chaque endpoint sensible, pas uniquement dans l’interface.
- [ ] Un renouvellement confirmé conserve l’accès sans interruption.
- [ ] Une annulation conserve l’accès jusqu’à la date de fin puis repasse en Free.
- [ ] Un paiement échoué ou une suspension retire les droits selon le statut serveur.
- [ ] Une reconnexion sur un autre appareil restaure le même statut.

## 5. Paiement et webhooks

- [ ] Le Checkout utilise uniquement le mode test en environnement QA.
- [ ] Le montant, la devise et le plan affichés avant paiement correspondent au serveur.
- [ ] Chaque webhook est signé, journalisé et idempotent.
- [ ] Un webhook rejoué ne double pas les points, l’abonnement ou les droits.
- [ ] Un webhook inconnu ou mal signé est refusé sans modifier la base.
- [ ] Le retour après paiement ne suffit pas à activer Premium sans webhook/lecture serveur.
- [ ] Le portail client permet annulation et mise à jour du moyen de paiement.

## 6. Points, fidélité et limites

- [ ] Les points sont attribués uniquement après un événement éligible vérifié côté serveur.
- [ ] Un même défi terminé deux fois ne récompense qu’une fois.
- [ ] Le plafond journalier reste appliqué Free et Premium selon la règle métier documentée.
- [ ] Une dépense de points est atomique et ne peut pas créer un solde négatif.
- [ ] Les récompenses et packs affichent leur coût avant confirmation.
- [ ] Un achat répété ou une requête concurrente ne double pas le débit.

## 7. Non-régression du design

- [ ] Les couleurs, typographies, illustrations, espacements et animations de la direction validée restent identiques.
- [ ] Les pages dédiées isolent leur expérience sans afficher les panneaux des autres modules.
- [ ] Les états Free, limite atteinte, Premium actif et paiement en attente utilisent les composants visuels existants.
- [ ] Le paywall est responsive sur 375 px, 768 px et desktop.
- [ ] Aucun texte de test, faux témoignage ou chiffre d’utilisateurs n’est visible.
- [ ] Les animations respectent `prefers-reduced-motion`.

## 8. AI Wingman en mode démo

- [ ] Le mode démo est indiqué clairement près de l’entrée Wingman et dans l’écran de réponse.
- [ ] Une réponse de démonstration n’est jamais présentée comme une réponse d’IA réellement générée.
- [ ] Le mode démo ne consomme pas de crédit IA payant inexistant.
- [ ] Le quota Free est appliqué à l’usage démo si la règle produit le prévoit.
- [ ] En absence de backend, l’interface affiche un état de disponibilité compréhensible et aucune erreur technique brute.
- [ ] Le passage futur vers le backend IA conserve les mêmes contrôles de quota et de statut Premium.

## 9. Sécurité et observabilité

- [ ] Les endpoints protégés refusent absence de session, mauvais rôle et identifiant d’un autre membre.
- [ ] Les logs ne contiennent pas mot de passe, token, contenu sensible ou données de paiement.
- [ ] Les erreurs client sont actionnables ; les détails serveur restent dans les logs.
- [ ] Les événements d’activation, limite, conversion, annulation et suppression sont mesurés selon le consentement.
- [ ] Un export de données permet de vérifier les événements associés à un compte.

## 10. Critères de sortie

Le lot est validé lorsque :

- [ ] tous les scénarios Free et Premium passent sur environnement de test ;
- [ ] aucun endpoint sensible n’est accessible par contournement client ;
- [ ] les webhooks sont idempotents et les transitions d’abonnement sont correctes ;
- [ ] les routes et responsive design ne présentent aucune régression ;
- [ ] le mode démo Wingman est explicitement signalé ;
- [ ] `npm test`, `npm run check` et le build Next.js passent.

