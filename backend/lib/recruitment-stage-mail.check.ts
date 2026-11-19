/**
 * Runnable self-check for stage congratulations selection (no network).
 * Run: npx --yes tsx backend/lib/recruitment-stage-mail.check.ts
 */
import assert from "node:assert/strict";
import {
  buildStageCongratsMail,
  selectStageNotices,
  sentStageKeys,
  stageMailKind,
  STAGE_MAIL_MARKER,
  type RecruitmentStage,
  type StageApplicant,
} from "./recruitment-stage-mail";

assert.equal(stageMailKind("New"), "skip");
assert.equal(stageMailKind("Refused"), "skip");
assert.equal(stageMailKind("Qualified"), "qualify");
assert.equal(stageMailKind("Initial Qualification"), "qualify");
assert.equal(stageMailKind("First Interview"), "interview");
assert.equal(stageMailKind("Second Interview"), "interview");
assert.equal(stageMailKind("Contract Proposal"), "offer");
assert.equal(stageMailKind("Contract Signed"), "hired");
assert.equal(stageMailKind("Assessment"), "forward");

assert.equal(buildStageCongratsMail({
  candidateName: "Ada",
  role: "Sales Executive",
  stageName: "Refused",
  reference: "SE-2026-99",
}), null);

const stages: RecruitmentStage[] = [
  { id: 1, name: "New", sequence: 0, fold: false },
  { id: 2, name: "Qualified", sequence: 1, fold: false },
  { id: 3, name: "First Interview", sequence: 2, fold: false },
  { id: 4, name: "Second Interview", sequence: 3, fold: false },
  { id: 5, name: "Refused", sequence: 10, fold: true },
];
const applicants: StageApplicant[] = [
  { id: 99, partnerName: "Ada", email: "ada@example.com", jobTitle: "Sales Executive", stageId: 3 },
  { id: 100, partnerName: "Bea", email: "bea@example.com", jobTitle: "Sales Executive", stageId: 1 },
  { id: 101, partnerName: "Cy", email: "cy@example.com", jobTitle: "Accountant", stageId: 4 },
  { id: 102, partnerName: "Dee", email: "dee@example.com", jobTitle: "Accountant", stageId: 5 },
  { id: 103, partnerName: "Eve", email: "eve@example.com", jobTitle: "Accountant", stageId: 2 },
];
const when = new Date("2026-11-17T08:00:00Z");
const notices = selectStageNotices(
  applicants,
  stages,
  new Set(["101:4"]),
  when,
);
assert.deepEqual(
  notices.map((notice) => notice.applicantId),
  [99, 103],
);
assert.ok(notices[0].mail);
assert.equal(notices[0].mail.subject, "Congratulations — First Interview — SE-2026-99");
assert.match(notices[0].mail.text, /share the schedule/i);
assert.ok(notices[1].mail);
assert.equal(
  notices[1].mail.subject,
  "Congratulations, you have been shortlisted — AC-2026-103",
);
assert.match(notices[1].mail.text, /Congratulations, you have been shortlisted\./);

const sent = sentStageKeys([
  { applicantId: 99, body: `<p>${STAGE_MAIL_MARKER}3</p>` },
  { applicantId: 99, body: "unrelated" },
]);
assert.equal(sent.has("99:3"), true);

const refused = selectStageNotices(
  [
    {
      id: 104,
      partnerName: "Fay",
      email: "fay@example.com",
      jobTitle: "Sales Executive",
      stageId: 3,
      refused: true,
      refuseTemplateId: 55,
    },
  ],
  stages,
  new Set(),
  when,
);
assert.equal(refused.length, 1);
assert.equal(refused[0].marker, "refuse");
assert.equal(refused[0].templateId, 55);
assert.equal(refused[0].mail, null);
assert.equal(
  selectStageNotices(
    [
      {
        id: 104,
        partnerName: "Fay",
        email: "fay@example.com",
        jobTitle: "Sales Executive",
        stageId: 3,
        refused: true,
        refuseTemplateId: 55,
      },
    ],
    stages,
    new Set(["104:refuse"]),
    when,
  ).length,
  0,
);
assert.equal(
  selectStageNotices(applicants, stages, sent, when).some(
    (notice) => notice.applicantId === 99,
  ),
  false,
);

console.log("recruitment-stage-mail.check.ts: ok");
