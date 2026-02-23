import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import {
  onAuthStateChanged,
  signInWithEmailLink,
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  User,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import axios from 'axios';
const API_URL = 'http://localhost:3008/api';
import { UserProfile } from '../types';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signInWithEmail: (email: string) => Promise<void>;
  signInWithEmailPassword: (email: string, password: string) => Promise<void>;
  signUpWithEmailPassword: (email: string, password: string, fullName: string, role?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  updateRole: (newRole: 'ADMIN' | 'OFFICER' | 'CITIZEN') => Promise<void>;
  signOut: () => Promise<void>;
  firebaseUser: User | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (authUser) => {
      setFirebaseUser(authUser);
      if (authUser) {
        // Fetch profile
        const fetchProfile = async () => {
          try {
            const res = await axios.get(`${API_URL}/profiles/${authUser.uid}`);
            const data = res.data;
            setUser({
              id: authUser.uid,
              email: authUser.email || '',
              fullName: data.full_name || data.fullName || '',
              role: data.role || 'CITIZEN',
              createdAt: data.created_at || authUser.metadata.creationTime
            });
          } catch (e) {
            setUser({
              id: authUser.uid,
              email: authUser.email || '',
              fullName: authUser.displayName || 'Citizen User',
              role: 'CITIZEN',
              createdAt: authUser.metadata.creationTime || new Date().toISOString()
            });
          }
          setLoading(false);
        };
        fetchProfile();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    // Handle Magic Link completion if needed
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
        email = window.prompt('Please provide your email for confirmation');
      }
      if (email) {
        signInWithEmailLink(auth, email, window.location.href)
          .then(() => {
            window.localStorage.removeItem('emailForSignIn');
            showToast('Successfully signed in!', 'success');
          })
          .catch((error) => {
            console.error(error);
            showToast('Error signing in: ' + error.message, 'error');
          });
      }
    }

    return () => unsubscribeAuth();
  }, [showToast]);

  const signInWithEmail = async (email: string) => {
    const actionCodeSettings = {
      url: window.location.origin + '/login-callback',
      handleCodeInApp: true,
    };
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    window.localStorage.setItem('emailForSignIn', email);
    showToast('Check your email for the login link!', 'info');
  };

  const signInWithEmailPassword = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    showToast('Signed in successfully', 'success');
  };

  const signUpWithEmailPassword = async (email: string, password: string, fullName: string, role: string = 'CITIZEN') => {
    const { user: authUser } = await createUserWithEmailAndPassword(auth, email, password);

    // Set display name in Auth
    await updateProfile(authUser, { displayName: fullName });

    // Create profile in MongoDB
    await axios.post(`${API_URL}/profiles`, {
      uid: authUser.uid,
      full_name: fullName,
      email: email,
      role: role
    });

    showToast('Account created successfully!', 'success');
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const { user: authUser } = await signInWithPopup(auth, provider);

    // Upsert profile in MongoDB
    await axios.post(`${API_URL}/profiles`, {
      uid: authUser.uid,
      full_name: authUser.displayName || 'Google User',
      email: authUser.email,
      role: 'CITIZEN'
    });

    showToast('Signed in with Google successfully', 'success');
  };

  const updateRole = async (newRole: 'ADMIN' | 'OFFICER' | 'CITIZEN') => {
    const currentAuthUser = auth.currentUser;
    if (!currentAuthUser) throw new Error('No authenticated user found');
    await axios.patch(`${API_URL}/profiles/${currentAuthUser.uid}`, { role: newRole });
    setUser(prev => prev ? { ...prev, role: newRole } : null);
    showToast(`Identity updated to ${newRole} level`, 'success');
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithEmail, signInWithEmailPassword, signUpWithEmailPassword, signInWithGoogle, updateRole, signOut, firebaseUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
