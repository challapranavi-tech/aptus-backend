/**
 * Runnable self-check for career-jobs filter helpers.
 * Run: npx --yes tsx shared/lib/career-jobs.check.ts
 */
import assert from "node:assert/strict";
import {
  filterJobs,
  highlightKeyResponsibilitiesHtml,
  normalizeCareerJob,
  pickHrJobDescriptionHtml,
  plainJobDescriptionToHtml,
  slugifyJobTitle,
  splitKeyResponsibilities,
  type CareerJob,
} from "./career-jobs";

const jobs: CareerJob[] = [
  {
    id: "1",
    slug: "eng-1",
    title: "Software Engineer",
    department: "Engineering",
    location: "Muscat",
    jobType: "Full-time",
    description: "Build products",
    responsibilities: [],
    requirements: [],
  },
  {
    id: "2",
    slug: "hr-2",
    title: "HR Specialist",
    department: "People",
    location: "Dubai",
    jobType: "Full-time",
    description: "People ops",
    responsibilities: [],
    requirements: [],
  },
  {
    id: "3",
    slug: "eng-3",
    title: "Senior Engineer",
    department: "Engineering",
    location: "Muscat",
    jobType: "Full-time",
    description: "Lead delivery",
    responsibilities: [],
    requirements: [],
  },
];

const page1 = filterJobs(jobs, { department: "Engineering", pageSize: 1, page: 1 });
assert.equal(page1.total, 2);
assert.equal(page1.jobs.length, 1);
assert.equal(page1.jobs[0].title, "Software Engineer");

const page2 = filterJobs(jobs, { department: "Engineering", pageSize: 1, page: 2 });
assert.equal(page2.jobs[0].title, "Senior Engineer");

const search = filterJobs(jobs, { q: "dubai" });
assert.equal(search.total, 1);
assert.equal(search.jobs[0].department, "People");

const empty = filterJobs(jobs, { q: "zzz-no-match" });
assert.equal(empty.total, 0);

assert.equal(slugifyJobTitle("Software Engineer!", 9), "software-engineer-9");

const bloated = normalizeCareerJob({
  ...jobs[0],
  description: "Lead role.\n\n\n                        Next line\n\nEnd.",
});
assert.ok(!/\n{2,}/.test(bloated.description), "normalizeCareerJob collapses blank lines");

const real =
  "We are looking for a Software Programmer to design, develop, test, and maintain high-quality software applications.";
const demo =
  "Valid work permit for Belgium. Lead the entire sales cycle. Google Adwords experience.";
assert.equal(
  pickHrJobDescriptionHtml(demo, real),
  real,
  "Recruitment description wins over website demo HTML",
);
assert.equal(
  pickHrJobDescriptionHtml(demo, ""),
  demo,
  "website used when internal description empty",
);
assert.equal(pickHrJobDescriptionHtml(false, false), "");

const htmlJob = normalizeCareerJob({
  ...jobs[0],
  description: "<p>Build <strong>products</strong></p><script>x()</script>",
  descriptionHtml: "<p>Build <strong>products</strong></p><script>x()</script>",
});
assert.ok(htmlJob.descriptionHtml?.includes("<strong>"), "keeps formatting tags");
assert.ok(!htmlJob.descriptionHtml?.includes("<script"), "strips script tags");
assert.ok(htmlJob.description.includes("Build"), "plain description still set");

const plainOnly = normalizeCareerJob({
  ...jobs[0],
  description: "Job Summary\n• Plan projects\n• Ship code",
  descriptionHtml: undefined,
});
assert.ok(plainOnly.description.includes("• Plan"), "plain bullets preserved");
assert.ok(
  plainOnly.descriptionHtml?.includes("<ul><li>Plan projects</li>"),
  "plain API payload rebuilt into list HTML for detail page",
);
assert.ok(
  plainOnly.descriptionHtml?.includes("<strong>Job Summary</strong>"),
  "section titles become bold headings",
);

const rebuilt = plainJobDescriptionToHtml(
  "Job Purpose\nIntro.\nKey Responsibilities\n• Configure modules,\nInventory and Website.\n• Understand requirements.\nRequired Skills\n• Odoo knowledge.",
);
assert.ok(rebuilt.includes('class="aptus-jobdetail__key"'), "marks Key Responsibilities");
assert.ok(
  rebuilt.includes(
    "<li>Configure modules, Inventory and Website.</li>",
  ),
  "joins hard-wrapped bullets",
);
assert.ok(rebuilt.includes("<strong>Required Skills</strong>"), "marks other sections");

const softWrap = plainJobDescriptionToHtml(
  "Job Summary\nWe are seeking a motivated Project\nEngineer with experience.\nNext paragraph starts here.",
);
assert.ok(
  softWrap.includes(
    "<p>We are seeking a motivated Project Engineer with experience.</p>",
  ),
  "joins mid-sentence hard wraps that start with a capital",
);
assert.ok(
  softWrap.includes("<p>Next paragraph starts here.</p>"),
  "keeps a new sentence as its own paragraph",
);

const split = splitKeyResponsibilities(
  "We are looking for a Software Programmer.\n" +
    "Key Responsibilities\n" +
    "• Design, develop, and test applications.\n" +
    "• Write clean code.\n" +
    "Required Skills\n" +
    "• Bachelor's degree.",
);
assert.equal(split?.before, "We are looking for a Software Programmer.");
assert.deepEqual(split?.items, [
  "Design, develop, and test applications.",
  "Write clean code.",
]);
assert.equal(split?.after, "Required Skills\n• Bachelor's degree.");
assert.equal(splitKeyResponsibilities("No section here"), null);

// Live fallback path: Odoo hard-wraps mid-bullet with a capital letter.
const wrapped = splitKeyResponsibilities(
  "Job Purpose\nIntro text.\nKey Responsibilities\n" +
    "• Configure and support Odoo modules including CRM, Sales, Purchase,\n" +
    "Inventory, Accounting, Projects, and Website.\n" +
    "• Understand business requirements.\n" +
    "Required Skills\n" +
    "• Good understanding of Odoo.",
);
assert.deepEqual(wrapped?.items, [
  "Configure and support Odoo modules including CRM, Sales, Purchase, Inventory, Accounting, Projects, and Website.",
  "Understand business requirements.",
]);
assert.equal(wrapped?.after, "Required Skills\n• Good understanding of Odoo.");

const marked = highlightKeyResponsibilitiesHtml(
  "<p>Intro</p><p><strong>Key Responsibilities</strong></p><ul><li>Design</li></ul><p>Required</p>",
);
assert.ok(marked.includes('class="aptus-jobdetail__key"'), "marks the heading");
assert.ok(!marked.includes("aptus-jobdetail__key-block"), "no card wrapper");
assert.ok(marked.includes("Key Responsibilities"), "keeps the heading");
assert.ok(marked.includes("<ul><li>Design</li></ul>"), "keeps the list after the heading");
assert.ok(marked.startsWith("<p>Intro</p>"), "leaves the intro in place");
assert.ok(marked.endsWith("<p>Required</p>"), "leaves the following section in place");

console.log("career-jobs self-check passed");
