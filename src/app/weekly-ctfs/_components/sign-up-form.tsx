"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import type { TurnstileInstance } from "@marsidev/react-turnstile";
import {
  CTF_PASSWORD_REQUIREMENT,
  isValidCtfPassword,
} from "../../../lib/ctf-auth";
import { signUp, type AuthState } from "../actions";

const INITIAL: AuthState = { error: null };

/* ------------------------------------------------------------------ */
/*  Turnstile site key — undefined when not configured                 */
/*  Only the public NEXT_PUBLIC_ variable is referenced here.          */
/* ------------------------------------------------------------------ */

const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null;

/* ------------------------------------------------------------------ */
/*  Validation helpers (mirrors ctf-auth.ts patterns, client-side)     */
/* ------------------------------------------------------------------ */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-z0-9_-]{3,24}$/;

function clientValidate(data: FormData): string | null {
  const username = String(data.get("username") ?? "").trim().toLowerCase();
  const email = String(data.get("email") ?? "").trim().toLowerCase();
  const password = String(data.get("password") ?? "");
  const confirmation = String(data.get("confirmation") ?? "");

  if (!USERNAME_RE.test(username)) {
    return "Use 3-24 lowercase letters, numbers, underscores, or hyphens for your username.";
  }
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return "Enter a valid email address.";
  }
  if (!isValidCtfPassword(password)) {
    return CTF_PASSWORD_REQUIREMENT;
  }
  if (password !== confirmation) {
    return "The passwords do not match.";
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  Sign-up form                                                        */
/* ------------------------------------------------------------------ */

export function SignUpForm() {
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);

  const [state, action, pending] = useActionState(
    async (prev: AuthState, formData: FormData): Promise<AuthState> => {
      /* 1. Client-side field validation */
      const clientErr = clientValidate(formData);
      if (clientErr) return { error: clientErr };

      /* 2. CAPTCHA guard — only when site key is configured */
      if (TURNSTILE_SITE_KEY && !captchaToken) {
        return { error: "Complete the verification challenge and try again." };
      }

      /* 3. Inject captchaToken into FormData so the server action picks it up */
      if (captchaToken) {
        formData.set("captchaToken", captchaToken);
      }

      /* 4. Call real server action */
      const result = await signUp(prev, formData);

      /* 5. On failure, clear token and reset widget so user can retry */
      if (result.error) {
        setCaptchaToken(null);
        turnstileRef.current?.reset();
      }

      return result;
    },
    INITIAL,
  );

  /* Submit is disabled while pending OR while CAPTCHA is required but not yet solved */
  const submitDisabled = pending || (TURNSTILE_SITE_KEY !== null && !captchaToken);

  return (
    <div className="term" aria-label="Create a CTF account">
      <div className="term-bar">
        <span className="term-dot" />
        <span className="term-dot" />
        <span className="term-dot" />
        <span className="text-[0.7rem] text-fg-faint ml-1">{"// create_account"}</span>
      </div>

      <form action={action} className="term-body !min-h-0 flex flex-col gap-4">
        {/* Username */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="ctf-signup-username"
            className="text-[0.72rem] text-fg-faint uppercase tracking-widest"
          >
            Username
          </label>
          <input
            id="ctf-signup-username"
            name="username"
            type="text"
            required
            autoComplete="username"
            placeholder="your_handle"
            pattern="[a-z0-9_\-]{3,24}"
            title="3-24 lowercase letters, numbers, underscores, or hyphens"
            className="bg-bg-3 border border-border px-3 py-2 text-sm text-fg placeholder:text-fg-faint focus:outline-none focus:border-accent transition-colors"
            disabled={pending}
          />
          <span className="text-[0.65rem] text-fg-faint">
            3-24 lowercase letters, numbers, _ or -. This is your public identity.
          </span>
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="ctf-signup-email"
            className="text-[0.72rem] text-fg-faint uppercase tracking-widest"
          >
            Email
          </label>
          <input
            id="ctf-signup-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="operator@example.com"
            className="bg-bg-3 border border-border px-3 py-2 text-sm text-fg placeholder:text-fg-faint focus:outline-none focus:border-accent transition-colors"
            disabled={pending}
          />
          <span className="text-[0.65rem] text-fg-faint">
            Kept private. Used only for verification and password reset.
          </span>
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="ctf-signup-password"
            className="text-[0.72rem] text-fg-faint uppercase tracking-widest"
          >
            Password
          </label>
          <input
            id="ctf-signup-password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
            placeholder="············"
            minLength={10}
            className="bg-bg-3 border border-border px-3 py-2 text-sm text-fg placeholder:text-fg-faint focus:outline-none focus:border-accent transition-colors"
            disabled={pending}
          />
          <span className="text-[0.65rem] text-fg-faint">
            10+ characters with lowercase, uppercase, number, and special character.
          </span>
        </div>

        {/* Confirm password */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="ctf-signup-confirmation"
            className="text-[0.72rem] text-fg-faint uppercase tracking-widest"
          >
            Confirm Password
          </label>
          <input
            id="ctf-signup-confirmation"
            name="confirmation"
            type="password"
            required
            autoComplete="new-password"
            placeholder="············"
            minLength={10}
            className="bg-bg-3 border border-border px-3 py-2 text-sm text-fg placeholder:text-fg-faint focus:outline-none focus:border-accent transition-colors"
            disabled={pending}
          />
        </div>

        {/* Turnstile — only rendered when NEXT_PUBLIC_TURNSTILE_SITE_KEY is set */}
        {TURNSTILE_SITE_KEY && (
          <div>
            <Turnstile
              ref={turnstileRef}
              siteKey={TURNSTILE_SITE_KEY}
              onSuccess={(token) => setCaptchaToken(token)}
              onExpire={() => setCaptchaToken(null)}
              onError={() => setCaptchaToken(null)}
              options={{ theme: "dark", size: "normal" }}
            />
          </div>
        )}

        {/* Error */}
        {state.error && (
          <p
            role="alert"
            className="text-xs text-danger border border-danger/30 bg-danger/5 px-3 py-2"
          >
            <span className="text-danger">!</span> {state.error}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitDisabled}
          id="ctf-sign-up-btn"
          className="btn btn-solid self-start disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? "> creating_account_" : "> create_account"}
        </button>

        {/* Sign-in link */}
        <p className="text-[0.72rem] text-fg-faint">
          Already have an account?{" "}
          <Link
            href="/weekly-ctfs/sign-in"
            className="text-accent hover:underline"
          >
            sign_in →
          </Link>
        </p>
      </form>
    </div>
  );
}
