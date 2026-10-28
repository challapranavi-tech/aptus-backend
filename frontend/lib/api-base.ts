/** Browser-reachable backend API base (client components only).
 *
 * security: only public URL config belongs in NEXT_PUBLIC_*.
 * Odoo API keys, SMTP, and revalidate tokens must stay server-only and are
 * consumed exclusively by backend routes / frontend Route Handlers.
 */
export function publicApiBase(): string {
  const base =
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_APTUS_API_URL ??
    "http://localhost:3001";
  return base.replace(/\/$/, "");
}