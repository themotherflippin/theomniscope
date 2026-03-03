
-- Add duration column to invitation_codes
ALTER TABLE public.invitation_codes
ADD COLUMN duration text NOT NULL DEFAULT 'lifetime';

-- Add expires_at column for automatic expiry tracking
ALTER TABLE public.invitation_codes
ADD COLUMN expires_at timestamp with time zone DEFAULT NULL;
