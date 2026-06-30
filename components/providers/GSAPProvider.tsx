"use client";

import { registerGSAPPlugins } from "@/lib/gsap";
import { useEffect } from "react";

export function GSAPProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    registerGSAPPlugins();
  }, []);

  return <>{children}</>;
}
