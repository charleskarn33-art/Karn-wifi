-- 0011_fix_workflow_triggers_trusted_context.sql
-- Fixes enforce_income_workflow() / enforce_expense_workflow() blocking any
-- update made outside of an authenticated end-user session (e.g. the
-- Supabase SQL editor running as `postgres`, the service role key, or a
-- seed script) with "You are not permitted to modify this income entry" --
-- auth.uid() is null in those contexts, so v_role and the ownership checks
-- never matched anything, falling through to the final RAISE EXCEPTION.
--
-- Table owners/service-role already bypass Row Level Security entirely, so
-- it's consistent to also let them bypass this workflow state-machine
-- trigger, the same trusted-context carve-out already used for
-- guard_profile_privileges() on public.profiles.

create or replace function public.enforce_income_workflow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role user_role := public.current_user_role();
begin
  if auth.uid() is null then
    return new;
  end if;

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

create or replace function public.enforce_expense_workflow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role user_role := public.current_user_role();
begin
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
