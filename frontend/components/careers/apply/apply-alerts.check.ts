/**
 * Runnable self-check for careers apply alert copy.
 * Run: npx --yes tsx frontend/components/careers/apply/apply-alerts.check.ts
 */
import assert from "node:assert/strict";
import {
  APPLY_STEP_ERROR_HEADING,
  formatApplySubmitErrors,
} from "./apply-alerts";

assert.ok(
  !/please fix/i.test(APPLY_STEP_ERROR_HEADING),
  "step banner must not say Please fix",
);

assert.equal(
  formatApplySubmitErrors(["Relieving letter has an unsupported file type."]),
  "Some details need your attention: Relieving letter has an unsupported file type.",
);

assert.equal(
  formatApplySubmitErrors(
    ["A", "B", "C", "D"],
    "Your files exceed the limit.",
  ),
  "Your files exceed the limit. A · B · C · (+1 more)",
);

assert.equal(formatApplySubmitErrors([], "Only form"), "Only form");
assert.ok(
  !/please fix/i.test(formatApplySubmitErrors(["x"])),
  "submit banner must not say Please fix",
);

console.log("apply-alerts self-check passed");
