"use client";

import Link from "next/link";
import { Header, Footer } from "../../_components/site-chrome";
import type { CtfWeek, CtfViewer, LeaderboardEntry } from "../../../lib/ctf";

/* ------------------------------------------------------------------ */
/*  Props                                                               */
/* ------------------------------------------------------------------ */

interface LeaderboardPageClientProps {
  week: CtfWeek | null;
  leaderboard: LeaderboardEntry[];
  viewer: CtfViewer | null;
  configured: boolean;
}

/* ------------------------------------------------------------------ */
/*  Rank medal styling                                                  */
/* ------------------------------------------------------------------ */

function rankLabel(rank: number): React.ReactNode {
  if (rank === 1) return <span className="text-accent glow font-bold">01</span>;
  if (rank === 2) return <span className="text-fg-dim font-bold">02</span>;
  if (rank === 3) return <span className="text-fg-faint font-bold">03</span>;
  return (
    <span className="text-fg-faint tabular-nums">
      {String(rank).padStart(2, "0")}
    </span>
  );
}

function formatSolveTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/* ------------------------------------------------------------------ */
/*  Leaderboard Page Client                                             */
/* ------------------------------------------------------------------ */

export function LeaderboardPageClient({
  week,
  leaderboard,
  viewer,
  configured,
}: LeaderboardPageClientProps) {
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
              <li className="text-fg-dim">leaderboard</li>
            </ol>
          </nav>

          <div className="rule mb-8" />

          {/* ── Page heading ── */}
          <div className="flex flex-col gap-3 mb-8">
            <p className="kicker">
              {week
                ? `// week ${week.sequenceNo} — ${week.slug}`
                : "// weekly ctf"}
            </p>
            <h1 className="font-display font-bold text-[clamp(1.6rem,5vw,3rem)] leading-tight text-fg">
              Overall Top 10
            </h1>
            <p className="text-sm text-fg-dim max-w-xl">
              All-time rankings by points across all CTF weeks.
              {week && <> Current week: <span className="text-fg">{week.title}</span>.</>}
            </p>
          </div>

          {/* ── Demo mode banner ── */}
          {!configured && (
            <div className="mb-6 border border-border bg-bg-3 px-4 py-3 text-xs text-fg-faint">
              <span className="text-accent">!</span> Demo mode — Supabase is not
              configured. Showing sample data.
            </div>
          )}

          {/* ── Viewer rank callout (if authenticated + on leaderboard) ── */}
          {viewer && leaderboard.length > 0 && (() => {
            const myEntry = leaderboard.find((e) => e.handle === viewer.handle);
            if (!myEntry) return null;
            return (
              <div
                className="mb-6 border border-accent/30 bg-[color-mix(in_srgb,var(--accent)_6%,transparent)] px-4 py-3 flex items-center gap-3"
                role="status"
              >
                <span className="text-[0.7rem] uppercase tracking-widest text-fg-faint">
                  your rank
                </span>
                <span className="text-accent font-bold font-display text-lg">
                  #{myEntry.rank}
                </span>
                <span className="text-xs text-fg-dim">
                  {myEntry.points} pts · {myEntry.solves}{" "}
                  {myEntry.solves === 1 ? "solve" : "solves"}
                </span>
              </div>
            );
          })()}

          {/* ── Leaderboard table ── */}
          {leaderboard.length === 0 ? (
            <EmptyLeaderboard />
          ) : (
            <LeaderboardTable entries={leaderboard} viewerHandle={viewer?.handle} />
          )}

          {/* ── Tie-break note ── */}
          <p className="mt-6 text-[0.68rem] text-fg-faint">
            Overall top 10 across all weeks — ranked by total points. Equal points ordered by earliest score,
            determined server-side.
          </p>

          {/* ── Back link ── */}
          <div className="mt-10">
            <Link
              href="/weekly-ctfs"
              id="leaderboard-back-btn"
              className="btn text-xs"
            >
              &larr; back_to_challenges
            </Link>
          </div>
        </div>
      </main>

      <Footer current="Weekly CTFs" />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Leaderboard table                                                   */
/* ------------------------------------------------------------------ */

function LeaderboardTable({
  entries,
  viewerHandle,
}: {
  entries: LeaderboardEntry[];
  viewerHandle?: string;
}) {
  return (
    <div className="term" aria-label="CTF Leaderboard">
      {/* terminal title bar */}
      <div className="term-bar">
        <span className="term-dot" />
        <span className="term-dot" />
        <span className="term-dot" />
        <span className="text-[0.7rem] text-fg-faint ml-1">{"// overall_top_10"}</span>
      </div>

      {/* table */}
      <div className="term-body !min-h-0 !pb-4 overflow-x-auto">
        <table
          className="w-full text-[0.78rem] border-collapse"
          aria-label="Overall Top 10 rankings"
        >
          <thead>
            <tr className="text-fg-faint text-[0.68rem] uppercase tracking-[0.1em]">
              <th className="text-left pb-3 pr-4 font-normal w-10">#</th>
              <th className="text-left pb-3 pr-4 font-normal">handle</th>
              <th className="text-right pb-3 pr-4 font-normal">pts</th>
              <th className="text-right pb-3 pr-4 font-normal hidden sm:table-cell">
                solves
              </th>
              <th className="text-right pb-3 font-normal hidden md:table-cell">
                last_solve
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const isViewer = entry.handle === viewerHandle;
              const isTop3 = entry.rank <= 3;
              return (
                <tr
                  key={entry.rank}
                  className={`border-t border-border/40 transition-colors ${
                    isViewer
                      ? "bg-[color-mix(in_srgb,var(--accent)_5%,transparent)]"
                      : isTop3
                      ? ""
                      : "opacity-80"
                  }`}
                >
                  {/* rank */}
                  <td className="py-2.5 pr-4 font-mono text-[0.72rem]">
                    {rankLabel(entry.rank)}
                  </td>

                  {/* handle */}
                  <td className="py-2.5 pr-4">
                    <div className="flex items-center gap-1.5">
                      <span className="text-accent/60 font-mono text-[0.68rem] select-none">
                        $
                      </span>
                      <span
                        className={`font-mono ${
                          isViewer
                            ? "text-accent font-bold"
                            : entry.rank === 1
                            ? "text-fg font-bold"
                            : "text-fg-dim"
                        }`}
                      >
                        {entry.handle}
                      </span>
                      {isViewer && (
                        <span className="text-[0.58rem] uppercase tracking-widest text-accent border border-accent/30 px-1 py-0.5 leading-none">
                          you
                        </span>
                      )}
                    </div>
                  </td>

                  {/* points */}
                  <td className="py-2.5 pr-4 text-right tabular-nums">
                    <span
                      className={`font-bold ${
                        entry.rank === 1 ? "text-accent glow" : "text-accent"
                      }`}
                    >
                      {entry.points}
                    </span>
                  </td>

                  {/* solves */}
                  <td className="py-2.5 pr-4 text-right tabular-nums text-fg-faint hidden sm:table-cell">
                    {entry.solves}
                  </td>

                  {/* last solve */}
                  <td className="py-2.5 text-right text-fg-faint hidden md:table-cell text-[0.68rem]">
                    {formatSolveTime(entry.lastSolveAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty state                                                         */
/* ------------------------------------------------------------------ */

function EmptyLeaderboard() {
  return (
    <div className="term">
      <div className="term-bar">
        <span className="term-dot" />
        <span className="term-dot" />
        <span className="term-dot" />
        <span className="text-[0.7rem] text-fg-faint ml-1">{"// ctf_leaderboard"}</span>
      </div>
      <div className="term-body min-h-[10rem] flex items-center justify-center">
        <p className="text-xs text-fg-faint">no solves recorded yet</p>
      </div>
    </div>
  );
}
