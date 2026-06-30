import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { getPiiEncryptionKey } from "./config";

const ALGO = "aes-256-gcm";
const IV_LEN = 12;
const PREFIX = "enc:v1:";

export function encryptField(plaintext: string): string {
  if (!plaintext) return plaintext;
  const key = getPiiEncryptionKey();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64url")}:${tag.toString("base64url")}:${encrypted.toString("base64url")}`;
}

export function decryptField(value: string): string {
  if (!value || !value.startsWith(PREFIX)) return value;
  const key = getPiiEncryptionKey();
  const parts = value.slice(PREFIX.length).split(":");
  if (parts.length !== 3) return value;
  const [ivB64, tagB64, dataB64] = parts;
  const iv = Buffer.from(ivB64, "base64url");
  const tag = Buffer.from(tagB64, "base64url");
  const data = Buffer.from(dataB64, "base64url");
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

const PII_FIELDS = ["phone", "taxId", "street", "street2"] as const;

export function encryptPiiFields<T extends Record<string, unknown>>(obj: T): T {
  const out = { ...obj };
  for (const field of PII_FIELDS) {
    const val = out[field];
    if (typeof val === "string" && val && !val.startsWith(PREFIX)) {
      (out as Record<string, unknown>)[field] = encryptField(val);
    }
  }
  return out;
}

export function decryptPiiFields<T extends Record<string, unknown>>(obj: T): T {
  const out = { ...obj };
  for (const field of PII_FIELDS) {
    const val = out[field];
    if (typeof val === "string" && val.startsWith(PREFIX)) {
      (out as Record<string, unknown>)[field] = decryptField(val);
    }
  }
  return out;
}
