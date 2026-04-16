-- Пример INSERT в org_llm_settings (RouterAI / OpenAI-compatible).
--
-- Почему простой INSERT «не работал»:
-- 1) Обязателен organization_id — UUID вашей строки из public.organizations.
-- 2) provider 'routerai' появляется только после миграции 20250415120000_org_llm_routerai.sql.
-- 3) api_key_encrypted — не голый ключ, а base64 от AES-256-GCM (как в приложении).
--    Сгенерировать:
--      node scripts/encrypt-llm-api-key.cjs '<LLM_SETTINGS_ENCRYPTION_KEY из .env>' 'ваш_реальный_api_ключ'
--    Вставьте вывод одной строкой вместо <CIPHERTEXT_BASE64>.
--
-- Проще: сохранить конфиг через UI /admin/models — ключ зашифруется сам.

INSERT INTO public.org_llm_settings (
  organization_id,
  provider,
  api_key_encrypted,
  base_url,
  model_name,
  max_tokens,
  enabled
)
VALUES (
  (SELECT id FROM public.organizations ORDER BY created_at LIMIT 1),
  'routerai',
  '<CIPHERTEXT_BASE64>',
  'https://routerai.ru/api/v1',
  'google/gemma-4-26b-a4b-it',
  1024,
  true
);
