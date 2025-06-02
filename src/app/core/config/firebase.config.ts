import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { provideFirebaseApp } from '@angular/fire/app';
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  projectId: import.meta.env.NG_APP_FIREBASE_PROJECT_ID,
  appId: import.meta.env.NG_APP_FIREBASE_APP_ID,
  apiKey: import.meta.env.NG_APP_FIREBASE_API_KEY,
  authDomain: import.meta.env.NG_APP_FIREBASE_AUTH_DOMAIN,
  messagingSenderId: import.meta.env.NG_APP_FIREBASE_MESSAGING_SENDER_ID,
  measurementId: import.meta.env.NG_APP_FIREBASE_MEASUREMENT_ID,
  storageBucket: import.meta.env.NG_APP_FIREBASE_STORAGE_BUCKET
};

export const firebaseProviders = [
  provideFirebaseApp(() => initializeApp(firebaseConfig)),
  provideAuth(() => {
    const auth = getAuth()
    auth.useDeviceLanguage()
    return auth
  }),
  provideFirestore(() => getFirestore())
];
