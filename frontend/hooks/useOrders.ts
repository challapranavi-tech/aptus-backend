"use client";

import { useCallback, useEffect, useState } from "react";
import { invalidatePortalSharedFetch, portalSharedGet } from "@/lib/portal-shared-fetch";
import { listenPortalDataChanged, scopeMatches } from "@/lib/portal-data-events";
import type { OrdersResponse, PortalOrder, PortalOrderStatus } from "@/types/orders";

type LoadOptions = {
  silent?: boolean;
};

export function useOrders(statusFilter?: PortalOrderStatus | "all") {
  const [orders, setOrders] = useState<PortalOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (options?: LoadOptions) => {
    if (!options?.silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const result = await portalSharedGet<PortalOrder[]>("/api/orders", async (response) => {
        const data = (await response.json().catch(() => ({}))) as OrdersResponse & {
          error?: string;
        };
        if (!response.ok) {
          return { ok: false, error: data.error ?? "Failed to load orders" };
        }
        return { ok: true, data: data.orders ?? [] };
      });
      if (!result.ok) {
        setOrders([]);
        setError(result.error);
        return;
      }
      setOrders(result.data);
    } catch {
      setOrders([]);
      setError("Failed to load orders");
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
        invalidatePortalSharedFetch("/api/orders");
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
      if (!scopeMatches("orders", scope)) {
        return;
      }
      void load({ silent: true });
    });
  }, [load]);

  const filtered =
    statusFilter && statusFilter !== "all"
      ? orders.filter((order) => order.status === statusFilter)
      : orders;

  return { orders: filtered, allOrders: orders, loading, error, reload: load };
}
