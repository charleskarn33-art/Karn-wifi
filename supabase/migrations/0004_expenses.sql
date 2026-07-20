-- 0004_expenses.sql
-- Expense entries: Draft -> Submit -> Manager Approval -> Admin Approval -> Reports

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  category expense_category not null,
  amount numeric(12, 2) not null check (amount > 0),
  description text,
  receipt_url text,
  requested_by uuid not null references public.profiles (id),
  entry_date date not null default current_date,
  status expense_status not null default 'draft',
  submitted_at timestamptz,
  manager_approved_by uuid references public.profiles (id),
  manager_approved_at timestamptz,
  admin_approved_by uuid references public.profiles (id),
  admin_approved_at timestamptz,
  rejected_by uuid references public.profiles (id),
  rejected_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.expenses is 'Business expense entries with two-stage (manager then admin) approval workflow.';

create index expenses_requested_by_idx on public.expenses (requested_by);
create index expenses_status_idx on public.expenses (status);
create index expenses_entry_date_idx on public.expenses (entry_date);

create trigger set_expenses_updated_at
before update on public.expenses
for each row execute function public.set_updated_at();

-- Enforces the two-stage expense approval state machine:
--   owner (requested_by): edit while draft/rejected, submit draft -> submitted
--   manager/admin:        submitted -> manager_approved | rejected
--   admin:                 manager_approved -> approved | rejected
--   admin:                 may additionally correct/override at any stage
create or replace function public.enforce_expense_workflow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role user_role := public.current_user_role();
begin
  -- auth.uid() is null for trusted server-side calls (service role key,
  -- SQL editor, seed scripts) which already bypass RLS entirely -- only
  -- enforce the workflow state machine for a real end-user session.
  if auth.uid() is null then
    return new;
  end if;

  if v_role = 'admin' then
    if new.status = 'manager_approved' and old.status is distinct from 'manager_approved' then
      new.manager_approved_by := auth.uid();
      new.manager_approved_at := now();
    end if;
    if new.status = 'approved' and old.status is distinct from 'approved' then
      new.admin_approved_by := auth.uid();
      new.admin_approved_at := now();
      if new.manager_approved_by is null then
        new.manager_approved_by := auth.uid();
        new.manager_approved_at := now();
      end if;
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

  if old.requested_by = auth.uid() then
    if old.status not in ('draft', 'rejected') then
      raise exception 'Only draft or rejected expenses can be edited';
    end if;
    if new.status not in ('draft', 'submitted') then
      raise exception 'You may only save as draft or submit for approval';
    end if;
    if new.status = 'submitted' then
      new.submitted_at := now();
      new.rejection_reason := null;
      new.rejected_by := null;
      new.rejected_at := null;
      new.manager_approved_by := null;
      new.manager_approved_at := null;
    end if;
    return new;
  end if;

  if v_role = 'manager' then
    if old.status <> 'submitted' then
      raise exception 'Only submitted expenses can be reviewed by a manager';
    end if;
    if new.status = 'manager_approved' then
      new.manager_approved_by := auth.uid();
      new.manager_approved_at := now();
    elsif new.status = 'rejected' then
      if new.rejection_reason is null or length(trim(new.rejection_reason)) = 0 then
        raise exception 'Rejection reason is required';
      end if;
      new.rejected_by := auth.uid();
      new.rejected_at := now();
    else
      raise exception 'Managers may only approve or reject submitted expenses';
    end if;
    new.category := old.category;
    new.amount := old.amount;
    new.description := old.description;
    new.receipt_url := old.receipt_url;
    new.requested_by := old.requested_by;
    new.entry_date := old.entry_date;
    return new;
  end if;

  raise exception 'You are not permitted to modify this expense';
end;
$$;

create trigger trg_enforce_expense_workflow
before update on public.expenses
for each row execute function public.enforce_expense_workflow();

-- Notify managers on submission, admins after manager approval, and the
-- requester once a final decision (approved/rejected) is made.
create or replace function public.notify_expense_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_requester_name text;
  r record;
begin
  if new.status is distinct from old.status then
    select full_name into v_requester_name from public.profiles where id = new.requested_by;

    if new.status = 'submitted' then
      for r in select id from public.profiles where role = 'manager' and is_active loop
        insert into public.notifications (user_id, title, message, type, related_table, related_id)
        values (
          r.id,
          'Expense pending manager approval',
          format('%s submitted a %s expense of %s for review.', coalesce(v_requester_name, 'A staff member'), new.category, new.amount),
          'pending_approval',
          'expenses',
          new.id
        );
      end loop;
    elsif new.status = 'manager_approved' then
      for r in select id from public.profiles where role = 'admin' and is_active loop
        insert into public.notifications (user_id, title, message, type, related_table, related_id)
        values (
          r.id,
          'Expense pending admin approval',
          format('A %s expense of %s was approved by a manager and needs final admin approval.', new.category, new.amount),
          'pending_approval',
          'expenses',
          new.id
        );
      end loop;
    elsif new.status = 'approved' then
      insert into public.notifications (user_id, title, message, type, related_table, related_id)
      values (
        new.requested_by,
        'Expense approved',
        format('Your %s expense of %s was fully approved and added to reports.', new.category, new.amount),
        'approved',
        'expenses',
        new.id
      );
    elsif new.status = 'rejected' then
      insert into public.notifications (user_id, title, message, type, related_table, related_id)
      values (
        new.requested_by,
        'Expense rejected',
        format('Your %s expense of %s was rejected: %s', new.category, new.amount, coalesce(new.rejection_reason, 'No reason given')),
        'rejected',
        'expenses',
        new.id
      );
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_notify_expense_status_change
after update on public.expenses
for each row execute function public.notify_expense_status_change();
