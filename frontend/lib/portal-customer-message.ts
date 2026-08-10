/** Prefix customer-entered text with a leading space for Odoo Notes display. */
export function formatCustomerMessageForOdoo(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) return "";
  return ` ${trimmed}`;
}

export function formatCustomerMessageForOdooOptional(
  message: string | undefined,
): string | undefined {
  if (!message?.trim()) return undefined;
  return formatCustomerMessageForOdoo(message);
}
