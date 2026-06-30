import Link from "next/link";

export const AUTH_CARD_FOOT_COPY =
  "Protected customer access for subscriptions, billing, renewals, and support workflows.";

type AuthCardFootVariant = "login" | "register" | "profile";

export function AuthCardFoot({ variant }: { variant: AuthCardFootVariant }) {
  return (
    <p className="aptus-auth-card__foot">
      {AUTH_CARD_FOOT_COPY}{" "}
      {variant === "login" && (
        <Link href="/register?recover=1">Forgot password?</Link>
      )}
      {variant === "register" && <Link href="/login">Sign in</Link>}
      {variant === "profile" && <Link href="/portal/dashboard">Return to overview</Link>}
    </p>
  );
}
