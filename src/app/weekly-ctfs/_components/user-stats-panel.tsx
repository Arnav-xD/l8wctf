"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signOut, changePassword, type PasswordState } from "../actions";
import type { CtfViewer, CtfChallenge } from "../../../lib/ctf";

const INITIAL_PW: PasswordState = { status: "idle", message: null };

/* ------------------------------------------------------------------ */
/*  User Stats Panel                                                    */
/*  Shows streak, progress, and points for authenticated viewers.      */
/*  Shows a sign-in CTA for unauthenticated visitors.                  */
/* ------------------------------------------------------------------ */

export function UserStatsPanel({
  viewer,
  challenges,
}: {
  viewer: CtfViewer | null;
  challenges: CtfChallenge[];
}) {
  if (!viewer) {
    return <SignInCta />;
  }

  return <AuthenticatedStats viewer={viewer} challenges={challenges} />;
}

/* ------------------------------------------------------------------ */
/*  Unauthenticated CTA                                                 */
/* ------------------------------------------------------------------ */

function SignInCta() {
  return (
    <div className="term" aria-label="Sign in">
      <div className="term-bar">
        <span className="term-dot" />
        <span className="term-dot" />
        <span className="term-dot" />
        <span className="text-[0.7rem] text-fg-faint ml-1">{"// profile"}</span>
      </div>
      <div className="term-body !min-h-0 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-xs text-fg-faint">
            <span className="prompt">$</span> not authenticated
          </p>
          <p className="text-xs text-fg-dim leading-relaxed">
            Sign in to track your progress, view your streak, and submit flags.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/weekly-ctfs/sign-in"
            id="dashboard-sign-in-btn"
            className="btn btn-solid text-xs"
          >
            &gt; sign_in
          </Link>
          <Link
            href="/weekly-ctfs/sign-up"
            id="dashboard-sign-up-btn"
            className="btn text-xs"
          >
            &gt; create_account
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Authenticated stats                                                 */
/* ------------------------------------------------------------------ */

function AuthenticatedStats({
  viewer,
  challenges,
}: {
  viewer: CtfViewer;
  challenges: CtfChallenge[];
}) {
  const [showPw, setShowPw] = useState(false);
  const [pwState, pwAction, pwPending] = useActionState(changePassword, INITIAL_PW);

  const totalChallenges = challenges.length;
  const weeklySolved = challenges.filter((c) => c.solved).length;
  const progressPct =
    totalChallenges > 0
      ? Math.min(100, Math.round((weeklySolved / totalChallenges) * 100))
      : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* ── Profile / stats terminal ── */}
      <div className="term" aria-label="Your stats">
        <div className="term-bar">
          <span className="term-dot" />
          <span className="term-dot" />
          <span className="term-dot" />
          <span className="text-[0.7rem] text-fg-faint ml-1">{"// profile"}</span>
        </div>
        <div className="term-body !min-h-0 flex flex-col gap-4">
          {/* username + role */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-baseline gap-2 min-w-0">
              <span className="text-fg-faint text-xs flex-shrink-0">$</span>
              <span className="text-accent font-bold truncate">{viewer.username}</span>
            </div>
            {viewer.role !== "student" && (
              <span className="text-[0.62rem] uppercase tracking-widest text-accent border border-accent/30 px-1.5 py-0.5 flex-shrink-0">
                {viewer.role}
              </span>
            )}
          </div>

          <div className="rule" />

          {/* ── Three stats ── */}
          <dl className="grid grid-cols-3 gap-2 text-center">
            <StatItem label="points" value={viewer.points} />
            <StatItem
              label="this week"
              value={`${weeklySolved}/${totalChallenges}`}
            />
            <StatItem label="streak" value={<StreakValue streak={viewer.streak} />} />
          </dl>

          <div className="rule" />

          {/* ── Progress bar ── */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[0.65rem] uppercase tracking-[0.14em] text-fg-faint">
                week progress
              </span>
              <span className="text-[0.65rem] text-accent font-bold tabular-nums">
                {progressPct}%
              </span>
            </div>
            <div
              className="h-[3px] bg-border overflow-hidden"
              role="progressbar"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${weeklySolved} of ${totalChallenges} challenges solved this week`}
            >
              <div
                className="h-full bg-accent transition-[width] duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-[0.65rem] text-fg-faint">
              {weeklySolved === totalChallenges && totalChallenges > 0
                ? "all challenges solved"
                : `${weeklySolved} of ${totalChallenges} challenges`}
            </p>
          </div>

          <div className="rule" />

          {/* ── Lifetime solves ── */}
          <dl className="grid grid-cols-3 gap-2 text-center">
            <StatItem label="lifetime solves" value={viewer.solved} />
          </dl>
        </div>
      </div>

      {/* ── Account actions ── */}
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
            <PwField id="ctf-pw-new" name="newPassword" label="New password" />
            <PwField id="ctf-pw-confirm" name="confirmation" label="Confirm new password" />

            <p className="text-[0.65rem] text-fg-faint">
              Use 10+ characters with lowercase, uppercase, number, and a special
              character.
            </p>

            {pwState.status === "error" && (
              <p role="alert" className="text-xs text-danger">
                {pwState.message}
              </p>
            )}
            {pwState.status === "success" && (
              <p role="status" className="text-xs text-fg">
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

function StatItem({
  label,
  value,
}: {
  label: string;
  value: string | number | React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-accent font-display font-bold text-lg leading-none">
        {value}
      </span>
      <span className="text-[0.62rem] uppercase tracking-[0.14em] text-fg-faint">
        {label}
      </span>
    </div>
  );
}

function StreakValue({ streak }: { streak: number }) {
  if (streak === 0) {
    return <span className="text-fg-faint text-base">—</span>;
  }
  return (
    <span>
      {streak}
      <span className="text-[0.65rem] text-fg-faint font-normal ml-0.5">w</span>
    </span>
  );
}

function PwField({ id, name, label }: { id: string; name: string; label: string }) {
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
