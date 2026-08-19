import assert from "node:assert/strict";
import { cartLeadName, productOrderLeadName } from "./odoo/leads";
import { pickStageIdByHints } from "./odoo/partner-context";
import {
  formatCartAddedSalesEmail,
  formatOrderNotificationEmail,
  formatPurchaseRequestSubmittedEmail,
} from "./order-notification";
import type { ClientProfile } from "./types";

assert.equal(cartLeadName(["AutoCAD", "Revit"]), "Added to Cart: AutoCAD, Revit");
assert.equal(
  productOrderLeadName(["AutoCAD", "Revit", "Civil 3D", "Maya"]),
  "Portal software order: AutoCAD, Revit, Civil 3D +1 more",
);

// Stage routing: purchase submit → Portal Purchase; never Won.
const openStages = [
  { id: 1, name: "New" },
  { id: 2, name: "Added to Cart" },
  { id: 3, name: "Portal Purchase" },
  { id: 4, name: "Payment Confirmation" },
  { id: 5, name: "License Issued" },
  { id: 6, name: "Portal Software Order" },
];
assert.equal(pickStageIdByHints(openStages, ["portal purchase", "portal software order"]), 3);
assert.equal(pickStageIdByHints(openStages, ["payment confirmation"]), 4);
assert.equal(pickStageIdByHints(openStages, ["license issued"]), 5);
assert.equal(pickStageIdByHints(openStages, ["added to cart"]), 2);
assert.equal(pickStageIdByHints(openStages, ["nonexistent stage"]), null);
assert.equal(pickStageIdByHints([{ id: 9, name: "New" }], ["portal purchase"]), null);
// Legacy pipeline name still resolves when Portal Purchase is absent.
assert.equal(
  pickStageIdByHints(
    [
      { id: 1, name: "New" },
      { id: 6, name: "Portal Software Order" },
    ],
    ["portal purchase", "portal software order"],
  ),
  6,
);

const cartMail = formatCartAddedSalesEmail({
  customer: {
    name: "Ada Lovelace",
    company: "Analytical Engines LLC",
    email: "ada@example.com",
    phone: "+96800000000",
    location: "Muscat",
  },
  duration: "1year",
  items: [
    {
      category: "CAD",
      productName: "AutoCAD",
      quantity: 2,
      duration: "3year",
      purchaseType: "renew",
    },
  ],
  linePrices: [{ productName: "AutoCAD", unitPrice: 100, lineTotal: 200 }],
  estimatedTotal: 231,
  addedAt: "Wed, 05 Aug 2026 13:00:00 GMT",
});

assert.match(cartMail.subject, /Abandoned Cart Lead/i);
assert.match(cartMail.body, /has not completed the purchase/i);
assert.match(cartMail.body, /AutoCAD/);
assert.match(cartMail.body, /× 2/);
assert.match(cartMail.body, /3 Years/);
assert.match(cartMail.body, /Renew/);
assert.match(cartMail.body, /Ada Lovelace/);
assert.match(cartMail.body, /Analytical Engines LLC/);

const profile: ClientProfile = {
  id: "p1",
  email: "ada@example.com",
  name: "Ada Lovelace",
  initials: "AL",
  role: "Customer",
  company: "Analytical Engines LLC",
  phone: "+96800000000",
  location: "Muscat",
  accountManager: "",
  supportTier: "",
  customerSince: "",
  billingCycle: "",
  paymentTerms: "",
  partnerId: 1,
};

const orderMail = formatOrderNotificationEmail(
  profile,
  {
    duration: "1year",
    items: [
      {
        category: "CAD",
        productName: "AutoCAD",
        quantity: 1,
        duration: "1year",
        purchaseType: "new",
      },
    ],
    contact: {
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      company: profile.company,
    },
  },
  "SO-99",
);

assert.match(orderMail.subject, /Verify Customer Payment/i);
assert.match(orderMail.body, /awaiting payment verification/i);
assert.match(orderMail.body, /SO-99/);
assert.match(orderMail.body, /AutoCAD/);
assert.match(orderMail.body, /Annual/);
assert.match(orderMail.body, /New Purchase/);
assert.match(orderMail.body, /C1RK1-WW1762-L158/);

const customerMail = formatPurchaseRequestSubmittedEmail({
  customerName: "Ada Lovelace",
  reference: "SO-99",
  products: ["AutoCAD"],
  duration: "1year",
  portalUrl: "https://example.com",
  bankTransferReference: "APT-20260803-0001",
  totalAmount: "OMR 100",
});
assert.match(customerMail.subject, /Order Has Been Received/i);
assert.match(customerMail.body, /verify your payment/i);
assert.match(customerMail.body, /2–3 business days/);

console.log("cart-crm.check.ts OK");
