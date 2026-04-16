-- Тестовый пользователь Supabase Auth: email demo@revenygo.local, пароль demo
-- Триггер public.handle_new_user() создаёт строку в public.profiles.
--
-- Важно: в auth.users колонки токенов не должны быть NULL (иначе GoTrue:
-- "Database error querying schema" / converting NULL to string).
-- Redirect URLs: Dashboard → Authentication → URL Configuration.

DO $$
DECLARE
  v_user_id UUID := gen_random_uuid();
  v_encrypted_pw TEXT := crypt('demo', gen_salt('bf'));
BEGIN
  IF EXISTS (
    SELECT 1 FROM auth.users WHERE lower(email) = lower('demo@revenygo.local')
  ) THEN
    RETURN;
  END IF;

  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  )
  VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'demo@revenygo.local',
    v_encrypted_pw,
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  );

  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    v_user_id,
    jsonb_build_object(
      'sub', v_user_id::text,
      'email', 'demo@revenygo.local',
      'email_verified', true
    ),
    'email',
    v_user_id::text,
    NOW(),
    NOW(),
    NOW()
  );
END $$;
