"use client";

import { useCallback, useEffect, useState } from "react";
import { authFetch } from "@/lib/access-token";
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
      const response = await authFetch("/api/orders");
      const data = (await response.json().catch(() => ({}))) as OrdersResponse & {
        error?: string;
      };
      if (!response.ok) {
        setOrders([]);
        setError(data.error ?? "Failed to load orders");
        return;
      }
      setOrders(data.orders ?? []);
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
