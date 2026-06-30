import fs from "fs";
import path from "path";
import { generateKeyPairSync, createHash, scryptSync } from "crypto";

export type OdooConfig = {
  baseUrl: string;
  apiKey: string;
  db: string;
};

export function getOdooConfig(): OdooConfig {
  return {
    baseUrl: (process.env.ODOO_BASE_URL ?? "").replace(/\/$/, ""),
    apiKey: process.env.ODOO_API_KEY ?? "",
    db: process.env.ODOO_DB ?? "",
  };
}

export function isOdooConfigured(): boolean {
  const { baseUrl, apiKey, db } = getOdooConfig();
  if (!baseUrl || !apiKey || !db) return false;
  if (apiKey === "placeholder" || apiKey === "placeholder-replace-with-real-key") {
    return false;
  }
  return true;
}

export function isDemoMode(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  const configured = isOdooConfigured();
  if (!configured) return true;
  if (process.env.AUTH_DEMO_MODE === "true") return true;
  if (process.env.AUTH_DEMO_MODE === "false") return false;
  return false;
}

/** Fixed OTP for initial/testing when real email/SMS is not wired up. Set OTP_USE_TEST_CODE=false to disable. */
export function getTestOtpCode(): string {
  return process.env.OTP_TEST_CODE?.trim() || "0000";
}

export function isTestOtpEnabled(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return process.env.OTP_USE_TEST_CODE !== "false";
}

/** @deprecated Use RS256 key pair via getJwtPrivateKey/getJwtPublicKey */
export function getJwtSecret(): string {
  return process.env.JWT_SECRET ?? "dev-only-change-me-in-production";
}

export const ACCESS_TOKEN_MAX_AGE_SEC = Number(
  process.env.JWT_ACCESS_EXPIRES_SEC ?? 60 * 15,
); // 15 minutes
export const REFRESH_TOKEN_MAX_AGE_SEC = Number(
  process.env.JWT_REFRESH_EXPIRES_SEC ?? 60 * 60 * 24 * 7,
); // 7 days

export {
  REFRESH_COOKIE,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SEC,
  REFRESH_MAX_AGE_SEC,
} from "./cookie-names";

export type UserRole = "customer" | "admin";

export const DEFAULT_USER_ROLE: UserRole = "customer";

type KeyPair = { privateKey: string; publicKey: string };

let devKeyPair: KeyPair | null = null;

const DEV_KEY_FILE = path.join(process.cwd(), ".data", "jwt-dev-keys.json");

function loadDevKeyPair(): KeyPair {
  if (devKeyPair) return devKeyPair;

  try {
    if (fs.existsSync(DEV_KEY_FILE)) {
      const stored = JSON.parse(fs.readFileSync(DEV_KEY_FILE, "utf8")) as KeyPair;
      if (stored.privateKey && stored.publicKey) {
        devKeyPair = stored;
        return devKeyPair;
      }
    }
  } catch {
    /* regenerate below */
  }

  const { privateKey, publicKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  devKeyPair = { privateKey, publicKey };
  fs.mkdirSync(path.dirname(DEV_KEY_FILE), { recursive: true });
  fs.writeFileSync(DEV_KEY_FILE, JSON.stringify(devKeyPair, null, 2), "utf8");
  return devKeyPair;
}

export function getJwtPrivateKey(): string {
  const fromEnv = process.env.JWT_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_PRIVATE_KEY must be set in production");
  }
  return loadDevKeyPair().privateKey;
}

export function getJwtPublicKey(): string {
  const fromEnv = process.env.JWT_PUBLIC_KEY?.replace(/\\n/g, "\n");
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_PUBLIC_KEY must be set in production");
  }
  return loadDevKeyPair().publicKey;
}

export function getPiiEncryptionKey(): Buffer {
  const raw = process.env.PII_ENCRYPTION_KEY?.trim();
  if (raw) {
    const direct = Buffer.from(raw, "utf8");
    if (direct.length >= 32) {
      return direct.subarray(0, 32);
    }
    return scryptSync(raw, "aptus-pii-v1", 32);
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("PII_ENCRYPTION_KEY must be set in production (min 32 chars)");
  }
  return createHash("sha256").update("aptus-dev-pii-fallback-v1").digest();
}

/** Backend team inbox for new portal software orders (used in audit metadata; Odoo CRM lead is primary). */
export function getOrderNotificationEmail(): string {
  return (
    process.env.ORDER_NOTIFICATION_EMAIL?.trim() ||
    process.env.BACKEND_TEAM_EMAIL?.trim() ||
    "support@aptusinfotech.com"
  );
}

export function getStripeConfig(): { secretKey: string; webhookSecret: string } | null {
  const secretKey = process.env.STRIPE_SECRET_KEY ?? "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";
  if (!secretKey || secretKey.startsWith("sk_test_placeholder")) return null;
  return { secretKey, webhookSecret };
}
