import { resolveClientIp } from "./client-ip";

export type LogLevel = "info" | "warn" | "error";

export type LogContext = {
  traceId?: string;
  userId?: string;
  action?: string;
  ip?: string;
  [key: string]: unknown;
};

function emit(level: LogLevel, message: string, context?: LogContext): void {
  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    ...context,
  };
  const line = JSON.stringify(entry);
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.info(line);
  }
}

export const logger = {
  info(message: string, context?: LogContext): void {
    emit("info", message, context);
  },
  warn(message: string, context?: LogContext): void {
    emit("warn", message, context);
  },
  error(message: string, context?: LogContext): void {
    emit("error", message, context);
  },
};

/**
 * Resolves the caller's address for logging and audit records. Delegates to the
 * shared resolver so a forged `X-Forwarded-For` cannot poison the audit trail
 * with an address that was never rate limited.
 */
export function getClientIp(request: Request): string {
  return resolveClientIp(request).ip;
}
