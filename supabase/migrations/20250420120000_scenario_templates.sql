-- Scenario templates catalog (public defaults + org-specific templates)

CREATE TABLE IF NOT EXISTS public.scenario_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  prompt_template TEXT NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT scenario_templates_category_check
    CHECK (category IN ('communication', 'code', 'analysis', 'documents')),
  CONSTRAINT scenario_templates_scope_check
    CHECK (
      (is_public = TRUE AND org_id IS NULL)
      OR (is_public = FALSE AND org_id IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_scenario_templates_org
  ON public.scenario_templates (org_id);
CREATE INDEX IF NOT EXISTS idx_scenario_templates_public
  ON public.scenario_templates (is_public);
CREATE INDEX IF NOT EXISTS idx_scenario_templates_category
  ON public.scenario_templates (category);

DROP TRIGGER IF EXISTS trg_scenario_templates_updated_at ON public.scenario_templates;
CREATE TRIGGER trg_scenario_templates_updated_at
  BEFORE UPDATE ON public.scenario_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.scenario_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS scenario_templates_select_visible ON public.scenario_templates;
CREATE POLICY scenario_templates_select_visible ON public.scenario_templates
  FOR SELECT TO authenticated
  USING (
    is_public = TRUE
    OR org_id IN (SELECT public.user_organization_ids())
  );

DROP POLICY IF EXISTS scenario_templates_insert_admin ON public.scenario_templates;
CREATE POLICY scenario_templates_insert_admin ON public.scenario_templates
  FOR INSERT TO authenticated
  WITH CHECK (
    is_public = FALSE
    AND created_by = auth.uid()
    AND public.user_has_org_role(
      org_id,
      'owner'::public.org_role,
      'admin'::public.org_role
    )
  );

GRANT SELECT, INSERT ON public.scenario_templates TO authenticated;

INSERT INTO public.scenario_templates (
  id, org_id, title, description, category, prompt_template, is_public, created_by
)
VALUES
  ('00000000-0000-4000-8000-000000000001', NULL, 'Написать email клиенту', 'Деловое письмо клиенту с четкой целью и next steps.', 'communication', 'Составь деловое письмо клиенту. Контекст: {{context}}. Цель: {{goal}}. Тон: нейтральный, профессиональный.', TRUE, NULL),
  ('00000000-0000-4000-8000-000000000002', NULL, 'Суммаризировать документ', 'Краткое summary документа в 5-7 пунктов.', 'documents', 'Сделай краткое summary документа: ключевые тезисы, риски и вопросы. Текст: {{document_text}}', TRUE, NULL),
  ('00000000-0000-4000-8000-000000000003', NULL, 'Проверить код', 'Быстрый ревью кода: баги, риски, улучшения.', 'code', 'Проведи code review. Найди дефекты, риски регрессии, предложи улучшения. Код: {{code_snippet}}', TRUE, NULL),
  ('00000000-0000-4000-8000-000000000004', NULL, 'Подготовить встречу', 'План встречи с повесткой и вопросами.', 'communication', 'Подготовь план встречи: цель, повестка, 5 уточняющих вопросов, ожидаемые решения. Тема: {{topic}}', TRUE, NULL),
  ('00000000-0000-4000-8000-000000000005', NULL, 'Сделать анализ конкурентов', 'Структурированный конкурентный анализ.', 'analysis', 'Сделай сравнительный анализ конкурентов по критериям: продукт, цена, позиционирование, риски. Рынок: {{market}}', TRUE, NULL),
  ('00000000-0000-4000-8000-000000000006', NULL, 'Выделить action items', 'Список задач с приоритетами и владельцами.', 'analysis', 'Из заметок выдели action items: задача, владелец, срок, приоритет. Заметки: {{notes}}', TRUE, NULL),
  ('00000000-0000-4000-8000-000000000007', NULL, 'Написать ответ на возражение', 'Ответ клиенту на сложное возражение.', 'communication', 'Подготовь ответ на возражение клиента. Возражение: {{objection}}. Формат: эмпатия, аргументы, предложение next step.', TRUE, NULL),
  ('00000000-0000-4000-8000-000000000008', NULL, 'Собрать план презентации', 'Структура презентации с ключевыми слайдами.', 'documents', 'Подготовь структуру презентации на {{minutes}} минут: заголовки слайдов, тезисы, ожидаемый результат.', TRUE, NULL),
  ('00000000-0000-4000-8000-000000000009', NULL, 'Объяснить участок кода', 'Пояснение логики и зависимостей в коде.', 'code', 'Объясни участок кода простыми словами: что делает, где риски, что можно улучшить. Код: {{code_snippet}}', TRUE, NULL),
  ('00000000-0000-4000-8000-000000000010', NULL, 'Проверить договор', 'Первичный разбор рисков и неясных пунктов.', 'documents', 'Проведи первичный анализ договора: рискованные пункты, неясности, вопросы юристу. Текст: {{contract_text}}', TRUE, NULL)
ON CONFLICT (id) DO NOTHING;
