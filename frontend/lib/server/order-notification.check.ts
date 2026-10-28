import assert from "node:assert/strict";
import {
  formatLicenseAvailableEmail,
  formatPasswordChangedEmail,
  formatPasswordResetEmail,
  formatPasswordResetOtpEmail,
  formatPurchaseApprovedEmail,
  formatPurchaseRequestSubmittedEmail,
  formatRegistrationSuccessfulEmail,
  formatBankTransferAdminEmail,
  formatBankTransferCustomerEmail,
  formatCancellationEmail,
  formatLicenseExpiredEmail,
  formatEmailVerificationEmail,
  formatNewDeviceLoginEmail,
  formatOrderNotificationEmail,
  formatPaymentFailedEmail,
  formatRefundRequestedEmail,
  formatRefundProcessedEmail,
  formatEnquiryThankYouEmail,
} from "./order-notification";
import type { ClientProfile } from "./types";

const registration = formatRegistrationSuccessfulEmail({
  customerName: "Ada",
  email: "ada@example.com",
  portalUrl: "https://example.com",
});
assert.match(registration.subject, /Account Has Been Created/);
assert.match(registration.body, /ada@example.com/);

const reset = formatPasswordResetEmail({
  customerName: "Ada",
  portalUrl: "https://example.com",
});
assert.match(reset.subject, /Password Has Been Changed/);

const changed = formatPasswordChangedEmail({
  customerName: "Ada",
  email: "ada@example.com",
  dateTime: "2026-08-09",
  device: "Chrome",
  location: "Muscat",
  secureAccountUrl: "https://example.com/login",
  portalUrl: "https://example.com",
});
assert.match(changed.subject, /Password Has Been Changed/);

const otp = formatPasswordResetOtpEmail({
  customerName: "Ada",
  otp: "123456",
  otpValidityMinutes: 10,
  resetUrl: "https://example.com/register",
  portalUrl: "https://example.com",
});
assert.match(otp.subject, /Password Reset OTP/);
assert.match(otp.body, /123456/);

const submitted = formatPurchaseRequestSubmittedEmail({
  customerName: "Ada",
  reference: "SO-9",
  products: ["AutoCAD"],
  duration: "1year",
  portalUrl: "https://example.com",
  bankTransferReference: "APT-20260803-0001",
  totalAmount: "OMR 554.400",
});
assert.match(submitted.subject, /Payment Verification in Progress/);
assert.match(submitted.body, /SO-9/);
assert.match(submitted.body, /What Happens Next/);

const pending = formatBankTransferCustomerEmail({
  customerName: "Ada",
  reference: "SO-9",
  bankTransferReference: "BT-1",
  products: ["AutoCAD"],
  totalAmount: "OMR 100",
  portalUrl: "https://example.com",
});
assert.match(pending.subject, /Payment Verification in Progress/);

const paymentVerified = formatPurchaseApprovedEmail({
  customerName: "Ada",
  reference: "SO-9",
  products: ["AutoCAD"],
  duration: "1year",
  portalUrl: "https://example.com",
});
assert.equal(paymentVerified.subject, "Payment Verified");
assert.match(paymentVerified.body, /successfully verified/i);
assert.match(paymentVerified.body, /2–3 business days/);
assert.doesNotMatch(paymentVerified.body, /License Key/);

const license = formatLicenseAvailableEmail({
  customerName: "Ada",
  productName: "AutoCAD",
  licenseKey: "ABC-123",
  expiryDate: "1 Jan 2027",
  downloadUrl: "https://example.com/dl",
  portalUrl: "https://example.com",
});
assert.match(license.subject, /License Issued/);
assert.match(license.body, /ABC-123/);
assert.match(license.body, /https:\/\/example.com\/dl/);

const cancelled = formatCancellationEmail({
  customerName: "Ada",
  productName: "AutoCAD",
  reference: "SO-1",
  effectiveDate: "2026-08-05",
  portalUrl: "https://example.com",
});
assert.match(cancelled.subject, /Subscription Cancelled/);
assert.match(cancelled.body, /AutoCAD/);

const expired = formatLicenseExpiredEmail({
  customerName: "Ada",
  productName: "AutoCAD",
  expiryDate: "1 Aug 2026",
  portalUrl: "https://example.com",
});
assert.match(expired.subject, /License Expired/);

const verify = formatEmailVerificationEmail({
  customerName: "Ada",
  verifyUrl: "https://example.com/api/auth/verify-email?token=abc",
  expiresInMinutes: 30,
});
assert.match(verify.subject, /verify your email/i);
assert.match(verify.body, /token=abc/);

const device = formatNewDeviceLoginEmail({
  customerName: "Ada",
  ip: "1.2.3.4",
  timestamp: "2026-08-05T00:00:00.000Z",
  portalUrl: "https://example.com",
});
assert.match(device.subject, /New Device Login/);
assert.match(device.body, /1\.2\.3\.4/);

const failed = formatPaymentFailedEmail({
  customerName: "Ada",
  reference: "SO-9",
  amount: "10.00 OMR",
  portalUrl: "https://example.com",
});
assert.match(failed.subject, /Payment Not Received/);

const thankYou = formatEnquiryThankYouEmail({
  customerName: "Ada",
  enquiryId: "ENQ-1",
  productName: "AutoCAD",
  enquiryDate: "2026-08-09",
  enquirySummary: "Need pricing",
  portalUrl: "https://example.com",
});
assert.match(thankYou.subject, /Thank You for Contacting/);
assert.match(thankYou.body, /ENQ-1/);

const refundReq = formatRefundRequestedEmail({
  customerName: "Ada",
  refundReference: "REF-1",
  orderReference: "SO-9",
  productName: "AutoCAD",
  portalUrl: "https://example.com",
});
assert.match(refundReq.subject, /Refund Request Received/);

const refundDone = formatRefundProcessedEmail({
  customerName: "Ada",
  refundReference: "REF-1",
  orderReference: "SO-9",
  productName: "AutoCAD",
  amount: "10.00 OMR",
  paymentMethod: "Stripe",
  estimatedArrival: "5-7 business days",
});
assert.match(refundDone.subject, /Refund Processed/);

const doubledPhone = "+968+96899999994";
const doubledProfile: ClientProfile = {
  id: "p1",
  email: "ada@example.com",
  name: "Ada",
  initials: "A",
  role: "Customer",
  company: "Aptus",
  phone: doubledPhone,
  location: "",
  accountManager: "",
  supportTier: "",
  customerSince: "",
  billingCycle: "",
  paymentTerms: "",
  partnerId: 1,
};
const verifyPayment = formatOrderNotificationEmail(
  doubledProfile,
  {
    duration: "1year",
    items: [{ category: "Structural Software", productName: "Prokon", quantity: 1 }],
    contact: {
      name: "Ada",
      email: "ada@example.com",
      phone: doubledPhone,
      company: "Aptus",
    },
  },
  "ORD-1",
);
assert.match(verifyPayment.body, /Customer Phone: \+96899999994/);
assert.doesNotMatch(verifyPayment.body, /\+968\+968/);

const bankAdmin = formatBankTransferAdminEmail({
  customerName: "Ada",
  company: "Aptus",
  email: "ada@example.com",
  phone: doubledPhone,
  reference: "SO-9",
  bankTransferReference: "BT-1",
  products: ["Prokon"],
  totalAmount: "OMR 100",
});
assert.match(bankAdmin.body, /Phone: \+96899999994/);
assert.doesNotMatch(bankAdmin.body, /\+968\+968/);

console.log("order-notification.check: ok");
