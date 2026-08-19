/**
 * order-notification.ts
 *
 * All customer-facing and internal email templates for the Aptus Infotech portal.
 * Email content matches the approved Email_Comm.docx scenarios.
 *
 * Placeholders in the doc that are dynamic are resolved by callers before calling
 * these functions, then injected as typed input fields.
 */

import { getProductConfig } from "@/data/product-options";
import { lookupPortalSku } from "@/data/software-purchase-catalog";
import {
  purchaseTypeLabel,
  resolveLineLevel,
  resolveLinePackage,
} from "@/lib/portal-cart-checkout";
import type { ClientProfile } from "./types";

export type OrderLineItem = {
  category: string;
  productName: string;
  quantity: number;
  /** Per-line term; falls back to order-level duration when omitted. */
  duration?: "1year" | "3year";
  purchaseType?: "new" | "renew";
  packageId?: string;
  levelId?: string;
  serialNumber?: string;
};

export type ProductOrderPayload = {
  duration: "1year" | "3year";
  items: OrderLineItem[];
  contact: {
    name: string;
    email: string;
    phone: string;
    company: string;
  };
  customerMessage?: string;
  payment?: {
    paymentIntentId?: string;
    amountPaid?: number;
    paymentMethod?: string;
  };
};

function durationLabel(duration: ProductOrderPayload["duration"]): string {
  return duration === "3year" ? "3 Years" : "Annual";
}

type InternalProductRow = {
  product: string;
  category: string;
  quantity: number;
  licenseType: string;
  term: string;
  packageLabel: string;
  partNumber: string;
  serialNumber: string;
  guidePrice: string;
};

function toInternalProductRow(
  item: OrderLineItem,
  fallbackDuration: ProductOrderPayload["duration"],
  extras?: { guidePrice?: string },
): InternalProductRow {
  const duration = item.duration ?? fallbackDuration;
  const sku = lookupPortalSku(
    item.productName,
    duration,
    item.purchaseType === "renew" ? "renew" : "new",
  );
  const config = getProductConfig(item.productName);
  let licenseType = purchaseTypeLabel(item.purchaseType);
  const term = durationLabel(duration);
  let packageLabel = "";

  if (config.kind === "bundle") {
    licenseType = "Bundle";
  } else if (config.kind === "levels") {
    licenseType = resolveLineLevel(item, config)?.label ?? "Level 1";
    packageLabel = resolveLinePackage(item, config)?.label ?? "";
  } else {
    packageLabel = resolveLinePackage(item, config)?.label ?? "";
  }

  return {
    product: item.productName,
    category: item.category,
    quantity: item.quantity,
    licenseType,
    term,
    packageLabel,
    partNumber: sku?.partNumber ?? "—",
    serialNumber: item.serialNumber?.trim() || "—",
    guidePrice: extras?.guidePrice ?? "",
  };
}

function formatInternalProductRowsText(rows: InternalProductRow[]): string {
  return rows
    .map((row, index) =>
      [
        `  ${index + 1}. ${row.product}`,
        row.category ? `     Category: ${row.category}` : "",
        `     Quantity: ${row.quantity}`,
        `     License type: ${row.licenseType}`,
        `     Term: ${row.term}`,
        row.packageLabel ? `     Package: ${row.packageLabel}` : "",
        `     Part number: ${row.partNumber}`,
        `     Serial number: ${row.serialNumber}`,
        row.guidePrice ? `     Guide price: ${row.guidePrice}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n\n");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatInternalProductRowsHtml(rows: InternalProductRow[]): string {
  const showPackage = rows.some((row) => row.packageLabel);
  const showGuide = rows.some((row) => row.guidePrice);
  const headers = [
    "Product",
    "Category",
    "Quantity",
    "License type",
    "Term",
    ...(showPackage ? ["Package"] : []),
    "Part number",
    "Serial number",
    ...(showGuide ? ["Guide price"] : []),
  ];
  const th = (value: string) =>
    `<th style="border:1px solid #d0d5dd;padding:8px 10px;text-align:left;background:#f2f4f7;font-weight:600;white-space:nowrap;">${escapeHtml(value)}</th>`;
  const td = (value: string) =>
    `<td style="border:1px solid #d0d5dd;padding:8px 10px;vertical-align:top;">${escapeHtml(value)}</td>`;

  const body = rows
    .map((row) => {
      const values = [
        row.product,
        row.category || "—",
        String(row.quantity),
        row.licenseType,
        row.term,
        ...(showPackage ? [row.packageLabel || "—"] : []),
        row.partNumber,
        row.serialNumber,
        ...(showGuide ? [row.guidePrice || "—"] : []),
      ];
      return `<tr>${values.map(td).join("")}</tr>`;
    })
    .join("");

  return `<table role="presentation" style="border-collapse:collapse;border:1px solid #d0d5dd;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.4;width:100%;max-width:760px;margin:8px 0 16px 0;">
  <thead><tr>${headers.map(th).join("")}</tr></thead>
  <tbody>${body}</tbody>
</table>`;
}

function wrapInternalEmailHtml(textBody: string, productsText: string, productsHtml: string): string {
  const placeholder = "__APTUS_PRODUCT_TABLE__";
  const withPlaceholder =
    productsText && textBody.includes(productsText)
      ? textBody.replace(productsText, placeholder)
      : textBody;
  const escaped = escapeHtml(withPlaceholder).replace(/\n/g, "<br/>");
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#1d2939;line-height:1.5">${escaped.replace(
    placeholder,
    productsHtml,
  )}</div>`;
}

// ─── SCENARIO: New User Registration ─────────────────────────────────────────

/**
 * Customer email — sent immediately after account is created.
 * Matches Word doc scenario "New User Registration".
 */
export function formatRegistrationSuccessfulEmail(input: {
  customerName: string;
  email: string;
  registrationDate?: string;
  portalUrl: string;
}): { subject: string; body: string } {
  return {
    subject: "Welcome to Aptus Infotech – Your Account Has Been Created",
    body: [
      `Dear ${input.customerName},`,
      "",
      "Welcome to Aptus Infotech!",
      "",
      "Your account has been successfully created on our website.",
      "",
      "Your Account Details",
      `Name: ${input.customerName}`,
      `Email: ${input.email}`,
      `Registration Date: ${input.registrationDate ?? new Date().toLocaleDateString("en-GB")}`,
      "",
      "You can now log in to your account to manage your profile, view your orders, access your software licenses, download invoices, and track your purchases.",
      "",
      `Login to Your Account: ${input.portalUrl}/login`,
      "",
      "For your security, please do not share your password or login credentials with anyone.",
      "",
      `If you did not create this account, please contact us immediately at info@aptusinfotech.com`,
      "",
      "Thank you for choosing Aptus Infotech.",
      "",
      "Best regards,",
      "Aptus Infotech Team",
      input.portalUrl,
      "info@aptusinfotech.com | +968 9941 8481",
    ].join("\n"),
  };
}

// ─── SCENARIO: Forgot Password – OTP Verification ────────────────────────────

/**
 * Customer email — sent when a password reset OTP is requested.
 * Matches Word doc scenario "Forgot Password – OTP Verification".
 */
export function formatPasswordResetOtpEmail(input: {
  customerName: string;
  otp: string;
  otpValidityMinutes: number;
  resetUrl: string;
  portalUrl: string;
}): { subject: string; body: string } {
  return {
    subject: "Your Aptus Infotech Password Reset OTP",
    body: [
      `Dear ${input.customerName},`,
      "",
      "We received a request to reset the password for your Aptus Infotech account.",
      "",
      "Please use the following One-Time Password (OTP) to verify your identity and reset your password:",
      "",
      `${input.otp}`,
      "",
      `This OTP is valid for ${input.otpValidityMinutes} minutes and can only be used once.`,
      "",
      "Important: Never share this OTP with anyone, including Aptus Infotech employees.",
      "",
      "If you did not request a password reset, please ignore this email and consider securing your account by changing your password.",
      "",
      `Reset Password: ${input.resetUrl}`,
      "",
      "If you believe someone may have accessed your account, please contact us immediately at info@aptusinfotech.com",
      "",
      "Best regards,",
      "Aptus Infotech Security Team",
      input.portalUrl,
      "info@aptusinfotech.com | +968 9941 8481",
    ].join("\n"),
  };
}

// ─── SCENARIO: Password Successfully Changed ──────────────────────────────────

/**
 * Customer email — sent after a password is successfully changed.
 * Matches Word doc scenario "Password successfully changed email".
 */
export function formatPasswordChangedEmail(input: {
  customerName: string;
  email: string;
  dateTime: string;
  device: string;
  location: string;
  secureAccountUrl: string;
  portalUrl: string;
}): { subject: string; body: string } {
  const secureUrl = input.secureAccountUrl;
  return {
    subject: "Your Aptus Infotech Password Has Been Changed",
    body: [
      `Dear ${input.customerName},`,
      "",
      "This is to confirm that the password for your Aptus Infotech account has been successfully changed.",
      "",
      "Account Details",
      `Email: ${input.email}`,
      `Date & Time: ${input.dateTime}`,
      `Device: ${input.device}`,
      `Approximate Location: ${input.location}`,
      "",
      "If you made this change, no further action is required.",
      "",
      "If you did not change your password, your account may have been compromised. Please secure your account immediately by resetting your password and contacting our support team.",
      "",
      `Secure My Account: ${secureUrl}`,
      "",
      "For your security, never share your password or OTP with anyone.",
      "",
      "If you need assistance, please contact us at info@aptusinfotech.com or +968 9941 8481.",
      "",
      "Thank you,",
      "Aptus Infotech Security Team",
      input.portalUrl,
      "info@aptusinfotech.com | +968 9941 8481",
    ].join("\n"),
  };
}

/**
 * @deprecated Use formatPasswordChangedEmail.
 * Left for backwards compatibility with existing callers.
 */
export function formatPasswordResetEmail(input: {
  customerName: string;
  portalUrl: string;
}): { subject: string; body: string } {
  return formatPasswordChangedEmail({
    customerName: input.customerName,
    email: "",
    dateTime: new Date().toLocaleString("en-GB", { timeZone: "Asia/Muscat" }),
    device: "—",
    location: "—",
    secureAccountUrl: `${input.portalUrl}/login`,
    portalUrl: input.portalUrl,
  });
}

// ─── SCENARIO: New Device Login ───────────────────────────────────────────────

/**
 * Customer email — sent when a login is detected from a new or unrecognised device.
 * Matches Word doc scenario "New Device Login Confirmation".
 */
export function formatNewDeviceLoginEmail(input: {
  customerName: string;
  ip: string;
  timestamp: string;
  /** Optional — provided when available from the login request headers */
  device?: string;
  browser?: string;
  operatingSystem?: string;
  location?: string;
  secureAccountUrl?: string;
  portalUrl: string;
}): { subject: string; body: string } {
  const secureUrl = input.secureAccountUrl ?? `${input.portalUrl}/login`;
  return {
    subject: "New Device Login Detected – Aptus Infotech Account",
    body: [
      `Dear ${input.customerName},`,
      "",
      "We noticed a login to your Aptus Infotech account from a new device.",
      "",
      "Login Details",
      `Date & Time: ${input.timestamp}`,
      `Device: ${input.device}`,
      `Browser: ${input.browser}`,
      `Operating System: ${input.operatingSystem}`,
      `Approximate Location: ${input.location}`,
      `IP Address: ${input.ip}`,
      "",
      "If this was you, no action is required. You can continue using your account normally.",
      "",
      "If you do not recognize this login, please secure your account immediately by changing your password.",
      "",
      `Secure My Account: ${secureUrl}`,
      "",
      "If you believe your account has been compromised, please contact our support team at info@aptusinfotech.com",
      "",
      "For your security, never share your password or OTP with anyone.",
      "",
      "Best regards,",
      "Aptus Infotech Security Team",
      input.portalUrl,
      "info@aptusinfotech.com | +968 9941 8481",
    ].join("\n"),
  };
}

// ─── SCENARIO: Email Verification (post-registration) ────────────────────────

/**
 * Customer email — sent after registration to verify the email address.
 */
export function formatEmailVerificationEmail(input: {
  customerName: string;
  verifyUrl: string;
  expiresInMinutes: number;
}): { subject: string; body: string } {
  return {
    subject: "[Aptus Portal] Please verify your email address",
    body: [
      `Dear ${input.customerName},`,
      "",
      "Thanks for registering for the Aptus Customer Portal. Please confirm this is your email address to activate your account.",
      "",
      `Verify my email: ${input.verifyUrl}`,
      "",
      `This link is single-use and expires in ${input.expiresInMinutes} minutes.`,
      "Your account will remain inactive until you verify your email.",
      "",
      "If you did not create this account, you can safely ignore this email.",
      "",
      "Thank you for choosing Aptus Infotech.",
    ].join("\n"),
  };
}

// ─── SCENARIO: Thank-you email after a new enquiry ───────────────────────────

/**
 * Customer email — sent immediately after a contact/enquiry form submission.
 * Matches Word doc scenario "Thank-you email after a new enquiry".
 */
export function formatEnquiryThankYouEmail(input: {
  customerName: string;
  enquiryId: string;
  productName: string;
  enquiryDate: string;
  enquirySummary: string;
  portalUrl: string;
}): { subject: string; body: string } {
  return {
    subject: "Thank You for Contacting Aptus Infotech",
    body: [
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
      input.portalUrl,
      "info@aptusinfotech.com | +968 9941 8481",
    ].join("\n"),
  };
}

// ─── SCENARIO: Abandoned Cart → Customer ─────────────────────────────────────

/**
 * Customer email — sent after cart abandonment to prompt the customer to complete purchase.
 * Matches Word doc scenario "Abandoned cart reminder to Buyer".
 */
export function formatCartReminderEmail(input: {
  customerName: string;
  products: string[];
  duration: "1year" | "3year";
  continueUrl: string;
}): { subject: string; body: string } {
  const productLines = input.products.map((p) => `  - ${p}`);

  return {
    subject: "You left something in your cart!",
    body: [
      `Hi ${input.customerName},`,
      "",
      "We noticed that you left some great software in your cart, and we didn't want you to miss out.",
      "",
      "Your selected products are still waiting for you:",
      ...productLines,
      "",
      "Whether you're looking to improve productivity, strengthen security, or streamline your business, these solutions are just a few clicks away.",
      "",
      "Click below to complete your purchase before your cart expires.",
      "",
      `Complete Your Purchase: ${input.continueUrl}`,
      "",
      "If you have any questions about the software, licensing, pricing, or installation, our team is here to help.",
      "",
      "Thank you for choosing Aptus Infotech. We look forward to serving you!",
      "",
      "Best regards,",
      "Aptus Infotech Team",
      "info@aptusinfotech.com | +968 9941 8481",
    ].join("\n"),
  };
}

// ─── SCENARIO: Abandoned Cart → Sales Team ───────────────────────────────────

/**
 * Internal email to it-sales@aptusinfotech.com — sent when a logged-in customer
 * adds products to cart but has not completed the purchase.
 * Matches Word doc scenario "Internal communication on abandoned cart to sales team".
 */
export function formatCartAddedSalesEmail(input: {
  customer: {
    name: string;
    company: string;
    email: string;
    phone: string;
    location?: string;
  };
  duration: "1year" | "3year";
  items: OrderLineItem[];
  linePrices: Array<{ productName: string; unitPrice: number; lineTotal: number }>;
  estimatedTotal: number | null;
  addedAt: string;
  crmReference?: string;
}): { subject: string; body: string; html: string } {
  const rows = input.items.map((item) => {
    const priced = input.linePrices.find((row) => row.productName === item.productName);
    const guidePrice =
      priced && priced.unitPrice > 0
        ? `${priced.unitPrice.toFixed(3)} OMR × ${item.quantity} = ${priced.lineTotal.toFixed(3)} OMR`
        : "";
    return toInternalProductRow(item, input.duration, { guidePrice });
  });
  const productsText = formatInternalProductRowsText(rows);

  const totalNote =
    input.estimatedTotal != null && input.estimatedTotal > 0
      ? `Estimated Value: ${input.estimatedTotal.toFixed(3)} OMR`
      : "Estimated Value: —";

  const body = [
      "Hello Sales Team,",
      "",
      "A customer has added one or more software products to their shopping cart but has not completed the purchase.",
      "",
      "Please review the lead details below and reach out to the customer to understand if they require any assistance.",
      "",
      "Lead Details",
      `Customer Name: ${input.customer.name}`,
      `Customer Email: ${input.customer.email}`,
      `Phone: ${input.customer.phone || "—"}`,
      `Company: ${input.customer.company || "—"}`,
      "Products Added:",
      productsText,
      totalNote,
      `Date & Time: ${input.addedAt}`,
      input.crmReference ? `CRM Reference: ${input.crmReference}` : "",
      "",
      "Recommended Actions",
      "1. Contact the customer via email or phone.",
      "2. Answer any product, licensing, pricing, or technical questions.",
      "3. Offer assistance in completing the purchase.",
      "4. Update the CRM with the outcome of your follow-up.",
      "",
      "Please prioritize this lead to maximize conversion opportunities.",
      "",
      "Thank you,",
      "Website Notification System",
      "Aptus Infotech",
    ]
      .filter(Boolean)
      .join("\n");

  return {
    subject: `New Abandoned Cart Lead - Customer Follow-up Required`,
    body,
    html: wrapInternalEmailHtml(body, productsText, formatInternalProductRowsHtml(rows)),
  };
}

// ─── SCENARIO: Order Received → Customer ─────────────────────────────────────

/**
 * Customer email — sent when an order is placed and is awaiting payment verification.
 * Matches Word doc scenario "Customer purchased the item — confirmation + payment verification".
 */
export function formatPurchaseRequestSubmittedEmail(input: {
  customerName: string;
  reference: string;
  products: string[];
  duration: "1year" | "3year";
  portalUrl: string;
  bankTransferReference?: string;
  totalAmount?: string;
  orderDate?: string;
  paymentMethod?: string;
}): { subject: string; body: string } {
  const productLines = input.products.map((product) => `  - ${product}`);

  return {
    subject: "Your Order Has Been Received – Payment Verification in Progress",
    body: [
      `Dear ${input.customerName},`,
      "",
      "Thank you for your purchase!",
      "",
      "We have successfully received your order and appreciate you choosing Aptus Infotech for your software needs.",
      "",
      "Order Details",
      `Order Number: ${input.reference}`,
      `Order Date: ${input.orderDate ?? new Date().toLocaleDateString("en-GB")}`,
      "Products Purchased:",
      ...productLines,
      input.totalAmount ? `Order Amount: ${input.totalAmount}` : "",
      input.paymentMethod ? `Payment Method: ${input.paymentMethod}` : "",
      "",
      "---",
      "What Happens Next?",
      "",
      "Our team will now verify your payment. Once the payment has been successfully verified, we will process your order and send your software license details to your registered email address.",
      "",
      "Estimated Processing Time:",
      "Your license details will be shared within 2–3 business days after successful payment verification.",
      "",
      "If we require any additional information regarding your order or payment, a member of our team will contact you promptly.",
      "",
      "Should you have any questions in the meantime, please feel free to reach out to our support team.",
      "",
      "Thank you for choosing Aptus Infotech. We look forward to serving you.",
      "",
      "Kind regards,",
      "Aptus Infotech Team",
      input.portalUrl,
      "info@aptusinfotech.com | +968 9941 8481",
    ]
      .filter((line) => line !== undefined && line !== null)
      .join("\n"),
  };
}

// ─── SCENARIO: Order Placed → Sales Team ─────────────────────────────────────

/**
 * Internal email to it-sales@aptusinfotech.com — sent when a customer places an order.
 * Matches Word doc scenario "internal email triggered after a customer places an order".
 */
export function formatOrderNotificationEmail(
  profile: ClientProfile,
  order: ProductOrderPayload,
  reference: string,
): { subject: string; body: string; html: string } {
  const rows = order.items.map((item) => toInternalProductRow(item, order.duration));
  const productsText = formatInternalProductRowsText(rows);

  const transactionId =
    order.payment?.paymentIntentId ?? "—";
  const orderAmount =
    order.payment?.amountPaid != null
      ? `${order.payment.amountPaid.toFixed(3)} OMR`
      : "—";

  const body = [
      "Dear Sales Team,",
      "",
      "A new software order has been placed through the Aptus Infotech website and is awaiting payment verification.",
      "",
      "Please review the payment details below and verify the transaction. Once the payment has been confirmed, kindly update the order status so the Operations/Licensing team can proceed with issuing the software license.",
      "",
      "Order Details",
      `Order Number: ${reference}`,
      `Order Date: ${new Date().toLocaleString("en-GB", { timeZone: "Asia/Muscat" })}`,
      `Customer Name: ${profile.name}`,
      `Company: ${profile.company || order.contact.company || "—"}`,
      `Customer Email: ${profile.email}`,
      `Customer Phone: ${profile.phone || order.contact.phone || "—"}`,
      "Products Purchased:",
      productsText,
      `Order Value: ${orderAmount}`,
      `Payment Method: ${order.payment?.paymentMethod ?? "—"}`,
      `Transaction/Reference ID: ${transactionId}`,
      "",
      "Action Required",
      "1. Verify the payment transaction.",
      "2. Confirm that the payment has been successfully received.",
      "3. Update the order status to Payment Verified.",
      "4. Notify the Operations/Licensing team to generate and send the software license, invoice, and customer documentation.",
      "",
      "Target Turnaround Time: Within 2–3 business days of order placement.",
      "",
      "If any payment discrepancies are identified, please contact the customer or notify the Sales team for further follow-up.",
      "",
      order.customerMessage?.trim() ? `Customer Message: ${order.customerMessage.trim()}` : "",
      "",
      "Thank you for your prompt attention.",
      "",
      "Best regards,",
      "Website Order Management System",
      "Aptus Infotech",
    ]
      .filter(Boolean)
      .join("\n");

  return {
    subject: `Action Required: Verify Customer Payment for Order ${reference}`,
    body,
    html: wrapInternalEmailHtml(body, productsText, formatInternalProductRowsHtml(rows)),
  };
}

// ─── SCENARIO: Payment Verified — License Ready ───────────────────────────────

/**
 * Customer email — sent after Finance/CRM verifies payment (license still being prepared).
 * Matches workflow Step 3: Payment Verified.
 */
export function formatPurchaseApprovedEmail(input: {
  customerName: string;
  reference: string;
  products: string[];
  duration: "1year" | "3year";
  portalUrl: string;
  orderDate?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
}): { subject: string; body: string } {
  const productLines = input.products.map((product) => `  - ${product}`);

  return {
    subject: "Payment Verified",
    body: [
      `Dear ${input.customerName},`,
      "",
      "Payment has been successfully verified.",
      "",
      "Thank you for your payment.",
      "Your software license is now being prepared.",
      "Your license will be issued within 2–3 business days.",
      "",
      "Order Summary",
      `Order Number: ${input.reference}`,
      input.orderDate ? `Order Date: ${input.orderDate}` : "",
      "Payment Status: Verified",
      "Product(s):",
      ...productLines,
      "",
      `Track your order: ${input.portalUrl}/portal/products`,
      "",
      "Need Assistance?",
      "Support Email: info@aptusinfotech.com",
      "Support Phone: +968 9941 8481",
      "",
      "Thank you for choosing Aptus Infotech.",
      "",
      "Warm regards,",
      "Aptus Infotech Team",
      input.portalUrl,
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

// ─── SCENARIO: Payment Not Received ──────────────────────────────────────────

/**
 * Customer email — sent when payment cannot be confirmed during verification.
 * Matches Word doc scenario "Separate payment not received / payment verification issue email".
 */
export function formatPaymentFailedEmail(input: {
  customerName: string;
  reference: string;
  amount: string;
  reason?: string;
  portalUrl: string;
  products?: string[];
  orderDate?: string;
  transactionId?: string;
  paymentLink?: string;
}): { subject: string; body: string } {
  const productLines = (input.products ?? []).map((p) => `  - ${p}`);

  return {
    subject: `Action Required: Payment Not Received for Order ${input.reference}`,
    body: [
      `Dear ${input.customerName},`,
      "",
      "Thank you for your recent purchase from Aptus Infotech.",
      "",
      `We are currently processing your order ${input.reference}. During our payment verification process, we were unable to confirm receipt of the payment for your order.`,
      "",
      "Order Details",
      `Order Number: ${input.reference}`,
      input.orderDate ? `Order Date: ${input.orderDate}` : "",
      productLines.length ? "Product(s):" : "",
      ...productLines,
      `Order Amount: ${input.amount}`,
      input.transactionId ? `Payment Reference: ${input.transactionId}` : "",
      "",
      "If the payment has already been deducted from your account, please don't make another payment. Instead, kindly share your payment confirmation or transaction receipt with us so our team can investigate and verify the transaction.",
      "",
      input.paymentLink
        ? `If the payment was not completed, you may complete the payment using the link below:\nComplete Payment: ${input.paymentLink}`
        : "",
      "",
      "Once we receive and verify the payment, we will proceed with processing your order and share your software license details within 2–3 business days.",
      "",
      "If you have already made the payment, please disregard the payment link and send us the transaction details for verification.",
      "",
      "For any assistance, please contact our team at info@aptusinfotech.com or +968 9941 8481.",
      "",
      "Thank you for choosing Aptus Infotech.",
      "",
      "Best regards,",
      "Aptus Infotech Team",
      input.portalUrl,
      "info@aptusinfotech.com | +968 9941 8481",
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

// ─── SCENARIO: Subscription Renewal Reminders ────────────────────────────────

const RENEWAL_URGENCY_LINES: Record<number, string> = {
  90: "You have 90 days remaining on your current subscription. To ensure uninterrupted access to the software and its features, we recommend renewing your subscription before the expiry date.",
  60: "You have 60 days remaining on your current subscription. To ensure uninterrupted access, please consider renewing your subscription soon.",
  30: "Your subscription expires in 30 days. Renew now to ensure uninterrupted access.",
  15: "Your subscription expires in 15 days. We recommend renewing your subscription now to avoid any interruption.",
  14: "Your subscription expires in just 14 days. We recommend completing your renewal soon to avoid any interruption.",
  7: "Your subscription expires in 7 days. Please renew your subscription to continue using this product without interruption.",
  3: "Your subscription expires in just 3 days. Please complete your renewal as soon as possible to maintain uninterrupted access.",
  1: "Your subscription expires tomorrow. Renew today to avoid interruption to your software access.",
};

/**
 * Customer email — renewal reminder at 90, 30, 14, 7, 3, 1 days before expiry.
 * Matches Word doc scenario "Subscription Reminder Mails".
 */
export function formatRenewalReminderEmail(input: {
  customerName: string;
  productName: string;
  renewalDate: string;
  daysRemaining: number;
  licenseType?: string;
  renewalLink?: string;
  portalUrl: string;
}): { subject: string; body: string } {
  const urgencyLine =
    RENEWAL_URGENCY_LINES[input.daysRemaining] ??
    `Your subscription expires in ${input.daysRemaining} days. Please renew to continue using ${input.productName} without interruption.`;

  const renewalLink = input.renewalLink ?? `${input.portalUrl}/portal/subscriptions`;

  return {
    subject: `Your ${input.productName} Subscription Expires in ${input.daysRemaining} Day${input.daysRemaining === 1 ? "" : "s"}`,
    body: [
      `Dear ${input.customerName},`,
      "",
      `We hope you're enjoying ${input.productName}.`,
      "",
      urgencyLine,
      "",
      "Subscription Details",
      `Product: ${input.productName}`,
      input.licenseType ? `License Type: ${input.licenseType}` : "",
      `Current Expiry Date: ${input.renewalDate}`,
      `Renew Your Subscription: ${renewalLink}`,
      "",
      "If you have any questions regarding renewal, pricing, or your license, our team will be happy to assist.",
      "",
      "Thank you for choosing Aptus Infotech.",
      "",
      "Best regards,",
      "Aptus Infotech Team",
      "info@aptusinfotech.com | +968 9941 8481",
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

// ─── Bank Transfer Emails ─────────────────────────────────────────────────────

export function formatBankTransferCustomerEmail(input: {
  customerName: string;
  reference: string;
  bankTransferReference: string;
  products: string[];
  totalAmount: string;
  portalUrl: string;
}): { subject: string; body: string } {
  const productLines = input.products.map((product) => `  - ${product}`);

  return {
    subject: "Your Order Has Been Received – Payment Verification in Progress",
    body: [
      `Dear ${input.customerName},`,
      "",
      "Thank you for your purchase!",
      "",
      "We have received your order and your bank transfer payment proof. Our team will verify the payment and process your order.",
      "",
      "Order Details",
      `Order Number: ${input.bankTransferReference}`,
      `Order Reference: ${input.reference}`,
      "Products Purchased:",
      ...productLines,
      `Order Amount: ${input.totalAmount}`,
      "",
      "Payment Verification Status: Pending",
      "Estimated Processing Time: Your license details will be shared within 2–3 business days after successful payment verification.",
      "",
      "You will receive another email as soon as your payment is verified and your licenses are available.",
      `Track your order: ${input.portalUrl}/portal/products`,
      "",
      "If you have any questions, reply to this email or contact our support team.",
      "",
      "Thank you for choosing Aptus Infotech.",
      "",
      "Kind regards,",
      "Aptus Infotech Team",
      input.portalUrl,
      "info@aptusinfotech.com | +968 9941 8481",
    ].join("\n"),
  };
}

export function formatBankTransferAdminEmail(input: {
  customerName: string;
  company: string;
  email: string;
  phone: string;
  reference: string;
  bankTransferReference: string;
  items: OrderLineItem[];
  duration: ProductOrderPayload["duration"];
  totalAmount: string;
  odooLink?: string | null;
}): { subject: string; body: string; html: string } {
  const rows = input.items.map((item) => toInternalProductRow(item, input.duration));
  const productsText = formatInternalProductRowsText(rows);

  const body = [
      "Dear Sales Team,",
      "",
      "A customer has submitted a bank transfer payment proof for review.",
      "",
      "Order Details",
      `Order Number: ${input.bankTransferReference}`,
      `Order Reference: ${input.reference}`,
      `Date/Time: ${new Date().toLocaleString("en-GB", { timeZone: "Asia/Muscat" })}`,
      "",
      "Customer Details",
      `  Name: ${input.customerName}`,
      `  Company: ${input.company || "—"}`,
      `  Email: ${input.email}`,
      `  Phone: ${input.phone || "—"}`,
      "",
      "Products Purchased:",
      productsText,
      `Total Amount: ${input.totalAmount}`,
      "",
      "The uploaded payment proof is attached to this email and to the Odoo sale order.",
      input.odooLink ? `Odoo Record: ${input.odooLink}` : "",
      "",
      "Action Required",
      "1. Verify the payment transaction.",
      "2. Confirm that the payment has been successfully received.",
      "3. Update the order status to Payment Verified.",
      "4. Notify the Operations/Licensing team to generate and send the software license, invoice, and customer documentation.",
      "",
      "Target Turnaround Time: Within 2–3 business days of order placement.",
      "",
      "Thank you for your prompt attention.",
      "",
      "Best regards,",
      "Website Order Management System",
      "Aptus Infotech",
    ]
      .filter(Boolean)
      .join("\n");

  return {
    subject: `Action Required: Verify Customer Payment for Order ${input.bankTransferReference}`,
    body,
    html: wrapInternalEmailHtml(body, productsText, formatInternalProductRowsHtml(rows)),
  };
}

// ─── Remaining Notification Emails ───────────────────────────────────────────

export function formatLicenseAvailableEmail(input: {
  customerName: string;
  productName: string;
  licenseKey: string;
  expiryDate?: string;
  activationDate?: string;
  downloadUrl?: string;
  activationInstructions?: string;
  portalUrl: string;
}): { subject: string; body: string } {
  return {
    subject: "License Issued",
    body: [
      `Dear ${input.customerName},`,
      "",
      "Your software license has been issued successfully.",
      "",
      "License Details",
      `Product Name: ${input.productName}`,
      `License Key / Subscription Details: ${input.licenseKey}`,
      input.activationDate ? `Issue / Activation Date: ${input.activationDate}` : "",
      input.expiryDate ? `Expiry Date: ${input.expiryDate}` : "",
      input.downloadUrl ? `Download Link: ${input.downloadUrl}` : "",
      "",
      "Activation Instructions",
      input.activationInstructions?.trim() ||
        "Sign in to the Aptus Customer Portal → Licenses to view your license key and follow the product activation steps provided with your software.",
      "",
      "Support Information",
      "Support Email: info@aptusinfotech.com",
      "Support Phone: +968 9941 8481",
      `Support Portal: ${input.portalUrl}/portal/subscriptions`,
      "",
      "Thank you for choosing Aptus Infotech.",
      "",
      "Warm regards,",
      "Aptus Infotech Team",
      input.portalUrl,
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

export function formatOrderApprovedEmail(input: {
  customerName: string;
  reference: string;
  products: string[];
  duration: "1year" | "3year";
  portalUrl: string;
}): { subject: string; body: string } {
  const productLines = input.products.map((product) => `  - ${product}`);

  return {
    subject: `[Aptus Portal] Request approved — ${input.reference}`,
    body: [
      `Dear ${input.customerName},`,
      "",
      "Your software purchase request has been approved.",
      "",
      `Order reference: ${input.reference}`,
      `Subscription duration: ${durationLabel(input.duration)}`,
      "",
      "Products approved",
      ...productLines,
      "",
      'Please sign in to the Aptus Customer Portal and click "Make Payment" to complete your purchase.',
      `${input.portalUrl}/portal/products`,
      "",
      "If you have any questions, reply to this email or contact your Aptus account manager.",
      "",
      "Thank you for choosing Aptus Infotech.",
    ].join("\n"),
  };
}

export function formatSubscriptionConfirmationEmail(input: {
  customerName: string;
  email: string;
  reference: string;
  products: string[];
  duration: "1year" | "3year";
  portalUrl: string;
}): { subject: string; body: string } {
  const productLines = input.products.map((product) => `  - ${product}`);

  return {
    subject: `[Aptus Portal] Subscription confirmed — ${input.reference}`,
    body: [
      `Dear ${input.customerName},`,
      "",
      "Your software subscription has been confirmed.",
      "",
      `Order reference: ${input.reference}`,
      `Subscription duration: ${durationLabel(input.duration)}`,
      "",
      "Products confirmed",
      ...productLines,
      "",
      "Your active subscriptions are now available in the Aptus Customer Portal.",
      `View subscriptions: ${input.portalUrl}/portal/subscriptions`,
      "",
      "If you have any questions, reply to this email or contact your Aptus account manager.",
      "",
      "Thank you for choosing Aptus Infotech.",
    ].join("\n"),
  };
}

export function formatPurchaseDeclinedEmail(input: {
  customerName: string;
  reference: string;
  products: string[];
  reason?: string;
  portalUrl: string;
}): { subject: string; body: string } {
  const productLines = input.products.map((product) => `  - ${product}`);
  const reasonBlock = input.reason?.trim()
    ? ["", "Reason", `  ${input.reason.trim()}`, ""]
    : [""];

  return {
    subject: `[Aptus Portal] Purchase Request Declined — ${input.reference}`,
    body: [
      `Dear ${input.customerName},`,
      "",
      "Your purchase request has been declined.",
      "",
      `Order reference: ${input.reference}`,
      "Status: Rejected",
      "",
      "Products",
      ...productLines,
      ...reasonBlock,
      "If you believe this is a mistake or need help placing a new request, reply to this email or contact your Aptus account manager.",
      `Portal: ${input.portalUrl}/portal/products`,
      "",
      "Thank you for choosing Aptus Infotech.",
    ].join("\n"),
  };
}

export function formatSubscriptionRequestEmail(input: {
  customerName: string;
  company: string;
  email: string;
  phone: string;
  productName: string;
  requestType: "renew" | "upgrade" | "downgrade" | "cancel";
  orderId?: number;
  notes?: string;
  reference: string;
}): { subject: string; body: string } {
  const labels: Record<typeof input.requestType, string> = {
    renew: "Renewal",
    upgrade: "Upgrade",
    downgrade: "Downgrade",
    cancel: "Cancellation",
  };

  return {
    subject: `[Aptus Portal] ${labels[input.requestType]} request ${input.reference} — ${input.productName}`,
    body: [
      `New subscription ${labels[input.requestType].toLowerCase()} request from the Aptus Customer Portal`,
      "",
      `Reference: ${input.reference}`,
      `Request type: ${labels[input.requestType]}`,
      "",
      "Customer Details",
      `  Name: ${input.customerName}`,
      `  Company: ${input.company || "—"}`,
      `  Email: ${input.email}`,
      `  Phone: ${input.phone || "—"}`,
      "",
      "Subscription",
      `  Product: ${input.productName}`,
      input.orderId ? `  Sale order ID: ${input.orderId}` : "",
      input.notes ? `  Notes: ${input.notes}` : "",
      "",
      "Action required: Process this request within 48 hours.",
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

export function formatCancellationEmail(input: {
  customerName: string;
  productName: string;
  reference?: string;
  effectiveDate: string;
  portalUrl: string;
}): { subject: string; body: string } {
  return {
    subject: `[Aptus Portal] Subscription Cancelled — ${input.productName}`,
    body: [
      `Dear ${input.customerName},`,
      "",
      `This confirms that your ${input.productName} subscription has been cancelled.`,
      "",
      input.reference ? `Reference: ${input.reference}` : "",
      `Effective date: ${input.effectiveDate}`,
      "",
      "Your access to this product and related support/updates will end on the effective date above. You can still sign in to the Aptus Customer Portal to review your order history at any time.",
      `${input.portalUrl}/portal/subscriptions`,
      "",
      "If you did not request this cancellation or would like to reactivate, contact your Aptus account manager as soon as possible.",
      "",
      "Thank you for having been a valued Aptus Infotech customer.",
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

export function formatLicenseExpiredEmail(input: {
  customerName: string;
  productName: string;
  expiryDate: string;
  portalUrl: string;
}): { subject: string; body: string } {
  return {
    subject: `[Aptus Portal] License Expired — ${input.productName}`,
    body: [
      `Dear ${input.customerName},`,
      "",
      `Your ${input.productName} license expired on ${input.expiryDate} without renewal.`,
      "",
      "Access to updates and support for this product may now be restricted. Renew today to restore full access without interruption.",
      "",
      `Renew License: ${input.portalUrl}/portal/subscriptions`,
      "",
      "If you have already renewed, please disregard this message — it can take a few minutes for your renewed license to appear in the portal.",
      "",
      "Thank you for choosing Aptus Infotech.",
    ].join("\n"),
  };
}

/** Internal alert — customer license expired without renewal (sales follow-up). */
export function formatLicenseExpiredInternalEmail(input: {
  customerName: string;
  customerEmail: string;
  productName: string;
  expiryDate: string;
  subscriptionKey: string;
}): { subject: string; body: string } {
  return {
    subject: `[Aptus Portal] Customer license expired — ${input.productName}`,
    body: [
      "Dear Sales Team,",
      "",
      "A customer subscription has expired without renewal.",
      "",
      "Customer Details",
      `  Name: ${input.customerName}`,
      `  Email: ${input.customerEmail}`,
      "",
      "License Details",
      `  Product: ${input.productName}`,
      `  Expiry date: ${input.expiryDate}`,
      `  Subscription key: ${input.subscriptionKey}`,
      "",
      "Suggested action: Reach out to the customer about renewal options.",
    ].join("\n"),
  };
}

export function formatRenewalConfirmationEmail(input: {
  customerName: string;
  productName: string;
  reference: string;
  renewalDate?: string;
  portalUrl: string;
}): { subject: string; body: string } {
  return {
    subject: `[Aptus Portal] Renewal confirmed — ${input.productName}`,
    body: [
      `Dear ${input.customerName},`,
      "",
      "Your subscription renewal has been confirmed.",
      "",
      `Reference: ${input.reference}`,
      `Product: ${input.productName}`,
      input.renewalDate ? `Next renewal date: ${input.renewalDate}` : "",
      "",
      "Your renewed subscription is now active in the Aptus Customer Portal.",
      `${input.portalUrl}/portal/subscriptions`,
      "",
      "Thank you for continuing with Aptus Infotech.",
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

export function formatPaymentFailedInternalEmail(input: {
  customerName: string;
  customerEmail: string;
  reference: string;
  amount: string;
  reason?: string;
}): { subject: string; body: string } {
  return {
    subject: `[Aptus Portal] Payment failed — ${input.reference}`,
    body: [
      "A customer payment attempt has failed and may need follow-up.",
      "",
      `Order reference: ${input.reference}`,
      `Date/time: ${new Date().toISOString()}`,
      "",
      "Customer Details",
      `  Name: ${input.customerName}`,
      `  Email: ${input.customerEmail}`,
      "",
      `Amount: ${input.amount}`,
      input.reason ? `Failure reason: ${input.reason}` : "Failure reason: —",
      "",
      "Action required: Follow up with the customer if the payment is not retried successfully.",
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

export function formatRefundRequestedEmail(input: {
  customerName: string;
  refundReference: string;
  orderReference: string;
  productName: string;
  portalUrl: string;
}): { subject: string; body: string } {
  return {
    subject: `[Aptus Portal] Refund Request Received — ${input.refundReference}`,
    body: [
      `Dear ${input.customerName},`,
      "",
      "We have received your refund request.",
      "",
      `Refund reference: ${input.refundReference}`,
      `Order reference: ${input.orderReference}`,
      `Product: ${input.productName}`,
      "",
      "Our team will review your request and get back to you. Processing typically takes 5–7 business days once approved.",
      `Track your request: ${input.portalUrl}/portal/products`,
      "",
      "Thank you for your patience.",
    ].join("\n"),
  };
}

export function formatRefundProcessedEmail(input: {
  customerName: string;
  refundReference: string;
  orderReference: string;
  productName: string;
  amount: string;
  paymentMethod: string;
  estimatedArrival: string;
}): { subject: string; body: string } {
  return {
    subject: `[Aptus Portal] Refund Processed — ${input.refundReference}`,
    body: [
      `Dear ${input.customerName},`,
      "",
      "Your refund has been approved and processed.",
      "",
      `Refund reference: ${input.refundReference}`,
      `Order reference: ${input.orderReference}`,
      `Product: ${input.productName}`,
      `Refunded amount: ${input.amount}`,
      `Refund method: ${input.paymentMethod}`,
      `Estimated arrival: ${input.estimatedArrival}`,
      "",
      "If you have any questions about this refund, please contact our support team.",
      "",
      "Thank you for choosing Aptus Infotech.",
    ].join("\n"),
  };
}
