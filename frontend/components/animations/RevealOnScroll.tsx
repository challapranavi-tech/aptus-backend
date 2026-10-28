"use client";

import { useGSAPContext } from "@/hooks/useGSAPContext";
import { gsap } from "@/lib/gsap";
import { useRef, type ReactNode } from "react";

// ─── RevealOnScroll ───────────────────────────────────────────────────────────

interface RevealOnScrollProps {
  children: ReactNode;
  className?: string;
  /** Extra delay in seconds before the animation starts. Default: 0. */
  delay?: number;
  /** Distance in px the element slides up from. Default: 48. */
  y?: number;
  /** Animation duration in seconds. Default: 0.85. */
  duration?: number;
}

/**
 * Wraps children in a div that fades + slides up when it enters the viewport.
 * Respects `prefers-reduced-motion` (via useGSAPContext).
 * Uses ScrollTrigger — trigger fires once at "top 88%".
 */
export function RevealOnScroll({
  children,
  className,
  delay = 0,
  y = 48,
  duration = 0.85,
}: RevealOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAPContext({
    scope: ref,
    dependencies: [delay, y, duration],
    setup() {
      const el = ref.current;
      if (!el) return;
      gsap.from(el, {
        opacity: 0,
        y,
        duration,
        delay,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 88%",
          toggleActions: "play none none none",
        },
      });
    },
  });

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

// ─── HeroEntrance ─────────────────────────────────────────────────────────────

interface HeroEntranceProps {
  children: ReactNode;
  className?: string;
}

/**
 * Page-load entrance animation for hero banners.
 * Fades in + slides up + subtle scale from 0.98, duration 1 s.
 * No ScrollTrigger — plays immediately on mount.
 */
export function HeroEntrance({ children, className }: HeroEntranceProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAPContext({
    scope: ref,
    setup() {
      const el = ref.current;
      if (!el) return;
      gsap.from(el, {
        opacity: 0,
        y: 32,
        scale: 0.98,
        duration: 1,
        ease: "power3.out",
      });
    },
  });

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
