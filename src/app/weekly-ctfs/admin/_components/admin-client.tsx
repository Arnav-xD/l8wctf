"use client";

import { useMemo, useState } from "react";
import type {
  CtfAdminChallenge,
  CtfAdminWeek,
} from "../../../../lib/ctf-admin";
import {
  deleteChallenge,
  deleteWeek,
  updateChallenge,
  updateWeek,
} from "../actions";
import AttachmentManager from "./attachment-manager";
import ChallengeForm from "./challenge-form";
import DangerButton from "./danger-button";
import PublishToggle from "./publish-toggle";
import WeekForm from "./week-form";
import { isoToIstLocal } from "./form-kit";

const WINDOW_FORMAT: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Kolkata",
};

function formatWindow(startsAt: string, endsAt: string) {
  const fmt = (value: string) =>
    new Intl.DateTimeFormat("en-IN", WINDOW_FORMAT).format(new Date(value));
  return `${fmt(startsAt)} → ${fmt(endsAt)} IST`;
}

// ---- live status of an operation window --------------------------------------

type WeekPhase = "live" | "upcoming" | "closed";

function weekPhase(week: CtfAdminWeek, at = Date.now()): WeekPhase {
  const start = new Date(week.startsAt).getTime();
  const end = new Date(week.endsAt).getTime();
  if (at < start) return "upcoming";
  if (at > end) return "closed";
  return "live";
}

const PHASE_STYLE: Record<WeekPhase, string> = {
  live: "border-accent/60 text-accent",
  upcoming: "border-border text-fg-dim",
  closed: "border-border text-fg-faint",
};

function PhasePill({ phase, published }: { phase: WeekPhase; published: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={`inline-flex items-center gap-1.5 border px-2 py-0.5 text-[0.62rem] uppercase tracking-[0.16em] ${PHASE_STYLE[phase]}`}
      >
        {phase === "live" ? (
          <span className="size-1.5 animate-pulse rounded-full bg-accent" />
        ) : null}
        {phase}
      </span>
      {!published ? (
        <span className="border border-border px-2 py-0.5 text-[0.62rem] uppercase tracking-[0.16em] text-fg-faint">
          hidden
        </span>
      ) : null}
    </span>
  );
}

// ---- category + difficulty coding -------------------------------------------

const CATEGORY_HUE: Record<string, number> = {
  web: 210,
  pwn: 2,
  rev: 275,
  crypto: 45,
  forensics: 158,
  stego: 322,
  osint: 190,
  net: 104,
  misc: 235,
};

function CategoryChip({ category }: { category: string }) {
  const hue = CATEGORY_HUE[category] ?? 235;
  return (
    <span
      className="border px-1.5 py-0.5 text-[0.64rem] font-normal uppercase tracking-[0.14em]"
      style={{
        borderColor: `hsl(${hue} 68% 58% / 0.45)`,
        color: `hsl(${hue} 70% 74%)`,
        background: `hsl(${hue} 68% 58% / 0.08)`,
      }}
    >
      {category}
    </span>
  );
}

const DIFFICULTY_DOT: Record<string, string> = {
  beginner: "hsl(150 58% 58%)",
  easy: "hsl(200 72% 62%)",
  medium: "hsl(40 82% 60%)",
  hard: "hsl(2 76% 66%)",
};

function DifficultyBadge({ value }: { value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[0.66rem] uppercase tracking-[0.14em] text-fg-faint">
      <span
        className="size-2 rounded-full"
        style={{ background: DIFFICULTY_DOT[value] ?? "var(--fg-faint)" }}
      />
      {value}
    </span>
  );
}

// ---- copy-to-clipboard -----------------------------------------------------

function CopyButton({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      title={`copy ${label}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1200);
        } catch {
          /* clipboard blocked — ignore */
        }
      }}
      className="border border-border px-2 py-0.5 text-[0.64rem] uppercase tracking-[0.14em] text-fg-faint transition-colors hover:border-accent hover:text-accent"
    >
      {done ? "copied" : label}
    </button>
  );
}

// ---- stat tiles ----------------------------------------------------------

function StatTiles({
  weeks,
  challenges,
}: {
  weeks: CtfAdminWeek[];
  challenges: CtfAdminChallenge[];
}) {
  const live = weeks.filter((w) => weekPhase(w) === "live").length;
  const publishedChallenges = challenges.filter((c) => c.published).length;
  const drafts = challenges.length - publishedChallenges;
  const pointPool = challenges
    .filter((c) => c.published)
    .reduce((sum, c) => sum + c.points, 0);

  const tiles: { label: string; value: number | string; accent?: boolean }[] = [
    { label: "operations", value: weeks.length },
    { label: "live now", value: live, accent: live > 0 },
    { label: "challenges", value: challenges.length },
    { label: "published", value: publishedChallenges },
    { label: "drafts", value: drafts },
    { label: "point pool", value: pointPool },
  ];

  return (
    <div className="grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-3 lg:grid-cols-6">
      {tiles.map((tile) => (
        <div key={tile.label} className="bg-bg-2 px-3.5 py-3">
          <p
            className={`font-display text-[1.4rem] font-bold leading-none tabular-nums ${
              tile.accent ? "text-accent glow" : "text-fg"
            }`}
          >
            {tile.value}
          </p>
          <p className="mt-1.5 text-[0.62rem] uppercase tracking-[0.18em] text-fg-faint">
            {tile.label}
          </p>
        </div>
      ))}
    </div>
  );
}

// ---- filter bar -----------------------------------------------------------

type StatusFilter = "all" | "published" | "draft";

const CATEGORY_OPTIONS = Object.keys(CATEGORY_HUE);
const FIELD_SM =
  "min-w-0 border border-border bg-bg-3 px-2.5 py-1.5 font-mono text-[0.8rem] text-fg outline-none focus:border-accent";

function FilterBar({
  query,
  setQuery,
  category,
  setCategory,
  status,
  setStatus,
  matches,
  total,
  onClear,
}: {
  query: string;
  setQuery: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  status: StatusFilter;
  setStatus: (v: StatusFilter) => void;
  matches: number;
  total: number;
  onClear: () => void;
}) {
  const dirty = query !== "" || category !== "all" || status !== "all";
  return (
    <div className="flex flex-col gap-2 border border-border bg-bg-2 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="search title, slug, summary..."
          className={`${FIELD_SM} flex-1 basis-56`}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={FIELD_SM}
        >
          <option value="all">all categories</option>
          {CATEGORY_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
          className={FIELD_SM}
        >
          <option value="all">any status</option>
          <option value="published">published</option>
          <option value="draft">draft</option>
        </select>
        {dirty ? (
          <button
            type="button"
            onClick={onClear}
            className="border border-border px-2.5 py-1.5 text-[0.68rem] uppercase tracking-[0.14em] text-fg-dim transition-colors hover:border-accent hover:text-accent"
          >
            clear
          </button>
        ) : null}
      </div>
      {dirty ? (
        <p className="text-[0.72rem] text-fg-faint tabular-nums">
          {matches} / {total} challenges match
        </p>
      ) : null}
    </div>
  );
}

// ---- shared classes ----------------------------------------------------

function challengeMatches(
  challenge: CtfAdminChallenge,
  query: string,
  category: string,
  status: StatusFilter,
) {
  if (category !== "all" && challenge.category !== category) return false;
  if (status === "published" && !challenge.published) return false;
  if (status === "draft" && challenge.published) return false;
  if (query) {
    const haystack =
      `${challenge.title} ${challenge.slug} ${challenge.summary} ${challenge.category}`.toLowerCase();
    if (!haystack.includes(query.toLowerCase())) return false;
  }
  return true;
}

function weekFields(week: CtfAdminWeek): Record<string, string> {
  return {
    weekId: week.id,
    title: week.title,
    summary: week.summary,
    sequenceNo: String(week.sequenceNo),
    startsAt: isoToIstLocal(week.startsAt),
    endsAt: isoToIstLocal(week.endsAt),
  };
}

function challengeFields(challenge: CtfAdminChallenge): Record<string, string> {
  return {
    challengeId: challenge.id,
    weekId: challenge.weekId,
    title: challenge.title,
    category: challenge.category,
    difficulty: challenge.difficulty,
    points: String(challenge.points),
    summary: challenge.summary,
    description: challenge.description,
    connectionInfo: challenge.connectionInfo ?? "",
  };
}

const SECTION_HEAD =
  "font-display text-[1.25rem] font-bold text-fg md:text-[1.5rem]";
const PANEL_INNER = "border border-border bg-bg-2 p-4 md:p-5";

export default function AdminClient({
  role,
  weeks,
  challenges,
}: {
  role: "host" | "admin";
  weeks: CtfAdminWeek[];
  challenges: CtfAdminChallenge[];
}) {
  const [newWeekOpen, setNewWeekOpen] = useState(false);
  const [editingWeek, setEditingWeek] = useState<string | null>(null);
  const [newChallengeFor, setNewChallengeFor] = useState<string | null>(null);
  const [editingChallenge, setEditingChallenge] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const filtering = query !== "" || category !== "all" || status !== "all";

  const challengesByWeek = useMemo(() => {
    const map = new Map<string, CtfAdminChallenge[]>();
    for (const challenge of challenges) {
      const list = map.get(challenge.weekId) ?? [];
      list.push(challenge);
      map.set(challenge.weekId, list);
    }
    return map;
  }, [challenges]);

  const matchCount = useMemo(
    () =>
      challenges.filter((c) => challengeMatches(c, query, category, status))
        .length,
    [challenges, query, category, status],
  );

  const orphans = challenges.filter(
    (challenge) => !weeks.some((week) => week.id === challenge.weekId),
  );

  const clearFilters = () => {
    setQuery("");
    setCategory("all");
    setStatus("all");
  };

  const toggleCollapsed = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allCollapsed = weeks.length > 0 && collapsed.size >= weeks.length;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[0.78rem] text-fg-dim">
          <span className="text-fg-faint">signed in as </span>
          <span className="tag">{role}</span>
        </p>
        <div className="text-[0.72rem] uppercase tracking-[0.16em] text-fg-faint tabular-nums">
          {weeks.length} operations · {challenges.length} challenges
        </div>
      </div>

      <StatTiles weeks={weeks} challenges={challenges} />

      {/* ---- operations ---- */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className={SECTION_HEAD}>Operations</h2>
          <div className="flex items-center gap-2">
            {weeks.length > 1 ? (
              <button
                type="button"
                className="border border-border px-2.5 py-1 text-[0.68rem] uppercase tracking-[0.14em] text-fg-dim transition-colors hover:border-accent hover:text-accent"
                onClick={() =>
                  setCollapsed(
                    allCollapsed ? new Set() : new Set(weeks.map((w) => w.id)),
                  )
                }
              >
                {allCollapsed ? "expand all" : "collapse all"}
              </button>
            ) : null}
            {!newWeekOpen ? (
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setNewWeekOpen(true);
                  setEditingWeek(null);
                }}
              >
                {"> new_operation"}
              </button>
            ) : null}
          </div>
        </div>

        {challenges.length > 0 ? (
          <FilterBar
            query={query}
            setQuery={setQuery}
            category={category}
            setCategory={setCategory}
            status={status}
            setStatus={setStatus}
            matches={matchCount}
            total={challenges.length}
            onClear={clearFilters}
          />
        ) : null}

        {newWeekOpen ? (
          <div className={PANEL_INNER}>
            <WeekForm onDone={() => setNewWeekOpen(false)} />
          </div>
        ) : null}

        {weeks.length === 0 && !newWeekOpen ? (
          <p className="panel px-4 py-6 text-[0.85rem] text-fg-dim">
            No operations yet. Create one to hang challenges off it.
          </p>
        ) : null}

        {weeks.map((week) => {
          const all = challengesByWeek.get(week.id) ?? [];
          const list = filtering
            ? all.filter((c) => challengeMatches(c, query, category, status))
            : all;
          if (filtering && list.length === 0) return null;

          const isEditing = editingWeek === week.id;
          const isCollapsed = !filtering && collapsed.has(week.id);
          const phase = weekPhase(week);
          const points = all
            .filter((c) => c.published)
            .reduce((sum, c) => sum + c.points, 0);
          const livePub = all.filter((c) => c.published).length;

          return (
            <div
              key={week.id}
              className={`panel flex flex-col ${
                phase === "live"
                  ? "border-l-2 border-l-accent/70"
                  : week.published
                    ? ""
                    : "opacity-80"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => toggleCollapsed(week.id)}
                      disabled={filtering}
                      className="text-fg-faint transition-colors hover:text-accent disabled:opacity-40"
                      title={isCollapsed ? "expand" : "collapse"}
                    >
                      {isCollapsed ? "▸" : "▾"}
                    </button>
                    <p className="font-display text-[1rem] font-bold text-fg">
                      <span className="text-fg-faint">
                        #{week.sequenceNo.toString().padStart(2, "0")}{" "}
                      </span>
                      {week.title}
                    </p>
                    <PhasePill phase={phase} published={week.published} />
                  </div>
                  <p className="mt-1 text-[0.72rem] uppercase tracking-[0.14em] text-fg-faint">
                    {formatWindow(week.startsAt, week.endsAt)}
                    <span className="mx-2 text-border">|</span>
                    <span className="tabular-nums">
                      {livePub}/{all.length} live · {points} pts
                    </span>
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <PublishToggle
                    action={updateWeek}
                    fields={weekFields(week)}
                    published={week.published}
                  />
                  <button
                    type="button"
                    className="border border-border px-2.5 py-1 text-[0.68rem] uppercase tracking-[0.14em] text-fg-dim transition-colors hover:border-accent hover:text-accent"
                    onClick={() => setEditingWeek(isEditing ? null : week.id)}
                  >
                    {isEditing ? "close" : "edit"}
                  </button>
                  <DangerButton
                    action={deleteWeek}
                    fields={{ weekId: week.id }}
                    confirm={`Delete operation "${week.title}" and all ${all.length} of its challenges? This cannot be undone.`}
                  >
                    delete
                  </DangerButton>
                </div>
              </div>

              {isEditing ? (
                <div className="border-b border-border px-4 py-4">
                  <WeekForm week={week} onDone={() => setEditingWeek(null)} />
                </div>
              ) : null}

              {isCollapsed ? null : (
                <div className="flex flex-col gap-3 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-[0.7rem] uppercase tracking-[0.18em] text-fg-faint">
                      challenges · {list.length}
                      {filtering && list.length !== all.length ? (
                        <span className="text-fg-faint"> of {all.length}</span>
                      ) : null}
                    </h3>
                    {newChallengeFor === week.id ? null : (
                      <button
                        type="button"
                        className="text-[0.72rem] uppercase tracking-[0.14em] text-accent hover:underline"
                        onClick={() => {
                          setNewChallengeFor(week.id);
                          setEditingChallenge(null);
                        }}
                      >
                        + add challenge
                      </button>
                    )}
                  </div>

                  {newChallengeFor === week.id ? (
                    <div className={PANEL_INNER}>
                      <ChallengeForm
                        weeks={weeks}
                        defaultWeekId={week.id}
                        onDone={() => setNewChallengeFor(null)}
                      />
                    </div>
                  ) : null}

                  {list.length === 0 && newChallengeFor !== week.id ? (
                    <p className="text-[0.8rem] text-fg-dim">Nothing here yet.</p>
                  ) : null}

                  {list.map((challenge) => (
                    <ChallengeRow
                      key={challenge.id}
                      challenge={challenge}
                      weeks={weeks}
                      editing={editingChallenge === challenge.id}
                      onToggleEdit={() =>
                        setEditingChallenge(
                          editingChallenge === challenge.id
                            ? null
                            : challenge.id,
                        )
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </section>

      {orphans.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className={SECTION_HEAD}>Unlinked challenges</h2>
          <p className="text-[0.8rem] text-fg-dim">
            Their operation was removed. Reassign or delete them.
          </p>
          {orphans.map((challenge) => (
            <ChallengeRow
              key={challenge.id}
              challenge={challenge}
              weeks={weeks}
              editing={editingChallenge === challenge.id}
              onToggleEdit={() =>
                setEditingChallenge(
                  editingChallenge === challenge.id ? null : challenge.id,
                )
              }
            />
          ))}
        </section>
      ) : null}
    </div>
  );
}

function ChallengeRow({
  challenge,
  weeks,
  editing,
  onToggleEdit,
}: {
  challenge: CtfAdminChallenge;
  weeks: CtfAdminWeek[];
  editing: boolean;
  onToggleEdit: () => void;
}) {
  return (
    <div
      className={`border bg-bg-2 transition-colors ${
        challenge.published
          ? "border-border"
          : "border-dashed border-border opacity-70"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 px-3 py-2.5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[0.88rem] font-bold text-fg">{challenge.title}</p>
            <CategoryChip category={challenge.category} />
            <DifficultyBadge value={challenge.difficulty} />
            <span className="text-[0.7rem] uppercase tracking-[0.14em] text-fg-faint tabular-nums">
              {challenge.points}p
            </span>
            {challenge.attachmentPath ? (
              <span
                className="text-[0.7rem] text-fg-faint"
                title={challenge.attachmentPath}
              >
                ⧉ file
              </span>
            ) : null}
          </div>
          <p className="mt-1 truncate text-[0.76rem] text-fg-dim">
            {challenge.summary}
          </p>
          <p className="mt-1 font-mono text-[0.68rem] text-fg-faint">
            {challenge.slug}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CopyButton value={challenge.slug} label="slug" />
          <PublishToggle
            action={updateChallenge}
            fields={challengeFields(challenge)}
            published={challenge.published}
          />
          <button
            type="button"
            className="border border-border px-2.5 py-1 text-[0.68rem] uppercase tracking-[0.14em] text-fg-dim transition-colors hover:border-accent hover:text-accent"
            onClick={onToggleEdit}
          >
            {editing ? "close" : "edit"}
          </button>
          <DangerButton
            action={deleteChallenge}
            fields={{ challengeId: challenge.id }}
            confirm={`Delete challenge "${challenge.title}"? This cannot be undone.`}
          >
            delete
          </DangerButton>
        </div>
      </div>

      {editing ? (
        <div className="flex flex-col gap-4 border-t border-border px-3 py-4">
          <ChallengeForm
            weeks={weeks}
            challenge={challenge}
            onDone={onToggleEdit}
          />
          <AttachmentManager
            challengeId={challenge.id}
            attachmentPath={challenge.attachmentPath}
          />
        </div>
      ) : null}
    </div>
  );
}
