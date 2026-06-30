import type { ClientProfile } from "./types";

export type OrderLineItem = {
  category: string;
  productName: string;
  quantity: number;
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
  return duration === "3year" ? "3 Years" : "1 Year";
}

export function formatOrderNotificationEmail(
  profile: ClientProfile,
  order: ProductOrderPayload,
  reference: string,
): { subject: string; body: string } {
  const lines = order.items.map(
    (item) => `  - ${item.category} / ${item.productName} × ${item.quantity}`,
  );

  const body = [
    "New software subscription order from the Aptus Customer Portal",
    "",
    `Order Reference: ${reference}`,
    `Subscription Duration: ${durationLabel(order.duration)}`,
    "",
    "Customer Details",
    `  Name: ${profile.name}`,
    `  Company: ${profile.company || order.contact.company || "—"}`,
    `  Email: ${profile.email}`,
    `  Phone: ${profile.phone || order.contact.phone || "—"}`,
    `  Location: ${profile.location || "—"}`,
    "",
    "Contact Information (billing)",
    `  Contact Name: ${order.contact.name}`,
    `  Contact Email: ${order.contact.email}`,
    `  Contact Phone: ${order.contact.phone || "—"}`,
    "",
    "Products Selected",
    ...lines,
    "",
    order.customerMessage?.trim()
      ? ["Customer message", `  ${order.customerMessage.trim()}`, ""].join("\n")
      : "",
    `Total line items: ${order.items.length}`,
    `Total quantity: ${order.items.reduce((sum, item) => sum + item.quantity, 0)}`,
    "",
    "Payment",
    "  Status: Pending approval (payment collected after backend approval)",
    order.payment?.paymentIntentId
      ? `  Payment reference: ${order.payment.paymentIntentId}`
      : "  Payment reference: —",
    "",
    "Action required: Review this request within 48 hours. Move the CRM lead to Won when approved so the customer can complete payment in the portal.",
  ].join("\n");

  return {
    subject: `[Aptus Portal] New software order ${reference} — ${profile.company || profile.name}`,
    body,
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

  const body = [
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
    "Please sign in to the Aptus Customer Portal and click \"Make Payment\" to complete your purchase.",
    `${input.portalUrl}/portal/purchases`,
    "",
    "If you have any questions, reply to this email or contact your Aptus account manager.",
    "",
    "Thank you for choosing Aptus Infotech.",
  ].join("\n");

  return {
    subject: `[Aptus Portal] Request approved — ${input.reference}`,
    body,
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

  const body = [
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
  ].join("\n");

  return {
    subject: `[Aptus Portal] Subscription confirmed — ${input.reference}`,
    body,
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

  const body = [
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
    .join("\n");

  return {
    subject: `[Aptus Portal] ${labels[input.requestType]} request ${input.reference} — ${input.productName}`,
    body,
  };
}

export function formatRenewalReminderEmail(input: {
  customerName: string;
  productName: string;
  renewalDate: string;
  daysRemaining: number;
  portalUrl: string;
}): { subject: string; body: string } {
  const body = [
    `Dear ${input.customerName},`,
    "",
    `This is a reminder that your ${input.productName} subscription is due for renewal.`,
    "",
    `Renewal date: ${input.renewalDate}`,
    `Days remaining: ${input.daysRemaining}`,
    "",
    "To renew, sign in to the Aptus Customer Portal and submit a renewal request from your subscriptions page.",
    `${input.portalUrl}/portal/subscriptions`,
    "",
    "If you have already submitted a renewal request, our team will complete it within 48 hours of confirmation.",
    "",
    "Thank you for choosing Aptus Infotech.",
  ].join("\n");

  return {
    subject: `[Aptus Portal] Renewal reminder — ${input.productName} (${input.daysRemaining} days)`,
    body,
  };
}

export function formatRenewalConfirmationEmail(input: {
  customerName: string;
  productName: string;
  reference: string;
  renewalDate?: string;
  portalUrl: string;
}): { subject: string; body: string } {
  const body = [
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
    .join("\n");

  return {
    subject: `[Aptus Portal] Renewal confirmed — ${input.productName}`,
    body,
  };
}
