# Firebase migration

Web application configured for project `freelance-1234`.

## Console setup

1. Authentication → Sign-in method → enable Email/Password.
2. Authentication → Settings → Authorized domains: add localhost and the exact deployed domain.
3. Create Cloud Firestore in production mode. Choose the database location deliberately.
4. Configure server-only FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in the hosting environment. Never paste the private key into chat or commit it.

## Current implementation status

SDK configuration is prepared in lib/firebase/client.js and lib/firebase/admin.js.
Email account forms now use Firebase Authentication through server REST calls and verified Firebase session cookies. Member endpoints store profiles, points, rewards, favourites, history and challenges in Firestore transactions under ihw_members.
The local server and Next API both route member/auth requests to Firebase before legacy SQLite.
SQLite is still used for legacy shared results and live AI request budgets. Live AI reward attribution needs a follow-up migration; the template demo uses Firestore activities.
No existing account or points data has been copied or deleted.
Do not publish new restrictive Firestore rules into this shared project until its existing applications have been reviewed.

Validation: build passed; canonical-content and points tests passed; concurrent real Firestore check-ins grant points once. Temporary test profile deleted.
End-to-end account registration is currently blocked by Firebase PASSWORD_LOGIN_DISABLED. Enable Email/Password in the freelance-1234 project before retesting.
Old SQLite accounts are retained locally and are not automatically transferred to Firebase.

## Migration complémentaire du 18 octobre 2026
Les API actives de production utilisent désormais Firestore pour les liens et quotas également. Le Wingman live utilise OpenRouter avec une clé serveur, des quotas transactionnels et une attribution de points serveur. Les anciens fichiers SQLite sont conservés uniquement comme données historiques locales. Voir DEPLOIEMENT-VERCEL.md et BACKLOG.md pour la validation et les limites de migration.
