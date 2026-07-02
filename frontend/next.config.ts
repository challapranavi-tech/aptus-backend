import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));

const odooImageHost =
  process.env.ODOO_IMAGE_HOST ??
  (process.env.ODOO_URL ? new URL(process.env.ODOO_URL).hostname : undefined);

const nextConfig: NextConfig = {
  // Required for npm-workspace monorepo: trace files in ../shared and repo root.
  outputFileTracingRoot: path.join(dir, ".."),
  async redirects() {
    return [
      { source: "/about-us", destination: "/our-story", permanent: true },
      { source: "/software", destination: "/software-solutions", permanent: true },
      {
        source: "/computers-structures-inc",
        destination: "/computers-structures",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      ...(odooImageHost
        ? [
            {
              protocol: "https" as const,
              hostname: odooImageHost,
              pathname: "/web/image/**",
            },
            {
              protocol: "https" as const,
              hostname: odooImageHost,
              pathname: "/web/content/**",
            },
          ]
        : []),
      {
        protocol: "https" as const,
        hostname: "aptusinfotech.com",
        pathname: "/wp-content/uploads/**",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
