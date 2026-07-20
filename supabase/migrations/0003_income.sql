-- 0003_income.sql
-- Income entries: Draft -> Submit -> Approved | Rejected

create table public.income (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone_number text,
  voucher_package text not null,
  amount numeric(12, 2) not null check (amount > 0),
  payment_method payment_method not null default 'cash',
  description text,
  recorded_by uuid not null references public.profiles (id),
  entry_date date not null default current_date,
  status income_status not null default 'draft',
  submitted_at timestamptz,
  approved_by uuid references public.profiles (id),
  approved_at timestamptz,
  rejected_by uuid references public.profiles (id),
  rejected_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.income is 'WiFi voucher/customer income entries with approval workflow.';

create index income_recorded_by_idx on public.income (recorded_by);
create index income_status_idx on public.income (status);
create index income_entry_date_idx on public.income (entry_date);

create trigger set_income_updated_at
before update on public.income
for each row execute function public.set_updated_at();

-- Enforces the income approval state machine and who may perform each
-- transition, independent of RLS row-visibility policies:
--   owner (recorded_by): edit while draft/rejected, submit draft -> submitted
--   manager/admin:       submitted -> approved | rejected (reason required)
--   admin:                may additionally correct/override at any stage
create or replace function public.enforce_income_workflow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role user_role := public.current_user_role();
begin
  if v_role = 'admin' then
    if new.status = 'approved' and old.status is distinct from 'approved' then
      new.approved_by := auth.uid();
      new.approved_at := now();
    end if;
    if new.status = 'rejected' and old.status is distinct from 'rejected' then
      if new.rejection_reason is null or length(trim(new.rejection_reason)) = 0 then
        raise exception 'Rejection reason is required';
      end if;
      new.rejected_by := auth.uid();
      new.rejected_at := now();
    end if;
    if new.status = 'submitted' and old.status is distinct from 'submitted' then
      new.submitted_at := now();
    end if;
    return new;
  end if;

  if old.recorded_by = auth.uid() then
    if old.status not in ('draft', 'rejected') then
      raise exception 'Only draft or rejected income entries can be edited';
    end if;
    if new.status not in ('draft', 'submitted') then
      raise exception 'You may only save as draft or submit for approval';
    end if;
    if new.status = 'submitted' then
      new.submitted_at := now();
      new.rejection_reason := null;
      new.rejected_by := null;
      new.rejected_at := null;
    end if;
    return new;
  end if;

  if v_role = 'manager' then
    if old.status <> 'submitted' then
      raise exception 'Only submitted income entries can be approved or rejected';
    end if;
    if new.status = 'approved' then
      new.approved_by := auth.uid();
      new.approved_at := now();
    elsif new.status = 'rejected' then
      if new.rejection_reason is null or length(trim(new.rejection_reason)) = 0 then
        raise exception 'Rejection reason is required';
      end if;
      new.rejected_by := auth.uid();
      new.rejected_at := now();
    else
      raise exception 'Managers may only approve or reject submitted entries';
    end if;
    -- Reviewers cannot alter the underlying financial data.
    new.customer_name := old.customer_name;
    new.phone_number := old.phone_number;
    new.voucher_package := old.voucher_package;
    new.amount := old.amount;
    new.payment_method := old.payment_method;
    new.description := old.description;
    new.recorded_by := old.recorded_by;
    new.entry_date := old.entry_date;
    return new;
  end if;

  raise exception 'You are not permitted to modify this income entry';
end;
$$;

create trigger trg_enforce_income_workflow
before update on public.income
for each row execute function public.enforce_income_workflow();

-- Notify managers/admins on submission, and the recorder on decision.
create or replace function public.notify_income_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recorder_name text;
  r record;
begin
  if new.status is distinct from old.status then
    if new.status = 'submitted' then
      select full_name into v_recorder_name from public.profiles where id = new.recorded_by;
      for r in select id from public.profiles where role in ('manager', 'admin') and is_active loop
        insert into public.notifications (user_id, title, message, type, related_table, related_id)
        values (
          r.id,
          'Income pending approval',
          format('%s submitted an income entry (%s) for approval.', coalesce(v_recorder_name, 'A staff member'), new.voucher_package),
          'pending_approval',
          'income',
          new.id
        );
      end loop;
    elsif new.status = 'approved' then
      insert into public.notifications (user_id, title, message, type, related_table, related_id)
      values (
        new.recorded_by,
        'Income approved',
        format('Your income entry for %s was approved.', new.customer_name),
        'approved',
        'income',
        new.id
      );
    elsif new.status = 'rejected' then
      insert into public.notifications (user_id, title, message, type, related_table, related_id)
      values (
        new.recorded_by,
        'Income rejected',
        format('Your income entry for %s was rejected: %s', new.customer_name, coalesce(new.rejection_reason, 'No reason given')),
        'rejected',
        'income',
        new.id
      );
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_notify_income_status_change
after update on public.income
for each row execute function public.notify_income_status_change();
