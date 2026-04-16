-- Fast filter for audit UI: rows with DLP findings (count > 0 in payload).

ALTER TABLE public.audit_events
  ADD COLUMN IF NOT EXISTS has_dlp_findings boolean
  GENERATED ALWAYS AS (
    (COALESCE(NULLIF(payload->'dlp_findings'->>'count', ''), '0'))::int > 0
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_audit_events_org_has_dlp_created
  ON public.audit_events (organization_id, has_dlp_findings, created_at DESC);
