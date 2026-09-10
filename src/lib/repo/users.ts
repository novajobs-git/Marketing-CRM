import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export type UserRole = "ADMIN" | "RECRUITER";
export type UserStatus = "ACTIVE" | "INACTIVE";

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type RecruiterWithCount = AppUser & { assignedProfileCount: number };

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
};

function mapUser(row: UserRow): AppUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    status: row.status,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function throwIfError<T>(res: { data: T; error: { message: string; code?: string } | null }): T {
  if (res.error) throw Object.assign(new Error(res.error.message), { code: res.error.code });
  return res.data;
}

export async function findUserById(client: SupabaseClient, id: string): Promise<AppUser | null> {
  const res = await client
    .from("users")
    .select("id, name, email, role, status, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();
  const data = throwIfError(res as never) as UserRow | null;
  return data ? mapUser(data) : null;
}

export async function findUserByEmail(client: SupabaseClient, email: string): Promise<AppUser | null> {
  const res = await client
    .from("users")
    .select("id, name, email, role, status, created_at, updated_at")
    .eq("email", email)
    .maybeSingle();
  const data = throwIfError(res as never) as UserRow | null;
  return data ? mapUser(data) : null;
}

export async function upsertUser(
  client: SupabaseClient,
  user: { id: string; name: string; email: string; role: UserRole; status?: UserStatus }
): Promise<void> {
  const res = await client
    .from("users")
    .upsert({ id: user.id, name: user.name, email: user.email, role: user.role, status: user.status ?? "ACTIVE" });
  throwIfError(res as never);
}

export async function updateUserStatus(client: SupabaseClient, id: string, status: UserStatus): Promise<void> {
  const res = await client.from("users").update({ status }).eq("id", id);
  throwIfError(res as never);
}

export async function deleteUserRow(client: SupabaseClient, id: string): Promise<void> {
  const res = await client.from("users").delete().eq("id", id).eq("role", "RECRUITER");
  throwIfError(res as never);
}

export async function listRecruiters(
  client: SupabaseClient,
  opts: { status?: UserStatus } = {}
): Promise<AppUser[]> {
  let query = client
    .from("users")
    .select("id, name, email, role, status, created_at, updated_at")
    .eq("role", "RECRUITER")
    .order("name", { ascending: true });
  if (opts.status) query = query.eq("status", opts.status);
  const res = await query;
  const data = throwIfError(res as never) as UserRow[];
  return data.map(mapUser);
}

/** Recruiters with their assigned (non-deleted) candidate_profiles count — used by admin/users and the dashboard rollup. */
export async function listRecruitersWithCounts(
  client: SupabaseClient,
  opts: { status?: UserStatus } = {}
): Promise<RecruiterWithCount[]> {
  const recruiters = await listRecruiters(client, opts);
  if (recruiters.length === 0) return [];

  const res = await client
    .from("candidate_profiles")
    .select("assigned_recruiter_id")
    .in(
      "assigned_recruiter_id",
      recruiters.map((r) => r.id)
    );
  const rows = throwIfError(res as never) as { assigned_recruiter_id: string }[];

  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.assigned_recruiter_id, (counts.get(row.assigned_recruiter_id) ?? 0) + 1);
  }

  return recruiters.map((r) => ({ ...r, assignedProfileCount: counts.get(r.id) ?? 0 }));
}

export async function countRecruiters(client: SupabaseClient): Promise<number> {
  const res = await client.from("users").select("id", { count: "exact", head: true }).eq("role", "RECRUITER");
  const result = res as unknown as { count: number | null; error: { message: string; code?: string } | null };
  if (result.error) throw Object.assign(new Error(result.error.message), { code: result.error.code });
  return result.count ?? 0;
}

export async function countRecruitersByStatus(client: SupabaseClient): Promise<Record<UserStatus, number>> {
  const res = await client.from("users").select("status").eq("role", "RECRUITER");
  const data = throwIfError(res as never) as { status: UserStatus }[];
  const counts: Record<UserStatus, number> = { ACTIVE: 0, INACTIVE: 0 };
  for (const row of data) counts[row.status]++;
  return counts;
}
