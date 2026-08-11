"use client";

import { useCallback, useEffect, useState } from "react";
import { authFetch } from "@/lib/access-token";
import { listenPortalDataChanged, notifyPortalDataChanged, scopeMatches } from "@/lib/portal-data-events";
import { invalidatePortalSharedFetch, portalSharedGet } from "@/lib/portal-shared-fetch";
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
      const result = await portalSharedGet<PortalNotification[]>("/api/notifications", async (response) => {
        const data = (await response.json().catch(() => ({}))) as NotificationsResponse & {
          error?: string;
        };
        if (!response.ok) {
          return { ok: false, error: data.error ?? "Failed to load notifications" };
        }
        return { ok: true, data: data.notifications ?? [] };
      });
      if (!result.ok) {
        if (!options?.silent) setNotifications([]);
        setError(result.error);
        return;
      }
      setNotifications(result.data);
    } catch {
      if (!options?.silent) setNotifications([]);
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  const markRead = useCallback(
    async (ids: string[]) => {
      if (!ids.length) return;
      setNotifications((prev) =>
        prev.map((notification) =>
          ids.includes(notification.id) ? { ...notification, read: true } : notification,
        ),
      );
      try {
        const response = await authFetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        });
        invalidatePortalSharedFetch("/api/notifications");
        if (!response.ok) {
          void load({ silent: true });
        } else {
          notifyPortalDataChanged("notifications");
        }
      } catch {
        void load({ silent: true });
      }
    },
    [load],
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        invalidatePortalSharedFetch("/api/notifications");
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

  return { notifications, loading, error, reload: load, markRead };
}
