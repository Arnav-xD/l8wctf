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

export type CtfAdminAccount = {
  id: string;
  username: string;
  displayName: string;
  email: string | null;
  role: "student" | "host" | "admin";
  status: "active" | "suspended";
  createdAt: string;
  lastSignInAt: string | null;
};

export async function loadCtfAdminData() {
  const { admin, role } = await requireCtfHost();
  const [weeksResult, challengesResult, profilesResult, usersResult] = await Promise.all([
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
    role === "admin"
      ? admin
          .from("ctf_profiles")
          .select("id,username,display_name,role,account_status,created_at")
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    role === "admin"
      ? admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
      : Promise.resolve({ data: { users: [] }, error: null }),
  ]);

  if (weeksResult.error) throw weeksResult.error;
  if (challengesResult.error) throw challengesResult.error;
  if (profilesResult.error) throw profilesResult.error;
  if (usersResult.error) throw usersResult.error;

  const authUsers = new Map(
    usersResult.data.users.map((user) => [user.id, user]),
  );

  return {
    role,
    canManageAccounts: role === "admin",
    accounts: (profilesResult.data ?? []).map((profile): CtfAdminAccount => {
      const authUser = authUsers.get(profile.id);
      return {
        id: profile.id,
        username: profile.username,
        displayName: profile.display_name,
        email: authUser?.email ?? null,
        role: profile.role,
        status: profile.account_status,
        createdAt: profile.created_at,
        lastSignInAt: authUser?.last_sign_in_at ?? null,
      };
    }),
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
