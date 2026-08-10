import { z } from "zod";
import { formatCustomerMessageForOdooOptional } from "@/lib/portal-customer-message";

export const loginSchema = z.object({
  email: z
    .string({ error: "Email is required" })
    .email("Invalid email address")
    .max(254)
    .transform((v) => v.toLowerCase().trim()),
  password: z
    .string({ error: "Password is required" })
    .min(1, "Password is required")
    .max(128),
  remember: z.boolean().optional(),
});

export const resendVerificationSchema = z.object({
  email: z
    .string({ error: "Email is required" })
    .email("Invalid email address")
    .max(254)
    .transform((v) => v.toLowerCase().trim()),
});

export const userTypeSchema = z.enum(["oman_company", "outside_oman", "individual"]);

export const checkIdentificationSchema = z
  .object({
    userType: userTypeSchema,
    identifier: z
      .string({ error: "Identification is required" })
      .min(3, "Enter a valid CR number or mobile number")
      .max(32)
      .trim(),
    pendingEmail: z
      .string()
      .email("Invalid email address")
      .max(254)
      .transform((v) => v.toLowerCase().trim())
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.userType === "individual" && data.identifier.length < 7) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a valid mobile number",
        path: ["identifier"],
      });
    }
  });

export const sendOtpSchema = z.object({
  recoveryToken: z.string().min(16).max(128),
  channel: z.enum(["email", "sms"]),
});

export const verifyOtpSchema = z.object({
  recoveryToken: z.string().min(16).max(128),
  otp: z
    .string({ error: "OTP is required" })
    .min(4, "Enter the verification code")
    .max(8)
    .trim(),
});

export const resetPasswordSchema = z.object({
  recoveryToken: z.string().min(16).max(128),
  /** Optional when OTP was already verified via /forgot-password/verify-otp */
  otp: z
    .string()
    .min(4, "Enter the verification code")
    .max(8)
    .trim()
    .optional(),
  password: z
    .string({ error: "Password is required" })
    .min(8, "Password must be at least 8 characters")
    .max(128)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain uppercase, lowercase, and a number",
    ),
});

export const registerSchema = z
  .object({
    userType: userTypeSchema,
    name: z
      .string({ error: "Name is required" })
      .min(2, "Name must be at least 2 characters")
      .max(128)
      .trim(),
    companyName: z.string().max(128).trim().optional(),
    region: z.string().max(128).trim().optional(),
    crNumber: z.string().max(32).trim().optional(),
    email: z
      .string({ error: "Email is required" })
      .email("Invalid email address")
      .max(254)
      .transform((v) => v.toLowerCase().trim()),
    password: z
      .string({ error: "Password is required" })
      .min(8, "Password must be at least 8 characters")
      .max(128)
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain uppercase, lowercase, and a number",
      ),
    contactType: z.enum(["person", "company"]).optional(),
    phone: z.string().max(32).optional(),
    street: z.string().max(128).optional(),
    street2: z.string().max(128).optional(),
    city: z.string().max(64).optional(),
    state: z.string().max(64).optional(),
    zip: z.string().max(16).optional(),
    country: z.string().max(64).optional(),
    taxId: z.string().max(32).optional(),
    website: z.string().max(256).optional(),
    language: z.string().max(16).optional(),
    tags: z.string().max(256).optional(),
  })
  .superRefine((data, ctx) => {
    const isCompany = data.userType === "oman_company" || data.userType === "outside_oman";
    const cr = (data.crNumber ?? data.taxId)?.trim();
    if (isCompany && !cr) {
      ctx.addIssue({
        code: "custom",
        message: "CR number is required",
        path: ["crNumber"],
      });
    }
    if (data.userType === "individual" && !(data.phone?.trim())) {
      ctx.addIssue({
        code: "custom",
        message: "Mobile number is required",
        path: ["phone"],
      });
    }
  });

export const profileUpdateSchema = z.object({
  name: z.string().min(2).max(128).trim(),
  contactType: z.enum(["person", "company"]).optional(),
  phone: z.string().max(32).optional(),
  street: z.string().max(128).optional(),
  street2: z.string().max(128).optional(),
  city: z.string().max(64).optional(),
  state: z.string().max(64).optional(),
  zip: z.string().max(16).optional(),
  country: z.string().max(64).optional(),
  // ponytail: CR / tax ID is set at registration and stays unique — profile PATCH must not accept it
  website: z.string().max(256).optional(),
  language: z.string().max(16).optional(),
  tags: z.string().max(256).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
export type CheckIdentificationInput = z.infer<typeof checkIdentificationSchema>;
export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type RegisterInputValidated = z.infer<typeof registerSchema>;
export type ProfileUpdateValidated = z.infer<typeof profileUpdateSchema>;

export const portalCartSchema = z.object({
  duration: z.enum(["1year", "3year"]),
  items: z
    .array(
      z.object({
        category: z.string().min(1).max(64).trim(),
        productName: z.string().min(1).max(128).trim(),
        quantity: z.number().int().min(1).max(999),
        duration: z.enum(["1year", "3year"]).optional(),
        purchaseType: z.enum(["new", "renew"]).optional(),
        packageId: z.string().max(64).trim().optional(),
        levelId: z.string().max(64).trim().optional(),
      }),
    )
    .max(50),
});

export type PortalCartValidated = z.infer<typeof portalCartSchema>;

export const placeOrderSchema = z.object({
  duration: z.enum(["1year", "3year"]),
  items: z
    .array(
      z.object({
        category: z.string().min(1).max(64).trim(),
        productName: z.string().min(1).max(128).trim(),
        quantity: z.number().int().min(1).max(999),
        duration: z.enum(["1year", "3year"]).optional(),
        purchaseType: z.enum(["new", "renew"]).optional(),
        packageId: z.string().max(64).trim().optional(),
        levelId: z.string().max(64).trim().optional(),
      }),
    )
    .min(1, "Select at least one product")
    .max(50),
  contactName: z.string().max(128).trim().optional(),
  contactEmail: z.string().email().max(254).trim().optional(),
  contactPhone: z.string().max(32).trim().optional(),
  customerMessage: z
    .string()
    .max(2000)
    .optional()
    .transform((value) => formatCustomerMessageForOdooOptional(value)),
  paymentIntentId: z.string().max(128).trim().optional(),
  amountPaid: z.number().positive().optional(),
  paymentMethod: z.string().max(128).trim().optional(),
});

export type PlaceOrderValidated = z.infer<typeof placeOrderSchema>;

export const subscriptionRequestSchema = z.object({
  productName: z.string().min(1).max(128).trim(),
  requestType: z.enum(["renew", "upgrade", "downgrade", "cancel"]),
  orderId: z.number().int().positive().optional(),
  lineId: z.number().int().positive().optional(),
  renewalDateIso: z.string().max(32).trim().optional(),
  notes: z.string().max(2000).trim().optional(),
});

export type SubscriptionRequestValidated = z.infer<typeof subscriptionRequestSchema>;

export const subscriptionCancelSchema = z.object({
  productName: z.string().min(1).max(128).trim(),
  orderId: z.number().int().positive().optional(),
  lineId: z.number().int().positive().optional(),
  leadId: z.number().int().positive().optional(),
  saleOrderId: z.number().int().positive().optional(),
});

export type SubscriptionCancelValidated = z.infer<typeof subscriptionCancelSchema>;

export const refundRequestSchema = z.object({
  orderReference: z.string().min(1).max(64).trim(),
  productName: z.string().min(1).max(128).trim(),
  amount: z.string().min(1).max(32).trim(),
  reason: z.string().max(2000).trim().optional(),
});

export type RefundRequestValidated = z.infer<typeof refundRequestSchema>;

export const refundProcessSchema = z.object({
  action: z.enum(["process", "reject"]),
  paymentMethod: z.string().max(64).trim().optional(),
  estimatedArrival: z.string().max(64).trim().optional(),
  rejectReason: z.string().max(2000).trim().optional(),
});

export type RefundProcessValidated = z.infer<typeof refundProcessSchema>;

export const adminOrderStatusSchema = z.object({
  status: z.enum(["Submitted", "Under Review", "Approved", "Rejected", "Completed"]),
  assignedStaff: z.string().max(128).trim().optional(),
  reason: z.string().max(500).trim().optional(),
});

export const adminRenewalStatusSchema = z.object({
  status: z.enum(["Submitted", "Approved", "Rejected"]),
});

export type AdminOrderStatusValidated = z.infer<typeof adminOrderStatusSchema>;

const portalOrderSnapshotSchema = z.object({
  id: z.string().min(1).max(128),
  reference: z.string().min(1).max(128),
  actorId: z.string().max(128).optional(),
  partnerId: z.number().int().nonnegative(),
  status: z.enum(["Submitted", "Under Review", "Approved", "Rejected", "Completed"]),
  duration: z.enum(["1year", "3year"]),
  items: z.array(
    z.object({
      category: z.string().min(1).max(64),
      productName: z.string().min(1).max(128),
      quantity: z.number().int().min(1).max(999),
    }),
  ),
  leadId: z.number().int().positive().optional(),
  saleOrderId: z.number().int().positive().optional(),
  createdAt: z.string().max(64).optional(),
  updatedAt: z.string().max(64).optional(),
  paymentStatus: z.enum(["pending", "pending_verification", "paid", "failed"]).optional(),
  amountDue: z.number().positive().optional(),
});

export const orderPaymentCheckoutSchema = z.object({
  orderId: z.string().min(1).max(128),
  /** Defaults to stripe when omitted — bank_transfer uses its own upload route. */
  paymentMethod: z.enum(["bank_transfer", "card", "stripe", "paypal"]).optional(),
  currency: z.string().max(8).trim().optional(),
  idempotencyKey: z.string().max(128).trim().optional(),
  orderSnapshot: portalOrderSnapshotSchema.optional(),
  customerMessage: z
    .string()
    .max(2000)
    .optional()
    .transform((value) => formatCustomerMessageForOdooOptional(value)),
});

export const orderPaymentCompleteSchema = z.object({
  paymentIntentId: z.string().min(1).max(128).trim(),
  amountPaid: z.number().positive(),
  paymentMethod: z.string().max(128).trim().optional(),
  orderSnapshot: portalOrderSnapshotSchema.optional(),
  customerMessage: z
    .string()
    .max(2000)
    .optional()
    .transform((value) => formatCustomerMessageForOdooOptional(value)),
});

export function validationErrorResponse(error: z.ZodError): {
  error: string;
  issues: z.ZodIssue[];
} {
  return {
    error: "Validation failed",
    issues: error.issues,
  };
}
