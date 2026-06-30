interface AptusPortalAuthApi {
  clearSession: () => void;
  getCurrentUser: () => Record<string, unknown> | null;
  getSession: () => Record<string, unknown> | null;
  logout: () => void;
  refreshPortal?: () => void | Promise<void>;
  refreshDashboardViews?: () => void;
  setSubscriptions?: (subscriptions: import("@/types/subscriptions").SubscriptionItem[]) => void;
}

interface Window {
  aptusPortalAuth?: AptusPortalAuthApi;
  __aptusPortalConfig?: Record<string, unknown>;
}
