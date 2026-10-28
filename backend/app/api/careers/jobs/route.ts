import { jsonCors, withCors } from "@/lib/api-cors";
import { getAllJobs } from "@/lib/careers/jobs";
import { filterJobs } from "@shared/lib/career-jobs";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function OPTIONS(req: NextRequest) {
  return withCors(new NextResponse(null, { status: 204 }), req);
}

// security: cap free-text filter params so a crafted query can't drive
// pathological in-memory scans or oversized inputs (input validation at the
// boundary). Numeric bounds for page/pageSize are enforced in filterJobs.
function clamp(value: string | null, max = 120): string | undefined {
  if (!value) return undefined;
  return value.slice(0, max);
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const jobs = await getAllJobs();

    const result = filterJobs(jobs, {
      q: clamp(sp.get("q")),
      department: clamp(sp.get("department")),
      location: clamp(sp.get("location")),
      page: sp.get("page") ? Number(sp.get("page")) : undefined,
      pageSize: sp.get("pageSize") ? Number(sp.get("pageSize")) : undefined,
    });

    console.info("[careers/jobs] api", {
      total: result.total,
      page: result.page,
      titles: result.jobs.map((j) => `${j.id}:${j.title}`),
    });

    return jsonCors(req, result, {
      headers: { "Cache-Control": "private, no-store, max-age=0, must-revalidate" },
    });
  } catch (err) {
    // Fail closed: 503 with no job payload — frontend must show empty openings, never mocks.
    console.error("[careers/jobs] api error", err);
    return jsonCors(
      req,
      { error: "Unable to load jobs from Odoo." },
      { status: 503 },
    );
  }
}
