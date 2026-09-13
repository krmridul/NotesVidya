import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types.js';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  fbSignOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  getUserFromFirestore,
  saveUserToFirestore,
  updateUserInFirestore,
  testFirestoreConnection,
  isSystemAdminEmail
} from '../lib/firebase.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (data: { name: string; email: string; phone: string; password: string; confirmPassword?: string }) => Promise<void>;
  setupAdmin: (data: { name: string; email: string; phone: string; password: string }) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  setAuthSession: (user: User, token: string) => void;
  logout: () => Promise<void>;
  updateUser: (user: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize Firebase Auth listener and test Firestore connection
  useEffect(() => {
    // Validate connection to Firestore as required by Firebase instructions
    testFirestoreConnection();

    // Listen to real Firebase Authentication state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          setToken(idToken);

          // Retrieve user document from Cloud Firestore
          let profile = await getUserFromFirestore(firebaseUser.uid);
          if (!profile) {
            // First time sign-in or doc not initialized -> create in Firestore
            profile = await saveUserToFirestore(firebaseUser);
          }

          // If designated admin email, ensure admin privileges
          if (isSystemAdminEmail(firebaseUser.email) && profile.role !== 'admin') {
            profile = { ...profile, role: 'admin' };
            await updateUserInFirestore(profile.id, { role: 'admin' });
          }

          setUser(profile);
        } catch (err) {
          console.warn('Error synchronizing Firebase user profile with Firestore:', err);
          // Fallback minimal profile from Firebase Auth if Firestore fetch fails
          const fallbackUser: User = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Customer'),
            email: firebaseUser.email || '',
            phone: firebaseUser.phoneNumber || '',
            role: isSystemAdminEmail(firebaseUser.email) ? 'admin' : 'customer',
            status: 'active',
            ordersCount: 0,
            totalSpent: 0,
            createdAt: new Date().toISOString()
          };
          setUser(fallbackUser);
        }
      } else {
        setUser(null);
        setToken(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const idToken = await userCredential.user.getIdToken();
      setToken(idToken);

      let profile = await getUserFromFirestore(userCredential.user.uid);
      if (!profile) {
        profile = await saveUserToFirestore(userCredential.user);
      }
      if (isSystemAdminEmail(userCredential.user.email) && profile.role !== 'admin') {
        profile = { ...profile, role: 'admin' };
        await updateUserInFirestore(profile.id, { role: 'admin' });
      }
      setUser(profile);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const idToken = await userCredential.user.getIdToken();
      setToken(idToken);

      let profile = await getUserFromFirestore(userCredential.user.uid);
      if (!profile) {
        profile = await saveUserToFirestore(userCredential.user);
      }
      if (isSystemAdminEmail(userCredential.user.email) && profile.role !== 'admin') {
        profile = { ...profile, role: 'admin' };
        await updateUserInFirestore(profile.id, { role: 'admin' });
      }
      setUser(profile);
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: { name: string; email: string; phone: string; password: string; confirmPassword?: string }) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email.trim(), data.password);
      if (data.name) {
        try {
          await updateProfile(userCredential.user, { displayName: data.name.trim() });
        } catch {
          // ignore profile update error
        }
      }

      const isAdmin = isSystemAdminEmail(data.email);
      const profile = await saveUserToFirestore(userCredential.user, {
        name: data.name.trim(),
        phone: data.phone.trim(),
        role: isAdmin ? 'admin' : 'customer'
      });

      const idToken = await userCredential.user.getIdToken();
      setToken(idToken);
      setUser(profile);
    } finally {
      setLoading(false);
    }
  };

  const setupAdmin = async (data: { name: string; email: string; phone: string; password: string }) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email.trim(), data.password);
      if (data.name) {
        try {
          await updateProfile(userCredential.user, { displayName: data.name.trim() });
        } catch {
          // ignore
        }
      }

      const profile = await saveUserToFirestore(userCredential.user, {
        name: data.name.trim(),
        phone: data.phone.trim(),
        role: 'admin'
      });

      const idToken = await userCredential.user.getIdToken();
      setToken(idToken);
      setUser(profile);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const setAuthSession = (authenticatedUser: User, sessionToken: string) => {
    setToken(sessionToken);
    setUser(authenticatedUser);
  };

  const logout = async () => {
    try {
      await fbSignOut(auth);
    } finally {
      setToken(null);
      setUser(null);
    }
  };

  const updateUser = async (updatedUser: User) => {
    setUser(updatedUser);
    if (updatedUser.id) {
      try {
        await updateUserInFirestore(updatedUser.id, updatedUser);
      } catch (err) {
        console.warn('Failed to update user profile in Firestore:', err);
      }
    }
  };

  const isAdmin = user?.role === 'admin' || isSystemAdminEmail(user?.email) || isSystemAdminEmail(auth.currentUser?.email);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAdmin,
        login,
        loginWithGoogle,
        register,
        setupAdmin,
        resetPassword,
        setAuthSession,
        logout,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
