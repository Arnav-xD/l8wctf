"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { recordCtfAudit, requireCtfHost } from "../../../lib/ctf-host";

export type AdminState = {
  status: "idle" | "error" | "success";
  message: string | null;
};

const CATEGORIES = new Set([
  "web",
  "pwn",
  "rev",
  "crypto",
  "forensics",
  "stego",
  "osint",
  "net",
  "misc",
]);
const DIFFICULTIES = new Set(["beginner", "easy", "medium", "hard"]);

function success(message: string): AdminState {
  return { status: "success", message };
}

function failure(error: unknown, fallback: string): AdminState {
  return {
    status: "error",
    message: error instanceof Error ? error.message : fallback,
  };
}

function required(formData: FormData, field: string) {
  const value = String(formData.get(field) ?? "").trim();
  if (!value) throw new Error(`Missing ${field}.`);
  return value;
}

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  if (!slug) throw new Error("Enter a title that can produce a valid slug.");
  return slug;
}

function istLocalToIso(value: string) {
  const parsed = new Date(`${value}:00+05:30`);
  if (Number.isNaN(parsed.getTime())) throw new Error("Enter a valid date and time.");
  return parsed.toISOString();
}

function refreshCtfPages() {
  revalidatePath("/weekly-ctfs");
  revalidatePath("/weekly-ctfs/admin");
}

export async function createWeek(
  _state: AdminState,
  formData: FormData,
): Promise<AdminState> {
  try {
    const { admin, userId } = await requireCtfHost();
    const title = required(formData, "title");
    const summary = required(formData, "summary");
    const sequenceNo = Number(formData.get("sequenceNo"));
    const startsAt = istLocalToIso(required(formData, "startsAt"));
    const endsAt = istLocalToIso(required(formData, "endsAt"));
    if (!Number.isInteger(sequenceNo) || sequenceNo < 1) {
      throw new Error("The week number must be a positive integer.");
    }
    if (new Date(endsAt) <= new Date(startsAt)) {
      throw new Error("The closing time must be after the opening time.");
    }

    const { data, error } = await admin
      .from("ctf_weeks")
      .insert({
        title,
        slug: slugify(title),
        summary,
        sequence_no: sequenceNo,
        starts_at: startsAt,
        ends_at: endsAt,
        published: formData.get("published") === "on",
        created_by: userId,
      })
      .select("id")
      .single();
    if (error) throw error;

    await recordCtfAudit(admin, {
      actorId: userId,
      action: "week.created",
      entityType: "week",
      entityId: data.id,
      details: { sequenceNo },
    });
    refreshCtfPages();
    return success("Operation created.");
  } catch (error) {
    return failure(error, "Could not create the operation.");
  }
}

export async function updateWeek(
  _state: AdminState,
  formData: FormData,
): Promise<AdminState> {
  try {
    const { admin, userId } = await requireCtfHost();
    const id = required(formData, "weekId");
    const title = required(formData, "title");
    const sequenceNo = Number(formData.get("sequenceNo"));
    const startsAt = istLocalToIso(required(formData, "startsAt"));
    const endsAt = istLocalToIso(required(formData, "endsAt"));
    if (!Number.isInteger(sequenceNo) || sequenceNo < 1) {
      throw new Error("The week number must be a positive integer.");
    }
    if (new Date(endsAt) <= new Date(startsAt)) {
      throw new Error("The closing time must be after the opening time.");
    }

    const { error } = await admin
      .from("ctf_weeks")
      .update({
        title,
        slug: slugify(title),
        summary: required(formData, "summary"),
        sequence_no: sequenceNo,
        starts_at: startsAt,
        ends_at: endsAt,
        published: formData.get("published") === "on",
      })
      .eq("id", id);
    if (error) throw error;

    await recordCtfAudit(admin, {
      actorId: userId,
      action: "week.updated",
      entityType: "week",
      entityId: id,
    });
    refreshCtfPages();
    return success("Operation updated.");
  } catch (error) {
    return failure(error, "Could not update the operation.");
  }
}

// Publish flips touch only the `published` column so a stale form from one
// host can't overwrite fresher edits made by another.
export async function setWeekPublished(
  _state: AdminState,
  formData: FormData,
): Promise<AdminState> {
  try {
    const { admin, userId } = await requireCtfHost();
    const id = required(formData, "weekId");
    const published = formData.get("published") === "on";

    const { error } = await admin
      .from("ctf_weeks")
      .update({ published })
      .eq("id", id);
    if (error) throw error;

    await recordCtfAudit(admin, {
      actorId: userId,
      action: published ? "week.published" : "week.unpublished",
      entityType: "week",
      entityId: id,
    });
    refreshCtfPages();
    return success(published ? "Operation published." : "Operation hidden.");
  } catch (error) {
    return failure(error, "Could not change the publish state.");
  }
}

export async function deleteWeek(formData: FormData): Promise<void> {
  const { admin, userId } = await requireCtfHost();
  const id = required(formData, "weekId");
  const { data: attachments, error: attachmentError } = await admin
    .from("ctf_challenges")
    .select("attachment_path")
    .eq("week_id", id)
    .not("attachment_path", "is", null);
  if (attachmentError) throw attachmentError;

  const { error } = await admin.from("ctf_weeks").delete().eq("id", id);
  if (error) throw error;

  const paths = (attachments ?? []).flatMap((item) =>
    item.attachment_path ? [item.attachment_path] : [],
  );
  if (paths.length) await admin.storage.from("ctf-files").remove(paths);
  await recordCtfAudit(admin, {
    actorId: userId,
    action: "week.deleted",
    entityType: "week",
    entityId: id,
    details: { removedAttachments: paths.length },
  });
  refreshCtfPages();
}

function challengeFields(formData: FormData) {
  const title = required(formData, "title");
  const category = required(formData, "category");
  const difficulty = required(formData, "difficulty");
  const points = Number(formData.get("points"));
  if (!CATEGORIES.has(category)) throw new Error("Invalid challenge category.");
  if (!DIFFICULTIES.has(difficulty)) throw new Error("Invalid difficulty.");
  if (!Number.isInteger(points) || points < 10 || points > 1000) {
    throw new Error("Points must be an integer between 10 and 1000.");
  }

  return {
    title,
    slug: slugify(title),
    category,
    difficulty,
    points,
    summary: required(formData, "summary"),
    description: required(formData, "description"),
    connection_info: String(formData.get("connectionInfo") ?? "").trim() || null,
    published: formData.get("published") === "on",
  };
}

export async function createChallenge(
  _state: AdminState,
  formData: FormData,
): Promise<AdminState> {
  try {
    const { admin, userId } = await requireCtfHost();
    const weekId = required(formData, "weekId");
    const flag = required(formData, "flag");
    if (flag.length > 512) throw new Error("The flag is unexpectedly long.");

    const { data: challenge, error } = await admin
      .from("ctf_challenges")
      .insert({
        week_id: weekId,
        ...challengeFields(formData),
        created_by: userId,
      })
      .select("id")
      .single();
    if (error) throw error;

    const flagHash = createHash("sha256").update(flag.trim()).digest("hex");
    const { error: secretError } = await admin
      .from("ctf_challenge_secrets")
      .insert({ challenge_id: challenge.id, flag_hash: flagHash });
    if (secretError) {
      await admin.from("ctf_challenges").delete().eq("id", challenge.id);
      throw secretError;
    }

    await recordCtfAudit(admin, {
      actorId: userId,
      action: "challenge.created",
      entityType: "challenge",
      entityId: challenge.id,
      details: { weekId },
    });
    refreshCtfPages();
    return success("Challenge and server-side flag hash created.");
  } catch (error) {
    return failure(error, "Could not create the challenge.");
  }
}

export async function updateChallenge(
  _state: AdminState,
  formData: FormData,
): Promise<AdminState> {
  try {
    const { admin, userId } = await requireCtfHost();
    const id = required(formData, "challengeId");
    const weekId = required(formData, "weekId");
    const { error } = await admin
      .from("ctf_challenges")
      .update({ week_id: weekId, ...challengeFields(formData) })
      .eq("id", id);
    if (error) throw error;

    const replacementFlag = String(formData.get("flag") ?? "").trim();
    if (replacementFlag) {
      if (replacementFlag.length > 512) throw new Error("The flag is unexpectedly long.");
      const flagHash = createHash("sha256").update(replacementFlag).digest("hex");
      const { error: secretError } = await admin
        .from("ctf_challenge_secrets")
        .upsert({ challenge_id: id, flag_hash: flagHash });
      if (secretError) throw secretError;
    }

    await recordCtfAudit(admin, {
      actorId: userId,
      action: "challenge.updated",
      entityType: "challenge",
      entityId: id,
      details: { weekId, flagChanged: Boolean(replacementFlag) },
    });
    refreshCtfPages();
    return success("Challenge updated.");
  } catch (error) {
    return failure(error, "Could not update the challenge.");
  }
}

export async function setChallengePublished(
  _state: AdminState,
  formData: FormData,
): Promise<AdminState> {
  try {
    const { admin, userId } = await requireCtfHost();
    const id = required(formData, "challengeId");
    const published = formData.get("published") === "on";

    const { error } = await admin
      .from("ctf_challenges")
      .update({ published })
      .eq("id", id);
    if (error) throw error;

    await recordCtfAudit(admin, {
      actorId: userId,
      action: published ? "challenge.published" : "challenge.unpublished",
      entityType: "challenge",
      entityId: id,
    });
    refreshCtfPages();
    return success(published ? "Challenge published." : "Challenge hidden.");
  } catch (error) {
    return failure(error, "Could not change the publish state.");
  }
}

export async function deleteChallenge(formData: FormData): Promise<void> {
  const { admin, userId } = await requireCtfHost();
  const id = required(formData, "challengeId");
  const { data: challenge, error: readError } = await admin
    .from("ctf_challenges")
    .select("attachment_path")
    .eq("id", id)
    .maybeSingle();
  if (readError) throw readError;

  const { error } = await admin.from("ctf_challenges").delete().eq("id", id);
  if (error) throw error;
  if (challenge?.attachment_path) {
    await admin.storage.from("ctf-files").remove([challenge.attachment_path]);
  }

  await recordCtfAudit(admin, {
    actorId: userId,
    action: "challenge.deleted",
    entityType: "challenge",
    entityId: id,
  });
  refreshCtfPages();
}

export async function attachChallengeFile(
  _state: AdminState,
  formData: FormData,
): Promise<AdminState> {
  try {
    const { admin, userId } = await requireCtfHost();
    const challengeId = required(formData, "challengeId");
    const path = required(formData, "attachmentPath");
    if (!path.split("/").includes(challengeId) || path.includes("..")) {
      throw new Error("Invalid challenge attachment path.");
    }

    const slash = path.lastIndexOf("/");
    const folder = path.slice(0, slash);
    const fileName = path.slice(slash + 1);
    const { data: objects, error: storageError } = await admin.storage
      .from("ctf-files")
      .list(folder, { search: fileName, limit: 10 });
    if (storageError || !objects?.some((object) => object.name === fileName)) {
      throw new Error("Upload the file before attaching it to the challenge.");
    }

    const { data: current, error: readError } = await admin
      .from("ctf_challenges")
      .select("attachment_path")
      .eq("id", challengeId)
      .maybeSingle();
    if (readError) throw readError;
    const previousPath = current?.attachment_path ?? null;

    const { error } = await admin
      .from("ctf_challenges")
      .update({ attachment_path: path })
      .eq("id", challengeId);
    if (error) throw error;

    // The row now points at the new object, so the file it replaced is
    // unreferenced — remove it rather than leave it consuming storage. A
    // failure here must not fail the attach, which already succeeded.
    let replacedPrevious = false;
    if (previousPath && previousPath !== path) {
      const { error: removeError } = await admin.storage
        .from("ctf-files")
        .remove([previousPath]);
      if (removeError) {
        console.error(
          "Could not delete the replaced attachment",
          removeError.message,
        );
      } else {
        replacedPrevious = true;
      }
    }

    await recordCtfAudit(admin, {
      actorId: userId,
      action: "attachment.attached",
      entityType: "attachment",
      entityId: challengeId,
      details: { path, previousPath, replacedPrevious },
    });
    refreshCtfPages();
    return success(
      replacedPrevious ? "Challenge file replaced." : "Challenge file attached.",
    );
  } catch (error) {
    return failure(error, "Could not attach the challenge file.");
  }
}

export async function removeChallengeAttachment(formData: FormData): Promise<void> {
  const { admin, userId } = await requireCtfHost();
  const challengeId = required(formData, "challengeId");
  const { data: challenge, error: readError } = await admin
    .from("ctf_challenges")
    .select("attachment_path")
    .eq("id", challengeId)
    .maybeSingle();
  if (readError) throw readError;
  if (!challenge?.attachment_path) return;

  const { error: storageError } = await admin.storage
    .from("ctf-files")
    .remove([challenge.attachment_path]);
  if (storageError) throw storageError;

  const { error } = await admin
    .from("ctf_challenges")
    .update({ attachment_path: null })
    .eq("id", challengeId);
  if (error) throw error;

  await recordCtfAudit(admin, {
    actorId: userId,
    action: "attachment.removed",
    entityType: "attachment",
    entityId: challengeId,
    details: { path: challenge.attachment_path },
  });
  refreshCtfPages();
}
