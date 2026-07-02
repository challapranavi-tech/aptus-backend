"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export { gsap, ScrollTrigger };

export const GSAP_DEFAULTS = {
  duration: 0.7,
  ease: "power3.out",
} as const;

export const GSAP_STAGGER = {
  cards: 0.15,
  text: 0.08,
  list: 0.1,
} as const;

export const GSAP_BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

let pluginsRegistered = false;

/**
 * Registers GSAP plugins. Call once at app initialization (client-side only).
 */
export function registerGSAPPlugins(): void {
  if (pluginsRegistered || typeof window === "undefined") return;
  gsap.registerPlugin(ScrollTrigger);
  pluginsRegistered = true;
}

/**
 * Creates a GSAP matchMedia instance scoped for cleanup.
 */
export function createGSAPMatchMedia() {
  return gsap.matchMedia();
}

/**
 * Creates a scoped GSAP context for safe cleanup in React components.
 */
export function createGSAPContext(scope?: Element | string | object) {
  return gsap.context(() => {}, scope);
}

/**
 * Utility to check reduced motion preference.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Shared scroll-triggered fade-up factory used across section components.
 * Returns a cleanup function — call it on unmount.
 */
export function fadeUpOnScroll(
  elements: Element | Element[] | NodeListOf<Element>,
  options: {
    stagger?: number;
    distance?: number;
    duration?: number;
    start?: string;
    delay?: number;
  } = {},
): () => void {
  if (typeof window === "undefined") return () => {};

  const {
    stagger = 0,
    distance = 40,
    duration = GSAP_DEFAULTS.duration,
    start = "top 82%",
    delay = 0,
  } = options;

  const tween = gsap.from(elements, {
    y: distance,
    opacity: 0,
    duration,
    ease: GSAP_DEFAULTS.ease,
    stagger,
    delay,
    scrollTrigger: {
      trigger: Array.isArray(elements) ? elements[0] : elements,
      start,
      once: true,
    },
  });

  return () => {
    tween.scrollTrigger?.kill();
    tween.kill();
  };
}
