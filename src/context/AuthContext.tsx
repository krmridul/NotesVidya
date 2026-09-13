import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types.js';
import { api } from '../lib/api.js';
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
  getCustomerFromFirestore,
  saveCustomerToFirestore,
  updateCustomerInFirestore,
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
  activateCustomerAccount: (data: { name: string; email: string; phone: string; password: string }) => Promise<User | null>;
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

    // Check for existing saved token if Firebase hasn't loaded a user
    const savedToken = typeof window !== 'undefined' ? localStorage.getItem('dps_token') : null;

    // Listen to real Firebase Authentication state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          setToken(idToken);
          localStorage.setItem('dps_token', idToken);

          // Retrieve customer document from Cloud Firestore
          let profile = await getCustomerFromFirestore(firebaseUser.uid);
          if (!profile) {
            // First time sign-in or doc not initialized -> create in Firestore customers collection
            profile = await saveCustomerToFirestore(firebaseUser);
          }

          // If designated admin email, ensure admin privileges
          if (isSystemAdminEmail(firebaseUser.email) && profile.role !== 'admin') {
            profile = { ...profile, role: 'admin' };
            await updateCustomerInFirestore(profile.id, { role: 'admin' });
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
        setLoading(false);
      } else {
        // If not authenticated via Firebase, check if there's a valid local session token
        if (savedToken) {
          api.getMe()
            .then(res => {
              if (res?.user) {
                setUser(res.user);
                setToken(savedToken);
              } else {
                localStorage.removeItem('dps_token');
                setUser(null);
                setToken(null);
              }
            })
            .catch(() => {
              localStorage.removeItem('dps_token');
              setUser(null);
              setToken(null);
            })
            .finally(() => {
              setLoading(false);
            });
        } else {
          setUser(null);
          setToken(null);
          setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      let firebaseSuccess = false;
      let fbError: any = null;

      try {
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        const idToken = await userCredential.user.getIdToken();

        let profile = await getCustomerFromFirestore(userCredential.user.uid);
        if (!profile) {
          profile = await saveCustomerToFirestore(userCredential.user);
        }

        // Check account status
        if (profile.status === 'inactive') {
          await fbSignOut(auth);
          localStorage.removeItem('dps_token');
          setToken(null);
          setUser(null);
          throw new Error('This account has been disabled. Please contact support@notesvidya.com.');
        }

        if (isSystemAdminEmail(userCredential.user.email) && profile.role !== 'admin') {
          profile = { ...profile, role: 'admin' };
          await updateCustomerInFirestore(profile.id, { role: 'admin' });
        }

        setToken(idToken);
        localStorage.setItem('dps_token', idToken);
        setUser(profile);
        firebaseSuccess = true;
      } catch (fbErr: any) {
        fbError = fbErr;
        // If account is disabled error, propagate immediately
        if (fbErr.message?.includes('disabled') || fbErr.code === 'auth/user-disabled') {
          throw new Error('This account has been disabled. Please contact support@notesvidya.com.');
        }
      }

      if (!firebaseSuccess) {
        try {
          const res = await api.login({ email: email.trim(), password });
          if (res?.user?.status === 'inactive') {
            throw new Error('This account has been disabled. Please contact support@notesvidya.com.');
          }
          setToken(res.token);
          localStorage.setItem('dps_token', res.token);
          setUser(res.user);
        } catch (apiErr: any) {
          if (fbError && (fbError.code?.startsWith('auth/') || fbError.message)) {
            throw fbError;
          }
          throw apiErr;
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const idToken = await userCredential.user.getIdToken();

      let profile = await getCustomerFromFirestore(userCredential.user.uid);
      if (!profile) {
        profile = await saveCustomerToFirestore(userCredential.user);
      }

      if (profile.status === 'inactive') {
        await fbSignOut(auth);
        localStorage.removeItem('dps_token');
        setToken(null);
        setUser(null);
        throw new Error('This account has been disabled. Please contact support@notesvidya.com.');
      }

      if (isSystemAdminEmail(userCredential.user.email) && profile.role !== 'admin') {
        profile = { ...profile, role: 'admin' };
        await updateCustomerInFirestore(profile.id, { role: 'admin' });
      }

      setToken(idToken);
      localStorage.setItem('dps_token', idToken);
      setUser(profile);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Activates a customer account in Firebase Auth and Cloud Firestore after OTP verification
   */
  const activateCustomerAccount = async (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }): Promise<User | null> => {
    setLoading(true);
    try {
      let firebaseUser: any = null;
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, data.email.trim(), data.password);
        firebaseUser = userCredential.user;
      } catch (createErr: any) {
        if (createErr.code === 'auth/email-already-in-use') {
          // If already created, sign in to link session
          try {
            const userCredential = await signInWithEmailAndPassword(auth, data.email.trim(), data.password);
            firebaseUser = userCredential.user;
          } catch {
            // ignore
          }
        } else {
          console.warn('Firebase createUser notice:', createErr.code || createErr.message);
        }
      }

      if (firebaseUser) {
        if (data.name) {
          try {
            await updateProfile(firebaseUser, { displayName: data.name.trim() });
          } catch {
            // ignore
          }
        }

        const idToken = await firebaseUser.getIdToken();
        const profile = await saveCustomerToFirestore(firebaseUser, {
          name: data.name.trim(),
          phone: data.phone.trim(),
          role: 'customer',
          emailVerified: true
        });

        setToken(idToken);
        localStorage.setItem('dps_token', idToken);
        setUser(profile);
        return profile;
      }

      // If client Firebase Auth threw (e.g. offline preview), retrieve active user
      const meRes = await api.getMe().catch(() => null);
      if (meRes?.user) {
        setUser(meRes.user);
        return meRes.user;
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: { name: string; email: string; phone: string; password: string; confirmPassword?: string }) => {
    return activateCustomerAccount({
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: data.password
    });
  };

  const setupAdmin = async (data: { name: string; email: string; phone: string; password: string }) => {
    setLoading(true);
    try {
      let created = false;
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
        localStorage.setItem('dps_token', idToken);
        setUser(profile);
        created = true;
      } catch (fbErr) {
        console.warn('Firebase admin creation notice (attempting backend setup):', fbErr);
      }

      if (!created) {
        const res = await api.setupAdmin(data);
        setToken(res.token);
        localStorage.setItem('dps_token', res.token);
        setUser(res.user);
      }
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const setAuthSession = (authenticatedUser: User, sessionToken: string) => {
    setToken(sessionToken);
    localStorage.setItem('dps_token', sessionToken);
    setUser(authenticatedUser);
  };

  const logout = async () => {
    try {
      await fbSignOut(auth);
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('dps_token');
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
        activateCustomerAccount,
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
