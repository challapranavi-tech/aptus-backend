"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { setAccessToken, syncLegacyPortalSession, type LegacySessionUser } from "@/lib/access-token";
import { AuthCardFoot } from "@/components/auth/AuthCardFoot";

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

export function CustomerLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [message, setMessage] = useState("");
  const [messageHtml, setMessageHtml] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    setMessageHtml("");
    setPasswordError("");

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setMessage("Please enter your email and password.");
      return;
    }

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
        if (data.accessToken && data.expiresIn) {
          setAccessToken(data.accessToken, data.expiresIn);
        }
        if (data.user && typeof data.user === "object") {
          syncLegacyPortalSession(data.user as LegacySessionUser, remember);
        }
        router.push("/portal/dashboard");
        return;
      }

      if (response.status === 404 && data.code === "ACCOUNT_NOT_FOUND") {
        router.push(
          buildRegisterUrl({
            email: normalizedEmail,
            reason: "no_account",
          }),
        );
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

      if (response.status === 401 && data.code === "INVALID_CREDENTIALS" && data.accountExists) {
        setPasswordError("This email is already registered.");
        setMessageHtml(
          [
            "<strong>Account already registered.</strong>",
            ` Email: ${data.maskedEmail || "on file"}.`,
            ` Phone: ${data.maskedPhone || "on file"}.`,
            " Check your password or",
            ` <a href="${buildRegisterUrl({
              recover: "1",
              email: normalizedEmail,
            })}">recover access</a>.`,
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
    <form className="aptus-auth-card" onSubmit={handleSubmit} noValidate>
      <div className="aptus-auth-card__head">
        <span>Secure customer area</span>
        <h2>Sign in to your portal</h2>
        <p>
          Sign in with your registered email and password. New customers are guided to registration
          automatically.
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
        </div>
      ) : null}

      <div className="aptus-field">
        <label htmlFor="aptus_login_email">Email address</label>
        <input
          id="aptus_login_email"
          className="form-control"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="name@company.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="aptus-field">
        <label htmlFor="aptus_login_password">Password</label>
        <input
          id="aptus_login_password"
          className={`form-control${passwordError ? " is-invalid" : ""}`}
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="Enter password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
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
    </form>
  );
}
