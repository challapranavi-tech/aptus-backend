import type { RateLimitRule } from "./rate-limit";

/**
 * Central rate-limit policy table for every `/api` route.
 *
 * Thresholds are deliberately far above real usage — they exist to stop
 * scripted abuse, credential stuffing and cost amplification, not to pace
 * ordinary browsing. Two principles drive the numbers:
 *
 *  - Unauthenticated routes are policed by IP, because that is the only stable
 *    identifier available. Limits stay generous enough for a shared office or
 *    mobile-carrier NAT, where many real people share one address.
 *  - Authenticated routes are policed primarily per user, which is precise and
 *    NAT-proof. Their IP rules are only a loose backstop against one host
 *    driving many accounts.
 */

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function rule(name: string, limit: number, windowSec: number): RateLimitRule {
  return { name, limit, windowSec };
}

export type RateLimitPolicy = {
  name: string;
  /** Keyed by client IP scope. Always applied. */
  ip: RateLimitRule[];
  /** Keyed by user id. Applied only when the request carries a valid session. */
  user?: RateLimitRule[];
  /** Skip the cross-endpoint IP ceiling (used for signed machine-to-machine traffic). */
  exemptFromGlobal?: boolean;
};

/**
 * Cross-endpoint ceiling applied to every API request from one IP. Individual
 * policies are generous on their own; this catches a caller that spreads the
 * same volume across many different endpoints to stay under each one.
 */
export const GLOBAL_IP_RULE = rule("global", 1200, MINUTE);

const POLICIES = {
  /** Cacheable catalogue/content reads. Cheap, so the cap is high. */
  publicRead: {
    name: "public_read",
    ip: [rule("burst", 60, 10), rule("sustained", 600, 5 * MINUTE)],
  },

  /** Health/status probes. Tight, since the response aids reconnaissance. */
  publicStatus: {
    name: "public_status",
    ip: [rule("sustained", 10, MINUTE), rule("daily", 200, DAY)],
  },

  /** Marketing lead capture: writes to CRM and is a spam magnet. */
  publicLead: {
    name: "public_lead",
    ip: [rule("sustained", 5, 10 * MINUTE), rule("daily", 20, DAY)],
  },

  /** Credential stuffing target. Also limited per email address at the route. */
  authLogin: {
    name: "auth_login",
    ip: [rule("sustained", 10, 15 * MINUTE), rule("daily", 50, DAY)],
  },

  authRegister: {
    name: "auth_register",
    ip: [rule("sustained", 5, 15 * MINUTE), rule("daily", 20, DAY)],
  },

  /** Account-existence oracle — worth limiting tightly to slow enumeration. */
  authIdentify: {
    name: "auth_identify",
    ip: [rule("sustained", 10, 15 * MINUTE), rule("daily", 40, DAY)],
  },

  /** Sends email/SMS on every call, so abuse costs real money. */
  authOtpSend: {
    name: "auth_otp_send",
    ip: [rule("sustained", 5, 15 * MINUTE), rule("daily", 15, DAY)],
  },

  /** OTP verification — guessing is also capped per session inside the route. */
  authOtpReset: {
    name: "auth_otp_reset",
    ip: [rule("sustained", 10, 15 * MINUTE), rule("daily", 30, DAY)],
  },

  /**
   * Token rotation. A tab left open refreshes on a timer, and several tabs
   * refresh independently, so this needs headroom for honest clients.
   */
  authRefresh: {
    name: "auth_refresh",
    ip: [rule("sustained", 120, 15 * MINUTE)],
    user: [rule("sustained", 40, 15 * MINUTE)],
  },

  authLogout: {
    name: "auth_logout",
    ip: [rule("sustained", 30, 5 * MINUTE)],
  },

  /** Session-scoped reads that the portal UI polls. */
  sessionRead: {
    name: "session_read",
    ip: [rule("sustained", 900, MINUTE)],
    user: [rule("sustained", 180, MINUTE)],
  },

  sessionWrite: {
    name: "session_write",
    ip: [rule("sustained", 300, 5 * MINUTE)],
    user: [rule("sustained", 20, 10 * MINUTE)],
  },

  /**
   * Cart auto-save. Every add, quantity change and term change persists, so this is the
   * highest-frequency portal write; sharing sessionWrite's 20/10min with profile edits
   * meant normal shopping hit 429 and silently lost the Odoo CRM cart sync.
   */
  cartWrite: {
    name: "cart_write",
    ip: [rule("sustained", 400, 10 * MINUTE)],
    user: [rule("sustained", 80, 10 * MINUTE)],
  },

  /** Portal reads that fan out to Odoo, so pricier than a static read. */
  portalRead: {
    name: "portal_read",
    ip: [rule("sustained", 600, MINUTE)],
    user: [rule("sustained", 90, MINUTE)],
  },

  /** Creates CRM leads / sale orders and sends notification email. */
  portalWrite: {
    name: "portal_write",
    ip: [rule("sustained", 120, 10 * MINUTE)],
    user: [rule("sustained", 10, 10 * MINUTE), rule("daily", 40, DAY)],
  },

  /** Cancellation is destructive and irreversible from the UI. */
  portalDestructive: {
    name: "portal_destructive",
    ip: [rule("sustained", 60, 10 * MINUTE)],
    user: [rule("sustained", 5, 10 * MINUTE), rule("daily", 20, DAY)],
  },

  /** Each call hits the Stripe API and creates a billable PaymentIntent. */
  paymentIntent: {
    name: "payment_intent",
    ip: [rule("sustained", 60, 10 * MINUTE)],
    user: [rule("sustained", 10, 10 * MINUTE), rule("daily", 40, DAY)],
  },

  paymentRecord: {
    name: "payment_record",
    ip: [rule("sustained", 100, 10 * MINUTE)],
    user: [rule("sustained", 20, 10 * MINUTE)],
  },

  /** Multipart upload up to 10 MB plus two outbound emails per call. */
  upload: {
    name: "upload",
    ip: [rule("sustained", 30, HOUR)],
    user: [rule("sustained", 5, HOUR), rule("daily", 20, DAY)],
  },

  download: {
    name: "download",
    ip: [rule("sustained", 200, HOUR)],
    user: [rule("sustained", 60, HOUR)],
  },

  /** Full personal-data export: expensive to build and sensitive to leak. */
  dataExport: {
    name: "data_export",
    ip: [rule("sustained", 10, HOUR)],
    user: [rule("sustained", 3, HOUR), rule("daily", 10, DAY)],
  },

  accountDelete: {
    name: "account_delete",
    ip: [rule("sustained", 10, HOUR)],
    user: [rule("sustained", 3, HOUR)],
  },

  admin: {
    name: "admin",
    ip: [rule("sustained", 1200, 5 * MINUTE)],
    user: [rule("sustained", 600, 5 * MINUTE)],
  },

  /**
   * Stripe delivers from a wide, changing IP range and retries in bursts, so a
   * tight IP cap would drop legitimate events. Authenticity is enforced by the
   * webhook signature; this is only a flood guard.
   */
  webhook: {
    name: "webhook",
    ip: [rule("sustained", 600, MINUTE)],
    exemptFromGlobal: true,
  },

  /**
   * Fallback for any route not listed below, so a newly added endpoint is
   * protected from the moment it ships rather than whenever someone remembers.
   */
  default: {
    name: "default_api",
    ip: [rule("sustained", 100, MINUTE), rule("hourly", 1000, HOUR)],
    user: [rule("sustained", 300, MINUTE)],
  },
} satisfies Record<string, RateLimitPolicy>;

export const DEFAULT_POLICY: RateLimitPolicy = POLICIES.default;

type Route = {
  pattern: RegExp;
  methods?: string[];
  policy: RateLimitPolicy;
};

/** Matched in order; the first hit wins, so list specific paths before prefixes. */
const ROUTES: Route[] = [
  { pattern: /^\/api\/auth\/login$/, policy: POLICIES.authLogin },
  { pattern: /^\/api\/auth\/register$/, methods: ["POST"], policy: POLICIES.authRegister },
  { pattern: /^\/api\/auth\/register$/, methods: ["GET"], policy: POLICIES.publicRead },
  { pattern: /^\/api\/auth\/logout$/, policy: POLICIES.authLogout },
  { pattern: /^\/api\/auth\/refresh$/, policy: POLICIES.authRefresh },
  { pattern: /^\/api\/auth\/check-identification$/, policy: POLICIES.authIdentify },
  { pattern: /^\/api\/auth\/forgot-password\/send-otp$/, policy: POLICIES.authOtpSend },
  { pattern: /^\/api\/auth\/forgot-password\/verify-otp$/, policy: POLICIES.authOtpReset },
  { pattern: /^\/api\/auth\/forgot-password\/reset$/, policy: POLICIES.authOtpReset },
  { pattern: /^\/api\/auth\/verify-email\/resend$/, policy: POLICIES.authOtpSend },
  // security: token-consuming POST shares the OTP-reset policy (tight IP caps);
  // GET is a no-op redirect (no token consumption), so it is left on the default.
  { pattern: /^\/api\/auth\/verify-email$/, methods: ["POST"], policy: POLICIES.authOtpReset },
  { pattern: /^\/api\/auth\/export$/, policy: POLICIES.dataExport },
  { pattern: /^\/api\/auth\/account$/, policy: POLICIES.accountDelete },
  { pattern: /^\/api\/auth\/profile$/, methods: ["PATCH", "PUT", "POST"], policy: POLICIES.sessionWrite },
  { pattern: /^\/api\/auth\/profile$/, policy: POLICIES.sessionRead },
  { pattern: /^\/api\/auth\/me$/, policy: POLICIES.sessionRead },
  { pattern: /^\/api\/client\/profile$/, policy: POLICIES.sessionRead },
  { pattern: /^\/api\/notifications$/, policy: POLICIES.sessionRead },

  // Cart persistence may CRM-sync, but it is high-frequency UI traffic and must not share
  // a bucket with order placement (portal_write's 10/10min would block checkout) or with
  // profile edits (session_write's 20/10min was exhausted by ordinary browsing).
  { pattern: /^\/api\/cart$/, methods: ["PUT"], policy: POLICIES.cartWrite },
  { pattern: /^\/api\/cart$/, methods: ["DELETE"], policy: POLICIES.sessionWrite },
  { pattern: /^\/api\/cart$/, policy: POLICIES.sessionRead },

  { pattern: /^\/api\/refunds$/, methods: ["POST"], policy: POLICIES.portalWrite },
  { pattern: /^\/api\/refunds$/, policy: POLICIES.portalRead },

  { pattern: /^\/api\/admin(\/.*)?$/, policy: POLICIES.admin },

  { pattern: /^\/api\/orders\/place$/, policy: POLICIES.portalWrite },
  { pattern: /^\/api\/orders\/[^/]+\/bank-transfer$/, policy: POLICIES.upload },
  { pattern: /^\/api\/orders\/[^/]+\/payment-proof$/, policy: POLICIES.download },
  { pattern: /^\/api\/orders\/[^/]+\/payment$/, policy: POLICIES.paymentRecord },
  { pattern: /^\/api\/orders$/, policy: POLICIES.portalRead },

  { pattern: /^\/api\/payments\/webhook$/, policy: POLICIES.webhook },
  { pattern: /^\/api\/payments\/checkout$/, policy: POLICIES.paymentIntent },
  { pattern: /^\/api\/payments\/bank-details$/, policy: POLICIES.portalRead },

  { pattern: /^\/api\/subscriptions\/cancel$/, policy: POLICIES.portalDestructive },
  { pattern: /^\/api\/subscriptions\/(create|request)$/, policy: POLICIES.portalWrite },
  { pattern: /^\/api\/subscriptions$/, policy: POLICIES.portalRead },

  { pattern: /^\/api\/products\/leads$/, policy: POLICIES.publicLead },
  { pattern: /^\/api\/products(\/[^/]+)?$/, policy: POLICIES.publicRead },
  { pattern: /^\/api\/product-categories$/, policy: POLICIES.publicRead },
  { pattern: /^\/api\/site-settings$/, policy: POLICIES.publicRead },
  { pattern: /^\/api\/odoo\/status$/, policy: POLICIES.publicStatus },
];

/** Resolves the policy for a request path and method, falling back to the default. */
export function resolvePolicy(pathname: string, method: string): RateLimitPolicy {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const verb = method.toUpperCase();

  for (const route of ROUTES) {
    if (!route.pattern.test(path)) continue;
    if (route.methods && !route.methods.includes(verb)) continue;
    return route.policy;
  }
  return DEFAULT_POLICY;
}

/**
 * Limits keyed on a value from the request body, enforced inside the route
 * because middleware cannot read the body. These close the gap that IP limits
 * leave open: an attacker distributed across many addresses stays under every
 * per-IP rule while still concentrating attempts on a single account.
 */
export const IDENTIFIER_RULES = {
  /** Password spraying one account from many source addresses. */
  loginEmail: rule("login_email", 8, 15 * MINUTE),
  /** Mailbombing one recovery session with repeated OTP sends. */
  otpRecovery: rule("otp_recovery", 4, 15 * MINUTE),
  /** OTP guessing against one recovery session. */
  resetToken: rule("reset_token", 8, 15 * MINUTE),
  /** Enumerating whether a CR number or mobile is registered. */
  identifyTarget: rule("identify_target", 6, 15 * MINUTE),
  /** Lead spam from one email address across product pages. */
  leadEmail: rule("lead_email", 5, HOUR),
  /** Resending the verification email on demand. */
  emailVerifyResend: rule("email_verify_resend", 3, 15 * MINUTE),
} satisfies Record<string, RateLimitRule>;
