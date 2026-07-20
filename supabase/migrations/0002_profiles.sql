-- 0002_profiles.sql
-- One row per authenticated user, mirroring auth.users with app-level role.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  email text not null,
  role user_role not null default 'staff',
  phone text,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'App user profile with role-based access (admin/manager/staff).';

create index profiles_role_idx on public.profiles (role);

-- Generic updated_at maintenance trigger, reused by every table below.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Auto-create a profile row whenever a new Supabase auth user is created.
-- Role always defaults to 'staff' here -- it is never trusted from client
-- signup metadata, to prevent privilege escalation at signup time. Admins
-- promote users afterwards via the Users admin screen (service-role API).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    'staff'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Helper functions used throughout RLS policies. SECURITY DEFINER lets them
-- read public.profiles without re-triggering RLS on profiles (which would
-- otherwise recurse), while still being safe because they only ever return
-- a role/boolean derived from auth.uid().
create or replace function public.current_user_role()
returns user_role
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.current_user_role() = 'admin';
$$;

create or replace function public.is_manager_or_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.current_user_role() in ('manager', 'admin');
$$;

-- Only admins may change a profile's role or active flag; a user editing
-- their own profile (name/phone/avatar) cannot self-promote or reactivate.
create or replace function public.guard_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- auth.uid() is null for trusted server-side calls made with the service
  -- role key (e.g. the admin user-provisioning API route), which already
  -- bypass RLS entirely -- only enforce this guard for a real end-user
  -- session acting under RLS.
  if auth.uid() is not null and not public.is_admin() then
    if new.role is distinct from old.role then
      raise exception 'Only an admin can change a user role';
    end if;
    if new.is_active is distinct from old.is_active then
      raise exception 'Only an admin can activate or deactivate a user';
    end if;
  end if;
  return new;
end;
$$;

create trigger guard_profiles_privileges
before update on public.profiles
for each row execute function public.guard_profile_privileges();
