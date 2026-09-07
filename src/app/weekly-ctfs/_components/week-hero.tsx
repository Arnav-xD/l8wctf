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
  const [remaining, setRemaining] = useState(() => Math.max(0, endsAt - Date.now()));

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(Math.max(0, endsAt - Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  const ended = remaining === 0;

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
              aria-label={`Time remaining: ${formatCountdown(remaining)}`}
              aria-live="off"
            >
              {formatCountdown(remaining)}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
