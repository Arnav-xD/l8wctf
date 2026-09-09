"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type {
  CtfAdminChallenge,
  CtfAdminWeek,
} from "../../../../lib/ctf-admin";
import {
  createChallenge,
  updateChallenge,
  type AdminState,
} from "../actions";
import {
  CATEGORIES,
  DIFFICULTIES,
  Field,
  FIELD,
  StatusLine,
} from "./form-kit";

const INITIAL: AdminState = { status: "idle", message: null };

export default function ChallengeForm({
  weeks,
  challenge,
  defaultWeekId,
  onDone,
}: {
  weeks: CtfAdminWeek[];
  challenge?: CtfAdminChallenge;
  defaultWeekId?: string;
  onDone?: () => void;
}) {
  const editing = challenge != null;
  const [state, formAction, pending] = useActionState(
    editing ? updateChallenge : createChallenge,
    INITIAL,
  );
  const router = useRouter();

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
      onDone?.();
    }
  }, [state, router, onDone]);

  const weekValue = challenge?.weekId ?? defaultWeekId ?? weeks[0]?.id;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {editing ? (
        <input type="hidden" name="challengeId" value={challenge.id} />
      ) : null}

      <Field label="operation">
        <select
          name="weekId"
          required
          defaultValue={weekValue}
          className={FIELD}
        >
          {weeks.map((week) => (
            <option key={week.id} value={week.id}>
              #{week.sequenceNo.toString().padStart(2, "0")} · {week.title}
            </option>
          ))}
        </select>
      </Field>

      <Field label="title">
        <input
          name="title"
          required
          maxLength={120}
          defaultValue={challenge?.title}
          className={FIELD}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="category">
          <select
            name="category"
            required
            defaultValue={challenge?.category ?? "web"}
            className={FIELD}
          >
            {CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </Field>
        <Field label="difficulty">
          <select
            name="difficulty"
            required
            defaultValue={challenge?.difficulty ?? "beginner"}
            className={FIELD}
          >
            {DIFFICULTIES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </Field>
        <Field label="points" hint="10 – 1000">
          <input
            name="points"
            type="number"
            min={10}
            max={1000}
            step={10}
            required
            defaultValue={challenge?.points ?? 100}
            className={FIELD}
          />
        </Field>
      </div>

      <Field label="summary" hint="one line, shown on the challenge card">
        <input
          name="summary"
          required
          maxLength={200}
          defaultValue={challenge?.summary}
          className={FIELD}
        />
      </Field>

      <Field label="description" hint="full brief, shown on the challenge page">
        <textarea
          name="description"
          required
          rows={5}
          defaultValue={challenge?.description}
          className={FIELD}
        />
      </Field>

      <Field label="connection info" hint="optional — host, port, URL">
        <input
          name="connectionInfo"
          maxLength={200}
          defaultValue={challenge?.connectionInfo ?? ""}
          className={FIELD}
        />
      </Field>

      <Field
        label="flag"
        hint={
          editing
            ? "leave blank to keep the current flag — entering a value replaces the stored hash"
            : "stored only as a SHA-256 hash, never in plaintext"
        }
      >
        <input
          name="flag"
          type="text"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          required={!editing}
          maxLength={512}
          placeholder="layer8{...}"
          className={FIELD}
        />
      </Field>

      {editing ? (
        <p className="text-[0.75rem] text-fg-faint">
          Use the published / draft toggle to change visibility — it is not
          part of this form.
        </p>
      ) : (
        <label className="flex items-center gap-2.5 text-[0.8rem] text-fg-dim">
          <input
            type="checkbox"
            name="published"
            defaultChecked={false}
            className="size-4 accent-[var(--accent)]"
          />
          published — visible to students
        </label>
      )}

      <div className="flex items-center gap-3">
        <button type="submit" className="btn btn-solid" disabled={pending}>
          {pending
            ? "> saving..."
            : editing
              ? "> save_challenge"
              : "> create_challenge"}
        </button>
        {onDone ? (
          <button
            type="button"
            className="btn"
            onClick={onDone}
            disabled={pending}
          >
            cancel
          </button>
        ) : null}
      </div>

      <StatusLine status={state.status} message={state.message} />
    </form>
  );
}
