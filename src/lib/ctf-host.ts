import "server-only";
import { createAdminClient } from "./supabase/admin";
import { isSupabaseConfigured } from "./supabase/config";
import { createClient } from "./supabase/server";

export async function requireCtfHost() {
  if (!isSupabaseConfigured()) throw new Error("Supabase is not configured.");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Sign in as a host first.");

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("ctf_profiles")
    .select("role,account_status")
    .eq("id", data.user.id)
    .maybeSingle();

  if (
    profileError ||
    !profile ||
    profile.account_status !== "active" ||
    !["host", "admin"].includes(profile.role)
  ) {
    throw new Error("Host access required.");
  }

  return {
    admin,
    userId: data.user.id,
    role: profile.role as "host" | "admin",
  };
}

export async function recordCtfAudit(
  admin: ReturnType<typeof createAdminClient>,
  entry: {
    actorId: string;
    action: string;
    entityType: "week" | "challenge" | "attachment" | "account";
    entityId?: string | null;
    details?: Record<string, unknown>;
  },
) {
  const { error } = await admin.from("ctf_audit_log").insert({
    actor_id: entry.actorId,
    action: entry.action,
    entity_type: entry.entityType,
    entity_id: entry.entityId ?? null,
    details: entry.details ?? {},
  });

  if (error) console.error("Could not write CTF audit event", error.message);
}
