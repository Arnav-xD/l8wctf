"use client";

import Link from "next/link";
import { Header, Footer } from "../../_components/site-chrome";

/* ------------------------------------------------------------------ */
/*  AuthShell                                                           */
/*  Shared layout for all standalone auth pages.                       */
/* ------------------------------------------------------------------ */

export function AuthShell({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children: React.ReactNode;
}) {
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
              <li className="text-fg-dim">{kicker.replace("// ", "")}</li>
            </ol>
          </nav>

          <div className="rule mb-8" />

          {/* Heading */}
          <div className="flex flex-col gap-2 mb-8">
            <p className="kicker">{kicker}</p>
            <h1 className="font-display font-bold text-[clamp(1.5rem,4vw,2.4rem)] text-fg leading-tight">
              {title}
            </h1>
          </div>

          {/* Content */}
          <div className="max-w-sm">{children}</div>
        </div>
      </main>

      <Footer current="Weekly CTFs" />
    </>
  );
}
