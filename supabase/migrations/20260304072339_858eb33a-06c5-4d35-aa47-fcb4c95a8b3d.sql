
-- =============================================
-- LOCK DOWN USER-SCOPED TABLES
-- All access goes through Edge Functions (service_role)
-- =============================================

-- === ALERT_RULES ===
DROP POLICY IF EXISTS "Public delete alert_rules" ON public.alert_rules;
DROP POLICY IF EXISTS "Public insert alert_rules" ON public.alert_rules;
DROP POLICY IF EXISTS "Public read alert_rules" ON public.alert_rules;
DROP POLICY IF EXISTS "Public update alert_rules" ON public.alert_rules;

CREATE POLICY "Deny all select on alert_rules" ON public.alert_rules FOR SELECT USING (false);
CREATE POLICY "Deny all insert on alert_rules" ON public.alert_rules FOR INSERT WITH CHECK (false);
CREATE POLICY "Deny all update on alert_rules" ON public.alert_rules FOR UPDATE USING (false) WITH CHECK (false);
CREATE POLICY "Deny all delete on alert_rules" ON public.alert_rules FOR DELETE USING (false);

-- === WATCHLISTS ===
DROP POLICY IF EXISTS "Public delete watchlists" ON public.watchlists;
DROP POLICY IF EXISTS "Public insert watchlists" ON public.watchlists;
DROP POLICY IF EXISTS "Public read watchlists" ON public.watchlists;
DROP POLICY IF EXISTS "Public update watchlists" ON public.watchlists;

CREATE POLICY "Deny all select on watchlists" ON public.watchlists FOR SELECT USING (false);
CREATE POLICY "Deny all insert on watchlists" ON public.watchlists FOR INSERT WITH CHECK (false);
CREATE POLICY "Deny all update on watchlists" ON public.watchlists FOR UPDATE USING (false) WITH CHECK (false);
CREATE POLICY "Deny all delete on watchlists" ON public.watchlists FOR DELETE USING (false);

-- === ALERTS ===
DROP POLICY IF EXISTS "Public insert alerts" ON public.alerts;
DROP POLICY IF EXISTS "Public read alerts" ON public.alerts;
DROP POLICY IF EXISTS "Public update alerts" ON public.alerts;

CREATE POLICY "Deny all select on alerts" ON public.alerts FOR SELECT USING (false);
CREATE POLICY "Deny all insert on alerts" ON public.alerts FOR INSERT WITH CHECK (false);
CREATE POLICY "Deny all update on alerts" ON public.alerts FOR UPDATE USING (false) WITH CHECK (false);
CREATE POLICY "Deny all delete on alerts" ON public.alerts FOR DELETE USING (false);

-- === CASES ===
DROP POLICY IF EXISTS "Public delete cases" ON public.cases;
DROP POLICY IF EXISTS "Public insert cases" ON public.cases;
DROP POLICY IF EXISTS "Public read cases" ON public.cases;
DROP POLICY IF EXISTS "Public update cases" ON public.cases;

CREATE POLICY "Deny all select on cases" ON public.cases FOR SELECT USING (false);
CREATE POLICY "Deny all insert on cases" ON public.cases FOR INSERT WITH CHECK (false);
CREATE POLICY "Deny all update on cases" ON public.cases FOR UPDATE USING (false) WITH CHECK (false);
CREATE POLICY "Deny all delete on cases" ON public.cases FOR DELETE USING (false);

-- === CASE_ITEMS ===
DROP POLICY IF EXISTS "Public delete case_items" ON public.case_items;
DROP POLICY IF EXISTS "Public insert case_items" ON public.case_items;
DROP POLICY IF EXISTS "Public read case_items" ON public.case_items;

CREATE POLICY "Deny all select on case_items" ON public.case_items FOR SELECT USING (false);
CREATE POLICY "Deny all insert on case_items" ON public.case_items FOR INSERT WITH CHECK (false);
CREATE POLICY "Deny all update on case_items" ON public.case_items FOR UPDATE USING (false) WITH CHECK (false);
CREATE POLICY "Deny all delete on case_items" ON public.case_items FOR DELETE USING (false);

-- === CASE_NOTES ===
DROP POLICY IF EXISTS "Public delete case_notes" ON public.case_notes;
DROP POLICY IF EXISTS "Public insert case_notes" ON public.case_notes;
DROP POLICY IF EXISTS "Public read case_notes" ON public.case_notes;

CREATE POLICY "Deny all select on case_notes" ON public.case_notes FOR SELECT USING (false);
CREATE POLICY "Deny all insert on case_notes" ON public.case_notes FOR INSERT WITH CHECK (false);
CREATE POLICY "Deny all update on case_notes" ON public.case_notes FOR UPDATE USING (false) WITH CHECK (false);
CREATE POLICY "Deny all delete on case_notes" ON public.case_notes FOR DELETE USING (false);

-- === CASE_SHARE_LINKS ===
DROP POLICY IF EXISTS "Public delete case_share_links" ON public.case_share_links;
DROP POLICY IF EXISTS "Public insert case_share_links" ON public.case_share_links;
DROP POLICY IF EXISTS "Public read case_share_links" ON public.case_share_links;
DROP POLICY IF EXISTS "Public update case_share_links" ON public.case_share_links;

CREATE POLICY "Deny all select on case_share_links" ON public.case_share_links FOR SELECT USING (false);
CREATE POLICY "Deny all insert on case_share_links" ON public.case_share_links FOR INSERT WITH CHECK (false);
CREATE POLICY "Deny all update on case_share_links" ON public.case_share_links FOR UPDATE USING (false) WITH CHECK (false);
CREATE POLICY "Deny all delete on case_share_links" ON public.case_share_links FOR DELETE USING (false);

-- === REPORT_JOBS ===
DROP POLICY IF EXISTS "Public insert report_jobs" ON public.report_jobs;
DROP POLICY IF EXISTS "Public read report_jobs" ON public.report_jobs;
DROP POLICY IF EXISTS "Public update report_jobs" ON public.report_jobs;

CREATE POLICY "Deny all select on report_jobs" ON public.report_jobs FOR SELECT USING (false);
CREATE POLICY "Deny all insert on report_jobs" ON public.report_jobs FOR INSERT WITH CHECK (false);
CREATE POLICY "Deny all update on report_jobs" ON public.report_jobs FOR UPDATE USING (false) WITH CHECK (false);
CREATE POLICY "Deny all delete on report_jobs" ON public.report_jobs FOR DELETE USING (false);

-- === ALERT_STATE (used by scanner only) ===
DROP POLICY IF EXISTS "Public read alert_state" ON public.alert_state;
DROP POLICY IF EXISTS "Public update alert_state" ON public.alert_state;
DROP POLICY IF EXISTS "Public upsert alert_state" ON public.alert_state;

CREATE POLICY "Deny all select on alert_state" ON public.alert_state FOR SELECT USING (false);
CREATE POLICY "Deny all insert on alert_state" ON public.alert_state FOR INSERT WITH CHECK (false);
CREATE POLICY "Deny all update on alert_state" ON public.alert_state FOR UPDATE USING (false) WITH CHECK (false);
CREATE POLICY "Deny all delete on alert_state" ON public.alert_state FOR DELETE USING (false);
