import type { NextConfig } from "next";

const ODOO_HOSTNAME = process.env.ODOO_URL
  ? new URL(process.env.ODOO_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/about-us", destination: "/our-story", permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      // Odoo staging & production — images served from /web/image
      ...(ODOO_HOSTNAME
        ? [
            {
              protocol: "https" as const,
              hostname: ODOO_HOSTNAME,
              pathname: "/web/image/**",
            },
            {
              protocol: "https" as const,
              hostname: ODOO_HOSTNAME,
              pathname: "/web/content/**",
            },
          ]
        : []),
      // Aptus Infotech production site — WordPress media library
      {
        protocol: "https" as const,
        hostname: "aptusinfotech.com",
        pathname: "/wp-content/uploads/**",
      },
      // Fallback wildcard for development
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
