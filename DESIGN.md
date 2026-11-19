---
name: "maney"
description: "A clear, compact financial workspace built around the user-selected Geist visual system."
colors:
  surface: "#ffffff"
  sidebar: "#ffffff"
  subtle: "#fafafa"
  hover: "#f2f2f2"
  text: "#171717"
  muted: "#666666"
  border: "#e5e5e5"
  border-hover: "#c9c9c9"
  green: "#171717"
  red: "#171717"
  focus: "#171717"
  chart-secondary: "#a3a3a3"
  primary-hover: "#b4e331"
  nav-active: "#c5f34a"
  nav-text: "#666666"
  success-text: "#171717"
  success-surface: "#f3f3f3"
  danger-text: "#171717"
  danger-surface: "#c5f34a"
  warning-text: "#171717"
  warning-surface: "#f3f3f3"
  pending-surface: "#f2f2f2"
  neutral-surface: "#f4f4f4"
  neutral-border: "#e8e8e8"
  attention-text: "#171717"
  attention-surface: "#fafafa"
  attention-border: "#e5e5e5"
  danger-button-surface: "#f9f9f9"
  danger-button-border: "#d2d2d2"
  selection-surface: "#f3f3f3"
  batch-surface: "#f3f3f3"
  batch-border: "#e5e5e5"
  canvas: "#f7f7f7"
  brand: "#c5f34a"
  brand-hover: "#b4e331"
  brand-ink: "#171717"
  brand-soft: "#f3f3f3"
  receivable: "#171717"
  receivable-soft: "#ffffff"
  payable: "#171717"
  payable-soft: "#ffffff"
  chart-primary: "#333333"
typography:
  headline:
    fontFamily: "Geist Sans, Arial, sans-serif"
    fontSize: "26px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Geist Sans, Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "-0.015em"
  sheet-title:
    fontFamily: "Geist Sans, Arial, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.6
    letterSpacing: "-0.4px"
  body:
    fontFamily: "Geist Sans, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  body-small:
    fontFamily: "Geist Sans, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Geist Sans, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.5
  button:
    fontFamily: "Geist Sans, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: "20px"
  caption:
    fontFamily: "Geist Sans, Arial, sans-serif"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.5
  table-head:
    fontFamily: "Geist Sans, Arial, sans-serif"
    fontSize: "11px"
    fontWeight: 450
    lineHeight: 1.5
  metric:
    fontFamily: "Geist Sans, Arial, sans-serif"
    fontSize: "25px"
    fontWeight: 550
    lineHeight: 1.4
    letterSpacing: "-0.8px"
    fontFeature: "\"tnum\" 1"
  entry-amount:
    fontFamily: "Geist Sans, Arial, sans-serif"
    fontSize: "34px"
    fontWeight: 550
    lineHeight: 1.3
    letterSpacing: "-1px"
    fontFeature: "\"tnum\" 1"
  badge:
    fontFamily: "Geist Sans, Arial, sans-serif"
    fontSize: "10px"
    fontWeight: 500
    lineHeight: "16px"
  count-tiny:
    fontFamily: "Geist Sans, Arial, sans-serif"
    fontSize: "8px"
    fontWeight: 500
    lineHeight: 1.5
  summary-mobile:
    fontFamily: "Geist Sans, Arial, sans-serif"
    fontSize: "21px"
    fontWeight: 500
    lineHeight: 1.5
  wordmark:
    fontFamily: "Geist Sans, Arial, sans-serif"
    fontSize: "28px"
    fontWeight: 500
    lineHeight: 1.5
  wordmark-compact:
    fontFamily: "Geist Sans, Arial, sans-serif"
    fontSize: "30px"
    fontWeight: 500
    lineHeight: 1.5
rounded:
  counter: "4px"
  badge: "5px"
  control: "6px"
  group: "7px"
  feedback: "8px"
  panel: "9px"
spacing:
  micro: "4px"
  compact: "8px"
  control-gap: "10px"
  small: "12px"
  mobile-gutter: "16px"
  section: "20px"
  panel-inset: "23px"
  tablet-gutter: "24px"
  heading-gap: "28px"
  desktop-gutter: "34px"
  desktop-top: "36px"
components:
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.brand-ink}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "7px 12px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "7px 12px"
    height: "36px"
  button-secondary-hover:
    backgroundColor: "{colors.subtle}"
  button-danger:
    backgroundColor: "{colors.danger-button-surface}"
    textColor: "{colors.red}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "7px 12px"
    height: "36px"
  button-text:
    textColor: "{colors.text}"
    typography: "{typography.button}"
    padding: "4px 0px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    padding: "8px 10px"
    height: "36px"
  nav-item:
    textColor: "{colors.nav-text}"
    rounded: "{rounded.control}"
    padding: "9px 11px"
    height: "38px"
  nav-item-active:
    backgroundColor: "{colors.nav-active}"
    textColor: "{colors.text}"
  panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.panel}"
  badge-success:
    backgroundColor: "{colors.success-surface}"
    textColor: "{colors.success-text}"
    typography: "{typography.badge}"
    rounded: "{rounded.badge}"
    padding: "3px 7px"
  badge-danger:
    backgroundColor: "{colors.danger-surface}"
    textColor: "{colors.danger-text}"
    typography: "{typography.badge}"
    rounded: "{rounded.badge}"
    padding: "3px 7px"
  badge-warning:
    backgroundColor: "{colors.warning-surface}"
    textColor: "{colors.warning-text}"
    typography: "{typography.badge}"
    rounded: "{rounded.badge}"
    padding: "3px 7px"
  badge-pending:
    backgroundColor: "{colors.pending-surface}"
    textColor: "{colors.nav-text}"
    typography: "{typography.badge}"
    rounded: "{rounded.badge}"
    padding: "3px 7px"
  badge-neutral:
    backgroundColor: "{colors.neutral-surface}"
    textColor: "{colors.nav-text}"
    typography: "{typography.badge}"
    rounded: "{rounded.badge}"
    padding: "2px 7px"
  financial-table:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.body-small}"
  sheet:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    width: "550px"
  sheet-wide:
    width: "960px"
---

# Design System: maney

## Overview

**North star: The Clear Ledger.**

maney is a desktop-first financial workspace using Geist foundations. Surfaces are strictly white and neutral light gray, with black/gray typography. Lime green is the only interface accent, reserved for primary actions, the active navigation item, and important overdue notices. The overview available-balance card is lime; other cards and the page stay neutral. Upcoming-panel headers are near-black.

The user-supplied maney logo novo.png is the wordmark, and favicon.png is the compact mark and source of the browser/app icons. Preserve the artwork and its proportions. The gradient inside this supplied artwork is not a general UI treatment.

Page subtitles and the company switcher remain removed. The overview uses equal upcoming-payable and upcoming-receivable panels, with overdue accounts included in their respective lists and no separate overdue table. Local records and layout preference keep their existing storage identifiers so the rebrand preserves data.

## Colors

### Primary

**Lime** (brand, #c5f34a) is the only accent. Primary buttons pair it with near-black text; active navigation uses the same lime. Its hover shade is #b4e331.

### Neutral

Use white for sidebar, cards, sheets and controls; #f7f7f7 for the page canvas; #fafafa for subtle grouped surfaces; #e5e5e5 for rules; #171717 for text and #666666 for secondary text. There are no tinted green page backgrounds, no red/amber/blue state palettes, and no colored financial amounts.

### State and data

Paid, pending, partial and cancelled states use neutral badges with explicit labels and distinct icons. Overdue labels may use a small lime badge. Errors remain explicit through text and alert icons. Charts use neutral solid/dashed lines, with lime marker fills for selected data emphasis. Never rely on color alone to communicate financial meaning.

## Typography

**Display and body font:** Geist Sans, falling back to Arial and sans-serif. The local Geist package registers the font in the root layout. Geist Mono is also loaded, but no current interface selector assigns it to a content role; do not infer a monospaced amount style.

**Character:** compact, legible and understated. The hierarchy is intentionally narrow for repeated daily operations; there is no marketing hero or display-face pairing. Typeface roles below describe the default desktop implementation, with responsive overrides recorded in Layout.

### Hierarchy

- **Headline** (`headline`): page title, semibold with tightened tracking.
- **Title** (`title`): panel heading. **Sheet title** (`sheet-title`) is slightly larger to establish a transient task.
- **Body** (`body`): global reading baseline. Paragraphs use a more relaxed line height (1.6).
- **Small body** (`body-small`): table rows and detailed financial metadata.
- **Label** (`label`): form labels. **Button** (`button`) sets the compact control text; inputs share its size and line height with normal input weight.
- **Caption** (`caption`): helper and secondary text. Table headers use the quieter `table-head` weight.
- **Metric** (`metric`): summary amount. **Entry amount** (`entry-amount`) is the largest functional text in the detail sheet. Both use tabular numerals.
- **Badge** (`badge`): short status text with an accompanying dot.

There is no mathematical type-scale ratio: sizes follow the observed roles. Supporting navigation and metadata also use small intermediate values in the source; do not promote every one-off label into a new global role. Text uses sentence case except for ordinary abbreviations such as BRL and DRE.

**The The Aligned Amounts Rule.** Use tabular numerals, prevent amounts from wrapping and right-align comparable financial columns. Keep Brazilian number formatting consistent.

## Layout

The desktop shell uses the attributed ReactFrame Sidebar source, adapted to scoped CSS and maney branding. The shell is 260px wide or 88px collapsed (component widths236px/64px), with a persisted controlled state, animated active item, rail tooltips, grouped sections, user footer and keyboard navigation. The full maney logo appears in expanded navigation; the supplied icon replaces it in the rail. ReactFrame MIT attribution is retained in third-party-notices/ReactFrame-LICENSE. At 800px and below, the full-label navigation opens as a mobile modal.

Main content is capped at 1600px with 34px desktop gutters. Page headers contain a title and relevant controls, without subtitles. Four separate summary cards use 14px gaps; only the overview available-balance card has a lime background. The overview has equal upcoming-payable and upcoming-receivable panels; each shows five open accounts ordered by due date, carrying older overdue entries forward in monthly mode, in order, and totals only the displayed entries. The panels stack at 950px. Overdue accounts stay inside the two panels; there is no separate overdue table.

The top bar shares the content's centered 1600px maximum width and responsive `--page-gutter` (34/24/20/16px). Its background is the page canvas gray, without a full-width white strip or bottom rule. Breadcrumb and right-side actions align with the content edges, including the collapsed sidebar layout.

The nine-page topology remains overview, payables, receivables, cash flow, DRE, contacts, financial accounts, categories and settings. Dense tables scroll within their own containers. Mobile summaries form a two-by-two grid. Financial rules and flows are unchanged.

## Elevation & Depth

Permanent white surfaces use fine gray borders on the light gray canvas. Keep these flat; reserve restrained offset shadows for transient sheets, tooltips and toasts. Backdrops use neutral black transparency.

## Shapes

Controls use gently curved rectangular corners (`rounded.control`); panels use 9px corners and independent summary cards use 10px corners. Badges, count markers and segmented controls use the smaller related steps. Sheets meet the screen edge with square outer corners. Avatars and status dots are circular; status badges themselves remain compact rectangles.

Borders are generally one pixel. Tabs use a two-pixel active underline; focus uses a two-pixel olive-green outline with a three-pixel outer offset, reduced to one pixel for form fields. Dashed dividers distinguish projections from current balances. Clipping belongs to the containing panel or scroll region; financial values remain unbroken.

## Components

### Brand

Use the supplied wordmark at 130px width with automatic height. The compact icon is 30px wide. White navigation avoids a visible box around the supplied opaque white PNG. Startup reuses the real logo; the footer and document title use the name maney. The browser favicon and apple-touch icon are derived from the supplied icon without redrawing or recoloring it.

### Actions and navigation

Primary actions use lime with near-black labels. Secondary actions remain white/gray. The active sidebar link uses lime with a readable label or accessible icon name. Other links and backgrounds are neutral. Retain the top sidebar toggle, persistence, keyboard focus and mobile menu.

### Financial summaries and upcoming panels

Summary cards are white except the lime overview available balance. Upcoming-panel headers use #171717 with white labels and lime icon accents. Payables and receivables are distinguished by titles, arrow icons, values and due dates, not separate color families. Rows open the existing transaction sheet.

### Status and feedback

Each transaction badge pairs its text with a distinct icon: check for settled, clock for open, alert for overdue, circle for partial, barred circle for cancelled. Overdue is a relevant small lime highlight. Validation messages, destructive actions and notifications use explicit copy and neutral iconography.

### Tables and forms

Preserve right-aligned tabular BRL values, compact controls, visible neutral focus rings, accessible field labels, report drill-down and native modal focus/Escape handling. Entry sheets retain their 550px/960px widths and internally scroll on mobile. Motion stays brief and reduced-motion preferences are honored.

## Do's and Don'ts

### Do:

- Use the actual maney artwork supplied by the user.
- Keep page, card and sidebar surfaces neutral gray or white.
- Reserve lime for primary actions, active selection, the requested balance highlight and important notices.
- Communicate financial state using readable labels, amounts and distinct icons.
- Preserve existing local data and responsive workflows.

### Don't:

- Introduce other accent colors, colored monetary values or pale green page backgrounds.
- Fill every financial card with lime or use it as decoration.
- Recreate the logo in text or redraw the icon.
- Remove financial meaning when removing color; keep labels, symbols and icons.


Latest dashboard behavior: the separate overdue table is removed; overdue accounts are shown first inside the upcoming panels, including carry-over from older months. Explicit custom ranges use exact inclusive boundaries. Current-week dates use Portuguese weekday names, Monday through Sunday. The top date filter supports start/end dates and presets, shared across overview, ledger, cash flow and DRE; competence and settlement dates remain distinct. The reminder toggles an overdue-only view. The available balance uses lime, panel headers use near-black, and other surfaces remain white/light gray. Sidebar implementation: adapted official ReactFrame MIT source with scoped CSS and keyboard/rail behavior.
