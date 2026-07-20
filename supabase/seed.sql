-- supabase/seed.sql
-- Local development seed data, run automatically by `supabase db reset`.
-- Creates 3 demo accounts (admin, manager, staff) and sample income/expense
-- records covering every workflow status. DO NOT run against production.
--
-- Demo logins (password for all three: Passw0rd!):
--   admin@karnwifi.test
--   manager@karnwifi.test
--   staff@karnwifi.test

-- 1. Demo auth users. Inserting directly into auth.users with a bcrypt hash
--    is the standard way to seed Supabase Auth locally without going through
--    the signup API. handle_new_user() fires automatically and creates the
--    matching public.profiles row (defaulted to role 'staff').
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, recovery_token
) values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'admin@karnwifi.test', crypt('Passw0rd!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Alice Admin"}', now(), now(), '', ''),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'manager@karnwifi.test', crypt('Passw0rd!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Mark Manager"}', now(), now(), '', ''),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', 'authenticated', 'authenticated', 'staff@karnwifi.test', crypt('Passw0rd!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Sam Staff"}', now(), now(), '', '')
on conflict (id) do nothing;

-- 2. Promote roles beyond the trigger's 'staff' default.
update public.profiles set role = 'admin' where id = '11111111-1111-1111-1111-111111111111';
update public.profiles set role = 'manager' where id = '22222222-2222-2222-2222-222222222222';

-- 3. Sample income entries across every status.
insert into public.income (customer_name, phone_number, voucher_package, amount, payment_method, description, recorded_by, entry_date, status, submitted_at, approved_by, approved_at)
values
  ('John Mwangi', '+254712345678', 'Daily 5GB', 50, 'mpesa', 'Regular customer', '33333333-3333-3333-3333-333333333333', current_date, 'approved', now() - interval '2 days', '22222222-2222-2222-2222-222222222222', now() - interval '2 days'),
  ('Grace Wanjiru', '+254722334455', 'Weekly 20GB', 300, 'cash', null, '33333333-3333-3333-3333-333333333333', current_date, 'approved', now() - interval '1 day', '22222222-2222-2222-2222-222222222222', now() - interval '1 day'),
  ('Peter Otieno', '+254733445566', 'Monthly Unlimited', 1500, 'bank_transfer', 'Corporate client', '33333333-3333-3333-3333-333333333333', current_date - 1, 'approved', now() - interval '3 days', '11111111-1111-1111-1111-111111111111', now() - interval '3 days'),
  ('Mary Achieng', '+254744556677', 'Daily 2GB', 20, 'mpesa', null, '33333333-3333-3333-3333-333333333333', current_date, 'submitted', now(), null, null),
  ('James Kimani', '+254755667788', 'Weekly 10GB', 150, 'cash', 'Needs receipt confirmation', '33333333-3333-3333-3333-333333333333', current_date - 2, 'rejected', now() - interval '4 days', null, null);

update public.income set rejected_by = '22222222-2222-2222-2222-222222222222', rejected_at = now() - interval '4 days', rejection_reason = 'Amount does not match M-Pesa statement'
where customer_name = 'James Kimani';

insert into public.income (customer_name, phone_number, voucher_package, amount, payment_method, recorded_by, entry_date, status)
values ('Lucy Njeri', '+254766778899', 'Daily 5GB', 50, 'mpesa', '33333333-3333-3333-3333-333333333333', current_date, 'draft');

-- 4. Sample expenses across every workflow stage.
insert into public.expenses (category, amount, description, requested_by, entry_date, status, submitted_at, manager_approved_by, manager_approved_at, admin_approved_by, admin_approved_at)
values
  ('internet_bill', 8000, 'Monthly fibre uplink bill', '22222222-2222-2222-2222-222222222222', current_date - 1, 'approved', now() - interval '3 days', '22222222-2222-2222-2222-222222222222', now() - interval '3 days', '11111111-1111-1111-1111-111111111111', now() - interval '2 days'),
  ('router_equipment', 4500, 'Replacement outdoor router', '33333333-3333-3333-3333-333333333333', current_date - 2, 'approved', now() - interval '5 days', '22222222-2222-2222-2222-222222222222', now() - interval '5 days', '11111111-1111-1111-1111-111111111111', now() - interval '4 days'),
  ('electricity', 1200, 'Kiosk power bill', '33333333-3333-3333-3333-333333333333', current_date, 'manager_approved', now() - interval '1 day', '22222222-2222-2222-2222-222222222222', now() - interval '1 day', null, null),
  ('maintenance', 600, 'Antenna alignment callout', '33333333-3333-3333-3333-333333333333', current_date, 'submitted', now(), null, null, null, null),
  ('transport', 300, 'Fuel for site visit', '33333333-3333-3333-3333-333333333333', current_date - 3, 'rejected', now() - interval '6 days', null, null, null, null);

update public.expenses set rejected_by = '22222222-2222-2222-2222-222222222222', rejected_at = now() - interval '6 days', rejection_reason = 'Missing receipt'
where category = 'transport' and status = 'rejected';

insert into public.expenses (category, amount, description, requested_by, entry_date, status)
values ('marketing', 2000, 'Flyers for new estate coverage', '33333333-3333-3333-3333-333333333333', current_date, 'draft');
