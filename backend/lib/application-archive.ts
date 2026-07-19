import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { MailAttachment } from "./mail";

/**
 * Durable server-side archive of a career application, written *before* the
 * notification email so a lost/spam-filtered/failed email never means a lost
 * application — uploaded files otherwise live only in request memory and are
 * discarded on any error.
 *
 * Target is chosen at runtime:
 *   • BLOB_READ_WRITE_TOKEN set → Vercel Blob (auto-injected when a Blob store
 *     is linked to the project). The store MUST be created with Private access —
 *     these files are applicant PII (resumes, passport copies, photos) and must
 *     never be reachable by URL. Read them back with the SDK's `get()`.
 *   • otherwise → local disk under APPLICATION_ARCHIVE_DIR (dev / self-hosted).
 */
function archiveRoot(): string {
  return (
    process.env.APPLICATION_ARCHIVE_DIR?.trim() ||
    path.join(process.cwd(), "data", "applications")
  );
}

function slug(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "applicant"
  );
}

/** Traversal-safe, collision-free filenames in the attachments' original order. */
function safeNames(attachments: MailAttachment[]): string[] {
  const seen = new Map<string, number>();
  return attachments.map((a) => {
    const base = path.basename(a.filename) || "file";
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    if (n === 0) return base;
    const dot = base.lastIndexOf(".");
    return dot > 0
      ? `${base.slice(0, dot)}-${n}${base.slice(dot)}`
      : `${base}-${n}`;
  });
}

/** Write fields JSON + every attachment to one folder. Returns its location. */
export async function archiveApplication(
  fields: { candidateName?: string },
  attachments: MailAttachment[],
): Promise<string> {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const folder = `${stamp}-${slug(String(fields.candidateName ?? ""))}`;
  const names = safeNames(attachments);
  const json = JSON.stringify(fields, null, 2);

  if (process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
    return archiveToBlob(folder, json, attachments, names);
  }
  // Vercel FS is read-only — disk archive always fails there without Blob.
  if (process.env.VERCEL === "1") {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN missing on Vercel — link a private Blob store for career application archives.",
    );
  }
  return archiveToDisk(folder, json, attachments, names);
}

async function archiveToDisk(
  folder: string,
  json: string,
  attachments: MailAttachment[],
  names: string[],
): Promise<string> {
  const dir = path.join(archiveRoot(), folder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "application.json"), json, "utf8");
  for (let i = 0; i < attachments.length; i++) {
    await writeFile(path.join(dir, names[i]), attachments[i].content);
  }
  return dir;
}

async function archiveToBlob(
  folder: string,
  json: string,
  attachments: MailAttachment[],
  names: string[],
): Promise<string> {
  // Dynamic import so the disk-only path (dev / self-check) never loads it.
  const { put } = await import("@vercel/blob");
  const prefix = `applications/${folder}`;
  // ponytail: one PUT per file (sequential). Fine for a handful of docs per
  // submission; parallelise with Promise.all if submissions ever get large.
  await put(`${prefix}/application.json`, json, {
    access: "private",
    contentType: "application/json",
  });
  for (let i = 0; i < attachments.length; i++) {
    await put(`${prefix}/${names[i]}`, attachments[i].content, {
      access: "private",
      contentType: attachments[i].contentType,
    });
  }
  return prefix;
}
