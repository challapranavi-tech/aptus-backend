"use client";

import { useCallback, useEffect, useState } from "react";
import { listenPortalDataChanged, scopeMatches } from "@/lib/portal-data-events";
import { invalidatePortalSharedFetch, portalSharedGet } from "@/lib/portal-shared-fetch";
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
      const result = await portalSharedGet<SubscriptionItem[]>(
        "/api/subscriptions",
        async (response) => {
          const data = (await response.json().catch(() => ({}))) as SubscriptionsResponse & {
            error?: string;
          };
          if (!response.ok) {
            return { ok: false, error: data.error ?? "Failed to load subscriptions" };
          }
          return { ok: true, data: data.subscriptions ?? [] };
        },
      );
      if (!result.ok) {
        setSubscriptions([]);
        setError(result.error);
        return;
      }
      setSubscriptions(result.data);
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
        invalidatePortalSharedFetch("/api/subscriptions");
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
