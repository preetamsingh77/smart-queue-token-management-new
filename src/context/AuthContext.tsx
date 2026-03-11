import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, IS_MOCK } from '../lib/firebase';
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
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3008/api';
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
    if (IS_MOCK) {
      const mockSession = localStorage.getItem('mock_user_session');
      if (mockSession) {
        setUser(JSON.parse(mockSession));
      }
      setLoading(false);
      return;
    }

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
    if (IS_MOCK) {
      showToast('Magic Links are disabled in Mock Mode.', 'error');
      return;
    }
    const actionCodeSettings = {
      url: window.location.origin + '/login-callback',
      handleCodeInApp: true,
    };
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    window.localStorage.setItem('emailForSignIn', email);
    showToast('Check your email for the login link!', 'info');
  };

  const signInWithEmailPassword = async (email: string, password: string) => {
    if (IS_MOCK) {
      let mockUser: UserProfile | null = null;
      if (email === 'user.citizen@gmail.com' && password === 'user123') {
        mockUser = { id: 'mock-cit-1', email, fullName: 'Demo Citizen', role: 'CITIZEN', createdAt: new Date().toISOString() } as UserProfile;
      } else if (email === 'admin@gmail.com' && password === 'admin123') {
        mockUser = { id: 'mock-adm-1', email, fullName: 'Demo Admin', role: 'ADMIN', createdAt: new Date().toISOString() } as UserProfile;
      } else if (email === 'officer@gmail.com' && password === 'officer123') {
        mockUser = { id: 'mock-off-1', email, fullName: 'Demo Officer', role: 'OFFICER', createdAt: new Date().toISOString() } as UserProfile;
      } else {
        throw new Error('Invalid credentials. (Hint: use user.citizen@gmail.com / user123)');
      }
      setUser(mockUser);
      localStorage.setItem('mock_user_session', JSON.stringify(mockUser));
      showToast('Signed in successfully (Mock Mode)', 'success');
      return;
    }
    await signInWithEmailAndPassword(auth, email, password);
    showToast('Signed in successfully', 'success');
  };

  const signUpWithEmailPassword = async (email: string, password: string, fullName: string, role: string = 'CITIZEN') => {
    if (IS_MOCK) {
      const mockUser = { id: 'mock-new-' + Date.now(), email, fullName, role: role as 'CITIZEN' | 'ADMIN' | 'OFFICER', createdAt: new Date().toISOString() } as UserProfile;
      setUser(mockUser);
      localStorage.setItem('mock_user_session', JSON.stringify(mockUser));
      showToast('Account created successfully (Mock Mode)!', 'success');
      return;
    }
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
    if (IS_MOCK) {
      const mockUser = { id: 'mock-goog-1', email: 'google.user@gmail.com', fullName: 'Google User', role: 'CITIZEN', createdAt: new Date().toISOString() } as UserProfile;
      setUser(mockUser);
      localStorage.setItem('mock_user_session', JSON.stringify(mockUser));
      showToast('Signed in with Google successfully (Mock Mode)', 'success');
      return;
    }
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
    if (IS_MOCK) {
      setUser(prev => {
        if (!prev) return null;
        const updated = { ...prev, role: newRole };
        localStorage.setItem('mock_user_session', JSON.stringify(updated));
        return updated;
      });
      showToast(`Identity updated to ${newRole} level`, 'success');
      return;
    }
    const currentAuthUser = auth.currentUser;
    if (!currentAuthUser) throw new Error('No authenticated user found');
    await axios.patch(`${API_URL}/profiles/${currentAuthUser.uid}`, { role: newRole });
    setUser(prev => prev ? { ...prev, role: newRole } : null);
    showToast(`Identity updated to ${newRole} level`, 'success');
  };

  const signOut = async () => {
    if (IS_MOCK) {
      setUser(null);
      localStorage.removeItem('mock_user_session');
      return;
    }
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
