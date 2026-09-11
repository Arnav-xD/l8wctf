import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error(
    "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this check.",
  );
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const checks = [
  ["profiles table", () => supabase.from("ctf_profiles").select("id,username,account_status", { count: "exact", head: true })],
  ["weeks table", () => supabase.from("ctf_weeks").select("id", { count: "exact", head: true })],
  ["challenges table", () => supabase.from("ctf_challenges").select("id", { count: "exact", head: true })],
  ["submissions table", () => supabase.from("ctf_submissions").select("id", { count: "exact", head: true })],
  ["solves table", () => supabase.from("ctf_solves").select("user_id", { count: "exact", head: true })],
  ["audit table", () => supabase.from("ctf_audit_log").select("id", { count: "exact", head: true })],
  ["leaderboard function", () => supabase.rpc("ctf_leaderboard", { limit_count: 1 })],
];

let failed = false;
for (const [label, run] of checks) {
  const { error } = await run();
  if (error) {
    failed = true;
    console.error(`FAIL  ${label}: ${error.message}`);
  } else {
    console.log(`PASS  ${label}`);
  }
}

const { data: bucket, error: bucketError } = await supabase.storage.getBucket("ctf-files");
if (bucketError || !bucket) {
  failed = true;
  console.error(`FAIL  private storage bucket: ${bucketError?.message ?? "bucket not found"}`);
} else if (bucket.public) {
  failed = true;
  console.error("FAIL  private storage bucket: ctf-files is public");
} else {
  console.log("PASS  private storage bucket");
}

if (failed) process.exitCode = 1;
else console.log("Weekly CTF backend verification passed.");
