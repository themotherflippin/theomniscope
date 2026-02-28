
-- Watchlists table
CREATE TABLE public.watchlists (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  type text NOT NULL CHECK (type IN ('wallet', 'token', 'cluster')),
  subject text NOT NULL,
  chain text NOT NULL DEFAULT 'cronos',
  label text NOT NULL DEFAULT '',
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_watchlists_unique_subject ON public.watchlists (coalesce(user_id, '00000000-0000-0000-0000-000000000000'::uuid), type, subject, chain);

ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read watchlists" ON public.watchlists FOR SELECT USING (true);
CREATE POLICY "Public insert watchlists" ON public.watchlists FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update watchlists" ON public.watchlists FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete watchlists" ON public.watchlists FOR DELETE USING (true);

-- Alert rules table
CREATE TABLE public.alert_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  name text NOT NULL,
  scope text NOT NULL CHECK (scope IN ('wallet', 'token', 'global')),
  chain text NOT NULL DEFAULT 'cronos',
  subject text,
  rule_type text NOT NULL CHECK (rule_type IN ('large_transfer', 'lp_remove', 'fresh_wallet', 'concentration_spike', 'loop_suspicion')),
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.alert_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read alert_rules" ON public.alert_rules FOR SELECT USING (true);
CREATE POLICY "Public insert alert_rules" ON public.alert_rules FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update alert_rules" ON public.alert_rules FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete alert_rules" ON public.alert_rules FOR DELETE USING (true);

-- Alerts table
CREATE TABLE public.alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  chain text NOT NULL DEFAULT 'cronos',
  scope text NOT NULL,
  subject text,
  rule_id uuid REFERENCES public.alert_rules(id) ON DELETE SET NULL,
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'triaged', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_alerts_status ON public.alerts (status, created_at DESC);
CREATE INDEX idx_alerts_severity ON public.alerts (severity, created_at DESC);

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read alerts" ON public.alerts FOR SELECT USING (true);
CREATE POLICY "Public insert alerts" ON public.alerts FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update alerts" ON public.alerts FOR UPDATE USING (true) WITH CHECK (true);

-- Alert state for dedupe + cursor tracking
CREATE TABLE public.alert_state (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.alert_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read alert_state" ON public.alert_state FOR SELECT USING (true);
CREATE POLICY "Public upsert alert_state" ON public.alert_state FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update alert_state" ON public.alert_state FOR UPDATE USING (true) WITH CHECK (true);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_watchlists_updated_at BEFORE UPDATE ON public.watchlists FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_alert_rules_updated_at BEFORE UPDATE ON public.alert_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_alert_state_updated_at BEFORE UPDATE ON public.alert_state FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Insert default alert rules
INSERT INTO public.alert_rules (name, scope, rule_type, config, severity) VALUES
  ('Large Transfer Detection', 'wallet', 'large_transfer', '{"thresholdUsd": 10000, "windowMinutes": 60}', 'high'),
  ('Top 10 Concentration Spike', 'token', 'concentration_spike', '{"top10PctThreshold": 80, "deltaThreshold": 5}', 'high'),
  ('Loop Suspicion Detection', 'token', 'loop_suspicion', '{}', 'medium');
