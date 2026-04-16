-- Per-user DLP policy within an organization (consumed by API: getUserPolicy).

CREATE TABLE IF NOT EXISTS public.policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  action TEXT NOT NULL DEFAULT 'warn'
    CHECK (action IN ('warn', 'block', 'redact')),
  enabled_types JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT policies_org_user_unique UNIQUE (organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_policies_org_user
  ON public.policies (organization_id, user_id);

DROP TRIGGER IF EXISTS trg_policies_updated_at ON public.policies;
CREATE TRIGGER trg_policies_updated_at
  BEFORE UPDATE ON public.policies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS policies_select_own ON public.policies;
CREATE POLICY policies_select_own ON public.policies
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    AND organization_id IN (SELECT public.user_organization_ids())
  );

DROP POLICY IF EXISTS policies_insert_own ON public.policies;
CREATE POLICY policies_insert_own ON public.policies
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND organization_id IN (SELECT public.user_organization_ids())
  );

DROP POLICY IF EXISTS policies_update_own ON public.policies;
CREATE POLICY policies_update_own ON public.policies
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    AND organization_id IN (SELECT public.user_organization_ids())
  )
  WITH CHECK (
    user_id = auth.uid()
    AND organization_id IN (SELECT public.user_organization_ids())
  );

DROP POLICY IF EXISTS policies_delete_own ON public.policies;
CREATE POLICY policies_delete_own ON public.policies
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    AND organization_id IN (SELECT public.user_organization_ids())
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.policies TO authenticated;
