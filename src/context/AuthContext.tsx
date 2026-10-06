"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, fetchCurrentUser } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setAuthData: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const setAuthData = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    try {
      localStorage.setItem("minenager_auth_token", newToken);
    } catch (e) {
      console.error("Failed to store token in localStorage", e);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    try {
      localStorage.removeItem("minenager_auth_token");
    } catch (e) {
      console.error("Failed to remove token", e);
    }
  };

  const refreshUser = async () => {
    const savedToken = token || (typeof window !== "undefined" ? localStorage.getItem("minenager_auth_token") : null);
    if (!savedToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const userData = await fetchCurrentUser(savedToken);
      setUser(userData);
      setToken(savedToken);
    } catch (err) {
      console.warn("Auth token invalid or expired:", err);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        setAuthData,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
