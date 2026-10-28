"use client";

import { useOrders } from "@/hooks/useOrders";
import { OrdersPanel } from "./OrdersPanel";
import { QuotesStatusPanel } from "./QuotesStatusPanel";

export function OrdersSection() {
  const { allOrders, loading, error } = useOrders();
  return (
    <div className="aptus-portal-status-stack">
      <QuotesStatusPanel />
      <OrdersPanel orders={allOrders} loading={loading} error={error} />
    </div>
  );
}
