"use client";

import { useOrders } from "@/hooks/useOrders";
import { OrdersPanel } from "./OrdersPanel";

export function OrdersSection() {
  const { allOrders, loading, error } = useOrders();
  return <OrdersPanel orders={allOrders} loading={loading} error={error} />;
}
