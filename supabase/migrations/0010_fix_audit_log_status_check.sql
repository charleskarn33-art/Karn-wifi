-- 0010_fix_audit_log_status_check.sql
-- Fixes a bug in log_audit_event(): Postgres does not guarantee short-circuit
-- evaluation of "a and b", so the original
--   `if tg_table_name in ('income','expenses') and new.status is distinct from old.status`
-- could evaluate `new.status` even when tg_table_name = 'profiles' (which has
-- no status column), raising "record \"new\" has no field \"status\"" on any
-- UPDATE to public.profiles (e.g. promoting a user's role). Splitting into
-- nested IFs makes the table-name check gate access to new.status.

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
