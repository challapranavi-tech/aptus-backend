"use client";

import { useCallback, useEffect, useState } from "react";
import { authFetch } from "@/lib/access-token";
import { listenPortalDataChanged, scopeMatches } from "@/lib/portal-data-events";
import type { NotificationsResponse, PortalNotification } from "@/types/notifications";

type LoadOptions = {
  silent?: boolean;
};

export function useNotifications() {
  const [notifications, setNotifications] = useState<PortalNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (options?: LoadOptions) => {
    if (!options?.silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const response = await authFetch("/api/notifications");
      const data = (await response.json().catch(() => ({}))) as NotificationsResponse & {
        error?: string;
      };
      if (!response.ok) {
        setNotifications([]);
        setError(data.error ?? "Failed to load notifications");
        return;
      }
      setNotifications(data.notifications ?? []);
    } catch {
      setNotifications([]);
      setError("Failed to load notifications");
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
      if (!scopeMatches("notifications", scope)) {
        return;
      }
      void load({ silent: true });
    });
  }, [load]);

  return { notifications, loading, error, reload: load };
}
