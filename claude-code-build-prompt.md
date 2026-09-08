# Build Prompt for Claude Code

Paste everything below this line into Claude Code to kick off the build.

---

I'm building a recruitment CRM. Full requirements are in `recruitment-crm-prd-frd-ui-techstack.md` in this repo — read that file first, in full, before writing any code. It contains the PRD, FRD (numbered requirements FR-1.x through FR-8.x), UI design doc, and data model. Treat the FR-x.x requirements as the acceptance criteria for each feature.

## Tech stack (decided — do not substitute)

- **Frontend**: Next.js (App Router) + TypeScript + Tailwind CSS
- **Backend**: Next.js API routes (or a separate NestJS service if you think the CRM logic warrants it — your call, but keep it in TypeScript so frontend/backend share types)
- **Database**: PostgreSQL + Prisma ORM
- **File storage**: S3-compatible object storage (use env vars for endpoint/bucket/keys so it works with AWS S3 or a local MinIO for dev)
- **Rich text editor**: Tiptap, configured to preserve pasted HTML formatting (bold, headings, bullet lists, links) — this is a hard requirement per FR-5.1, not a nice-to-have
- **Auth**: JWT-based session auth with two roles, Admin and Recruiter, enforced server-side on every query (recruiters must only ever be able to fetch/mutate profiles assigned to them — enforce this in the query layer, not just hidden in the UI)
- **PDF handling**: store PDFs as-is in object storage; render inline previews in the browser (e.g. via `react-pdf` or an iframe) rather than forcing downloads

## Design direction — read this carefully

The UI must feel like a well-designed Apple/iOS-native app translated to the web: **minimal, calm, slick, a lot of whitespace, nothing decorative that doesn't earn its place.** Concretely:

- **Typography**: system font stack (`-apple-system, "SF Pro Text", "SF Pro Display", Inter, sans-serif`) as the fallback chain. Strong type hierarchy using weight and size, not color, to establish emphasis. Generous line-height.
- **Color**: mostly neutral — white/near-white backgrounds, dark gray/near-black text, one restrained accent color (a single blue, similar to iOS system blue) used sparingly for primary actions and active states only. Status badges (Applied/Interview/Assessment/Offer/Rejected/Withdrawn) can each get a muted, desaturated color rather than bright traffic-light colors.
- **Spacing**: generous padding, consistent spacing scale (4/8/12/16/24/32/48px), never cramped. Cards and list rows need real breathing room.
- **Corners & depth**: consistently rounded corners (think 12–16px radius on cards, 8px on buttons/inputs), soft/subtle shadows only (no heavy drop shadows), thin 1px hairline borders in a light gray instead of dividers where possible.
- **Motion**: subtle, fast transitions (150–200ms ease) on hover/tap states, modal open/close, tab switches — nothing bouncy or slow.
- **Components**: use shadcn/ui as the component base (it's unstyled-enough and works well with this aesthetic) and restyle its defaults to match the above rather than using it out of the box.
- **Density**: favor a slightly spacious, "iOS Settings app" density over a cramped enterprise-dashboard density, even though this is admin/data-heavy software. Tables should feel more like clean lists than spreadsheet grids.
- **Icons**: simple, thin/line-style icons (Lucide icons fit this well), used consistently, never mixed styles.
- **No clutter**: avoid unnecessary borders, background fills, or badges. If a UI element doesn't help the user complete their task, cut it.

Before writing component code, set up the design tokens first: a Tailwind config (or CSS variables) with the color palette, spacing scale, radius scale, and font stack described above, so every screen inherits the same system instead of being styled ad hoc.

## Build order

Please build in this order, and check in with me after each phase before moving to the next:

1. **Project scaffold** — Next.js + TypeScript + Tailwind + shadcn/ui setup, design tokens configured per above, Prisma schema created from the data model in Section 4.4 of the spec (`users`, `candidate_profiles`, `resume_files`, `job_descriptions`, `applications`, `report_entries`, `intake_submissions`), basic auth (login page, JWT session, role-gated routing).
2. **Admin: user & profile management** (FR-2.x, FR-3.x) — recruiter CRUD, candidate profile CRUD including EEO fields, profile assignment.
3. **Candidate intake form** (FR-4.x) — public form, writes to `intake_submissions`, admin review/approval flow into `candidate_profiles`.
4. **Recruiter dashboard** (FR-7.x) — profile list with live Applications/Interviews/Assessments counts, admin roll-up view.
5. **Candidate profile page** — Details tab, Resume Edits tab, Reports tab (tab structure per Section 3.1/3.2 of the spec).
6. **Resume tailoring / Add Application flow** (FR-6.x) — this is the core workflow, get the Tiptap paste-formatting behavior right here (FR-5.1/5.3), PDF upload to object storage, linked resume+JD+application record creation.
7. **Reports** (FR-8.x) — per-candidate report entries, global daily reports view, full log view with date range filtering.

## Notes

- Skip Gmail integration entirely — that's explicitly out of scope for this build (see Section 6 of the spec, "Future Phase").
- Enforce role-based data scoping at the API/query layer, not just in the UI.
- Use the FR-x.x IDs in your commit messages or PR descriptions where relevant so we can trace commits back to requirements.
- If anything in the spec is ambiguous, check Section 5 ("Assumptions & Open Questions") first — if it's not answered there, ask me rather than guessing.

Start with Phase 1.
