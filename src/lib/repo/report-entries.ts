import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ReportEntry = {
  id: string;
  candidateId: string | null;
  date: Date;
  applicationsCount: number;
  interviewsCount: number;
  offersCount: number;
  notes: string | null;
  createdById: string;
  createdAt: Date;
};

type ReportEntryRow = {
  id: string;
  candidate_id: string | null;
  date: string;
  applications_count: number;
  interviews_count: number;
  offers_count: number;
  notes: string | null;
  created_by_id: string;
  created_at: string;
};

function throwIfError<T>(res: { data: T; error: { message: string; code?: string } | null }): T {
  if (res.error) throw Object.assign(new Error(res.error.message), { code: res.error.code });
  return res.data;
}

function mapReportEntry(row: ReportEntryRow): ReportEntry {
  return {
    id: row.id,
    candidateId: row.candidate_id,
    date: new Date(row.date),
    applicationsCount: row.applications_count,
    interviewsCount: row.interviews_count,
    offersCount: row.offers_count,
    notes: row.notes,
    createdById: row.created_by_id,
    createdAt: new Date(row.created_at),
  };
}

export type ReportEntryForReport = {
  candidateId: string | null;
  candidateName: string | null;
  date: Date;
  applicationsCount: number;
  interviewsCount: number;
  offersCount: number;
};

export async function listReportEntriesFiltered(
  client: SupabaseClient,
  filters: { candidateIds?: string[]; from?: Date; to?: Date }
): Promise<ReportEntryForReport[]> {
  let query = client
    .from("report_entries")
    .select("candidate_id, date, applications_count, interviews_count, offers_count, candidate:candidate_profiles(id, name)");
  if (filters.candidateIds) query = query.in("candidate_id", filters.candidateIds);
  if (filters.from) query = query.gte("date", filters.from.toISOString().slice(0, 10));
  if (filters.to) query = query.lte("date", filters.to.toISOString().slice(0, 10));

  const res = await query;
  const data = throwIfError(res as never) as {
    candidate_id: string | null;
    date: string;
    applications_count: number;
    interviews_count: number;
    offers_count: number;
    candidate: { id: string; name: string } | null;
  }[];
  return data.map((row) => ({
    candidateId: row.candidate?.id ?? row.candidate_id,
    candidateName: row.candidate?.name ?? null,
    date: new Date(row.date),
    applicationsCount: row.applications_count,
    interviewsCount: row.interviews_count,
    offersCount: row.offers_count,
  }));
}

export async function createReportEntry(
  client: SupabaseClient,
  fields: {
    candidateId: string;
    date: Date;
    applicationsCount: number;
    interviewsCount: number;
    offersCount: number;
    notes: string | null;
    createdById: string;
  }
): Promise<void> {
  const res = await client.from("report_entries").insert({
    candidate_id: fields.candidateId,
    date: fields.date.toISOString().slice(0, 10),
    applications_count: fields.applicationsCount,
    interviews_count: fields.interviewsCount,
    offers_count: fields.offersCount,
    notes: fields.notes,
    created_by_id: fields.createdById,
  });
  throwIfError(res as never);
}

export async function listReportEntriesForCandidate(
  client: SupabaseClient,
  candidateId: string
): Promise<ReportEntry[]> {
  const res = await client
    .from("report_entries")
    .select("*")
    .eq("candidate_id", candidateId)
    .order("date", { ascending: false });
  const data = throwIfError(res as never) as ReportEntryRow[];
  return data.map(mapReportEntry);
}
