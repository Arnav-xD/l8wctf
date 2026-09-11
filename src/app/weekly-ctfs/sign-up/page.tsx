import type { Metadata } from "next";
import { AuthShell } from "../_components/auth-shell";
import { SignUpForm } from "../_components/sign-up-form";

export const metadata: Metadata = {
  title: "Create Account · Weekly CTFs · Layer8",
  description:
    "Create a Layer8 CTF account to compete in weekly challenges, submit flags, and track your progress.",
};

export default function SignUpPage() {
  return (
    <AuthShell kicker="// create_account" title="Create Account">
      <SignUpForm />
    </AuthShell>
  );
}
