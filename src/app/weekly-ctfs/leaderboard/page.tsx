import type { Metadata } from "next";
import { loadCtfDashboard } from "../../../lib/ctf";
import { LeaderboardPageClient } from "./leaderboard-page-client";

export const metadata: Metadata = {
  title: "Leaderboard · Weekly CTFs · Layer8",
  description:
    "Layer8 weekly CTF leaderboard — see the top solvers, rankings, and points for the current week.",
};

export default async function LeaderboardPage() {
  const data = await loadCtfDashboard();
  return (
    <LeaderboardPageClient
      week={data.week}
      leaderboard={data.leaderboard}
      viewer={data.viewer}
      configured={data.configured}
    />
  );
}
