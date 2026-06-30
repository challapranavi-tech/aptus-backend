import { logger } from "../logger";
import type { OdooClient } from "./client";

export function getCrmLeadNotesFieldName(): string {
  return process.env.ODOO_CRM_LEAD_NOTES_FIELD?.trim() || "description";
}

/**
 * The portal currently sends one big string containing order metadata
 * (reference, customer details, product lines, payment status, etc.)
 * followed by the actual free-text customer message, e.g.:
 *
 *   "...Total quantity: 1 Payment Status: Pending approval (payment
 *   collected after backend approval) Payment reference: — Action
 *   required: Review this request within 48 hours. Customer message
 *   this is a test message Total line items: 1 ..."
 *
 * NOTE: In the sample you shared, "Customer message" appears BEFORE
 * "Total line items" in display order but the raw text in image 2
 * shows it interleaved with other fields. This extraction assumes the
 * customer's message is the free text that immediately follows the
 * literal label "Customer message" and ends at the next known field
 * label (or end of string). If the upstream payload format differs,
 * this regex needs the real label list updated.
 *
 * This is a stopgap. The correct fix is to stop concatenating
 * everything into one string at the source (wherever `content` is
 * built before calling persistCrmLeadNotes) and pass the customer
 * message as its own field. Patching here means every new field added
 * upstream risks leaking into Notes again.
 */
const KNOWN_FIELD_LABELS = [
  "New software subscription order from the Aptus Customer Portal",
  "Order Reference",
  "Subscription Duration",
  "Customer Details",
  "Name",
  "Company",
  "Customer Email",
  "Phone",
  "Location",
  "Contact Information",
  "Contact Name",
  "Contact Email",
  "Contact Phone",
  "Products Selected",
  "Customer message",
  "Total line items",
  "Total quantity",
  "Payment Status",
  "Payment reference",
  "Action required",
];

function extractCustomerMessage(raw: string): string | null {
  const marker = "Customer message";
  const startIdx = raw.indexOf(marker);
  if (startIdx === -1) return null;

  const afterMarker = raw.slice(startIdx + marker.length).trimStart();

  // Find the next known field label after the message text to know where it ends.
  let endIdx = afterMarker.length;
  for (const label of KNOWN_FIELD_LABELS) {
    if (label === marker) continue;
    const idx = afterMarker.indexOf(label);
    if (idx !== -1 && idx < endIdx) {
      endIdx = idx;
    }
  }

  const message = afterMarker.slice(0, endIdx).trim();
  return message.length > 0 ? message : null;
}

/**
 * Returns only the customer's free-text message, stripped of order
 * metadata. Falls back to the original content if no "Customer message"
 * marker is found, so legitimate non-order notes aren't silently dropped.
 */
export function filterToCustomerMessage(content: string): string {
  const trimmed = content.trim();
  const extracted = extractCustomerMessage(trimmed);
  return extracted ?? trimmed;
}

/** Write portal text into the CRM lead Notes field (`description` by default). */
export async function writeCrmLeadNotes(
  client: OdooClient,
  leadId: number,
  content: string,
  mode: "replace" | "append" = "replace",
): Promise<boolean> {
  const field = getCrmLeadNotesFieldName();
  const trimmed = content.trim();
  if (!trimmed) return true;

  let value = trimmed;
  if (mode === "append") {
    const rows = await client.read<Record<string, string | false>>("crm.lead", [leadId], [field]);
    const prior = rows[0]?.[field];
    const priorText = typeof prior === "string" ? prior.trim() : "";
    value = priorText ? `${priorText}\n\n${trimmed}` : trimmed;
  }

  await client.write("crm.lead", [leadId], { [field]: value });

  const verify = await client.read<Record<string, string | false>>("crm.lead", [leadId], [field]);
  const stored = verify[0]?.[field];
  return typeof stored === "string" && stored.trim().length > 0;
}

async function postCrmLeadChatterNote(
  client: OdooClient,
  leadId: number,
  body: string,
  action: string,
): Promise<void> {
  const trimmed = body.trim();
  if (!trimmed) return;

  try {
    await client.call("crm.lead", "message_post", {
      ids: [leadId],
      body: trimmed.replace(/\n/g, "<br/>"),
      message_type: "comment",
      subtype_xmlid: "mail.mt_comment",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "message_post failed";
    logger.warn("CRM lead chatter post failed (non-fatal)", {
      action,
      leadId,
      error: message,
    });
  }
}

export async function persistCrmLeadNotes(
  client: OdooClient,
  leadId: number,
  content: string,
  action: string,
  mode: "replace" | "append" = "replace",
  options?: { skipChatter?: boolean },
): Promise<void> {
  const trimmed = content.trim();
  if (!trimmed) return;

  // Only the customer's own message goes into Notes / chatter now.
  // Full order metadata is dropped here, not just hidden — if you need
  // it for audits, log it separately (see logger.info call below) or
  // route it elsewhere instead of deleting this filtering step.
  const noteContent = filterToCustomerMessage(trimmed);

  logger.info("CRM lead Notes content filtered", {
    action,
    leadId,
    originalLength: trimmed.length,
    filteredLength: noteContent.length,
    droppedMetadata: noteContent !== trimmed,
  });

  try {
    const notesOk = await writeCrmLeadNotes(client, leadId, noteContent, mode);
    if (notesOk) {
      logger.info("CRM lead Notes updated", {
        action,
        leadId,
        field: getCrmLeadNotesFieldName(),
        mode,
        length: noteContent.length,
      });
    } else {
      logger.warn("CRM lead Notes field empty after write", {
        action,
        leadId,
        field: getCrmLeadNotesFieldName(),
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "CRM lead Notes write failed";
    logger.warn("CRM lead Notes update failed", {
      action,
      leadId,
      field: getCrmLeadNotesFieldName(),
      error: message,
    });
  }

  if (!options?.skipChatter) {
    await postCrmLeadChatterNote(client, leadId, noteContent, action);
  }
}