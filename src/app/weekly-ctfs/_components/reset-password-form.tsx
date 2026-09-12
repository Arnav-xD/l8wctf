"use client";

import Link from "next/link";
import { useActionState } from "react";
import { resetPassword, type PasswordState } from "../actions";

const INITIAL: PasswordState = { status: "idle", message: null };

/* ------------------------------------------------------------------ */
/*  Reset-password form                                                 */
/*  The token/session is handled server-side by /auth/confirm.         */
/* ------------------------------------------------------------------ */

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(resetPassword, INITIAL);

  if (state.status === "success") {
    return (
      <div className="term" aria-label="Password updated">
        <div className="term-bar">
          <span className="term-dot" />
          <span className="term-dot" />
          <span className="term-dot" />
          <span className="text-[0.7rem] text-fg-faint ml-1">{"// password_updated"}</span>
        </div>
        <div className="term-body !min-h-0 flex flex-col gap-4">
          <p className="text-xs text-fg-faint">
            <span className="prompt">$</span> success
          </p>
          <p className="text-sm text-fg-dim leading-relaxed">{state.message}</p>
          <Link
            href="/weekly-ctfs/sign-in"
            id="reset-pw-go-to-signin"
            className="btn btn-solid self-start text-xs"
          >
            &gt; sign_in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="term" aria-label="Reset your password">
      <div className="term-bar">
        <span className="term-dot" />
        <span className="term-dot" />
        <span className="term-dot" />
        <span className="text-[0.7rem] text-fg-faint ml-1">{"// reset_password"}</span>
      </div>

      <form action={action} className="term-body !min-h-0 flex flex-col gap-4">
        <p className="text-xs text-fg-faint leading-relaxed">
          Use 8+ characters with at least one letter and one number.
        </p>

        {/* New password */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="ctf-reset-password"
            className="text-[0.72rem] text-fg-faint uppercase tracking-widest"
          >
            New Password
          </label>
          <input
            id="ctf-reset-password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
            placeholder="············"
            minLength={8}
            className="bg-bg-3 border border-border px-3 py-2 text-sm text-fg placeholder:text-fg-faint focus:outline-none focus:border-accent transition-colors"
            disabled={pending}
          />
        </div>

        {/* Confirm */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="ctf-reset-confirmation"
            className="text-[0.72rem] text-fg-faint uppercase tracking-widest"
          >
            Confirm New Password
          </label>
          <input
            id="ctf-reset-confirmation"
            name="confirmation"
            type="password"
            required
            autoComplete="new-password"
            placeholder="············"
            minLength={8}
            className="bg-bg-3 border border-border px-3 py-2 text-sm text-fg placeholder:text-fg-faint focus:outline-none focus:border-accent transition-colors"
            disabled={pending}
          />
        </div>

        {/* Error */}
        {state.status === "error" && state.message && (
          <p
            role="alert"
            className="text-xs text-danger border border-danger/30 bg-danger/5 px-3 py-2"
          >
            <span className="text-danger">!</span> {state.message}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={pending}
          id="ctf-reset-pw-btn"
          className="btn btn-solid self-start disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? "> updating_" : "> reset_password"}
        </button>

        {/* Back */}
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
