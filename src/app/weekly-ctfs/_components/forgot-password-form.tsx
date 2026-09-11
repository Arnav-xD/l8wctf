"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset, type AuthState } from "../actions";

const INITIAL: AuthState = { error: null };

/* ------------------------------------------------------------------ */
/*  Forgot-password form                                                */
/* ------------------------------------------------------------------ */

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, INITIAL);

  if (state.message && !state.error) {
    return (
      <div className="term" aria-label="Password reset sent">
        <div className="term-bar">
          <span className="term-dot" />
          <span className="term-dot" />
          <span className="term-dot" />
          <span className="text-[0.7rem] text-fg-faint ml-1">{"// check_inbox"}</span>
        </div>
        <div className="term-body !min-h-0 flex flex-col gap-4">
          <p className="text-xs text-fg-faint">
            <span className="prompt">$</span> reset_link_sent
          </p>
          <p className="text-sm text-fg-dim leading-relaxed">{state.message}</p>
          <p className="text-[0.72rem] text-fg-faint">
            Check your inbox and follow the link. The link is valid for a
            limited time.
          </p>
          <Link
            href="/weekly-ctfs/sign-in"
            id="forgot-pw-back-to-signin"
            className="btn self-start text-xs"
          >
            ← back_to_sign_in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="term" aria-label="Forgot password">
      <div className="term-bar">
        <span className="term-dot" />
        <span className="term-dot" />
        <span className="term-dot" />
        <span className="text-[0.7rem] text-fg-faint ml-1">{"// forgot_password"}</span>
      </div>

      <form action={action} className="term-body !min-h-0 flex flex-col gap-4">
        <p className="text-xs text-fg-faint leading-relaxed">
          Enter your email address and we will send a reset link — if an account
          exists for it.
        </p>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="ctf-forgot-email"
            className="text-[0.72rem] text-fg-faint uppercase tracking-widest"
          >
            Email
          </label>
          <input
            id="ctf-forgot-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="operator@example.com"
            className="bg-bg-3 border border-border px-3 py-2 text-sm text-fg placeholder:text-fg-faint focus:outline-none focus:border-accent transition-colors"
            disabled={pending}
          />
        </div>

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
          disabled={pending}
          id="ctf-forgot-pw-btn"
          className="btn btn-solid self-start disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? "> sending_" : "> send_reset_link"}
        </button>

        {/* Back link */}
        <Link
          href="/weekly-ctfs/sign-in"
          className="text-[0.72rem] text-fg-faint hover:text-accent transition-colors"
        >
          ← back_to_sign_in
        </Link>
      </form>
    </div>
  );
}
