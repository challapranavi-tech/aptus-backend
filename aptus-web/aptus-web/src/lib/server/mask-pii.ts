/** Mask email for display, e.g. j***@company.com */
export function maskEmail(email: string): string {
  const trimmed = email.trim();
  if (!trimmed || !trimmed.includes("@")) return "****@****.***";
  const [local, domain] = trimmed.split("@");
  if (!local || !domain) return "****@****.***";
  const visible = local.slice(0, 1);
  return `${visible}***@${domain}`;
}

/** Mask phone for display, e.g. +968 XXXXXXXX */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "+968 XXXXXXXX";
  if (phone.trim().startsWith("+")) {
    const prefix = phone.trim().slice(0, 4);
    return `${prefix} XXXXXXXX`;
  }
  if (digits.length <= 4) return "XXXX";
  return `+${digits.slice(0, 3)} XXXXXXXX`;
}
