"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

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

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!window.confirm(confirm)) return;
        const formData = new FormData();
        for (const [key, value] of Object.entries(fields)) {
          formData.set(key, value);
        }
        startTransition(async () => {
          await action(formData);
          router.refresh();
        });
      }}
      className="border border-[color:var(--danger)]/50 px-2.5 py-1 text-[0.68rem] uppercase tracking-[0.14em] text-[color:var(--danger)] transition-colors hover:border-[color:var(--danger)] hover:bg-[color:var(--danger)]/10 disabled:opacity-50"
    >
      {pending ? "..." : children}
    </button>
  );
}
