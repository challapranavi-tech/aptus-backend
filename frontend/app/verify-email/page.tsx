"use client";

import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailClient />
    </Suspense>
  );
}

function VerifyEmailClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">(
    token ? "idle" : "error",
  );
  const [message, setMessage] = useState(
    token
      ? "Confirm this is your email address to finish setting up your account."
      : "This verification link is missing a token.",
  );

  async function handleVerify(event: FormEvent) {
    event.preventDefault();
    if (!token || status === "loading" || status === "ok") return;
    setStatus("loading");
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setStatus("error");
        setMessage(
          data.error ??
            "This verification link is invalid, expired, or has already been used.",
        );
        return;
      }
      setStatus("ok");
      setMessage("Your email is verified. You can sign in to the Aptus Customer Portal.");
    } catch {
      setStatus("error");
      setMessage("Unable to reach the server. Please try again.");
    }
  }

  return (
    <div id="wrap" className="aptus-site aptus-customer-auth" data-aptus-auth-page="verify-email">
      <main className="aptus-auth">
        <section className="aptus-auth__hero">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-5">
                <div className="aptus-auth-card">
                  <h1>Verify your email</h1>
                  <p className={status === "error" ? "aptus-auth-alert is-error" : undefined} role="status">
                    {message}
                  </p>
                  {status === "ok" ? (
                    <Link className="btn btn-aptus-primary" href="/login">
                      Sign in
                    </Link>
                  ) : token ? (
                    <>
                      <form onSubmit={handleVerify}>
                        <button
                          type="submit"
                          className="btn btn-aptus-primary"
                          disabled={status === "loading"}
                        >
                          {status === "loading" ? "Verifying…" : "Verify email"}
                        </button>
                      </form>
                      {status === "error" ? (
                        <p className="aptus-auth-card__hint">
                          Link expired?{" "}
                          <Link href="/login?registered=1&verify=1">Request a new verification email</Link>{" "}
                          from the sign-in page.
                        </p>
                      ) : null}
                    </>
                  ) : (
                    <Link className="btn btn-aptus-primary" href="/login">
                      Back to sign in
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
