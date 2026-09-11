import { createClient } from "@supabase/supabase-js";

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, ...value] = arg.replace(/^--/, "").split("=");
    return [key, value.join("=")];
  }),
);

const email = (args.email ?? "").trim().toLowerCase();
const password = process.env.CTF_INITIAL_PASSWORD;
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  throw new Error("Usage: npm run ctf:reset-password -- --email=user@example.com");
}
if (!url || !serviceKey || !password || password.length < 10) {
  throw new Error(
    "Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and CTF_INITIAL_PASSWORD (10+ characters).",
  );
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
let page = 1;
let user;
do {
  const { data, error: listError } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
  if (listError) throw listError;
  user = data.users.find((candidate) => candidate.email?.toLowerCase() === email);
  if (user || data.users.length < 1000) break;
  page += 1;
} while (!user);
if (!user) throw new Error(`No CTF account exists for ${email}.`);

const { error } = await supabase.auth.admin.updateUserById(user.id, {
  password,
});
if (error) throw error;

await supabase.from("ctf_audit_log").insert({
  actor_id: null,
  action: "account.password_reset_by_script",
  entity_type: "account",
  entity_id: user.id,
  details: { email },
});

console.log(`Reset the emergency password for ${email}.`);
