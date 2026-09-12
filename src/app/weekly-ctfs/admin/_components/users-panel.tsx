"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CtfAdminAccount } from "../../../../lib/ctf-admin";
import { setAccountRole, setAccountStatus, type AdminState } from "../actions";

// The panel never receives email or last-sign-in — page.tsx strips them
// before this reaches the client. Only what the console actually needs.
export type AdminAccount = Omit<CtfAdminAccount, "email" | "lastSignInAt">;

const INITIAL: AdminState = { status: "idle", message: null };
const ROLES = ["student", "host", "admin"] as const;
const FIELD_SM =
  "min-w-0 border border-border bg-bg-3 px-2.5 py-1.5 font-mono text-[0.8rem] text-fg outline-none focus:border-accent disabled:opacity-50";

const JOINED_FORMAT: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kolkata",
};

function formatJoined(value: string) {
  return new Intl.DateTimeFormat("en-IN", JOINED_FORMAT).format(new Date(value));
}

type RoleFilter = "all" | AdminAccount["role"];
type StatusFilter = "all" | AdminAccount["status"];

function RoleSelect({
  account,
  disabled,
}: {
  account: AdminAccount;
  disabled: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(account.role);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <select
        value={value}
        disabled={disabled || pending}
        onChange={(event) => {
          const role = event.target.value as AdminAccount["role"];
          const previous = value;
          setValue(role);
          setError(null);
          const formData = new FormData();
          formData.set("accountId", account.id);
          formData.set("role", role);
          startTransition(async () => {
            const result = await setAccountRole(INITIAL, formData);
            if (result.status === "error") {
              setValue(previous);
              setError(result.message ?? "Could not change the role.");
            } else {
              router.refresh();
            }
          });
        }}
        className={FIELD_SM}
        title={disabled ? "You can't change your own role." : undefined}
      >
        {ROLES.map((role) => (
          <option key={role} value={role}>
            {role}
          </option>
        ))}
      </select>
      {error ? (
        <span className="max-w-[12rem] text-right text-[0.64rem] text-[color:var(--danger)]">
          {error}
        </span>
      ) : null}
    </div>
  );
}

function StatusControl({
  account,
  disabled,
}: {
  account: AdminAccount;
  disabled: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const suspending = account.status === "active";
  const confirmText = suspending
    ? `Suspend ${account.username}? They immediately lose access to the CTF until reactivated.`
    : `Reactivate ${account.username}? They regain access immediately.`;

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={disabled || pending}
        title={disabled ? "You can't change your own status." : undefined}
        onClick={() => {
          if (!window.confirm(confirmText)) return;
          setError(null);
          const formData = new FormData();
          formData.set("accountId", account.id);
          formData.set("status", suspending ? "suspended" : "active");
          startTransition(async () => {
            const result = await setAccountStatus(INITIAL, formData);
            if (result.status === "error") {
              setError(result.message ?? "Could not change the status.");
            } else {
              router.refresh();
            }
          });
        }}
        className={`border px-2.5 py-1 text-[0.68rem] uppercase tracking-[0.14em] transition-colors disabled:opacity-50 ${
          suspending
            ? "border-[color:var(--danger)]/50 text-[color:var(--danger)] hover:border-[color:var(--danger)] hover:bg-[color:var(--danger)]/10"
            : "border-accent/50 text-accent hover:border-accent"
        }`}
      >
        {pending ? "..." : suspending ? "suspend" : "reactivate"}
      </button>
      {error ? (
        <span className="max-w-[14rem] text-right text-[0.64rem] text-[color:var(--danger)]">
          {error}
        </span>
      ) : null}
    </div>
  );
}

function AccountRow({
  account,
  isSelf,
}: {
  account: AdminAccount;
  isSelf: boolean;
}) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 border px-3 py-2.5 ${
        account.status === "suspended"
          ? "border-dashed border-border opacity-70"
          : "border-border bg-bg-2"
      }`}
    >
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-[0.88rem] font-bold text-fg">
          {account.username}
          {isSelf ? (
            <span className="border border-border px-1.5 py-0.5 text-[0.6rem] uppercase tracking-[0.14em] text-fg-faint">
              you
            </span>
          ) : null}
          <span
            className={`border px-1.5 py-0.5 text-[0.6rem] uppercase tracking-[0.14em] ${
              account.status === "suspended"
                ? "border-[color:var(--danger)]/50 text-[color:var(--danger)]"
                : "border-border text-fg-faint"
            }`}
          >
            {account.status}
          </span>
        </p>
        {account.displayName && account.displayName !== account.username ? (
          <p className="mt-0.5 text-[0.76rem] text-fg-dim">{account.displayName}</p>
        ) : null}
        <p className="mt-1 text-[0.68rem] uppercase tracking-[0.14em] text-fg-faint">
          joined {formatJoined(account.createdAt)}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <RoleSelect account={account} disabled={isSelf} />
        <StatusControl account={account} disabled={isSelf} />
      </div>
    </div>
  );
}

export default function UsersPanel({
  accounts,
  currentUserId,
}: {
  accounts: AdminAccount[];
  currentUserId: string;
}) {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    return accounts.filter((account) => {
      if (roleFilter !== "all" && account.role !== roleFilter) return false;
      if (statusFilter !== "all" && account.status !== statusFilter) return false;
      if (query) {
        const haystack = `${account.username} ${account.displayName}`.toLowerCase();
        if (!haystack.includes(query.toLowerCase())) return false;
      }
      return true;
    });
  }, [accounts, query, roleFilter, statusFilter]);

  const dirty = query !== "" || roleFilter !== "all" || statusFilter !== "all";
  const suspendedCount = accounts.filter((a) => a.status === "suspended").length;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-[1.25rem] font-bold text-fg md:text-[1.5rem]">
          Users
        </h2>
        <div className="text-[0.72rem] uppercase tracking-[0.16em] text-fg-faint tabular-nums">
          {accounts.length} accounts · {suspendedCount} suspended
        </div>
      </div>

      <div className="flex flex-col gap-2 border border-border bg-bg-2 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="search username..."
            className={`${FIELD_SM} flex-1 basis-56`}
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
            className={FIELD_SM}
          >
            <option value="all">all roles</option>
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className={FIELD_SM}
          >
            <option value="all">any status</option>
            <option value="active">active</option>
            <option value="suspended">suspended</option>
          </select>
          {dirty ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setRoleFilter("all");
                setStatusFilter("all");
              }}
              className="border border-border px-2.5 py-1.5 text-[0.68rem] uppercase tracking-[0.14em] text-fg-dim transition-colors hover:border-accent hover:text-accent"
            >
              clear
            </button>
          ) : null}
        </div>
        {dirty ? (
          <p className="text-[0.72rem] text-fg-faint tabular-nums">
            {filtered.length} / {accounts.length} accounts match
          </p>
        ) : null}
      </div>

      {accounts.length === 0 ? (
        <p className="panel px-4 py-6 text-[0.85rem] text-fg-dim">
          No accounts yet.
        </p>
      ) : filtered.length === 0 ? (
        <p className="panel px-4 py-6 text-[0.85rem] text-fg-dim">
          No accounts match.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((account) => (
            <AccountRow
              key={account.id}
              account={account}
              isSelf={account.id === currentUserId}
            />
          ))}
        </div>
      )}
    </section>
  );
}
