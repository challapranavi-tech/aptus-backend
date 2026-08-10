"use client";

import { useSearchParams } from "next/navigation";

export function LoginStatusBanner() {
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered") === "1";
  const verify = searchParams.get("verify") === "1";
  const reset = searchParams.get("reset") === "1";

  if (!registered && !reset) return null;

  return (
    <div className="aptus-auth-alert" role="status">
      {registered &&
        (verify
          ? "Account created. Check your email for a verification link before signing in."
          : "Account created successfully. Sign in to continue to the product flow.")}
      {reset && "Password updated successfully. Sign in with your new password."}
    </div>
  );
}
