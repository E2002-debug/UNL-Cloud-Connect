import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

let app;
let db: any;
let auth: any;
let storage: any;

try {
  // We'll try to import the config. If it doesn't exist, we'll use a dummy/fail gracefully.
  const firebaseConfig = await import('../../firebase-applet-config.json').then(m => m.default);
  app = initializeApp(firebaseConfig);
  db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  auth = getAuth(app);
  storage = getStorage(app);

  // Validate connection as per instructions
  const testConnection = async () => {
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
      console.log('Firebase Connected Successfully');
    } catch (error) {
      if (error instanceof Error && error.message.includes('the client is offline')) {
        console.error('Firebase is offline. Check configuration.');
      }
    }
  };
  testConnection();
} catch (e) {
  console.warn('Firebase configuration not found yet. Running in offline/mock mode.');
}

export { db, auth, storage };
