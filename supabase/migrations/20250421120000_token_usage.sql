-- Monthly token limits (per org LLM settings row) and per-user usage accounting.

ALTER TABLE public.org_llm_settings
  ADD COLUMN IF NOT EXISTS monthly_token_limit INTEGER;

COMMENT ON COLUMN public.org_llm_settings.monthly_token_limit IS
  'Месячный лимит токенов на пользователя в организации (null = без лимита).';

CREATE TABLE IF NOT EXISTS public.token_usage (
  org_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  month DATE NOT NULL,
  tokens_used BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT token_usage_tokens_non_negative CHECK (tokens_used >= 0),
  PRIMARY KEY (org_id, user_id, month)
);

CREATE INDEX IF NOT EXISTS idx_token_usage_org_month
  ON public.token_usage (org_id, month);

DROP TRIGGER IF EXISTS trg_token_usage_updated_at ON public.token_usage;
CREATE TRIGGER trg_token_usage_updated_at
  BEFORE UPDATE ON public.token_usage
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.token_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS token_usage_select_member ON public.token_usage;
CREATE POLICY token_usage_select_member ON public.token_usage
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    AND org_id IN (SELECT public.user_organization_ids())
  );

REVOKE ALL ON public.token_usage FROM PUBLIC;
GRANT SELECT ON public.token_usage TO authenticated;
GRANT ALL ON public.token_usage TO postgres, service_role;

CREATE OR REPLACE FUNCTION public.increment_token_usage(
  p_org_id UUID,
  p_user_id UUID,
  p_month DATE,
  p_delta INTEGER
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_delta IS NULL OR p_delta <= 0 THEN
    RETURN;
  END IF;

  INSERT INTO public.token_usage (org_id, user_id, month, tokens_used)
  VALUES (
    p_org_id,
    p_user_id,
    (date_trunc('month', p_month::timestamp))::date,
    p_delta::bigint
  )
  ON CONFLICT (org_id, user_id, month)
  DO UPDATE SET
    tokens_used = public.token_usage.tokens_used + EXCLUDED.tokens_used,
    updated_at = NOW();
END;
$$;

REVOKE ALL ON FUNCTION public.increment_token_usage(UUID, UUID, DATE, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_token_usage(UUID, UUID, DATE, INTEGER) TO service_role;
