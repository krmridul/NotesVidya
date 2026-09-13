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
import { User } from '../types.js';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Cloud Firestore with the configured database ID
// CRITICAL: The app will break without specifying firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

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

// User Document Path in Cloud Firestore: /users/{userId}
export const USERS_COLLECTION = 'users';

const ADMIN_EMAILS = ['mrityu7462@gmail.com'];

export function isSystemAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

/**
 * Retrieves a user document directly from Cloud Firestore
 */
export async function getUserFromFirestore(uid: string): Promise<User | null> {
  const path = `${USERS_COLLECTION}/${uid}`;
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      return null;
    }
    const data = snap.data() as User;
    return {
      ...data,
      id: uid
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

/**
 * Creates or synchronizes a user profile in Cloud Firestore
 */
export async function saveUserToFirestore(
  firebaseUser: FirebaseUser,
  extra: { name?: string; phone?: string; role?: 'customer' | 'admin' } = {}
): Promise<User> {
  const path = `${USERS_COLLECTION}/${firebaseUser.uid}`;
  try {
    const existing = await getUserFromFirestore(firebaseUser.uid);
    const isAdmin = isSystemAdminEmail(firebaseUser.email) || extra.role === 'admin' || existing?.role === 'admin';

    const userData: User = {
      id: firebaseUser.uid,
      name: extra.name || firebaseUser.displayName || existing?.name || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Customer'),
      email: firebaseUser.email || existing?.email || '',
      phone: extra.phone || firebaseUser.phoneNumber || existing?.phone || '',
      role: isAdmin ? 'admin' : (existing?.role || 'customer'),
      status: existing?.status || 'active',
      ordersCount: existing?.ordersCount ?? 0,
      totalSpent: existing?.totalSpent ?? 0,
      createdAt: existing?.createdAt || new Date().toISOString()
    };

    const userRef = doc(db, USERS_COLLECTION, firebaseUser.uid);
    await setDoc(userRef, userData, { merge: true });
    return userData;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

/**
 * Updates an existing user document in Cloud Firestore
 */
export async function updateUserInFirestore(uid: string, updates: Partial<User>): Promise<void> {
  const path = `${USERS_COLLECTION}/${uid}`;
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(userRef, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
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
