import assert from "node:assert/strict";
import { cartSignature, mergePortalCarts, type PortalCartState } from "./portal-cart";

const line = (productName: string, quantity: number) => ({
  category: "CAD",
  productName,
  quantity,
});

const local: PortalCartState = {
  duration: "1year",
  items: [line("AutoCAD", 1)],
};
const remoteSame: PortalCartState = {
  duration: "1year",
  items: [line("AutoCAD", 1)],
};

const mergedSame = mergePortalCarts(local, remoteSame);
assert.equal(mergedSame.items.length, 1);
assert.equal(mergedSame.items[0].quantity, 1, "identical snapshots must not double");

const mergedMax = mergePortalCarts(
  { duration: "1year", items: [line("AutoCAD", 3)] },
  { duration: "1year", items: [line("AutoCAD", 1)] },
);
assert.equal(mergedMax.items[0].quantity, 3, "offline higher qty wins");

const mergedUnion = mergePortalCarts(
  { duration: "1year", items: [line("AutoCAD", 1)] },
  { duration: "3year", items: [line("Revit", 2)] },
);
assert.equal(mergedUnion.items.length, 2);
assert.equal(mergedUnion.duration, "3year");

const mergedDuration = mergePortalCarts(
  { duration: "1year", items: [{ ...line("AutoCAD", 1), duration: "3year" }] },
  { duration: "1year", items: [line("AutoCAD", 2)] },
);
assert.equal(mergedDuration.items[0].duration, "3year");

// A cart that merges to exactly the server's state must not trigger another PUT —
// that redundant write is what exhausted the cart rate limit and skipped the CRM sync.
assert.equal(
  cartSignature(mergedSame),
  cartSignature(remoteSame),
  "unchanged cart must produce an identical signature",
);
assert.equal(
  cartSignature({ duration: "1year", items: [line("AutoCAD", 1), line("Revit", 2)] }),
  cartSignature({ duration: "1year", items: [line("Revit", 2), line("AutoCAD", 1)] }),
  "item order must not affect the signature",
);
assert.notEqual(
  cartSignature({ duration: "1year", items: [line("AutoCAD", 1)] }),
  cartSignature({ duration: "1year", items: [line("AutoCAD", 2)] }),
  "quantity change must be detected",
);
assert.notEqual(
  cartSignature({ duration: "1year", items: [line("AutoCAD", 1)] }),
  cartSignature({
    duration: "1year",
    items: [{ ...line("AutoCAD", 1), purchaseType: "renew" as const }],
  }),
  "purchase type change must be detected",
);
assert.notEqual(
  cartSignature({ duration: "1year", items: [line("AutoCAD", 1)] }),
  cartSignature({ duration: "1year", items: [] }),
  "emptying the cart must be detected",
);

console.log("portal-cart.check: ok");
