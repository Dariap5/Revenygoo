-- Private bucket + таблица источников (загрузка файлов; индексация RAG — позже).

-- Ограничение типов — на сервере в API; в bucket только размер (50 МБ).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'org-knowledge',
  'org-knowledge',
  false,
  52428800,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DO $$
BEGIN
  CREATE TYPE public.knowledge_source_status AS ENUM (
    'processing',
    'ready',
    'failed'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

CREATE TABLE IF NOT EXISTS public.knowledge_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  size BIGINT NOT NULL,
  status public.knowledge_source_status NOT NULL DEFAULT 'processing',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT knowledge_sources_size_non_negative CHECK (size >= 0)
);

CREATE INDEX IF NOT EXISTS idx_knowledge_sources_org_created
  ON public.knowledge_sources (org_id, created_at DESC);

COMMENT ON TABLE public.knowledge_sources IS
  'Метаданные файлов базы знаний; статус processing — заглушка до пайплайна RAG.';

ALTER TABLE public.knowledge_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS knowledge_sources_select_member ON public.knowledge_sources;
CREATE POLICY knowledge_sources_select_member ON public.knowledge_sources
  FOR SELECT TO authenticated
  USING (org_id IN (SELECT public.user_organization_ids()));

REVOKE ALL ON public.knowledge_sources FROM PUBLIC;
GRANT SELECT ON public.knowledge_sources TO authenticated;
GRANT ALL ON public.knowledge_sources TO postgres, service_role;
