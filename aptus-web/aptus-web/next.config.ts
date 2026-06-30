import type { NextConfig } from "next";

const odooBaseUrl = process.env.ODOO_BASE_URL?.replace(/\/$/, "") ?? "";
const odooConnectSrc = odooBaseUrl ? ` ${odooBaseUrl}` : "";

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(self)",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://api.stripe.com" + odooConnectSrc,
      "frame-src 'self' https://www.google.com https://maps.google.com https://js.stripe.com https://hooks.stripe.com",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.etap.com",
        pathname: "/content-etap-prod/**",
      },
      {
        protocol: "https",
        hostname: "aptusinfotech.com",
        pathname: "/wp-content/uploads/**",
      },
      {
        protocol: "https",
        hostname: "*.odoo.com",
        pathname: "/web/**",
      },
      {
        protocol: "https",
        hostname: "*.dev.odoo.com",
        pathname: "/web/**",
      },
      ...(odooBaseUrl
        ? [
            {
              protocol: (odooBaseUrl.startsWith("https") ? "https" : "http") as "http" | "https",
              hostname: new URL(odooBaseUrl).hostname,
              pathname: "/**",
            },
          ]
        : []),
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/etap",
        destination: "/etap_new",
        permanent: false,
      },
      {
        source: "/software-solutions",
        destination: "/software",
        permanent: true,
      },
      {
        source: "/software-solutions/:path*",
        destination: "/software",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
