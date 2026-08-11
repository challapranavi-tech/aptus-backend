import fs from "fs";
import path from "path";
import { logger } from "./logger";

/** Serverless filesystems (Vercel) are read-only outside /tmp. */
const READ_ONLY_FS_CODES = new Set(["EROFS", "EACCES", "EPERM"]);

/**
 * Writes a local JSON cache under .data. These files mirror state whose source
 * of truth is Odoo (or Upstash), so on a read-only filesystem the write is
 * skipped instead of throwing — a missing dev cache must never fail a live
 * request. Any other error (corrupt path, out of space) still propagates.
 */
export function writeJsonStore(filePath: string, data: unknown): void {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  } catch (error) {
    const code = (error as NodeJS.ErrnoException)?.code;
    if (!code || !READ_ONLY_FS_CODES.has(code)) throw error;
    logger.warn("Skipped local JSON store write on read-only filesystem", {
      file: path.basename(filePath),
      code,
    });
  }
}
