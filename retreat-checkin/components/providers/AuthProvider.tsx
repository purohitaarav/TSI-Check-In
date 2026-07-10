"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { authService } from "@/lib/services/auth";
import { isAuthorized } from "@/lib/services/authorization";
import { onAuthStateChanged, User } from "firebase/auth";

export type AuthStatus = "loading" | "unauthenticated" | "authorized" | "unauthorized";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  authStatus: AuthStatus;
  signInWithGoogle: () => Promise<User | undefined>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true,
  authStatus: "loading",
  signInWithGoogle: async () => undefined,
  signOut: async () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setAuthStatus("unauthenticated");
        setLoading(false);
        return;
      }

      // User is authenticated — now check authorization
      const email = currentUser.email;
      if (!email) {
        // No email means we can't authorize — sign them out
        await authService.signOutUser();
        setUser(null);
        setAuthStatus("unauthorized");
        setLoading(false);
        return;
      }

      try {
        const authorized = await isAuthorized(email);
        if (authorized) {
          setUser(currentUser);
          setAuthStatus("authorized");
        } else {
          // Sign out unauthorized users immediately
          await authService.signOutUser();
          setUser(null);
          setAuthStatus("unauthorized");
        }
      } catch (error) {
        console.error("Authorization check failed:", error);
        // On error, fail safe — do not grant access
        await authService.signOutUser();
        setUser(null);
        setAuthStatus("unauthorized");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading,
      authStatus,
      signInWithGoogle: authService.signInWithGoogle, 
      signOut: authService.signOutUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
