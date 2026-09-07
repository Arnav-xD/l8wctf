"use client";

import Link from "next/link";
import { Header, Footer } from "../../_components/site-chrome";
import type { CtfChallenge, CtfViewer, CtfWeek } from "../../../lib/ctf";
import { FlagForm } from "../_components/flag-form";

/* ------------------------------------------------------------------ */
/*  Difficulty colour                                                   */
/* ------------------------------------------------------------------ */

const DIFFICULTY_COLOUR: Record<CtfChallenge["difficulty"], string> = {
  beginner: "text-[#4ade80] border-[#4ade80]/30",
  easy:     "text-[#86efac] border-[#86efac]/30",
  medium:   "text-[#fbbf24] border-[#fbbf24]/30",
  hard:     "text-[#f87171] border-[#f87171]/30",
};

/* ------------------------------------------------------------------ */
/*  Props                                                               */
/* ------------------------------------------------------------------ */

interface ChallengeClientProps {
  challenge: CtfChallenge;
  week: CtfWeek;
  viewer: CtfViewer | null;
  configured: boolean;
}

/* ------------------------------------------------------------------ */
/*  Challenge detail                                                    */
/* ------------------------------------------------------------------ */

export function ChallengeClient({
  challenge,
  week,
  viewer,
  configured,
}: ChallengeClientProps) {
  const diffClass = DIFFICULTY_COLOUR[challenge.difficulty] ?? "text-fg-dim border-border";

  return (
    <>
      <Header current="Weekly CTFs" />

      <main className="flex-1 route-transition">
        <div className="wrap py-10 md:py-14">
          {/* ── Breadcrumb ── */}
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex items-center gap-2 text-xs text-fg-faint">
              <li>
                <Link href="/weekly-ctfs" className="hover:text-accent transition-colors">
                  weekly-ctfs
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li className="text-fg-dim truncate max-w-[16rem]">{challenge.slug}</li>
            </ol>
          </nav>

          <div className="rule mb-8" />

          <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
            {/* ── Left: challenge info ── */}
            <article>
              {/* metadata row */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="tag">{challenge.category}</span>
                <span
                  className={`text-[0.65rem] uppercase tracking-[0.14em] border px-1.5 py-0.5 ${diffClass}`}
                >
                  {challenge.difficulty}
                </span>
                <span className="text-accent font-bold text-sm">
                  +{challenge.points} pts
                </span>
                <span className="text-xs text-fg-faint ml-auto">
                  {challenge.solveCount} {challenge.solveCount === 1 ? "solve" : "solves"}
                </span>
              </div>

              {/* title */}
              <h1 className="font-display font-bold text-[clamp(1.4rem,4vw,2.2rem)] leading-tight text-fg mb-3">
                {challenge.title}
              </h1>

              {/* week context */}
              <p className="kicker mb-6">
                {`// week ${week.sequenceNo} — ${week.title}`}
              </p>

              {/* description panel */}
              <div className="panel p-5 mb-6">
                <p className="kicker mb-3 text-[0.65rem]">{"// description"}</p>
                <p className="text-sm text-fg-dim leading-relaxed whitespace-pre-wrap">
                  {challenge.description}
                </p>
              </div>

              {/* connection info */}
              {challenge.connectionInfo && (
                <div className="term mb-6">
                  <div className="term-bar">
                    <span className="term-dot" />
                    <span className="term-dot" />
                    <span className="term-dot" />
                    <span className="text-[0.7rem] ml-1 text-fg-faint">{"// connection_info"}</span>
                  </div>
                  <div className="term-body !min-h-0">
                    <pre className="text-fg-dim text-xs whitespace-pre-wrap break-all">
                      {challenge.connectionInfo}
                    </pre>
                  </div>
                </div>
              )}

              {/* file download */}
              {challenge.attachmentPath && (
                <div className="mb-6">
                  <p className="kicker mb-3 text-[0.65rem]">{"// attachment"}</p>
                  {viewer ? (
                    <a
                      id="challenge-download-btn"
                      href={`/api/ctf/download/${challenge.id}`}
                      className="btn"
                      aria-label={`Download challenge file for ${challenge.title}`}
                    >
                      &gt; download_file
                    </a>
                  ) : (
                    <p className="text-xs text-fg-faint">
                      Sign in to download the challenge file.
                    </p>
                  )}
                </div>
              )}

              {/* demo mode notice */}
              {!configured && (
                <div className="border border-border bg-bg-3 px-4 py-3 text-xs text-fg-faint mb-6">
                  <span className="text-accent">!</span> Demo mode — flag
                  submission is disabled.
                </div>
              )}
            </article>

            {/* ── Right: flag form ── */}
            <aside className="flex flex-col gap-4">
              {challenge.solved && (
                <div
                  className="flex items-center gap-2 border border-accent/30 bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] px-4 py-2 text-xs text-accent"
                  role="status"
                >
                  <span aria-hidden>✓</span> You solved this challenge.
                </div>
              )}

              <FlagForm
                challenge={challenge}
                isAuthenticated={viewer !== null}
              />

              {/* back link */}
              <Link
                href="/weekly-ctfs"
                className="btn text-xs self-start"
                aria-label="Back to all challenges"
              >
                &larr; back_to_dashboard
              </Link>
            </aside>
          </div>
        </div>
      </main>

      <Footer current="Weekly CTFs" />
    </>
  );
}
