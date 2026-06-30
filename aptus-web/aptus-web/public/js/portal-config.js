/** Next.js routes for the Aptus customer portal */
window.__aptusPortalConfig = {
  useApiAuth: true,
  loginUrl: "/login",
  registerUrl: "/register",
  dashboardUrl: "/portal/dashboard",
  htmlExtension: "",
  routes: {
    dashboard: "/portal/dashboard",
    purchases: "/portal/purchases",
    subscriptions: "/portal/subscriptions",
    renewals: "/portal/renewals",
    notifications: "/portal/notifications",
    profile: "/portal/profile",
  },
  protectedPaths: [
    "/portal/dashboard",
    "/portal/purchases",
    "/portal/subscriptions",
    "/portal/renewals",
    "/portal/notifications",
    "/portal/profile",
  ],
};
