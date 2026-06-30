"use client";

import { AuthProvider } from "@/context/AuthProvider";

export function PortalProviders({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
