import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc 
} from 'firebase/firestore';
import { Habit, UserTerminalConfig } from '../types';

// Read configuration from environment variables or fallback to system generated parameters
const firebaseConfig = {
  apiKey: (import.meta as any).env.VITE_FIREBASE_API_KEY || "AIzaSyDKzf3bri2K6njgK1o64V1Y3mUfafkCV9s",
  authDomain: (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN || "gen-lang-client-0786967448.firebaseapp.com",
  projectId: (import.meta as any).env.VITE_FIREBASE_PROJECT_ID || "gen-lang-client-0786967448",
  storageBucket: (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET || "gen-lang-client-0786967448.firebasestorage.app",
  messagingSenderId: (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID || "584507499628",
  appId: (import.meta as any).env.VITE_FIREBASE_APP_ID || "1:584507499628:web:59d854cb6ab7181e7b2449"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore with custom Database ID or fallback
const customDbId = (import.meta as any).env.VITE_FIREBASE_DATABASE_ID;
const projectId = (import.meta as any).env.VITE_FIREBASE_PROJECT_ID;

// If a custom project ID is provided (e.g. on Vercel) but no database ID is specified,
// we should default to the "(default)" database since they are using their own Firebase project.
// Otherwise, if we are in the default AI Studio sandbox project, we use the specific custom database.
let databaseId: string | undefined = undefined;
if (customDbId) {
  databaseId = customDbId === "(default)" ? undefined : customDbId;
} else if (!projectId || projectId === "gen-lang-client-0786967448") {
  databaseId = "ai-studio-habitcandlestick-e45421b2-ee56-4ecb-8a52-abe0225caf43";
}

export const db = getFirestore(app, databaseId);

/**
 * Saves habit records and configurations of the authenticated user to Firestore.
 */
export async function saveUserData(uid: string, habits: Habit[], config: UserTerminalConfig) {
  try {
    const userDocRef = doc(db, 'users', uid);
    await setDoc(userDocRef, {
      habits,
      config,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error("Error saving user data to Firestore:", error);
  }
}

/**
 * Loads habit records and configurations of the authenticated user from Firestore.
 */
export async function loadUserData(uid: string): Promise<{ habits: Habit[], config: UserTerminalConfig } | null> {
  try {
    const userDocRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        habits: data.habits || [],
        config: data.config || null
      };
    }
  } catch (error) {
    console.error("Error loading user data from Firestore:", error);
  }
  return null;
}

export { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
};
export type { User };
