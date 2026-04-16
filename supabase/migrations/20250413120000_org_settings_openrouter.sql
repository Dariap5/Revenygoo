-- OpenRouter / OpenAI-compatible gateways: provider + optional base URL.

ALTER TABLE public.org_settings
  DROP CONSTRAINT IF EXISTS org_settings_llm_provider_check;

ALTER TABLE public.org_settings
  ADD CONSTRAINT org_settings_llm_provider_check CHECK (
    llm_provider IS NULL
    OR llm_provider IN ('openai', 'anthropic', 'openrouter')
  );

ALTER TABLE public.org_settings
  ADD COLUMN IF NOT EXISTS llm_base_url TEXT;
