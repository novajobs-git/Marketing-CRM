"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createChecklistTemplate as createChecklistTemplateRepo,
  deleteChecklistTemplate as deleteChecklistTemplateRepo,
  createChecklistLink as createChecklistLinkRepo,
  deleteChecklistLink as deleteChecklistLinkRepo,
} from "@/lib/repo/checklists";
import { requireAdmin } from "@/lib/auth";
import { ALL_FIELDS } from "@/lib/candidate-fields";

export type ActionState = { error?: string; success?: boolean } | null;

const VALID_KEYS = new Set(ALL_FIELDS.map((f) => f.key));

const templateSchema = z.object({
  name: z.string().trim().min(1, "Template name is required."),
  fieldKeys: z
    .array(z.string())
    .min(1, "Select at least one field.")
    .refine((keys) => keys.every((k) => VALID_KEYS.has(k)), "Invalid field selected."),
});

// Reusable set of candidate-detail fields to request via a public checklist link.
export async function createChecklistTemplate(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requireAdmin();

  const fieldKeys = formData.getAll("fieldKeys").map(String);
  const parsed = templateSchema.safeParse({
    name: formData.get("name"),
    fieldKeys,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await createChecklistTemplateRepo(createSupabaseServerClient(), {
    name: parsed.data.name,
    fieldKeys: parsed.data.fieldKeys,
    createdById: admin.sub,
  });

  revalidatePath("/admin/checklists");
  return { success: true };
}

export async function deleteChecklistTemplate(templateId: string): Promise<void> {
  await requireAdmin();
  await deleteChecklistTemplateRepo(createSupabaseServerClient(), templateId).catch(() => {});
  revalidatePath("/admin/checklists");
}

const linkSchema = z.object({
  templateId: z.string().trim().min(1, "Choose a template."),
});

export type CreateLinkState = { error?: string; url?: string } | null;

// Single-use public link: stops accepting submissions once used (FR — "expires after submission").
// Brings a brand-new candidate into the CRM — not tied to any existing profile.
export async function createChecklistLink(
  _prev: CreateLinkState,
  formData: FormData
): Promise<CreateLinkState> {
  const admin = await requireAdmin();

  const parsed = linkSchema.safeParse({
    templateId: formData.get("templateId"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const token = randomBytes(24).toString("base64url");

  await createChecklistLinkRepo(createSupabaseServerClient(), {
    token,
    templateId: parsed.data.templateId,
    createdById: admin.sub,
  });

  revalidatePath("/admin/checklists");
  return { url: `/checklist/${token}` };
}

export async function deleteChecklistLink(linkId: string): Promise<void> {
  await requireAdmin();
  await deleteChecklistLinkRepo(createSupabaseServerClient(), linkId).catch(() => {});
  revalidatePath("/admin/checklists");
}
