import Link from "next/link";
import type { CtfChallenge } from "../../../lib/ctf";

/* ------------------------------------------------------------------ */
/*  Difficulty colours                                                  */
/* ------------------------------------------------------------------ */

const DIFFICULTY_COLOUR: Record<CtfChallenge["difficulty"], string> = {
  beginner: "text-fg-faint border-border",
  easy:     "text-fg-dim border-border",
  medium:   "text-fg border-border",
  hard:     "text-accent border-accent/30",
};

/* ------------------------------------------------------------------ */
/*  Category colour                                                     */
/* ------------------------------------------------------------------ */

const CATEGORY_ICON: Record<string, string> = {
  web: "//web",
  crypto: "//crypto",
  forensics: "//forensics",
  rev: "//rev",
  pwn: "//pwn",
  misc: "//misc",
  osint: "//osint",
  stego: "//stego",
};

/* ------------------------------------------------------------------ */
/*  Challenge Card                                                       */
/* ------------------------------------------------------------------ */

export function ChallengeCard({ challenge }: { challenge: CtfChallenge }) {
  const diffClass = DIFFICULTY_COLOUR[challenge.difficulty] ?? "text-fg-dim border-border";
  const catLabel = CATEGORY_ICON[challenge.category] ?? `// ${challenge.category}`;

  return (
    <Link
      href={`/weekly-ctfs/${challenge.slug}`}
      className={`card group relative flex flex-col gap-3 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
        challenge.solved ? "border-accent/30 bg-[color-mix(in_srgb,var(--bg-2)_92%,var(--accent))]" : ""
      }`}
      aria-label={`${challenge.title} — ${challenge.difficulty} — ${challenge.points} points${challenge.solved ? " — solved" : ""}`}
    >
      {/* solved badge */}
      {challenge.solved && (
        <span className="absolute top-3 right-3 text-[0.6rem] tracking-[0.18em] uppercase text-accent border border-accent/40 px-1.5 py-0.5">
          solved
        </span>
      )}

      {/* category kicker */}
      <p className="kicker text-[0.65rem]">{catLabel}</p>

      {/* title */}
      <h3 className="font-display font-bold text-[1.0625rem] text-fg leading-tight group-hover:text-accent transition-colors">
        {challenge.title}
      </h3>

      {/* summary */}
      <p className="text-xs text-fg-dim leading-relaxed line-clamp-2 flex-1">
        {challenge.summary}
      </p>

      {/* footer row */}
      <div className="flex items-center justify-between pt-1 mt-auto">
        <div className="flex items-center gap-2">
          {/* difficulty */}
          <span
            className={`text-[0.65rem] uppercase tracking-[0.14em] border px-1.5 py-0.5 ${diffClass}`}
          >
            {challenge.difficulty}
          </span>
          {/* points */}
          <span className="text-accent font-bold text-[0.8rem]">
            +{challenge.points}
          </span>
        </div>

        {/* solve count */}
        <span className="text-[0.68rem] text-fg-faint tabular-nums">
          {challenge.solveCount} {challenge.solveCount === 1 ? "solve" : "solves"}
        </span>
      </div>
    </Link>
  );
}
