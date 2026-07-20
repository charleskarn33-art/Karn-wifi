// Hand-written TypeScript definitions mirroring the Supabase/PostgreSQL schema
// defined in supabase/migrations. Keep this file in sync with the SQL schema.

export type UserRole = "admin" | "manager" | "staff";

export type IncomeStatus = "draft" | "submitted" | "approved" | "rejected";

export type ExpenseStatus =
  | "draft"
  | "submitted"
  | "manager_approved"
  | "approved"
  | "rejected";

export type PaymentMethod =
  | "cash"
  | "mpesa"
  | "bank_transfer"
  | "card"
  | "other";

export type ExpenseCategory =
  | "router_equipment"
  | "internet_bill"
  | "electricity"
  | "rent"
  | "salaries"
  | "maintenance"
  | "marketing"
  | "transport"
  | "other";

export type AuditAction =
  | "create"
  | "update"
  | "submit"
  | "approve"
  | "reject"
  | "delete";

export type NotificationType =
  | "pending_approval"
  | "approved"
  | "rejected"
  | "info";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Income {
  id: string;
  customer_name: string;
  phone_number: string | null;
  voucher_package: string;
  amount: number;
  payment_method: PaymentMethod;
  description: string | null;
  recorded_by: string;
  entry_date: string;
  status: IncomeStatus;
  submitted_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejected_by: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface IncomeWithRelations extends Income {
  recorded_by_profile?: Pick<Profile, "id" | "full_name" | "email"> | null;
  approved_by_profile?: Pick<Profile, "id" | "full_name" | "email"> | null;
}

export interface Expense {
  id: string;
  category: ExpenseCategory;
  amount: number;
  description: string | null;
  receipt_url: string | null;
  requested_by: string;
  entry_date: string;
  status: ExpenseStatus;
  submitted_at: string | null;
  manager_approved_by: string | null;
  manager_approved_at: string | null;
  admin_approved_by: string | null;
  admin_approved_at: string | null;
  rejected_by: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseWithRelations extends Expense {
  requested_by_profile?: Pick<Profile, "id" | "full_name" | "email"> | null;
  manager_approved_by_profile?: Pick<
    Profile,
    "id" | "full_name" | "email"
  > | null;
  admin_approved_by_profile?: Pick<
    Profile,
    "id" | "full_name" | "email"
  > | null;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  related_table: string | null;
  related_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  user_id: string | null;
  user_email: string | null;
  action: AuditAction;
  table_name: string;
  record_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
}

// Minimal shape expected by @supabase/postgrest-js's GenericRelationship;
// left empty since we don't rely on typed foreign-table embeds -- select()
// strings with `!fkey_name` embeds are still valid at runtime, just untyped.
type NoRelationships = { foreignKeyName: string; columns: string[]; isOneToOne?: boolean; referencedRelation: string; referencedColumns: string[] }[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string; email: string };
        Update: Partial<Profile>;
        Relationships: NoRelationships;
      };
      income: {
        Row: Income;
        Insert: Partial<Income> & {
          customer_name: string;
          voucher_package: string;
          amount: number;
          recorded_by: string;
        };
        Update: Partial<Income>;
        Relationships: NoRelationships;
      };
      expenses: {
        Row: Expense;
        Insert: Partial<Expense> & {
          category: ExpenseCategory;
          amount: number;
          requested_by: string;
        };
        Update: Partial<Expense>;
        Relationships: NoRelationships;
      };
      notifications: {
        Row: Notification;
        Insert: Partial<Notification> & {
          user_id: string;
          title: string;
          message: string;
          type: NotificationType;
        };
        Update: Partial<Notification>;
        Relationships: NoRelationships;
      };
      audit_log: {
        Row: AuditLogEntry;
        Insert: Partial<AuditLogEntry> & {
          action: AuditAction;
          table_name: string;
        };
        Update: Partial<AuditLogEntry>;
        Relationships: NoRelationships;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
