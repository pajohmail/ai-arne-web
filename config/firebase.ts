import { initializeApp, FirebaseApp, getApps } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'placeholder-api-key',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'placeholder.firebaseapp.com',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'placeholder-project',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'placeholder.appspot.com',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'placeholder-app-id',
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

// Only initialize Firebase on the client side
if (typeof window !== 'undefined') {
    if (getApps().length === 0) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApps()[0];
    }
    auth = getAuth(app);
    db = getFirestore(app);
} else {
    // Provide mock instances for server-side build
    // These will never be used at runtime since the app is client-side only
    app = {} as FirebaseApp;
    auth = {} as Auth;
    db = {} as Firestore;
}

export { app, auth, db };
