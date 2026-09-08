import type { Metadata } from "next";
import Link from "next/link";
import { Header, Footer } from "../../_components/site-chrome";
import { loadCtfAdminData } from "../../../lib/ctf-admin";
import AdminClient from "./_components/admin-client";

export const metadata: Metadata = {
  title: "CTF admin · Weekly CTF · Layer8",
  description: "Host console for weekly operations and challenges.",
};

// Host session + live data; never cache.
export const dynamic = "force-dynamic";

function Gate({ title, body }: { title: string; body: string }) {
  return (
    <p className="mt-8 max-w-[34rem] border-l-2 border-accent bg-bg-2 px-4 py-3 text-[0.85rem] text-fg-dim">
      <span className="mb-1 block text-[0.68rem] uppercase tracking-[0.18em] text-fg-faint">
        {title}
      </span>
      {body}
    </p>
  );
}

export default async function CtfAdminPage() {
  let data: Awaited<ReturnType<typeof loadCtfAdminData>> | null = null;
  let gate: { title: string; body: string } | null = null;

  try {
    data = await loadCtfAdminData();
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("not configured")) {
      gate = {
        title: "demo build",
        body: "Supabase is not configured here, so the host console is unavailable.",
      };
    } else if (message.includes("Sign in")) {
      gate = {
        title: "sign in required",
        body: "Sign in with a host or admin account to reach this console.",
      };
    } else if (message.includes("Host access required")) {
      gate = {
        title: "host access required",
        body: "This account is not a host or admin. Ask an organizer to raise your role.",
      };
    } else {
      gate = {
        title: "could not load",
        body: `The host console reached Supabase but the request failed${
          message ? `: ${message}` : "."
        }`,
      };
    }
  }

  return (
    <>
      <Header current="Weekly CTFs" />

      <main className="flex-1">
        <section className="wrap py-14 md:py-20">
          <Link
            href="/weekly-ctfs"
            className="link-ghost text-[0.75rem] uppercase tracking-[0.16em]"
          >
            {"< back_to_operation"}
          </Link>

          <p className="kicker mt-6 mb-4">{"// ~/weekly-ctfs/admin"}</p>

          <h1 className="font-display text-[clamp(1.75rem,5vw,2.75rem)] font-bold leading-[1.08] text-fg">
            Host console
          </h1>

          <p className="mt-4 max-w-[36rem] text-[0.95rem] text-fg-dim">
            Create and edit weekly operations and their challenges. Flags are
            hashed server side — the plaintext is never stored or shown back.
          </p>

          {gate ? (
            <Gate title={gate.title} body={gate.body} />
          ) : (
            <div className="mt-10">
              {data ? (
                <AdminClient
                  role={data.role}
                  weeks={data.weeks}
                  challenges={data.challenges}
                  now={data.loadedAt}
                />
              ) : null}
            </div>
          )}
        </section>
      </main>

      <Footer current="Weekly CTFs" />
    </>
  );
}
