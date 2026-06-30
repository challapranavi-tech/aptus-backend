"use client";

import { useRef, type ReactNode } from "react";
import { gsap, registerGsapPlugins, ScrollTrigger, useGSAP } from "@/hooks/useGSAP";
import { cn } from "@/lib/design-system/cn";

type RevealOnScrollProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  duration?: number;
};

/** Fade + slide-up when the element enters the viewport. */
export function RevealOnScroll({
  children,
  className,
  delay = 0,
  y = 48,
  duration = 0.85,
}: RevealOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);

  registerGsapPlugins();

  useGSAP(
    () => {
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
    { scope: ref },
  );

  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  );
}

type HeroEntranceProps = {
  children: ReactNode;
  className?: string;
};

/** Initial page-load animation for the hero banner. */
export function HeroEntrance({ children, className }: HeroEntranceProps) {
  const ref = useRef<HTMLDivElement>(null);

  registerGsapPlugins();

  useGSAP(
    () => {
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
    { scope: ref },
  );

  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  );
}

/** Call on route change cleanup if needed in client layouts. */
export function refreshScrollTrigger() {
  registerGsapPlugins();
  ScrollTrigger.refresh();
}
