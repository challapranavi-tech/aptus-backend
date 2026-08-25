import { formatMuscatDateTime } from "@/lib/contact-routing";
import type { EnquiryRequest } from "@shared/lib/enquiry-request";

export function contactEnquiryInbox(): string {
  return process.env.CONTACT_TO_EMAIL?.trim() || "info@aptusinfotech.com";
}

export type EnquiryEmailContent = {
  subject: string;
  text: string;
};

/**
 * Dedicated Contact Form notification — independent of Request Quote mail.
 * `enquiryRef` may be null when Odoo sequence/partner sync failed (email still sent).
 */
export function formatContactEnquiryEmail(
  data: EnquiryRequest,
  enquiryRef: string | null,
  submittedAt = new Date(),
): EnquiryEmailContent {
  const name = [data.first_name, data.last_name].filter(Boolean).join(" ");
  const refLine = enquiryRef?.trim() || "(unavailable — Odoo sync failed)";
  return {
    subject: enquiryRef?.trim()
      ? `New Website Enquiry - ${enquiryRef.trim()}`
      : `New Website Enquiry from ${name}`,
    text: [
      `Enquiry Reference: ${refLine}`,
      `Name: ${name}`,
      `City: ${data.city}`,
      `Country: ${data.country}`,
      `Email: ${data.email}`,
      `Phone: ${data.phone}`,
      `How Did You Hear About Us: ${data.heard_from}`,
      `Message: ${data.message}`,
      `Date & Time: ${formatMuscatDateTime(submittedAt)}`,
      `Source: Website Contact Form`,
    ].join("\n"),
  };
}

/** Customer acknowledgement after Request Quote / enquiry submit. */
export function formatEnquiryThankYouEmail(opts: {
  customerName: string;
  enquiryId: string;
  productName: string;
  enquiryDate: string;
  enquirySummary: string;
}): EnquiryEmailContent {
  const name = opts.customerName.trim() || "there";
  return {
    subject: "Thank You for Contacting Aptus Infotech",
    text: [
      `Dear ${name},`,
      ``,
      `Thank you for contacting Aptus Infotech. We have received your request.`,
      ``,
      `Reference: ${opts.enquiryId}`,
      `Product / Topic: ${opts.productName}`,
      `Date: ${opts.enquiryDate}`,
      ``,
      `Summary:`,
      opts.enquirySummary,
      ``,
      `Our team will get back to you shortly.`,
      ``,
      `Best regards,`,
      `Aptus Infotech`,
    ].join("\n"),
  };
}
