"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import {
  clearAccessToken,
  clearLegacyPortalSession,
  loginViaApi,
  logoutViaApi,
  readLegacyPortalSessionUser,
  syncLegacyPortalSession,
} from "@/lib/access-token";
import { fetchAuthMeShared, invalidateAuthMeCache } from "@/lib/auth-me-client";
import { syncPortalCartWithServer } from "@/lib/portal-cart";
import {
  invalidatePortalSharedFetch,
  warmPortalListCaches,
} from "@/lib/portal-shared-fetch";
import type { ClientProfile } from "@/types/profile";

type AuthContextValue = {
  user: ClientProfile | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function legacyToClientProfile(
  legacy: NonNullable<ReturnType<typeof readLegacyPortalSessionUser>>,
): ClientProfile {
  return {
    id: legacy.id,
    email: legacy.email,
    name: legacy.name,
    initials: legacy.initials,
    role: legacy.role ?? "Customer",
    company: legacy.company,
    phone: legacy.phone ?? "",
    location: legacy.location ?? "",
    accountManager: legacy.accountManager ?? "Aptus Support",
    supportTier: legacy.supportTier ?? "Standard",
    customerSince: legacy.customerSince ?? "",
    billingCycle: legacy.billingCycle ?? "",
    paymentTerms: legacy.paymentTerms ?? "",
    contactType:
      legacy.contactType === "company" || legacy.contactType === "person"
        ? legacy.contactType
        : undefined,
    street: legacy.street,
    street2: legacy.street2,
    city: legacy.city,
    state: legacy.state,
    zip: legacy.zip,
    country: legacy.country,
    taxId: legacy.taxId,
    website: legacy.website,
    language: legacy.language,
    tags: legacy.tags,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ClientProfile | null>(null);
  const [ready, setReady] = useState(false);

  const refreshUser = useCallback(async () => {
    try {
      const result = await fetchAuthMeShared();
      if (!result.ok) {
        setUser(null);
        if (result.status === 401) {
          clearLegacyPortalSession();
        }
        return;
      }
      syncLegacyPortalSession(result.user, true, { silent: true });
      setUser(result.user);
      warmPortalListCaches();
    } catch {
      setUser(null);
      clearLegacyPortalSession();
    }
  }, []);

  useLayoutEffect(() => {
    // Paint portal chrome from last session before first paint when possible.
    const legacy = readLegacyPortalSessionUser();
    if (legacy) {
      setUser(legacyToClientProfile(legacy));
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void refreshUser().finally(() => setReady(true));
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginViaApi(email, password);
    if (!result.ok) return result.error;
    invalidateAuthMeCache();
    invalidatePortalSharedFetch();
    setUser(result.user as ClientProfile);
    await syncPortalCartWithServer();
    warmPortalListCaches();
    return null;
  }, []);

  const logout = useCallback(async () => {
    await logoutViaApi();
    clearAccessToken();
    invalidateAuthMeCache();
    invalidatePortalSharedFetch();
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
