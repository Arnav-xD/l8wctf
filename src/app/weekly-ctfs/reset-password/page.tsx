import type { Metadata } from "next";
import { AuthShell } from "../_components/auth-shell";
import { ResetPasswordForm } from "../_components/reset-password-form";

export const metadata: Metadata = {
  title: "Reset Password · Weekly CTFs · Layer8",
  description:
    "Set a new password for your Layer8 CTF account. Follow the link from your reset email.",
};

export default function ResetPasswordPage() {
  return (
    <AuthShell kicker="// reset_password" title="Reset Password">
      <ResetPasswordForm />
    </AuthShell>
  );
}
