import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocFromServer
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { User } from '../types.js';
import fallbackFirebaseConfig from '../../firebase-applet-config.json';

// Configuration loaded from Vite environment variables (Google AI Studio Secrets) with graceful fallback
export const firebaseClientConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || fallbackFirebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || fallbackFirebaseConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || fallbackFirebaseConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || fallbackFirebaseConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || fallbackFirebaseConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || fallbackFirebaseConfig.appId,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || fallbackFirebaseConfig.firestoreDatabaseId || '(default)'
};

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseClientConfig) : getApp();

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Cloud Firestore with the configured database ID
// CRITICAL: The app will break without specifying firestoreDatabaseId
export const db = getFirestore(app, firebaseClientConfig.firestoreDatabaseId);

// Initialize Firebase Cloud Storage
export const storage = getStorage(app, firebaseClientConfig.storageBucket);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write'
}

export interface FirestoreErrorInfo {
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
  };
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

// Connectivity test per Firebase skill specification
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

// Firestore Collection Constants
export const CUSTOMERS_COLLECTION = 'customers';
export const USERS_COLLECTION = 'users';

const ADMIN_EMAILS = ['mrityu7462@gmail.com'];

export function isSystemAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

/**
 * Retrieves a customer profile directly from Cloud Firestore
 */
export async function getCustomerFromFirestore(uid: string): Promise<User | null> {
  const path = `${CUSTOMERS_COLLECTION}/${uid}`;
  try {
    const custRef = doc(db, CUSTOMERS_COLLECTION, uid);
    const snap = await getDoc(custRef);
    if (snap.exists()) {
      const data = snap.data() as User;
      return {
        ...data,
        id: uid
      };
    }

    // Fallback check in users collection
    const userRef = doc(db, USERS_COLLECTION, uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const data = userSnap.data() as User;
      return {
        ...data,
        id: uid
      };
    }

    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

/**
 * Retrieves a user document directly from Cloud Firestore
 */
export async function getUserFromFirestore(uid: string): Promise<User | null> {
  return getCustomerFromFirestore(uid);
}

/**
 * Creates or synchronizes a customer profile in Cloud Firestore
 */
export async function saveCustomerToFirestore(
  firebaseUser: FirebaseUser,
  extra: { name?: string; phone?: string; role?: 'customer' | 'admin'; emailVerified?: boolean } = {}
): Promise<User> {
  const path = `${CUSTOMERS_COLLECTION}/${firebaseUser.uid}`;
  try {
    const existing = await getCustomerFromFirestore(firebaseUser.uid);
    const isAdmin = isSystemAdminEmail(firebaseUser.email) || extra.role === 'admin' || existing?.role === 'admin';

    const customerData = {
      uid: firebaseUser.uid,
      id: firebaseUser.uid,
      name: extra.name || firebaseUser.displayName || existing?.name || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Customer'),
      email: firebaseUser.email || existing?.email || '',
      phone: extra.phone || firebaseUser.phoneNumber || existing?.phone || '',
      emailVerified: extra.emailVerified !== undefined ? extra.emailVerified : (firebaseUser.emailVerified || true),
      role: (isAdmin ? 'admin' : (existing?.role || 'customer')) as 'customer' | 'admin',
      status: existing?.status || 'active',
      ordersCount: existing?.ordersCount ?? 0,
      totalSpent: existing?.totalSpent ?? 0,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save to customers collection
    const custRef = doc(db, CUSTOMERS_COLLECTION, firebaseUser.uid);
    await setDoc(custRef, customerData, { merge: true });

    // Synchronize to users collection for full backward compatibility
    const userRef = doc(db, USERS_COLLECTION, firebaseUser.uid);
    await setDoc(userRef, customerData, { merge: true });

    return customerData as User;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

/**
 * Backward compatibility alias for saveCustomerToFirestore
 */
export async function saveUserToFirestore(
  firebaseUser: FirebaseUser,
  extra: { name?: string; phone?: string; role?: 'customer' | 'admin' } = {}
): Promise<User> {
  return saveCustomerToFirestore(firebaseUser, extra);
}

/**
 * Updates an existing customer document in Cloud Firestore
 */
export async function updateCustomerInFirestore(uid: string, updates: Partial<User>): Promise<void> {
  const path = `${CUSTOMERS_COLLECTION}/${uid}`;
  try {
    const custRef = doc(db, CUSTOMERS_COLLECTION, uid);
    await updateDoc(custRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });

    const userRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(userRef, updates).catch(() => {});
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

/**
 * Backward compatibility alias for updateCustomerInFirestore
 */
export async function updateUserInFirestore(uid: string, updates: Partial<User>): Promise<void> {
  return updateCustomerInFirestore(uid, updates);
}

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  fbSignOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged
};
export type { FirebaseUser };
