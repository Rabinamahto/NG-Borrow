// src/auth.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { auth } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { updateProfile } from "firebase/auth";

const AuthContext = createContext();

/**
 * AuthProvider
 * - Provides { user, loading, error, signup, login, logout } via context
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true until we know auth state
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // signup now accepts optional displayName: signup(email, password, displayName)
  const signup = async (email, password, displayName) => {
    setError(null);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      // user is available as credential.user
      if (displayName) {
        try {
          await updateProfile(credential.user, { displayName });
        } catch (e) {
          console.warn('updateProfile failed:', e);
        }
      }
      return { success: true, user: credential.user };
    } catch (e) {
      setError(e.message);
      return { success: false, error: e.message };
    }
  };

  const login = async (email, password) => {
    setError(null);
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: credential.user };
    } catch (e) {
      setError(e.message);
      return { success: false, error: e.message };
    }
  };

  const logout = async () => {
    setError(null);
    try {
      await signOut(auth);
      return { success: true };
    } catch (e) {
      setError(e.message);
      return { success: false, error: e.message };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);