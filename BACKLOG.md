# Backlog produit — imhornywhattodo.com

Mise à jour : 17 octobre 2026. Le projet reste local pendant ce lot.

## Règles de suivi

- `À faire` : non commencé.
- `En cours` : développement ou validation en cours.
- `Terminée` : critères d’acceptation validés par les tests et le navigateur.
- Les points sont toujours décidés côté serveur. Aucun texte libre n’est enregistré sans consentement.

## Lot 1 — Challenge System v1

### US-01 — Accepter un défi Roulette — Terminée

En tant que membre, je veux accepter le résultat actuel de la Roulette comme défi afin de garder un objectif clair.

Critères d’acceptation :

- Le bouton `Accept challenge` apparaît uniquement sur un résultat Roulette reconnu.
- La création est réservée aux membres connectés et contrôlée côté serveur.
- Un membre ne peut avoir qu’un seul défi actif.
- Le défi actif reste disponible après rechargement.

Validation : API et interface testées ; une Roulette reconnue crée un défi actif persistant, une seconde acceptation renvoie un conflit contrôlé.

### US-02 — Gérer le défi actif — Terminée

En tant que membre, je veux voir, terminer ou abandonner mon défi actif.

Critères d’acceptation :

- La carte du défi actif est visible dans Chaos Club.
- `Completed` termine le défi ; `Skip` l’abandonne.
- L’action est idempotente et isolée par membre.
- Une confirmation est demandée avant `Skip`.

Validation : carte active affichée dans Chaos Club ; fin idempotente, abandon confirmé et isolation par membre couverts par les tests.

### US-03 — Récompenser l’accomplissement — Terminée

En tant que membre, je veux recevoir des points lorsque je termine un défi afin de progresser.

Critères d’acceptation :

- 15 points maximum pour un défi terminé, une fois par jour UTC.
- Accepter, consulter ou abandonner un défi ne donne aucun point.
- Un défi déjà clos ne peut pas attribuer de nouveaux points.
- Le plafond quotidien passe de 40 à 55 points et reste expliqué dans l’interface.

Validation : `Completed` attribue 15 points une fois par jour, le second appel donne 0, le plafond 55 est rendu depuis le serveur.

### US-04 — Historique des défis — Terminée

En tant que membre, je veux revoir mes défis terminés ou abandonnés.

Critères d’acceptation :

- Les 30 derniers défis sont visibles dans le compte.
- Le statut et la date sont affichés.
- Les données sont privées et supprimées avec le compte.

Validation : historique privé limité aux 30 entrées affichées les plus récentes ; suppression en cascade via la relation au compte.

### US-05 — Premiers badges privés — Terminée

En tant que membre, je veux débloquer des badges afin de visualiser ma progression.

Critères d’acceptation :

- `First Move` après un défi terminé.
- `Roulette Regular` après 5 défis terminés.
- `Wingman Apprentice` après 5 jours distincts de Wingman récompensés.
- Les badges sont calculés côté serveur et visibles uniquement dans le profil.

Validation : badges calculés à partir du journal serveur et des défis ; `First Move` observé immédiatement après le premier défi terminé.

## Lot 2 — Progression et contenu

### US-06 — Difficulté et catégories de défis — À faire

Classer les défis en `Soft`, `Playful`, `Bold` et par contexte (`solo`, `couple`, `date`, `social`, `self-care`) avec filtres accessibles.

### US-07 — Défis quotidiens et hebdomadaires — À faire

Proposer des objectifs renouvelés sans pénalité de série et avec des récompenses cosmétiques plafonnées.

### US-08 — Transformer un résultat Wingman en défi — À faire

Permettre de convertir une suggestion Wingman en action privée après validation explicite du membre.

## Lot 3 — Préparation du lancement

### US-12 — Pages dédiées et gestion isolée — Terminée

En tant que visiteur, je veux une page dédiée à chaque expérience tout en retrouvant exactement la direction artistique validée.

Critères d’acceptation :

- `/` présente l’accueil, le héros et les trois entrées principales.
- `/decision`, `/roulette` et `/wingman` isolent leur expérience respective.
- Le dashboard principal ne contient plus le panneau complet Chaos Club.
- `/account` regroupe le compte, les points, badges, récompenses, favoris, historique et paramètres.
- `/challenges` affiche uniquement le défi actif et l’historique des défis.
- La navigation utilise de vraies URL Next.js.
- Les composants, couleurs, illustrations, animations et comportements existants restent inchangés.

Validation : les huit routes sont générées par le build Next.js ; les espaces de gestion sont isolés par route en conservant les composants visuels historiques.

### US-11 — Chaos Club sous Next.js — Terminée

En tant que membre, je veux accéder directement à mon compte et à mes défis depuis de vraies routes sans perdre l’interface validée.

Critères d’acceptation :

- `/account` ouvre la création de compte ou le club du membre connecté.
- `/challenges` ouvre le club et sa zone de défis.
- L’écran 18+ reste prioritaire lors d’un accès direct.
- Les comptes, sessions, points, favoris, historique, récompenses et défis utilisent toujours l’API sécurisée et SQLite.
- Le design existant reste inchangé.

Validation : routes Next.js compilées, parcours HTTP des comptes couvert par les tests, et ouverture directe contrôlée dans le navigateur.

### US-09 — Authentification publique récupérable — À faire

Remplacer le code local de récupération par une authentification avec email vérifié avant la mise en ligne publique.

### US-10 — Exploitation et confiance — À faire

Ajouter administration de contenu, modération, sauvegardes, politique de confidentialité, conditions d’utilisation et analytics respectueuses de la vie privée.

