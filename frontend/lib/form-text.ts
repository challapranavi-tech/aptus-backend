import type { FocusEvent } from "react";

/**
 * Drop leading/trailing spaces when leaving a text field so values like
 * "  Ada  " become "Ada" before submit validation.
 */
export function trimFieldOnBlur(
  event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
): void {
  const el = event.currentTarget;
  const next = el.value.trim();
  if (next !== el.value) el.value = next;
}

/** Trim every string entry in a form payload (keeps File / Blob values). */
export function trimFormStrings<T extends Record<string, unknown>>(payload: T): T {
  const next = { ...payload } as Record<string, unknown>;
  for (const [key, value] of Object.entries(next)) {
    if (typeof value === "string") next[key] = value.trim();
  }
  return next as T;
}
