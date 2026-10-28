import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { createHmac, timingSafeEqual } from "crypto";
import { getStripeConfig } from "./config";
import { withCircuitBreaker, CircuitOpenError } from "./circuit-breaker";
import { logger } from "./logger";

export type PaymentRecord = {
  id: string;
  paymentIntentId: string;
  status: string;
  amount: number;
  currency: string;
  userId?: string;
  idempotencyKey: string;
  createdAt: string;
};

const DATA_DIR = path.join(process.cwd(), ".data");
const PAYMENTS_FILE = path.join(DATA_DIR, "payments.json");
const DLQ_FILE = path.join(DATA_DIR, "webhook-dlq.jsonl");

type GlobalStore = typeof globalThis & {
  __aptusPayments?: Map<string, PaymentRecord>;
};

const globalStore = globalThis as GlobalStore;

function getPayments(): Map<string, PaymentRecord> {
  if (!globalStore.__aptusPayments) {
    try {
      if (fs.existsSync(PAYMENTS_FILE)) {
        const raw = JSON.parse(fs.readFileSync(PAYMENTS_FILE, "utf8")) as Record<string, PaymentRecord>;
        globalStore.__aptusPayments = new Map(Object.entries(raw));
      } else {
        globalStore.__aptusPayments = new Map();
      }
    } catch {
      globalStore.__aptusPayments = new Map();
    }
  }
  return globalStore.__aptusPayments;
}

function persistPayments(): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(
    PAYMENTS_FILE,
    JSON.stringify(Object.fromEntries(getPayments()), null, 2),
    "utf8",
  );
}

export function findPaymentByIdempotencyKey(key: string): PaymentRecord | null {
  for (const record of getPayments().values()) {
    if (record.idempotencyKey === key) return record;
  }
  return null;
}

export function findPaymentByPaymentIntentId(paymentIntentId: string): PaymentRecord | null {
  for (const record of getPayments().values()) {
    if (record.paymentIntentId === paymentIntentId) return record;
  }
  return null;
}

export function wasStripeWebhookEventProcessed(eventId: string): boolean {
  if (!eventId) return false;
  const file = path.join(DATA_DIR, "stripe-webhook-events.jsonl");
  if (!fs.existsSync(file)) return false;
  try {
    const lines = fs.readFileSync(file, "utf8").trim().split("\n").filter(Boolean);
    return lines.some((line) => {
      const row = JSON.parse(line) as { eventId?: string };
      return row.eventId === eventId;
    });
  } catch {
    return false;
  }
}

export function markStripeWebhookEventProcessed(eventId: string): void {
  if (!eventId) return;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.appendFileSync(
    path.join(DATA_DIR, "stripe-webhook-events.jsonl"),
    `${JSON.stringify({ eventId, processedAt: new Date().toISOString() })}\n`,
    "utf8",
  );
}

export function savePayment(record: PaymentRecord): void {
  const store = getPayments();
  store.set(record.id, record);
  persistPayments();
}

export function enqueueWebhookFailure(payload: Record<string, unknown>, error: string): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.appendFileSync(
    DLQ_FILE,
    `${JSON.stringify({ id: randomUUID(), error, payload, createdAt: new Date().toISOString() })}\n`,
    "utf8",
  );
}

export function verifyStripeWebhookSignature(
  payload: string,
  signatureHeader: string,
  secret: string,
): boolean {
  if (!secret) return false;

  const parts = signatureHeader.split(",").reduce<Record<string, string>>((acc, part) => {
    const [k, v] = part.split("=");
    if (k && v) acc[k.trim()] = v.trim();
    return acc;
  }, {});

  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const expected = createHmac("sha256", secret).update(signedPayload, "utf8").digest("hex");

  try {
    const sigBuf = Buffer.from(signature, "hex");
    const expBuf = Buffer.from(expected, "hex");
    if (sigBuf.length !== expBuf.length) return false;
    return timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}

export async function createStripePaymentIntent(input: {
  amount: number;
  currency: string;
  idempotencyKey: string;
  userId: string;
  metadata?: Record<string, string>;
}): Promise<PaymentRecord> {
  const existing = findPaymentByIdempotencyKey(input.idempotencyKey);
  if (existing) return existing;

  const config = getStripeConfig();
  if (!config) {
    const mock: PaymentRecord = {
      id: randomUUID(),
      paymentIntentId: `pi_mock_${randomUUID().slice(0, 8)}`,
      status: "requires_payment_method",
      amount: input.amount,
      currency: input.currency,
      userId: input.userId,
      idempotencyKey: input.idempotencyKey,
      createdAt: new Date().toISOString(),
    };
    savePayment(mock);
    return mock;
  }

  return withCircuitBreaker("stripe", async () => {
    const body = new URLSearchParams({
      amount: String(input.amount),
      currency: input.currency,
      "metadata[userId]": input.userId,
      ...(input.metadata
        ? Object.fromEntries(Object.entries(input.metadata).map(([k, v]) => [`metadata[${k}]`, v]))
        : {}),
    });

    const response = await fetch("https://api.stripe.com/v1/payment_intents", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Idempotency-Key": input.idempotencyKey,
      },
      body,
    });

    if (!response.ok) {
      const errText = await response.text();
      logger.error("Stripe payment intent failed", { status: response.status, errText });
      throw new Error("Payment provider error");
    }

    const data = (await response.json()) as {
      id: string;
      status: string;
      amount: number;
      currency: string;
    };

    const record: PaymentRecord = {
      id: randomUUID(),
      paymentIntentId: data.id,
      status: data.status,
      amount: data.amount,
      currency: data.currency,
      userId: input.userId,
      idempotencyKey: input.idempotencyKey,
      createdAt: new Date().toISOString(),
    };
    savePayment(record);
    return record;
  });
}

export { CircuitOpenError };
