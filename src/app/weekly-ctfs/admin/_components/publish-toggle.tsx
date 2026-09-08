"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { AdminState } from "../actions";

const INITIAL: AdminState = { status: "idle", message: null };

// One-click publish flip. Only the id and the new `published` value are sent —
// the dedicated setWeekPublished / setChallengePublished actions update that
// single column, so a stale toggle can't overwrite another host's edits.
export default function PublishToggle({
  action,
  idField,
  id,
  published,
}: {
  action: (state: AdminState, formData: FormData) => Promise<AdminState>;
  idField: "weekId" | "challengeId";
  id: string;
  published: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, INITIAL);
  const router = useRouter();

  useEffect(() => {
    if (state.status === "success") router.refresh();
  }, [state, router]);

  return (
    <form action={formAction}>
      <input type="hidden" name={idField} value={id} />
      <input type="hidden" name="published" value={published ? "" : "on"} />
      <button
        type="submit"
        disabled={pending}
        className={`border px-2.5 py-1 text-[0.68rem] uppercase tracking-[0.14em] transition-colors disabled:opacity-50 ${
          published
            ? "border-accent/50 text-accent hover:border-accent"
            : "border-border text-fg-faint hover:border-fg-faint/70 hover:text-fg-dim"
        }`}
        title={
          state.status === "error"
            ? (state.message ?? "Could not change publish state.")
            : undefined
        }
      >
        {pending ? "..." : published ? "published" : "draft"}
      </button>
    </form>
  );
}
