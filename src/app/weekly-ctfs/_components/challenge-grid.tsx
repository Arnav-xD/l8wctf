"use client";

import { useState, useMemo } from "react";
import type { CtfChallenge } from "../../../lib/ctf";
import { ChallengeCard } from "./challenge-card";

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

const ALL = "all";

function uniq<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

/* ------------------------------------------------------------------ */
/*  Challenge Grid                                                       */
/* ------------------------------------------------------------------ */

export function ChallengeGrid({ challenges }: { challenges: CtfChallenge[] }) {
  const [category, setCategory] = useState(ALL);

  const categories = useMemo(
    () => uniq(challenges.map((c) => c.category)).sort(),
    [challenges],
  );

  const filtered = useMemo(() => {
    return challenges.filter((c) => {
      if (category !== ALL && c.category !== category) return false;
      return true;
    });
  }, [challenges, category]);

  const hasFilters = category !== ALL;

  function clearFilters() {
    setCategory(ALL);
  }

  if (challenges.length === 0) {
    return (
      <div className="panel p-8 text-center">
        <p className="kicker mb-3">{"// no challenges"}</p>
        <p className="text-sm text-fg-dim">
          Challenges will appear here once the week begins.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* ── Category filter bar ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        {/* category pills */}
        <div
          className="flex items-center gap-1.5 flex-wrap"
          role="group"
          aria-label="Filter by category"
        >
          <FilterPill
            id="cat-all"
            active={category === ALL}
            onClick={() => setCategory(ALL)}
          >
            all
          </FilterPill>
          {categories.map((cat) => (
            <FilterPill
              id={`cat-${cat}`}
              key={cat}
              active={category === cat}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </FilterPill>
          ))}
        </div>

        {/* clear */}
        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs text-fg-faint hover:text-danger transition-colors cursor-pointer"
            aria-label="Clear category filter"
          >
            clear
          </button>
        )}
      </div>

      {/* ── Result count ── */}
      <p className="text-xs text-fg-faint" aria-live="polite" aria-atomic="true">
        {filtered.length === challenges.length
          ? `${challenges.length} challenges`
          : `${filtered.length} of ${challenges.length}`}
      </p>

      {/* ── Grid ── */}
      {filtered.length > 0 ? (
        <ul
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          aria-label="CTF challenges"
        >
          {filtered.map((challenge) => (
            <li key={challenge.id}>
              <ChallengeCard challenge={challenge} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="panel p-8 text-center">
          <p className="text-sm text-fg-dim">
            No challenges match your filter.{" "}
            <button
              type="button"
              onClick={clearFilters}
              className="text-accent hover:underline cursor-pointer"
            >
              Clear filter
            </button>
          </p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Filter pill                                                         */
/* ------------------------------------------------------------------ */

function FilterPill({
  id,
  active,
  onClick,
  children,
}: {
  id: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`text-[0.7rem] uppercase tracking-[0.12em] px-2.5 py-1 border transition-colors cursor-pointer ${
        active
          ? "border-accent text-accent bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]"
          : "border-border text-fg-faint hover:border-accent/50 hover:text-fg-dim"
      }`}
    >
      {children}
    </button>
  );
}
