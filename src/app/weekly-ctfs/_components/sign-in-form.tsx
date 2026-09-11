"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn, type AuthState } from "../actions";

const INITIAL: AuthState = { error: null };

/* ------------------------------------------------------------------ */
/*  Sign-in form                                                        */
/*  Used both on the dashboard sidebar and the dedicated sign-in page. */
/* ------------------------------------------------------------------ */

export function SignInForm({ errorOverride }: { errorOverride?: string | null }) {
  const [state, action, pending] = useActionState(signIn, INITIAL);

  const visibleError = state.error ?? errorOverride ?? null;

  return (
    <div className="term" aria-label="Sign in to CTF">
      <div className="term-bar">
        <span className="term-dot" />
        <span className="term-dot" />
        <span className="term-dot" />
        <span className="text-[0.7rem] text-fg-faint ml-1">{"// sign_in"}</span>
      </div>

      <form action={action} className="term-body !min-h-0 flex flex-col gap-4">
        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="ctf-email"
            className="text-[0.72rem] text-fg-faint uppercase tracking-widest"
          >
            Email
          </label>
          <input
            id="ctf-email"
            name="email"
            type="email"
            required
            autoComplete="username"
            placeholder="operator@example.com"
            className="bg-bg-3 border border-border px-3 py-2 text-sm text-fg placeholder:text-fg-faint focus:outline-none focus:border-accent transition-colors"
            disabled={pending}
          />
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="ctf-password"
              className="text-[0.72rem] text-fg-faint uppercase tracking-widest"
            >
              Password
            </label>
            <Link
              href="/weekly-ctfs/forgot-password"
              className="text-[0.68rem] text-fg-faint hover:text-accent transition-colors"
              tabIndex={pending ? -1 : undefined}
            >
              forgot_password
            </Link>
          </div>
          <input
            id="ctf-password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="············"
            className="bg-bg-3 border border-border px-3 py-2 text-sm text-fg placeholder:text-fg-faint focus:outline-none focus:border-accent transition-colors"
            disabled={pending}
          />
        </div>

        {/* Error */}
        {visibleError && (
          <p
            role="alert"
            className="text-xs text-danger border border-danger/30 bg-danger/5 px-3 py-2"
          >
            <span className="text-danger">!</span> {visibleError}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={pending}
          id="ctf-sign-in-btn"
          className="btn btn-solid self-start disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? "> authenticating_" : "> sign_in"}
        </button>

        {/* Create account link */}
        <p className="text-[0.72rem] text-fg-faint">
          No account?{" "}
          <Link
            href="/weekly-ctfs/sign-up"
            className="text-accent hover:underline"
          >
            create_account →
          </Link>
        </p>
      </form>
    </div>
  );
}
