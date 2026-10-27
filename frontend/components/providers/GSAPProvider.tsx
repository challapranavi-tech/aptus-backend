"use client";

import { useEffect } from "react";

/** Register GSAP plugins after hydration — keep gsap out of the critical path. */
export function GSAPProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void import("@/lib/gsap").then(({ registerGSAPPlugins }) => {
      registerGSAPPlugins();
    });
  }, []);

  return <>{children}</>;
}
