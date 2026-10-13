# Layer8 — Website & Weekly CTF

The expanded **Layer8 cybersecurity club website**, with learning content, recruitment tools, and a weekly capture-the-flag platform.

Built with **Next.js 16, React 19, TypeScript, and Tailwind CSS v4**. Weekly CTF features use **Supabase** for authentication, PostgreSQL, and private challenge-file storage.

This repository is a fork of [AmoghGarg007/l8demo](https://github.com/AmoghGarg007/l8demo). Its configured demo URL is [l8demo.vercel.app](https://l8demo.vercel.app).

## Explore the site

| Route | Contents |
| --- | --- |
| `/` | Landing page, interactive terminal, domains, and weekly-CTF strip |
| `/blogs` and `/blogs/[slug]` | Markdown blog posts |
| `/ctf-writeups` and `/ctf-writeups/[slug]` | Challenge writeups |
| `/events` | Searchable event catalog |
| `/domains` | Security-domain cards and details |
| `/resources` | Learning paths and resource library |
| `/about` | Club information, core team, and member rosters |
| `/core` | Redirect to `/about` |
| `/legacy` and `/hall-of-fame` | Alumni and achievements |
| `/sandbox` | Coming-soon page |
| `/recruitments` and `/admin` | Recruitment and administration interfaces |
| `/weekly-ctfs` | Weekly operations and challenge listings |
| `/weekly-ctfs/[challenge]` | Challenge details and flag submissions |
| `/weekly-ctfs/leaderboard` | Rankings |
| `/weekly-ctfs/admin` | Host/admin challenge management |

The shared terminal supports `help`, `ls`, `cd <section>`, `pwd`, `whoami`, `cat mission.txt`, `clear`, command history, and tab completion.

## Run locally

From the repository directory:

```bash
npm ci
```

Copy [.env.example](.env.example) to `.env.local` and configure the services needed for the features you are running:

| Feature | Configuration |
| --- | --- |
| Recruitment/admin | Turso database URL and token, JWT secret, and admin SRNs |
| Optional Google Sheets sync | Service-account email, private key, and sheet ID |
| Weekly CTF | Supabase URL, publishable key, server-only service-role key, and site URL |
| CTF CAPTCHA | Turnstile site key after enabling CAPTCHA in Supabase |

For the CTF backend, follow [docs/WEEKLY_CTF.md](docs/WEEKLY_CTF.md). It covers migration order, email confirmation, SMTP, redirects, CAPTCHA, account provisioning, storage, and backend verification.

```bash
npm run dev
```

Open [localhost:3000](http://localhost:3000).

| Command | Purpose |
| --- | --- |
| `npm run lint` | ESLint |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run ctf:verify-backend` | Verify the configured CTF backend |

## How the project is organized

| Location | Role |
| --- | --- |
| [src/app/](src/app/) | App Router pages and client interfaces |
| [src/app/_components/](src/app/_components/) | Shared navigation, terminal, and authentication components |
| [src/content/](src/content/) | Markdown blogs and CTF writeups |
| [src/lib/markdown.ts](src/lib/markdown.ts) | Dependency-free Markdown rendering |
| [src/app/weekly-ctfs/actions.ts](src/app/weekly-ctfs/actions.ts) | Student authentication and submission actions |
| [src/app/weekly-ctfs/admin/actions.ts](src/app/weekly-ctfs/admin/actions.ts) | Host/admin mutations |
| [src/lib/ctf.ts](src/lib/ctf.ts) and [src/lib/ctf-admin.ts](src/lib/ctf-admin.ts) | CTF data loading |
| [src/lib/supabase/](src/lib/supabase/) | Browser/server Supabase clients |
| [supabase/migrations/](supabase/migrations/) | Database schema and CTF backend migrations |
| [scripts/](scripts/) | CTF provisioning, password reset, and verification |
| [DESIGN.md](DESIGN.md) | Design system |
| [docs/WEEKLY_CTF.md](docs/WEEKLY_CTF.md) | Detailed CTF setup and operating guide |

Page interfaces share the header/footer and navigation map in `site-chrome.tsx`. Content catalogs use their route-specific data files. `globals.css` defines the theme; `template.tsx` handles page-entry motion and scroll reset.

## Understanding flag submissions

The existing backend hashes submitted flags, validates submissions on the server, and performs rate limiting, scoring, and solve creation atomically in PostgreSQL. Challenge secrets are separated from public metadata. Host/admin actions check stored roles and record audit logs.

See [docs/WEEKLY_CTF.md](docs/WEEKLY_CTF.md) for the security decisions, scoring rules, storage limits, and UI integration contracts. Keep the service-role key server-only.

## Deployment

[.github/workflows/deploy.yml](.github/workflows/deploy.yml) deploys pushes to `main` through the Vercel CLI. It pulls production settings, builds, and deploys prebuilt output using the `VERCEL_TOKEN` repository secret and the committed Vercel project IDs.

Use that workflow for this repository's production deployment. Direct `vercel deploy --prod` bypasses it. The committed workflow has build and deploy steps; lint is a separate npm command.
