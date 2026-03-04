
-- =============================================
-- SECURITY HARDENING: Lock down sensitive tables
-- =============================================

-- 1. user_access: Contains session tokens, wallet addresses, Stripe IDs
-- Only Edge Functions (service_role) should access this table
DROP POLICY IF EXISTS "Public read user_access" ON public.user_access;
DROP POLICY IF EXISTS "Public insert user_access" ON public.user_access;
DROP POLICY IF EXISTS "Public update user_access" ON public.user_access;

CREATE POLICY "Deny all select on user_access" ON public.user_access FOR SELECT USING (false);
CREATE POLICY "Deny all insert on user_access" ON public.user_access FOR INSERT WITH CHECK (false);
CREATE POLICY "Deny all update on user_access" ON public.user_access FOR UPDATE USING (false) WITH CHECK (false);

-- 2. invitation_codes: Contains invitation codes (sensitive)
DROP POLICY IF EXISTS "Allow select invitation codes" ON public.invitation_codes;
DROP POLICY IF EXISTS "Allow insert invitation codes" ON public.invitation_codes;
DROP POLICY IF EXISTS "Allow update invitation codes" ON public.invitation_codes;
DROP POLICY IF EXISTS "Allow delete invitation codes" ON public.invitation_codes;

CREATE POLICY "Deny all select on invitation_codes" ON public.invitation_codes FOR SELECT USING (false);
CREATE POLICY "Deny all insert on invitation_codes" ON public.invitation_codes FOR INSERT WITH CHECK (false);
CREATE POLICY "Deny all update on invitation_codes" ON public.invitation_codes FOR UPDATE USING (false) WITH CHECK (false);
CREATE POLICY "Deny all delete on invitation_codes" ON public.invitation_codes FOR DELETE USING (false);

-- 3. access_events: Contains user activity tracking data
DROP POLICY IF EXISTS "Public insert access_events" ON public.access_events;
DROP POLICY IF EXISTS "Public read access_events" ON public.access_events;

CREATE POLICY "Deny all select on access_events" ON public.access_events FOR SELECT USING (false);
CREATE POLICY "Deny all insert on access_events" ON public.access_events FOR INSERT WITH CHECK (false);

-- 4. credit_logs: Contains user credit transaction history
DROP POLICY IF EXISTS "Public insert credit_logs" ON public.credit_logs;
DROP POLICY IF EXISTS "Public read credit_logs" ON public.credit_logs;

CREATE POLICY "Deny all select on credit_logs" ON public.credit_logs FOR SELECT USING (false);
CREATE POLICY "Deny all insert on credit_logs" ON public.credit_logs FOR INSERT WITH CHECK (false);
