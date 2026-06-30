import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  initializeFirestore, 
  doc, 
  getDoc, 
  setDoc 
} from 'firebase/firestore';
import { Habit, UserTerminalConfig } from '../types';

declare global {
  interface ImportMeta {
    readonly env: any;
  }
}

// Read configuration from environment variables or fallback to system generated parameters
const firebaseConfig = {
  apiKey: (import.meta.env as any).VITE_FIREBASE_API_KEY || "AIzaSyDKzf3bri2K6njgK1o64V1Y3mUfafkCV9s",
  authDomain: (import.meta.env as any).VITE_FIREBASE_AUTH_DOMAIN || "gen-lang-client-0786967448.firebaseapp.com",
  projectId: (import.meta.env as any).VITE_FIREBASE_PROJECT_ID || "gen-lang-client-0786967448",
  storageBucket: (import.meta.env as any).VITE_FIREBASE_STORAGE_BUCKET || "gen-lang-client-0786967448.firebasestorage.app",
  messagingSenderId: (import.meta.env as any).VITE_FIREBASE_MESSAGING_SENDER_ID || "584507499628",
  appId: (import.meta.env as any).VITE_FIREBASE_APP_ID || "1:584507499628:web:59d854cb6ab7181e7b2449"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Detect if the app is running in the AI Studio preview iframe or sandbox environment
const isInIframe = typeof window !== 'undefined' && window.self !== window.top;
const isAIStudioPreview = typeof window !== 'undefined' && (
  window.location.hostname.includes('ais-dev') || 
  window.location.hostname.includes('ais-pre') ||
  window.location.hostname.includes('run.app')
);

// Initialize Firestore with custom Database ID or fallback
const customDbId = (import.meta.env as any).VITE_FIREBASE_DATABASE_ID;

// If we are running in the default AI Studio sandbox project, we MUST use the specific multi-tenant database ID.
// Otherwise, if the user is using their own custom project (Vercel or custom credentials), we default to "(default)".
const isSandboxProject = !firebaseConfig.projectId || firebaseConfig.projectId === "gen-lang-client-0786967448";

let databaseId: string | undefined = undefined;
if (isSandboxProject) {
  databaseId = "ai-studio-habitcandlestick-e45421b2-ee56-4ecb-8a52-abe0225caf43";
} else if (customDbId) {
  databaseId = customDbId === "(default)" ? undefined : customDbId;
}

const useLongPolling = isInIframe || isAIStudioPreview;
const firestoreSettings = useLongPolling ? { 
  experimentalForceLongPolling: true,
  useFetchStreams: false
} : {};

export const db = databaseId 
  ? initializeFirestore(app, firestoreSettings, databaseId)
  : initializeFirestore(app, firestoreSettings);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function removeUndefined(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefined(item));
  }
  const cleaned: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const val = obj[key];
      if (val !== undefined) {
        cleaned[key] = removeUndefined(val);
      }
    }
  }
  return cleaned;
}

/**
 * Saves habit records and configurations of the authenticated user to Firestore.
 */
export async function saveUserData(uid: string, habits: Habit[], config: UserTerminalConfig) {
  const path = `users/${uid}`;
  try {
    const userDocRef = doc(db, 'users', uid);
    const cleanedHabits = removeUndefined(habits);
    const cleanedConfig = removeUndefined(config);
    await setDoc(userDocRef, {
      habits: cleanedHabits,
      config: cleanedConfig,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Loads habit records and configurations of the authenticated user from Firestore.
 */
export async function loadUserData(uid: string): Promise<{ habits: Habit[], config: UserTerminalConfig } | null> {
  const path = `users/${uid}`;
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
    handleFirestoreError(error, OperationType.GET, path);
  }
  return null;
}

export { 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
};
export type { User };
