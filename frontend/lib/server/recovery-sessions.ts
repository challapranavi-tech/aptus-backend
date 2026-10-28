import { randomBytes, randomInt } from "crypto";
import { getTestOtpCode, isTestOtpEnabled } from "./config";
import { kvDel, kvGet, kvSet } from "./kv-store";

const RECOVERY_TTL_SEC = 15 * 60;
const OTP_TTL_SEC = 10 * 60;
const MAX_OTP_ATTEMPTS = 5;

const RECOVERY_PREFIX = "aptus:recovery:";
const OTP_PREFIX = "aptus:otp:";

type RecoverySession = {
  accountEmail: string;
  identifier: string;
  otpVerified?: boolean;
};

type OtpRecord = {
  code: string;
  channel: "email" | "sms";
  attempts: number;
};

export async function createRecoverySession(accountEmail: string, identifier: string): Promise<string> {
  const token = randomBytes(24).toString("hex");
  const session: RecoverySession = {
    accountEmail: accountEmail.trim().toLowerCase(),
    identifier,
    otpVerified: false,
  };
  try {
    await kvSet(`${RECOVERY_PREFIX}${token}`, session, RECOVERY_TTL_SEC);
  } catch {
    // Identification can still continue; password recovery may fail until Redis is set.
  }
  return token;
}

export async function getRecoverySession(token: string): Promise<RecoverySession | null> {
  return kvGet<RecoverySession>(`${RECOVERY_PREFIX}${token}`);
}

export async function clearRecoverySession(token: string): Promise<void> {
  await kvDel(`${RECOVERY_PREFIX}${token}`);
  await kvDel(`${OTP_PREFIX}${token}`);
}

async function refreshRecoverySession(token: string, session: RecoverySession): Promise<void> {
  await kvSet(`${RECOVERY_PREFIX}${token}`, session, RECOVERY_TTL_SEC);
}

function generateOtpCode(): string {
  if (isTestOtpEnabled()) return getTestOtpCode();
  return String(randomInt(100000, 999999));
}

export async function issueOtp(
  recoveryToken: string,
  channel: "email" | "sms",
): Promise<{ code: string; expiresInSec: number } | null> {
  const session = await getRecoverySession(recoveryToken);
  if (!session) return null;

  const code = generateOtpCode();
  const record: OtpRecord = { code, channel, attempts: 0 };
  await kvSet(`${OTP_PREFIX}${recoveryToken}`, record, OTP_TTL_SEC);
  await refreshRecoverySession(recoveryToken, { ...session, otpVerified: false });

  return { code, expiresInSec: OTP_TTL_SEC };
}

/** Verify OTP and mark the recovery session ready for password reset. */
export async function verifyOtp(recoveryToken: string, code: string): Promise<boolean> {
  const key = `${OTP_PREFIX}${recoveryToken}`;
  const record = await kvGet<OtpRecord>(key);
  if (!record) return false;

  const session = await getRecoverySession(recoveryToken);
  if (!session) return false;

  const attempts = record.attempts + 1;
  if (attempts > MAX_OTP_ATTEMPTS) {
    await clearRecoverySession(recoveryToken);
    return false;
  }

  const normalized = code.trim();
  const valid =
    record.code === normalized ||
    (isTestOtpEnabled() && normalized === getTestOtpCode());

  if (valid) {
    await kvDel(key);
    await refreshRecoverySession(recoveryToken, { ...session, otpVerified: true });
    return true;
  }

  await kvSet(key, { ...record, attempts }, OTP_TTL_SEC);
  return false;
}

export async function isRecoveryOtpVerified(recoveryToken: string): Promise<boolean> {
  const session = await getRecoverySession(recoveryToken);
  return Boolean(session?.otpVerified);
}
