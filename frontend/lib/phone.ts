/** Strip formatting; keep a single leading + and digits (E.164-style). */
export function normalizePhone(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return hasPlus ? "+" : "";

  return hasPlus ? `+${digits}` : digits;
}
