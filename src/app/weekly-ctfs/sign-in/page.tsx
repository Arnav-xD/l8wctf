import type { Metadata } from "next";
import { AuthShell } from "../_components/auth-shell";
import { SignInForm } from "../_components/sign-in-form";

export const metadata: Metadata = {
  title: "Sign In · Weekly CTFs · Layer8",
  description:
    "Sign in to your Layer8 CTF account to submit flags, track your progress, and climb the leaderboard.",
};

/* ------------------------------------------------------------------ */
/*  Error messages surfaced by /auth/confirm redirect                   */
/* ------------------------------------------------------------------ */

const CONFIRM_ERRORS: Record<string, string> = {
  invalid_or_expired_link:
    "That verification link is invalid or has expired. Sign in or request a new one.",
};

/* ------------------------------------------------------------------ */
/*  Sign-in page                                                        */
/* ------------------------------------------------------------------ */

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const errorKey = params.error ?? null;
  const errorOverride = errorKey ? (CONFIRM_ERRORS[errorKey] ?? null) : null;

  return (
    <AuthShell kicker="// sign_in" title="Sign In">
      <SignInForm errorOverride={errorOverride} />
    </AuthShell>
  );
}
