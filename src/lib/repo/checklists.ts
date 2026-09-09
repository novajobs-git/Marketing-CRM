import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ChecklistLinkStatus = "PENDING" | "SUBMITTED" | "EXPIRED";

export type ChecklistTemplateWithCount = {
  id: string;
  name: string;
  fieldKeys: string[];
  createdById: string;
  createdAt: Date;
  linkCount: number;
};

export type ChecklistLinkWithRelations = {
  id: string;
  token: string;
  templateId: string;
  status: ChecklistLinkStatus;
  resultingIntakeSubmissionId: string | null;
  createdById: string;
  createdAt: Date;
  submittedAt: Date | null;
  template: { name: string };
};

function throwIfError<T>(res: { data: T; error: { message: string; code?: string } | null }): T {
  if (res.error) throw Object.assign(new Error(res.error.message), { code: res.error.code });
  return res.data;
}

export async function countChecklistTemplates(client: SupabaseClient): Promise<number> {
  const res = await client.from("checklist_templates").select("id", { count: "exact", head: true });
  const result = res as unknown as { count: number | null; error: { message: string; code?: string } | null };
  if (result.error) throw Object.assign(new Error(result.error.message), { code: result.error.code });
  return result.count ?? 0;
}

export async function listChecklistTemplates(client: SupabaseClient): Promise<ChecklistTemplateWithCount[]> {
  const res = await client
    .from("checklist_templates")
    .select("*, links:checklist_links(count)")
    .order("created_at", { ascending: false });
  const data = throwIfError(res as never) as {
    id: string;
    name: string;
    field_keys: string[];
    created_by_id: string;
    created_at: string;
    links: { count: number }[];
  }[];
  return data.map((row) => ({
    id: row.id,
    name: row.name,
    fieldKeys: row.field_keys,
    createdById: row.created_by_id,
    createdAt: new Date(row.created_at),
    linkCount: row.links[0]?.count ?? 0,
  }));
}

export async function createChecklistTemplate(
  client: SupabaseClient,
  fields: { name: string; fieldKeys: string[]; createdById: string }
): Promise<void> {
  const res = await client
    .from("checklist_templates")
    .insert({ name: fields.name, field_keys: fields.fieldKeys, created_by_id: fields.createdById });
  throwIfError(res as never);
}

export async function deleteChecklistTemplate(client: SupabaseClient, id: string): Promise<void> {
  await client.from("checklist_templates").delete().eq("id", id);
}

export async function listChecklistLinks(
  client: SupabaseClient,
  opts: { limit?: number } = {}
): Promise<ChecklistLinkWithRelations[]> {
  let query = client
    .from("checklist_links")
    .select("*, template:checklist_templates(name)")
    .order("created_at", { ascending: false });
  if (opts.limit) query = query.limit(opts.limit);
  const res = await query;
  const data = throwIfError(res as never) as {
    id: string;
    token: string;
    template_id: string;
    status: ChecklistLinkStatus;
    resulting_intake_submission_id: string | null;
    created_by_id: string;
    created_at: string;
    submitted_at: string | null;
    template: { name: string } | null;
  }[];
  return data.map((row) => ({
    id: row.id,
    token: row.token,
    templateId: row.template_id,
    status: row.status,
    resultingIntakeSubmissionId: row.resulting_intake_submission_id,
    createdById: row.created_by_id,
    createdAt: new Date(row.created_at),
    submittedAt: row.submitted_at ? new Date(row.submitted_at) : null,
    template: row.template ?? { name: "" },
  }));
}

export async function createChecklistLink(
  client: SupabaseClient,
  fields: { token: string; templateId: string; createdById: string }
): Promise<void> {
  const res = await client.from("checklist_links").insert({
    token: fields.token,
    template_id: fields.templateId,
    created_by_id: fields.createdById,
  });
  throwIfError(res as never);
}

export async function deleteChecklistLink(client: SupabaseClient, id: string): Promise<void> {
  await client.from("checklist_links").delete().eq("id", id);
}

export type ChecklistLinkForPublicPage = {
  id: string;
  token: string;
  status: ChecklistLinkStatus;
  template: { fieldKeys: string[]; name: string };
};

/** Public, no session — read via the service-role client (token itself is the authorization). */
export async function findChecklistLinkByToken(
  client: SupabaseClient,
  token: string
): Promise<ChecklistLinkForPublicPage | null> {
  const res = await client
    .from("checklist_links")
    .select("id, token, status, template:checklist_templates(field_keys, name)")
    .eq("token", token)
    .maybeSingle();
  const row = throwIfError(res as never) as {
    id: string;
    token: string;
    status: ChecklistLinkStatus;
    template: { field_keys: string[]; name: string } | null;
  } | null;
  if (!row) return null;
  return {
    id: row.id,
    token: row.token,
    status: row.status,
    template: row.template
      ? { fieldKeys: row.template.field_keys, name: row.template.name }
      : { fieldKeys: [], name: "" },
  };
}

/** Public, no session — atomic via RPC, called through the service-role client.
 *  Creates a pending intake_submissions row (same review-then-approve path as
 *  the public /intake form) rather than writing to candidate_profiles directly. */
export async function submitChecklistViaRpc(
  client: SupabaseClient,
  params: { linkId: string; submittedData: Record<string, unknown> }
): Promise<string> {
  const res = await client.rpc("submit_checklist", {
    p_link_id: params.linkId,
    p_submitted_data: params.submittedData,
  });
  return throwIfError(res as never) as string;
}
