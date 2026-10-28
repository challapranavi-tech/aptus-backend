import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { __resetRateLimitStoreForTests } from "@shared/lib/rate-limit";

const mocks = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  invalidateOdooClientSession: vi.fn(),
  fetch: vi.fn(async () => new Response(null, { status: 200 })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
  revalidateTag: mocks.revalidateTag,
}));

vi.mock("@/data", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/data")>();
  return {
    ...actual,
    invalidateOdooClientSession: mocks.invalidateOdooClientSession,
  };
});

import { GET, POST } from "@/app/api/revalidate/route";
import { GET as odooGET } from "@/app/api/odoo/route";
import { setNodeEnv } from "./helpers/set-env";

function revalidateReq(
  body: unknown,
  init?: { tokenHeader?: never; contentType?: string | null },
) {
  const headers = new Headers();
  if (init?.contentType !== null) {
    headers.set("content-type", init?.contentType ?? "application/json");
  }
  headers.set("x-forwarded-for", "198.51.100.10");
  return new NextRequest("http://localhost:3001/api/revalidate", {
    method: "POST",
    headers,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /api/revalidate auth + contract", () => {
  beforeEach(() => {
    __resetRateLimitStoreForTests();
    vi.clearAllMocks();
    process.env.ODOO_REVALIDATE_TOKEN = "test-revalidate-secret";
    process.env.APTUS_FRONTEND_URL = "https://frontend.test.example";
    setNodeEnv("test");
    vi.stubGlobal("fetch", mocks.fetch);
  });

  it("returns 503 when token env is unset", async () => {
    delete process.env.ODOO_REVALIDATE_TOKEN;
    const res = await POST(
      revalidateReq({ slug: "home", token: "anything" }),
    );
    expect(res.status).toBe(503);
  });

  it("returns 401 for wrong token", async () => {
    const res = await POST(
      revalidateReq({ slug: "home", token: "wrong" }),
    );
    expect(res.status).toBe(401);
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("returns 400 when token field is omitted (schema)", async () => {
    const res = await POST(revalidateReq({ slug: "home" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for non-JSON content-type", async () => {
    const res = await POST(
      revalidateReq({ slug: "home", token: "test-revalidate-secret" }, {
        contentType: "text/plain",
      }),
    );
    expect(res.status).toBe(400);
  });

  it("revalidates on valid token and fans out to frontend", async () => {
    const res = await POST(
      revalidateReq({
        slug: "home",
        token: "test-revalidate-secret",
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.revalidated).toBe(true);
    expect(body.slugs).toContain("home");
    expect(mocks.invalidateOdooClientSession).toHaveBeenCalled();
    expect(mocks.revalidateTag).toHaveBeenCalled();
    expect(mocks.fetch).toHaveBeenCalledWith(
      "https://frontend.test.example/api/revalidate",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("GET is disabled in production", async () => {
    setNodeEnv("production");
    const res = await GET(
      new NextRequest(
        "http://localhost:3001/api/revalidate?slug=home&token=test-revalidate-secret",
      ),
    );
    expect(res.status).toBe(405);
  });
});

describe("GET /api/odoo debug auth", () => {
  beforeEach(() => {
    __resetRateLimitStoreForTests();
    process.env.ODOO_DEBUG_TOKEN = "debug-secret";
    setNodeEnv("development");
    delete process.env.ODOO_URL;
    delete process.env.ODOO_DB;
    delete process.env.ODOO_USER;
    delete process.env.ODOO_API_KEY;
  });

  it("returns 403 in production", async () => {
    setNodeEnv("production");
    const res = await odooGET(
      new NextRequest("http://localhost:3001/api/odoo?model=status", {
        headers: { "x-debug-token": "debug-secret" },
      }),
    );
    expect(res.status).toBe(403);
  });

  it("rejects ?token= query (must use header)", async () => {
    const res = await odooGET(
      new NextRequest(
        "http://localhost:3001/api/odoo?model=status&token=debug-secret",
      ),
    );
    expect(res.status).toBe(400);
  });

  it("returns 401 for wrong header token", async () => {
    const res = await odooGET(
      new NextRequest("http://localhost:3001/api/odoo?model=status", {
        headers: { "x-debug-token": "nope" },
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 503 when debug token env is unset", async () => {
    delete process.env.ODOO_DEBUG_TOKEN;
    const res = await odooGET(
      new NextRequest("http://localhost:3001/api/odoo?model=status", {
        headers: { "x-debug-token": "debug-secret" },
      }),
    );
    expect(res.status).toBe(503);
  });

  it("allows status probe with valid header when Odoo unset", async () => {
    const res = await odooGET(
      new NextRequest("http://localhost:3001/api/odoo?model=status", {
        headers: { "x-debug-token": "debug-secret" },
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("not_configured");
  });
});
