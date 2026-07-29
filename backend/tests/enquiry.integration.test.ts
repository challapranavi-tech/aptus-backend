import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { __resetRateLimitStoreForTests } from "@shared/lib/rate-limit";

const mocks = vi.hoisted(() => ({
  sendEmail: vi.fn(),
  isMailConfigured: vi.fn(() => true),
  isOdooConfigured: vi.fn(() => true),
  registerWebsiteEnquiry: vi.fn(),
}));

vi.mock("@/lib/mail", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/mail")>();
  return {
    ...actual,
    isMailConfigured: mocks.isMailConfigured,
    sendEmail: mocks.sendEmail,
  };
});

vi.mock("@/lib/odoo", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/odoo")>();
  return {
    ...actual,
    isOdooConfigured: mocks.isOdooConfigured,
    registerWebsiteEnquiry: mocks.registerWebsiteEnquiry,
  };
});

import { OPTIONS, POST } from "@/app/api/enquiry/route";
import { setNodeEnv } from "./helpers/set-env";

function enquiryReq(
  body: unknown,
  init?: { origin?: string; contentType?: string; ip?: string },
) {
  const headers = new Headers({
    "content-type": init?.contentType ?? "application/json",
    "x-forwarded-for": init?.ip ?? "203.0.113.50",
  });
  if (init?.origin) headers.set("origin", init.origin);
  return new NextRequest("http://localhost:3001/api/enquiry", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

const validBody = {
  first_name: "Ada",
  last_name: "Lovelace",
  city: "Muscat",
  country: "Oman",
  email: "ada@example.com",
  phone: "+968 1234 5678",
  heard_from: "Media",
  message: "Need expert guidance",
};

describe("POST /api/enquiry", () => {
  beforeEach(() => {
    __resetRateLimitStoreForTests();
    vi.clearAllMocks();
    mocks.isMailConfigured.mockReturnValue(true);
    mocks.isOdooConfigured.mockReturnValue(true);
    mocks.sendEmail.mockResolvedValue({ ok: true, id: "msg_enq_1" });
    mocks.registerWebsiteEnquiry.mockResolvedValue({
      enquiryRef: "ENQ-2026-000001",
      partnerId: 42,
      created: true,
    });
    process.env.RESEND_API_KEY = "re_test";
    process.env.APTUS_FRONTEND_URL = "http://localhost:3000";
    process.env.CONTACT_TO_EMAIL = "info@aptusinfotech.com";
    setNodeEnv("test");
  });

  it("sends Contact Form email with Odoo Enquiry Reference", async () => {
    const res = await POST(enquiryReq(validBody));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.enquiryRef).toBe("ENQ-2026-000001");
    expect(body.partnerId).toBe(42);
    expect(body.odooSynced).toBe(true);
    expect(body.quoteRef).toBeUndefined();
    expect(mocks.registerWebsiteEnquiry).toHaveBeenCalledOnce();
    expect(mocks.sendEmail).toHaveBeenCalledOnce();
    const arg = mocks.sendEmail.mock.calls[0][0];
    expect(arg.to).toBe("info@aptusinfotech.com");
    expect(arg.subject).toBe("New Website Enquiry - ENQ-2026-000001");
    expect(arg.text).toContain("Enquiry Reference: ENQ-2026-000001");
    expect(arg.text).toContain("Source: Website Contact Form");
  });

  it("accepts state as Country alias", async () => {
    const res = await POST(
      enquiryReq({
        ...validBody,
        country: undefined,
        state: "Muscat Governorate",
      }),
    );
    expect(res.status).toBe(200);
    expect(mocks.registerWebsiteEnquiry).toHaveBeenCalledWith(
      expect.objectContaining({ country: "Muscat Governorate" }),
    );
  });

  it("returns 400 for a bad email without calling Odoo", async () => {
    const res = await POST(
      enquiryReq({ ...validBody, email: "not-an-email" }),
    );
    expect(res.status).toBe(400);
    expect(mocks.registerWebsiteEnquiry).not.toHaveBeenCalled();
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("still emails when Odoo sequence/partner fails", async () => {
    mocks.registerWebsiteEnquiry.mockRejectedValue(
      new Error("Odoo sequence website.enquiry returned an empty reference"),
    );
    const res = await POST(enquiryReq(validBody));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.odooSynced).toBe(false);
    expect(body.enquiryRef).toBeNull();
    expect(mocks.sendEmail).toHaveBeenCalledOnce();
    expect(mocks.sendEmail.mock.calls[0][0].text).toContain(
      "Enquiry Reference: (unavailable — Odoo sync failed)",
    );
  });

  it("still emails when Odoo is not configured", async () => {
    mocks.isOdooConfigured.mockReturnValue(false);
    const res = await POST(enquiryReq(validBody));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.odooSynced).toBe(false);
    expect(mocks.registerWebsiteEnquiry).not.toHaveBeenCalled();
    expect(mocks.sendEmail).toHaveBeenCalledOnce();
  });

  it("returns 502 when Resend fails after Odoo succeeds", async () => {
    mocks.sendEmail.mockResolvedValue({ ok: false, error: "boom" });
    const res = await POST(enquiryReq(validBody));
    expect(res.status).toBe(502);
    expect(mocks.registerWebsiteEnquiry).toHaveBeenCalledOnce();
  });

  it("returns 500 when mail is not configured", async () => {
    mocks.isMailConfigured.mockReturnValue(false);
    const res = await POST(enquiryReq(validBody));
    expect(res.status).toBe(500);
    expect(mocks.registerWebsiteEnquiry).not.toHaveBeenCalled();
  });

  it("OPTIONS preflight allows configured frontend origin", async () => {
    const res = await OPTIONS(
      new NextRequest("http://localhost:3001/api/enquiry", {
        method: "OPTIONS",
        headers: { origin: "http://localhost:3000" },
      }),
    );
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
      "http://localhost:3000",
    );
  });
});
