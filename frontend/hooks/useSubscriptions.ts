"use client";

import { useCallback, useEffect, useState } from "react";
import { authFetch } from "@/lib/access-token";
import { listenPortalDataChanged, scopeMatches } from "@/lib/portal-data-events";
import type { SubscriptionItem, SubscriptionsResponse } from "@/types/subscriptions";

type LoadOptions = {
  silent?: boolean;
};

export function useSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (options?: LoadOptions) => {
    if (!options?.silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const response = await authFetch("/api/subscriptions");
      const data = (await response.json().catch(() => ({}))) as SubscriptionsResponse & {
        error?: string;
      };
      if (!response.ok) {
        setSubscriptions([]);
        setError(data.error ?? "Failed to load subscriptions");
        return;
      }
      setSubscriptions(data.subscriptions ?? []);
    } catch {
      setSubscriptions([]);
      setError("Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        load({ silent: true }).catch(() => {
          /* handled inside load */
        });
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  useEffect(() => {
    return listenPortalDataChanged((scope) => {
      if (!scopeMatches("subscriptions", scope)) {
        return;
      }
      void load({ silent: true });
    });
  }, [load]);

  return { subscriptions, loading, error, reload: load };
}
