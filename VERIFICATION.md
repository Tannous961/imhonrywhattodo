# Vérification locale v6

28 tests automatisés réussis, sans appel IA payant :

- quatre tests de l’écran 18+ : site masqué et inerte avant confirmation, entrée, session mémorisée, absence de stockage disponible et sortie neutre ;
- chargement des fichiers et modules, validation des paramètres, blocage des fichiers privés, origines et alias localhost ;
- appels IA avec fournisseur simulé, quotas, concurrence, annulation et libération des places, erreurs sans démo silencieuse ;
- création, lecture, suppression et expiration des liens, contexte libre exclu, métadonnées HTML échappées ;
- persistance SQLite, transactions atomiques des compteurs et configuration ;
- 24 configurations de Decision Machine, accès aux 48 idées et absence de répétition immédiate ;
- 180 contrôles de l’angle de roulette, filtres et accès aux 18 idées ;
- validation de l’historique et retour à la ligne des exports, y compris les mots longs et Unicode.

Nouveaux tests : points plafonnés à 40/jour, répétitions sans gain, achat idempotent et niveaux conservés ; favoris et historique privés et bornés, contexte exclu, suppression en cascade ; mots de passe scrypt et validation ; inscription/connexion, CSRF, déconnexion, récupération à usage unique et révocation des sessions, changement de mot de passe et suppression de compte ; persistance des comptes et récompenses après réouverture ; points Wingman attribués par le serveur après une réponse IA simulée.

Vérifications navigateur réalisées :

- nouveau compte local fictif, code de récupération affiché, 20 points de bienvenue +5 de visite ;
- Decision Machine, Wingman démo, favori et roulette : 60 points cumulés, plafond quotidien atteint ;
- achat Lemon Pop : débit de 50 points, 10 restants, niveau conservé, style sélectionnable ;
- connexion, favoris, historique optionnel et style conservés après rechargement ; aucun message d’erreur JavaScript ;
- nouvel espace testé à 375 px : aucun débordement horizontal ;

- écran 18+ visible seul à l’arrivée, bouton Leave vers une page neutre, retour à la notification, entrée et rechargement sans nouvelle demande dans la même session ;
- mode Bored, récapitulatif des quatre étapes et résultat directement dans son module ;
- lien sauvegardé marqué local avec sa date d’expiration et commandes de copie/ouverture ;
- Wingman démo, contexte libre exclu du texte copié ;
- historique opt-in conservé après rechargement, restauration sans contexte privé ;
- export PNG réel téléchargé et inspecté : 1080 × 1350, texte, illustration, signature et aucune entrée de contexte libre.

La version précédente a été contrôlée à 375 et 1280 px sans débordement horizontal ni image manquante. La notification d’entrée et les nouveaux contrôles ont aussi été inspectés dans le navigateur. Les tests ne constituent pas une garantie pour tous les appareils.

Non vérifié : appel OpenAI réel, faute de clé configurée. Le mode démo reste explicite. Aucun déploiement n’a été effectué et aucun domaine n’a été modifié. Les données de test et clés ne font pas partie de l’archive.


## Vidéo au défilement — v6

- Vidéo fournie de 10 secondes, convertie en H.264 1280 × 720. Contrôle du fichier avec ffprobe : une seule piste vidéo, aucune piste audio.
- Nouveau test HTTP des fichiers vidéo, de la lecture complète, des plages de début/fin/suffixe, des plages invalides (416) et de HEAD (206 sans corps).
- Navigateur : passage de 0 à 4,34 secondes au scroll descendant, puis retour à 1,70 seconde en remontant ; l’élément reste en pause et muet. Le bouton Pause animation conserve la même image malgré le défilement ; réactivation testée.
- Mobile à 375 px : vidéo sous le titre, aucune largeur débordante. Image de secours et bouton de contrôle présents. Aucun message d’erreur JavaScript relevé.
- La préférence de réduction des animations est prise en charge dans le code ; elle n’a pas été forcée dans le navigateur de vérification. Pas de vérification sur un appareil iOS physique.

## Challenge System — v7

- Tests du cycle accepter, terminer, répéter et abandonner ; un seul défi actif et isolation entre membres.
- Résultats Roulette contrôlés côté serveur ; une donnée arbitraire ne peut pas créer de défi récompensé.
- Attribution de 15 points une seule fois par jour et plafond quotidien de 55 points.
- Historique privé, suppression avec le compte et calcul serveur des badges.
- Parcours navigateur vérifié : création d’un compte local fictif, acceptation depuis la Roulette, affichage du défi actif, validation, passage de 25 à 40 points, historique et badge `First Move`. Aucune erreur JavaScript relevée.
