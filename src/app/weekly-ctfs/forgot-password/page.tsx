import type { Metadata } from "next";
import { AuthShell } from "../_components/auth-shell";
import { ForgotPasswordForm } from "../_components/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot Password · Weekly CTFs · Layer8",
  description:
    "Reset your Layer8 CTF account password. Enter your email address and we will send you a reset link.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell kicker="// forgot_password" title="Forgot Password">
      <ForgotPasswordForm />
    </AuthShell>
  );
}
