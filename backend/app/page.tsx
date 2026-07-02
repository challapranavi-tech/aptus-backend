import Link from "next/link";

const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3000";

/** API-only app — root explains where the website lives (not a 404 trap). */
export default function BackendHome() {
  return (
    <main
      style={{
        fontFamily: "system-ui, sans-serif",
        maxWidth: 640,
        margin: "4rem auto",
        padding: "0 1.5rem",
        lineHeight: 1.6,
      }}
    >
      <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>Aptus Backend API</h1>
      <p>
        Odoo CMS and webhooks run here. The marketing site is on the{" "}
        <Link href={FRONTEND_URL} style={{ color: "#1352A3" }}>
          frontend ({FRONTEND_URL.replace(/^https?:\/\//, "")})
        </Link>
        .
      </p>
      <ul style={{ marginTop: "1.5rem" }}>
        <li>
          <Link href="/api/health">/api/health</Link>
        </li>
        <li>
          <Link href="/api/cms/site-config">/api/cms/site-config</Link>
        </li>
        <li>
          <Link href="/api/cms/home">/api/cms/home</Link>
        </li>
      </ul>
    </main>
  );
}
