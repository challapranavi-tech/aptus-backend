import { jsonCors, withCors } from "@/lib/api-cors";
import { getJobBySlug } from "@/lib/careers/jobs";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function OPTIONS(req: NextRequest) {
  return withCors(new NextResponse(null, { status: 204 }), req);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const job = await getJobBySlug(slug);
  if (!job) {
    return jsonCors(req, { error: "Job not found." }, { status: 404 });
  }
  return jsonCors(req, { job }, {
    headers: { "Cache-Control": "public, max-age=60, s-maxage=300" },
  });
}
