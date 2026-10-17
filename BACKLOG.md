# Backlog produit — imhornywhattodo.com

Mise à jour : 17 octobre 2026. Roadmap orientée revenus, avec conservation stricte de la direction artistique validée.

## Objectif produit

Transformer les expériences gratuites (Decision Machine, Horny Roulette et AI Wingman) en une habitude de divertissement adulte, puis convertir les membres actifs en abonnés Premium. Le design Pop & Playful, les couleurs, illustrations, animations et le ton existants restent inchangés.

## Règles de suivi

- `À faire` : non commencé.
- `En cours` : développement ou validation en cours.
- `Terminée` : critères d’acceptation validés par les tests et le navigateur.
- Les points, limites, droits Premium et récompenses sont décidés côté serveur.
- Aucun témoignage, chiffre d’utilisateurs ou avis n’est inventé.
- Les données sensibles sont minimisées, privées et supprimables.

## Lot 0 — Socle existant (terminé)

### US-01 à US-05 — Défis, points, badges et historique — Terminées

Le membre peut accepter un défi Roulette, gérer son défi actif, recevoir jusqu’à 15 points par accomplissement (plafond quotidien serveur de 55), consulter ses 30 dernières actions et débloquer les badges `First Move`, `Roulette Regular` et `Wingman Apprentice`.

### US-11/US-12 — Routes Next.js et pages isolées — Terminées

Les expériences `/decision`, `/roulette`, `/wingman`, ainsi que `/account` et `/challenges`, sont accessibles via de vraies routes tout en conservant exactement le design validé et la priorité de l’écran +18.

## Lot 1 — MVP rétention et compte (priorité immédiate)

### US-13 — Créer un compte et se connecter — À faire

En tant que visiteur, je veux créer un compte email et me reconnecter afin de conserver mes points, défis, badges et conversations Wingman.

Critères : inscription/connexion/déconnexion sécurisées côté serveur ; validation +18 et consentement avant activation ; erreurs lisibles sans révéler si un email existe ; réutilisation des composants visuels existants.

### US-14 — Profil, suppression et récupération — À faire

Le membre peut modifier son profil, demander un lien de récupération, exporter ses données et supprimer son compte avec suppression en cascade.

### US-15 — Portefeuille de points et séries — À faire

Afficher solde, journal des gains, série quotidienne et prochaine récompense. Les écritures sont idempotentes, auditables et refusent toute modification côté client.

### US-16 — Limites gratuites explicites — À faire

Définir les quotas journaliers (messages Wingman, spins, défis) côté serveur, afficher le compteur restant et proposer une entrée Premium à l’atteinte d’une limite, sans bloquer les fonctions déjà acquises.

## Lot 2 — Monétisation Premium

### US-17 — Offre Premium et paywall cohérent — À faire

Créer une page `/premium` et des états de paywall intégrés aux expériences, avec bénéfices réels : quotas augmentés, personnalités Wingman supplémentaires, défis exclusifs et historique étendu. Aucun faux chiffre social.

### US-18 — Paiement récurrent — À faire

Intégrer Stripe Checkout en priorité avec abonnement mensuel, annulation, portail client, webhooks signés et synchronisation du statut côté serveur.

### US-19 — Accès Premium et restauration — À faire

Un abonnement actif ouvre immédiatement les avantages sur tous les appareils ; une annulation reste active jusqu’à la date de fin ; les webhooks sont rejouables sans double attribution.

### US-20 — Packs et récompenses de fidélité — À faire

Permettre l’échange de points contre des éléments cosmétiques ou des packs de défis, avec catalogue versionné, coût affiché avant confirmation et protection contre les achats répétés.

## Lot 3 — Activation et croissance responsable

### US-21 — Défis quotidiens et hebdomadaires — À faire

Proposer des objectifs renouvelés, sans pénalité de série, avec récompenses plafonnées et catégories `Soft`, `Playful`, `Bold` (`solo`, `couple`, `date`, `social`, `self-care`).

### US-22 — Transformer un résultat Wingman en défi — À faire

Permettre de convertir une suggestion Wingman en action privée après validation explicite du membre, puis récompenser uniquement l’accomplissement vérifié.

### US-23 — Résultats partageables et parrainage léger — À faire

Générer une carte partageable sans données privées, avec lien court révocable et bonus de points optionnel au partage ou à l’invitation, sans spam.

### US-24 — Analytics de conversion respectueuses — À faire

Mesurer activation, rétention, quotas, conversion Premium et résiliation avec consentement, événements minimisés et possibilité de désactivation.

## Lot 4 — Confiance et exploitation avant lancement public

### US-25 — Administration et modération — À faire

Isoler les pages admin, gérer le catalogue de défis, désactiver un contenu signalé et conserver un journal d’audit. Les outils admin ne sont jamais visibles dans le dashboard utilisateur.

### US-26 — Sécurité, conformité et sauvegardes — À faire

Ajouter politique de confidentialité, conditions d’utilisation, gestion du consentement, limitation de débit, sauvegardes SQLite chiffrées et procédure de restauration testée.

### US-27 — QA paiement et déploiement — À faire

Tester les parcours +18, compte, quotas, achat, webhook, annulation, restauration et suppression sur environnement de test, puis documenter le déploiement Hostinger/Vercel.

## Ordre d’exécution recommandé

1. US-13 à US-16 : comptes, points et limites.
2. US-17 à US-19 : offre et paiement Premium.
3. US-21/US-22 : contenu qui augmente la rétention.
4. US-20/US-23/US-24 : fidélité, partage et mesure.
5. US-25 à US-27 : confiance et mise en production.

