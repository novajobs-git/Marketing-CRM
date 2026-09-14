# Build Prompt: Recruiter Dashboard & Profile Reports Screen

Paste everything below this line into Claude Code.

---

Read `recruitment-crm-prd-frd-ui-techstack.md` and `claude-code-build-prompt.md` in this repo before starting — this prompt extends that spec with the exact layout and behavior for two specific screens: the recruiter's main dashboard (home screen after login) and the per-profile reports screen. Follow the existing design tokens (system font stack, single accent color, muted status badges, rounded cards, hairline dividers) already established for this project.

## Screen 1: Recruiter Dashboard (home)

This is the landing screen after a recruiter logs in. It is scoped to data the logged-in recruiter owns. Admins see an extended version of the same screen (see "Admin variant" below) — do not build two separate screens; build one dashboard component that adapts based on role.

### Layout, top to bottom

**1. Stat row — one card, three segments**

A single rounded card (not three separate cards) divided into three equal segments by thin 1px vertical hairline dividers (horizontal dividers on narrow/mobile viewports where segments stack). Each segment:

- Small muted label at 13px (e.g. "Total applications")
- Large number below at ~24px, medium weight
- A smaller line beneath showing the Today / Week / Month breakdown, e.g. "Today 6 · Week 34 · Month 128"

Segments, left to right:
1. Total applications (with Today/Week/Month breakdown)
2. Total interviews (with Today/Week/Month breakdown)
3. Total profiles assigned to this recruiter (no Today/Week/Month breakdown — just the count, since it's not a time-series metric)

**2. Two chart cards, side by side (stack vertically on mobile)**

- **Left card: Applications chart.** Header with the title "Applications" and a two-option toggle in the top-right corner of the card: "Weekly" / "Monthly". Default to Weekly on load.
- **Right card: Interviews chart.** Same structure, independent toggle state from the Applications card (a recruiter can view Applications monthly while Interviews stays weekly).

Chart implementation:
- Use Recharts, styled with a single accent-colored bar fill, rounded top corners on bars, minimal/no gridlines (one faint baseline only), hover tooltip showing exact count, no legend (single series).
- **Weekly** view: 7 bars, one per day, Monday through Sunday, for the current week.
- **Monthly** view: aggregate into weekly buckets (Week 1–Week 4/5) for the current month rather than 30 daily bars — keep it as a bar chart, just at a coarser granularity, so switching the toggle feels like a zoom change rather than a different chart type.
- Both charts fetch real data scoped to the logged-in recruiter's profiles only.

**3. "Your profiles" table**

Below the charts, a table/list of the recruiter's assigned candidate profiles:
- Columns: Candidate name, Role, Applications count, Interviews count, Last activity (relative time, e.g. "2h ago").
- Row click navigates to that candidate's profile page (Details / Resume Edits / Reports tabs, per the main spec).
- Sortable columns, simple search/filter by candidate name.
- Style as a clean list (hairline row dividers), not a dense spreadsheet grid.

### Admin variant

When an admin views this same dashboard:
- Add a recruiter filter/selector at the top of the screen (defaults to "All recruiters" showing org-wide totals, or can be switched to view any single recruiter's data exactly as that recruiter sees it).
- The stat row, charts, and profiles table all react to this filter — "All recruiters" shows org-wide aggregates, selecting a specific recruiter shows that recruiter's exact dashboard.
- The profiles table gains a "Recruiter" column when viewing "All recruiters", so admins can see which recruiter owns which profile.

### Explicitly NOT on this screen

Do not add the full historical reports log (with date-range filtering, per-day drill-down, etc.) to this dashboard — that lives on a separate screen (Screen 2, below), reached only by navigating into a specific candidate profile. The dashboard's charts show current week/month trends only, not a browsable history.

## Screen 2: Candidate Profile → Reports tab → Full Reports view

This is a **separate screen**, reached only via: Candidate Profile page → Reports tab → "View full reports" link. It is scoped to a single candidate profile, not the whole dashboard.

### Layout

Reuse the same visual language as the main dashboard (stat row + toggle charts) but scoped entirely to this one candidate:

**1. Stat row** — same three-segment single-card pattern, but for this candidate only: Applications, Interviews, Offers (not "Total profiles", since this screen is already inside one profile) — each with Today/Week/Month breakdown.

**2. Two toggle charts** — same Weekly/Monthly bar chart pattern as the main dashboard, scoped to this candidate's Applications and Interviews.

**3. Full log table** — the part that differs from the main dashboard: a complete, chronological, date-range-filterable table of every report entry logged for this candidate (date, applications count, interviews count, offers count, notes, logged by). This is the detailed audit log the main dashboard intentionally omits.

- Date range picker (e.g. last 7 days / last 30 days / custom range) filters the table.
- Include the "Add report" action here too (per FR-8.3), so a recruiter can log a new entry without leaving this screen.

### Navigation

- Back button/breadcrumb returns to the candidate's Reports tab (not the main dashboard).
- This screen should feel like a "zoomed in" version of the main dashboard pattern applied to one candidate — reuse the stat-row and chart components you build for Screen 1 rather than rebuilding them, just with different data scoping and the additional full-log table.

## Data & role scoping

- All queries for a recruiter's dashboard must be scoped server-side to `assigned_recruiter_id = current_user.id` — never trust a client-side filter alone.
- Admin "All recruiters" view aggregates across all `candidate_profiles`; admin viewing a specific recruiter uses the same scoping a recruiter would see.
- Today/Week/Month figures should be computed from the `applications` and `report_entries` tables (per the data model in the main spec), using the application's/entry's date field, not creation timestamp, if they can differ.

Start by building the stat-row and chart components as shared, reusable pieces, then compose Screen 1, then Screen 2.
