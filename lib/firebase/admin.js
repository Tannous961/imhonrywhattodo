import {cert, getApps, initializeApp} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {getFirestore} from 'firebase-admin/firestore';

export function firebaseServices() {
  if (typeof window !== 'undefined') throw new Error('Firebase Admin is server-only.');
  let app = getApps().find(app => app.name === 'imhorny-admin');
  if (!app) {
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    if (!clientEmail || !privateKey) throw new Error('Firebase server credentials are not configured.');
    app = initializeApp({credential: cert({projectId: 'freelance-1234', clientEmail, privateKey})}, 'imhorny-admin');
  }
  return {auth: getAuth(app), db: getFirestore(app)};
}
