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
