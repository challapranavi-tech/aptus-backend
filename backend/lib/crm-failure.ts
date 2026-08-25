/**
 * After sales email succeeds but crm.lead create fails:
 * log (no PII), enqueue for later retry, alert the sales inbox.
 */
import { enqueueCrmLead } from "./crm-pending";
import { sendEmail } from "./mail";
import type { CrmLeadInput } from "./odoo/crm";

export async function reportCrmLeadFailure(opts: {
  quoteRef: string;
  input: CrmLeadInput;
  alertTo: string;
  error: unknown;
  /** False when the HTTP handler failed closed before thank-you / sales quote mail. */
  customerNotified?: boolean;
}): Promise<void> {
  const errMsg =
    opts.error instanceof Error ? opts.error.message : String(opts.error);

  console.error(
    `[contact] crm.lead create failed quoteRef=${opts.quoteRef}:`,
    errMsg,
  );

  let queued: string | null = null;
  try {
    queued = await enqueueCrmLead({
      quoteRef: opts.quoteRef,
      input: opts.input,
      alertTo: opts.alertTo,
      lastError: errMsg,
    });
  } catch (enqueueErr) {
    console.error(
      `[contact] crm-pending enqueue failed quoteRef=${opts.quoteRef}:`,
      enqueueErr instanceof Error ? enqueueErr.message : enqueueErr,
    );
  }

  const product = opts.input.product?.trim() || "—";
  const company = opts.input.company.trim() || "—";
  const notified = opts.customerNotified === true;
  const alert = await sendEmail({
    to: opts.alertTo,
    subject: `CRM Lead creation failed for Quote #${opts.quoteRef}. Please review.`,
    text: [
      `CRM Lead creation failed for Quote #${opts.quoteRef}.`,
      ``,
      notified
        ? `The customer already received confirmation and the sales quote email was sent.`
        : `The website request was received, but the CRM lead was not created. The customer was not told it succeeded.`,
      `Please create the CRM lead manually if it does not appear after automatic retry.`,
      ``,
      `Product: ${product}`,
      `Company: ${company}`,
      `QTY: ${opts.input.qty?.trim() || "—"}`,
      `Category: ${opts.input.categoryLabel?.trim() || "—"}`,
      `Queued for retry: ${queued ? "yes" : "no (check Blob / disk config)"}`,
      `Error: ${errMsg}`,
    ].join("\n"),
  });

  if (!alert.ok) {
    console.error(
      `[contact] CRM failure alert email failed quoteRef=${opts.quoteRef}:`,
      alert.error,
    );
  }
}
