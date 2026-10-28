import assert from "node:assert/strict";
import { normalizePhone, toE164, toLocalPhoneDigits } from "./phone";

// Free-text: literal duplicate "+" prefixes (checkout / payment modal bug).
assert.equal(normalizePhone("+968+96899999994"), "+96899999994");
assert.equal(normalizePhone("+968+968 12345678"), "+968 12345678");
assert.equal(normalizePhone("+968 +968 12345678"), "+968 12345678");
assert.equal(normalizePhone("+968+968+968 12345678"), "+968 12345678");
assert.equal(normalizePhone("+91+91 9123456789"), "+91 9123456789");
assert.equal(normalizePhone("+968 91234567"), "+968 91234567");
assert.equal(normalizePhone(""), "");
assert.equal(normalizePhone("  +968  "), "+968");

// Without a second "+", leave digit-leading locals alone (India 91… false positive).
assert.equal(normalizePhone("+96896812345678"), "+96896812345678");
assert.equal(normalizePhone("968 12345678"), "968 12345678");

// Dropdown local field: strip accidental dial code when longer than expected local length.
assert.equal(toLocalPhoneDigits("96891234567", "+968", 8), "91234567");
assert.equal(toLocalPhoneDigits("+96891234567", "+968", 8), "91234567");
assert.equal(toLocalPhoneDigits("91234567", "+968", 8), "91234567");
assert.equal(toLocalPhoneDigits("+968+96891234567", "+968", 8), "91234567");
// India: valid local starting with 91 must not strip when length matches.
assert.equal(toLocalPhoneDigits("9123456789", "+91", 10), "9123456789");
assert.equal(toLocalPhoneDigits("919123456789", "+91", 10), "9123456789");

// Compose E.164 — one country code only.
assert.equal(toE164("+968", "96891234567", 8), "+96891234567");
assert.equal(toE164("+968", "+96891234567", 8), "+96891234567");
assert.equal(toE164("+968", "91234567", 8), "+96891234567");
assert.equal(toE164("+91", "9123456789", 10), "+919123456789");

console.log("phone.check: ok");
