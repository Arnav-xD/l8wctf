import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { loadChallenge } from "../../../lib/ctf";
import { ChallengeClient } from "./challenge-client";

/* ------------------------------------------------------------------ */
/*  Metadata                                                            */
/* ------------------------------------------------------------------ */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ challenge: string }>;
}): Promise<Metadata> {
  const { challenge: slug } = await params;
  const data = await loadChallenge(slug);
  if (!data.challenge) {
    return { title: "Challenge Not Found · Layer8" };
  }
  return {
    title: `${data.challenge.title} · Weekly CTFs · Layer8`,
    description: data.challenge.summary,
  };
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default async function ChallengePage({
  params,
}: {
  params: Promise<{ challenge: string }>;
}) {
  const { challenge: slug } = await params;
  const data = await loadChallenge(slug);

  /* 404 if no active week or challenge not found */
  if (!data.week || !data.challenge) {
    notFound();
  }

  return (
    <ChallengeClient
      challenge={data.challenge}
      week={data.week}
      viewer={data.viewer}
      configured={data.configured}
    />
  );
}
