import assert from "node:assert/strict";
import portfolioRows from "../data/product-portfolio.json";
import { isTranslatableCopy } from "./arabic-dom";
import { parseGtxPayload, protectsLatinName, splitSentinel } from "./translate-text";

assert.equal(
  parseGtxPayload([[["مرحبا\n", "Hi\n"], ["§§§\n", "§§§\n"], ["العالم", "World"]]]),
  "مرحبا\n§§§\nالعالم",
);
assert.deepEqual(splitSentinel("مرحبا\n§§§\nالعالم", 2), ["مرحبا", "العالم"]);
assert.equal(splitSentinel("only-one", 2), null);
assert.equal(isTranslatableCopy("Request a Quote"), true);
assert.equal(isTranslatableCopy("من نحن"), false);
assert.equal(isTranslatableCopy("info@aptusinfotech.com"), false);
assert.equal(isTranslatableCopy("EN"), false);
assert.equal(isTranslatableCopy("استكشف Autodesk"), false);
for (const row of portfolioRows) {
  assert.equal(protectsLatinName(row.brand), true, row.brand);
  assert.equal(protectsLatinName(row.product), true, row.product);
}
assert.equal(protectsLatinName("Engineering & Construction"), false);

console.log("translate-text.check: ok");
