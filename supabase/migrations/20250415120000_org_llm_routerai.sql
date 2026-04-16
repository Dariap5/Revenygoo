-- RouterAI / OpenAI-compatible: enum value + base URL column.

ALTER TABLE public.org_llm_settings
  ADD COLUMN IF NOT EXISTS base_url TEXT;

COMMENT ON COLUMN public.org_llm_settings.base_url IS
  'OpenAI-compatible API base without trailing slash, e.g. https://routerai.ru/api/v1';

-- PG 15+: IF NOT EXISTS. На более старых версиях выполните вручную один раз:
-- ALTER TYPE public.llm_admin_provider ADD VALUE 'routerai';
ALTER TYPE public.llm_admin_provider ADD VALUE IF NOT EXISTS 'routerai';
