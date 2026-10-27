export const SOFTWARE_CATALOG_ANCHOR_ID = "software-catalog";

const CATALOG_HASHES = new Set(["software-catalog", "products", "software"]);

export function isSoftwareCatalogHash(hash: string): boolean {
  const normalized = hash.replace(/^#/, "").trim().toLowerCase();
  return CATALOG_HASHES.has(normalized);
}

/** Scroll the products section into view (returns false if the anchor is not mounted yet). */
export function scrollToSoftwareCatalog(behavior: ScrollBehavior = "smooth"): boolean {
  if (typeof document === "undefined") return false;
  const target = document.getElementById(SOFTWARE_CATALOG_ANCHOR_ID);
  if (!target) return false;
  target.scrollIntoView({ behavior, block: "start" });
  return true;
}

/** Retry until Suspense/async catalog content mounts (e.g. cross-page navigation with hash). */
export function scheduleScrollToSoftwareCatalog(options?: {
  behavior?: ScrollBehavior;
  maxAttempts?: number;
  delayMs?: number;
}): void {
  if (typeof window === "undefined") return;

  const behavior = options?.behavior ?? "smooth";
  const maxAttempts = options?.maxAttempts ?? 20;
  const delayMs = options?.delayMs ?? 60;
  let attempts = 0;

  function tryScroll() {
    const useSmooth = attempts === 0 ? behavior : "auto";
    if (scrollToSoftwareCatalog(useSmooth)) return;
    attempts += 1;
    if (attempts < maxAttempts) {
      window.setTimeout(tryScroll, delayMs);
    }
  }

  tryScroll();
}
