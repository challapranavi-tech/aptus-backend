import type { SessionClaims } from "./jwt";
import { DEFAULT_USER_ROLE, type UserRole } from "./config";

/** Emails allowed to access admin API routes (comma-separated ADMIN_EMAILS env). */
export function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS?.trim();
  if (!raw) return [];
  return raw.split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
}

export function isAdminClaims(claims: SessionClaims): boolean {
  const roles = claims.roles ?? [DEFAULT_USER_ROLE];
  if (roles.includes("admin" as UserRole)) return true;
  const adminEmails = getAdminEmails();
  return adminEmails.includes(claims.email.toLowerCase());
}
