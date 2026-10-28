import { kvGet, kvSet } from "./kv-store";

type RevokedEntry = { jti: string; revokedAt: number; expiresAt: number };

type GlobalStore = typeof globalThis & {
  __aptusTokenBlocklist?: Map<string, RevokedEntry>;
};

const globalStore = globalThis as GlobalStore;

function getBlocklist(): Map<string, RevokedEntry> {
  if (!globalStore.__aptusTokenBlocklist) {
    globalStore.__aptusTokenBlocklist = new Map();
  }
  return globalStore.__aptusTokenBlocklist;
}

function blockKey(jti: string): string {
  return `aptus:access-revoked:${jti}`;
}

function purgeExpired(): void {
  const now = Math.floor(Date.now() / 1000);
  const list = getBlocklist();
  for (const [jti, entry] of list) {
    if (entry.expiresAt <= now) {
      list.delete(jti);
    }
  }
}

/**
 * Revokes an access-token jti until expiresAtSec.
 * Writes local Map (same-instance fast path) + KV (cross-instance).
 */
export async function revokeToken(jti: string, expiresAtSec: number): Promise<void> {
  purgeExpired();
  const now = Math.floor(Date.now() / 1000);
  const entry: RevokedEntry = { jti, revokedAt: now, expiresAt: expiresAtSec };
  getBlocklist().set(jti, entry);

  const ttlSec = Math.max(1, expiresAtSec - now);
  await kvSet(blockKey(jti), entry, ttlSec);
}

export async function isTokenRevoked(jti: string): Promise<boolean> {
  purgeExpired();
  if (getBlocklist().has(jti)) return true;

  const entry = await kvGet<RevokedEntry>(blockKey(jti));
  if (!entry) return false;

  // Warm local cache for subsequent checks on this instance.
  getBlocklist().set(jti, entry);
  return true;
}
