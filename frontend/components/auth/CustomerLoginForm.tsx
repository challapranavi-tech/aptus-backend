"use client";

import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import {
  clearAccessToken,
  clearLegacyPortalSession,
  setAccessToken,
  syncLegacyPortalSession,
  type LegacySessionUser,
} from "@/lib/access-token";
import { fetchAuthMeShared, invalidateAuthMeCache } from "@/lib/auth-me-client";
import { syncPortalCartWithServer } from "@/lib/portal-cart";
import { invalidatePortalSharedFetch } from "@/lib/portal-shared-fetch";
import { safeNextPath } from "@/lib/safe-next-path";
import { AuthCardFoot } from "@/components/auth/AuthCardFoot";
import Link from "next/link";

type LoginPrefill = {
  email: string;
  name?: string;
  phone?: string;
  crNumber?: string;
  company?: string;
};

function buildRegisterUrl(params: Record<string, string>): string {
  return `/register?${new URLSearchParams(params).toString()}`;
}

function validateEmail(value: string): string | null {
  if (!value.trim()) return "Email is required.";
  if (/\s/.test(value)) return "Email must not contain spaces.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Enter a valid email address.";
  return null;
}

function validatePassword(value: string): string | null {
  if (!value) return "Password is required.";
  if (/\s/.test(value)) return "Password must not contain spaces.";
  if (value.length < 8) return "Password must be at least 8 characters.";
  return null;
}

export function CustomerLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [message, setMessage] = useState("");
  const [messageHtml, setMessageHtml] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">("idle");
  // Avoid flashing the form when a valid session already exists (e.g. cart race → login).
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const result = await fetchAuthMeShared();
        if (cancelled) return;
        if (result.ok) {
          // Hard nav avoids a stale Next soft-nav cache of middleware's
          // /portal/* → /login redirect (header looked logged-in on /login).
          window.location.replace(safeNextPath(window.location.search));
          return;
        }
        // Stale localStorage can show Logout/avatar while JWT/cookies are dead.
        if (result.status === 401 || result.status === 403) {
          clearAccessToken();
          clearLegacyPortalSession();
          window.dispatchEvent(new CustomEvent("aptus:session-changed"));
        }
      } catch {
        /* stay on login */
      } finally {
        if (!cancelled) setCheckingSession(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleEmailChange(e: ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setEmail(val);
    if (emailError) setEmailError(validateEmail(val) ?? "");
  }

  function handlePasswordChange(e: ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setPassword(val);
    if (passwordError) setPasswordError(validatePassword(val) ?? "");
  }

  async function handleResendVerification() {
    if (resendState === "sending") return;
    setResendState("sending");
    try {
      await fetch("/api/auth/verify-email/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
    } catch {
      /* ignore — endpoint always responds generically */
    } finally {
      setResendState("sent");
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    setMessageHtml("");
    setNeedsVerification(false);
    setResendState("idle");

    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    setEmailError(eErr ?? "");
    setPasswordError(pErr ?? "");
    if (eErr || pErr) return;

    const normalizedEmail = email.trim().toLowerCase();
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: normalizedEmail,
          password,
          remember,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        invalidateAuthMeCache();
        invalidatePortalSharedFetch();
        if (!data.accessToken || !data.expiresIn) {
          setMessage("Sign-in succeeded but no session token was returned. Contact support.");
          return;
        }
        setAccessToken(data.accessToken, data.expiresIn);
        if (data.user && typeof data.user === "object") {
          syncLegacyPortalSession(data.user as LegacySessionUser, remember);
        }
        // Confirm /me accepts the new token before leaving login (catches JWT/Upstash misconfig).
        invalidateAuthMeCache();
        const me = await fetchAuthMeShared();
        if (!me.ok) {
          clearAccessToken();
          clearLegacyPortalSession();
        setMessage(
          me.status === 401 || me.status === 403
            ? "Your password was accepted but the session could not start. This usually means a stale cookie — clear this site's cookies and sign in again."
            : "Sign-in could not load your profile. Please try again.",
        );
          return;
        }
        await syncPortalCartWithServer();
        // Hard nav so a cached middleware redirect cannot bounce back to /login.
        window.location.assign(safeNextPath(window.location.search));
        return;
      }

      if (
        (response.status === 404 && data.code === "ACCOUNT_NOT_FOUND") ||
        data.code === "ACCOUNT_NOT_FOUND"
      ) {
        router.push(buildRegisterUrl({ email: normalizedEmail, reason: "no_account" }));
        return;
      }

      if (response.status === 404 && data.code === "PARTNER_EXISTS_NO_PORTAL") {
        const prefill = (data.prefill ?? { email: normalizedEmail }) as LoginPrefill;
        const params: Record<string, string> = {
          email: prefill.email || normalizedEmail,
          reason: "existing_partner",
        };
        if (prefill.name) params.name = prefill.name;
        if (prefill.phone) params.phone = prefill.phone;
        if (prefill.crNumber) params.cr = prefill.crNumber;
        if (prefill.company) params.company = prefill.company;
        router.push(buildRegisterUrl(params));
        return;
      }

      if (response.status === 503) {
        setMessage(data.error ?? "Unable to verify account right now. Please try again.");
        return;
      }

      if (response.status >= 500) {
        setPasswordError("");
        setMessage(
          data.error ?? "Sign-in is temporarily unavailable. Please try again in a moment.",
        );
        return;
      }

      if (response.status === 429) {
        setMessage(data.error ?? "Too many attempts. Please wait a moment and try again.");
        return;
      }

      if (response.status === 403 && data.code === "EMAIL_NOT_VERIFIED") {
        setPasswordError("");
        setNeedsVerification(true);
        setMessage(
          data.error ?? "Please verify your email before signing in. Check your inbox for the verification link.",
        );
        return;
      }

      if (
        response.status === 403 &&
        (data.code === "ACCOUNT_DISABLED" ||
          data.code === "PARTNER_ARCHIVED" ||
          data.code === "PARTNER_PORTAL_DISABLED" ||
          data.code === "PARTNER_NOT_FOUND")
      ) {
        setPasswordError("");
        setMessage(data.error ?? "This account cannot sign in right now. Please contact support.");
        return;
      }

      if (response.status === 401 && data.code === "INVALID_CREDENTIALS" && data.accountExists) {
        setPasswordError("Incorrect password.");
        setMessageHtml(
          [
            "<strong>Incorrect password.</strong>",
            ` Email: ${data.maskedEmail || "on file"}.`,
            " Try again or",
            ` <a href="${buildRegisterUrl({ recover: "1", email: normalizedEmail })}">recover access</a>.`,
          ].join(""),
        );
        return;
      }

      setPasswordError("Check your password and try again.");
      setMessage(data.error ?? "Incorrect password. Please try again.");
    } catch {
      setMessage("Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      className="aptus-auth-card"
      onSubmit={handleSubmit}
      noValidate
      aria-busy={checkingSession || undefined}
    >
      {checkingSession ? (
        <div className="aptus-auth-card__head" role="status" aria-live="polite">
          <h2>Sign in to your portal</h2>
          <p>Checking your session…</p>
        </div>
      ) : (
        <>
      <div className="aptus-auth-card__head">
        <h2>Sign in to your portal</h2>
        <p>
          Sign in with your registered email and password. New here?{" "}
          <Link href="/register">Create an account</Link>.
        </p>
      </div>

      <div className="aptus-auth-access" aria-label="Secure access notice">
        <span>Account access</span>
        <strong>Customer workspace</strong>
        <p>Access is restricted to approved billing, IT, and procurement contacts.</p>
      </div>

      {messageHtml ? (
        <div
          className="aptus-auth-alert is-error"
          role="alert"
          dangerouslySetInnerHTML={{ __html: messageHtml }}
        />
      ) : message ? (
        <div className="aptus-auth-alert is-error" role="alert">
          {message}
          {needsVerification && (
            <div style={{ marginTop: "0.5rem" }}>
              {resendState === "sent" ? (
                <span>Verification email sent. Check your inbox.</span>
              ) : (
                <button
                  type="button"
                  className="btn btn-link p-0"
                  onClick={handleResendVerification}
                  disabled={resendState === "sending"}
                >
                  {resendState === "sending" ? "Sending…" : "Resend verification email"}
                </button>
              )}
            </div>
          )}
        </div>
      ) : null}

      <div className="aptus-field">
        <label htmlFor="aptus_login_email">Email address</label>
        <input
          id="aptus_login_email"
          className={`form-control${emailError ? " is-invalid" : ""}`}
          type="email"
          name="email"
          autoComplete="email"
          placeholder="name@company.com"
          required
          value={email}
          onChange={handleEmailChange}
          onBlur={() => setEmailError(validateEmail(email) ?? "")}
        />
        {emailError && (
          <small className="aptus-field__error" role="alert">
            {emailError}
          </small>
        )}
      </div>

      <div className="aptus-field">
        <label htmlFor="aptus_login_password">Password</label>
        <div style={{ position: "relative" }}>
          <input
            id="aptus_login_password"
            className={`form-control${passwordError ? " is-invalid" : ""}`}
            type={showPassword ? "text" : "password"}
            name="password"
            autoComplete="current-password"
            placeholder="Enter password"
            required
            value={password}
            onChange={handlePasswordChange}
            onBlur={() => setPasswordError(validatePassword(password) ?? "")}
            style={{ paddingRight: "2.75rem" }}
          />
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((v) => !v)}
            style={{
              position: "absolute",
              right: "0.75rem",
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              color: "#6b7280",
              lineHeight: 1,
            }}
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        </div>
        {passwordError && (
          <small className="aptus-field__error" role="alert">
            {passwordError}
          </small>
        )}
      </div>

      <label className="aptus-auth-options">
        <input
          type="checkbox"
          name="remember"
          value="persistent"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
        />
        <span>Keep me signed in on this browser</span>
      </label>

      <button type="submit" className="btn btn-aptus-primary w-100" disabled={loading}>
        {loading ? "Signing in…" : "Sign in securely"}
      </button>

      <AuthCardFoot variant="login" />
        </>
      )}
    </form>
  );
}
