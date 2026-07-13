import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // API-only backend — no public pages.
  // security: never ship browser source maps that could reveal server modules.
  productionBrowserSourceMaps: false,
  // ponytail: loadLocalPageSectionsJson uses dynamic fs paths — include them in the lambda
  outputFileTracingIncludes: {
    "/*": ["./content/odoo-json/**/*"],
  },
};

export default nextConfig;
