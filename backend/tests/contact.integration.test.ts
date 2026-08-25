import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { __resetRateLimitStoreForTests } from "@shared/lib/rate-limit";

const mocks = vi.hoisted(() => ({
  sendEmail: vi.fn(),
  isMailConfigured: vi.fn(() => true),
  createCrmLead: vi.fn(),
  isOdooConfigured: vi.fn(() => false),
  nextRequestQuoteRef: vi.fn(),
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
    createCrmLead: mocks.createCrmLead,
    isOdooConfigured: mocks.isOdooConfigured,
    nextRequestQuoteRef: mocks.nextRequestQuoteRef,
  };
});

import { OPTIONS, POST } from "@/app/api/contact/route";
import { setNodeEnv } from "./helpers/set-env";

function contactReq(
  body: unknown,
  init?: { origin?: string; contentType?: string; ip?: string },
) {
  const headers = new Headers({
    "content-type": init?.contentType ?? "application/json",
    "x-forwarded-for": init?.ip ?? "203.0.113.50",
  });
  if (init?.origin) headers.set("origin", init.origin);
  return new NextRequest("http://localhost:3001/api/contact", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

const validBody = {
  first_name: "Ada",
  last_name: "Lovelace",
  email: "ada@example.com",
  company: "Analytical Engines",
  phone: "+968 1234 5678",
  product: "Revit",
  qty: "3",
  message: "Quote please",
};

describe("POST /api/contact", () => {
  beforeEach(() => {
    __resetRateLimitStoreForTests();
    vi.clearAllMocks();
    mocks.isMailConfigured.mockReturnValue(true);
    mocks.sendEmail.mockResolvedValue({ ok: true, id: "msg_1" });
    mocks.isOdooConfigured.mockReturnValue(false);
    mocks.createCrmLead.mockResolvedValue(101);
    mocks.nextRequestQuoteRef.mockResolvedValue("RQ-2026-000001");
    process.env.RESEND_API_KEY = "re_test";
    process.env.APTUS_FRONTEND_URL = "http://localhost:3000";
    process.env.CONTACT_TO_EMAIL = "info@aptusinfotech.com";
    delete process.env.SOFTWARE_SALES_EMAIL;
    delete process.env.ELV_SALES_EMAIL;
    setNodeEnv("test");
  });

  it("accepts a valid contact / quote lead", async () => {
    const res = await POST(contactReq(validBody));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    // Odoo off → JS fallback Q-…
    expect(body.quoteRef).toMatch(/^Q-/);
    expect(mocks.nextRequestQuoteRef).not.toHaveBeenCalled();
    expect(mocks.sendEmail).toHaveBeenCalledTimes(2);
    expect(mocks.createCrmLead).not.toHaveBeenCalled();
    const arg = mocks.sendEmail.mock.calls[0][0];
    expect(arg.subject).toMatch(/quote request/i);
    expect(arg.replyTo).toBe("ada@example.com");
    expect(arg.to).toBe("info@aptusinfotech.com");
    expect(arg.text).toContain("Product Category: Software");
    expect(arg.text).toContain("QTY: 3");
    expect(arg.text).toContain("Source: Website – Request Quote");
    expect(arg.text).toContain(`Quote Ref: ${body.quoteRef}`);
    const thankYou = mocks.sendEmail.mock.calls[1][0];
    expect(thankYou.to).toBe("ada@example.com");
    expect(thankYou.subject).toBe("Thank You for Contacting Aptus Infotech");
  });

  it("creates a crm.lead when Odoo is configured", async () => {
    mocks.isOdooConfigured.mockReturnValue(true);
    process.env.ODOO_URL = "https://odoo.example.com";
    const res = await POST(contactReq(validBody));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.crmSynced).toBe(true);
    expect(body.quoteRef).toBe("RQ-2026-000001");
    expect(mocks.nextRequestQuoteRef).toHaveBeenCalledOnce();
    expect(mocks.createCrmLead).toHaveBeenCalledOnce();
    expect(mocks.createCrmLead).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: "Ada",
        lastName: "Lovelace",
        company: "Analytical Engines",
        email: "ada@example.com",
        phone: "+968 1234 5678",
        product: "Revit",
        qty: "3",
        categoryLabel: "Software",
        message: "Quote please",
        quoteRef: "RQ-2026-000001",
      }),
    );
    expect(mocks.sendEmail.mock.calls[0][0].text).toContain(
      "Quote Ref: RQ-2026-000001",
    );
    expect(mocks.sendEmail.mock.calls[0][0].text).toContain(
      "Odoo CRM: https://odoo.example.com/web#id=101&model=crm.lead&view_type=form",
    );
    expect(mocks.sendEmail.mock.calls[0][0].html).toContain("Open in Odoo CRM");
    expect(mocks.sendEmail.mock.calls[0][0].subject).toContain(
      "RQ-2026-000001",
    );
  });

  it("does not create CRM for plain contact (no quote product)", async () => {
    mocks.isOdooConfigured.mockReturnValue(true);
    process.env.SOFTWARE_SALES_EMAIL = "software@aptusinfotech.com";
    process.env.CONTACT_TO_EMAIL = "info@aptusinfotech.com";
    const res = await POST(
      contactReq({
        first_name: "Ada",
        last_name: "Lovelace",
        email: "ada@example.com",
        company: "Analytical Engines",
        phone: "+968 1234 5678",
        product: "Others",
        message: "Just saying hi",
      }),
    );
    expect(res.status).toBe(200);
    expect(mocks.createCrmLead).not.toHaveBeenCalled();
    expect(mocks.sendEmail).toHaveBeenCalledTimes(2);
    expect(mocks.sendEmail.mock.calls[0][0].to).toBe("info@aptusinfotech.com");
    expect(mocks.sendEmail.mock.calls[0][0].subject).toMatch(/contact message/i);
    expect(mocks.sendEmail.mock.calls[1][0].to).toBe("ada@example.com");
  });

  it("routes software quotes to SOFTWARE_SALES_EMAIL", async () => {
    process.env.SOFTWARE_SALES_EMAIL = "software@aptusinfotech.com";
    process.env.ELV_SALES_EMAIL = "elv@aptusinfotech.com";
    process.env.CONTACT_TO_EMAIL = "info@aptusinfotech.com";
    const res = await POST(contactReq(validBody));
    expect(res.status).toBe(200);
    expect(mocks.sendEmail.mock.calls[0][0].to).toBe(
      "software@aptusinfotech.com",
    );
    expect(mocks.sendEmail.mock.calls[0][0].subject).toMatch(/quote request/i);
  });

  it("still succeeds when crm.lead create fails", async () => {
    mocks.isOdooConfigured.mockReturnValue(true);
    mocks.createCrmLead.mockRejectedValue(new Error("access denied"));
    const res = await POST(contactReq(validBody));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.quoteRef).toBe("RQ-2026-000001");
    expect(body.crmSynced).toBe(false);
    // CRM failure alert + sales quote + customer thank-you
    expect(mocks.sendEmail).toHaveBeenCalledTimes(3);
    const alert = mocks.sendEmail.mock.calls.find((call) =>
      String(call[0].subject ?? "").includes(
        `CRM Lead creation failed for Quote #${body.quoteRef}`,
      ),
    )?.[0];
    expect(alert).toBeTruthy();
    expect(alert?.to).toBe("info@aptusinfotech.com");
  });

  it("falls back to JS quoteRef when Odoo sequence fails", async () => {
    mocks.isOdooConfigured.mockReturnValue(true);
    mocks.nextRequestQuoteRef.mockRejectedValue(
      new Error("Odoo sequence request.quote returned an empty reference"),
    );
    const res = await POST(contactReq(validBody));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.quoteRef).toMatch(/^Q-/);
    expect(mocks.createCrmLead).toHaveBeenCalledWith(
      expect.objectContaining({ quoteRef: body.quoteRef }),
    );
  });

  it("passes software category to createCrmLead", async () => {
    mocks.isOdooConfigured.mockReturnValue(true);
    process.env.SOFTWARE_SALES_EMAIL = "software@aptusinfotech.com";
    process.env.ELV_SALES_EMAIL = "elv@aptusinfotech.com";
    const res = await POST(contactReq(validBody));
    expect(res.status).toBe(200);
    expect(mocks.createCrmLead).toHaveBeenCalledWith(
      expect.objectContaining({ category: "software" }),
    );
  });

  it("passes elv category to createCrmLead for ELV quotes", async () => {
    mocks.isOdooConfigured.mockReturnValue(true);
    process.env.ELV_SALES_EMAIL = "elv@aptusinfotech.com";
    process.env.SOFTWARE_SALES_EMAIL = "software@aptusinfotech.com";
    const res = await POST(
      contactReq({
        ...validBody,
        product: "CCTV Surveillance Solutions",
        category: "elv",
      }),
    );
    expect(res.status).toBe(200);
    expect(mocks.createCrmLead).toHaveBeenCalledWith(
      expect.objectContaining({ category: "elv", categoryLabel: "Infra" }),
    );
  });

  it("routes ELV products to ELV_SALES_EMAIL", async () => {
    process.env.ELV_SALES_EMAIL = "elv@aptusinfotech.com";
    process.env.SOFTWARE_SALES_EMAIL = "software@aptusinfotech.com";
    const res = await POST(
      contactReq({
        ...validBody,
        product: "CCTV Surveillance Solutions",
        category: "elv",
      }),
    );
    expect(res.status).toBe(200);
    const arg = mocks.sendEmail.mock.calls[0][0];
    expect(arg.to).toBe("elv@aptusinfotech.com");
    expect(arg.text).toContain("Product Category: Infra");
    expect(arg.subject).toMatch(/Infra/);
  });

  it("honours explicit category override over product keywords", async () => {
    process.env.SOFTWARE_SALES_EMAIL = "software@aptusinfotech.com";
    process.env.ELV_SALES_EMAIL = "elv@aptusinfotech.com";
    const res = await POST(
      contactReq({
        ...validBody,
        product: "Revit",
        category: "elv",
      }),
    );
    expect(res.status).toBe(200);
    expect(mocks.sendEmail.mock.calls[0][0].to).toBe("elv@aptusinfotech.com");
  });

  it("falls back to CONTACT_TO_EMAIL when category inbox unset", async () => {
    process.env.CONTACT_TO_EMAIL = "fallback@aptusinfotech.com";
    const res = await POST(
      contactReq({
        ...validBody,
        product: "Access Control Systems",
        category: "elv",
      }),
    );
    expect(res.status).toBe(200);
    expect(mocks.sendEmail.mock.calls[0][0].to).toBe(
      "fallback@aptusinfotech.com",
    );
  });

  it("rejects oversized JSON bodies", async () => {
    const huge = JSON.stringify({
      ...validBody,
      message: "x".repeat(40_000),
    });
    const headers = new Headers({
      "content-type": "application/json",
      "content-length": String(huge.length),
      "x-forwarded-for": "203.0.113.99",
    });
    const res = await POST(
      new NextRequest("http://localhost:3001/api/contact", {
        method: "POST",
        headers,
        body: huge,
      }),
    );
    expect(res.status).toBe(413);
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("returns 400 for a bad email", async () => {
    const res = await POST(
      contactReq({ ...validBody, email: "not-an-email" }),
    );
    expect(res.status).toBe(400);
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("returns 400 for qty zero", async () => {
    const res = await POST(contactReq({ ...validBody, qty: "0" }));
    expect(res.status).toBe(400);
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("returns 502 when Resend fails", async () => {
    mocks.sendEmail.mockResolvedValue({ ok: false, error: "boom" });
    const res = await POST(contactReq(validBody));
    expect(res.status).toBe(502);
  });

  it("returns 500 when mail is not configured", async () => {
    mocks.isMailConfigured.mockReturnValue(false);
    const res = await POST(contactReq(validBody));
    expect(res.status).toBe(500);
  });

  it("OPTIONS preflight allows configured frontend origin", async () => {
    const res = await OPTIONS(
      new NextRequest("http://localhost:3001/api/contact", {
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