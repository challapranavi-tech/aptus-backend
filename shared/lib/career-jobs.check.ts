/**
 * Runnable self-check for career-jobs filter helpers.
 * Run: npx --yes tsx shared/lib/career-jobs.check.ts
 */
import assert from "node:assert/strict";
import {
  boldJobSectionHeadingsHtml,
  boldJobSectionHeadingsText,
  filterJobs,
  normalizeCareerJob,
  pickHrJobDescriptionHtml,
  slugifyJobTitle,
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
assert.equal(
  plainOnly.descriptionHtml,
  undefined,
  "plain description must not become descriptionHtml",
);
assert.ok(plainOnly.description.includes("• Plan"), "plain bullets preserved");

const plain = boldJobSectionHeadingsText(
  "We are looking for a Software Programmer.\n" +
    "Key Responsibilities\n" +
    "• Design, develop, and test applications.\n" +
    "Required Skills & Qualifications\n" +
    "• Bachelor's degree.",
);
assert.ok(plain.includes("<strong>Key Responsibilities</strong>"));
assert.ok(plain.includes("<strong>Required Skills &amp; Qualifications</strong>"));
assert.ok(plain.includes("• Design, develop, and test applications."));
assert.ok(!plain.includes("aptus-jobdetail__key-block"));

const marked = boldJobSectionHeadingsHtml(
  "<p>Intro</p><p>Key Responsibilities</p><ul><li>Design</li></ul><p>Qualifications</p><p>Meet the qualifications for this role today.</p>",
);
assert.ok(marked.includes("<p><strong>Key Responsibilities</strong></p>"));
assert.ok(marked.includes("<p><strong>Qualifications</strong></p>"));
assert.ok(marked.includes("<ul><li>Design</li></ul>"));
assert.ok(
  marked.includes("<p>Meet the qualifications for this role today.</p>"),
  "does not bold qualifications mentioned inside a sentence",
);
assert.ok(!marked.includes("aptus-jobdetail__key-block"));

console.log("career-jobs self-check passed");
