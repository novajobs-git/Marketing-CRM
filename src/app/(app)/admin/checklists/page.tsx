import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listChecklistTemplates, listChecklistLinks } from "@/lib/repo/checklists";
import { listCandidates } from "@/lib/repo/candidates";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreateChecklistTemplateDialog } from "@/components/create-checklist-template-dialog";
import { CreateChecklistLinkDialog } from "@/components/create-checklist-link-dialog";
import { DeleteChecklistButton } from "@/components/delete-checklist-button";
import { ALL_FIELDS } from "@/lib/candidate-fields";

const LINK_STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending",
  SUBMITTED: "Submitted",
  EXPIRED: "Expired",
};

export default async function ChecklistsPage() {
  await requireAdmin();

  const client = createSupabaseServerClient();
  const [templates, links, candidates] = await Promise.all([
    listChecklistTemplates(client),
    listChecklistLinks(client, { limit: 50 }),
    listCandidates(client, { excludeStatus: "ARCHIVED" }).then((rows) =>
      [...rows].sort((a, b) => a.name.localeCompare(b.name))
    ),
  ]);

  const fieldLabel = new Map(ALL_FIELDS.map((f) => [f.key, f.label]));

  return (
    <div className="w-full min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Checklists</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Reusable templates for one-time public links candidates fill out themselves.
          </p>
        </div>
        <div className="flex gap-2">
          <CreateChecklistLinkDialog
            templates={templates.map((t) => ({ id: t.id, name: t.name }))}
            candidates={candidates}
          />
          <CreateChecklistTemplateDialog />
        </div>
      </div>

      <h2 className="mt-8 text-base font-semibold text-foreground">Templates</h2>
      <div className="mt-3">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Fields</TableHead>
              <TableHead>Links sent</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                  No templates yet.
                </TableCell>
              </TableRow>
            )}
            {templates.map((t) => {
              const keys = t.fieldKeys ?? [];
              return (
                <TableRow key={t.id}>
                  <TableCell className="font-medium text-foreground">{t.name}</TableCell>
                  <TableCell className="max-w-md text-muted-foreground">
                    {keys.map((k) => fieldLabel.get(k) ?? k).join(", ")}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{t.linkCount}</TableCell>
                  <TableCell>
                    <DeleteChecklistButton kind="template" id={t.id} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <h2 className="mt-10 text-base font-semibold text-foreground">Shared links</h2>
      <div className="mt-3">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Candidate</TableHead>
              <TableHead>Template</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {links.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  No links generated yet.
                </TableCell>
              </TableRow>
            )}
            {links.map((link) => (
              <TableRow key={link.id}>
                <TableCell className="font-medium text-foreground">{link.candidate.name}</TableCell>
                <TableCell className="text-muted-foreground">{link.template.name}</TableCell>
                <TableCell>
                  <Badge variant={link.status === "PENDING" ? "secondary" : "outline"}>
                    {LINK_STATUS_LABEL[link.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {link.createdAt.toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <DeleteChecklistButton kind="link" id={link.id} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
