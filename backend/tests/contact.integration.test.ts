import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { __resetRateLimitStoreForTests } from "@shared/lib/rate-limit";

const mocks = vi.hoisted(() => ({
  sendEmail: vi.fn(),
  isMailConfigured: vi.fn(() => true),
}));

vi.mock("@/lib/mail", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/mail")>();
  return {
    ...actual,
    isMailConfigured: mocks.isMailConfigured,
    sendEmail: mocks.sendEmail,
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
    await expect(res.json()).resolves.toEqual({ ok: true });
    expect(mocks.sendEmail).toHaveBeenCalledOnce();
    const arg = mocks.sendEmail.mock.calls[0][0];
    expect(arg.subject).toMatch(/quote request/i);
    expect(arg.replyTo).toBe("ada@example.com");
    expect(arg.to).toBe("info@aptusinfotech.com");
    expect(arg.text).toContain("Product Category: Software");
    expect(arg.text).toContain("QTY: 3");
    expect(arg.text).toContain("Source: Website – Request Quote");
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
    expect(arg.text).toContain("Product Category: ELV");
    expect(arg.subject).toMatch(/ELV/);
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

  it("returns 400 for a bad email", async () => {
    const res = await POST(
      contactReq({ ...validBody, email: "not-an-email" }),
    );
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
