
-- Table to cache full scan results
CREATE TABLE public.wallet_scans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  address text NOT NULL,
  chain text NOT NULL DEFAULT 'cronos',
  status text NOT NULL DEFAULT 'running',
  total_tx_count integer NOT NULL DEFAULT 0,
  total_volume_in double precision NOT NULL DEFAULT 0,
  total_volume_out double precision NOT NULL DEFAULT 0,
  first_seen timestamp with time zone,
  last_seen timestamp with time zone,
  depth integer NOT NULL DEFAULT 1,
  include_routers boolean NOT NULL DEFAULT false,
  counterparties_count integer NOT NULL DEFAULT 0,
  contracts_count integer NOT NULL DEFAULT 0,
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.wallet_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read wallet_scans" ON public.wallet_scans FOR SELECT USING (true);
CREATE POLICY "Public insert wallet_scans" ON public.wallet_scans FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update wallet_scans" ON public.wallet_scans FOR UPDATE USING (true) WITH CHECK (true);

CREATE INDEX idx_wallet_scans_address ON public.wallet_scans (address, chain);
CREATE INDEX idx_wallet_scans_status ON public.wallet_scans (status);

-- Cached transactions
CREATE TABLE public.wallet_tx_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_id uuid NOT NULL REFERENCES public.wallet_scans(id) ON DELETE CASCADE,
  tx_hash text NOT NULL,
  from_address text NOT NULL,
  to_address text NOT NULL,
  value_native double precision NOT NULL DEFAULT 0,
  token_symbol text,
  token_address text,
  token_value double precision,
  direction text NOT NULL DEFAULT 'out',
  block_timestamp timestamp with time zone NOT NULL,
  block_number text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.wallet_tx_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read wallet_tx_cache" ON public.wallet_tx_cache FOR SELECT USING (true);
CREATE POLICY "Public insert wallet_tx_cache" ON public.wallet_tx_cache FOR INSERT WITH CHECK (true);

CREATE INDEX idx_wallet_tx_cache_scan ON public.wallet_tx_cache (scan_id);
CREATE INDEX idx_wallet_tx_cache_hash ON public.wallet_tx_cache (tx_hash);

-- Counterparty edges
CREATE TABLE public.wallet_counterparties (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_id uuid NOT NULL REFERENCES public.wallet_scans(id) ON DELETE CASCADE,
  address text NOT NULL,
  label text,
  is_contract boolean NOT NULL DEFAULT false,
  tx_count integer NOT NULL DEFAULT 0,
  volume_in double precision NOT NULL DEFAULT 0,
  volume_out double precision NOT NULL DEFAULT 0,
  first_seen timestamp with time zone,
  last_seen timestamp with time zone,
  bidirectional boolean NOT NULL DEFAULT false,
  token_diversity integer NOT NULL DEFAULT 1,
  link_score double precision NOT NULL DEFAULT 0,
  link_strength text NOT NULL DEFAULT 'weak',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.wallet_counterparties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read wallet_counterparties" ON public.wallet_counterparties FOR SELECT USING (true);
CREATE POLICY "Public insert wallet_counterparties" ON public.wallet_counterparties FOR INSERT WITH CHECK (true);

CREATE INDEX idx_wallet_counterparties_scan ON public.wallet_counterparties (scan_id);
CREATE INDEX idx_wallet_counterparties_score ON public.wallet_counterparties (link_score DESC);
