-- Per-organization LLM model configs (admin UI). API key stored encrypted (app-layer AES-GCM).

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'llm_admin_provider') THEN
    CREATE TYPE public.llm_admin_provider AS ENUM (
      'openai',
      'anthropic',
      'gigachat',
      'yandexgpt'
    );
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.org_llm_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  provider public.llm_admin_provider NOT NULL,
  api_key_encrypted TEXT NOT NULL,
  model_name TEXT NOT NULL,
  max_tokens INTEGER NOT NULL DEFAULT 4096,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT org_llm_settings_max_tokens_check CHECK (
    max_tokens > 0 AND max_tokens <= 200000
  )
);

CREATE INDEX IF NOT EXISTS idx_org_llm_settings_org_enabled
  ON public.org_llm_settings (organization_id, enabled)
  WHERE enabled = true;

DROP TRIGGER IF EXISTS trg_org_llm_settings_updated_at ON public.org_llm_settings;
CREATE TRIGGER trg_org_llm_settings_updated_at
  BEFORE UPDATE ON public.org_llm_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.org_llm_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS org_llm_settings_select_admin ON public.org_llm_settings;
CREATE POLICY org_llm_settings_select_admin ON public.org_llm_settings
  FOR SELECT TO authenticated
  USING (
    organization_id IN (SELECT public.user_organization_ids())
    AND public.user_has_org_role(
      organization_id,
      'owner'::public.org_role,
      'admin'::public.org_role
    )
  );

DROP POLICY IF EXISTS org_llm_settings_insert_admin ON public.org_llm_settings;
CREATE POLICY org_llm_settings_insert_admin ON public.org_llm_settings
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (SELECT public.user_organization_ids())
    AND public.user_has_org_role(
      organization_id,
      'owner'::public.org_role,
      'admin'::public.org_role
    )
  );

DROP POLICY IF EXISTS org_llm_settings_update_admin ON public.org_llm_settings;
CREATE POLICY org_llm_settings_update_admin ON public.org_llm_settings
  FOR UPDATE TO authenticated
  USING (
    organization_id IN (SELECT public.user_organization_ids())
    AND public.user_has_org_role(
      organization_id,
      'owner'::public.org_role,
      'admin'::public.org_role
    )
  )
  WITH CHECK (
    organization_id IN (SELECT public.user_organization_ids())
    AND public.user_has_org_role(
      organization_id,
      'owner'::public.org_role,
      'admin'::public.org_role
    )
  );

DROP POLICY IF EXISTS org_llm_settings_delete_admin ON public.org_llm_settings;
CREATE POLICY org_llm_settings_delete_admin ON public.org_llm_settings
  FOR DELETE TO authenticated
  USING (
    organization_id IN (SELECT public.user_organization_ids())
    AND public.user_has_org_role(
      organization_id,
      'owner'::public.org_role,
      'admin'::public.org_role
    )
  );

REVOKE ALL ON public.org_llm_settings FROM PUBLIC;
GRANT ALL ON public.org_llm_settings TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.org_llm_settings TO authenticated;
