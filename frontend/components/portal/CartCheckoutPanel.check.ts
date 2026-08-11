import assert from "node:assert/strict";
import { normalizePhone } from "./CartCheckoutPanel";

// Simple duplicate — the reported bug (autofill re-pastes the country code).
assert.equal(normalizePhone("+968+968 12345678"), "+968 12345678");
// No "+" separator on the second copy is indistinguishable from a real number
// that happens to start with those digits — left alone rather than guessed at.
assert.equal(normalizePhone("+96896812345678"), "+96896812345678");
// Whitespace around the duplicate is trimmed away, not preserved as a gap.
assert.equal(normalizePhone("+968 +968 12345678"), "+968 12345678");
// Triple duplicate (repeated paste) collapses fully in one call, not just once.
assert.equal(normalizePhone("+968+968+968 12345678"), "+968 12345678");
// Different country code — not hardcoded to +968.
assert.equal(normalizePhone("+91+91 9123456789"), "+91 9123456789");

// No duplicate — must be left alone, including numbers that happen to start
// with digits matching the country code (no second "+", so no false strip).
assert.equal(normalizePhone("+968 91234567"), "+968 91234567");
assert.equal(normalizePhone("+91 911234567"), "+91 911234567");

// No leading "+" — not a country-code prefix, pass through unchanged.
assert.equal(normalizePhone("968 12345678"), "968 12345678");

// Edge inputs.
assert.equal(normalizePhone(""), "");
assert.equal(normalizePhone("  +968  "), "+968");

console.log("CartCheckoutPanel.normalizePhone.check: ok");
