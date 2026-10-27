import fs from "fs";
import path from "path";
import {
  createHash,
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  scryptSync,
} from "crypto";

export type OdooConfig = {
  baseUrl: string;
  apiKey: string;
  db: string;
  /** Login for JSON-RPC authenticate (API key used as password). */
  user: string;
};

/** Strip /odoo or /web paths editors often paste from the browser login URL. */
export function normalizeOdooBaseUrl(raw: string): string {
  let u = raw.trim().replace(/\/+$/, "");
  u = u.replace(/\/(?:odoo|web)(?:\/.*)?$/i, "");
  return u.replace(/\/+$/, "");
}

export function getOdooConfig(): OdooConfig {
  // ODOO_BASE_URL is the portal module name; fall back to Aptus backend's ODOO_URL.
  return {
    baseUrl: normalizeOdooBaseUrl(process.env.ODOO_BASE_URL ?? process.env.ODOO_URL ?? ""),
    apiKey: (process.env.ODOO_API_KEY ?? "").trim(),
    db: (process.env.ODOO_DB ?? "").trim(),
    user: (process.env.ODOO_USER ?? "").trim(),
  };
}

export function getOdooSaleOrderLink(saleOrderId: number): string | null {
  const { baseUrl } = getOdooConfig();
  if (!baseUrl) return null;
  return `${baseUrl}/web#id=${saleOrderId}&model=sale.order&view_type=form`;
}

export function isOdooConfigured(): boolean {
  const { baseUrl, apiKey, db, user } = getOdooConfig();
  if (!baseUrl || !apiKey || !db || !user) return false;
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

/** Fixed OTP for local testing. Opt-in via OTP_USE_TEST_CODE=true (never in production). */
export function getTestOtpCode(): string {
  return process.env.OTP_TEST_CODE?.trim() || "0000";
}

export function isTestOtpEnabled(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return process.env.OTP_USE_TEST_CODE === "true";
}

export const ACCESS_TOKEN_MAX_AGE_SEC = Number(
  process.env.JWT_ACCESS_EXPIRES_SEC ?? 60 * 15,
); // 15 minutes
export const REFRESH_TOKEN_MAX_AGE_SEC = Number(
  process.env.JWT_REFRESH_EXPIRES_SEC ?? 60 * 60 * 24 * 7,
);

/** Refresh TTL when “Keep me signed in” is unchecked (still httpOnly cookie, shorter life). */
export const SESSION_REFRESH_MAX_AGE_SEC = Number(
  process.env.JWT_SESSION_REFRESH_EXPIRES_SEC ?? 60 * 60 * 12,
); // 12 hours

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

/** Normalize PEM pasted into Vercel (literal \n, wrapping quotes, CR). */
function normalizePemEnv(raw: string | undefined): string | null {
  if (!raw) return null;
  let value = raw.trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1).trim();
  }
  value = value.replace(/\\n/g, "\n").replace(/\r\n/g, "\n").trim();
  return value || null;
}

export function getJwtPrivateKey(): string {
  const fromEnv = normalizePemEnv(process.env.JWT_PRIVATE_KEY);
  if (fromEnv) {
    try {
      createPrivateKey(fromEnv);
    } catch {
      throw new Error(
        "JWT_PRIVATE_KEY is set but is not a valid PEM private key (check quotes/newlines; do not paste the public key)",
      );
    }
    return fromEnv;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_PRIVATE_KEY must be set in production");
  }
  return loadDevKeyPair().privateKey;
}

export function getJwtPublicKey(): string {
  const fromEnv = normalizePemEnv(process.env.JWT_PUBLIC_KEY);
  if (fromEnv) {
    try {
      createPublicKey(fromEnv);
    } catch {
      throw new Error(
        "JWT_PUBLIC_KEY is set but is not a valid PEM public key (check quotes/newlines)",
      );
    }
    return fromEnv;
  }
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

/** Software sales inbox for cart-add and portal purchase notifications. */
export function getOrderNotificationEmail(): string {
  return (
    process.env.ORDER_NOTIFICATION_EMAIL?.trim() ||
    process.env.SOFTWARE_SALES_EMAIL?.trim() ||
    process.env.BACKEND_TEAM_EMAIL?.trim() ||
    "it-sales@aptusinfotech.com"
  );
}

/**
 * Public portal origin for outbound email links (verify-email, orders, renewals).
 * Resolution order: PORTAL_BASE_URL → NEXT_PUBLIC_SITE_URL → VERCEL_URL → localhost (dev).
 * Do not default to aptusinfotech.com on Vercel — that domain may be parked until DNS is live.
 */
export function getPortalBaseUrl(): string {
  const explicit = process.env.PORTAL_BASE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (siteUrl) return siteUrl.replace(/\/$/, "");

  const vercelHost = process.env.VERCEL_URL?.trim();
  if (vercelHost) return `https://${vercelHost.replace(/\/$/, "")}`;

  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:3000";
  }

  return "https://aptusinfotech.com";
}

export function getStripeConfig(): { secretKey: string; webhookSecret: string } | null {
  const secretKey = process.env.STRIPE_SECRET_KEY ?? "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";
  if (!secretKey || secretKey.startsWith("sk_test_placeholder")) return null;
  return { secretKey, webhookSecret };
}
