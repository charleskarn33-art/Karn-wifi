-- 0006_audit_log.sql
-- Immutable audit trail of every create/update/submit/approve/reject/delete.

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  user_email text,
  action audit_action not null,
  table_name text not null,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

comment on table public.audit_log is 'Append-only audit trail written exclusively by SECURITY DEFINER triggers.';

create index audit_log_table_record_idx on public.audit_log (table_name, record_id);
create index audit_log_created_at_idx on public.audit_log (created_at desc);
create index audit_log_user_id_idx on public.audit_log (user_id);

-- Generic audit trigger, attached to income/expenses/profiles below.
-- Because NEW/OLD are untyped RECORDs in a trigger function, field access
-- like NEW.status is resolved at runtime -- guarding by TG_TABLE_NAME before
-- touching table-specific columns keeps this safe to reuse across tables.
create or replace function public.log_audit_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_action audit_action;
  v_user_email text;
  v_record_id uuid;
begin
  select email into v_user_email from public.profiles where id = auth.uid();

  if tg_op = 'INSERT' then
    v_action := 'create';
    v_record_id := new.id;
  elsif tg_op = 'DELETE' then
    v_action := 'delete';
    v_record_id := old.id;
  else
    v_record_id := new.id;
    v_action := 'update';
    -- Nested IFs (not a single "a and b" boolean expression) because
    -- Postgres does not guarantee short-circuit evaluation of AND/OR --
    -- new.status would otherwise be accessed even for tables (e.g. profiles)
    -- that have no such column, raising "record has no field status".
    if tg_table_name in ('income', 'expenses') then
      if new.status is distinct from old.status then
        v_action := case new.status
          when 'submitted' then 'submit'
          when 'approved' then 'approve'
          when 'manager_approved' then 'approve'
          when 'rejected' then 'reject'
          else 'update'
        end;
      end if;
    end if;
  end if;

  insert into public.audit_log (user_id, user_email, action, table_name, record_id, old_data, new_data)
  values (
    auth.uid(),
    v_user_email,
    v_action,
    tg_table_name,
    v_record_id,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('UPDATE', 'INSERT') then to_jsonb(new) else null end
  );

  return coalesce(new, old);
end;
$$;

create trigger trg_audit_income
after insert or update or delete on public.income
for each row execute function public.log_audit_event();

create trigger trg_audit_expenses
after insert or update or delete on public.expenses
for each row execute function public.log_audit_event();

create trigger trg_audit_profiles
after insert or update or delete on public.profiles
for each row execute function public.log_audit_event();
