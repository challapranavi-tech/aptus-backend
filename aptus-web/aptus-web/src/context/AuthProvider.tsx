"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  authFetch,
  clearAccessToken,
  clearLegacyPortalSession,
  loginViaApi,
  logoutViaApi,
  setAccessToken,
  syncLegacyPortalSession,
} from "@/lib/access-token";
import type { ClientProfile } from "@/types/profile";

type AuthContextValue = {
  user: ClientProfile | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ClientProfile | null>(null);
  const [ready, setReady] = useState(false);

  const refreshUser = useCallback(async () => {
    try {
      const response = await authFetch("/api/auth/me");
      if (!response.ok) {
        setUser(null);
        if (response.status === 401) {
          clearLegacyPortalSession();
        }
        return;
      }
      const data = (await response.json()) as {
        user?: ClientProfile;
        accessToken?: string;
        expiresIn?: number;
      };
      if (data.accessToken && data.expiresIn) {
        setAccessToken(data.accessToken, data.expiresIn);
      }
      if (data.user) {
        syncLegacyPortalSession(data.user, true, { silent: true });
      }
      setUser(data.user ?? null);
    } catch {
      setUser(null);
      clearLegacyPortalSession();
    }
  }, []);

  useEffect(() => {
    void refreshUser().finally(() => setReady(true));
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginViaApi(email, password);
    if (!result.ok) return result.error;
    setUser(result.user as ClientProfile);
    return null;
  }, []);

  const logout = useCallback(async () => {
    await logoutViaApi();
    clearAccessToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, ready, login, logout, refreshUser }),
    [user, ready, login, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
