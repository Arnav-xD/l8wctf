import "server-only";
import { createClient } from "./supabase/server";
import { isSupabaseConfigured } from "./supabase/config";

export type ChallengeDifficulty = "beginner" | "easy" | "medium" | "hard";

export type CtfChallenge = {
  id: string;
  slug: string;
  title: string;
  category: string;
  difficulty: ChallengeDifficulty;
  points: number;
  summary: string;
  description: string;
  connectionInfo: string | null;
  attachmentPath: string | null;
  solveCount: number;
  solved: boolean;
};

export type CtfWeek = {
  id: string;
  slug: string;
  sequenceNo: number;
  title: string;
  summary: string;
  startsAt: string;
  endsAt: string;
};

export type CtfViewer = {
  id: string;
  username: string;
  displayName: string;
  role: "student" | "host" | "admin";
  points: number;
  solved: number;
  streak: number;
};

export type LeaderboardEntry = {
  rank: number;
  username: string;
  points: number;
  solves: number;
  lastSolveAt: string | null;
};

export type CtfDashboard = {
  configured: boolean;
  week: CtfWeek | null;
  challenges: CtfChallenge[];
  viewer: CtfViewer | null;
  leaderboard: LeaderboardEntry[];
};

const DEMO_WEEK: CtfWeek = {
  id: "demo-week",
  slug: "packet-zero",
  sequenceNo: 1,
  title: "Packet Zero",
  summary: "Warm up the human layer with four beginner-friendly challenges.",
  startsAt: "2026-09-07T12:30:00.000Z",
  endsAt: "2026-09-14T12:30:00.000Z",
};

const DEMO_CHALLENGES: CtfChallenge[] = [
  {
    id: "demo-web",
    slug: "robots-have-secrets",
    title: "Robots Have Secrets",
    category: "web",
    difficulty: "beginner",
    points: 100,
    summary: "The crawler found something the navigation did not.",
    description: "Inspect the target carefully and recover the hidden flag.",
    connectionInfo: null,
    attachmentPath: null,
    solveCount: 28,
    solved: false,
  },
  {
    id: "demo-crypto",
    slug: "shift-happens",
    title: "Shift Happens",
    category: "crypto",
    difficulty: "easy",
    points: 150,
    summary: "A familiar cipher is hiding behind unfamiliar spacing.",
    description: "Recover the plaintext and submit the Layer8 flag.",
    connectionInfo: null,
    attachmentPath: null,
    solveCount: 17,
    solved: false,
  },
  {
    id: "demo-forensics",
    slug: "ghost-in-the-headers",
    title: "Ghost in the Headers",
    category: "forensics",
    difficulty: "medium",
    points: 250,
    summary: "The payload is ordinary. Its metadata is not.",
    description: "Inspect the provided evidence and find the concealed value.",
    connectionInfo: null,
    attachmentPath: null,
    solveCount: 9,
    solved: false,
  },
  {
    id: "demo-rev",
    slug: "strings-attached",
    title: "Strings Attached",
    category: "rev",
    difficulty: "hard",
    points: 400,
    summary: "A tiny binary with one very opinionated password checker.",
    description: "Reverse the verification routine and recover the flag.",
    connectionInfo: null,
    attachmentPath: null,
    solveCount: 3,
    solved: false,
  },
];

function calculateStreak(solvedSequences: number[], latestSequence: number) {
  const solved = new Set(solvedSequences);
  let cursor = latestSequence;
  let streak = 0;
  while (solved.has(cursor)) {
    streak += 1;
    cursor -= 1;
  }
  return streak;
}

export async function loadCtfDashboard(): Promise<CtfDashboard> {
  if (!isSupabaseConfigured()) {
    return {
      configured: false,
      week: DEMO_WEEK,
      challenges: DEMO_CHALLENGES,
      viewer: null,
      leaderboard: [
        { rank: 1, username: "nullbyte", points: 900, solves: 4, lastSolveAt: null },
        { rank: 2, username: "shellshock", points: 650, solves: 3, lastSolveAt: null },
        { rank: 3, username: "packetwitch", points: 500, solves: 3, lastSolveAt: null },
      ],
    };
  }

  const supabase = await createClient();
  const now = new Date().toISOString();
  const [{ data: authData }, weekResult, leaderboardResult] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("ctf_weeks")
      .select("id,slug,sequence_no,title,summary,starts_at,ends_at")
      .eq("published", true)
      .lte("starts_at", now)
      .gte("ends_at", now)
      .order("sequence_no", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.rpc("ctf_leaderboard", { limit_count: 10 }),
  ]);

  const weekRow = weekResult.data;
  const user = authData.user;
  let solvedIds = new Set<string>();
  let viewer: CtfViewer | null = null;

  if (user) {
    const [profileResult, solvesResult] = await Promise.all([
      supabase
        .from("ctf_profiles")
        .select("username,display_name,role,account_status")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("ctf_solves")
        .select("challenge_id,points_awarded,ctf_challenges!inner(week_id,ctf_weeks!inner(sequence_no))")
        .eq("user_id", user.id),
    ]);

    const solveRows = solvesResult.data ?? [];
    solvedIds = new Set(solveRows.map((row) => row.challenge_id));
    const sequences = solveRows.flatMap((row) => {
      const challenge = row.ctf_challenges as unknown as {
        ctf_weeks: { sequence_no: number };
      };
      return challenge?.ctf_weeks?.sequence_no
        ? [challenge.ctf_weeks.sequence_no]
        : [];
    });
    const profile = profileResult.data;
    if (profile?.account_status === "active") {
      viewer = {
        id: user.id,
        username: profile.username,
        displayName: profile.display_name,
        role: profile.role,
        points: solveRows.reduce((sum, solve) => sum + solve.points_awarded, 0),
        solved: solveRows.length,
        streak: weekRow ? calculateStreak(sequences, weekRow.sequence_no) : 0,
      };
    }
  }

  const leaderboardRows = (leaderboardResult.data ?? []) as Array<{
    username: string;
    total_points: number | string;
    solve_count: number | string;
    last_solve_at: string | null;
  }>;
  const leaderboard: LeaderboardEntry[] = leaderboardRows.map(
    (entry, index) => ({
      rank: index + 1,
      username: entry.username,
      points: Number(entry.total_points),
      solves: Number(entry.solve_count),
      lastSolveAt: entry.last_solve_at,
    }),
  );

  if (!weekRow) {
    return {
      configured: true,
      week: null,
      challenges: [],
      viewer,
      leaderboard,
    };
  }

  const challengeResult = await supabase
    .from("ctf_challenges")
    .select(
      "id,slug,title,category,difficulty,points,summary,description,connection_info,attachment_path,solve_count",
    )
    .eq("week_id", weekRow.id)
    .eq("published", true)
    .order("points", { ascending: true });

  const challenges: CtfChallenge[] = (challengeResult.data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    difficulty: row.difficulty,
    points: row.points,
    summary: row.summary,
    description: row.description,
    connectionInfo: row.connection_info,
    attachmentPath: row.attachment_path,
    solveCount: row.solve_count,
    solved: solvedIds.has(row.id),
  }));

  return {
    configured: true,
    week: {
      id: weekRow.id,
      slug: weekRow.slug,
      sequenceNo: weekRow.sequence_no,
      title: weekRow.title,
      summary: weekRow.summary,
      startsAt: weekRow.starts_at,
      endsAt: weekRow.ends_at,
    },
    challenges,
    viewer,
    leaderboard,
  };
}

export async function loadChallenge(slug: string) {
  const dashboard = await loadCtfDashboard();
  return {
    ...dashboard,
    challenge: dashboard.challenges.find((item) => item.slug === slug) ?? null,
  };
}
