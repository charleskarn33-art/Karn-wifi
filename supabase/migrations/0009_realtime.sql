-- 0009_realtime.sql
-- Stream live updates for notifications and approval workflow changes.

alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.income;
alter publication supabase_realtime add table public.expenses;
