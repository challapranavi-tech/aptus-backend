import { randomUUID } from "crypto";
import { kvGet, kvSet } from "./kv-store";
import { REFRESH_TOKEN_MAX_AGE_SEC } from "./config";

export type StoredRefreshToken = {
  jti: string;
  userId: string;
  familyId: string;
  expiresAt: string;
  revokedAt?: string;
  /** Set when this jti was rotated — used to ignore concurrent refresh races. */
  replacedBy?: string;
};

/** Grace window before treating a rotated token reuse as an attack. */
const ROTATION_GRACE_MS = 15_000;

function tokenKey(jti: string): string {
  return `aptus:refresh:${jti}`;
}

function familyKey(familyId: string): string {
  return `aptus:refresh-family:${familyId}`;
}

function userKey(userId: string): string {
  return `aptus:refresh-user:${userId}`;
}

function ttlFromExpiresAt(expiresAt: string): number {
  const remaining = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000);
  return Math.max(1, remaining);
}

async function addToIndex(key: string, jti: string, ttlSec: number): Promise<void> {
  const existing = (await kvGet<string[]>(key)) ?? [];
  if (!existing.includes(jti)) existing.push(jti);
  await kvSet(key, existing, ttlSec);
}

async function removeFromIndex(key: string, jti: string): Promise<void> {
  const existing = await kvGet<string[]>(key);
  if (!existing?.length) return;
  const next = existing.filter((id) => id !== jti);
  if (next.length === existing.length) return;
  await kvSet(key, next, REFRESH_TOKEN_MAX_AGE_SEC);
}

export async function registerRefreshToken(
  jti: string,
  userId: string,
  expiresAtSec: number,
  familyId?: string,
): Promise<StoredRefreshToken> {
  const record: StoredRefreshToken = {
    jti,
    userId,
    familyId: familyId ?? randomUUID(),
    expiresAt: new Date(expiresAtSec * 1000).toISOString(),
  };
  const ttl = ttlFromExpiresAt(record.expiresAt);
  await kvSet(tokenKey(jti), record, ttl);
  await addToIndex(familyKey(record.familyId), jti, ttl);
  await addToIndex(userKey(userId), jti, ttl);
  return record;
}

export async function getRefreshRecord(jti: string): Promise<StoredRefreshToken | null> {
  const record = await kvGet<StoredRefreshToken>(tokenKey(jti));
  if (!record) return null;
  if (record.revokedAt) return null;
  if (new Date(record.expiresAt).getTime() < Date.now()) return null;
  return record;
}

/** Rotate: revoke old jti, register new one in the same family. */
export async function rotateRefreshToken(
  oldJti: string,
  newJti: string,
  userId: string,
  expiresAtSec: number,
): Promise<StoredRefreshToken | "reuse_detected" | null> {
  const old = await kvGet<StoredRefreshToken>(tokenKey(oldJti));
  if (!old) return null;

  if (old.revokedAt) {
    const revokedMs = Date.now() - new Date(old.revokedAt).getTime();
    if (revokedMs < ROTATION_GRACE_MS) {
      return null;
    }
    await revokeRefreshFamily(old.familyId);
    return "reuse_detected";
  }

  old.revokedAt = new Date().toISOString();
  old.replacedBy = newJti;
  await kvSet(tokenKey(oldJti), old, ttlFromExpiresAt(old.expiresAt));

  return registerRefreshToken(newJti, userId, expiresAtSec, old.familyId);
}

export async function revokeRefreshFamily(familyId: string): Promise<void> {
  const jtis = (await kvGet<string[]>(familyKey(familyId))) ?? [];
  const now = new Date().toISOString();
  for (const jti of jtis) {
    const record = await kvGet<StoredRefreshToken>(tokenKey(jti));
    if (!record || record.revokedAt) continue;
    record.revokedAt = now;
    await kvSet(tokenKey(jti), record, ttlFromExpiresAt(record.expiresAt));
  }
}

export async function revokeAllUserRefreshTokens(userId: string): Promise<void> {
  const jtis = (await kvGet<string[]>(userKey(userId))) ?? [];
  const now = new Date().toISOString();
  for (const jti of jtis) {
    const record = await kvGet<StoredRefreshToken>(tokenKey(jti));
    if (!record || record.revokedAt) continue;
    record.revokedAt = now;
    await kvSet(tokenKey(jti), record, ttlFromExpiresAt(record.expiresAt));
  }
}
