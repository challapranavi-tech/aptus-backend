/**
 * Runnable self-check for Odoo job HTML → plain text.
 * Run: npx --yes tsx shared/lib/strip-job-html.check.ts
 */
import assert from "node:assert/strict";
import { stripJobHtml } from "./strip-job-html";

const messy = `
<p>
                        JOB SUMMARY
</p>
<p>&nbsp;</p>
<p>
                        As an employee of our company, you will collaborate with each department
                        to create and deploy disruptive products.
</p>
<p></p>
<p>
                        Education
</p>
<ul><li>  B.Tech  </li><li>MCA</li></ul>
`;

const text = stripJobHtml(messy);
assert.ok(text.includes("JOB SUMMARY"), "keeps headings");
assert.ok(text.includes("Education"), "keeps later sections");
assert.ok(
  text.includes("collaborate with each department to create"),
  "joins soft-wrapped lines",
);
assert.ok(text.includes("B.Tech"), "keeps list text");
assert.ok(text.includes("MCA"), "keeps second list item");
assert.match(text, /• B\.Tech\n• MCA/, "list items stay on separate lines");
assert.ok(!/^\s+$/m.test(text), "no whitespace-only non-empty lines");
assert.ok(!/\n{2,}/.test(text), "no blank lines remain");

// Already-plain bloated API text (stale backend) must still collapse.
const bloatedPlain = "Lead role.\n\n\n                        Next line\n\nEnd.";
const plain = stripJobHtml(bloatedPlain);
assert.ok(!/\n{2,}/.test(plain), "plain bloated text collapses blank lines");
assert.ok(!/ {2,}/.test(plain), "plain bloated text collapses indent runs");

console.log("stripJobHtml self-check passed");
