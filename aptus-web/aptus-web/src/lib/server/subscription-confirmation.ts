import { writeAudit } from "./audit-log";

import {

  formatOrderApprovedEmail,

  formatSubscriptionConfirmationEmail,

} from "./order-notification";

import { sendPortalEmail } from "./mail-service";

import { logger } from "./logger";

import {

  createPortalNotification,

  hasNotificationForReference,

} from "./portal-notifications";

import { findPortalAccountByPartnerId, getPortalAccountById } from "./portal-accounts";

import type { PortalOrder } from "@/types/orders";



function getPortalBaseUrl(): string {

  return (process.env.PORTAL_BASE_URL?.trim() || "https://aptusinfotech.com").replace(/\/$/, "");

}



function resolveOrderCustomer(order: PortalOrder): {

  email: string;

  name: string;

  actorId: string;

} | null {

  if (order.actorId) {

    const account = getPortalAccountById(order.actorId);

    if (account) {

      return {

        email: account.email,

        name: account.profile.name,

        actorId: account.id,

      };

    }

  }



  if (order.partnerId) {

    const account = findPortalAccountByPartnerId(order.partnerId);

    if (account) {

      return {

        email: account.email,

        name: account.profile.name,

        actorId: account.id,

      };

    }

  }



  return null;

}



/** Notify customer that their request was approved and payment is now required. */

export async function notifyOrderApprovedIfNeeded(

  order: PortalOrder,

  triggeredBy?: string,

  previousStatus?: PortalOrder["status"],

): Promise<{ notified: boolean; emailSent: boolean }> {

  if (order.status !== "Approved" || order.paymentStatus === "paid") {

    return { notified: false, emailSent: false };

  }



  const pendingStatuses: PortalOrder["status"][] = ["Submitted", "Under Review"];

  if (

    previousStatus &&

    !pendingStatuses.includes(previousStatus) &&

    previousStatus !== "Approved"

  ) {

    return { notified: false, emailSent: false };

  }



  if (previousStatus === "Approved" || previousStatus === "Completed") {

    return { notified: false, emailSent: false };

  }



  if (hasNotificationForReference(order.partnerId, order.reference, "order_approved")) {

    return { notified: false, emailSent: false };

  }



  const customer = resolveOrderCustomer(order);

  if (!customer) {

    logger.warn("Order approval notification skipped — no portal account for order", {

      action: "order.approve_notify",

      reference: order.reference,

      partnerId: order.partnerId,

      actorId: order.actorId,

    });

    return { notified: false, emailSent: false };

  }



  const products = order.items.map((item) => item.productName);

  const emailContent = formatOrderApprovedEmail({

    customerName: customer.name,

    reference: order.reference,

    products,

    duration: order.duration,

    portalUrl: getPortalBaseUrl(),

  });



  const emailResult = await sendPortalEmail({

    to: customer.email,

    subject: emailContent.subject,

    body: emailContent.body,

  });



  const notification = createPortalNotification({

    partnerId: order.partnerId,

    actorId: customer.actorId,

    title: "Request approved — payment required",

    detail: `Your request ${order.reference} has been approved. Sign in to Purchases and click Make Payment to complete your order.`,

    status: "Approved",

    type: "order_approved",

    reference: order.reference,

  });



  writeAudit({

    action: "notification.platform",

    actorId: triggeredBy ?? customer.actorId,

    targetId: order.id,

    metadata: {

      reference: order.reference,

      notificationId: notification.id,

      partnerId: order.partnerId,

      type: "order_approved",

    },

  });



  if (emailResult.sent) {

    writeAudit({

      action: "notification.email",

      actorId: triggeredBy ?? customer.actorId,

      targetId: order.id,

      metadata: {

        subject: emailContent.subject,

        to: customer.email,

        channel: emailResult.channel,

        reference: order.reference,

        type: "order_approved",

      },

    });

  }



  return { notified: true, emailSent: emailResult.sent };

}



/** Notify customer after payment is received and subscriptions are activated. */

export async function notifySubscriptionConfirmedIfNeeded(

  order: PortalOrder,

  triggeredBy?: string,

): Promise<{ notified: boolean; emailSent: boolean }> {

  if (order.paymentStatus !== "paid" && order.status !== "Completed") {

    return { notified: false, emailSent: false };

  }



  if (hasNotificationForReference(order.partnerId, order.reference, "subscription")) {

    return { notified: false, emailSent: false };

  }



  const customer = resolveOrderCustomer(order);

  if (!customer) {

    return { notified: false, emailSent: false };

  }



  const products = order.items.map((item) => item.productName);

  const emailContent = formatSubscriptionConfirmationEmail({

    customerName: customer.name,

    email: customer.email,

    reference: order.reference,

    products,

    duration: order.duration,

    portalUrl: getPortalBaseUrl(),

  });



  const emailResult = await sendPortalEmail({

    to: customer.email,

    subject: emailContent.subject,

    body: emailContent.body,

  });



  const notification = createPortalNotification({

    partnerId: order.partnerId,

    actorId: customer.actorId,

    title: "Payment completed",

    detail: `Payment for ${order.reference} was received. ${products.join(", ")} ${products.length === 1 ? "is" : "are"} now active in your account.`,

    status: "Confirmed",

    type: "subscription",

    reference: order.reference,

  });



  writeAudit({

    action: "notification.platform",

    actorId: triggeredBy ?? customer.actorId,

    targetId: order.id,

    metadata: {

      reference: order.reference,

      notificationId: notification.id,

      partnerId: order.partnerId,

    },

  });



  if (emailResult.sent) {

    writeAudit({

      action: "notification.email",

      actorId: triggeredBy ?? customer.actorId,

      targetId: order.id,

      metadata: {

        subject: emailContent.subject,

        to: customer.email,

        channel: emailResult.channel,

        reference: order.reference,

        type: "subscription_confirmed",

      },

    });

  }



  return { notified: true, emailSent: emailResult.sent };

}



export async function maybeNotifyApprovedOrders(

  orders: PortalOrder[],

  localOrders: PortalOrder[],

  triggeredBy?: string,

): Promise<void> {

  const localByReference = new Map(localOrders.map((order) => [order.reference, order]));

  const localBySaleOrderId = new Map(

    localOrders

      .filter((order) => order.saleOrderId != null)

      .map((order) => [order.saleOrderId as number, order]),

  );

  const localByLeadId = new Map(

    localOrders

      .filter((order) => order.leadId != null)

      .map((order) => [order.leadId as number, order]),

  );



  for (const order of orders) {

    if (order.status !== "Approved" || order.paymentStatus === "paid") continue;



    const local =

      localByReference.get(order.reference) ??

      (order.saleOrderId != null ? localBySaleOrderId.get(order.saleOrderId) : undefined) ??

      (order.reference.startsWith("LEAD-")

        ? localByLeadId.get(Number(order.reference.replace("LEAD-", "")))

        : undefined);



    await notifyOrderApprovedIfNeeded(order, triggeredBy, local?.status);

  }

}



/** @deprecated Use maybeNotifyApprovedOrders */

export async function maybeNotifyConfirmedOrders(

  orders: PortalOrder[],

  localOrders: PortalOrder[],

  triggeredBy?: string,

): Promise<void> {

  await maybeNotifyApprovedOrders(orders, localOrders, triggeredBy);

}

