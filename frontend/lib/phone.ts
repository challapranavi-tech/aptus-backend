/**
 * Phone dial-code helpers.
 * Free-text fields: collapse repeated "+CC" prefixes.
 * Dropdown fields: keep the local input dial-code-free, then compose E.164 once.
 */

/** Collapse "+968+968…" (and whitespace variants) to a single "+968…". */
export function normalizePhone(raw: string): string {
  let value = raw.trim();
  for (;;) {
    const prefixMatch = /^(\+\d{1,4})(.*)$/.exec(value);
    if (!prefixMatch) return value;
    const prefix = prefixMatch[1];
    const rest = prefixMatch[2].trim();
    if (!rest.startsWith(prefix)) return value;
    value = prefix + rest.slice(prefix.length);
  }
}

/**
 * Local digits only for a selected dial code.
 * - Always strips a leading "+CC" / repeated "+CC+CC".
 * - Strips a leading digit-only "CC" only when `localLength` is known and the
 *   value is longer than that length (avoids India locals that start with "91").
 */
export function toLocalPhoneDigits(
  raw: string,
  dialCode: string,
  localLength?: number,
): string {
  const cc = dialCode.replace(/\D/g, "");
  if (!cc) return raw.replace(/\D/g, "");

  const compact = raw.replace(/[\s().-]/g, "");
  let digits: string;

  if (compact.startsWith("+")) {
    const normalized = normalizePhone(compact);
    digits = normalized.startsWith(`+${cc}`)
      ? normalized.slice(1 + cc.length).replace(/\D/g, "")
      : normalized.replace(/\D/g, "");
  } else {
    digits = compact.replace(/\D/g, "");
  }

  if (localLength == null) return digits;

  while (digits.startsWith(cc) && digits.length > localLength) {
    const rest = digits.slice(cc.length);
    if (rest.length < Math.min(localLength, 6)) break;
    digits = rest;
  }
  return digits;
}

/** Compose a single E.164 value from dial code + local/full user input. */
export function toE164(dialCode: string, localOrFull: string, localLength?: number): string {
  const cc = dialCode.startsWith("+") ? dialCode : `+${dialCode.replace(/\D/g, "")}`;
  const local = toLocalPhoneDigits(localOrFull, cc, localLength);
  return normalizePhone(`${cc}${local}`);
}
