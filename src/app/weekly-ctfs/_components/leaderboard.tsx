import type { LeaderboardEntry } from "../../../lib/ctf";

/* ------------------------------------------------------------------ */
/*  Leaderboard                                                         */
/* ------------------------------------------------------------------ */

export function Leaderboard({ entries }: { entries: LeaderboardEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="term">
        <div className="term-bar">
          <span className="term-dot" />
          <span className="term-dot" />
          <span className="term-dot" />
          <span className="text-[0.7rem] text-fg-faint ml-1">{"// leaderboard"}</span>
        </div>
        <div className="term-body min-h-[6rem] flex items-center justify-center">
          <p className="text-xs text-fg-faint">no solves yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="term" aria-label="Leaderboard">
      {/* terminal title bar */}
      <div className="term-bar">
        <span className="term-dot" />
        <span className="term-dot" />
        <span className="term-dot" />
        <span className="text-[0.7rem] text-fg-faint ml-1">{"// leaderboard"}</span>
      </div>

      {/* table */}
      <div className="term-body !min-h-0 !pb-4 overflow-x-auto">
        <table
          className="w-full text-[0.75rem] border-collapse"
          aria-label="CTF leaderboard"
        >
          <thead>
            <tr className="text-fg-faint">
              <th className="text-left pb-2 pr-3 font-normal w-6">#</th>
              <th className="text-left pb-2 pr-3 font-normal">handle</th>
              <th className="text-right pb-2 pr-3 font-normal">pts</th>
              <th className="text-right pb-2 font-normal">solves</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr
                key={entry.rank}
                className={`border-t border-border/50 ${
                  entry.rank === 1 ? "text-fg" : "text-fg-dim"
                }`}
              >
                <td className="py-1.5 pr-3 tabular-nums text-fg-faint">
                  {entry.rank === 1 ? (
                    <span className="text-accent">{entry.rank}</span>
                  ) : (
                    entry.rank
                  )}
                </td>
                <td className="py-1.5 pr-3 font-mono max-w-[8rem] truncate">
                  <span className="text-fg-faint prompt">$</span>{" "}
                  {entry.handle}
                </td>
                <td className="py-1.5 pr-3 text-right tabular-nums text-accent">
                  {entry.points}
                </td>
                <td className="py-1.5 text-right tabular-nums text-fg-faint">
                  {entry.solves}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
