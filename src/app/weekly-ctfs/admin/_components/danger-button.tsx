"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export default function DangerButton({
  action,
  fields,
  confirm,
  children,
}: {
  action: (formData: FormData) => Promise<void>;
  fields: Record<string, string>;
  confirm: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(confirm)) return;
          setError(null);
          const formData = new FormData();
          for (const [key, value] of Object.entries(fields)) {
            formData.set(key, value);
          }
          startTransition(async () => {
            try {
              await action(formData);
              router.refresh();
            } catch (cause) {
              setError(
                cause instanceof Error
                  ? cause.message
                  : "The action could not be completed.",
              );
            }
          });
        }}
        className="border border-[color:var(--danger)]/50 px-2.5 py-1 text-[0.68rem] uppercase tracking-[0.14em] text-[color:var(--danger)] transition-colors hover:border-[color:var(--danger)] hover:bg-[color:var(--danger)]/10 disabled:opacity-50"
      >
        {pending ? "..." : children}
      </button>
      {error ? (
        <span
          role="status"
          className="max-w-[16rem] text-right text-[0.66rem] text-[color:var(--danger)]"
        >
          {error}
        </span>
      ) : null}
    </span>
  );
}
