"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  CTF_PASSWORD_REQUIREMENT,
  getSiteUrl,
  isValidCtfPassword,
  isValidEmail,
  isValidUsername,
  normalizeEmail,
  normalizeUsername,
  safeAuthRedirect,
} from "../../lib/ctf-auth";
import { isSupabaseConfigured } from "../../lib/supabase/config";
import { createClient } from "../../lib/supabase/server";

export type AuthState = {
  error: string | null;
  message?: string | null;
};

export type FlagState = {
  status: "idle" | "error" | "wrong" | "correct" | "solved";
  message: string | null;
};

export type PasswordState = {
  status: "idle" | "error" | "success";
  message: string | null;
};

export async function signIn(
  _previousState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  if (!isSupabaseConfigured()) {
    return {
      error: "CTF authentication has not been configured yet.",
    };
  }

  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const next = safeAuthRedirect(formData.get("next"));

  if (!isValidEmail(email) || password.length < 8) {
    return {
      error: "Enter a valid email and password.",
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return {
      error: "Invalid email or password.",
    };
  }

  const { data: profile } = await supabase
    .from("ctf_profiles")
    .select("role,account_status")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!profile || profile.account_status !== "active") {
    await supabase.auth.signOut();
    return { error: "This CTF account is unavailable." };
  }

  revalidatePath("/weekly-ctfs", "layout");

  if (next !== "/weekly-ctfs") redirect(next);

  if (profile?.role === "host" || profile?.role === "admin") {
    redirect("/weekly-ctfs/admin");
  }

  redirect("/weekly-ctfs");
}

export async function signUp(
  _previousState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  if (!isSupabaseConfigured()) {
    return { error: "CTF authentication has not been configured yet." };
  }

  const username = normalizeUsername(String(formData.get("username") ?? ""));
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  const captchaToken = String(formData.get("captchaToken") ?? "").trim();

  if (!isValidUsername(username)) {
    return {
      error:
        "Use 3–24 lowercase letters, numbers, underscores, or hyphens for your username.",
    };
  }
  if (!isValidEmail(email)) return { error: "Enter a valid email address." };
  if (!isValidCtfPassword(password)) {
    return { error: CTF_PASSWORD_REQUIREMENT };
  }
  if (password !== confirmation) return { error: "The passwords do not match." };
  if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !captchaToken) {
    return { error: "Complete the verification challenge and try again." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
      emailRedirectTo: `${getSiteUrl()}/auth/confirm?next=/weekly-ctfs`,
      captchaToken: captchaToken || undefined,
    },
  });

  if (error) {
    if (/username|duplicate|unique/i.test(error.message)) {
      return { error: "That username is already taken." };
    }
    return { error: "We could not create that account. Check your details and try again." };
  }

  redirect(`/weekly-ctfs/check-email?email=${encodeURIComponent(email)}`);
}

export async function requestPasswordReset(
  _previousState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  if (!isSupabaseConfigured()) {
    return { error: "CTF authentication has not been configured yet." };
  }

  const email = normalizeEmail(String(formData.get("email") ?? ""));
  if (!isValidEmail(email)) return { error: "Enter a valid email address." };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getSiteUrl()}/auth/confirm?next=/weekly-ctfs/reset-password`,
  });

  return {
    error: null,
    message: "If an account exists for that email, a reset link is on its way.",
  };
}

export async function resetPassword(
  _previousState: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  if (!isSupabaseConfigured()) {
    return { status: "error", message: "Authentication is not configured." };
  }

  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  if (!isValidCtfPassword(password)) {
    return { status: "error", message: CTF_PASSWORD_REQUIREMENT };
  }
  if (password !== confirmation) {
    return { status: "error", message: "The passwords do not match." };
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return { status: "error", message: "This reset link has expired. Request a new one." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { status: "error", message: "The password could not be updated." };

  revalidatePath("/weekly-ctfs", "layout");
  return { status: "success", message: "Password updated. You can continue to the CTF." };
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  revalidatePath("/weekly-ctfs", "layout");
  redirect("/weekly-ctfs");
}

export async function changePassword(
  _previousState: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  if (!isSupabaseConfigured()) {
    return {
      status: "error",
      message: "Authentication is not configured.",
    };
  }

  const currentPassword = String(
    formData.get("currentPassword") ?? "",
  );
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");

  if (!isValidCtfPassword(newPassword)) {
    return {
      status: "error",
      message: CTF_PASSWORD_REQUIREMENT,
    };
  }

  if (newPassword !== confirmation) {
    return {
      status: "error",
      message: "The new passwords do not match.",
    };
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return {
      status: "error",
      message: "Your session has expired. Sign in again.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
    current_password: currentPassword,
  });

  if (error) {
    return {
      status: "error",
      message:
        "Current password rejected or the new password is not allowed.",
    };
  }

  return {
    status: "success",
    message: "Password updated.",
  };
}

function hashFlag(flag: string) {
  return createHash("sha256").update(flag.trim()).digest("hex");
}

export async function submitFlag(
  _previousState: FlagState,
  formData: FormData,
): Promise<FlagState> {
  if (!isSupabaseConfigured()) {
    return {
      status: "error",
      message: "Submissions are disabled in demo mode.",
    };
  }

  const flag = String(formData.get("flag") ?? "").trim();
  const challengeId = String(formData.get("challengeId") ?? "");
  const slug = String(formData.get("slug") ?? "");

  if (!flag || !challengeId) {
    return {
      status: "error",
      message: "Enter a flag before submitting.",
    };
  }

  if (flag.length > 512) {
    return {
      status: "error",
      message: "That flag is unexpectedly long.",
    };
  }

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    return {
      status: "error",
      message: "Sign in before submitting a flag.",
    };
  }

  const { data, error } = await supabase
    .rpc("submit_ctf_flag", {
      p_challenge_id: challengeId,
      p_submitted_hash: hashFlag(flag),
    })
    .single();

  if (error || !data) {
    return {
      status: "error",
      message: "The submission service is unavailable. Try again.",
    };
  }

  const result = data as {
    outcome: string;
    awarded_points: number;
  };

  if (result.outcome === "rate_limited") {
    return {
      status: "error",
      message: "Rate limit reached. Wait one minute and try again.",
    };
  }

  if (result.outcome === "unauthenticated") {
    return {
      status: "error",
      message: "Sign in before submitting a flag.",
    };
  }

  if (result.outcome === "account_disabled") {
    return {
      status: "error",
      message: "This CTF account is unavailable.",
    };
  }

  if (result.outcome === "unavailable") {
    return {
      status: "error",
      message: "This operation is not accepting submissions.",
    };
  }

  if (result.outcome === "solved") {
    return {
      status: "solved",
      message: "You already own this flag.",
    };
  }

  if (result.outcome === "wrong") {
    return {
      status: "wrong",
      message: "Flag rejected. Inspect the target and try again.",
    };
  }

  if (result.outcome !== "correct") {
    return {
      status: "error",
      message: "The submission returned an unexpected result.",
    };
  }

  revalidatePath("/weekly-ctfs");

  if (/^[a-z0-9-]+$/.test(slug)) {
    revalidatePath(`/weekly-ctfs/${slug}`);
  }

  return {
    status: "correct",
    message: `Flag accepted. +${result.awarded_points} points.`,
  };
}
