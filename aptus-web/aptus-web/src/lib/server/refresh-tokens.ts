import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

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

const DATA_DIR = path.join(process.cwd(), ".data");
const REFRESH_FILE = path.join(DATA_DIR, "refresh-tokens.json");

type GlobalStore = typeof globalThis & {
  __aptusRefreshTokens?: Map<string, StoredRefreshToken>;
};

const globalStore = globalThis as GlobalStore;

function loadFromDisk(): Map<string, StoredRefreshToken> {
  try {
    if (!fs.existsSync(REFRESH_FILE)) return new Map();
    const raw = JSON.parse(fs.readFileSync(REFRESH_FILE, "utf8")) as Record<
      string,
      StoredRefreshToken
    >;
    return new Map(Object.entries(raw));
  } catch {
    return new Map();
  }
}

function saveToDisk(tokens: Map<string, StoredRefreshToken>): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(REFRESH_FILE, JSON.stringify(Object.fromEntries(tokens), null, 2), "utf8");
}

function getStore(): Map<string, StoredRefreshToken> {
  if (!globalStore.__aptusRefreshTokens) {
    globalStore.__aptusRefreshTokens = loadFromDisk();
  }
  return globalStore.__aptusRefreshTokens;
}

function persist(): void {
  saveToDisk(getStore());
}

export function registerRefreshToken(
  jti: string,
  userId: string,
  expiresAtSec: number,
  familyId?: string,
): StoredRefreshToken {
  const record: StoredRefreshToken = {
    jti,
    userId,
    familyId: familyId ?? randomUUID(),
    expiresAt: new Date(expiresAtSec * 1000).toISOString(),
  };
  const store = getStore();
  store.set(jti, record);
  persist();
  return record;
}

export function getRefreshRecord(jti: string): StoredRefreshToken | null {
  const record = getStore().get(jti);
  if (!record) return null;
  if (record.revokedAt) return null;
  if (new Date(record.expiresAt).getTime() < Date.now()) return null;
  return record;
}

/** Rotate: revoke old jti, register new one in the same family. */
export function rotateRefreshToken(
  oldJti: string,
  newJti: string,
  userId: string,
  expiresAtSec: number,
): StoredRefreshToken | "reuse_detected" | null {
  const store = getStore();
  const old = store.get(oldJti);
  if (!old) return null;

  if (old.revokedAt) {
    const revokedMs = Date.now() - new Date(old.revokedAt).getTime();
    if (revokedMs < ROTATION_GRACE_MS) {
      return null;
    }
    revokeRefreshFamily(old.familyId);
    return "reuse_detected";
  }

  old.revokedAt = new Date().toISOString();
  old.replacedBy = newJti;
  store.set(oldJti, old);

  const next = registerRefreshToken(newJti, userId, expiresAtSec, old.familyId);
  persist();
  return next;
}

export function revokeRefreshFamily(familyId: string): void {
  const store = getStore();
  let changed = false;
  for (const [jti, record] of store) {
    if (record.familyId === familyId && !record.revokedAt) {
      record.revokedAt = new Date().toISOString();
      store.set(jti, record);
      changed = true;
    }
  }
  if (changed) persist();
}

export function revokeAllUserRefreshTokens(userId: string): void {
  const store = getStore();
  let changed = false;
  for (const [jti, record] of store) {
    if (record.userId === userId && !record.revokedAt) {
      record.revokedAt = new Date().toISOString();
      store.set(jti, record);
      changed = true;
    }
  }
  if (changed) persist();
}
