-- 1) Исправление входа для пользователей, созданных SQL без токенов (NULL → '')
--    Симптом: "Database error querying schema" при signInWithPassword.
UPDATE auth.users
SET
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change = COALESCE(email_change, '')
WHERE confirmation_token IS NULL
   OR recovery_token IS NULL
   OR email_change_token_new IS NULL
   OR email_change IS NULL;

-- Некоторые версии GoTrue ожидают и это поле не-NULL:
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'auth'
      AND table_name = 'users'
      AND column_name = 'email_change_token_current'
  ) THEN
    EXECUTE $q$
      UPDATE auth.users
      SET email_change_token_current = COALESCE(email_change_token_current, '')
      WHERE email_change_token_current IS NULL
    $q$;
  END IF;
END $$;

-- 2) Профиль при регистрации: не падать, если строка уже есть
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
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 3) Демо-организация и владелец (доступ к чатам / RLS)
INSERT INTO public.organizations (id, name, slug)
SELECT
  'a1111111-1111-4111-8111-111111111111'::uuid,
  'Demo Organization',
  'demo'
WHERE NOT EXISTS (SELECT 1 FROM public.organizations WHERE slug = 'demo');

INSERT INTO public.organization_members (organization_id, user_id, role)
SELECT o.id, u.id, 'owner'::public.org_role
FROM auth.users u
JOIN public.organizations o ON o.slug = 'demo'
WHERE lower(u.email) = lower('demo@revenygo.local')
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- 4) Профиль демо, если триггер не сработал (например, пользователь создан до триггера)
INSERT INTO public.profiles (id, display_name)
SELECT id, COALESCE(SPLIT_PART(email, '@', 1), 'Demo')
FROM auth.users
WHERE lower(email) = lower('demo@revenygo.local')
ON CONFLICT (id) DO NOTHING;
