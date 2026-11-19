# Financial workspace

seed: none (pinned)

## Scope and mode
Operate. Nine agreed pages for a sole business owner. Desktop-first, responsive.

## Visual authority
The user chose Geist and supplied the maney logo and icon. Keep white and neutral light-gray surfaces, with lime only for relevant primary actions, active navigation and important notices. No other accent colors, tinted page backgrounds or colored monetary values. Use Geist Sans and tabular amounts. Follow the reference at https://vercel.com/geist/introduction.

## First viewport
A compact sidebar with the supplied maney logo, five financial routes and supporting cadastros. Page title, month selector and new-entry action. Four white financial summaries precede equal neutral upcoming-payable and upcoming-receivable panels and a dedicated overdue table. Fictional-data notice is discoverable.

## Signature interaction
An account opens in a focus-managed side panel; settlement and reversal immediately recompute the list, account balance and reports. Drawers preserve context and support Escape.

## Content and constraints
Realistic synthetic Brazilian service-business entries around R$40k monthly; no invented customer claims. Local persistence survives reload. Transfers are report-neutral. DRE follows competence, cash follows settlements. No bank reconciliation.

## Responsive and states
Sidebar becomes a sheet, summaries stack, tables horizontally scroll inside their own regions. Keyboard navigation, visible focus, empty/error/loading states and reduced motion. Record limits for demo attachments and explain local data persistence in Settings.

## Direction contract

THESIS: Give a single service-business owner a dependable financial workspace: the approved five financial pages and four supporting pages, with a persistent sidebar, legible tables and context-preserving side panels.

OWN-WORLD: The user pinned Geist, then selected the name maney and supplied the artwork. The latest palette instruction supersedes earlier color choices: white/light gray surfaces, neutral text and lime as the only accent for relevant highlights. Financial status uses explicit labels and distinct icons. Preserve the supplied logo gradient only inside the artwork.

STORY: The owner sees available cash, upcoming commitments and competence-based profit, then opens the transactions behind the numbers. Entries are reused across the ledger and reports.

FIRST VIEWPORT: 238px desktop sidebar with the actual maney logo, a top collapse control and persisted 76px icon rail using the supplied icon; compact top navigation; subtitle-free title/month/action row; four white summary cards; actionable overdue notice; two equal neutral next-payable/receivable panels. Lime marks primary actions, the active route and overdue badge. A dedicated overdue table continues below. Mobile uses full-label navigation and stacks content.

FORM: seed: none (pinned). The user accepted the earlier page/table/sidebar/side-panel structure and explicitly selected Geist, desktop-priority responsive web, individual use and fictional data. The implementation follows that approved structure code-first.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance


Brand update: use the supplied `maney logo novo.png` and `favicon.png`. The interface uses white and neutral light-gray surfaces; lime is the only accent and is reserved for relevant actions and selection. Financial amounts and ordinary states stay neutral and retain explicit labels/icons. Existing browser database and sidebar preference identifiers are preserved for compatibility.


Latest dashboard behavior: the separate overdue table is removed; overdue accounts are shown first inside the upcoming panels, including carry-over from older months. Explicit custom ranges use exact inclusive boundaries. Current-week dates use Portuguese weekday names, Monday through Sunday. The top date filter supports start/end dates and presets, shared across overview, ledger, cash flow and DRE; competence and settlement dates remain distinct. The reminder toggles an overdue-only view. The available balance uses lime, panel headers use near-black, and other surfaces remain white/light gray. Sidebar implementation: adapted official ReactFrame MIT source with scoped CSS and keyboard/rail behavior.
