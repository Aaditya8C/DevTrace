// ============================================================
// DevTrace — Authentication Context & Provider
// ============================================================

"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { authService, UserResponse } from "@/api/services/authService";
import { API_CONFIG } from "@/api/constants/config";
import { useToastStore } from "@/store/toastStore";

interface AuthContextType {
  user: UserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { addToast } = useToastStore();

  const refreshAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await authService.getMe();
      if (data.authenticated) {
        setUser(data);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.warn("Failed to retrieve user auth state:", error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(() => {
    // Redirect directly to Spring Security OAuth initiation endpoint
    window.location.href = `${API_CONFIG.BASE_URL}/oauth2/authorization/github`;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
      addToast("Logged Out", "info", "You have successfully signed out.");
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
      addToast("Logout Failed", "error", "Unable to complete sign out request.");
    }
  }, [addToast]);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
export default AuthContext;
