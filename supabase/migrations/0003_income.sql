-- 0003_income.sql
-- Income entries. Recorded and counted immediately -- no approval workflow.
-- (income_status/approved_by/rejected_by/etc. columns are kept for
-- historical shape parity with the workflowed `expenses` table, but every
-- row is created as, and stays, 'approved' unless an admin corrects it.)

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
  status income_status not null default 'approved',
  submitted_at timestamptz,
  approved_by uuid references public.profiles (id),
  approved_at timestamptz,
  rejected_by uuid references public.profiles (id),
  rejected_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.income is 'WiFi voucher/customer income entries. Recorded and counted immediately, no approval step.';

create index income_recorded_by_idx on public.income (recorded_by);
create index income_status_idx on public.income (status);
create index income_entry_date_idx on public.income (entry_date);

create trigger set_income_updated_at
before update on public.income
for each row execute function public.set_updated_at();

-- Income has no approval workflow: the owner may correct their own entry's
-- details at any time, and an admin may correct/delete any entry (RLS
-- policies grant the actual row access; this trigger just pins down who
-- may touch a row once it exists, and keeps `status` fixed at 'approved'
-- and `recorded_by` from being reassigned).
create or replace function public.enforce_income_ownership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- auth.uid() is null for trusted server-side calls (service role key,
  -- SQL editor, seed scripts) which already bypass RLS entirely.
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
