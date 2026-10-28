import assert from "node:assert/strict";
import { DEFAULT_NEXT_PATH, safeNextPath } from "./safe-next-path";

assert.equal(safeNextPath(""), DEFAULT_NEXT_PATH);
assert.equal(safeNextPath("?next=%2Fportal%2Fproducts%23cart"), "/portal/products#cart");
assert.equal(safeNextPath("?next=%2Fportal%2Frenewals"), "/portal/renewals");

// Open-redirect attempts fall back to the portal.
assert.equal(safeNextPath("?next=https%3A%2F%2Fevil.example"), DEFAULT_NEXT_PATH);
assert.equal(safeNextPath("?next=%2F%2Fevil.example"), DEFAULT_NEXT_PATH);
assert.equal(safeNextPath("?next=%2F%5Cevil.example"), DEFAULT_NEXT_PATH);
assert.equal(safeNextPath("?next=portal%2Fproducts"), DEFAULT_NEXT_PATH);

console.log("safe-next-path.check: ok");
