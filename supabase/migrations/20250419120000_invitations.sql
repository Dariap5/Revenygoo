-- Email invitations to join an organization (accept via /auth/accept-invite?token=…).

CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role public.org_role NOT NULL DEFAULT 'employee',
  token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT invitations_email_normalized CHECK (email = lower(trim(email))),
  CONSTRAINT invitations_role_not_owner CHECK (role <> 'owner'::public.org_role)
);

CREATE INDEX IF NOT EXISTS idx_invitations_org ON public.invitations (org_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations (token);

CREATE UNIQUE INDEX IF NOT EXISTS invitations_org_email_pending
  ON public.invitations (org_id, email)
  WHERE accepted_at IS NULL;

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS invitations_select_org ON public.invitations;
CREATE POLICY invitations_select_org ON public.invitations
  FOR SELECT TO authenticated
  USING (org_id IN (SELECT public.user_organization_ids()));

DROP POLICY IF EXISTS invitations_insert_admin ON public.invitations;
CREATE POLICY invitations_insert_admin ON public.invitations
  FOR INSERT TO authenticated
  WITH CHECK (
    public.user_has_org_role(
      org_id,
      'owner'::public.org_role,
      'admin'::public.org_role
    )
  );

DROP POLICY IF EXISTS invitations_delete_admin ON public.invitations;
CREATE POLICY invitations_delete_admin ON public.invitations
  FOR DELETE TO authenticated
  USING (
    public.user_has_org_role(
      org_id,
      'owner'::public.org_role,
      'admin'::public.org_role
    )
  );

GRANT SELECT, INSERT, DELETE ON public.invitations TO authenticated;
