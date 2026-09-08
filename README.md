# Recruitment CRM

Full requirements: [`recruitment-crm-prd-frd-ui-techstack.md`](./recruitment-crm-prd-frd-ui-techstack.md). Build plan: [`claude-code-build-prompt.md`](./claude-code-build-prompt.md).

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui, PostgreSQL + Prisma, S3-compatible object storage, JWT session auth (`jose`), Tiptap (added in Phase 6).

## Local setup

1. Start Postgres + MinIO:
   ```
   docker compose up -d
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Copy `.env.example` to `.env` and adjust if needed (defaults match `docker-compose.yml`). A `.env` with working local defaults is already present.
4. Apply the database schema:
   ```
   npx prisma migrate dev
   ```
5. Seed an admin account:
   ```
   npm run db:seed
   ```
   Creates `admin@example.com` / `ChangeMe123!` (override via `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` env vars).
6. Run the dev server:
   ```
   npm run dev
   ```

MinIO console: http://localhost:9001 (`minioadmin` / `minioadmin`). The `recruitment-crm` bucket referenced in `.env` isn't auto-created yet — that lands with the resume-upload flow in Phase 6.

## Phase 1 status (scaffold + auth)

- Next.js + TypeScript + Tailwind + shadcn/ui scaffolded, with design tokens (iOS-inspired: neutral palette, single accent blue, 8px/12–16px radius scale, system font stack) in `src/app/globals.css`.
- Prisma schema (`prisma/schema.prisma`) modeling `users`, `candidate_profiles`, `resume_files`, `job_descriptions`, `applications`, `report_entries`, `intake_submissions` per spec §4.4.
- JWT session auth (FR-1.1–1.3): login at `/login`, session cookie verified in `src/proxy.ts` (Next's middleware/proxy convention) on every request, `/admin/*` gated to the `ADMIN` role.
- Role scoping is enforced today only at the route level; the query-layer scoping for recruiter-assigned profiles (FR-1.2) lands in Phase 2 alongside the profile CRUD it protects.

Next: Phase 2 — admin user & candidate profile management (FR-2.x, FR-3.x).
