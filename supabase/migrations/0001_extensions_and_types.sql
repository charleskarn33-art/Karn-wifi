-- 0001_extensions_and_types.sql
-- Extensions and shared enum types for the WiFi Business Finance Manager.

create extension if not exists "pgcrypto"; -- gen_random_uuid()

create type user_role as enum ('admin', 'manager', 'staff');

create type income_status as enum ('draft', 'submitted', 'approved', 'rejected');

create type expense_status as enum (
  'draft',
  'submitted',
  'manager_approved',
  'approved',
  'rejected'
);

create type payment_method as enum (
  'cash',
  'mpesa',
  'bank_transfer',
  'card',
  'other'
);

create type expense_category as enum (
  'router_equipment',
  'internet_bill',
  'electricity',
  'rent',
  'salaries',
  'maintenance',
  'marketing',
  'transport',
  'other'
);

create type audit_action as enum (
  'create',
  'update',
  'submit',
  'approve',
  'reject',
  'delete'
);

create type notification_type as enum (
  'pending_approval',
  'approved',
  'rejected',
  'info'
);
