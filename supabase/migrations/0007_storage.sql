-- 0007_storage.sql
-- Private storage bucket for expense receipt uploads.
-- Files are stored under the path: {auth.uid()}/{expense_id}/{filename}
-- so folder-based RLS can scope writes to the uploader without joining
-- back to the expenses table.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'receipts',
  'receipts',
  false,
  10485760, -- 10 MB
  array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
)
on conflict (id) do nothing;

create policy receipts_insert_own_folder
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy receipts_select_own_or_reviewer
on storage.objects for select
to authenticated
using (
  bucket_id = 'receipts'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_manager_or_admin()
  )
);

create policy receipts_delete_own_or_admin
on storage.objects for delete
to authenticated
using (
  bucket_id = 'receipts'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_admin()
  )
);
