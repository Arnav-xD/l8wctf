"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../../lib/supabase/client";
import {
  attachChallengeFile,
  removeChallengeAttachment,
} from "../actions";

type Phase = "idle" | "requesting" | "uploading" | "attaching";

// Mirrors ALLOWED_EXTENSIONS in /api/ctf/uploads — a client-side hint only;
// the route still validates on its own.
const ACCEPT_EXTENSIONS =
  ".7z,.bin,.elf,.exe,.gz,.jpeg,.jpg,.json,.mp3,.pcap,.pcapng,.pdf,.png,.tar,.txt,.wav,.webp,.zip";

export default function AttachmentManager({
  challengeId,
  attachmentPath,
}: {
  challengeId: string;
  attachmentPath: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);

  const busy = phase !== "idle";
  const currentName = attachmentPath
    ? attachmentPath.split("/").pop()
    : null;

  async function upload() {
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setError("Choose a file first.");
      return;
    }
    setError(null);

    try {
      setPhase("requesting");
      const response = await fetch("/api/ctf/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId,
          fileName: file.name,
          fileSize: file.size,
        }),
      });
      const payload = (await response.json()) as {
        path?: string;
        token?: string;
        error?: string;
      };
      if (!response.ok || !payload.path || !payload.token) {
        throw new Error(payload.error ?? "Could not authorize the upload.");
      }

      setPhase("uploading");
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from("ctf-files")
        .uploadToSignedUrl(payload.path, payload.token, file);
      if (uploadError) throw uploadError;

      setPhase("attaching");
      const formData = new FormData();
      formData.set("challengeId", challengeId);
      formData.set("attachmentPath", payload.path);
      const result = await attachChallengeFile(
        { status: "idle", message: null },
        formData,
      );
      if (result.status === "error") {
        throw new Error(result.message ?? "Could not attach the file.");
      }

      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Upload failed.");
    } finally {
      setPhase("idle");
    }
  }

  async function remove() {
    if (!window.confirm("Remove the attached file from this challenge?")) return;
    setError(null);
    setPhase("attaching");
    try {
      const formData = new FormData();
      formData.set("challengeId", challengeId);
      await removeChallengeAttachment(formData);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not remove.");
    } finally {
      setPhase("idle");
    }
  }

  return (
    <div className="flex flex-col gap-2 border-t border-border pt-3">
      <span className="text-[0.66rem] uppercase tracking-[0.18em] text-fg-faint">
        attachment
      </span>

      {currentName ? (
        <div className="flex flex-wrap items-center gap-2 text-[0.8rem]">
          <span className="font-mono text-fg">{currentName}</span>
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            className="border border-[color:var(--danger)]/50 px-2 py-0.5 text-[0.66rem] uppercase tracking-[0.14em] text-[color:var(--danger)] hover:border-[color:var(--danger)] disabled:opacity-50"
          >
            remove
          </button>
        </div>
      ) : (
        <p className="text-[0.78rem] text-fg-dim">No file attached.</p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_EXTENSIONS}
          disabled={busy}
          className="max-w-full text-[0.76rem] text-fg-dim file:mr-3 file:border file:border-border file:bg-bg-3 file:px-2 file:py-1 file:text-[0.7rem] file:uppercase file:tracking-[0.14em] file:text-fg-dim"
        />
        <button
          type="button"
          onClick={upload}
          disabled={busy}
          className="btn"
        >
          {phase === "idle"
            ? currentName
              ? "> replace"
              : "> upload"
            : phase === "requesting"
              ? "> authorizing..."
              : phase === "uploading"
                ? "> uploading..."
                : "> attaching..."}
        </button>
      </div>

      <p className="text-[0.7rem] text-fg-faint">
        Max 50 MB. Allowed: archives, binaries, pcap, images, pdf, txt, wav, mp3.
      </p>
      {error ? (
        <p className="text-[0.76rem] text-[color:var(--danger)]">{error}</p>
      ) : null}
    </div>
  );
}
