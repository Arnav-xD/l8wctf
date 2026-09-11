import { createClient } from "@supabase/supabase-js";

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, ...value] = arg.replace(/^--/, "").split("=");
    return [key, value.join("=")];
  }),
);

const email = (args.email ?? "").trim().toLowerCase();
const displayName = (args.name ?? "").trim();
const username = (args.username ?? "").trim().toLowerCase();
const role = args.role ?? "student";
const password = process.env.CTF_INITIAL_PASSWORD;
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !displayName || !/^[a-z0-9_-]{3,24}$/.test(username)) {
  throw new Error("Usage: npm run ctf:provision-user -- --email=host@example.com --name=\"Host Name\" --username=alias [--role=host|admin]");
}
if (!url || !serviceKey || !password || password.length < 10) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and CTF_INITIAL_PASSWORD (10+ characters).");
}
if (!["student", "host", "admin"].includes(role)) throw new Error("Invalid role.");

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { username },
});
if (error) throw error;

const { error: profileError } = await supabase.from("ctf_profiles").update({
  display_name: displayName,
  role,
  account_status: "active",
}).eq("id", data.user.id);
if (profileError) {
  await supabase.auth.admin.deleteUser(data.user.id);
  throw profileError;
}

await supabase.from("ctf_audit_log").insert({
  actor_id: null,
  action: "account.provisioned_by_script",
  entity_type: "account",
  entity_id: data.user.id,
  details: { email, username, role },
});

console.log(`Provisioned ${email} (${username}) as ${role}.`);
