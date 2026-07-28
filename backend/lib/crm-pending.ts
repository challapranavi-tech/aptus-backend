/**
 * Durable queue for crm.lead creates that failed after the sales email
 * already went out. Retried by POST /api/crm/retry (Vercel cron).
 *
 * Storage: Vercel Blob when BLOB_READ_WRITE_TOKEN is set, else local disk
 * (dev). On Vercel without Blob, enqueue is skipped but the admin alert
 * still fires — sales already have the quote email.
 */
import { mkdir, readdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { CrmLeadInput } from "./odoo/crm";

export type PendingCrmJob = {
  quoteRef: string;
  input: CrmLeadInput;
  alertTo: string;
  createdAt: string;
  attempts: number;
  lastError?: string;
};

const BLOB_PREFIX = "crm-pending";
const MAX_ATTEMPTS = 8;

/** Short ref for sales email + CRM failure alerts (not a secret). */
export function newQuoteRef(now = Date.now()): string {
  const t = now.toString(36).toUpperCase();
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `Q-${t}-${r}`;
}

function diskRoot(): string {
  return (
    process.env.CRM_PENDING_DIR?.trim() ||
    path.join(process.cwd(), "data", "crm-pending")
  );
}

function jobFilename(quoteRef: string): string {
  const safe = quoteRef.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40) || "job";
  return `${safe}.json`;
}

export async function enqueueCrmLead(
  job: Omit<PendingCrmJob, "attempts" | "createdAt"> & {
    attempts?: number;
    createdAt?: string;
  },
): Promise<string | null> {
  const record: PendingCrmJob = {
    quoteRef: job.quoteRef,
    input: job.input,
    alertTo: job.alertTo,
    createdAt: job.createdAt ?? new Date().toISOString(),
    attempts: job.attempts ?? 0,
    lastError: job.lastError,
  };
  const body = JSON.stringify(record, null, 2);
  const name = jobFilename(record.quoteRef);

  if (process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
    const { put } = await import("@vercel/blob");
    const key = `${BLOB_PREFIX}/${name}`;
    await put(key, body, {
      access: "private",
      contentType: "application/json",
      allowOverwrite: true,
    });
    return key;
  }

  if (process.env.VERCEL === "1") {
    console.error(
      `[crm-pending] cannot enqueue ${record.quoteRef} — BLOB_READ_WRITE_TOKEN missing on Vercel`,
    );
    return null;
  }

  const dir = diskRoot();
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, name);
  await writeFile(file, body, "utf8");
  return file;
}

async function listDiskJobs(): Promise<PendingCrmJob[]> {
  const dir = diskRoot();
  let names: string[];
  try {
    names = await readdir(dir);
  } catch {
    return [];
  }
  const jobs: PendingCrmJob[] = [];
  for (const name of names) {
    if (!name.endsWith(".json")) continue;
    try {
      const raw = await readFile(path.join(dir, name), "utf8");
      jobs.push(JSON.parse(raw) as PendingCrmJob);
    } catch {
      /* skip corrupt */
    }
  }
  return jobs;
}

async function listBlobJobs(): Promise<
  Array<PendingCrmJob & { blobPath: string }>
> {
  const { list, get } = await import("@vercel/blob");
  const { blobs } = await list({ prefix: `${BLOB_PREFIX}/` });
  const out: Array<PendingCrmJob & { blobPath: string }> = [];
  for (const blob of blobs) {
    try {
      const got = await get(blob.pathname, {
        access: "private",
        useCache: false,
      });
      if (!got?.stream) continue;
      const raw = await new Response(got.stream).text();
      const job = JSON.parse(raw) as PendingCrmJob;
      out.push({ ...job, blobPath: blob.pathname });
    } catch {
      /* skip */
    }
  }
  return out;
}

async function removeJob(quoteRef: string, blobPath?: string): Promise<void> {
  if (blobPath) {
    const { del } = await import("@vercel/blob");
    await del(blobPath);
    return;
  }
  try {
    await unlink(path.join(diskRoot(), jobFilename(quoteRef)));
  } catch {
    /* already gone */
  }
}

/**
 * Drain pending CRM creates. Returns counts for the cron response.
 */
export async function retryPendingCrmLeads(limit = 20): Promise<{
  attempted: number;
  succeeded: number;
  failed: number;
  skipped: number;
}> {
  const { createCrmLead, isOdooConfigured } = await import("./odoo");
  if (!isOdooConfigured()) {
    return { attempted: 0, succeeded: 0, failed: 0, skipped: 0 };
  }

  const useBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
  const blobJobs = useBlob ? await listBlobJobs() : [];
  const diskJobs = useBlob ? [] : await listDiskJobs();

  type Item = PendingCrmJob & { blobPath?: string };
  const items: Item[] = [
    ...blobJobs,
    ...diskJobs.map((j) => ({ ...j, blobPath: undefined as string | undefined })),
  ]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .slice(0, limit);

  let succeeded = 0;
  let failed = 0;
  let skipped = 0;

  for (const item of items) {
    if (item.attempts >= MAX_ATTEMPTS) {
      skipped += 1;
      continue;
    }
    try {
      const leadId = await createCrmLead(item.input);
      await removeJob(item.quoteRef, item.blobPath);
      succeeded += 1;
      console.info(
        `[crm-pending] retry ok quoteRef=${item.quoteRef} lead=#${leadId}`,
      );
    } catch (err) {
      failed += 1;
      const lastError = err instanceof Error ? err.message : String(err);
      console.error(
        `[crm-pending] retry failed quoteRef=${item.quoteRef}:`,
        lastError,
      );
      await enqueueCrmLead({
        quoteRef: item.quoteRef,
        input: item.input,
        alertTo: item.alertTo,
        createdAt: item.createdAt,
        attempts: item.attempts + 1,
        lastError,
      });
    }
  }

  return {
    attempted: items.length,
    succeeded,
    failed,
    skipped,
  };
}
