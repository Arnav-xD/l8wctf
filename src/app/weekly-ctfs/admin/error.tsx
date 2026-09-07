"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("CTF admin error", error);
  }, [error]);

  return (
    <div className="wrap py-20">
      <p className="kicker mb-4">{"// ~/weekly-ctfs/admin"}</p>
      <h1 className="font-display text-[1.75rem] font-bold text-fg">
        Something broke in the host console
      </h1>
      <p className="mt-3 max-w-[34rem] text-[0.9rem] text-fg-dim">
        {error.message || "An unexpected error occurred while talking to Supabase."}
      </p>
      <button type="button" className="btn mt-6" onClick={reset}>
        {"> retry"}
      </button>
    </div>
  );
}
