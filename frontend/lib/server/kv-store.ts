import fs from "fs";
import path from "path";
import { logger } from "./logger";

const DATA_FILE = path.join(process.cwd(), ".data", "kv-store.json");

type FileStore = Record<string, { value: unknown; expiresAt: number | null }>;

function isUpstashConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() && process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
  );
}

/** True when a store shared across instances is available (as opposed to the dev file fallback). */
export function isSharedStoreConfigured(): boolean {
  return isUpstashConfigured();
}

function assertProductionBackend(): void {
  if (process.env.NODE_ENV === "production" && !isUpstashConfigured()) {
    throw new Error(
      "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required in production for OTP and rate limiting.",
    );
  }
}

type RedisPipeline = {
  incr: (key: string) => RedisPipeline;
  expire: (key: string, seconds: number) => RedisPipeline;
  get: (key: string) => RedisPipeline;
  exec: <T extends unknown[]>() => Promise<T>;
};

type RedisClient = {
  get: <T>(key: string) => Promise<T | null>;
  set: (
    key: string,
    value: unknown,
    opts?: { ex?: number; nx?: boolean },
  ) => Promise<"OK" | null | unknown>;
  del: (key: string) => Promise<unknown>;
  incr: (key: string) => Promise<number>;
  expire: (key: string, seconds: number) => Promise<unknown>;
  ttl: (key: string) => Promise<number>;
  pipeline: () => RedisPipeline;
};

let redisClient: RedisClient | null = null;

async function getRedis(): Promise<RedisClient> {
  if (redisClient) return redisClient;
  const { Redis } = await import("@upstash/redis");
  redisClient = Redis.fromEnv() as RedisClient;
  return redisClient;
}

function readFileStore(): FileStore {
  if (!fs.existsSync(DATA_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) as FileStore;
  } catch {
    return {};
  }
}

function writeFileStore(store: FileStore): void {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(store), "utf8");
}

function purgeExpiredFileEntries(store: FileStore): FileStore {
  const now = Date.now();
  const next: FileStore = {};
  for (const [key, entry] of Object.entries(store)) {
    if (entry.expiresAt == null || entry.expiresAt > now) {
      next[key] = entry;
    }
  }
  return next;
}

export async function kvGet<T>(key: string): Promise<T | null> {
  assertProductionBackend();
  if (isUpstashConfigured()) {
    return (await getRedis()).get<T>(key);
  }

  const store = purgeExpiredFileEntries(readFileStore());
  writeFileStore(store);
  const entry = store[key];
  if (!entry) return null;
  if (entry.expiresAt != null && entry.expiresAt <= Date.now()) {
    delete store[key];
    writeFileStore(store);
    return null;
  }
  return entry.value as T;
}

export async function kvSet(key: string, value: unknown, ttlSec?: number): Promise<void> {
  assertProductionBackend();
  if (isUpstashConfigured()) {
    await (await getRedis()).set(key, value, ttlSec ? { ex: ttlSec } : undefined);
    return;
  }

  const store = purgeExpiredFileEntries(readFileStore());
  store[key] = {
    value,
    expiresAt: ttlSec ? Date.now() + ttlSec * 1000 : null,
  };
  writeFileStore(store);
}

/** Set only if key is absent (or expired). Returns true when this caller won the claim. */
export async function kvSetNx(key: string, value: unknown, ttlSec?: number): Promise<boolean> {
  assertProductionBackend();
  if (isUpstashConfigured()) {
    const result = await (await getRedis()).set(key, value, {
      nx: true,
      ...(ttlSec ? { ex: ttlSec } : {}),
    });
    return result === "OK";
  }

  // ponytail: file KV is single-process; NX is atomic only within one Node instance.
  const store = purgeExpiredFileEntries(readFileStore());
  if (store[key]) return false;
  store[key] = {
    value,
    expiresAt: ttlSec ? Date.now() + ttlSec * 1000 : null,
  };
  writeFileStore(store);
  return true;
}

export async function kvDel(key: string): Promise<void> {
  assertProductionBackend();
  if (isUpstashConfigured()) {
    await (await getRedis()).del(key);
    return;
  }

  const store = readFileStore();
  delete store[key];
  writeFileStore(store);
}

export async function kvIncr(key: string, windowSec: number): Promise<number> {
  assertProductionBackend();
  if (isUpstashConfigured()) {
    const redis = await getRedis();
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, windowSec);
    }
    return count;
  }

  const store = purgeExpiredFileEntries(readFileStore());
  const now = Date.now();
  const entry = store[key];
  const current =
    entry && (entry.expiresAt == null || entry.expiresAt > now)
      ? (typeof entry.value === "number" ? entry.value : 0) + 1
      : 1;

  store[key] = {
    value: current,
    expiresAt: now + windowSec * 1000,
  };
  writeFileStore(store);
  return current;
}

function toCount(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

/**
 * Increments the current sliding-window bucket and reads the previous one in a
 * single round trip. Sliding-window rate limiting needs both counters, and on
 * Upstash every command is an HTTP request, so pipelining keeps the added
 * latency to one hop per rule.
 */
export async function kvIncrWindow(
  currentKey: string,
  previousKey: string,
  ttlSec: number,
): Promise<{ current: number; previous: number }> {
  assertProductionBackend();

  if (isUpstashConfigured()) {
    const redis = await getRedis();
    const [current, , previous] = await redis
      .pipeline()
      .incr(currentKey)
      .expire(currentKey, ttlSec)
      .get(previousKey)
      .exec<[number, unknown, unknown]>();
    return { current: toCount(current), previous: toCount(previous) };
  }

  const store = purgeExpiredFileEntries(readFileStore());
  const now = Date.now();
  const existing = store[currentKey];
  const current =
    existing && (existing.expiresAt == null || existing.expiresAt > now)
      ? toCount(existing.value) + 1
      : 1;

  store[currentKey] = { value: current, expiresAt: now + ttlSec * 1000 };

  const prevEntry = store[previousKey];
  const previous =
    prevEntry && (prevEntry.expiresAt == null || prevEntry.expiresAt > now)
      ? toCount(prevEntry.value)
      : 0;

  writeFileStore(store);
  return { current, previous };
}

export async function kvTtlSec(key: string): Promise<number> {
  assertProductionBackend();
  if (isUpstashConfigured()) {
    const ttl = await (await getRedis()).ttl(key);
    return ttl > 0 ? ttl : 0;
  }

  const store = readFileStore();
  const entry = store[key];
  if (!entry?.expiresAt) return 0;
  return Math.max(0, Math.ceil((entry.expiresAt - Date.now()) / 1000));
}

export function logKvBackendOnBoot(): void {
  if (process.env.NODE_ENV === "production") {
    if (!isUpstashConfigured()) {
      logger.error("Production requires Upstash Redis for OTP and rate limits");
    }
  }
}
