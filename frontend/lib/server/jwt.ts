import { createSign, createVerify, randomUUID } from "crypto";
import {
  ACCESS_TOKEN_MAX_AGE_SEC,
  DEFAULT_USER_ROLE,
  getJwtPrivateKey,
  getJwtPublicKey,
  REFRESH_TOKEN_MAX_AGE_SEC,
  type UserRole,
} from "./config";
import { isTokenRevoked } from "./token-blocklist";

export type SessionClaims = {
  sub: string;
  email: string;
  partnerId?: number;
  name: string;
  roles: UserRole[];
  jti: string;
  traceId: string;
};

type JwtPayload = SessionClaims & {
  iat: number;
  exp: number;
  typ: "access" | "refresh";
};

function base64UrlEncode(value: string | Buffer): string {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signRs256(header: string, body: string, privateKey: string): string {
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${body}`);
  signer.end();
  return signer.sign(privateKey, "base64url");
}

function verifyRs256(header: string, body: string, signature: string, publicKey: string): boolean {
  try {
    const verifier = createVerify("RSA-SHA256");
    verifier.update(`${header}.${body}`);
    verifier.end();
    return verifier.verify(publicKey, Buffer.from(signature, "base64url"));
  } catch {
    return false;
  }
}

export function createTraceId(): string {
  return randomUUID();
}

export type TokenPairInput = {
  sub: string;
  email: string;
  name: string;
  partnerId?: number;
  roles?: UserRole[];
  traceId?: string;
};

export type SignedTokens = {
  accessToken: string;
  refreshToken: string;
  accessJti: string;
  refreshJti: string;
  traceId: string;
  expiresIn: number;
  /** Cookie / KV refresh lifetime for this issuance (remember-me aware). */
  refreshMaxAgeSec?: number;
};

function signToken(
  claims: TokenPairInput,
  typ: "access" | "refresh",
  maxAgeSec: number,
  traceId: string,
): { token: string; jti: string; payload: JwtPayload } {
  const privateKey = getJwtPrivateKey();
  const now = Math.floor(Date.now() / 1000);
  const jti = randomUUID();
  const payload: JwtPayload = {
    sub: claims.sub,
    email: claims.email,
    name: claims.name,
    partnerId: claims.partnerId,
    roles: claims.roles ?? [DEFAULT_USER_ROLE],
    jti,
    traceId,
    iat: now,
    exp: now + maxAgeSec,
    typ,
  };
  const header = base64UrlEncode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const body = base64UrlEncode(JSON.stringify(payload));
  const signature = signRs256(header, body, privateKey);
  return { token: `${header}.${body}.${signature}`, jti, payload };
}

export function signTokenPair(
  claims: TokenPairInput,
  options?: { refreshMaxAgeSec?: number },
): SignedTokens {
  const traceId = claims.traceId ?? createTraceId();
  const refreshMaxAgeSec = options?.refreshMaxAgeSec ?? REFRESH_TOKEN_MAX_AGE_SEC;
  const access = signToken(claims, "access", ACCESS_TOKEN_MAX_AGE_SEC, traceId);
  const refresh = signToken(claims, "refresh", refreshMaxAgeSec, traceId);
  return {
    accessToken: access.token,
    refreshToken: refresh.token,
    accessJti: access.jti,
    refreshJti: refresh.jti,
    traceId,
    expiresIn: ACCESS_TOKEN_MAX_AGE_SEC,
    refreshMaxAgeSec,
  };
}

/** Legacy helper — issues a single long-lived HS256-style session via RS256 access token. */
export function signSessionToken(
  claims: Omit<SessionClaims, "jti" | "traceId" | "roles"> & {
    roles?: UserRole[];
    traceId?: string;
  },
  maxAgeSec = ACCESS_TOKEN_MAX_AGE_SEC,
): string {
  return signToken(
    {
      sub: claims.sub,
      email: claims.email,
      name: claims.name,
      partnerId: claims.partnerId,
      roles: claims.roles,
      traceId: claims.traceId,
    },
    "access",
    maxAgeSec,
    claims.traceId ?? createTraceId(),
  ).token;
}

async function parseAndVerify(
  token: string,
  expectedTyp?: "access" | "refresh",
): Promise<SessionClaims | null> {
  const publicKey = getJwtPublicKey();
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [header, body, signature] = parts;

  try {
    const hdr = JSON.parse(base64UrlDecode(header)) as { alg?: string };
    if (hdr.alg !== "RS256") return null;
  } catch {
    return null;
  }

  if (!verifyRs256(header, body, signature, publicKey)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(body)) as JwtPayload;
    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    if (expectedTyp && payload.typ !== expectedTyp) return null;
    if (typeof payload.sub !== "string" || typeof payload.email !== "string") return null;
    if (typeof payload.jti !== "string") return null;
    if (await isTokenRevoked(payload.jti)) return null;

    return {
      sub: payload.sub,
      email: payload.email,
      partnerId: payload.partnerId,
      name: payload.name ?? payload.email,
      roles: Array.isArray(payload.roles) ? payload.roles : [DEFAULT_USER_ROLE],
      jti: payload.jti,
      traceId: payload.traceId ?? createTraceId(),
    };
  } catch {
    return null;
  }
}

export async function verifyAccessToken(token: string): Promise<SessionClaims | null> {
  return parseAndVerify(token, "access");
}

export async function verifyRefreshToken(token: string): Promise<SessionClaims | null> {
  return parseAndVerify(token, "refresh");
}

/** @deprecated Use verifyAccessToken */
export async function verifySessionToken(token: string): Promise<SessionClaims | null> {
  return verifyAccessToken(token);
}
