/**
 * Runnable self-check for resume → field hint extraction.
 * Run: npx --yes tsx shared/lib/resume-parse.check.ts
 */
import assert from "node:assert/strict";
import { extractResumeHints } from "./resume-parse";

// Basic contact extraction from a realistic resume header.
const h1 = extractResumeHints(
  [
    "Anagha R",
    "anagha.r@example.com | +91 98765 43210",
    "Summary: Senior engineer with 7+ years of experience in web platforms.",
    "Education",
    "B.Tech in Computer Science, ABC Institute of Technology, 2016",
  ].join("\n"),
);
assert.equal(h1.fullName, "Anagha R", "name from first line");
assert.equal(h1.email, "anagha.r@example.com", "email extracted");
assert.ok(h1.phone && h1.phone.replace(/\D/g, "").length >= 8, "phone extracted");
assert.equal(h1.experienceYears, "7", "experience '7+ years' extracted");
assert.ok(h1.education?.length, "at least one degree extracted");
assert.match(h1.education![0].name, /B\.?Tech/i, "degree name captured");
assert.equal(h1.education![0].year, "2016", "degree year captured");

// Alternate experience phrasing: "Experience: 5 years".
const h2 = extractResumeHints("Total Experience: 5 years across two firms.");
assert.equal(h2.experienceYears, "5", "experience 'Experience: 5 years' extracted");

// Graceful on empty / junk input.
const h3 = extractResumeHints("");
assert.equal(h3.autoFilledKeys.length, 0, "no hints from empty text");

console.log("resume-parse self-check passed");
