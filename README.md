# Revenygo

Корпоративный **AI workspace** (рабочее место): чат с LLM в духе ChatGPT/Claude, сценарии, база знаний, политики, аудит, админка и онбординг. **UI** по-прежнему в основном на **демо-данных** (`src/lib/mock/*`) и **localStorage**; поверх добавлен **backend foundation v1** (Supabase + `app/api`) — см. раздел [Backend (foundation v1)](#backend-foundation-v1).

---

## Стек

| Слой | Технологии |
|------|------------|
| Фреймворк | **Next.js 15** (App Router), **React 19** |
| Язык | **TypeScript** (strict), алиас импортов `@/*` → `src/*` |
| Стили | **Tailwind CSS 3.4**, CSS-переменные темы в `src/app/globals.css` |
| UI | **Radix UI** (dialog, dropdown, checkbox, scroll-area, …), **lucide-react** для иконок |
| Утилиты классов | `clsx` + `tailwind-merge` → **`cn()`** в `src/lib/utils/index.ts` |
| Варианты компонентов | **class-variance-authority (cva)** в части UI (например `Button`) |

Шрифты: **Geist** и **Geist Mono** (Google Fonts) в `src/app/layout.tsx`.

---

## Структура репозитория

```
src/
  app/                    # App Router: страницы, layout, globals.css
    (workspace)/        # Защищённая зона: shell + сайдбар
      chat/             # Главный чат
      knowledge/        # База знаний
      scenarios/        # Каталог сценариев
      admin/, audit/, policies/, organization/, profile/
    onboarding/         # Воронка онбординга
    login/              # Вход (демо)
    layout.tsx          # Корневой layout, шрифты, metadata
  components/
    chat/               # Чат: композер, пузыри, пустое состояние, диалоги
    layout/             # WorkspaceShell, сайдбар, история чатов
    ui/                 # Переиспользуемые примитивы (shadcn-подобный стиль)
    auth/, onboarding/, knowledge/, scenarios/, admin/, …
  lib/
    auth/               # синхронизация Supabase ↔ workspace-session, signOutApp, флаг демо-логина
    server/             # Supabase (server/browser/admin), auth, repos, services, audit, policies
    chat/               # Модели чата, сегменты сообщений, layout колонки, localStorage префсов
    mock/               # Моки данных и сценариев
    history/            # Синхронизация списка чатов (localStorage + события)
    session/            # Сессия workspace (демо)
    utils/              # `cn()`
  types/
    index.ts            # Доменные типы: ChatThread, ChatMessage, Scenario, …
```

**Важно для Tailwind:** классы, объявленные **только** в `src/lib/**/*.ts` (строковые константы), попадают в CSS только если эти файлы перечислены в `tailwind.config.ts` → `content`. В проекте уже добавлен `./src/lib/**/*.{js,ts,jsx,tsx,mdx}` — при добавлении новых «библиотечных» утилит с классами не удаляй этот путь.

---

## Маршруты и layout

- **`/`** — лендинг/вход в продукт.
- **`/login`** — вход через **Supabase Auth** (email/пароль); опционально демо при `NEXT_PUBLIC_ENABLE_DEMO_LOGIN=true`.
- **`/onboarding/*`** — шаги онбординга.
- **`/(workspace)/*`** — обёртка `WorkspaceAccessGuard` + **`WorkspaceShell`** (сайдбар + main). Страницы: `/chat`, `/knowledge`, `/scenarios`, `/admin`, `/audit`, `/policies`, `/organization`, `/profile`.

Редирект в `next.config.ts`: `/history` → `/chat`.

---

## Стили и дизайн-система

1. **Тема через CSS variables** (`:root` и `.dark` в `globals.css`): `--background`, `--foreground`, `--primary`, `--muted`, `--border`, `--radius` и т.д. Значения в формате **HSL без `hsl()`** — так принято в shadcn/Tailwind theme extend.
2. **Tailwind** мапит эти токены в `tailwind.config.ts` (`colors.border`, `background`, …).
3. **Компоновка чата:** единая ширина колонки задаётся в **`src/lib/chat/chat-column-layout.ts`** (`chatColumnClassName`, `CHAT_COLUMN_CLASS` — `max-w-[712px]` и отступы). Менять ширину читаемой колонки — **там**.
4. Составные классы: **`cn("...", condition && "…")`** чтобы `tailwind-merge` корректно разрешал конфликты (`flex-1` vs `shrink-0` и т.п.).
5. Кастом: анимация орба `.rg-orb-sheen` в `globals.css`.

Тёмная тема переключается классом **`dark`** на корневом элементе (если добавите переключатель — следите за этим контрактом).

---

## Как запускать

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # production-сборка
npm run lint         # ESLint (next/core-web-vitals)
```

Полезное при «залипании» HMR на некоторых ФС/облаках:

```bash
npm run dev:poll     # polling watcher (см. next.config.ts)
npm run dev:turbo    # Turbopack
npm run dev:clean    # сброс .next и dev
```

---

## Как писать код (соглашения)

1. **Клиентские границы:** директива `"use client"` там, где нужны хуки, браузерные API, события. Layout workspace — client из-за guard и shell.
2. **Типы домена** — в `src/types/index.ts`; импорт `@/types` или `@/types/index`.
3. **Моки** — `src/lib/mock/*`; не смешивать с прод-API до появления бэкенда.
4. **Персистенция в браузере** — модули вроде `chat-threads-storage.ts`, `chat-ui-prefs-storage.ts`, `workspace-sidebar-storage.ts`; при изменении схемы — миграции/версионирование по месту.
5. **Чат:** основной контейнер — `ChatWorkspace`; композер — `ChatComposer`; список сообщений — `ChatMessageList` + `ChatMessageBubble`. Новые возможности чата лучше вешать на эти узлы или выносить в `src/lib/chat`.
6. **UI-примитивы** — расширять `src/components/ui/*` в том же стиле (Radix + Tailwind + `cn`).
7. **Язык интерфейса** в проекте — **русский** (`lang="ru"` в корне).

---

## Для LLM и новых разработчиков: быстрые якоря

| Задача | Куда смотреть |
|--------|----------------|
| Новая страница в продукте | `src/app/(workspace)/<route>/page.tsx` |
| Оболочка, отступы чата, сайдбар | `workspace-shell.tsx`, `workspace-sidebar.tsx` |
| Логика чата, отправка (демо) | `chat-workspace.tsx`, `chat-composer.tsx` |
| Ширина колонки чата | `src/lib/chat/chat-column-layout.ts` |
| Модели/лейблы в композере | `src/lib/chat/unified-chat-models.ts` |
| Типы сообщений и тредов | `src/types/index.ts` |
| Новый мок-список / сценарий | `src/lib/mock/` |
| Кнопки, инпуты, диалоги | `src/components/ui/` |

При добавлении **новых Tailwind-классов только в `src/lib`** убедитесь, что файл попадает под `content` в `tailwind.config.ts` (иначе стили не сгенерируются).

---

## Лицензия и статус

Проект **private** (`package.json`).

---

## Backend (foundation v1)

Корпоративный API живёт **в этом же репозитории**: [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers) в `src/app/api/*`. Данные — **Supabase** (Postgres + Auth + RLS; Storage зарезервирован на следующие этапы). Текущий UI по-прежнему на **моках и localStorage**; эндпоинты можно вызывать отдельно (curl, новый клиент позже).

### Переменные окружения

Скопируйте `.env.example` в `.env.local` и заполните ключи из [Supabase Dashboard](https://supabase.com/dashboard) → Project Settings → API:

| Переменная | Назначение |
|------------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL проекта |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon (публичный) ключ |
| `SUPABASE_SERVICE_ROLE_KEY` | service role — **только сервер**, не в браузер |
| `NEXT_PUBLIC_ENABLE_DEMO_LOGIN` | опционально `true` — старый демо-вход паролем `demo` без Supabase |

### Supabase Auth (вход в приложение)

- Страница **`/login`** вызывает `signInWithPassword` (email + пароль). После успешного входа cookies сессии обновляет **`src/middleware.ts`** (`@supabase/ssr`).
- Локальный **`workspace-session`** в `localStorage` по-прежнему ведёт онбординг; при наличии Supabase-сессии он **синхронизируется** (`src/lib/auth/sync-workspace-from-supabase.ts`), чтобы guard и редиректы не ломались.
- **Выход:** `signOutApp()` — `supabase.auth.signOut()` + сброс `localStorage` (футер workspace и профиль).
- В Supabase Dashboard → **Authentication** → **Providers** включите **Email** и создайте пользователя (**Users** → Add user) или включите sign-ups для MVP.

### Структура серверного кода

```
src/lib/server/
  auth/           # сессия (getUser), membership
  supabase/       # browser / server / admin клиенты + database.types.ts
  repositories/   # доступ к таблицам
  services/       # сценарии (чат v1, /me)
  policies/       # проверки ролей (owner / admin / manager / employee)
  audit/          # запись audit_events
src/app/api/      # Route Handlers
src/middleware.ts # обновление cookie-сессии Supabase Auth
supabase/migrations/
```

### Миграции (MVP)

Файл `supabase/migrations/20250406120000_foundation_v1.sql` создаёт таблицы с **UUID**, **FK**, **`created_at` / `updated_at`**, скоупом по **`organization_id`**, индексами, **RLS** и **append-only** для `audit_events` (у `authenticated` отозваны `UPDATE`/`DELETE`).

**Применить:**

1. **Supabase CLI** (рекомендуется): `supabase link`, затем `supabase db push`.
2. **SQL Editor** в дашборде: вставить содержимое файла миграции и выполнить.

После регистрации пользователя в Auth добавьте организацию и строку в `organization_members` (см. `supabase/seed.example.sql`), иначе `/api/me` и чат вернут `403` с кодом `no_org_membership`.

### Эндпоинты (v1)

| Метод | Путь | Описание |
|--------|------|----------|
| `GET` | `/api/health` | Статус и флаги конфигурации env |
| `GET` | `/api/me` | Пользователь из Supabase Auth + профиль + членства |
| `GET` | `/api/chats` | Список тредов пользователя в организации |
| `POST` | `/api/chats` | Создать/идемпотентно «достроить» тред по `id` |
| `GET` | `/api/chats/[id]` | Один тред |
| `GET` | `/api/chats/[id]/messages` | Сообщения |
| `POST` | `/api/chats/[id]/messages` | Сохранить сообщение пользователя + ответ-заглушку ассистента + audit |

Заголовок **`X-Organization-Id`** опционален; без него берётся первая организация из членств.

### Чат (UI → API)

После входа через Supabase список тредов подгружается в **`WorkspaceShell`** (`GET /api/chats` → `sessionStorage` + событие `rg_chat_threads_changed`). Сообщения для треда с **UUID** читаются с **`GET /api/chats/[id]/messages`**; отправка идёт на **`POST /api/chats/[id]/messages`** (для «Нового чата» и `virtual:*` генерируется UUID). Ответы **401** и **403** не переводятся в демо: показывается полоска-предупреждение (нужен повторный вход / нет membership). Демо-ответ при отправке остаётся **только** при сетевой ошибке или **таймауте** (~25 с). Прочие HTTP-ошибки при отправке/загрузке — сообщение в баннере, без демо-fallback. Вложения в API пока не уходят (TODO в `chat-workspace.tsx`).

### Проверка локально

1. `npm install && npm run dev`
2. `GET http://localhost:3000/api/health` — должен вернуть `{ "ok": true, ... }`.
3. Залогиньтесь через Supabase Auth (email/password или magic link), получите cookie сессии в браузере.
4. С тем же браузером (или с заголовком `Cookie` из devtools) вызовите `GET /api/me` и `POST /api/chats/.../messages` с телом `{ "content": "Привет" }` и UUID треда (можно сгенерировать v4 на клиенте).

Клиент Supabase для браузера: `createBrowserSupabaseClient()` из `src/lib/server/supabase/browser.ts` (использовать только в Client Components).
