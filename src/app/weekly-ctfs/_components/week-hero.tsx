"use client";

import { useEffect, useState } from "react";
import type { CtfWeek } from "../../../lib/ctf";

/* ------------------------------------------------------------------ */
/*  Countdown helpers                                                   */
/* ------------------------------------------------------------------ */

function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

/* ------------------------------------------------------------------ */
/*  Week Hero                                                           */
/* ------------------------------------------------------------------ */

export function WeekHero({ week }: { week: CtfWeek }) {
  const endsAt = new Date(week.endsAt).getTime();
  // null = not yet mounted; avoids SSR/client hydration mismatch
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    // Use a 0-delay initial tick so state is only set client-side (after mount).
    // This avoids both the hydration mismatch and the react-hooks/set-state-in-effect lint error.
    const tick = () => setRemaining(Math.max(0, endsAt - Date.now()));
    const id = setInterval(tick, 1000);
    // Schedule the first tick asynchronously so it runs after the current render
    const init = setTimeout(tick, 0);
    return () => {
      clearInterval(id);
      clearTimeout(init);
    };
  }, [endsAt]);

  const ended = remaining !== null && remaining === 0;

  return (
    <div className="flex flex-col gap-3">
      <p className="kicker">{`// week ${week.sequenceNo} — ${week.slug}`}</p>

      <h1 className="font-display font-bold text-[clamp(1.6rem,5vw,3rem)] leading-tight text-fg">
        {week.title}
      </h1>

      <p className="text-sm text-fg-dim max-w-xl">{week.summary}</p>

      {/* countdown / ended badge */}
      <div className="flex items-center gap-3 mt-1">
        {ended ? (
          <span className="tag">week ended</span>
        ) : (
          <>
            <span className="text-[0.65rem] uppercase tracking-widest text-fg-faint">
              closes in
            </span>
            <span
              className="font-mono font-bold text-accent text-base tabular-nums glow"
              aria-label={
                remaining !== null
                  ? `Time remaining: ${formatCountdown(remaining)}`
                  : "Loading countdown"
              }
              aria-live="off"
            >
              {remaining !== null ? formatCountdown(remaining) : "--:--:--"}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
