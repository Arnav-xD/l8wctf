"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { AdminState } from "../actions";

const INITIAL: AdminState = { status: "idle", message: null };

// A one-click publish flip. The underlying update actions revalidate every
// field, so every current value rides along as a hidden input and only
// `published` changes.
export default function PublishToggle({
  action,
  fields,
  published,
}: {
  action: (state: AdminState, formData: FormData) => Promise<AdminState>;
  fields: Record<string, string>;
  published: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, INITIAL);
  const router = useRouter();

  useEffect(() => {
    if (state.status === "success") router.refresh();
  }, [state, router]);

  return (
    <form action={formAction}>
      {Object.entries(fields).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}
      {published ? (
        <input type="hidden" name="published" value="" />
      ) : (
        <input type="hidden" name="published" value="on" />
      )}
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
