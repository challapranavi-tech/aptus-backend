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
function siteBaseUrl(): string {
  const fromEnv =
    process.env.APTUS_FRONTEND_URL?.split(",")[0]?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    "https://www.aptusinfotech.com";
  return fromEnv.replace(/\/$/, "");
}

/** Customer thank-you — matches portal formatEnquiryThankYouEmail (Email_Comm.docx). */
export function formatEnquiryThankYouEmail(input: {
  customerName: string;
  enquiryId: string;
  productName: string;
  enquiryDate: string;
  enquirySummary: string;
  portalUrl?: string;
}): EnquiryEmailContent {
  const portalUrl = input.portalUrl ?? siteBaseUrl();
  return {
    subject: "Thank You for Contacting Aptus Infotech",
    text: [
      `Dear ${input.customerName},`,
      "",
      "Thank you for contacting Aptus Infotech.",
      "",
      `We have received your enquiry regarding ${input.productName} and our team is currently reviewing your request.`,
      "",
      "A member of our team will get back to you shortly with the information you need.",
      "",
      "Enquiry Details",
      `Enquiry Reference: ${input.enquiryId}`,
      `Product/Service: ${input.productName}`,
      `Date: ${input.enquiryDate}`,
      `Your Message: ${input.enquirySummary}`,
      "",
      "If you have any additional information or specific requirements that you would like us to consider, please feel free to reply to this email.",
      "",
      "We appreciate your interest in Aptus Infotech and look forward to assisting you.",
      "",
      "Best regards,",
      "Aptus Infotech Team",
      portalUrl,
      "info@aptusinfotech.com | +968 9941 8481",
    ].join("\n"),
  };
}

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
