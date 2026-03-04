-- Make reports bucket private
UPDATE storage.buckets SET public = false WHERE id = 'reports';

-- Drop old permissive storage policies
DROP POLICY IF EXISTS "Public read reports" ON storage.objects;
DROP POLICY IF EXISTS "Service insert reports" ON storage.objects;

-- Only service_role can read/write reports
CREATE POLICY "Service role read reports" ON storage.objects FOR SELECT USING (bucket_id = 'reports' AND (select auth.role()) = 'service_role');
CREATE POLICY "Service role insert reports" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'reports' AND (select auth.role()) = 'service_role');