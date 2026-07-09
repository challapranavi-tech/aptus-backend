/** Browser-reachable backend API base (client components only). */
export function publicApiBase(): string {
  const base =
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_APTUS_API_URL ??
    "http://localhost:3001";
  return base.replace(/\/$/, "");
}
