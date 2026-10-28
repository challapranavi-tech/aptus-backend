import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { __resetRateLimitStoreForTests } from "@shared/lib/rate-limit";
import {
  MAX_TOTAL_ATTACHMENT_BYTES,
  MAX_UPLOAD_BYTES,
} from "@shared/lib/careers-application";
import {
  buildCareersForm,
  exeBytes,
  fileFrom,
  jpegBytes,
  pdfBytes,
} from "./helpers/careers-form";
import { setNodeEnv } from "./helpers/set-env";

const mocks = vi.hoisted(() => ({
  createApplicant: vi.fn(),
  sendEmail: vi.fn(),
  archiveApplication: vi.fn(),
  isOdooConfigured: vi.fn(() => true),
  isMailConfigured: vi.fn(() => true),
  getPublishedJobById: vi.fn(),
}));

vi.mock("@/lib/odoo", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/odoo")>();
  return {
    ...actual,
    isOdooConfigured: mocks.isOdooConfigured,
    createApplicant: mocks.createApplicant,
  };
});

vi.mock("@/lib/mail", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/mail")>();
  return {
    ...actual,
    isMailConfigured: mocks.isMailConfigured,
    sendEmail: mocks.sendEmail,
    hrEmail: () => "hr@test.example",
  };
});

vi.mock("@/lib/application-archive", () => ({
  archiveApplication: mocks.archiveApplication,
}));

vi.mock("@/lib/careers/jobs", () => ({
  getPublishedJobById: mocks.getPublishedJobById,
}));

import { POST } from "@/app/api/careers/apply/route";

function req(form: FormData, ip = "203.0.113.10") {
  return new NextRequest("http://localhost:3001/api/careers/apply", {
    method: "POST",
    headers: { "x-forwarded-for": ip },
    body: form,
  });
}

const publishedJob = {
  id: "42",
  slug: "engineer-42",
  title: "Engineer",
  department: "SOFTWARE",
  location: "Muscat",
  jobType: "Full-time",
  description: "",
  descriptionHtml: "",
  responsibilities: [],
  requirements: [],
};

describe("POST /api/careers/apply", () => {
  beforeEach(() => {
    __resetRateLimitStoreForTests();
    vi.clearAllMocks();
    mocks.isOdooConfigured.mockReturnValue(true);
    mocks.isMailConfigured.mockReturnValue(true);
    mocks.createApplicant.mockResolvedValue(99);
    mocks.sendEmail.mockResolvedValue({ ok: true, id: "mail_1" });
    mocks.archiveApplication.mockResolvedValue("archive://test");
    mocks.getPublishedJobById.mockResolvedValue(publishedJob);
    process.env.ODOO_URL = "https://odoo.test.example";
    process.env.RESEND_API_KEY = "re_test";
    delete process.env.VERCEL;
    setNodeEnv("test");
  });

  it("accepts a valid application (Odoo + mail + archive)", async () => {
    const res = await POST(req(buildCareersForm()));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
    expect(mocks.createApplicant).toHaveBeenCalledOnce();
    expect(mocks.archiveApplication).toHaveBeenCalledOnce();
    expect(mocks.sendEmail).toHaveBeenCalled();
  });

  it("returns 400 for unknown form keys", async () => {
    const form = buildCareersForm({ extraFields: { hack: "nope" } });
    const res = await POST(req(form));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.errors.hack).toBeTruthy();
    expect(mocks.createApplicant).not.toHaveBeenCalled();
  });

  it("accepts applications without optional document uploads", async () => {
    const res = await POST(
      req(
        buildCareersForm({
          passportCopy: null,
          latestPayslip: null,
          photograph: null,
          educationDoc0: null,
        }),
      ),
    );
    expect(res.status).toBe(200);
    expect(mocks.createApplicant).toHaveBeenCalled();
  });

  it("rejects spoofed executable disguised as PDF (magic bytes)", async () => {
    const form = buildCareersForm({
      resume: fileFrom("cv.pdf", exeBytes(), "application/pdf"),
    });
    const res = await POST(req(form));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(JSON.stringify(body).toLowerCase()).not.toMatch(/\bexecutable\b|\bmz\b/);
    expect(mocks.createApplicant).not.toHaveBeenCalled();
  });

  it("returns 413 when total attachments exceed the cap", async () => {
    // Stay under per-file 800 KB but push 6 files past the 4.5 MB total.
    const chunk = MAX_UPLOAD_BYTES - 1024;
    expect(chunk * 6).toBeGreaterThan(MAX_TOTAL_ATTACHMENT_BYTES);
    const big = (name: string, kind: "pdf" | "jpg") =>
      fileFrom(
        name,
        kind === "pdf" ? pdfBytes(chunk) : jpegBytes(chunk),
        kind === "pdf" ? "application/pdf" : "image/jpeg",
      );
    const form = buildCareersForm({
      resume: big("cv.pdf", "pdf"),
      passportCopy: big("passport.pdf", "pdf"),
      photograph: big("photo.jpg", "jpg"),
      educationDoc0: big("edu.pdf", "pdf"),
      extraFiles: [
        ["appointmentLetter", big("appt.pdf", "pdf")],
        ["relievingLetter", big("rel.pdf", "pdf")],
      ],
    });
    const res = await POST(req(form));
    expect(res.status).toBe(413);
    expect(mocks.createApplicant).not.toHaveBeenCalled();
  });

  it("returns 503 when Odoo is not configured", async () => {
    mocks.isOdooConfigured.mockReturnValue(false);
    const res = await POST(req(buildCareersForm()));
    expect(res.status).toBe(503);
    expect(mocks.createApplicant).not.toHaveBeenCalled();
  });

  it("returns 502 when Odoo create fails and still emails HR", async () => {
    mocks.createApplicant.mockRejectedValue(new Error("odoo down"));
    const res = await POST(req(buildCareersForm()));
    expect(res.status).toBe(502);
    expect(mocks.sendEmail).toHaveBeenCalled();
    const subject = mocks.sendEmail.mock.calls[0]?.[0]?.subject as string;
    expect(subject).toMatch(/ODOO FAILED/i);
  });

  it("returns ok with email_pending when HR mail fails after Odoo sync", async () => {
    mocks.sendEmail
      .mockResolvedValueOnce({ ok: false, error: "resend down" }) // HR
      .mockResolvedValue({ ok: true, id: "x" }); // confirmation (unused path)
    const res = await POST(req(buildCareersForm()));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      ok: true,
      warning: "email_pending",
    });
  });

  it("returns 400 for invalid jobId", async () => {
    const res = await POST(
      req(buildCareersForm({ fields: { jobId: "0" } })),
    );
    expect(res.status).toBe(400);
    expect(mocks.createApplicant).not.toHaveBeenCalled();
    expect(mocks.getPublishedJobById).not.toHaveBeenCalled();
  });

  it("returns 400 when job is not website_published", async () => {
    mocks.getPublishedJobById.mockResolvedValue(null);
    const res = await POST(req(buildCareersForm()));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/not available for applications/i);
    expect(mocks.createApplicant).not.toHaveBeenCalled();
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("uses the published job title in the HR email subject", async () => {
    mocks.getPublishedJobById.mockResolvedValue({
      ...publishedJob,
      title: "Senior Engineer",
    });
    const res = await POST(
      req(
        buildCareersForm({
          fields: { appliedDesignation: "spoofed-title", jobId: "42" },
        }),
      ),
    );
    expect(res.status).toBe(200);
    const subject = mocks.sendEmail.mock.calls[0]?.[0]?.subject as string;
    expect(subject).toContain("Senior Engineer");
    expect(subject).not.toContain("spoofed-title");
  });

  it("rate-limits by email identity (429)", async () => {
    const email = "rate.limit@example.com";
    for (let i = 0; i < 3; i++) {
      const res = await POST(
        req(
          buildCareersForm({ fields: { email } }),
          `203.0.113.${20 + i}`,
        ),
      );
      expect(res.status).toBe(200);
    }
    const blocked = await POST(
      req(
        buildCareersForm({ fields: { email } }),
        "203.0.113.99",
      ),
    );
    expect(blocked.status).toBe(429);
  });
});
