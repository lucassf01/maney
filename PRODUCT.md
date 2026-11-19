# maney

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Vercel and Supabase are user-selected. Next.js App Router, React and TypeScript implement the responsive web app. Supabase stores financial data for the authenticated account across devices.

## Users

Lucas is the sole user, owner of a marketing and software development business with approximately R$40,000 in monthly revenue. Desktop use has priority, with mobile access.

## Product Purpose

Manage accounts payable and receivable and understand cash availability and monthly profitability with minimal administration.

## Capabilities and Constraints

Five primary pages: overview, payables, receivables, cash flow and management income statement (DRE). Supporting pages: contacts, financial accounts, financial categories and settings. Recurrences, installments, partial settlements, reversals, attachments, history, search, filters, batch categorization, import/export and backups remain in scope. Bank reconciliation is explicitly excluded. No stock, CRM, task management or payment execution. Single company and BRL. Competence, due date and settlement date are distinct. Transfers, initial balances, owner capital and profit distributions must not distort operating results. Project and service labels allow direct contribution margin without allocating overhead.

## Brand Commitments

Use Vercel Geist design system: https://vercel.com/geist/introduction. The confirmed product name is maney, with the user-supplied logo and icon. Interface language is Brazilian Portuguese. White and neutral light gray are the base; lime green is the only accent, reserved for relevant actions, selection and notices. Financial states use explicit labels and icons. Page subtitles and the company switcher are removed; the desktop sidebar supports a persisted icon rail. The overview prioritizes upcoming payables and receivables.

## Evidence on Hand

Use an empty workspace initially. A real Bling export for paid receivables is available as the first import layout. Supabase Auth verifies the session on the server. The existing IndexedDB workspace can seed the cloud workspace for the original account.

## Product Principles

- Enter information once and reuse it in balances, cash flow and DRE.
- Expose the transactions behind every report number.
- Keep frequent actions quick and recoverable.
- Prefer a small, understandable feature set.

Brand update: use the supplied `maney logo novo.png` and `favicon.png`. The interface uses white and neutral light-gray surfaces; lime is the only accent and is reserved for relevant actions and selection. Financial amounts and ordinary states stay neutral and retain explicit labels/icons. Existing browser database and sidebar preference identifiers are preserved for compatibility.

Latest dashboard behavior: the separate overdue table is removed; overdue accounts are shown first inside the upcoming panels, including carry-over from older months. Explicit custom ranges use exact inclusive boundaries. Current-week dates use Portuguese weekday names, Monday through Sunday. The top date filter supports start/end dates and presets, shared across overview, ledger, cash flow and DRE; competence and settlement dates remain distinct. The reminder toggles an overdue-only view. The available balance uses lime, panel headers use near-black, and other surfaces remain white/light gray. Sidebar implementation: adapted official ReactFrame MIT source with scoped CSS and keyboard/rail behavior.
