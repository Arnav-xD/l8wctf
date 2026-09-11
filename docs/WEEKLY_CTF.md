# Layer8 Weekly CTF

The Weekly CTF uses Supabase for PostgreSQL, email/password authentication, and private challenge-file storage. Anyone can create an account with a verified email address and a unique public username.

## Security decisions

- Public signups require email confirmation. Email addresses remain in Supabase Auth and are not exposed on profiles or leaderboards.
- User-supplied auth metadata can create only an active `student` profile. Host/admin roles are assigned separately by trusted administrators.
- Passwords are handled by Supabase Auth and are never stored in application tables.
- Raw flags are never sent to the browser or saved with submissions. PostgreSQL receives only a SHA-256 hash of the submitted value.
- Challenge secrets are isolated from public challenge metadata and accessible only through the service role.
- RLS limits students to their own profile, submissions, and solves.
- Submission validation, rate limiting, scoring, and solve creation run atomically in PostgreSQL using server timestamps.
- All concurrent attempts from the same account are serialized before the rate limit is evaluated, including attempts against different challenges. Different students are not blocked by one another.
- The service-role key is server-only. Never prefix it with `NEXT_PUBLIC_`.
- Host mutations are authorized against the stored profile role and recorded in `ctf_audit_log`.
- Suspended accounts cannot submit flags, appear on the leaderboard, or enter the host console.

## Project setup

1. Create a Supabase project.
2. Keep public signups disabled until every migration and the auth UI are deployed.
3. In the SQL editor, run the migrations in order:
   - `supabase/migrations/202609060001_weekly_ctf.sql`
   - `supabase/migrations/202609070001_ctf_backend_hardening.sql`
   - `supabase/migrations/202609070002_ctf_submission_concurrency.sql`
   - `supabase/migrations/202609110001_public_email_auth.sql`
4. In Authentication settings, enable public email signup and keep email confirmation enabled. Leave anonymous sign-in and manual linking disabled.
5. Configure Site URL and redirect URLs for local, preview, and production `/auth/confirm` routes.
6. Configure custom SMTP before public launch and enable Cloudflare Turnstile in Supabase CAPTCHA settings.
7. Optionally run `supabase/seed.sql` for one demo challenge. Replace its flag before production.
8. Copy `.env.example` to `.env.local`, add the project keys and site URL, then run `npm run ctf:verify-backend`.
9. Add the same variables to Vercel. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only.

## Provision a host or admin

Set a temporary password in the shell for this command only, then run:

```powershell
$env:CTF_INITIAL_PASSWORD="temporary-password-here"
npm run ctf:provision-user -- --email=host@example.com --name="Host Name" --username=host_alias --role=host
Remove-Item Env:CTF_INITIAL_PASSWORD
```

Ordinary users sign themselves up. Use this script only for trusted `host` or `admin` accounts, and rotate the temporary password immediately.

## Reset a password

Users normally recover passwords through the public forgot-password flow. For emergency administrator recovery only:

```powershell
$env:CTF_INITIAL_PASSWORD="new-temporary-password"
npm run ctf:reset-password -- --email=user@example.com
Remove-Item Env:CTF_INITIAL_PASSWORD
```

Share emergency passwords through a private channel and require an immediate change.

## Publishing challenges

Hosts can open `/weekly-ctfs/admin` to create, update, publish, and remove weekly operations and challenges. Drafts are invisible to students until `published` is enabled.

The admin UI should call `POST /api/ctf/uploads` with `challengeId`, `fileName`, and `fileSize`. The response contains a short-lived Supabase upload token and object path. Upload the file directly from the browser with `uploadToSignedUrl`, then pass the returned path to `attachChallengeFile`. This avoids sending large evidence files through a Vercel function.

The private `ctf-files` bucket limits objects to 50 MB. Student downloads use 60-second signed URLs and are available only while both the challenge and its week are published and active.

Use a separate challenge infrastructure host for intentionally vulnerable web services and binaries. Do not deploy exploitable challenge services inside this website's Vercel application or Supabase database.

## Scoring and streaks

- A challenge awards its configured points once per student.
- Rankings sort by total points, then the server-recorded completion time.
- A streak counts consecutive published week numbers where the student solved at least one challenge.
- The submission endpoint allows eight attempts per account per minute.

## UI integration contracts

- Public auth forms import `signUp`, `signIn`, `requestPasswordReset`, and `resetPassword` from `src/app/weekly-ctfs/actions.ts`.
- Signed-in forms also import `signOut`, `changePassword`, and `submitFlag` from that module.
- Host forms import the create/update/delete and attachment actions from `src/app/weekly-ctfs/admin/actions.ts`.
- Host pages load editable data through `loadCtfAdminData` from `src/lib/ctf-admin.ts`.
- Public/student pages load data through `loadCtfDashboard` and `loadChallenge` from `src/lib/ctf.ts`.

## Before production

- Configure and test custom SMTP delivery, confirmation, password reset, and redirect URLs.
- Enable CAPTCHA and keep a strong password policy in Supabase Auth.
- Configure backups and review RLS with two test accounts.
- Test unpublished, upcoming, active, and closed challenge states.
- Add CAPTCHA or infrastructure-level rate limiting if abuse appears.
- Run a 50-user burst test against a preview deployment before the first live event.
