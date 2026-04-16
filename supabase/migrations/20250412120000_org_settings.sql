-- Per-organization LLM credentials (read server-side with service role only).

CREATE TABLE IF NOT EXISTS public.org_settings (
  organization_id UUID PRIMARY KEY REFERENCES public.organizations (id) ON DELETE CASCADE,
  llm_provider TEXT,
  llm_api_key TEXT,
  llm_model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT org_settings_llm_provider_check CHECK (
    llm_provider IS NULL OR llm_provider IN ('openai', 'anthropic')
  )
);

DROP TRIGGER IF EXISTS trg_org_settings_updated_at ON public.org_settings;
CREATE TRIGGER trg_org_settings_updated_at
  BEFORE UPDATE ON public.org_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_org_settings_org ON public.org_settings (organization_id);

ALTER TABLE public.org_settings ENABLE ROW LEVEL SECURITY;

-- Keys must not be exposed to the browser; server uses service_role only.
REVOKE ALL ON public.org_settings FROM PUBLIC;
GRANT ALL ON public.org_settings TO postgres, service_role;
