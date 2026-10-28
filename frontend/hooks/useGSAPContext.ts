"use client";

import { gsap, prefersReducedMotion, registerGSAPPlugins } from "@/lib/gsap";
import { useEffect, useRef } from "react";

interface UseGSAPContextOptions {
  /** Ref to the root element — GSAP context + selector queries are scoped to it. */
  scope?: React.RefObject<Element | null>;
  /** Re-run when these values change (same semantics as useEffect deps). */
  dependencies?: unknown[];
  /** Animation setup — runs inside the scoped gsap.context on every (re-)mount. */
  setup?: () => void;
}

/**
 * Hook that creates a scoped GSAP context with automatic cleanup on unmount.
 * Pass a `setup` callback to define animations; they are auto-reverted on unmount
 * and re-created whenever `dependencies` change.
 */
export function useGSAPContext(options: UseGSAPContextOptions = {}) {
  const { scope, dependencies = [], setup } = options;
  const contextRef = useRef<gsap.Context | null>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;

    // Ensure ScrollTrigger (and any other plugins) are registered before use.
    registerGSAPPlugins();

    const target = scope?.current ?? undefined;

    contextRef.current = gsap.context(() => {
      setup?.();
    }, target);

    return () => {
      contextRef.current?.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return contextRef;
}
