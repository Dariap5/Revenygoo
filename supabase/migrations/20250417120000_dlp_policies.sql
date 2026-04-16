-- Organization-scoped DLP policies with precedence:
-- applies_to=user > applies_to=role > applies_to=all.

CREATE TABLE IF NOT EXISTS public.dlp_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  enabled_types TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  action TEXT NOT NULL CHECK (action IN ('warn', 'block', 'redact')),
  applies_to TEXT NOT NULL CHECK (applies_to IN ('all', 'role', 'user')),
  target_id UUID NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT dlp_policies_target_required CHECK (
    (applies_to = 'all' AND target_id IS NULL)
    OR (applies_to IN ('role', 'user') AND target_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_dlp_policies_org_active
  ON public.dlp_policies (org_id, active);

CREATE INDEX IF NOT EXISTS idx_dlp_policies_org_scope_priority
  ON public.dlp_policies (org_id, applies_to, priority DESC, updated_at DESC);

DROP TRIGGER IF EXISTS trg_dlp_policies_updated_at ON public.dlp_policies;
CREATE TRIGGER trg_dlp_policies_updated_at
  BEFORE UPDATE ON public.dlp_policies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Stable role target IDs for applies_to='role'
CREATE OR REPLACE FUNCTION public.dlp_role_target_id(role_text TEXT)
RETURNS UUID
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT CASE role_text
    WHEN 'owner' THEN '00000000-0000-0000-0000-000000000001'::UUID
    WHEN 'admin' THEN '00000000-0000-0000-0000-000000000002'::UUID
    WHEN 'manager' THEN '00000000-0000-0000-0000-000000000003'::UUID
    WHEN 'employee' THEN '00000000-0000-0000-0000-000000000004'::UUID
    ELSE NULL::UUID
  END;
$$;

ALTER TABLE public.dlp_policies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS dlp_policies_select_admin_all ON public.dlp_policies;
CREATE POLICY dlp_policies_select_admin_all ON public.dlp_policies
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.organization_members om
      WHERE om.organization_id = dlp_policies.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS dlp_policies_select_user_applied ON public.dlp_policies;
CREATE POLICY dlp_policies_select_user_applied ON public.dlp_policies
  FOR SELECT TO authenticated
  USING (
    active = TRUE
    AND EXISTS (
      SELECT 1
      FROM public.organization_members om
      WHERE om.organization_id = dlp_policies.org_id
        AND om.user_id = auth.uid()
        AND (
          dlp_policies.applies_to = 'all'
          OR (dlp_policies.applies_to = 'user' AND dlp_policies.target_id = auth.uid())
          OR (
            dlp_policies.applies_to = 'role'
            AND dlp_policies.target_id = public.dlp_role_target_id(om.role::TEXT)
          )
        )
    )
  );

DROP POLICY IF EXISTS dlp_policies_insert_admin ON public.dlp_policies;
CREATE POLICY dlp_policies_insert_admin ON public.dlp_policies
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.organization_members om
      WHERE om.organization_id = dlp_policies.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS dlp_policies_update_admin ON public.dlp_policies;
CREATE POLICY dlp_policies_update_admin ON public.dlp_policies
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.organization_members om
      WHERE om.organization_id = dlp_policies.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.organization_members om
      WHERE om.organization_id = dlp_policies.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS dlp_policies_delete_admin ON public.dlp_policies;
CREATE POLICY dlp_policies_delete_admin ON public.dlp_policies
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.organization_members om
      WHERE om.organization_id = dlp_policies.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dlp_policies TO authenticated;
