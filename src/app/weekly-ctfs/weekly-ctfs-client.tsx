"use client";

import Link from "next/link";
import { Header, Footer } from "../_components/site-chrome";
import type { CtfDashboard } from "../../lib/ctf";
import { WeekHero } from "./_components/week-hero";
import { ChallengeGrid } from "./_components/challenge-grid";
import { UserStatsPanel } from "./_components/user-stats-panel";
import { SignInForm } from "./_components/sign-in-form";

/* ------------------------------------------------------------------ */
/*  Main dashboard shell                                               */
/* ------------------------------------------------------------------ */

export function WeeklyCtfsDashboard({ data }: { data: CtfDashboard }) {
  const { week, challenges, viewer, configured } = data;

  return (
    <>
      <Header current="Weekly CTFs" />

      <main className="flex-1 route-transition">
        {/* ── Page header ── */}
        <section className="wrap pt-10 pb-6 md:pt-14 md:pb-8">
          <div className="rule mb-8" />

          {!configured && (
            <div className="mb-6 border border-border bg-bg-3 px-4 py-3 text-xs text-fg-faint">
              <span className="text-accent">!</span> Demo mode — Supabase is
              not configured. Showing sample data. Flag submissions are
              disabled.
            </div>
          )}

        {/* ── Hero + top actions ── */}
          {week ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <WeekHero week={week} />
              <div className="flex-shrink-0">
                <Link
                  href="/weekly-ctfs/leaderboard"
                  id="hero-leaderboard-btn"
                  className="btn btn-solid text-xs"
                  aria-label="View overall top 10 leaderboard"
                >
                  &gt; view_leaderboard
                </Link>
              </div>
            </div>
          ) : (
            <NoActiveWeek />
          )}
        </section>

        {week && (
          <section className="wrap pb-16">
            {/* ── Two-column layout on large screens ── */}
            <div className="grid gap-8 lg:grid-cols-[1fr_300px]">

              {/* ── Left: challenges ── */}
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-3">
                  <p className="kicker">{"// challenges"}</p>
                  <span className="text-[0.68rem] text-fg-faint">
                    {challenges.filter((c) => c.solved).length}/{challenges.length} solved
                  </span>
                </div>
                <ChallengeGrid challenges={challenges} />
              </div>

              {/* ── Right: sidebar ── */}
              <aside className="flex flex-col gap-4">
                {/* User stats or sign-in CTA */}
                {viewer ? (
                  <UserStatsPanel viewer={viewer} challenges={challenges} />
                ) : (
                  <>
                    <UserStatsPanel viewer={null} challenges={challenges} />
                    <SignInForm />
                  </>
                )}
              </aside>

            </div>
          </section>
        )}
      </main>

      <Footer current="Weekly CTFs" />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  No active week state                                               */
/* ------------------------------------------------------------------ */

function NoActiveWeek() {
  return (
    <div className="flex flex-col gap-4 py-10">
      <p className="kicker">{"// no active week"}</p>
      <h1 className="font-display font-bold text-[clamp(1.5rem,4vw,2.5rem)] text-fg">
        No CTF Running
      </h1>
      <p className="text-sm text-fg-dim max-w-md">
        There is no active CTF week right now. Sessions run weekly — check
        back soon or follow Layer8 on{" "}
        <a
          href="https://www.instagram.com/layer8.pesu/"
          target="_blank"
          rel="noreferrer"
          className="text-accent hover:underline"
        >
          Instagram
        </a>{" "}
        for announcements.
      </p>
    </div>
  );
}
