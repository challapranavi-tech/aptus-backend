import { NextRequest, NextResponse } from "next/server";

/**
 * Same-origin proxy to the backend Talk to Expert CRM capture API.
 * Avoids browser CORS failures when frontend and API are on different hosts.
 */
export const maxDuration = 60;

function backendBase(): string {
  const raw = (
    process.env.APTUS_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    ""
  ).replace(/\/$/, "");

  const onVercel = Boolean(process.env.VERCEL);
  const isLocal =
    !raw || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(raw);

  if (onVercel && isLocal) {
    throw new Error(
      "APTUS_API_URL is missing or points at localhost. Set it to the deployed backend URL in Vercel → frontend env.",
    );
  }

  return raw || "http://localhost:3001";
}

export async function POST(req: NextRequest) {
  let target: string;
  try {
    target = `${backendBase()}/api/talk-to-expert`;
  } catch (err) {
    console.error(
      "[api/talk-to-expert proxy] misconfigured:",
      err instanceof Error ? err.message : err,
    );
    return NextResponse.json(
      {
        error:
          "We couldn't save your details right now. Please try again or contact our sales team.",
      },
      { status: 503 },
    );
  }

  const contentType = req.headers.get("content-type") ?? "";

  try {
    const upstream = await fetch(target, {
      method: "POST",
      headers: contentType ? { "Content-Type": contentType } : undefined,
      body: await req.arrayBuffer(),
      cache: "no-store",
    });

    const body = await upstream.arrayBuffer();
    const responseType =
      upstream.headers.get("content-type") ?? "application/json";

    return new NextResponse(body, {
      status: upstream.status,
      headers: { "Content-Type": responseType },
    });
  } catch (err) {
    console.error(
      "[api/talk-to-expert proxy] upstream failed:",
      err instanceof Error ? err.message : err,
    );
    return NextResponse.json(
      {
        error:
          "We couldn't save your details right now. Please try again or contact our sales team.",
      },
      { status: 502 },
    );
  }
}
