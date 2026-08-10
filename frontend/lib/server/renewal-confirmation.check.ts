import assert from "node:assert/strict";
import {
  daysUntilExpiry,
  reminderDayDue,
  RENEWAL_REMINDER_DAYS,
} from "./renewal-confirmation";

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

console.log("renewal-confirmation.check: ok");
