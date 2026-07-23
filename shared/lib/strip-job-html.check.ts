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

// Odoo Recruitment Description style: section title + bullets must not flatten.
const odooPlain =
  "We are looking for a Software Programmer to design scalable solutions.\n" +
  "Key Responsibilities\n" +
  "• Design, develop, test, and maintain web applications.\n" +
  "• Write clean, efficient, reusable code.\n" +
  "Required Skills & Qualifications\n" +
  "• Bachelor's degree in Computer Science.\n" +
  "• Experience with React or Next.js.";
const structured = stripJobHtml(odooPlain);
assert.ok(
  structured.includes("\nKey Responsibilities\n• Design"),
  "keeps section title above first bullet",
);
assert.match(
  structured,
  /• Design, develop, test, and maintain web applications\.\n• Write clean/,
  "keeps consecutive bullets on separate lines",
);
assert.ok(!/\n{2,}/.test(structured), "structured text still has no blank-line gaps");
assert.ok(
  !structured.includes("solutions. Key Responsibilities • Design"),
  "does not collapse into a single congested line",
);

console.log("stripJobHtml self-check passed");
