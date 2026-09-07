"use client";

import type { ReactNode } from "react";

export const FIELD =
  "min-w-0 w-full border border-border bg-bg-3 px-3 py-2 font-mono text-[0.85rem] text-fg outline-none transition-[border-color,box-shadow] placeholder:text-fg-faint focus:border-accent focus:shadow-[0_0_0_1px_var(--accent)] disabled:opacity-60";

export const LABEL =
  "text-[0.66rem] uppercase tracking-[0.18em] text-fg-faint";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className={LABEL}>{label}</span>
      {children}
      {hint ? (
        <span className="text-[0.7rem] text-fg-faint">{hint}</span>
      ) : null}
    </label>
  );
}

export function StatusLine({
  status,
  message,
}: {
  status: "idle" | "error" | "success";
  message: string | null;
}) {
  const tone =
    status === "error"
      ? "text-[color:var(--danger)]"
      : status === "success"
        ? "text-accent"
        : "text-fg-dim";
  return (
    <p
      aria-live="polite"
      role="status"
      className={`min-h-[1.2rem] text-[0.78rem] ${tone}`}
    >
      {message ?? ""}
    </p>
  );
}

// Stored timestamps are UTC ISO. `datetime-local` wants `YYYY-MM-DDTHH:MM`
// in the operation's own timezone, which the actions treat as IST (+05:30).
export function isoToIstLocal(iso: string) {
  const shifted = new Date(new Date(iso).getTime() + 5.5 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 16);
}

export const CATEGORIES = [
  "web",
  "pwn",
  "rev",
  "crypto",
  "forensics",
  "stego",
  "osint",
  "net",
  "misc",
] as const;

export const DIFFICULTIES = ["beginner", "easy", "medium", "hard"] as const;
