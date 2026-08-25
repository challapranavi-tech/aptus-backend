import { corsPreflight, jsonCors, withCors } from "@/lib/api-cors";
import {
  formatMuscatDateTime,
  resolveContactRouting,
} from "@/lib/contact-routing";
import { formatEnquiryThankYouEmail } from "@/lib/enquiry-email";
import { reportCrmLeadFailure } from "@/lib/crm-failure";
import { newQuoteRef } from "@/lib/crm-pending";
import { requireJsonContentType, validationError } from "@/lib/api-validate";
import { isMailConfigured, sendEmail, type MailAttachment } from "@/lib/mail";
import {
  attachFilesToCrmLead,
  createCrmLead,
  crmLeadFormUrl,
  isOdooConfigured,
  nextRequestQuoteRef,
} from "@/lib/odoo";
import {
  enforceKeyRateLimit,
  identityKey,
} from "@/lib/rate-limit-http";
import {
  MAX_QUOTE_ATTACHMENT_BYTES,
  parseContactRequest,
  quoteAttachmentExtensionOk,
  type ContactRequest,
} from "@shared/lib/contact-request";
import { sanitizeFilename } from "@shared/lib/schema";
import { NextRequest } from "next/server";

/** Allow email + Odoo CRM create on Vercel (default hobby limit is too short). */
export const maxDuration = 60;

/** Reject multi-MB JSON abuse before parse (quote forms are a few KB). */
const MAX_CONTACT_BODY_BYTES = 32 * 1024;
/** Multipart (fields + optional attachment) — stay under Vercel ~4.5 MB. */
const MAX_MULTIPART_BYTES = Math.round(4.5 * 1024 * 1024);

export async function OPTIONS(req: NextRequest) {
  return corsPreflight(req) ?? new Response(null, { status: 405 });
}

async function fileToMailAttachment(file: File): Promise<MailAttachment> {
  const buf = Buffer.from(await file.arrayBuffer());
  return {
    filename: sanitizeFilename(file.name) || "attachment",
    content: buf,
    contentType: file.type || "application/octet-stream",
  };
}

function buildSalesEmail(opts: {
  data: ContactRequest;
  quoteRef: string;
  categoryLabel: string;
  submittedAt: string;
  attachmentName?: string;
  crmLeadUrl?: string;
}): { subject: string; text: string; html: string } {
  const {
    data,
    quoteRef,
    categoryLabel,
    submittedAt,
    attachmentName,
    crmLeadUrl,
  } = opts;
  const isTyped =
    data.customer_type === "individual" || data.customer_type === "company";
  const displayName =
    data.customer_type === "company"
      ? data.company || data.name
      : data.name || [data.first_name, data.last_name].filter(Boolean).join(" ");
  const productLabel = data.product || "General";

  const subject = isTyped
    ? `New Request Quote – ${productLabel} – ${displayName}`
    : data.product && data.product !== "Others"
      ? `New quote request ${quoteRef} from ${displayName} (${categoryLabel})`
      : `New contact message ${quoteRef} from ${displayName}`;

  const crmLine = crmLeadUrl
    ? `Odoo CRM: ${crmLeadUrl}`
    : null;

  const lines: string[] =
    data.customer_type === "individual"
      ? [
          `Quote Ref: ${quoteRef}`,
          `Customer Type: Individual`,
          `Name: ${data.name}`,
          `Phone Number: ${data.phone_local}`,
          `Country Code: ${data.country_code}`,
          `Full Phone: ${data.phone}`,
          `Email ID: ${data.email}`,
          `Profession: ${data.profession}`,
          `Software Products: ${data.product}`,
          `Quantity: ${data.qty}`,
          `Attachment: ${attachmentName || "—"}`,
          `Comments: ${data.message || "—"}`,
          `Product Category: ${categoryLabel}`,
          `Submission date/time: ${submittedAt}`,
          `Source: Website – Request Quote`,
          ...(crmLine ? [crmLine] : []),
        ]
      : data.customer_type === "company"
        ? [
            `Quote Ref: ${quoteRef}`,
            `Customer Type: Company`,
            `Company Name: ${data.company}`,
            `Name: ${data.name}`,
            `Tax ID: ${data.tax_id}`,
            `CR Number: ${data.cr_number}`,
            `Phone Number: ${data.phone_local}`,
            `Country Code: ${data.country_code}`,
            `Full Phone: ${data.phone}`,
            `Software Products: ${data.product}`,
            `Quantity: ${data.qty}`,
            `Attachment: ${attachmentName || "—"}`,
            `Comments: ${data.message || "—"}`,
            `Product Category: ${categoryLabel}`,
            `Submission date/time: ${submittedAt}`,
            `Source: Website – Request Quote`,
            ...(crmLine ? [crmLine] : []),
          ]
        : [
            `Quote Ref: ${quoteRef}`,
            `Customer Name: ${displayName}`,
            `Company Name: ${data.company}`,
            `Email: ${data.email}`,
            `Phone: ${data.phone}`,
            `Product Name: ${data.product || "—"}`,
            `QTY: ${data.qty || "—"}`,
            `Product Category: ${categoryLabel}`,
            `Date & Time: ${submittedAt}`,
            `Source: Website – Request Quote`,
            ...(crmLine ? [crmLine] : []),
            "",
            data.message || "(no message)",
          ];

  const text = lines.join("\n");
  const crmHtml = crmLeadUrl
    ? `<p style="font-family:system-ui,sans-serif;font-size:14px;margin:16px 0 0"><a href="${crmLeadUrl.replace(/&/g, "&amp;").replace(/"/g, "&quot;")}" style="color:#0b3d91;font-weight:600">Open in Odoo CRM</a></p>`
    : "";
  const html = `<pre style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.5;white-space:pre-wrap">${text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")}</pre>${crmHtml}`;

  return { subject, text, html };
}

export async function POST(req: NextRequest) {
  const preflight = corsPreflight(req);
  if (preflight) return preflight;

  const contentType = (req.headers.get("content-type") ?? "").toLowerCase();
  const isMultipart = contentType.includes("multipart/form-data");

  let raw: unknown;
  let mailAttachment: MailAttachment | undefined;
  let attachmentName: string | undefined;

  if (isMultipart) {
    const contentLength = Number(req.headers.get("content-length") ?? "0");
    if (contentLength > MAX_MULTIPART_BYTES) {
      return jsonCors(
        req,
        { error: "Request body too large." },
        { status: 413 },
      );
    }

    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return validationError(
        { _form: "Invalid form data." },
        (res) => withCors(res, req),
      );
    }

    const fields: Record<string, string> = {};
    form.forEach((value, key) => {
      if (typeof value === "string") fields[key] = value;
    });
    raw = fields;

    const file = form.get("attachment");
    if (file instanceof File && file.size > 0) {
      if (!quoteAttachmentExtensionOk(file.name)) {
        return validationError(
          {
            attachment:
              "Unsupported file type. Use PDF, Word, Excel, image, or ZIP.",
          },
          (res) => withCors(res, req),
        );
      }
      if (file.size > MAX_QUOTE_ATTACHMENT_BYTES) {
        return validationError(
          { attachment: "Attachment must be 2 MB or smaller." },
          (res) => withCors(res, req),
        );
      }
      mailAttachment = await fileToMailAttachment(file);
      attachmentName = mailAttachment.filename;
    }
  } else {
    const ctError = requireJsonContentType(req);
    if (ctError) {
      return validationError(ctError, (res) => withCors(res, req));
    }

    const contentLength = Number(req.headers.get("content-length") ?? "0");
    if (contentLength > MAX_CONTACT_BODY_BYTES) {
      return jsonCors(
        req,
        { error: "Request body too large." },
        { status: 413 },
      );
    }

    try {
      const text = await req.text();
      if (text.length > MAX_CONTACT_BODY_BYTES) {
        return jsonCors(
          req,
          { error: "Request body too large." },
          { status: 413 },
        );
      }
      raw = JSON.parse(text) as unknown;
    } catch {
      return validationError(
        { _form: "Invalid JSON body." },
        (res) => withCors(res, req),
      );
    }
  }

  const parsed = parseContactRequest(raw);
  if (!parsed.ok) {
    return validationError(parsed.errors, (res) => withCors(res, req));
  }

  const data = parsed.data;
  const {
    first_name,
    last_name,
    email,
    company,
    phone,
    product,
    qty,
    message,
    category,
    customer_type,
    name,
    profession,
    tax_id,
    cr_number,
    country_code,
    phone_local,
  } = data;

  const rateKey = email || phone || "anonymous";
  const emailLimited = await enforceKeyRateLimit(
    identityKey(rateKey),
    "publicWriteIdentity",
    "contact",
    (res) => withCors(res, req),
  );
  if (emailLimited) return emailLimited;

  if (!isMailConfigured()) {
    console.error("[contact] RESEND_API_KEY is not configured.");
    return jsonCors(
      req,
      { error: "Email service is not configured. Please try again later." },
      { status: 500 },
    );
  }

  const routing = resolveContactRouting({
    product,
    categoryHint: category,
  });
  const displayName =
    name || [first_name, last_name].filter(Boolean).join(" ");
  const isQuote = Boolean(
    product &&
      product !== "Others" &&
      (customer_type === "individual" ||
        customer_type === "company" ||
        Boolean(product)),
  );
  const isTypedQuote =
    customer_type === "individual" || customer_type === "company";

  let quoteRef: string;
  if ((isQuote || isTypedQuote) && isOdooConfigured()) {
    try {
      quoteRef = await nextRequestQuoteRef();
      console.info(`[contact] Odoo quoteRef=${quoteRef}`);
    } catch (err) {
      quoteRef = newQuoteRef();
      console.error(
        `[contact] request.quote sequence failed; using JS fallback quoteRef=${quoteRef}:`,
        err instanceof Error ? err.message : err,
      );
    }
  } else {
    quoteRef = newQuoteRef();
  }

  console.info(
    `[contact] routing category=${routing.category} categoryLabel=${routing.categoryLabel} to=${routing.to} quoteRef=${quoteRef} customer_type=${customer_type || "legacy"}`,
  );

  const submittedAt = formatMuscatDateTime();
  const crmInput = {
    firstName: first_name,
    lastName: last_name,
    company: customer_type === "individual" ? "" : company,
    email: email || "",
    phone,
    product,
    qty,
    category: routing.category,
    categoryLabel: routing.categoryLabel,
    message,
    quoteRef,
    customerType: customer_type || undefined,
    profession: customer_type === "individual" ? profession : "",
    // Tax ID / CR belong only on Company quotes (Odoo tax field).
    vatId: customer_type === "company" ? tax_id : "",
    crNumber: customer_type === "company" ? cr_number : "",
    countryCode: country_code,
    phoneLocal: phone_local,
    contactName: name || undefined,
    attachmentName,
  };

  // Create Odoo CRM before the sales email so the mail can include a CRM link.
  // Typed Request Quote fails hard if CRM create fails; legacy quotes continue.
  let crmSynced = false;
  let leadId: number | undefined;
  let crmError: string | undefined;
  let pendingCrmFailure: unknown;
  const shouldCreateCrm = (isQuote || isTypedQuote) && isOdooConfigured();

  if (shouldCreateCrm) {
    try {
      leadId = await createCrmLead(crmInput);
      crmSynced = true;
      console.info(
        `[contact] crm.lead #${leadId} created quoteRef=${quoteRef} category=${routing.category}`,
      );
      if (mailAttachment && leadId) {
        try {
          await attachFilesToCrmLead(leadId, [
            {
              filename: mailAttachment.filename,
              content: mailAttachment.content,
              contentType: mailAttachment.contentType,
            },
          ]);
        } catch (attachErr) {
          console.error(
            `[contact] CRM attachment failed lead=#${leadId}:`,
            attachErr instanceof Error ? attachErr.message : attachErr,
          );
        }
      }
    } catch (err) {
      crmError = err instanceof Error ? err.message : String(err);
      pendingCrmFailure = err;
    }
  } else if (!isQuote && !isTypedQuote) {
    console.info(
      `[contact] CRM skipped (not a quote product) quoteRef=${quoteRef} product=${product || "—"}`,
    );
  } else if (!isOdooConfigured()) {
    crmError = "Odoo is not configured";
    console.warn(
      `[contact] CRM skipped (Odoo not configured) quoteRef=${quoteRef}`,
    );
  }

  const salesMail = buildSalesEmail({
    data,
    quoteRef,
    categoryLabel: routing.categoryLabel,
    submittedAt,
    attachmentName,
    crmLeadUrl: leadId ? crmLeadFormUrl(leadId) : undefined,
  });

  const result = await sendEmail({
    to: routing.to,
    replyTo: email || undefined,
    subject: salesMail.subject,
    text: salesMail.text,
    html: salesMail.html,
    attachments: mailAttachment ? [mailAttachment] : undefined,
  });
  if (!result.ok) {
    console.error("[contact] sales email failed:", result.error);
    // If CRM already succeeded, do not fail the customer — log and continue.
    if (!crmSynced) {
      return jsonCors(req, { error: "Failed to send." }, { status: 502 });
    }
  }

  if (email) {
    const thankYou = formatEnquiryThankYouEmail({
      customerName: displayName,
      enquiryId: quoteRef,
      productName: product || routing.categoryLabel || "General Enquiry",
      enquiryDate: submittedAt,
      enquirySummary: message || "(no message)",
    });
    const thankYouResult = await sendEmail({
      to: email,
      subject: thankYou.subject,
      text: thankYou.text,
    });
    if (!thankYouResult.ok) {
      console.warn(
        `[contact] customer thank-you failed quoteRef=${quoteRef}:`,
        thankYouResult.error,
      );
    }
  }

  if (pendingCrmFailure) {
    await reportCrmLeadFailure({
      quoteRef,
      input: crmInput,
      alertTo: routing.to,
      error: pendingCrmFailure,
      customerNotified: true,
    });
  }

  return jsonCors(req, {
    ok: true,
    quoteRef,
    crmSynced,
    ...(process.env.NODE_ENV !== "production" && crmError
      ? { crmError }
      : {}),
  });
}