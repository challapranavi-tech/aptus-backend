"use client";

import { useCallback, useEffect, useState } from "react";
import { authFetch } from "@/lib/access-token";
import { listenPortalDataChanged } from "@/lib/portal-data-events";
import type { PortalQuote, QuotesResponse } from "@/types/quotes";

export function useQuotes() {
  const [quotes, setQuotes] = useState<PortalQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authFetch("/api/quotes");
      const data = (await response.json().catch(() => ({}))) as QuotesResponse & {
        error?: string;
      };
      if (!response.ok) {
        setError(data.error ?? "Unable to load quote status.");
        setQuotes([]);
        return;
      }
      setQuotes(data.quotes ?? []);
    } catch {
      setError("Unable to load quote status.");
      setQuotes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
    return listenPortalDataChanged(() => {
      void reload();
    });
  }, [reload]);

  return { quotes, loading, error, reload };
}
