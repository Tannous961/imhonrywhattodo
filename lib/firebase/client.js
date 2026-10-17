'use client';
import {getApps, initializeApp} from 'firebase/app';
import {getAuth} from 'firebase/auth';

// Public web configuration; administrative credentials never belong here.
export const firebaseConfig = {
  apiKey: 'AIzaSyBBbN9gp6mKjGeUCzVggpT8TG6EHcEGVt0',
  authDomain: 'freelance-1234.firebaseapp.com',
  projectId: 'freelance-1234',
  storageBucket: 'freelance-1234.firebasestorage.app',
  messagingSenderId: '872546626484',
  appId: '1:872546626484:web:e5063015e7ddeddb0aa0e1'
};
export function firebaseAuth() {
  return getAuth(getApps().find(app => app.name === 'imhorny-web') || initializeApp(firebaseConfig, 'imhorny-web'));
}
