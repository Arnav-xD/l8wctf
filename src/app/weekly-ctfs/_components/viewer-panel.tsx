"use client";

import { useActionState, useState } from "react";
import { signOut, changePassword, type PasswordState } from "../actions";
import type { CtfViewer } from "../../../lib/ctf";

const INITIAL_PW: PasswordState = { status: "idle", message: null };

/* ------------------------------------------------------------------ */
/*  Viewer stats panel                                                  */
/* ------------------------------------------------------------------ */

export function ViewerPanel({ viewer }: { viewer: CtfViewer }) {
  const [showPw, setShowPw] = useState(false);
  const [pwState, pwAction, pwPending] = useActionState(changePassword, INITIAL_PW);

  return (
    <div className="flex flex-col gap-4">
      {/* stats */}
      <div className="term" aria-label="Your stats">
        <div className="term-bar">
          <span className="term-dot" />
          <span className="term-dot" />
          <span className="term-dot" />
          <span className="text-[0.7rem] text-fg-faint ml-1">{"// profile"}</span>
        </div>
        <div className="term-body !min-h-0 flex flex-col gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-fg-faint text-xs">$</span>
            <span className="text-accent font-bold">{viewer.handle}</span>
          </div>
          <div className="rule" />
          <dl className="grid grid-cols-3 gap-3 text-center">
            <Stat label="points" value={viewer.points} />
            <Stat label="solved" value={viewer.solved} />
            <Stat label="streak" value={`${viewer.streak}w`} />
          </dl>
          {viewer.role !== "student" && (
            <p className="text-[0.65rem] uppercase tracking-widest text-accent border border-accent/30 px-2 py-0.5 self-start">
              {viewer.role}
            </p>
          )}
        </div>
      </div>

      {/* actions */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          id="ctf-change-pw-toggle"
          onClick={() => setShowPw((v) => !v)}
          className="btn text-left text-xs w-full"
        >
          {showPw ? "> cancel" : "> change_password"}
        </button>

        {showPw && (
          <form action={pwAction} className="panel p-4 flex flex-col gap-3">
            <PwField id="ctf-pw-current" name="currentPassword" label="Current password" />
            <PwField id="ctf-pw-new" name="newPassword" label="New password (≥10 chars)" />
            <PwField id="ctf-pw-confirm" name="confirmation" label="Confirm new password" />

            {pwState.status === "error" && (
              <p role="alert" className="text-xs text-danger">
                {pwState.message}
              </p>
            )}
            {pwState.status === "success" && (
              <p role="status" className="text-xs text-[#4ade80]">
                {pwState.message}
              </p>
            )}

            <button
              type="submit"
              disabled={pwPending}
              id="ctf-change-pw-btn"
              className="btn btn-solid self-start text-xs disabled:opacity-50"
            >
              {pwPending ? "> updating_" : "> update_password"}
            </button>
          </form>
        )}

        <form action={signOut}>
          <button
            type="submit"
            id="ctf-sign-out-btn"
            className="btn text-left text-xs w-full hover:border-danger hover:text-danger"
          >
            &gt; sign_out
          </button>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-accent font-display font-bold text-lg">
        {value}
      </span>
      <span className="text-[0.65rem] uppercase tracking-[0.14em] text-fg-faint">
        {label}
      </span>
    </div>
  );
}

function PwField({
  id,
  name,
  label,
}: {
  id: string;
  name: string;
  label: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-[0.68rem] text-fg-faint uppercase tracking-widest">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type="password"
        required
        className="bg-bg-3 border border-border px-3 py-2 text-sm text-fg focus:outline-none focus:border-accent transition-colors"
      />
    </div>
  );
}
