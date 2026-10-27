import type { NextConfig } from "next";

const odooImageHost =
  process.env.ODOO_IMAGE_HOST ??
  (process.env.ODOO_URL ? new URL(process.env.ODOO_URL).hostname : undefined);

const nextConfig: NextConfig = {
  // security: keep production bundles free of source maps that aid reverse-engineering.
  productionBrowserSourceMaps: false,
  serverExternalPackages: ["gsap", "nodemailer"],
  async redirects() {
    return [
      { source: "/about-us", destination: "/our-story", permanent: true },
      { source: "/software", destination: "/software-solutions", permanent: true },
      {
        source: "/computers-structures-inc",
        destination: "/computers-structures",
        permanent: true,
      },
      {
        source: "/aptus-case-studies",
        destination: "/customer-stories",
        permanent: true,
      },
      {
        source: "/aptus-solar",
        destination: "https://www.aptussolartech.com/",
        permanent: false,
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
