import { invalidatePortalSharedFetchForScope } from "./portal-shared-fetch";

export type PortalDataScope = "orders" | "subscriptions" | "notifications" | "all";

export const PORTAL_DATA_CHANGED_EVENT = "aptus:portal-data-changed";

export function notifyPortalDataChanged(scope: PortalDataScope = "all"): void {
  if (typeof window === "undefined") {
    return;
  }
  invalidatePortalSharedFetchForScope(scope);
  window.dispatchEvent(
    new CustomEvent(PORTAL_DATA_CHANGED_EVENT, { detail: { scope } }),
  );
}

export function listenPortalDataChanged(
  handler: (scope: PortalDataScope) => void,
): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const listener = (event: Event) => {
    const detail = (event as CustomEvent<{ scope?: PortalDataScope }>).detail;
    handler(detail?.scope ?? "all");
  };

  window.addEventListener(PORTAL_DATA_CHANGED_EVENT, listener);
  return () => {
    window.removeEventListener(PORTAL_DATA_CHANGED_EVENT, listener);
  };
}

export function scopeMatches(requested: PortalDataScope, scope: PortalDataScope): boolean {
  return requested === "all" || scope === "all" || requested === scope;
}
