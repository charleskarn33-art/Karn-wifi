-- 0012_income_no_approval.sql
-- Income no longer needs a manager/admin approval step: an entry is now
-- recorded and counted immediately. Removes the draft -> submit -> approve
-- workflow trigger and its "pending approval" notifications, and updates
-- income RLS so only the owner or an admin can edit/delete a row (managers
-- keep read-only visibility into all income for reporting).
--
-- Existing rows that were explicitly rejected are left untouched (a
-- rejection was a deliberate judgment call and shouldn't be silently
-- reinstated); rows still sitting in draft/submitted limbo are promoted to
-- approved since that pending state no longer exists.

drop trigger if exists trg_notify_income_status_change on public.income;
drop function if exists public.notify_income_status_change();

drop trigger if exists trg_enforce_income_workflow on public.income;
drop function if exists public.enforce_income_workflow();

update public.income set status = 'approved' where status in ('draft', 'submitted');

alter table public.income alter column status set default 'approved';

create or replace function public.enforce_income_ownership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if old.recorded_by <> auth.uid() then
    raise exception 'You are not permitted to modify this income entry';
  end if;

  new.recorded_by := old.recorded_by;
  new.status := 'approved';
  return new;
end;
$$;

create trigger trg_enforce_income_ownership
before update on public.income
for each row execute function public.enforce_income_ownership();

drop policy if exists income_insert on public.income;
create policy income_insert
on public.income for insert
to authenticated
with check (recorded_by = auth.uid());

drop policy if exists income_update on public.income;
create policy income_update
on public.income for update
to authenticated
using (recorded_by = auth.uid() or public.is_admin())
with check (recorded_by = auth.uid() or public.is_admin());

drop policy if exists income_delete on public.income;
create policy income_delete
on public.income for delete
to authenticated
using (recorded_by = auth.uid() or public.is_admin());

-- Stale "pending approval" notifications for income no longer resolve to
-- anything actionable now that the workflow is gone.
delete from public.notifications where related_table = 'income' and type = 'pending_approval';
