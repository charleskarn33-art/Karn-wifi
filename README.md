# WiFi Business Finance Manager

A production-ready web app for tracking WiFi hotspot business income and expenses, with a full multi-role approval workflow, reporting/export, notifications, and a complete audit trail.

Built with **Next.js 15** (App Router), **TypeScript**, **Tailwind CSS v4**, and **Supabase** (PostgreSQL, Auth, Storage, Realtime). Mobile-first, installable as a PWA, glassmorphism UI, light/dark mode.

## Features

- **Auth & roles** — Email/password auth via Supabase, three roles: `admin`, `manager`, `staff`.
- **Dashboard** — Income today/this month, expenses, net profit, pending counts, daily/weekly/monthly trend charts.
- **Income module** — Draft → Submit → Approved/Rejected, with search, filters, pagination.
- **Expense module** — Draft → Submit → Manager Approval → Admin Approval → Reports, with receipt upload to private Supabase Storage.
- **Approvals inbox** — Unified queue for managers/admins to approve or reject pending items.
- **Reports** — Daily/weekly/monthly & custom-range Profit and Loss, export to Excel (`.xlsx`) and PDF.
- **Notifications** — Realtime in-app notifications for pending approvals, approvals, and rejections.
- **Audit log** — Every create/update/submit/approve/reject/delete recorded with actor, timestamp, and before/after data.
- **Security** — PostgreSQL Row Level Security everywhere; approval-workflow integrity enforced by database triggers (not just app code).
- **PWA** — Installable, offline fallback page, app manifest and icons.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router, Server Components, Route Handlers) |
| Language | TypeScript |
| Styling | Tailwind CSS v4, custom glassmorphism theme, `next-themes` |
| Backend | Supabase (PostgreSQL, Auth, Storage, Realtime) |
| Forms/validation | `react-hook-form` + `zod` |
| Charts | `recharts` |
| Export | `xlsx` (Excel), `jspdf` + `jspdf-autotable` (PDF) |
| Notifications UI | `sonner` |

## Folder structure

```
src/
  app/
    (auth)/login/            Email/password sign-in
    (dashboard)/             Authenticated app shell + all feature pages
      dashboard/             Stats + trend charts
      income/                List, new, [id] detail/edit
      expenses/               List, new, [id] detail/edit
      approvals/              Manager/admin approval inbox
      reports/                P&L reports + Excel/PDF export
      notifications/          Notification center
      audit-log/               Audit trail (manager/admin)
      users/                  User management (admin)
      settings/               Profile, password, theme
    api/                      Route handlers (income, expenses, users, reports, audit-log)
    offline/                  PWA offline fallback page
  components/
    ui/                       Reusable primitives (Button, Card, Table, Modal, ...)
    layout/                   Sidebar, topbar, mobile nav, theme toggle
    income/ expenses/          Feature-specific forms/tables
    approvals/ audit/ notifications/ reports/ users/ settings/
    shared/                   Cross-feature components (DecisionActions)
    providers/                Theme, toast, service worker registration
  hooks/                      usePaginatedResource
  lib/
    supabase/                 Browser/server/admin Supabase clients + middleware session refresh
    validations/               Zod schemas
    export/                    Excel/PDF export helpers
    auth.ts dashboard.ts api-helpers.ts utils.ts
  types/database.ts            Hand-written types mirroring the SQL schema
supabase/
  migrations/                  Numbered SQL migrations (schema, RLS, triggers, storage)
  seed.sql                     Demo users + sample income/expense data
public/
  manifest.webmanifest, sw.js, icons/
```

## Database schema & workflow

- **`profiles`** — one row per Supabase auth user; `role` is `admin | manager | staff`. New signups always default to `staff` (never trusted from client metadata); only admins can promote/demote or (de)activate a user, enforced by a trigger.
- **`income`** — `draft → submitted → approved | rejected`. Any manager or admin can approve/reject.
- **`expenses`** — `draft → submitted → manager_approved → approved | rejected`. Managers approve the first stage; only admins give final approval that lands the expense in reports.
- **`notifications`** — written only by triggers (pending approval → reviewers, approved/rejected → the submitter).
- **`audit_log`** — append-only, written only by a `SECURITY DEFINER` trigger on `income`, `expenses`, and `profiles`; readable by managers/admins only.

Row visibility (who can `SELECT` which rows) is enforced by **RLS policies**. The approval **state machine** (who may transition a record from one status to another, and what fields lock once a stage is reached) is enforced by **`BEFORE UPDATE` trigger functions** (`enforce_income_workflow`, `enforce_expense_workflow`) — this keeps the workflow rules airtight even if a client attempted to call the API directly, bypassing the UI.

See `supabase/migrations/` for the full schema, numbered in apply order.

## Getting started

### 1. Create a Supabase project

Create a project at [supabase.com](https://supabase.com), then grab the following from **Project Settings → API**:

- Project URL
- `anon` public key
- `service_role` key (server-only, never expose to the browser)

### 2. Apply the database schema

Using the [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push          # applies everything in supabase/migrations/
```

To also load demo data (local/dev only — creates 3 test accounts):

```bash
npx supabase db reset         # local dev database only, re-applies migrations + seed.sql
```

For a hosted project, you can instead run `supabase/seed.sql` once via the SQL editor in the Supabase dashboard (safe to skip in production).

Demo accounts (password `Passw0rd!` for all): `admin@karnwifi.test`, `manager@karnwifi.test`, `staff@karnwifi.test`.

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` from step 1.

### 4. Install dependencies & run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to `/login`.

> Public self-signup is intentionally not exposed in the UI — an admin creates accounts (with a role) from **Users**, which uses the Supabase service role key server-side. To bootstrap your very first admin, sign up any user in the Supabase Auth dashboard (or run `supabase/seed.sql`), then run this once in the SQL editor:
> `update public.profiles set role = 'admin' where email = 'you@example.com';`

### 5. Enable Realtime (for live notifications)

The `notifications`, `income`, and `expenses` tables are added to the `supabase_realtime` publication in `supabase/migrations/0009_realtime.sql`. If you created the project before applying migrations, this is handled automatically; otherwise ensure Realtime is enabled for the project in **Database → Replication**.

## Scripts

```bash
npm run dev          # start dev server (Turbopack)
npm run build         # production build
npm run start         # start production server
npm run lint          # ESLint
npm run type-check    # tsc --noEmit
```

## Deployment (Vercel)

1. Push this repository to GitHub.
2. Import it in [Vercel](https://vercel.com/new).
3. Add the environment variables from `.env.local.example` in the Vercel project settings (Production + Preview).
4. Deploy. Vercel auto-detects Next.js; no extra config needed.
5. In Supabase, add your deployed domain to **Authentication → URL Configuration → Redirect URLs** (and set `NEXT_PUBLIC_SITE_URL` accordingly) if you later add magic-link/OAuth flows.

The app is also deployable to any Node.js host that supports Next.js (Docker, Railway, Render, etc.) via `npm run build && npm run start`.

## Security notes

- The `service_role` key is only ever used server-side (`src/lib/supabase/admin.ts`, guarded by the `server-only` package) for the two admin operations that require it: creating a new auth user and deleting one. Every other read/write goes through the session-scoped client and is subject to RLS.
- Storage receipts live in a **private** bucket; access is scoped per-user by folder (`{user_id}/...`) with managers/admins additionally allowed to read all receipts for review.
- Rejection reasons are required by the database trigger, not just client-side validation — an approver cannot reject without a reason even via a direct API call.
