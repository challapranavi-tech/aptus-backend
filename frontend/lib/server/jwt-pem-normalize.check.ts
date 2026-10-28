import assert from "assert";
import { createPrivateKey, generateKeyPairSync } from "crypto";

/** Mirrors frontend/lib/server/config.ts normalizePemEnv — keep in sync. */
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

const { privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

const escaped = privateKey.replace(/\n/g, "\\n");
const fromQuotedEscaped = normalizePemEnv(`"${escaped}"`);
assert.ok(fromQuotedEscaped?.includes("BEGIN PRIVATE KEY"));
createPrivateKey(fromQuotedEscaped!);

const fromQuotedMultiline = normalizePemEnv(`"${privateKey.trim()}"`);
assert.ok(fromQuotedMultiline?.startsWith("-----BEGIN"));
createPrivateKey(fromQuotedMultiline!);

assert.equal(normalizePemEnv(undefined), null);
console.log("jwt_pem_normalize_ok");
