# Revenygo

**Revenygo** — корпоративное **AI workspace** (рабочее место): чат с LLM в духе ChatGPT/Claude, каталог сценариев, база знаний, политики безопасности, аудит, администрирование организации и пошаговый онбординг. Интерфейс на **русском**; часть экранов опирается на **демо-данные** (`src/lib/mock/*`) и **localStorage**, при этом **чаты, профиль и членство в организации** завязаны на **реальный backend**: **Supabase** (Postgres, Auth, RLS) и **Next.js Route Handlers** (`src/app/api/*`).

---

## Возможности

| Область | Описание |
|--------|-----------|
| **Чат** | Треды, история, композер, шаблоны, быстрые действия, интеграция с `GET/POST /api/chats/*` |
| **Сценарии** | Каталог сценариев (моки + UI) |
| **База знаний** | Карточки источников (моки) |
| **Политики** | Правила и админка (моки) |
| **Аудит** | Журнал событий (моки в UI; сервер пишет `audit_events` при отправке сообщений в чат) |
| **Организация** | Иерархия, админка (моки + связь с org через API) |
| **Профиль и онбординг** | Профиль, персонализация, гайд по ИИ; редиректы по `workspace-session` в localStorage |
| **Тарифы** | Страница `/pricing` в workspace |
| **Вход** | Демо-вход одной кнопкой: `signInWithPassword` под фиксированным пользователем Supabase (без формы email/пароля в UI) |

---

## Стек

| Слой | Технологии |
|------|------------|
| Фреймворк | **Next.js 15** (App Router), **React 19** |
| Язык | **TypeScript** (strict), алиас `@/*` → `src/*` |
| Стили | **Tailwind CSS 3.4**, CSS variables в `src/app/globals.css` |
| UI | **Radix UI**, **lucide-react**, **CVA** для вариантов компонентов |
| Утилиты классов | `clsx` + `tailwind-merge` → **`cn()`** в `src/lib/utils/index.ts` |
| Данные | **Supabase** (`@supabase/supabase-js`, `@supabase/ssr`) |
| Почта (опционально) | **Resend** — сброс пароля через собственный API (см. ниже) |

Шрифты: **Geist** и **Geist Mono** в `src/app/layout.tsx`.

---

## Архитектура

```
Браузер
  ├── React (Client Components): чат, shell, онбординг, login
  ├── localStorage: workspace-session, префсы чата, история UI
  └── Cookies: сессия Supabase Auth (обновляет middleware + SSR client)

Next.js сервер
  ├── Route Handlers /api/* → createServerSupabaseClient() + RLS
  └── Service role только в admin-клиенте (forgot-password, provision-demo)

Supabase
  ├── Auth (JWT в cookie)
  ├── Postgres: profiles, organizations, organization_members, chat_*, audit_events
  └── RLS по organization_id и auth.uid()
```

---

## Структура репозитория

```
src/
  app/
    page.tsx                 # Редирект по сессии → /login или workspace / онбординг
    layout.tsx               # Корень, шрифты, metadata, lang=ru
    (workspace)/             # WorkspaceAccessGuard + WorkspaceShell (сайдбар)
      chat/, knowledge/, scenarios/, admin/, audit/, policies/,
      organization/, profile/, pricing/
    onboarding/              # Вводный мастер, профиль, персонализация, AI-guide
    login/                   # Вход (кнопка «Продолжить» + демо Supabase)
    login/forgot/            # Запрос ссылки сброса пароля (email → Resend)
    auth/
      callback/route.ts      # PKCE: exchangeCodeForSession после письма
      reset-password/        # Новый пароль после перехода по ссылке
    ai-guide/                # Отдельная страница гайда (вне workspace)
    api/                     # REST: health, me, chats, auth/*
  components/
    chat/, layout/, ui/, auth/, onboarding/, …
  lib/
    auth/                    # demo-supabase-sign-in, sync-workspace-from-supabase, sign-out-app
    chat/                    # API-клиент чата, layout колонки, storage
    session/                 # workspace-session (localStorage)
    mock/                    # Демо-данные для UI
    server/                  # Supabase (browser/server/admin), repos, services, auth session
  types/index.ts             # Доменные типы чата и сценариев
supabase/
  migrations/                # SQL: foundation, pinned, demo user, токены + org demo
  seed.example.sql           # Пример ручного membership (устарел частично — см. миграции demo org)
```

**Tailwind:** пути `./src/lib/**/*.{js,ts,jsx,tsx,mdx}` должны быть в `tailwind.config.ts` → `content`, иначе классы из `lib` не попадут в сборку.

---

## Маршруты

| Путь | Назначение |
|------|------------|
| `/` | Загрузка и редирект по `getPostAuthPath` |
| `/login` | Демо-вход (Supabase под `demo@revenygo.local` / пароль из env/миграции) |
| `/login/forgot` | Форма email → `POST /api/auth/forgot-password` (Resend) |
| `/auth/callback` | OAuth/PKCE после ссылки из письма |
| `/auth/reset-password` | Установка нового пароля |
| `/onboarding` | Первый экран мастера (правила AI) |
| `/onboarding/profile` | Должность, отдел, задачи |
| `/onboarding/personalizing` | Экран персонализации |
| `/onboarding/ai-guide` | Гайд по ИИ (в онбординге) |
| `/ai-guide` | Та же тема вне основной воронки |
| `/(workspace)/chat` | Главный чат |
| `/(workspace)/knowledge`, `/scenarios`, `/admin`, `/audit`, `/policies`, `/organization`, `/profile`, `/pricing` | Разделы продукта |

Редирект в `next.config.ts`: `/history` → `/chat`.

Цепочка после «входа»: `authenticated` + нет профиля → `/onboarding/profile` → … → `/onboarding/ai-guide` → `/scenarios` (логика в `src/lib/session/workspace-session.ts` → `getPostAuthPath`).

---

## Аутентификация

### Текущий UX входа

- На **`/login`** одна кнопка **«Продолжить»**: выполняется **`signInWithPassword`** с учётными данными демо-пользователя (по умолчанию **`demo@revenygo.local`** / **`demo`**, задаются миграцией и опционально `NEXT_PUBLIC_DEMO_USER_*`).
- После успешного входа в **localStorage** синхронизируется **`workspace-session`** (`applySupabaseUserToWorkspaceSession`).
- **`hydrateWorkspaceAuthFromBrowser()`** (guard, главная, login, шаги онбординга): подтягивает сессию из cookies; если в workspace уже «вошли», а JWT нет — повторный тихий демо-вход.

### Сброс пароля (опционально)

- **`POST /api/auth/forgot-password`**: Supabase Admin `generateLink` (recovery) + письмо через **Resend** (`RESEND_API_KEY`, `FROM_EMAIL`). Нужны **`NEXT_PUBLIC_APP_URL`** (прод) и redirect URL **`…/auth/callback`** в Supabase Dashboard.

### Авто-создание демо (опционально)

- **`POST /api/auth/provision-demo`**: при **`DEMO_AUTO_PROVISION=true`** создаёт пользователя через Admin API и привязывает к организации **`demo`**. Клиент повторяет вход, если включены **`NEXT_PUBLIC_DEMO_AUTO_PROVISION=true`** и первый `signIn` не удался. **Только для демо-окружений** (нужен `SUPABASE_SERVICE_ROLE_KEY`).

### Выход

- **`signOutApp()`**: `supabase.auth.signOut()` + сброс `workspace-session`.

### Важно про SQL-сид пользователей в `auth.users`

Если пользователь создан «вручную» SQL без полей **`confirmation_token`**, **`recovery_token`**, **`email_change_token_new`**, **`email_change`** (пустые строки, не NULL), Supabase Auth может отвечать **«Database error querying schema»** при входе. В репозитории это исправлено миграцией **`20250411140000_auth_tokens_profile_demo_org.sql`** (UPDATE NULL → `''`) и обновлённым INSERT в **`20250410120000_auth_demo_user.sql`**.

### Middleware

- **`src/middleware.ts`**: `createServerClient` + `getUser()` для обновления cookie-сессии на каждом запросе (при наличии `NEXT_PUBLIC_SUPABASE_URL` и anon/publishable ключа).

---

## Переменные окружения

Скопируйте **`.env.example`** → **`.env.local`**. Для **Vercel** задайте те же переменные в Project Settings и сделайте **Redeploy** после изменения `NEXT_PUBLIC_*` (они вшиваются при сборке).

| Переменная | Где | Назначение |
|------------|-----|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Клиент + сервер | URL проекта Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Клиент + сервер | Legacy **anon** (JWT) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Клиент + сервер | Альтернатива anon — ключ **`sb_publishable_…`** |
| `SUPABASE_SERVICE_ROLE_KEY` | Только сервер | Admin API, forgot-password, provision-demo |
| `NEXT_PUBLIC_APP_URL` | Сборка | Публичный origin (ссылки в письмах сброса), например `https://your-app.vercel.app` |
| `RESEND_API_KEY` | Сервер | Отправка писем сброса пароля |
| `FROM_EMAIL` | Сервер | Адрес отправителя (домен должен быть верифицирован в Resend) |
| `NEXT_PUBLIC_DEMO_USER_EMAIL` | Клиент | Переопределение email демо (по умолчанию `demo@revenygo.local`) |
| `NEXT_PUBLIC_DEMO_USER_PASSWORD` | Клиент | Переопределение пароля демо (по умолчанию `demo`) |
| `DEMO_AUTO_PROVISION` | Сервер | `true` — включить `POST /api/auth/provision-demo` |
| `NEXT_PUBLIC_DEMO_AUTO_PROVISION` | Клиент | `true` — после неудачного входа вызвать provision и повторить вход |

**Redirect URLs** в Supabase → Authentication → URL Configuration: `http://localhost:3000/auth/callback` и продакшен-URL с тем же путём.

---

## Supabase: миграции

Применяйте через **Supabase CLI** (`supabase db push`) или **SQL Editor** (по порядку):

| Файл | Содержание |
|------|------------|
| `20250406120000_foundation_v1.sql` | Таблицы, RLS, триггер `handle_new_user` → `profiles`, enum’ы, grants |
| `20250407120000_chat_threads_pinned.sql` | Колонка **`pinned`** у `chat_threads` |
| `20250410120000_auth_demo_user.sql` | Пользователь Auth **`demo@revenygo.local`** / **`demo`** (токены — пустые строки) |
| `20250411140000_auth_tokens_profile_demo_org.sql` | Починка NULL-токенов у существующих пользователей; **`ON CONFLICT` в `handle_new_user`**; организация **`demo`** и **`organization_members`** (owner) для демо-email; страховочный `profiles` |

Без строки в **`organization_members`** API чата и `/api/me` вернут **403** (`no_org_membership` / запрет по org). Миграция **`20250411140000`** добавляет демо-организацию и членство автоматически.

---

## API (Route Handlers)

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/api/health` | `ok`, флаги наличия env (Supabase и т.д.) |
| `GET` | `/api/me` | Пользователь JWT + профиль + членства |
| `GET` | `/api/chats` | Треды пользователя в организации |
| `POST` | `/api/chats` | Создать/идемпотентно достроить тред |
| `GET` | `/api/chats/[id]` | Один тред |
| `POST` | `/api/chats/[id]/duplicate` | Дубликат треда |
| `GET` | `/api/chats/[id]/messages` | Сообщения |
| `POST` | `/api/chats/[id]/messages` | Сообщение пользователя + заглушка ассистента + audit |
| `POST` | `/api/auth/forgot-password` | Письмо со ссылкой сброса (Resend + Admin `generateLink`) |
| `POST` | `/api/auth/provision-demo` | Авто-создание демо-пользователя и org (только при `DEMO_AUTO_PROVISION=true`) |

Заголовок **`X-Organization-Id`** опционален; без него используется первая организация из членств.

---

## Чат: UI и бэкенд

- После валидной Supabase-сессии **`WorkspaceShell`** подгружает треды: **`GET /api/chats`**, кэш в **`sessionStorage`**, событие **`rg_chat_threads_changed`**.
- Сообщения для треда с **UUID**: **`GET/POST /api/chats/[id]/messages`**. Для «нового» чата клиент генерирует UUID v4.
- Ответы **401** / **403**: баннер (**`ChatBackendBanner`**) — «Сессия недействительна…» / нет доступа к организации; демо-fallback ответа ассистента только при **сетевой ошибке** или **таймауте** (~25 с).
- Вложения в API пока не отправляются (см. TODO в коде чата).

Клиент Supabase в браузере: **`createBrowserSupabaseClient()`** из `src/lib/server/supabase/browser.ts` — только в Client Components.

---

## Запуск

```bash
npm install
npm run dev          # http://localhost:3000
npm run build
npm run start        # после build
npm run lint
```

При «залипании» HMR:

```bash
npm run dev:poll
npm run dev:turbo
npm run dev:clean
```

**Проверка:** `GET http://localhost:3000/api/health` → `ok: true`; войти через `/login` → `GET /api/me` в том же браузере должен вернуть пользователя и memberships.

---

## Соглашения по коду

1. **`"use client"`** — только где нужны хуки и браузерные API.
2. Доменные типы — **`src/types/index.ts`**.
3. Моки — **`src/lib/mock/*`**; не смешивать с прод-логикой без явной границы.
4. Персистенция в браузере — модули `*-storage.ts`; при смене схемы — версионирование.
5. Чат: **`ChatWorkspace`**, **`ChatComposer`**, **`ChatMessageList`** / **`ChatMessageBubble`**.
6. UI-примитивы — **`src/components/ui/*`** в стиле Radix + Tailwind + `cn`.

---

## Якоря для разработчиков и LLM

| Задача | Файл / папка |
|--------|----------------|
| Новая страница в продукте | `src/app/(workspace)/<route>/page.tsx` |
| Shell, сайдбар, история чатов | `workspace-shell.tsx`, `workspace-sidebar.tsx`, `workspace-chat-history.tsx` |
| Guard и редиректы workspace | `workspace-access-guard.tsx`, `workspace-session.ts` |
| Демо-вход Supabase | `src/lib/auth/demo-supabase-sign-in.ts`, `login-form.tsx` |
| Синхронизация Auth → localStorage | `sync-workspace-from-supabase.ts` |
| Ширина колонки чата | `src/lib/chat/chat-column-layout.ts` |
| Запросы чата к API | `src/lib/chat/chat-backend-client.ts` |
| Баннер ошибок API чата | `chat-backend-banner.tsx`, `chat-api-banner-store.ts` |
| Сессия пользователя на сервере | `src/lib/server/auth/session.ts`, `membership.ts` |
| Репозитории БД | `src/lib/server/repositories/*` |
| Типы таблиц (ручные) | `src/lib/server/supabase/database.types.ts` |
| Моки сценариев / знаний | `src/lib/mock/` |

---

## Лицензия и статус

Проект **private** (`package.json`).
