import { corsPreflight, jsonCors, withCors } from "@/lib/api-cors";
import { validationError } from "@/lib/api-validate";
import { extractResumeText } from "@/lib/careers/extract-text";
import { enforceIpRateLimit } from "@/lib/rate-limit-http";
import {
  MAX_UPLOAD_BYTES,
  RESUME_EXTENSIONS,
  validateFile,
} from "@shared/lib/careers-application";
import { extractResumeHints } from "@shared/lib/resume-parse";
import { validateFileContent } from "@shared/lib/file-signature";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function OPTIONS(req: NextRequest) {
  return corsPreflight(req) ?? new Response(null, { status: 405 });
}

export async function POST(req: NextRequest) {
  const preflight = corsPreflight(req);
  if (preflight) return preflight;

  const ipLimited = enforceIpRateLimit(
    req,
    "publicWrite",
    "careers-parse-resume",
    (res) => withCors(res, req),
  );
  if (ipLimited) return ipLimited;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return validationError(
      { _form: "Invalid form submission." },
      (res) => withCors(res, req),
    );
  }

  const resume = form.get("resume");
  const file = resume instanceof File ? resume : null;
  const err = validateFile(file, RESUME_EXTENSIONS, "Resume", true);
  if (err) {
    return validationError({ resume: err }, (res) => withCors(res, req));
  }
  if (file && file.size > MAX_UPLOAD_BYTES) {
    return validationError(
      { resume: "Resume is too large." },
      (res) => withCors(res, req),
    );
  }

  // security: confirm the bytes match a resume type before parsing untrusted
  // file content (defence in depth against spoofed extensions/MIME).
  const header = new Uint8Array(await file!.slice(0, 16).arrayBuffer());
  const contentErr = validateFileContent(file!.name, header, RESUME_EXTENSIONS, "Resume");
  if (contentErr) {
    return validationError({ resume: contentErr }, (res) => withCors(res, req));
  }

  // Parsing is best-effort: any failure returns empty hints, never an error,
  // so the candidate can always continue to manual entry.
  try {
    const buf = Buffer.from(await file!.arrayBuffer());
    const text = await extractResumeText(file!.name, buf);
    const hints = text ? extractResumeHints(text) : { autoFilledKeys: [] };
    return jsonCors(req, { hints });
  } catch {
    return jsonCors(req, { hints: { autoFilledKeys: [] } });
  }
}
