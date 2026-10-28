/**
 * Runnable self-check for object-access helpers.
 * Run: npx --yes tsx shared/lib/object-access.check.ts
 */
import assert from "node:assert/strict";
import { isOdooPagePublished } from "./object-access";

assert.equal(isOdooPagePublished({ is_published: true }), true);
assert.equal(isOdooPagePublished({ website_published: true }), true);
assert.equal(isOdooPagePublished({ is_published: false, website_published: false }), false);
assert.equal(isOdooPagePublished({}), false);

console.log("object-access.check: ok");
