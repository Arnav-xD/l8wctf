"use client";

import { useActionState } from "react";
import { signIn, type AuthState } from "../actions";

const INITIAL: AuthState = { error: null };

/* ------------------------------------------------------------------ */
/*  Sign-in form                                                        */
/* ------------------------------------------------------------------ */

export function SignInForm() {
  const [state, action, pending] = useActionState(signIn, INITIAL);

  return (
    <div className="term" aria-label="Sign in to CTF">
      <div className="term-bar">
        <span className="term-dot" />
        <span className="term-dot" />
        <span className="term-dot" />
        <span className="text-[0.7rem] text-fg-faint ml-1">{"// sign_in"}</span>
      </div>

      <form action={action} className="term-body !min-h-0 flex flex-col gap-4">
        {/* SRN */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="ctf-srn" className="text-[0.72rem] text-fg-faint uppercase tracking-widest">
            SRN
          </label>
          <input
            id="ctf-srn"
            name="srn"
            type="text"
            required
            autoComplete="username"
            placeholder="PES2UG22CS000"
            className="bg-bg-3 border border-border px-3 py-2 text-sm text-fg placeholder:text-fg-faint focus:outline-none focus:border-accent transition-colors uppercase tracking-widest"
            disabled={pending}
          />
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="ctf-password" className="text-[0.72rem] text-fg-faint uppercase tracking-widest">
            Password
          </label>
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
          id="ctf-sign-in-btn"
          className="btn btn-solid self-start disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? "> authenticating_" : "> sign_in"}
        </button>
      </form>
    </div>
  );
}
