/**
 * Runnable self-check for secureCompare.
 * Run: npx --yes tsx shared/lib/secure-compare.check.ts
 */
import assert from "node:assert/strict";
import { hasSecret, secureCompare } from "./secure-compare";

assert.equal(secureCompare("same", "same"), true);
assert.equal(secureCompare("a", "b"), false);
assert.equal(secureCompare("short", "much-longer-secret"), false);

const prev = process.env.APTUS_TEST_SECRET;
delete process.env.APTUS_TEST_SECRET;
assert.equal(hasSecret("APTUS_TEST_SECRET"), false);
process.env.APTUS_TEST_SECRET = "x";
assert.equal(hasSecret("APTUS_TEST_SECRET"), true);
if (prev === undefined) delete process.env.APTUS_TEST_SECRET;
else process.env.APTUS_TEST_SECRET = prev;

console.log("secure-compare.check: ok");
