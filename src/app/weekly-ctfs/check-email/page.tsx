import type { Metadata } from "next";
import Link from "next/link";
import { Header, Footer } from "../../_components/site-chrome";

export const metadata: Metadata = {
  title: "Check Your Email · Weekly CTFs · Layer8",
  description: "A verification email is on its way. Check your inbox to activate your Layer8 CTF account.",
};

/* ------------------------------------------------------------------ */
/*  Mask email for privacy: show only the domain part                  */
/* ------------------------------------------------------------------ */

function maskEmail(raw: string | null): string | null {
  if (!raw) return null;
  const at = raw.indexOf("@");
  if (at < 0) return null;
  return `***@${raw.slice(at + 1)}`;
}

/* ------------------------------------------------------------------ */
/*  Check-email page                                                    */
/* ------------------------------------------------------------------ */

export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const rawEmail = params.email ?? null;
  const maskedEmail = maskEmail(rawEmail);

  return (
    <>
      <Header current="Weekly CTFs" />

      <main className="flex-1 route-transition">
        <div className="wrap py-10 md:py-14">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex items-center gap-2 text-xs text-fg-faint">
              <li>
                <Link href="/weekly-ctfs" className="hover:text-accent transition-colors">
                  weekly-ctfs
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li className="text-fg-dim">check_email</li>
            </ol>
          </nav>

          <div className="rule mb-8" />

          {/* Heading */}
          <div className="flex flex-col gap-2 mb-8">
            <p className="kicker">{"// check_your_email"}</p>
            <h1 className="font-display font-bold text-[clamp(1.5rem,4vw,2.4rem)] text-fg leading-tight">
              Verify Your Address
            </h1>
          </div>

          {/* Terminal panel */}
          <div className="max-w-sm">
            <div className="term" aria-label="Email verification sent">
              <div className="term-bar">
                <span className="term-dot" />
                <span className="term-dot" />
                <span className="term-dot" />
                <span className="text-[0.7rem] text-fg-faint ml-1">
                  {"// verify_email"}
                </span>
              </div>
              <div className="term-body !min-h-0 flex flex-col gap-4">
                <p className="text-xs text-fg-faint">
                  <span className="prompt">$</span> registration_complete
                </p>

                <p className="text-sm text-fg-dim leading-relaxed">
                  A verification email is on its way
                  {maskedEmail ? (
                    <>
                      {" "}to{" "}
                      <span className="text-fg font-mono">{maskedEmail}</span>
                    </>
                  ) : null}
                  . Follow the link inside to activate your account.
                </p>

                <ul className="flex flex-col gap-1.5 text-xs text-fg-faint">
                  <li>
                    <span className="prompt">1.</span>{" "}
                    Check your inbox — and your spam folder.
                  </li>
                  <li>
                    <span className="prompt">2.</span>{" "}
                    Click the verification link. It expires after a short window.
                  </li>
                  <li>
                    <span className="prompt">3.</span>{" "}
                    Once confirmed you can sign in and start competing.
                  </li>
                </ul>

                <div className="rule" />

                <Link
                  href="/weekly-ctfs/sign-in"
                  id="check-email-go-to-signin"
                  className="btn self-start text-xs"
                >
                  ← back_to_sign_in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer current="Weekly CTFs" />
    </>
  );
}
