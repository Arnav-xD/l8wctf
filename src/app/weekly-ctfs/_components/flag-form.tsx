"use client";

import Link from "next/link";
import { useActionState } from "react";
import { submitFlag, type FlagState } from "../actions";
import type { CtfChallenge } from "../../../lib/ctf";

const INITIAL: FlagState = { status: "idle", message: null };

/* ------------------------------------------------------------------ */
/*  Flag submission form                                                */
/* ------------------------------------------------------------------ */

export function FlagForm({
  challenge,
  isAuthenticated,
}: {
  challenge: CtfChallenge;
  isAuthenticated: boolean;
}) {
  const [state, action, pending] = useActionState(submitFlag, INITIAL);

  /* already solved — show trophy, no form */
  if (challenge.solved || state.status === "correct") {
    return (
      <div
        className="term"
        role="status"
        aria-label="Challenge solved"
      >
        <div className="term-bar">
          <span className="term-dot" />
          <span className="term-dot" />
          <span className="term-dot" />
          <span className="text-[0.7rem] ml-1 text-[#4ade80]">{"// flag_accepted"}</span>
        </div>
        <div className="term-body !min-h-0 flex flex-col gap-2">
          <p className="text-[#4ade80] font-bold">
            {state.status === "correct" && state.message
              ? state.message
              : "You already own this flag."}
          </p>
          <p className="text-xs text-fg-faint">
            <span className="prompt">$</span> Good work. Move to the next challenge.
          </p>
        </div>
      </div>
    );
  }

  /* "already solved" returned from server action */
  if (state.status === "solved") {
    return (
      <div className="term" role="status">
        <div className="term-bar">
          <span className="term-dot" />
          <span className="term-dot" />
          <span className="term-dot" />
          <span className="text-[0.7rem] ml-1 text-accent">{"// already_solved"}</span>
        </div>
        <div className="term-body !min-h-0">
          <p className="text-accent">{state.message}</p>
        </div>
      </div>
    );
  }

  /* unauthenticated */
  if (!isAuthenticated) {
    return (
      <div className="term" aria-label="Sign in to submit">
        <div className="term-bar">
          <span className="term-dot" />
          <span className="term-dot" />
          <span className="term-dot" />
          <span className="text-[0.7rem] ml-1 text-fg-faint">{"// submit_flag"}</span>
        </div>
        <div className="term-body !min-h-0 flex flex-col gap-3">
          <p className="text-xs text-fg-dim">
            <span className="prompt">$</span> Sign in to submit a flag.
          </p>
          <Link
            href="/weekly-ctfs"
            id="challenge-sign-in-btn"
            className="btn btn-solid self-start text-xs"
          >
            &gt; sign_in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="term" aria-label="Submit flag">
      <div className="term-bar">
        <span className="term-dot" />
        <span className="term-dot" />
        <span className="term-dot" />
        <span className="text-[0.7rem] ml-1 text-fg-faint">{"// submit_flag"}</span>
      </div>

      <form action={action} className="term-body !min-h-0 flex flex-col gap-4">
        {/* hidden fields */}
        <input type="hidden" name="challengeId" value={challenge.id} />
        <input type="hidden" name="slug" value={challenge.slug} />

        {/* flag input */}
        <div className="term-input-row">
          <span className="prompt text-sm select-none">$</span>
          <input
            id="flag-input"
            name="flag"
            type="text"
            required
            placeholder="L8{...}"
            disabled={pending}
            autoComplete="off"
            spellCheck={false}
            className="term-input text-sm"
            aria-label="Flag"
          />
          {pending && (
            <span className="cursor h-[1em]" aria-hidden />
          )}
        </div>

        {/* feedback */}
        {state.status === "wrong" && (
          <p role="alert" className="text-xs text-danger border border-danger/30 bg-danger/5 px-3 py-2">
            <span>✗</span> {state.message}
          </p>
        )}
        {state.status === "error" && (
          <p role="alert" className="text-xs text-danger border border-danger/30 bg-danger/5 px-3 py-2">
            <span>!</span> {state.message}
          </p>
        )}

        <button
          type="submit"
          id="flag-submit-btn"
          disabled={pending}
          className="btn btn-solid self-start text-xs disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? "> submitting_" : "> submit_flag"}
        </button>
      </form>
    </div>
  );
}
