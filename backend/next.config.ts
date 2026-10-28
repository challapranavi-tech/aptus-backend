import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // API-only backend — no public pages.
  // security: never ship browser source maps that could reveal server modules.
  productionBrowserSourceMaps: false,
  // unpdf bundles a serverless pdf.js build — keep it external so webpack
  // doesn't try to transform it (breaks on worker/DOM globals).
  serverExternalPackages: ["unpdf"],
  // ponytail: loadLocalPageSectionsJson uses dynamic fs paths — include them in the lambda
  outputFileTracingIncludes: {
    "/*": ["./content/odoo-json/**/*"],
  },
};

export default nextConfig;
