import assert from "node:assert/strict";
import {
  daysUntilExpiry,
  reminderDayDue,
  RENEWAL_REMINDER_DAYS,
  subscriptionDedupeKey,
} from "./renewal-confirmation";
import type { SubscriptionItem } from "@/types/subscriptions";

assert.deepEqual([...RENEWAL_REMINDER_DAYS], [90, 60, 30, 15, 7, 3, 1]);

// Exact-day only: 1 day left must not fire the 90/60/… catch-up cascade
assert.equal(reminderDayDue(1, new Set()), 1);
assert.equal(reminderDayDue(1, new Set([1])), null);
assert.equal(reminderDayDue(7, new Set()), 7);
assert.equal(reminderDayDue(8, new Set()), null, "between schedule slots → no send");
assert.equal(reminderDayDue(0, new Set()), null, "expiry day itself → no renewal reminder");
assert.equal(reminderDayDue(90, new Set([90])), null);

// After one interval is marked sent, same daysLeft must not pick another bucket
assert.equal(reminderDayDue(1, new Set([90, 60, 30, 15, 7, 3])), 1);
assert.equal(reminderDayDue(1, new Set([90, 60, 30, 15, 7, 3, 1])), null);

const noonOn = (isoDate: string) => new Date(`${isoDate}T12:00:00`).getTime();
assert.equal(daysUntilExpiry("2026-08-07", noonOn("2026-08-06")), 1);
assert.equal(daysUntilExpiry("2026-08-06", noonOn("2026-08-06")), 0);
assert.equal(daysUntilExpiry("2026-11-04", noonOn("2026-08-06")), 90);
assert.equal(daysUntilExpiry("bad", noonOn("2026-08-06")), null);

// Dedupe key must not change when renewalDateIso is corrected in Odoo
const sub: SubscriptionItem = {
  productName: "Kaspersky",
  purchaseDate: "1 Jan 2026",
  renewalDate: "1 Jan 2027",
  renewalDateIso: "2026-01-01",
  status: "Active",
  licenseStatus: "Issued",
  licenseKey: "KEY",
  lineId: 42,
  orderId: 99,
};
assert.equal(subscriptionDedupeKey(sub), "line-42");
assert.equal(
  subscriptionDedupeKey({ ...sub, renewalDateIso: "2027-01-01" }),
  "line-42",
  "end_date correction must not reset sent flags",
);

// Source must claim before sending expired email (not only record after)
import fs from "fs";
import path from "path";
const renewalSource = fs.readFileSync(path.join(__dirname, "renewal-confirmation.ts"), "utf8");
assert.match(renewalSource, /licenseExpiredClaimKey/);
assert.match(renewalSource, /kvSetNx\(claimKey/);
assert.match(renewalSource, /processAllSubscriptionReminders/);
assert.match(renewalSource, /licenseExpiredInternalClaimKey/);

console.log("renewal-confirmation.check: ok");
