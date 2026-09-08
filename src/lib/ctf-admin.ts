import "server-only";
import { requireCtfHost } from "./ctf-host";

export type CtfAdminWeek = {
  id: string;
  slug: string;
  sequenceNo: number;
  title: string;
  summary: string;
  startsAt: string;
  endsAt: string;
  published: boolean;
};

export type CtfAdminChallenge = {
  id: string;
  weekId: string;
  slug: string;
  title: string;
  category: string;
  difficulty: string;
  points: number;
  summary: string;
  description: string;
  connectionInfo: string | null;
  attachmentPath: string | null;
  published: boolean;
};

export async function loadCtfAdminData() {
  const { admin, role } = await requireCtfHost();
  const [weeksResult, challengesResult] = await Promise.all([
    admin
      .from("ctf_weeks")
      .select("id,slug,sequence_no,title,summary,starts_at,ends_at,published")
      .order("sequence_no", { ascending: false }),
    admin
      .from("ctf_challenges")
      .select(
        "id,week_id,slug,title,category,difficulty,points,summary,description,connection_info,attachment_path,published",
      )
      .order("created_at", { ascending: false }),
  ]);

  if (weeksResult.error) throw weeksResult.error;
  if (challengesResult.error) throw challengesResult.error;

  return {
    role,
    // Server clock at load time, so the client's first render of operation
    // status matches the server HTML before it switches to the live clock.
    loadedAt: Date.now(),
    weeks: (weeksResult.data ?? []).map((week): CtfAdminWeek => ({
      id: week.id,
      slug: week.slug,
      sequenceNo: week.sequence_no,
      title: week.title,
      summary: week.summary,
      startsAt: week.starts_at,
      endsAt: week.ends_at,
      published: week.published,
    })),
    challenges: (challengesResult.data ?? []).map(
      (challenge): CtfAdminChallenge => ({
        id: challenge.id,
        weekId: challenge.week_id,
        slug: challenge.slug,
        title: challenge.title,
        category: challenge.category,
        difficulty: challenge.difficulty,
        points: challenge.points,
        summary: challenge.summary,
        description: challenge.description,
        connectionInfo: challenge.connection_info,
        attachmentPath: challenge.attachment_path,
        published: challenge.published,
      }),
    ),
  };
}
