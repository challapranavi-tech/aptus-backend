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

function purgeExpired(): void {
  const now = Math.floor(Date.now() / 1000);
  const list = getBlocklist();
  for (const [jti, entry] of list) {
    if (entry.expiresAt <= now) {
      list.delete(jti);
    }
  }
}

export function revokeToken(jti: string, expiresAtSec: number): void {
  purgeExpired();
  getBlocklist().set(jti, {
    jti,
    revokedAt: Math.floor(Date.now() / 1000),
    expiresAt: expiresAtSec,
  });
}

export function isTokenRevoked(jti: string): boolean {
  purgeExpired();
  return getBlocklist().has(jti);
}
