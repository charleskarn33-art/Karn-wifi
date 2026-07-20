-- 0008_rls_policies.sql
-- Row Level Security: users only ever see/touch what their role permits.
-- Table-level policies define WHO can read/write which ROWS; the detailed
-- workflow state-machine rules live in the BEFORE UPDATE trigger functions
-- (enforce_income_workflow / enforce_expense_workflow) defined earlier.

alter table public.profiles enable row level security;
alter table public.income enable row level security;
alter table public.expenses enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_log enable row level security;

-- ---------------------------------------------------------------------
-- profiles: everyone signed in can read (needed to show "recorded by"
-- names); users may update their own non-privileged fields; only admins
-- may update any profile (role/active flag changes are additionally
-- blocked for non-admins by the guard_profile_privileges trigger).
-- ---------------------------------------------------------------------
create policy profiles_select_authenticated
on public.profiles for select
to authenticated
using (true);

create policy profiles_update_self
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy profiles_update_admin
on public.profiles for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- No INSERT/DELETE policies: profile rows are created by the
-- handle_new_user trigger and removed only via cascade from auth.users,
-- both of which run as SECURITY DEFINER / superuser and bypass RLS.

-- ---------------------------------------------------------------------
-- income: staff see only their own entries; managers/admins see all.
-- ---------------------------------------------------------------------
create policy income_select
on public.income for select
to authenticated
using (recorded_by = auth.uid() or public.is_manager_or_admin());

create policy income_insert
on public.income for insert
to authenticated
with check (recorded_by = auth.uid() and status = 'draft');

create policy income_update
on public.income for update
to authenticated
using (recorded_by = auth.uid() or public.is_manager_or_admin())
with check (recorded_by = auth.uid() or public.is_manager_or_admin());

create policy income_delete
on public.income for delete
to authenticated
using ((recorded_by = auth.uid() and status = 'draft') or public.is_admin());

-- ---------------------------------------------------------------------
-- expenses: staff see only their own; managers/admins see all (managers
-- need visibility into all expenses to review them at the manager stage).
-- ---------------------------------------------------------------------
create policy expenses_select
on public.expenses for select
to authenticated
using (requested_by = auth.uid() or public.is_manager_or_admin());

create policy expenses_insert
on public.expenses for insert
to authenticated
with check (requested_by = auth.uid() and status = 'draft');

create policy expenses_update
on public.expenses for update
to authenticated
using (requested_by = auth.uid() or public.is_manager_or_admin())
with check (requested_by = auth.uid() or public.is_manager_or_admin());

create policy expenses_delete
on public.expenses for delete
to authenticated
using ((requested_by = auth.uid() and status = 'draft') or public.is_admin());

-- ---------------------------------------------------------------------
-- notifications: strictly private to the recipient.
-- ---------------------------------------------------------------------
create policy notifications_select_own
on public.notifications for select
to authenticated
using (user_id = auth.uid());

create policy notifications_update_own
on public.notifications for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy notifications_delete_own
on public.notifications for delete
to authenticated
using (user_id = auth.uid());

-- No direct INSERT policy: notifications are only created by the
-- SECURITY DEFINER notify_*_status_change triggers.

-- ---------------------------------------------------------------------
-- audit_log: read-only, visible to managers/admins only. Written
-- exclusively by the SECURITY DEFINER log_audit_event trigger.
-- ---------------------------------------------------------------------
create policy audit_log_select_reviewers
on public.audit_log for select
to authenticated
using (public.is_manager_or_admin());
