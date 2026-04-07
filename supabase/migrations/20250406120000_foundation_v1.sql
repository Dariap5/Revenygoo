-- Revenygo foundation v1: org-scoped chat + audit (UUID, RLS)
-- Apply with Supabase CLI (`supabase db push`) or SQL editor.

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'org_role') THEN
    CREATE TYPE public.org_role AS ENUM ('owner', 'admin', 'manager', 'employee');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'chat_message_role') THEN
    CREATE TYPE public.chat_message_role AS ENUM ('user', 'assistant', 'system');
  END IF;
END$$;

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Profiles (1:1 auth.users)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Organizations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations (slug)
  WHERE slug IS NOT NULL;

DROP TRIGGER IF EXISTS trg_organizations_updated_at ON public.organizations;
CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Organization members
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  role public.org_role NOT NULL DEFAULT 'employee',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_organization_members_user
  ON public.organization_members (user_id);

CREATE INDEX IF NOT EXISTS idx_organization_members_org
  ON public.organization_members (organization_id);

DROP TRIGGER IF EXISTS trg_organization_members_updated_at ON public.organization_members;
CREATE TRIGGER trg_organization_members_updated_at
  BEFORE UPDATE ON public.organization_members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Chat threads
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chat_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Новый чат',
  scenario_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_threads_org_user_updated
  ON public.chat_threads (organization_id, user_id, updated_at DESC);

DROP TRIGGER IF EXISTS trg_chat_threads_updated_at ON public.chat_threads;
CREATE TRIGGER trg_chat_threads_updated_at
  BEFORE UPDATE ON public.chat_threads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Chat messages
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  thread_id UUID NOT NULL REFERENCES public.chat_threads (id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  role public.chat_message_role NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_created
  ON public.chat_messages (thread_id, created_at);

CREATE INDEX IF NOT EXISTS idx_chat_messages_org_created
  ON public.chat_messages (organization_id, created_at DESC);

DROP TRIGGER IF EXISTS trg_chat_messages_updated_at ON public.chat_messages;
CREATE TRIGGER trg_chat_messages_updated_at
  BEFORE UPDATE ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Audit events (append-only: no updated_at)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_events_org_created
  ON public.audit_events (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_events_actor
  ON public.audit_events (actor_user_id)
  WHERE actor_user_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Auth: auto-create profile
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      SPLIT_PART(COALESCE(NEW.email, ''), '@', 1),
      'User'
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS helper: orgs current user belongs to (avoids recursive RLS on members)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.user_organization_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT om.organization_id
  FROM public.organization_members om
  WHERE om.user_id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.user_organization_ids() TO authenticated;

CREATE OR REPLACE FUNCTION public.user_has_org_role(
  check_org_id UUID,
  VARIADIC allowed public.org_role[]
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.organization_id = check_org_id
      AND om.user_id = auth.uid()
      AND om.role = ANY (allowed)
  );
$$;

GRANT EXECUTE ON FUNCTION public.user_has_org_role(UUID, public.org_role[]) TO authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- Profiles: own row
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- Organizations: read if member; update if admin/owner
DROP POLICY IF EXISTS organizations_select_member ON public.organizations;
CREATE POLICY organizations_select_member ON public.organizations
  FOR SELECT TO authenticated
  USING (id IN (SELECT public.user_organization_ids()));

DROP POLICY IF EXISTS organizations_update_admin ON public.organizations;
CREATE POLICY organizations_update_admin ON public.organizations
  FOR UPDATE TO authenticated
  USING (
    public.user_has_org_role(id, 'owner'::public.org_role, 'admin'::public.org_role)
  )
  WITH CHECK (
    public.user_has_org_role(id, 'owner'::public.org_role, 'admin'::public.org_role)
  );

-- Organization members: read peers in shared orgs; manage if admin/owner
DROP POLICY IF EXISTS organization_members_select ON public.organization_members;
CREATE POLICY organization_members_select ON public.organization_members
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT public.user_organization_ids()));

DROP POLICY IF EXISTS organization_members_insert_admin ON public.organization_members;
CREATE POLICY organization_members_insert_admin ON public.organization_members
  FOR INSERT TO authenticated
  WITH CHECK (
    public.user_has_org_role(
      organization_id,
      'owner'::public.org_role,
      'admin'::public.org_role
    )
  );

DROP POLICY IF EXISTS organization_members_update_admin ON public.organization_members;
CREATE POLICY organization_members_update_admin ON public.organization_members
  FOR UPDATE TO authenticated
  USING (
    public.user_has_org_role(
      organization_id,
      'owner'::public.org_role,
      'admin'::public.org_role
    )
  )
  WITH CHECK (
    public.user_has_org_role(
      organization_id,
      'owner'::public.org_role,
      'admin'::public.org_role
    )
  );

DROP POLICY IF EXISTS organization_members_delete_admin ON public.organization_members;
CREATE POLICY organization_members_delete_admin ON public.organization_members
  FOR DELETE TO authenticated
  USING (
    public.user_has_org_role(
      organization_id,
      'owner'::public.org_role,
      'admin'::public.org_role
    )
  );

-- Chat threads: own rows within member orgs
DROP POLICY IF EXISTS chat_threads_select_own ON public.chat_threads;
CREATE POLICY chat_threads_select_own ON public.chat_threads
  FOR SELECT TO authenticated
  USING (
    organization_id IN (SELECT public.user_organization_ids())
    AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS chat_threads_insert_own ON public.chat_threads;
CREATE POLICY chat_threads_insert_own ON public.chat_threads
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (SELECT public.user_organization_ids())
    AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS chat_threads_update_own ON public.chat_threads;
CREATE POLICY chat_threads_update_own ON public.chat_threads
  FOR UPDATE TO authenticated
  USING (
    organization_id IN (SELECT public.user_organization_ids())
    AND user_id = auth.uid()
  )
  WITH CHECK (
    organization_id IN (SELECT public.user_organization_ids())
    AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS chat_threads_delete_own ON public.chat_threads;
CREATE POLICY chat_threads_delete_own ON public.chat_threads
  FOR DELETE TO authenticated
  USING (
    organization_id IN (SELECT public.user_organization_ids())
    AND user_id = auth.uid()
  );

-- Chat messages: same org + thread owned by user
DROP POLICY IF EXISTS chat_messages_select_own ON public.chat_messages;
CREATE POLICY chat_messages_select_own ON public.chat_messages
  FOR SELECT TO authenticated
  USING (
    organization_id IN (SELECT public.user_organization_ids())
    AND EXISTS (
      SELECT 1 FROM public.chat_threads t
      WHERE t.id = chat_messages.thread_id
        AND t.user_id = auth.uid()
        AND t.organization_id = chat_messages.organization_id
    )
  );

DROP POLICY IF EXISTS chat_messages_insert_own ON public.chat_messages;
CREATE POLICY chat_messages_insert_own ON public.chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (SELECT public.user_organization_ids())
    AND EXISTS (
      SELECT 1 FROM public.chat_threads t
      WHERE t.id = chat_messages.thread_id
        AND t.user_id = auth.uid()
        AND t.organization_id = chat_messages.organization_id
    )
  );

DROP POLICY IF EXISTS chat_messages_update_own ON public.chat_messages;
CREATE POLICY chat_messages_update_own ON public.chat_messages
  FOR UPDATE TO authenticated
  USING (
    organization_id IN (SELECT public.user_organization_ids())
    AND EXISTS (
      SELECT 1 FROM public.chat_threads t
      WHERE t.id = chat_messages.thread_id
        AND t.user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (SELECT public.user_organization_ids())
    AND EXISTS (
      SELECT 1 FROM public.chat_threads t
      WHERE t.id = chat_messages.thread_id
        AND t.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS chat_messages_delete_own ON public.chat_messages;
CREATE POLICY chat_messages_delete_own ON public.chat_messages
  FOR DELETE TO authenticated
  USING (
    organization_id IN (SELECT public.user_organization_ids())
    AND EXISTS (
      SELECT 1 FROM public.chat_threads t
      WHERE t.id = chat_messages.thread_id
        AND t.user_id = auth.uid()
    )
  );

-- Audit: append + read within org (no UPDATE/DELETE for authenticated)
DROP POLICY IF EXISTS audit_events_select_org ON public.audit_events;
CREATE POLICY audit_events_select_org ON public.audit_events
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT public.user_organization_ids()));

DROP POLICY IF EXISTS audit_events_insert_org ON public.audit_events;
CREATE POLICY audit_events_insert_org ON public.audit_events
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (SELECT public.user_organization_ids())
    AND (
      actor_user_id IS NULL
      OR actor_user_id = auth.uid()
    )
  );

REVOKE UPDATE, DELETE ON public.audit_events FROM authenticated;

-- ---------------------------------------------------------------------------
-- Grants (Supabase roles)
-- ---------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
