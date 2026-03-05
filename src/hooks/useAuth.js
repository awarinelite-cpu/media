// src/hooks/useAuth.js
// Handles Google sign-in, sign-out, and persisting user state

import { useState, useEffect } from "react";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "../firebase/firebase";

export function useAuth() {
  const [user, setUser] = useState(null);       // Firebase user + Firestore profile merged
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for auth state changes (persists across page reloads)
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch or create the user's Firestore profile
        const profile = await getOrCreateProfile(firebaseUser);
        setUser(profile);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Create profile in Firestore on first login, or fetch existing
  async function getOrCreateProfile(firebaseUser) {
    const userRef = doc(db, "users", firebaseUser.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      // New user — build a profile from Google account info
      const initials = firebaseUser.displayName
        ? firebaseUser.displayName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
        : "??";

      const username = firebaseUser.email.split("@")[0].replace(/[^a-z0-9]/gi, "").toLowerCase();

      const profile = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || "Anonymous",
        username,
        email: firebaseUser.email,
        avatar: initials,
        photoURL: firebaseUser.photoURL || null,
        bio: "",
        followers: 0,
        following: 0,
        createdAt: serverTimestamp(),
      };

      await setDoc(userRef, profile);
      return profile;
    }

    return { id: snap.id, ...snap.data() };
  }

  async function signInWithGoogle() {
    try {
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged above will handle setting user state
    } catch (err) {
      console.error("Sign-in error:", err.message);
    }
  }

  async function logout() {
    await signOut(auth);
    setUser(null);
  }

  return { user, loading, signInWithGoogle, logout };
}
