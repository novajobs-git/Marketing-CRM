---
name: Recruitment CRM
description: Nova Staffs' internal recruiting operations tool — calm, precise, unshowy.
colors:
  system-blue: "oklch(0.55 0.211 260)"
  primary-foreground: "oklch(0.99 0 0)"
  background: "oklch(0.995 0 0)"
  foreground: "oklch(0.145 0 0)"
  card: "oklch(1 0 0)"
  secondary: "oklch(0.97 0 0)"
  secondary-foreground: "oklch(0.205 0 0)"
  muted-foreground: "oklch(0.556 0 0)"
  accent: "oklch(0.96 0.02 260)"
  accent-foreground: "oklch(0.35 0.12 260)"
  border: "oklch(0.928 0 0)"
  destructive: "oklch(0.577 0.245 27.325)"
  success: "oklch(0.696 0.17 162.48)"
  warning: "oklch(0.795 0.184 86.047)"
  info: "oklch(0.606 0.25 292.717)"
  status-applied: "oklch(0.94 0.02 250)"
  status-interview: "oklch(0.94 0.05 80)"
  status-assessment: "oklch(0.94 0.03 300)"
  status-offer: "oklch(0.94 0.04 150)"
  status-rejected: "oklch(0.94 0.03 25)"
  status-withdrawn: "oklch(0.94 0 0)"
  avatar-blue: "oklch(0.9 0.05 250)"
  avatar-coral: "oklch(0.9 0.06 25)"
  avatar-green: "oklch(0.9 0.06 150)"
  avatar-gold: "oklch(0.91 0.07 80)"
  avatar-violet: "oklch(0.9 0.06 300)"
  avatar-teal: "oklch(0.9 0.05 190)"
typography:
  headline:
    fontFamily: "Google Sans, -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', sans-serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Google Sans, -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "Google Sans, -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Google Sans, -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    letterSpacing: "0.03em"
rounded:
  sm: "0.375rem"
  md: "0.5rem"
  lg: "0.875rem"
  xl: "1rem"
  2xl: "1.25rem"
  3xl: "1.5rem"
  4xl: "2rem"
  full: "9999px"
components:
  button-primary:
    backgroundColor: "{colors.system-blue}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.full}"
    padding: "0 10px"
    height: "32px"
  button-primary-hover:
    backgroundColor: "{colors.foreground}"
    textColor: "{colors.background}"
  badge-default:
    backgroundColor: "{colors.system-blue}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.4xl}"
    padding: "2px 8px"
    height: "20px"
  card:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.xl}"
    padding: "16px"
  input:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    height: "32px"
    padding: "0 10px"
---

# Design System: Recruitment CRM

## Overview

**Creative North Star: "The Quiet Operator"**

This is Nova Staffs' internal recruiting operations tool, not a marketing surface — recruiters and admins live in it all day, so the design's job is to disappear and let the work show through. One restrained accent (System Blue) carries every signal of action and focus; everything else stays neutral, flat, and quiet. Status and identity are color-coded, but deliberately desaturated, so the eye reads structure and activity, never noise.

The aesthetic is calm, precise, and unshowy — closer to an iOS system app than a dashboard product. Surfaces stay flat at rest, corners are generously and consistently rounded, and typography leans on scale and weight contrast rather than color to establish hierarchy. It explicitly rejects the generic dense enterprise-SaaS look: no heavy gray chrome, no cramped zebra tables, no shouting for attention. Interaction feedback (hover inversion, a sliding directional arrow, a 1px press) gives the restraint a pulse instead of making it feel inert.

**Key Characteristics:**
- Single accent color (System Blue), used sparingly and only for action/focus/active state
- Flat surfaces (ring/border, not shadow) at rest; shadow reserved for content that floats above the page
- Muted, desaturated semantic color families for status badges and person-avatars, never saturated brights
- Generous, consistent corner rounding across buttons, cards, badges, and avatars
- Tabular-numeral stat tiles and uppercase tracking-wide eyebrow labels for structure without added color or weight

## Colors

The palette is almost entirely neutral, with one accent doing all the work and two small desaturated families (status, avatar) providing quiet differentiation.

### Primary
- **System Blue** (`oklch(0.55 0.211 260)`, ≈ #2F5FDB): the only saturated color in the system. Used for primary buttons, links, the active sidebar/nav item, focus rings, and the "active" filter-view state. Its hover state inverts to near-black/near-white (`foreground`/`background`) rather than a darker blue — hover reads as "engaged," not "still blue."

### Neutral
- **Paper White** (`oklch(0.995 0 0)`): app background.
- **Near-Black Ink** (`oklch(0.145 0 0)`): primary text/foreground.
- **Card White** (`oklch(1 0 0)`): card, dialog, and popover surfaces — one step brighter than the page background so surfaces read as lifted without a shadow.
- **Quiet Gray** (`oklch(0.97 0 0)`): secondary/muted fills — secondary buttons, muted backgrounds, table footer, hover states.
- **Hairline Border** (`oklch(0.928 0 0)`): all borders, dividers, and input strokes.
- **Muted Ink** (`oklch(0.556 0 0)`): secondary/placeholder text.
- **Accent Wash** (`oklch(0.96 0.02 260)`): a near-invisible tint of System Blue used only as the active-state background for sidebar/nav items and filter pills — never as a standalone fill.

### Semantic
- **Destructive Red** (`oklch(0.577 0.245 27.325)`): used at low opacity (`/10`, `/20`) as a background tint for destructive buttons/badges, never as a solid fill — matches the system's "nothing shouts" rule.
- **Success / Warning / Info**: exist as a supporting semantic trio (emerald / amber / violet) but are lightly used today — reserve for genuinely confirmatory or cautionary moments, not decoration.

### Status family (muted, one hue per application stage)
- **Applied** (blue, hue 250), **Interview** (gold, hue 80), **Assessment** (violet, hue 300), **Offer** (green, hue 150), **Rejected** (red-orange, hue 25), **Withdrawn** (neutral gray) — each a `~0.94` lightness / low-chroma background with a matching `~0.4` lightness foreground. This family exists as a complete token set in the theme; the current build renders application-status badges with the plain neutral `secondary` badge variant rather than this per-status coloring (see Components → Badges and Do's and Don'ts).

### Avatar family (muted, deterministic per person)
Six hues (blue, coral, green, gold, violet, teal) at the same `~0.9` lightness / low-chroma recipe as the status family, hashed per name so the same person always gets the same color. Same visual family as status colors by design — one desaturated-hue recipe reused for two different "which bucket is this" problems.

### Named Rules
**The One Accent Rule.** System Blue is the only saturated color allowed anywhere in the interface. Every other color — status, avatar, semantic — is desaturated to roughly the same low-chroma recipe. If a new color is needed, it must fit that recipe, not introduce new saturation.

**The Tint-Never-Fill Rule.** Destructive and accent-wash colors are applied as low-opacity tints or `/10`–`/20` backgrounds, never as solid saturated fills outside the primary button/badge.

## Typography

**Body/UI Font:** Google Sans (self-hosted via `next/font/google`), falling back to `-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", sans-serif`.
**Mono Font:** Google Sans Code, used for `--font-mono`.

**Character:** A single system-native-feeling sans serif at every size — hierarchy comes from scale and weight jumps, not from mixing families. It should feel like it belongs on the same OS as the iOS-blue accent.

### Hierarchy
- **Headline** (font-semibold, 1.875rem/30px, tracking tight): every page's `<h1>` title (e.g. "Candidate profiles", "Welcome, {name}"). One per page, top-left, never centered.
- **Title** (font-bold, 1.125rem/18px): dialog titles. Card titles use a quieter step: font-semibold, 1rem/16px.
- **Body** (font-normal, 0.875rem/14px): default UI text — table cells, form fields, descriptions.
- **Label** (font-medium, 0.75rem/12px, tracking wide, uppercase, muted-foreground color): section eyebrows ("Today's Applications", "Views") and small metadata captions — never used for anything clickable.
- **Stat numeral** (font-semibold, 2.25rem/36px, tracking tight, `tabular-nums`): the one place type gets genuinely large — daily-report and dashboard counts.

### Named Rules
**The Scale-Not-Color Rule.** Hierarchy is built with size and weight jumps (14→16→18→30px, normal→medium→semibold→bold), not with color or a second typeface. A heavier or larger element always outranks a colored one.

**The Tabular Numerals Rule.** Any numeral that represents a live count (applications, interviews, offers, stat tiles) renders with `tabular-nums` so digits don't shift width as they update.

## Layout

The app shell is a fixed 224px (`w-56`) left sidebar on desktop (logo, nav, user menu, quick-add), collapsing to a slide-out drawer plus a bottom/top mobile substitute below `lg`. The sidebar is `sticky` and full-height; content scrolls independently.

List/table pages (Dashboard, Profile Management, Recruiter Management, Reports) are full-width with no `max-w-*` cap on the outer container — tables should use the available width. Forms and detail/review pages (candidate detail, add-application, edit forms) cap their content at `max-w-3xl`–`max-w-5xl` for readability even though the page container itself stays full-width. Never mix the two: a list page with a capped container looks broken, and an uncapped form is unreadable.

Several list pages (Profile Management) carry a second, narrower left rail — a "Views" filter nav (`w-52`) with status tabs and live counts — distinct from the primary app sidebar. On screens below `md` it collapses from a vertical rail into a horizontal, scrollable pill row above the content, so filtering never disappears on mobile.

Page padding follows one rhythm: `px-4 py-6` → `sm:px-6` → `lg:px-8 lg:py-10`. Stat-tile rows use a `grid-cols-1 sm:grid-cols-3 gap-4` pattern. Content below a page's `<h1>`/subtitle block starts at `mt-8`; sub-sections within a page step down to `mt-6`.

### Named Rules
**The Two-Rail Rule.** A page never has more than two left-hand rails at once: the primary app sidebar, and optionally one page-local Views/filter rail. If a page needs more filtering than that, it goes in the toolbar row (search, chips), not a third rail.

## Elevation & Depth

Flat-by-default: cards, tables, and page surfaces are distinguished by a hairline `ring-1 ring-foreground/10` (or 1px border) and a one-step brighter background, never a `box-shadow`. Shadow is reserved as a structural signal for content that floats above the page's own stacking context: dialogs, popovers, dropdowns, and the calendar/date-picker overlay. That single overlay shadow (`--overlay-shadow`) is a soft, three-layer ambient shadow — it reads as "this is temporarily above everything," not as decoration on a resting surface.

### Shadow Vocabulary
- **Overlay** (`0 2px 8px rgba(0,0,0,.06), 0 -6px 12px rgba(0,0,0,.03), 0 14px 28px rgba(0,0,0,.08)`): dialogs, popovers, dropdown menus, date-picker calendar. The only shadow in the system.

### Named Rules
**The Flat-At-Rest Rule.** Nothing that sits in the page's normal flow — card, table, sidebar, stat tile — ever gets a `box-shadow`. If it needs to be distinguished, use a ring/border and a background-lightness step, not depth.

## Shapes

Corners are generous and consistent, scaling with the element's role rather than a single global radius: small interactive controls (buttons at non-default sizes, chips) sit around 8–14px, cards and dialogs sit at 16–20px, and the largest "hero" containers (login card wrapper, stat tiles) reach 20–24px. Primary buttons, badges, and avatars are fully pill-shaped (`rounded-full`/`9999px`) rather than radius-scaled — roundness itself signals "actionable, tappable, a person."

Borders are uniformly 1px hairlines in `--border`, used for structure (table containers, card rings, dividers) rather than as a design accent. Nothing in the system uses a hard square corner or a visible clip/mask shape.

## Components

### Buttons
- **Shape:** default variant is fully pill-shaped (`rounded-full`); all other sizes/variants use the 8–14px radius scale.
- **Primary (`default` variant):** System Blue background, near-white text. On hover, the entire button inverts to near-black background / near-white text (`hover:bg-foreground hover:text-background`) — not a shade of blue. Carries a signature micro-interaction: a small two-stroke arrow glyph that slides right and shifts color on hover, present only on this variant at non-icon sizes.
- **Interaction feedback:** every button variant presses down 1px on `:active` (`translate-y-px`) and shows a `ring-3` focus ring in the accent color on `:focus-visible` — restraint in color, but real tactile feedback on every press.
- **Secondary / Outline / Ghost / Destructive / Link:** share the same shape and press/focus feedback family; each stays flat-colored (no gradient, no shadow) and destructive uses a low-opacity red tint rather than a solid fill.

### Badges
- **Shape:** fully pill-shaped (`rounded-full`, 20px tall).
- **Candidate/profile status** (Active/Unassigned/Archived): uses the generic badge variant set — `success` (green) for Active, `outline` for Archived, `secondary` (neutral) for Unassigned.
- **Application status** (Applied/Interview/Assessment/Offer/Rejected/Withdrawn): currently renders with the flat neutral `secondary` badge variant everywhere it appears, even though a complete per-status color token family exists in the theme (see Colors → Status family). Treat that token family as the intended future state, not dead code.

### Cards / Containers
- **Corner Style:** 16px (`rounded-xl`) as the default; some standalone containers (stat tiles, the "needs review" panel, the login card) step up to 20px (`rounded-2xl`).
- **Background:** Card White, one step brighter than the page background.
- **Shadow Strategy:** none at rest (see Elevation & Depth); dialogs built on the same Card primitive pick up the overlay shadow only because they're portal-rendered above the page.
- **Border:** 1px hairline ring (`ring-foreground/10`) standing in for a border.
- **Internal Padding:** 16px default, 12px for the compact (`size="sm"`) variant. Footers (when present) get a top border and a muted background, visually separating actions from content.

### Inputs / Fields
- **Style:** transparent background, 1px hairline border, 14px (`rounded-lg`) corners, 32px height.
- **Focus:** border and ring shift to System Blue at 50% opacity — no background change, no glow.
- **Error / Disabled:** invalid fields get a destructive-colored border and ring; disabled fields drop to 50% opacity with a not-allowed cursor.

### Navigation
- **Primary sidebar (desktop):** icon + label rows, `rounded-lg` hit targets. Active item = Accent Wash background + System-Blue-tinted text; inactive = muted text, hairline-gray hover background. No underline, no left-border indicator — the wash fill is the only active signal.
- **Views filter rail:** same active/inactive language as the primary sidebar, plus a right-aligned live count per item. Collapses to horizontal pill chips (filled = active, muted = inactive) below `md`.
- **Mobile:** the primary sidebar is replaced by a drawer; the Views rail becomes a horizontal scrollable row — same states, different axis.

### Initials Avatar (signature component)
A circular, two-letter-initials badge in one of six muted hues, deterministically hashed from the person's name so the same recruiter or candidate always renders the same color anywhere they appear (tables, dashboards, the user menu). It's the system's one piece of "personality" — the same desaturated-hue recipe as status badges, applied to people instead of states.

## Do's and Don'ts

### Do:
- **Do** keep System Blue as the only saturated color in the interface — every other hue (status, avatar, semantic) stays in the same low-chroma, high-lightness recipe.
- **Do** keep cards, tables, and any at-rest surface flat (ring/border only); reserve the single overlay shadow for dialogs, popovers, and dropdowns.
- **Do** use `tabular-nums` on any numeral that represents a live, updating count.
- **Do** use the uppercase, tracking-wide, `muted-foreground` eyebrow-label pattern for section/group headers instead of a heavier headline.
- **Do** give primary (`default` variant) buttons the hover-invert + sliding-arrow treatment; keep every other button variant flat-colored with only the shared press/focus feedback.
- **Do** cap forms and detail/review pages at `max-w-3xl`–`max-w-5xl`; leave list/table pages full-width.

### Don't:
- **Don't** introduce a second saturated accent color. If something needs to stand out, use System Blue, weight, or size — not a new hue.
- **Don't** add `box-shadow` to anything that sits in the page's normal flow (cards, tables, sidebars, stat tiles) — that reads as generic enterprise-SaaS clutter, the explicit anti-reference for this system.
- **Don't** render a solid, fully-saturated fill for destructive or semantic colors — tint them, per the Tint-Never-Fill Rule.
- **Don't** mix typefaces for hierarchy. One family (Google Sans) at every weight/size step; contrast comes from scale, not font-switching.
- **Don't** add a `max-w-*` cap to a list/table page, or leave a form/detail page uncapped — both break the system's one layout-width convention.
