"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { CtfAdminWeek } from "../../../../lib/ctf-admin";
import {
  createWeek,
  updateWeek,
  type AdminState,
} from "../actions";
import { Field, FIELD, StatusLine, isoToIstLocal } from "./form-kit";

const INITIAL: AdminState = { status: "idle", message: null };

export default function WeekForm({
  week,
  onDone,
}: {
  week?: CtfAdminWeek;
  onDone?: () => void;
}) {
  const editing = week != null;
  const [state, formAction, pending] = useActionState(
    editing ? updateWeek : createWeek,
    INITIAL,
  );
  const router = useRouter();

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
      onDone?.();
    }
  }, [state, router, onDone]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {editing ? (
        <input type="hidden" name="weekId" value={week.id} />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
        <Field label="title">
          <input
            name="title"
            required
            maxLength={120}
            defaultValue={week?.title}
            className={FIELD}
          />
        </Field>
        <Field label="week no.">
          <input
            name="sequenceNo"
            type="number"
            min={1}
            step={1}
            required
            defaultValue={week?.sequenceNo}
            className={FIELD}
          />
        </Field>
      </div>

      <Field label="summary">
        <textarea
          name="summary"
          required
          rows={2}
          maxLength={400}
          defaultValue={week?.summary}
          className={FIELD}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="opens (IST)">
          <input
            name="startsAt"
            type="datetime-local"
            required
            defaultValue={week ? isoToIstLocal(week.startsAt) : undefined}
            className={FIELD}
          />
        </Field>
        <Field label="closes (IST)">
          <input
            name="endsAt"
            type="datetime-local"
            required
            defaultValue={week ? isoToIstLocal(week.endsAt) : undefined}
            className={FIELD}
          />
        </Field>
      </div>

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
              ? "> save_operation"
              : "> create_operation"}
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
